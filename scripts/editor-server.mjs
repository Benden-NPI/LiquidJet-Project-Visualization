#!/usr/bin/env node
// Tiny local editor server for mindmaps/*.mmd
// GET  /              -> editor SPA (editor/index.html)
// GET  /api/files     -> list of .mmd files
// GET  /api/file?path -> raw file content
// POST /api/file      -> { path, content }  saves file
//
// Usage: npm run edit  (then open http://localhost:5173)
import { createServer } from "node:http";
import { readFile, writeFile, readdir, stat, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, relative, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MINDMAPS = join(ROOT, "mindmaps");
const EDITOR_DIR = join(ROOT, "editor");
const PORT = Number(process.env.PORT ?? 5173);

function safePath(p) {
  const abs = resolve(MINDMAPS, p);
  if (!abs.startsWith(MINDMAPS + "/") && abs !== MINDMAPS) {
    throw new Error("Path escapes mindmaps/");
  }
  return abs;
}

async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) out.push(...(await walk(p)));
    else if (extname(p) === ".mmd") out.push(relative(MINDMAPS, p));
  }
  return out.sort();
}

function json(res, code, body) {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf-8");
  return raw ? JSON.parse(raw) : {};
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    // --- API ---
    if (path === "/api/files" && req.method === "GET") {
      if (!existsSync(MINDMAPS)) await mkdir(MINDMAPS, { recursive: true });
      return json(res, 200, { files: await walk(MINDMAPS) });
    }

    if (path === "/api/file" && req.method === "GET") {
      const rel = url.searchParams.get("path") ?? "";
      const abs = safePath(rel);
      const content = await readFile(abs, "utf-8");
      return json(res, 200, { path: rel, content });
    }

    if (path === "/api/file" && req.method === "POST") {
      const { path: rel, content } = await readBody(req);
      if (!rel || typeof content !== "string") return json(res, 400, { error: "path & content required" });
      const abs = safePath(rel);
      await mkdir(dirname(abs), { recursive: true });
      await writeFile(abs, content, "utf-8");
      return json(res, 200, { ok: true, path: rel, bytes: Buffer.byteLength(content) });
    }

    // --- Static (editor SPA) ---
    let filePath;
    if (path === "/" || path === "/index.html") filePath = join(EDITOR_DIR, "index.html");
    else filePath = join(EDITOR_DIR, path.replace(/^\/+/, ""));

    if (!filePath.startsWith(EDITOR_DIR)) return json(res, 403, { error: "forbidden" });
    if (!existsSync(filePath)) return json(res, 404, { error: "not found", path });

    const buf = await readFile(filePath);
    res.writeHead(200, { "content-type": MIME[extname(filePath)] ?? "application/octet-stream" });
    res.end(buf);
  } catch (err) {
    console.error(err);
    json(res, 500, { error: String(err.message ?? err) });
  }
});

server.listen(PORT, () => {
  console.log(`🧠 Mindmap editor → http://localhost:${PORT}`);
  console.log(`   editing files under: ${relative(ROOT, MINDMAPS)}/`);
});
