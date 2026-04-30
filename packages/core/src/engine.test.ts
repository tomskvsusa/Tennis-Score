import { describe, expect, it } from "vitest";
import {
  MatchEngine,
  applyPoint,
  createInitialState,
  isGameWon,
  isRegularSetComplete,
  isTiebreakWon,
} from "./engine.js";
import { toSnapshot } from "./snapshot.js";
import { getSnapshot } from "./index.js";

function winGame(engine: MatchEngine, side: "a" | "b") {
  for (let i = 0; i < 4; i += 1) {
    const r = engine.point(side);
    expect(r.ok).toBe(true);
  }
}

describe("isGameWon", () => {
  it("detects 4-0 and deuce path", () => {
    expect(isGameWon(4, 0)).toBe(true);
    expect(isGameWon(3, 3)).toBe(false);
    expect(isGameWon(4, 2)).toBe(true);
    expect(isGameWon(5, 3)).toBe(true);
  });
});

describe("isTiebreakWon", () => {
  it("is first to 7 with margin 2", () => {
    expect(isTiebreakWon(6, 6)).toBe(false);
    expect(isTiebreakWon(7, 5)).toBe(true);
    expect(isTiebreakWon(8, 6)).toBe(true);
  });
});

describe("isRegularSetComplete", () => {
  it("first to 6 with two-game lead", () => {
    expect(isRegularSetComplete(6, 4)).toBe(true);
    expect(isRegularSetComplete(6, 5)).toBe(false);
    expect(isRegularSetComplete(7, 5)).toBe(true);
  });
});

describe("MatchEngine", () => {
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
    expect(s3.currentSet.gamePoints).toEqual({ a: 4, b: 4 });
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

  it("match best-of-3 ends at 2-0 sets", () => {
    const e = new MatchEngine();
    const winSetForA = () => {
      for (let i = 0; i < 4; i += 1) {
        winGame(e, "a");
        winGame(e, "b");
      }
      winGame(e, "a");
      winGame(e, "a");
    };
    winSetForA();
    winSetForA();
    const snap = getSnapshot(e);
    expect(snap.matchWinner).toBe("a");
    expect(snap.setsWon).toEqual({ a: 2, b: 0 });
    const res = e.point("a");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("MATCH_COMPLETE");
  });

  it("undo restores previous point", () => {
    const e = new MatchEngine();
    e.point("a");
    e.point("a");
    let snap = getSnapshot(e);
    expect(snap.currentSet.gamePoints).toEqual({ a: 2, b: 0 });
    expect(e.undo().ok).toBe(true);
    snap = getSnapshot(e);
    expect(snap.currentSet.gamePoints).toEqual({ a: 1, b: 0 });
  });

  it("undo empty fails", () => {
    const e = new MatchEngine();
    const r = e.undo();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("UNDO_EMPTY");
  });

  it("reset clears state", () => {
    const e = new MatchEngine();
    e.point("a");
    e.reset();
    const snap = getSnapshot(e);
    expect(snap.currentSet.gamePoints).toEqual({ a: 0, b: 0 });
    expect(e.undo().ok).toBe(false);
  });
});

describe("applyPoint pure transitions", () => {
  it("matches engine incrementally", () => {
    let s = createInitialState();
    const eng = new MatchEngine();
    for (let i = 0; i < 10; i += 1) {
      s = applyPoint(s, i % 2 === 0 ? "a" : "b");
      eng.point(i % 2 === 0 ? "a" : "b");
      expect(toSnapshot(s)).toEqual(getSnapshot(eng));
    }
  });
});
