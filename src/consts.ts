// Global portfolio data — parsed from DAT_HUYNH_CV_FullStackEmbeddedAI.docx (April 2026)
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

export const SKILLS: { category: string; items: string }[] = [
	{ category: "Embedded & IoT", items: "Raspberry Pi 4/CM4, MQTT (Mosquitto/VerneMQ), SIA DC-09, ONVIF T, Wiegand, GPIO/I2C/UART, 4G/LTE failover, edge buffering, ESP32" },
	{ category: "Camera & Video", items: "RTSP ingest & re-streaming, WebRTC (H.264/H.265), FFmpeg pipeline, ONVIF event API, PTZ control, motion detection, pre/post-event recording" },
	{ category: "Computer Vision & AI", items: "YOLOv8/v5/v10 custom training & fine-tuning, TFLite INT8 quantization, ONNX Runtime, OpenCV (MOG2, optical flow, contour), AutoEncoder anomaly detection, SORT/DeepSORT tracking" },
	{ category: "DevOps & Infra", items: "Docker, MicroK8s/Kubernetes, GitLab CI/CD, PM2, Linux (Ubuntu/Debian), Proxmox, Nginx, self-hosted GitLab" },
	{ category: "Backend", items: "Go (Gin), NestJS, Node.js/Express, REST, WebSocket, MQTT pub/sub, gRPC basics, Prisma ORM" },
	{ category: "Languages", items: "Python, Go, TypeScript/JavaScript, Bash, C/C++, SQL" },
];

export interface Project {
	id: string;
	title: string;
	company: string;
	period: string;
	blurb: string;
	stack: string;
	metrics?: string;
}

