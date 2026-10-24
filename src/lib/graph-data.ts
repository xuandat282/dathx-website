// Builds the hero graph from the real content collections — nothing is invented:
//   hub ─ skill category ─ skill item
//   hub ─ experience ─ project (same company) ─ skill item (project stack matches a skill)
// Pure + framework-free so `node --test` can cover it.

export type GraphKind = "hub" | "cat" | "skill" | "exp" | "project";

export interface GraphNode {
  id: string;
  kind: GraphKind;
  /** In-page anchor a click navigates to. */
  href: string;
  /** Hover card copy — all derived from the content collections. */
  title: string;
  sub?: string;
  meta?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: [number, number][];
}

interface Input {
  profile: { name: string; role: string };
  projects: {
    id: string;
    title: string;
    company: string;
    period: string;
    metrics?: string;
    stack: string[];
  }[];
  skills: { category: string; items: string[] }[];
  experience: { company: string; role: string; period: string }[];
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export function buildGraph({ profile, projects, skills, experience }: Input): GraphData {
  const nodes: GraphNode[] = [];
  const edges: [number, number][] = [];
  const add = (
    id: string,
    kind: GraphKind,
    href: string,
    card: Pick<GraphNode, "title" | "sub" | "meta">,
  ) => nodes.push({ id, kind, href, ...card }) - 1;

  const hub = add("hub", "hub", "#shell", { title: profile.name, sub: profile.role });

  const skillIndex = new Map<string, number>();
  skills.forEach((cat, ci) => {
    const c = add(`cat:${ci}`, "cat", "#skills", {
      title: cat.category,
      sub: `${cat.items.length} skills`,
      meta: cat.items.join(" · "),
    });
    edges.push([hub, c]);
    cat.items.forEach((item) => {
      const key = norm(item);
      if (skillIndex.has(key)) return; // same skill listed twice → one node
      const s = add(`skill:${key}`, "skill", "#skills", { title: item, sub: cat.category });
      skillIndex.set(key, s);
      edges.push([c, s]);
    });
  });

  const expIndex = experience.map((e, i) => {
    const x = add(`exp:${i}`, "exp", "#experience", {
      title: e.role,
      sub: `${e.company} · ${e.period}`,
    });
    edges.push([hub, x]);
    return { company: norm(e.company), x };
  });

  const usedIn = new Map<number, string[]>();
  projects.forEach((p) => {
    const pn = add(`project:${p.id}`, "project", `#${p.id}`, {
      title: p.title,
      sub: `${p.company} · ${p.period}`,
      meta: p.metrics,
    });
    const company = norm(p.company);
    const owner = expIndex.find(
      (e) => e.company.startsWith(company) || company.startsWith(e.company),
    );
    edges.push([owner ? owner.x : hub, pn]);
    const linked = new Set<number>();
    for (const item of p.stack) {
      const s = skillIndex.get(norm(item));
      if (s !== undefined && !linked.has(s)) {
        linked.add(s);
        edges.push([pn, s]);
        usedIn.set(s, [...(usedIn.get(s) ?? []), p.title]);
      }
    }
  });

  for (const [s, titles] of usedIn) nodes[s].meta = `Used in ${titles.join(", ")}`;

  return { nodes, edges };
}
