import {
  CATALOG_READ_MODEL_VERSION,
  CATALOG_RELEASE_BUNDLE_COUNT,
  CATALOG_RELEASE_KEY,
  CATALOG_RELEASE_MANIFEST_SHA256,
} from "../../content/catalog-release";
import { catalogPublicationLock } from "../../content/manifests/catalog-publication-lock";
import type {
  CourseCode,
  ProgramKind,
  ProgramVersionId,
  PublishedProgramBundle,
} from "../domain/catalog";
import { resolveLearnerPath } from "../domain/learner-path";
import { validateCatalogBundles } from "../domain/validation";
import { canonicalJson, sha256Hex } from "./canonical-json";
import {
  assertD1Success,
  d1All,
  d1Batch,
  type D1DatabaseLike,
} from "./d1-contract";
import type {
  CatalogCourseSearchQuery,
  CatalogCourseSearchResult,
  CatalogPage,
  CatalogProgramPageQuery,
  CatalogProgramSummary,
  CatalogStats,
} from "./repository";
import { CatalogValidationError, StaticCatalogRepository } from "./static-repository";

const PROGRAM_PAGE_DEFAULT = 24;
const COURSE_PAGE_DEFAULT = 25;
const PAGE_LIMIT_MAXIMUM = 100;
const CATALOG_CURSOR_MAXIMUM = 2_048;
const QUERY_TEXT_MAXIMUM = 120;
const FILTER_TEXT_MAXIMUM = 160;

const PROGRAM_KINDS = new Set<ProgramKind>([
  "degree-equivalent pathway",
  "certificate pathway",
  "course sequence",
  "independent study",
]);

const COURSE_FORMATS = new Set<
  PublishedProgramBundle["courseVersions"][number]["format"]
>([
  "theory",
  "laboratory",
  "studio",
  "seminar",
  "capstone",
  "short course",
]);

type CourseFormat = PublishedProgramBundle["courseVersions"][number]["format"];

interface BundleSourceRow {
  readonly id: string;
  readonly payload_hash: string;
}

interface VersionRow {
  readonly program_id: string;
  readonly program_version_id: string;
  readonly semantic_version: string;
  readonly is_superseded: number;
}

interface ProgramReadRow {
  readonly program_id: string;
  readonly program_version_id: string;
  readonly canonical_slug: string;
  readonly semantic_version: string;
  readonly title: string;
  readonly school: string;
  readonly discipline: string;
  readonly kind: string;
  readonly credential_label: string;
  readonly summary: string;
  readonly nominal_duration: string;
  readonly nominal_hours: number;
  readonly course_count: number;
  readonly available_course_count: number;
  readonly learning_unit_count: number;
  readonly resource_count: number;
  readonly published_at: string;
  readonly title_sort_key: string;
}

interface CourseReadRow {
  readonly program_id: string;
  readonly program_version_id: string;
  readonly program_canonical_slug: string;
  readonly program_title: string;
  readonly course_id: string;
  readonly course_version_id: string;
  readonly canonical_slug: string;
  readonly semantic_version: string;
  readonly primary_code: string | null;
  readonly codes_json: string;
  readonly title: string;
  readonly summary: string;
  readonly discipline: string;
  readonly format: string;
  readonly nominal_hours: number;
  readonly title_sort_key: string;
}

interface AggregateRow {
  readonly active_program_count: number;
  readonly minimum_path_course_count: number;
  readonly learning_unit_count: number;
  readonly nominal_hours: number;
  readonly school_count: number;
}

interface StatsRow extends AggregateRow {
  readonly bundle_count: number;
  readonly projection_version: number;
  readonly projected_at: string;
}

export class CatalogQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogQueryError";
  }
}

function compareSemanticVersions(left: string, right: string) {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = leftParts[index] - rightParts[index];
    if (difference !== 0) return difference;
  }
  return 0;
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokenize(value: string) {
  return [...new Set(normalizeSearchText(value).split(" ").filter(Boolean))];
}

function parseLimit(value: number | undefined, fallback: number) {
  const limit = value ?? fallback;
  if (!Number.isInteger(limit) || limit < 1 || limit > PAGE_LIMIT_MAXIMUM) {
    throw new CatalogQueryError(
      `limit must be an integer from 1 to ${PAGE_LIMIT_MAXIMUM}.`,
    );
  }
  return limit;
}

function cleanFilter(value: string | undefined, label: string) {
  if (value === undefined) return undefined;
  if (
    value.length === 0 ||
    value.length > FILTER_TEXT_MAXIMUM ||
    value !== value.trim() ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    throw new CatalogQueryError(`${label} is invalid.`);
  }
  return value;
}

function cleanQuery(value: string | undefined) {
  if (value === undefined) return undefined;
  if (
    value.length === 0 ||
    value.length > QUERY_TEXT_MAXIMUM ||
    value !== value.trim() ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    throw new CatalogQueryError("q is invalid.");
  }
  const normalized = normalizeSearchText(value);
  if (!normalized) throw new CatalogQueryError("q is invalid.");
  return normalized;
}

function cleanCursorValue(value: string | undefined) {
  if (value === undefined) return undefined;
  if (
    value.length === 0 ||
    value.length > CATALOG_CURSOR_MAXIMUM ||
    !/^[A-Za-z0-9_-]+$/u.test(value)
  ) {
    throw new CatalogQueryError("cursor is invalid.");
  }
  return value;
}

