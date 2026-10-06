"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { ProgramVersionId } from "../domain/catalog";
import {
  planDailyCheck,
  type CheckItem,
  type TodayUnit,
} from "../domain/practice/daily-check";
import { skillStates } from "../domain/practice/levels";
import { practiceSkill } from "../domain/practice/registry";
import type { PracticeRound } from "../domain/practice/types";
import { setGameMode, useGameMode } from "../game-mode";
import { PROGRESS_EVENT, readLocalPracticeRounds } from "../progress-storage";
import { PracticePlayer } from "./practice-player";

interface DailyCheckCardProps {
  readonly programVersionId: ProgramVersionId;
  /** The learner's local date, from the Today queue. */
  readonly today: string;
  /** Today's units that are open to work on. */
  readonly units: readonly TodayUnit[];
}

/**
 * Today's check for one program: the skills of today's units plus reviews
 * that are due. It disappears for programs with no self-marked practice yet.
 */
export function DailyCheckCard({
  programVersionId,
  today,
  units,
}: DailyCheckCardProps) {
  const game = useGameMode();
  const [rounds, setRounds] = useState<readonly PracticeRound[]>([]);
  // The items are fixed when the check starts: finishing it changes the plan.
  const [playing, setPlaying] = useState<readonly CheckItem[] | null>(null);

  useEffect(() => {
    const refresh = () => setRounds(readLocalPracticeRounds(programVersionId));
    refresh();
    window.addEventListener(PROGRESS_EVENT, refresh);
    return () => window.removeEventListener(PROGRESS_EVENT, refresh);
  }, [programVersionId]);

  const plan = planDailyCheck(units, rounds, today);
  if (game !== "on") {
    // With the game off, a course that could be played says so, once, quietly.
    if (!plan.doneToday && plan.items.length === 0) return null;
    return (
      <section
        className="practice-card game-invite"
        aria-label="Play this course as a game"
      >
        <p>
          🎮 Today&apos;s units can be played as a game: a daily check marked by
          the app, levels, XP and a streak.{" "}
          <button
            type="button"
            className="linkish"
            onClick={() => setGameMode("on")}
          >
            Turn the game on
          </button>
        </p>
      </section>
    );
  }
  let card: ReactNode = null;
  if (plan.doneToday) {
    const todays = rounds.filter(
      (round) => round.mode === "check" && round.studyDate === today,
    );
    const right = todays.reduce(
      (total, round) => total + round.correctCount,
      0,
    );
    const asked = todays.reduce(
      (total, round) => total + round.questionCount,
      0,
    );
    const before = skillStates(
      rounds.filter((round) => round.studyDate < today),
    );
    const after = skillStates(rounds);
    const ups = todays.filter(
      (round) =>
        (after.get(round.skillId)?.level ?? 0) >
        Math.max(1, before.get(round.skillId)?.level ?? 0),
    ).length;
    card = (
      <section
        className="practice-card"
        aria-labelledby={`check-${programVersionId}`}
      >
        <div className="practice-eyebrow">Today&apos;s check</div>
        <h3 id={`check-${programVersionId}`}>Done for today</h3>
        <div className="practice-done">
          ✓ {right}/{asked} right
          {ups > 0 ? ` · ${ups} skill${ups === 1 ? "" : "s"} levelled up` : ""}
        </div>
        <p className="practice-note">
          Want more? Practise any skill from its unit on the course page.
          Practice is recorded, but only tomorrow&apos;s check moves a level.
        </p>
      </section>
    );
  } else if (plan.items.length > 0) {
    card = (
      <section
        className="practice-card"
        aria-labelledby={`check-${programVersionId}`}
      >
        <div className="practice-row">
          <div>
            <div className="practice-eyebrow">
              Today&apos;s check · marked by the app
            </div>
            <h3 id={`check-${programVersionId}`}>
              {plan.items.length} skill{plan.items.length === 1 ? "" : "s"} ·{" "}
              {plan.questionCount} questions, timed
            </h3>
          </div>
          <button
            type="button"
            className="practice-btn is-primary"
            onClick={() => setPlaying(plan.items)}
          >
            Start check
          </button>
        </div>
        <ul className="practice-chips">
          {plan.items.map((item) => (
            <li key={item.skillId} className="practice-chip">
              <span
                className={`practice-level ${item.reason === "new" ? "is-new" : ""}`}
              >
                {item.reason === "new" ? "New" : `Lv ${item.level}`}
              </span>
              {practiceSkill(item.skillId)?.title}
              {item.reason === "review" ? " · review" : ""}
            </li>
          ))}
        </ul>
        <p className="practice-note">
          Every question is generated fresh and marked on the spot. All right
          moves a skill up; two misses move it down.
        </p>
      </section>
    );
  }

  // The player keeps one place in the tree whichever card shows, so finishing
  // the check (which turns the card to "done") never restarts it.
  return (
    <>
      {card}
      {playing && (
        <PracticePlayer
          title="Today's check"
          mode="check"
          items={playing}
          programVersionId={programVersionId}
          studyDate={today}
          onClose={() => setPlaying(null)}
        />
      )}
    </>
  );
}
