import type {
  ProgramId,
  ProgramVersionId,
  PublishedProgramBundle,
  SemanticVersion,
} from "../domain/catalog";
import {
  validateCatalogBundles,
  validatePublishedProgramBundle,
} from "../domain/validation";
import { canonicalJson, sha256Hex } from "./canonical-json";
import {
  d1All,
  d1Batch,
  MAX_D1_BATCH_STATEMENTS,
  type D1DatabaseLike,
  type D1ResultLike,
} from "./d1-contract";
import type {
  CatalogCourseSearchQuery,
  CatalogCourseSearchResult,
  CatalogPage,
  CatalogProgramPageQuery,
  CatalogProgramSummary,
  CatalogRepository,
  CatalogStats,
} from "./repository";
import {
  getD1CatalogStats,
  listD1ProgramPage,
  listStaticProgramPage,
  searchD1Courses,
  staticCatalogStats,
  staticCourseSearchResults,
} from "./catalog-read-model";
import {
  CatalogValidationError,
  StaticCatalogRepository,
} from "./static-repository";

export interface AsyncCatalogRepository {
  listPrograms(): Promise<readonly CatalogProgramSummary[]>;
  listProgramPage(
    query?: CatalogProgramPageQuery,
  ): Promise<CatalogPage<CatalogProgramSummary>>;
  searchCourses(
    query?: CatalogCourseSearchQuery,
  ): Promise<CatalogPage<CatalogCourseSearchResult>>;
  getCatalogStats(): Promise<CatalogStats | undefined>;
  listVersions(slug: string): Promise<readonly SemanticVersion[]>;
  loadBySlug(
    slug: string,
    version?: SemanticVersion,
  ): Promise<PublishedProgramBundle | undefined>;
  loadByProgramId(
    programId: ProgramId,
    version?: SemanticVersion,
  ): Promise<PublishedProgramBundle | undefined>;
  loadByProgramVersionId(
    programVersionId: ProgramVersionId,
  ): Promise<PublishedProgramBundle | undefined>;
}

export interface CatalogSeedResult {
  readonly inserted: number;
  readonly unchanged: number;
  readonly bundleIds: readonly string[];
}

interface CatalogBundleRow {
  readonly id: string;
  readonly schema_version: number;
  readonly program_id: string;
  readonly program_version_id: string;
  readonly canonical_slug: string;
  readonly semantic_version: string;
  readonly published_at: string;
  readonly payload_hash: string;
  readonly summary_json: string;
}

interface CatalogPayloadChunkRow {
  readonly bundle_id: string;
  readonly chunk_index: number;
  readonly payload_chunk: string;
}

interface CatalogSummaryRow {
  readonly program_id: string;
  readonly canonical_slug: string;
  readonly semantic_version: string;
  readonly summary_json: string;
}

interface CatalogVersionRow {
  readonly program_id: string;
  readonly semantic_version: string;
}

interface PreparedBundleSeed {
  readonly bundle: PublishedProgramBundle;
  readonly payloadJson: string;
  readonly payloadChunks: readonly string[];
  readonly payloadHash: string;
  readonly summary: CatalogProgramSummary;
  readonly summaryJson: string;
}

export class CatalogDataError extends Error {
  constructor(
    readonly context: string,
    readonly problems: readonly string[],
  ) {
    super(
      `Invalid catalog data in D1 (${context}):\n${problems
        .map((problem) => `- ${problem}`)
        .join("\n")}`,
    );
    this.name = "CatalogDataError";
  }
}

export class CatalogSeedConflictError extends Error {
  constructor(
    readonly bundleId: string,
    readonly differences: readonly string[],
  ) {
    super(
      `Catalog seed conflict for ${bundleId}:\n${differences
        .map((difference) => `- ${difference}`)
        .join("\n")}`,
    );
    this.name = "CatalogSeedConflictError";
  }
}

export function compareSemanticVersions(
  left: SemanticVersion,
  right: SemanticVersion,
): number {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = leftParts[index] - rightParts[index];
    if (difference !== 0) return difference;
  }
  return 0;
}

function isSemanticVersion(value: string): value is SemanticVersion {
  return /^\d+\.\d+\.\d+$/.test(value);
}

