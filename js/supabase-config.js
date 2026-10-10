/**
 * Supabase 設定
 * AUTH_MODE: "supabase" = 真後端；"mock" = 本機演示
 * anon key 係公開用喺前端（靠 RLS 保護數據），唔好放 service_role key。
 */
window.SUPABASE_CONFIG = {
  AUTH_MODE: "supabase",
  SUPABASE_URL: 'https://pzhbrwjboldztsehqboi.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6aGJyd2pib2xkenRzZWhxYm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MTAxNTcsImV4cCI6MjEwNzE4NjE1N30.DnMJu_HDua32XeVNDBUn_ijIjfEupcxpG0fyfzpOTz0',
};
