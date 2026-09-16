import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_TITLE, SITE_DESCRIPTION } from "../consts.ts";

export async function GET(context) {
	const projects = (await getCollection("projects")).sort((a, b) => a.data.order - b.data.order);
	return rss({
		title: `${SITE_TITLE} — projects`,
		description: SITE_DESCRIPTION,
		site: context.site,
		trailingSlash: false,
		items: projects.map((p) => ({
			title: `${p.data.title} · ${p.data.company}`,
			description: `${p.data.blurb}${p.data.metrics ? ` — ${p.data.metrics}` : ""} [${p.data.stack.join(", ")}]`,
			link: `/#${p.id}`,
			pubDate: p.data.pubDate,
		})),
		customData: `<language>en</language>`,
	});
}
