import type {
  ConcentrationId,
  CourseVersionId,
  LearningUnitId,
  ProgramVersionId,
  PublishedProgramBundle,
} from "../domain/catalog";
import { canonicalJson, sha256Hex } from "./canonical-json";
import {
  d1All,
  d1Batch,
  type D1DatabaseLike,
  type D1ResultLike,
} from "./d1-contract";
import { D1CatalogRepository } from "./d1-repository";

export interface LearnerIdentityInput {
  readonly provider: string;
  readonly subject: string;
  readonly email?: string | null;
  readonly displayName?: string | null;
}

export interface ResolvedLearner {
  readonly learnerId: string;
  readonly accountId: string;
  readonly provider: string;
  readonly subject: string;
  readonly email?: string;
  readonly displayName?: string;
}

export interface LearnerCourseProgress {
  readonly completedUnitIds: readonly LearningUnitId[];
  readonly updatedAt?: string;
}

export interface LearnerProgressSnapshot {
  readonly learnerId: string;
  readonly bundleId: string;
  readonly programVersionId: ProgramVersionId;
  readonly selectedConcentrationId?: ConcentrationId;
  readonly courses: Readonly<
    Record<CourseVersionId, LearnerCourseProgress>
  >;
  readonly startedAt?: string;
  readonly updatedAt?: string;
}

export interface LocalCourseProgressImport {
  readonly courseVersionId: CourseVersionId;
  readonly completedUnitIds: readonly LearningUnitId[];
}

export interface CourseCompletionReplacement {
  readonly courseVersionId: CourseVersionId;
  readonly completedUnitIds: readonly LearningUnitId[];
}

export interface LocalProgramProgressImport {
  readonly programVersionId: ProgramVersionId;
  readonly selectedConcentrationId?: ConcentrationId;
  readonly courses: readonly LocalCourseProgressImport[];
}

export type ProgressImportDisposition = "merged" | "cloud";

export interface ImportLocalProgressInput {
  readonly learnerId: string;
  readonly clientImportId: string;
  readonly storageNamespace: string;
  readonly disposition: ProgressImportDisposition;
  readonly programs: readonly LocalProgramProgressImport[];
}

export interface ProgressImportReceipt {
  readonly learnerId: string;
  readonly clientImportId: string;
  readonly storageNamespace: string;
  readonly disposition: ProgressImportDisposition;
  readonly payloadHash: string;
  readonly importedUnitCount: number;
  readonly confirmedAt: string;
}

interface AccountRow {
  readonly account_id: string;
  readonly learner_id: string;
  readonly provider: string;
  readonly provider_subject: string;
  readonly email: string | null;
  readonly display_name: string | null;
}

interface ProgramProgressRow {
  readonly bundle_id: string;
  readonly selected_concentration_id: string | null;
  readonly started_at: string;
  readonly updated_at: string;
}

interface UnitCompletionRow {
  readonly course_version_id: string;
  readonly learning_unit_id: string;
  readonly completed_at: string;
}

interface ProgressImportRow {
  readonly learner_id: string;
  readonly client_import_id: string;
  readonly storage_namespace: string;
  readonly disposition: string;
  readonly payload_hash: string;
  readonly imported_unit_count: number;
  readonly confirmed_at: string;
}

interface NormalizedImportCourse {
  readonly courseVersionId: CourseVersionId;
  readonly completedUnitIds: readonly LearningUnitId[];
}

interface NormalizedImportProgram {
  readonly programVersionId: ProgramVersionId;
  readonly selectedConcentrationId?: ConcentrationId;
  readonly courses: readonly NormalizedImportCourse[];
}

export class LearnerProgressValidationError extends Error {
  constructor(readonly problems: readonly string[]) {
    super(
      `Learner progress input is invalid:\n${problems
        .map((problem) => `- ${problem}`)
        .join("\n")}`,
    );
    this.name = "LearnerProgressValidationError";
  }
}

