import { escapeHtml } from "./escapeHtml.js";
import { session } from "./session.js";

export function introHtml(): string {
  const c = session.pendingConfig;
  const names = session.playerNames;
  const serveAChecked = c.initialServer === "a" ? "checked" : "";
  const serveBChecked = c.initialServer === "b" ? "checked" : "";
  const sportTennisChecked = c.sport !== "padel" ? "checked" : "";
  const sportPadelChecked = c.sport === "padel" ? "checked" : "";
  const introSportData = c.sport === "padel" ? "padel" : "tennis";
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
                value="${escapeHtml(names.a1)}"
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
                value="${escapeHtml(names.b1)}"
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
                value="${escapeHtml(names.a2)}"
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
                value="${escapeHtml(names.b2)}"
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
