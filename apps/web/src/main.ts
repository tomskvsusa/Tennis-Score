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
let playerNames = { a: "", b: "" };
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

function labelForSide(side: "a" | "b"): string {
  const raw = playerNames[side].trim();
  return raw || (side === "a" ? "Player A" : "Player B");
}

function readPlayerNamesFromForm(root: HTMLElement): { a: string; b: string } {
  const a = (root.querySelector("#player-name-a") as HTMLInputElement)?.value;
  const b = (root.querySelector("#player-name-b") as HTMLInputElement)?.value;
  return { a: (a ?? "").trim(), b: (b ?? "").trim() };
}

function syncPlayerNamesToForm(
  root: HTMLElement,
  names: { a: string; b: string },
) {
  const ia = root.querySelector("#player-name-a") as HTMLInputElement | null;
  const ib = root.querySelector("#player-name-b") as HTMLInputElement | null;
  if (ia) ia.value = names.a;
  if (ib) ib.value = names.b;
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
  return {
    bestOfSets: best === 1 || best === 3 || best === 5 ? best : 3,
    gamesToWinSet: games === 4 || games === 6 || games === 8 ? games : 6,
    decidingSetFormat:
      deciding === "matchTiebreak7" || deciding === "matchTiebreak10"
        ? deciding
        : "full",
    initialServer,
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
}

function wireOptionsDialogOnce() {
  if (optionsChromeWired) return;
  optionsChromeWired = true;

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
  syncFormFromConfig(optionsDlg, pendingConfig);
  syncPlayerNamesToForm(optionsDlg, playerNames);
  optionsDlg.showModal();
}

function introHtml(): string {
  return `
    <main class="shell shell-intro">
      <header class="hdr hdr-intro">
        <h1 class="title">Match</h1>
        <nav class="toolbar" aria-label="Links">
          <button type="button" class="pill-link" id="btn-options-intro">Options</button>
          <span class="toolbar-sep" aria-hidden="true">·</span>
          <button type="button" class="pill-link" id="btn-rules-intro">Rules</button>
        </nav>
      </header>
      <p class="lead intro-lead">
        Tap <strong>Start match</strong> to play. Default is best of 3, first to
        6 games per set. Use Options to customize.
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

      <p class="names-subhdr">${escapeHtml(labelForSide("a"))} · ${escapeHtml(labelForSide("b"))}</p>

      <p class="serve">Serve (next point): <strong>${escapeHtml(labelForSide(snap.server))}</strong></p>
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
          snap.matchWinner ? "disabled" : ""
        }><span class="btn-label">Point · ${escapeHtml(labelForSide("a"))}</span></button>
        <button type="button" class="btn b" data-action="b" aria-label="Award point to ${escapeHtml(labelForSide("b"))}" ${
          snap.matchWinner ? "disabled" : ""
        }><span class="btn-label">Point · ${escapeHtml(labelForSide("b"))}</span></button>
        <button type="button" class="btn ghost" data-action="undo">Undo</button>
        <button type="button" class="btn ghost" data-action="reset">New match</button>
      </section>

      <div class="below-actions">
        <button type="button" class="link-btn text-only" data-action="setup">← Change format</button>
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
  const open = () => openOptionsDialog();
  root.querySelector("#btn-options-intro")?.addEventListener("click", open);
  root.querySelector("#btn-options-board")?.addEventListener("click", open);
}

function render() {
  wireOptionsDialogOnce();

  const root = document.querySelector("#app") as HTMLElement;
  if (!matchStarted) {
    root.innerHTML = introHtml();
    root.querySelector("#btn-start")?.addEventListener("click", () => {
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
      if (action === "a" || action === "b") {
        const r = engine.point(action);
        if (!r.ok) alert(`Cannot add point: ${r.error.code}`);
        else toastChangeEnds(r.value.events);
      } else if (action === "undo") {
        const r = engine.undo();
        if (!r.ok) alert(`Undo: ${r.error.code}`);
      } else if (action === "reset") {
        engine.reset(pendingConfig);
      } else if (action === "setup") {
        matchStarted = false;
        engine.reset(pendingConfig);
      }
      render();
    });
  });
  wireRulesOpen(root);
  wireOptionsOpen(root);
}

render();
