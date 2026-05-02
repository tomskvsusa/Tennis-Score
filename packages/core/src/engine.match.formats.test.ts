import { describe, expect, it } from "vitest";
import { MatchEngine } from "./engine.js";
import { getSnapshot } from "./index.js";
import { defaultMatchConfig, type MatchConfig } from "./matchConfig.js";
import { winGame } from "./testHelpers.js";

describe("MatchEngine match formats", () => {
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
      tennisDoubles: false,
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
      tennisDoubles: false,
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
});
