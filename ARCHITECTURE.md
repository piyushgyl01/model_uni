# Course Atlas: Universal Catalog Architecture

Status: D1-backed catalog and learner-progress foundation, July 2026

The current release implements the universal publication contract, validation,
repository boundary, stable seed identities, immutable EE, Computer Science,
and spreadsheet publications, generic program/course renderers, D1-backed
catalog reads, and authenticated version-aware progress. Checked-in
publications are the reviewed seed inputs; D1 stores the immutable runtime
snapshots and every startup shadow-compares their canonical content. The later
editorial authoring, connector ingestion, credential, and search sections below
remain target architecture, not claims about the live product.

## 1. Product boundary

Course Atlas is a catalog, curriculum builder, study planner, and learning
record system. Electrical engineering is the first seeded program, not the
product's identity or a special case in the schema.

The core hierarchy presented to learners is:

```text
Schools
  → Disciplines
    → Programs
      → Courses
        → Course versions
          → Modules / units
            → Learning objects / resources
              → Assessments
                → Credentials
```

This is a navigation hierarchy, not a containment hierarchy in the database.
A course can serve many programs, a discipline can appear in several schools,
and one resource can support many learning objects. Those relationships must be
joins, not copied records.

Terminology has deliberate legal meaning:

- A **school** is a catalog faculty such as Engineering or Humanities. It is not
  an accredited institution.
- A **provider** is an actual university, nonprofit, company, author, or public
  body that publishes a source or resource.
- A **program** is a versioned study pathway. It is not a degree unless an
  independently verified issuer explicitly supplies and recognizes it.
- A **credential** is an issuer-scoped claim such as a badge, completion record,
  or verified external certificate. The platform does not call its own records
  degrees, diplomas, or academic credit.

## 2. Architecture rules

1. D1 is the runtime system of record for published catalog snapshots and
   authenticated learner progress; checked-in immutable publications are the
   reviewed, idempotent seed inputs until editorial authoring exists.
2. Object storage is the system of record for permitted binary assets and raw
   ingestion evidence.
3. Search indexes and caches are derived and disposable.
4. Published versions are immutable. Fixes create a new version.
5. Public IDs are stable; slugs, titles, provider codes, and URLs are not IDs.
6. Programs pin exact course versions so a published pathway is reproducible.
7. License and access are separate facts. “Free to view” does not mean “openly
   licensed” or “safe to copy.”
8. User progress is recorded against exact versions and survives catalog
   upgrades through explicit equivalency mappings.
9. Imported content is never published automatically merely because it was
   fetched successfully.
10. Start as a modular monolith. Split services only after measured load or team
    ownership makes the boundary necessary.

## 3. Canonical data model

All tables use `id`, `created_at`, and `updated_at`. Mutable editorial tables
also use `revision` for optimistic concurrency. Soft retirement uses
`retired_at`; records referenced by learning history are not deleted.

### Catalog and curriculum

| Table | Important fields and purpose |
| --- | --- |
| `schools` | `id`, `canonical_slug`, `name`, `description`, `status` |
| `disciplines` | `id`, `parent_id`, `canonical_slug`, `name`; a global, hierarchical taxonomy |
| `school_disciplines` | `school_id`, `discipline_id`, `display_order`; enables cross-listed disciplines |
| `programs` | Stable program identity: `id`, `home_school_id`, `canonical_slug`, `program_kind`, `recognition_status`, `owner_provider_id` |
| `program_disciplines` | `program_id`, `discipline_id`, `is_primary` |
| `program_versions` | `program_id`, `version_no`, `status`, `based_on_id`, `published_at`, `effective_from`, `effective_to`, workload and credit policy, changelog |
| `program_requirements` | Versioned requirement groups such as core, concentration, elective, residency, capstone, or free choice |
| `program_course_options` | `requirement_id`, `course_id`, draft-time `course_version_id`, credits, recommended term, min grade, choice weight; the version is required at publication |
| `courses` | Stable course concept: `id`, `owner_provider_id`, `canonical_slug`, canonical discipline, level, default language, lifecycle status |
| `course_codes` | Provider- or program-scoped codes such as `EE101`; unique on `(namespace, code)` rather than globally |
| `course_versions` | `course_id`, `version_no`, `status`, `based_on_id`, title, summary, outcomes, nominal hours, valid dates, change class |
| `credit_systems` / `course_credit_values` | Provider/jurisdiction credit definitions and the value of a course version in that system; no silent US-credit/ECTS conversion |
| `course_version_contributors` | People/providers and roles for authorship, review, maintenance, and attribution |
| `content_nodes` | A tree inside one course version: `course_version_id`, `parent_id`, `kind` (`module`, `unit`, `lesson`), `position`, release rule |
| `learning_objects` | Stable identity for a lesson, reading, demonstration, lab, worked example, simulation, or practice activity |
| `learning_object_versions` | Immutable authored instructions, outcomes, duration, difficulty, accessibility metadata, and language |
| `node_learning_objects` | Ordered placement of an exact learning-object version in one or more course nodes |

