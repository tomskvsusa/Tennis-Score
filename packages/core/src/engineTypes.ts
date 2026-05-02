import type { MatchConfig } from "./matchConfig.js";

export type Side = "a" | "b";

export type MatchErrorCode =
  | "MATCH_COMPLETE"
  | "UNDO_EMPTY"
  | "NEED_SERVE_PICK"
  | "SERVE_PICK_NOT_PENDING";

/** Padel: user chooses server after each change or tiebreak starter. */
export type ServePickerReason = "nextGame" | "tiebreakStart";

export type MatchError = { code: MatchErrorCode };

export type MatchResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: MatchError };

export type ChangeEndsReason = "odd_games" | "set_break" | "tiebreak_start";

export type MatchEvent = {
  type: "changeEnds";
  reason: ChangeEndsReason;
};

export type CompletedSet = {
  gamesA: number;
  gamesB: number;
  matchTiebreak?: boolean;
};

export type InternalState = {
  config: MatchConfig;
  setsWonA: number;
  setsWonB: number;
  completedSets: CompletedSet[];
  gamesA: number;
  gamesB: number;
  inTiebreak: boolean;
  isMatchTiebreak: boolean;
  gamePointsA: number;
  gamePointsB: number;
  tbA: number;
  tbB: number;
  server: Side;
  tbFirstServer: Side | null;
  servePicker: ServePickerReason | null;
  deuceArrivalsThisGame: number;
  matchWinner: Side | null;
};

export type ApplyPointResult = {
  state: InternalState;
  events: MatchEvent[];
};
