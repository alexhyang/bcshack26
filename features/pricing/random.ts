import type { RandomSource } from "./types";

export function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
export function randomUnit(random: RandomSource): number {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1)
    throw new Error("Random sources must return a number in [0, 1).");
  return value;
}
export function weightedRandom<T>(
  options: readonly { value: T; weight: number }[],
  random: RandomSource,
): T {
  const total = options.reduce((sum, option) => sum + option.weight, 0);
  if (
    !options.length ||
    !Number.isFinite(total) ||
    total <= 0 ||
    options.some((o) => !Number.isFinite(o.weight) || o.weight < 0)
  )
    throw new Error("Random weights must be finite, nonnegative, and have a positive total.");
  const selection = randomUnit(random) * total;
  let cumulative = 0;
  for (const option of options) {
    cumulative += option.weight;
    if (selection < cumulative) return option.value;
  }
  return options[options.length - 1].value;
}
export function createMarketSeed(): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues)
    return crypto.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * 4294967296);
}
