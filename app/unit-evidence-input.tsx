"use client";

import { useEffect, useState } from "react";
import type { CourseVersionId, LearningUnitId, ProgramVersionId } from "./domain/catalog";
import { useCourseAccess } from "./course-access-context";
import { syncStoredProgram } from "./progress-sync-client";
import {
  PROGRESS_EVENT,
  readLocalUnitEvidence,
  writeLocalUnitEvidence,
} from "./progress-storage";

interface UnitEvidenceInputProps {
  readonly programVersionId: ProgramVersionId;
  readonly courseVersionId: CourseVersionId;
  readonly unitId: LearningUnitId;
}

export function UnitEvidenceInput({
  programVersionId,
  courseVersionId,
  unitId,
}: UnitEvidenceInputProps) {
  const { hydrated, prerequisites } = useCourseAccess();
  const [mounted, setMounted] = useState(false);
  const [evidenceText, setEvidenceText] = useState("");
  const [savedTime, setSavedTime] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const evidence = readLocalUnitEvidence(
        programVersionId,
        courseVersionId,
        unitId,
      );
      setEvidenceText(evidence?.textOrUrl ?? "");
      setSavedTime(evidence?.updatedAt ?? null);

      setMounted(true);
    };

    update();
    const handleEvent = () => update();
    window.addEventListener(PROGRESS_EVENT, handleEvent);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, handleEvent);
    };
  }, [courseVersionId, programVersionId, unitId]);

  if (!mounted) {
    return (
      <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "var(--ink-soft, #666)" }}>
        Loading evidence tracker...
      </div>
    );
  }

  const handleSave = () => {
    const submittedEvidence = evidenceText.trim();
    if (!submittedEvidence) return;

    const evidenceSaved = writeLocalUnitEvidence(
      programVersionId,
      courseVersionId,
      unitId,
      submittedEvidence,
      true,
    );

    window.dispatchEvent(new Event(PROGRESS_EVENT));
    if (evidenceSaved) {
      void syncStoredProgram(programVersionId);
    }
  };

  return (
    <div style={{ marginTop: "10px", borderTop: "var(--stroke, 1px) dashed var(--rule, #ccc)", paddingTop: "8px" }}>
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
          style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--ink, #333)" }}
        >
          Submit Work Evidence / Project Link:
        </label>
        {savedTime && (
          <span style={{ fontSize: "0.75rem", color: "var(--ok, #006600)", fontWeight: "bold" }}>
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
        disabled={!hydrated || !prerequisites.isUnlocked}
        style={{
          width: "100%",
          padding: "0.4rem 0.5rem",
          fontSize: "0.85rem",
          border: "var(--stroke, 1px) solid var(--ink-soft, #777)",
          background: "var(--paper, #fff)",
          fontFamily: "var(--mono-font, monospace)",
          marginBottom: "6px",
          boxSizing: "border-box",
        }}
      />

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hydrated || !prerequisites.isUnlocked || !evidenceText.trim()}
          style={{
            background: "var(--paper, #fff)",
            border: "var(--stroke, 1px) solid var(--ink, #000)",
            padding: "0.3rem 0.6rem",
            fontSize: "0.8rem",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Save Proof
        </button>
      </div>
    </div>
  );
}