function parseJson(value: unknown, context: string): unknown {
  if (typeof value !== "string") {
    throw new CatalogDataError(context, [
      `Expected JSON text, received ${value === null ? "null" : typeof value}.`,
    ]);
  }
  try {
    return JSON.parse(value) as unknown;
  } catch (error) {
    throw new CatalogDataError(context, [
      `JSON parsing failed: ${error instanceof Error ? error.message : String(error)}`,
    ]);
  }
}

function isCatalogProgramSummary(
  value: unknown,
): value is CatalogProgramSummary {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const summary = value as Record<string, unknown>;
  const strings = [
    "programId",
    "slug",
    "title",
    "school",
    "discipline",
    "kind",
    "credentialLabel",
    "summary",
    "nominalDuration",
    "latestVersion",
    "publishedAt",
  ];
  const numbers = [
    "courseCount",
    "availableCourseCount",
    "learningUnitCount",
    "resourceCount",
    "nominalHours",
  ];
  return (
    strings.every((key) => typeof summary[key] === "string") &&
    numbers.every(
      (key) =>
        typeof summary[key] === "number" &&
        Number.isFinite(summary[key] as number),
    ) &&
    isSemanticVersion(summary.latestVersion as string)
  );
}

function deepFreeze<Value>(value: Value): Value {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}

function assertValidCatalogSet(bundles: readonly PublishedProgramBundle[]) {
  const result = validateCatalogBundles(bundles);
  if (!result.valid) {
    throw new CatalogValidationError(
      result.issues.map((issue) => `${issue.path}: ${issue.message}`),
    );
  }
}

function summaryFor(bundle: PublishedProgramBundle): CatalogProgramSummary {
  const summary = new StaticCatalogRepository([bundle]).listPrograms()[0];
  if (!summary) {
    throw new CatalogValidationError([
      `Bundle ${bundle.id} did not produce a program summary.`,
    ]);
  }
  return summary;
}

async function prepareSeed(
  bundle: PublishedProgramBundle,
): Promise<PreparedBundleSeed> {
  const result = validatePublishedProgramBundle(bundle);
  if (!result.valid) {
    throw new CatalogValidationError(
      result.issues.map((issue) => `${issue.path}: ${issue.message}`),
    );
  }
  const payloadJson = canonicalJson(bundle);
  const summary = summaryFor(bundle);
  return {
    bundle,
    payloadJson,
    payloadChunks: chunkUtf8(payloadJson),
    payloadHash: await sha256Hex(payloadJson),
    summary,
    summaryJson: canonicalJson(summary),
  };
}

const BUNDLE_ROW_COLUMNS = `
  id,
  schema_version,
  program_id,
  program_version_id,
  canonical_slug,
  semantic_version,
  published_at,
  payload_hash,
  summary_json
`;

const MAX_PAYLOAD_CHUNK_BYTES = 240_000;

/**
 * D1 rows currently allow 2 MB, but publications are chunked far below that
 * ceiling so growth in one curriculum cannot make a seed undeployable.
 */
export function chunkUtf8(
  value: string,
  maximumBytes = MAX_PAYLOAD_CHUNK_BYTES,
): readonly string[] {
  if (!Number.isInteger(maximumBytes) || maximumBytes <= 0) {
    throw new RangeError("maximumBytes must be a positive integer.");
  }
  if (value.length === 0) return [""];

  const encoder = new TextEncoder();
  const chunks: string[] = [];
  let start = 0;
  while (start < value.length) {
    let end = Math.min(value.length, start + maximumBytes);
    if (
      end < value.length &&
      /[\uD800-\uDBFF]/.test(value[end - 1]) &&
      /[\uDC00-\uDFFF]/.test(value[end])
    ) {
      end -= 1;
    }
    let chunk = value.slice(start, end);
    let byteLength = encoder.encode(chunk).byteLength;
    while (byteLength > maximumBytes) {
      const codeUnits = end - start;
      end =
        start +
        Math.max(1, Math.floor((codeUnits * maximumBytes) / byteLength));
      if (
        end < value.length &&
        /[\uD800-\uDBFF]/.test(value[end - 1]) &&
        /[\uDC00-\uDFFF]/.test(value[end])
      ) {
        end -= 1;
      }
      chunk = value.slice(start, end);
      byteLength = encoder.encode(chunk).byteLength;
    }
    chunks.push(chunk);
    start = end;
  }
  return chunks;
}

