"use client";

// Anonymous/offline cache namespace: course-atlas-progress-v3.
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CourseVersionId,
  LearningUnitId,
  ProgramVersionId,
} from "./domain/catalog";
import { PROGRESS_STORAGE_NAMESPACE } from "./learner-progress-contract";
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
  makeImportRequest,
  PROGRESS_EVENT,
  writeLocalCourseUnits,
} from "./progress-storage";

export interface CourseProgressUnit {
  readonly id: LearningUnitId;
  readonly label: string;
  readonly title: string;
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
          return (
            <div className="universal-unit-check" key={unit.id}>
              <input
                id={inputId}
                type="checkbox"
                checked={completedSet.has(unit.id)}
                onChange={() => toggle(unit.id)}
              />
              <span>
                <small>{unit.label}</small>
                <label htmlFor={inputId}>{unit.title}</label>
                <a href={`#${unit.id}`}>View unit</a>
              </span>
            </div>
          );
        })}
      </fieldset>
      <small>
        Unit checks record learning work only. Passing is pinned to this exact published course version and its grading policy.
      </small>

      <CourseAssessmentProgress
        disabled={controlsDisabled}
        onQueuedMutation={() => refreshFromCloud(true)}
      />
    </aside>
  );
}
