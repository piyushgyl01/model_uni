"use client";

import { useEffect, useState } from "react";
import type { CourseVersionId, PublishedProgramBundle } from "./domain/catalog";
import {
  evaluateCoursePrerequisites,
  getCompletedCourseVersionIds,
  type CoursePrerequisiteDetail,
} from "./domain/prerequisite-evaluator";
import { readProgressStore } from "./progress-storage";

interface PrerequisiteLockBannerProps {
  readonly bundle: PublishedProgramBundle;
  readonly courseVersionId: CourseVersionId;
}

const BYPASS_STORAGE_KEY = "course-atlas-prereq-bypasses:v1";

function readBypassedSet(): Set<CourseVersionId> {
  try {
    const val = localStorage.getItem(BYPASS_STORAGE_KEY);
    if (!val) return new Set();
    const arr = JSON.parse(val);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function writeBypass(courseVersionId: string) {
  try {
    const current = readBypassedSet();
    current.add(courseVersionId as CourseVersionId);
    localStorage.setItem(
      BYPASS_STORAGE_KEY,
      JSON.stringify(Array.from(current)),
    );
    window.dispatchEvent(new Event("course-atlas-progress-v2:changed"));
  } catch {
    // Ignore storage errors
  }
}

export function PrerequisiteLockBanner({
  bundle,
  courseVersionId,
}: PrerequisiteLockBannerProps) {
  const [mounted, setMounted] = useState(false);
  const [missingPrereqs, setMissingPrereqs] = useState<
    readonly CoursePrerequisiteDetail[]
  >([]);

  const checkStatus = () => {
    const store = readProgressStore().programs?.[bundle.programVersion.id];
    const completedIds = getCompletedCourseVersionIds(bundle, store);
    const bypassedIds = readBypassedSet();
    const evalResult = evaluateCoursePrerequisites(
      bundle,
      courseVersionId,
      completedIds,
      bypassedIds,
    );

    if (!evalResult.isUnlocked && evalResult.missingRequired.length > 0) {
      setMissingPrereqs(evalResult.missingRequired);
    } else {
      setMissingPrereqs([]);
    }
  };

  useEffect(() => {
    setMounted(true);
    checkStatus();

    const handleEvent = () => checkStatus();
    window.addEventListener("course-atlas-progress-v2:changed", handleEvent);
    return () => {
      window.removeEventListener("course-atlas-progress-v2:changed", handleEvent);
    };
  }, [bundle, courseVersionId]);

  if (!mounted || missingPrereqs.length === 0) {
    return null;
  }

  const handleBypass = () => {
    writeBypass(courseVersionId);
    setMissingPrereqs([]);
  };

  const programSlug = bundle.program.canonicalSlug;

  return (
    <div
      style={{
        border: "2px solid #cc0000",
        background: "#fff5f5",
        padding: "1.25rem",
        marginBottom: "1.5rem",
        boxShadow: "3px 3px 0px #cc0000",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.5rem",
        }}
      >
        <span style={{ fontSize: "1.3rem" }}>🔒</span>
        <h3 style={{ margin: 0, color: "#cc0000", fontSize: "1.15rem" }}>
          Prerequisite Lock Warning
        </h3>
      </div>

      <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.95rem", color: "#333" }}>
        You have not completed the required prerequisite courses for this subject
        yet. We strongly recommend completing them first to prevent getting stuck:
      </p>

      <ul style={{ margin: "0 0 1rem 0", paddingLeft: "1.25rem" }}>
        {missingPrereqs.map((prereq) => (
          <li key={prereq.courseVersionId} style={{ marginBottom: "0.3rem" }}>
            <a
              href={`/programs/${programSlug}/courses/${prereq.canonicalSlug}`}
              style={{
                fontWeight: "bold",
                textDecoration: "underline",
                color: "#0000ee",
              }}
            >
              {prereq.title}
            </a>{" "}
            <span style={{ fontSize: "0.85rem", color: "#cc0000" }}>
              (Required)
            </span>
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleBypass}
          style={{
            background: "#fff",
            border: "1px solid #cc0000",
            color: "#cc0000",
            padding: "0.4rem 0.85rem",
            fontSize: "0.85rem",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          🔓 I already know this material (Bypass Prerequisite Lock)
        </button>
      </div>
    </div>
  );
}
