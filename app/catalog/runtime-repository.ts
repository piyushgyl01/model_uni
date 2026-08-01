import type { CatalogRepository } from "./repository";
import {
  AsyncStaticCatalogRepository,
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

export interface RuntimeCatalogRepositoryOptions {
  readonly database?: D1DatabaseLike | null;
  readonly staticRepository: CatalogRepository;
  readonly verifyShadow?: boolean;
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
  programSupersessions = [],
}: RuntimeCatalogRepositoryOptions): Promise<AsyncCatalogRepository> {
  if (!database) return new AsyncStaticCatalogRepository(staticRepository);

  await initializeCatalogRuntimeSchema(database);
  await registerCatalogProgramSupersessions(database, programSupersessions);
  const checkedInBundles = collectStaticCatalogBundles(staticRepository);
  await seedPublishedProgramBundles(database, checkedInBundles);
  const repository = new D1CatalogRepository(database);
  if (verifyShadow) {
    const runtimeBundles = (
      await Promise.all(
        checkedInBundles.map((bundle) =>
          repository.loadByProgramId(
            bundle.program.id,
            bundle.programVersion.version,
          ),
        ),
      )
    ).filter((bundle) => bundle !== undefined);
    const report = compareCatalogBundleShadows(
      checkedInBundles,
      runtimeBundles,
    );
    if (!report.matches) throw new CatalogShadowMismatchError(report);
  }
  return repository;
}
