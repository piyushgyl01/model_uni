"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CourseVersionId,
  LearningUnitId,
  ProgramVersionId,
  PublishedProgramBundle,
} from "./domain/catalog";
import { resolveLearnerPath } from "./domain/learner-path";
import { evaluateProgramRequirements } from "./domain/validation";
import {
  PROGRESS_STORAGE_NAMESPACE,
  type AuthenticatedProgressResponse,
} from "./learner-progress-contract";
import {
  connectionFromResponse,
  importLocalProgress,
  loadCloudProgress,
  patchCloudProgress,
  type ProgressConnection,
  type ProgressSaveState,
} from "./progress-sync-client";
import ProgressSyncStatus from "./progress-sync-status";
import {
  ensureClientImportId,
  getStoredProgram,
  hasMeaningfulLocalProgress,
  makeImportRequest,
  pendingUpdatesForProgram,
  PROGRESS_EVENT,
  readLocalCourseUnits,
  readProgressStore,
  replaceLocalProgramFromCloud,
  writeLocalConcentration,
} from "./progress-storage";

export interface ProgramProgressCourse {
  readonly courseVersionId: CourseVersionId;
  readonly title: string;
  readonly unitIds: readonly LearningUnitId[];
}

export interface ProgramProgressProps {
  readonly programVersionId: ProgramVersionId;
  readonly courses: readonly ProgramProgressCourse[];
  readonly coreCourseVersionIds: readonly CourseVersionId[];
  readonly concentrations: readonly {
    readonly id: string;
    readonly title: string;
    readonly courseVersionIds: readonly CourseVersionId[];
  }[];
  readonly bundle?: PublishedProgramBundle;
}

function localCompletedByCourse(
  programVersionId: ProgramVersionId,
  courses: readonly ProgramProgressCourse[],
) {
  return Object.fromEntries(
    courses.map((course) => [
      course.courseVersionId,
      readLocalCourseUnits(
        programVersionId,
        course.courseVersionId,
        new Set(course.unitIds),
      ),
    ]),
  );
}

