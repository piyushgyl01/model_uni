"use client";

// Anonymous/offline cache namespace: course-atlas-progress-v3.
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CourseVersionId,
  LearningUnitId,
  ProgramVersionId,
  WeeklyAssignment,
} from "./domain/catalog";
import {
  PROGRESS_STORAGE_NAMESPACE,
  type ProgressMutationOperation,
} from "./learner-progress-contract";
import {
  connectionFromResponse,
  importLocalProgress,
  syncStoredProgram,
  type ProgressConnection,
  type ProgressSaveState,
  type StoredProgramSyncResult,
} from "./progress-sync-client";
import ProgressSyncStatus from "./progress-sync-status";
import { CourseAssessmentProgress } from "./course-assessment-progress";
import { useCourseAccess } from "./course-access-context";
import { COURSE_MASTERY_STATE_LABELS } from "./domain/mastery";
import {
  enqueueProgressOperations,
  makeImportRequest,
  PROGRESS_EVENT,
  writeLocalCourseUnits,
} from "./progress-storage";

export interface CourseProgressUnit {
  readonly id: LearningUnitId;
  readonly label: string;
  readonly title: string;
}

/** Deterministic id for a week's schedule entry, so ticks are idempotent. */
function weekEntryId(unitId: LearningUnitId, week: number) {
  return `week-${unitId}-${week}`;
}

/** Published titles start "Week 3 · …", and the number is already shown. */
function weekTitle(title: string) {
  return title.replace(/^Week\s+\d+\s*[·:—–-]\s*/iu, "");
}

export interface CourseProgressProps {
  readonly programVersionId: ProgramVersionId;
  readonly courseVersionId: CourseVersionId;
  readonly units: readonly CourseProgressUnit[];
}

