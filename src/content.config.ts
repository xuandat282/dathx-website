import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Projects: rich content entries (frontmatter + optional Markdown body for
// future case-study pages). `stack` is a typed array — no more comma-split.
const projects = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
	schema: z.object({
		title: z.string(),
		company: z.string(),
		period: z.string(),
		blurb: z.string(),
		stack: z.array(z.string()),
		metrics: z.string().optional(),
		pubDate: z.coerce.date(),
		order: z.number(),
	}),
});

// Skills / experience: pure data entries (JSON, no body needed).
const skills = defineCollection({
	loader: glob({ pattern: "**/*.json", base: "./src/content/skills" }),
	schema: z.object({
		category: z.string(),
		items: z.array(z.string()),
		order: z.number(),
	}),
});

const experience = defineCollection({
	loader: glob({ pattern: "**/*.json", base: "./src/content/experience" }),
	schema: z.object({
		company: z.string(),
		role: z.string(),
		period: z.string(),
		items: z.array(z.string()),
		order: z.number(),
	}),
});

export const collections = { projects, skills, experience };
