# PLOS — Personal Life Operating System
### Powered by Lumi · Your AI Daily Life Companion

> *"Most apps make you go to them. Lumi comes to you."*

**PLOS** is a free, open source AI companion that walks beside you through your entire day — waking you up, walking you through your morning, logging your workout when you speak to it, analysing your journal, tracking your goals, reminding you to post your content, and celebrating every win with you.

Built in public. Zero-knowledge encrypted. Security-first architecture. Free forever.

---

## What Is Lumi?

Lumi is not a chatbot. She is not a dashboard. She is not another journaling app.

Lumi is a **voice-first daily companion** — the first person you talk to in the morning and the last thing you check at night. You speak to her. She speaks back. Everything you tell her — your workout, your thoughts, your plans, your feelings — gets documented, encrypted, and connected automatically.

```
6:00am — Lumi: "Good morning Erica. Today is Friday, 10 April. 
          Your first task is your workout. Ready?"

8:30am — You: "Lumi I just finished. One hour twenty, three laps, 
          burpees and squats."

         Lumi: "One hour twenty. That is a choice you made at 6am 
          and you kept it. Great job. Next up: meditate."

10:00pm — Lumi: "You completed 4 of 5 tasks today. You read 
           10 pages. You journaled. You showed up. That's real."
```

---

## Who Is This For?

PLOS is for people who are **serious about building their life intentionally** — not just tracking it.

- You want one place that connects your journal, schedule, goals, books, and content
- You want an AI that remembers your commitments and holds you to them — warmly, not harshly  
- You want your most private thoughts protected by real encryption, not a promise
- You want something that feels personal, beautiful, and alive — not another clinical dashboard

---

## Core Features

### 🎙️ Voice Journal
Speak your day. Lumi transcribes it, encrypts it, and analyses it. Zero-knowledge architecture means the server **cannot read your entries** — only you can. The journal looks like a real book: open pages, handwriting fonts, your chosen environment surrounding it.

- Voice-to-text transcription via Web Speech API (Chrome/Edge, free)
- AES-256-GCM client-side encryption before anything leaves your device
- AI mood analysis, theme detection, and commitment extraction via Gemini
- Journal entries automatically suggest calendar events
- Study notes section — learn something, speak it, Lumi stores it and reads it back
- Beautiful book-spread UI with font, pen colour, and background customisation

### 🌅 Daily Check-In with Lumi
Lumi greets you every morning with a spoken summary of your day. You check in by speaking. She marks things complete, reschedules what you skip, and holds you accountable — gently, not harshly.

- Browser-native text-to-speech (no external API cost)
- Three personality modes: calm and wise in the morning, energetic and celebratory when you achieve, firm but caring when you slip
- Persistent amber orb on every page — tap to talk to Lumi from anywhere

### 📅 Smart Life Scheduler
Set recurring routines — prayer, workout, meditation, meals, study blocks. Lumi tracks your streaks and calls you out if you skip twice in a row.

- Daily plan view with time blocks (05:00–23:00)
- Conflict detection and smart rescheduling suggestions
- Streak tracking with push notifications
- Calendar events auto-created from journal entries

### 📚 Book Tracker
Tell Lumi what you're reading. She tracks your progress, checks what you read yesterday, and suggests what to pick up today based on your goals.

### ✍️ Content Planner (Your Own Buffer)
Write your LinkedIn and X posts inside PLOS. Schedule them. Lumi notifies you at the right time with a single tap to copy and post. No paid API. Works for every platform. Free forever.

### 🎯 Project & Learning Tracker
Track everything you're building, studying, and applying for. Job applications, certifications, courses, projects — all connected to your daily check-in with Lumi.

### 🌟 Year Planning System
Set annual goals. Break them into quarterly milestones, monthly themes, weekly priorities, and daily intentions. Every morning Lumi speaks your intention for the day.

### 💌 Email Automation
Send outreach emails from inside PLOS using your own Gmail. Lumi drafts, you approve, she sends and reports back. No subscription. No third-party platform.

---

## Security Architecture

PLOS is built as a **security portfolio piece** demonstrating enterprise-grade practices applied to a real consumer application. Every security decision is documented with the attack it prevents, the MITRE ATT&CK reference, and evidence it works.

### CIA Triad Implementation

**Confidentiality**
- Zero-knowledge AES-256-GCM encryption for all journal content — the server stores only ciphertext
- PBKDF2 key derivation from user password — encryption key never transmitted
- TOTP-based MFA — second factor required for account access
- JWT access tokens expire in 15 minutes

**Integrity**  
- Audit logging on every API action — who did what, when, from which IP
- Refresh token rotation — each token single-use, prevents replay attacks
- Parameterised queries throughout — SQL injection not possible
- Input validation on all endpoints via express-validator

**Availability**
- Rate limiting — 5 login attempts per 15 minutes per IP (brute force protection)
- Redis caching — reduced database load, faster response times
- Graceful error handling — no silent crashes