function rowsFromBatchResult<Row>(
  result: D1ResultLike,
): readonly Row[] {
  return (result.results ?? []) as readonly Row[];
}

function seedDifferences(
  rows: readonly CatalogBundleRow[],
  prepared: PreparedBundleSeed,
): readonly string[] {
  if (rows.length === 0) return ["No row was written."];
  if (rows.length > 1) {
    return [
      `Identity lookup returned ${rows.length} rows; bundle ID, program version, and semantic version no longer identify one publication.`,
    ];
  }

  const row = rows[0];
  const expected: Readonly<Record<string, string | number>> = {
    id: prepared.bundle.id,
    schema_version: prepared.bundle.schemaVersion,
    program_id: prepared.bundle.program.id,
    program_version_id: prepared.bundle.programVersion.id,
    canonical_slug: prepared.bundle.program.canonicalSlug,
    semantic_version: prepared.bundle.programVersion.version,
    published_at: prepared.bundle.publishedAt,
    payload_hash: prepared.payloadHash,
    summary_json: prepared.summaryJson,
  };
  const actual = row as unknown as Record<string, unknown>;
  const differences = Object.entries(expected)
    .filter(([key, value]) => actual[key] !== value)
    .map(
      ([key, value]) =>
        `${key} expected ${JSON.stringify(value)}, found ${JSON.stringify(actual[key])}.`,
    );

  return differences;
}

function identityLookup(database: D1DatabaseLike, seed: PreparedBundleSeed) {
  return database
    .prepare(
      `SELECT ${BUNDLE_ROW_COLUMNS}
       FROM catalog_bundles
       WHERE id = ?
          OR program_version_id = ?
          OR (program_id = ? AND semantic_version = ?)`,
    )
    .bind(
      seed.bundle.id,
      seed.bundle.programVersion.id,
      seed.bundle.program.id,
      seed.bundle.programVersion.version,
    );
}

/**
 * Inserts immutable publications. Re-running the same exact bundle is a no-op;
 * reusing an identity for changed content is a hard, actionable conflict.
 */
export async function seedPublishedProgramBundles(
  database: D1DatabaseLike,
  bundles: readonly PublishedProgramBundle[],
): Promise<CatalogSeedResult> {
  assertValidCatalogSet(bundles);
  const prepared = await Promise.all(bundles.map(prepareSeed));

  const preflight = await d1Batch(
    database,
    prepared.map((seed) => identityLookup(database, seed)),
    "catalog seed preflight",
  );
  const missing: PreparedBundleSeed[] = [];
  let unchanged = 0;

  prepared.forEach((seed, index) => {
    const rows = rowsFromBatchResult<CatalogBundleRow>(preflight[index]);
    if (rows.length === 0) {
      missing.push(seed);
      return;
    }
    const differences = seedDifferences(rows, seed);
    if (differences.length > 0) {
      throw new CatalogSeedConflictError(seed.bundle.id, differences);
    }
    unchanged += 1;
  });

  const insertionBatches: Array<ReturnType<D1DatabaseLike["prepare"]>[]> = [];
  let insertionBatch: ReturnType<D1DatabaseLike["prepare"]>[] = [];
  for (const seed of missing) {
    const publicationStatements = [
      database
        .prepare(
          `INSERT INTO catalog_bundles (
             id,
             schema_version,
             program_id,
             program_version_id,
             canonical_slug,
             semantic_version,
             published_at,
             payload_hash,
             summary_json
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT DO NOTHING`,
        )
        .bind(
          seed.bundle.id,
          seed.bundle.schemaVersion,
          seed.bundle.program.id,
          seed.bundle.programVersion.id,
          seed.bundle.program.canonicalSlug,
          seed.bundle.programVersion.version,
          seed.bundle.publishedAt,
          seed.payloadHash,
          seed.summaryJson,
        ),
      ...seed.payloadChunks.map((payloadChunk, chunkIndex) =>
        database
          .prepare(
            `INSERT INTO catalog_bundle_payload_chunks (
               bundle_id,
               chunk_index,
               payload_chunk
             )
             SELECT ?, ?, ?
             WHERE EXISTS (
               SELECT 1
               FROM catalog_bundles
               WHERE id = ? AND payload_hash = ?
             )
             ON CONFLICT DO NOTHING`,
          )
          .bind(
            seed.bundle.id,
            chunkIndex,
            payloadChunk,
            seed.bundle.id,
            seed.payloadHash,
          ),
      ),
    ];
    if (publicationStatements.length > MAX_D1_BATCH_STATEMENTS) {
      throw new CatalogValidationError([
        `Bundle ${seed.bundle.id} requires ${publicationStatements.length} atomic insert statements; the supported maximum is ${MAX_D1_BATCH_STATEMENTS}. Split the publication into smaller reusable bundles.`,
      ]);
    }
    if (
      insertionBatch.length > 0 &&
      insertionBatch.length + publicationStatements.length >
        MAX_D1_BATCH_STATEMENTS
    ) {
      insertionBatches.push(insertionBatch);
      insertionBatch = [];
    }
    insertionBatch.push(...publicationStatements);
  }
  if (insertionBatch.length > 0) insertionBatches.push(insertionBatch);
  for (let index = 0; index < insertionBatches.length; index += 1) {
    await d1Batch(
      database,
      insertionBatches[index],
      `catalog seed insert batch ${index + 1}`,
    );
  }

  const verification = await d1Batch(
    database,
    prepared.map((seed) => identityLookup(database, seed)),
    "catalog seed verification",
  );
  prepared.forEach((seed, index) => {
    const differences = seedDifferences(
      rowsFromBatchResult<CatalogBundleRow>(verification[index]),
      seed,
    );
    if (differences.length > 0) {
      throw new CatalogSeedConflictError(seed.bundle.id, differences);
    }
  });

  return {
    inserted: missing.length,
    unchanged,
    bundleIds: prepared.map((seed) => seed.bundle.id),
  };
}

