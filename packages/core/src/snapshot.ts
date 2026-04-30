import type { InternalState, Side } from "./engine.js";

export type MatchSnapshot = {
  setsWon: { a: number; b: number };
  completedSets: Array<{ gamesA: number; gamesB: number }>;
  currentSet: {
    gamesA: number;
    gamesB: number;
    inTiebreak: boolean;
    tiebreakPoints: { a: number; b: number } | null;
    gamePoints: { a: number; b: number };
  };
  matchWinner: Side | null;
};

export function toSnapshot(s: InternalState): MatchSnapshot {
  return {
    setsWon: { a: s.setsWonA, b: s.setsWonB },
    completedSets: [...s.completedSets],
    currentSet: {
      gamesA: s.gamesA,
      gamesB: s.gamesB,
      inTiebreak: s.inTiebreak,
      tiebreakPoints: s.inTiebreak ? { a: s.tbA, b: s.tbB } : null,
      gamePoints: { a: s.gamePointsA, b: s.gamePointsB },
    },
    matchWinner: s.matchWinner,
  };
}
