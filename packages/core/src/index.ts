import type { InternalState, MatchEngine } from "./engine.js";
import { toSnapshot, type MatchSnapshot } from "./snapshot.js";

export {
  MatchEngine,
  applyPoint,
  createInitialState,
  isGameWon,
  isRegularSetComplete,
  isTiebreakWon,
  type InternalState,
  type MatchError,
  type MatchErrorCode,
  type MatchResult,
  type Side,
} from "./engine.js";
export { toSnapshot, type MatchSnapshot } from "./snapshot.js";

export function getSnapshot(engine: MatchEngine): MatchSnapshot {
  return toSnapshot(engine.getInternalState() as InternalState);
}
export {
  formatCurrentGameOrTiebreak,
  formatStatus,
  gamePointsDisplay,
} from "./format.js";
