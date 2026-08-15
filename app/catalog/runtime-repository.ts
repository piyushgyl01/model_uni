import type { CatalogRepository } from "./repository";
import {
  AsyncStaticCatalogRepository,
  CatalogDataError,
  collectStaticCatalogBundles,
  D1CatalogRepository,
  seedPublishedProgramBundles,
  type AsyncCatalogRepository,
} from "./d1-repository";
import type { D1DatabaseLike } from "./d1-contract";
import { initializeCatalogRuntimeSchema } from "./d1-runtime-schema";
import {
  registerCatalogProgramSupersessions,
  type CatalogProgramSupersession,
} from "./catalog-supersessions";
import {
  CatalogShadowMismatchError,
  compareCatalogBundleShadows,
} from "./catalog-shadow";
import {
  markCatalogReleaseProjectionCurrent,
  projectCatalogReadModels,
} from "./catalog-read-model";
import { catalogPublicationLock } from "../../content/manifests/catalog-publication-lock";

export interface RuntimeCatalogRepositoryOptions {
  readonly database?: D1DatabaseLike | null;
  readonly staticRepository: CatalogRepository;
  readonly verifyShadow?: boolean;
  /**
   * "all" re-reads every publication out of D1 and field-compares it. "seeded"
   * checks only what this call wrote, which keeps a cold-start upgrade
   * proportional to the new content instead of the whole catalog.
   */
  readonly shadowScope?: "all" | "seeded";
  readonly programSupersessions?: readonly CatalogProgramSupersession[];
}

/**
 * Chooses the static adapter only when no D1 binding exists. Once D1 is
 * selected, seed, query, integrity, and shadow errors are intentionally allowed
 * to propagate instead of silently serving stale checked-in data.
 */
export async function createRuntimeCatalogRepository({
  database,
  staticRepository,
  verifyShadow = true,
  shadowScope = "all",
  programSupersessions = [],
}: RuntimeCatalogRepositoryOptions): Promise<AsyncCatalogRepository> {
  if (!database) return new AsyncStaticCatalogRepository(staticRepository);

  await initializeCatalogRuntimeSchema(database);
  await registerCatalogProgramSupersessions(database, programSupersessions);
  const checkedInBundles = collectStaticCatalogBundles(staticRepository);
  const seed = await seedPublishedProgramBundles(database, checkedInBundles);
  await projectCatalogReadModels(database, checkedInBundles);
  const repository = new D1CatalogRepository(database);
  const seededBundleIds = new Set(seed.seededBundleIds);
  const shadowBundles =
    shadowScope === "seeded"
      ? checkedInBundles.filter((bundle) => seededBundleIds.has(bundle.id))
      : checkedInBundles;
  if (verifyShadow && shadowBundles.length > 0) {
    const runtimeBundles = (
      await Promise.all(
        shadowBundles.map((bundle) =>
          repository.loadByProgramId(
            bundle.program.id,
            bundle.programVersion.version,
          ),
        ),
      )
    ).filter((bundle) => bundle !== undefined);
    const report = compareCatalogBundleShadows(shadowBundles, runtimeBundles);
    if (!report.matches) throw new CatalogShadowMismatchError(report);
  }
  const releaseBundleIds = new Set<string>(
    catalogPublicationLock.map((record) => record.bundleId),
  );
  const isCompleteCheckedInRelease =
    checkedInBundles.length === releaseBundleIds.size &&
    checkedInBundles.every((bundle) => releaseBundleIds.has(bundle.id));
  if (
    isCompleteCheckedInRelease &&
    !(await markCatalogReleaseProjectionCurrent(database))
  ) {
    throw new CatalogDataError("checked-in catalog projection release", [
      "The compact release marker could not be verified after projection.",
    ]);
  }
  return repository;
}
