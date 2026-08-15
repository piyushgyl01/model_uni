"use client";

import { useEffect, useState } from "react";
import type { PublishedProgramBundle } from "./domain/catalog";
import { getCompletedCourseVersionIds } from "./domain/prerequisite-evaluator";
import { evaluateTermProgress, type TermProgressEvaluation } from "./domain/term-evaluator";
import { PROGRESS_EVENT, readProgressStore } from "./progress-storage";
import type { LearnerTermView } from "./catalog/learner-read-model-repository";

type TermProgressWidgetProps =
  | { readonly bundle: PublishedProgramBundle; readonly terms?: never; readonly currentPeriodLabel?: never }
  | {
      readonly bundle?: never;
      readonly terms?: never;
      readonly currentPeriodLabel?: never;
      readonly evaluation: TermProgressEvaluation;
    }
  | {
      readonly bundle?: never;
      readonly terms: readonly LearnerTermView[];
      readonly currentPeriodLabel: string;
      readonly evaluation?: never;
    };

export function TermProgressWidget(props: TermProgressWidgetProps) {
  const bundle = props.bundle;
  const [mounted, setMounted] = useState(false);
  const [evalResult, setEvalResult] = useState<TermProgressEvaluation | null>(null);

  useEffect(() => {
    if (!bundle) return;
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

  const projectedEvaluation =
    "evaluation" in props ? props.evaluation : undefined;
  if (projectedEvaluation) {
    return (
      <TermProgressFrame
        totalTerms={projectedEvaluation.totalTerms}
        activeTermLabel={projectedEvaluation.activeTermLabel}
        completed={projectedEvaluation.activeTermProgress.completedCourses}
        total={projectedEvaluation.activeTermProgress.totalCourses}
        unitLabel="COURSES DONE"
        percentage={projectedEvaluation.activeTermProgress.percentage}
        courseTitles={projectedEvaluation.activeTermProgress.courseTitles}
        nextLabel={projectedEvaluation.nextTermProgress?.label}
        nextCourseTitles={
          projectedEvaluation.nextTermProgress?.courseTitles ?? []
        }
        allTermsSatisfied={projectedEvaluation.allTermsSatisfied}
      />
    );
  }

  if (props.terms) {
    const activeIndex = Math.max(
      0,
      props.terms.findIndex(
        (term) =>
          term.status === "current" || term.label === props.currentPeriodLabel,
      ),
    );
    const active = props.terms[activeIndex];
    if (!active) return null;
    const allTermsSatisfied = props.terms.every(
      (term) => term.status === "completed",
    );
    const percentage = Math.round(
      (active.completedMinutes / Math.max(1, active.totalPlannedMinutes)) * 100,
    );
    const next = props.terms[activeIndex + 1];
    return (
      <TermProgressFrame
        totalTerms={props.terms.length}
        activeTermLabel={active.label}
        completed={Math.round(active.completedMinutes / 60)}
        total={Math.round(active.totalPlannedMinutes / 60)}
        unitLabel="HOURS DONE"
        percentage={percentage}
        courseTitles={[]}
        nextLabel={next?.label}
        nextCourseTitles={[]}
        allTermsSatisfied={allTermsSatisfied}
      />
    );
  }

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
    <TermProgressFrame
      totalTerms={totalTerms}
      activeTermLabel={activeTermLabel}
      completed={activeTermProgress.completedCourses}
      total={activeTermProgress.totalCourses}
      unitLabel="COURSES DONE"
      percentage={activeTermProgress.percentage}
      courseTitles={activeTermProgress.courseTitles}
      nextLabel={nextTermProgress?.label}
      nextCourseTitles={nextTermProgress?.courseTitles ?? []}
      allTermsSatisfied={allTermsSatisfied}
    />
  );
}

function TermProgressFrame({
  totalTerms,
  activeTermLabel,
  completed,
  total,
  unitLabel,
  percentage,
  courseTitles,
  nextLabel,
  nextCourseTitles,
  allTermsSatisfied,
}: {
  readonly totalTerms: number;
  readonly activeTermLabel: string;
  readonly completed: number;
  readonly total: number;
  readonly unitLabel: string;
  readonly percentage: number;
  readonly courseTitles: readonly string[];
  readonly nextLabel?: string;
  readonly nextCourseTitles: readonly string[];
  readonly allTermsSatisfied: boolean;
}) {
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
                    <h3 style={{ margin: 0, fontSize: "1.15rem" }}>
            {allTermsSatisfied
              ? "All Terms Completed!"
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
          {completed} / {total} {unitLabel} ({percentage}%)
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
            width: `${percentage}%`,
            background: allTermsSatisfied ? "#008800" : "#0000ee",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      <div style={{ fontSize: "0.9rem", color: "#333", marginBottom: "0.5rem" }}>
        <strong>Current {activeTermLabel} Subjects:</strong>{" "}
        {courseTitles.length > 0
          ? courseTitles.join(" · ")
          : "Full term schedule"}
      </div>

      {/* Up Next in Term N+1 Box */}
      {nextLabel && (
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
            ⏭ Coming Up Next in {nextLabel}:
          </strong>{" "}
          <span style={{ color: "#444" }}>
            {nextCourseTitles.length > 0
              ? nextCourseTitles.join(" · ")
              : "The next term in your exact pathway"}
          </span>
        </div>
      )}
    </div>
  );
}
