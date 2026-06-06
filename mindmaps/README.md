# Mindmaps

專案早期 scope / brainstorm 用的心智圖區。

## 檔案格式

- `*.mmd` — Mermaid mindmap，文字檔，Git diff 友善，CI 會自動產出 SVG。
- `*.md` — Markdown 內嵌 mermaid 區塊，適合敘述 + 圖併呈。
- `*.drawio` / `*.drawio.svg` — Draw.io，自由排版、可塞圖示，適合架構/系統視圖。

## 命名規則

```
YYYYMMDD-<topic>-<owner>.<ext>
例：20260606-scope-init-aaron.mmd
```

歸檔後請搬到 `archive/` 子資料夾，保留歷史紀錄。

## 新增方式

1. `Cmd/Ctrl+N` → 存成 `.mmd` → 輸入 `mmind` 觸發 snippet。
2. 或複製 `_template.mmd` / `_template.drawio` 改寫。

## 預覽

- `.mmd`：右上角 Mermaid Editor 預覽按鈕。
- `.md` 內 mermaid：Markdown Preview（`Ctrl+Shift+V`）。
- `.drawio`：直接雙擊由 Draw.io Integration 開啟。
- 互動編輯：`npm run edit` 開本機編輯器，或上 [線上版](https://benden-npi.github.io/LiquidJet-Project-Visualization/editor/)。