async function parseBundleRow(
  row: CatalogBundleRow,
  payloadJson: string,
): Promise<PublishedProgramBundle> {
  const context = `catalog_bundles.${row.id}`;
  const payload = parseJson(payloadJson, `${context}.payload_json`);
  const canonicalPayload = canonicalJson(payload);
  const calculatedHash = await sha256Hex(canonicalPayload);
  const problems: string[] = [];

  if (canonicalPayload !== payloadJson) {
    problems.push("payload_json is not in canonical JSON form.");
  }
  if (calculatedHash !== row.payload_hash) {
    problems.push(
      `payload_hash expected ${calculatedHash}, found ${row.payload_hash}.`,
    );
  }

  const bundle = payload as PublishedProgramBundle;
  let validBundle = false;
  try {
    const validation = validatePublishedProgramBundle(bundle);
    validBundle = validation.valid;
    if (!validation.valid) {
      problems.push(
        ...validation.issues.map(
          (issue) => `${issue.path}: ${issue.message}`,
        ),
      );
    }
  } catch (error) {
    problems.push(
      `Bundle validation could not read the payload shape: ${
        error instanceof Error ? error.message : String(error)
      }.`,
    );
  }
  if (validBundle) {
    const metadata: ReadonlyArray<
      readonly [label: string, actual: unknown, expected: unknown]
    > = [
      ["id", row.id, bundle.id],
      ["schema_version", row.schema_version, bundle.schemaVersion],
      ["program_id", row.program_id, bundle.program.id],
      ["program_version_id", row.program_version_id, bundle.programVersion.id],
      ["canonical_slug", row.canonical_slug, bundle.program.canonicalSlug],
      [
        "semantic_version",
        row.semantic_version,
        bundle.programVersion.version,
      ],
      ["published_at", row.published_at, bundle.publishedAt],
    ];
    problems.push(
      ...metadata
        .filter(([, actual, expected]) => actual !== expected)
        .map(
          ([label, actual, expected]) =>
            `${label} is ${JSON.stringify(actual)} but payload contains ${JSON.stringify(expected)}.`,
        ),
    );
  }

  if (problems.length > 0) throw new CatalogDataError(context, problems);
  return deepFreeze(bundle);
}

