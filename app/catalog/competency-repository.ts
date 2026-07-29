import type {
  Competency,
  CompetencyId,
  CompetencyLevel,
  CompetencyMapping,
  CompetencySubject,
  CourseVersionId,
  LearningUnitId,
  PublishedProgramBundle,
} from "../domain/catalog";

export interface CompetencyRepository {
  getCompetency(id: CompetencyId): Competency | undefined;
  getCompetenciesByIds(ids: readonly CompetencyId[]): Competency[];
  getMappingsForSubject(subject: CompetencySubject): CompetencyMapping[];
  getCompetenciesForCourseVersion(courseVersionId: CourseVersionId): Competency[];
  getCompetenciesForLearningUnit(learningUnitId: LearningUnitId): Competency[];
  getCompetenciesForAssessmentVersion(assessmentVersionId: string): Competency[];
  getCompetenciesForProgramVersion(programVersionId: string): Competency[];
  getPrerequisiteCompetencies(competencyId: CompetencyId): Competency[];
  getDependentCompetencies(competencyId: CompetencyId): Competency[];
  getGapAnalysis(
    programVersionId: string,
    completedCompetencies: ReadonlySet<CompetencyId>
  ): CompetencyGap[];
  getEquivalencyPaths(
    fromCompetencyId: CompetencyId,
    toCompetencyId: CompetencyId
  ): CompetencyEquivalencyPath[];
}

export interface CompetencyGap {
  readonly competency: Competency;
  readonly currentLevel: CompetencyLevel | "none";
  readonly targetLevel: CompetencyLevel;
  readonly suggestedUnits: LearningUnitId[];
  readonly suggestedAssessments: string[];
  readonly gapReason: string;
}

export interface CompetencyEquivalencyPath {
  readonly from: CompetencyId;
  readonly to: CompetencyId;
  readonly coverage: number;
  readonly relation: "equivalent" | "supersedes" | "partial" | "builds_on";
  readonly evidence: string;
}

export class StaticCompetencyRepository implements CompetencyRepository {
  private readonly competencyById: Map<CompetencyId, Competency>;
  private readonly mappingsBySubject: Map<string, CompetencyMapping[]>;
  private readonly competencyGraph: Map<CompetencyId, CompetencyId[]>;

  constructor(bundles: readonly PublishedProgramBundle[]) {
    this.competencyById = new Map();
    this.mappingsBySubject = new Map();
    this.competencyGraph = new Map();

    for (const bundle of bundles) {
      for (const competency of bundle.competencies) {
        this.competencyById.set(competency.id, competency);
        this.competencyGraph.set(competency.id, []);
      }
      for (const mapping of bundle.competencyMappings) {
        const key = `${mapping.subject.kind}:${mapping.subject.id}`;
        const existing = this.mappingsBySubject.get(key) ?? [];
        existing.push(mapping);
        this.mappingsBySubject.set(key, existing);
      }
      for (const mapping of bundle.competencyMappings) {
        if (mapping.subject.kind === "competency") {
          const deps = this.competencyGraph.get(mapping.competencyId) ?? [];
          deps.push(mapping.subject.id);
          this.competencyGraph.set(mapping.competencyId, deps);
        }
      }
    }
  }

  getCompetency(id: CompetencyId): Competency | undefined {
    return this.competencyById.get(id);
  }

  getCompetenciesByIds(ids: readonly CompetencyId[]): Competency[] {
    return ids.map((id) => this.competencyById.get(id)).filter(Boolean) as Competency[];
  }

  getMappingsForSubject(subject: CompetencySubject): CompetencyMapping[] {
    const key = `${subject.kind}:${subject.id}`;
    return this.mappingsBySubject.get(key) ?? [];
  }

  getCompetenciesForCourseVersion(courseVersionId: CourseVersionId): Competency[] {
    return this.getMappingsForSubject({ kind: "courseVersion", id: courseVersionId })
      .map((m) => this.competencyById.get(m.competencyId))
      .filter(Boolean) as Competency[];
  }

  getCompetenciesForLearningUnit(learningUnitId: LearningUnitId): Competency[] {
    return this.getMappingsForSubject({ kind: "learningUnit", id: learningUnitId })
      .map((m) => this.competencyById.get(m.competencyId))
      .filter(Boolean) as Competency[];
  }

  getCompetenciesForAssessmentVersion(assessmentVersionId: string): Competency[] {
    return this.getMappingsForSubject({ kind: "assessmentVersion", id: assessmentVersionId })
      .map((m) => this.competencyById.get(m.competencyId))
      .filter(Boolean) as Competency[];
  }

