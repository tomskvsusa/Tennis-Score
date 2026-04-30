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

let engine = new MatchEngine(defaultMatchConfig);
let matchStarted = false;

const toastEl = document.querySelector("#toast") as HTMLElement;
const rulesDlg = document.querySelector("#rules") as HTMLDialogElement;

let toastTimer: ReturnType<typeof setTimeout> | null = null;

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
      showToast("Смена сторон: после нечётного гейма в сете.");
    } else if (ev.reason === "set_break") {
      showToast("Перерыв между сетами — смена сторон (ориентир до 90 с).");
    } else if (ev.reason === "tiebreak_start") {
      showToast("Смена сторон: начало тай-брейка.");
    }
  }
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

function setupHtml(cfg: MatchConfig): string {
  return `
    <main class="shell setup">
      <header class="hdr">
        <h1 class="title">Настройка матча</h1>
      </header>
      <p class="lead">Выберите формат и нажмите «Начать матч».</p>

      <fieldset class="field">
        <legend>Матч</legend>
        <label><input type="radio" name="bestOf" value="1" ${
          cfg.bestOfSets === 1 ? "checked" : ""
        } /> До 1 сета</label>
        <label><input type="radio" name="bestOf" value="3" ${
          cfg.bestOfSets === 3 ? "checked" : ""
        } /> Best of 3</label>
        <label><input type="radio" name="bestOf" value="5" ${
          cfg.bestOfSets === 5 ? "checked" : ""
        } /> Best of 5</label>
      </fieldset>

      <fieldset class="field">
        <legend>Сет до</legend>
        <select name="games" class="select">
          <option value="4" ${cfg.gamesToWinSet === 4 ? "selected" : ""}>4 геймов (тай-брейк при 4:4)</option>
          <option value="6" ${cfg.gamesToWinSet === 6 ? "selected" : ""}>6 геймов (тай-брейк при 6:6)</option>
          <option value="8" ${cfg.gamesToWinSet === 8 ? "selected" : ""}>8 геймов (тай-брейк при 8:8)</option>
        </select>
      </fieldset>

      <fieldset class="field">
        <legend>Решающий сет</legend>
        <label><input type="radio" name="deciding" value="full" ${
          cfg.decidingSetFormat === "full" ? "checked" : ""
        } /> Обычный сет</label>
        <label><input type="radio" name="deciding" value="matchTiebreak7" ${
          cfg.decidingSetFormat === "matchTiebreak7" ? "checked" : ""
        } /> Матч-тайбрейк до 7</label>
        <label><input type="radio" name="deciding" value="matchTiebreak10" ${
          cfg.decidingSetFormat === "matchTiebreak10" ? "checked" : ""
        } /> Матч-тайбрейк до 10</label>
        <p class="hint">Для матча до 1 сета с матч-тайбрейком начнётся сразу тайбрейк.</p>
      </fieldset>

      <fieldset class="field">
        <legend>Первый подающий</legend>
        <label><input type="radio" name="serve" value="a" ${
          cfg.initialServer === "a" ? "checked" : ""
        } /> Игрок A</label>
        <label><input type="radio" name="serve" value="b" ${
          cfg.initialServer === "b" ? "checked" : ""
        } /> Игрок B</label>
      </fieldset>

      <div class="setup-actions">
        <button type="button" class="btn a" id="btn-start">Начать матч</button>
        <button type="button" class="btn ghost" id="btn-rules-open">Правила и тайминги</button>
      </div>
    </main>
  `;
}

function boardHtml(snap: MatchSnapshot): string {
  const lines = formatStatus(snap).split("\n");
  const subtitle = formatCurrentGameOrTiebreak(snap);
  const deciding =
    snap.isDecidingSet && !snap.matchWinner
      ? `<p class="badge">Решающий сет</p>`
      : "";

  return `
    <main class="shell">
      <header class="hdr">
        <div>
          <h1 class="title">Матч</h1>
          <p class="meta">Bo${snap.config.bestOfSets} · сет до ${snap.config.gamesToWinSet} · ${snap.config.decidingSetFormat}</p>
        </div>
        <p class="sets">${snap.setsWon.a} — ${snap.setsWon.b}</p>
      </header>

      <p class="serve">Подача (следующий розыгрыш): <strong>${snap.server.toUpperCase()}</strong></p>
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
            ? `<p class="winner">Матч: ${snap.matchWinner.toUpperCase()}</p>`
            : ""
        }
      </section>

      <section class="actions">
        <button type="button" class="btn a" data-action="a" ${
          snap.matchWinner ? "disabled" : ""
        }>Очко A</button>
        <button type="button" class="btn b" data-action="b" ${
          snap.matchWinner ? "disabled" : ""
        }>Очко B</button>
        <button type="button" class="btn ghost" data-action="undo">Отмена</button>
        <button type="button" class="btn ghost" data-action="reset">Новый матч (тот же формат)</button>
      </section>

      <div class="below-actions">
        <button type="button" class="btn ghost slim" data-action="setup">Настройки</button>
        <button type="button" class="btn ghost slim" id="btn-rules-open-board">Правила и тайминги</button>
      </div>

      <footer class="foot">
        <pre class="cli">${lines.join("\n")}</pre>
      </footer>
    </main>
  `;
}

function wireRulesOpen(root: HTMLElement) {
  const open = () => rulesDlg.showModal();
  root.querySelector("#btn-rules-open")?.addEventListener("click", open);
  root
    .querySelector("#btn-rules-open-board")
    ?.addEventListener("click", open);
}

function render() {
  const root = document.querySelector("#app") as HTMLElement;
  if (!matchStarted) {
    const cfg = engine.getConfig() as MatchConfig;
    root.innerHTML = setupHtml(cfg);
    syncFormFromConfig(root, cfg);
    root.querySelector("#btn-start")?.addEventListener("click", () => {
      const c = readConfigFromForm(root);
      engine.reset(c);
      matchStarted = true;
      render();
    });
    wireRulesOpen(root);
    return;
  }

  const snap = getSnapshot(engine);
  root.innerHTML = boardHtml(snap);

  root.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", () => {
      const action = el.getAttribute("data-action");
      if (action === "a" || action === "b") {
        const r = engine.point(action);
        if (!r.ok) alert(`Нельзя добавить очко: ${r.error.code}`);
        else toastChangeEnds(r.value.events);
      } else if (action === "undo") {
        const r = engine.undo();
        if (!r.ok) alert(`Отмена: ${r.error.code}`);
      } else if (action === "reset") {
        engine.reset(engine.getConfig() as MatchConfig);
      } else if (action === "setup") {
        matchStarted = false;
      }
      render();
    });
  });
  wireRulesOpen(root);
}

render();
