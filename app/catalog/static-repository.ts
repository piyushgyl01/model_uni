import type {
  ProgramId,
  PublishedProgramBundle,
  SemanticVersion,
} from "../domain/catalog";
import {
  validateCatalogBundles,
  validatePublishedProgramBundle,
} from "../domain/validation";
import type {
  CatalogProgramSummary,
  CatalogRepository,
} from "./repository";

function compareVersions(left: SemanticVersion, right: SemanticVersion) {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = leftParts[index] - rightParts[index];
    if (difference !== 0) return difference;
  }
  return 0;
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

export class CatalogValidationError extends Error {
  constructor(readonly problems: readonly string[]) {
    super(`Catalog registration failed:\n${problems.join("\n")}`);
    this.name = "CatalogValidationError";
  }
}

/**
 * In-memory adapter for checked-in program bundles. Registration validates and
 * freezes each bundle so publication mistakes fail at startup, not mid-render.
 */
export class StaticCatalogRepository implements CatalogRepository {
  private readonly bundles: PublishedProgramBundle[] = [];

  constructor(initialBundles: readonly PublishedProgramBundle[] = []) {
    if (initialBundles.length > 0) {
      const result = validateCatalogBundles(initialBundles);
      if (!result.valid) {
        throw new CatalogValidationError(
          result.issues.map((issue) => `${issue.path}: ${issue.message}`),
        );
      }
      initialBundles.forEach((bundle) => this.store(bundle));
    }
  }

  register(bundle: PublishedProgramBundle) {
    const bundleResult = validatePublishedProgramBundle(bundle);
    if (!bundleResult.valid) {
      throw new CatalogValidationError(
        bundleResult.issues.map((issue) => `${issue.path}: ${issue.message}`),
      );
    }

    const catalogResult = validateCatalogBundles([...this.bundles, bundle]);
    if (!catalogResult.valid) {
      const existingIssueCount = this.bundles.reduce(
        (total, existing) =>
          total + validatePublishedProgramBundle(existing).issues.length,
        0,
      );
      throw new CatalogValidationError(
        catalogResult.issues
          .slice(existingIssueCount)
          .map((issue) => `${issue.path}: ${issue.message}`),
      );
    }

    this.store(bundle);
    return this;
  }

  listPrograms(): readonly CatalogProgramSummary[] {
    const latestByProgram = new Map<ProgramId, PublishedProgramBundle>();
    for (const bundle of this.bundles) {
      const existing = latestByProgram.get(bundle.program.id);
      if (
        !existing ||
        compareVersions(
          bundle.programVersion.version,
          existing.programVersion.version,
        ) > 0
      ) {
        latestByProgram.set(bundle.program.id, bundle);
      }
    }

    return [...latestByProgram.values()]
      .map((bundle) => this.toSummary(bundle))
      .sort((left, right) => left.title.localeCompare(right.title));
  }

  listVersions(slug: string): readonly SemanticVersion[] {
    return this.bundles
      .filter((bundle) => bundle.program.canonicalSlug === slug)
      .map((bundle) => bundle.programVersion.version)
      .sort((left, right) => compareVersions(right, left));
  }

  loadBySlug(
    slug: string,
    version?: SemanticVersion,
  ): PublishedProgramBundle | undefined {
    return this.findLatest(
      this.bundles.filter(
        (bundle) =>
          bundle.program.canonicalSlug === slug &&
          (!version || bundle.programVersion.version === version),
      ),
    );
  }

  loadByProgramId(
    programId: ProgramId,
    version?: SemanticVersion,
  ): PublishedProgramBundle | undefined {
    return this.findLatest(
      this.bundles.filter(
        (bundle) =>
          bundle.program.id === programId &&
          (!version || bundle.programVersion.version === version),
      ),
    );
  }

  private store(bundle: PublishedProgramBundle) {
    this.bundles.push(deepFreeze(bundle));
  }

  private findLatest(
    bundles: readonly PublishedProgramBundle[],
  ): PublishedProgramBundle | undefined {
    return [...bundles].sort((left, right) =>
      compareVersions(right.programVersion.version, left.programVersion.version),
    )[0];
  }

  private toSummary(bundle: PublishedProgramBundle): CatalogProgramSummary {
    const courseVersionById = new Map(
      bundle.courseVersions.map((version) => [version.id, version]),
    );
    const requiredCourseVersionIds = new Set(
      bundle.programVersion.requirements.flatMap((group) => {
        if (group.rule.selectionConstraint === "same concentration") {
          const byConcentration = new Map<string, typeof group.options>();
          for (const option of group.options) {
            const key = option.concentrationId ?? "unassigned";
            byConcentration.set(key, [
              ...(byConcentration.get(key) ?? []),
              option,
            ]);
          }
          return [...byConcentration.values()]
            .filter((options) => options.length >= group.rule.minSelections)
            .sort((left, right) => {
              const hours = (options: typeof group.options) =>
                options
                  .slice(0, group.rule.minSelections)
                  .reduce(
                    (total, option) =>
                      total +
                      (courseVersionById.get(option.courseVersionId)
                        ?.nominalHours ?? 0),
                    0,
                  );
              return hours(left) - hours(right);
            })[0]
            ?.slice(0, group.rule.minSelections)
            .map((option) => option.courseVersionId) ?? [];
        }
        return [...group.options]
          .sort(
            (left, right) =>
              (courseVersionById.get(left.courseVersionId)?.nominalHours ?? 0) -
              (courseVersionById.get(right.courseVersionId)?.nominalHours ?? 0),
          )
          .slice(0, group.rule.minSelections)
          .map((option) => option.courseVersionId);
      }),
    );
    const nominalHours = bundle.courseVersions
      .filter((version) => requiredCourseVersionIds.has(version.id))
      .reduce((total, version) => total + version.nominalHours, 0);
    const learningUnitCount = bundle.learningUnits.filter((unit) =>
      requiredCourseVersionIds.has(unit.courseVersionId),
    ).length;

    return {
      programId: bundle.program.id,
      slug: bundle.program.canonicalSlug,
      title: bundle.programVersion.title,
      school: bundle.program.school,
      discipline: bundle.program.discipline,
      kind: bundle.program.kind,
      credentialLabel: bundle.programVersion.credentialLabel,
      summary: bundle.programVersion.summary,
      nominalDuration: bundle.programVersion.nominalDuration,
      latestVersion: bundle.programVersion.version,
      publishedAt: bundle.programVersion.publishedAt,
      courseCount: requiredCourseVersionIds.size,
      availableCourseCount: bundle.courseVersions.length,
      learningUnitCount,
      resourceCount: bundle.resourceVersions.length,
      nominalHours,
    };
  }
}