function cleanProgramVersionId(value: string | undefined) {
  if (value === undefined) return undefined;
  if (!/^prv_[A-Za-z0-9][A-Za-z0-9._-]{0,179}$/.test(value)) {
    throw new CatalogQueryError("programVersionId is invalid.");
  }
  return value as ProgramVersionId;
}

function encodeCursor(parts: readonly string[]) {
  const bytes = new TextEncoder().encode(JSON.stringify(parts));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function decodeCursor(value: string, expectedKind: "program" | "course") {
  if (
    value.length === 0 ||
    value.length > CATALOG_CURSOR_MAXIMUM ||
    !/^[A-Za-z0-9_-]+$/u.test(value)
  ) {
    throw new CatalogQueryError("cursor is invalid.");
  }
  try {
    const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    ) as unknown;
    if (
      !Array.isArray(parsed) ||
      parsed.length !== (expectedKind === "program" ? 4 : 5) ||
      parsed.some((part) => typeof part !== "string" || part.length > 1_024) ||
      parsed[0] !== expectedKind
    ) {
      throw new Error("shape");
    }
    return parsed as string[];
  } catch {
    throw new CatalogQueryError("cursor is invalid.");
  }
}

function programFingerprint(query: Omit<NormalizedProgramQuery, "limit" | "cursor">) {
  return canonicalJson(query);
}

function courseFingerprint(query: Omit<NormalizedCourseQuery, "limit" | "cursor">) {
  return canonicalJson(query);
}

interface NormalizedProgramQuery {
  readonly limit: number;
  readonly cursor?: string;
  readonly q?: string;
  readonly school?: string;
  readonly discipline?: string;
  readonly kind?: ProgramKind;
}

interface NormalizedCourseQuery {
  readonly limit: number;
  readonly cursor?: string;
  readonly q?: string;
  readonly programVersionId?: ProgramVersionId;
  readonly discipline?: string;
  readonly format?: CourseFormat;
}

export function normalizeProgramPageQuery(
  query: CatalogProgramPageQuery,
): NormalizedProgramQuery {
  const kind = cleanFilter(query.kind, "kind") as ProgramKind | undefined;
  if (kind !== undefined && !PROGRAM_KINDS.has(kind)) {
    throw new CatalogQueryError("kind is invalid.");
  }
  const normalized = {
    limit: parseLimit(query.limit, PROGRAM_PAGE_DEFAULT),
    ...(query.cursor === undefined
      ? {}
      : { cursor: cleanCursorValue(query.cursor) }),
    ...(query.q === undefined ? {} : { q: cleanQuery(query.q) }),
    ...(query.school === undefined
      ? {}
      : { school: cleanFilter(query.school, "school") }),
    ...(query.discipline === undefined
      ? {}
      : { discipline: cleanFilter(query.discipline, "discipline") }),
    ...(kind === undefined ? {} : { kind }),
  } satisfies NormalizedProgramQuery;
  return normalized;
}

export function normalizeCourseSearchQuery(
  query: CatalogCourseSearchQuery,
): NormalizedCourseQuery {
  const format = cleanFilter(query.format, "format") as CourseFormat | undefined;
  if (format !== undefined && !COURSE_FORMATS.has(format)) {
    throw new CatalogQueryError("format is invalid.");
  }
  const normalized = {
    limit: parseLimit(query.limit, COURSE_PAGE_DEFAULT),
    ...(query.cursor === undefined
      ? {}
      : { cursor: cleanCursorValue(query.cursor) }),
    ...(query.q === undefined ? {} : { q: cleanQuery(query.q) }),
    ...(query.programVersionId === undefined
      ? {}
      : { programVersionId: cleanProgramVersionId(query.programVersionId) }),
    ...(query.discipline === undefined
      ? {}
      : { discipline: cleanFilter(query.discipline, "discipline") }),
    ...(format === undefined ? {} : { format }),
  } satisfies NormalizedCourseQuery;
  return normalized;
}

function parseSearchParams(
  searchParams: URLSearchParams,
  allowed: ReadonlySet<string>,
) {
  for (const key of searchParams.keys()) {
    if (!allowed.has(key)) throw new CatalogQueryError(`Unknown query parameter: ${key}.`);
    if (searchParams.getAll(key).length !== 1) {
      throw new CatalogQueryError(`Query parameter ${key} must appear once.`);
    }
  }
}

function parseRawLimit(value: string | null) {
  if (value === null) return undefined;
  if (!/^[1-9]\d{0,2}$/u.test(value)) {
    throw new CatalogQueryError("limit must be a positive integer.");
  }
  return Number(value);
}

export function parseProgramPageSearchParams(
  searchParams: URLSearchParams,
): CatalogProgramPageQuery {
  parseSearchParams(
    searchParams,
    new Set(["limit", "cursor", "q", "school", "discipline", "kind"]),
  );
  return normalizeProgramPageQuery({
    limit: parseRawLimit(searchParams.get("limit")),
    cursor: searchParams.get("cursor") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    school: searchParams.get("school") ?? undefined,
    discipline: searchParams.get("discipline") ?? undefined,
    kind: (searchParams.get("kind") ?? undefined) as ProgramKind | undefined,
  });
}

export function parseCourseSearchParams(
  searchParams: URLSearchParams,
): CatalogCourseSearchQuery {
  parseSearchParams(
    searchParams,
    new Set([
      "limit",
      "cursor",
      "q",
      "programVersionId",
      "discipline",
      "format",
    ]),
  );
  return normalizeCourseSearchQuery({
    limit: parseRawLimit(searchParams.get("limit")),
    cursor: searchParams.get("cursor") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    programVersionId: (searchParams.get("programVersionId") ?? undefined) as
      | ProgramVersionId
      | undefined,
    discipline: searchParams.get("discipline") ?? undefined,
    format: (searchParams.get("format") ?? undefined) as CourseFormat | undefined,
  });
}

