# 0002. Adopt First Principles v2 Control Plan Framework Bound to Process Readiness Milestones

- Date: 2026-06-07
- Status: Accepted
- Deciders: Repo owner

## Context

LiquidJet 製造流程從無到有，目前已有初步流程，正在補充 control plan。
需要一個可重複、可拾漏的框架，避免「想到才補」的離散控制清單。

同時，Yield 子專案的 Process Readiness 看板 (`client/src/components/toolgantt/`)
已採用 **Move-in → Setup → Tuning → Qualify** 四個 milestone 模型，
每個 station 有 `tuningCriteria` / `qualifyCriteria` 與三 owner
(`ownerSurveyTool` / `ownerEE` / `ownerNPI`) 欄位。

問題：control plan 與 readiness 看板若各自為政，會出現
「Qualify 才發現 Setup 應有的控制沒裝」「FMEA 高 RPN cause 沒對到控制」
之類的進度漏與控制漏。

## Options Considered

1. **獨立 Control Plan 表（傳統 AIAG 表格）** — 完整但與 readiness 看板脫鉤，
   無法在每週站會自然拾漏。
2. **First Principles v2：把 control plan 元件鑲嵌進 4 個 milestone** —
   每個 milestone 規定「該長出什麼 control plan 元件」與 exit criteria，
   並以 FMEA ↔ Control Plan ↔ Milestone 三向追溯做拾漏引擎。
3. **僅靠 PFMEA + RPN 排序** — 缺少 milestone 維度，無法回答「現在該補什麼」。

## Decision

採用 **Option 2：First Principles v2 框架，並綁定 Yield Process Readiness milestone**。

具體落地：

- `mindmaps/control-plan-readiness-matrix.mmd` — 總 checklist mindmap。
- `scope/control-plan.md` — 8 欄表格（7 欄 + milestone 歸屬），station 分節，
  station 名稱與 Yield 看板 `station` 欄位 1:1 對齊。
- `scope/tuning-qualify-criteria.md` — `tuningCriteria` / `qualifyCriteria`
  長文版定義（看板短字串反向連結回此檔 anchor）。
- 後續每個 station 級的控制策略決策（SPC vs 100%、spec 取值、抽樣計畫等），
  寫成獨立 ADR `decisions/00XX-control-strategy-<topic>.md`。

## Consequences

- 正面：
  - 每個 milestone 都有明確的 control plan exit criteria，站會時可直接拾漏。
  - 三 owner (SurveyTool / EE / NPI) 並列確保設備 / 量測 / 流程三視角各看一次。
  - FMEA ↔ Control Plan ↔ Milestone 三向追溯可量化「漏控 / 過控 / 進度漏」。
  - Repo 與 Yield 看板雙向可追溯，未來可程式化串接。
- 負面：
  - 增加文件維護成本（每個 station 都要在兩處同步：看板短字串 + 本 repo 長文）。
  - 早期 station 資料不全時，表格大量留白可能造成「文件沉重」錯覺。
- 後續行動：
  - 每新增 1 個 station 至 Yield 看板，同步在 `scope/control-plan.md` 與
    `scope/tuning-qualify-criteria.md` 補對應段落。
  - 控制策略的具體選擇逐案開 ADR。
  - 每週站會跑 `mindmaps/control-plan-readiness-matrix.mmd` 中的 7 題自檢清單。

## Links

- Mindmap: [`../mindmaps/control-plan-readiness-matrix.mmd`](../mindmaps/control-plan-readiness-matrix.mmd)
- Scope (Control Plan): [`../scope/control-plan.md`](../scope/control-plan.md)
- Scope (Criteria long-form): [`../scope/tuning-qualify-criteria.md`](../scope/tuning-qualify-criteria.md)
- Yield Process Readiness 看板: <https://benden-npi.github.io/Yield/> → *Process Readiness* tab
- Yield 看板 schema 參考: `Benden-NPI/Yield` → `client/src/components/toolgantt/types.ts`, `constants.ts`
