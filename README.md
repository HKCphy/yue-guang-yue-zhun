# 輕鬆學發音／愈廣愈準

幫助**新來港兒童**練習**廣東話（粵語）發音同閱讀**嘅手機風格網頁原型。  
設計參考：QESOSA 湯國華中學教師簡報「輕鬆學發音」。

純靜態 HTML／CSS／JS，**唔使安裝 npm、唔使後端、唔使 API key**。

**線上版（GitHub Pages）：** <https://hkcphy.github.io/yue-guang-yue-zhun/>

---

## 點樣喺本機開啟

### 方法一：直接開檔（最簡單）

用瀏覽器打開 repo 根目錄嘅：

```
index.html
```

（雙擊檔案，或拖入 Chrome／Edge／Safari／Firefox。）

> 部分瀏覽器對 `file://` 下嘅語音功能可能有限制；若「聽讀音」無聲，請用方法二。

### 方法二：本機小伺服器（建議）

喺 repo 根目錄執行：

```bash
# Python 3
python3 -m http.server 8080
```

然後用瀏覽器開啟：<http://localhost:8080>

（亦可用 `npx serve` 或其他靜態伺服器。）

### 手機測試

同一 Wi‑Fi 下，用電腦 IP（例如 `http://192.168.x.x:8080`）喺手機瀏覽器開啟；或之後放到 GitHub Pages，用手機直接開網址。

---

## 功能一覽

| 畫面 | 內容 |
|------|------|
| **首頁** | 歡迎、進度摘要（練習過詞語／次數／正確率）、開始練習、匯出／清除進度 |
| **目錄** | 六個單元：六聲調、ng-、n-/l-、gw-/kw-、入聲、-校園用語 |
| **練習** | 聽讀音 · 朗讀自評 · 揀粵拼 · 聲調／意思選擇 |
| **提示** | 畀新來港家庭同老師嘅實用發音建議 |

- **粵拼（Jyutping）** 標註聲調（例如 `ngo5`）
- **朗讀**：瀏覽器 Web Speech API（優先 `zh-HK`，否則 `zh-TW`／`zh-CN`）
- **進度**：`localStorage` 保存；可匯出 JSON，方便之後轉試算表

### 匯出進度 JSON 結構（方便轉試算表）

匯出檔大致如下，可用 Excel／Google 試算表「匯入 JSON」或自行轉換：

```json
{
  "exportedAt": "2026-10-10T02:00:00.000Z",
  "app": "輕鬆學發音",
  "summary": {
    "totalAttempts": 12,
    "totalCorrect": 10,
    "uniqueWords": 8,
    "sessions": 2
  },
  "wordsPracticed": {
    "tones|詩": { "count": 2, "correct": 2, "lastAt": "..." }
  }
}
```

---

## 放到 GitHub Pages

網站已經放喺 [HKCphy/yue-guang-yue-zhun](https://github.com/HKCphy/yue-guang-yue-zhun)，`index.html` 喺 repo 根目錄。

Pages 設定：**Deploy from a branch**，branch 選 `main`，資料夾選 `/`（root）。

線上網址：

<https://hkcphy.github.io/yue-guang-yue-zhun/>

首次開啟後可能要等幾分鐘先至生效。

---

## 檔案結構

```
./
├── index.html          # 主頁面
├── css/styles.css      # 手機框同畫面樣式
├── js/data.js          # 課程內容（單元、詞語、粵拼、提示）
├── js/app.js           # 導航、練習模式、TTS、進度
├── assets/icon.svg     # App 圖示
└── README.md
```

---

## 限制同注意

1. **語音朗讀（TTS）**取決於瀏覽器有冇粵語／中文語音。Chrome／Edge 喺桌面通常較齊；iOS Safari 可能用系統中文聲。若聽落似普通話多過粵語，屬系統聲線限制，唔係課程粵拼錯。
2. **「我讀完」**係自我核對（對照示範音），本版未強制錄音評分（可之後用 MediaRecorder 擴充）。
3. 進度只存在**該瀏覽器本機**；清快取或換裝置會唔見（可用「匯出進度」備份）。
4. 離線：首次載入後，只要唔清快取，靜態檔可離線再開（未加 Service Worker；需要可再加 PWA）。

---

## 授權同用途

教學原型，供課堂／家長輔導使用。內容可按校本需要於 `js/data.js` 自行增刪詞語。

祝同學愈廣愈準！
