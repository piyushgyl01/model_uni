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

The same versioned model and generic renderers currently publish two deliberately
different programs:

- **Electrical Engineering** — 37 available courses, four real concentrations,
  592 authored learning units, and 78 reviewed resources. A coherent selected
  path contains 31 courses and 496 units across six terms.
- **Practical Spreadsheets & Decision Modeling** — one 40-hour short course,
  eight learning units, two assessments, no concentration, and a one-sprint
  schedule.

That contrast is a contract test: new programs join the catalog as validated
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
- `app/catalog/repository.ts` is the read boundary used by every route.
  `app/catalog/static-repository.ts` is the current immutable publication
  adapter.
- `content/programs/` contains reviewed publication bundles. The original EE
  material remains in `content/seeds/`, with stable IDs in
  `content/manifests/`.
- `app/program-page.tsx` and `app/course-page.tsx` are generic renderers. They
  have no EE-specific imports or fixed semester/week assumptions.
- `app/programs/[slug]/` contains the canonical program and course routes.
  Legacy `/degrees/[slug]` links redirect permanently.
- `db/schema.ts` and `drizzle/0000_supreme_bloodscream.sql` provide the first
  relational D1 publishing foundation: versioned programs/courses/content,
  requirements, resources, rights, access, provenance, aliases, audit events,
  and an outbox.

Published catalog bundles are still checked into source and served through the
repository adapter. D1 is provisioned for the next authoring/import slice; it
does not yet pretend to be the authoritative runtime catalog before an
idempotent seed, shadow comparison, and cutover exist.

Anonymous progress is stored on the learner's device under exact program,
course, and unit version IDs. It supports arbitrary course lengths and keeps
different concentration course versions separate. Accounts, cross-device
sync, graded submissions, and credentials are intentionally outside this
release.

The application uses vinext on the Cloudflare Sites runtime.
