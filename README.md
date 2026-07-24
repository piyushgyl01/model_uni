# Course Atlas

**Every subject. One navigable education.**

Course Atlas is a universal curriculum map organized as:

`Schools → Disciplines → Programs → Courses → Weeks → Resources`

The root route is a degree directory. Every published program receives its own
route at `/degrees/[slug]`, so new degrees join the registry instead of extending
one monolithic page.

The launch catalog contains one complete, original Electrical Engineering
program: six semesters over three years, 96 internal workload credits, 31
courses, four specialization routes, 496 explicit study weeks, a two-semester
capstone, three accessible laboratory routes, and a carefully labeled library
of free/open resources.

This project is an independent, non-accredited learning blueprint. It is not a
degree-granting university and is not affiliated with the institutions cited as
curricular provenance.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

To create the production worker bundle:

```bash
npm run build
```

To build and verify the server-rendered experience:

```bash
npm test
```

## Implementation

- `app/page.tsx` is the universal degree-directory homepage.
- `app/program-registry.ts` is the scalable catalog of live, building, and
  planned degree routes.
- `app/degrees/[slug]/page.tsx` resolves published degrees to independent pages.
- `app/degree-page.tsx` contains the interactive Electrical Engineering program.
- `app/data.ts` is the typed curriculum, hierarchy, assessment, laboratory, and
  resource dataset.
- `app/course-plans.ts` contains the executable course routes: primary and
  alternative resources, setup, weekly work, evidence, and assessments.
- `app/globals.css` defines the paper-and-ink visual system.
- Track choice and weekly progress are device-local and stored in the browser.
- No account, database, or paid learning service is required.

The application uses the existing vinext and Cloudflare Sites starter runtime.
