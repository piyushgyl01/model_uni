# Course Atlas

**Choose an outcome. Get the whole path.**

Course Atlas is an independent learning-path catalog. A published program tells
the learner what to learn, in what order, where to learn it for free, what work
to produce, and how that work is assessed.

The product is not tied to electrical engineering. The homepage is a catalog,
each program has its own route, and every course has a standalone classroom:

```text
/
└── programs/{program-slug}
    └── courses/{course-slug}
```

The same versioned model and generic renderers currently publish three
deliberately different programs:

- **Electrical Engineering** — 37 available courses, four real concentrations,
  592 authored learning units, and 78 reviewed resources. A coherent selected
  path contains 31 courses and 496 units across six terms.
- **Computer Science** — 34 available courses, three coherent concentrations,
  272 two-week learning units, 68 assessments, and 34 verified free primary
  resources. A selected six-term path contains 30 courses, 240 units, and 120
  Course Atlas credits.
- **Practical Spreadsheets & Decision Modeling** — one 40-hour short course,
  eight learning units, two assessments, no concentration, and a one-sprint
  schedule.

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
```

Database schema changes use Drizzle:

```bash
npm run db:generate
```

## How the implementation scales

- `app/domain/catalog.ts` is the universal publishable content contract:
  stable identities, immutable versions, requirements, concentrations,
  arbitrary learning units, assessments, competencies, calendars, schedules,
  resource access, rights, freshness, and provenance.
- `app/domain/validation.ts` rejects invalid publications and evaluates whether
  a set of completed course versions satisfies a program.
- `app/catalog/repository.ts` is the content-storage-independent read contract.
  Runtime routes use the asynchronous D1 adapter; the static adapter supplies
  reviewed publications to the idempotent seed pipeline and remains the
  intentional no-binding fallback for builds and tests.
- `content/programs/` and `app/content/computer-science/` contain reviewed
  publication bundles. The original EE material remains in `content/seeds/`,
  with stable IDs in `content/manifests/`.
- `app/program-page.tsx` and `app/course-page.tsx` are generic renderers. They
  have no EE-specific imports or fixed semester/week assumptions.
- `app/programs/[slug]/` contains the canonical program and course routes.
  Legacy `/degrees/[slug]` links redirect permanently.
- `app/catalog/d1-repository.ts` stores immutable publications in bounded D1
  chunks, reconstructs and validates them, and rejects an attempt to reuse a
  published identity for changed content.
- `app/catalog/catalog-shadow.ts` compares every checked-in publication with
  the D1 copy down to an actionable field path before the runtime repository is
  accepted. A real D1 error never silently falls back to source data.
- `db/schema.ts` and the Drizzle migrations provide 26 relational tables,
  including versioned catalog authoring, immutable publication snapshots,
  learner accounts, version-pinned progress, import receipts, aliases, audit
  events, and an outbox.

On a fresh D1 database, the checked-in publications seed idempotently. Runtime
catalog reads then come from D1 and are shadow-verified against the reviewed
source packages. Older D1 publications are retained so historical learner
progress stays resolvable.

Anonymous and offline progress remains cached in the browser. After ChatGPT
sign-in, the learner explicitly chooses whether to merge that device's existing
progress or use the cloud record. The merge is idempotent, local data is not
deleted before confirmation, and choosing cloud-only does not transmit the
device history. Signed-in progress is stored in D1 under the exact program,
course, and unit versions and synchronizes across devices.

Graded submissions, formal credentials, and public editorial authoring remain
outside this release.

The application uses vinext on the Cloudflare Sites runtime.