export default function CourseProgress({
  programVersionId,
  courseVersionId,
  units,
}: CourseProgressProps) {
  const {
    bundle,
    progress,
    mastery,
    prerequisites,
    hydrated,
    refresh,
  } = useCourseAccess();
  const [connection, setConnection] = useState<ProgressConnection>({
    kind: "checking",
  });
  const [saveState, setSaveState] =
    useState<ProgressSaveState>("idle");
  const [needsImportDecision, setNeedsImportDecision] = useState(false);
  const [importBusy, setImportBusy] = useState(false);

  const refreshFromLocal = useCallback(() => {
    refresh();
  }, [refresh]);

  const applySyncResult = useCallback(
    (result: StoredProgramSyncResult, afterWrite = false) => {
      refreshFromLocal();
      if (result.kind === "offline") {
        setConnection({ kind: "offline" });
        setNeedsImportDecision(false);
        setSaveState("device-only");
        return;
      }

      setConnection(connectionFromResponse(result.response));
      if (result.kind === "needs-import") {
        setNeedsImportDecision(true);
        setSaveState("idle");
        return;
      }

      setNeedsImportDecision(false);
      if (result.kind === "anonymous") {
        setSaveState(afterWrite ? "device-only" : "idle");
        return;
      }
      setSaveState(
        afterWrite || result.drainedMutations > 0 ? "saved" : "idle",
      );
    },
    [refreshFromLocal],
  );

  const refreshFromCloud = useCallback(
    async (afterWrite = false) => {
      applySyncResult(
        await syncStoredProgram(programVersionId),
        afterWrite,
      );
    },
    [applySyncResult, programVersionId],
  );

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
  }, [
    refreshFromLocal,
    refreshFromCloud,
  ]);

  const completedSet = useMemo(
    () => new Set(mastery.completedUnitIds),
    [mastery.completedUnitIds],
  );
  const completedUnitIds = [...completedSet];
  const percentage =
    units.length > 0
      ? Math.round((completedUnitIds.length / units.length) * 100)
      : 0;

  const update = async (next: readonly LearningUnitId[]) => {
    const clean = units
      .map((unit) => unit.id)
      .filter((unitId) => next.includes(unitId));
    const cached = writeLocalCourseUnits(
      programVersionId,
      courseVersionId,
      clean,
      true,
    );
    if (!cached) {
      setSaveState("error");
      return;
    }
    refreshFromLocal();
    setSaveState(connection.kind === "signed-in" ? "saving" : "device-only");
    await refreshFromCloud(true);
  };

  /**
   * The published curriculum already breaks each 20-hour unit into week-sized
   * work, and the scheduler already stores per-session completion. Surfacing
   * that here gives a learner something to finish most days instead of one
   * checkbox per twenty hours — and it reuses the existing schedule-entry
   * contract, so nothing about mastery, the calendar or storage changes.
   */
  const weeklyWorkByUnit = useMemo(() => {
    const byUnit = new Map<LearningUnitId, readonly WeeklyAssignment[]>();
    for (const unit of bundle.learningUnits) {
      if (unit.courseVersionId !== courseVersionId) continue;
      if (unit.weeklyAssignments && unit.weeklyAssignments.length > 0) {
        byUnit.set(unit.id, unit.weeklyAssignments);
      }
    }
    return byUnit;
  }, [bundle, courseVersionId]);

  const completedWeekIds = useMemo(() => {
    const done = new Set<string>();
    for (const entry of Object.values(progress?.scheduleEntries ?? {})) {
      if (entry.status === "completed") done.add(entry.id);
    }
    return done;
  }, [progress]);

  const toggleWeek = (unitId: LearningUnitId, week: number) => {
    const weeks = weeklyWorkByUnit.get(unitId) ?? [];
    const assignment = weeks.find((candidate) => candidate.week === week);
    if (!assignment) return;
    const entryId = weekEntryId(unitId, week);
    const completing = !completedWeekIds.has(entryId);
    const now = new Date().toISOString();

    // Every other week of this unit, so we know whether the unit is now done.
    const othersComplete = weeks
      .filter((candidate) => candidate.week !== week)
      .every((candidate) => completedWeekIds.has(weekEntryId(unitId, candidate.week)));

    const operations: ProgressMutationOperation[] = [
      {
        type: "upsert-schedule-entry",
        entry: {
          id: entryId,
          subject: { kind: "learningUnit", id: unitId },
          scheduledDate: now.slice(0, 10),
          plannedMinutes: Math.max(1, Math.round(assignment.estimatedHours * 60)),
          position: week,
          source: "manual",
          status: completing ? "completed" : "planned",
          ...(completing ? { completedAt: now } : {}),
          updatedAt: now,
        },
      },
    ];

    // Finishing the last week completes the unit; undoing any week reopens it.
    if (othersComplete) {
      operations.push({
        type: "set-unit-completion",
        courseVersionId,
        learningUnitId: unitId,
        completed: completing,
      });
    }

    if (!enqueueProgressOperations(programVersionId, operations)) {
      setSaveState("error");
      return;
    }
    // Deliberately no cloud refresh here. The queued mutation is the record;
    // pulling the cloud snapshot back over it discards the tick for a learner
    // who is not signed in. This mirrors how Today completes a session.
    refreshFromLocal();
    setSaveState(connection.kind === "signed-in" ? "saving" : "device-only");
  };

  const toggle = (unitId: LearningUnitId) => {
    void update(
      completedSet.has(unitId)
        ? completedUnitIds.filter((id) => id !== unitId)
        : [...completedUnitIds, unitId],
    );
  };

  const resolveImport = async (disposition: "merged" | "cloud") => {
    setImportBusy(true);
    setSaveState("saving");
    try {
      const request = makeImportRequest(programVersionId, disposition);
      await importLocalProgress(request);
      await refreshFromCloud(true);
    } catch {
      setSaveState("error");
    } finally {
      setImportBusy(false);
    }
  };

  const controlsDisabled =
    !hydrated ||
    !prerequisites.isUnlocked ||
    connection.kind === "checking" ||
    needsImportDecision ||
    saveState === "saving";

  if (units.length === 0) {
    return (
      <aside className="universal-course-progress universal-course-progress-empty">
        <ProgressSyncStatus
          connection={connection}
          saveState={saveState}
          needsImportDecision={needsImportDecision}
          importBusy={importBusy}
          onImport={() => void resolveImport("merged")}
          onUseCloud={() => void resolveImport("cloud")}
        />
        <strong>No trackable learning units are published yet.</strong>
        <p>Course completion cannot be calculated until units are available.</p>
      </aside>
    );
  }

  return (
    <aside className="universal-course-progress" aria-labelledby="course-progress-title">
      <ProgressSyncStatus
        connection={connection}
        saveState={saveState}
        needsImportDecision={needsImportDecision}
        importBusy={importBusy}
        onImport={() => void resolveImport("merged")}
        onUseCloud={() => void resolveImport("cloud")}
      />

      <div className="progress-label">
        <span id="course-progress-title">Course mastery</span>
        <strong>{COURSE_MASTERY_STATE_LABELS[mastery.state]}</strong>
      </div>
      <div
        className="progress-rail"
        role="progressbar"
        aria-label={`${completedUnitIds.length} of ${units.length} learning units complete`}
        aria-valuemin={0}
        aria-valuemax={units.length}
        aria-valuenow={completedUnitIds.length}
      >
        <span style={{ width: `${percentage}%` }} />
      </div>
      <p className="universal-progress-detail" aria-live="polite">
        {completedUnitIds.length} of {units.length} learning units complete · {percentage}% learning work
        {mastery.passed ? " · Course passed" : ""}
      </p>

      <div style={{ border: "1px solid #aaa", background: "#fff", padding: "0.65rem", margin: "0.75rem 0" }}>
        <strong>Passing requirements</strong>
        <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.2rem", fontSize: "0.85rem" }}>
          <li>{mastery.learningWorkComplete ? "✓" : "○"} Required learning work completed</li>
          <li>{mastery.requiredAssessmentsSubmitted ? "✓" : "○"} Required assessments submitted with evidence</li>
          <li>
            {mastery.passingThresholdSatisfied ? "✓" : "○"} Passing threshold satisfied
            {mastery.weightedScorePercentage !== undefined
              ? ` (${mastery.weightedScorePercentage.toFixed(1)}%)`
              : ""}
          </li>
          <li>{mastery.projectEvidenceComplete ? "✓" : "○"} Required project evidence present</li>
        </ul>
      </div>

      {!prerequisites.isUnlocked && (
        <p role="status" style={{ color: "#aa0000", fontWeight: "bold", fontSize: "0.85rem" }}>
          Learning and assessment controls are locked until the prerequisite is passed or a recorded waiver is granted.
        </p>
      )}

      <fieldset
        className="universal-unit-checklist"
        disabled={controlsDisabled}
      >
        <legend className="sr-only">Mark individual learning units complete</legend>
        {units.map((unit) => {
          const inputId = `progress-${courseVersionId}-${unit.id}`;
          const weeks = weeklyWorkByUnit.get(unit.id) ?? [];
          const doneWeeks = weeks.filter((week) =>
            completedWeekIds.has(weekEntryId(unit.id, week.week)),
          ).length;
          return (
            <div className="universal-unit-check" key={unit.id}>
              <input
                id={inputId}
                type="checkbox"
                checked={completedSet.has(unit.id)}
                onChange={() => toggle(unit.id)}
              />
              <span>
                <small>
                  {unit.label}
                  {weeks.length > 0 ? ` · ${doneWeeks} of ${weeks.length} weeks done` : null}
                </small>
                <label htmlFor={inputId}>{unit.title}</label>
                {weeks.length > 0 ? (
                  <span className="universal-week-list">
                    {weeks.map((week) => {
                      const weekId = weekEntryId(unit.id, week.week);
                      const weekInputId = `progress-${courseVersionId}-${weekId}`;
                      return (
                        <span className="universal-week-check" key={week.week}>
                          <input
                            id={weekInputId}
                            type="checkbox"
                            checked={completedWeekIds.has(weekId)}
                            onChange={() => toggleWeek(unit.id, week.week)}
                          />
                          <label htmlFor={weekInputId}>
                            <em>Week {week.week}</em> {weekTitle(week.title)}
                            <small>{week.estimatedHours} hours · {week.deliverable}</small>
                          </label>
                        </span>
                      );
                    })}
                  </span>
                ) : null}
                <a href={`#${unit.id}`}>View unit</a>
              </span>
            </div>
          );
        })}
      </fieldset>
      <small>
        Ticking every week of a unit completes it. Unit checks record learning
        work only; passing is pinned to this exact published course version and
        its grading policy.
      </small>

      <CourseAssessmentProgress
        disabled={controlsDisabled}
        onQueuedMutation={() => refreshFromCloud(true)}
      />
    </aside>
  );
}
