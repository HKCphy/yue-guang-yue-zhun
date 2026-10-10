# 輕鬆學發音／愈廣愈準（v2）

幫助**新來港兒童**練習**廣東話（粵語）發音**嘅手機風格網頁 App。  
支援**帳戶角色**（言語治療師／家長／學生）、**情景對話**、**睇文字錄音測驗**。

純靜態 HTML／CSS／JS，**唔使 npm build**。可用 **Mock**（本機）或 **Supabase**（雲端帳戶＋進度）。`AUTH_MODE` 喺 `js/supabase-config.js`。

線上示範（GitHub Pages）：<https://hkcphy.github.io/yue-guang-yue-zhun/>  
Repo：<https://github.com/HKCphy/yue-guang-yue-zhun>

---

## 點樣喺本機開啟

```bash
# 喺 cantonese-app 資料夾
python3 -m http.server 8080
```

瀏覽器開 <http://localhost:8080>（錄音功能建議用 localhost 或 HTTPS，唔好用 `file://`）。

亦可直接雙擊 `index.html`（TTS 可能正常；麥克風錄音喺部分瀏覽器會被擋）。

---

## 功能一覽

| 畫面 | 內容 |
|------|------|
| **登入／註冊** | 電郵＋密碼；註冊可選角色：學生／家長／言語治療師 |
| **首頁** | 學生：進度摘要；家長／治療師：連結學生＋睇數據 |
| **練習** | 六單元：聽／讀／揀粵拼／聲調 |
| **情景** | 校園、超市、診所——短對話＋粵拼＋聽／跟讀 |
| **測驗** | 睇文字 → MediaRecorder 錄音 → 重播 → 自評檢查表 |
| **我的** | 帳戶資料、學生連結碼、提示、匯出／登出 |

底部導航（學生）：**首頁｜練習｜情景｜測驗｜我的**  
家長／治療師只見：**首頁｜我的**（外加學生詳情頁）。

---

## Mock 帳戶點用（而家就可以試）

若 `AUTH_MODE: "mock"`（本機演示）：

### 演示三種角色

1. **註冊學生**  
   - 電郵例如 `student@demo.local`，密碼任意（≥4 字）  
   - 角色選「學生」  
   - 去「我的」複製**連結碼**（6 位）

2. **註冊家長**（可用無痕／另一瀏覽器，或先登出）  
   - 角色「家長」  
   - 首頁輸入學生連結碼或電郵 →「連結」  
   - 撳學生卡片睇進度

3. **註冊言語治療師**  
   - 同樣用連結碼連結學生  
   - 學生詳情頁可睇各單元正確率、最近練習，同寫**筆記**

> Mock 密碼只用簡單雜湊存本機，**唔係安全做法**，只供演示。正式請用 Supabase Auth。

### 資料存邊？

| 資料 | 位置 |
|------|------|
| 用戶（電郵、角色、連結碼） | `localStorage` → `yue_auth_users_v1` |
| 登入 session | `localStorage` → `yue_auth_session_v1` |
| 家長／治療師 ↔ 學生連結 | `localStorage` → `yue_links_v1` |
| 練習／測驗 attempts | `localStorage` → `yue_attempts_v1` |
| 治療師筆記 | `localStorage` → `yue_notes_v1` |
| 錄音 blob | **IndexedDB** `yue_recordings_v1`（有容量限制，宜短句） |

清瀏覽器資料會冇晒 Mock 帳戶同進度。

---

## 數據模型（Mock 同 Supabase 對齊）

```
profiles
  id, email, role, display_name, link_code, created_at

links
  id, therapist_id | parent_id, student_id, created_at

practice_sessions / attempts
  id, student_id, unit, word, mode, correct, score, meta, created_at

recordings（metadata + blob）
  id, attempt_id, student_id, mime, blob/size, created_at

therapist_notes
  id, therapist_id, student_id, body, created_at, updated_at
```

---

## 接上 Supabase（免費專案）

GitHub Pages **唔可以**自己跑數據庫；用 Supabase 做 Auth + Postgres。

### 1. 開專案

1. 去 [supabase.com](https://supabase.com) 註冊，開 New Project  
2. **Project Settings → API**：抄 **Project URL** 同 **anon public** key

### 2. 改設定

編輯 `js/supabase-config.js`：

```js
window.SUPABASE_CONFIG = {
  AUTH_MODE: "supabase",  // 由 "mock" 改過嚟
  SUPABASE_URL: "https://xxxx.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOi...",
};
```

喺 `index.html` 確認已載入 CDN（應喺 `supabase-config.js` 之前）：

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### 3. SQL Schema（喺 SQL Editor 貼上執行）

打開專案根目錄嘅 **`supabase-schema.sql`**，全選複製，貼去 Supabase → **SQL Editor** → Run。

內容包括：`profiles` / `links` / `attempts` / `therapist_notes`、註冊 trigger、RLS（含 **profiles INSERT own**：`auth.uid() = id`）。  
Trigger 用 `execute function`（適合現時 Supabase Postgres）。

**建議同時**：Authentication → Providers → Email → 關閉 **Confirm email**（否則註冊後要先收確認信先可以登入；開發階段關咗較方便）。

> **錄音**：練習／測驗音檔暫存瀏覽器 **IndexedDB**（唔上傳 Storage）。測驗結果同進度（attempts）會寫入 Supabase。之後可加 Storage bucket `recordings`。

### 4. 重新部署 GitHub Pages

```bash
git add .
git commit -m "Enable Supabase auth"
git push
```

Pages 會自動更新（或等一兩分鐘）。

`js/auth.js` 同 `js/db.js` 已接好 Supabase（profiles／links／attempts／therapist_notes）。錄音 blob 仍用本機 IndexedDB。

---

## 檔案結構

```
cantonese-app/
├── index.html
├── css/styles.css
├── js/
│   ├── supabase-config.js   # AUTH_MODE + URL/anon key
│   ├── auth.js              # AuthService（mock | supabase）
│   ├── db.js                # DataService（Supabase 或 Mock）
│   ├── data.js              # 單元、情景、測驗句子
│   └── app.js               # UI 同流程
├── assets/icon.svg
├── supabase-schema.sql      # 喺 SQL Editor 執行
└── README.md
```

---

## 限制

1. **TTS**：靠瀏覽器 `zh-HK` 聲線；可能偏普通話，屬系統限制。  
2. **錄音**：要麥克風權限；`file://` 或舊瀏覽器可能失敗。IndexedDB 有配額。  
3. **Mock**：唔跨裝置、唔加密、清快取即冇。  
4. **自動語音評分**：未做（自評檢查表）；之後可接語音 API。

---

## 授權

教學原型，供課堂／家長／言語治療使用。內容可改 `js/data.js`。

祝同學愈廣愈準！
