import {
  beginNextSetOrMatchTiebreak,
  maybeSetMatchWinner,
} from "./engineTransitions.js";
import type { ApplyPointResult, InternalState, MatchEvent, Side } from "./engineTypes.js";
import {
  isGameWonWithRules,
  isRegularSetComplete,
  otherSide,
} from "./gameScoring.js";

function winnerOfGame(pointsA: number, pointsB: number): Side {
  return pointsA > pointsB ? "a" : "b";
}

export function applyRegularGamePoint(
  next: InternalState,
  side: Side,
  events: MatchEvent[],
): ApplyPointResult {
  const opa = next.gamePointsA;
  const opb = next.gamePointsB;
  if (side === "a") next.gamePointsA += 1;
  else next.gamePointsB += 1;

  let pa = next.gamePointsA;
  let pb = next.gamePointsB;
  if (pa === 4 && pb === 4) {
    const fromAdOut =
      (opa === 4 && opb === 3 && side === "b") ||
      (opa === 3 && opb === 4 && side === "a");
    if (fromAdOut) {
      next.gamePointsA = 3;
      next.gamePointsB = 3;
      pa = 3;
      pb = 3;
    }
  }

  const was40 = opa === 3 && opb === 3;
  const now40 = pa === 3 && pb === 3;
  if (now40 && !was40) next.deuceArrivalsThisGame += 1;

  if (
    !isGameWonWithRules(
      next.config.goldenPointAtDeuce,
      next.config.starPointInTiebreak,
      next.deuceArrivalsThisGame,
      pa,
      pb,
    )
  ) {
    return { state: next, events };
  }

  const gw = winnerOfGame(pa, pb);
  next.gamePointsA = 0;
  next.gamePointsB = 0;
  next.deuceArrivalsThisGame = 0;
  if (gw === "a") next.gamesA += 1;
  else next.gamesB += 1;

  const g = next.config.gamesToWinSet;
  const isSixSix = next.gamesA === g && next.gamesB === g;

  if (next.config.sport === "tennis") {
    next.server = otherSide(next.server);
  } else {
    next.servePicker = isSixSix ? "tiebreakStart" : "nextGame";
  }

  const totalGames = next.gamesA + next.gamesB;
  if (totalGames % 2 === 1) {
    events.push({ type: "changeEnds", reason: "odd_games" });
  }

  if (isSixSix) {
    next.inTiebreak = true;
    next.tbA = 0;
    next.tbB = 0;
    if (next.config.sport === "tennis") {
      next.tbFirstServer = next.server;
    } else {
      next.tbFirstServer = null;
    }
    events.push({ type: "changeEnds", reason: "tiebreak_start" });
    return { state: next, events };
  }

  if (isRegularSetComplete(next.gamesA, next.gamesB, g)) {
    next.completedSets.push({ gamesA: next.gamesA, gamesB: next.gamesB });
    const sw: Side = next.gamesA > next.gamesB ? "a" : "b";
    if (sw === "a") next.setsWonA += 1;
    else next.setsWonB += 1;

    next.gamesA = 0;
    next.gamesB = 0;

    maybeSetMatchWinner(next);
    events.push({ type: "changeEnds", reason: "set_break" });
    if (!next.matchWinner) beginNextSetOrMatchTiebreak(next, events);
    return { state: next, events };
  }

  return { state: next, events };
}
