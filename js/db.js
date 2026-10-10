/**
 * DataService — 進度／連結／錄音 metadata
 * Mock：localStorage + IndexedDB（錄音 blob）
 * 之後可換成 Supabase tables（見 README schema）
 */
(function (global) {
  "use strict";

  var LINKS_KEY = "yue_links_v1";
  var ATTEMPTS_KEY = "yue_attempts_v1";
  var NOTES_KEY = "yue_notes_v1";
  var IDB_NAME = "yue_recordings_v1";
  var IDB_STORE = "blobs";

  function load(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (e) {
      return [];
    }
  }

  function save(key, arr) {
    try {
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (e) {
      console.warn("localStorage full or blocked", e);
    }
  }

  function id() {
    return "r_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  }

  /* —— IndexedDB for recordings —— */
  function openIDB() {
    return new Promise(function (resolve, reject) {
      if (!global.indexedDB) {
        reject(new Error("瀏覽器唔支援 IndexedDB"));
        return;
      }
      var req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  async function idbPut(record) {
    var db = await openIDB();
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(record);
      tx.oncomplete = function () { resolve(record.id); };
      tx.onerror = function () { reject(tx.error); };
    });
  }

  async function idbGet(rid) {
    var db = await openIDB();
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(IDB_STORE, "readonly");
      var req = tx.objectStore(IDB_STORE).get(rid);
      req.onsuccess = function () { resolve(req.result || null); };
      req.onerror = function () { reject(req.error); };
    });
  }

  var DataService = {
    /**
     * profiles 由 AuthService 管理
     * links: { id, therapist_id?, parent_id?, student_id, created_at }
     * attempts: { id, student_id, unit, word, mode, correct, score, note?, created_at }
     * notes: { id, therapist_id, student_id, body, created_at, updated_at }
     * recordings: IndexedDB { id, attempt_id, student_id, mime, blob, created_at }
     */

    /* —— Links —— */
    linkTherapistToStudent: function (therapistId, studentId) {
      var links = load(LINKS_KEY);
      var exists = links.some(function (l) {
        return l.therapist_id === therapistId && l.student_id === studentId;
      });
      if (exists) return Promise.resolve(null);
      var row = {
        id: id(),
        therapist_id: therapistId,
        parent_id: null,
        student_id: studentId,
        created_at: new Date().toISOString(),
      };
      links.push(row);
      save(LINKS_KEY, links);
      return Promise.resolve(row);
    },

    linkParentToStudent: function (parentId, studentId) {
      var links = load(LINKS_KEY);
      var exists = links.some(function (l) {
        return l.parent_id === parentId && l.student_id === studentId;
      });
      if (exists) return Promise.resolve(null);
      var row = {
        id: id(),
        therapist_id: null,
        parent_id: parentId,
        student_id: studentId,
        created_at: new Date().toISOString(),
      };
      links.push(row);
      save(LINKS_KEY, links);
      return Promise.resolve(row);
    },

    getLinkedStudentIds: function (userId, role) {
      var links = load(LINKS_KEY);
      var ids = [];
      links.forEach(function (l) {
        if (role === "言語治療師" && l.therapist_id === userId) ids.push(l.student_id);
        if (role === "家長" && l.parent_id === userId) ids.push(l.student_id);
      });
      return Promise.resolve(ids);
    },

    unlink: function (linkId) {
      var links = load(LINKS_KEY).filter(function (l) { return l.id !== linkId; });
      save(LINKS_KEY, links);
      return Promise.resolve(true);
    },

    getLinksForUser: function (userId, role) {
      var links = load(LINKS_KEY);
      return Promise.resolve(
        links.filter(function (l) {
          if (role === "言語治療師") return l.therapist_id === userId;
          if (role === "家長") return l.parent_id === userId;
          if (role === "學生") return l.student_id === userId;
          return false;
        })
      );
    },

    /* —— Attempts / practice_sessions —— */
    recordAttempt: function (attempt) {
      var rows = load(ATTEMPTS_KEY);
      var row = {
        id: id(),
        student_id: attempt.student_id,
        unit: attempt.unit || "",
        word: attempt.word || "",
        mode: attempt.mode || "practice",
        correct: !!attempt.correct,
        score: typeof attempt.score === "number" ? attempt.score : attempt.correct ? 1 : 0,
        meta: attempt.meta || null,
        created_at: new Date().toISOString(),
      };
      rows.push(row);
      // 保底：最多留最近 2000 筆
      if (rows.length > 2000) rows = rows.slice(-2000);
      save(ATTEMPTS_KEY, rows);
      return Promise.resolve(row);
    },

    getAttemptsForStudent: function (studentId, limit) {
      limit = limit || 200;
      var rows = load(ATTEMPTS_KEY)
        .filter(function (a) { return a.student_id === studentId; })
        .sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; });
      return Promise.resolve(rows.slice(0, limit));
    },

    getAnalytics: function (studentId) {
      return this.getAttemptsForStudent(studentId, 500).then(function (rows) {
        var byUnit = {};
        var total = rows.length;
        var correct = 0;
        rows.forEach(function (a) {
          if (a.correct) correct += 1;
          var u = a.unit || "其他";
          if (!byUnit[u]) byUnit[u] = { total: 0, correct: 0 };
          byUnit[u].total += 1;
          if (a.correct) byUnit[u].correct += 1;
        });
        var units = Object.keys(byUnit).map(function (k) {
          var x = byUnit[k];
          return {
            unit: k,
            total: x.total,
            correct: x.correct,
            rate: x.total ? Math.round((x.correct / x.total) * 100) : 0,
          };
        });
        units.sort(function (a, b) { return b.total - a.total; });
        return {
          total: total,
          correct: correct,
          rate: total ? Math.round((correct / total) * 100) : 0,
          byUnit: units,
          recent: rows.slice(0, 10),
        };
      });
    },

    /* —— Therapist notes —— */
    saveNote: function (therapistId, studentId, body) {
      var notes = load(NOTES_KEY);
      var existing = notes.find(function (n) {
        return n.therapist_id === therapistId && n.student_id === studentId;
      });
      var now = new Date().toISOString();
      if (existing) {
        existing.body = body;
        existing.updated_at = now;
      } else {
        notes.push({
          id: id(),
          therapist_id: therapistId,
          student_id: studentId,
          body: body,
          created_at: now,
          updated_at: now,
        });
      }
      save(NOTES_KEY, notes);
      return Promise.resolve(true);
    },

    getNote: function (therapistId, studentId) {
      var notes = load(NOTES_KEY);
      var n = notes.find(function (x) {
        return x.therapist_id === therapistId && x.student_id === studentId;
      });
      return Promise.resolve(n || null);
    },

    /* —— Recordings (blob in IndexedDB; metadata size note) —— */
    saveRecording: async function (attemptId, studentId, blob, mime) {
      // 注意：IndexedDB 有配額限制；長錄音可能失敗。演示用短句即可。
      var rid = id();
      await idbPut({
        id: rid,
        attempt_id: attemptId,
        student_id: studentId,
        mime: mime || blob.type || "audio/webm",
        blob: blob,
        size: blob.size || 0,
        created_at: new Date().toISOString(),
      });
      return rid;
    },

    getRecording: function (recordingId) {
      return idbGet(recordingId);
    },
  };

  global.DataService = DataService;
})(window);
