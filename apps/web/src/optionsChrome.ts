import { optionsDlg } from "./dom.js";
import {
  readPlayerNamesFromForm,
  syncPlayerNamesToForm,
} from "./playerForms.js";
import {
  readConfigFromForm,
  syncFormFromConfig,
  syncOptionsFourDataset,
} from "./optionsForm.js";
import { session } from "./session.js";

let optionsChromeWired = false;

export function wireOptionsDialogOnce(render: () => void): void {
  if (optionsChromeWired) return;
  optionsChromeWired = true;

  optionsDlg.addEventListener("change", (ev) => {
    const t = ev.target;
    if (t instanceof HTMLInputElement) {
      if (t.name === "sport") {
        optionsDlg.dataset.sport = t.value === "padel" ? "padel" : "tennis";
      }
      if (t.name === "sport" || t.id === "options-tennis-doubles") {
        syncOptionsFourDataset(optionsDlg);
      }
    }
  });

  document.querySelector("#options-save")?.addEventListener("click", () => {
    session.pendingConfig = readConfigFromForm(optionsDlg, session.pendingConfig);
    session.playerNames = readPlayerNamesFromForm(optionsDlg);
    optionsDlg.close();
    if (!session.matchStarted) {
      session.engine.reset(session.pendingConfig);
    }
    render();
  });

  document.querySelector("#options-cancel")?.addEventListener("click", () => {
    syncFormFromConfig(optionsDlg, session.pendingConfig);
    syncPlayerNamesToForm(optionsDlg, session.playerNames);
    syncOptionsFourDataset(optionsDlg);
    optionsDlg.close();
  });
}

export function openOptionsDialog(): void {
  optionsDlg.dataset.sport = session.pendingConfig.sport;
  syncFormFromConfig(optionsDlg, session.pendingConfig);
  syncPlayerNamesToForm(optionsDlg, session.playerNames);
  syncOptionsFourDataset(optionsDlg);
  optionsDlg.showModal();
}
