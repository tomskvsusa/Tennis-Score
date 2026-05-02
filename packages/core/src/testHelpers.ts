import { expect } from "vitest";
import { MatchEngine } from "./matchEngine.js";
import { toSnapshot } from "./snapshot.js";
import type { InternalState } from "./engineTypes.js";

function snap(engine: MatchEngine) {
  return toSnapshot(engine.getInternalState() as InternalState);
}

export function winGame(engine: MatchEngine, side: "a" | "b") {
  for (let i = 0; i < 4; i += 1) {
    const r = engine.point(side);
    expect(r.ok).toBe(true);
  }
}

export function padelPoint(
  engine: MatchEngine,
  winner: "a" | "b",
  pickIfNeeded: "a" | "b",
) {
  if (snap(engine).servePicker) {
    expect(engine.pickNextServer(pickIfNeeded).ok).toBe(true);
  }
  expect(engine.point(winner).ok).toBe(true);
}

export function winGamePadel(
  engine: MatchEngine,
  winner: "a" | "b",
  firstServeSide: "a" | "b",
) {
  for (let i = 0; i < 4; i += 1) {
    padelPoint(engine, winner, firstServeSide);
  }
}
