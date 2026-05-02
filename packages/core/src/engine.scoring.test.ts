import { describe, expect, it } from "vitest";
import {
  isGameWon,
  isGameWonWithRules,
  isRegularSetComplete,
  isTiebreakWon,
} from "./engine.js";

describe("isGameWon", () => {
  it("detects 4-0 and deuce path", () => {
    expect(isGameWon(4, 0)).toBe(true);
    expect(isGameWon(3, 3)).toBe(false);
    expect(isGameWon(4, 2)).toBe(true);
    expect(isGameWon(5, 3)).toBe(true);
  });
});

describe("isGameWonWithRules", () => {
  it("golden wins at 4-3 from first deuce", () => {
    expect(isGameWonWithRules(true, false, 1, 4, 3)).toBe(true);
    expect(isGameWonWithRules(false, false, 9, 4, 3)).toBe(false);
  });

  it("star (3rd deuce) wins at 4-3 when arrivals>=3", () => {
    expect(isGameWonWithRules(false, true, 3, 4, 3)).toBe(true);
    expect(isGameWonWithRules(false, true, 2, 4, 3)).toBe(false);
  });

  it("golden dominates when both flags on", () => {
    expect(isGameWonWithRules(true, true, 1, 4, 3)).toBe(true);
  });

  it("classic win unchanged", () => {
    expect(isGameWonWithRules(false, false, 0, 6, 4)).toBe(true);
  });
});

describe("isTiebreakWon", () => {
  it("is first to 7 with margin 2", () => {
    expect(isTiebreakWon(6, 6)).toBe(false);
    expect(isTiebreakWon(7, 5)).toBe(true);
    expect(isTiebreakWon(8, 6)).toBe(true);
  });

  it("accepts custom target (match tiebreak 10)", () => {
    expect(isTiebreakWon(9, 9, 10)).toBe(false);
    expect(isTiebreakWon(10, 8, 10)).toBe(true);
  });
});

describe("isRegularSetComplete", () => {
  it("first to 6 with two-game lead", () => {
    expect(isRegularSetComplete(6, 4)).toBe(true);
    expect(isRegularSetComplete(6, 5)).toBe(false);
    expect(isRegularSetComplete(7, 5)).toBe(true);
  });

  it("first to 4 with two-game lead", () => {
    expect(isRegularSetComplete(4, 2, 4)).toBe(true);
    expect(isRegularSetComplete(4, 3, 4)).toBe(false);
  });
});