Programs themselves must be versioned even though the public hierarchy
emphasizes course versions. Otherwise a learner who enrolled in a 2026 pathway
could silently receive 2028 requirements.

### Resources, providers, and rights

| Table | Important fields and purpose |
| --- | --- |
| `providers` | Legal/display name, provider kind, official domain, verification state, country, trademark guidance |
| `provider_units` | Hierarchical real-world faculties, departments, campuses, and teams beneath a provider; distinct from catalog `schools` |
| `provider_identifiers` | Provider IDs from Wikidata, ROR, government registries, or import feeds |
| `sources` | A feed, repository, catalog, sitemap, API, or manually supplied source owned by a provider |
| `source_records` | Raw external identity, canonical URL, fetched metadata, fetch timestamp, HTTP state, raw-object key, checksum |
| `resources` | Stable concept for an external or hosted book, lecture, tool, paper, dataset, or media item |
| `resource_versions` | Immutable URL/blob revision, media type, authors, dates, content hash, language, duration, accessibility facts |
| `learning_object_resources` | Exact learning-object and resource versions plus role (`primary`, `alternate`, `transcript`, `dataset`, `tool`, `further_reading`) |
| `licenses` | SPDX identifier when possible, human label, canonical terms URL, reuse flags, and whether terms need manual interpretation |
| `resource_rights` | License, copyright holder, territory, evidence-object key, verified by/at, and rights status |
| `access_offers` | `free`, `free_audit`, `freemium`, `library`, or `paid`; price/currency, region, login requirement, affiliate status, checked date |
| `attributions` | Required attribution text and attribution URL for a resource version |

Rights status is one of `open`, `permission_granted`, `link_only`, `unknown`, or
`restricted`. Only `open` and `permission_granted` resources may be mirrored in
object storage, and only within their allowed transformations and territories.
For `link_only`, store metadata, attribution, checksums if lawfully obtainable,
and the external link—never a copied payload.

Object keys are immutable and content-addressed:

```text
raw/{source_id}/{job_id}/{sha256}
resources/{resource_id}/{resource_version_id}/{sha256}.{ext}
evidence/rights/{resource_version_id}/{sha256}
submissions/{user_partition}/{attempt_id}/{sha256}
```

The database stores the object key, SHA-256, byte length, media type, and rights
decision. It never stores expiring signed URLs.

### Assessments and credentials

| Table | Important fields and purpose |
| --- | --- |
| `assessments` | Stable assessment identity and kind (`quiz`, `exam`, `project`, `lab`, `oral`, `portfolio`) |
| `assessment_versions` | Exact course/node placement, instructions, outcomes tested, attempt policy, grading mode, availability policy |
| `assessment_items` | Versioned questions/tasks; sensitive answer material is separated and role-protected |
| `rubrics` / `rubric_levels` | Criteria, weights, observable performance levels, and machine/human grading policy |
| `assessment_attempts` | User, exact version, cohort/run, state, opened/submitted/graded timestamps, score |
| `submissions` | Attempt artifact metadata and object-storage keys |
| `credential_definitions` | Issuer, credential type, criteria, recognition claim, expiration, public verification policy |
| `credential_awards` | User, exact definition version, evidence, issue/revoke dates, signed verification payload |

Course completion is a calculated learning record, not automatically a
credential. A credential award requires an explicit definition and issuer.
Externally accredited claims remain `unverified` until an editor records the
accreditor, jurisdiction, covered program/version, evidence URL, and expiry.

## 4. Stable IDs, slugs, and aliases

