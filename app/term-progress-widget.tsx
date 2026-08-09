"use client";

import { useEffect, useState } from "react";
import type { PublishedProgramBundle } from "./domain/catalog";
import { getCompletedCourseVersionIds } from "./domain/prerequisite-evaluator";
import { evaluateTermProgress, type TermProgressEvaluation } from "./domain/term-evaluator";
import { PROGRESS_EVENT, readProgressStore } from "./progress-storage";

interface TermProgressWidgetProps {
  readonly bundle: PublishedProgramBundle;
}

export function TermProgressWidget({ bundle }: TermProgressWidgetProps) {
  const [mounted, setMounted] = useState(false);
  const [evalResult, setEvalResult] = useState<TermProgressEvaluation | null>(null);

  useEffect(() => {
    const update = () => {
      const store = readProgressStore().programs?.[bundle.programVersion.id];
      const completedIds = getCompletedCourseVersionIds(bundle, store);
      const result = evaluateTermProgress(
        bundle,
        completedIds,
        store?.selectedConcentrationId,
      );
      setEvalResult(result);
      setMounted(true);
    };

    update();
    const handleEvent = () => update();
    window.addEventListener(PROGRESS_EVENT, handleEvent);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, handleEvent);
    };
  }, [bundle]);

  if (!mounted || !evalResult) {
    return null;
  }

  const {
    totalTerms,
    activeTermLabel,
    activeTermProgress,
    nextTermProgress,
    allTermsSatisfied,
  } = evalResult;

  return (
    <div
      style={{
        border: "2px solid #000",
        background: allTermsSatisfied ? "#e6ffe6" : "#ffffff",
        padding: "1.25rem",
        marginBottom: "1.5rem",
        boxShadow: "3px 3px 0px #000",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.2rem" }}>📍</span>
          <h3 style={{ margin: 0, fontSize: "1.15rem" }}>
            {allTermsSatisfied
              ? "🎉 All Terms Completed!"
              : `Current Journey Status: You are in ${activeTermLabel} of ${totalTerms}`}
          </h3>
        </div>

        <span
          style={{
            fontSize: "0.8rem",
            padding: "0.2rem 0.5rem",
            background: "#000",
            color: "#fff",
            fontWeight: "bold",
            fontFamily: "monospace",
          }}
        >
          {activeTermProgress.completedCourses} / {activeTermProgress.totalCourses} COURSES DONE ({activeTermProgress.percentage}%)
        </span>
      </div>

      {/* Term Progress Bar */}
      <div
        style={{
          height: "10px",
          background: "#eee",
          border: "1px solid #000",
          marginBottom: "0.85rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${activeTermProgress.percentage}%`,
            background: allTermsSatisfied ? "#008800" : "#0000ee",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      <div style={{ fontSize: "0.9rem", color: "#333", marginBottom: "0.5rem" }}>
        <strong>Current {activeTermLabel} Subjects:</strong>{" "}
        {activeTermProgress.courseTitles.length > 0
          ? activeTermProgress.courseTitles.join(" · ")
          : "Full term schedule"}
      </div>

      {/* Up Next in Term N+1 Box */}
      {nextTermProgress && nextTermProgress.courseTitles.length > 0 && (
        <div
          style={{
            marginTop: "0.85rem",
            padding: "0.65rem 0.85rem",
            background: "#f9f9f9",
            border: "1px solid #ddd",
            fontSize: "0.85rem",
          }}
        >
          <strong style={{ color: "#555" }}>
            ⏭️ Coming Up Next in {nextTermProgress.label}:
          </strong>{" "}
          <span style={{ color: "#444" }}>
            {nextTermProgress.courseTitles.join(" · ")}
          </span>
        </div>
      )}
    </div>
  );
}
