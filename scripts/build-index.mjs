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

// 3) Render scope/control-plan.html (static 點燈 dashboard)
//    SSOT 拆兩個 JSON:
//      - scope/stations.json     (station identity, Yield Process Readiness 鏡像)
//      - scope/control-plan.json (controls + holistic, station 為 FK)
//    Build-time 做 FK 驗證；違反即 fail loud。
const cpTemplate     = join(root, "portal", "control-plan.html");
const stationsSource = join(root, "scope",  "stations.json");
const cpSource       = join(root, "scope",  "control-plan.json");
let controlPlanCount = 0;
if (existsSync(cpTemplate) && existsSync(stationsSource) && existsSync(cpSource)) {
  const stationsDoc = JSON.parse(readFileSync(stationsSource, "utf8"));
  const cpDoc       = JSON.parse(readFileSync(cpSource, "utf8"));
  const stationNames = new Set((stationsDoc.stations || []).map(s => s.name));
  const orphans = (cpDoc.controls || [])
    .filter(c => !stationNames.has(c.station))
    .map(c => `${c.id || "(no id)"} → station=${JSON.stringify(c.station)}`);
  if (orphans.length) {
    console.error("control-plan.json references unknown stations (FK violation):");
    for (const o of orphans) console.error("  -", o);
    console.error("Fix scope/control-plan.json or sync scope/stations.json from Yield.");
    process.exit(1);
  }
  // Inline as JSON string literals; escape "</" so a literal "</script>" in
  // any text field cannot terminate the surrounding <script> tag.
  const stationsJson = JSON.stringify(stationsDoc).replaceAll("</", "<\\/");
  const cpJson       = JSON.stringify(cpDoc).replaceAll("</", "<\\/");
  const tpl = readFileSync(cpTemplate, "utf8")
    .replaceAll("__STATIONS_JSON__",     stationsJson)
    .replaceAll("__CONTROL_PLAN_JSON__", cpJson)
    .replaceAll("__BUILD_TS__",          buildTs);
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
