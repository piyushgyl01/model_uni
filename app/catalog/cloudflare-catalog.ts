import {
  CATALOG_READ_MODEL_VERSION,
  CATALOG_RELEASE_BUNDLE_COUNT,
  CATALOG_RELEASE_KEY,
  CATALOG_RELEASE_MANIFEST_SHA256,
  catalogProgramSupersessions,
} from "../../content/catalog-release";
import type { D1DatabaseLike } from "./d1-contract";
import {
  AsyncStaticCatalogRepository,
  D1CatalogRepository,
  type AsyncCatalogRepository,
} from "./d1-repository";
import { initializeCatalogRuntimeSchema } from "./d1-runtime-schema";
import { D1LearnerProgressRepository } from "./learner-progress-repository";
import { createRuntimeCatalogRepository } from "./runtime-repository";

let runtimeRepository: Promise<AsyncCatalogRepository> | undefined;
let learnerProgressRepository:
  | Promise<D1LearnerProgressRepository | undefined>
  | undefined;

function runtimeModuleIsUnavailable(error: unknown): boolean {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
  const message = error instanceof Error ? error.message : String(error);
  return (
    code === "ERR_MODULE_NOT_FOUND" ||
    code === "ERR_UNSUPPORTED_ESM_URL_SCHEME" ||
    message.includes("cloudflare:workers")
  );
}

export async function getCatalogD1Binding(): Promise<
  D1DatabaseLike | undefined
> {
  try {
    const { env } = await import("cloudflare:workers");
    return (env as unknown as { DB?: D1DatabaseLike }).DB;
  } catch (error) {
    if (runtimeModuleIsUnavailable(error)) return undefined;
    throw error;
  }
}

interface CatalogProjectionStateRow {
  readonly manifest_hash: string;
  readonly bundle_count: number;
  readonly projection_version: number;
}

async function releaseProjectionIsCurrent(database: D1DatabaseLike) {
  const row = await database
    .prepare(
      `SELECT manifest_hash, bundle_count, projection_version
       FROM catalog_projection_state
       WHERE release_key = ?`,
    )
    .bind(CATALOG_RELEASE_KEY)
    .first<CatalogProjectionStateRow>();
  return (
    row?.manifest_hash === CATALOG_RELEASE_MANIFEST_SHA256 &&
    row.bundle_count === CATALOG_RELEASE_BUNDLE_COUNT &&
    row.projection_version === CATALOG_READ_MODEL_VERSION
  );
}

/**
 * How long a page render will wait for a catalog upgrade before serving the
 * checked-in catalog instead. A release migration writes megabytes of
 * curriculum; a visitor's request must never be the thing that carries it.
 */
const CATALOG_INITIALIZATION_DEADLINE_MS = 3_000;

/**
 * Worker-isolate singleton. The ordinary production path performs one compact
 * release-marker lookup and then serves indexed D1 projections. Full curriculum
 * modules are loaded only to initialize or upgrade a missing release.
 *
 * Callers that need durable D1 (learner writes) await this directly. Page reads
 * go through getRuntimeCatalogRepository, which will not wait indefinitely.
 */
function beginCatalogInitialization(): Promise<AsyncCatalogRepository> {
  if (runtimeRepository) return runtimeRepository;

  const initialization = (async () => {
    const database = await getCatalogD1Binding();
    if (database) {
      await initializeCatalogRuntimeSchema(database);
      if (await releaseProjectionIsCurrent(database)) {
        return new D1CatalogRepository(database);
      }
    }

    const { catalogRepository: checkedInCatalog } = await import(
      "../../content/catalog"
    );
    return createRuntimeCatalogRepository({
      database,
      staticRepository: checkedInCatalog,
      // A deployed isolate re-reads only what it just wrote. Publications
      // already present were shadow-verified when they were seeded and are
      // immutable, so re-comparing the whole catalog on every cold start is
      // work that grows with the catalog and cannot finish inside a request.
      shadowScope: "seeded",
      programSupersessions: catalogProgramSupersessions,
    });
  })();
  const retryableInitialization = initialization.catch((error) => {
    if (runtimeRepository === retryableInitialization) {
      runtimeRepository = undefined;
    }
    throw error;
  });
  runtimeRepository = retryableInitialization;
  // A request may stop waiting on this attempt while it keeps running, so its
  // failure must not surface as an unhandled rejection.
  void retryableInitialization.catch(() => {});
  return retryableInitialization;
}

async function checkedInCatalogRepository(): Promise<AsyncCatalogRepository> {
  const { catalogRepository: checkedInCatalog } = await import(
    "../../content/catalog"
  );
  return new AsyncStaticCatalogRepository(checkedInCatalog);
}

/**
 * Reads the catalog without ever blocking a page on a release migration.
 *
 * A stale release marker sends the first cold isolate into a full upgrade. That
 * work is idempotent and resumes across requests, but it is measured in seconds
 * — so once the deadline passes this request stops waiting and serves the
 * checked-in catalog, which is byte-identical to what the upgrade is writing.
 * Integrity failures still reject: a shadow mismatch or seed conflict is real
 * corruption and must not be served around.
 */
export async function getRuntimeCatalogRepository(): Promise<AsyncCatalogRepository> {
  const initialization = beginCatalogInitialization();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<undefined>((resolve) => {
    timer = setTimeout(
      () => resolve(undefined),
      CATALOG_INITIALIZATION_DEADLINE_MS,
    );
  });
  try {
    const repository = await Promise.race([initialization, deadline]);
    return repository ?? (await checkedInCatalogRepository());
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Progress has no static durability fallback. Waiting for catalog
 * initialization guarantees bundle foreign keys exist before the first write.
 */
export function getRuntimeLearnerProgressRepository(): Promise<
  D1LearnerProgressRepository | undefined
> {
  if (learnerProgressRepository) return learnerProgressRepository;

  const initialization = (async () => {
    const database = await getCatalogD1Binding();
    if (!database) return undefined;
    await beginCatalogInitialization();
    return new D1LearnerProgressRepository(database);
  })();
  const retryableInitialization = initialization.catch((error) => {
    if (learnerProgressRepository === retryableInitialization) {
      learnerProgressRepository = undefined;
    }
    throw error;
  });
  learnerProgressRepository = retryableInitialization;
  return learnerProgressRepository;
}
