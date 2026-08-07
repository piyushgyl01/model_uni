"use client";

import { useEffect, useState } from "react";
import type { CourseVersionId, LearningUnitId, ProgramVersionId } from "./domain/catalog";
import {
  PROGRESS_EVENT,
  readLocalCourseUnits,
  readLocalUnitEvidence,
  writeLocalCourseUnits,
  writeLocalUnitEvidence,
} from "./progress-storage";

interface UnitEvidenceInputProps {
  readonly programVersionId: ProgramVersionId;
  readonly courseVersionId: CourseVersionId;
  readonly unitId: LearningUnitId;
  readonly allowedUnitIds: ReadonlySet<string>;
}

export function UnitEvidenceInput({
  programVersionId,
  courseVersionId,
  unitId,
  allowedUnitIds,
}: UnitEvidenceInputProps) {
  const [mounted, setMounted] = useState(false);
  const [evidenceText, setEvidenceText] = useState("");
  const [savedTime, setSavedTime] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const loadCurrentStatus = () => {
    const evidence = readLocalUnitEvidence(
      programVersionId,
      courseVersionId,
      unitId,
    );
    if (evidence) {
      setEvidenceText(evidence.textOrUrl);
      setSavedTime(evidence.updatedAt);
    }

    const completedUnits = readLocalCourseUnits(
      programVersionId,
      courseVersionId,
      allowedUnitIds,
    );
    setIsCompleted(completedUnits.includes(unitId));
  };

  useEffect(() => {
    setMounted(true);
    loadCurrentStatus();

    const handleEvent = () => loadCurrentStatus();
    window.addEventListener(PROGRESS_EVENT, handleEvent);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, handleEvent);
    };
  }, [programVersionId, courseVersionId, unitId]);

  if (!mounted) {
    return (
      <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "#666" }}>
        Loading evidence tracker...
      </div>
    );
  }

  const handleSave = (andComplete = false) => {
    if (!evidenceText.trim() && !andComplete) return;

    writeLocalUnitEvidence(
      programVersionId,
      courseVersionId,
      unitId,
      evidenceText.trim(),
      true,
    );

    if (andComplete && !isCompleted) {
      const currentCompleted = readLocalCourseUnits(
        programVersionId,
        courseVersionId,
        allowedUnitIds,
      );
      const nextCompleted = [...currentCompleted, unitId];
      writeLocalCourseUnits(
        programVersionId,
        courseVersionId,
        nextCompleted,
        true,
      );
    }

    window.dispatchEvent(new Event(PROGRESS_EVENT));
  };

  return (
    <div style={{ marginTop: "10px", borderTop: "1px dashed #ccc", paddingTop: "8px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "4px",
        }}
      >
        <label
          htmlFor={`evidence-${unitId}`}
          style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#333" }}
        >
          📎 Submit Work Evidence / Project Link:
        </label>
        {savedTime && (
          <span style={{ fontSize: "0.75rem", color: "#006600", fontWeight: "bold" }}>
            ✓ Evidence saved
          </span>
        )}
      </div>

      <input
        id={`evidence-${unitId}`}
        type="text"
        placeholder="e.g. https://github.com/myuser/os-lab1 or lab summary notes"
        value={evidenceText}
        onChange={(e) => setEvidenceText(e.target.value)}
        style={{
          width: "100%",
          padding: "0.4rem 0.5rem",
          fontSize: "0.85rem",
          border: "1px solid #777",
          background: "#fff",
          fontFamily: "monospace",
          marginBottom: "6px",
          boxSizing: "border-box",
        }}
      />

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => handleSave(false)}
          style={{
            background: "#fff",
            border: "1px solid #000",
            padding: "0.3rem 0.6rem",
            fontSize: "0.8rem",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Save Proof
        </button>

        <button
          type="button"
          onClick={() => handleSave(true)}
          style={{
            background: isCompleted ? "#e6ffe6" : "#0000ee",
            color: isCompleted ? "#006600" : "#fff",
            border: "1px solid #000",
            padding: "0.3rem 0.65rem",
            fontSize: "0.8rem",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {isCompleted ? "✓ Evidence Saved & Complete" : "Save & Mark Unit Complete ✓"}
        </button>
      </div>
    </div>
  );
}
