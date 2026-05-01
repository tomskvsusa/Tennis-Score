import {
  defaultMatchConfig,
  isDecidingNextSet,
  matchTiebreakTargetPoints,
  setTiebreakTargetPoints,
  setsToWinMatch,
  shouldStartDecidingMatchTiebreak,
  type MatchConfig,
} from "./matchConfig.js";

export type Side = "a" | "b";

export type MatchErrorCode =
  | "MATCH_COMPLETE"
  | "UNDO_EMPTY"
  | "NEED_SERVE_PICK"
  | "SERVE_PICK_NOT_PENDING";

/** Padel: user must choose who serves after each serve change (between games) or who starts a tiebreak. */
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

const MAX_UNDO = 500;

export function otherSide(s: Side): Side {
  return s === "a" ? "b" : "a";
}

/** Raw points within a regular game (standard tennis model: win at ≥4 with lead ≥2). */
export function isGameWon(pointsA: number, pointsB: number): boolean {
  const x = Math.max(pointsA, pointsB);
  return x >= 4 && Math.abs(pointsA - pointsB) >= 2;
}

/**
 * Game over: standard win-by-two, optional first-deuce golden, or optional
 * third-deuce golden (star point) when not using first-deuce golden.
 */
export function isGameWonWithRules(
  goldenPointAtDeuce: boolean,
  starThirdDeuceGolden: boolean,
  deuceArrivalsThisGame: number,
  pointsA: number,
  pointsB: number,
): boolean {
  if (isGameWon(pointsA, pointsB)) return true;
  if (pointsA < 3 || pointsB < 3) return false;
  const hi = Math.max(pointsA, pointsB);
  const lo = Math.min(pointsA, pointsB);
  if (goldenPointAtDeuce && hi === 4 && lo === 3) return true;
  if (
    starThirdDeuceGolden &&
    !goldenPointAtDeuce &&
    deuceArrivalsThisGame >= 3 &&
    hi === 4 &&
    lo === 3
  )
    return true;
  return false;
}

function winnerOfGame(pointsA: number, pointsB: number): Side {
  return pointsA > pointsB ? "a" : "b";
}

export function isTiebreakWon(
  ta: number,
  tb: number,
  target: number = 7,
): boolean {
  const x = Math.max(ta, tb);
  return x >= target && Math.abs(ta - tb) >= 2;
}

/** Regular set: first to `gamesToWin` games, win by 2 (no TB in this check). */
export function isRegularSetComplete(
  gamesA: number,
  gamesB: number,
  gamesToWin: number = 6,
): boolean {
  return (
    (gamesA >= gamesToWin && gamesA - gamesB >= 2) ||
    (gamesB >= gamesToWin && gamesB - gamesA >= 2)
  );
}

/** Who serves point `n` (1-based) in a tiebreak; `first` serves point 1. */
export function tiebreakServerForPointN(n: number, first: Side): Side {
  if (n <= 1) return first;
  const k = n - 2;
  const block = Math.floor(k / 2);
  return block % 2 === 0 ? otherSide(first) : first;
}

export type CompletedSet = {
  gamesA: number;
  gamesB: number;
  /** True when this "set" was decided by a match tiebreak (Bo3/Bo5 deciding MTB). */
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
  /** Deciding set played as match tiebreak only (no games). */
  isMatchTiebreak: boolean;
  gamePointsA: number;
  gamePointsB: number;
  tbA: number;
  tbB: number;
  /** Player who serves the current regular game; updated when a game completes. */
  server: Side;
  /** Player who served point 1 of the current tiebreak; null when not in TB. */
  tbFirstServer: Side | null;
  /** Padel only: waiting for UI to set next server / tiebreak first server. */
  servePicker: ServePickerReason | null;
  /** Count of times the score has become deuce (40–40) this game; resets each game. */
  deuceArrivalsThisGame: number;
  matchWinner: Side | null;
};

/** Side that serves the next point for the current score state. */
export function serverForUpcomingPoint(s: InternalState): Side {
  if (s.matchWinner) return s.server;
  if (s.inTiebreak) {
    const first = s.tbFirstServer;
    if (!first) return s.server;
    const n = s.tbA + s.tbB + 1;
    return tiebreakServerForPointN(n, first);
  }
  return s.server;
}

