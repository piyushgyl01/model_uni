/**
 * The day's check: the skills of today's units, plus reviews of skills that
 * are due again, within a question budget. One check a day per program; any
 * further rounds are practice, which is recorded but never moves a level.
 */
import { isDue, levelRule, skillStates } from "./levels";
import { practiceSkill, skillIdsForUnit } from "./registry";
import type { PracticeQuestion, PracticeRound, Rng } from "./types";

/** Questions a check may spend on reviews once today's own skills are in. */
export const CHECK_BUDGET = 12;

export interface TodayUnit {
  readonly learningUnitId: string;
  readonly courseVersionId: string;
}

export interface CheckItem {
  readonly skillId: string;
  /** The level this round is played at: 1 for a skill never checked. */
  readonly level: number;
  readonly questions: number;
  readonly courseVersionId: string;
  readonly learningUnitId?: string;
  readonly reason: "new" | "today" | "review";
}

export interface DailyCheck {
  readonly items: readonly CheckItem[];
  readonly questionCount: number;
  /** A check already finished today: the rest of the day is practice. */
  readonly doneToday: boolean;
}

export function checkDoneOn(
  rounds: readonly PracticeRound[],
  studyDate: string,
) {
  return rounds.some(
    (round) => round.mode === "check" && round.studyDate === studyDate,
  );
}

export function planDailyCheck(
  todayUnits: readonly TodayUnit[],
  rounds: readonly PracticeRound[],
  today: string,
): DailyCheck {
  if (checkDoneOn(rounds, today))
    return { items: [], questionCount: 0, doneToday: true };
  const states = skillStates(rounds);
  const items: CheckItem[] = [];
  const taken = new Set<string>();
  const add = (item: CheckItem) => {
    items.push(item);
    taken.add(item.skillId);
  };

  for (const unit of todayUnits) {
    for (const skillId of skillIdsForUnit(unit.learningUnitId)) {
      const state = states.get(skillId);
      if (taken.has(skillId) || !practiceSkill(skillId)) continue;
      // Today's own skills stay in while they are still being learnt.
      if (state && state.level > 2 && !isDue(state, today)) continue;
      const level = Math.max(1, state?.level ?? 0);
      add({
        skillId,
        level,
        questions: levelRule(level).questions,
        courseVersionId: unit.courseVersionId,
        learningUnitId: unit.learningUnitId,
        reason: state?.level ? "today" : "new",
      });
    }
  }

  // Where each started skill was last played, so a review is filed there.
  const home = new Map<string, PracticeRound>();
  for (const round of rounds) {
    const prior = home.get(round.skillId);
    if (!prior || prior.completedAt < round.completedAt)
      home.set(round.skillId, round);
  }
  const reviews = [...states.values()]
    .filter(
      (state) =>
        state.level > 0 &&
        !taken.has(state.skillId) &&
        practiceSkill(state.skillId) &&
        isDue(state, today),
    )
    .sort(
      (a, b) =>
        a.level - b.level ||
        (a.lastCheckDate ?? "").localeCompare(b.lastCheckDate ?? ""),
    );
  let budget = CHECK_BUDGET;
  for (const state of reviews) {
    const questions = levelRule(state.level).questions;
    const last = home.get(state.skillId);
    if (questions > budget || !last) continue;
    budget -= questions;
    add({
      skillId: state.skillId,
      level: state.level,
      questions,
      courseVersionId: last.courseVersionId,
      ...(last.learningUnitId ? { learningUnitId: last.learningUnitId } : {}),
      reason: "review",
    });
  }

  return {
    items,
    questionCount: items.reduce((total, item) => total + item.questions, 0),
    doneToday: false,
  };
}

export interface CheckQuestion {
  readonly item: CheckItem;
  readonly question: PracticeQuestion;
  readonly seconds: number;
}

/** Fresh questions for a check — new numbers every time it is played. */
export function buildQuestions(
  items: readonly CheckItem[],
  rng: Rng,
): CheckQuestion[] {
  return items.flatMap((item) => {
    const skill = practiceSkill(item.skillId);
    if (!skill) return [];
    const rule = levelRule(item.level);
    return Array.from({ length: item.questions }, () => {
      const question = skill.generate(rng);
      return {
        item,
        question,
        seconds:
          question.kind === "choice" ? rule.choiceSeconds : rule.numberSeconds,
      };
    });
  });
}
