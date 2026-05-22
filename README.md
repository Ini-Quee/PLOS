# PLOS - Secure Cloud Application & DevSecOps Security Project

PLOS, the Personal Life Operating System, is a full-stack productivity and journaling application built with React, Node.js, Express, PostgreSQL, and AI-assisted planning through Lumi.

This repository is being shaped as a portfolio-ready cloud security and DevSecOps project. It demonstrates realistic application security controls, secure deployment planning, operational logging, and Azure security readiness without adding fake enterprise complexity.

## Portfolio Focus

PLOS is intended to show practical skills for junior roles in:

- Cloud security
- SOC and detection engineering fundamentals
- DevSecOps
- Secure application deployment
- Security documentation and risk communication

## Implemented Features

- React and Vite frontend for dashboard, planning, journaling, habits, budget, books, jobs, and settings workflows
- Node.js and Express backend API
- PostgreSQL database with migration scripts
- JWT access tokens with short expiration
- Refresh tokens stored as SHA-256 hashes and rotated on refresh
- HTTP-only refresh token cookie
- Bcrypt password hashing
- TOTP MFA setup and verification
- Rate limiting on authentication, journal creation, budget creation, savings creation, and Lumi messages
- Request validation with Zod and express-validator patterns
- Helmet security headers
- CORS allowlist configuration
- Audit logging for authentication and API mutations
- Environment variable validation at startup
- Redis-backed rate limiting with in-memory fallback
- Client-side encryption utilities for sensitive journal content

## In Progress Features

- Azure deployment architecture
- Centralized logging and monitoring plan
- Production-grade secret management with Azure Key Vault
- GitHub Actions security checks
- Expanded API validation coverage across all routes
- More complete audit log review workflows

## Planned Features

- Azure App Service or container-based API deployment
- Azure Database for PostgreSQL hardening
- Managed Identity for service-to-service access
- Log Analytics workbooks and alert rules
- Defender for Cloud recommendations
- CI pipeline with linting, dependency scanning, secret scanning, and SAST
- Infrastructure-as-code review for Azure networking and storage controls

## Architecture

### Current Application Architecture

```text
User Browser
    |
    | HTTPS in production
    v
React + Vite Frontend
    |
    | REST API calls with JWT access token
    v
Node.js + Express API
    |
    | Parameterized SQL queries
    v
PostgreSQL

Optional services:
- Redis for rate limiting
- Groq, Gemini, or OpenAI for AI workflows
- Stripe for subscription workflows
- Google OAuth/Gmail for integrations
```

### Security Architecture Placeholder

See [docs/azure-security-architecture.md](docs/azure-security-architecture.md) for the planned Azure security architecture.

Future diagrams should include:

- Frontend hosting boundary
- API hosting boundary
- PostgreSQL private access model
- Key Vault secret flow
- Managed Identity access
- Azure Monitor and Log Analytics flow
- Network Security Group boundaries

## Repository Structure

```text
PLOS/
  backend/                 Express API, middleware, migrations, services
  frontend/                React/Vite web application
  infrastructure/azure/    Azure Terraform draft assets
  security/                Threat model, OWASP review, controls, playbooks
  docs/                    Deployment and cloud security architecture plans
  README.md                Project overview and setup
```

## Security Documentation

- [Threat Model](security/threat-model.md)
- [OWASP Top 10 Review](security/owasp-top10-review.md)
- [Logging and Monitoring Plan](security/logging-monitoring-plan.md)
- [Security Controls Matrix](security/security-controls-matrix.md)
- [Incident Response Playbook](security/incident-response-playbook.md)
- [Deployment Plan](docs/deployment-plan.md)
- [Azure Security Architecture](docs/azure-security-architecture.md)

## Setup Instructions

### Prerequisites

- Node.js 18 or newer
- PostgreSQL 14 or newer
- Optional: Redis for production-like rate limiting
- Optional: Groq, Gemini, or OpenAI API key for Lumi AI features

### Clone the Repository

```bash
git clone https://github.com/Ini-Quee/PLOS.git
cd PLOS
```

### Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The backend runs database migrations during startup through `runMigrations()`.

Required backend environment variables:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://<db-user>:<db-password>@<db-host>:5432/<db-name>
JWT_SECRET=generate-a-long-random-secret-at-least-32-characters
JWT_ACCESS_EXPIRY=15m
FRONTEND_URL=http://localhost:5173
```

Optional variables are documented in [backend/.env.example](backend/.env.example).

### Frontend Setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- Health check: `http://localhost:3000/api/health`

## Application Security Controls

| Area | Current Control |
| --- | --- |
| Authentication | JWT access tokens, refresh tokens, MFA support |
| Password storage | Bcrypt hashing |
| Session protection | HTTP-only refresh token cookie, refresh token rotation |
| API abuse | Rate limiting on sensitive routes |
| Input validation | Zod and express-validator middleware patterns |
| Headers | Helmet.js security headers |
| CORS | Explicit frontend origin allowlist |
| Error handling | Generic client errors with server-side request correlation |
| Logging | Morgan HTTP logs and database audit logs |
| Secrets | `.env` excluded from Git; Azure Key Vault planned |

## DevSecOps Direction

The project is prepared for future CI/CD work with:

- Secret scanning
- Dependency scanning
- Linting
- SAST preparation
- Infrastructure security review
- Azure deployment hardening

Recommended next implementation details are documented in [docs/deployment-plan.md](docs/deployment-plan.md).

## Security Notes

This is an educational portfolio project. Security documentation distinguishes between:

- Implemented controls currently present in code
- Recommended controls for deployment
- Planned controls for Week 2 and later

That distinction is intentional and helps recruiters see honest security engineering judgment.

The public documentation avoids real credentials, customer data, private company details, and exploit payloads. Use synthetic examples only.

## License

MIT
