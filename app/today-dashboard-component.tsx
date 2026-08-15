"use client";

import { useEffect, useState } from "react";
import type { CourseVersionId, PublishedProgramBundle } from "./domain/catalog";
import { resolveLearnerPath } from "./domain/learner-path";
import { calculateTodayQueue, type TodayQueueResult } from "./domain/today-queue";
import { EnrollmentModal } from "./enrollment-modal";
import { syncStoredProgram } from "./progress-sync-client";
import { TermProgressWidget } from "./term-progress-widget";
import {
  PROGRESS_EVENT,
  enqueueProgressOperations,
  readLocalUnitEvidence,
  readProgressStore,
} from "./progress-storage";
import type { LearnerTodayView } from "./catalog/learner-read-model-repository";

type TodayDashboardProps =
  | { readonly bundle: PublishedProgramBundle; readonly view?: never }
  | { readonly bundle?: never; readonly view: LearnerTodayView };

function queueFromView(view: LearnerTodayView): TodayQueueResult {
  return {
    ...view.queue,
    reconciliationOperations: [],
  };
}

export function TodayDashboardComponent(props: TodayDashboardProps) {
  const bundle = "bundle" in props ? props.bundle : undefined;
  const projectedView = "view" in props ? props.view : undefined;
  const programVersionId =
    bundle?.programVersion.id ?? projectedView!.program.programVersionId;
  const programTitle = bundle?.programVersion.title ?? projectedView!.program.title;
  const programSlug = bundle?.program.canonicalSlug ?? projectedView!.program.slug;
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Real hours for this programme, so the pace options quote a true estimate.
  const programHours = bundle
    ? resolveLearnerPath(bundle).totals.nominalHours
    : undefined;
  const [mounted, setMounted] = useState(Boolean(projectedView));
  const [projectedTerms, setProjectedTerms] = useState(
    projectedView?.queue.terms ?? [],
  );
  const [projectedTermProgress, setProjectedTermProgress] = useState(
    projectedView?.termProgress,
  );
  const [queue, setQueue] = useState<TodayQueueResult>(() =>
    bundle
      ? calculateTodayQueue(bundle, undefined)
      : queueFromView(projectedView!),
  );

  useEffect(() => {
    if (!bundle) {
      let active = true;
      const refreshProjectedQueue = async (synchronize: boolean) => {
        if (synchronize) await syncStoredProgram(programVersionId);
        const query = new URLSearchParams({ programVersionId });
        const response = await fetch(`/api/learner-views/today?${query}`, {
          headers: { accept: "application/json" },
          cache: "no-store",
        });
        if (!response.ok || !active) return;
        const view = (await response.json()) as LearnerTodayView;
        if (active) {
          setQueue(queueFromView(view));
          setProjectedTerms(view.queue.terms);
          setProjectedTermProgress(view.termProgress);
        }
      };
      void refreshProjectedQueue(true);
      const handleProgressChange = () => void refreshProjectedQueue(false);
      const handleReconnect = () => void refreshProjectedQueue(true);
      window.addEventListener(PROGRESS_EVENT, handleProgressChange);
      window.addEventListener("online", handleReconnect);
      return () => {
        active = false;
        window.removeEventListener(PROGRESS_EVENT, handleProgressChange);
        window.removeEventListener("online", handleReconnect);
      };
    }

    const refreshQueue = () => {
      const stored = readProgressStore().programs?.[programVersionId];
      const nextQueue = calculateTodayQueue(bundle, stored);
      setQueue(nextQueue);
      setMounted(true);
      if (nextQueue.reconciliationOperations.length > 0) {
        let persisted = true;
        for (
          let index = 0;
          index < nextQueue.reconciliationOperations.length;
          index += 20
        ) {
          persisted =
            enqueueProgressOperations(
              programVersionId,
              nextQueue.reconciliationOperations.slice(index, index + 20),
            ) && persisted;
        }
        if (persisted) void syncStoredProgram(programVersionId);
      }
    };

    refreshQueue();
    void syncStoredProgram(programVersionId);
    const handleProgressChange = () => refreshQueue();
    const handleReconnect = () => void syncStoredProgram(programVersionId);
    window.addEventListener(PROGRESS_EVENT, handleProgressChange);
    window.addEventListener("online", handleReconnect);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, handleProgressChange);
      window.removeEventListener("online", handleReconnect);
    };
  }, [bundle, programVersionId]);

  const handleCompleteBlock = (block: TodayQueueResult["blocks"][number]) => {
    if (!block.canComplete) return;
    const completedAt = new Date().toISOString();
    const operations = [
      {
        type: "upsert-schedule-entry" as const,
        entry: {
          ...block.scheduleEntry,
          status: "completed" as const,
          completedAt,
          updatedAt: completedAt,
        },
      },
      ...(block.completesUnit
        ? [
            {
              type: "set-unit-completion" as const,
              courseVersionId: block.courseVersionId,
              learningUnitId: block.unitId,
              completed: true,
            },
          ]
        : []),
    ];
    const cached = enqueueProgressOperations(programVersionId, operations);
    if (cached) {
      setQueue((current) => ({
        ...current,
        blocks: current.blocks.map((candidate) =>
          candidate.scheduleEntryId === block.scheduleEntryId
            ? {
                ...candidate,
                completed: true,
                canComplete: false,
                scheduleEntry: {
                  ...candidate.scheduleEntry,
                  status: "completed",
                  completedAt,
                },
              }
            : candidate,
        ),
        completedBlocksToday: current.completedBlocksToday + 1,
      }));
      void syncStoredProgram(programVersionId);
    }
  };

  if (!mounted) return null;

  if (!queue || !queue.isEnrolled) {
    return (
      <div
        style={{
          border: "2px solid #000",
          background: "#fff",
          padding: "1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 0.4rem 0", fontSize: "1.2rem" }}>
              Start Studying {programTitle}
            </h2>
            <p style={{ margin: 0, fontSize: "0.95rem" }}>
              Enroll to generate your daily <strong>&quot;What do I do today?&quot;</strong> study queue based on your weekly pace.
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
            Enroll & Generate Schedule
          </button>
        </div>
        <EnrollmentModal
          programVersionId={programVersionId}
          programTitle={programTitle}
          programHours={programHours}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    );
  }

  const allBlocksDone =
    queue.totalBlocksToday > 0 &&
    queue.completedBlocksToday === queue.totalBlocksToday;
  const activeTerm =
    queue.terms.find((term) => term.label === queue.currentPeriodLabel) ??
    queue.terms[0];

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
            {queue.currentPeriodLabel} · {queue.today} · Daily Study Plan
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
          Manage Pace ({queue.enrollment?.paceHoursPerWeek ?? 40} hrs/wk)
        </button>
      </div>

      {/* TERM PROGRESS VIEW ("In Term X of Y") */}
      {bundle ? (
        <TermProgressWidget bundle={bundle} />
      ) : (
        projectedTermProgress ? (
          <TermProgressWidget evaluation={projectedTermProgress} />
        ) : (
          <TermProgressWidget
            terms={projectedTerms}
            currentPeriodLabel={queue.currentPeriodLabel}
          />
        )
      )}

      {activeTerm && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.65rem 0.75rem",
            border: "1px solid #aaa",
            fontSize: "0.85rem",
          }}
        >
          <strong>Academic calendar:</strong> {activeTerm.startDate} → {activeTerm.endDate}
          {activeTerm.milestones.map((milestone) => (
            <span key={`${milestone.label}-${milestone.date}`}>
              {" · "}{milestone.label}: {milestone.date}
            </span>
          ))}
          {activeTerm.breakAfter && (
            <span>
              {" · "}Break: {activeTerm.breakAfter.startDate} → {activeTerm.breakAfter.endDate}
            </span>
          )}
        </div>
      )}

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
          <div style={{ fontSize: "0.8rem", color: "#555" }}>Today&apos;s Progress</div>
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
          <strong>{queue.estimatedCompletionDate}</strong>
          <div style={{ fontSize: "0.75rem", color: "#555" }}>
            {queue.remainingHours.toLocaleString()} hours · ~{queue.estimatedWeeksRemaining} weeks
          </div>
        </div>
      </div>

      {queue.capacityLimited && (
        <div
          style={{
            background: "#fff8e6",
            border: "1px solid #8a5a00",
            padding: "0.75rem",
            marginBottom: "1.25rem",
            fontSize: "0.9rem",
          }}
        >
          Your selected days can safely hold {queue.effectiveWeeklyHours} hours per week at the
          eight-hour daily ceiling. The completion estimate uses that real capacity, not the
          higher requested pace.
        </div>
      )}

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
          <strong>Daily Goal Achieved!</strong> You finished all {queue.totalBlocksToday} study blocks for today. Great job!
        </div>
      )}

      {/* Study Blocks List */}
      <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1.05rem" }}>
        Today&apos;s Study Tasks ({queue.blocks.length} Sessions)
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {queue.blocks.length === 0 && (
          <div style={{ border: "1px solid #aaa", padding: "0.85rem", background: "#f9f9f9" }}>
            {queue.todayIsStudyDay
              ? "No work is due today. Your remaining plan has been recalculated."
              : "Today is not one of your chosen study days. Your work resumes on the next study day."}
          </div>
        )}
        {queue.blocks.map((block, index) => {
          const evidence = readLocalUnitEvidence(
            programVersionId,
            block.courseVersionId as CourseVersionId,
            block.unitId,
          );
          return (
            <div
              key={block.scheduleEntryId}
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
                    Session {index + 1} of {queue.blocks.length} · {block.scheduleEntry.startTime ?? "Flexible"} · {block.courseTitle} ({block.periodLabel})
                  </div>
                  <h4 style={{ margin: "0.2rem 0 0.4rem", fontSize: "1.1rem" }}>
                    <a
                      href={`/programs/${programSlug}/courses/${block.courseSlug}`}
                      style={{ textDecoration: block.completed ? "line-through" : "underline" }}
                    >
                      Unit {block.unitOrder}: {block.unitTitle}
                    </a>
                    {evidence?.textOrUrl && (
                      <span
                        style={{
                          marginLeft: "0.5rem",
                          fontSize: "0.75rem",
                          padding: "0.1rem 0.4rem",
                          background: "#e6ffe6",
                          color: "#006600",
                          border: "1px solid #008800",
                          fontWeight: "bold",
                        }}
                      >
                        Proof Attached
                      </span>
                    )}
                  </h4>
                <div style={{ fontSize: "0.85rem", color: "#333", marginBottom: "0.4rem" }}>
                  <strong>What:</strong> {block.activity}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#333", marginBottom: "0.4rem" }}>
                  <strong>Where:</strong>{" "}
                  {block.resourceUrl ? (
                    <a href={block.resourceUrl} target="_blank" rel="noreferrer">
                      {block.where}
                    </a>
                  ) : (
                    block.where
                  )}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#333", marginBottom: "0.4rem" }}>
                  <strong>Produce:</strong> {block.produce}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#555" }}>
                  {block.unitTopic} · {block.taskKind} · {block.plannedMinutes} minutes · deadline {block.deadlineDate}
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
                  disabled={!block.canComplete}
                  onChange={() => handleCompleteBlock(block)}
                />
                {block.completed ? "Completed ✓" : "Complete Session"}
              </label>
              {block.lockedReason && (
                <div style={{ color: "#aa0000", fontSize: "0.8rem", marginTop: "0.35rem", maxWidth: "18rem" }}>
                  {block.lockedReason}
                </div>
              )}
            </div>
          </div>
        );
      })}
      </div>

      {queue.recentHistory.length > 0 && (
        <div style={{ marginTop: "1.25rem", borderTop: "1px solid #000", paddingTop: "1rem" }}>
          <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1.05rem" }}>
            Recent Daily History
          </h3>
          {queue.recentHistory.map((day) => (
            <div key={day.date} style={{ marginBottom: "0.6rem", fontSize: "0.85rem" }}>
              <strong>{day.date}</strong> — {day.blocks.map((block) => block.unitTitle).join(" · ")}
            </div>
          ))}
        </div>
      )}

      <EnrollmentModal
        programVersionId={programVersionId}
        programTitle={programTitle}
        programHours={programHours}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
