// Global site data — single source of truth for identity.
// Projects / skills / experience live in Content Collections:
//   src/content/projects/*.md, src/content/skills/*.json, src/content/experience/*.json
// with Zod schemas in src/content.config.ts. Query them via getCollection().
export const SITE_TITLE = "Dat Xuan Huynh — Embedded & AI-IoT Engineer";
export const SITE_DESCRIPTION =
	"Terminal portfolio of Dat Xuan Huynh: full-stack engineer (Embedded & AI-IoT) building real-time video pipelines, edge AI, and sensor-to-dashboard IoT systems.";

export const PROFILE = {
	name: "DAT XUAN HUYNH",
	role: "Full-stack Software Engineer (Embedded & AI-IoT Focus)",
	location: "Nha Trang, Khanh Hoa, Vietnam",
	email: "xuandat282@gmail.com",
	phone: "+84 797 051 900",
	summary:
		"Full-Stack Engineer (Embedded & AI-IoT Focus) with 3+ years delivering real-time video pipelines, edge AI models, and sensor-to-dashboard IoT systems in production.",
	highlights: [
		"Custom YOLO training + edge deployment (RPi 4, Jetson), raw annotation to INT8 TFLite",
		"Unsupervised anomaly detection for security cameras (AutoEncoder + optical flow fusion)",
	],
};

export const EDUCATION = {
	school: "Nha Trang University",
	degree: "Bachelor's Degree in Information Technology",
	period: "Aug 2019 – Sep 2023",
	gpa: "3.06 / 4.0",
};
