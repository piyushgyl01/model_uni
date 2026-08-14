# AGENTS.md — Course Atlas (model_uni)

## Essential Commands

| Command | Purpose |
|---------|---------|
| `npm ci` | Install dependencies (Node 22.13+) |
| `npm run dev` | Start dev server (vinext + Wrangler + Miniflare) |
| `npm run build` | Production build (vinext + Vite + Cloudflare) |
| `npm run start` | Preview production build |
| `npm run lint` | ESLint (Next.js config) |
| `npm test` | **Full verification**: `build` → Node test runner on `tests/*.test.ts` + `tests/*.test.mjs` |
| `npm run db:generate` | Generate Drizzle migrations from `db/schema.ts` |

**Order matters**: `npm test` runs `build` first. Run `lint` before committing.

## Architecture at a Glance

- **Framework**: Next.js 16 (React 19) on Cloudflare Workers via **vinext** (`vite.config.ts`, `worker/index.ts`)
- **Runtime**: Cloudflare Sites (D1 database, Assets, Images bindings via `.openai/hosting.json`)
- **Database**: D1 (SQLite) with **Drizzle ORM** (`db/schema.ts`, `drizzle/*.sql` migrations)
- **Catalog contract**: `app/domain/catalog.ts` — universal publication types, stable IDs (`crs_*`, `crv_*`, `unt_*`, etc.)
- **Validation**: `app/domain/validation.ts` — publication integrity + program requirement evaluation
- **Repository boundary**: `app/catalog/` — `StaticCatalogRepository` (checked-in bundles) ↔ `D1CatalogRepository` (runtime D1) ↔ `runtime-repository.ts` (shadow-verified runtime)
- **Programs**: `content/programs/` — six published program families across seven checked-in, immutable publication bundles:
  - `electrical-engineering.ts` (37 courses, 4 concentrations, 496 units)
  - `computer-science.ts` + `computer-science-v1-1.ts` (34 courses, 3 concentrations, 240 selected units)
  - `mechanical-engineering.ts` (34 courses, 3 concentrations, 240 selected units)
  - `physics.ts` (34 courses, 3 concentrations, 240 selected units)
  - `mathematics.ts` (34 courses, 3 concentrations, 240 selected units)
  - `practical-spreadsheets.ts` (1 course, 8 units, 1 sprint)
- **Routes**: `app/programs/[slug]/` (canonical), legacy `/degrees/[slug]` redirects
- **Renderers**: `app/program-page.tsx`, `app/course-page.tsx` — generic, no program-specific imports
- **Learner progress**: D1-backed, version-pinned, ChatGPT-authenticated (`app/api/learner-progress/`)

## Key Conventions

- **Immutable publications**: Checked-in bundles are seed inputs. D1 stores immutable runtime snapshots. Release initialization/import shadow-compares every field; steady-state startup checks one compact release marker. D1 errors never silently fall back.
- **Stable IDs**: Type-prefixed UUIDv7 (`crs_`, `crv_`, `unt_`, `prg_`, `prv_`, `res_`, `rv_`, `bnd_`). Never derive IDs from slugs/titles.
- **Version pinning**: Learner progress pinned to exact `programVersionId` + `courseVersionId` + `learningUnitId`. Survives catalog upgrades via explicit equivalency.
- **Repository pattern**: UI/routes call `catalogRepository.loadBySlug()` — never import program data directly.
- **Migrations**: Six additive Drizzle migrations (`drizzle/0000_*.sql` through `drizzle/0005_*.sql`). Run via Miniflare in tests; `npm run db:generate` for new schema changes.

## Test Suite Specifics

| File | Purpose | Notes |
|------|---------|-------|
| `tests/catalog-contract.test.ts` | Contract tests against `StaticCatalogRepository` | Validates all published programs, requirements, prerequisites, schedule neutrality |
| `tests/catalog-persistence.test.ts` | D1 persistence + shadow comparison | Uses Miniflare D1; seeds idempotently; tests conflict rejection, chunked bundles, fallback rules |
| `tests/progress-api.test.mjs` | Auth + progress API | Spins up built worker (`dist/server/index.js`); tests ChatGPT auth gate, CORS, import consent |
| `tests/rendered-html.test.mjs` | Source-level architecture guards | Greps route/page files for forbidden patterns (EE-specific imports, hardcoded semesters, etc.) |

**Run single test file**: `node --import tsx --test tests/catalog-contract.test.ts`

## Environment Gotchas

- **Node ≥ 22.13** required (`package.json:engines`)
- **Wrangler/Miniflare state** lives in `.wrangler/` (gitignored). `vite.config.ts` forces local paths via `WRANGLER_LOG_PATH`, `MINIFLARE_REGISTRY_PATH`.
- **Codex/Seatbelt sandbox**: `vite.config.ts` detects `CODEX_SANDBOX=seatbelt` and enables polling HMR.
- **D1 binding**: Named `DB` in `.openai/hosting.json`; injected via Cloudflare Vite plugin.
- **No `.env` committed**: App env belongs in ignored `.env*` files.

## Common Tasks

**Add a new program**:
1. Create `content/programs/<slug>.ts` exporting `PublishedProgramBundle`
2. Add to `content/catalog.ts` repository
3. Run `npm test` — contract tests validate completeness

**Change database schema**:
1. Edit `db/schema.ts`
2. Run `npm run db:generate` → creates `drizzle/<N>_<name>.sql`
3. Run `npm test` — persistence tests apply migrations via Miniflare

**Modify catalog contract** (`app/domain/catalog.ts`):
- Update types, validation (`validation.ts`), repositories, and seed bundles together
- All published programs must pass `validatePublishedProgramBundle`

**Debug D1 locally**: `npm run dev` starts Miniflare with D1; `wrangler d1 execute` works against `.wrangler/state/...`

## Files Worth Knowing

| Path | Role |
|------|------|
| `app/domain/catalog.ts` | Universal publication contract (source of truth) |
| `app/domain/validation.ts` | Publish validation + requirement evaluation |
| `app/catalog/runtime-repository.ts` | D1↔Static shadow comparison, fallback logic |
| `app/catalog/d1-repository.ts` | Chunked immutable bundle storage + reconstruction |
| `app/catalog/catalog-shadow.ts` | Field-level D1 vs static comparison |
| `app/catalog/learner-progress-repository.ts` | Version-pinned progress CRUD + import receipts |
| `content/catalog.ts` | Checked-in publication registry (StaticCatalogRepository) |
| `db/schema.ts` | 46-table D1 schema (catalog + learner + projections + audit + outbox) |
| `drizzle.config.ts` | Drizzle config (SQLite dialect, `./db/schema.ts`) |
| `vite.config.ts` | vinext + Cloudflare plugin + local bindings |
| `.openai/hosting.json` | Cloudflare Sites project binding config |

## Do Not

- Import program data directly in routes/renderers (use `catalogRepository`)
- Derive IDs from slugs, titles, or array indices
- Mutate published bundles — create new versions
- Skip `npm test` before committing (runs build + full contract + persistence + API tests)
- Commit `.wrangler/` or `.env*` files
