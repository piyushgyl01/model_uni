import type { CatalogRepository } from "./repository";
import {
  AsyncStaticCatalogRepository,
  collectStaticCatalogBundles,
  compareSemanticVersions,
  D1CatalogRepository,
  seedPublishedProgramBundles,
  type AsyncCatalogRepository,
} from "./d1-repository";
import type { D1DatabaseLike } from "./d1-contract";
import { initializeCatalogRuntimeSchema } from "./d1-runtime-schema";
import {
  CatalogShadowMismatchError,
  compareCatalogBundleShadows,
} from "./catalog-shadow";
import type { SemanticVersion } from "../domain/catalog";

export interface RuntimeCatalogRepositoryOptions {
  readonly database?: D1DatabaseLike | null;
  readonly staticRepository: CatalogRepository;
  readonly verifyShadow?: boolean;
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
}: RuntimeCatalogRepositoryOptions): Promise<AsyncCatalogRepository> {
  if (!database) return new AsyncStaticCatalogRepository(staticRepository);

  await initializeCatalogRuntimeSchema(database);
  const checkedInBundles = collectStaticCatalogBundles(staticRepository);
  await seedPublishedProgramBundles(database, checkedInBundles);
  const repository = new D1CatalogRepository(database);
  if (verifyShadow) {
    const report = compareCatalogBundleShadows(
      checkedInBundles,
      await repository.loadAll(),
    );
    const latestCheckedIn = new Map<string, SemanticVersion>();
    for (const bundle of checkedInBundles) {
      const existing = latestCheckedIn.get(bundle.program.id);
      if (
        !existing ||
        compareSemanticVersions(
          bundle.programVersion.version,
          existing,
        ) > 0
      ) {
        latestCheckedIn.set(
          bundle.program.id,
          bundle.programVersion.version,
        );
      }
    }
    const blocking = report.mismatches.filter((mismatch) => {
      if (mismatch.kind !== "missing_in_static") return true;
      const separator = mismatch.publication.lastIndexOf("@");
      const programId = mismatch.publication.slice(0, separator);
      const version = mismatch.publication.slice(
        separator + 1,
      ) as SemanticVersion;
      const latest = latestCheckedIn.get(programId);
      // Older immutable D1 publications remain valid for version-pinned
      // learner progress after source moves on to a newer publication.
      return (
        !latest ||
        !/^\d+\.\d+\.\d+$/.test(version) ||
        compareSemanticVersions(version, latest) >= 0
      );
    });
    if (blocking.length > 0) {
      throw new CatalogShadowMismatchError({
        ...report,
        matches: false,
        mismatches: blocking,
      });
    }
  }
  return repository;
}
