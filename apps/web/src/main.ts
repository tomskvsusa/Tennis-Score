import {
  MatchEngine,
  defaultMatchConfig,
  formatCurrentGameOrTiebreak,
  formatStatus,
  getSnapshot,
  type MatchConfig,
  type MatchEvent,
  type MatchSnapshot,
} from "@brainstorm/core";
import "./style.css";

let pendingConfig: MatchConfig = { ...defaultMatchConfig };

type PlayerNamesState = { a1: string; a2: string; b1: string; b2: string };
let playerNames: PlayerNamesState = { a1: "", a2: "", b1: "", b2: "" };
let engine = new MatchEngine(pendingConfig);
let matchStarted = false;

const toastEl = document.querySelector("#toast") as HTMLElement;
const rulesDlg = document.querySelector("#rules") as HTMLDialogElement;
const optionsDlg = document.querySelector("#options") as HTMLDialogElement;

let toastTimer: ReturnType<typeof setTimeout> | null = null;
let optionsChromeWired = false;

function showToast(text: string) {
  toastEl.textContent = text;
  toastEl.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.hidden = true;
    toastTimer = null;
  }, 3800);
}

function toastChangeEnds(events: MatchEvent[]) {
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function padelBoardNamesHtml(): string {
  const cell = (s: string, fb: string) => escapeHtml(s.trim() || fb);
  const row = (
    tag: string,
    n1: string,
    n2: string,
    f1: string,
    f2: string,
  ) => `<div class="names-padel-row"><span class="names-padel-tag" aria-hidden="true">${tag}</span><span class="names-padel-pair">${cell(n1, f1)}<span class="names-padel-dot"> · </span>${cell(n2, f2)}</span></div>`;
  return `<div class="names-subhdr names-subhdr-padel" role="group" aria-label="Teams (doubles)">
      ${row("A", playerNames.a1, playerNames.a2, "A1", "A2")}
      <div class="names-padel-vs" aria-hidden="true">vs</div>
      ${row("B", playerNames.b1, playerNames.b2, "B1", "B2")}
    </div>`;
}

function labelForSide(side: "a" | "b"): string {
  if (pendingConfig.sport === "padel") {
    const parts =
      side === "a"
        ? [playerNames.a1, playerNames.a2]
        : [playerNames.b1, playerNames.b2];
    const joined = parts.map((x) => x.trim()).filter(Boolean).join(" · ");
    return joined || (side === "a" ? "Team A" : "Team B");
  }
  const raw = (side === "a" ? playerNames.a1 : playerNames.b1).trim();
  return raw || (side === "a" ? "Player A" : "Player B");
}

function readPlayerNamesFromForm(root: HTMLElement): PlayerNamesState {
  const v = (id: string) =>
    (root.querySelector(id) as HTMLInputElement | null)?.value ?? "";
  return {
    a1: v("#player-name-a1").trim(),
    a2: v("#player-name-a2").trim(),
    b1: v("#player-name-b1").trim(),
    b2: v("#player-name-b2").trim(),
  };
}

function syncPlayerNamesToForm(root: HTMLElement, names: PlayerNamesState) {
  const set = (id: string, val: string) => {
    const el = root.querySelector(id) as HTMLInputElement | null;
    if (el) el.value = val;
  };
  set("#player-name-a1", names.a1);
  set("#player-name-a2", names.a2);
  set("#player-name-b1", names.b1);
  set("#player-name-b2", names.b2);
}

function readIntroPlayerNames(host: HTMLElement): PlayerNamesState {
  const v = (id: string) =>
    (host.querySelector(id) as HTMLInputElement | null)?.value ?? "";
  return {
    a1: v("#intro-name-a1").trim(),
    a2: v("#intro-name-a2").trim(),
    b1: v("#intro-name-b1").trim(),
    b2: v("#intro-name-b2").trim(),
  };
}

function readIntroInitialServer(
  host: HTMLElement,
): Pick<MatchConfig, "initialServer"> {
  const v = (
    host.querySelector(
      'input[name="intro-serve"]:checked',
    ) as HTMLInputElement | null
  )?.value;
  return { initialServer: v === "b" ? "b" : "a" };
}

function flushIntroFormToStateIfPresent(host: HTMLElement) {
  const shell = host.querySelector(".shell-intro");
  if (!shell) return;
  playerNames = readIntroPlayerNames(shell as HTMLElement);
  pendingConfig = {
    ...pendingConfig,
    ...readIntroInitialServer(shell as HTMLElement),
    ...readIntroSport(shell as HTMLElement),
  };
}

function readIntroSport(host: HTMLElement): Pick<MatchConfig, "sport"> {
  const v = (
    host.querySelector(
      'input[name="intro-sport"]:checked',
    ) as HTMLInputElement | null
  )?.value;
  return { sport: v === "padel" ? "padel" : "tennis" };
}

function readConfigFromForm(root: HTMLElement): MatchConfig {
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

function syncFormFromConfig(root: HTMLElement, c: MatchConfig) {
  const best = root.querySelector<HTMLInputElement>(
    `input[name="bestOf"][value="${c.bestOfSets}"]`,
  );
  best?.click();
  const sel = root.querySelector<HTMLSelectElement>("select[name=games]");
  if (sel) sel.value = String(c.gamesToWinSet);
  const dec = root.querySelector<HTMLInputElement>(
    `input[name="deciding"][value="${c.decidingSetFormat}"]`,
  );
  dec?.click();
  const srv = root.querySelector<HTMLInputElement>(
    `input[name="serve"][value="${c.initialServer}"]`,
  );
  srv?.click();
  const sp = root.querySelector<HTMLInputElement>(
    `input[name="sport"][value="${c.sport}"]`,
  );
  sp?.click();
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

function wireOptionsDialogOnce() {
  if (optionsChromeWired) return;
  optionsChromeWired = true;

  optionsDlg.addEventListener("change", (ev) => {
    const t = ev.target;
    if (t instanceof HTMLInputElement && t.name === "sport") {
      optionsDlg.dataset.sport = t.value === "padel" ? "padel" : "tennis";
    }
  });

  document.querySelector("#options-save")?.addEventListener("click", () => {
    pendingConfig = readConfigFromForm(optionsDlg);
    playerNames = readPlayerNamesFromForm(optionsDlg);
    optionsDlg.close();
    if (!matchStarted) {
      engine.reset(pendingConfig);
    }
    render();
  });

  document.querySelector("#options-cancel")?.addEventListener("click", () => {
    syncFormFromConfig(optionsDlg, pendingConfig);
    syncPlayerNamesToForm(optionsDlg, playerNames);
    optionsDlg.close();
  });
}

function openOptionsDialog() {
  optionsDlg.dataset.sport = pendingConfig.sport;
  syncFormFromConfig(optionsDlg, pendingConfig);
  syncPlayerNamesToForm(optionsDlg, playerNames);
  optionsDlg.showModal();
}

function introHtml(): string {
  const serveAChecked = pendingConfig.initialServer === "a" ? "checked" : "";
  const serveBChecked = pendingConfig.initialServer === "b" ? "checked" : "";
  const sportTennisChecked =
    pendingConfig.sport !== "padel" ? "checked" : "";
  const sportPadelChecked = pendingConfig.sport === "padel" ? "checked" : "";
  const introSportData =
    pendingConfig.sport === "padel" ? "padel" : "tennis";
  return `
    <main class="shell shell-intro" data-intro-sport="${introSportData}">
      <header class="hdr hdr-intro">
        <h1 class="title">Match</h1>
        <nav class="toolbar" aria-label="Links">
          <button type="button" class="pill-link" id="btn-options-intro">Options</button>
          <span class="toolbar-sep" aria-hidden="true">·</span>
          <button type="button" class="pill-link" id="btn-rules-intro">Rules</button>
        </nav>
      </header>

      <section class="intro-form" aria-label="Players and first serve">
        <div class="intro-field-group">
          <div class="intro-field-label" id="label-intro-sport">Sport</div>
          <div
            class="seg-row seg-row-2"
            role="radiogroup"
            aria-labelledby="label-intro-sport"
          >
            <label class="seg-item">
              <input
                class="seg-input"
                type="radio"
                name="intro-sport"
                value="tennis"
                ${sportTennisChecked}
              />
              <span class="seg-text">Tennis</span>
            </label>
            <label class="seg-item">
              <input
                class="seg-input"
                type="radio"
                name="intro-sport"
                value="padel"
                ${sportPadelChecked}
              />
              <span class="seg-text">Padel</span>
            </label>
          </div>
        </div>
        <div class="intro-field-group">
          <div class="intro-field-label" id="label-intro-names">Player names</div>
          <p class="intro-doubles-hint hint-premium hint-tight">
            Padel doubles: four players — two names per team (rows below).
          </p>
          <div class="name-row" aria-labelledby="label-intro-names">
            <label class="name-field">
              <span class="name-field-hint">Team A — 1</span>
              <input
                type="text"
                id="intro-name-a1"
                class="input-premium"
                maxlength="32"
                placeholder="Player A1"
                autocomplete="off"
                value="${escapeHtml(playerNames.a1)}"
              />
            </label>
            <label class="name-field">
              <span class="name-field-hint">Team B — 1</span>
              <input
                type="text"
                id="intro-name-b1"
                class="input-premium"
                maxlength="32"
                placeholder="Player B1"
                autocomplete="off"
                value="${escapeHtml(playerNames.b1)}"
              />
            </label>
          </div>
          <div class="name-row name-row-padel-only">
            <label class="name-field">
              <span class="name-field-hint">Team A — 2</span>
              <input
                type="text"
                id="intro-name-a2"
                class="input-premium"
                maxlength="32"
                placeholder="Player A2"
                autocomplete="off"
                value="${escapeHtml(playerNames.a2)}"
              />
            </label>
            <label class="name-field">
              <span class="name-field-hint">Team B — 2</span>
              <input
                type="text"
                id="intro-name-b2"
                class="input-premium"
                maxlength="32"
                placeholder="Player B2"
                autocomplete="off"
                value="${escapeHtml(playerNames.b2)}"
              />
            </label>
          </div>
        </div>
        <div class="intro-field-group">
          <div class="intro-field-label" id="label-intro-serve">First serve</div>
          <div
            class="seg-row seg-row-2"
            role="radiogroup"
            aria-labelledby="label-intro-serve"
          >
            <label class="seg-item">
              <input
                class="seg-input"
                type="radio"
                name="intro-serve"
                value="a"
                ${serveAChecked}
              />
              <span class="seg-text">Side A</span>
            </label>
            <label class="seg-item">
              <input
                class="seg-input"
                type="radio"
                name="intro-serve"
                value="b"
                ${serveBChecked}
              />
              <span class="seg-text">Side B</span>
            </label>
          </div>
        </div>
      </section>

      <p class="lead intro-lead">
        Tap <strong>Start match</strong> to begin. Default format is best of 3,
        first to 6 games per set (tiebreak at 6–6). Use <strong>Options</strong> to
        change format or deciding set.
        <span class="intro-padel-note">
          Padel: after each game you choose who serves next; before a tiebreak you
          choose who serves first in the tiebreak.
        </span>
      </p>
      <div class="intro-actions">
        <button type="button" class="btn a intro-start" id="btn-start">Start match</button>
      </div>
    </main>
  `;
}

function boardHtml(snap: MatchSnapshot): string {
  const lines = formatStatus(snap).split("\n");
  const subtitle = formatCurrentGameOrTiebreak(snap);
  const deciding =
    snap.isDecidingSet && !snap.matchWinner
      ? `<p class="badge">Deciding set</p>`
      : "";
  const padelNeedsServe =
    snap.servePicker != null && snap.config.sport === "padel";
  const pickTitle =
    snap.servePicker === "tiebreakStart"
      ? "Who starts this tiebreak?"
      : "Who serves the next game?";
  const serveLine = padelNeedsServe
    ? `<p class="serve serve-pending">Choose the server below.</p>`
    : `<p class="serve">Serve (next point): <strong>${escapeHtml(labelForSide(snap.server))}</strong></p>`;
  const servePickBlock =
    padelNeedsServe && !snap.matchWinner
      ? `<section class="serve-pick" aria-live="polite">
          <p class="serve-pick-title">${escapeHtml(pickTitle)}</p>
          <div class="serve-pick-row">
            <button type="button" class="btn a" data-action="pick-serve" data-side="a">${escapeHtml(labelForSide("a"))}</button>
            <button type="button" class="btn b" data-action="pick-serve" data-side="b">${escapeHtml(labelForSide("b"))}</button>
          </div>
        </section>`
      : "";
  const pointDisabled = snap.matchWinner || padelNeedsServe;

  return `
    <main class="shell">
      <header class="hdr hdr-board">
        <div class="hdr-main">
          <h1 class="title">Match</h1>
          <p class="sets sets-inline">${snap.setsWon.a} — ${snap.setsWon.b}</p>
        </div>
        <nav class="toolbar" aria-label="Links">
          <button type="button" class="pill-link" id="btn-options-board">Options</button>
          <span class="toolbar-sep" aria-hidden="true">·</span>
          <button type="button" class="pill-link" id="btn-rules-board">Rules</button>
        </nav>
      </header>

      ${
        snap.config.sport === "padel"
          ? padelBoardNamesHtml()
          : `<p class="names-subhdr">${escapeHtml(labelForSide("a"))} · ${escapeHtml(labelForSide("b"))}</p>`
      }

      ${serveLine}
      ${servePickBlock}
      ${deciding}

      <section class="board" aria-live="polite">
        <p class="games">${snap.currentSet.gamesA} — ${snap.currentSet.gamesB}</p>
        <p class="detail">${subtitle}</p>
        ${
          snap.completedSets.length
            ? `<p class="history">${snap.completedSets
                .map((s) =>
                  s.matchTiebreak
                    ? `MTB ${s.gamesA}–${s.gamesB}`
                    : `${s.gamesA}–${s.gamesB}`,
                )
                .join(" · ")}</p>`
            : ""
        }
        ${
          snap.matchWinner
            ? `<p class="winner">Winner: ${escapeHtml(labelForSide(snap.matchWinner))}</p>`
            : ""
        }
      </section>

      <hr class="board-divider" />

      <section class="actions">
        <button type="button" class="btn a" data-action="a" aria-label="Award point to ${escapeHtml(labelForSide("a"))}" ${
          pointDisabled ? "disabled" : ""
        }><span class="btn-label">${escapeHtml(labelForSide("a"))}</span></button>
        <button type="button" class="btn b" data-action="b" aria-label="Award point to ${escapeHtml(labelForSide("b"))}" ${
          pointDisabled ? "disabled" : ""
        }><span class="btn-label">${escapeHtml(labelForSide("b"))}</span></button>
        <button type="button" class="btn ghost" data-action="undo">Undo</button>
        <button type="button" class="btn ghost" data-action="reset">New match</button>
      </section>

      <div class="below-actions">
        <button type="button" class="link-btn text-only" data-action="setup">← Match options</button>
      </div>

      <footer class="foot">
        <details class="cli-details">
          <summary>Score details</summary>
          <pre class="cli">${lines.join("\n")}</pre>
        </details>
      </footer>
    </main>
  `;
}

function wireRulesOpen(root: HTMLElement) {
  const open = () => rulesDlg.showModal();
  root.querySelector("#btn-rules-intro")?.addEventListener("click", open);
  root.querySelector("#btn-rules-board")?.addEventListener("click", open);
}

function wireOptionsOpen(root: HTMLElement) {
  const open = () => {
    flushIntroFormToStateIfPresent(root);
    openOptionsDialog();
  };
  root.querySelector("#btn-options-intro")?.addEventListener("click", open);
  root.querySelector("#btn-options-board")?.addEventListener("click", open);
}

function syncIntroSportDataAttr(shell: HTMLElement) {
  const v = (
    shell.querySelector(
      'input[name="intro-sport"]:checked',
    ) as HTMLInputElement | null
  )?.value;
  shell.dataset.introSport = v === "padel" ? "padel" : "tennis";
}

function revealIntroPadelDoubles(shell: HTMLElement) {
  shell
    .querySelector(".name-row-padel-only")
    ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  requestAnimationFrame(() => {
    shell.querySelector<HTMLInputElement>("#intro-name-a2")?.focus();
  });
}

function wireIntroSportData(shell: HTMLElement) {
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

function render() {
  wireOptionsDialogOnce();

  const root = document.querySelector("#app") as HTMLElement;
  if (!matchStarted) {
    root.innerHTML = introHtml();
    const introShell = root.querySelector(".shell-intro");
    if (introShell instanceof HTMLElement) wireIntroSportData(introShell);
    root.querySelector("#btn-start")?.addEventListener("click", () => {
      const shell = root.querySelector(".shell-intro") as HTMLElement;
      if (shell) {
        playerNames = readIntroPlayerNames(shell);
        pendingConfig = {
          ...pendingConfig,
          ...readIntroInitialServer(shell),
          ...readIntroSport(shell),
        };
      }
      engine.reset(pendingConfig);
      matchStarted = true;
      render();
    });
    wireRulesOpen(root);
    wireOptionsOpen(root);
    return;
  }

  const snap = getSnapshot(engine);
  root.innerHTML = boardHtml(snap);

  root.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", () => {
      const action = el.getAttribute("data-action");
      if (action === "pick-serve") {
        const side = el.getAttribute("data-side");
        if (side !== "a" && side !== "b") return;
        const r = engine.pickNextServer(side);
        if (!r.ok) alert(`Serve pick: ${r.error.code}`);
      } else if (action === "a" || action === "b") {
        const r = engine.point(action);
        if (!r.ok) alert(`Cannot add point: ${r.error.code}`);
        else toastChangeEnds(r.value.events);
      } else if (action === "undo") {
        const r = engine.undo();
        if (!r.ok) alert(`Undo: ${r.error.code}`);
      } else if (action === "reset") {
        matchStarted = false;
        engine.reset(pendingConfig);
      } else if (action === "setup") {
        openOptionsDialog();
      }
      render();
    });
  });
  wireRulesOpen(root);
  wireOptionsOpen(root);
}

render();
