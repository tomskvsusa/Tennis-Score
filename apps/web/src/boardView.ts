import {
  formatCurrentGameOrTiebreak,
  formatStatus,
  showFourPlayerNames,
  type MatchSnapshot,
} from "@brainstorm/core";
import { escapeHtml } from "./escapeHtml.js";
import { doublesBoardNamesHtml, labelForSide } from "./names.js";

export function boardHtml(snap: MatchSnapshot): string {
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
        showFourPlayerNames(snap.config)
          ? doublesBoardNamesHtml()
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
