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

// 3) Render scope/control-plan.md into dist/scope/control-plan.html
//    The portal template renders the embedded markdown client-side via marked.js.
//    Markdown is embedded as a JSON string literal (JSON.stringify) so it
//    cannot break out of the <script> tag regardless of content.
const cpTemplate = join(root, "portal", "control-plan.html");
const cpMarkdown = join(root, "scope", "control-plan.md");
let controlPlanCount = 0;
if (existsSync(cpTemplate) && existsSync(cpMarkdown)) {
  const tpl = readFileSync(cpTemplate, "utf8");
  const mdRaw = readFileSync(cpMarkdown, "utf8");
  // JSON.stringify handles all special characters; additionally escape `</`
  // to `<\/` so that a literal "</script>" in the markdown cannot terminate
  // the surrounding <script> tag when the JSON literal is inlined into HTML.
  const mdJson = JSON.stringify(mdRaw).replace(/<\//g, "<\\/");
  const html = tpl
    .replaceAll("__CONTROL_PLAN_MD_JSON__", mdJson)
    .replaceAll("__BUILD_TS__", buildTs);
  const outPath = join(distDir, "scope", "control-plan.html");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
  controlPlanCount = 1;
}

console.log(
  `Wrote ${relative(root, join(distDir, "index.html"))} (portal), ` +
  `${editorCount} editor file(s), ` +
  `${controlPlanCount} control-plan page(s).`,
);
