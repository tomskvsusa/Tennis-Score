import type { MatchEvent } from "@brainstorm/core";
import { toastEl } from "./dom.js";

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function showToast(text: string): void {
  toastEl.textContent = text;
  toastEl.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.hidden = true;
    toastTimer = null;
  }, 3800);
}

export function toastChangeEnds(events: MatchEvent[]): void {
  for (const ev of events) {
    if (ev.type !== "changeEnds") continue;
    if (ev.reason === "odd_games") {
      showToast("Change ends — after an odd game total in this set.");
    } else if (ev.reason === "set_break") {
      showToast("Between sets — change ends (often up to ~90s).");
    } else if (ev.reason === "tiebreak_start") {
      showToast("Change ends — tiebreak starting.");
    }
  }
}
