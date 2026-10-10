# 輕鬆學發音／愈廣愈準（v2）

幫助**新來港兒童**練習**廣東話（粵語）發音**嘅手機風格網頁 App。  
支援**帳戶角色**（言語治療師／家長／學生）、**情景對話**、**睇文字錄音測驗**。

純靜態 HTML／CSS／JS，**唔使 npm build**。預設 **Mock 模式**（localStorage + IndexedDB）即可演示；之後可接免費 **Supabase** 做真後端。

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

預設 `js/supabase-config.js` 入面 `AUTH_MODE: "mock"`。

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

喺 `index.html` **取消註解** CDN：

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### 3. SQL Schema（喺 SQL Editor 貼上執行）

```sql
-- 角色枚舉
create type public.user_role as enum ('言語治療師', '家長', '學生');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  role public.user_role not null default '學生',
  display_name text,
  link_code text unique default upper(substr(md5(random()::text), 1, 6)),
  created_at timestamptz default now()
);

create table public.links (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid references public.profiles(id) on delete cascade,
  parent_id uuid references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  check (therapist_id is not null or parent_id is not null)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  unit text,
  word text,
  mode text,
  correct boolean default false,
  score numeric default 0,
  meta jsonb,
  created_at timestamptz default now()
);

create table public.therapist_notes (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  body text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (therapist_id, student_id)
);

-- 註冊後自動建 profile（可按需要改）
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, role, display_name)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, '學生'),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 簡易 RLS（之後可收緊）
alter table public.profiles enable row level security;
alter table public.links enable row level security;
alter table public.attempts enable row level security;
alter table public.therapist_notes enable row level security;

create policy "profiles read own or linked"
  on public.profiles for select using (true); -- 演示用；正式請收窄

create policy "profiles update own"
  on public.profiles for update using (auth.uid() = id);

create policy "attempts insert own"
  on public.attempts for insert with check (auth.uid() = student_id);

create policy "attempts read"
  on public.attempts for select using (true); -- 演示用

create policy "links all authenticated"
  on public.links for all using (auth.role() = 'authenticated');

create policy "notes therapist"
  on public.therapist_notes for all using (auth.uid() = therapist_id);
```

> 錄音檔建議改放 **Supabase Storage** bucket（例如 `recordings`），本版 Mock 用 IndexedDB。

### 4. 重新部署 GitHub Pages

```bash
git add .
git commit -m "Enable Supabase auth"
git push
```

Pages 會自動更新（或等一兩分鐘）。

`js/auth.js` 已有 Supabase 註冊／登入 stub；`DataService` 仍以 Mock 為主——接真 DB 時可將 `db.js` 各方法改做 `supabase.from(...).select/insert`。

---

## 檔案結構

```
cantonese-app/
├── index.html
├── css/styles.css
├── js/
│   ├── supabase-config.js   # AUTH_MODE + URL/key
│   ├── auth.js              # AuthService（mock | supabase）
│   ├── db.js                # DataService（links/attempts/notes/recordings）
│   ├── data.js              # 單元、情景、測驗句子
│   └── app.js               # UI 同流程
├── assets/icon.svg
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
