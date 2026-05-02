import { describe, expect, it } from "vitest";
import { MatchEngine } from "./engine.js";
import { getSnapshot } from "./index.js";
import { defaultMatchConfig, type MatchConfig } from "./matchConfig.js";
import { winGame, winGamePadel } from "./testHelpers.js";

describe("MatchEngine padel and deciding tiebreak", () => {
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
});