function programSummary(bundle: PublishedProgramBundle) {
  const summary = new StaticCatalogRepository([bundle]).listPrograms()[0];
  if (!summary) {
    throw new CatalogValidationError([
      `Bundle ${bundle.id} did not produce a program summary.`,
    ]);
  }
  return summary;
}

function courseTerms(
  bundle: PublishedProgramBundle,
  course: PublishedProgramBundle["courses"][number],
  version: PublishedProgramBundle["courseVersions"][number],
) {
  const weightedFields: ReadonlyArray<
    readonly [field: "title" | "code" | "slug" | "discipline" | "summary" | "outcome", value: string, weight: number]
  > = [
    ["title", version.title, 10],
    ["title", bundle.programVersion.title, 6],
    ["code", course.codes.map((code) => `${code.namespace} ${code.value}`).join(" "), 9],
    ["slug", course.canonicalSlug, 8],
    ["discipline", course.discipline, 5],
    ["summary", version.summary, 2],
    ["outcome", version.outcomes.join(" "), 3],
  ];
  const byIdentity = new Map<string, { term: string; field: string; weight: number }>();
  for (const [field, value, weight] of weightedFields) {
    for (const term of tokenize(value).slice(0, 32)) {
      byIdentity.set(`${term}\u0000${field}`, { term, field, weight });
    }
  }
  if (byIdentity.size === 0) {
    byIdentity.set(`${normalizeSearchText(bundle.programVersion.title)}\u0000title`, {
      term: normalizeSearchText(bundle.programVersion.title),
      field: "title",
      weight: 1,
    });
  }
  return [...byIdentity.values()];
}

async function sourceHashes(
  database: D1DatabaseLike,
  bundles: readonly PublishedProgramBundle[],
) {
  const results = await d1Batch(
    database,
    bundles.map((bundle) =>
      database
        .prepare("SELECT id, payload_hash FROM catalog_bundles WHERE id = ?")
        .bind(bundle.id),
    ),
    "load catalog projection sources",
  );
  const hashes = new Map<string, string>();
  for (let index = 0; index < bundles.length; index += 1) {
    const bundle = bundles[index];
    const rows = (results[index].results ?? []) as readonly BundleSourceRow[];
    const calculatedHash = await sha256Hex(canonicalJson(bundle));
    if (
      rows.length !== 1 ||
      rows[0].id !== bundle.id ||
      rows[0].payload_hash !== calculatedHash
    ) {
      throw new CatalogValidationError([
        `Bundle ${bundle.id} must be stored immutably with its exact payload hash before projection.`,
      ]);
    }
    hashes.set(bundle.id, calculatedHash);
  }
  return hashes;
}

async function activeVersionIds(
  database: D1DatabaseLike,
  bundles: readonly PublishedProgramBundle[],
) {
  const programIds = [...new Set(bundles.map((bundle) => bundle.program.id))];
  const placeholders = programIds.map(() => "?").join(", ");
  const rows = await d1All<VersionRow>(
    database
      .prepare(
        `SELECT b.program_id, b.program_version_id, b.semantic_version,
                CASE WHEN s.retired_program_id IS NULL THEN 0 ELSE 1 END AS is_superseded
         FROM catalog_bundles b
         LEFT JOIN catalog_program_supersessions s
           ON s.retired_program_id = b.program_id
         WHERE b.program_id IN (${placeholders})`,
      )
      .bind(...programIds),
    "resolve active catalog projection versions",
  );
  const active = new Map<string, string | undefined>();
  for (const programId of programIds) {
    const versions = rows.filter((row) => row.program_id === programId);
    if (versions.some((row) => Boolean(row.is_superseded))) {
      active.set(programId, undefined);
      continue;
    }
    versions.sort((left, right) =>
      compareSemanticVersions(right.semantic_version, left.semantic_version),
    );
    active.set(programId, versions[0]?.program_version_id);
  }
  return active;
}

async function readCatalogAggregates(database: D1DatabaseLike) {
  const row = await database
    .prepare(
      `SELECT
         COUNT(*) AS active_program_count,
         COALESCE(SUM(course_count), 0) AS minimum_path_course_count,
         COALESCE(SUM(learning_unit_count), 0) AS learning_unit_count,
         COALESCE(SUM(nominal_hours), 0) AS nominal_hours,
         COUNT(DISTINCT school) AS school_count
       FROM catalog_program_summaries
       WHERE is_active = 1`,
    )
    .first<AggregateRow>();
  if (!row) throw new CatalogValidationError(["Catalog aggregate query returned no row."]);
  return row;
}

