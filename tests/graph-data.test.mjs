import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildGraph } from "../src/lib/graph-data.ts";

const input = {
  profile: { name: "DAT", role: "Engineer" },
  projects: [
    {
      id: "wolffish",
      title: "Wolffish",
      company: "Velox Tech",
      period: "2023",
      metrics: "<800ms",
      stack: ["Go (Gin)", "React", "Pion WebRTC"],
    },
    {
      id: "farm",
      title: "Smart Farm",
      company: "MD · Vietnam",
      period: "2025",
      stack: ["MQTT pub/sub", "go (gin)"],
    },
    { id: "orphan", title: "Orphan", company: "Nobody Inc", period: "2020", stack: [] },
  ],
  skills: [
    { category: "Backend", items: ["Go (Gin)", "MQTT pub/sub"] },
    { category: "Frontend", items: ["React", "go (gin)"] },
  ],
  experience: [
    { company: "Velox Tech · Nha Trang", role: "Engineer", period: "2023 – 2025" },
    { company: "MD · Vietnam", role: "Lead", period: "2025 – now" },
  ],
};

const g = buildGraph(input);
const idx = (id) => g.nodes.findIndex((n) => n.id === id);
const linked = (a, b) => g.edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

describe("buildGraph", () => {
  it("has exactly one hub and one node per category/experience/project", () => {
    const count = (k) => g.nodes.filter((n) => n.kind === k).length;
    assert.equal(count("hub"), 1);
    assert.equal(count("cat"), 2);
    assert.equal(count("exp"), 2);
    assert.equal(count("project"), 3);
  });

  it("dedupes skills listed twice (case-insensitive)", () => {
    assert.equal(g.nodes.filter((n) => n.kind === "skill").length, 3);
  });

  it("links a project to the experience entry whose company prefix matches", () => {
    assert.ok(linked(idx("project:wolffish"), idx("exp:0")));
    assert.ok(linked(idx("project:farm"), idx("exp:1")));
  });

  it("falls back to the hub when no experience matches", () => {
    assert.ok(linked(idx("project:orphan"), idx("hub")));
  });

  it("links projects only to skills their stack actually names", () => {
    assert.ok(linked(idx("project:wolffish"), idx("skill:go (gin)")));
    assert.ok(linked(idx("project:wolffish"), idx("skill:react")));
    assert.ok(!linked(idx("project:wolffish"), idx("skill:mqtt pub/sub")));
  });

  it("never emits duplicate edges between a project and one skill", () => {
    const pairs = g.edges.map(([a, b]) => `${a}-${b}`);
    assert.equal(new Set(pairs).size, pairs.length);
  });

  it("points each node at an existing in-page anchor", () => {
    assert.equal(g.nodes[idx("project:wolffish")].href, "#wolffish");
    assert.equal(g.nodes[idx("exp:0")].href, "#experience");
    assert.equal(g.nodes[idx("cat:0")].href, "#skills");
  });

  it("fills hover-card copy from the content", () => {
    const wolf = g.nodes[idx("project:wolffish")];
    assert.equal(wolf.title, "Wolffish");
    assert.equal(wolf.sub, "Velox Tech · 2023");
    assert.equal(wolf.meta, "<800ms");
    assert.equal(g.nodes[idx("exp:1")].sub, "MD · Vietnam · 2025 – now");
    assert.equal(g.nodes[idx("hub")].sub, "Engineer");
  });

  it("tells a skill which projects use it", () => {
    assert.equal(g.nodes[idx("skill:go (gin)")].meta, "Used in Wolffish, Smart Farm");
    assert.equal(g.nodes[idx("skill:react")].meta, "Used in Wolffish");
    assert.equal(g.nodes[idx("skill:mqtt pub/sub")].meta, "Used in Smart Farm");
  });
});
