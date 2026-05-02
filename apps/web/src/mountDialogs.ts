import optionsDialog1 from "./options-dialog-1.html?raw";
import optionsDialog2 from "./options-dialog-2.html?raw";
import rulesDialogHtml from "./rules-dialog.html?raw";

export function mountDialogs(): void {
  const root = document.getElementById("dialog-root");
  if (!root || root.dataset.mounted) return;
  root.innerHTML = optionsDialog1 + optionsDialog2 + rulesDialogHtml;
  root.dataset.mounted = "1";
}
