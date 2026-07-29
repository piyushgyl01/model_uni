"use client";

// Anonymous/offline cache namespace: course-atlas-progress-v2.
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CourseVersionId,
  LearningUnitId,
  ProgramVersionId,
} from "./domain/catalog";
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
  hasMeaningfulLocalProgress,
  makeImportRequest,
  pendingUpdatesForProgram,
  PROGRESS_EVENT,
  readLocalCourseUnits,
  readProgressStore,
  replaceLocalProgramFromCloud,
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
  const allowedUnitIds = useMemo(
    () => new Set<string>(units.map((unit) => unit.id)),
    [units],
  );
  const [completedUnitIds, setCompletedUnitIds] = useState<
    readonly LearningUnitId[]
  >([]);
  const [connection, setConnection] = useState<ProgressConnection>({
    kind: "checking",
  });
  const [saveState, setSaveState] =
    useState<ProgressSaveState>("idle");
  const [needsImportDecision, setNeedsImportDecision] = useState(false);
  const [importBusy, setImportBusy] = useState(false);

  const refreshFromLocal = useCallback(() => {
    setCompletedUnitIds(
      readLocalCourseUnits(
        programVersionId,
        courseVersionId,
        allowedUnitIds,
      ),
    );
  }, [allowedUnitIds, courseVersionId, programVersionId]);

  const adoptCloudProgress = useCallback(
    (response: AuthenticatedProgressResponse) => {
      const cloudUnits =
        response.progress.courses[courseVersionId]?.completedUnitIds ?? [];
      setCompletedUnitIds(
        cloudUnits.filter((unitId) => allowedUnitIds.has(unitId)),
      );
      replaceLocalProgramFromCloud(response.progress);
      setConnection(connectionFromResponse(response));
      setNeedsImportDecision(false);
    },
    [allowedUnitIds, courseVersionId],
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
        const cloudUnits =
          response.progress.courses[courseVersionId]?.completedUnitIds ?? [];
        setCompletedUnitIds(
          cloudUnits.filter((unitId) => allowedUnitIds.has(unitId)),
        );
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
    allowedUnitIds,
    courseVersionId,
    programVersionId,
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
  }, [
    refreshFromLocal,
    refreshFromCloud,
  ]);

  const completedSet = useMemo(
    () => new Set(completedUnitIds),
    [completedUnitIds],
  );
  const percentage =
    units.length > 0
      ? Math.round((completedUnitIds.length / units.length) * 100)
      : 0;

  const update = async (next: readonly LearningUnitId[]) => {
    const clean = units
      .map((unit) => unit.id)
      .filter((unitId) => next.includes(unitId));
    setCompletedUnitIds(clean);

    if (connection.kind !== "signed-in") {
      const cached = writeLocalCourseUnits(
        programVersionId,
        courseVersionId,
        clean,
        true,
      );
      setSaveState(cached ? "device-only" : "error");
      return;
    }

    const clientImportId = ensureClientImportId();
    const cached = writeLocalCourseUnits(
      programVersionId,
      courseVersionId,
      clean,
      true,
    );
    setSaveState("saving");
    try {
      const response = await patchCloudProgress({
        programVersionId,
        clientImportId,
        courseUpdates: [{ courseVersionId, completedUnitIds: clean }],
      });
      adoptCloudProgress(response);
      setSaveState("saved");
    } catch {
      setSaveState(cached ? "device-only" : "error");
    }
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
        <span id="course-progress-title">Course progress</span>
        <strong>{percentage}%</strong>
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
        {completedUnitIds.length} of {units.length} learning units complete
        {completedUnitIds.length === units.length ? " · Course complete" : ""}
      </p>

      <div className="universal-progress-actions">
        <button
          type="button"
          className="button button-quiet"
          onClick={() => void update(units.map((unit) => unit.id))}
          disabled={
            controlsDisabled || completedUnitIds.length === units.length
          }
        >
          Mark all complete
        </button>
        <button
          type="button"
          className="button button-quiet"
          onClick={() => void update([])}
          disabled={controlsDisabled || completedUnitIds.length === 0}
        >
          Reset course
        </button>
      </div>

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
        Completion is pinned to this exact published course version.
      </small>
    </aside>
  );
}