function parseSummaryRow(row: CatalogSummaryRow): CatalogProgramSummary {
  const context = `catalog_bundles summary ${row.program_id}@${row.semantic_version}`;
  const parsed = parseJson(row.summary_json, context);
  if (!isCatalogProgramSummary(parsed)) {
    throw new CatalogDataError(context, [
      "summary_json does not match CatalogProgramSummary.",
    ]);
  }
  const problems: string[] = [];
  if (parsed.programId !== row.program_id) {
    problems.push(
      `summary programId ${parsed.programId} does not match ${row.program_id}.`,
    );
  }
  if (parsed.slug !== row.canonical_slug) {
    problems.push(
      `summary slug ${parsed.slug} does not match ${row.canonical_slug}.`,
    );
  }
  if (parsed.latestVersion !== row.semantic_version) {
    problems.push(
      `summary version ${parsed.latestVersion} does not match ${row.semantic_version}.`,
    );
  }
  if (problems.length > 0) throw new CatalogDataError(context, problems);
  return deepFreeze(parsed);
}

function latestBundle(
  bundles: readonly PublishedProgramBundle[],
): PublishedProgramBundle | undefined {
  return [...bundles].sort((left, right) =>
    compareSemanticVersions(
      right.programVersion.version,
      left.programVersion.version,
    ),
  )[0];
}

export class D1CatalogRepository implements AsyncCatalogRepository {
  constructor(readonly database: D1DatabaseLike) {}

  async listProgramPage(query: CatalogProgramPageQuery = {}) {
    return listD1ProgramPage(this.database, query);
  }

  async searchCourses(query: CatalogCourseSearchQuery = {}) {
    return searchD1Courses(this.database, query);
  }

  async getCatalogStats() {
    return getD1CatalogStats(this.database);
  }

  async listPrograms(): Promise<readonly CatalogProgramSummary[]> {
    const rows = await d1All<CatalogSummaryRow>(
      this.database.prepare(
        `SELECT program_id, canonical_slug, semantic_version, summary_json
         FROM catalog_bundles
         WHERE NOT EXISTS (
           SELECT 1
           FROM catalog_program_supersessions
           WHERE retired_program_id = catalog_bundles.program_id
         )`,
      ),
      "list catalog programs",
    );
    const latest = new Map<string, CatalogProgramSummary>();
    const slugOwners = new Map<string, string>();

    for (const row of rows) {
      if (!isSemanticVersion(row.semantic_version)) {
        throw new CatalogDataError(
          `catalog_bundles summary ${row.program_id}`,
          [`Invalid semantic version ${JSON.stringify(row.semantic_version)}.`],
        );
      }
      const owner = slugOwners.get(row.canonical_slug);
      if (owner && owner !== row.program_id) {
        throw new CatalogDataError("catalog_bundles slugs", [
          `Slug ${row.canonical_slug} belongs to both ${owner} and ${row.program_id}.`,
        ]);
      }
      slugOwners.set(row.canonical_slug, row.program_id);

      const summary = parseSummaryRow(row);
      const existing = latest.get(row.program_id);
      if (
        !existing ||
        compareSemanticVersions(
          summary.latestVersion,
          existing.latestVersion,
        ) > 0
      ) {
        latest.set(row.program_id, summary);
      }
    }

    return [...latest.values()].sort((left, right) =>
      left.title.localeCompare(right.title),
    );
  }

  async listVersions(slug: string): Promise<readonly SemanticVersion[]> {
    const rows = await d1All<CatalogVersionRow>(
      this.database
        .prepare(
          `SELECT program_id, semantic_version
           FROM catalog_bundles
           WHERE canonical_slug = ?
             AND NOT EXISTS (
               SELECT 1
               FROM catalog_program_supersessions
               WHERE retired_program_id = catalog_bundles.program_id
             )`,
        )
        .bind(slug),
      `list versions for ${slug}`,
    );
    const owners = new Set(rows.map((row) => row.program_id));
    if (owners.size > 1) {
      throw new CatalogDataError(`catalog slug ${slug}`, [
        `Slug resolves to multiple programs: ${[...owners].join(", ")}.`,
      ]);
    }
    return rows
      .map((row) => {
        if (!isSemanticVersion(row.semantic_version)) {
          throw new CatalogDataError(`catalog slug ${slug}`, [
            `Invalid semantic version ${JSON.stringify(row.semantic_version)}.`,
          ]);
        }
        return row.semantic_version;
      })
      .sort((left, right) => compareSemanticVersions(right, left));
  }

