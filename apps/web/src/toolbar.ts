import { rulesDlg } from "./dom.js";
import { flushIntroFormToStateIfPresent } from "./playerForms.js";
import { openOptionsDialog } from "./optionsChrome.js";

export function wireRulesOpen(root: HTMLElement): void {
  const open = () => rulesDlg.showModal();
  root.querySelector("#btn-rules-intro")?.addEventListener("click", open);
  root.querySelector("#btn-rules-board")?.addEventListener("click", open);
}

export function wireOptionsOpen(root: HTMLElement): void {
  const open = () => {
    flushIntroFormToStateIfPresent(root);
    openOptionsDialog();
  };
  root.querySelector("#btn-options-intro")?.addEventListener("click", open);
  root.querySelector("#btn-options-board")?.addEventListener("click", open);
}
