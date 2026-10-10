/**
 * Supabase 設定（預留）
 * ------------------------------------------------------------
 * 預設 MODE 係 "mock"：帳戶同進度存在瀏覽器 localStorage／IndexedDB，
 * 唔使後端都可演示三種角色。
 *
 * 要接真後端：
 * 1. 去 https://supabase.com 開免費專案
 * 2. 喺 Project Settings → API 抄 Project URL 同 anon public key
 * 3. 填入下面 SUPABASE_URL、SUPABASE_ANON_KEY
 * 4. 將 AUTH_MODE 改做 "supabase"
 * 5. 喺 Supabase SQL Editor 執行 README 入面嘅 schema
 * 6. 重新部署到 GitHub Pages
 *
 * 可選：喺 index.html 加 CDN：
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 * （supabase 模式先需要）
 */
window.SUPABASE_CONFIG = {
  AUTH_MODE: "mock", // "mock" | "supabase"
  SUPABASE_URL: "https://YOUR_PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_ANON_PUBLIC_KEY",
};
