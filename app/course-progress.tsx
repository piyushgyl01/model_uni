"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CourseVersionId,
  LearningUnitId,
  ProgramVersionId,
} from "./domain/catalog";

const STORAGE_KEY = "course-atlas-progress-v2";
const PROGRESS_EVENT = "course-atlas-progress-v2:changed";

interface StoredCourseProgress {
  readonly completedUnitIds?: readonly string[];
  readonly updatedAt?: string;
}

interface StoredProgramProgress {
  readonly courses?: Readonly<Record<string, StoredCourseProgress>>;
}

interface ProgressStore {
  readonly schemaVersion?: number;
  readonly programs?: Readonly<Record<string, StoredProgramProgress>>;
}

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

function readStore(): ProgressStore {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return {};
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as ProgressStore)
      : {};
  } catch {
    return {};
  }
}

function readCourseProgress(
  programVersionId: ProgramVersionId,
  courseVersionId: CourseVersionId,
  allowedUnitIds: ReadonlySet<string>,
) {
  const stored =
    readStore().programs?.[programVersionId]?.courses?.[courseVersionId]
      ?.completedUnitIds;
  if (!Array.isArray(stored)) return [];
  return stored.filter(
    (unitId): unitId is string =>
      typeof unitId === "string" && allowedUnitIds.has(unitId),
  );
}

function writeCourseProgress(
  programVersionId: ProgramVersionId,
  courseVersionId: CourseVersionId,
  completedUnitIds: readonly string[],
) {
  const current = readStore();
  const programs = { ...(current.programs ?? {}) };
  const program = { ...(programs[programVersionId] ?? {}) };
  const courses = { ...(program.courses ?? {}) };

  courses[courseVersionId] = {
    completedUnitIds: [...completedUnitIds],
    updatedAt: new Date().toISOString(),
  };
  programs[programVersionId] = { ...program, courses };

  const next: ProgressStore = { schemaVersion: 2, programs };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(PROGRESS_EVENT));
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
  const [completedUnitIds, setCompletedUnitIds] = useState<readonly string[]>([]);

  useEffect(() => {
    const refresh = () =>
      setCompletedUnitIds(
        readCourseProgress(
          programVersionId,
          courseVersionId,
          allowedUnitIds,
        ),
      );
    const hydrationFrame = window.requestAnimationFrame(refresh);
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) refresh();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(PROGRESS_EVENT, refresh);
    return () => {
      window.cancelAnimationFrame(hydrationFrame);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PROGRESS_EVENT, refresh);
    };
  }, [allowedUnitIds, courseVersionId, programVersionId]);

  const completedSet = useMemo(
    () => new Set(completedUnitIds),
    [completedUnitIds],
  );
  const percentage =
    units.length > 0
      ? Math.round((completedUnitIds.length / units.length) * 100)
      : 0;

  const update = (next: readonly string[]) => {
    const clean = units
      .map((unit) => unit.id)
      .filter((unitId) => next.includes(unitId));
    setCompletedUnitIds(clean);
    writeCourseProgress(programVersionId, courseVersionId, clean);
  };

  const toggle = (unitId: LearningUnitId) => {
    update(
      completedSet.has(unitId)
        ? completedUnitIds.filter((id) => id !== unitId)
        : [...completedUnitIds, unitId],
    );
  };

  if (units.length === 0) {
    return (
      <aside className="universal-course-progress universal-course-progress-empty">
        <strong>No trackable learning units are published yet.</strong>
        <p>Course completion cannot be calculated until units are available.</p>
      </aside>
    );
  }

  return (
    <aside className="universal-course-progress" aria-labelledby="course-progress-title">
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
          onClick={() => update(units.map((unit) => unit.id))}
          disabled={completedUnitIds.length === units.length}
        >
          Mark all complete
        </button>
        <button
          type="button"
          className="button button-quiet"
          onClick={() => update([])}
          disabled={completedUnitIds.length === 0}
        >
          Reset course
        </button>
      </div>

      <fieldset className="universal-unit-checklist">
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
        Saved only in this browser for this exact published course version.
      </small>
    </aside>
  );
}
