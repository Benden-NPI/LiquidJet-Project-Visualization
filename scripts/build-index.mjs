#!/usr/bin/env node
// Build dist/index.html that lists every rendered SVG/PNG plus inlines markdown.
import { readdirSync, statSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join, relative, extname } from "node:path";

const root = process.cwd();
const distDir = join(root, "dist");
if (!existsSync(distDir)) {
  console.error("dist/ not found. Run `npm run export` first.");
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const images = walk(distDir)
  .filter((p) => [".svg", ".png"].includes(extname(p)))
  .map((p) => relative(distDir, p))
  .sort();

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Project Visualization Preview</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 1100px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
  h1 { border-bottom: 1px solid #8884; padding-bottom: .3rem; }
  .card { border: 1px solid #8884; border-radius: 8px; padding: 1rem; margin: 1.2rem 0; background: #fff1; }
  .card h2 { margin-top: 0; font-size: 1.05rem; }
  img, object { max-width: 100%; height: auto; background: transparent; }
  .meta { font-size: .85rem; opacity: .7; }
  nav a { display: inline-block; margin-right: .8rem; }
</style>
</head>
<body>
<h1>🧠 Project Visualization</h1>
<p class="meta">Generated at ${new Date().toISOString()} · ${images.length} diagram(s)</p>
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

const outPath = join(distDir, "index.html");
writeFileSync(outPath, html);
console.log(`Wrote ${relative(root, outPath)} (${images.length} entries).`);
