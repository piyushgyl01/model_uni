import type { PracticeQuestion } from "./types";

/**
 * Read a typed number the way people write it: `-7`, `3.5`, `3,5`, `1,000`,
 * `1e-3`, `4.7k`, `2M`. Returns null for anything that is not one number.
 */
export function parseNumber(input: string): number | null {
  let text = input.trim().replace(/[\s_]/g, "");
  if (!text) return null;
  let scale = 1;
  const suffix = /^(.*?)([kM])$/.exec(text);
  if (suffix) {
    text = suffix[1] as string;
    scale = suffix[2] === "k" ? 1e3 : 1e6;
  }
  if (/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(text)) text = text.replace(/,/g, "");
  else if (/^[+-]?\d*,\d+$/.test(text)) text = text.replace(",", ".");
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(text)) return null;
  const value = Number(text) * scale;
  return Number.isFinite(value) ? value : null;
}

/** An exact answer still forgives floating-point noise in the last digits. */
const EXACT = 1e-9;

export function isCorrect(question: PracticeQuestion, response: string | number) {
  if (question.kind === "choice") return Number(response) === question.correctIndex;
  const value = typeof response === "number" ? response : parseNumber(response);
  if (value === null || !Number.isFinite(value)) return false;
  const tolerance = question.tolerance ?? EXACT;
  const scale = Math.max(Math.abs(question.answer), 1e-12);
  return Math.abs(value - question.answer) <= tolerance * scale + EXACT;
}

/** The answer written out, for feedback. */
export function answerText(question: PracticeQuestion) {
  if (question.kind === "choice") return question.options[question.correctIndex] ?? "";
  return Number.isInteger(question.answer)
    ? String(question.answer)
    : String(Number(question.answer.toPrecision(12)));
}
