import {
  catalogProgramSupersessions,
  catalogRepository as checkedInCatalog,
} from "../../content/catalog";
import type { D1DatabaseLike } from "./d1-contract";
import type { AsyncCatalogRepository } from "./d1-repository";
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

/**
 * Worker-isolate singleton. The first request idempotently seeds checked-in
 * publications; later requests reuse the validated D1 repository.
 */
export function getRuntimeCatalogRepository(): Promise<AsyncCatalogRepository> {
  runtimeRepository ??= (async () =>
    createRuntimeCatalogRepository({
      database: await getCatalogD1Binding(),
      staticRepository: checkedInCatalog,
      programSupersessions: catalogProgramSupersessions,
    }))();
  return runtimeRepository;
}

/**
 * Progress has no static durability fallback. Waiting for catalog
 * initialization guarantees bundle foreign keys exist before the first write.
 */
export function getRuntimeLearnerProgressRepository(): Promise<
  D1LearnerProgressRepository | undefined
> {
  learnerProgressRepository ??= (async () => {
    const database = await getCatalogD1Binding();
    if (!database) return undefined;
    await getRuntimeCatalogRepository();
    return new D1LearnerProgressRepository(database);
  })();
  return learnerProgressRepository;
}