export default function ProgramProgress({
  programVersionId,
  courses,
  coreCourseVersionIds,
  concentrations,
  bundle,
}: ProgramProgressProps) {
  const [completedByCourse, setCompletedByCourse] = useState<
    Record<string, readonly LearningUnitId[]>
  >({});
  const [selectedConcentrationId, setSelectedConcentrationId] = useState(
    concentrations[0]?.id ?? "",
  );
  const [connection, setConnection] = useState<ProgressConnection>({
    kind: "checking",
  });
  const [saveState, setSaveState] =
    useState<ProgressSaveState>("idle");
  const [needsImportDecision, setNeedsImportDecision] = useState(false);
  const [importBusy, setImportBusy] = useState(false);

  const refreshFromLocal = useCallback(() => {
    setCompletedByCourse(localCompletedByCourse(programVersionId, courses));
    const storedConcentration =
      getStoredProgram(programVersionId)?.selectedConcentrationId;
    if (
      storedConcentration &&
      concentrations.some(
        (concentration) => concentration.id === storedConcentration,
      )
    ) {
      setSelectedConcentrationId(storedConcentration);
    }
  }, [concentrations, courses, programVersionId]);

  const validUnitsByCourse = useMemo(
    () =>
      new Map(
        courses.map((course) => [
          course.courseVersionId,
          new Set<string>(course.unitIds),
        ]),
      ),
    [courses],
  );

  const adoptCloudProgress = useCallback(
    (response: AuthenticatedProgressResponse) => {
      setCompletedByCourse(
        Object.fromEntries(
          courses.map((course) => {
            const allowed = validUnitsByCourse.get(course.courseVersionId);
            const completed =
              response.progress.courses[course.courseVersionId]
                ?.completedUnitIds ?? [];
            return [
              course.courseVersionId,
              completed.filter((unitId) => allowed?.has(unitId)),
            ];
          }),
        ),
      );
      const cloudConcentration = response.progress.selectedConcentrationId;
      setSelectedConcentrationId(
        cloudConcentration &&
          concentrations.some(
            (concentration) => concentration.id === cloudConcentration,
          )
          ? cloudConcentration
          : concentrations[0]?.id ?? "",
      );
      replaceLocalProgramFromCloud(response.progress);
      setConnection(connectionFromResponse(response));
      setNeedsImportDecision(false);
    },
    [concentrations, courses, validUnitsByCourse],
  );

  const showCloudWithoutReplacingLocal = useCallback(
    (response: AuthenticatedProgressResponse) => {
      setCompletedByCourse(
        Object.fromEntries(
          courses.map((course) => {
            const allowed = validUnitsByCourse.get(course.courseVersionId);
            const completed =
              response.progress.courses[course.courseVersionId]
                ?.completedUnitIds ?? [];
            return [
              course.courseVersionId,
              completed.filter((unitId) => allowed?.has(unitId)),
            ];
          }),
        ),
      );
      const cloudConcentration = response.progress.selectedConcentrationId;
      setSelectedConcentrationId(
        cloudConcentration &&
          concentrations.some(
            (concentration) => concentration.id === cloudConcentration,
          )
          ? cloudConcentration
          : concentrations[0]?.id ?? "",
      );
    },
    [concentrations, courses, validUnitsByCourse],
  );

  const refreshFromCloud = useCallback(async () => {
    const clientImportId = ensureClientImportId();
    const localBeforeCloud = readProgressStore();
    const response = await loadCloudProgress(
      programVersionId,
      clientImportId,
    );
    setConnection(connectionFromResponse(response));

    if (!response.authenticated) {
      setNeedsImportDecision(false);
      setSaveState("idle");
      return;
    }

    if (!response.importReceipt) {
      if (hasMeaningfulLocalProgress(localBeforeCloud)) {
        showCloudWithoutReplacingLocal(response);
        setNeedsImportDecision(true);
        return;
      }

      await importLocalProgress(
        makeImportRequest(programVersionId, "cloud"),
      );
      const confirmed = await loadCloudProgress(
        programVersionId,
        clientImportId,
      );
      if (confirmed.authenticated) adoptCloudProgress(confirmed);
      return;
    }

    const pending = pendingUpdatesForProgram(programVersionId);
    if (
      pending.courseUpdates.length > 0 ||
      pending.concentrationUpdate
    ) {
      const saved = await patchCloudProgress({
        programVersionId,
        clientImportId,
        courseUpdates: pending.courseUpdates,
        concentrationUpdate: pending.concentrationUpdate,
      });
      adoptCloudProgress(saved);
      setSaveState("saved");
      return;
    }

    adoptCloudProgress(response);
    setSaveState("idle");
  }, [
    adoptCloudProgress,
    programVersionId,
    showCloudWithoutReplacingLocal,
  ]);

  useEffect(() => {
    let active = true;
    const hydrationFrame = window.requestAnimationFrame(() => {
      if (!active) return;
      refreshFromLocal();
      refreshFromCloud().catch(() => {
        if (!active) return;
        setConnection({ kind: "offline" });
        setNeedsImportDecision(false);
        setSaveState("device-only");
      });
    });

    const reconnect = () => {
      setConnection({ kind: "checking" });
      refreshFromCloud().catch(() => {
        if (active) setConnection({ kind: "offline" });
      });
    };
    const localProgressChanged = () => {
      if (active) refreshFromLocal();
    };
    const storedProgressChanged = (event: StorageEvent) => {
      if (event.key === PROGRESS_STORAGE_NAMESPACE) localProgressChanged();
    };
    window.addEventListener("online", reconnect);
    window.addEventListener(PROGRESS_EVENT, localProgressChanged);
    window.addEventListener("storage", storedProgressChanged);
    return () => {
      active = false;
      window.cancelAnimationFrame(hydrationFrame);
      window.removeEventListener("online", reconnect);
      window.removeEventListener(PROGRESS_EVENT, localProgressChanged);
      window.removeEventListener("storage", storedProgressChanged);
    };
  }, [refreshFromCloud, refreshFromLocal]);

  const activeCourses = useMemo(() => {
    if (bundle) {
      const learnerPath = resolveLearnerPath(bundle, {
        selectedConcentrationId,
      });
      return courses.filter((course) =>
        learnerPath.selectedCourseVersionIdSet.has(course.courseVersionId),
      );
    }
    if (concentrations.length === 0) return courses;
    const selected =
      concentrations.find(
        (concentration) => concentration.id === selectedConcentrationId,
      ) ?? concentrations[0];
    const activeIds = new Set([
      ...coreCourseVersionIds,
      ...selected.courseVersionIds,
    ]);
    return courses.filter((course) => activeIds.has(course.courseVersionId));
  }, [
    bundle,
    concentrations,
    coreCourseVersionIds,
    courses,
    selectedConcentrationId,
  ]);

  const totals = useMemo(() => {
    const totalUnits = activeCourses.reduce(
      (sum, course) => sum + course.unitIds.length,
      0,
    );
    const completedUnits = activeCourses.reduce(
      (sum, course) => {
        const allowed = new Set(course.unitIds);
        const completed = new Set(
          (completedByCourse[course.courseVersionId] ?? []).filter((unitId) =>
            allowed.has(unitId),
          ),
        );
        return sum + completed.size;
      },
      0,
    );
    const completedCourses = activeCourses.filter(
      (course) => {
        const allowed = new Set(course.unitIds);
        const completed = new Set(
          (completedByCourse[course.courseVersionId] ?? []).filter((unitId) =>
            allowed.has(unitId),
          ),
        );
        return course.unitIds.length > 0 && completed.size === allowed.size;
      },
    ).length;

    return { totalUnits, completedUnits, completedCourses };
  }, [activeCourses, completedByCourse]);

  const completedCourseVersionIds = useMemo(() => {
    const set = new Set<CourseVersionId>();
    for (const course of activeCourses) {
      const allowed = new Set(course.unitIds);
      const completed = new Set(
        (completedByCourse[course.courseVersionId] ?? []).filter((unitId) =>
          allowed.has(unitId),
        ),
      );
      if (course.unitIds.length > 0 && completed.size === allowed.size) {
        set.add(course.courseVersionId);
      }
    }
    return set;
  }, [activeCourses, completedByCourse]);

  const requirementEvaluation = useMemo(() => {
    if (!bundle) return undefined;
    return evaluateProgramRequirements(bundle, completedCourseVersionIds);
  }, [bundle, completedCourseVersionIds]);

  const percentage =
    totals.totalUnits > 0
      ? Math.round((totals.completedUnits / totals.totalUnits) * 100)
      : 0;

  const chooseConcentration = async (id: string) => {
    setSelectedConcentrationId(id);
    if (connection.kind !== "signed-in") {
      const cached = writeLocalConcentration(programVersionId, id, true);
      setSaveState(cached ? "device-only" : "error");
      return;
    }

    const clientImportId = ensureClientImportId();
    const cached = writeLocalConcentration(programVersionId, id, true);
    setSaveState("saving");
    try {
      const response = await patchCloudProgress({
        programVersionId,
        clientImportId,
        concentrationUpdate: { selectedConcentrationId: id },
      });
      adoptCloudProgress(response);
      setSaveState("saved");
    } catch {
      setSaveState(cached ? "device-only" : "error");
    }
  };

  const resolveImport = async (disposition: "merged" | "cloud") => {
    setImportBusy(true);
    setSaveState("saving");
    try {
      const request = makeImportRequest(programVersionId, disposition);
      await importLocalProgress(request);
      const response = await loadCloudProgress(
        programVersionId,
        request.clientImportId,
      );
      if (!response.authenticated) throw new Error("Sign-in ended.");
      adoptCloudProgress(response);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    } finally {
      setImportBusy(false);
    }
  };

  const controlsDisabled =
    connection.kind === "checking" ||
    needsImportDecision ||
    saveState === "saving";

  return (
    <aside className="universal-program-progress" aria-labelledby="program-progress-title">
      <ProgressSyncStatus
        connection={connection}
        saveState={saveState}
        needsImportDecision={needsImportDecision}
        importBusy={importBusy}
        onImport={() => void resolveImport("merged")}
        onUseCloud={() => void resolveImport("cloud")}
      />

      <div className="progress-label">
        <span id="program-progress-title">Overall Degree Progress</span>
        <strong>{percentage}%</strong>
      </div>
      <div
        className="progress-rail"
        role="progressbar"
        aria-label={`${percentage}% of learning units complete`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <span style={{ width: `${percentage}%` }} />
      </div>
      <p className="universal-progress-detail" aria-live="polite">
        {totals.completedUnits} of {totals.totalUnits} learning units ·{" "}
        {totals.completedCourses} of {activeCourses.length} courses completed
      </p>

      {/* REQUIREMENT-AWARE DEGREE STATUS BREAKDOWN */}
      {bundle && requirementEvaluation && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.85rem",
            border: "1px solid #000",
            background: requirementEvaluation.satisfied ? "#e6ffe6" : "#f9f9f9",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <strong style={{ fontSize: "0.95rem" }}>
              {requirementEvaluation.satisfied
                ? "🎓 Degree Requirements Satisfied!"
                : "📊 Degree Requirement Status"}
            </strong>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.15rem 0.4rem",
                background: requirementEvaluation.satisfied ? "#008800" : "#555",
                color: "#fff",
                fontWeight: "bold",
              }}
            >
              {requirementEvaluation.satisfied ? "AUDIT PASSED ✓" : "IN PROGRESS"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {bundle.programVersion.requirements.map((group) => {
              const groupEval = requirementEvaluation.groups.find(
                (g) => g.requirementGroupId === group.id,
              );
              const isSatisfied = groupEval?.satisfied ?? false;
              const selectedCount = groupEval?.selectedCourseVersionIds.length ?? 0;

              return (
                <div
                  key={group.id}
                  style={{
                    border: "1px solid #ddd",
                    background: "#fff",
                    padding: "0.5rem 0.65rem",
                    fontSize: "0.85rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{group.title}</strong>
                    <span style={{ color: isSatisfied ? "#008800" : "#cc0000", fontWeight: "bold" }}>
                      {isSatisfied ? "✓ Satisfied" : `${selectedCount} / ${group.rule.minSelections} Courses`}
                    </span>
                  </div>
                  {groupEval && groupEval.reasons.length > 0 && (
                    <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.2rem" }}>
                      {groupEval.reasons.join(" ")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: "0.65rem", textAlign: "right" }}>
            <a
              href="/transcript"
              style={{
                fontSize: "0.85rem",
                fontWeight: "bold",
                color: "#0000ee",
                textDecoration: "underline",
              }}
            >
              View Official Academic Transcript & Portfolio →
            </a>
          </div>
        </div>
      )}

      {concentrations.length > 0 && (
        <fieldset
          className="universal-progress-concentrations"
          disabled={controlsDisabled}
          style={{ marginTop: "1rem" }}
        >
          <legend>Progress pathway</legend>
          {concentrations.map((concentration) => (
            <label key={concentration.id}>
              <input
                type="radio"
                name={`concentration-${programVersionId}`}
                checked={selectedConcentrationId === concentration.id}
                onChange={() => void chooseConcentration(concentration.id)}
              />
              {concentration.title}
            </label>
          ))}
        </fieldset>
      )}
      <small style={{ marginTop: "0.5rem", display: "block" }}>
        Requirement audit evaluated live against published catalog contract v{programVersionId}.
      </small>
    </aside>
  );
}
