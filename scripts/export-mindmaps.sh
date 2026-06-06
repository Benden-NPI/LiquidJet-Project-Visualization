#!/usr/bin/env bash
# Export every *.mmd under mindmaps/ to SVG (or PNG) into dist/.
# Usage:
#   scripts/export-mindmaps.sh        # default svg
#   scripts/export-mindmaps.sh png
set -euo pipefail

FORMAT="${1:-svg}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ROOT/mindmaps"
OUT_DIR="$ROOT/dist"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "No mindmaps/ directory at $SRC_DIR" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

# Prefer locally-installed mmdc, fall back to npx.
if [[ -x "$ROOT/node_modules/.bin/mmdc" ]]; then
  MMDC="$ROOT/node_modules/.bin/mmdc"
else
  MMDC="npx --yes -p @mermaid-js/mermaid-cli mmdc"
fi

if [[ -z "${PUPPETEER_EXECUTABLE_PATH:-}" ]]; then
  for candidate in chromium-browser chromium google-chrome-stable google-chrome; do
    if command -v "$candidate" >/dev/null 2>&1; then
      export PUPPETEER_EXECUTABLE_PATH="$(command -v "$candidate")"
      break
    fi
  done
fi

shopt -s nullglob globstar
count=0
for src in "$SRC_DIR"/**/*.mmd; do
  rel="${src#$SRC_DIR/}"
  # Skip files starting with underscore (templates).
  base="$(basename "$rel")"
  if [[ "$base" == _* ]]; then
    continue
  fi
  out="$OUT_DIR/${rel%.mmd}.$FORMAT"
  mkdir -p "$(dirname "$out")"
  echo "→ $rel -> ${out#$ROOT/}"
  $MMDC -i "$src" -o "$out" -b transparent -p "$ROOT/scripts/puppeteer-config.json"
  count=$((count+1))
done

echo "Done. Exported $count file(s) to ${OUT_DIR#$ROOT/}/."
