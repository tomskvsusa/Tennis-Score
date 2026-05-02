export let toastEl: HTMLElement;
export let rulesDlg: HTMLDialogElement;
export let optionsDlg: HTMLDialogElement;

export function bindDomRefs(): void {
  toastEl = document.querySelector("#toast") as HTMLElement;
  rulesDlg = document.querySelector("#rules") as HTMLDialogElement;
  optionsDlg = document.querySelector("#options") as HTMLDialogElement;
}
