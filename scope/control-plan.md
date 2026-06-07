# LiquidJet Control Plan

- Status: Draft
- Owner: <name>
- Last updated: 2026-06-07

## Context / Background

採用 **First Principles v2 框架**，把 control plan 鑲嵌進 Yield Process Readiness 看板的 4 個 milestone
(Move-in → Setup → Tuning → Qualify)。每一行控制都必須對應到：

1. 一個受控特性 (Characteristic) — 來自 CTQ 或關鍵製程 X。
2. 一個 PFMEA cause — 確保不是憑感覺加的。
3. 一個 milestone 歸屬 — 標明「最晚應於此 milestone 之前生效」。

每個 station 一個小節，station 名稱與 Yield 看板 `station` 欄位 1:1 對齊。

## Conventions

- **Milestone 歸屬**：`Setup` / `Tuning` / `Qualify` 三選一。
- **Control Method**：`SPC` / `100%` / `Poka-Yoke` / `Interlock` / `Visual` / `Auto-stop`。
- **MSA Status**：`GR&R %`, `Last cal: YYYY-MM-DD`, `Next cal: YYYY-MM-DD`。
- **Reaction Plan**：必須指名角色（不是「相關人員」），含停線/隔離/追溯範圍/RCA 觸發。
- **PFMEA Ref**：對應 PFMEA 行號或 Cause-ID，反查用。

## Control Plan Table — Station: `<station-name>`

> 範例：`ColdPlate 4`（請與 Yield Process Readiness 看板 `station` 欄位一致）

| # | Characteristic (CTQ / X) | Spec / Tolerance | Measurement Method | MSA Status | Sample Size & Frequency | Control Method | Reaction Plan | Milestone | PFMEA Ref |
|---|--------------------------|------------------|--------------------|------------|-------------------------|----------------|----------------|-----------|-----------|
| 1 | Coolant flow rate (X) — 影響 thermal Y | 8.0 ± 0.5 L/min | Inline flow meter, 0.1 L/min res. | GR&R 8%; Last cal 2026-05-01; Next 2026-08-01 | 100% per part, logged 1 Hz | SPC X-bar/R + low-flow interlock | <1 Operator>: interlock 自動停線 → <2 EE-on-shift>: 30 min 內判定 → <3 NPI>: 連續 2 NG 觸發 8D | Tuning | PFMEA-CP4-007 |
| 2 | Cold-plate surface flatness (Y, CTQ) | ≤ 25 μm TIR | CMM, 5-point | GR&R 12%; Last cal 2026-04-15 | AQL 1.0, n=5 / lot | 100% incoming + SPC trend | <1 IQC>: 隔離整批 → <2 Supplier QE>: 48h CAR → <3 NPI>: 啟動 4M 變更評估 | Qualify | PFMEA-CP4-002 |
| 3 | Torque, mounting bolts (X) | 4.5 ± 0.3 N·m | Smart torque wrench, traceable | GR&R 5%; Last cal 2026-05-20 | 100% with poka-yoke | Poka-Yoke (wrench rejects out-of-range) | <1 Operator>: 重打並標記 → <2 NPI>: 每日報表複查 → 連續 3 件 NG 觸發 SOP review | Setup | PFMEA-CP4-013 |

## Control Plan Table — Station: `<next-station-name>`

| # | Characteristic (CTQ / X) | Spec / Tolerance | Measurement Method | MSA Status | Sample Size & Frequency | Control Method | Reaction Plan | Milestone | PFMEA Ref |
|---|--------------------------|------------------|--------------------|------------|-------------------------|----------------|----------------|-----------|-----------|
|   |                          |                  |                    |            |                         |                |                |           |           |

## Holistic Layer (Qualify 強制 Exit Criteria)

- [ ] **Traceability**：每顆成品可回查批號 / 機台 / 作業者 / 量測值 / 時間戳。
- [ ] **4M Change Control**：4M 變更觸發 FAI / 重新驗證流程文件已發行。
- [ ] **Excursion / Recovery**：停線、重工、返修流程已寫且演練過。
- [ ] **Data Loop**：量測 → SPC → CAPA → 設計回饋已閉環，至少跑過一次真實案例。

## Self-audit (每週 5 分鐘，逐 station 跑一次)

1. 目前 milestone = ？下一個 milestone exit criteria 全部列得出來嗎？
2. Move-in/Setup/Tuning/Qualify 該長出的元件，有沒有「不確定」？
3. 該 station PFMEA 高 RPN cause，是否都對到 control plan 一行？
4. 每行 control 是否都對到 FMEA cause 且標明 milestone 歸屬？
5. `tuningCriteria` / `qualifyCriteria` 字串背後完整定義，是否在 `scope/tuning-qualify-criteria.md` 找得到？
6. 三 owner (SurveyTool / EE / NPI) 上週是否各看過一次？任何一位空白？
7. 上週的 NG / 異常是否都進到 CAPA 或 SPC 看板？

## Related

- Framework ADR: [`../decisions/0002-control-plan-framework.md`](../decisions/0002-control-plan-framework.md)
- Mindmap: [`../mindmaps/control-plan-readiness-matrix.mmd`](../mindmaps/control-plan-readiness-matrix.mmd)
- Tuning / Qualify criteria long-form: [`./tuning-qualify-criteria.md`](./tuning-qualify-criteria.md)
- Yield Process Readiness page: <https://benden-npi.github.io/Yield/> → *Process Readiness* tab
