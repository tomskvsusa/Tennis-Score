# Brainstorm — score counter

Monorepo: shared tennis/padel match logic (`@brainstorm/core`), Vite web UI, Node CLI.

## Commands

- `npm test` — run unit tests (core)
- `npm run dev:web` — Vite dev server for the web UI
- `npm run cli` — build core + CLI, then start interactive REPL (`help`, `point a|b`, `undo`, `status`, `reset`, `quit`)
- `npm run build` — build all packages that define a `build` script

## Layout

- `packages/core` — match engine, snapshot, formatting
- `apps/web` — browser UI
- `apps/cli` — readline CLI

See `docs/superpowers/specs/2026-04-29-score-counter-design.md` for rules and scope.
