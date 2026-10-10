/**
 * 輕鬆學發音 — 主程式
 * 純靜態：Web Speech API + localStorage，無需後端
 */
(function () {
  "use strict";

  const DATA = window.APP_DATA;
  const STORAGE_KEY = "yue_pronunciation_progress_v1";

  const state = {
    screen: "home",
    mode: "listen", // listen | read | choice | tone
    categoryId: DATA.categories[0].id,
    wordIndex: 0,
    sessionCorrect: 0,
    sessionTotal: 0,
    awaitingNext: false,
  };

  // —— Progress ——
  function defaultProgress() {
    return {
      version: 1,
      wordsPracticed: {}, // "catId|char" -> { count, lastAt, correct }
      totalAttempts: 0,
      totalCorrect: 0,
      lastSessionAt: null,
      lastCategoryId: DATA.categories[0].id,
      sessions: 0,
    };
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultProgress();
      const p = JSON.parse(raw);
      return Object.assign(defaultProgress(), p);
    } catch (e) {
      return defaultProgress();
    }
  }

  function saveProgress(p) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch (e) {
      /* quota / private mode */
    }
  }

  let progress = loadProgress();

  function recordAttempt(catId, word, correct) {
    const key = catId + "|" + word.char;
    const entry = progress.wordsPracticed[key] || { count: 0, correct: 0, lastAt: null };
    entry.count += 1;
    if (correct) entry.correct += 1;
    entry.lastAt = new Date().toISOString();
    progress.wordsPracticed[key] = entry;
    progress.totalAttempts += 1;
    if (correct) progress.totalCorrect += 1;
    progress.lastSessionAt = entry.lastAt;
    progress.lastCategoryId = catId;
    saveProgress(progress);
    updateHomeStats();
  }

  function startSessionFlag() {
    progress.sessions += 1;
    progress.lastSessionAt = new Date().toISOString();
    saveProgress(progress);
  }

  function exportProgressJSON() {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        app: DATA.appName,
        school: DATA.school,
        summary: {
          totalAttempts: progress.totalAttempts,
          totalCorrect: progress.totalCorrect,
          uniqueWords: Object.keys(progress.wordsPracticed).length,
          sessions: progress.sessions,
          lastSessionAt: progress.lastSessionAt,
        },
        wordsPracticed: progress.wordsPracticed,
      },
      null,
      2
    );
  }

  // —— TTS ——
  function pickVoice() {
    if (!window.speechSynthesis) return null;
    const voices = speechSynthesis.getVoices();
    const prefer = ["zh-HK", "zh-TW", "zh-CN", "zh"];
    for (const lang of prefer) {
      const v = voices.find(function (x) {
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
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-HK";
    const voice = pickVoice();
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang || "zh-HK";
    }
    u.rate = 0.85;
    u.pitch = 1;
    speechSynthesis.speak(u);
  }

  // Chrome 延遲載入 voices
  if (window.speechSynthesis) {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = function () {
      speechSynthesis.getVoices();
    };
  }

  // —— Helpers ——
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function showToast(msg) {
    let el = $("#toast");
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
    el._t = setTimeout(function () {
      el.style.opacity = "0";
    }, 2200);
  }

  function getCategory(id) {
    return DATA.categories.find(function (c) {
      return c.id === id;
    }) || DATA.categories[0];
  }

  function currentWords() {
    return getCategory(state.categoryId).words;
  }

  function currentWord() {
    const words = currentWords();
    if (state.wordIndex >= words.length) state.wordIndex = 0;
    return words[state.wordIndex];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function uniqueJyutpings(exclude) {
    const set = {};
    DATA.categories.forEach(function (c) {
      c.words.forEach(function (w) {
        if (w.jyutping !== exclude) set[w.jyutping] = true;
      });
    });
    return Object.keys(set);
  }

  // —— Navigation ——
  function showScreen(name) {
    state.screen = name;
    $all(".screen").forEach(function (el) {
      el.classList.toggle("active", el.dataset.screen === name);
    });
    $all(".tab-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.screen === name);
    });
    if (name === "home") updateHomeStats();
    if (name === "catalog") renderCatalog();
    if (name === "practice") renderPractice();
    if (name === "tips") renderTips();
  }

  // —— Home ——
  function updateHomeStats() {
    const unique = Object.keys(progress.wordsPracticed).length;
    const rate =
      progress.totalAttempts > 0
        ? Math.round((progress.totalCorrect / progress.totalAttempts) * 100)
        : 0;
    const elU = $("#stat-words");
    const elA = $("#stat-attempts");
    const elR = $("#stat-rate");
    if (elU) elU.textContent = String(unique);
    if (elA) elA.textContent = String(progress.totalAttempts);
    if (elR) elR.textContent = rate + "%";

    const last = $("#last-session");
    if (last) {
      if (progress.lastSessionAt) {
        try {
          const d = new Date(progress.lastSessionAt);
          last.textContent =
            "上次練習：" +
            d.toLocaleString("zh-HK", {
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
        } catch (e) {
          last.textContent = "上次練習：有記錄";
        }
      } else {
        last.textContent = "尚未開始練習——撳下面開始啦！";
      }
    }
  }

  function resetProgress() {
    if (!confirm("確定清除所有練習進度？")) return;
    progress = defaultProgress();
    saveProgress(progress);
    updateHomeStats();
    showToast("進度已清除");
  }

  function downloadProgress() {
    const json = exportProgressJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "yue-progress-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("已匯出進度 JSON");
  }

  // —— Catalog ——
  function renderCatalog() {
    const list = $("#catalog-list");
    if (!list) return;
    list.innerHTML = "";
    DATA.categories.forEach(function (cat) {
      const practiced = cat.words.filter(function (w) {
        return progress.wordsPracticed[cat.id + "|" + w.char];
      }).length;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cat-item";
      btn.innerHTML =
        '<div class="cat-icon" style="background:' +
        cat.color +
        '">' +
        cat.icon +
        "</div>" +
        '<div class="cat-info"><h3>' +
        cat.title +
        "</h3><p>" +
        cat.subtitle +
        "</p></div>" +
        '<div class="cat-meta">' +
        practiced +
        "/" +
        cat.words.length +
        "</div>";
      btn.addEventListener("click", function () {
        state.categoryId = cat.id;
        state.wordIndex = 0;
        state.awaitingNext = false;
        showScreen("practice");
      });
      list.appendChild(btn);
    });
  }

  // —— Practice ——
  function fillCategorySelect() {
    const sel = $("#practice-cat");
    if (!sel || sel.options.length) return;
    DATA.categories.forEach(function (c) {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.icon + " " + c.title;
      sel.appendChild(opt);
    });
    sel.value = state.categoryId;
    sel.addEventListener("change", function () {
      state.categoryId = sel.value;
      state.wordIndex = 0;
      state.awaitingNext = false;
      renderPractice();
    });
  }

  function updateProgressBar() {
    const words = currentWords();
    const pct = words.length ? ((state.wordIndex) / words.length) * 100 : 0;
    const fill = $("#practice-progress-fill");
    const label = $("#practice-progress-label");
    if (fill) fill.style.width = Math.min(100, pct) + "%";
    if (label)
      label.textContent =
        "第 " + (state.wordIndex + 1) + " / " + words.length + " 個　｜　今次答對 " +
        state.sessionCorrect +
        "/" +
        state.sessionTotal;
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
    const words = currentWords();
    state.wordIndex = (state.wordIndex + 1) % words.length;
    state.awaitingNext = false;
    if (state.wordIndex === 0) {
      showToast("已完成本單元一輪，再來一次！");
    }
    renderPractice();
  }

  function renderPractice() {
    fillCategorySelect();
    const sel = $("#practice-cat");
    if (sel) sel.value = state.categoryId;

    $all(".mode-chip").forEach(function (chip) {
      chip.classList.toggle("active", chip.dataset.mode === state.mode);
    });

    const card = $("#practice-card");
    if (!card) return;
    const word = currentWord();
    const cat = getCategory(state.categoryId);
    updateProgressBar();

    if (state.mode === "listen") {
      card.innerHTML =
        (word.tone
          ? '<div class="tone-badge">第 ' + word.tone + " 聲</div>"
          : "") +
        '<div class="word-char">' +
        word.char +
        "</div>" +
        '<div class="word-jyutping">' +
        word.jyutping +
        "</div>" +
        '<div class="word-meaning">' +
        word.meaning +
        "</div>" +
        (word.tip ? '<div class="word-tip">💡 ' + word.tip + "</div>" : "") +
        '<div class="btn-row">' +
        '<button type="button" class="btn btn-primary" id="btn-speak">🔊 聽讀音</button>' +
        '<button type="button" class="btn btn-outline btn-sm" id="btn-next">下一個 →</button>' +
        "</div>";
      $("#btn-speak").addEventListener("click", function () {
        speak(word.char);
        recordAttempt(cat.id, word, true);
      });
      $("#btn-next").addEventListener("click", nextWord);
    } else if (state.mode === "read") {
      card.innerHTML =
        '<p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:8px;">請大聲朗讀以下字詞</p>' +
        '<div class="word-char">' +
        word.char +
        "</div>" +
        '<div class="word-jyutping">' +
        word.jyutping +
        "</div>" +
        '<div class="word-meaning">' +
        word.meaning +
        "</div>" +
        (word.tip ? '<div class="word-tip">💡 ' + word.tip + "</div>" : "") +
        '<div class="btn-row" style="flex-direction:column;">' +
        '<button type="button" class="btn btn-ghost btn-sm" id="btn-hint-speak">先聽一次示範</button>' +
        '<button type="button" class="btn btn-accent" id="btn-done-read">✅ 我讀完</button>' +
        "</div>" +
        '<div class="feedback" id="read-feedback"></div>';
      $("#btn-hint-speak").addEventListener("click", function () {
        speak(word.char);
      });
      $("#btn-done-read").addEventListener("click", function () {
        recordAttempt(cat.id, word, true);
        state.sessionTotal += 1;
        state.sessionCorrect += 1;
        const fb = $("#read-feedback");
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
    const distractors = shuffle(uniqueJyutpings(word.jyutping)).slice(0, 3);
    const options = shuffle([word.jyutping].concat(distractors));
    card.innerHTML =
      '<p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:8px;">邊個係正確粵拼？</p>' +
      '<div class="word-char">' +
      word.char +
      "</div>" +
      '<div class="word-meaning">' +
      word.meaning +
      "</div>" +
      '<div class="choice-list" id="choice-list"></div>' +
      '<div class="feedback" id="choice-feedback"></div>';

    const list = $("#choice-list");
    options.forEach(function (opt) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice-btn";
      b.textContent = opt;
      b.addEventListener("click", function () {
        if (state.awaitingNext) return;
        state.awaitingNext = true;
        const ok = opt === word.jyutping;
        state.sessionTotal += 1;
        if (ok) state.sessionCorrect += 1;
        recordAttempt(cat.id, word, ok);
        $all(".choice-btn", list).forEach(function (x) {
          x.disabled = true;
          if (x.textContent === word.jyutping) x.classList.add("correct");
        });
        if (!ok) b.classList.add("wrong");
        const fb = $("#choice-feedback");
        fb.className = "feedback " + (ok ? "ok" : "bad");
        fb.textContent = ok
          ? "答對啦！👍"
          : "唔啱——正確係 " + word.jyutping;
        updateProgressBar();
        setTimeout(nextWord, ok ? 900 : 1600);
      });
      list.appendChild(b);
    });
  }

  function renderToneMode(card, word, cat) {
    // 只對有單音節聲調嘅詞做聲調題；否則改選意思
    if (word.tone == null) {
      const others = shuffle(
        currentWords()
          .filter(function (w) {
            return w.char !== word.char;
          })
          .map(function (w) {
            return w.meaning;
          })
      ).slice(0, 3);
      const options = shuffle([word.meaning].concat(others));
      card.innerHTML =
        '<p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:8px;">呢個詞嘅意思係？</p>' +
        '<div class="word-char">' +
        word.char +
        "</div>" +
        '<div class="word-jyutping">' +
        word.jyutping +
        "</div>" +
        '<button type="button" class="btn btn-ghost btn-sm" id="btn-tone-speak" style="margin:8px 0;">🔊 聽讀音</button>' +
        '<div class="choice-list" id="choice-list"></div>' +
        '<div class="feedback" id="choice-feedback"></div>';
      $("#btn-tone-speak").addEventListener("click", function () {
        speak(word.char);
      });
      wireChoices($("#choice-list"), options, word.meaning, function (ok) {
        state.sessionTotal += 1;
        if (ok) state.sessionCorrect += 1;
        recordAttempt(cat.id, word, ok);
        updateProgressBar();
        setTimeout(nextWord, ok ? 900 : 1600);
      });
      return;
    }

    const tones = shuffle([1, 2, 3, 4, 5, 6]).slice(0, 3);
    if (tones.indexOf(word.tone) === -1) tones[0] = word.tone;
    const options = shuffle(tones);
    card.innerHTML =
      '<p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:8px;">聽完／睇完，揀正確聲調</p>' +
      '<div class="word-char">' +
      word.char +
      "</div>" +
      '<div class="word-jyutping" style="opacity:0.35;font-size:1rem;">粵拼已隱藏</div>' +
      '<div class="word-meaning">' +
      word.meaning +
      "</div>" +
      '<button type="button" class="btn btn-primary btn-sm" id="btn-tone-speak" style="margin:10px 0;">🔊 聽讀音</button>' +
      '<div class="choice-list" id="choice-list"></div>' +
      '<div class="feedback" id="choice-feedback"></div>';

    $("#btn-tone-speak").addEventListener("click", function () {
      speak(word.char);
    });

    const labels = options.map(function (t) {
      return "第 " + t + " 聲";
    });
    const correctLabel = "第 " + word.tone + " 聲";
    wireChoices($("#choice-list"), labels, correctLabel, function (ok) {
      state.sessionTotal += 1;
      if (ok) state.sessionCorrect += 1;
      recordAttempt(cat.id, word, ok);
      updateProgressBar();
      setTimeout(nextWord, ok ? 900 : 1600);
    });
  }

  function wireChoices(list, options, correct, onDone) {
    options.forEach(function (opt) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice-btn";
      b.textContent = opt;
      b.addEventListener("click", function () {
        if (state.awaitingNext) return;
        state.awaitingNext = true;
        const ok = opt === correct;
        $all(".choice-btn", list).forEach(function (x) {
          x.disabled = true;
          if (x.textContent === correct) x.classList.add("correct");
        });
        if (!ok) b.classList.add("wrong");
        const fb = $("#choice-feedback");
        fb.className = "feedback " + (ok ? "ok" : "bad");
        fb.textContent = ok ? "答對啦！👍" : "唔啱——正確係 " + correct;
        onDone(ok);
      });
      list.appendChild(b);
    });
  }

  // —— Tips ——
  function renderTips() {
    const box = $("#tips-list");
    if (!box || box.dataset.rendered) return;
    box.innerHTML = "";
    DATA.tips.forEach(function (t, i) {
      const div = document.createElement("div");
      div.className = "tip-card";
      div.innerHTML = "<h3>" + (i + 1) + ". " + t.title + "</h3><p>" + t.body + "</p>";
      box.appendChild(div);
    });
    box.dataset.rendered = "1";
  }

  // —— Clock ——
  function tickClock() {
    const el = $("#status-time");
    if (!el) return;
    const now = new Date();
    el.textContent =
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0");
  }

  // —— Init ——
  function init() {
    tickClock();
    setInterval(tickClock, 30000);

    $all(".tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showScreen(btn.dataset.screen);
      });
    });

    const startBtn = $("#btn-start");
    if (startBtn) {
      startBtn.addEventListener("click", function () {
        startSessionFlag();
        state.categoryId = progress.lastCategoryId || DATA.categories[0].id;
        state.wordIndex = 0;
        state.sessionCorrect = 0;
        state.sessionTotal = 0;
        state.mode = "listen";
        showScreen("practice");
      });
    }

    $all(".mode-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        setMode(chip.dataset.mode);
      });
    });

    const exportBtn = $("#btn-export");
    if (exportBtn) exportBtn.addEventListener("click", downloadProgress);
    const resetBtn = $("#btn-reset");
    if (resetBtn) resetBtn.addEventListener("click", resetProgress);

    showScreen("home");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
