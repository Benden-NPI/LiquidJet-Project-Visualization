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
//    SSOT 只有一個 JSON：scope/control-plan.json (controls + holistic)。
//    Station 清單沒有 build-time SSOT — 與 Yield · Process Readiness 對齊，
//    執行時由 Power Automate 從 SharePoint Control_Plan.xlsx 直接抓，
//    存在瀏覽器 localStorage。詳見 portal/control-plan.html Settings 抽屜。
const cpTemplate     = join(root, "portal", "control-plan.html");
const cpSource       = join(root, "scope",  "control-plan.json");
let controlPlanCount = 0;
if (existsSync(cpTemplate) && existsSync(cpSource)) {
  const cpDoc = JSON.parse(readFileSync(cpSource, "utf8"));
  // Inline as JSON string literal; escape "</" so a literal "</script>" in
  // any text field cannot terminate the surrounding <script> tag.
  const cpJson = JSON.stringify(cpDoc).replaceAll("</", "<\\/");
  const tpl = readFileSync(cpTemplate, "utf8")
    .replaceAll("__CONTROL_PLAN_JSON__", cpJson)
    .replaceAll("__BUILD_TS__",          buildTs);
  const outPath = join(distDir, "scope", "control-plan.html");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, tpl);
  // Also publish the raw SSOT JSON next to the HTML so the page can poll
  // for "has my just-committed change reached this Pages deploy yet?" by
  // fetching ./control-plan.json. Keep the on-disk format byte-identical
  // to source so external consumers see a stable file.
  const cpRaw = readFileSync(cpSource, "utf8");
  writeFileSync(join(distDir, "scope", "control-plan.json"), cpRaw);
  controlPlanCount = 1;
}

// 4) Copy portal/ai-debate.html → dist/ai-debate.html (static, no substitutions)
const debateSrc  = join(root, "portal", "ai-debate.html");
let debateCount  = 0;
if (existsSync(debateSrc)) {
  writeFileSync(join(distDir, "ai-debate.html"), readFileSync(debateSrc, "utf8"));
  debateCount = 1;
}

console.log(
  `Wrote ${relative(root, join(distDir, "index.html"))} (portal), ` +
  `${editorCount} editor file(s), ` +
  `${controlPlanCount} control-plan page(s), ` +
  `${debateCount} ai-debate page(s).`,
);
