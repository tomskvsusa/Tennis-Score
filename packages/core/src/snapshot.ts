import type { InternalState, ServePickerReason, Side } from "./engineTypes.js";
import { serverForUpcomingPoint } from "./gameScoring.js";
import { isDecidingNextSet } from "./matchConfig.js";
import type { MatchConfig } from "./matchConfig.js";

export type MatchSnapshot = {
  config: MatchConfig;
  /** Padel: waiting for who serves next game or who starts tiebreak. */
  servePicker: ServePickerReason | null;
  setsWon: { a: number; b: number };
  completedSets: Array<{
    gamesA: number;
    gamesB: number;
    matchTiebreak?: boolean;
  }>;
  currentSet: {
    gamesA: number;
    gamesB: number;
    inTiebreak: boolean;
    isMatchTiebreak: boolean;
    tiebreakPoints: { a: number; b: number } | null;
    gamePoints: { a: number; b: number };
  };
  /** Who serves the next point (regular game or tiebreak rotation). */
  server: Side;
  /** Times deuce was reached this game (for star point / 3rd-deuce UI). */
  deuceArrivalsThisGame: number;
  isDecidingSet: boolean;
  matchWinner: Side | null;
};

export function toSnapshot(s: InternalState): MatchSnapshot {
  const isDecidingSet = isDecidingNextSet(
    s.config,
    s.setsWonA,
    s.setsWonB,
    s.matchWinner,
  );
  return {
    config: s.config,
    servePicker: s.servePicker,
    setsWon: { a: s.setsWonA, b: s.setsWonB },
    completedSets: [...s.completedSets],
    currentSet: {
      gamesA: s.gamesA,
      gamesB: s.gamesB,
      inTiebreak: s.inTiebreak,
      isMatchTiebreak: s.isMatchTiebreak,
      tiebreakPoints: s.inTiebreak ? { a: s.tbA, b: s.tbB } : null,
      gamePoints: { a: s.gamePointsA, b: s.gamePointsB },
    },
    server: serverForUpcomingPoint(s),
    deuceArrivalsThisGame: s.inTiebreak ? 0 : s.deuceArrivalsThisGame,
    isDecidingSet,
    matchWinner: s.matchWinner,
  };
}
