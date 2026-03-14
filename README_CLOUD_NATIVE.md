# SCS Risk Assessment Tool – Cloud-Native Extension

**Project:** Cloud-Native Software Architecture Development  
**Team:** D1  
**Course:** CSC2102 Professional Software Development  
**Version:** 1.0.0  
**Status:** In Development

---

## 🎯 Project Summary

This project transforms the existing SCS Risk Assessment Tool from a monolithic Express.js application into a **cloud-native platform** using:

- ☁️ **Vercel** for serverless compute
- 🗄️ **Supabase** for managed PostgreSQL database  
- 🤖 **Isolation Forest ML** for anomaly detection
- 🔄 **GitHub Actions** for CI/CD automation

**Key Achievement:** Architectural re-design (not refactoring) that demonstrates cloud-native principles, AI integration, and modern DevOps practices.

---

## 📚 Documentation

### Getting Started
- **[IMPLEMENTATION_PLAN.md](docs/cloud-native/IMPLEMENTATION_PLAN.md)** – Master guide for completing the project
- **[ACCOUNT_SETUP_GUIDE.md](docs/cloud-native/ACCOUNT_SETUP_GUIDE.md)** – Vercel/Supabase/Resend setup (step-by-step)
- **[TROUBLESHOOTING.md](docs/cloud-native/TROUBLESHOOTING.md)** – Common issues and solutions

### Technical Documentation
- **[ARCHITECTURE.md](docs/cloud-native/ARCHITECTURE.md)** – System architecture and design decisions
- **[ML_SPECIFICATION.md](docs/cloud-native/ML_SPECIFICATION.md)** – Anomaly detection ML specification
- **[CI_CD_SETUP.md](docs/cloud-native/CI_CD_SETUP.md)** – CI/CD pipeline configuration

### For Future Implementation
- **[IMPLEMENTATION_PROMPT.md](docs/cloud-native/IMPLEMENTATION_PROMPT.md)** – Copy this prompt into a new chat to continue implementation

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
copy .env.example .env
# Fill in your Supabase, Vercel, and Resend credentials
```

### 3. Generate ML Data & Train Model
```bash
npm run generate:synthetic
npm run train:ml
```

### 4. Run Locally
```bash
npm run dev
# Visit http://localhost:3000
```

### 5. Deploy to Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    USERS                                 │
│   Desktop │ Mobile │ Tablet (Shared Device)             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                 VERCEL PLATFORM                          │
│   Static CDN (public/) │ Serverless Functions (api/)   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                SUPABASE PLATFORM                         │
│   PostgreSQL Database  │ Supabase Storage               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                           │
│   Resend (Email) │ GitHub Actions (CI/CD)              │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### Cloud-Native Features
- ✅ **Auto-scaling** – Handles traffic spikes automatically
- ✅ **Serverless API** – Pay-per-execution, no always-on servers
- ✅ **Managed Database** – Supabase PostgreSQL with RLS
- ✅ **Global CDN** – Fast loading worldwide
- ✅ **CI/CD Pipeline** – Automated testing and deployment

### ML Feature: Anomaly Detection
- 🤖 **Isolation Forest** model detects suspicious submissions
- 🛡️ **Protects data quality** – Flags spam, bots, inconsistent answers
- 📊 **Unsupervised learning** – No labeled training data needed
- ⚡ **Fast inference** – < 50ms per prediction

### Original Features (Preserved)
- ✅ Multi-language quiz (EN/ZH/MS/TA)
- ✅ PDPA consent management
- ✅ Risk calculation algorithm
- ✅ Admin panel for content management
- ✅ Assessment statistics and reporting

---

## 📁 Project Structure

```
cloudify/
├── api/                        # Serverless functions (NEW)
│   ├── ml/predict.js           # ML prediction endpoint
│   ├── questions/              # Question endpoints
│   ├── assessments/            # Assessment endpoints
│   └── admin/                  # Admin endpoints
├── src/ml/                     # ML services (NEW)
│   └── anomaly.js              # Anomaly detection
├── lib/                        # Shared libraries (NEW)
│   ├── db.js                   # Supabase client
│   ├── auth.js                 # JWT middleware
│   └── cors.js                 # CORS middleware
├── scripts/                    # Scripts (NEW)
│   ├── generate-synthetic-data.js
│   └── train-anomaly-model.js
├── supabase/migrations/        # Database schema (NEW)
│   └── 001_initial_schema.sql
├── public/                     # Static frontend (existing)
├── server.js                   # Original Express app (existing)
├── routes/                     # Original routes (existing)
├── models/                     # Original models (existing)
├── docs/
│   ├── cloud-native/           # NEW documentation
│   │   ├── IMPLEMENTATION_PLAN.md
│   │   ├── ACCOUNT_SETUP_GUIDE.md
│   │   ├── ARCHITECTURE.md
│   │   ├── ML_SPECIFICATION.md
│   │   ├── CI_CD_SETUP.md
│   │   ├── TROUBLESHOOTING.md
│   │   └── IMPLEMENTATION_PROMPT.md
│   └── old/                    # Original project docs
├── .github/workflows/          # CI/CD (NEW)
│   ├── ci-cd.yml
│   └── keep-supabase-active.yml
├── vercel.json                 # Vercel config (NEW)
├── .env.example                # Environment template (UPDATED)
└── package.json                # Dependencies (UPDATED)
```

---

## 🛠️ Available Commands

```bash
# Development
npm run dev                     # Start development server
npm start                       # Start production server

