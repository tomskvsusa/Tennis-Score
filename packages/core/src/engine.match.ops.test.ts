import { describe, expect, it } from "vitest";
import { MatchEngine } from "./engine.js";
import { getSnapshot } from "./index.js";

describe("MatchEngine events and undo", () => {
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
