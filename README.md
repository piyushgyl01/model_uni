# Course Atlas

> `model_uni` is the repository. The site it builds is called Course Atlas.

**Choose an outcome. Get the whole path.**

## The idea

A degree is not a mystery. It is a handful of terms, each holding five or six
courses, taken in an order where each one prepares you for the next, across
three or four years. That is the whole shape of it.

The material is already free and already online. MIT, Stanford, Harvard,
Berkeley and others publish the lectures, the readings, the problem sets and
the exams. What almost nobody publishes is the *shape* — which courses, in
which order, over how long, and what to do in week three.

Course Atlas is that shape. Five degrees, six terms each, prerequisites
respected, every course pointing at real free material. The point is to let
someone study what a university student studies, in the order a university
teaches it, without enrolling anywhere.

It is deliberately not a university. It awards nothing, verifies nothing, and
says so on every page.

## What a published program contains

A published program tells the learner what to learn, in what order, where to
learn it for free, what work to produce, and how that work is assessed.

The product is not tied to electrical engineering. The homepage is a catalog,
each program has its own route, and every course has a standalone classroom:

```text
/
└── programs/{program-slug}
    ├── courses/{course-slug}
    └── versions/{semantic-version}
        └── courses/{course-slug}
```

The same versioned model and generic renderers currently publish five
deliberately different degrees:

- **Electrical Engineering** — 37 available courses, four real concentrations,
  592 authored learning units, and 78 reviewed resources. A coherent selected
  path contains 31 courses and 496 units across six terms.
- **Computer Science** — 34 available courses, three coherent concentrations,
  272 topic blocks, 544 exact weekly assignments, 68 rubric-scored assessments,
  and 34 verified free primary resources. A selected six-term path contains 30
  courses, 240 topic blocks, 480 weekly assignments, and 120 Course Atlas
  credits. Version 1.2 is the first publication held to the automated
  `runnable-pathway-v1` instructional-quality standard.
- **Mechanical Engineering** — 34 available courses, three coherent
  concentrations, 272 learning units, 68 assessments, and 34 verified free
  primary resources. A selected six-term path contains 30 courses, 240 units,
  120 Course Atlas credits, and simulation-first alternatives wherever safe
  physical laboratory or shop access is unavailable.
- **Physics** — 34 available courses, three coherent concentrations, 272
  learning units, 68 assessments, and 34 reviewed free primary resources. A
  selected six-term path contains 30 courses, 240 units, 120 Course Atlas
  credits, experimental and computational work, and a defended research
  thesis.
- **Mathematics** — 34 available courses, three coherent pure and applied
  concentrations, 272 learning units, 68 assessments, and 34 reviewed free
  primary resources. A selected six-term path contains 30 courses, 240 units,
  120 Course Atlas credits, proof portfolios, computational work, expository
  writing, and a defended research thesis.
That range is a contract test: new programs join the catalog as validated
content bundles rather than through new degree-specific pages.

Course Atlas is community-curated and non-accredited. It does not award a
degree, university credit, or a regulated qualification, and it is not
affiliated with the providers whose free resources it links to.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Run the complete production and contract verification:

```bash
npm test
npm run lint
npm run catalog:audit-resources
```

The dated Computer Science 1.2 provider-check reports are kept in
`content/audits/`. They separate successful HTTP checks and redirects from
provider-blocked URLs that retain manual editorial evidence; any definitive
DNS/400/404/410 failure makes the audit command fail. The most recent run
(`computer-science-v1-2-resources-2026-08-15.json`) verified 375 of 402 unique
URLs over HTTP, classified 27 as indeterminate/manual-only, and found zero
definitively broken locations.

### Release verification

Two suites hold the published release criteria, so the whole contract can be
read in one place instead of being inferred from twenty-odd files:

- `tests/release-acceptance.test.ts` names one assertion per criterion and runs
  against the **latest** publication resolved through the repository boundary,
  so a newly published version inherits the gate rather than leaving it pinned
  to a superseded bundle. It proves the selected path is exactly 30 courses and
  240 units, that every surface — Today, calendar, terms, record, prerequisites,
  mastery, study plan — agrees on one resolved pathway, that start dates and
  study days move the schedule, that no day or rolling week exceeds the chosen
  capacity, that completed assignments stay in their own day's history, that
  assessments rather than checkboxes pass a course, that prerequisites lock the
  controls until passed or explicitly waived, and that record claims and links
  come only from the shared resolver.
- `tests/release-journey.test.mjs` drives the real built worker on Miniflare D1
  through one continuous learner journey: enrol, study, fail an assessment,
  retry, pass, and reach a completed pathway — then proves the state survives a
  refresh, appears on a second device without clobbering the first, and outlives
  a genuine restart against a persisted database.

Database schema changes use Drizzle:

```bash
npm run db:generate
```

## Catalog publication

Checked-in bundles remain the reviewed bootstrap catalog. They can be exported
as canonical, content-addressed publication artifacts into a new directory:

```bash
npm run catalog:export -- ./catalog-export
```

The exporter refuses to overwrite an existing directory and writes one JSON
bundle per program version plus a manifest containing byte counts and SHA-256
digests.

`POST /api/catalog/import` is the controlled runtime publication boundary. It
accepts one bundle or an array of up to 16 bundles from an authenticated,
same-origin request. Access fails closed unless the signed-in user's stable
Sites identity is included in the server-only, comma-separated
`CATALOG_PUBLISHER_IDS` binding. Do not expose that binding to client code.