- Generate public IDs in the application as a type prefix plus UUIDv7, for
  example `crs_019c...`, `crv_019c...`, `res_019c...`. Store them as `TEXT` in
  both D1 and PostgreSQL so migration does not change identity.
- Never derive an ID from a title, URL, course code, or array position.
- `canonical_slug` is readable but mutable. `slug_aliases` stores
  `(entity_kind, entity_id, scope_id, locale, slug, is_canonical)` and preserves
  old slugs as permanent redirects.
- `external_identifiers` stores `(provider_id, entity_kind, scheme, value)` with
  a unique constraint. External IDs are evidence, not primary keys.
- The first EE seed receives IDs once in a checked-in import manifest. A
  deterministic import key such as `seed-ee-v1:course:EE101` maps to that ID;
  reruns upsert by the manifest key rather than regenerating records.

## 5. Localization

Identity is language-neutral. Every publishable version has a `base_locale`
using a BCP 47 tag. Typed locale tables—`program_version_locales`,
`course_version_locales`, `content_node_locales`,
`learning_object_version_locales`, and `assessment_version_locales`—hold
localized fields and:

- `locale`, `source_locale`, and `source_version_id`;
- `translation_method` (`author`, `human`, `machine`, `machine_reviewed`);
- `translation_status` (`draft`, `review`, `published`, `stale`);
- translator/reviewer IDs and timestamps.

When the source version changes, translations are marked stale by field-level
source hashes. Locale fallback is exact locale → base language → version base
locale; it is returned explicitly in the API so the UI never implies a fallback
is a translation. Assessments require separate linguistic and subject review.
Search creates one document per entity-version-locale and supports localized
synonyms, scripts, and right-to-left presentation metadata.

## 6. Prerequisite and equivalency graph

Prerequisites need more than a string array. Store a relational expression tree:

- `requirement_expressions`: root for a course version or program requirement.
- `requirement_nodes`: parent/child nodes of kind `all`, `any`, `course`,
  `competency`, `credits`, `placement`, or `permission`.
- Leaf fields include the target canonical ID, minimum version/result, whether
  concurrent enrollment is allowed, and `required` versus `recommended`.
- `course_dependency_edges` is a materialized projection of course leaves for
  fast traversal and visualization.

Publishing runs cycle detection on required course edges, rejects self-links,
checks that referenced versions are published, and reports unreachable program
terms. Recommended links may cycle but are flagged. Eligibility evaluation
returns a structured explanation of satisfied and missing nodes, not only a
boolean.

`course_equivalencies` records `from_course_version_id`,
`to_course_version_id`, coverage percentage, relation (`equivalent`,
`supersedes`, `partial`), evidence, and reviewer. It is used for transfer,
upgrades, and progress migration; title similarity never grants equivalence.

## 7. Deduplication without data loss

Deduplication runs in increasing cost:

1. exact provider external ID;
2. normalized canonical URL and redirect chain;
3. exact content SHA-256;
4. normalized ISBN/DOI/catalog code;
5. metadata fingerprint (provider, author, normalized title, duration/date);
6. semantic similarity as a review candidate only.

`duplicate_candidates` records both IDs, signals, score, decision, and reviewer.
An approved merge creates `entity_redirects(from_id, to_id, reason)` and moves
aliases/identifiers in one transaction. The losing ID remains resolvable, import
history remains intact, and published versions are not rewritten. “Same topic”
courses are related with `course_relations`, not merged; only the same real-world
course/resource should be deduplicated.

## 8. Publication and versioning

Mutable work follows `draft → in_review → approved → published → retired`.
Publishing is a transaction that:

1. validates required fields, references, graph constraints, locale, rights, and
   quality gates;
2. assigns the next immutable `version_no` and `published_at`;
3. pins referenced learning-object, resource, assessment, and course versions;
4. writes an `audit_events` record and one `outbox_events` row;
5. lets workers rebuild search documents, cache tags, and derived graph tables.

Changes are classified as `patch` (metadata/link repair), `minor` (content
improvement with unchanged outcomes), or `major` (changed outcomes,
prerequisites, workload, or assessment contract). Existing cohorts stay pinned.
A maintainer can offer, but never silently force, an upgrade with an equivalency
report.

## 9. Search

Search is a read model, not the catalog database. Each indexed document includes:

- stable entity ID, exact version ID, locale, title, summary, outcomes, and
  provider;
