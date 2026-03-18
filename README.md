# SCS Risk Assessment Tool

A browser-based cancer risk assessment application used at health events and booths by **staff members** with **public participants** on a **shared device** (tablet or laptop). No persistent user accounts are required — each participant completes a short quiz anonymously and receives personalised recommendations.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Database & Seeding](#database--seeding)
- [Usage Flow](#usage-flow)
- [Security & Privacy](#security--privacy)
- [Contributing](#contributing)

---

## Overview

Each participant:

1. Reviews and accepts a **PDPA consent** notice before starting.
2. Completes one or more cancer risk assessments (e.g. breast, colorectal, cervical).
3. Receives a set of tailored recommendations based on their answers.

The tool stores **assessment results and configuration only**; all participants remain anonymous.

---

## Key Features

### Participant-Facing Quiz
- Multi-language support: **English, Chinese, Malay, Tamil**
- Mandatory PDPA consent screen per participant
- Clean, game-like quiz flow with clear call-to-action buttons
- "Return to Home Screen" flow that fully resets state — the next participant must give fresh consent

### Admin Panel (`/admin`)
- Question bank management and cancer type assignments
- PDPA text editor with translation support
- Theme and appearance editor (colours, logos, assets)
- Recommendations and content configuration
- Assessment statistics snapshot view
- Backup & restore of question bank and configuration

### Backend API
- Node.js + Express REST API (ESM modules)
- JWT-protected admin routes with rate limiting
- PostgreSQL storage for questions, assignments, assessments, and admin data
- File-based snapshots and CSV import/export utilities
- SMTP email service for admin password reset

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express (ESM) |
| Database | PostgreSQL (`pg`) |
| Auth | JWT |
| Frontend | Vanilla HTML / CSS / JavaScript |
| Email | Nodemailer (SMTP) |
| Testing | Node built-in test runner + `supertest` |

---

## Project Structure

```
scs-risk-assessment-tool/
├── server.js              # Express app entrypoint
├── package.json
├── .env.example
├── public/                # Static frontend (served as-is)
│   ├── index.html         # Participant quiz app
│   ├── admin.html         # Admin SPA
│   └── js/
│       ├── main.js
│       ├── questionLoader.js
│       └── admin/         # Admin-specific JS modules
├── routes/                # Express route handlers
│   ├── public.js
│   ├── assessments.js
│   ├── questions.js
│   └── admin.js
├── models/                # Data access layer
│   ├── questions.js
│   ├── cancerTypes.js
│   ├── settings.js
│   ├── assessments.js
│   └── admins.js
├── controllers/           # Business logic
│   └── riskCalculator.js
├── middleware/            # Express middleware
│   └── auth.js            # JWT authentication
├── services/
│   └── emailService.js
├── utils/
│   ├── csv.js
│   └── escaping.js
├── data/                  # CSV/JSON data files and snapshots
│   ├── question_bank.csv
│   └── assignments.csv
├── scripts/
│   └── seed-questions.js  # Initial DB seed (destructive)
├── tests/                 # Automated test suite
├── config/                # App configuration
├── assets/                # Static assets
└── docs/                  # Internal architecture docs
```

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** (bundled with Node)
- **PostgreSQL** database (local or hosted, e.g. Supabase)
- An **SMTP account** for sending admin password reset emails

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone <repo-url>
cd scs-risk-assessment-tool
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

See [Environment Variables](#environment-variables) below for the full reference.

### 4. Initialise the database

Run the seed script to load the initial question bank (first-time setup only — see warning below):

```bash
npm run seed:questions
```

---

## Environment Variables

Create a `.env` file in the project root. **Never commit real secrets to version control.**

```env
# Server
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=replace-with-a-long-random-secret    # Required; server will not start without this

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Email (SMTP)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-smtp-password
EMAIL_FROM=SCS Risk Assessment <your-email@example.com>
```

See `.env.example` in the repository root for the full template.

---

## Running the Application

### Development (auto-restart on file change)

```bash
npm run dev
```

### Production

```bash
npm start
```

Set `NODE_ENV=production` and configure a process manager (e.g. PM2) or hosting platform as appropriate. Static assets are served from `public/` only — the project root is not exposed.

| Route | Description |
|---|---|
| `http://localhost:3000/` | Participant quiz app |
| `http://localhost:3000/admin` | Admin panel |

---

## Testing

Tests use Node's built-in test runner with `supertest` for HTTP assertions.

```bash
npm test
```

Tests run with `--test-concurrency=1` to prevent race conditions with file-based fixtures. All tests live in `tests/` and cover:

- Public and admin API endpoints
- Risk calculator and scoring logic
- CSV utility functions
- Admin views and frontend integrity checks

**All tests must pass (0 failures) before opening a PR or merging.**

---

## Database & Seeding

The application uses **PostgreSQL** configured via `DATABASE_URL`. Some features additionally use file-based data in `data/` (CSVs for question bank and assignments, JSON snapshots for statistics).

### Seeding the Question Bank

> ⚠️ **WARNING — DESTRUCTIVE OPERATION**  
> The seed script **deletes all existing rows** from `questions` and `question_assignments` before inserting from CSV. It is intended for **initial setup only**. Running it after admins have made changes will **permanently overwrite** those changes.  
> Always take a backup ("Download Backup" in the Admin Question Bank tab) before re-seeding.

```bash
npm run seed:questions
# or equivalently:
node scripts/seed-questions.js
```

The script reads from:
- `data/question_bank.csv`
- `data/assignments.csv`

---

## Usage Flow

### At an Event / Booth (Participant)

1. Open the app URL on the shared device.
2. Hand the device to the participant.
3. The participant reads and accepts the PDPA consent.
4. They choose and complete the relevant assessment(s).
5. Recommendations are displayed at the end.
6. Staff tap **"Play Again"** to reset — the next participant must re-accept PDPA.

### Admin Users

1. Navigate to `/admin` and log in.
2. From the admin panel you can:
   - Edit the question bank and cancer type assignments
   - Update PDPA content and translations
   - Adjust theme, appearance, and assets
   - Configure recommendations and assessment settings
   - Export backups or review assessment statistics

Admin routes are JWT-protected with rate limiting applied to login and password-reset endpoints.

---

## Security & Privacy

- **Shared device context** — avoid storing unnecessary data in `localStorage` or `sessionStorage`.
- PDPA consent is **per-participant session** and resets with each "Play Again" action.
- Do not log or export personally identifiable information beyond what the assessment workflow strictly requires.
- All contributions must follow the security checklist in `CLAUDE.md`, including XSS prevention, input validation, OWASP Top 10 adherence, and PDPA compliance.

---

## Contributing

- Follow a **Test-Driven Development (TDD)** approach for all backend logic.
- New or modified routes, models, and shared frontend utilities must have corresponding tests in `tests/`.
- Run `npm test` and ensure **0 failures** before raising a PR.
- Match existing patterns:
  - File layout: `routes/`, `models/`, `public/js/admin/views/`, etc.
  - Naming: kebab-case for CSS classes, camelCase for JavaScript
  - Separation of concerns: HTML for structure, CSS for styling, JS for behaviour

For architecture details and future feature plans, refer to the documents in `docs/`.
