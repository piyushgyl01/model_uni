"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  CourseVersionId,
  PublishedCourseVersion,
  PublishedProgramBundle,
} from "./domain/catalog";
import {
  evaluateCourseMastery,
  getMasteredCourseVersionIds,
  type CourseMasteryEvaluation,
} from "./domain/mastery";
import {
  evaluateCoursePrerequisites,
  getActiveWaivedPrerequisiteCourseVersionIds,
  type CoursePrerequisiteEvaluation,
} from "./domain/prerequisite-evaluator";
import {
  getStoredProgram,
  PROGRESS_EVENT,
  type StoredProgramProgress,
} from "./progress-storage";

interface CourseAccessContextValue {
  readonly bundle: PublishedProgramBundle;
  readonly courseVersion: PublishedCourseVersion;
  readonly progress: StoredProgramProgress | undefined;
  readonly mastery: CourseMasteryEvaluation;
  readonly prerequisites: CoursePrerequisiteEvaluation;
  readonly hydrated: boolean;
  readonly refresh: () => void;
}

const CourseAccessContext = createContext<CourseAccessContextValue | null>(null);

interface CourseAccessProviderProps {
  readonly bundle: PublishedProgramBundle;
  readonly courseVersionId: CourseVersionId;
  readonly children: ReactNode;
}

export function CourseAccessProvider({
  bundle,
  courseVersionId,
  children,
}: CourseAccessProviderProps) {
  const [progress, setProgress] = useState<StoredProgramProgress>();
  const [hydrated, setHydrated] = useState(false);
  const courseVersion = bundle.courseVersions.find(
    (course) => course.id === courseVersionId,
  );
  if (!courseVersion) {
    throw new Error(`Unknown course version ${courseVersionId}.`);
  }

  const refresh = useCallback(() => {
    setProgress(getStoredProgram(bundle.programVersion.id));
    setHydrated(true);
  }, [bundle.programVersion.id]);

  useEffect(() => {
    let active = true;
    // A microtask, not requestAnimationFrame: rAF never fires while the
    // document is hidden, so gating hydration on it left a course page opened
    // in a background tab unhydrated and its controls disabled forever.
    queueMicrotask(() => {
      if (active) refresh();
    });
    window.addEventListener(PROGRESS_EVENT, refresh);
    const storageChanged = () => refresh();
    window.addEventListener("storage", storageChanged);
    return () => {
      active = false;
      window.removeEventListener(PROGRESS_EVENT, refresh);
      window.removeEventListener("storage", storageChanged);
    };
  }, [refresh]);

  const mastery = useMemo(
    () => evaluateCourseMastery(bundle, courseVersionId, progress),
    [bundle, courseVersionId, progress],
  );
  const prerequisites = useMemo(() => {
    const masteredCourseVersionIds = getMasteredCourseVersionIds(
      bundle,
      progress,
    );
    return evaluateCoursePrerequisites(
      bundle,
      courseVersionId,
      masteredCourseVersionIds,
      getActiveWaivedPrerequisiteCourseVersionIds(progress, courseVersionId),
    );
  }, [bundle, courseVersionId, progress]);

  const value = useMemo<CourseAccessContextValue>(
    () => ({
      bundle,
      courseVersion,
      progress,
      mastery,
      prerequisites,
      hydrated,
      refresh,
    }),
    [bundle, courseVersion, hydrated, mastery, prerequisites, progress, refresh],
  );

  return (
    <CourseAccessContext.Provider value={value}>
      {children}
    </CourseAccessContext.Provider>
  );
}

export function useCourseAccess() {
  const context = useContext(CourseAccessContext);
  if (!context) {
    throw new Error("Course learner controls require CourseAccessProvider.");
  }
  return context;
}
