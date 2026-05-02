import {
  MatchEngine,
  defaultMatchConfig,
  type MatchConfig,
} from "@brainstorm/core";

export type PlayerNamesState = {
  a1: string;
  a2: string;
  b1: string;
  b2: string;
};

export const session = {
  pendingConfig: { ...defaultMatchConfig } as MatchConfig,
  playerNames: { a1: "", a2: "", b1: "", b2: "" } as PlayerNamesState,
  engine: new MatchEngine(defaultMatchConfig),
  matchStarted: false,
};
