# 0003. Introduce AI Auto-Operation Layer with Draft-First Governance

- Date: 2026-06-08
- Status: Accepted
- Deciders: Repo owner

## Context

Project Visualization 目前已有可運作的心智圖編輯器（本機 API / GitHub Contents API）與 Control Plan 文件流。
下一步要在既有流程中導入 AI 自動運轉能力，但要避免直接改正式資料或自動提交造成風險。

需要同時滿足：

1. 可落地的 MVP（先能手動觸發建議）。
2. 可擴充的架構（後續可接外部模型與規則）。
3. 清楚的治理邊界（draft-first、人工確認）。

## Options Considered

1. **把 AI 呼叫直接散在各 UI 事件裡** — 上手快，但後續維護困難，邏輯耦合高。
2. **新增 AI adapter 層與統一任務流程（input → task → draft result）** — 初期多一層抽象，但可維護、可測、可擴充。
3. **完全後端化（先建專屬 AI service）** — 治理彈性高，但導入成本與依賴過重，不符合本階段節奏。

## Decision

採用 **Option 2**，在 `editor/index.html` 中新增 AI 模組層，並以 draft-first 治理落地：

- AI 目標先聚焦三類任務：
  - 心智圖結構補全建議
  - 命名/分類建議
  - Control Plan 欄位缺漏檢查
- AI 不直接 commit、不直接改正式資料：
  - 僅產生 suggestion + diff preview
  - 由使用者一鍵套用到目前草稿
  - 最終仍需使用者手動儲存
- AI adapter 先提供：
  - `local-rules`（內建規則，零憑證）
  - `webhook`（外部 AI 服務，支援重試、速率限制、狀態追蹤）

## Consequences

- 正面：
  - 保留現有 editor 使用習慣，降低導入風險。
  - AI 能力與儲存層解耦，便於後續替換模型或擴充任務。
  - draft-first 保持可審核與可回滾。
- 負面：
  - 初期屬於「建議型 AI」，自動化程度有限。
  - 單檔前端實作會持續增長，需後續模組化拆分。
- 後續行動：
  - Phase 1：手動觸發建議（本次）。
  - Phase 2：儲存後自動檢查 + 結果面板強化。
  - Phase 3：可配置規則與跨檔案檢查。

## Links

- Related scope: [`../scope/ai-auto-operation-scope.md`](../scope/ai-auto-operation-scope.md)
- Related editor: [`../editor/index.html`](../editor/index.html)
