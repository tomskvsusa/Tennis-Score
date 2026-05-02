import { createInitialState, cloneState } from "./engineInit.js";
import { applyPickNextServer, applyPoint } from "./pointApplication.js";
import { defaultMatchConfig, type MatchConfig } from "./matchConfig.js";
import type {
  InternalState,
  MatchEvent,
  MatchResult,
  Side,
} from "./engineTypes.js";

const MAX_UNDO = 500;

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
