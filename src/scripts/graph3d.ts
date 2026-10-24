// Hero: interactive 3D force-directed graph (three.js). Lazy-loaded by Graph3D.astro.
// Theme-aware (reads CSS tokens), pauses off-screen, static under reduced motion.
import {
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DodecahedronGeometry,
  EdgesGeometry,
  Euler,
  Fog,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  OctahedronGeometry,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Quaternion,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import type { GraphData, GraphKind } from "../lib/graph-data";

// Each kind gets its own silhouette so the graph reads without labels:
//   hub ◆ faceted core + orbiting wire cage & ring · project ◇ gem (octahedron)
//   cat ⬡ dodecahedron · exp ▣ block (cube) · skill ● dot
const SIZE: Record<GraphKind, number> = {
  hub: 0.62,
  cat: 0.34,
  exp: 0.3,
  project: 0.42,
  skill: 0.11,
};
const GEOMETRY: Record<GraphKind, () => BufferGeometry> = {
  hub: () => new IcosahedronGeometry(1, 1),
  project: () => new OctahedronGeometry(1.1, 0),
  cat: () => new DodecahedronGeometry(1, 0),
  exp: () => new BoxGeometry(1.35, 1.35, 1.35),
  skill: () => new SphereGeometry(1, 16, 12),
};
/** Soft halo behind a node: world-space diameter and resting opacity. */
const HALO_SIZE: Record<GraphKind, number> = {
  hub: 7.5,
  project: 3.4,
  cat: 2.4,
  exp: 2.4,
  skill: 1.3,
};
const HALO_ALPHA: Record<GraphKind, number> = { hub: 0.5, project: 0.36, cat: 0, exp: 0, skill: 0 };
const HALO_VERT = `
  attribute vec4 aColor;
  attribute float size;
  uniform float uScale;
  uniform float uNear;
  uniform float uFar;
  varying vec4 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float depth = smoothstep(uNear, uFar, -mv.z);
    vColor = vec4(aColor.rgb, aColor.a * (1.0 - 0.8 * depth));
    gl_PointSize = size * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const HALO_FRAG = `
  uniform sampler2D map;
  varying vec4 vColor;
  void main() {
    gl_FragColor = vec4(vColor.rgb, vColor.a * texture2D(map, gl_PointCoord).a);
  }
`;
const RADIUS = 10; // world-space radius the layout is normalised to
const PICK_PX = 22; // screen-space hit radius (finger-friendly)

/** mulberry32 — deterministic layout so the graph looks the same every load. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Small 3D force simulation: pairwise repulsion + edge springs + weak gravity. */
function layout(data: GraphData): Vector3[] {
  const n = data.nodes.length;
  const rand = rng(1337);
  const pos = data.nodes.map((node, i) => {
    if (node.kind === "hub") return new Vector3();
    const u = rand() * 2 - 1;
    const a = rand() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = 3 + rand() * 4 + i * 0.01;
    return new Vector3(s * Math.cos(a) * r, u * r, s * Math.sin(a) * r);
  });
  const vel = pos.map(() => new Vector3());
  const rest = (a: GraphKind, b: GraphKind) => (a === "skill" || b === "skill" ? 1.6 : 3.2);
  const d = new Vector3();

  for (let step = 0; step < 420; step++) {
    const cool = 1 - step / 420;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        d.subVectors(pos[i], pos[j]);
        const dist2 = Math.max(d.lengthSq(), 0.05);
        const f = (7 / dist2) * cool;
        d.normalize().multiplyScalar(f);
        vel[i].add(d);
        vel[j].sub(d);
      }
    }
    for (const [a, b] of data.edges) {
      d.subVectors(pos[b], pos[a]);
      const dist = Math.max(d.length(), 0.01);
      const f = (dist - rest(data.nodes[a].kind, data.nodes[b].kind)) * 0.06;
      d.multiplyScalar(f / dist);
      vel[a].add(d);
      vel[b].sub(d);
    }
    for (let i = 0; i < n; i++) {
      vel[i].addScaledVector(pos[i], -0.012);
      vel[i].multiplyScalar(0.82);
      pos[i].add(vel[i]);
    }
    pos[0].set(0, 0, 0); // hub stays pinned
  }

  let max = 0;
  for (const p of pos) max = Math.max(max, p.length());
  const k = RADIUS / (max || 1);
  for (const p of pos) p.multiplyScalar(k);
  return pos;
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  if (g) {
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.35, "rgba(255,255,255,0.55)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
  }
  return new CanvasTexture(c);
}

export function initGraph(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  data: GraphData,
  tip: HTMLElement,
  navigate: (href: string) => void,
): () => void {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0x000000, 0);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = new Scene();
  const camera = new PerspectiveCamera(46, 1, 0.1, 200);
  const world = new Group();
  scene.add(world);
  scene.add(new AmbientLight(0xffffff, 1.5));
  const key = new DirectionalLight(0xffffff, 2.4);
  key.position.set(6, 9, 12);
  scene.add(key);

  const pos = layout(data);
  const n = pos.length;

  // — nodes: one InstancedMesh per kind, each with its own silhouette —
  const local = new Int32Array(n); // node → index inside its kind's mesh
  const counts: Record<GraphKind, number> = { hub: 0, cat: 0, exp: 0, project: 0, skill: 0 };
  data.nodes.forEach((node, i) => {
    local[i] = counts[node.kind]++;
  });
  const meshes: InstancedMesh[] = [];
  const meshOf: InstancedMesh[] = [];
  const nodeMats: MeshLambertMaterial[] = [];
  for (const k of Object.keys(GEOMETRY) as GraphKind[]) {
    if (!counts[k]) continue;
    const mat = new MeshLambertMaterial({ color: 0xffffff, flatShading: k !== "skill" });
    const mesh = new InstancedMesh(GEOMETRY[k](), mat, counts[k]);
    mesh.instanceMatrix.setUsage(35048 /* DynamicDrawUsage */);
    world.add(mesh);
    meshes.push(mesh);
    nodeMats.push(mat);
    data.nodes.forEach((node, i) => {
      if (node.kind === k) meshOf[i] = mesh;
    });
  }
  // per-node tumble: fixed tilt + spin about y (dots stay still — they're spheres)
  const nr = rng(2024);
  const ang = Float32Array.from({ length: n }, () => nr() * Math.PI * 2);
  const tiltA = Float32Array.from({ length: n }, () => (nr() - 0.5) * 1.2);
  const tiltB = Float32Array.from({ length: n }, () => (nr() - 0.5) * 1.2);
  const spinSpeed = Float32Array.from({ length: n }, (_, i) =>
    data.nodes[i].kind === "skill" ? 0 : (0.22 + nr() * 0.4) * (nr() < 0.5 ? -1 : 1),
  );
  const euler = new Euler();

  // — edges —
  const edgeGeo = new BufferGeometry();
  const ePos = new Float32Array(data.edges.length * 6);
  data.edges.forEach(([a, b], i) => {
    pos[a].toArray(ePos, i * 6);
    pos[b].toArray(ePos, i * 6 + 3);
  });
  const eCol = new Float32Array(data.edges.length * 6);
  edgeGeo.setAttribute("position", new BufferAttribute(ePos, 3));
  edgeGeo.setAttribute("color", new BufferAttribute(eCol, 3));
  const edgeMat = new LineBasicMaterial({ vertexColors: true });
  world.add(new LineSegments(edgeGeo, edgeMat));

  // — pulses travelling along edges —
  const pulseCount = Math.min(46, data.edges.length);
  const pr = rng(99);
  const pulses = Array.from({ length: pulseCount }, () => ({
    edge: Math.floor(pr() * data.edges.length),
    t: pr(),
    speed: 0.12 + pr() * 0.22,
    dir: pr() < 0.5 ? 1 : -1,
  }));
  const pPos = new Float32Array(pulseCount * 3);
  const pGeo = new BufferGeometry();
  pGeo.setAttribute("position", new BufferAttribute(pPos, 3));
  const sprite = glowTexture();
  const pMat = new PointsMaterial({ size: 0.9, map: sprite, transparent: true, depthWrite: false });
  const points = new Points(pGeo, pMat);
  points.visible = !reduce;
  world.add(points);

  // — halos: one shader Points layer, per-node size/alpha so hover can light them —
  const haloPos = new Float32Array(n * 3);
  pos.forEach((p, i) => p.toArray(haloPos, i * 3));
  const haloCol = new Float32Array(n * 4);
  const haloSize = new Float32Array(n);
  const haloGeo = new BufferGeometry();
  haloGeo.setAttribute("position", new BufferAttribute(haloPos, 3));
  haloGeo.setAttribute("aColor", new BufferAttribute(haloCol, 4));
  haloGeo.setAttribute("size", new BufferAttribute(haloSize, 1));
  const haloMat = new ShaderMaterial({
    uniforms: {
      map: { value: sprite },
      uScale: { value: 400 },
      uNear: { value: 10 },
      uFar: { value: 40 },
    },
    vertexShader: HALO_VERT,
    fragmentShader: HALO_FRAG,
    transparent: true,
    depthWrite: false,
  });
  const halo = new Points(haloGeo, haloMat);
  halo.frustumCulled = false;
  world.add(halo);

  // — hub: wire cage + ring orbiting the core —
  const hubAt = Math.max(
    0,
    data.nodes.findIndex((nd) => nd.kind === "hub"),
  );
  const cageMat = new LineBasicMaterial({ transparent: true, opacity: 0.75 });
  const cage = new LineSegments(new EdgesGeometry(new IcosahedronGeometry(1, 1)), cageMat);
  cage.position.copy(pos[hubAt]);
  const ringMat = new MeshBasicMaterial({ transparent: true, opacity: 0.55 });
  const ring = new Mesh(new TorusGeometry(1, 0.016, 6, 80), ringMat);
  ring.position.copy(pos[hubAt]);
  ring.rotation.x = 1.15;
  world.add(cage, ring);

  // — theme colours from CSS tokens —
  const tone = {
    fill: new Color(),
    ink: new Color(),
    neutral: new Color(),
    paper: new Color(),
    base: new Color(),
  };
  const kindColor = (k: GraphKind) =>
    k === "hub" || k === "project" ? tone.fill : k === "skill" ? tone.neutral : tone.ink;

  function readTheme() {
    const css = getComputedStyle(document.documentElement);
    const get = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    tone.fill.set(get("--color-fill", "#d97757"));
    tone.ink.set(get("--color-ink", "#1f1e1d"));
    tone.neutral.set(get("--color-neutral", "#888888"));
    tone.paper.set(get("--color-paper", "#f5f4ee"));
    tone.base.copy(tone.paper).lerp(tone.neutral, 0.42);
    pMat.color.copy(tone.fill);
    cageMat.color.copy(tone.fill);
    ringMat.color.copy(tone.ink);
    scene.fog = new Fog(tone.paper.clone(), 17, 40);
    paint();
  }

  // — hover state —
  const adj: Set<number>[] = data.nodes.map(() => new Set());
  for (const [a, b] of data.edges) {
    adj[a].add(b);
    adj[b].add(a);
  }
  let hover = -1;
  const scale = new Float32Array(n).fill(1);
  const scaleTarget = new Float32Array(n).fill(1);
  const tmp = new Color();

  function paint() {
    for (let i = 0; i < n; i++) {
      const lit = hover < 0 || i === hover || adj[hover].has(i);
      tmp.copy(kindColor(data.nodes[i].kind));
      if (!lit) tmp.lerp(tone.paper, 0.72);
      meshOf[i].setColorAt(local[i], tmp);
      const kind = data.nodes[i].kind;
      let alpha = HALO_ALPHA[kind];
      if (i === hover) alpha = Math.max(alpha, 0.75);
      else if (!lit) alpha *= 0.25;
      tone.fill.toArray(haloCol, i * 4);
      haloCol[i * 4 + 3] = alpha;
    }
    for (const mesh of meshes) if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    (haloGeo.getAttribute("aColor") as BufferAttribute).needsUpdate = true;
    data.edges.forEach(([a, b], i) => {
      const on = hover >= 0 && (a === hover || b === hover);
      const c = on ? tone.fill : hover >= 0 ? tmp.copy(tone.base).lerp(tone.paper, 0.6) : tone.base;
      c.toArray(eCol, i * 6);
      c.toArray(eCol, i * 6 + 3);
    });
    (edgeGeo.getAttribute("color") as BufferAttribute).needsUpdate = true;
    for (let i = 0; i < n; i++) {
      scaleTarget[i] = i === hover ? 1.7 : 1;
    }
    wake();
  }

  const m = new Matrix4();
  const q = new Quaternion();
  const s = new Vector3();
  function writeMatrices() {
    for (let i = 0; i < n; i++) {
      const r = SIZE[data.nodes[i].kind] * scale[i];
      q.setFromEuler(euler.set(tiltA[i], ang[i], tiltB[i]));
      m.compose(pos[i], q, s.set(r, r, r));
      meshOf[i].setMatrixAt(local[i], m);
      haloSize[i] = HALO_SIZE[data.nodes[i].kind] * scale[i];
    }
    for (const mesh of meshes) mesh.instanceMatrix.needsUpdate = true;
    (haloGeo.getAttribute("size") as BufferAttribute).needsUpdate = true;
    const hubScale = SIZE.hub * scale[hubAt];
    cage.scale.setScalar(hubScale * 2.0);
    ring.scale.setScalar(hubScale * 3.0);
  }

  // — sizing —
  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // fit the graph sphere in the narrower axis, with margin
    const vFov = (camera.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    // portrait screens: let the outer nodes bleed past the edges instead of shrinking everything
    const fit = camera.aspect < 1 ? 0.8 : 1.06;
    const dist = (RADIUS * fit) / Math.sin(Math.min(vFov, hFov) / 2);
    camera.position.set(0, 0, dist);
    camera.near = Math.max(dist - RADIUS * 2, 0.1);
    camera.far = dist + RADIUS * 2.5;
    camera.updateProjectionMatrix();
    haloMat.uniforms.uScale.value = canvas.height / 2;
    haloMat.uniforms.uNear.value = dist - RADIUS * 0.6;
    haloMat.uniforms.uFar.value = dist + RADIUS * 1.3;
    if (scene.fog instanceof Fog) {
      scene.fog.near = dist - RADIUS * 0.4;
      scene.fog.far = dist + RADIUS * 1.5;
    }
    wake();
  }

  // — pointer: drag-rotate, hover-pick, tap-navigate —
  let px = 0;
  let py = 0;
  let inside = false;
  let dragging = false;
  let moved = 0;
  let downAt = 0;
  let spin = 0; // extra y-rotation velocity from dragging
  let tiltX = 0;
  let tiltTarget = 0;
  const proj = new Vector3();

  function pick(): number {
    const rect = canvas.getBoundingClientRect();
    let best = -1;
    let bestD = PICK_PX;
    for (let i = 0; i < n; i++) {
      proj.copy(pos[i]).applyMatrix4(world.matrixWorld).project(camera);
      if (proj.z > 1) continue;
      const sx = ((proj.x + 1) / 2) * rect.width;
      const sy = ((1 - proj.y) / 2) * rect.height;
      const dd = Math.hypot(sx - px, sy - py) - SIZE[data.nodes[i].kind] * 4; // bigger nodes are easier
      if (dd < bestD) {
        bestD = dd;
        best = i;
      }
    }
    return best;
  }

  // — hover card: text via textContent only (content is ours, but never trust innerHTML) —
  const KIND_LABEL: Record<GraphKind, string> = {
    hub: "profile",
    cat: "skill group",
    skill: "skill",
    exp: "role",
    project: "project",
  };
  let touchMode = false;
  function fillTip(i: number) {
    const node = data.nodes[i];
    tip.replaceChildren();
    const row = (cls: string, text?: string) => {
      if (!text) return;
      const p = document.createElement("p");
      p.className = `graph-tip__${cls}`;
      p.textContent = text;
      tip.appendChild(p);
    };
    row("kind", KIND_LABEL[node.kind]);
    row("title", node.title);
    row("sub", node.sub);
    row("meta", node.meta);
    row("cta", touchMode ? "tap again to open ↓" : "click to open ↓");
  }
  function placeTip() {
    if (hover < 0) return;
    const rect = canvas.getBoundingClientRect();
    proj.copy(pos[hover]).applyMatrix4(world.matrixWorld).project(camera);
    const sx = ((proj.x + 1) / 2) * rect.width;
    const sy = ((1 - proj.y) / 2) * rect.height;
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const gap = 18 + SIZE[data.nodes[hover].kind] * 8;
    let x = sx + gap;
    if (x + w > rect.width - 8) x = sx - gap - w;
    x = Math.max(8, Math.min(x, rect.width - w - 8));
    const y = Math.max(64, Math.min(sy - h / 2, rect.height - h - 72)); // clear of nav + scroll button
    tip.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  }

  function setHover(i: number) {
    if (i === hover) return;
    hover = i;
    canvas.style.cursor = i >= 0 ? "pointer" : dragging ? "grabbing" : "grab";
    if (i >= 0) {
      fillTip(i);
      placeTip();
    }
    tip.classList.toggle("show", i >= 0);
    paint();
  }

  const onMove = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const nx = e.clientX - rect.left;
    const ny = e.clientY - rect.top;
    if (dragging) {
      const dx = nx - px;
      moved += Math.abs(dx) + Math.abs(ny - py);
      spin += dx * 0.0016;
    }
    px = nx;
    py = ny;
    inside = e.pointerType !== "touch";
    tiltTarget = ((ny / rect.height) * 2 - 1) * 0.35;
    if (!dragging && e.pointerType !== "touch") setHover(pick());
    wake();
  };
  const onDown = (e: PointerEvent) => {
    dragging = true;
    moved = 0;
    downAt = performance.now();
    const rect = canvas.getBoundingClientRect();
    px = e.clientX - rect.left;
    py = e.clientY - rect.top;
    touchMode = e.pointerType === "touch";
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
  };
  const onUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    if (moved < 8 && performance.now() - downAt < 450) {
      const hit = pick();
      if (touchMode) {
        // touch has no hover: first tap reveals the card, a second tap on the same node opens it
        if (hit >= 0 && hit === hover) navigate(data.nodes[hit].href);
        else setHover(hit);
      } else if (hit >= 0) {
        setHover(hit);
        navigate(data.nodes[hit].href);
      }
    }
    canvas.style.cursor = hover >= 0 ? "pointer" : "grab";
  };
  const onLeave = () => {
    inside = false;
    tiltTarget = 0;
    if (!dragging && !touchMode) setHover(-1);
  };
  canvas.style.cursor = "grab";
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", onLeave);

  // — render loop (demand-driven when static, continuous when animated) —
  let raf = 0;
  let last = performance.now();
  let visible = true;
  let idleFrames = 0;
  let clock = 0;
  const a = new Vector3();
  const b = new Vector3();

  function frame(now: number) {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    clock += dt;

    let busy = false;
    if (!reduce) {
      world.rotation.y += dt * (hover >= 0 || dragging ? 0.03 : 0.11) + spin;
      spin *= 0.9;
      if (Math.abs(spin) < 0.00005) spin = 0;
      busy = true;
    } else if (spin) {
      world.rotation.y += spin;
      spin *= 0.85;
      if (Math.abs(spin) < 0.0003) spin = 0;
      busy = true;
    }
    tiltX += (tiltTarget - tiltX) * Math.min(dt * 4, 1);
    if (Math.abs(tiltTarget - tiltX) > 0.001) busy = true;
    world.rotation.x = tiltX + Math.sin(clock * 0.2) * (reduce ? 0 : 0.05);
    world.updateMatrixWorld();

    if (inside && !dragging && !reduce) setHover(pick());
    placeTip();

    if (!reduce) {
      for (let i = 0; i < n; i++) ang[i] += dt * spinSpeed[i] * (i === hover ? 4 : 1);
      cage.rotation.y += dt * 0.35;
      cage.rotation.x += dt * 0.22;
      ring.rotation.z += dt * 0.45;
    }

    let scaling = false;
    for (let i = 0; i < n; i++) {
      const dlt = scaleTarget[i] - scale[i];
      if (Math.abs(dlt) > 0.002) {
        scale[i] += dlt * Math.min(dt * 12, 1);
        scaling = true;
      } else scale[i] = scaleTarget[i];
    }
    writeMatrices();
    if (scaling) busy = true;

    if (!reduce) {
      const pa = pGeo.getAttribute("position") as BufferAttribute;
      pulses.forEach((p, i) => {
        p.t += dt * p.speed;
        if (p.t > 1) {
          p.t = 0;
          p.edge = Math.floor(Math.random() * data.edges.length);
          p.dir = Math.random() < 0.5 ? 1 : -1;
        }
        const [ea, eb] = data.edges[p.edge];
        const from = p.dir > 0 ? ea : eb;
        const to = p.dir > 0 ? eb : ea;
        a.copy(pos[from]);
        b.copy(pos[to]);
        a.lerp(b, p.t);
        a.toArray(pPos, i * 3);
      });
      pa.needsUpdate = true;
    }

    renderer.render(scene, camera);

    if (busy) idleFrames = 0;
    else idleFrames++;
    if (visible && (!reduce || idleFrames < 2)) raf = requestAnimationFrame(frame);
  }

  function wake() {
    idleFrames = 0;
    if (!raf && visible) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake();
    else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  io.observe(host);

  const ro = new ResizeObserver(resize);
  ro.observe(host);

  const themeObserver = new MutationObserver(readTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", readTheme);

  readTheme();
  resize();
  wake();

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    themeObserver.disconnect();
    scheme.removeEventListener("change", readTheme);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointerup", onUp);
    canvas.removeEventListener("pointercancel", onUp);
    canvas.removeEventListener("pointerleave", onLeave);
    for (const mesh of meshes) mesh.geometry.dispose();
    for (const mat of nodeMats) mat.dispose();
    cage.geometry.dispose();
    cageMat.dispose();
    ring.geometry.dispose();
    ringMat.dispose();
    haloGeo.dispose();
    haloMat.dispose();
    edgeGeo.dispose();
    edgeMat.dispose();
    pGeo.dispose();
    pMat.dispose();
    sprite.dispose();
    renderer.dispose();
  };
}