- school/discipline ancestry, level, workload, modality, credential type, and
  prerequisite count;
- resource media/access/license filters, region, language, accessibility, last
  link check, and quality score;
- popularity and completion aggregates with minimum privacy thresholds.

Phase 1 uses D1 FTS5 for titles, descriptions, provider names, and outcomes.
Phase 2 uses a dedicated engine such as OpenSearch or Typesense for typo
tolerance, facets, multilingual analyzers, and high-volume indexing. PostgreSQL
remains authoritative. `outbox_events` provides idempotent indexing; every
document carries `schema_version` and `source_revision`. A full reindex can be
built under a new alias and atomically swapped. Embeddings may rerank candidates
but cannot override rights, safety, locale, or availability filters.

## 10. User plans and progress

| Table | Purpose |
| --- | --- |
| `users` | Minimal account identity and preferences; auth-provider IDs live in a separate identity table |
| `study_plans` | User-owned plan with target pace, timezone, and optional pinned program version |
| `study_plan_items` | Course/version, desired order or term, status, target dates, and user notes |
| `enrollments` | User enrollment in a course version or scheduled course run |
| `learning_events` | Append-only events such as started, viewed, submitted, passed, waived, and completed |
| `object_progress` / `course_progress` | Rebuildable projections from learning events |
| `user_evidence` | Portfolio links, imported certificates, and reviewer state |

All progress events include `event_id`, actor, exact object/version, occurred
time, received time, source, and idempotency key. Progress projections apply
version-specific completion rules. Upgrading a course creates a visible mapping:
preserved, newly required, or no longer required work.

The existing anonymous localStorage progress is imported only after sign-in and
explicit consent. Keep the original browser data until the server confirms the
idempotent import. Users can export or delete personal records; aggregate
analytics must not make an individual identifiable.

## 11. Cohort and calendar engine

The scheduling model separates reusable policy from generated dates:

- `calendar_templates`: term shape, instructional weeks, reading weeks, exam
  windows, default meeting/due rules.
- `academic_terms`: named start/end dates and timezone.
- `cohorts`: program version, term/calendar, pace, capacity, facilitators.
- `course_runs`: exact course version offered to a cohort with enrollment and
  grading policy.
- `sessions`: live class/lab/review occurrences, recurrence rule, location/link.
- `assessment_windows`: open/due/close rules for midterms, finals, projects, and
  resits.
- `calendar_exceptions`: holidays, closures, and one-off changes.
- `user_schedule_overrides`: personal pacing and accommodations without
  mutating the cohort calendar.

Templates express rules such as “midterm after unit 5” or “due Friday 23:59 in
cohort timezone.” The engine materializes only a rolling date window and stores
the rule and generation revision. Every API datetime is ISO 8601 UTC plus the
IANA timezone used to calculate it. Conflict checks cover prerequisites,
overlapping exams, weekly workload, holidays, and required synchronous sessions.

## 12. Ingestion, review, and moderation

The ingestion pipeline is:

```text
source registration
  → fetch under robots/terms/rate limits
  → immutable raw record in object storage
  → parse and normalize
  → exact dedupe
  → probable-duplicate queue
  → provenance and rights decision
  → curriculum mapping
  → automated validation
  → subject/editorial review
  → publish transaction
  → search/cache projection
  → periodic link, access, and currency checks
```

Operational tables are `connectors`, `import_jobs`, `import_records`,
`validation_findings`, `review_tasks`, `review_decisions`, `audit_events`, and
`outbox_events`. Every job and record has a stable idempotency key. Retry only
failed records, quarantine malformed payloads, and retain the parser version so
an import is reproducible.

Roles are `contributor`, `subject_reviewer`, `rights_reviewer`, `editor`,
`moderator`, and `admin`. Authors cannot be the sole reviewer of their own
publish action. Reports, corrections, appeals, and takedowns enter the same
audited review queue. A takedown can immediately disable delivery while keeping
private evidence and referential history.

### Quality rubric

Each publishable resource/course version receives a 0–100 score with evidence:

| Dimension | Weight |
| --- | ---: |
| Technical correctness and cited claims | 25 |
| Alignment to declared outcomes and level | 20 |
| Provenance, authorship, and rights clarity | 15 |
| Instructional design and usable practice | 10 |
| Currency and maintenance plan | 10 |
| Accessibility (captions, text alternatives, format) | 10 |
| Link/reproduction reliability | 5 |
| Safety, privacy, and bias review | 5 |

