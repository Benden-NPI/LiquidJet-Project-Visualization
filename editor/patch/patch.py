#!/usr/bin/env python3
"""Insert the import feature into editor/index.html. Idempotent-ish: refuses to
run twice by checking for the btnImport anchor."""
import re, sys, pathlib

SRC = pathlib.Path(sys.argv[1])
DST = pathlib.Path(sys.argv[2])
HERE = pathlib.Path(__file__).parent

html = SRC.read_text(encoding="utf-8")
orig_len = len(html)

if "btnImport" in html:
    sys.exit("already patched")

css  = (HERE / "frag_css.txt").read_text(encoding="utf-8")
frag = (HERE / "frag_html.txt").read_text(encoding="utf-8")
js   = (HERE / "frag_js.txt").read_text(encoding="utf-8")

def once(pattern, repl, text, label):
    new, n = re.subn(pattern, repl, text, count=1)
    if n != 1:
        sys.exit(f"anchor not found / not unique: {label}")
    return new

# 1. CSS ---------------------------------------------------------------
anchor = "  .ai-panel { background:var(--panel);"
assert html.count(anchor) == 1, "css anchor"
html = html.replace(anchor, css + "\n" + anchor, 1)

# 2. toolbar button ----------------------------------------------------
btn = '    <button id="btnSave" class="primary" title="儲存 (Ctrl+S)">💾 儲存</button>\n'
assert html.count(btn) == 1, "save button anchor"
html = html.replace(
    btn,
    btn + '    <button id="btnImport" title="匯入 .xmind / .mmd / .json / .md">⬇ 匯入</button>\n',
    1)

# 3. modal markup ------------------------------------------------------
anchor = '<script type="module">'
assert html.count(anchor) == 1, "script anchor"
html = html.replace(anchor, frag + anchor, 1)

# 4. js block ----------------------------------------------------------
anchor = "// ---------- Toolbar wiring ----------"
assert html.count(anchor) == 1, "toolbar wiring anchor"
html = html.replace(anchor, js + anchor, 1)

# 5. route the existing .mmd reader through the new parser -------------
old = re.search(r"function parseMmd\(text\) \{.*?\n\}\n", html, re.S)
if not old:
    sys.exit("parseMmd not found")
html = html.replace(old.group(0),
    "function parseMmd(text) {\n"
    "  // Delegates to the import parser: handles tab / 4-space / mixed indent,\n"
    "  // every mermaid node shape, ::icon, :::class, %% comments and md strings.\n"
    "  return impParseMmd(text) || mkNode(\"Empty\");\n"
    "}\n", 1)

# 6. don't let canvas shortcuts fire while a modal is open -------------
old = ('document.addEventListener("keydown", (e) => {\n'
       '  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;\n')
assert html.count(old) == 1, "keydown anchor"
html = html.replace(old, old.replace(
    '  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;\n',
    '  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;\n'
    '  if (document.querySelector(".modal-mask.open")) {\n'
    '    if (e.key === "Escape") { closeSettings(); closeImport(); }\n'
    '    return;\n'
    '  }\n'), 1)

DST.parent.mkdir(parents=True, exist_ok=True)
DST.write_text(html, encoding="utf-8")
print(f"ok: {orig_len} -> {len(html)} chars (+{len(html)-orig_len})")
