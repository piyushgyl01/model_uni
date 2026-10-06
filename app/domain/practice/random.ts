import type { Rng } from "./types";

/** Mulberry32: small, fast and good enough to vary practice questions. */
export function seededRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A whole number from `min` to `max`, both included. */
export function int(rng: Rng, min: number, max: number) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)] as T;
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let index = out.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [out[index], out[swap]] = [out[swap] as T, out[index] as T];
  }
  return out;
}

/** `count` distinct items, in random order. */
export function sample<T>(rng: Rng, items: readonly T[], count: number): T[] {
  return shuffle(rng, items).slice(0, count);
}

/**
 * A choice question's options: the right answer plus distinct wrong ones,
 * shuffled. Wrong answers equal to the right one are dropped, so a generator
 * can propose near-misses without checking each one itself.
 */
export function choices(
  rng: Rng,
  correct: string,
  wrong: readonly string[],
  count = 4,
) {
  const distinct = [...new Set(wrong.filter((option) => option !== correct))];
  const options = shuffle(rng, [correct, ...sample(rng, distinct, count - 1)]);
  return { options, correctIndex: options.indexOf(correct) };
}