export const PROJECTS: Project[] = [
	{
		id: "smart-farm",
		title: "Smart Farming IoT Monitoring System",
		company: "MD · Vietnam",
		period: "Feb 2025 – Present",
		blurb: "End-to-end sensor pipeline: RPi edge node → MQTT (Mosquitto) → NestJS aggregator → Angular dashboard with sub-second WebSocket push. Configurable alarm rules (threshold, hysteresis, debounce) with Zalo OA / email / SMS notifications. Time-series storage + charts for 8 sensor types across 3 farm zones. Docker Compose edge server on RPi 4 with 4G LTE backup.",
		stack: "Angular 17, PrimeNG, NestJS, Prisma, PostgreSQL, MQTT, Docker, Raspberry Pi 4, 4G LTE",
		metrics: "False-alert rate -60% vs naive thresholds",
	},
	{
		id: "anomaly-det",
		title: "Unsupervised Anomaly Detection for Security Cameras",
		company: "MD · Vietnam",
		period: "Feb 2025 – Present",
		blurb: "Convolutional AutoEncoder trained on 40+ hrs normal footage per zone; reconstruction error > 2.5σ flags loitering, abandoned objects, crowd surge. MOG2 pre-filter cuts GPU load ~70%. 30-frame EMA smoothing kills single-frame spikes. Two-stage YOLO + AutoEncoder pipeline via MQTT to ThingsBoard.",
		stack: "Python, PyTorch, OpenCV (MOG2, optical flow), scikit-learn, MQTT, FFmpeg, Docker",
		metrics: "Frame-level AUC 0.81 on UCSD Ped2 / CUHK Avenue, CPU-only",
	},
	{
		id: "wolffish",
		title: "Wolffish — Real-Time Camera Monitoring & PTZ Control",
		company: "Velox Tech",
		period: "Jul 2023 – Feb 2025",
		blurb: "RTSP-to-WebRTC transcoding in Go (Gin + Pion): H.264 RTSP to browser at <800ms latency, 8 concurrent streams with auto-reconnect. React PTZ panel (pan/tilt/zoom, presets, tour) via ONVIF. 7-day playback with timeline scrubber and event-triggered clips.",
		stack: "Go (Gin), Pion WebRTC, RTSP, ONVIF, React, Vite, Ant Design, FFmpeg, PostgreSQL",
		metrics: "<800ms glass-to-glass latency",
	},
	{
		id: "lice-yolo",
		title: "Lice Detection — Annotation & Training Platform",
		company: "Velox Tech",
		period: "Jul 2023 – Feb 2025",
		blurb: "Raw footage → labeled dataset → ONNX checkpoint. YOLOv8 core with custom augmentation + hyperparameter tuning. Browser annotation tool (box + polygon) over 150k frames, YOLO/COCO/VOC export. Quality pipeline: low-confidence flagging, pHash dedup, Cohen's kappa agreement. Live epoch preview cut iteration from 2 days to 4 hours.",
		stack: "React, Go, PostgreSQL, ONNX Runtime, Python",
		metrics: "150k+ frames annotated · label quality +30%",
	},
	{
		id: "devops-platform",
		title: "Platform DevOps & CI/CD Infrastructure",
		company: "HCM57 Technology",
		period: "Feb 2025 – Oct 2025",
		blurb: "GitLab CI/CD for 5+ services (build, lint, test, push, rolling deploy to MicroK8s). 50+ containers orchestrated with health checks + auto-restart. 10+ Ubuntu 22.04 production hosts, Proxmox hypervisor with 8 isolated VMs.",
		stack: "GitLab CI/CD, Docker, MicroK8s/K8s, PM2, Linux, Proxmox, Nginx, Bash",
		metrics: "Manual deploy effort -80% · 99.5% uptime over 8 months",
	},
	{
		id: "person-til-person",
		title: "Person til Person — Consumer Platform",
		company: "Velox Tech",
		period: "Jul 2023 – Feb 2025",
		blurb: "REST APIs (NestJS), Firebase real-time push, S3 media, payment gateway; React Native mobile screens.",
		stack: "NestJS, MongoDB, Firebase, S3, Next.js, React Native, Stripe",
	},
	{
		id: "velox-erp",
		title: "Velox Internal ERP & HR",
		company: "Velox Tech",
		period: "Jul 2023 – Feb 2025",
		blurb: "12 business modules (leave, payroll, inventory, reporting) over 18 months. Key SQL optimization cut dashboard load from ~4s to <600ms.",
		stack: "Node.js, Express, MySQL, Sequelize, React, Redux",
		metrics: "Dashboard ~4s → <600ms",
	},
];

export interface Job {
	company: string;
	role: string;
	period: string;
	items: string[];
}

export const EXPERIENCE: Job[] = [
	{
		company: "MD · Vietnam",
		role: "Software Engineer (Embedded & AI-IoT Focus)",
		period: "Feb 2025 – Present",
		items: ["Smart Farming IoT edge pipeline + alarm rules", "Unsupervised camera anomaly detection"],
	},
	{
		company: "HCM57 Technology · Nha Trang",
		role: "Software Engineer & DevOps",
		period: "Feb 2025 – Oct 2025",
		items: ["GitLab CI/CD + MicroK8s platform for 5+ services", "Next.js 15 + Strapi headless CMS company site"],
	},
	{
		company: "Velox Tech · Nha Trang",
		role: "Software Engineer",
		period: "Jul 2023 – Feb 2025",
		items: ["Wolffish RTSP-to-WebRTC + PTZ control", "YOLOv8 lice detection training platform", "Person til Person consumer platform", "Internal ERP & HR (12 modules)"],
	},
	{
		company: "INFOdation · Nha Trang",
		role: "Software Engineer Intern",
		period: "Oct 2022 – Dec 2022",
		items: [".NET Core e-commerce: listing, cart, orders, unit tests"],
	},
];

export const EDUCATION = {
	school: "Nha Trang University",
	degree: "Bachelor's Degree in Information Technology",
	period: "Aug 2019 – Sep 2023",
	gpa: "3.06 / 4.0",
};