export function createInitialState(
  config: MatchConfig = defaultMatchConfig,
): InternalState {
  const needMtb = shouldStartDecidingMatchTiebreak(
    config,
    0,
    0,
    null,
  );
  if (needMtb) {
    const first = config.initialServer;
    return {
      config,
      setsWonA: 0,
      setsWonB: 0,
      completedSets: [],
      gamesA: 0,
      gamesB: 0,
      inTiebreak: true,
      isMatchTiebreak: true,
      gamePointsA: 0,
      gamePointsB: 0,
      tbA: 0,
      tbB: 0,
      server: first,
      tbFirstServer: first,
      servePicker: null,
      deuceArrivalsThisGame: 0,
      matchWinner: null,
    };
  }
  return {
    config,
    setsWonA: 0,
    setsWonB: 0,
    completedSets: [],
    gamesA: 0,
    gamesB: 0,
    inTiebreak: false,
    isMatchTiebreak: false,
    gamePointsA: 0,
    gamePointsB: 0,
    tbA: 0,
    tbB: 0,
    server: config.initialServer,
    tbFirstServer: null,
    servePicker: null,
    deuceArrivalsThisGame: 0,
    matchWinner: null,
  };
}

function cloneState(s: InternalState): InternalState {
  return {
    config: s.config,
    setsWonA: s.setsWonA,
    setsWonB: s.setsWonB,
    completedSets: [...s.completedSets],
    gamesA: s.gamesA,
    gamesB: s.gamesB,
    inTiebreak: s.inTiebreak,
    isMatchTiebreak: s.isMatchTiebreak,
    gamePointsA: s.gamePointsA,
    gamePointsB: s.gamePointsB,
    tbA: s.tbA,
    tbB: s.tbB,
    server: s.server,
    tbFirstServer: s.tbFirstServer,
    servePicker: s.servePicker,
    deuceArrivalsThisGame: s.deuceArrivalsThisGame,
    matchWinner: s.matchWinner,
  };
}

function currentTiebreakTarget(s: InternalState): number {
  if (s.isMatchTiebreak) {
    const t = matchTiebreakTargetPoints(s.config.decidingSetFormat);
    if (t != null) return t;
  }
  return setTiebreakTargetPoints();
}

function maybeSetMatchWinner(next: InternalState): void {
  const need = setsToWinMatch(next.config);
  if (next.setsWonA >= need) next.matchWinner = "a";
  else if (next.setsWonB >= need) next.matchWinner = "b";
}

function beginNextSetOrMatchTiebreak(
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

export type ApplyPointResult = {
  state: InternalState;
  events: MatchEvent[];
};

function applyPickNextServer(state: InternalState, side: Side): InternalState {
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

export class MatchEngine {
  private state: InternalState;
  private stack: InternalState[] = [];

  constructor(config: MatchConfig = defaultMatchConfig) {
    this.state = createInitialState(config);
  }

  getConfig(): Readonly<MatchConfig> {
    return this.state.config;
  }

  pickNextServer(side: Side): MatchResult<void> {
    if (this.state.matchWinner) {
      return { ok: false, error: { code: "MATCH_COMPLETE" } };
    }
    if (!this.state.servePicker || this.state.config.sport !== "padel") {
      return { ok: false, error: { code: "SERVE_PICK_NOT_PENDING" } };
    }
    if (this.stack.length >= MAX_UNDO) {
      this.stack.shift();
    }
    this.stack.push(cloneState(this.state));
    this.state = applyPickNextServer(this.state, side);
    return { ok: true, value: undefined };
  }

  point(side: Side): MatchResult<{ events: MatchEvent[] }> {
    if (this.state.matchWinner) {
      return { ok: false, error: { code: "MATCH_COMPLETE" } };
    }
    if (this.state.servePicker && this.state.config.sport === "padel") {
      return { ok: false, error: { code: "NEED_SERVE_PICK" } };
    }
    if (this.stack.length >= MAX_UNDO) {
      this.stack.shift();
    }
    this.stack.push(cloneState(this.state));
    const { state, events } = applyPoint(this.state, side);
    this.state = state;
    return { ok: true, value: { events } };
  }

  undo(): MatchResult<void> {
    const prev = this.stack.pop();
    if (!prev) {
      return { ok: false, error: { code: "UNDO_EMPTY" } };
    }
    this.state = prev;
    return { ok: true, value: undefined };
  }

  reset(config: MatchConfig = this.state.config): void {
    this.state = createInitialState(config);
    this.stack = [];
  }

  getInternalState(): Readonly<InternalState> {
    return this.state;
  }
}
