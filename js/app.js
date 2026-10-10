/**
 * 輕鬆學發音 v2 — 帳戶／角色儀表板／情景／錄音測驗
 */
(function () {
  "use strict";

  var DATA = window.APP_DATA;
  var Auth = window.AuthService;
  var DB = window.DataService;

  var state = {
    user: null,
    screen: "auth",
    authTab: "login",
    mode: "listen",
    categoryId: DATA.categories[0].id,
    wordIndex: 0,
    sessionCorrect: 0,
    sessionTotal: 0,
    awaitingNext: false,
    practiceView: "catalog", // catalog | drill
    scenarioId: null,
    scenarioLine: 0,
    quizId: null,
    quizBlob: null,
    quizBlobUrl: null,
    mediaRecorder: null,
    recordingChunks: [],
    isRecording: false,
    detailStudentId: null,
  };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function showToast(msg) {
    var el = $("#toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.style.cssText =
        "position:absolute;bottom:80px;left:50%;transform:translateX(-50%);" +
        "background:#1a202c;color:#fff;padding:10px 18px;border-radius:12px;" +
        "font-size:0.85rem;z-index:50;max-width:80%;text-align:center;" +
        "opacity:0;transition:opacity 0.2s;pointer-events:none;";
      $(".phone-shell").appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.style.opacity = "0"; }, 2200);
  }

  /* —— TTS —— */
  function pickVoice() {
    if (!window.speechSynthesis) return null;
    var voices = speechSynthesis.getVoices();
    var prefer = ["zh-HK", "zh-TW", "zh-CN", "zh"];
    for (var i = 0; i < prefer.length; i++) {
      var lang = prefer[i];
      var v = voices.find(function (x) {
        return x.lang && x.lang.toLowerCase().replace("_", "-").startsWith(lang.toLowerCase());
      });
      if (v) return v;
    }
    return voices.find(function (x) {
      return /chinese|cantonese|yue|香港|粵/i.test(x.name + " " + (x.lang || ""));
    }) || null;
  }

  function speak(text) {
    if (!window.speechSynthesis) {
      showToast("呢個瀏覽器唔支援語音朗讀");
      return;
    }
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-HK";
    var voice = pickVoice();
    if (voice) { u.voice = voice; u.lang = voice.lang || "zh-HK"; }
    u.rate = 0.85;
    speechSynthesis.speak(u);
  }

  if (window.speechSynthesis) {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = function () { speechSynthesis.getVoices(); };
  }

  /* —— Helpers —— */
  function getCategory(id) {
    return DATA.categories.find(function (c) { return c.id === id; }) || DATA.categories[0];
  }
  function currentWords() { return getCategory(state.categoryId).words; }
  function currentWord() {
    var words = currentWords();
    if (state.wordIndex >= words.length) state.wordIndex = 0;
    return words[state.wordIndex];
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function uniqueJyutpings(exclude) {
    var set = {};
    DATA.categories.forEach(function (c) {
      c.words.forEach(function (w) {
        if (w.jyutping !== exclude) set[w.jyutping] = true;
      });
    });
    return Object.keys(set);
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  async function logAttempt(unit, word, mode, correct, score, meta) {
    if (!state.user || state.user.role !== "學生") return null;
    return DB.recordAttempt({
      student_id: state.user.id,
      unit: unit,
      word: word,
      mode: mode,
      correct: correct,
      score: score,
      meta: meta || null,
    });
  }

  /* —— Navigation —— */
  function showScreen(name) {
    state.screen = name;
    $all(".screen").forEach(function (el) {
      el.classList.toggle("active", el.dataset.screen === name);
    });
    $all(".tab-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.screen === name);
    });
    if (name === "home") renderHome();
    if (name === "practice") renderPracticeScreen();
    if (name === "scenarios") renderScenariosScreen();
    if (name === "quiz") renderQuizScreen();
    if (name === "me") renderMe();
    if (name === "student-detail") renderStudentDetail();
    if (name === "auth") renderAuth();
  }

  function setLoggedInUI(user) {
    state.user = user;
    var bar = $("#tab-bar");
    var headerSub = $("#header-sub");
    if (!user) {
      bar.classList.add("hidden");
      if (headerSub) headerSub.textContent = "愈廣愈準 · 請先登入";
      showScreen("auth");
      return;
    }
    bar.classList.remove("hidden");
    if (headerSub) {
      headerSub.textContent = user.display_name + " · " + user.role;
    }
    // 家長／治療師隱藏練習／情景／測驗 tab
    $all(".tab-btn[data-student-only]").forEach(function (btn) {
      btn.classList.toggle("hidden", user.role !== "學生");
    });
    showScreen("home");
  }

  /* —— Auth UI —— */
  function renderAuth() {
    var isReg = state.authTab === "register";
    var isSb = Auth.mode === "supabase";
    $all(".auth-tab").forEach(function (t) {
      t.classList.toggle("active", t.dataset.authTab === state.authTab);
    });
    $("#register-fields").classList.toggle("hidden", !isReg);
    $("#auth-title").textContent = isReg ? "註冊" : "登入";
    if (isReg) {
      $("#auth-desc").textContent = "揀角色：學生／家長／言語治療師";
    } else if (isSb) {
      $("#auth-desc").textContent = "電郵＋密碼登入（雲端帳戶，進度可跨裝置共用）";
    } else {
      $("#auth-desc").textContent = "電郵＋密碼。演示模式資料存在本機瀏覽器。";
    }
    $("#auth-submit").textContent = isReg ? "建立帳戶" : "登入";
    $("#auth-error").classList.add("hidden");
    var pw = $("#auth-password");
    if (pw) {
      var minLen = isSb ? 6 : 4;
      pw.minLength = minLen;
      pw.placeholder = "至少 " + minLen + " 個字元";
    }
    var note = $("#auth-welcome-note");
    if (note) {
      note.innerHTML = isSb
        ? "雲端帳戶：註冊後進度會存到 Supabase。<br/>若未收到確認電郵，可喺 Auth 設定關閉 Confirm email。"
        : "Mock 模式：唔使開伺服器都可註冊三種角色試用。<br/>接 Supabase 步驟見 README。";
    }
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    var email = $("#auth-email").value;
    var password = $("#auth-password").value;
    var err = $("#auth-error");
    err.classList.add("hidden");
    try {
      var user;
      if (state.authTab === "register") {
        var name = $("#auth-name").value;
        var roleEl = document.querySelector('input[name="auth-role"]:checked');
        var role = roleEl ? roleEl.value : "學生";
        user = await Auth.register(email, password, role, name);
        if (!user) {
          // Supabase 開咗電郵確認：未有 session
          showToast("註冊成功！請檢查電郵確認帳戶後再登入");
          state.authTab = "login";
          renderAuth();
          return;
        }
        showToast("註冊成功！");
      } else {
        user = await Auth.login(email, password);
        showToast("歡迎返嚟");
      }
      setLoggedInUI(user);
    } catch (ex) {
      err.textContent = ex.message || "出錯";
      err.classList.remove("hidden");
    }
  }

  /* —— Home by role —— */
  async function renderHome() {
    var u = state.user;
    if (!u) return;
    $("#home-student").classList.toggle("hidden", u.role !== "學生");
    $("#home-parent").classList.toggle("hidden", u.role !== "家長");
    $("#home-therapist").classList.toggle("hidden", u.role !== "言語治療師");

    if (u.role === "學生") {
      $("#home-greet").textContent = "你好，" + u.display_name + "！";
      var analytics = await DB.getAnalytics(u.id);
      $("#stat-words").textContent = String(
        new Set(analytics.recent.map(function (a) { return a.word; }).concat(
          (await DB.getAttemptsForStudent(u.id, 500)).map(function (a) { return a.word; })
        )).size
      );
      // better unique words from all attempts
      var all = await DB.getAttemptsForStudent(u.id, 500);
      var uniq = {};
      all.forEach(function (a) { if (a.word) uniq[a.word] = 1; });
      $("#stat-words").textContent = String(Object.keys(uniq).length);
      $("#stat-attempts").textContent = String(analytics.total);
      $("#stat-rate").textContent = analytics.rate + "%";
      var last = $("#last-session");
      if (analytics.recent[0]) {
        var d = new Date(analytics.recent[0].created_at);
        last.textContent = "上次練習：" + d.toLocaleString("zh-HK", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
      } else {
        last.textContent = "尚未開始練習——撳下面開始啦！";
      }
    } else if (u.role === "家長") {
      await renderLinkedStudents("parent-students", "家長");
    } else if (u.role === "言語治療師") {
      await renderLinkedStudents("therapist-students", "言語治療師");
    }
  }

  async function resolveStudentRef(input) {
    input = String(input || "").trim();
    if (!input) throw new Error("請輸入連結碼或電郵");
    var student = null;
    if (input.indexOf("@") !== -1) {
      student = await Auth.findByEmail(input);
    } else {
      student = await Auth.findByLinkCode(input);
    }
    if (!student || student.role !== "學生") throw new Error("搵唔到呢個學生帳戶");
    return student;
  }

  async function renderLinkedStudents(containerId, role) {
    var box = $("#" + containerId);
    if (!box) return;
    var ids = await DB.getLinkedStudentIds(state.user.id, role);
    if (!ids.length) {
      box.innerHTML = '<div class="empty-state">未有連結學生<br/>用上面輸入框加入</div>';
      return;
    }
    box.innerHTML = "";
    for (var i = 0; i < ids.length; i++) {
      var sid = ids[i];
      var stu = await Auth.findById(sid);
      if (!stu) continue;
      var an = await DB.getAnalytics(sid);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cat-item";
      btn.innerHTML =
        '<div class="cat-icon" style="background:#2b6cb0">👤</div>' +
        '<div class="cat-info"><h3>' + escapeHtml(stu.display_name) + "</h3>" +
        "<p>" + escapeHtml(stu.email) + " · 正確率 " + an.rate + "%</p></div>" +
        '<div class="cat-meta">' + an.total + " 次</div>";
      btn.addEventListener("click", function (id) {
        return function () {
          state.detailStudentId = id;
          showScreen("student-detail");
        };
      }(sid));
      box.appendChild(btn);
    }
  }

  async function renderStudentDetail() {
    var sid = state.detailStudentId;
    if (!sid) return;
    var stu = await Auth.findById(sid);
    if (!stu) return;
    $("#detail-name").textContent = stu.display_name;
    $("#detail-email").textContent = stu.email;
    var an = await DB.getAnalytics(sid);
    $("#detail-total").textContent = String(an.total);
    $("#detail-correct").textContent = String(an.correct);
    $("#detail-rate").textContent = an.rate + "%";

    var units = $("#detail-units");
    if (!an.byUnit.length) {
      units.innerHTML = '<p class="hint-text">未有練習數據</p>';
    } else {
      units.innerHTML = an.byUnit.map(function (u) {
        return '<div class="unit-row"><span>' + escapeHtml(u.unit) +
          '</span><span class="unit-rate">' + u.rate + "%（" + u.correct + "/" + u.total + "）</span></div>";
      }).join("");
    }

    var recent = $("#detail-recent");
    if (!an.recent.length) {
      recent.innerHTML = '<p class="hint-text">未有記錄</p>';
    } else {
      recent.innerHTML = an.recent.map(function (a) {
        var t = new Date(a.created_at).toLocaleString("zh-HK", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
        return '<div class="attempt-row">' +
          '<span class="' + (a.correct ? "ok" : "bad") + '">' + (a.correct ? "✓" : "✗") + "</span> " +
          escapeHtml(a.word || a.mode) + " · " + escapeHtml(a.mode) +
          '<span class="attempt-time">' + t + "</span></div>";
      }).join("");
    }

    var notesCard = $("#detail-notes-card");
    var isTherapist = state.user.role === "言語治療師";
    notesCard.classList.toggle("hidden", !isTherapist);
    if (isTherapist) {
      var note = await DB.getNote(state.user.id, sid);
      $("#detail-notes").value = note ? note.body : "";
    }
  }

  /* —— Practice —— */
  function renderPracticeScreen() {
    if (state.practiceView === "catalog") {
      $("#practice-catalog-view").classList.remove("hidden");
      $("#practice-drill-view").classList.add("hidden");
      renderCatalog();
    } else {
      $("#practice-catalog-view").classList.add("hidden");
      $("#practice-drill-view").classList.remove("hidden");
      renderPractice();
    }
  }

  function renderCatalog() {
    var list = $("#catalog-list");
    if (!list) return;
    list.innerHTML = "";
    DATA.categories.forEach(function (cat) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cat-item";
      btn.innerHTML =
        '<div class="cat-icon" style="background:' + cat.color + '">' + cat.icon + "</div>" +
        '<div class="cat-info"><h3>' + cat.title + "</h3><p>" + cat.subtitle + "</p></div>" +
        '<div class="cat-meta">' + cat.words.length + " 詞</div>";
      btn.addEventListener("click", function () {
        state.categoryId = cat.id;
        state.wordIndex = 0;
        state.awaitingNext = false;
        state.practiceView = "drill";
        renderPracticeScreen();
      });
      list.appendChild(btn);
    });
  }

  function fillCategorySelect() {
    var sel = $("#practice-cat");
    if (!sel) return;
    if (!sel.options.length) {
      DATA.categories.forEach(function (c) {
        var opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.icon + " " + c.title;
        sel.appendChild(opt);
      });
      sel.addEventListener("change", function () {
        state.categoryId = sel.value;
        state.wordIndex = 0;
        state.awaitingNext = false;
        renderPractice();
      });
    }
    sel.value = state.categoryId;
  }

  function updateProgressBar() {
    var words = currentWords();
    var pct = words.length ? (state.wordIndex / words.length) * 100 : 0;
    var fill = $("#practice-progress-fill");
    var label = $("#practice-progress-label");
    if (fill) fill.style.width = Math.min(100, pct) + "%";
    if (label)
      label.textContent =
        "第 " + (state.wordIndex + 1) + " / " + words.length + " 個　｜　今次答對 " +
        state.sessionCorrect + "/" + state.sessionTotal;
  }

  function setMode(mode) {
    state.mode = mode;
    state.awaitingNext = false;
    $all(".mode-chip").forEach(function (chip) {
      chip.classList.toggle("active", chip.dataset.mode === mode);
    });
    renderPractice();
  }

  function nextWord() {
    var words = currentWords();
    state.wordIndex = (state.wordIndex + 1) % words.length;
    state.awaitingNext = false;
    if (state.wordIndex === 0) showToast("已完成本單元一輪！");
    renderPractice();
  }

  function renderPractice() {
    fillCategorySelect();
    $all(".mode-chip").forEach(function (chip) {
      chip.classList.toggle("active", chip.dataset.mode === state.mode);
    });
    var card = $("#practice-card");
    if (!card) return;
    var word = currentWord();
    var cat = getCategory(state.categoryId);
    updateProgressBar();

    if (state.mode === "listen") {
      card.innerHTML =
        (word.tone ? '<div class="tone-badge">第 ' + word.tone + " 聲</div>" : "") +
        '<div class="word-char">' + word.char + "</div>" +
        '<div class="word-jyutping">' + word.jyutping + "</div>" +
        '<div class="word-meaning">' + word.meaning + "</div>" +
        (word.tip ? '<div class="word-tip">💡 ' + word.tip + "</div>" : "") +
        '<div class="btn-row">' +
        '<button type="button" class="btn btn-primary" id="btn-speak">🔊 聽讀音</button>' +
        '<button type="button" class="btn btn-outline btn-sm" id="btn-next">下一個 →</button></div>';
      $("#btn-speak").addEventListener("click", function () {
        speak(word.char);
        logAttempt(cat.id, word.char, "listen", true, 1);
      });
      $("#btn-next").addEventListener("click", nextWord);
    } else if (state.mode === "read") {
      card.innerHTML =
        '<p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:8px;">請大聲朗讀以下字詞</p>' +
        '<div class="word-char">' + word.char + "</div>" +
        '<div class="word-jyutping">' + word.jyutping + "</div>" +
        '<div class="word-meaning">' + word.meaning + "</div>" +
        (word.tip ? '<div class="word-tip">💡 ' + word.tip + "</div>" : "") +
        '<div class="btn-row" style="flex-direction:column;">' +
        '<button type="button" class="btn btn-ghost btn-sm" id="btn-hint-speak">先聽一次示範</button>' +
        '<button type="button" class="btn btn-accent" id="btn-done-read">✅ 我讀完</button></div>' +
        '<div class="feedback" id="read-feedback"></div>';
      $("#btn-hint-speak").addEventListener("click", function () { speak(word.char); });
      $("#btn-done-read").addEventListener("click", function () {
        logAttempt(cat.id, word.char, "read", true, 1);
        state.sessionTotal += 1;
        state.sessionCorrect += 1;
        var fb = $("#read-feedback");
        fb.className = "feedback ok";
        fb.textContent = "做得好！再聽一次對照：";
        speak(word.char);
        updateProgressBar();
        setTimeout(nextWord, 1600);
      });
    } else if (state.mode === "choice") {
      renderChoiceMode(card, word, cat);
    } else if (state.mode === "tone") {
      renderToneMode(card, word, cat);
    }
  }

  function renderChoiceMode(card, word, cat) {
    var distractors = shuffle(uniqueJyutpings(word.jyutping)).slice(0, 3);
    var options = shuffle([word.jyutping].concat(distractors));
    card.innerHTML =
      '<p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:8px;">邊個係正確粵拼？</p>' +
      '<div class="word-char">' + word.char + "</div>" +
      '<div class="word-meaning">' + word.meaning + "</div>" +
      '<div class="choice-list" id="choice-list"></div>' +
      '<div class="feedback" id="choice-feedback"></div>';
    var list = $("#choice-list");
    options.forEach(function (opt) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "choice-btn";
      b.textContent = opt;
      b.addEventListener("click", function () {
        if (state.awaitingNext) return;
        state.awaitingNext = true;
        var ok = opt === word.jyutping;
        state.sessionTotal += 1;
        if (ok) state.sessionCorrect += 1;
        logAttempt(cat.id, word.char, "choice", ok, ok ? 1 : 0);
        $all(".choice-btn", list).forEach(function (x) {
          x.disabled = true;
          if (x.textContent === word.jyutping) x.classList.add("correct");
        });
        if (!ok) b.classList.add("wrong");
        var fb = $("#choice-feedback");
        fb.className = "feedback " + (ok ? "ok" : "bad");
        fb.textContent = ok ? "答對啦！👍" : "唔啱——正確係 " + word.jyutping;
        updateProgressBar();
        setTimeout(nextWord, ok ? 900 : 1600);
      });
      list.appendChild(b);
    });
  }

  function renderToneMode(card, word, cat) {
    if (word.tone == null) {
      var others = shuffle(
        currentWords().filter(function (w) { return w.char !== word.char; }).map(function (w) { return w.meaning; })
      ).slice(0, 3);
      var options = shuffle([word.meaning].concat(others));
      card.innerHTML =
        '<p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:8px;">呢個詞嘅意思係？</p>' +
        '<div class="word-char">' + word.char + "</div>" +
        '<div class="word-jyutping">' + word.jyutping + "</div>" +
        '<button type="button" class="btn btn-ghost btn-sm" id="btn-tone-speak" style="margin:8px 0;">🔊 聽讀音</button>' +
        '<div class="choice-list" id="choice-list"></div><div class="feedback" id="choice-feedback"></div>';
      $("#btn-tone-speak").addEventListener("click", function () { speak(word.char); });
      wireChoices($("#choice-list"), options, word.meaning, function (ok) {
        state.sessionTotal += 1;
        if (ok) state.sessionCorrect += 1;
        logAttempt(cat.id, word.char, "meaning", ok, ok ? 1 : 0);
        updateProgressBar();
        setTimeout(nextWord, ok ? 900 : 1600);
      });
      return;
    }
    var tones = shuffle([1, 2, 3, 4, 5, 6]).slice(0, 3);
    if (tones.indexOf(word.tone) === -1) tones[0] = word.tone;
    var opts = shuffle(tones);
    card.innerHTML =
      '<p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:8px;">聽完／睇完，揀正確聲調</p>' +
      '<div class="word-char">' + word.char + "</div>" +
      '<div class="word-jyutping" style="opacity:0.35;font-size:1rem;">粵拼已隱藏</div>' +
      '<div class="word-meaning">' + word.meaning + "</div>" +
      '<button type="button" class="btn btn-primary btn-sm" id="btn-tone-speak" style="margin:10px 0;">🔊 聽讀音</button>' +
      '<div class="choice-list" id="choice-list"></div><div class="feedback" id="choice-feedback"></div>';
    $("#btn-tone-speak").addEventListener("click", function () { speak(word.char); });
    var labels = opts.map(function (t) { return "第 " + t + " 聲"; });
    var correctLabel = "第 " + word.tone + " 聲";
    wireChoices($("#choice-list"), labels, correctLabel, function (ok) {
      state.sessionTotal += 1;
      if (ok) state.sessionCorrect += 1;
      logAttempt(cat.id, word.char, "tone", ok, ok ? 1 : 0);
      updateProgressBar();
      setTimeout(nextWord, ok ? 900 : 1600);
    });
  }

  function wireChoices(list, options, correct, onDone) {
    options.forEach(function (opt) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "choice-btn";
      b.textContent = opt;
      b.addEventListener("click", function () {
        if (state.awaitingNext) return;
        state.awaitingNext = true;
        var ok = opt === correct;
        $all(".choice-btn", list).forEach(function (x) {
          x.disabled = true;
          if (x.textContent === correct) x.classList.add("correct");
        });
        if (!ok) b.classList.add("wrong");
        var fb = $("#choice-feedback");
        fb.className = "feedback " + (ok ? "ok" : "bad");
        fb.textContent = ok ? "答對啦！👍" : "唔啱——正確係 " + correct;
        onDone(ok);
      });
      list.appendChild(b);
    });
  }

  /* —— Scenarios —— */
  function renderScenariosScreen() {
    if (!state.scenarioId) {
      $("#scenario-list-view").classList.remove("hidden");
      $("#scenario-play-view").classList.add("hidden");
      var list = $("#scenario-list");
      list.innerHTML = "";
      DATA.scenarios.forEach(function (sc) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cat-item";
        btn.innerHTML =
          '<div class="cat-icon" style="background:' + sc.color + '">' + sc.icon + "</div>" +
          '<div class="cat-info"><h3>' + sc.title + "</h3><p>" + sc.subtitle + "</p></div>" +
          '<div class="cat-meta">' + sc.lines.length + " 句</div>";
        btn.addEventListener("click", function () {
          state.scenarioId = sc.id;
          state.scenarioLine = 0;
          renderScenariosScreen();
        });
        list.appendChild(btn);
      });
    } else {
      $("#scenario-list-view").classList.add("hidden");
      $("#scenario-play-view").classList.remove("hidden");
      renderScenarioPlay();
    }
  }

  function getScenario() {
    return DATA.scenarios.find(function (s) { return s.id === state.scenarioId; });
  }

  function renderScenarioPlay() {
    var sc = getScenario();
    if (!sc) return;
    $("#scenario-title").textContent = sc.icon + " " + sc.title;
    $("#scenario-subtitle").textContent = sc.subtitle;
    var line = sc.lines[state.scenarioLine];
    var pct = (state.scenarioLine / sc.lines.length) * 100;
    $("#scenario-progress-fill").style.width = pct + "%";
    $("#scenario-progress-label").textContent =
      "第 " + (state.scenarioLine + 1) + " / " + sc.lines.length + " 句";

    var card = $("#scenario-card");
    card.innerHTML =
      '<div class="speaker-badge">' + escapeHtml(line.speaker) + "</div>" +
      '<div class="word-char" style="font-size:1.8rem;">' + escapeHtml(line.text) + "</div>" +
      '<div class="word-jyutping">' + escapeHtml(line.jyutping) + "</div>" +
      '<div class="word-meaning">' + escapeHtml(line.meaning) + "</div>" +
      '<div class="btn-row" style="flex-direction:column;margin-top:16px;">' +
      '<button type="button" class="btn btn-primary" id="btn-sc-speak">🔊 聽呢句</button>' +
      '<button type="button" class="btn btn-accent" id="btn-sc-done">✅ 我跟讀完</button>' +
      '<button type="button" class="btn btn-outline btn-sm" id="btn-sc-next">下一句 →</button></div>';

    $("#btn-sc-speak").addEventListener("click", function () { speak(line.text); });
    $("#btn-sc-done").addEventListener("click", function () {
      logAttempt("情景:" + sc.title, line.text, "scenario", true, 1);
      showToast("記低練習！");
      speak(line.text);
    });
    $("#btn-sc-next").addEventListener("click", function () {
      if (state.scenarioLine >= sc.lines.length - 1) {
        showToast("完成「" + sc.title + "」情景！");
        state.scenarioId = null;
        renderScenariosScreen();
      } else {
        state.scenarioLine += 1;
        renderScenarioPlay();
      }
    });
  }

  /* —— Quiz (recording) —— */
  function renderQuizScreen() {
    if (!state.quizId) {
      $("#quiz-list-view").classList.remove("hidden");
      $("#quiz-play-view").classList.add("hidden");
      var list = $("#quiz-list");
      list.innerHTML = "";
      DATA.quizSentences.forEach(function (q, i) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cat-item";
        btn.innerHTML =
          '<div class="cat-icon" style="background:#9B59B6">' + (i + 1) + "</div>" +
          '<div class="cat-info"><h3>' + escapeHtml(q.text) + "</h3><p>重點：" + escapeHtml(q.focus) + "</p></div>";
        btn.addEventListener("click", function () {
          clearQuizBlob();
          state.quizId = q.id;
          renderQuizScreen();
        });
        list.appendChild(btn);
      });
    } else {
      $("#quiz-list-view").classList.add("hidden");
      $("#quiz-play-view").classList.remove("hidden");
      renderQuizPlay();
    }
  }

  function getQuiz() {
    return DATA.quizSentences.find(function (q) { return q.id === state.quizId; });
  }

  function clearQuizBlob() {
    if (state.quizBlobUrl) {
      URL.revokeObjectURL(state.quizBlobUrl);
      state.quizBlobUrl = null;
    }
    state.quizBlob = null;
    state.recordingChunks = [];
    state.isRecording = false;
    if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") {
      try { state.mediaRecorder.stop(); } catch (e) { /* ignore */ }
    }
    state.mediaRecorder = null;
  }

  function renderQuizPlay() {
    var q = getQuiz();
    if (!q) return;
    var card = $("#quiz-card");
    var hasRec = !!state.quizBlob;

    card.innerHTML =
      '<p class="hint-text">請大聲朗讀：</p>' +
      '<div class="word-char" style="font-size:1.6rem;">' + escapeHtml(q.text) + "</div>" +
      '<div class="word-jyutping">' + escapeHtml(q.jyutping) + "</div>" +
      '<div class="word-tip">重點：' + escapeHtml(q.focus) + "</div>" +
      '<button type="button" class="btn btn-ghost btn-sm" id="btn-quiz-demo" style="margin-bottom:10px;">🔊 聽示範</button>' +
      '<div class="record-area">' +
      '<button type="button" class="btn ' + (state.isRecording ? "btn-danger" : "btn-primary") + '" id="btn-record">' +
      (state.isRecording ? "⏹ 停止錄音" : "🎙️ 開始錄音") + "</button>" +
      (hasRec
        ? '<audio id="quiz-audio" controls src="' + state.quizBlobUrl + '" style="width:100%;margin-top:10px;"></audio>'
        : '<p class="hint-text" style="margin-top:8px;">未有錄音</p>') +
      "</div>" +
      '<div class="checklist" id="quiz-checklist">' +
      "<p class=\"section-label\" style=\"margin-top:14px;\">自評檢查表</p>" +
      q.checklist.map(function (c, i) {
        return '<label class="check-item"><input type="checkbox" data-ci="' + i + '" /> ' + escapeHtml(c) + "</label>";
      }).join("") +
      "</div>" +
      '<button type="button" class="btn btn-accent" id="btn-quiz-save" style="margin-top:14px;" ' +
      (hasRec ? "" : "disabled") + ">💾 儲存本次測驗</button>";

    $("#btn-quiz-demo").addEventListener("click", function () { speak(q.text); });
    $("#btn-record").addEventListener("click", toggleRecording);
    $("#btn-quiz-save").addEventListener("click", saveQuizAttempt);
  }

  async function toggleRecording() {
    if (state.isRecording) {
      if (state.mediaRecorder) state.mediaRecorder.stop();
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast("呢個瀏覽器唔支援錄音（請用 HTTPS 或 localhost）");
      return;
    }
    try {
      var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      var mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      var mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      state.recordingChunks = [];
      state.mediaRecorder = mr;
      mr.ondataavailable = function (ev) {
        if (ev.data && ev.data.size) state.recordingChunks.push(ev.data);
      };
      mr.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        state.isRecording = false;
        var blob = new Blob(state.recordingChunks, { type: mr.mimeType || "audio/webm" });
        if (state.quizBlobUrl) URL.revokeObjectURL(state.quizBlobUrl);
        state.quizBlob = blob;
        state.quizBlobUrl = URL.createObjectURL(blob);
        renderQuizPlay();
        showToast("錄音完成，可以重播");
      };
      mr.start();
      state.isRecording = true;
      renderQuizPlay();
      showToast("錄音中…再撳一次停止");
    } catch (err) {
      showToast("無法開咪：請允許麥克風權限");
    }
  }

  async function saveQuizAttempt() {
    var q = getQuiz();
    if (!q || !state.quizBlob) {
      showToast("請先錄音");
      return;
    }
    var checks = $all("#quiz-checklist input[type=checkbox]");
    var checked = checks.filter(function (c) { return c.checked; }).length;
    var score = checks.length ? checked / checks.length : 0;
    var ok = score >= 0.6;
    var attempt = await logAttempt("錄音測驗", q.text, "quiz", ok, Math.round(score * 100), {
      checklistScore: checked + "/" + checks.length,
      quizId: q.id,
    });
    if (attempt && state.user) {
      try {
        await DB.saveRecording(attempt.id, state.user.id, state.quizBlob, state.quizBlob.type);
      } catch (e) {
        showToast("進度已存；錄音可能超出本機配額");
      }
    }
    showToast("已儲存：自評 " + checked + "/" + checks.length);
    clearQuizBlob();
    state.quizId = null;
    renderQuizScreen();
  }

  /* —— Me —— */
  function renderMe() {
    var u = state.user;
    if (!u) return;
    $("#me-name").textContent = u.display_name;
    $("#me-email").textContent = u.email;
    $("#me-role").textContent = u.role;
    $("#me-auth-mode").textContent = Auth.mode;
    var codeWrap = $("#me-link-code-wrap");
    if (u.role === "學生") {
      codeWrap.classList.remove("hidden");
      $("#me-link-code").textContent = u.link_code || "—";
    } else {
      codeWrap.classList.add("hidden");
    }
    var tips = $("#tips-list");
    if (tips && !tips.dataset.rendered) {
      tips.innerHTML = "";
      DATA.tips.forEach(function (t, i) {
        var div = document.createElement("div");
        div.className = "tip-card";
        div.style.marginBottom = "8px";
        div.innerHTML = "<h3>" + (i + 1) + ". " + t.title + "</h3><p>" + t.body + "</p>";
        tips.appendChild(div);
      });
      tips.dataset.rendered = "1";
    }
  }

  async function downloadProgress() {
    if (!state.user) return;
    var attempts = await DB.getAttemptsForStudent(state.user.id, 1000);
    var an = await DB.getAnalytics(state.user.id);
    var json = JSON.stringify({
      exportedAt: new Date().toISOString(),
      app: DATA.appName,
      version: DATA.version,
      user: { email: state.user.email, role: state.user.role, display_name: state.user.display_name },
      summary: an,
      attempts: attempts,
    }, null, 2);
    var blob = new Blob([json], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "yue-progress-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("已匯出進度 JSON");
  }

  /* —— Clock —— */
  function tickClock() {
    var el = $("#status-time");
    if (!el) return;
    var now = new Date();
    el.textContent =
      String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  }

  /* —— Init —— */
  function init() {
    tickClock();
    setInterval(tickClock, 30000);

    $all(".auth-tab").forEach(function (t) {
      t.addEventListener("click", function () {
        state.authTab = t.dataset.authTab;
        renderAuth();
      });
    });
    $("#auth-form").addEventListener("submit", handleAuthSubmit);

    $all(".tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.classList.contains("hidden")) return;
        if (btn.dataset.screen === "practice") state.practiceView = "catalog";
        if (btn.dataset.screen === "scenarios") state.scenarioId = null;
        if (btn.dataset.screen === "quiz") { clearQuizBlob(); state.quizId = null; }
        showScreen(btn.dataset.screen);
      });
    });

    $all("[data-go]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var go = btn.getAttribute("data-go");
        if (go === "scenarios") state.scenarioId = null;
        if (go === "quiz") { clearQuizBlob(); state.quizId = null; }
        showScreen(go);
      });
    });

    $("#btn-start").addEventListener("click", function () {
      state.practiceView = "catalog";
      state.sessionCorrect = 0;
      state.sessionTotal = 0;
      showScreen("practice");
    });

    $("#btn-back-catalog").addEventListener("click", function () {
      state.practiceView = "catalog";
      renderPracticeScreen();
    });
    $("#btn-back-scenarios").addEventListener("click", function () {
      state.scenarioId = null;
      renderScenariosScreen();
    });
    $("#btn-back-quiz").addEventListener("click", function () {
      clearQuizBlob();
      state.quizId = null;
      renderQuizScreen();
    });
    $("#btn-back-home").addEventListener("click", function () {
      showScreen("home");
    });

    $all(".mode-chip").forEach(function (chip) {
      chip.addEventListener("click", function () { setMode(chip.dataset.mode); });
    });

    $("#btn-parent-link").addEventListener("click", async function () {
      try {
        var stu = await resolveStudentRef($("#parent-link-input").value);
        await DB.linkParentToStudent(state.user.id, stu.id);
        $("#parent-link-input").value = "";
        showToast("已連結 " + stu.display_name);
        renderHome();
      } catch (e) {
        showToast(e.message);
      }
    });

    $("#btn-therapist-link").addEventListener("click", async function () {
      try {
        var stu = await resolveStudentRef($("#therapist-link-input").value);
        await DB.linkTherapistToStudent(state.user.id, stu.id);
        $("#therapist-link-input").value = "";
        showToast("已連結 " + stu.display_name);
        renderHome();
      } catch (e) {
        showToast(e.message);
      }
    });

    $("#btn-save-note").addEventListener("click", async function () {
      if (state.user.role !== "言語治療師" || !state.detailStudentId) return;
      await DB.saveNote(state.user.id, state.detailStudentId, $("#detail-notes").value);
      showToast("筆記已儲存");
    });

    $("#btn-export").addEventListener("click", downloadProgress);
    $("#btn-reset").addEventListener("click", async function () {
      if (!confirm("確定清除呢個帳戶喺本機嘅練習記錄？（帳戶本身會保留）")) return;
      // 只清 attempts（簡化：重寫成過濾非本學生）
      try {
        var raw = localStorage.getItem("yue_attempts_v1");
        var rows = raw ? JSON.parse(raw) : [];
        rows = rows.filter(function (a) { return a.student_id !== state.user.id; });
        localStorage.setItem("yue_attempts_v1", JSON.stringify(rows));
        showToast("已清除練習記錄");
        renderHome();
      } catch (e) {
        showToast("清除失敗");
      }
    });

    $("#btn-logout").addEventListener("click", async function () {
      await Auth.logout();
      clearQuizBlob();
      setLoggedInUI(null);
      showToast("已登出");
    });

    // 啟動：await Auth.getSession()（supabase 同 mock 都係 Promise）
    Auth.getSession()
      .then(function (user) {
        setLoggedInUI(user || null);
      })
      .catch(function (err) {
        console.warn("session check failed", err);
        setLoggedInUI(null);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
