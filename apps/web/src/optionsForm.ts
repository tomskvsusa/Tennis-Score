import type { MatchConfig } from "@brainstorm/core";

export function readConfigFromForm(root: HTMLElement): MatchConfig {
  const bestRaw = (
    root.querySelector('input[name="bestOf"]:checked') as HTMLInputElement
  )?.value;
  const best = Number(bestRaw) as MatchConfig["bestOfSets"];
  const games = Number(
    (root.querySelector("select[name=games]") as HTMLSelectElement).value,
  ) as MatchConfig["gamesToWinSet"];
  const deciding = (
    root.querySelector('input[name="deciding"]:checked') as HTMLInputElement
  )?.value as MatchConfig["decidingSetFormat"];
  const initialServer =
    (root.querySelector('input[name="serve"]:checked') as HTMLInputElement)
      ?.value === "b"
      ? "b"
      : "a";
  const sportRaw = (
    root.querySelector('input[name="sport"]:checked') as HTMLInputElement
  )?.value;
  const sport = sportRaw === "padel" ? "padel" : "tennis";
  const goldenOn =
    (
      root.querySelector(
        'input[name="goldenPoint"]:checked',
      ) as HTMLInputElement | null
    )?.value === "on";
  const starTbOn =
    (
      root.querySelector(
        'input[name="starTiebreak"]:checked',
      ) as HTMLInputElement | null
    )?.value === "on";
  return {
    sport,
    bestOfSets: best === 1 || best === 3 || best === 5 ? best : 3,
    gamesToWinSet: games === 4 || games === 6 || games === 8 ? games : 6,
    decidingSetFormat:
      deciding === "matchTiebreak7" || deciding === "matchTiebreak10"
        ? deciding
        : "full",
    initialServer,
    goldenPointAtDeuce: goldenOn,
    starPointInTiebreak: starTbOn,
  };
}

export function syncFormFromConfig(root: HTMLElement, c: MatchConfig): void {
  root
    .querySelector<HTMLInputElement>(`input[name="bestOf"][value="${c.bestOfSets}"]`)
    ?.click();
  const sel = root.querySelector<HTMLSelectElement>("select[name=games]");
  if (sel) sel.value = String(c.gamesToWinSet);
  root
    .querySelector<HTMLInputElement>(
      `input[name="deciding"][value="${c.decidingSetFormat}"]`,
    )
    ?.click();
  root
    .querySelector<HTMLInputElement>(
      `input[name="serve"][value="${c.initialServer}"]`,
    )
    ?.click();
  root
    .querySelector<HTMLInputElement>(`input[name="sport"][value="${c.sport}"]`)
    ?.click();
  root
    .querySelector<HTMLInputElement>(
      `input[name="goldenPoint"][value="${c.goldenPointAtDeuce ? "on" : "off"}"]`,
    )
    ?.click();
  root
    .querySelector<HTMLInputElement>(
      `input[name="starTiebreak"][value="${c.starPointInTiebreak ? "on" : "off"}"]`,
    )
    ?.click();
}
