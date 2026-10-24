import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  runCommand,
  completeInput,
  esc,
  commandNames,
  THEMES,
} from "../public/scripts/terminal-cmd.mjs";

const ctx = {
  profileName: "DAT XUAN HUYNH",
  profileRole: "Full-stack Software Engineer",
  profileEmail: "xuandat282@gmail.com",
  profilePhone: "+84 797 051 900",
  projects: [
    {
      id: "smart-farm",
      title: "Smart Farming IoT",
      company: "MD · Vietnam",
      metrics: "-60% alerts",
    },
    { id: "wolffish", title: "Wolffish", company: "Velox Tech", metrics: "" },
  ],
  skillCats: ["Embedded & IoT", "Backend"],
  expCount: 4,
  currentTheme: "light",
};

describe("esc", () => {
  it("escapes html metacharacters", () => {
    assert.equal(esc("<b>&"), "&lt;b&gt;&amp;");
  });
});

describe("runCommand", () => {
  it("ignores blank input", () => {
    assert.equal(runCommand("   ", ctx).action, "ignore");
  });

  it("clear", () => {
    assert.equal(runCommand("clear", ctx).action, "clear");
  });

  it("is case-insensitive and trims", () => {
    const r = runCommand("  WHOAMI ", ctx);
    assert.equal(r.action, "print");
    assert.match(r.html, /DAT XUAN HUYNH/);
  });

  it("help mentions counts", () => {
    const r = runCommand("help", ctx);
    assert.match(r.html, /2 shipped systems/);
    assert.match(r.html, /2 groups/);
    assert.match(r.html, /4 roles/);
  });

  it("projects lists id + title", () => {
    const r = runCommand("projects", ctx);
    assert.match(r.html, /smart-farm/);
    assert.match(r.html, /Wolffish/);
  });

  it("projects <id> resolves with metrics", () => {
    const r = runCommand("projects smart-farm", ctx);
    assert.equal(r.action, "print");
    assert.equal(r.cls, "");
    assert.match(r.html, /-60% alerts/);
  });

  it("projects <unknown-id> errors", () => {
    const r = runCommand("projects nope", ctx);
    assert.equal(r.cls, "term-err");
    assert.match(r.html, /unknown project id/);
  });

  it("theme with no args shows current + options", () => {
    const r = runCommand("theme", ctx);
    assert.match(r.html, /light/);
    for (const t of THEMES) assert.match(r.html, new RegExp(t));
  });

  it("theme <valid> requests apply", () => {
    const r = runCommand("theme dark", ctx);
    assert.equal(r.action, "apply-theme");
    assert.equal(r.theme, "dark");
  });

  it("theme <bogus> errors", () => {
    const r = runCommand("theme ultraviolet", ctx);
    assert.equal(r.cls, "term-err");
  });

  it("unknown command errors with hint", () => {
    const r = runCommand("rm -rf", ctx);
    assert.equal(r.cls, "term-err");
    assert.match(r.html, /command not found: rm/);
  });

  it("sudo stays denied", () => {
    assert.match(runCommand("sudo", ctx).html, /permission denied/);
  });

  it("escapes user-controlled output", () => {
    const evil = { ...ctx, profileName: "<img>" };
    assert.match(runCommand("whoami", evil).html, /&lt;img&gt;/);
  });
});

describe("completeInput", () => {
  it("completes a unique command prefix", () => {
    assert.deepEqual(completeInput("pro", ctx), { kind: "completed", value: "projects " });
  });

  it("suggests on ambiguous prefix", () => {
    const r = completeInput("s", ctx);
    assert.equal(r.kind, "suggest");
    assert.ok(r.items.includes("skills") && r.items.includes("sudo"));
  });

  it("completes project ids after `projects `", () => {
    assert.deepEqual(completeInput("projects smart", ctx), {
      kind: "completed",
      value: "projects smart-farm",
    });
  });

  it("completes theme names after `theme `", () => {
    assert.deepEqual(completeInput("theme d", ctx), { kind: "completed", value: "theme dark" });
  });

  it("returns none for blank or no match", () => {
    assert.equal(completeInput("", ctx).kind, "none");
    assert.equal(completeInput("zzz", ctx).kind, "none");
  });

  it("commandNames covers the hint bar", () => {
    for (const c of ["help", "whoami", "projects", "skills", "contact", "clear"]) {
      assert.ok(commandNames().includes(c), c);
    }
  });
});
