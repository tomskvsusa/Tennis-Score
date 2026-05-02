import { escapeHtml } from "./escapeHtml.js";
import { session } from "./session.js";

export function labelForSide(side: "a" | "b"): string {
  if (session.pendingConfig.sport === "padel") {
    const parts =
      side === "a"
        ? [session.playerNames.a1, session.playerNames.a2]
        : [session.playerNames.b1, session.playerNames.b2];
    const joined = parts.map((x) => x.trim()).filter(Boolean).join(" · ");
    return joined || (side === "a" ? "Team A" : "Team B");
  }
  const raw = (side === "a" ? session.playerNames.a1 : session.playerNames.b1).trim();
  return raw || (side === "a" ? "Player A" : "Player B");
}

export function padelBoardNamesHtml(): string {
  const cell = (s: string, fb: string) => escapeHtml(s.trim() || fb);
  const row = (
    tag: string,
    n1: string,
    n2: string,
    f1: string,
    f2: string,
  ) =>
    `<div class="names-padel-row"><span class="names-padel-tag" aria-hidden="true">${tag}</span><span class="names-padel-pair">${cell(n1, f1)}<span class="names-padel-dot"> · </span>${cell(n2, f2)}</span></div>`;
  const { playerNames: p } = session;
  return `<div class="names-subhdr names-subhdr-padel" role="group" aria-label="Teams (doubles)">
      ${row("A", p.a1, p.a2, "A1", "A2")}
      <div class="names-padel-vs" aria-hidden="true">vs</div>
      ${row("B", p.b1, p.b2, "B1", "B2")}
    </div>`;
}
