"use client";

import { useEffect, useState } from "react";
import type { ProgramVersionId } from "./domain/catalog";
import type { StudyDay } from "./learner-progress-contract";
import { syncStoredProgram } from "./progress-sync-client";
import {
  cancelLocalEnrollment,
  getStoredEnrollment,
  PROGRESS_EVENT,
  writeLocalEnrollment,
} from "./progress-storage";

interface EnrollmentModalProps {
  readonly programVersionId: ProgramVersionId;
  readonly programTitle: string;
  /** Total guided hours in this programme's selected path, when known. */
  readonly programHours?: number;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const PACE_PRESETS = [
  { hours: 40, label: "Full-Time (40 hrs/week)" },
  { hours: 30, label: "Intensive (30 hrs/week)" },
  { hours: 20, label: "Part-Time (20 hrs/week)" },
  { hours: 10, label: "Casual (10 hrs/week)" },
];

/**
 * These estimates used to be hardcoded degree lengths, so a 40-hour course
 * offered "~9 years completion" at a casual pace. Derive them from the
 * programme actually being enrolled in, and say nothing when it is unknown.
 */
function completionEstimate(
  programHours: number | undefined,
  paceHoursPerWeek: number,
): string | undefined {
  if (!programHours || programHours <= 0) return undefined;
  const weeks = Math.ceil(programHours / paceHoursPerWeek);
  if (weeks <= 12) return `about ${weeks} week${weeks === 1 ? "" : "s"}`;
  if (weeks < 78) return `about ${Math.round(weeks / 4.345)} months`;
  return `about ${(weeks / 52).toFixed(1)} years`;
}

const STUDY_DAY_OPTIONS: readonly { readonly value: StudyDay; readonly label: string }[] = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

export function EnrollmentModal({
  programVersionId,
  programTitle,
  programHours,
  isOpen,
  onClose,
}: EnrollmentModalProps) {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [paceHours, setPaceHours] = useState(40);
  const [studyDays, setStudyDays] = useState<StudyDay[]>([1, 2, 3, 4, 5]);
  const [isCurrentlyEnrolled, setIsCurrentlyEnrolled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getStoredEnrollment(programVersionId);
      queueMicrotask(() => {
        if (current) {
          setStartDate(current.startDate);
          setPaceHours(current.paceHoursPerWeek);
          setStudyDays([...(current.preferredStudyDays ?? [1, 2, 3, 4, 5])]);
          setIsCurrentlyEnrolled(current.status === "enrolled");
        } else {
          setIsCurrentlyEnrolled(false);
        }
      });
    }
  }, [isOpen, programVersionId]);

  if (!isOpen) return null;

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    const cached = writeLocalEnrollment(programVersionId, {
      startDate,
      paceHoursPerWeek: paceHours,
      preferredStudyDays: studyDays,
      enrolledAt: new Date().toISOString(),
      status: "enrolled",
    });
    window.dispatchEvent(new Event(PROGRESS_EVENT));
    if (cached) void syncStoredProgram(programVersionId);
    onClose();
  };

  const handleUnenroll = () => {
    if (
      window.confirm(
        `Are you sure you want to pause/cancel enrollment in ${programTitle}?`,
      )
    ) {
      const cached = cancelLocalEnrollment(programVersionId);
      window.dispatchEvent(new Event(PROGRESS_EVENT));
      if (cached) void syncStoredProgram(programVersionId);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          border: "2px solid #000",
          maxWidth: "500px",
          width: "100%",
          padding: "1.5rem",
          boxShadow: "4px 4px 0px #000",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: "1.3rem" }}>
            {isCurrentlyEnrolled ? "Manage Enrollment" : "Enroll in Degree"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid #000",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ margin: "0.75rem 0 1.25rem", fontSize: "0.95rem" }}>
          <strong>Degree:</strong> {programTitle}
        </p>

        <form onSubmit={handleEnroll}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="start-date-input"
              style={{ display: "block", fontWeight: "bold", marginBottom: "0.25rem" }}
            >
              Start Date:
            </label>
            <input
              id="start-date-input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.4rem",
                border: "1px solid #000",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label
              style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem" }}
            >
              Weekly Study Pace:
            </label>
            {PACE_PRESETS.map((preset) => (
              <label
                key={preset.hours}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem",
                  border: "1px solid #ccc",
                  marginBottom: "0.4rem",
                  cursor: "pointer",
                  background: paceHours === preset.hours ? "#f0f4ff" : "#fff",
                }}
              >
                <input
                  type="radio"
                  name="pace"
                  value={preset.hours}
                  checked={paceHours === preset.hours}
                  onChange={() => setPaceHours(preset.hours)}
                />
                <div>
                  <strong>{preset.label}</strong>
                  {completionEstimate(programHours, preset.hours) ? (
                    <>
                      {" — "}
                      <span style={{ fontSize: "0.85rem", color: "#555" }}>
                        {completionEstimate(programHours, preset.hours)}
                      </span>
                    </>
                  ) : null}
                </div>
              </label>
            ))}
          </div>

          <fieldset style={{ margin: "0 0 1.25rem", padding: "0.75rem", border: "1px solid #000" }}>
            <legend style={{ fontWeight: "bold" }}>Study Days</legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {STUDY_DAY_OPTIONS.map((day) => (
                <label key={day.value} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <input
                    type="checkbox"
                    checked={studyDays.includes(day.value)}
                    onChange={() =>
                      setStudyDays((current) =>
                        current.includes(day.value)
                          ? current.filter((value) => value !== day.value)
                          : [...current, day.value],
                      )
                    }
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div
            style={{
              background: "#f9f9f9",
              borderLeft: "3px solid #0000ee",
              padding: "0.5rem 0.75rem",
              marginBottom: "1.25rem",
              fontSize: "0.85rem",
            }}
          >
            <strong>Daily Target:</strong> ~
            {Math.round(
              (Math.min(paceHours, Math.max(1, studyDays.length) * 8) /
                Math.max(1, studyDays.length)) *
                10,
            ) / 10} hours on each chosen day. Learning units are divided into
            sessions of no more than 90 minutes.
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            {isCurrentlyEnrolled && (
              <button
                type="button"
                onClick={handleUnenroll}
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid #cc0000",
                  color: "#cc0000",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Pause / Cancel
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid #000",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={studyDays.length === 0}
              style={{
                padding: "0.5rem 1.25rem",
                border: "2px solid #000",
                background: "#0000ee",
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {isCurrentlyEnrolled ? "Save Changes" : "Start Degree Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
