import type { InternalState, Side } from "./engineTypes.js";

export function otherSide(s: Side): Side {
  return s === "a" ? "b" : "a";
}

export function isGameWon(pointsA: number, pointsB: number): boolean {
  const x = Math.max(pointsA, pointsB);
  return x >= 4 && Math.abs(pointsA - pointsB) >= 2;
}

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

export function isTiebreakWon(
  ta: number,
  tb: number,
  target: number = 7,
): boolean {
  const x = Math.max(ta, tb);
  return x >= target && Math.abs(ta - tb) >= 2;
}

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

export function tiebreakServerForPointN(n: number, first: Side): Side {
  if (n <= 1) return first;
  const k = n - 2;
  const block = Math.floor(k / 2);
  return block % 2 === 0 ? otherSide(first) : first;
}

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
