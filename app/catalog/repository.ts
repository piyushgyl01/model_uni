import type {
  ProgramId,
  PublishedProgramBundle,
  SemanticVersion,
} from "../domain/catalog";

export interface CatalogProgramSummary {
  readonly programId: ProgramId;
  readonly slug: string;
  readonly title: string;
  readonly school: string;
  readonly discipline: string;
  readonly kind: PublishedProgramBundle["program"]["kind"];
  readonly credentialLabel: string;
  readonly summary: string;
  readonly nominalDuration: string;
  readonly latestVersion: SemanticVersion;
  readonly publishedAt: string;
  /** Number of courses in one minimum valid path. */
  readonly courseCount: number;
  /** All reusable course versions available to the program, including options. */
  readonly availableCourseCount: number;
  readonly learningUnitCount: number;
  readonly resourceCount: number;
  readonly nominalHours: number;
}

/**
 * The UI depends on this boundary rather than static arrays or a future
 * database. A D1/Postgres implementation can replace the static repository
 * without changing routes or renderers.
 */
export interface CatalogRepository {
  listPrograms(): readonly CatalogProgramSummary[];
  listVersions(slug: string): readonly SemanticVersion[];
  loadBySlug(
    slug: string,
    version?: SemanticVersion,
  ): PublishedProgramBundle | undefined;
  loadByProgramId(
    programId: ProgramId,
    version?: SemanticVersion,
  ): PublishedProgramBundle | undefined;
}
