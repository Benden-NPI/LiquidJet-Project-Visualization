# 0001. Use Mermaid + Draw.io for Project Visualization

- Date: 2026-06-06
- Status: Accepted
- Deciders: Repo owner

## Context

需要在專案早期快速捕捉 scope、決策、風險，並能 Git 版控、CI 自動產圖、Review 友善。

## Options Considered

1. **Mermaid (.mmd) + Draw.io (.drawio)** — 文字 + 自由排版兼具
2. Markmap — 純 Markdown 大綱，但 Mermaid 已涵蓋且更通用
3. PlantUML — 需要 Java，CI 較重
4. 純 Excalidraw — 視覺好但結構化弱、不易 diff

## Decision

採用 **Mermaid 為主、Draw.io 為輔**：
- Mermaid 處理結構化心智圖、流程、序列圖（CI 自動產 SVG）
- Draw.io 處理需要自由排版/圖示的系統架構視圖

## Consequences

- 正面：純文字、Git diff 清楚、CI/PR 預覽容易。
- 負面：Mermaid mindmap 排版控制力較弱。
- 後續：在 `scripts/` 內維護 mmdc 匯出腳本，GitHub Pages 提供集中預覽。

## Links

- Mindmap: `../mindmaps/_template.mmd`
- Scope: `../scope/_template.md`