export async function refreshCatalogProjectionStats(database: D1DatabaseLike) {
  const aggregate = await readCatalogAggregates(database);
  const result = await database
    .prepare(
      `UPDATE catalog_projection_state SET
         active_program_count = ?,
         minimum_path_course_count = ?,
         learning_unit_count = ?,
         nominal_hours = ?,
         school_count = ?,
         projected_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      aggregate.active_program_count,
      aggregate.minimum_path_course_count,
      aggregate.learning_unit_count,
      aggregate.nominal_hours,
      aggregate.school_count,
    )
    .run();
  assertD1Success(result, "refresh catalog projection aggregates");
  return aggregate;
}

/** Rebuilds disposable indexed rows from exact immutable publication payloads. */
export async function projectCatalogReadModels(
  database: D1DatabaseLike,
  bundles: readonly PublishedProgramBundle[],
): Promise<void> {
  if (bundles.length === 0) return;
  const validation = validateCatalogBundles(bundles);
  if (!validation.valid) {
    throw new CatalogValidationError(
      validation.issues.map((issue) => `${issue.path}: ${issue.message}`),
    );
  }
  const hashes = await sourceHashes(database, bundles);
  const activeByProgram = await activeVersionIds(database, bundles);

  for (const bundle of bundles) {
    const hash = hashes.get(bundle.id);
    if (!hash) throw new CatalogValidationError([`Missing hash for ${bundle.id}.`]);
    const summary = programSummary(bundle);
    const path = resolveLearnerPath(bundle);
    if (!path.isResolved) {
      throw new CatalogValidationError(
        path.diagnostics.map((diagnostic) => diagnostic.message),
      );
    }
    const titleSortKey = normalizeSearchText(bundle.programVersion.title);
    const summaryResult = await database
      .prepare(
        `INSERT INTO catalog_program_summaries (
           program_version_id, bundle_id, program_id, canonical_slug,
           semantic_version, title, short_title, school, discipline, kind,
           credential_label, lifecycle, summary, nominal_duration, nominal_hours,
           course_count, available_course_count, learning_unit_count,
           assessment_count, resource_count, concentration_count, published_at,
           is_active, title_sort_key, search_text, source_payload_hash,
           projection_version, rebuilt_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(program_version_id) DO UPDATE SET
           bundle_id = excluded.bundle_id,
           program_id = excluded.program_id,
           canonical_slug = excluded.canonical_slug,
           semantic_version = excluded.semantic_version,
           title = excluded.title,
           short_title = excluded.short_title,
           school = excluded.school,
           discipline = excluded.discipline,
           kind = excluded.kind,
           credential_label = excluded.credential_label,
           lifecycle = excluded.lifecycle,
           summary = excluded.summary,
           nominal_duration = excluded.nominal_duration,
           nominal_hours = excluded.nominal_hours,
           course_count = excluded.course_count,
           available_course_count = excluded.available_course_count,
           learning_unit_count = excluded.learning_unit_count,
           assessment_count = excluded.assessment_count,
           resource_count = excluded.resource_count,
           concentration_count = excluded.concentration_count,
           published_at = excluded.published_at,
           is_active = 0,
           title_sort_key = excluded.title_sort_key,
           search_text = excluded.search_text,
           source_payload_hash = excluded.source_payload_hash,
           projection_version = excluded.projection_version,
           rebuilt_at = CURRENT_TIMESTAMP`,
      )
      .bind(
        bundle.programVersion.id,
        bundle.id,
        bundle.program.id,
        bundle.program.canonicalSlug,
        bundle.programVersion.version,
        bundle.programVersion.title,
        bundle.program.shortTitle ?? null,
        bundle.program.school,
        bundle.program.discipline,
        bundle.program.kind,
        bundle.programVersion.credentialLabel,
        bundle.program.lifecycle,
        bundle.programVersion.summary,
        bundle.programVersion.nominalDuration,
        summary.nominalHours,
        summary.courseCount,
        summary.availableCourseCount,
        summary.learningUnitCount,
        path.totals.assessmentCount,
        summary.resourceCount,
        bundle.concentrations.length,
        bundle.programVersion.publishedAt,
        titleSortKey,
        normalizeSearchText(
          [
            bundle.programVersion.title,
            bundle.program.shortTitle,
            bundle.program.canonicalSlug,
            bundle.program.school,
            bundle.program.discipline,
          ]
            .filter(Boolean)
            .join(" "),
        ),
        hash,
        CATALOG_READ_MODEL_VERSION,
      )
      .run();
    assertD1Success(summaryResult, `project catalog summary ${bundle.id}`);

    const deleteResult = await database
      .prepare("DELETE FROM catalog_course_search_rows WHERE program_version_id = ?")
      .bind(bundle.programVersion.id)
      .run();
    assertD1Success(deleteResult, `clear catalog course projection ${bundle.id}`);

    const courseById = new Map(bundle.courses.map((course) => [course.id, course]));
    for (let position = 0; position < bundle.courseVersions.length; position += 1) {
      const version = bundle.courseVersions[position];
      const course = courseById.get(version.courseId);
      if (!course) {
        throw new CatalogValidationError([
          `Course version ${version.id} references missing course ${version.courseId}.`,
        ]);
      }
      const primaryCode = course.codes[0]?.value;
      const courseResult = await database
        .prepare(
          `INSERT INTO catalog_course_search_rows (
             program_version_id, course_version_id, bundle_id, program_id,
             program_canonical_slug, program_title, course_id, canonical_slug,
             semantic_version, primary_code, codes_json, title, summary,
             discipline, format, nominal_hours, position, is_active,
             title_sort_key, code_sort_key, search_text, source_payload_hash,
             projection_version, rebuilt_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        )
        .bind(
          bundle.programVersion.id,
          version.id,
          bundle.id,
          bundle.program.id,
          bundle.program.canonicalSlug,
          bundle.programVersion.title,
          course.id,
          course.canonicalSlug,
          version.version,
          primaryCode ?? null,
          canonicalJson(course.codes),
          version.title,
          version.summary,
          course.discipline,
          version.format,
          version.nominalHours,
          position,
          normalizeSearchText(version.title),
          primaryCode ? normalizeSearchText(primaryCode) : null,
          normalizeSearchText(
            [
              version.title,
              course.canonicalSlug,
              course.discipline,
              course.codes.map((code) => `${code.namespace} ${code.value}`).join(" "),
              version.summary,
            ].join(" "),
          ),
          hash,
          CATALOG_READ_MODEL_VERSION,
        )
        .run();
      assertD1Success(courseResult, `project catalog course ${version.id}`);

      const terms = courseTerms(bundle, course, version);
      for (let offset = 0; offset < terms.length; offset += 14) {
        const chunk = terms.slice(offset, offset + 14);
        const placeholders = chunk.map(() => "(?, ?, ?, ?, ?)").join(", ");
        const termResult = await database
          .prepare(
            `INSERT INTO catalog_course_search_terms (
               program_version_id, course_version_id, term, field, weight
             ) VALUES ${placeholders}`,
          )
          .bind(
            ...chunk.flatMap((term) => [
              bundle.programVersion.id,
              version.id,
              term.term,
              term.field,
              term.weight,
            ]),
          )
          .run();
        assertD1Success(termResult, `project catalog search terms ${version.id}`);
      }
    }
  }

  const activationStatements = [...activeByProgram.entries()].flatMap(
    ([programId, activeProgramVersionId]) => [
      database
        .prepare(
          `UPDATE catalog_program_summaries
           SET is_active = CASE WHEN program_version_id = ? AND lifecycle = 'active' THEN 1 ELSE 0 END
           WHERE program_id = ?`,
        )
        .bind(activeProgramVersionId ?? "", programId),
      database
        .prepare(
          `UPDATE catalog_course_search_rows
           SET is_active = CASE WHEN program_version_id = ? THEN 1 ELSE 0 END
           WHERE program_id = ?`,
        )
        .bind(activeProgramVersionId ?? "", programId),
    ],
  );
  await d1Batch(database, activationStatements, "activate catalog projections");
  await refreshCatalogProjectionStats(database);
  await database.prepare("PRAGMA optimize").run();
}

