import { describe, expect, it } from "vitest";
import {
  MatchEngine,
  applyPoint,
  createInitialState,
  isGameWon,
  isGameWonWithRules,
  isRegularSetComplete,
  isTiebreakWon,
  isTiebreakWonWithRules,
} from "./engine.js";
import { toSnapshot } from "./snapshot.js";
import { getSnapshot } from "./index.js";
import { defaultMatchConfig, type MatchConfig } from "./matchConfig.js";

function winGame(engine: MatchEngine, side: "a" | "b") {
  for (let i = 0; i < 4; i += 1) {
    const r = engine.point(side);
    expect(r.ok).toBe(true);
  }
}

function padelPoint(engine: MatchEngine, winner: "a" | "b", pickIfNeeded: "a" | "b") {
  if (getSnapshot(engine).servePicker) {
    expect(engine.pickNextServer(pickIfNeeded).ok).toBe(true);
  }
  expect(engine.point(winner).ok).toBe(true);
}

function winGamePadel(engine: MatchEngine, winner: "a" | "b", firstServeSide: "a" | "b") {
  for (let i = 0; i < 4; i += 1) {
    padelPoint(engine, winner, firstServeSide);
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

describe("isGameWonWithRules", () => {
  it("golden point ends game at 4-3 from deuce", () => {
    expect(isGameWonWithRules(true, 4, 3)).toBe(true);
    expect(isGameWonWithRules(false, 4, 3)).toBe(false);
  });

  it("classic win unchanged with golden on", () => {
    expect(isGameWonWithRules(true, 6, 4)).toBe(true);
  });
});

describe("isTiebreakWonWithRules", () => {
  it("star point wins tiebreak 7-6 from 6-all", () => {
    expect(isTiebreakWonWithRules(true, 7, 6, 7)).toBe(true);
    expect(isTiebreakWonWithRules(false, 7, 6, 7)).toBe(false);
  });

  it("match tiebreak 10-9 when star on", () => {
    expect(isTiebreakWonWithRules(true, 10, 9, 10)).toBe(true);
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

describe("MatchEngine", () => {
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

  it("best-of-1 ends after one set", () => {
    const cfg: MatchConfig = {
      sport: "tennis",
      bestOfSets: 1,
      gamesToWinSet: 6,
      decidingSetFormat: "full",
      initialServer: "a",
      goldenPointAtDeuce: false,
      starPointInTiebreak: false,
    };
    const e = new MatchEngine(cfg);
    for (let i = 0; i < 4; i += 1) {
      winGame(e, "a");
      winGame(e, "b");
    }
    winGame(e, "a");
    winGame(e, "a");
    const snap = getSnapshot(e);
    expect(snap.matchWinner).toBe("a");
    expect(snap.setsWon).toEqual({ a: 1, b: 0 });
  });

  it("best-of-5 requires three sets", () => {
    const cfg: MatchConfig = {
      sport: "tennis",
      bestOfSets: 5,
      gamesToWinSet: 6,
      decidingSetFormat: "full",
      initialServer: "a",
      goldenPointAtDeuce: false,
      starPointInTiebreak: false,
    };
    const e = new MatchEngine(cfg);
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
    expect(getSnapshot(e).matchWinner).toBe(null);
    winSetForA();
    expect(getSnapshot(e).matchWinner).toBe("a");
    expect(getSnapshot(e).setsWon).toEqual({ a: 3, b: 0 });
  });

  it("set to 4 games enters tiebreak at 4-4", () => {
    const cfg: MatchConfig = {
      ...defaultMatchConfig,
      gamesToWinSet: 4,
    };
    const e = new MatchEngine(cfg);
    for (let i = 0; i < 3; i += 1) {
      winGame(e, "a");
      winGame(e, "b");
    }
    winGame(e, "a");
    winGame(e, "b");
    const snap = getSnapshot(e);
    expect(snap.currentSet.inTiebreak).toBe(true);
    expect(snap.currentSet.gamesA).toBe(4);
    expect(snap.currentSet.gamesB).toBe(4);
  });

  it("padel requires serve pick after each game", () => {
    const cfg: MatchConfig = {
      ...defaultMatchConfig,
      sport: "padel",
      bestOfSets: 1,
    };
    const e = new MatchEngine(cfg);
    winGame(e, "a");
    expect(getSnapshot(e).servePicker).toBe("nextGame");
    const blocked = e.point("a");
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error.code).toBe("NEED_SERVE_PICK");
    expect(e.pickNextServer("b").ok).toBe(true);
    expect(getSnapshot(e).servePicker).toBe(null);
    expect(e.point("b").ok).toBe(true);
  });

  it("padel at 4-4 needs pick before tiebreak points", () => {
    const cfg: MatchConfig = {
      ...defaultMatchConfig,
      sport: "padel",
      gamesToWinSet: 4,
    };
    const e = new MatchEngine(cfg);
    for (let i = 0; i < 3; i += 1) {
      winGamePadel(e, "a", "a");
      winGamePadel(e, "b", "b");
    }
    winGamePadel(e, "a", "a");
    winGamePadel(e, "b", "b");
    const mid = getSnapshot(e);
    expect(mid.currentSet.inTiebreak).toBe(true);
    expect(mid.servePicker).toBe("tiebreakStart");
    expect(e.point("a").ok).toBe(false);
    expect(e.pickNextServer("a").ok).toBe(true);
    expect(getSnapshot(e).servePicker).toBe(null);
    expect(e.point("a").ok).toBe(true);
  });

  it("deciding match tiebreak 10 wins match from 1-1", () => {
    const cfg: MatchConfig = {
      sport: "tennis",
      bestOfSets: 3,
      gamesToWinSet: 6,
      decidingSetFormat: "matchTiebreak10",
      initialServer: "a",
      goldenPointAtDeuce: false,
      starPointInTiebreak: false,
    };
    const e = new MatchEngine(cfg);
    const winSet = (side: "a" | "b") => {
      for (let i = 0; i < 4; i += 1) {
        winGame(e, "a");
        winGame(e, "b");
      }
      winGame(e, side);
      winGame(e, side);
    };
    winSet("a");
    winSet("b");
    const mid = getSnapshot(e);
    expect(mid.setsWon).toEqual({ a: 1, b: 1 });
    expect(mid.currentSet.inTiebreak).toBe(true);
    expect(mid.currentSet.isMatchTiebreak).toBe(true);
    for (let i = 0; i < 10; i += 1) e.point("a");
    const snap = getSnapshot(e);
    expect(snap.matchWinner).toBe("a");
    expect(snap.completedSets[2]?.matchTiebreak).toBe(true);
  });

  it("emits changeEnds after odd total games in set", () => {
    const e = new MatchEngine();
    for (let i = 0; i < 3; i += 1) e.point("a");
    const r = e.point("a");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.events.some((ev) => ev.type === "changeEnds")).toBe(
        true,
      );
    }
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
      const side = i % 2 === 0 ? "a" : "b";
      s = applyPoint(s, side).state;
      eng.point(side);
      expect(toSnapshot(s)).toEqual(getSnapshot(eng));
    }
  });
});
