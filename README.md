# PLOS — Personal Life Operating System

A personal life operating system that helps you plan, track, and live
intentionally — combining voice journaling, smart scheduling, project
tracking, and content planning into one secure app.

Built in public. Open source. Free for everyone.

## Why PLOS Exists

Most productivity tools solve one problem. PLOS connects everything —
your journal, your schedule, your projects, your goals, your content —
so daily actions link to yearly ambitions.

Every feature is built with documented security decisions. This project
serves as both a daily-use application and a security architecture
portfolio piece.

## Features

- **Voice Journal** — record your thoughts, auto-transcribed, encrypted
  with zero-knowledge architecture
- **Smart Scheduler** — recurring routines, conflict detection,
  auto-rescheduling
- **Project Tracker** — projects, tasks, courses, GitHub activity
- **Content Planner** — draft, schedule, and track social media posts
- **Life Dashboard** — everything on one screen
- **Year Planning** — annual goals → quarterly → monthly → weekly → daily

## Security Architecture

This application demonstrates enterprise-grade security practices:

- Multi-factor authentication (TOTP)
- Zero-knowledge encryption for sensitive data (AES-256-GCM)
- JWT with refresh token rotation
- Rate limiting and brute force protection
- Input validation on all endpoints
- Audit logging
- OWASP Top 10 compliance
- MITRE ATT&CK technique mapping
- Azure security deployment (Key Vault, Managed Identity, NSG, Monitor)

Full security documentation is in the [`security/`](security/) directory.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS (PWA) |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Cache | Redis |
| Auth | Custom (bcrypt + JWT + TOTP) |
| Encryption | Web Crypto API (AES-256-GCM) |
| Hosting | Cloudflare Pages + Oracle Cloud |
| Security Demo | Azure (Terraform) |

## Run Locally

```bash
git clone https://github.com/YOUR-USERNAME/plos.git
cd plos
docker compose up