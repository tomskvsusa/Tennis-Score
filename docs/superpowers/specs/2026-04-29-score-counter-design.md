# Design: Tennis/Padel score counter (web + CLI)

**Date:** 2026-04-29  
**Status:** Draft for implementation planning

## Summary

A small learning project: a **shared TypeScript core** that implements full-match scoring (tennis/padel style), consumed by a **browser UI** (Vite + TypeScript) and a **local CLI**. No Telegram bot, no backend persistence in v1.

## Goals

- One codebase for **match state** used by both interfaces.
- **Readable** score display suitable for padel/tennis conventions.
- **CLI** for fast iteration, scripting, and debugging core logic.
- **Unit tests** on the core only.

## Non-goals (v1)

- Bots, accounts, cloud sync, databases.
- Rally physics, serve statistics, wearable integration.
- Exact ITF edge cases for tiebreak serving order (explicitly simplified).

## Domain rules (v1)

### Participants

- Two sides: **A** and **B** (labels configurable later; default fixed strings).

### Point → game

- Game points progress: `0 → 15 → 30 → 40`.
- At **40–40**: **deuce**. Next point yields **advantage** for that side; if the trailing side wins the next point, back to **deuce**; advantage side winning the next point wins the **game**.
- Winning a game increments that side’s **games** in the **current set**.

### Set → match

- **Set:** first to **6 games**, **win by 2** games (e.g. 6–4, 7–5).
- At **6–6** in a set: play a **tiebreak** for that set (see below).
- **Match:** **best of 3 sets** — first side to win **2 sets** wins the match.

### Tiebreak (set-deciding at 6–6)

- First to **7 points**, **win by 2** points (e.g. 7–5, 8–6).
- **Serving order inside the tiebreak is simplified** in v1: no requirement to model alternating serve every two points; implementation may alternate point awards only (score correctness), or use a minimal deterministic rule documented in code comments. Product requirement is **correct point totals and winner**, not umpire-grade serve rotation.

### Terminal states

- When the match is won, core rejects further `point` actions until `reset` or `new_match` (exact API TBD in implementation plan).

### Undo

- **Undo** restores the previous match snapshot.
- Empty undo (nothing to undo) returns a clear error; state unchanged.
- Stack depth: sufficient for a full amateur session (e.g. **≥ 100** steps) or unbounded until memory limits; implementation chooses a safe default with documented limit.

## Architecture

### Packages / apps

| Layer    | Responsibility |
|----------|----------------|
| `core`   | Pure TypeScript: state machine, transitions, undo stack, serializable snapshot for UI/CLI. No DOM; no Node-only APIs in core if compatibility with browser bundling is desired (prefer isomorphic TS). |
| `web`    | Vite + TS: large typography for score, buttons for point A/B, Undo, Reset/New match as needed. Reads snapshot from `core`; sends commands only through core API. |
| `cli`    | Node: subcommands or REPL — `point a|b`, `undo`, `status`, `reset`. Uses same `core` package. |

### Data flow

1. User action (click, key, CLI string) → **command** to `core`.
2. `core` validates (e.g. match not over unless rule allows) → **new state** or **error**.
3. `web` re-renders; `cli` prints formatted score lines.

### Snapshot shape (conceptual)

- Expose enough data to render: current match summary, per-set scores, current game points (including deuce/advantage), tiebreak flag and tiebreak points if active, winner if any.

## Error handling

- Invalid operations (e.g. point after match complete, undo when empty) — **typed errors or Result** from core; adapters display messages without mutating state.

## Testing strategy

- **Unit tests** in `core`: scenarios including — deuce/adv game; set to 6–4; set to 7–5 after 6–6 tiebreak; match ending 2–0 sets; undo after a sequence; reset.

## Tech defaults

- **Monorepo** with workspaces (pnpm or npm): `@brainstorm/core`, `@brainstorm/web`, `@brainstorm/cli` (names can be adjusted when scaffolding).
- **Vite** for the web app; **TypeScript** strictness per repo default (prefer `strict: true` for new code).

## Open points for implementation plan (not blockers)

- Exact package names and workspace tool.
- Whether `cli` uses a minimal argument parser dependency or manual `process.argv`.
- Styling: vanilla CSS vs. small CSS framework (keep minimal).

## Approval

This document reflects agreed scope: **full match (best of 3)**, **web + CLI**, **no bot**, **counter-focused** domain with simplified tiebreak serving details.
