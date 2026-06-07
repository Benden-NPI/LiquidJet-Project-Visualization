# Tuning & Qualify Criteria — Long-form Definitions

- Status: Draft
- Owner: <name>
- Last updated: 2026-06-07

## Why this file exists

Yield Process Readiness 看板 (`station.tuningCriteria` / `station.qualifyCriteria`)
只能塞短字串。本檔集中保存每個 station 的**完整定義**，看板上的短字串請
反向連結回本檔對應 anchor。

> 命名約定：station 名稱與 Yield 看板 `station` 欄位 1:1 對齊。
> Anchor 規則：`#<station-slug>-tuning` / `#<station-slug>-qualify`。

## Global defaults (除非 station 另行覆寫)

- **Cpk threshold**：Tuning ≥ 1.33（preliminary）；Qualify ≥ 1.67。
- **GR&R threshold**：≤ 10% (acceptable)，10–30% (conditional w/ ADR)，>30% (reject)。
- **Qualification run size**：≥ 30 件連續良品。
- **Reaction plan drill**：Qualify 前至少演練 1 次。

任何 station 偏離 global defaults，請在該 station 段落明寫並開 ADR
(`decisions/00XX-*-criteria.md`)。

---

## Station: `<station-name>` （範例：`ColdPlate 4`）

### <station-slug>-tuning {#coldplate-4-tuning}

**短字串（看板）**：`Cpk≥1.33 on flow & flatness; GR&R<10%`

**完整定義**：

- [ ] Coolant flow rate Cpk ≥ 1.33（preliminary，n ≥ 30 連續）。
- [ ] Cold-plate flatness GR&R ≤ 10%（CMM, 5-point）。
- [ ] PFMEA 每個 high-RPN cause 至少對到 1 行 control plan。
- [ ] DOE 報告歸檔（連結：<填 ADR / report 路徑>）。
- [ ] Control method 選定並驗證可運作（SPC 圖、interlock 觸發測試）。

**Owners**：

- SurveyTool: <name>
- EE: <name>
- NPI: <name>

### <station-slug>-qualify {#coldplate-4-qualify}

**短字串（看板）**：`Cpk≥1.67; Qual run 30 OK; CAPA loop verified`

**完整定義**：

- [ ] 所有 Tuning exit criteria 仍維持。
- [ ] Cpk ≥ 1.67（n ≥ 30 連續 qualification run）。
- [ ] PFMEA 凍結版本簽核。
- [ ] SOP 發行、訓練矩陣 100% 覆蓋。
- [ ] Traceability：能從成品 SN 回查批號 / 機台 / 作業者 / 量測值 / 時間戳。
- [ ] 4M Change Control 流程文件發行並至少演練 1 次。
- [ ] Excursion / Recovery 流程演練紀錄歸檔。
- [ ] CAPA 閉環：至少跑過 1 次真實案例（從 NG → RCA → CA → 驗證）。

**Owners**：

- SurveyTool: <name>
- EE: <name>
- NPI: <name>

---

## Station: `<next-station-name>`

### <next-station-slug>-tuning

**短字串（看板）**：``

**完整定義**：

- [ ]

### <next-station-slug>-qualify

**短字串（看板）**：``

**完整定義**：

- [ ]

---

## Related

- Control Plan: [`./control-plan.md`](./control-plan.md)
- Framework ADR: [`../decisions/0002-control-plan-framework.md`](../decisions/0002-control-plan-framework.md)
- Mindmap: [`../mindmaps/control-plan-readiness-matrix.mmd`](../mindmaps/control-plan-readiness-matrix.mmd)
