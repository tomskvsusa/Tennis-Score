import * as readline from "node:readline";
import {
  MatchEngine,
  formatStatus,
  getSnapshot,
  type Side,
} from "@brainstorm/core";

const engine = new MatchEngine();

function printStatus() {
  console.log(formatStatus(getSnapshot(engine)));
  console.log("");
}

function parsePoint(arg: string): Side | null {
  const x = arg.trim().toLowerCase();
  if (x === "a" || x === "b") return x;
  return null;
}

function handleLine(line: string): boolean {
  const parts = line.trim().split(/\s+/).filter(Boolean);
  const cmd = parts[0]?.toLowerCase();

  if (!cmd || cmd === "quit" || cmd === "exit" || cmd === "q") {
    return false;
  }

  if (cmd === "help" || cmd === "?") {
    console.log(`Commands:
  point a|b  — award point to side
  pick a|b   — padel: confirm who serves next (when status asks for serve pick)
  undo       — undo last point
  status     — show score
  reset      — new match
  quit       — exit
`);
    return true;
  }

  if (cmd === "status" || cmd === "s") {
    printStatus();
    return true;
  }

  if (cmd === "reset") {
    engine.reset();
    printStatus();
    return true;
  }

  if (cmd === "undo" || cmd === "u") {
    const r = engine.undo();
    if (!r.ok) console.error(r.error.code);
    else printStatus();
    return true;
  }

  if (cmd === "pick") {
    const side = parsePoint(parts[1] ?? "");
    if (!side) {
      console.error("Usage: pick a|b");
      return true;
    }
    const r = engine.pickNextServer(side);
    if (!r.ok) console.error(r.error.code);
    else printStatus();
    return true;
  }

  if (cmd === "point" || cmd === "p") {
    const side = parsePoint(parts[1] ?? "");
    if (!side) {
      console.error("Usage: point a|b");
      return true;
    }
    const r = engine.point(side);
    if (!r.ok) console.error(r.error.code);
    else {
      if (r.value.events.length) {
        console.log(
          "Events:",
          r.value.events.map((e) => `${e.type}:${e.reason}`).join(", "),
        );
      }
      printStatus();
    }
    return true;
  }

  const side = parsePoint(cmd);
  if (side) {
    const r = engine.point(side);
    if (!r.ok) console.error(r.error.code);
    else {
      if (r.value.events.length) {
        console.log(
          "Events:",
          r.value.events.map((e) => `${e.type}:${e.reason}`).join(", "),
        );
      }
      printStatus();
    }
    return true;
  }

  console.error("Unknown command. Type help.");
  return true;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "score> ",
});

console.log("Tennis/padel match counter. Type help for commands.\n");
printStatus();

rl.prompt();

rl.on("line", (line) => {
  const keep = handleLine(line);
  if (!keep) {
    rl.close();
    return;
  }
  rl.prompt();
});

rl.on("close", () => {
  process.exit(0);
});
