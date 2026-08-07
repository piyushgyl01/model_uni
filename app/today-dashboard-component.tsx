"use client";

import { useEffect, useState } from "react";
import type { PublishedProgramBundle } from "./domain/catalog";
import { calculateTodayQueue, type TodayQueueResult } from "./domain/today-queue";
import { EnrollmentModal } from "./enrollment-modal";
import {
  getStoredProgram,
  PROGRESS_EVENT,
  readLocalCourseUnits,
  writeLocalCourseUnits,
} from "./progress-storage";

interface TodayDashboardProps {
  readonly bundle: PublishedProgramBundle;
}

export function TodayDashboardComponent({ bundle }: TodayDashboardProps) {
  const programVersionId = bundle.programVersion.id;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [queue, setQueue] = useState<TodayQueueResult>(() => {
    const stored = getStoredProgram(programVersionId);
    return calculateTodayQueue(bundle, stored);
  });

  const refreshQueue = () => {
    const stored = getStoredProgram(programVersionId);
    setQueue(calculateTodayQueue(bundle, stored));
  };

  useEffect(() => {
    refreshQueue();
    const handleProgressChange = () => refreshQueue();
    window.addEventListener(PROGRESS_EVENT, handleProgressChange);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, handleProgressChange);
    };
  }, [bundle, programVersionId]);

  const handleToggleBlock = (
    courseVersionId: string,
    unitId: string,
    currentlyCompleted: boolean,
  ) => {
    const unitsInCourse = bundle.learningUnits.filter(
      (u) => u.courseVersionId === courseVersionId,
    );
    const allowedUnitIds: ReadonlySet<string> = new Set(
      unitsInCourse.map((u) => u.id as string),
    );

    const currentCompleted = readLocalCourseUnits(
      programVersionId,
      courseVersionId as any,
      allowedUnitIds,
    );

    let nextCompleted: string[];
    if (currentlyCompleted) {
      nextCompleted = currentCompleted.filter((id) => id !== unitId);
    } else {
      nextCompleted = [...currentCompleted, unitId];
    }

    writeLocalCourseUnits(
      programVersionId,
      courseVersionId as any,
      nextCompleted as any,
      true,
    );
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  };

  if (!queue.isEnrolled) {
    return (
      <div
        style={{
          border: "2px solid #000",
          background: "#fff9e6",
          padding: "1.25rem",
          marginBottom: "2rem",
          boxShadow: "3px 3px 0px #000",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ margin: "0 0 0.4rem 0", fontSize: "1.2rem" }}>
              ⚡ Start Studying {bundle.programVersion.title}
            </h2>
            <p style={{ margin: 0, fontSize: "0.95rem" }}>
              Enroll to generate your daily <strong>"What do I do today?"</strong> study queue based on your weekly pace.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: "0.6rem 1.25rem",
              background: "#0000ee",
              color: "#fff",
              border: "2px solid #000",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            🎓 Enroll & Generate Schedule
          </button>
        </div>
        <EnrollmentModal
          programVersionId={programVersionId}
          programTitle={bundle.programVersion.title}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    );
  }

  const allBlocksDone =
    queue.totalBlocksToday > 0 &&
    queue.completedBlocksToday === queue.totalBlocksToday;

  return (
    <section
      style={{
        border: "2px solid #000",
        background: "#ffffff",
        padding: "1.25rem",
        marginBottom: "2rem",
        boxShadow: "4px 4px 0px #000",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          borderBottom: "1px solid #000",
          paddingBottom: "0.75rem",
          marginBottom: "1rem",
          gap: "0.5rem",
        }}
      >
        <div>
          <span
            style={{
              background: "#000",
              color: "#fff",
              padding: "0.2rem 0.5rem",
              fontWeight: "bold",
              fontSize: "0.85rem",
              marginRight: "0.5rem",
            }}
          >
            ACTIVE ENROLLMENT
          </span>
          <strong style={{ fontSize: "1.1rem" }}>
            {queue.currentPeriodLabel} · Daily Study Queue
          </strong>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: "#fff",
            border: "1px solid #000",
            padding: "0.3rem 0.75rem",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          ⚙️ Manage Pace ({queue.enrollment?.paceHoursPerWeek ?? 40} hrs/wk)
        </button>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1.25rem",
          background: "#f4f4f4",
          padding: "0.75rem",
          border: "1px solid #ccc",
        }}
      >
        <div>
          <div style={{ fontSize: "0.8rem", color: "#555" }}>Daily Target</div>
          <strong>~{queue.dailyTargetHours} hrs / day</strong>
        </div>
        <div>
          <div style={{ fontSize: "0.8rem", color: "#555" }}>Today's Progress</div>
          <strong style={{ color: allBlocksDone ? "#008800" : "#000" }}>
            {queue.completedBlocksToday} / {queue.totalBlocksToday} Blocks Completed
          </strong>
        </div>
        <div>
          <div style={{ fontSize: "0.8rem", color: "#555" }}>Overall Degree Progress</div>
          <strong>
            {queue.totalCompletedUnits} / {queue.totalUnits} Units
          </strong>
        </div>
        <div>
          <div style={{ fontSize: "0.8rem", color: "#555" }}>Est. Finish</div>
          <strong>~{queue.estimatedWeeksRemaining} weeks</strong>
        </div>
      </div>

      {/* Celebration Notice */}
      {allBlocksDone && (
        <div
          style={{
            background: "#e6ffe6",
            border: "1px solid #008800",
            padding: "0.75rem",
            marginBottom: "1.25rem",
            fontSize: "0.95rem",
          }}
        >
          🎉 <strong>Daily Goal Achieved!</strong> You finished all {queue.totalBlocksToday} study blocks for today. Great job!
        </div>
      )}

      {/* Study Blocks List */}
      <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1.05rem" }}>
        📅 Today's Study Tasks ({queue.blocks.length} Units)
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {queue.blocks.map((block, index) => (
          <div
            key={block.unitId}
            style={{
              border: block.completed ? "1px solid #aaa" : "2px solid #000",
              background: block.completed ? "#f9f9f9" : "#fff",
              padding: "0.85rem",
              opacity: block.completed ? 0.75 : 1,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "#555" }}>
                  Block {index + 1} of {queue.blocks.length} · {block.courseTitle} ({block.periodLabel})
                </div>
                <h4 style={{ margin: "0.2rem 0 0.4rem", fontSize: "1.1rem" }}>
                  <a
                    href={`/programs/${bundle.program.canonicalSlug}/courses/${block.courseSlug}`}
                    style={{ textDecoration: block.completed ? "line-through" : "underline" }}
                  >
                    Unit {block.unitOrder}: {block.unitTitle}
                  </a>
                </h4>
                <div style={{ fontSize: "0.85rem", color: "#333", marginBottom: "0.4rem" }}>
                  <strong>Topic:</strong> {block.unitTopic} · ⏱️ ~{block.estimatedHours} hrs ({block.unitKind})
                </div>
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.4rem 0.75rem",
                  background: block.completed ? "#e6ffe6" : "#0000ee",
                  color: block.completed ? "#006600" : "#fff",
                  border: "1px solid #000",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={block.completed}
                  onChange={() =>
                    handleToggleBlock(
                      block.courseVersionId,
                      block.unitId,
                      block.completed,
                    )
                  }
                />
                {block.completed ? "Completed ✓" : "Mark Done"}
              </label>
            </div>
          </div>
        ))}
      </div>

      <EnrollmentModal
        programVersionId={programVersionId}
        programTitle={bundle.programVersion.title}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
