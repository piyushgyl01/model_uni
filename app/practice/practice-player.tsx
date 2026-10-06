"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { ProgramVersionId } from "../domain/catalog";
import { experienceFrom } from "../domain/practice/character";
import {
  buildQuestions,
  checkDoneOn,
  type CheckItem,
} from "../domain/practice/daily-check";
import { answerText, isCorrect } from "../domain/practice/grading";
import { scoreRound } from "../domain/practice/levels";
import { practiceSkill } from "../domain/practice/registry";
import type { PracticeMode, PracticeRound } from "../domain/practice/types";
import {
  readAllLocalPracticeRounds,
  readLocalPracticeRounds,
  writeLocalPracticeRounds,
} from "../progress-storage";
import { syncStoredProgram } from "../progress-sync-client";

interface PracticePlayerProps {
  readonly title: string;
  readonly mode: PracticeMode;
  readonly items: readonly CheckItem[];
  readonly programVersionId: ProgramVersionId;
  /** The learner's local date, so a round counts for the day they played it. */
  readonly studyDate: string;
  readonly onClose: () => void;
}

interface Answer {
  readonly correct: boolean;
  readonly response: string;
  readonly timedOut: boolean;
  readonly seconds: number;
}

interface SkillResult {
  readonly item: CheckItem;
  readonly correct: number;
  readonly total: number;
  readonly to: number;
}

