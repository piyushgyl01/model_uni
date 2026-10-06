/**
 * The game layer: experience, a level, a rank and a streak — all derived from
 * practice rounds, the only thing that is stored. Only work the app marked
 * itself counts; ticking a box or typing a score earns nothing here.
 *
 * Ranks are a game's, not a university's: nothing here is a grade, credit or
 * qualification.
 */
import { byCompletion, daysBetween, scoreRound } from "./levels";
import type { PracticeRound } from "./types";

export const EXPERIENCE = {
  /** Each right answer in a check. */
  checkRight: 5,
  /** Each skill that goes up a level. */
  levelUp: 15,
  /** Practice pays a little, up to a daily cap, so it cannot be farmed. */
  practiceRight: 2,
  practiceDailyCap: 60,
} as const;

export function experienceFrom(rounds: readonly PracticeRound[]) {
  let total = 0;
  const levels = new Map<string, number>();
  const practiceByDay = new Map<string, number>();
  for (const round of [...rounds].sort(byCompletion)) {
    if (round.mode === "check") {
      const before = Math.max(1, levels.get(round.skillId) ?? 0);
      const after = scoreRound(before, round.correctCount, round.questionCount);
      levels.set(round.skillId, after);
      total += round.correctCount * EXPERIENCE.checkRight + (after > before ? EXPERIENCE.levelUp : 0);
      continue;
    }
    const earned = practiceByDay.get(round.studyDate) ?? 0;
    const pay = Math.max(0, Math.min(round.correctCount * EXPERIENCE.practiceRight, EXPERIENCE.practiceDailyCap - earned));
    practiceByDay.set(round.studyDate, earned + pay);
    total += pay;
  }
  return total;
}

/** Experience needed to go from one character level to the next. */
export const experienceToNext = (level: number) => Math.round(50 * level ** 1.2);

export function characterLevel(experience: number) {
  let level = 1;
  let into = experience;
  while (into >= experienceToNext(level)) {
    into -= experienceToNext(level);
    level += 1;
  }
  return { level, into, needed: experienceToNext(level) };
}

export interface Rank {
  readonly at: number;
  readonly name: string;
  readonly icon: string;
}

export const RANKS: readonly Rank[] = [
  { at: 1, name: "Newcomer", icon: "🥚" },
  { at: 5, name: "Apprentice", icon: "🔧" },
  { at: 10, name: "Practitioner", icon: "🛠️" },
  { at: 15, name: "Builder", icon: "⚙️" },
  { at: 20, name: "Specialist", icon: "🧭" },
  { at: 28, name: "Expert", icon: "🏛️" },
  { at: 36, name: "Master", icon: "🧠" },
  { at: 45, name: "Legend", icon: "🐉" },
];

export function rankFor(level: number): Rank {
  return [...RANKS].reverse().find((rank) => level >= rank.at) ?? (RANKS[0] as Rank);
}

const weekday = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1)).getUTCDay();
};

function previousDay(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, (day ?? 1) - 1)).toISOString().slice(0, 10);
}

/**
 * Consecutive study days with a finished check. Days you did not plan to
 * study neither count against you nor break the run, and today stays open
 * until it is over.
 */
export function studyStreak(
  rounds: readonly PracticeRound[],
  today: string,
  studyDays: readonly number[] = [0, 1, 2, 3, 4, 5, 6],
) {
  const done = new Set(rounds.filter((round) => round.mode === "check").map((round) => round.studyDate));
  const planned = new Set(studyDays.length > 0 ? studyDays : [0, 1, 2, 3, 4, 5, 6]);
  let current = done.has(today) ? 1 : 0;
  for (let day = previousDay(today), guard = 0; guard < 3660; day = previousDay(day), guard += 1) {
    if (done.has(day)) current += 1;
    else if (planned.has(weekday(day))) break;
  }

  let best = 0;
  let run = 0;
  const first = [...done].sort()[0];
  if (first) {
    for (let day = first, guard = 0; daysBetween(day, today) >= 0 && guard < 3660; guard += 1) {
      if (done.has(day)) best = Math.max(best, (run += 1));
      else if (planned.has(weekday(day)) && day !== today) run = 0;
      const [year, month, date] = day.split("-").map(Number);
      day = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, (date ?? 1) + 1)).toISOString().slice(0, 10);
    }
  }
  return { current, best: Math.max(best, current), todayDone: done.has(today) };
}