Rights uncertainty, malware, fabricated provenance, answer leakage, or a known
high-severity factual error is a hard stop regardless of score. A core program
resource needs at least 80 and subject review. Scores 65–79 may appear as
supplemental material with visible caveats; lower scores remain unpublished.
Scores decay to “review due” based on discipline-specific freshness windows.

## 13. APIs and module boundaries

Keep one deployable application initially, with modules that own their tables:
`catalog`, `content`, `provenance`, `assessment`, `planning`, `calendar`,
`credential`, `ingestion`, `moderation`, and `search`. UI code calls application
services/repositories, never imports catalog arrays directly.

Public read API:

```text
GET /api/v1/schools
GET /api/v1/disciplines?school_id=...
GET /api/v1/programs/{program_id}/versions/{version_id}
GET /api/v1/courses/{course_id}/versions/{version_id}
GET /api/v1/courses/{course_id}/prerequisites
GET /api/v1/resources/{resource_id}
GET /api/v1/search?q=...&discipline=...&locale=...&access=free
```

Authenticated learner API:

```text
POST  /api/v1/plans
PATCH /api/v1/plans/{plan_id}
POST  /api/v1/plans/{plan_id}/items
POST  /api/v1/learning-events
GET   /api/v1/me/progress
POST  /api/v1/assessment-attempts
POST  /api/v1/local-progress-imports
```

Editor/internal API:

```text
POST /api/internal/v1/import-jobs
POST /api/internal/v1/review-tasks/{id}/decisions
POST /api/internal/v1/versions/{id}/publish
POST /api/internal/v1/entities/{id}/merge
```

Use OpenAPI as the contract. Read responses contain `id`, `version_id`,
`canonical_slug`, requested/resolved locale, provenance summary, rights/access
summary, and links. Use cursor pagination, `ETag`/`If-None-Match`, tagged cache
invalidation, and RFC 9457 problem responses. Mutation requests require an
`Idempotency-Key`; edits require `If-Match` with the current revision. Public,
learner, and editor endpoints have separate rate limits and authorization.

## 14. Migration from the original static v1

The original `app/data.ts` has moved to `content/seeds/ee-source-data.ts`; it is
a preserved seed source, not the database contract. Migration is additive and
reversible:

1. **Freeze and export — complete.** The source arrays are preserved beneath
   `content/seeds/`, converted into a validated publication bundle, and assigned
   checked-in IDs in `content/manifests/ee-identities.ts`.
2. **Map the content — complete for the publication contract.**
   - `Course` → `courses`, `course_versions`, codes, outcomes, prerequisite
     expressions.
   - `Semester.courseCodes` → one EE `program_version` and ordered
     `program_course_options`.
   - `Track` → program concentrations and course-option groups. Materialize
     track-specific placeholder titles as actual course records; do not keep
     runtime title substitution.
   - `Resource` → provider, resource/version, source record, access offer, and
     rights review.
   - `Cadence` → calendar template checkpoints.
   - `Assessment` → assessment/version and weighted rubric sections.
   - `LabRoute` → reusable lab learning-object collections and tool
     requirements.
   - `ProvenanceSource` → provider/source/evidence records.
3. **Introduce D1 — complete for immutable runtime publications.** Portable
   Drizzle tables and migrations cover versioned programs, courses,
   requirements, content, competencies, resources, access, rights, provenance,
   aliases, immutable bundle chunks, learner state, audit events, and outbox.
   Seeds are canonicalized, SHA-256 checked, idempotent, and immutable.
4. **Add a repository boundary — complete.** All routes use the asynchronous
   runtime repository; no renderer imports program data. D1 publications are
   reconstructed, validated, and field-level shadow-compared with checked-in
   sources. Static fallback occurs only when the D1 binding is absent, never
   when D1 data is corrupt or divergent.
5. **Move user state — complete for progress.** ChatGPT-authenticated learners
   receive D1-backed, version-pinned progress. Existing
   `course-atlas-progress-v2` data is imported only after an explicit merge or
   cloud-only choice; the import receipt and payload hash make retries
   idempotent. Device data remains the anonymous/offline cache.
6. **Add object storage.** Store raw imports, rights evidence, generated
   thumbnails, submissions, and only legally mirrorable resources. Backfill
   checksums before switching reads.