### Security Controls Table

| Control | Implementation | Attack Prevented | MITRE ATT&CK |
|---|---|---|---|
| MFA (TOTP) | speakeasy + qrcode | Credential stuffing | T1078 |
| JWT rotation | Custom middleware | Token replay | T1550.001 |
| Rate limiting | express-rate-limit | Brute force | T1110 |
| AES-256-GCM | Web Crypto API | Data breach | T1557 |
| Row Level Security | PostgreSQL RLS | Broken access control | T1078 |
| Audit logging | Custom middleware | Undetected intrusion | T1562 |
| Input validation | express-validator | Injection attacks | T1190 |
| CSP headers | Express middleware | XSS | T1059 |

### Azure Security Demo
PLOS is deployed to Azure to demonstrate cloud security skills:
- **Azure Key Vault** — secrets management, no hardcoded credentials
- **Managed Identity** — passwordless service-to-service authentication
- **Azure Monitor** — SIEM-like alerting and anomaly detection
- **Network Security Groups** — database not exposed to public internet
- **Private Endpoints** — zero-trust networking
- **Azure Policy** — compliance enforcement (HTTPS-only, encryption at rest)

All Terraform infrastructure-as-code is in `/infrastructure/azure/terraform/`.  
Full security documentation is in `/security/` — MITRE mappings, threat model, penetration test report.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Tailwind CSS | Component-based, fast, PWA-capable |
| Backend | Node.js + Express | Lightweight, widely understood |
| Database | PostgreSQL | ACID compliance, Row Level Security |
| Cache | Redis | Session storage, rate limiting |
| Auth | Custom (bcrypt + JWT + TOTP) | Full control, portfolio demonstration |
| Encryption | Web Crypto API (AES-256-GCM) | Client-side, zero-knowledge |
| Voice Input | Web Speech API | Free, browser-native, no API cost |
| Voice Output | SpeechSynthesis API | Free, browser-native, no API cost |
| AI Analysis | Google Gemini 2.0 Flash | Free tier, runs client-side |
| Hosting | Cloudflare Pages + Oracle Cloud | Free forever tiers |
| Security Demo | Azure + Terraform | Enterprise security showcase |

---

## Design System

PLOS uses **warm amber gold** (`#F5A623`) as its signature colour — the colour of morning light, of a candle, of a new day beginning. Dark background (`#0D0D0D`), warm cream text (`#F5F0E8`). Beautiful. Distinct. Nothing like any other productivity app.

Fonts: `DM Serif Display` for Lumi's voice and headings · `Inter` for UI · `Caveat` for journal handwriting

---

## Run Locally

```bash
git clone https://github.com/Ini-Quee/PLOS.git
cd PLOS
docker compose up
```

The full stack starts: PostgreSQL, Redis, backend API, and frontend.

**Environment variables required:**

```env
# backend/.env
DATABASE_URL=postgresql://plos_user:password@localhost:5432/plos
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-other-secret-here
REDIS_URL=redis://localhost:6379

# frontend/.env
VITE_API_URL=http://localhost:3001
VITE_GEMINI_API_KEY=your-gemini-key-from-aistudio.google.com
```

Get a free Gemini API key at: https://aistudio.google.com/app/apikey

---

## Build Progress

| Phase | Feature | Status |
|---|---|---|
| Phase 0 | Foundation & bug fixes | ✅ Complete |
| Phase 1 | Lumi's voice system | 🔄 In progress |
| Phase 2 | Voice journal (complete) | ⏳ Upcoming |
| Phase 3 | Dashboard with real data | ⏳ Upcoming |
| Phase 4 | Smart scheduler & calendar | ⏳ Upcoming |
| Phase 5 | Projects, books, job tracker | ⏳ Upcoming |
| Phase 6 | Content planner & year planning | ⏳ Upcoming |
| Phase 7 | Email automation | ⏳ Upcoming |
| Phase 8 | Security portfolio documentation | ⏳ Upcoming |

---

## Project Structure

```
plos/
├── frontend/          ← React PWA
├── backend/           ← Node.js + Express API
├── infrastructure/    ← Azure Terraform scripts
├── security/          ← Security documentation and evidence
└── AGENTS.md          ← Full build blueprint for AI agents
```

---

## Why Open Source?

PLOS is free for everyone because the tools that help you build your life should not cost you your privacy or your money. The code is open so you can audit it, self-host it, and trust it.

If you find it useful, star the repo. If you find a security issue, open a responsible disclosure via `SECURITY.md`.

---

## About the Builder

Built by **Erica Innocent Effiong** — building in public, learning cloud security, demonstrating that security is not an afterthought but a foundation.

Follow the build: [LinkedIn](#) · [X/Twitter](#) · [GitHub](https://github.com/Ini-Quee/PLOS)

---

*PLOS — Personal Life Operating System*  
*Lumi — Your daily life companion*  
*Open source. Security-first. Built in public.*