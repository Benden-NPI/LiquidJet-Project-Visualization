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
PUPPETEER_CONFIG="$ROOT/scripts/puppeteer-config.json"
MMDC_ARGS=()

# GitHub-hosted runners can block Chromium sandboxing; use dedicated config there.
if [[ -n "${CI:-}" && -f "$PUPPETEER_CONFIG" ]]; then
  MMDC_ARGS+=(-p "$PUPPETEER_CONFIG")
fi

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
  $MMDC "${MMDC_ARGS[@]}" -i "$src" -o "$out" -b transparent
  count=$((count+1))
done

echo "Done. Exported $count file(s) to ${OUT_DIR#$ROOT/}/."
