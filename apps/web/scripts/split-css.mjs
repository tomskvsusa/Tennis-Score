import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundlePath =
  process.argv[2] ?? path.join(__dirname, "style-bundle-full.css");
const outDir = path.join(__dirname, "../src/styles");

const lines = fs.readFileSync(bundlePath, "utf8").split(/\r?\n/);
let depth = 0;
let chunk = [];
let n = 0;
const chunks = [];

function flush() {
  if (chunk.length) {
    chunks.push(chunk.join("\n"));
    chunk = [];
    n = 0;
  }
}

for (const line of lines) {
  chunk.push(line);
  for (const ch of line) {
    if (ch === "{") depth++;
    if (ch === "}") depth--;
  }
  n++;
  if (depth === 0 && n >= 155 && chunks.length < 5) flush();
}
flush();

const fixed = [];
for (const c of chunks) {
  const lineCount = c.split("\n").length;
  if (lineCount <= 200) {
    fixed.push(c);
    continue;
  }
  const subLines = c.split(/\r?\n/);
  let d2 = 0;
  let buf = [];
  let bufN = 0;
  const parts = [];
  for (const line of subLines) {
    buf.push(line);
    for (const ch of line) {
      if (ch === "{") d2++;
      if (ch === "}") d2--;
    }
    bufN++;
    if (d2 === 0 && bufN >= 130 && parts.length === 0) {
      parts.push(buf.join("\n"));
      buf = [];
      bufN = 0;
    }
  }
  if (buf.length) parts.push(buf.join("\n"));
  fixed.push(...parts);
}

fixed.forEach((c, i) => {
  fs.writeFileSync(path.join(outDir, `split-${i + 1}.css`), c);
});
console.log(fixed.map((c) => c.split("\n").length));