export class LearnerProgressDataError extends Error {
  constructor(readonly problems: readonly string[]) {
    super(
      `Learner progress in D1 is invalid:\n${problems
        .map((problem) => `- ${problem}`)
        .join("\n")}`,
    );
    this.name = "LearnerProgressDataError";
  }
}

export class ProgressImportConflictError extends Error {
  constructor(
    readonly learnerId: string,
    readonly clientImportId: string,
  ) {
    super(
      `Progress import ${clientImportId} for ${learnerId} was already confirmed with different content or consent.`,
    );
    this.name = "ProgressImportConflictError";
  }
}

function nonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new LearnerProgressValidationError([`${label} is empty.`]);
  return normalized;
}

function normalizedOptional(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function rowsFromBatchResult<Row>(
  result: D1ResultLike,
): readonly Row[] {
  return (result.results ?? []) as readonly Row[];
}

function accountFromRow(row: AccountRow): ResolvedLearner {
  return {
    learnerId: row.learner_id,
    accountId: row.account_id,
    provider: row.provider,
    subject: row.provider_subject,
    ...(row.email ? { email: row.email } : {}),
    ...(row.display_name ? { displayName: row.display_name } : {}),
  };
}

function receiptFromRow(row: ProgressImportRow): ProgressImportReceipt {
  if (row.disposition !== "merged" && row.disposition !== "cloud") {
    throw new LearnerProgressDataError([
      `Import ${row.client_import_id} has unsupported disposition ${JSON.stringify(row.disposition)}.`,
    ]);
  }
  return {
    learnerId: row.learner_id,
    clientImportId: row.client_import_id,
    storageNamespace: row.storage_namespace,
    disposition: row.disposition,
    payloadHash: row.payload_hash,
    importedUnitCount: row.imported_unit_count,
    confirmedAt: row.confirmed_at,
  };
}

function requireCourse(
  bundle: PublishedProgramBundle,
  courseVersionId: CourseVersionId,
) {
  const course = bundle.courseVersions.find(
    (candidate) => candidate.id === courseVersionId,
  );
  if (!course) {
    throw new LearnerProgressValidationError([
      `Course version ${courseVersionId} is not in program version ${bundle.programVersion.id}.`,
    ]);
  }
  return course;
}

function requireUnitIds(
  bundle: PublishedProgramBundle,
  courseVersionId: CourseVersionId,
  unitIds: readonly LearningUnitId[],
) {
  requireCourse(bundle, courseVersionId);
  const allowed = new Set(
    bundle.learningUnits
      .filter((unit) => unit.courseVersionId === courseVersionId)
      .map((unit) => unit.id),
  );
  const unknown = unitIds.filter((unitId) => !allowed.has(unitId));
  if (unknown.length > 0) {
    throw new LearnerProgressValidationError([
      `Course ${courseVersionId} does not contain unit(s): ${unknown.join(", ")}.`,
    ]);
  }
}

function requireConcentration(
  bundle: PublishedProgramBundle,
  concentrationId: ConcentrationId | null | undefined,
) {
  if (
    concentrationId &&
    !bundle.concentrations.some(
      (concentration) => concentration.id === concentrationId,
    )
  ) {
    throw new LearnerProgressValidationError([
      `Concentration ${concentrationId} is not in program version ${bundle.programVersion.id}.`,
    ]);
  }
}

function normalizeImportPrograms(
  programs: readonly LocalProgramProgressImport[],
): readonly NormalizedImportProgram[] {
  const problems: string[] = [];
  const seenPrograms = new Set<string>();
  const normalized = programs.map((program, programIndex) => {
    if (seenPrograms.has(program.programVersionId)) {
      problems.push(
        `programs[${programIndex}] duplicates ${program.programVersionId}.`,
      );
    }
    seenPrograms.add(program.programVersionId);
    const seenCourses = new Set<string>();
    const courses = program.courses.map((course, courseIndex) => {
      if (seenCourses.has(course.courseVersionId)) {
        problems.push(
          `programs[${programIndex}].courses[${courseIndex}] duplicates ${course.courseVersionId}.`,
        );
      }
      seenCourses.add(course.courseVersionId);
      return {
        courseVersionId: course.courseVersionId,
        completedUnitIds: [
          ...new Set(course.completedUnitIds),
        ].sort() as LearningUnitId[],
      };
    });
    courses.sort((left, right) =>
      left.courseVersionId.localeCompare(right.courseVersionId),
    );
    return {
      programVersionId: program.programVersionId,
      ...(program.selectedConcentrationId
        ? { selectedConcentrationId: program.selectedConcentrationId }
        : {}),
      courses,
    };
  });
  normalized.sort((left, right) =>
    left.programVersionId.localeCompare(right.programVersionId),
  );
  if (problems.length > 0) throw new LearnerProgressValidationError(problems);
  return normalized;
}

export class D1LearnerProgressRepository {
  readonly catalog: D1CatalogRepository;

  constructor(readonly database: D1DatabaseLike) {
    this.catalog = new D1CatalogRepository(database);
  }

  async resolveLearner(
    identity: LearnerIdentityInput,
  ): Promise<ResolvedLearner> {
    const provider = nonEmpty(identity.provider, "provider").toLowerCase();
    const subject = nonEmpty(identity.subject, "subject");
    const email = normalizedOptional(identity.email)?.toLowerCase();
    const displayName = normalizedOptional(identity.displayName);
    const existing = await this.findAccount(provider, subject);

    if (existing) {
      await d1Batch(
        this.database,
        [
          this.database
            .prepare(
              `UPDATE learners
               SET display_name = COALESCE(?, display_name),
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
            )
            .bind(displayName ?? null, existing.learner_id),
          this.database
            .prepare(
              `UPDATE learner_accounts
               SET email = COALESCE(?, email),
                   updated_at = CURRENT_TIMESTAMP,
                   last_seen_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
            )
            .bind(email ?? null, existing.account_id),
        ],
        "refresh learner account",
      );
      return {
        ...accountFromRow(existing),
        ...(email ? { email } : {}),
        ...(displayName ? { displayName } : {}),
      };
    }

    const identityHash = await sha256Hex(
      canonicalJson({ provider, subject }),
    );
    const learnerId = `lrn_${identityHash.slice(0, 32)}`;
    const accountId = `lac_${identityHash.slice(0, 32)}`;
    await d1Batch(
      this.database,
      [
        this.database
          .prepare(
            `INSERT INTO learners (id, display_name)
             VALUES (?, ?)
             ON CONFLICT(id) DO UPDATE SET
               display_name = COALESCE(excluded.display_name, learners.display_name),
               updated_at = CURRENT_TIMESTAMP`,
          )
          .bind(learnerId, displayName ?? null),
        this.database
          .prepare(
            `INSERT INTO learner_accounts (
               id,
               learner_id,
               provider,
               provider_subject,
               email
             )
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(provider, provider_subject) DO UPDATE SET
               email = COALESCE(excluded.email, learner_accounts.email),
               updated_at = CURRENT_TIMESTAMP,
               last_seen_at = CURRENT_TIMESTAMP`,
          )
          .bind(accountId, learnerId, provider, subject, email ?? null),
      ],
      "create learner account",
    );
    const resolved = await this.findAccount(provider, subject);
    if (!resolved) {
      throw new LearnerProgressDataError([
        `Account ${provider}:${subject} was not readable after creation.`,
      ]);
    }
    return accountFromRow(resolved);
  }

  async loadProgress(
    learnerId: string,
    programVersionId: ProgramVersionId,
  ): Promise<LearnerProgressSnapshot> {
    const bundle = await this.requireBundle(programVersionId);
    const results = await d1Batch(
      this.database,
      [
        this.database
          .prepare(
            `SELECT bundle_id, selected_concentration_id, started_at, updated_at
             FROM learner_program_progress
             WHERE learner_id = ? AND program_version_id = ?`,
          )
          .bind(learnerId, programVersionId),
        this.database
          .prepare(
            `SELECT course_version_id, learning_unit_id, completed_at
             FROM learner_unit_completions
             WHERE learner_id = ? AND program_version_id = ?
             ORDER BY completed_at, course_version_id, learning_unit_id`,
          )
          .bind(learnerId, programVersionId),
      ],
      "load learner progress",
    );
    const progressRows =
      rowsFromBatchResult<ProgramProgressRow>(results[0]);
    const completionRows =
      rowsFromBatchResult<UnitCompletionRow>(results[1]);
    if (progressRows.length > 1) {
      throw new LearnerProgressDataError([
        `Multiple progress rows exist for ${learnerId}/${programVersionId}.`,
      ]);
    }
    const progress = progressRows[0];
    if (progress && progress.bundle_id !== bundle.id) {
      throw new LearnerProgressDataError([
        `Progress is pinned to ${progress.bundle_id}, but catalog program version ${programVersionId} resolves to ${bundle.id}.`,
      ]);
    }
    requireConcentration(
      bundle,
      progress?.selected_concentration_id as ConcentrationId | null | undefined,
    );

    const unitOrder = new Map(
      bundle.learningUnits.map((unit, index) => [unit.id, index]),
    );
    const completedByCourse = new Map<
      string,
      { ids: LearningUnitId[]; updatedAt?: string }
    >();
    const dataProblems: string[] = [];
    for (const row of completionRows) {
      const courseVersionId = row.course_version_id as CourseVersionId;
      const learningUnitId = row.learning_unit_id as LearningUnitId;
      try {
        requireUnitIds(bundle, courseVersionId, [learningUnitId]);
      } catch (error) {
        dataProblems.push(
          error instanceof Error ? error.message : String(error),
        );
        continue;
      }
      const record = completedByCourse.get(courseVersionId) ?? { ids: [] };
      record.ids.push(learningUnitId);
      if (!record.updatedAt || row.completed_at > record.updatedAt) {
        record.updatedAt = row.completed_at;
      }
      completedByCourse.set(courseVersionId, record);
    }
    if (dataProblems.length > 0) {
      throw new LearnerProgressDataError(dataProblems);
    }

    const courses = Object.fromEntries(
      bundle.courseVersions.map((course) => {
        const record = completedByCourse.get(course.id);
        const completedUnitIds = [...(record?.ids ?? [])].sort(
          (left, right) =>
            (unitOrder.get(left) ?? Number.MAX_SAFE_INTEGER) -
            (unitOrder.get(right) ?? Number.MAX_SAFE_INTEGER),
        );
        return [
          course.id,
          {
            completedUnitIds,
            ...(record?.updatedAt ? { updatedAt: record.updatedAt } : {}),
          },
        ];
      }),
    ) as Record<CourseVersionId, LearnerCourseProgress>;

    return {
      learnerId,
      bundleId: bundle.id,
      programVersionId,
      ...(progress?.selected_concentration_id
        ? {
            selectedConcentrationId:
              progress.selected_concentration_id as ConcentrationId,
          }
        : {}),
      courses,
      ...(progress
        ? { startedAt: progress.started_at, updatedAt: progress.updated_at }
        : {}),
    };
  }

  async setSelectedConcentration(
    learnerId: string,
    programVersionId: ProgramVersionId,
    concentrationId: ConcentrationId | null,
  ): Promise<void> {
    const bundle = await this.requireBundle(programVersionId);
    requireConcentration(bundle, concentrationId);
    await d1Batch(
      this.database,
      [
        this.database
          .prepare(
            `INSERT INTO learner_program_progress (
               learner_id,
               program_version_id,
               bundle_id,
               selected_concentration_id
             )
             VALUES (?, ?, ?, ?)
             ON CONFLICT(learner_id, program_version_id) DO UPDATE SET
               selected_concentration_id = excluded.selected_concentration_id,
               updated_at = CURRENT_TIMESTAMP`,
          )
          .bind(
            learnerId,
            programVersionId,
            bundle.id,
            concentrationId,
          ),
      ],
      "set learner concentration",
    );
  }

  async setUnitCompletion(
    learnerId: string,
    programVersionId: ProgramVersionId,
    courseVersionId: CourseVersionId,
    learningUnitId: LearningUnitId,
    completed: boolean,
  ): Promise<void> {
    const bundle = await this.requireBundle(programVersionId);
    requireUnitIds(bundle, courseVersionId, [learningUnitId]);
    const statements = [
      this.ensureEnrollment(learnerId, bundle),
      completed
        ? this.database
            .prepare(
              `INSERT INTO learner_unit_completions (
                 learner_id,
                 program_version_id,
                 course_version_id,
                 learning_unit_id
               )
               VALUES (?, ?, ?, ?)
               ON CONFLICT DO NOTHING`,
            )
            .bind(
              learnerId,
              programVersionId,
              courseVersionId,
              learningUnitId,
            )
        : this.database
            .prepare(
              `DELETE FROM learner_unit_completions
               WHERE learner_id = ?
                 AND program_version_id = ?
                 AND course_version_id = ?
                 AND learning_unit_id = ?`,
            )
            .bind(
              learnerId,
              programVersionId,
              courseVersionId,
              learningUnitId,
            ),
    ];
    await d1Batch(this.database, statements, "set unit completion");
  }

  async replaceCourseCompletions(
    learnerId: string,
    programVersionId: ProgramVersionId,
    courseVersionId: CourseVersionId,
    completedUnitIds: readonly LearningUnitId[],
  ): Promise<void> {
    return this.replaceProgramCompletions(learnerId, programVersionId, [
      { courseVersionId, completedUnitIds },
    ]);
  }

  async replaceProgramCompletions(
    learnerId: string,
    programVersionId: ProgramVersionId,
    replacements: readonly CourseCompletionReplacement[],
  ): Promise<void> {
    const bundle = await this.requireBundle(programVersionId);
    const seenCourses = new Set<string>();
    const normalized = replacements.map((replacement) => {
      if (seenCourses.has(replacement.courseVersionId)) {
        throw new LearnerProgressValidationError([
          `Course ${replacement.courseVersionId} is replaced more than once.`,
        ]);
      }
      seenCourses.add(replacement.courseVersionId);
      const completedUnitIds = [...new Set(replacement.completedUnitIds)];
      requireUnitIds(
        bundle,
        replacement.courseVersionId,
        completedUnitIds,
      );
      return {
        courseVersionId: replacement.courseVersionId,
        completedUnitIds,
      };
    });
    if (normalized.length === 0) return;
    const courseVersionIds = normalized.map(
      (replacement) => replacement.courseVersionId,
    );
    const completions = normalized.flatMap((replacement) =>
      replacement.completedUnitIds.map((learningUnitId) => ({
        courseVersionId: replacement.courseVersionId,
        learningUnitId,
      })),
    );
    await d1Batch(
      this.database,
      [
        this.ensureEnrollment(learnerId, bundle),
        this.database
          .prepare(
            `DELETE FROM learner_unit_completions
             WHERE learner_id = ?
               AND program_version_id = ?
               AND course_version_id IN (
                 SELECT CAST(value AS TEXT)
                 FROM json_each(?)
               )`,
          )
          .bind(
            learnerId,
            programVersionId,
            canonicalJson(courseVersionIds),
          ),
        this.database
          .prepare(
            `INSERT INTO learner_unit_completions (
               learner_id,
               program_version_id,
               course_version_id,
               learning_unit_id
             )
             SELECT
               ?,
               ?,
               CAST(json_extract(value, '$.courseVersionId') AS TEXT),
               CAST(json_extract(value, '$.learningUnitId') AS TEXT)
             FROM json_each(?)
             WHERE true
             ON CONFLICT DO NOTHING`,
          )
          .bind(
            learnerId,
            programVersionId,
            canonicalJson(completions),
          ),
      ],
      "replace program completions",
    );
  }

  async getProgressImport(
    learnerId: string,
    clientImportId: string,
  ): Promise<ProgressImportReceipt | undefined> {
    const rows = await d1All<ProgressImportRow>(
      this.database
        .prepare(
          `SELECT
             learner_id,
             client_import_id,
             storage_namespace,
             disposition,
             payload_hash,
             imported_unit_count,
             confirmed_at
           FROM learner_progress_imports
           WHERE learner_id = ? AND client_import_id = ?`,
        )
        .bind(learnerId, clientImportId),
      "get progress import",
    );
    if (rows.length > 1) {
      throw new LearnerProgressDataError([
        `Multiple import receipts exist for ${learnerId}/${clientImportId}.`,
      ]);
    }
    return rows[0] ? receiptFromRow(rows[0]) : undefined;
  }

  async importLocalProgress(
    input: ImportLocalProgressInput,
  ): Promise<ProgressImportReceipt> {
    const learnerId = nonEmpty(input.learnerId, "learnerId");
    const clientImportId = nonEmpty(input.clientImportId, "clientImportId");
    const storageNamespace = nonEmpty(
      input.storageNamespace,
      "storageNamespace",
    );
    if (input.disposition !== "merged" && input.disposition !== "cloud") {
      throw new LearnerProgressValidationError([
        `disposition must be "merged" or "cloud".`,
      ]);
    }
    const programs = normalizeImportPrograms(input.programs);
    const payloadHash = await sha256Hex(
      canonicalJson({
        disposition: input.disposition,
        programs,
        storageNamespace,
      }),
    );
    const existing = await this.getProgressImport(
      learnerId,
      clientImportId,
    );
    if (existing) {
      if (
        existing.payloadHash !== payloadHash ||
        existing.disposition !== input.disposition ||
        existing.storageNamespace !== storageNamespace
      ) {
        throw new ProgressImportConflictError(learnerId, clientImportId);
      }
      return existing;
    }

    const validated: Array<{
      bundle: PublishedProgramBundle;
      program: NormalizedImportProgram;
    }> = [];
    if (input.disposition === "merged") {
      for (const program of programs) {
        const bundle = await this.requireBundle(program.programVersionId);
        requireConcentration(bundle, program.selectedConcentrationId);
        for (const course of program.courses) {
          requireUnitIds(
            bundle,
            course.courseVersionId,
            course.completedUnitIds,
          );
        }
        validated.push({ bundle, program });
      }
    }

    const importedUnitCount =
      input.disposition === "merged"
        ? validated.reduce(
            (programTotal, { program }) =>
              programTotal +
              program.courses.reduce(
                (courseTotal, course) =>
                  courseTotal + course.completedUnitIds.length,
                0,
              ),
            0,
          )
        : 0;
    const receiptExistsSql = `
      EXISTS (
        SELECT 1
        FROM learner_progress_imports
        WHERE learner_id = ?
          AND client_import_id = ?
          AND payload_hash = ?
      )
    `;
    const statements = [
      this.database
        .prepare(
          `INSERT INTO learner_progress_imports (
             learner_id,
             client_import_id,
             storage_namespace,
             disposition,
             payload_hash,
             imported_unit_count
           )
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT DO NOTHING`,
        )
        .bind(
          learnerId,
          clientImportId,
          storageNamespace,
          input.disposition,
          payloadHash,
          importedUnitCount,
        ),
    ];

    for (const { bundle, program } of validated) {
      statements.push(
        this.database
          .prepare(
            `INSERT INTO learner_program_progress (
               learner_id,
               program_version_id,
               bundle_id,
               selected_concentration_id
             )
             SELECT ?, ?, ?, ?
             WHERE ${receiptExistsSql}
             ON CONFLICT(learner_id, program_version_id) DO UPDATE SET
               selected_concentration_id = COALESCE(
                 excluded.selected_concentration_id,
                 learner_program_progress.selected_concentration_id
               ),
               updated_at = CURRENT_TIMESTAMP`,
          )
          .bind(
            learnerId,
            program.programVersionId,
            bundle.id,
            program.selectedConcentrationId ?? null,
            learnerId,
            clientImportId,
            payloadHash,
          ),
      );
      const completions = program.courses.flatMap((course) =>
        course.completedUnitIds.map((learningUnitId) => ({
          courseVersionId: course.courseVersionId,
          learningUnitId,
        })),
      );
      if (completions.length > 0) {
        statements.push(
          this.database
            .prepare(
              `INSERT INTO learner_unit_completions (
                 learner_id,
                 program_version_id,
                 course_version_id,
                 learning_unit_id
               )
               SELECT
                 ?,
                 ?,
                 CAST(json_extract(value, '$.courseVersionId') AS TEXT),
                 CAST(json_extract(value, '$.learningUnitId') AS TEXT)
               FROM json_each(?)
               WHERE ${receiptExistsSql}
               ON CONFLICT DO NOTHING`,
            )
            .bind(
              learnerId,
              program.programVersionId,
              canonicalJson(completions),
              learnerId,
              clientImportId,
              payloadHash,
            ),
        );
      }
    }

    await d1Batch(this.database, statements, "import local progress");
    const receipt = await this.getProgressImport(learnerId, clientImportId);
    if (!receipt) {
      throw new LearnerProgressDataError([
        `Import ${clientImportId} was not readable after confirmation.`,
      ]);
    }
    if (
      receipt.payloadHash !== payloadHash ||
      receipt.disposition !== input.disposition ||
      receipt.storageNamespace !== storageNamespace
    ) {
      throw new ProgressImportConflictError(learnerId, clientImportId);
    }
    return receipt;
  }

  private async findAccount(
    provider: string,
    subject: string,
  ): Promise<AccountRow | undefined> {
    const rows = await d1All<AccountRow>(
      this.database
        .prepare(
          `SELECT
             learner_accounts.id AS account_id,
             learner_accounts.learner_id,
             learner_accounts.provider,
             learner_accounts.provider_subject,
             learner_accounts.email,
             learners.display_name
           FROM learner_accounts
           JOIN learners ON learners.id = learner_accounts.learner_id
           WHERE learner_accounts.provider = ?
             AND learner_accounts.provider_subject = ?`,
        )
        .bind(provider, subject),
      "resolve learner account",
    );
    if (rows.length > 1) {
      throw new LearnerProgressDataError([
        `Multiple learner accounts exist for ${provider}:${subject}.`,
      ]);
    }
    return rows[0];
  }

  private async requireBundle(
    programVersionId: ProgramVersionId,
  ): Promise<PublishedProgramBundle> {
    const bundle =
      await this.catalog.loadByProgramVersionId(programVersionId);
    if (!bundle) {
      throw new LearnerProgressValidationError([
        `Program version ${programVersionId} is not published in D1.`,
      ]);
    }
    return bundle;
  }

  private ensureEnrollment(
    learnerId: string,
    bundle: PublishedProgramBundle,
  ) {
    return this.database
      .prepare(
        `INSERT INTO learner_program_progress (
           learner_id,
           program_version_id,
           bundle_id
         )
         VALUES (?, ?, ?)
         ON CONFLICT(learner_id, program_version_id) DO UPDATE SET
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(learnerId, bundle.programVersion.id, bundle.id);
  }
}
