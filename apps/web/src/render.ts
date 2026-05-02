import { getSnapshot } from "@brainstorm/core";
import { boardHtml } from "./boardView.js";
import { wireIntroSportData } from "./introSport.js";
import { introHtml } from "./introView.js";
import { wireOptionsDialogOnce, openOptionsDialog } from "./optionsChrome.js";
import {
  readIntroPlayerNames,
  readIntroInitialServer,
  readIntroSport,
  readIntroTennisDoubles,
} from "./playerForms.js";
import { session } from "./session.js";
import { toastChangeEnds } from "./toast.js";
import { wireOptionsOpen, wireRulesOpen } from "./toolbar.js";

export function render(): void {
  wireOptionsDialogOnce(render);

  const root = document.querySelector("#app") as HTMLElement;
  if (!session.matchStarted) {
    root.innerHTML = introHtml();
    const introShell = root.querySelector(".shell-intro");
    if (introShell instanceof HTMLElement) wireIntroSportData(introShell);
    root.querySelector("#btn-start")?.addEventListener("click", () => {
      const shell = root.querySelector(".shell-intro") as HTMLElement;
      if (shell) {
        session.playerNames = readIntroPlayerNames(shell);
        session.pendingConfig = {
          ...session.pendingConfig,
          ...readIntroInitialServer(shell),
          ...readIntroSport(shell),
          ...readIntroTennisDoubles(shell),
        };
      }
      session.engine.reset(session.pendingConfig);
      session.matchStarted = true;
      render();
    });
    wireRulesOpen(root);
    wireOptionsOpen(root);
    return;
  }

  const snap = getSnapshot(session.engine);
  root.innerHTML = boardHtml(snap);

  root.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", () => {
      const action = el.getAttribute("data-action");
      const eng = session.engine;
      if (action === "pick-serve") {
        const side = el.getAttribute("data-side");
        if (side !== "a" && side !== "b") return;
        const r = eng.pickNextServer(side);
        if (!r.ok) alert(`Serve pick: ${r.error.code}`);
      } else if (action === "a" || action === "b") {
        const r = eng.point(action);
        if (!r.ok) alert(`Cannot add point: ${r.error.code}`);
        else toastChangeEnds(r.value.events);
      } else if (action === "undo") {
        const r = eng.undo();
        if (!r.ok) alert(`Undo: ${r.error.code}`);
      } else if (action === "reset") {
        session.matchStarted = false;
        eng.reset(session.pendingConfig);
      } else if (action === "setup") {
        openOptionsDialog();
      }
      render();
    });
  });
  wireRulesOpen(root);
  wireOptionsOpen(root);
}
