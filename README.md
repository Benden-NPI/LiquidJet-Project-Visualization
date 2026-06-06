# LiquidJet-Project-Visualization

> LiquidJet 專案的總門戶與心智圖編輯器。
> 部署為 GitHub Pages：[benden-npi.github.io/LiquidJet-Project-Visualization](https://benden-npi.github.io/LiquidJet-Project-Visualization/)

---

## 📂 結構

```
.
├── portal/            # 上位入口頁（總門戶）
├── editor/            # 互動式心智圖畫布編輯器（HTML 單檔 SPA）
├── mindmaps/          # 心智圖原始檔 (.mmd / .drawio)
├── scope/             # 範圍文件 (Markdown)
├── decisions/         # ADR 決策紀錄
├── scripts/           # 建置 / 本機編輯伺服器
├── .vscode/           # 推薦外掛、設定、snippets
└── .github/workflows/ # CI：發佈到 GitHub Pages
```

每個資料夾都有 `README.md` 與 `_template.*`，照樣複製改寫即可。

---

## 🚀 部署網址

| 內容 | URL |
|------|-----|
| LiquidJet 總門戶 | <https://benden-npi.github.io/LiquidJet-Project-Visualization/> |
| 心智圖編輯器（線上版） | <https://benden-npi.github.io/LiquidJet-Project-Visualization/editor/> |
| Yield 子專案 | <https://benden-npi.github.io/Yield/> |

`push` 到 `main` 會觸發 [.github/workflows/pages.yml](.github/workflows/pages.yml)：把 `portal/` 與 `editor/` 打包後部署到 Pages。

---

## 🧠 日常工作流程

```mermaid
flowchart LR
    A[新主題] --> B{格式}
    B -- 結構/大綱 --> C[新建 .mmd<br/>用 mmind snippet]
    B -- 自由排版 --> D[複製 _template.drawio]
    C --> E[VS Code 預覽]
    D --> E
    E --> F[scope/ 寫定義]
    F --> G[decisions/ 寫 ADR]
    G --> H[git push]
    H --> I[Pages 自動更新]
```

### 1. 開新心智圖

- **Mermaid**：`mindmaps/` 下新增 `YYYYMMDD-<topic>.mmd`，輸入 `mmind` 觸發 snippet。
- **Draw.io**：複製 `mindmaps/_template.drawio` 改名後雙擊編輯。
- 或直接在線上[編輯器](https://benden-npi.github.io/LiquidJet-Project-Visualization/editor/)新增 → 透過 GitHub Token 提交。

### 2. 預覽

| 檔案類型 | 預覽方式 |
|----------|----------|
| `.mmd` | Mermaid Editor 右上角 Preview |
| `.md`（含 mermaid） | `Ctrl+Shift+V` Markdown Preview |
| `.drawio` | 直接雙擊（Draw.io Integration 外掛） |

### 3. 沉澱：scope + decisions

- 心智圖只負責 **發散**；定案的範圍寫到 [scope/](scope/)。
- 任何方向性的選擇（工具、架構、優先級）寫成 ADR 放 [decisions/](decisions/)。

---

## 🖥 本機編輯器

```bash
npm run edit
# 打開 http://localhost:5173
```

直接讀寫 `mindmaps/` 下的 `.mmd` 檔。

## ☁️ 線上編輯器（GitHub Pages 版）

| 環境 | 偵測方式 | 存檔到 |
|------|----------|--------|
| 本機 `npm run edit` | `/api/files` 有回應 | `mindmaps/` 直接寫檔 |
| GitHub Pages | 無本機 API | 透過 GitHub Contents API commit 回 repo |

### 第一次使用（線上版）

1. 開編輯器網址
2. 右上 ⚙ → 貼上 fine-grained PAT
3. 產 PAT：GitHub → *Settings → Developer settings → Personal access tokens → Fine-grained tokens*
   - **Repository access**：只勾選此 repo
   - **Repository permissions** → **Contents**：`Read and write`
4. 按「測試連線」確認後儲存

Token 只存在你瀏覽器的 `localStorage`，**不會傳到任何伺服器**。
其他人沒 token = 只能看 Pages，按 ⚙ 後也無法寫入。

每次儲存 = 一個 commit → 觸發 CI → Pages 自動更新。

---

## 🧩 內建 Snippets

| Prefix | 觸發位置 | 產出 |
|--------|----------|------|
| `mmind` | `.mmd` / markdown | Mermaid mindmap 骨架 |
| `mflow` | `.mmd` / markdown | Flowchart 骨架 |
| `mseq` | `.mmd` / markdown | Sequence diagram 骨架 |
| `mblock` | markdown | ` ```mermaid ` 區塊 |
| `adr` | markdown | ADR 起始文件（自動帶日期） |

定義位於 [.vscode/mindmap.code-snippets](.vscode/mindmap.code-snippets)。

---

## 📎 範例

- [mindmaps/example-project-scope.mmd](mindmaps/example-project-scope.mmd)
- [decisions/0001-use-mermaid-and-drawio.md](decisions/0001-use-mermaid-and-drawio.md)