/** Marks the compact checked-in release only after exact bundle/hash verification. */
export async function markCatalogReleaseProjectionCurrent(
  database: D1DatabaseLike,
): Promise<boolean> {
  const results = await d1Batch(
    database,
    catalogPublicationLock.map((record) =>
      database
        .prepare(
          `SELECT b.id, b.payload_hash, s.source_payload_hash, s.projection_version
           FROM catalog_bundles b
           LEFT JOIN catalog_program_summaries s ON s.bundle_id = b.id
           WHERE b.id = ?`,
        )
        .bind(record.bundleId),
    ),
    "verify checked-in catalog release projection",
  );
  const matches = catalogPublicationLock.every((record, index) => {
    const rows = (results[index].results ?? []) as ReadonlyArray<{
      id: string;
      payload_hash: string;
      source_payload_hash: string | null;
      projection_version: number | null;
    }>;
    return (
      rows.length === 1 &&
      rows[0].id === record.bundleId &&
      rows[0].payload_hash === record.canonicalSha256 &&
      rows[0].source_payload_hash === record.canonicalSha256 &&
      rows[0].projection_version === CATALOG_READ_MODEL_VERSION
    );
  });
  if (!matches || catalogPublicationLock.length !== CATALOG_RELEASE_BUNDLE_COUNT) {
    return false;
  }
  const aggregate = await readCatalogAggregates(database);
  const result = await database
    .prepare(
      `INSERT INTO catalog_projection_state (
         release_key, manifest_hash, bundle_count, active_program_count,
         minimum_path_course_count, learning_unit_count, nominal_hours,
         school_count, projection_version, projected_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(release_key) DO UPDATE SET
         manifest_hash = excluded.manifest_hash,
         bundle_count = excluded.bundle_count,
         active_program_count = excluded.active_program_count,
         minimum_path_course_count = excluded.minimum_path_course_count,
         learning_unit_count = excluded.learning_unit_count,
         nominal_hours = excluded.nominal_hours,
         school_count = excluded.school_count,
         projection_version = excluded.projection_version,
         projected_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      CATALOG_RELEASE_KEY,
      CATALOG_RELEASE_MANIFEST_SHA256,
      CATALOG_RELEASE_BUNDLE_COUNT,
      aggregate.active_program_count,
      aggregate.minimum_path_course_count,
      aggregate.learning_unit_count,
      aggregate.nominal_hours,
      aggregate.school_count,
      CATALOG_READ_MODEL_VERSION,
    )
    .run();
  assertD1Success(result, "mark checked-in catalog projection current");
  return true;
}

export async function getD1CatalogStats(
  database: D1DatabaseLike,
): Promise<CatalogStats | undefined> {
  const row = await database
    .prepare(
      `SELECT bundle_count, active_program_count, minimum_path_course_count,
              learning_unit_count, nominal_hours, school_count,
              projection_version, projected_at
       FROM catalog_projection_state
       WHERE release_key = ?`,
    )
    .bind(CATALOG_RELEASE_KEY)
    .first<StatsRow>();
  if (!row) return undefined;
  return {
    bundleCount: row.bundle_count,
    activeProgramCount: row.active_program_count,
    minimumPathCourseCount: row.minimum_path_course_count,
    learningUnitCount: row.learning_unit_count,
    nominalHours: row.nominal_hours,
    schoolCount: row.school_count,
    projectionVersion: row.projection_version,
    projectedAt: row.projected_at,
  };
}

function mapProgramRow(row: ProgramReadRow): CatalogProgramSummary {
  if (!/^\d+\.\d+\.\d+$/u.test(row.semantic_version) || !PROGRAM_KINDS.has(row.kind as ProgramKind)) {
    throw new CatalogValidationError([`Invalid projected program ${row.program_version_id}.`]);
  }
  return {
    programId: row.program_id as CatalogProgramSummary["programId"],
    slug: row.canonical_slug,
    title: row.title,
    school: row.school,
    discipline: row.discipline,
    kind: row.kind as ProgramKind,
    credentialLabel: row.credential_label,
    summary: row.summary,
    nominalDuration: row.nominal_duration,
    latestVersion: row.semantic_version as CatalogProgramSummary["latestVersion"],
    publishedAt: row.published_at,
    courseCount: row.course_count,
    availableCourseCount: row.available_course_count,
    learningUnitCount: row.learning_unit_count,
    resourceCount: row.resource_count,
    nominalHours: row.nominal_hours,
  };
}

export async function listD1ProgramPage(
  database: D1DatabaseLike,
  input: CatalogProgramPageQuery = {},
): Promise<CatalogPage<CatalogProgramSummary>> {
  const query = normalizeProgramPageQuery(input);
  const fingerprint = programFingerprint({
    ...(query.q ? { q: query.q } : {}),
    ...(query.school ? { school: query.school } : {}),
    ...(query.discipline ? { discipline: query.discipline } : {}),
    ...(query.kind ? { kind: query.kind } : {}),
  });
  const clauses = ["s.is_active = 1"];
  const values: unknown[] = [];
  let withClause = "";
  let joinClause = "";
  if (query.q) {
    const terms = tokenize(query.q).slice(0, 5);
    const termClauses = terms.slice(1).map(
      (_, index) =>
        `EXISTS (
           SELECT 1 FROM catalog_course_search_terms p${index + 1}
           WHERE p${index + 1}.program_version_id = p0.program_version_id
             AND p${index + 1}.field = 'title' AND p${index + 1}.weight = 6
             AND p${index + 1}.term >= ? AND p${index + 1}.term < ?
         )`,
    );
    withClause = `WITH program_matches AS (
      SELECT DISTINCT p0.program_version_id
      FROM catalog_course_search_terms p0
      WHERE p0.field = 'title' AND p0.weight = 6
        AND p0.term >= ? AND p0.term < ?
      ${termClauses.length > 0 ? `AND ${termClauses.join(" AND ")}` : ""}
    )`;
    for (const term of terms) values.push(term, `${term}\uffff`);
    joinClause =
      "JOIN program_matches pm ON pm.program_version_id = s.program_version_id";
  }
  if (query.school) {
    clauses.push("s.school = ?");
    values.push(query.school);
  }
  if (query.discipline) {
    clauses.push("s.discipline = ?");
    values.push(query.discipline);
  }
  if (query.kind) {
    clauses.push("s.kind = ?");
    values.push(query.kind);
  }
  if (query.cursor) {
    const cursor = decodeCursor(query.cursor, "program");
    if (cursor[1] !== fingerprint || !cursor[3].startsWith("prv_")) {
      throw new CatalogQueryError("cursor does not belong to this query.");
    }
    clauses.push("(s.title_sort_key > ? OR (s.title_sort_key = ? AND s.program_version_id > ?))");
    values.push(cursor[2], cursor[2], cursor[3]);
  }
  const rows = await d1All<ProgramReadRow>(
    database
      .prepare(
        `${withClause}
         SELECT s.program_id, s.program_version_id, s.canonical_slug,
                s.semantic_version, s.title, s.school, s.discipline, s.kind,
                s.credential_label, s.summary, s.nominal_duration,
                s.nominal_hours, s.course_count, s.available_course_count,
                s.learning_unit_count, s.resource_count, s.published_at,
                s.title_sort_key
         FROM catalog_program_summaries s
         ${joinClause}
         WHERE ${clauses.join(" AND ")}
         ORDER BY s.title_sort_key, s.program_version_id
         LIMIT ?`,
      )
      .bind(...values, query.limit + 1),
    "list catalog program page",
  );
  const hasMore = rows.length > query.limit;
  const visible = rows.slice(0, query.limit);
  const last = visible.at(-1);
  return {
    items: visible.map(mapProgramRow),
    ...(hasMore && last
      ? { nextCursor: encodeCursor(["program", fingerprint, last.title_sort_key, last.program_version_id]) }
      : {}),
  };
}

function parseCodes(value: string, courseVersionId: string): readonly CourseCode[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (
      !Array.isArray(parsed) ||
      !parsed.every(
        (code) =>
          code &&
          typeof code === "object" &&
          !Array.isArray(code) &&
          typeof (code as { namespace?: unknown }).namespace === "string" &&
          typeof (code as { value?: unknown }).value === "string",
      )
    ) {
      throw new Error("shape");
    }
    return parsed as readonly CourseCode[];
  } catch {
    throw new CatalogValidationError([
      `Projected course ${courseVersionId} has invalid codes_json.`,
    ]);
  }
}

function mapCourseRow(row: CourseReadRow): CatalogCourseSearchResult {
  if (!/^\d+\.\d+\.\d+$/u.test(row.semantic_version) || !COURSE_FORMATS.has(row.format as CourseFormat)) {
    throw new CatalogValidationError([`Invalid projected course ${row.course_version_id}.`]);
  }
  return {
    programId: row.program_id as CatalogCourseSearchResult["programId"],
    programVersionId: row.program_version_id as ProgramVersionId,
    programSlug: row.program_canonical_slug,
    programTitle: row.program_title,
    courseId: row.course_id as CatalogCourseSearchResult["courseId"],
    courseVersionId: row.course_version_id as CatalogCourseSearchResult["courseVersionId"],
    slug: row.canonical_slug,
    version: row.semantic_version as CatalogCourseSearchResult["version"],
    ...(row.primary_code ? { primaryCode: row.primary_code } : {}),
    codes: parseCodes(row.codes_json, row.course_version_id),
    title: row.title,
    summary: row.summary,
    discipline: row.discipline,
    format: row.format as CourseFormat,
    nominalHours: row.nominal_hours,
  };
}

export async function searchD1Courses(
  database: D1DatabaseLike,
  input: CatalogCourseSearchQuery = {},
): Promise<CatalogPage<CatalogCourseSearchResult>> {
  const query = normalizeCourseSearchQuery(input);
  const fingerprint = courseFingerprint({
    ...(query.q ? { q: query.q } : {}),
    ...(query.programVersionId ? { programVersionId: query.programVersionId } : {}),
    ...(query.discipline ? { discipline: query.discipline } : {}),
    ...(query.format ? { format: query.format } : {}),
  });
  const clauses: string[] = [];
  const values: unknown[] = [];
  let withClause = "";
  let joinClause = "";
  if (query.q) {
    const terms = tokenize(query.q).slice(0, 5);
    const termClauses = terms.slice(1).map(
      (_, index) =>
        `EXISTS (
           SELECT 1 FROM catalog_course_search_terms q${index + 1}
           WHERE q${index + 1}.program_version_id = q0.program_version_id
             AND q${index + 1}.course_version_id = q0.course_version_id
             AND q${index + 1}.term >= ? AND q${index + 1}.term < ?
         )`,
    );
    withClause = `WITH matches AS (
      SELECT DISTINCT q0.program_version_id, q0.course_version_id
      FROM catalog_course_search_terms q0
      WHERE q0.term >= ? AND q0.term < ?
      ${termClauses.length > 0 ? `AND ${termClauses.join(" AND ")}` : ""}
    )`;
    for (const term of terms) values.push(term, `${term}\uffff`);
    joinClause = `JOIN matches m
      ON m.program_version_id = r.program_version_id
     AND m.course_version_id = r.course_version_id`;
  }
  if (query.programVersionId) {
    clauses.push("r.program_version_id = ?");
    values.push(query.programVersionId);
  } else {
    clauses.push("r.is_active = 1");
  }
  if (query.discipline) {
    clauses.push("r.discipline = ?");
    values.push(query.discipline);
  }
  if (query.format) {
    clauses.push("r.format = ?");
    values.push(query.format);
  }
  if (query.cursor) {
    const cursor = decodeCursor(query.cursor, "course");
    if (
      cursor[1] !== fingerprint ||
      !cursor[3].startsWith("prv_") ||
      !cursor[4].startsWith("crv_")
    ) {
      throw new CatalogQueryError("cursor does not belong to this query.");
    }
    clauses.push(
      `(r.title_sort_key > ? OR
        (r.title_sort_key = ? AND r.program_version_id > ?) OR
        (r.title_sort_key = ? AND r.program_version_id = ? AND r.course_version_id > ?))`,
    );
    values.push(cursor[2], cursor[2], cursor[3], cursor[2], cursor[3], cursor[4]);
  }
  const rows = await d1All<CourseReadRow>(
    database
      .prepare(
        `${withClause}
         SELECT r.program_id, r.program_version_id, r.program_canonical_slug,
                r.program_title, r.course_id, r.course_version_id,
                r.canonical_slug, r.semantic_version, r.primary_code,
                r.codes_json, r.title, r.summary, r.discipline, r.format,
                r.nominal_hours, r.title_sort_key
         FROM catalog_course_search_rows r
         ${joinClause}
         WHERE ${clauses.join(" AND ")}
         ORDER BY r.title_sort_key, r.program_version_id, r.course_version_id
         LIMIT ?`,
      )
      .bind(...values, query.limit + 1),
    "search catalog courses",
  );
  const hasMore = rows.length > query.limit;
  const visible = rows.slice(0, query.limit);
  const last = visible.at(-1);
  return {
    items: visible.map(mapCourseRow),
    ...(hasMore && last
      ? {
          nextCursor: encodeCursor([
            "course",
            fingerprint,
            last.title_sort_key,
            last.program_version_id,
            last.course_version_id,
          ]),
        }
      : {}),
  };
}

export function listStaticProgramPage(
  repository: StaticCatalogRepository | { listPrograms(): readonly CatalogProgramSummary[] },
  input: CatalogProgramPageQuery = {},
): CatalogPage<CatalogProgramSummary> {
  const query = normalizeProgramPageQuery(input);
  const fingerprint = programFingerprint({
    ...(query.q ? { q: query.q } : {}),
    ...(query.school ? { school: query.school } : {}),
    ...(query.discipline ? { discipline: query.discipline } : {}),
    ...(query.kind ? { kind: query.kind } : {}),
  });
  let cursorSort = "";
  let cursorId = "";
  if (query.cursor) {
    const cursor = decodeCursor(query.cursor, "program");
    if (cursor[1] !== fingerprint) throw new CatalogQueryError("cursor does not belong to this query.");
    [, , cursorSort, cursorId] = cursor;
  }
  const rows = repository
    .listPrograms()
    .filter((summary) => {
      if (!query.q) return true;
      const candidates = tokenize(
        [
          summary.title,
          summary.slug,
          summary.school,
          summary.discipline,
        ].join(" "),
      );
      return tokenize(query.q).every((term) =>
        candidates.some((candidate) => candidate.startsWith(term)),
      );
    })
    .filter((summary) => !query.school || summary.school === query.school)
    .filter((summary) => !query.discipline || summary.discipline === query.discipline)
    .filter((summary) => !query.kind || summary.kind === query.kind)
    .map((summary) => ({ summary, sort: normalizeSearchText(summary.title), id: summary.latestVersion + summary.programId }))
    .sort((left, right) => left.sort.localeCompare(right.sort) || left.id.localeCompare(right.id))
    .filter((row) => !query.cursor || row.sort > cursorSort || (row.sort === cursorSort && row.id > cursorId));
  const visible = rows.slice(0, query.limit);
  const last = visible.at(-1);
  return {
    items: visible.map((row) => row.summary),
    ...(rows.length > query.limit && last
      ? { nextCursor: encodeCursor(["program", fingerprint, last.sort, last.id]) }
      : {}),
  };
}

export function staticCatalogStats(
  repository: { listPrograms(): readonly CatalogProgramSummary[]; listVersions(slug: string): readonly unknown[] },
): CatalogStats {
  const programs = repository.listPrograms();
  return {
    bundleCount: programs.reduce((total, program) => total + repository.listVersions(program.slug).length, 0),
    activeProgramCount: programs.length,
    minimumPathCourseCount: programs.reduce((total, program) => total + program.courseCount, 0),
    learningUnitCount: programs.reduce((total, program) => total + program.learningUnitCount, 0),
    nominalHours: programs.reduce((total, program) => total + program.nominalHours, 0),
    schoolCount: new Set(programs.map((program) => program.school)).size,
    projectionVersion: CATALOG_READ_MODEL_VERSION,
    projectedAt: "static",
  };
}

export function staticCourseSearchResults(
  bundles: readonly PublishedProgramBundle[],
  input: CatalogCourseSearchQuery = {},
): CatalogPage<CatalogCourseSearchResult> {
  const query = normalizeCourseSearchQuery(input);
  const fingerprint = courseFingerprint({
    ...(query.q ? { q: query.q } : {}),
    ...(query.programVersionId ? { programVersionId: query.programVersionId } : {}),
    ...(query.discipline ? { discipline: query.discipline } : {}),
    ...(query.format ? { format: query.format } : {}),
  });
  const latestByProgram = new Map<string, PublishedProgramBundle>();
  for (const bundle of bundles) {
    const existing = latestByProgram.get(bundle.program.id);
    if (!existing || compareSemanticVersions(bundle.programVersion.version, existing.programVersion.version) > 0) {
      latestByProgram.set(bundle.program.id, bundle);
    }
  }
  const selectedBundles = query.programVersionId
    ? bundles.filter((bundle) => bundle.programVersion.id === query.programVersionId)
    : [...latestByProgram.values()];
  const queryTerms = query.q ? tokenize(query.q).slice(0, 5) : [];
  let rows = selectedBundles.flatMap((bundle) => {
    const courses = new Map(bundle.courses.map((course) => [course.id, course]));
    return bundle.courseVersions.flatMap((version) => {
      const course = courses.get(version.courseId);
      if (!course) return [];
      const terms = courseTerms(bundle, course, version).map((term) => term.term);
      if (queryTerms.some((term) => !terms.some((candidate) => candidate.startsWith(term)))) return [];
      if (query.discipline && course.discipline !== query.discipline) return [];
      if (query.format && version.format !== query.format) return [];
      const result: CatalogCourseSearchResult = {
        programId: bundle.program.id,
        programVersionId: bundle.programVersion.id,
        programSlug: bundle.program.canonicalSlug,
        programTitle: bundle.programVersion.title,
        courseId: course.id,
        courseVersionId: version.id,
        slug: course.canonicalSlug,
        version: version.version,
        ...(course.codes[0]?.value ? { primaryCode: course.codes[0].value } : {}),
        codes: course.codes,
        title: version.title,
        summary: version.summary,
        discipline: course.discipline,
        format: version.format,
        nominalHours: version.nominalHours,
      };
      return [{ result, sort: normalizeSearchText(version.title) }];
    });
  });
  rows.sort(
    (left, right) =>
      left.sort.localeCompare(right.sort) ||
      left.result.programVersionId.localeCompare(right.result.programVersionId) ||
      left.result.courseVersionId.localeCompare(right.result.courseVersionId),
  );
  if (query.cursor) {
    const cursor = decodeCursor(query.cursor, "course");
    if (cursor[1] !== fingerprint) throw new CatalogQueryError("cursor does not belong to this query.");
    rows = rows.filter(
      (row) =>
        row.sort > cursor[2] ||
        (row.sort === cursor[2] && row.result.programVersionId > cursor[3]) ||
        (row.sort === cursor[2] &&
          row.result.programVersionId === cursor[3] &&
          row.result.courseVersionId > cursor[4]),
    );
  }
  const visible = rows.slice(0, query.limit);
  const last = visible.at(-1);
  return {
    items: visible.map((row) => row.result),
    ...(rows.length > query.limit && last
      ? {
          nextCursor: encodeCursor([
            "course",
            fingerprint,
            last.sort,
            last.result.programVersionId,
            last.result.courseVersionId,
          ]),
        }
      : {}),
  };
}
