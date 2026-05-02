import { describe, expect, it } from "vitest";
import { applyPoint, createInitialState, MatchEngine } from "./engine.js";
import { getSnapshot } from "./index.js";
import { toSnapshot } from "./snapshot.js";
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
