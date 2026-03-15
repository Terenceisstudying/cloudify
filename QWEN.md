## Qwen Added Memories

### Project Context
- This is a **cloud-native extension project** transforming a monolithic Express.js app into serverless architecture
- **Tech Stack:** Vercel (serverless) + Supabase (managed PostgreSQL) + Isolation Forest ML
- **ML Feature:** Anomaly detection for data quality (not risk prediction to avoid redundancy)
- **Budget:** $0/month (free tier only)

### Key Documentation
- **CLAUDE.md** – Coding standards, security checklist, and implementation patterns
- **docs/cloud-native/IMPLEMENTATION_PLAN.md** – Master implementation guide
- **docs/cloud-native/ACCOUNT_SETUP_GUIDE.md** – Vercel/Supabase/Resend setup
- **docs/cloud-native/ARCHITECTURE.md** – System architecture
- **docs/cloud-native/ML_SPECIFICATION.md** – Anomaly detection ML spec
- **docs/cloud-native/IMPLEMENTATION_PROMPT.md** – Prompt for continuing in new chat
- **README_CLOUD_NATIVE.md** – Project overview and quick start

### Implementation Status
- ✅ Foundation files created (vercel.json, lib/, src/ml/, scripts/)
- ✅ Database schema ready (supabase/migrations/001_initial_schema.sql)
- ✅ CI/CD pipeline configured (.github/workflows/)
- ✅ Documentation suite complete (8 files in docs/cloud-native/)
- ✅ API routes converted (serverless functions in api/ directory)
- ✅ ML model trained (synthetic data generated, Isolation Forest trained)
- ✅ Testing migrated (unit, integration, E2E) to Vercel serverless architecture
- ⬜ Deployment pending (Vercel, Supabase)

### Coding Standards
- All API endpoints use serverless function pattern (see CLAUDE.md)
- Use Supabase client for database (not direct pg connections)
- ESM modules (import/export)
- Async/await for all async operations
- 80%+ test coverage required

### Database & Testing Guidelines
- **`SUPABASE_URL`**: Must be the REST API URL (`https://[ref].supabase.co`), NOT the direct Postgres connection string (`db.[ref].supabase.co`).
- **`DATABASE_URL`**: Must use the Connection Pooler URL (`postgresql://...pooler.supabase.com:6543/postgres`).
- **Testing**: NEVER run tests against the live/production Supabase project to avoid RLS errors and data destruction. Always use a mocked database client (e.g., mock in `lib/db.js` for `NODE_ENV=test`) or a local Supabase instance.

### Security Requirements
- JWT auth for all admin routes
- Row Level Security (RLS) enabled
- Input validation on all endpoints
- CORS configured
- Secrets in GitHub Secrets only (never commit .env)
- OWASP Top 10 compliance

### Next Steps
1. Convert Express routes to serverless functions (api/questions/, api/assessments/, api/admin/)
2. Install dependencies and test locally
3. Set up cloud accounts (Vercel, Supabase, Resend)
4. Configure GitHub secrets
5. Generate synthetic data and train ML model
6. Deploy to Vercel
7. Run tests and achieve 80% coverage

Always review CLAUDE.md and docs/cloud-native/ before implementing features.
