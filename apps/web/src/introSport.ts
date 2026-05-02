function syncIntroSportDataAttr(shell: HTMLElement): void {
  const v = (
    shell.querySelector(
      'input[name="intro-sport"]:checked',
    ) as HTMLInputElement | null
  )?.value;
  shell.dataset.introSport = v === "padel" ? "padel" : "tennis";
}

function syncIntroFourNamesAttr(shell: HTMLElement): void {
  const sport = shell.dataset.introSport === "padel" ? "padel" : "tennis";
  const four =
    sport === "padel" ||
    (
      shell.querySelector(
        "#intro-tennis-doubles",
      ) as HTMLInputElement | null
    )?.checked === true;
  shell.dataset.introFourNames = four ? "true" : "false";
  shell.querySelectorAll(".name-row-second-pair").forEach((el) => {
    el.setAttribute("aria-hidden", four ? "false" : "true");
  });
}

function revealIntroSecondNameRow(shell: HTMLElement): void {
  shell
    .querySelector(".name-row-second-pair")
    ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  requestAnimationFrame(() => {
    shell.querySelector<HTMLInputElement>("#intro-name-a2")?.focus();
  });
}

export function wireIntroSportData(shell: HTMLElement): void {
  const sync = () => {
    const beforeFour = shell.dataset.introFourNames === "true";
    const beforeSport = shell.dataset.introSport;
    syncIntroSportDataAttr(shell);
    syncIntroFourNamesAttr(shell);
    const afterFour = shell.dataset.introFourNames === "true";
    const afterSport = shell.dataset.introSport;
    if (afterFour && !beforeFour) {
      revealIntroSecondNameRow(shell);
    }
    if (afterSport === "padel" && beforeSport !== "padel") {
      revealIntroSecondNameRow(shell);
    }
  };
  sync();
  shell.addEventListener("change", (ev) => {
    const t = ev.target;
    if (
      t instanceof HTMLInputElement &&
      (t.name === "intro-sport" || t.id === "intro-tennis-doubles")
    ) {
      sync();
    }
  });
  shell.addEventListener("click", () => {
    queueMicrotask(sync);
  });
}
