function syncIntroSportDataAttr(shell: HTMLElement): void {
  const v = (
    shell.querySelector(
      'input[name="intro-sport"]:checked',
    ) as HTMLInputElement | null
  )?.value;
  shell.dataset.introSport = v === "padel" ? "padel" : "tennis";
}

function revealIntroPadelDoubles(shell: HTMLElement): void {
  shell
    .querySelector(".name-row-padel-only")
    ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  requestAnimationFrame(() => {
    shell.querySelector<HTMLInputElement>("#intro-name-a2")?.focus();
  });
}

export function wireIntroSportData(shell: HTMLElement): void {
  const sync = () => {
    const before = shell.dataset.introSport;
    syncIntroSportDataAttr(shell);
    const after = shell.dataset.introSport;
    if (after === "padel" && before !== "padel") {
      revealIntroPadelDoubles(shell);
    }
  };
  sync();
  shell.addEventListener("change", (ev) => {
    if (
      ev.target instanceof HTMLInputElement &&
      ev.target.name === "intro-sport"
    ) {
      sync();
    }
  });
  shell.addEventListener("click", () => {
    queueMicrotask(sync);
  });
}
