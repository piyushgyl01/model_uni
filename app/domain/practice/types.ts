/**
 * Practice checks: short, timed rounds of questions that the app marks
 * itself. Every question is generated with its answer computed at the same
 * moment, so nothing is taken on trust — not the learner's word, and not a
 * hand-typed answer key.
 */

/** A learner-facing question. Exactly one answer is correct. */
export type PracticeQuestion = NumberQuestion | ChoiceQuestion;

interface QuestionBase {
  readonly skillId: string;
  /** What to do, in one sentence. */
  readonly prompt: string;
  /** Source code shown in a monospaced block, when the question is about code. */
  readonly code?: string;
  /** Why the answer is what it is, shown after answering. */
  readonly explain: string;
  /**
   * A complete Python 3 program whose standard output is the answer. Tests run
   * it, where Python is available, so the generator and the language agree.
   */
  readonly python?: string;
}

export interface NumberQuestion extends QuestionBase {
  readonly kind: "number";
  readonly answer: number;
  /** Relative tolerance; omitted means the answer must match exactly. */
  readonly tolerance?: number;
}

export interface ChoiceQuestion extends QuestionBase {
  readonly kind: "choice";
  readonly options: readonly string[];
  readonly correctIndex: number;
}

/** Deterministic randomness, so tests can replay any question. */
export type Rng = () => number;

export interface PracticeSkill {
  /** Stable identity, e.g. "py.arith". Never derived from a title. */
  readonly id: string;
  readonly title: string;
  /** One line on what the skill is, shown beside its level. */
  readonly summary: string;
  readonly generate: (rng: Rng) => PracticeQuestion;
}

/** How a round was played. Only checks move a skill's level. */
export type PracticeMode = "check" | "practice";

/**
 * One finished round on one skill — the only thing practice ever stores.
 * Levels, experience, rank and streak are all derived from these, so two
 * devices can never disagree about them.
 */
export interface PracticeRound {
  readonly id: string;
  readonly skillId: string;
  readonly mode: PracticeMode;
  /** The level the round was played at. */
  readonly level: number;
  readonly questionCount: number;
  readonly correctCount: number;
  readonly durationSeconds: number;
  /** The learner's local date when it finished, YYYY-MM-DD. */
  readonly studyDate: string;
  readonly completedAt: string;
  readonly courseVersionId: string;
  readonly learningUnitId?: string;
}
