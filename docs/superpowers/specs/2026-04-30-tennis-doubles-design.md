# Design: Tennis doubles (four names) via checkbox

**Date:** 2026-04-30  
**Status:** Draft — ready for product review before implementation  
**Depends on:** `2026-04-29-score-counter-design.md` (core + web scope)

## Summary

When the user selects **Tennis** (court tennis, not a new sport), add an optional **Doubles** control (checkbox). If enabled, the setup UI shows **four name fields** in the same layout as Padel: first row **Team A — 1** and **Team B — 1**, second row **Team A — 2** and **Team B — 2**. Scoring logic stays **two sides A/B**; extra names are for display and clarity only. **Padel** remains unchanged: always four names, no doubles checkbox.

## Goals

- Support **tennis doubles naming** without introducing a third sport type.
- Keep **one visual pattern** for “four players — two per side” (same grid as Padel).
- Persist the choice in **`MatchConfig`** so intro, **Options** dialog, and **match board** stay consistent after reload/session.

## Non-goals

- Different doubles rules for tennis (e.g. tiebreak rotation): scoring engine unchanged.
- Mixed doubles labels beyond generic Team A/B player slots.
- Table tennis as a separate `sport` enum value.

## User-visible behavior

### Intro screen

1. **Sport** segmented control: Tennis | Padel (unchanged).
2. When **Tennis** is selected:
   - Show a **checkbox** (or equivalent accessible toggle): label **“Doubles”** / **«Парная игра»** (product copy can follow existing English-first UI with optional RU later).
   - **Unchecked:** show only the first name row (A1, B1), same as today’s tennis singles.
   - **Checked:** show the second name row (A2, B2) using the **same** column order as row one: A left, B right.
3. When **Padel** is selected:
   - Hide the doubles checkbox (doubles is implicit).
   - Always show four fields (current Padel behavior).

### Options dialog

- Mirror intro: when **sport** radio is **Tennis**, show **Doubles** checkbox; sync value with `MatchConfig.tennisDoubles`.
- When **sport** is **Padel**, hide checkbox and ignore stored `tennisDoubles` for visibility (four names always shown).

### Match board

- If **`sport === "padel"`** OR **`sport === "tennis"` && `tennisDoubles`**: show **two names per side** on the board header (existing pattern for Padel: pair lines or joined labels — reuse same formatting path).
- Else (tennis singles): keep current single-name-per-side display.

## Data model

### `MatchConfig` (core)

Add:

```ts
tennisDoubles: boolean; // default false; meaningful only when sport === "tennis"
```

Rules:

- Default **`false`** for `defaultMatchConfig`.
- When **`sport === "padel"`**, UI never exposes the checkbox; board always uses four-name display. The stored `tennisDoubles` value may remain in object but **must not affect** Padel UX (recommended: when saving Options with Padel selected, leave `tennisDoubles` unchanged or normalize in UI-only layer — implementation plan chooses one consistent rule and documents it).

### Session / forms

- Intro and Options read/write `tennisDoubles` alongside existing fields.
- Starting a match copies config + names into engine reset as today.

## Presentation / CSS

- Replace “second row visible only for Padel” with a rule equivalent to:
  - **Show second row** when `sport === "padel"` OR (`sport === "tennis"` AND doubles checked).
- Prefer a **single attribute** on the intro shell (e.g. `data-intro-four-names="true"`) or renamed class (e.g. `name-row-doubles`) so selectors are not misleading (`padel-only`). Options dialog already uses `#options[data-sport]`; extend with attribute or class for **four-name row** visibility when Tennis + doubles.

## Copy

- Replace Padel-only doubles hint with **context-aware** short hint when four rows are visible:
  - Tennis + doubles: e.g. “Doubles: two players per team.”
  - Padel: keep or shorten existing padel-specific note where still relevant (serve pick reminders stay elsewhere).

## Accessibility

- Checkbox associated with visible label; toggling updates visibility of second row without trapping focus.
- No reliance on hover-only affordances.

## Testing

- **Core:** extend or add tests only if serialization/defaults change behavior consumers rely on; pure UI flag may need minimal test if exported in snapshot — optional.
- **Web (manual or e2e later):** Tennis + doubles toggles second row; Padel always four fields; board shows two names per side for tennis doubles.

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Stale CSS `[data-intro-sport]` vs doubles | Use explicit **four-name** attribute or class as above. |
| Options vs intro desync | Single source `pendingConfig`; re-render on Save. |
| CLI ignores `tennisDoubles` | Acceptable for v1 unless CLI prints names; document gap or add one line in status if trivial. |

## Implementation sequencing (for planning doc)

1. Core: `MatchConfig` + `defaultMatchConfig` + `readConfigFromForm` / sync paths in web Options.
2. Web intro: checkbox + visibility wiring + `data-*` / CSS.
3. Web board: extend name formatting conditional.
4. Options dialog HTML: checkbox block for tennis only.
5. Copy + CSS rename cleanup.
