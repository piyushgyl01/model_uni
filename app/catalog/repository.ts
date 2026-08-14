import type {
  CourseCode,
  CourseVersionId,
  ProgramId,
  ProgramKind,
  ProgramVersionId,
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

export interface CatalogPage<Item> {
  readonly items: readonly Item[];
  readonly nextCursor?: string;
}

export interface CatalogProgramPageQuery {
  readonly limit?: number;
  readonly cursor?: string;
  readonly q?: string;
  readonly school?: string;
  readonly discipline?: string;
  readonly kind?: ProgramKind;
}

export interface CatalogCourseSearchQuery {
  readonly limit?: number;
  readonly cursor?: string;
  readonly q?: string;
  readonly programVersionId?: ProgramVersionId;
  readonly discipline?: string;
  readonly format?: PublishedProgramBundle["courseVersions"][number]["format"];
}

export interface CatalogCourseSearchResult {
  readonly programId: ProgramId;
  readonly programVersionId: ProgramVersionId;
  readonly programSlug: string;
  readonly programTitle: string;
  readonly courseId: PublishedProgramBundle["courses"][number]["id"];
  readonly courseVersionId: CourseVersionId;
  readonly slug: string;
  readonly version: SemanticVersion;
  readonly primaryCode?: string;
  readonly codes: readonly CourseCode[];
  readonly title: string;
  readonly summary: string;
  readonly discipline: string;
  readonly format: PublishedProgramBundle["courseVersions"][number]["format"];
  readonly nominalHours: number;
}

export interface CatalogStats {
  readonly bundleCount: number;
  readonly activeProgramCount: number;
  readonly minimumPathCourseCount: number;
  readonly learningUnitCount: number;
  readonly nominalHours: number;
  readonly schoolCount: number;
  readonly projectionVersion: number;
  readonly projectedAt: string;
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
