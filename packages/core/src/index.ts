import type { InternalState, MatchEngine } from "./engine.js";
import { toSnapshot, type MatchSnapshot } from "./snapshot.js";

export {
  MatchEngine,
  applyPoint,
  createInitialState,
  isGameWon,
  isRegularSetComplete,
  isTiebreakWon,
  otherSide,
  serverForUpcomingPoint,
  tiebreakServerForPointN,
  type ApplyPointResult,
  type ChangeEndsReason,
  type CompletedSet,
  type InternalState,
  type MatchError,
  type MatchErrorCode,
  type MatchEvent,
  type MatchResult,
  type ServePickerReason,
  type Side,
} from "./engine.js";
export { toSnapshot, type MatchSnapshot } from "./snapshot.js";
export {
  defaultMatchConfig,
  isDecidingNextSet,
  matchTiebreakTargetPoints,
  setTiebreakTargetPoints,
  setsToWinMatch,
  shouldStartDecidingMatchTiebreak,
  type BestOfSets,
  type DecidingSetFormat,
  type GamesToWinSet,
  type MatchConfig,
  type MatchSport,
} from "./matchConfig.js";

export function getSnapshot(engine: MatchEngine): MatchSnapshot {
  return toSnapshot(engine.getInternalState() as InternalState);
}
export {
  formatCurrentGameOrTiebreak,
  formatStatus,
  gamePointsDisplay,
} from "./format.js";
