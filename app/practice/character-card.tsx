"use client";

import { useEffect, useState } from "react";
import { todayInTimezone } from "../domain/academic-calendar";
import {
  characterLevel,
  experienceFrom,
  rankFor,
  studyStreak,
} from "../domain/practice/character";
import type { PracticeRound } from "../domain/practice/types";
import { useGameMode } from "../game-mode";
import {
  PROGRESS_EVENT,
  readAllLocalPracticeRounds,
  readProgressStore,
} from "../progress-storage";

interface CharacterState {
  readonly rounds: readonly PracticeRound[];
  readonly studyDays: readonly number[];
  readonly timezone?: string;
}

function readCharacter(): CharacterState {
  const enrollments = Object.values(readProgressStore().programs ?? {})
    .map((program) => program.enrollment)
    .filter((enrollment) => enrollment?.status === "enrolled");
  return {
    rounds: readAllLocalPracticeRounds(),
    studyDays: [
      ...new Set(
        enrollments.flatMap(
          (enrollment) => enrollment?.preferredStudyDays ?? [],
        ),
      ),
    ],
    timezone: enrollments.find((enrollment) => enrollment?.timezone)?.timezone,
  };
}

/**
 * One character across every program: a level and rank from experience, and a
 * streak of study days with a finished check. Only self-marked answers count.
 */
export function CharacterCard() {
  const game = useGameMode();
  const [state, setState] = useState<CharacterState | null>(null);

  useEffect(() => {
    const refresh = () => setState(readCharacter());
    refresh();
    window.addEventListener(PROGRESS_EVENT, refresh);
    return () => window.removeEventListener(PROGRESS_EVENT, refresh);
  }, []);

  // Part of the game, and nothing to show until the first self-marked round:
  // programs without practice yet should not show a level nobody can earn.
  if (game !== "on" || !state || state.rounds.length === 0) return null;
  const experience = experienceFrom(state.rounds);
  const { level, into, needed } = characterLevel(experience);
  const rank = rankFor(level);
  const streak = studyStreak(
    state.rounds,
    todayInTimezone(state.timezone),
    state.studyDays,
  );

  return (
    <section className="character-card" aria-label="Your character">
      <div className="character-badge" aria-hidden="true">
        {rank.icon}
      </div>
      <div>
        <div className="practice-eyebrow">
          {experience} XP · from self-marked answers only
        </div>
        <div className="character-name">
          Level {level} · {rank.name}
        </div>
        <div
          className="character-bar"
          role="progressbar"
          aria-label="Experience to the next level"
          aria-valuemin={0}
          aria-valuemax={needed}
          aria-valuenow={into}
        >
          <i style={{ width: `${(into / needed) * 100}%` }} />
        </div>
      </div>
      <div className="character-streak">
        🔥 {streak.current} day{streak.current === 1 ? "" : "s"}
        <small>
          {streak.todayDone
            ? "Today's check is done"
            : "Finish today's check to keep it"}{" "}
          · best {streak.best}
        </small>
      </div>
    </section>
  );
}
