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
  readonly selectedConcentrationId?: string;
}

interface ProgressStore {
  readonly schemaVersion?: number;
  readonly programs?: Readonly<Record<string, StoredProgramProgress>>;
}

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

function readCompletedUnits(
  programVersionId: ProgramVersionId,
  courses: readonly ProgramProgressCourse[],
) {
  const storedCourses = readStore().programs?.[programVersionId]?.courses ?? {};
  const allowedByCourse = new Map(
    courses.map((course) => [
      course.courseVersionId,
      new Set<string>(course.unitIds),
    ]),
  );

  return Object.fromEntries(
    courses.map((course) => {
      const allowed = allowedByCourse.get(course.courseVersionId);
      const stored = storedCourses[course.courseVersionId]?.completedUnitIds;
      const completed = Array.isArray(stored)
        ? stored.filter(
            (unitId): unitId is string =>
              typeof unitId === "string" && Boolean(allowed?.has(unitId)),
          )
        : [];
      return [course.courseVersionId, completed];
    }),
  );
}

export default function ProgramProgress({
  programVersionId,
  courses,
  coreCourseVersionIds,
  concentrations,
}: ProgramProgressProps) {
  const [completedByCourse, setCompletedByCourse] = useState<
    Record<string, readonly string[]>
  >({});
  const [selectedConcentrationId, setSelectedConcentrationId] = useState(
    concentrations[0]?.id ?? "",
  );

  useEffect(() => {
    const refresh = () => {
      setCompletedByCourse(readCompletedUnits(programVersionId, courses));
      const stored =
        readStore().programs?.[programVersionId]?.selectedConcentrationId;
      if (
        stored &&
        concentrations.some((concentration) => concentration.id === stored)
      ) {
        setSelectedConcentrationId(stored);
      }
    };
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
  }, [concentrations, courses, programVersionId]);

  const activeCourses = useMemo(() => {
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
      (sum, course) =>
        sum + (completedByCourse[course.courseVersionId]?.length ?? 0),
      0,
    );
    const completedCourses = activeCourses.filter(
      (course) =>
        course.unitIds.length > 0 &&
        (completedByCourse[course.courseVersionId]?.length ?? 0) ===
          course.unitIds.length,
    ).length;

    return { totalUnits, completedUnits, completedCourses };
  }, [activeCourses, completedByCourse]);

  const percentage =
    totals.totalUnits > 0
      ? Math.round((totals.completedUnits / totals.totalUnits) * 100)
      : 0;

  const chooseConcentration = (id: string) => {
    setSelectedConcentrationId(id);
    const current = readStore();
    const programs = { ...(current.programs ?? {}) };
    const program = { ...(programs[programVersionId] ?? {}) };
    programs[programVersionId] = {
      ...program,
      selectedConcentrationId: id,
    };
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 2, programs }),
    );
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  };

  return (
    <aside className="universal-program-progress" aria-labelledby="program-progress-title">
      <div className="progress-label">
        <span id="program-progress-title">Your progress in this version</span>
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
      {concentrations.length > 0 && (
        <fieldset className="universal-progress-concentrations">
          <legend>Progress pathway</legend>
          {concentrations.map((concentration) => (
            <label key={concentration.id}>
              <input
                type="radio"
                name={`concentration-${programVersionId}`}
                checked={selectedConcentrationId === concentration.id}
                onChange={() => chooseConcentration(concentration.id)}
              />
              {concentration.title}
            </label>
          ))}
        </fieldset>
      )}
      <small>
        This activity meter does not override requirement or elective rules.
        Progress is saved only in this browser and kept separate for program
        version {programVersionId}.
      </small>
    </aside>
  );
}
