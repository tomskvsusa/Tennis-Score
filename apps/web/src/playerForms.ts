import type { MatchConfig } from "@brainstorm/core";
import { session, type PlayerNamesState } from "./session.js";

export function readPlayerNamesFromForm(root: HTMLElement): PlayerNamesState {
  const v = (id: string) =>
    (root.querySelector(id) as HTMLInputElement | null)?.value ?? "";
  return {
    a1: v("#player-name-a1").trim(),
    a2: v("#player-name-a2").trim(),
    b1: v("#player-name-b1").trim(),
    b2: v("#player-name-b2").trim(),
  };
}

export function syncPlayerNamesToForm(
  root: HTMLElement,
  names: PlayerNamesState,
): void {
  const set = (id: string, val: string) => {
    const el = root.querySelector(id) as HTMLInputElement | null;
    if (el) el.value = val;
  };
  set("#player-name-a1", names.a1);
  set("#player-name-a2", names.a2);
  set("#player-name-b1", names.b1);
  set("#player-name-b2", names.b2);
}

export function readIntroPlayerNames(host: HTMLElement): PlayerNamesState {
  const v = (id: string) =>
    (host.querySelector(id) as HTMLInputElement | null)?.value ?? "";
  return {
    a1: v("#intro-name-a1").trim(),
    a2: v("#intro-name-a2").trim(),
    b1: v("#intro-name-b1").trim(),
    b2: v("#intro-name-b2").trim(),
  };
}

export function readIntroInitialServer(
  host: HTMLElement,
): Pick<MatchConfig, "initialServer"> {
  const v = (
    host.querySelector(
      'input[name="intro-serve"]:checked',
    ) as HTMLInputElement | null
  )?.value;
  return { initialServer: v === "b" ? "b" : "a" };
}

export function readIntroSport(host: HTMLElement): Pick<MatchConfig, "sport"> {
  const v = (
    host.querySelector(
      'input[name="intro-sport"]:checked',
    ) as HTMLInputElement | null
  )?.value;
  return { sport: v === "padel" ? "padel" : "tennis" };
}

/** Tennis: from checkbox. Padel: keeps existing flag (ignored for display). */
export function readIntroTennisDoubles(
  host: HTMLElement,
): Pick<MatchConfig, "tennisDoubles"> {
  const sport = readIntroSport(host).sport;
  if (sport === "padel") {
    return { tennisDoubles: session.pendingConfig.tennisDoubles };
  }
  return {
    tennisDoubles:
      (
        host.querySelector(
          "#intro-tennis-doubles",
        ) as HTMLInputElement | null
      )?.checked ?? false,
  };
}

export function flushIntroFormToStateIfPresent(host: HTMLElement): void {
  const shell = host.querySelector(".shell-intro");
  if (!(shell instanceof HTMLElement)) return;
  session.playerNames = readIntroPlayerNames(shell);
  session.pendingConfig = {
    ...session.pendingConfig,
    ...readIntroInitialServer(shell),
    ...readIntroSport(shell),
    ...readIntroTennisDoubles(shell),
  };
}
