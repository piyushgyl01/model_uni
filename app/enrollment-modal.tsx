"use client";

import { useEffect, useState } from "react";
import type { ProgramVersionId } from "./domain/catalog";
import {
  cancelLocalEnrollment,
  getStoredEnrollment,
  PROGRESS_EVENT,
  writeLocalEnrollment,
} from "./progress-storage";

interface EnrollmentModalProps {
  readonly programVersionId: ProgramVersionId;
  readonly programTitle: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const PACE_PRESETS = [
  { hours: 40, label: "Full-Time (40 hrs/week)", desc: "~3 years completion" },
  { hours: 30, label: "Intensive (30 hrs/week)", desc: "~4 years completion" },
  { hours: 20, label: "Part-Time (20 hrs/week)", desc: "~6 years completion" },
  { hours: 10, label: "Casual (10 hrs/week)", desc: "~9 years completion" },
];

export function EnrollmentModal({
  programVersionId,
  programTitle,
  isOpen,
  onClose,
}: EnrollmentModalProps) {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [paceHours, setPaceHours] = useState(40);
  const [isCurrentlyEnrolled, setIsCurrentlyEnrolled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getStoredEnrollment(programVersionId);
      if (current) {
        setStartDate(current.startDate);
        setPaceHours(current.paceHoursPerWeek);
        setIsCurrentlyEnrolled(current.status === "enrolled");
      } else {
        setIsCurrentlyEnrolled(false);
      }
    }
  }, [isOpen, programVersionId]);

  if (!isOpen) return null;

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    writeLocalEnrollment(programVersionId, {
      startDate,
      paceHoursPerWeek: paceHours,
      enrolledAt: new Date().toISOString(),
      status: "enrolled",
    });
    window.dispatchEvent(new Event(PROGRESS_EVENT));
    onClose();
  };

  const handleUnenroll = () => {
    if (
      window.confirm(
        `Are you sure you want to pause/cancel enrollment in ${programTitle}?`,
      )
    ) {
      cancelLocalEnrollment(programVersionId);
      window.dispatchEvent(new Event(PROGRESS_EVENT));
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
            🎓 {isCurrentlyEnrolled ? "Manage Enrollment" : "Enroll in Degree"}
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
                  <strong>{preset.label}</strong> —{" "}
                  <span style={{ fontSize: "0.85rem", color: "#555" }}>
                    {preset.desc}
                  </span>
                </div>
              </label>
            ))}
          </div>

          <div
            style={{
              background: "#f9f9f9",
              borderLeft: "3px solid #0000ee",
              padding: "0.5rem 0.75rem",
              marginBottom: "1.25rem",
              fontSize: "0.85rem",
            }}
          >
            💡 <strong>Daily Target:</strong> ~
            {Math.round((paceHours / 7) * 10) / 10} hours / day. Your daily
            study queue will generate 2–4 learning units per day based on this pace.
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
