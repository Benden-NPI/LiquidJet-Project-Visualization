#!/usr/bin/env node
// Build the LiquidJet Pages output:
//   dist/index.html   ← portal (top-level project hub)
//   dist/editor/      ← interactive canvas editor (copied from editor/)
import {
  readdirSync, statSync, writeFileSync, existsSync, readFileSync,
  mkdirSync, copyFileSync,
} from "node:fs";
import { join, relative, dirname } from "node:path";

const root = process.cwd();
const distDir = join(root, "dist");
mkdirSync(distDir, { recursive: true });

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function copyDir(src, dst) {
  if (!existsSync(src)) return 0;
  let n = 0;
  for (const p of walk(src)) {
    const rel = relative(src, p);
    const target = join(dst, rel);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(p, target);
    n++;
  }
  return n;
}

// 1) Copy the static canvas editor into dist/editor/
const editorCount = copyDir(join(root, "editor"), join(distDir, "editor"));

// 2) Copy the portal into dist/index.html (with build timestamp injected)
const portalSrc = join(root, "portal", "index.html");
if (!existsSync(portalSrc)) {
  console.error("portal/index.html not found.");
  process.exit(1);
}
const buildTs = new Date().toISOString();
const portalHtml = readFileSync(portalSrc, "utf8").replaceAll("__BUILD_TS__", buildTs);
writeFileSync(join(distDir, "index.html"), portalHtml);

// 3) Render scope/control-plan.html (static 點燈 dashboard, no markdown injection)
//    The page is fully self-contained; we just stamp the build timestamp.
const cpTemplate = join(root, "portal", "control-plan.html");
let controlPlanCount = 0;
if (existsSync(cpTemplate)) {
  const tpl = readFileSync(cpTemplate, "utf8").replaceAll("__BUILD_TS__", buildTs);
  const outPath = join(distDir, "scope", "control-plan.html");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, tpl);
  controlPlanCount = 1;
}

console.log(
  `Wrote ${relative(root, join(distDir, "index.html"))} (portal), ` +
  `${editorCount} editor file(s), ` +
  `${controlPlanCount} control-plan page(s).`,
);
