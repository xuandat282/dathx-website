---
title: "Unsupervised Anomaly Detection for Security Cameras"
company: "MD · Vietnam"
period: "Feb 2025 – Present"
blurb: "Convolutional AutoEncoder trained on 40+ hrs normal footage per zone; reconstruction error > 2.5σ flags loitering, abandoned objects, crowd surge. MOG2 pre-filter cuts GPU load ~70%. 30-frame EMA smoothing kills single-frame spikes. Two-stage YOLO + AutoEncoder pipeline via MQTT to ThingsBoard."
stack: ["Python", "PyTorch", "OpenCV (MOG2, optical flow)", "scikit-learn", "MQTT", "FFmpeg", "Docker"]
metrics: "Frame-level AUC 0.81 on UCSD Ped2 / CUHK Avenue, CPU-only"
pubDate: 2025-02-01
order: 2
---

Convolutional AutoEncoder trained on 40+ hrs normal footage per zone; reconstruction error > 2.5σ flags loitering, abandoned objects, crowd surge. MOG2 pre-filter cuts GPU load ~70%. 30-frame EMA smoothing kills single-frame spikes. Two-stage YOLO + AutoEncoder pipeline via MQTT to ThingsBoard.
