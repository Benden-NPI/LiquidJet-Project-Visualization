#!/usr/bin/env node
// Serve the built dist/ folder as a static site for local preview.
// Usage: npm run preview  (builds first, then opens http://localhost:4173)
import { createServer } from "node:http";
import { readFile, access } from "node:fs/promises";
import { join, extname, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");
const PORT = Number(process.env.PORT ?? 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".mjs":  "text/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".ico":  "image/x-icon",
};

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let rel = url.pathname.replace(/^\/+/, "") || "index.html";
    let filePath = join(DIST, rel);

    // Safety check
    if (!filePath.startsWith(DIST)) {
      res.writeHead(403); res.end("Forbidden"); return;
    }

    // Directory → try index.html inside
    if (await exists(filePath)) {
      const stat = (await import("node:fs/promises")).stat;
      if ((await stat(filePath)).isDirectory()) {
        filePath = join(filePath, "index.html");
      }
    } else {
      // Fallback to root index.html (SPA-style)
      filePath = join(DIST, "index.html");
    }

    if (!(await exists(filePath))) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("Not found");
      return;
    }

    const buf = await readFile(filePath);
    res.writeHead(200, { "content-type": MIME[extname(filePath)] ?? "application/octet-stream" });
    res.end(buf);
  } catch (err) {
    console.error(err);
    res.writeHead(500); res.end(String(err.message ?? err));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Preview → http://localhost:${PORT}`);
  console.log(`   serving: dist/`);
});