7. **Add search projection.** Start with D1 FTS; feed it from the transactional
   outbox and compare indexed counts/revisions.
8. **Cut over safely.** Run static and database read paths in shadow comparison,
   switch by feature flag, monitor errors/staleness, then remove the static
   runtime dependency after at least one verified release.

Use only portable primitives in the D1 schema: text IDs, ISO timestamps,
integers/booleans, explicit joins, and bounded JSON for non-queryable evidence.
That keeps the PostgreSQL migration mechanical.

## 15. Scale phases

### Phase 0 — universal static shell (complete)

- Use generic product concepts and prove them with three structurally different
  programs.
- Add the ID manifest, immutable version contract, and publication validators.
- Put all catalog access behind repository interfaces and use generic routes.
- No premature distributed system.

### Phase 1 — D1 + object storage, approximately 1–10,000 courses

- D1 holds catalog, small user plans, review workflow, FTS, and outbox.
- R2/S3-compatible storage holds immutable objects.
- Scheduled workers check links/access and process ingestion queues.
- CDN caches published version responses by immutable version ID.

### Phase 2 — PostgreSQL + dedicated search, approximately 10,000–500,000 courses

- PostgreSQL becomes the single write authority for catalog, workflow, and user
  state; use connection pooling and read replicas as needed.
- A dedicated search cluster receives idempotent outbox/CDC events.
- Object storage remains unchanged because keys and IDs are portable.
- D1 may serve exported public catalog snapshots at the edge, but is never a
  second write authority.
- Migrate in batches: snapshot, replay outbox after the watermark, verify
  counts/checksums, then move writes and reads behind feature flags.

### Phase 3 — global catalog, millions of versions and learning events

- Partition append-only learning events and ingestion records by time/account.
- Separate catalog authoring from public read projections.
- Queue connector work per provider with independent quotas and dead-letter
  handling.
- Shard search by locale/region only when query and index measurements require
  it.
- Build analytics from de-identified event exports, not production read
  queries.

Course count alone does not trigger a phase. Move when write contention, query
latency, index size, recovery time, or operational ownership crosses documented
service objectives.

## 16. Trust, accreditation, and affiliate safeguards

- Every program page states who assembled it, who (if anyone) recognizes it,
  and whether it is accredited. The default is “independent, non-accredited
  study pathway.”
- Platform-issued records use “completion record” or “badge,” never university
  credit, degree, diploma, licensed qualification, or guaranteed employment.
- Accreditation claims require jurisdiction-specific evidence, a verifier,
  scope, and expiry; expired evidence removes the claim automatically.
- Provider logos, names, course codes, and quotations are attributed and do not
  imply partnership. Provider pages distinguish `official`, `provider-claimed`,
  and `community-curated` records.
- External links show provider, access model, rights status, region/login
  limits, and last verified date. Broken or materially changed links are
  quarantined.
- Affiliate offers are stored explicitly, labeled before the click, and
  excluded from organic quality scoring. Ranking cannot be purchased.
  Sponsorship and editorial relationships are public, and equivalent
  non-affiliate/free options are not suppressed.
- Redirect endpoints allow malicious-link checks and disclosure but must not
  hide the final domain. Click analytics are minimal, consent-aware, and not
  sold as learner profiles.
- Publish a correction, appeal, copyright, and takedown process. Preserve audit
  evidence while promptly stopping disputed delivery when required.

## 17. Current implementation slice

The release now contains stable programs/program versions,
courses/course versions, requirement groups/options, arbitrary content units,
competencies and mappings, assessments, resources/resource versions,
licenses/access offers, provenance, slug aliases, audit/outbox events, and the
EE seed manifest. Computer Science proves a second complete six-term
degree-equivalent structure, while the non-degree spreadsheet sprint proves
that the model is not coupled to degrees or semesters.

The active runtime path now idempotently seeds checked-in publications into
D1, reads them through the D1 repository, verifies every publication against
the source shadow, and stores authenticated learner progress under immutable
version IDs. The next persistence slice is editorial authoring/import workflow,
not another read-path rewrite.

This slice proves universal identity, reuse, provenance, versioning,
requirements, arbitrary course shape, immutable persistence, cross-device
progress, and publication rules—the decisions that are expensive to retrofit
after thousands of courses have been ingested.
