import { cloneState } from "./engineInit.js";
import {
  beginNextSetOrMatchTiebreak,
  currentTiebreakTarget,
  maybeSetMatchWinner,
} from "./engineTransitions.js";
import type {
  ApplyPointResult,
  InternalState,
  MatchEvent,
  Side,
} from "./engineTypes.js";
import { isTiebreakWon, otherSide } from "./gameScoring.js";
import { applyRegularGamePoint } from "./regularGameFlow.js";

export function applyPickNextServer(state: InternalState, side: Side): InternalState {
  const next = cloneState(state);
  if (!next.servePicker || next.config.sport !== "padel") {
    throw new Error("Invariant: pickNextServer without pending picker");
  }
  const reason = next.servePicker;
  next.servePicker = null;
  if (reason === "nextGame") {
    next.server = side;
    return next;
  }
  next.tbFirstServer = side;
  next.server = side;
  return next;
}

export function applyPoint(state: InternalState, side: Side): ApplyPointResult {
  if (state.matchWinner) {
    throw new Error("Invariant: applyPoint called with finished match");
  }
  if (state.servePicker && state.config.sport === "padel") {
    throw new Error("Invariant: applyPoint while padel serve pick is pending");
  }

  const events: MatchEvent[] = [];
  const next = cloneState(state);

  if (next.inTiebreak) {
    return applyTiebreakPoint(next, side, events);
  }
  return applyRegularGamePoint(next, side, events);
}

function applyTiebreakPoint(
  next: InternalState,
  side: Side,
  events: MatchEvent[],
): ApplyPointResult {
  const tbTarget = currentTiebreakTarget(next);
  const first = next.tbFirstServer;
  if (!first) {
    throw new Error("Invariant: in tiebreak without tbFirstServer");
  }

  if (side === "a") next.tbA += 1;
  else next.tbB += 1;

  if (!isTiebreakWon(next.tbA, next.tbB, tbTarget)) {
    return { state: next, events };
  }

  const stb = next.tbA > next.tbB ? "a" : "b";
  const isMtb = next.isMatchTiebreak;
  const gSet = next.config.gamesToWinSet;
  if (isMtb) {
    next.completedSets.push({
      gamesA: next.tbA,
      gamesB: next.tbB,
      matchTiebreak: true,
    });
  } else {
    next.completedSets.push({
      gamesA: stb === "a" ? gSet + 1 : gSet,
      gamesB: stb === "b" ? gSet + 1 : gSet,
    });
  }
  if (stb === "a") next.setsWonA += 1;
  else next.setsWonB += 1;

  next.inTiebreak = false;
  next.isMatchTiebreak = false;
  next.tbA = 0;
  next.tbB = 0;
  next.tbFirstServer = null;
  next.gamePointsA = 0;
  next.gamePointsB = 0;
  next.gamesA = 0;
  next.gamesB = 0;

  if (next.config.sport === "tennis") {
    next.server = otherSide(first);
  }
  maybeSetMatchWinner(next);
  events.push({ type: "changeEnds", reason: "set_break" });
  if (!next.matchWinner) beginNextSetOrMatchTiebreak(next, events);
  if (
    next.config.sport === "padel" &&
    !next.matchWinner &&
    !next.servePicker
  ) {
    next.servePicker = "nextGame";
  }
  return { state: next, events };
}
