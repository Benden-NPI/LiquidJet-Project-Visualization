#!/usr/bin/env node
// Build the LiquidJet Pages output:
//   dist/index.html             ← portal (top-level project hub)
//   dist/visualization/         ← rendered SVG/PNG + visualization index
//   dist/visualization/index.html
//   dist/editor/                ← interactive canvas editor (copied from editor/)
import {
  readdirSync, statSync, writeFileSync, existsSync, readFileSync,
  mkdirSync, copyFileSync,
} from "node:fs";
import { join, relative, extname, dirname } from "node:path";

const root = process.cwd();
const distDir = join(root, "dist");
const vizDir = join(distDir, "visualization");

if (!existsSync(distDir)) {
  console.error("dist/ not found. Run `npm run export` first.");
  process.exit(1);
}
mkdirSync(vizDir, { recursive: true });

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

// 3) Build the visualization index, listing every rendered SVG/PNG under dist/visualization/
const images = walk(vizDir)
  .filter((p) => [".svg", ".png"].includes(extname(p)))
  .map((p) => relative(vizDir, p))
  .sort();

const vizHtml = `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8" />
<title>LiquidJet · Project Visualization</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  :root { color-scheme: light dark; }
  body { font-family: -apple-system, Segoe UI, Roboto, "PingFang TC", "Noto Sans TC", sans-serif;
    max-width: 1100px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
  h1 { border-bottom: 1px solid #8884; padding-bottom: .3rem; margin-bottom: .2rem; }
  .crumbs { font-size: .9rem; opacity: .75; margin-bottom: 1rem; }
  .crumbs a { color: inherit; }
  .card { border: 1px solid #8884; border-radius: 8px; padding: 1rem; margin: 1.2rem 0; background: #fff1; }
  .card h2 { margin-top: 0; font-size: 1.05rem; }
  img, object { max-width: 100%; height: auto; background: transparent; }
  .meta { font-size: .85rem; opacity: .7; }
  nav a { display: inline-block; margin-right: .8rem; }
  .cta { display:inline-block; padding:.5rem .9rem; border-radius:6px; background:#4f8cff; color:#fff; text-decoration:none; font-weight:600; margin-right:.5rem; }
  .cta:hover { filter: brightness(1.1); }
  .cta.ghost { background:transparent; color:inherit; border:1px solid #8886; }
</style>
</head>
<body>
<div class="crumbs"><a href="../">← LiquidJet Portal</a></div>
<h1>🧠 Project Visualization</h1>
<p class="meta">Generated at ${buildTs} · ${images.length} diagram(s)</p>
<p>
  <a class="cta" href="../editor/">🎨 開啟互動編輯器</a>
  <a class="cta ghost" href="https://github.com/Benden-NPI/LiquidJet-Project-Visualization" target="_blank" rel="noopener">GitHub ↗</a>
</p>
<nav>
  ${images.map((p) => `<a href="#${encodeURIComponent(p)}">${p.replace(/\.[^.]+$/, "")}</a>`).join("")}
</nav>
${images
  .map(
    (p) => `
<section class="card" id="${encodeURIComponent(p)}">
  <h2>${p}</h2>
  ${p.endsWith(".svg")
    ? `<object type="image/svg+xml" data="${encodeURI(p)}"></object>`
    : `<img alt="${p}" src="${encodeURI(p)}" />`}
</section>`,
  )
  .join("\n")}
</body>
</html>
`;

const vizOut = join(vizDir, "index.html");
writeFileSync(vizOut, vizHtml);

console.log(
  `Wrote ${relative(root, join(distDir, "index.html"))} (portal), ` +
  `${relative(root, vizOut)} (${images.length} diagrams), ` +
  `${editorCount} editor file(s).`,
);