Before writing to D1, the endpoint validates each publication and the combined
catalog, rejects incompatible stable-ID reuse and newly introduced resource-URL
identity collisions, then reconstructs and shadow-checks every inserted bundle.
Retries are idempotent and published content is immutable. A valid D1-only
program automatically appears on the homepage and receives the generic program,
course, and historical-version routes without a frontend code change or
redeploy.

## How the implementation scales

- `app/domain/catalog.ts` is the universal publishable content contract:
  stable identities, immutable versions, requirements, concentrations,
  arbitrary learning units, assessments, competencies, calendars, schedules,
  resource access, rights, freshness, and provenance.
- `app/domain/validation.ts` rejects invalid publications and evaluates whether
  a set of completed course versions satisfies a program. Catalog-level
  validation also rejects a reused identity whose definition differs between
  programs.
- `app/domain/instructional-quality.ts` applies the opt-in runnable-pathway
  standard: exact weekly source locations, concrete work and deliverables,
  workload reconciliation, staged assessments, rubrics and passing scores,
  current access/rights/freshness evidence, and anti-template checks.
- `scripts/audit-runnable-resources.ts` checks every unique runnable-source URL
  and can persist a complete dated report with `--report <path>`; it never
  upgrades a blocked or timed-out result into automated verification.
- `app/catalog/repository.ts` is the content-storage-independent read contract.
  Runtime routes use the asynchronous D1 adapter; the static adapter supplies
  reviewed publications to the idempotent seed pipeline and remains the
  intentional no-binding fallback for builds and tests.
- `content/programs/` contains the reviewed publication bundles. The original
  EE material remains in `content/seeds/`, with stable IDs in
  `content/manifests/`.
- `app/program-page.tsx` and `app/course-page.tsx` are generic renderers. They
  have no EE-specific imports or fixed semester/week assumptions.
- `app/programs/[slug]/` contains the canonical program and course routes.
  Immutable historical versions remain reachable under
  `/programs/[slug]/versions/[version]`; legacy `/degrees/[slug]` links redirect
  permanently.
- `app/catalog/d1-repository.ts` stores immutable publications in bounded D1
  chunks, uses bounded statement batches, reconstructs and validates them, and
  rejects an attempt to reuse a published identity for changed content.
- `catalog_program_summaries` and `catalog_course_search_rows` are disposable,
  indexed D1 projections behind bounded, keyset-paginated catalog APIs. Learner
  pathway, term, Today, and Independent Learning Record rows are pinned to the
  exact bundle hash and progress revision, so request cost depends on the active
  learner path rather than total catalog size.
- `app/api/catalog/import/route.ts` is the allowlisted, same-origin publication
  API for adding validated bundles without coupling catalog growth to source
  releases. Explicit program supersessions can change which identity owns a
  canonical slug without deleting historical publications.
- `app/catalog/catalog-shadow.ts` compares every checked-in publication with
  the D1 copy down to an actionable field path during release initialization or
  protected publication. Ordinary reads check a compact indexed release marker;
  a real D1 error never silently falls back to source data.
- `db/schema.ts` and the Drizzle migrations provide 46 relational tables,
  including versioned catalog authoring, immutable publication snapshots,
  learner accounts, enrollment settings, version-pinned progress, evidence,
  assessment attempts, personal schedules, prerequisite waivers, import
  receipts, aliases, audit events, and an outbox.

On a fresh D1 database, the checked-in publications seed idempotently and build
their read models. Full source shadow verification happens only when that compact
release manifest changes; steady-state Worker cold starts do one indexed marker
lookup and do not import or hash every curriculum. Older D1 publications are
retained so historical learner progress stays resolvable through durable
versioned routes.

Anonymous and offline progress remains cached in the browser. After ChatGPT
sign-in, the learner explicitly chooses whether to merge that device's existing
progress or use the cloud record. The merge is idempotent, local data is not
deleted before confirmation, and choosing cloud-only does not transmit the
device history. Signed-in enrollment, pace, pathway choices, unit progress,
evidence, assessment attempts/results, personal schedule entries, prerequisite
waivers, and append-only history are stored in D1 under exact immutable catalog
versions. Browser writes enter a granular offline outbox; revision checks and
idempotent mutation IDs prevent a stale device from replacing newer cloud work.

The learner calendar is generated from the enrolled start date, exact selected
path, weekly pace, timezone, and chosen study days. It runs term courses
concurrently, divides long units and assessments into sessions of at most 90
minutes, dates midpoint work, finals, projects, breaks, and deadlines, and caps
generated work at eight hours on any study day. Only the current day's
assignments and explicit carry-forwards are materialized into the durable
personal schedule; the remaining calendar and completion date are recalculated
from actual unfinished hours. Completed and carried entries remain immutable
daily history.

Course status now follows an academic mastery lifecycle: not started, studying,
assessment due, submitted, evaluated, passed, or retry required. Checking every
learning unit records completed study work but cannot pass a course by itself.
Passing requires all published learning work, every required assessment with
submission evidence, the published weighted threshold (including individually
required assessments), and evidence for required project/practical units.
Prerequisite locks disable course, evidence, assessment, and Today controls;
placement results and other waivers unlock only the declared prerequisite and
are retained as explicit, revocable learner records. The normal learner UI has
no bulk “mark all complete” action.

Instructor or automated grading, formal credentials, and public editorial
authoring remain outside this release. Persisted assessment results record their
evaluation method and do not imply independent verification.

The application uses vinext on the Cloudflare Sites runtime.
