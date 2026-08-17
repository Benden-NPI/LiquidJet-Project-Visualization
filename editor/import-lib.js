/* ============================================================
 * Mindmap Canvas — Import library
 * Browser-only, zero dependency. Also runnable in Node >= 18 for tests.
 *
 * Public API
 *   parseMmdText(text)          -> node tree      (mermaid mindmap, full syntax)
 *   parseMdText(text)           -> node tree      (extracts ```mermaid block)
 *   parseJsonText(text)         -> node tree      (editor's own .json)
 *   readXmindSheets(arrayBuffer, opts) -> [{title, nodeCount, root, stats}]
 *   sniffAndParse(name, data, opts)    -> {sheets:[...], kind}
 *
 * Node shape produced: { id, text, x:null, y:null, children:[] }
 * `mkNode` is injected by the host page so ids match the editor's newId().
 * ============================================================ */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MindmapImport = api;
})(typeof self !== "undefined" ? self : globalThis, function () {
  "use strict";

  // ---- node factory (host may override) -------------------------------
  let _seq = 0;
  let mkNode = (text) => ({
    id: "n" + (++_seq) + "-" + Math.random().toString(36).slice(2, 7),
    text: String(text == null ? "" : text),
    x: null, y: null, children: []
  });
  function setNodeFactory(fn) { mkNode = fn; }

  // ---- text hygiene ----------------------------------------------------
  // The editor exports .mmd, where a raw newline inside a title breaks the
  // indentation-based parser. Everything imported is collapsed to one line.
  function oneLine(s) {
    return String(s == null ? "" : s)
      .replace(/\r/g, "")
      .replace(/[\n\t]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  /* ==================================================================
   * 1. mermaid mindmap  (.mmd)
   * ================================================================== */

  // Node shapes mermaid accepts, longest delimiter first so ((x)) is not
  // mistaken for (x).
  const SHAPES = [
    [/^\(\(([\s\S]*)\)\)$/, 1],   // ((circle))
    [/^\)\)([\s\S]*)\(\($/, 1],   // ))bang((
    [/^\{\{([\s\S]*)\}\}$/, 1],   // {{hexagon}}
    [/^\[([\s\S]*)\]$/, 1],       // [square]
    [/^\(([\s\S]*)\)$/, 1],       // (rounded)
    [/^\)([\s\S]*)\($/, 1],       // )cloud(
    [/^\{([\s\S]*)\}$/, 1]        // {rhombus}
  ];

  function stripShape(s) {
    s = s.trim();
    // optional leading id: "id[text]" / "root((text))"
    const m = s.match(/^([A-Za-z0-9_\-一-鿿]*)\s*([\(\[\{\)][\s\S]*)$/);
    const body = m ? m[2] : s;
    for (const [re] of SHAPES) {
      const g = body.match(re);
      if (g) return unquote(g[1]);
    }
    return unquote(s);
  }

  function unquote(s) {
    s = String(s).trim();
    // mermaid markdown string:  "`**bold** text`"
    let m = s.match(/^"\s*`([\s\S]*)`\s*"$/);
    if (m) s = m[1].replace(/\*\*|__|\*|_/g, "");
    else {
      m = s.match(/^"([\s\S]*)"$/) || s.match(/^'([\s\S]*)'$/);
      if (m) s = m[1];
    }
    return s.replace(/\\"/g, '"').replace(/<br\s*\/?>/gi, " ").trim();
  }

  // Indentation: mermaid is column-based, not "2 spaces = 1 level".
  // We record the raw column of every line and derive depth from a stack,
  // so 4-space, 2-space, tab and mixed files all import correctly.
  function leadCols(line, tabSize) {
    let col = 0;
    for (const ch of line) {
      if (ch === " ") col++;
      else if (ch === "\t") col += (tabSize - (col % tabSize));
      else break;
    }
    return col;
  }

  function parseMmdText(text, opts) {
    const tabSize = (opts && opts.tabSize) || 4;
    const src = String(text).replace(/\r\n?/g, "\n");
    const raw = src.split("\n");

    const lines = [];
    let started = false;
    for (let i = 0; i < raw.length; i++) {
      let line = raw[i];
      if (!line.trim()) continue;
      if (/^\s*%%/.test(line)) continue;               // %% comment
      if (/^\s*(---|:::|classDef|class\s)/.test(line.trim()) && !started) continue;

      if (!started) {
        const m = line.match(/^\s*mindmap\b(.*)$/i);
        if (m) {
          started = true;
          // `mindmap root((X))` on one line
          const rest = m[1].trim();
          if (rest) lines.push({ col: 0, text: rest });
          continue;
        }
        // Tolerate files with no `mindmap` header at all.
        if (i === raw.length - 1) { started = true; i = -1; continue; }
        continue;
      }

      // trailing decorations on their own line belong to the previous node
      const t = line.trim();
      if (/^::icon\(/.test(t)) continue;               // ::icon(fa fa-book)
      if (/^:::/.test(t)) continue;                    // :::className

      line = line.replace(/\s+::icon\([^)]*\)\s*$/, "")
                 .replace(/\s+:::[\w\- ]+\s*$/, "")
                 .replace(/\s+%%.*$/, "");

      lines.push({ col: leadCols(line, tabSize), text: line.trim() });
    }

    if (!lines.length) return null;

    let rootNode = null;
    const stack = []; // {col, node}
    for (const ln of lines) {
      const node = mkNode(oneLine(stripShape(ln.text)));
      if (!rootNode) { rootNode = node; stack.push({ col: ln.col, node }); continue; }
      while (stack.length > 1 && stack[stack.length - 1].col >= ln.col) stack.pop();
      // deeper-or-equal than root but shallower than current top
      if (stack.length === 1 && ln.col <= stack[0].col) {
        // sibling of root -> keep it under root rather than dropping it
        stack[0].node.children.push(node);
        stack.push({ col: ln.col + 1, node });
        continue;
      }
      stack[stack.length - 1].node.children.push(node);
      stack.push({ col: ln.col, node });
    }
    return rootNode;
  }

  /* ==================================================================
   * 2. markdown (.md)  — first ```mermaid fence, else heading outline
   * ================================================================== */
  function parseMdText(text) {
    const src = String(text).replace(/\r\n?/g, "\n");
    const fence = src.match(/```(?:mermaid|mmd)\s*\n([\s\S]*?)```/i);
    if (fence) return parseMmdText(fence[1]);

    // fallback: # / ## / ### outline + "- " bullets
    const lines = src.split("\n");
    let rootNode = null; const stack = [];
    for (const line of lines) {
      let m = line.match(/^(#{1,6})\s+(.*)$/);
      let depth, txt;
      if (m) { depth = m[1].length - 1; txt = m[2]; }
      else {
        m = line.match(/^(\s*)[-*+]\s+(.*)$/);
        if (!m) continue;
        depth = 6 + Math.floor(m[1].replace(/\t/g, "  ").length / 2);
        txt = m[2];
      }
      const node = mkNode(oneLine(txt.replace(/\*\*|__|`/g, "")));
      if (!rootNode) { rootNode = node; stack.push({ depth, node }); continue; }
      while (stack.length > 1 && stack[stack.length - 1].depth >= depth) stack.pop();
      stack[stack.length - 1].node.children.push(node);
      stack.push({ depth, node });
    }
    return rootNode;
  }

  /* ==================================================================
   * 3. editor json
   * ================================================================== */
  function parseJsonText(text) {
    const d = JSON.parse(text);
    const src = Array.isArray(d) ? d[0] : d;
    (function fix(n) {
      n.id = n.id || mkNode("").id;
      n.text = oneLine(n.text != null ? n.text : (n.title || ""));
      n.children = n.children || [];
      n.x = typeof n.x === "number" ? n.x : null;
      n.y = typeof n.y === "number" ? n.y : null;
      n.children.forEach(fix);
    })(src);
    return src;
  }

  /* ==================================================================
   * 4. ZIP reader — enough of the spec to pull one entry out of a .xmind
   *    store (method 0) and deflate (method 8) via native DecompressionStream
   * ================================================================== */
  async function zipReadEntry(buf, wanted) {
    const dv = new DataView(buf);
    const u8 = new Uint8Array(buf);
    const len = u8.length;

    // End of central directory: scan backwards for 0x06054b50
    let eocd = -1;
    for (let i = len - 22; i >= 0 && i >= len - 22 - 65535; i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error("不是有效的 zip（找不到 EOCD）");

    let count = dv.getUint16(eocd + 10, true);
    let cdOff = dv.getUint32(eocd + 16, true);

    // Zip64 fallback
    if (cdOff === 0xffffffff || count === 0xffff) {
      for (let i = eocd - 20; i >= 0; i--) {
        if (dv.getUint32(i, true) === 0x07064b50) {
          const z64 = Number(dv.getBigUint64(i + 8, true));
          count = Number(dv.getBigUint64(z64 + 32, true));
          cdOff = Number(dv.getBigUint64(z64 + 48, true));
          break;
        }
      }
    }

    const dec = new TextDecoder("utf-8");
    let p = cdOff;
    for (let i = 0; i < count; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true);
      const csize = dv.getUint32(p + 20, true);
      const nlen = dv.getUint16(p + 28, true);
      const elen = dv.getUint16(p + 30, true);
      const clen = dv.getUint16(p + 32, true);
      const lho = dv.getUint32(p + 42, true);
      const name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
      if (name === wanted) {
        if (dv.getUint32(lho, true) !== 0x04034b50) throw new Error("zip local header 損毀");
        const lnlen = dv.getUint16(lho + 26, true);
        const lelen = dv.getUint16(lho + 28, true);
        const start = lho + 30 + lnlen + lelen;
        const raw = u8.subarray(start, start + csize);
        if (method === 0) return dec.decode(raw);
        if (method !== 8) throw new Error("不支援的壓縮方式 " + method);
        if (typeof DecompressionStream !== "function") {
          throw new Error("此瀏覽器不支援 DecompressionStream，請改用較新版 Chrome / Edge / Firefox");
        }
        const ds = new DecompressionStream("deflate-raw");
        const stream = new Blob([raw]).stream().pipeThrough(ds);
        const out = await new Response(stream).arrayBuffer();
        return dec.decode(new Uint8Array(out));
      }
      p += 46 + nlen + elen + clen;
    }
    throw new Error("zip 內找不到 " + wanted);
  }

  /* ==================================================================
   * 5. XMind
   * ================================================================== */
  const PRIORITY = ["", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"];

  function markerPrefix(topic, opts) {
    if (!opts.markers) return "";
    const ids = (topic.markers || []).map(m => m && m.markerId).filter(Boolean);
    const out = [];
    if (ids.some(id => id === "task-done")) out.push("✔");
    else if (ids.some(id => /^task-(start|oct|quarter|3oct|half|5oct|3quar|7oct)$/.test(id))) out.push("◐");
    const pr = ids.map(id => (id.match(/^priority-(\d)$/) || [])[1]).filter(Boolean)[0];
    if (pr) out.push(PRIORITY[+pr] || ("(" + pr + ")"));
    if (ids.some(id => /^flag-/.test(id))) out.push("🚩");
    if (ids.some(id => /^star-/.test(id))) out.push("★");
    return out.length ? out.join("") + " " : "";
  }

  function topicTitle(topic) {
    if (topic.title != null && String(topic.title).trim()) return String(topic.title);
    // attributedTitle: rich text runs
    const at = topic.attributedTitle;
    if (Array.isArray(at)) {
      return at.map(p => (p.spans || []).map(s => s.text || "").join("")).join(" ");
    }
    return "";
  }

  function noteText(topic) {
    const n = topic.notes;
    if (!n) return "";
    if (n.plain && n.plain.content) return n.plain.content;
    if (n.realHTML && n.realHTML.content) {
      return String(n.realHTML.content)
        .replace(/<li>/gi, " • ").replace(/<[^>]+>/g, " ");
    }
    return "";
  }

  function convertTopic(topic, opts, stats) {
    stats.nodes++;
    // An empty title would vanish on .mmd export (blank line), taking its
    // whole subtree with it — give it a visible placeholder instead.
    let label = oneLine(markerPrefix(topic, opts) + topicTitle(topic));
    if (!label) { label = "(未命名)"; stats.untitled++; }
    const node = mkNode(label);

    const nt = oneLine(noteText(topic));
    if (nt) {
      stats.notes++;
      if (opts.notes) node.children.push(mkNode("📝 " + nt));
      else stats.notesSkipped++;
    }

    const ch = topic.children || {};
    for (const c of ch.attached || []) node.children.push(convertTopic(c, opts, stats));

    for (const c of ch.summary || []) {
      stats.summaries++;
      if (opts.summaries) node.children.push(convertTopic(c, opts, stats));
    }
    for (const c of ch.detached || []) {
      stats.detached++;
      if (opts.detached) node.children.push(convertTopic(c, opts, stats));
    }
    return node;
  }

  const DEFAULT_XMIND_OPTS = {
    markers: true,     // ✔ ① prefixes
    notes: true,       // notes -> 📝 child node
    summaries: false,  // summary topics
    detached: false    // floating topics
  };

  async function readXmindSheets(arrayBuffer, opts) {
    const o = Object.assign({}, DEFAULT_XMIND_OPTS, opts || {});
    let json = null;
    try { json = await zipReadEntry(arrayBuffer, "content.json"); } catch (e) { json = null; }

    if (json) {
      const sheets = JSON.parse(json);
      const list = Array.isArray(sheets) ? sheets : [sheets];
      return list.map((sh, i) => {
        const stats = { nodes: 0, notes: 0, notesSkipped: 0, summaries: 0, detached: 0,
                        untitled: 0, relationships: (sh.relationships || []).length };
        const rootTopic = sh.rootTopic || {};
        const rootNode = convertTopic(rootTopic, o, stats);
        return {
          title: oneLine(sh.title) || ("Sheet " + (i + 1)),
          rootText: rootNode.text,
          nodeCount: stats.nodes,
          root: rootNode,
          stats
        };
      });
    }

    // Legacy XMind 8: content.xml
    const xml = await zipReadEntry(arrayBuffer, "content.xml");
    if (/xmap-content/.test(xml) === false) throw new Error("無法辨識的 .xmind 內容");
    return parseXmindXml(xml, o);
  }

  function parseXmindXml(xml, o) {
    if (typeof DOMParser !== "function") throw new Error("需要瀏覽器環境才能解析舊版 .xmind");
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const sheets = [...doc.getElementsByTagName("sheet")];
    return sheets.map((sh, i) => {
      const stats = { nodes: 0, notes: 0, notesSkipped: 0, summaries: 0, detached: 0, relationships: 0 };
      const topicEl = [...sh.children].find(c => c.tagName === "topic");
      const walk = (el) => {
        stats.nodes++;
        const titleEl = [...el.children].find(c => c.tagName === "title");
        const node = mkNode(oneLine(titleEl ? titleEl.textContent : ""));
        const kids = [...el.children].find(c => c.tagName === "children");
        if (kids) {
          for (const ts of [...kids.children]) {
            const type = ts.getAttribute("type");
            if (type === "attached" || (type === "detached" && o.detached) ||
                (type === "summary" && o.summaries)) {
              for (const t of [...ts.children]) node.children.push(walk(t));
            } else if (type === "detached") stats.detached++;
            else if (type === "summary") stats.summaries++;
          }
        }
        return node;
      };
      const rootNode = topicEl ? walk(topicEl) : mkNode("Empty");
      const shTitle = [...sh.children].find(c => c.tagName === "title");
      return {
        title: oneLine(shTitle ? shTitle.textContent : "") || ("Sheet " + (i + 1)),
        rootText: rootNode.text, nodeCount: stats.nodes, root: rootNode, stats
      };
    });
  }

  /* ==================================================================
   * 6. dispatcher
   * ================================================================== */
  async function sniffAndParse(filename, data, opts) {
    const name = String(filename || "").toLowerCase();
    if (name.endsWith(".xmind") || (data instanceof ArrayBuffer)) {
      const sheets = await readXmindSheets(data, opts);
      return { kind: "xmind", sheets };
    }
    const text = String(data);
    let root;
    if (name.endsWith(".json")) root = parseJsonText(text);
    else if (name.endsWith(".md") || name.endsWith(".markdown")) root = parseMdText(text);
    else if (name.endsWith(".mmd")) root = parseMmdText(text);
    else {
      // unknown extension: sniff content
      if (/^\s*[\[{]/.test(text)) root = parseJsonText(text);
      else if (/```(mermaid|mmd)/i.test(text)) root = parseMdText(text);
      else if (/^\s*mindmap/im.test(text)) root = parseMmdText(text);
      else root = parseMdText(text);
    }
    if (!root) throw new Error("檔案內容無法解析成心智圖");
    return { kind: "text", sheets: [{ title: filename, rootText: root.text, root, nodeCount: countNodes(root), stats: null }] };
  }

  function countNodes(n) { let c = 0; (function w(x) { c++; x.children.forEach(w); })(n); return c; }

  return {
    setNodeFactory, oneLine, countNodes,
    parseMmdText, parseMdText, parseJsonText,
    zipReadEntry, readXmindSheets, sniffAndParse,
    DEFAULT_XMIND_OPTS
  };
});
