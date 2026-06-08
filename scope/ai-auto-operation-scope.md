# AI Auto-Operation Scope

- Status: Draft
- Owner: Repo owner
- Last updated: 2026-06-08

## Context / Background

為了讓 Project Visualization 從「純編輯工具」走向「可協作的智慧工作台」，需要在現有 editor 中加入 AI 自動運轉能力。
本階段優先做低風險、可立即使用的 MVP：先給建議，再由人決定是否套用。

## Objectives

- [x] 定義 AI 功能邊界與治理原則（draft-first / human-in-the-loop）
- [x] 建立 AI adapter 抽象層，避免邏輯散落
- [x] 提供 MVP 任務（結構補全、命名建議、Control Plan 缺漏檢查）
- [x] 提供側邊建議清單 + diff preview + 一鍵套用

## In Scope

- `editor/index.html` 新增 AI 模組層（adapter + task runner）。
- 新增手動觸發按鈕（AI Suggest）。
- 新增可選的儲存後自動檢查（auto-check）。
- 新增 AI 設定（localStorage）：
  - 模式（off / local-rules / webhook）
  - webhook URL / API key
  - 速率限制（每分鐘請求數）
  - 重試次數
- 新增任務狀態顯示與錯誤訊息。

## Out of Scope

- AI 直接自動 commit 到 GitHub。
- AI 無人審核直接覆蓋正式資料。
- 建立獨立後端 AI 平台或訓練專屬模型。

## MVP Acceptance Criteria

- 使用者可手動觸發 AI 分析並看到可讀建議清單。
- 每筆可套用建議都提供 diff preview 與一鍵套用。
- 套用行為只影響目前草稿，最終仍需使用者手動儲存。
- 外部 AI 呼叫具備至少：速率限制、重試、可追蹤狀態、明確錯誤提示。

## Rollout Phases

1. **Phase 1（本次）**：手動觸發 AI 建議。
2. **Phase 2**：儲存後自動檢查與結果面板強化。
3. **Phase 3**：可配置自動規則與跨檔案檢查。

## Risks & Mitigations

- 風險：使用者誤以為 AI 會自動保存到 repo  
  緩解：UI 明確標示「只改草稿，不自動提交」。
- 風險：外部服務不穩定  
  緩解：重試機制 + 明確失敗訊息 + local-rules 可降級。
- 風險：憑證洩漏  
  緩解：僅存 localStorage，README 與設定畫面提示不要提交金鑰。

## Related

- Decisions: [`../decisions/0003-ai-auto-operation-architecture.md`](../decisions/0003-ai-auto-operation-architecture.md)
- Editor: [`../editor/index.html`](../editor/index.html)
