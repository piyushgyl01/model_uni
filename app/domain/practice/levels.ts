import type { PracticeRound } from "./types";

/**
 * Skill levels, 1 to 10. A higher level asks more questions with less time on
 * each, so the check gets harder exactly where the learner is getting better.
 *
 *   all right   the skill goes up a level and comes back later
 *   one wrong   it stays
 *   two wrong   it drops a level and comes back tomorrow
 *
 * Only checks move a level. Practice rounds are recorded but leave it alone,
 * so a level always reflects a timed attempt on a fresh set of questions.
 */
export interface LevelRule {
  readonly questions: number;
  readonly numberSeconds: number;
  readonly choiceSeconds: number;
}

export const MAX_LEVEL = 10;

export const LEVELS: readonly LevelRule[] = [
  { questions: 2, numberSeconds: 180, choiceSeconds: 150 },
  { questions: 3, numberSeconds: 165, choiceSeconds: 135 },
  { questions: 3, numberSeconds: 150, choiceSeconds: 120 },
  { questions: 4, numberSeconds: 135, choiceSeconds: 110 },
  { questions: 4, numberSeconds: 120, choiceSeconds: 100 },
  { questions: 5, numberSeconds: 110, choiceSeconds: 90 },
  { questions: 5, numberSeconds: 100, choiceSeconds: 80 },
  { questions: 6, numberSeconds: 90, choiceSeconds: 75 },
  { questions: 6, numberSeconds: 80, choiceSeconds: 70 },
  { questions: 7, numberSeconds: 75, choiceSeconds: 60 },
];

/** Days a skill rests after a round at each level before it is due again. */
const REST_DAYS = [1, 1, 2, 3, 4, 6, 8, 11, 15, 20] as const;

export function levelRule(level: number): LevelRule {
  const clamped = Math.min(MAX_LEVEL, Math.max(1, Math.round(level)));
  return LEVELS[clamped - 1] as LevelRule;
}

/** The level after a round: up when clean, the same after one miss, down after two. */
export function scoreRound(level: number, correct: number, total: number) {
  const playedAt = Math.max(1, level);
  const missed = total - correct;
  if (missed <= 0) return Math.min(MAX_LEVEL, playedAt + 1);
  if (missed === 1) return playedAt;
  return Math.max(1, playedAt - 1);
}

export type RoundOutcome = "up" | "same" | "down";

export interface SkillState {
  readonly skillId: string;
  /** 0 until the first check, then 1–10. */
  readonly level: number;
  readonly checks: number;
  readonly practiced: number;
  readonly lastCheckDate?: string;
  readonly lastOutcome?: RoundOutcome;
}

/** Finishing order, with the id breaking ties so every device agrees. */
export const byCompletion = (a: PracticeRound, b: PracticeRound) =>
  a.completedAt.localeCompare(b.completedAt) || a.id.localeCompare(b.id);

/**
 * Replay every round in the order it finished. The result never depends on
 * which device recorded a round or in what order they arrived.
 */
export function skillStates(rounds: readonly PracticeRound[]) {
  const states = new Map<string, SkillState>();
  for (const round of [...rounds].sort(byCompletion)) {
    const prior = states.get(round.skillId) ?? {
      skillId: round.skillId,
      level: 0,
      checks: 0,
      practiced: 0,
    };
    if (round.mode !== "check") {
      states.set(round.skillId, { ...prior, practiced: prior.practiced + 1 });
      continue;
    }
    const from = Math.max(1, prior.level);
    const to = scoreRound(from, round.correctCount, round.questionCount);
    states.set(round.skillId, {
      ...prior,
      level: to,
      checks: prior.checks + 1,
      lastCheckDate: round.studyDate,
      lastOutcome: to > from ? "up" : to < from ? "down" : "same",
    });
  }
  return states;
}

/** Whole days from one YYYY-MM-DD date to another. */
export function daysBetween(from: string, to: string) {
  const parse = (key: string) => {
    const [year, month, day] = key.split("-").map(Number);
    return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1);
  };
  return Math.round((parse(to) - parse(from)) / 86_400_000);
}

/** Never checked, dropped last time, or rested long enough for its level. */
export function isDue(state: SkillState | undefined, today: string) {
  if (!state || state.level === 0 || !state.lastCheckDate) return true;
  const rested = daysBetween(state.lastCheckDate, today);
  if (rested <= 0) return false;
  if (state.lastOutcome === "down") return true;
  return rested >= (REST_DAYS[state.level - 1] ?? 1);
}
