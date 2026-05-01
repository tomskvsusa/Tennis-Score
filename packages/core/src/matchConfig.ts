export type BestOfSets = 1 | 3 | 5;
export type GamesToWinSet = 4 | 6 | 8;
export type DecidingSetFormat = "full" | "matchTiebreak7" | "matchTiebreak10";
export type MatchSport = "tennis" | "padel";

/** Match format and scoring options (immutable for the duration of a match). */
export type MatchConfig = {
  /** Tennis: serve rotation follows standard rules. Padel: who serves next is chosen in the UI after each serve change. */
  sport: MatchSport;
  bestOfSets: BestOfSets;
  gamesToWinSet: GamesToWinSet;
  decidingSetFormat: DecidingSetFormat;
  initialServer: "a" | "b";
  /** At 40–40 (3–3 points), the next point wins the game (no advantage). */
  goldenPointAtDeuce: boolean;
  /**
   * In any tiebreak (set or match), at (target−1)–(target−1) the next point wins
   * (e.g. 6–6→7–6 at TB to 7, or 9–9→10–9 at MTB to 10).
   */
  starPointInTiebreak: boolean;
};

/** Same defaults as the original hard-coded engine: Bo3, set to 6, TB at 6–6, first serve A. */
export const defaultMatchConfig: MatchConfig = {
  sport: "tennis",
  bestOfSets: 3,
  gamesToWinSet: 6,
  decidingSetFormat: "full",
  initialServer: "a",
  goldenPointAtDeuce: false,
  starPointInTiebreak: false,
};

export function setsToWinMatch(config: MatchConfig): number {
  return Math.ceil(config.bestOfSets / 2);
}

/** Standard set tiebreak is always first to 7 with margin 2. */
export function setTiebreakTargetPoints(): 7 {
  return 7;
}

export function matchTiebreakTargetPoints(
  format: DecidingSetFormat,
): number | null {
  if (format === "matchTiebreak7") return 7;
  if (format === "matchTiebreak10") return 10;
  return null;
}

export function isDecidingNextSet(
  config: MatchConfig,
  setsWonA: number,
  setsWonB: number,
  matchWinner: "a" | "b" | null,
): boolean {
  if (matchWinner) return false;
  const need = setsToWinMatch(config);
  if (setsWonA >= need || setsWonB >= need) return false;
  return setsWonA + setsWonB === config.bestOfSets - 1;
}

export function shouldStartDecidingMatchTiebreak(
  config: MatchConfig,
  setsWonA: number,
  setsWonB: number,
  matchWinner: "a" | "b" | null,
): boolean {
  const m = matchTiebreakTargetPoints(config.decidingSetFormat);
  if (m == null) return false;
  return isDecidingNextSet(config, setsWonA, setsWonB, matchWinner);
}
