# Course Atlas

**Every subject. One navigable education.**

Course Atlas is a universal curriculum map organized as:

`Schools → Disciplines → Programs → Courses → Modules → Resources`

The launch catalog contains one complete, original Electrical Engineering
program: eight semesters, 128 internal credits, 39 courses, four specialization
routes, a two-semester capstone, three accessible laboratory routes, and a
carefully labeled library of free/open resources.

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

- `app/page.tsx` contains the interactive, responsive catalog experience.
- `app/data.ts` is the typed curriculum, hierarchy, assessment, laboratory, and
  resource dataset.
- `app/globals.css` defines the paper-and-ink visual system.
- Track choice and course completion are device-local and stored in the browser.
- No account, database, or paid learning service is required.

The application uses the existing vinext and Cloudflare Sites starter runtime.
