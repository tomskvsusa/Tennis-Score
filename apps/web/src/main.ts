import {
  MatchEngine,
  formatCurrentGameOrTiebreak,
  formatStatus,
  getSnapshot,
  type MatchSnapshot,
} from "@brainstorm/core";
import "./style.css";

const engine = new MatchEngine();

function render(root: HTMLElement, snap: MatchSnapshot) {
  const lines = formatStatus(snap).split("\n");
  const subtitle = formatCurrentGameOrTiebreak(snap);

  root.innerHTML = `
    <main class="shell">
      <header class="hdr">
        <h1 class="title">Match</h1>
        <p class="sets">${snap.setsWon.a} — ${snap.setsWon.b}</p>
      </header>

      <section class="board" aria-live="polite">
        <p class="games">${snap.currentSet.gamesA} — ${snap.currentSet.gamesB}</p>
        <p class="detail">${subtitle}</p>
        ${
          snap.completedSets.length
            ? `<p class="history">${snap.completedSets
                .map((s) => `${s.gamesA}–${s.gamesB}`)
                .join(" · ")}</p>`
            : ""
        }
        ${
          snap.matchWinner
            ? `<p class="winner">Match: ${snap.matchWinner.toUpperCase()}</p>`
            : ""
        }
      </section>

      <section class="actions">
        <button type="button" class="btn a" data-action="a" ${
          snap.matchWinner ? "disabled" : ""
        }>Point A</button>
        <button type="button" class="btn b" data-action="b" ${
          snap.matchWinner ? "disabled" : ""
        }>Point B</button>
        <button type="button" class="btn ghost" data-action="undo">Undo</button>
        <button type="button" class="btn ghost" data-action="reset">Reset</button>
      </section>

      <footer class="foot">
        <pre class="cli">${lines.join("\n")}</pre>
      </footer>
    </main>
  `;

  root.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", () => {
      const action = el.getAttribute("data-action");
      if (action === "a" || action === "b") {
        const r = engine.point(action);
        if (!r.ok) alert(`Cannot add point: ${r.error.code}`);
      } else if (action === "undo") {
        const r = engine.undo();
        if (!r.ok) alert(`Undo: ${r.error.code}`);
      } else if (action === "reset") {
        engine.reset();
      }
      render(root, getSnapshot(engine));
    });
  });
}

const app = document.querySelector<HTMLElement>("#app");
if (app) render(app, getSnapshot(engine));