  async loadBySlug(
    slug: string,
    version?: SemanticVersion,
  ): Promise<PublishedProgramBundle | undefined> {
    const resolvedVersion = version ?? (await this.listVersions(slug))[0];
    if (!resolvedVersion) return undefined;
    return latestBundle(
      await this.loadRows(
        this.database
          .prepare(
            `SELECT ${BUNDLE_ROW_COLUMNS}
             FROM catalog_bundles
             WHERE canonical_slug = ?
               AND NOT EXISTS (
                 SELECT 1
                 FROM catalog_program_supersessions
                 WHERE retired_program_id = catalog_bundles.program_id
             )
               AND semantic_version = ?`,
          )
          .bind(slug, resolvedVersion),
        `load catalog slug ${slug}`,
      ),
    );
  }

  async loadByProgramId(
    programId: ProgramId,
    version?: SemanticVersion,
  ): Promise<PublishedProgramBundle | undefined> {
    const resolvedVersion =
      version ?? (await this.listVersionsByProgramId(programId))[0];
    if (!resolvedVersion) return undefined;
    return latestBundle(
      await this.loadRows(
        this.database
          .prepare(
            `SELECT ${BUNDLE_ROW_COLUMNS}
             FROM catalog_bundles
             WHERE program_id = ?
               AND semantic_version = ?`,
          )
          .bind(programId, resolvedVersion),
        `load catalog program ${programId}`,
      ),
    );
  }

  private async listVersionsByProgramId(
    programId: ProgramId,
  ): Promise<readonly SemanticVersion[]> {
    const rows = await d1All<CatalogVersionRow>(
      this.database
        .prepare(
          `SELECT program_id, semantic_version
           FROM catalog_bundles
           WHERE program_id = ?`,
        )
        .bind(programId),
      `list versions for catalog program ${programId}`,
    );
    return rows
      .map((row) => {
        if (!isSemanticVersion(row.semantic_version)) {
          throw new CatalogDataError(`catalog program ${programId}`, [
            `Invalid semantic version ${JSON.stringify(row.semantic_version)}.`,
          ]);
        }
        return row.semantic_version;
      })
      .sort((left, right) => compareSemanticVersions(right, left));
  }

  async loadByProgramVersionId(
    programVersionId: ProgramVersionId,
  ): Promise<PublishedProgramBundle | undefined> {
    const bundles = await this.loadRows(
      this.database
        .prepare(
          `SELECT ${BUNDLE_ROW_COLUMNS}
           FROM catalog_bundles
           WHERE program_version_id = ?`,
        )
        .bind(programVersionId),
      `load catalog program version ${programVersionId}`,
    );
    if (bundles.length > 1) {
      throw new CatalogDataError(
        `catalog program version ${programVersionId}`,
        [`Expected at most one bundle, found ${bundles.length}.`],
      );
    }
    return bundles[0];
  }

  async loadAll(): Promise<readonly PublishedProgramBundle[]> {
    return this.loadRows(
      this.database.prepare(
        `SELECT ${BUNDLE_ROW_COLUMNS}
         FROM catalog_bundles
         WHERE NOT EXISTS (
           SELECT 1
           FROM catalog_program_supersessions
           WHERE retired_program_id = catalog_bundles.program_id
         )`,
      ),
      "load complete catalog",
    );
  }

  private async loadRows(
    statement: ReturnType<D1DatabaseLike["prepare"]>,
    operation: string,
  ): Promise<readonly PublishedProgramBundle[]> {
    const rows = await d1All<CatalogBundleRow>(statement, operation);
    const chunksByBundle = await this.loadPayloadChunks(
      rows.map((row) => row.id),
      operation,
    );
    const bundles = await Promise.all(
      rows.map((row) =>
        parseBundleRow(
          row,
          this.assemblePayload(row.id, chunksByBundle.get(row.id) ?? []),
        ),
      ),
    );
    const validation = validateCatalogBundles(bundles);
    if (!validation.valid) {
      throw new CatalogDataError(
        operation,
        validation.issues.map(
          (issue) => `${issue.path}: ${issue.message}`,
        ),
      );
    }
    return bundles;
  }