  getCompetenciesForProgramVersion(programVersionId: string): Competency[] {
    return this.getMappingsForSubject({ kind: "programVersion", id: programVersionId })
      .map((m) => this.competencyById.get(m.competencyId))
      .filter(Boolean) as Competency[];
  }

  getPrerequisiteCompetencies(competencyId: CompetencyId): Competency[] {
    const deps = this.competencyGraph.get(competencyId) ?? [];
    return deps.map((id) => this.competencyById.get(id)).filter(Boolean) as Competency[];
  }

  getDependentCompetencies(competencyId: CompetencyId): Competency[] {
    const dependents: CompetencyId[] = [];
    for (const [id, prereqs] of this.competencyGraph.entries()) {
      if (prereqs.includes(competencyId)) {
        dependents.push(id);
      }
    }
    return dependents.map((id) => this.competencyById.get(id)).filter(Boolean) as Competency[];
  }

  getGapAnalysis(
    programVersionId: string,
    completedCompetencies: ReadonlySet<CompetencyId>
  ): CompetencyGap[] {
    const programCompetencies = this.getCompetenciesForProgramVersion(programVersionId);
    const gaps: CompetencyGap[] = [];

    for (const competency of programCompetencies) {
      const completed = completedCompetencies.has(competency.id);
      const currentLevel = completed ? "applied" : "none";
      const targetLevel = this.inferTargetLevel(competency, programVersionId);

      if (currentLevel !== targetLevel && currentLevel === "none") {
        const mappings = this.getMappingsForSubject({ kind: "programVersion", id: programVersionId })
          .filter((m) => m.competencyId === competency.id);

        const suggestedUnits: LearningUnitId[] = [];
        const suggestedAssessments: string[] = [];

        for (const mapping of mappings) {
          if (mapping.subject.kind === "learningUnit") {
            suggestedUnits.push(mapping.subject.id);
          } else if (mapping.subject.kind === "assessmentVersion") {
            suggestedAssessments.push(mapping.subject.id);
          }
        }

        gaps.push({
          competency,
          currentLevel,
          targetLevel,
          suggestedUnits,
          suggestedAssessments,
          gapReason: completed ? "Target level not reached" : "Competency not yet developed",
        });
      }
    }

    return gaps;
  }

  private inferTargetLevel(competency: Competency, programVersionId: string): CompetencyLevel {
    const mappings = this.getMappingsForSubject({ kind: "programVersion", id: programVersionId })
      .filter((m) => m.competencyId === competency.id);

    if (mappings.some((m) => m.targetLevel === "mastery")) return "mastery";
    if (mappings.some((m) => m.targetLevel === "advanced")) return "advanced";
    if (mappings.some((m) => m.targetLevel === "applied")) return "applied";
    if (mappings.some((m) => m.targetLevel === "foundational")) return "foundational";
    return "awareness";
  }

  getEquivalencyPaths(
    fromCompetencyId: CompetencyId,
    toCompetencyId: CompetencyId
  ): CompetencyEquivalencyPath[] {
    const paths: CompetencyEquivalencyPath[] = [];

    if (fromCompetencyId === toCompetencyId) {
      paths.push({
        from: fromCompetencyId,
        to: toCompetencyId,
        coverage: 1,
        relation: "equivalent",
        evidence: "Same competency",
      });
      return paths;
    }

    const fromComp = this.competencyById.get(fromCompetencyId);
    const toComp = this.competencyById.get(toCompetencyId);

    if (!fromComp || !toComp) return paths;

    const fromDeps = this.getPrerequisiteCompetencies(fromCompetencyId);
    const toDeps = this.getPrerequisiteCompetencies(toCompetencyId);

    const sharedDeps = fromDeps.filter((d) => toDeps.some((td) => td.id === d.id));

    if (sharedDeps.length > 0) {
      const coverage = sharedDeps.length / Math.max(fromDeps.length, toDeps.length);
      if (coverage >= 0.8) {
        paths.push({
          from: fromCompetencyId,
          to: toCompetencyId,
          coverage,
          relation: "equivalent",
          evidence: `Share ${sharedDeps.length} prerequisite competencies`,
        });
      } else if (coverage >= 0.5) {
        paths.push({
          from: fromCompetencyId,
          to: toCompetencyId,
          coverage,
          relation: "partial",
          evidence: `Share ${sharedDeps.length} prerequisite competencies`,
        });
      }
    }

    return paths;
  }
}

export function createCompetencyRepository(
  bundles: readonly PublishedProgramBundle[]
): CompetencyRepository {
  return new StaticCompetencyRepository(bundles);
}