# ML
npm run generate:synthetic      # Generate synthetic training data
npm run train:ml                # Train anomaly detection model

# Testing
npm test                        # Run test suite
npm run test:unit               # Run unit tests
npm run test:integration        # Run integration tests
npm run test:e2e                # Run E2E tests

# Deployment
vercel --prod                   # Deploy to Vercel production
```

---

## 📊 Marking Criteria Alignment

| Category (Weight) | Our Approach | Evidence |
|-------------------|--------------|----------|
| **Cloud-Native Design (30%)** | Serverless + Managed DB + Auto-scaling | Architecture docs, live deployment |
| **Product Innovation (15%)** | Anomaly Detection ML | Model demo, admin review queue |
| **Technical Competency (25%)** | Tests, clean code, security | Coverage report, code review |
| **Presentation (30%)** | Video, docs, slides | All submission artifacts |

---

## 🎯 Implementation Status

| Phase | Status | Progress |
|-------|--------|----------|
| **Foundation** | ✅ Complete | Accounts, env setup, DB schema |
| **Core Files** | ✅ Complete | vercel.json, libraries, ML service |
| **API Migration** | ⬜ In Progress | Convert routes to serverless |
| **ML Integration** | ⬜ Pending | Integrate anomaly detection |
| **CI/CD** | ✅ Complete | GitHub Actions workflow |
| **Testing** | ⬜ Pending | Write tests, achieve 80% coverage |
| **Deployment** | ⬜ Pending | Deploy to Vercel |
| **Documentation** | ✅ Complete | All docs created |

---

## 👥 Team Roles

| Role | Responsibilities | Owner |
|------|-----------------|-------|
| Project Manager | Timeline, stakeholder comms | [Name] |
| Tech Lead | Architecture decisions, code reviews | [Name] |
| Infra Lead | Vercel, Supabase, CI/CD | [Name] |
| ML Lead | Anomaly detection model | [Name] |
| Frontend Lead | Admin panel updates | [Name] |
| QA Lead | Testing strategy | [Name] |

---

## 📅 Timeline

| Week | Focus | Key Deliverables |
|------|-------|-----------------|
| **Week 1** | Foundation | Accounts, DB migration, env setup |
| **Week 2** | Migration | API conversion, static deployment |
| **Week 3** | ML + CI/CD | Model training, integration |
| **Week 4** | Testing | 80% coverage, performance |
| **Week 5-6** | Delivery | Demo video, report, presentation |

---

## 🔐 Security

- ✅ JWT authentication for admin routes
- ✅ Row Level Security (RLS) in Supabase
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ Secrets managed via GitHub Secrets
- ✅ OWASP Top 10 compliance

---

## 💰 Cost

**Total Monthly Cost: $0** (Free Tier)

| Service | Plan | Limits |
|---------|------|--------|
| Vercel | Hobby | 100GB bandwidth, 10M GB-s compute |
| Supabase | Free | 500MB DB, 1GB storage |
| Resend | Free | 3,000 emails/month |
| GitHub | Free | 2,000 CI/CD minutes/month |

---

## 📞 Getting Help

### Documentation
- Start with **[IMPLEMENTATION_PLAN.md](docs/cloud-native/IMPLEMENTATION_PLAN.md)**
- For account setup: **[ACCOUNT_SETUP_GUIDE.md](docs/cloud-native/ACCOUNT_SETUP_GUIDE.md)**
- Having issues? Check **[TROUBLESHOOTING.md](docs/cloud-native/TROUBLESHOOTING.md)**

### External Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Isolation Forest NPM](https://npmjs.com/package/isolation-forest)

---

## 📄 License

This project is for academic purposes as part of CSC2102 Professional Software Development.

---

## 🙏 Acknowledgments

- Original SCS Risk Assessment Tool team
- Singapore Cancer Society for the original project brief
- Course evaluators for guidance

---

**Last Updated:** March 2026  
**Version:** 1.0.0  
**Status:** In Development
