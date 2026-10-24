// Pure, testable core of the interactive terminal (no DOM).
// Terminal.astro imports these; tests/terminal-cmd.test.mjs covers them.
// Run: npm test  →  node --test tests/

export const THEMES = ["light", "dark"];

export function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * ctx: {
 *   profileName, profileRole, profileEmail, profilePhone: string,
 *   projects: { id, title, company, metrics: string }[],
 *   skillCats: string[], expCount: number, currentTheme?: string,
 * }
 * Returns { action: "ignore" } | { action: "clear" }
 *   | { action: "print", html, cls } | { action: "apply-theme", theme, html, cls }
 */
export function runCommand(raw, ctx) {
  const cmd = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!cmd) return { action: "ignore" };
  if (cmd === "clear") return { action: "clear" };

  const [base, ...args] = cmd.split(/\s+/);

  if (base === "projects" && args.length > 0) {
    const found = ctx.projects.find((p) => p.id === args.join("-"));
    if (!found) {
      return { action: "print", html: "unknown project id. try `projects`.", cls: "term-err" };
    }
    return {
      action: "print",
      html:
        esc(found.title) +
        '<br><span class="dim">' +
        esc(found.company) +
        (found.metrics ? " · " + esc(found.metrics) : "") +
        "</span>",
      cls: "",
    };
  }

  if (base === "theme") {
    if (args.length === 0) {
      return {
        action: "print",
        html: `theme: <span class="dim">${esc(ctx.currentTheme ?? "light")} · options: ${THEMES.join(" / ")}</span>`,
        cls: "",
      };
    }
    const t = args[0];
    if (!THEMES.includes(t)) {
      return {
        action: "print",
        html: `unknown theme: ${esc(t)}. options: ${THEMES.join(" / ")}.`,
        cls: "term-err",
      };
    }
    return {
      action: "apply-theme",
      theme: t,
      html: `[ok] theme → <span class="dim">${esc(t)}</span>`,
      cls: "",
    };
  }

  const builders = {
    help: (c) =>
      `whoami — identity · projects — ${c.projects.length} shipped systems · skills — ${c.skillCats.length} groups · experience — ` +
      `${c.expCount} roles · theme — light / dark · contact — email + phone · clear — wipe scrollback`,
    whoami: (c) => esc(c.profileName) + '<br><span class="dim">' + esc(c.profileRole) + "</span>",
    projects: (c) => c.projects.map((p) => esc(p.id) + " · " + esc(p.title)).join("<br>"),
    skills: (c) => c.skillCats.map((s) => esc(s)).join("<br>"),
    experience: (c) => c.expCount + " roles · 2022 → present · see #experience below",
    contact: (c) => esc(c.profileEmail) + " · " + esc(c.profilePhone),
    hire: (c) =>
      'good call. email <span class="dim">' + esc(c.profileEmail) + "</span> — replies within 48h.",
    sudo: () => "permission denied: you are a guest, not root.",
  };

  if (builders[base]) {
    return { action: "print", html: builders[base](ctx), cls: "" };
  }
  return {
    action: "print",
    html: `command not found: ${esc(base)}. try \`help\`.`,
    cls: "term-err",
  };
}

export function commandNames() {
  return [
    "help",
    "whoami",
    "projects",
    "skills",
    "experience",
    "contact",
    "hire",
    "sudo",
    "theme",
    "clear",
  ];
}

/**
 * Tab-completion. Returns:
 *  { kind: "completed", value } — exactly one match, fill the input
 *  { kind: "suggest", items }   — several matches, print them
 *  { kind: "none" }             — nothing to do
 */
export function completeInput(raw, ctx) {
  const val = String(raw ?? "");
  const parts = val.split(/\s+/);

  // `projects <partial-id>` → complete against project ids
  if (parts.length > 1 && parts[0].toLowerCase() === "projects") {
    const frag = parts.slice(1).join("-").toLowerCase();
    const matches = ctx.projects.map((p) => p.id).filter((id) => id.startsWith(frag));
    if (matches.length === 1) return { kind: "completed", value: "projects " + matches[0] };
    if (matches.length > 1) return { kind: "suggest", items: matches };
    return { kind: "none" };
  }

  // `theme <partial>` → complete against theme names
  if (parts.length > 1 && parts[0].toLowerCase() === "theme") {
    const frag = parts.slice(1).join(" ").toLowerCase();
    const matches = THEMES.filter((t) => t.startsWith(frag));
    if (matches.length === 1) return { kind: "completed", value: "theme " + matches[0] };
    if (matches.length > 1) return { kind: "suggest", items: matches };
    return { kind: "none" };
  }

  const frag = val.trim().toLowerCase();
  if (!frag) return { kind: "none" };
  const matches = commandNames().filter((c) => c.startsWith(frag));
  if (matches.length === 1) return { kind: "completed", value: matches[0] + " " };
  if (matches.length > 1) return { kind: "suggest", items: matches };
  return { kind: "none" };
}
