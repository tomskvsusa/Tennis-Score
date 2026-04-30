export type Side = "a" | "b";

export type MatchErrorCode = "MATCH_COMPLETE" | "UNDO_EMPTY";

export type MatchError = { code: MatchErrorCode };

export type MatchResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: MatchError };

const SETS_TO_WIN_MATCH = 2;
const MAX_UNDO = 500;

/** Raw points within a regular game (standard tennis model: win at ≥4 with lead ≥2). */
export function isGameWon(pointsA: number, pointsB: number): boolean {
  const x = Math.max(pointsA, pointsB);
  return x >= 4 && Math.abs(pointsA - pointsB) >= 2;
}

function winnerOfGame(pointsA: number, pointsB: number): Side {
  return pointsA > pointsB ? "a" : "b";
}

export function isTiebreakWon(ta: number, tb: number): boolean {
  const x = Math.max(ta, tb);
  return x >= 7 && Math.abs(ta - tb) >= 2;
}

/** Regular set (no tiebreak phase): first to 6 games, win by 2. */
export function isRegularSetComplete(gamesA: number, gamesB: number): boolean {
  return (
    (gamesA >= 6 && gamesA - gamesB >= 2) ||
    (gamesB >= 6 && gamesB - gamesA >= 2)
  );
}

export type InternalState = {
  setsWonA: number;
  setsWonB: number;
  completedSets: Array<{ gamesA: number; gamesB: number }>;
  gamesA: number;
  gamesB: number;
  inTiebreak: boolean;
  gamePointsA: number;
  gamePointsB: number;
  tbA: number;
  tbB: number;
  matchWinner: Side | null;
};

export function createInitialState(): InternalState {
  return {
    setsWonA: 0,
    setsWonB: 0,
    completedSets: [],
    gamesA: 0,
    gamesB: 0,
    inTiebreak: false,
    gamePointsA: 0,
    gamePointsB: 0,
    tbA: 0,
    tbB: 0,
    matchWinner: null,
  };
}

function cloneState(s: InternalState): InternalState {
  return {
    setsWonA: s.setsWonA,
    setsWonB: s.setsWonB,
    completedSets: [...s.completedSets],
    gamesA: s.gamesA,
    gamesB: s.gamesB,
    inTiebreak: s.inTiebreak,
    gamePointsA: s.gamePointsA,
    gamePointsB: s.gamePointsB,
    tbA: s.tbA,
    tbB: s.tbB,
    matchWinner: s.matchWinner,
  };
}

export function applyPoint(state: InternalState, side: Side): InternalState {
  if (state.matchWinner) {
    throw new Error("Invariant: applyPoint called with finished match");
  }

  const next = cloneState(state);

  if (next.inTiebreak) {
    if (side === "a") next.tbA += 1;
    else next.tbB += 1;

    if (!isTiebreakWon(next.tbA, next.tbB)) {
      return next;
    }

    const stb = next.tbA > next.tbB ? "a" : "b";
    const finalA = stb === "a" ? 7 : 6;
    const finalB = stb === "b" ? 7 : 6;
    next.completedSets.push({ gamesA: finalA, gamesB: finalB });
    if (stb === "a") next.setsWonA += 1;
    else next.setsWonB += 1;

    next.gamesA = 0;
    next.gamesB = 0;
    next.inTiebreak = false;
    next.tbA = 0;
    next.tbB = 0;
    next.gamePointsA = 0;
    next.gamePointsB = 0;

    if (next.setsWonA >= SETS_TO_WIN_MATCH) next.matchWinner = "a";
    else if (next.setsWonB >= SETS_TO_WIN_MATCH) next.matchWinner = "b";

    return next;
  }

  if (side === "a") next.gamePointsA += 1;
  else next.gamePointsB += 1;

  if (!isGameWon(next.gamePointsA, next.gamePointsB)) {
    return next;
  }

  const gw = winnerOfGame(next.gamePointsA, next.gamePointsB);
  next.gamePointsA = 0;
  next.gamePointsB = 0;
  if (gw === "a") next.gamesA += 1;
  else next.gamesB += 1;

  if (next.gamesA === 6 && next.gamesB === 6) {
    next.inTiebreak = true;
    next.tbA = 0;
    next.tbB = 0;
    return next;
  }

  if (isRegularSetComplete(next.gamesA, next.gamesB)) {
    next.completedSets.push({ gamesA: next.gamesA, gamesB: next.gamesB });
    const sw: Side = next.gamesA > next.gamesB ? "a" : "b";
    if (sw === "a") next.setsWonA += 1;
    else next.setsWonB += 1;

    next.gamesA = 0;
    next.gamesB = 0;

    if (next.setsWonA >= SETS_TO_WIN_MATCH) next.matchWinner = "a";
    else if (next.setsWonB >= SETS_TO_WIN_MATCH) next.matchWinner = "b";
  }

  return next;
}

export class MatchEngine {
  private state: InternalState;
  private stack: InternalState[] = [];

  constructor() {
    this.state = createInitialState();
  }

  point(side: Side): MatchResult<void> {
    if (this.state.matchWinner) {
      return { ok: false, error: { code: "MATCH_COMPLETE" } };
    }
    if (this.stack.length >= MAX_UNDO) {
      this.stack.shift();
    }
    this.stack.push(cloneState(this.state));
    this.state = applyPoint(this.state, side);
    return { ok: true, value: undefined };
  }

  undo(): MatchResult<void> {
    const prev = this.stack.pop();
    if (!prev) {
      return { ok: false, error: { code: "UNDO_EMPTY" } };
    }
    this.state = prev;
    return { ok: true, value: undefined };
  }

  reset(): void {
    this.state = createInitialState();
    this.stack = [];
  }

  getInternalState(): Readonly<InternalState> {
    return this.state;
  }
}