  private async loadPayloadChunks(
    bundleIds: readonly string[],
    operation: string,
  ): Promise<Map<string, CatalogPayloadChunkRow[]>> {
    const byBundle = new Map<string, CatalogPayloadChunkRow[]>();
    const statements = [];
    for (let offset = 0; offset < bundleIds.length; offset += 100) {
      const ids = bundleIds.slice(offset, offset + 100);
      const placeholders = ids.map(() => "?").join(", ");
      statements.push(
        this.database
          .prepare(
            `SELECT bundle_id, chunk_index, payload_chunk
             FROM catalog_bundle_payload_chunks
             WHERE bundle_id IN (${placeholders})
             ORDER BY bundle_id, chunk_index`,
          )
          .bind(...ids),
      );
    }
    const results = await d1Batch(
      this.database,
      statements,
      `${operation} payload chunks`,
    );
    for (const result of results) {
      for (const row of rowsFromBatchResult<CatalogPayloadChunkRow>(result)) {
        byBundle.set(row.bundle_id, [
          ...(byBundle.get(row.bundle_id) ?? []),
          row,
        ]);
      }
    }
    return byBundle;
  }

  private assemblePayload(
    bundleId: string,
    chunks: readonly CatalogPayloadChunkRow[],
  ): string {
    if (chunks.length === 0) {
      throw new CatalogDataError(`catalog_bundles.${bundleId}`, [
        "No payload chunks exist.",
      ]);
    }
    const ordered = [...chunks].sort(
      (left, right) => left.chunk_index - right.chunk_index,
    );
    ordered.forEach((chunk, index) => {
      if (chunk.chunk_index !== index) {
        throw new CatalogDataError(`catalog_bundles.${bundleId}`, [
          `Payload chunk sequence expected ${index}, found ${chunk.chunk_index}.`,
        ]);
      }
      if (typeof chunk.payload_chunk !== "string") {
        throw new CatalogDataError(`catalog_bundles.${bundleId}`, [
          `Payload chunk ${index} is not text.`,
        ]);
      }
    });
    return ordered.map((chunk) => chunk.payload_chunk).join("");
  }
}

export class AsyncStaticCatalogRepository implements AsyncCatalogRepository {
  constructor(readonly staticRepository: CatalogRepository) {}

  async listPrograms() {
    return this.staticRepository.listPrograms();
  }

  async listProgramPage(query: CatalogProgramPageQuery = {}) {
    return listStaticProgramPage(this.staticRepository, query);
  }

  async searchCourses(query: CatalogCourseSearchQuery = {}) {
    return staticCourseSearchResults(
      collectStaticCatalogBundles(this.staticRepository),
      query,
    );
  }

  async getCatalogStats() {
    return staticCatalogStats(this.staticRepository);
  }

  async listVersions(slug: string) {
    return this.staticRepository.listVersions(slug);
  }

  async loadBySlug(slug: string, version?: SemanticVersion) {
    return this.staticRepository.loadBySlug(slug, version);
  }

  async loadByProgramId(programId: ProgramId, version?: SemanticVersion) {
    return this.staticRepository.loadByProgramId(programId, version);
  }

  async loadByProgramVersionId(programVersionId: ProgramVersionId) {
    for (const program of this.staticRepository.listPrograms()) {
      for (const version of this.staticRepository.listVersions(program.slug)) {
        const bundle = this.staticRepository.loadBySlug(program.slug, version);
        if (bundle?.programVersion.id === programVersionId) return bundle;
      }
    }
    return undefined;
  }
}

export function collectStaticCatalogBundles(
  repository: CatalogRepository,
): readonly PublishedProgramBundle[] {
  const bundles = repository.listPrograms().flatMap((program) =>
    repository.listVersions(program.slug).map((version) => {
      const bundle = repository.loadBySlug(program.slug, version);
      if (!bundle) {
        throw new CatalogValidationError([
          `Static repository listed ${program.slug}@${version} but could not load it.`,
        ]);
      }
      return bundle;
    }),
  );
  assertValidCatalogSet(bundles);
  return bundles;
}
