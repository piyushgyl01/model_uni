"use client";

import { useMemo, useState } from "react";
import type { AssessmentVersionId } from "./domain/catalog";
import type {
  AssessmentEvaluationMethod,
  AssessmentResult,
} from "./learner-progress-contract";
import {
  writeLocalAssessmentAttempt,
  writeLocalAssessmentResult,
} from "./progress-storage";
import { useCourseAccess } from "./course-access-context";

interface CourseAssessmentProgressProps {
  readonly disabled: boolean;
  readonly onQueuedMutation: () => Promise<void>;
}

function clientEntityId(prefix: string) {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${suffix}`;
}

function evidenceEntries(value: string) {
  return value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function CourseAssessmentProgress({
  disabled,
  onQueuedMutation,
}: CourseAssessmentProgressProps) {
  const { bundle, courseVersion, mastery, progress, refresh } = useCourseAccess();
  const programVersionId = bundle.programVersion.id;
  const [submissionDrafts, setSubmissionDrafts] = useState<
    Readonly<Record<string, string>>
  >({});
  const [scoreDrafts, setScoreDrafts] = useState<Readonly<Record<string, string>>>(
    {},
  );
  const [feedbackDrafts, setFeedbackDrafts] = useState<
    Readonly<Record<string, string>>
  >({});
  const [evaluationMethods, setEvaluationMethods] = useState<
    Readonly<Record<string, AssessmentEvaluationMethod>>
  >({});
  const [errors, setErrors] = useState<Readonly<Record<string, string>>>({});

  const attemptsByAssessment = useMemo(() => {
    const result = new Map<string, number>();
    for (const attempt of Object.values(progress?.assessmentAttempts ?? {})) {
      if (attempt.courseVersionId !== courseVersion.id) continue;
      result.set(
        attempt.assessmentVersionId,
        Math.max(result.get(attempt.assessmentVersionId) ?? 0, attempt.attemptNumber),
      );
    }
    return result;
  }, [courseVersion.id, progress?.assessmentAttempts]);

  const afterWrite = async (saved: boolean, assessmentVersionId: string) => {
    if (!saved) {
      setErrors((current) => ({
        ...current,
        [assessmentVersionId]: "This change could not be saved on this device.",
      }));
      return;
    }
    setErrors((current) => ({ ...current, [assessmentVersionId]: "" }));
    refresh();
    await onQueuedMutation();
  };

  const startAttempt = async (assessmentVersionId: AssessmentVersionId) => {
    const now = new Date().toISOString();
    const saved = writeLocalAssessmentAttempt(programVersionId, {
      id: clientEntityId("attempt"),
      assessmentVersionId,
      courseVersionId: courseVersion.id,
      attemptNumber: (attemptsByAssessment.get(assessmentVersionId) ?? 0) + 1,
      status: "draft",
      startedAt: now,
      submissionEvidence: [],
      updatedAt: now,
    });
    await afterWrite(saved, assessmentVersionId);
  };

  const submitAttempt = async (assessmentVersionId: AssessmentVersionId) => {
    const assessment = mastery.assessments.find(
      (candidate) => candidate.assessmentVersion.id === assessmentVersionId,
    );
    const attempt = assessment?.latestAttempt;
    const evidence = evidenceEntries(submissionDrafts[assessmentVersionId] ?? "");
    if (!attempt || attempt.status !== "draft") return;
    if (evidence.length === 0) {
      setErrors((current) => ({
        ...current,
        [assessmentVersionId]: "Add at least one artifact, link, score sheet, or work note.",
      }));
      return;
    }
    const now = new Date().toISOString();
    const saved = writeLocalAssessmentAttempt(programVersionId, {
      ...attempt,
      status: "submitted",
      submittedAt: now,
      submissionEvidence: evidence,
      updatedAt: now,
    });
    await afterWrite(saved, assessmentVersionId);
  };

  const evaluateAttempt = async (assessmentVersionId: AssessmentVersionId) => {
    const assessment = mastery.assessments.find(
      (candidate) => candidate.assessmentVersion.id === assessmentVersionId,
    );
    const attempt = assessment?.latestAttempt;
    if (!assessment || !attempt || attempt.status !== "submitted") return;
    const score = Number(scoreDrafts[assessmentVersionId]);
    const maximumScore = assessment.assessmentVersion.maximumScore;
    if (!Number.isFinite(score) || score < 0 || score > maximumScore) {
      setErrors((current) => ({
        ...current,
        [assessmentVersionId]: `Enter a score from 0 to ${maximumScore}.`,
      }));
      return;
    }
    const evaluatedAt = new Date().toISOString();
    const result: AssessmentResult = {
      score,
      maximumScore,
      passed:
        (score / maximumScore) * 100 >=
        courseVersion.gradingPolicy.passingPercentage,
      evaluationMethod: evaluationMethods[assessmentVersionId] ?? "self",
      ...(feedbackDrafts[assessmentVersionId]?.trim()
        ? { feedback: feedbackDrafts[assessmentVersionId].trim() }
        : {}),
      evaluatedAt,
    };
    const saved = writeLocalAssessmentResult(
      programVersionId,
      attempt.id,
      result,
    );
    await afterWrite(saved, assessmentVersionId);
  };

  if (mastery.assessments.length === 0) return null;

  return (
    <div style={{ marginTop: "1rem", borderTop: "var(--stroke, 1px) solid var(--ink, #000)", paddingTop: "1rem" }}>
      <strong>Required assessment record</strong>
      <p style={{ margin: "0.25rem 0 0.75rem", fontSize: "0.85rem" }}>
        Submit real work, then record the resulting evaluation. Peer and instructor
        labels should only be used when that review actually happened.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {mastery.assessments.map((assessment) => {
          const id = assessment.assessmentVersion.id;
          const attempt = assessment.latestAttempt;
          const status = attempt?.status ?? "not started";
          const canBegin = mastery.learningWorkComplete && !disabled;
          return (
            <section
              key={id}
              style={{ border: "var(--stroke, 1px) solid var(--ink-faint, #aaa)", padding: "0.75rem", background: "var(--paper, #fff)" }}
              aria-labelledby={`mastery-${id}`}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <strong id={`mastery-${id}`}>{assessment.assessmentVersion.title}</strong>
                <span style={{ fontFamily: "var(--mono-font, monospace)", fontSize: "0.8rem" }}>
                  {assessment.weight}% · {status}
                </span>
              </div>

              {!attempt && (
                <button
                  type="button"
                  className="button button-quiet"
                  disabled={!canBegin}
                  onClick={() => void startAttempt(id)}
                  style={{ marginTop: "0.6rem" }}
                >
                  Start assessment
                </button>
              )}

              {attempt?.status === "draft" && (
                <div style={{ marginTop: "0.6rem" }}>
                  <label htmlFor={`submission-${id}`} style={{ fontWeight: "bold", fontSize: "0.85rem" }}>
                    Work evidence — one artifact or link per line
                  </label>
                  <textarea
                    id={`submission-${id}`}
                    value={submissionDrafts[id] ?? ""}
                    onChange={(event) =>
                      setSubmissionDrafts((current) => ({
                        ...current,
                        [id]: event.target.value,
                      }))
                    }
                    disabled={disabled}
                    rows={3}
                    style={{ width: "100%", boxSizing: "border-box", margin: "0.35rem 0" }}
                    placeholder="Repository link, written solution, recording, rubric, or artifact note"
                  />
                  <button
                    type="button"
                    className="button button-quiet"
                    disabled={disabled}
                    onClick={() => void submitAttempt(id)}
                  >
                    Submit assessment
                  </button>
                </div>
              )}

              {attempt?.status === "submitted" && (
                <div style={{ marginTop: "0.6rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(100px, 0.5fr) minmax(160px, 1fr)", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.85rem" }}>
                      Score / {assessment.assessmentVersion.maximumScore}
                      <input
                        type="number"
                        min={0}
                        max={assessment.assessmentVersion.maximumScore}
                        value={scoreDrafts[id] ?? ""}
                        onChange={(event) =>
                          setScoreDrafts((current) => ({ ...current, [id]: event.target.value }))
                        }
                        disabled={disabled}
                        style={{ width: "100%", boxSizing: "border-box", display: "block" }}
                      />
                    </label>
                    <label style={{ fontSize: "0.85rem" }}>
                      Evaluation method
                      <select
                        value={evaluationMethods[id] ?? "self"}
                        onChange={(event) =>
                          setEvaluationMethods((current) => ({
                            ...current,
                            [id]: event.target.value as AssessmentEvaluationMethod,
                          }))
                        }
                        disabled={disabled}
                        style={{ width: "100%", display: "block" }}
                      >
                        <option value="self">Self-assessed</option>
                        <option value="automatic">Automatically checked</option>
                        <option value="peer">Peer reviewed</option>
                        <option value="instructor">Instructor reviewed</option>
                      </select>
                    </label>
                  </div>
                  <label htmlFor={`feedback-${id}`} style={{ display: "block", marginTop: "0.45rem", fontSize: "0.85rem" }}>
                    Feedback or rubric note
                  </label>
                  <textarea
                    id={`feedback-${id}`}
                    value={feedbackDrafts[id] ?? ""}
                    onChange={(event) =>
                      setFeedbackDrafts((current) => ({ ...current, [id]: event.target.value }))
                    }
                    disabled={disabled}
                    rows={2}
                    style={{ width: "100%", boxSizing: "border-box", margin: "0.25rem 0" }}
                  />
                  <button
                    type="button"
                    className="button button-quiet"
                    disabled={disabled}
                    onClick={() => void evaluateAttempt(id)}
                  >
                    Record evaluation
                  </button>
                </div>
              )}

              {attempt?.status === "evaluated" && attempt.result && (
                <div style={{ marginTop: "0.6rem", fontSize: "0.85rem" }}>
                  <strong style={{ color: assessment.thresholdSatisfied ? "var(--ok, #006600)" : "var(--bad, #aa0000)" }}>
                    {attempt.result.score} / {assessment.assessmentVersion.maximumScore} ·{" "}
                    {assessment.thresholdSatisfied ? "Passed" : "Retry required"}
                  </strong>
                  <div>
                    {attempt.result.evaluationMethod.replace("automatic", "automatically checked").replace("self", "self-assessed")} · evaluated {attempt.result.evaluatedAt.slice(0, 10)}
                  </div>
                  {!assessment.thresholdSatisfied && (
                    <button
                      type="button"
                      className="button button-quiet"
                      disabled={disabled}
                      onClick={() => void startAttempt(id)}
                      style={{ marginTop: "0.5rem" }}
                    >
                      Start retry
                    </button>
                  )}
                </div>
              )}

              {errors[id] && (
                <p role="alert" style={{ color: "var(--bad, #aa0000)", margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
                  {errors[id]}
                </p>
              )}
            </section>
          );
        })}
      </div>
      {!mastery.learningWorkComplete && (
        <small style={{ display: "block", marginTop: "0.6rem" }}>
          Finish the required learning work before starting a scored assessment.
        </small>
      )}
    </div>
  );
}
