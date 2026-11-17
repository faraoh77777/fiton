/* FITON 공통 기능 — 폰 앱(shorts.js)과 PC 앱(pc.js)이 함께 쓴다(2026-11-06 사용자 결정: 공통 기능은 공통 파일로 분리).
   프로필·PIN, 저장(localStorage / IndexedDB), 이미지 변환, 입히기 서버 호출처럼 화면과 상관없는 것만 둔다.
   저장 형식을 바꾸면 폰과 PC가 같은 데이터를 못 읽게 되므로 키 이름과 구조를 함부로 바꾸지 말 것. */
(function () {
  'use strict';

  var KEY = 'fit-test-v1';                 /* 프로필별 데이터는 KEY + ':' + 사용자 id */
  var USERS_KEY = 'fit-users-v1', CUR_KEY = 'fit-current-user';

  /* ---------- 프로필(이 기기 안 로그인) ---------- */
  function readUsers() { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch (e) { return []; } }
  function writeUsers(list) { try { localStorage.setItem(USERS_KEY, JSON.stringify(list)); } catch (e) { /* 저장 불가 */ } }
  function userById(id) { return readUsers().filter(function (u) { return u.id === id; })[0] || null; }
  /* 같은 기기를 쓰는 사람끼리 구분하는 잠금용. http(192.168…)에서도 돌아가도록 crypto.subtle 없이 계산한다 */
  function pinHash(salt, pin) {
    var s = salt + ':' + pin, a = 0x811c9dc5, b = 5381;
    for (var r = 0; r < 2000; r++) {
      for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); a = Math.imul(a ^ c, 16777619) >>> 0; b = (Math.imul(b, 33) + c) >>> 0; }
      s = a.toString(36) + b.toString(36) + salt;
    }
    return s;
  }

  /* ---------- IndexedDB (아바타·옷 사진·입은 모습) ---------- */
  var dbp = null;
  function db() {
    if (!dbp) dbp = new Promise(function (res, rej) {
      try {
        var rq = indexedDB.open('fit-test', 1);
        rq.onupgradeneeded = function () { rq.result.createObjectStore('blobs'); };
        rq.onsuccess = function () { res(rq.result); };
        rq.onerror = function () { rej(rq.error); };
      } catch (e) { rej(e); }
    });
    return dbp;
  }
  function idb(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var tx = d.transaction('blobs', mode), st = tx.objectStore('blobs'), rq = fn(st);
        tx.oncomplete = function () { res(rq && rq.result); };
        tx.onerror = function () { rej(tx.error); };
        tx.onabort = function () { rej(tx.error || new Error('저장 취소')); };
      });
    });
  }
  function rawGet(k) { return idb('readonly', function (s) { return s.get(k); }).catch(function () { return null; }); }
  function rawPut(k, v) { return idb('readwrite', function (s) { return s.put(v, k); }); }
  function rawDel(k) { return idb('readwrite', function (s) { return s.delete(k); }); }

  /* ---------- 이미지 ---------- */
  function shrink(file, max, quality) {
    return new Promise(function (res, rej) {
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        var cx = c.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height); /* 투명 PNG 가 JPEG 로 바뀔 때 검게 되지 않게 흰 바탕 */
        cx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(u);
        c.toBlob(function (b) { b ? res(b) : rej(new Error('변환 실패')); }, 'image/jpeg', quality);
      };
      img.onerror = function () { URL.revokeObjectURL(u); rej(new Error('이미지를 읽을 수 없습니다')); };
      img.src = u;
    });
  }
  function blobToDataUrl(b) {
    return new Promise(function (res) { var f = new FileReader(); f.onload = function () { res(f.result); }; f.readAsDataURL(b); });
  }
  /* 어떤 사진이든 Kling 입력 규격에 맞춘다: 짧은 변 300px 이상, 비율 1:2.5~2.5:1, JPG/PNG, 서버 용량 상한 이내.
     이미 맞으면 그대로 두고, 작으면 키우고(흐려질 수 있음), 크면 줄이고, 길쭉하면 흰 여백을 붙인다 */
  function klingSafe(u) {
    return new Promise(function (res) {
      var img = new Image();
      img.onload = function () {
        var w = img.width, h = img.height, mn = Math.min(w, h), mx = Math.max(w, h);
        if (mn >= 300 && mx / mn <= 2.5 && mx <= 2048 && /^data:image\/(jpeg|png);/.test(u) && u.length < 3500000) { res(u); return; }
        var pw = Math.max(w, h / 2.4), ph = Math.max(h, w / 2.4), pmn = Math.min(pw, ph), pmx = Math.max(pw, ph);
        var k = pmn < 320 ? 320 / pmn : (pmx > 2048 ? 2048 / pmx : 1);
        var c = document.createElement('canvas'); c.width = Math.ceil(pw * k); c.height = Math.ceil(ph * k);
        var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingQuality = 'high';
        g.drawImage(img, Math.round((c.width - w * k) / 2), Math.round((c.height - h * k) / 2), w * k, h * k);
        res(c.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = function () { res(u); };
      img.src = u;
    });
  }

  /* ---------- 입히기 서버 ---------- */
  function deviceId() {
    try {
      var d = localStorage.getItem('fit-device');
      if (!d) { d = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); localStorage.setItem('fit-device', d); }
      return d;
    } catch (e) { return 'tmp' + Math.random().toString(16).slice(2) + Date.now().toString(16); }
  }
  function genEnabled() { var c = window.TRYON_CFG; return !!(c && c.enabled && c.url && c.anon); }
  function genCall(body) {
    var c = window.TRYON_CFG;
    return fetch(c.url.replace(/\/$/, '') + '/functions/v1/tryon', {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: c.anon, Authorization: 'Bearer ' + c.anon }, body: JSON.stringify(body)
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); });
  }
  /* 서버가 준 base64 이미지를 Blob 으로 */
  function imageBlob(j) {
    var bin = atob(j.image), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return new Blob([u], { type: j.mime || 'image/png' });
  }

  window.FitCore = {
    KEY: KEY, USERS_KEY: USERS_KEY, CUR_KEY: CUR_KEY,
    readUsers: readUsers, writeUsers: writeUsers, userById: userById, pinHash: pinHash,
    rawGet: rawGet, rawPut: rawPut, rawDel: rawDel,
    shrink: shrink, blobToDataUrl: blobToDataUrl, klingSafe: klingSafe,
    deviceId: deviceId, genEnabled: genEnabled, genCall: genCall, imageBlob: imageBlob
  };
})();