interface Summary {
  /** What was recorded: a second check on one day counts as practice. */
  readonly mode: PracticeMode;
  readonly results: readonly SkillResult[];
  readonly experience: number;
  readonly saved: boolean;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/**
 * The player opens on top of everything, rendered at the end of the body so
 * nothing on the page around the button can clip, restyle or trap it.
 */
function Overlay({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return createPortal(
    <div
      className="pp-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className="pp-panel">{children}</div>
    </div>,
    document.body,
  );
}

function roundId() {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `prc-${random}`;
}

/**
 * A timed round of self-marked questions. Nothing is saved until the end, and
 * quitting part-way records nothing — a level only ever reflects whole rounds.
 */
export function PracticePlayer({
  title,
  mode,
  items,
  programVersionId,
  studyDate,
  onClose,
}: PracticePlayerProps) {
  const [questions] = useState(() => buildQuestions(items, Math.random));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<readonly Answer[]>([]);
  const [draft, setDraft] = useState("");
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [summary, setSummary] = useState<Summary | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const current = questions[index];
  const answered = answers[index];
  const remaining = current
    ? Math.max(0, current.seconds - (now - startedAt) / 1000)
    : 0;

  /** The first answer to a question is the one that counts. */
  const record = (response: string, timedOut = false) => {
    if (!current) return;
    const answer: Answer = {
      correct: !timedOut && isCorrect(current.question, response),
      response,
      timedOut,
      seconds: Math.min(current.seconds, (Date.now() - startedAt) / 1000),
    };
    setAnswers((prior) => (prior.length > index ? prior : [...prior, answer]));
  };

  // The clock runs only while a question is open, and running out is a miss.
  useEffect(() => {
    if (summary || answered || !current) return;
    const timer = window.setInterval(() => {
      const at = Date.now();
      setNow(at);
      if ((at - startedAt) / 1000 >= current.seconds) record("", true);
    }, 250);
    return () => window.clearInterval(timer);
  });

  useEffect(() => {
    if (answered) nextRef.current?.focus();
    else inputRef.current?.focus();
  }, [answered, index]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const finish = (all: readonly Answer[]) => {
    const byItem = new Map<
      CheckItem,
      { correct: number; total: number; seconds: number }
    >();
    questions.forEach((entry, position) => {
      const tally = byItem.get(entry.item) ?? {
        correct: 0,
        total: 0,
        seconds: 0,
      };
      const answer = all[position];
      byItem.set(entry.item, {
        correct: tally.correct + (answer?.correct ? 1 : 0),
        total: tally.total + 1,
        seconds: tally.seconds + (answer?.seconds ?? 0),
      });
    });
    // One check a day moves levels. Another one finished the same day — in a
    // second tab, say — is kept, but as practice.
    const recorded: PracticeMode =
      mode === "check" &&
      checkDoneOn(readLocalPracticeRounds(programVersionId), studyDate)
        ? "practice"
        : mode;
    const completedAt = new Date().toISOString();
    const rounds: PracticeRound[] = [...byItem.entries()].map(
      ([item, tally]) => ({
        id: roundId(),
        skillId: item.skillId,
        mode: recorded,
        level: item.level,
        questionCount: tally.total,
        correctCount: tally.correct,
        durationSeconds: Math.round(tally.seconds),
        studyDate,
        completedAt,
        courseVersionId: item.courseVersionId,
        ...(item.learningUnitId ? { learningUnitId: item.learningUnitId } : {}),
      }),
    );
    const before = readAllLocalPracticeRounds();
    const saved = writeLocalPracticeRounds(programVersionId, rounds);
    if (saved) void syncStoredProgram(programVersionId);
    setSummary({
      mode: recorded,
      saved,
      experience:
        experienceFrom([...before, ...rounds]) - experienceFrom(before),
      results: [...byItem.entries()].map(([item, tally]) => ({
        item,
        correct: tally.correct,
        total: tally.total,
        to:
          recorded === "check"
            ? scoreRound(item.level, tally.correct, tally.total)
            : item.level,
      })),
    });
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setDraft("");
      setStartedAt(Date.now());
      setNow(Date.now());
    } else {
      finish(answers);
    }
  };

  const quit = () => {
    if (
      summary ||
      answers.length === 0 ||
      window.confirm("Quit? Nothing from this round will be saved.")
    ) {
      onClose();
    }
  };

  if (summary) {
    const right = summary.results.reduce(
      (total, result) => total + result.correct,
      0,
    );
    const asked = summary.results.reduce(
      (total, result) => total + result.total,
      0,
    );
    return (
      <Overlay label={`${title} results`}>
        <div className="pp-head">
          <strong>{title}</strong>
        </div>
        <div className="pp-results">
          <div className="practice-eyebrow">
            {summary.mode === "check" ? "Check finished" : "Practice finished"}
          </div>
          <div className="pp-score">
            {right}/{asked} right
          </div>
          <p className="practice-note">
            +{summary.experience} XP ·{" "}
            {summary.mode === "check"
              ? "levels move only on checks like this one."
              : mode === "check"
                ? "a check was already saved today, so this one counts as practice."
                : "practice is recorded, but only the daily check moves a level."}
          </p>
          <ul>
            {summary.results.map((result) => {
              const skill = practiceSkill(result.item.skillId);
              const from = result.item.reason === "new" ? 0 : result.item.level;
              const move =
                result.to > Math.max(1, from)
                  ? "up"
                  : result.to < from
                    ? "down"
                    : "same";
              return (
                <li key={result.item.skillId}>
                  <span>{skill?.title ?? result.item.skillId}</span>
                  <span>
                    {result.correct}/{result.total}
                  </span>
                  <span className={`pp-move is-${move}`}>
                    {summary.mode === "check"
                      ? `Lv ${from || "new"} → ${result.to}${move === "up" ? " ▲" : move === "down" ? " ▼" : ""}`
                      : `Lv ${result.item.level}`}
                  </span>
                </li>
              );
            })}
          </ul>
          {!summary.saved && (
            <p className="pp-feedback is-wrong">
              This device could not save the round — its storage may be full or
              blocked.
            </p>
          )}
          <div className="pp-actions">
            <button
              type="button"
              className="practice-btn is-primary"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </Overlay>
    );
  }

  if (!current) {
    return (
      <Overlay label={title}>
        <p>There is nothing to ask right now.</p>
        <button type="button" className="practice-btn" onClick={onClose}>
          Close
        </button>
      </Overlay>
    );
  }

  const { question, item } = current;
  const skill = practiceSkill(item.skillId);
  const low = remaining <= Math.min(15, current.seconds / 4);
  const submitNumber = () => {
    if (draft.trim()) record(draft);
  };

  return (
    <Overlay label={title}>
      <div className="pp-head">
        <div>
          <div className="practice-eyebrow">
            {mode === "check" ? "Self-marked check" : "Practice"}
          </div>
          <strong>{title}</strong>
        </div>
        <div>
          <span aria-label="Question">
            {index + 1}/{questions.length}
          </span>
          <button type="button" className="practice-btn" onClick={quit}>
            Quit
          </button>
        </div>
      </div>

      <div className="pp-strip" aria-hidden="true">
        {questions.map((entry, position) => (
          <i
            key={position}
            className={
              answers[position]
                ? answers[position]?.correct
                  ? "is-right"
                  : "is-wrong"
                : position === index
                  ? "is-current"
                  : ""
            }
          />
        ))}
      </div>
      <div className={`pp-timer ${low && !answered ? "is-low" : ""}`}>
        <div>
          <i
            style={{
              width: `${answered ? 0 : (remaining / current.seconds) * 100}%`,
            }}
          />
        </div>
        <span>{answered ? "—" : `${Math.ceil(remaining)}s`}</span>
      </div>

      <div className="pp-skill">
        <span
          className={`practice-level ${item.reason === "new" ? "is-new" : ""}`}
        >
          {item.reason === "new" ? "New" : `Lv ${item.level}`}
        </span>
        <span>{skill?.title}</span>
      </div>
      <h2 className="pp-prompt">{question.prompt}</h2>
      {question.code && (
        <pre className="pp-code">
          <code>{question.code}</code>
        </pre>
      )}

      {question.kind === "choice" ? (
        <div className="pp-options" role="group" aria-label="Answers">
          {question.options.map((option, position) => {
            const chosen = answered?.response === String(position);
            const state = answered
              ? position === question.correctIndex
                ? "is-right"
                : chosen
                  ? "is-wrong"
                  : ""
              : "";
            return (
              <button
                key={`${position}-${option}`}
                type="button"
                className={`pp-option ${state}`}
                disabled={Boolean(answered)}
                onClick={() => record(String(position))}
              >
                <b>{LETTERS[position]}</b>
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <form
          className="pp-input-row"
          onSubmit={(event) => {
            event.preventDefault();
            submitNumber();
          }}
        >
          <input
            ref={inputRef}
            className="pp-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={Boolean(answered)}
            autoComplete="off"
            spellCheck={false}
            aria-label="Your answer"
            placeholder="Your answer"
          />
          <button
            type="submit"
            className="practice-btn is-primary"
            disabled={Boolean(answered) || !draft.trim()}
          >
            Check
          </button>
        </form>
      )}

      {answered && (
        <div
          className={`pp-feedback ${answered.correct ? "" : "is-wrong"}`}
          role="status"
        >
          <strong>
            {answered.correct
              ? "Right."
              : answered.timedOut
                ? "Out of time."
                : "Not quite."}
            {!answered.correct && <> The answer is {answerText(question)}.</>}
          </strong>
          <p>{question.explain}</p>
        </div>
      )}
      {answered && (
        <div className="pp-actions">
          <button
            ref={nextRef}
            type="button"
            className="practice-btn is-primary"
            onClick={next}
          >
            {index + 1 < questions.length ? "Next" : "See results"}
          </button>
        </div>
      )}
    </Overlay>
  );
}
