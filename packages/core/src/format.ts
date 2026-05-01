import type { MatchSnapshot } from "./snapshot.js";
import { isGameWon } from "./engine.js";
import { matchTiebreakTargetPoints, setsToWinMatch } from "./matchConfig.js";

const LABELS = [0, 15, 30, 40] as const;

/** Human-readable current game score, or tiebreak line when active. */
export function formatCurrentGameOrTiebreak(s: MatchSnapshot): string {
  if (s.matchWinner) return "Match complete";

  if (s.currentSet.inTiebreak && s.currentSet.tiebreakPoints) {
    const { a, b } = s.currentSet.tiebreakPoints;
    const tgt = s.currentSet.isMatchTiebreak
      ? matchTiebreakTargetPoints(s.config.decidingSetFormat) ?? 7
      : 7;
    const starHint =
      s.config.starPointInTiebreak && a === tgt - 1 && b === tgt - 1
        ? " — next point wins"
        : "";
    if (s.currentSet.isMatchTiebreak)
      return `Match tiebreak ${a}–${b}${starHint}`;
    return `Tiebreak ${a}–${b}${starHint}`;
  }

  const pa = s.currentSet.gamePoints.a;
  const pb = s.currentSet.gamePoints.b;

  if (pa >= 3 && pb >= 3) {
    if (pa === pb) {
      return s.config.goldenPointAtDeuce ? "Deuce (golden point)" : "Deuce";
    }
    if (pa === pb + 1) return "Advantage A";
    if (pb === pa + 1) return "Advantage B";
  }

  return `${LABELS[pa] ?? pa}–${LABELS[pb] ?? pb}`;
}

function formatCompletedSet(cs: MatchSnapshot["completedSets"][0]): string {
  if (cs.matchTiebreak) return `MTB ${cs.gamesA}–${cs.gamesB}`;
  return `${cs.gamesA}–${cs.gamesB}`;
}

/** Multi-line status for CLI. */
export function formatStatus(s: MatchSnapshot): string {
  const lines: string[] = [];
  const need = setsToWinMatch(s.config);
  lines.push(
    `Sport: ${s.config.sport}; format: best of ${s.config.bestOfSets} (win ${need} sets), games/set ${s.config.gamesToWinSet}, deciding: ${s.config.decidingSetFormat}; golden deuce: ${s.config.goldenPointAtDeuce}; star TB: ${s.config.starPointInTiebreak}`,
  );
  if (s.servePicker && s.config.sport === "padel") {
    lines.push(
      `Serve pick: ${s.servePicker} (use app or CLI "pick a|b" to continue).`,
    );
  }
  lines.push(`Sets: A ${s.setsWon.a} – B ${s.setsWon.b}`);

  if (s.completedSets.length > 0) {
    const parts = s.completedSets.map(formatCompletedSet);
    lines.push(`Completed sets: ${parts.join(", ")}`);
  }

  lines.push(
    `Current set games: ${s.currentSet.gamesA}–${s.currentSet.gamesB}`,
  );
  lines.push(`Points: ${formatCurrentGameOrTiebreak(s)}`);
  lines.push(`Serve (next): ${s.server.toUpperCase()}`);

  if (s.matchWinner) {
    lines.push(`Winner: ${s.matchWinner.toUpperCase()}`);
  }

  return lines.join("\n");
}

export function gamePointsDisplay(
  pointsA: number,
  pointsB: number,
): string {
  if (isGameWon(pointsA, pointsB)) return "Game";
  if (pointsA >= 3 && pointsB >= 3) {
    if (pointsA === pointsB) return "Deuce";
    if (pointsA > pointsB && pointsA === pointsB + 1) return "Ad A";
    if (pointsB > pointsA && pointsB === pointsA + 1) return "Ad B";
  }
  const a = LABELS[pointsA] ?? pointsA;
  const b = LABELS[pointsB] ?? pointsB;
  return `${a}–${b}`;
}
