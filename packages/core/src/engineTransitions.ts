import {
  matchTiebreakTargetPoints,
  setTiebreakTargetPoints,
  setsToWinMatch,
  shouldStartDecidingMatchTiebreak,
} from "./matchConfig.js";
import type { InternalState, MatchEvent } from "./engineTypes.js";

export function currentTiebreakTarget(s: InternalState): number {
  if (s.isMatchTiebreak) {
    const t = matchTiebreakTargetPoints(s.config.decidingSetFormat);
    if (t != null) return t;
  }
  return setTiebreakTargetPoints();
}

export function maybeSetMatchWinner(next: InternalState): void {
  const need = setsToWinMatch(next.config);
  if (next.setsWonA >= need) next.matchWinner = "a";
  else if (next.setsWonB >= need) next.matchWinner = "b";
}

export function beginNextSetOrMatchTiebreak(
  next: InternalState,
  events: MatchEvent[],
): void {
  next.gamesA = 0;
  next.gamesB = 0;
  next.gamePointsA = 0;
  next.gamePointsB = 0;
  next.inTiebreak = false;
  next.isMatchTiebreak = false;
  next.tbA = 0;
  next.tbB = 0;
  next.tbFirstServer = null;

  if (next.matchWinner) return;

  if (
    shouldStartDecidingMatchTiebreak(
      next.config,
      next.setsWonA,
      next.setsWonB,
      next.matchWinner,
    )
  ) {
    next.inTiebreak = true;
    next.isMatchTiebreak = true;
    next.tbA = 0;
    next.tbB = 0;
    if (next.config.sport === "padel") {
      next.tbFirstServer = null;
      next.servePicker = "tiebreakStart";
    } else {
      next.tbFirstServer = next.server;
    }
    events.push({ type: "changeEnds", reason: "tiebreak_start" });
  }
}
