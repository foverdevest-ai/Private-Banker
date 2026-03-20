# Private Banker Dashboard

Production-ready MVP web app for personal wealth tracking, spending analytics, mortgage/document intelligence, and AI-assisted financial Q&A.

## Stack
- Next.js App Router + TypeScript
- PostgreSQL + Prisma ORM
- Tailwind CSS + reusable UI components
- NextAuth (Google + demo mode for local exploration)
- Recharts for dashboard visuals
- OpenAI-compatible provider abstraction
- Docker + docker-compose
- Vitest + Testing Library + Playwright

## MVP Features Implemented
- Google auth flow with allowed email restriction (`ALLOWED_EMAILS`) and demo fallback mode
- Personal + Holding entities and combined net worth view
- Historical net worth snapshots and spending analytics
- Account connector abstraction with manual + mocked sync adapters
- Manual fallback preserved for all connector workflows
- Transactions list with search, filters, pagination-capable query pattern, and category editing
- Merchant normalization and subscription candidate detection
- First-class property, mortgage, business/vehicle/manual assets and liabilities models
- Mortgage tracking with snapshots and manual correction-friendly valuation history
- Secure PDF upload + text extraction + chunking + indexing + extracted field mapping
- Document detail and document Q&A endpoint with chunk-based citations
- Finance copilot chat with deterministic data tools for numeric answers
- NL-oriented tax insights page with versioned assumptions table
- Security-oriented defaults: server auth checks, encrypted token field support, upload validation, rate limits, no provider token exposure to client
- Health endpoint for ops (`/api/health`)

## Quick Start (Local)
1. Install dependencies:
```bash
npm install
```
2. Configure environment:
```bash
cp .env.example .env
```
3. Start Postgres (Docker):
```bash
docker compose up -d postgres
```
4. Apply migrations and seed:
```bash
npm run db:migrate
npm run db:seed
```
5. Start app:
```bash
npm run dev
```
6. Open `http://localhost:3000`.

## Scripts
- `npm run dev` start development server
- `npm run build` build production bundle
- `npm run start` run production server
- `npm run lint` run ESLint
- `npm run format` check Prettier formatting
- `npm run test` run unit/integration tests with coverage
- `npm run test:e2e` run Playwright e2e tests
- `npm run db:migrate` run migrations in dev
- `npm run db:deploy` apply migrations in production
- `npm run db:seed` load realistic demo data

## Architecture Notes
- Single app process (no unnecessary microservices), with clear module boundaries:
  - `src/lib/finance` deterministic financial calculations
  - `src/lib/documents` parsing/chunking/extraction
  - `src/lib/ai` provider + tool orchestration
  - `src/lib/connectors` sync provider abstraction
- Data model supports multi-user and entity ownership expansion.
- Imported records are append-friendly and source-attributed.
- Manual overrides coexist with imported values.

## Integrations Status
- **ABN AMRO, ICS, PayPal, Bitvavo**: implemented via provider abstraction with mocked/dev adapters and manual fallback flows.
- **Direct ABN production sync blocker**: live OAuth/client setup and bank API contractual onboarding must be completed with real credentials. Architecture is prepared; mocked adapter keeps MVP operational.
- **DEGIRO**: intentionally excluded from MVP.

## Deployment
- Dockerfile and `docker-compose.yml` are included.
- Hetzner deployment guide: [docs/hetzner-deploy.md](./docs/hetzner-deploy.md)
- Nginx reverse proxy example: [docs/nginx.conf](./docs/nginx.conf)

## Security & Privacy
- Server-side auth checks on protected pages and APIs
- Config-driven allowlist for login emails
- Upload validation (type/size)
- Chat/upload rate limiting
- Token encryption utility for connector secret storage
- Private server-side document storage path

## Testing Coverage Focus
- Net worth calculations
- Spending aggregation
- Subscription detection logic
- Mortgage reconciliation behavior
- Document extraction mapping
- Chat tool selection
- Protected dashboard behavior
- Basic e2e app shell load

## Assumptions & Limitations
- Single active user in MVP; schema already supports multi-user entities.
- PDF text extraction first; OCR fallback is noted for future enhancement.
- Connector adapters are production-architecture compatible but mocked until credentials/legal/API onboarding are complete.
- Tax insights are educational estimates, not filing outputs.

## Next Steps after MVP
1. Replace mocked connectors with credentialed provider implementations.
2. Add signed file URL support using object storage (S3-compatible).
3. Add background worker for async document parsing at scale.
4. Add pgvector-backed ANN indexing optimizations for large document sets.
