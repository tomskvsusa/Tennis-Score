import {
  defaultMatchConfig,
  shouldStartDecidingMatchTiebreak,
  type MatchConfig,
} from "./matchConfig.js";
import type { InternalState } from "./engineTypes.js";

export function createInitialState(
  config: MatchConfig = defaultMatchConfig,
): InternalState {
  const needMtb = shouldStartDecidingMatchTiebreak(config, 0, 0, null);
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

export function cloneState(s: InternalState): InternalState {
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
