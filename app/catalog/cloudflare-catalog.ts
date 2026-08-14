import {
  CATALOG_READ_MODEL_VERSION,
  CATALOG_RELEASE_BUNDLE_COUNT,
  CATALOG_RELEASE_KEY,
  CATALOG_RELEASE_MANIFEST_SHA256,
  catalogProgramSupersessions,
} from "../../content/catalog-release";
import type { D1DatabaseLike } from "./d1-contract";
import {
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
 * Worker-isolate singleton. The ordinary production path performs one compact
 * release-marker lookup and then serves indexed D1 projections. Full curriculum
 * modules are loaded only to initialize or upgrade a missing release.
 */
export function getRuntimeCatalogRepository(): Promise<AsyncCatalogRepository> {
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
  return runtimeRepository;
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
    await getRuntimeCatalogRepository();
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
