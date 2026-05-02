import { describe, expect, it } from "vitest";
import { MatchEngine } from "./engine.js";
import { getSnapshot } from "./index.js";
import { defaultMatchConfig, type MatchConfig } from "./matchConfig.js";
import { winGame } from "./testHelpers.js";

describe("MatchEngine games and sets", () => {
  it("third-deuce star wins game from 3-3", () => {
    const cfg = {
      ...defaultMatchConfig,
      goldenPointAtDeuce: false,
      starPointInTiebreak: true,
    };
    const e = new MatchEngine(cfg);
    for (let i = 0; i < 3; i += 1) e.point("a");
    for (let i = 0; i < 3; i += 1) e.point("b");
    expect(getSnapshot(e).currentSet.gamePoints).toEqual({ a: 3, b: 3 });
    e.point("a");
    e.point("b");
    expect(getSnapshot(e).currentSet.gamePoints).toEqual({ a: 3, b: 3 });
    e.point("a");
    e.point("b");
    expect(getSnapshot(e).deuceArrivalsThisGame).toBe(3);
    expect(getSnapshot(e).currentSet.gamePoints).toEqual({ a: 3, b: 3 });
    e.point("a");
    const s = getSnapshot(e);
    expect(s.currentSet.gamesA).toBe(1);
    expect(s.currentSet.gamePoints).toEqual({ a: 0, b: 0 });
  });

  it("golden point at deuce wins game on next point", () => {
    const cfg = { ...defaultMatchConfig, goldenPointAtDeuce: true };
    const e = new MatchEngine(cfg);
    for (let i = 0; i < 3; i += 1) {
      e.point("a");
      e.point("b");
    }
    expect(getSnapshot(e).currentSet.gamePoints).toEqual({ a: 3, b: 3 });
    e.point("a");
    const s = getSnapshot(e);
    expect(s.currentSet.gamesA).toBe(1);
    expect(s.currentSet.gamePoints).toEqual({ a: 0, b: 0 });
  });

  it("deuce and advantage", () => {
    const e = new MatchEngine();
    for (let i = 0; i < 3; i += 1) {
      e.point("a");
      e.point("b");
    }
    const s1 = getSnapshot(e);
    expect(s1.currentSet.gamePoints).toEqual({ a: 3, b: 3 });
    e.point("a");
    const s2 = getSnapshot(e);
    expect(s2.currentSet.gamePoints).toEqual({ a: 4, b: 3 });
    e.point("b");
    const s3 = getSnapshot(e);
    expect(s3.currentSet.gamePoints).toEqual({ a: 3, b: 3 });
    e.point("a");
    e.point("a");
    const s4 = getSnapshot(e);
    expect(s4.currentSet.gamesA).toBe(1);
    expect(s4.currentSet.gamesB).toBe(0);
  });

  it("ends set 6-4 and tracks completed set", () => {
    const e = new MatchEngine();
    for (let i = 0; i < 4; i += 1) {
      winGame(e, "a");
      winGame(e, "b");
    }
    winGame(e, "a");
    winGame(e, "a");
    const snap = getSnapshot(e);
    expect(snap.completedSets).toEqual([{ gamesA: 6, gamesB: 4 }]);
    expect(snap.setsWon).toEqual({ a: 1, b: 0 });
    expect(snap.currentSet.gamesA).toBe(0);
  });

  it("enters tiebreak at 6-6", () => {
    const e = new MatchEngine();
    for (let i = 0; i < 5; i += 1) {
      winGame(e, "a");
      winGame(e, "b");
    }
    winGame(e, "a");
    winGame(e, "b");
    const snap = getSnapshot(e);
    expect(snap.currentSet.inTiebreak).toBe(true);
    expect(snap.currentSet.tiebreakPoints).toEqual({ a: 0, b: 0 });
  });

  it("wins set from tiebreak 6-7", () => {
    const e = new MatchEngine();
    for (let i = 0; i < 5; i += 1) {
      winGame(e, "a");
      winGame(e, "b");
    }
    winGame(e, "a");
    winGame(e, "b");
    expect(getSnapshot(e).currentSet.inTiebreak).toBe(true);
    for (let i = 0; i < 7; i += 1) e.point("b");
    const snap = getSnapshot(e);
    expect(snap.completedSets[0]).toEqual({ gamesA: 6, gamesB: 7 });
    expect(snap.setsWon.b).toBe(1);
  });
});
