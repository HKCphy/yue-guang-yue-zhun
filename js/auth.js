/**
 * AuthService — 電郵＋密碼帳戶
 * Mock：localStorage；Supabase：Auth + profiles 表
 */
(function (global) {
  "use strict";

  var CFG = global.SUPABASE_CONFIG || { AUTH_MODE: "mock" };
  var USERS_KEY = "yue_auth_users_v1";
  var SESSION_KEY = "yue_auth_session_v1";
  var ROLES = ["言語治療師", "家長", "學生"];

  function uid() {
    return "u_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function loadUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function simpleHash(str) {
    // 演示用（唔係安全雜湊）。真環境請用 Supabase Auth。
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return "h" + (h >>> 0).toString(16);
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function publicUser(u) {
    return {
      id: u.id,
      email: u.email,
      role: u.role,
      display_name: u.display_name,
      link_code: u.link_code,
      created_at: u.created_at,
    };
  }

  function profileToUser(p, fallbackEmail) {
    if (!p) return null;
    return {
      id: p.id,
      email: p.email || fallbackEmail || "",
      role: p.role || "學生",
      display_name: p.display_name || (p.email || fallbackEmail || "").split("@")[0],
      link_code: p.link_code || "",
      created_at: p.created_at,
    };
  }

  /* —— Mock 實作 —— */
  var MockAuth = {
    async register(email, password, role, displayName) {
      email = normalizeEmail(email);
      if (!email || !password) throw new Error("請填電郵同密碼");
      if (password.length < 4) throw new Error("密碼至少 4 個字元（演示用）");
      if (ROLES.indexOf(role) === -1) throw new Error("請選擇角色");
      var users = loadUsers();
      if (users.some(function (u) { return u.email === email; })) {
        throw new Error("呢個電郵已經註冊");
      }
      var user = {
        id: uid(),
        email: email,
        passwordHash: simpleHash(password),
        role: role,
        display_name: (displayName || email.split("@")[0]).trim(),
        link_code: Math.random().toString(36).slice(2, 8).toUpperCase(),
        created_at: new Date().toISOString(),
      };
      users.push(user);
      saveUsers(users);
      var session = { userId: user.id, email: user.email, at: new Date().toISOString() };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return publicUser(user);
    },

    async login(email, password) {
      email = normalizeEmail(email);
      var users = loadUsers();
      var user = users.find(function (u) { return u.email === email; });
      if (!user || user.passwordHash !== simpleHash(password)) {
        throw new Error("電郵或密碼唔啱");
      }
      var session = { userId: user.id, email: user.email, at: new Date().toISOString() };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return publicUser(user);
    },

    async logout() {
      localStorage.removeItem(SESSION_KEY);
    },

    getSession() {
      try {
        var s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
        if (!s) return null;
        var users = loadUsers();
        var user = users.find(function (u) { return u.id === s.userId; });
        return user ? publicUser(user) : null;
      } catch (e) {
        return null;
      }
    },

    async updateProfile(patch) {
      var cur = this.getSession();
      if (!cur) throw new Error("未登入");
      var users = loadUsers();
      var idx = users.findIndex(function (u) { return u.id === cur.id; });
      if (idx < 0) throw new Error("搵唔到帳戶");
      if (patch.display_name) users[idx].display_name = String(patch.display_name).trim();
      saveUsers(users);
      return publicUser(users[idx]);
    },

    findByEmail(email) {
      email = normalizeEmail(email);
      var users = loadUsers();
      var u = users.find(function (x) { return x.email === email; });
      return u ? publicUser(u) : null;
    },

    findByLinkCode(code) {
      code = String(code || "").trim().toUpperCase();
      var users = loadUsers();
      var u = users.find(function (x) { return x.link_code === code && x.role === "學生"; });
      return u ? publicUser(u) : null;
    },

    findById(id) {
      var users = loadUsers();
      var u = users.find(function (x) { return x.id === id; });
      return u ? publicUser(u) : null;
    },

    listUsers() {
      return loadUsers().map(publicUser);
    },
  };

  /* —— Supabase —— */
  var SupabaseAuth = {
    _client: null,
    _getClient: function () {
      if (this._client) return this._client;
      if (!global.supabase || !global.supabase.createClient) {
        throw new Error("請先喺 index.html 載入 @supabase/supabase-js CDN");
      }
      if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY) {
        throw new Error("請喺 supabase-config.js 填 SUPABASE_URL 同 SUPABASE_ANON_KEY");
      }
      this._client = global.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
      return this._client;
    },

    async register(email, password, role, displayName) {
      email = normalizeEmail(email);
      if (!email || !password) throw new Error("請填電郵同密碼");
      if (password.length < 6) throw new Error("密碼至少 6 個字元");
      if (ROLES.indexOf(role) === -1) throw new Error("請選擇角色");
      var name = (displayName || email.split("@")[0]).trim();
      var client = this._getClient();
      var res = await client.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { role: role, display_name: name },
        },
      });
      if (res.error) throw new Error(res.error.message);
      var user = res.data.user;
      if (user) {
        // trigger 會建 profile；再 upsert 確保角色／名稱（需 profiles INSERT policy）
        var up = await client.from("profiles").upsert(
          {
            id: user.id,
            email: email,
            role: role,
            display_name: name,
          },
          { onConflict: "id" }
        );
        if (up.error) {
          // trigger 可能已建好；忽略 unique 衝突以外嘅提示，之後 getSession 再讀
          console.warn("profiles upsert:", up.error.message);
        }
      }
      // 若開咗電郵確認，signUp 後 session 會係 null
      if (!res.data.session) {
        return null; // 呼叫端顯示「請檢查電郵確認」
      }
      return this.getSession();
    },

    async login(email, password) {
      if (!password || password.length < 6) throw new Error("密碼至少 6 個字元");
      var client = this._getClient();
      var res = await client.auth.signInWithPassword({
        email: normalizeEmail(email),
        password: password,
      });
      if (res.error) throw new Error(res.error.message);
      return this.getSession();
    },

    async logout() {
      var client = this._getClient();
      await client.auth.signOut();
    },

    getSession: async function () {
      var client = this._getClient();
      var sess = await client.auth.getSession();
      var user = sess.data && sess.data.session && sess.data.session.user;
      if (!user) return null;
      var prof = await client.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (prof.error) {
        console.warn("profiles select:", prof.error.message);
      }
      var p = prof.data;
      if (!p) {
        // profile 未建好時用 metadata 頂住，並嘗試 upsert
        var meta = user.user_metadata || {};
        var fallback = {
          id: user.id,
          email: user.email,
          role: meta.role || "學生",
          display_name: meta.display_name || (user.email || "").split("@")[0],
        };
        await client.from("profiles").upsert(fallback, { onConflict: "id" });
        var again = await client.from("profiles").select("*").eq("id", user.id).maybeSingle();
        p = again.data || fallback;
      }
      return profileToUser(p, user.email);
    },

    async updateProfile(patch) {
      var cur = await this.getSession();
      if (!cur) throw new Error("未登入");
      var client = this._getClient();
      var allowed = {};
      if (patch.display_name) allowed.display_name = String(patch.display_name).trim();
      var res = await client.from("profiles").update(allowed).eq("id", cur.id);
      if (res.error) throw new Error(res.error.message);
      return this.getSession();
    },

    findByEmail: async function (email) {
      var client = this._getClient();
      var res = await client
        .from("profiles")
        .select("*")
        .eq("email", normalizeEmail(email))
        .maybeSingle();
      if (res.error) throw new Error(res.error.message);
      return profileToUser(res.data);
    },

    findByLinkCode: async function (code) {
      code = String(code || "").trim().toUpperCase();
      if (!code) return null;
      var client = this._getClient();
      var res = await client
        .from("profiles")
        .select("*")
        .eq("link_code", code)
        .eq("role", "學生")
        .maybeSingle();
      if (res.error) throw new Error(res.error.message);
      return profileToUser(res.data);
    },

    findById: async function (id) {
      if (!id) return null;
      var client = this._getClient();
      var res = await client.from("profiles").select("*").eq("id", id).maybeSingle();
      if (res.error) throw new Error(res.error.message);
      return profileToUser(res.data);
    },

    listUsers: async function () {
      var client = this._getClient();
      var res = await client.from("profiles").select("*").limit(200);
      if (res.error) throw new Error(res.error.message);
      return (res.data || []).map(function (p) { return profileToUser(p); });
    },
  };

  var mode = (CFG.AUTH_MODE || "mock").toLowerCase();
  var impl = mode === "supabase" ? SupabaseAuth : MockAuth;

  var AuthService = {
    ROLES: ROLES,
    mode: mode,
    register: function (email, password, role, displayName) {
      return Promise.resolve(impl.register(email, password, role, displayName));
    },
    login: function (email, password) {
      return Promise.resolve(impl.login(email, password));
    },
    logout: function () {
      return Promise.resolve(impl.logout());
    },
    getSession: function () {
      return Promise.resolve(impl.getSession());
    },
    getSessionSync: function () {
      // 只供 mock 即時 UI；supabase 模式請 await getSession()
      if (mode === "mock") return MockAuth.getSession();
      return null;
    },
    getClient: function () {
      if (mode === "supabase") return SupabaseAuth._getClient();
      return null;
    },
    updateProfile: function (patch) {
      return Promise.resolve(impl.updateProfile(patch));
    },
    findByEmail: function (email) {
      return Promise.resolve(impl.findByEmail(email));
    },
    findByLinkCode: function (code) {
      return Promise.resolve(impl.findByLinkCode(code));
    },
    findById: function (id) {
      return Promise.resolve(impl.findById(id));
    },
    listUsers: function () {
      return Promise.resolve(impl.listUsers ? impl.listUsers() : []);
    },
  };

  global.AuthService = AuthService;
})(window);
