"use client";

import { useEffect, useState } from "react";
import type {
  ProgramRequirementEvaluation,
  PublishedProgramBundle,
} from "../domain/catalog";
import { evaluateProgramRequirements } from "../domain/validation";
import {
  getCompletedCourseVersionIds,
} from "../domain/prerequisite-evaluator";
import { resolveLearnerPath } from "../domain/learner-path";
import { syncStoredProgram } from "../progress-sync-client";
import {
  PROGRESS_EVENT,
  readProgressStore,
  type StoredProgramProgress,
} from "../progress-storage";

interface TranscriptPageClientProps {
  readonly bundles: readonly PublishedProgramBundle[];
}

export function TranscriptPageClient({ bundles }: TranscriptPageClientProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedProgramVersionId, setSelectedProgramVersionId] = useState<string>("");
  const [store, setStore] = useState<Record<string, StoredProgramProgress>>({});

  useEffect(() => {
    let active = true;
    const refreshStore = () => {
      if (!active) return;
      const current = readProgressStore();
      const programs = current.programs ?? {};
      setStore(programs);

      if (!selectedProgramVersionId) {
        const enrolledId = Object.keys(programs).find(
          (id) => programs[id]?.enrollment?.status === "enrolled",
        );
        if (enrolledId) {
          setSelectedProgramVersionId(enrolledId);
        } else if (bundles.length > 0) {
          setSelectedProgramVersionId(bundles[0].programVersion.id);
        }
      }
      setMounted(true);
    };

    const hydrateSuppliedPrograms = async () => {
      await Promise.all(
        bundles.map((bundle) =>
          syncStoredProgram(bundle.programVersion.id),
        ),
      );
      refreshStore();
    };

    refreshStore();
    void hydrateSuppliedPrograms();
    const handleEvent = () => refreshStore();
    const handleReconnect = () => void hydrateSuppliedPrograms();
    window.addEventListener(PROGRESS_EVENT, handleEvent);
    window.addEventListener("online", handleReconnect);
    return () => {
      active = false;
      window.removeEventListener(PROGRESS_EVENT, handleEvent);
      window.removeEventListener("online", handleReconnect);
    };
  }, [bundles, selectedProgramVersionId]);

  if (!mounted) {
    return (
      <div style={{ padding: "1.5rem", background: "#f9f9f9", border: "1px solid #ccc" }}>
        Loading official transcript & portfolio...
      </div>
    );
  }

  const activeBundle =
    bundles.find((b) => b.programVersion.id === selectedProgramVersionId) ??
    bundles[0];

  if (!activeBundle) {
    return <div>No active degree programs found.</div>;
  }

  const programProgress = store[activeBundle.programVersion.id];
  const selectedConcentrationId = activeBundle.concentrations.find(
    (concentration) =>
      concentration.id === programProgress?.selectedConcentrationId,
  )?.id;
  const learnerPath = resolveLearnerPath(activeBundle, {
    selectedConcentrationId,
  });
  const completedIds = getCompletedCourseVersionIds(activeBundle, programProgress);
  const requirementEvaluation: ProgramRequirementEvaluation =
    evaluateProgramRequirements(activeBundle, completedIds);

  const courseMap = new Map(activeBundle.courses.map((c) => [c.id, c]));

  // Collect course progress rows
  const courseRows = learnerPath.courseVersions.map((cv) => {
    const courseObj = courseMap.get(cv.courseId);
    const unitsInCourse = learnerPath.learningUnits.filter(
      (u) => u.courseVersionId === cv.id,
    );
    const courseProgress = programProgress?.courses?.[cv.id];
    const unitIdsInCourse = new Set(unitsInCourse.map((unit) => unit.id));
    const completedUnitsCount = new Set(
      (courseProgress?.completedUnitIds ?? []).filter((unitId) =>
        unitIdsInCourse.has(unitId as (typeof unitsInCourse)[number]["id"]),
      ),
    ).size;
    const isCompleted = completedIds.has(cv.id);

    return {
      courseVersionId: cv.id,
      code: courseObj?.codes[0]?.value ?? cv.format,
      title: cv.title,
      summary: cv.summary,
      format: cv.format,
      nominalHours: cv.nominalHours,
      totalUnits: unitsInCourse.length,
      completedUnits: completedUnitsCount,
      isCompleted,
      updatedAt: courseProgress?.updatedAt,
      evidences: courseProgress?.unitEvidences ?? {},
    };
  });

  const completedCoursesCount = courseRows.filter((c) => c.isCompleted).length;
  const totalUnitsInDegree = learnerPath.learningUnits.length;
  const completedUnitsInDegree = courseRows.reduce(
    (sum, c) => sum + c.completedUnits,
    0,
  );

  // Collect evidence list
  const allSubmittedEvidences: {
    unitTitle: string;
    courseTitle: string;
    textOrUrl: string;
    updatedAt: string;
  }[] = [];

  for (const row of courseRows) {
    for (const [unitId, ev] of Object.entries(row.evidences)) {
      const unit = activeBundle.learningUnits.find((u) => u.id === unitId);
      if (ev.textOrUrl) {
        allSubmittedEvidences.push({
          unitTitle: unit?.title ?? `Unit ${unitId}`,
          courseTitle: row.title,
          textOrUrl: ev.textOrUrl,
          updatedAt: ev.updatedAt,
        });
      }
    }
  }

  return (
    <div>
      {/* Program Selector Tabs */}
      <div style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {bundles.map((b) => {
          const isSelected = b.programVersion.id === selectedProgramVersionId;
          const isEnrolled = store[b.programVersion.id]?.enrollment?.status === "enrolled";
          return (
            <button
              key={b.programVersion.id}
              onClick={() => setSelectedProgramVersionId(b.programVersion.id)}
              style={{
                padding: "0.5rem 0.85rem",
                border: "2px solid #000",
                background: isSelected ? "#000" : "#fff",
                color: isSelected ? "#fff" : "#000",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              {isEnrolled ? "🎓 " : ""}
              {b.programVersion.title}
            </button>
          );
        })}

        <button
          onClick={() => window.print()}
          style={{
            marginLeft: "auto",
            padding: "0.5rem 1rem",
            border: "2px solid #000",
            background: "#0000ee",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          🖨️ Print / Save PDF Transcript
        </button>
      </div>

      {/* TRANSCRIPT DOCUMENT */}
      <div
        style={{
          border: "2px solid #000",
          background: "#fff",
          padding: "2rem",
          boxShadow: "4px 4px 0px #000",
        }}
      >
        {/* Document Header */}
        <div style={{ borderBottom: "2px solid #000", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "#555" }}>
                Course Atlas · Official Record
              </div>
              <h2 style={{ margin: "0.3rem 0", fontSize: "1.6rem" }}>
                {activeBundle.programVersion.title}
              </h2>
              <div style={{ fontSize: "0.95rem", color: "#333" }}>
                {activeBundle.program.school} · {activeBundle.programVersion.credentialLabel}
              </div>
            </div>

            <div style={{ textAlign: "right", minWidth: "160px" }}>
              <div
                style={{
                  display: "inline-block",
                  padding: "0.4rem 0.85rem",
                  background: requirementEvaluation.satisfied ? "#008800" : "#fff9e6",
                  color: requirementEvaluation.satisfied ? "#fff" : "#000",
                  border: "2px solid #000",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                }}
              >
                {requirementEvaluation.satisfied ? "🎓 DEGREE COMPLETED ✓" : "⏳ IN PROGRESS"}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.4rem" }}>
                Catalog Version: {activeBundle.programVersion.version}
              </div>
            </div>
          </div>
        </div>

        {/* Enrollment & Audit Overview */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            background: "#f9f9f9",
            border: "1px solid #ccc",
            padding: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <div style={{ fontSize: "0.8rem", color: "#555" }}>Enrollment Status</div>
            <strong>
              {programProgress?.enrollment?.status === "enrolled" ? "Enrolled" : "Self-Study Path"}
            </strong>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#555" }}>Study Pace</div>
            <strong>{programProgress?.enrollment?.paceHoursPerWeek ?? 40} hrs / week</strong>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#555" }}>Course Completion</div>
            <strong>
              {completedCoursesCount} of {courseRows.length} Courses Done
            </strong>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#555" }}>Unit Mastery</div>
            <strong>
              {completedUnitsInDegree} of {totalUnitsInDegree} Units ({Math.round((completedUnitsInDegree / Math.max(1, totalUnitsInDegree)) * 100)}%)
            </strong>
          </div>
        </div>

        {/* Requirement Group Audit Breakdown */}
        <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1.1rem" }}>
          📊 Requirement Group Audit
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "2rem" }}>
          {activeBundle.programVersion.requirements.map((group) => {
            const groupEval = requirementEvaluation.groups.find(
              (g: { requirementGroupId: string }) => g.requirementGroupId === group.id,
            );
            const isSatisfied = groupEval?.satisfied ?? false;
            const selectedCount = groupEval?.selectedCourseVersionIds.length ?? 0;

            return (
              <div
                key={group.id}
                style={{
                  border: "1px solid #ccc",
                  padding: "0.75rem",
                  background: isSatisfied ? "#f0fff0" : "#fff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{group.title}</strong>
                  <span style={{ color: isSatisfied ? "#008800" : "#cc0000", fontWeight: "bold" }}>
                    {isSatisfied ? "✓ Satisfied" : `${selectedCount} / ${group.rule.minSelections} Courses`}
                  </span>
                </div>
                {groupEval && groupEval.reasons.length > 0 && (
                  <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.2rem" }}>
                    {groupEval.reasons.join(" ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Academic Course Transcript Table */}
        <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1.1rem" }}>
          📚 Academic Course Record
        </h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "2rem",
            fontSize: "0.9rem",
          }}
        >
          <thead>
            <tr style={{ background: "#f0f0f0", borderBottom: "2px solid #000", textAlign: "left" }}>
              <th style={{ padding: "0.5rem" }}>Code</th>
              <th style={{ padding: "0.5rem" }}>Course Title</th>
              <th style={{ padding: "0.5rem" }}>Format</th>
              <th style={{ padding: "0.5rem" }}>Units</th>
              <th style={{ padding: "0.5rem" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {courseRows.map((row) => (
              <tr key={row.courseVersionId} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>{row.code}</td>
                <td style={{ padding: "0.5rem" }}>
                  <a
                    href={`/programs/${activeBundle.program.canonicalSlug}/courses/${row.courseVersionId}`}
                    style={{ fontWeight: "bold", color: "#000" }}
                  >
                    {row.title}
                  </a>
                </td>
                <td style={{ padding: "0.5rem", textTransform: "capitalize" }}>{row.format}</td>
                <td style={{ padding: "0.5rem" }}>
                  {row.completedUnits} / {row.totalUnits}
                </td>
                <td style={{ padding: "0.5rem" }}>
                  <span
                    style={{
                      fontWeight: "bold",
                      color: row.isCompleted ? "#008800" : "#555",
                    }}
                  >
                    {row.isCompleted ? "✓ Completed" : "In Progress"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Submitted Evidence Portfolio Gallery */}
        <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1.1rem" }}>
          📎 Verified Work Evidence Portfolio ({allSubmittedEvidences.length} Submissions)
        </h3>

        {allSubmittedEvidences.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {allSubmittedEvidences.map((item, idx) => (
              <div
                key={idx}
                style={{
                  border: "1px solid #ccc",
                  padding: "0.75rem",
                  background: "#fafafa",
                  fontSize: "0.85rem",
                }}
              >
                <div style={{ color: "#555", fontSize: "0.8rem", textTransform: "uppercase" }}>
                  {item.courseTitle} · {item.unitTitle}
                </div>
                <div style={{ margin: "0.2rem 0", fontFamily: "monospace", wordBreak: "break-all" }}>
                  {item.textOrUrl.startsWith("http") ? (
                    <a
                      href={item.textOrUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#0000ee", fontWeight: "bold" }}
                    >
                      {item.textOrUrl} ↗
                    </a>
                  ) : (
                    <span>{item.textOrUrl}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "1rem", background: "#f9f9f9", border: "1px solid #ccc", fontSize: "0.9rem", color: "#666" }}>
            No work evidence submitted yet. Submit GitHub links or lab notes on learning unit pages to populate your verified portfolio gallery.
          </div>
        )}
      </div>
    </div>
  );
}
