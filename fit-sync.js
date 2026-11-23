/* FITON 계정·서버 저장 (2026-11-20) — 지금은 모바일(m.html)만 읽는다. PC 는 따로 승인받은 뒤 연결한다.
   · 로그인: Supabase 이메일 + 비밀번호(supabase-js 없이 fetch). 로그인 정보는 localStorage 'fit-auth-v1'.
   · 기기 안 저장은 그대로 둔다: 계정의 자료는 프로필 id 'acc_<계정 id>' 로 예전과 같은 자리(localStorage 'fit-test-v1:<id>', IndexedDB 'fit-test'/'blobs' 의 '<id>:<종류>')에 있다.
     'fit-users-v1'(닉네임+PIN 프로필 목록)에는 아무것도 넣지 않는다 → PC 앱의 프로필 목록은 바뀌지 않는다.
   · 서버: 표 fiton_state(계정당 1줄, data = 위 localStorage 내용 그대로), 비공개 저장소 fiton-user 의 '<계정 id>/<종류>'(예: tryon:g3).
   · 순서: 로그인하면 먼저 내려받고(pull), 그 뒤에만 올린다(push). 두 기기가 같이 고치면 나중에 저장한 쪽이 남는다. */
(function () {
  'use strict';
  var Core = window.FitCore, AUTH_KEY = 'fit-auth-v1', META_KEY = 'fit-sync-v1', BUCKET = 'fiton-user';
  function cfg() { return window.TRYON_CFG || {}; }
  function base() { return String(cfg().url || '').replace(/\/$/, ''); }
  function jget(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  /* ---------- 로그인 정보 ---------- */
  var sess = jget(AUTH_KEY), onExpire = null;
  if (!sess || !sess.refresh || !sess.uid) sess = null;
  function keep(j) {
    /* 끝나는 때는 이 기기 시계로 계산한다(서버 시각을 그대로 쓰면 휴대폰 시계가 틀릴 때 어긋난다) */
    sess = { access: j.access_token, refresh: j.refresh_token, exp: Math.floor(Date.now() / 1000) + (Number(j.expires_in) || 3600), uid: j.user.id, email: j.user.email || '' };
    jset(AUTH_KEY, sess); return sess;
  }
  function drop() { sess = null; pulled = false; clearTimeout(pushT); try { localStorage.removeItem(AUTH_KEY); } catch (e) {} }
  function session() { return sess ? { uid: sess.uid, email: sess.email } : null; }
  function localId() { return sess ? 'acc_' + sess.uid : null; }

  function call(path, opt) {
    opt = opt || {};
    var hd = Object.assign({ apikey: cfg().anon }, opt.headers || {});
    if (opt.json !== undefined) hd['Content-Type'] = 'application/json';
    return fetch(base() + path, { method: opt.method || 'GET', headers: hd, body: opt.json !== undefined ? JSON.stringify(opt.json) : opt.body, keepalive: !!opt.keepalive });
  }
  function asJson(r) { return r.text().then(function (t) { var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {} return { ok: r.ok, status: r.status, j: j }; }); }
  /* 서버 답을 사람이 읽는 말로 */
  function say(res, kind) {
    var j = res.j || {}, c = j.error_code || j.code || j.error || '', m = String(j.msg || j.message || j.error_description || '');
    if (c === 'invalid_credentials' || /Invalid login/i.test(m)) return '이메일 또는 비밀번호가 맞지 않아요';
    if (c === 'email_not_confirmed' || /not confirmed/i.test(m)) return '가입 확인 메일의 링크를 먼저 눌러 주세요';
    if (c === 'user_already_exists' || c === 'email_exists' || /already registered/i.test(m)) return '이미 가입된 이메일이에요. 로그인해 주세요';
    if (c === 'weak_password' || /password/i.test(m) && res.status === 422) return '비밀번호가 너무 쉬워요. 8자 이상으로 다시 정해 주세요';
    if (c === 'same_password') return '전과 다른 비밀번호를 넣어 주세요';
    if (c === 'email_address_invalid' || c === 'validation_failed' || /invalid.*email|email.*invalid/i.test(m)) return '이메일 주소를 확인해 주세요';
    if (c === 'over_email_send_rate_limit' || c === 'over_request_rate_limit' || res.status === 429) return '요청이 많아요. 잠시 뒤에 다시 해 주세요';
    if (c === 'signup_disabled') return '지금은 가입을 받지 않아요';
    return (kind || '요청') + '에 실패했어요. 잠시 뒤에 다시 해 주세요';
  }
  var NET = '인터넷 연결을 확인해 주세요';
  function signUp(email, pw) {
    return call('/auth/v1/signup', { method: 'POST', json: { email: email, password: pw } }).then(asJson).then(function (r) {
      if (!r.ok) return { ok: false, err: say(r, '가입') };
      if (r.j && r.j.access_token) { keep(r.j); return { ok: true }; }
      return { ok: true, confirm: true }; /* 서버가 가입 확인 메일을 쓰도록 되어 있을 때 */
    }, function () { return { ok: false, err: NET }; });
  }
  function signIn(email, pw) {
    return call('/auth/v1/token?grant_type=password', { method: 'POST', json: { email: email, password: pw } }).then(asJson).then(function (r) {
      if (!r.ok || !r.j || !r.j.access_token) return { ok: false, err: say(r, '로그인') };
      keep(r.j); return { ok: true };
    }, function () { return { ok: false, err: NET }; });
  }
  function signOut() {
    var s = sess; drop();
    if (s) call('/auth/v1/logout?scope=local', { method: 'POST', headers: { Authorization: 'Bearer ' + s.access } }).catch(function () {});
  }
  function recover(email, back) {
    return call('/auth/v1/recover' + (back ? '?redirect_to=' + encodeURIComponent(back) : ''), { method: 'POST', json: { email: email } }).then(asJson).then(function (r) {
      return r.ok ? { ok: true } : { ok: false, err: say(r, '메일 보내기') };
    }, function () { return { ok: false, err: NET }; });
  }
  function setPassword(pw) {
    return token().then(function (t) { return call('/auth/v1/user', { method: 'PUT', headers: { Authorization: 'Bearer ' + t }, json: { password: pw } }); }).then(asJson).then(function (r) {
      return r.ok ? { ok: true } : { ok: false, err: say(r, '비밀번호 바꾸기') };
    }, function () { return { ok: false, err: NET }; });
  }
  /* 메일의 링크(가입 확인·비밀번호 다시 정하기)로 들어왔을 때 주소 뒤(#access_token=…)를 읽는다. 읽은 뒤 주소에서 지운다 */
  function fromLink() {
    var hs = (location.hash || '').replace(/^#/, '');
    if (!/(^|&)(access_token|error_code|error)=/.test(hs)) return Promise.resolve(null);
    var q = {}; hs.split('&').forEach(function (p) { var i = p.indexOf('='); if (i > 0) q[p.slice(0, i)] = decodeURIComponent(p.slice(i + 1).replace(/\+/g, ' ')); });
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
    if (!q.access_token || !q.refresh_token) return Promise.resolve({ err: q.error_code === 'otp_expired' ? '링크가 만료됐어요. 다시 요청해 주세요' : '링크를 열지 못했어요. 다시 요청해 주세요' });
    return call('/auth/v1/user', { headers: { Authorization: 'Bearer ' + q.access_token } }).then(asJson).then(function (r) {
      if (!r.ok || !r.j || !r.j.id) return { err: '링크를 열지 못했어요. 다시 요청해 주세요' };
      keep({ access_token: q.access_token, refresh_token: q.refresh_token, expires_in: Number(q.expires_in) || 3600, user: r.j });
      return { type: q.type || '' };
    }, function () { return { err: NET }; });
  }
  /* 쓸 수 있는 로그인 표(1시간짜리)를 준다. 곧 끝나면 새로 받는다 — 동시에 두 번 받지 않게 하나만 */
  var refreshing = null;
  /* 같은 브라우저의 다른 창이 먼저 새로 받아 저장해 둔 것이 있으면 그것을 쓴다(새로 받으면 예전 것은 못 쓰게 되므로) */
  function adopt(sent) {
    var s = jget(AUTH_KEY);
    if (s && sess && s.uid === sess.uid && s.refresh && s.refresh !== sent && s.exp - 90 > Date.now() / 1000) { sess = s; return true; }
    return false;
  }
  function token() {
    if (!sess) return Promise.reject(new Error('로그인이 필요해요'));
    if (sess.exp - 90 > Date.now() / 1000) return Promise.resolve(sess.access);
    if (adopt(sess.refresh)) return Promise.resolve(sess.access);
    if (!refreshing) {
      var uid = sess.uid, sent = sess.refresh;
      refreshing = call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', json: { refresh_token: sent } }).then(asJson).then(function (r) {
        refreshing = null;
        if (!sess || sess.uid !== uid) throw new Error('로그인이 필요해요');
        if (r.ok && r.j && r.j.access_token) return keep(r.j).access;
        if (r.status >= 400 && r.status < 500 && r.status !== 429) {
          if (adopt(sent)) return sess.access;
          drop(); if (onExpire) onExpire(); throw new Error('다시 로그인해 주세요');
        }
        throw new Error(NET);
      }, function (e) { refreshing = null; throw e; });
    }
    return refreshing;
  }
  function authed(path, opt) {
    return token().then(function (t) { opt = opt || {}; opt.headers = Object.assign({ Authorization: 'Bearer ' + t }, opt.headers || {}); return call(path, opt); });
  }

  /* ---------- 기기에 적어 두는 맞춤 기록: at = 마지막으로 서버와 같아진 시각, dirty = 그 뒤 기기에서 저장한 시각, blobs = 받은 사진의 서버 시각, up·del = 아직 못 올린·못 지운 사진 ---------- */
  function mkey() { return META_KEY + ':' + sess.uid; }
  function meta() { var m = jget(mkey()) || {}; m.blobs = m.blobs || {}; m.up = m.up || []; m.del = m.del || []; return m; }
  function metaSet(fn) { if (!sess) return; var m = meta(); fn(m); jset(mkey(), m); }
  function skey() { return Core.KEY + ':' + localId(); }
  function hasLocal() { try { return !!localStorage.getItem(skey()); } catch (e) { return false; } }

  /* ---------- 내용(치수·옷장 목록·기록·설정) ---------- */
  var pulled = false, pushT = null, pushing = null, status = { state: 'idle', err: '' }, onStatus = null;
  function setStatus(s, err) { status = { state: s, err: err || '' }; if (onStatus) try { onStatus(status); } catch (e) {} }
  /* 로그인 직후·앱을 열 때 한 번. 돌려주는 값: { applied: 서버 내용을 기기에 받아 적음, empty: 서버에 아직 내용 없음 } */
  function pull() {
    if (!sess) return Promise.reject(new Error('로그인이 필요해요'));
    var uid = sess.uid;
    setStatus('pull');
    return authed('/rest/v1/fiton_state?select=data,updated_at&user_id=eq.' + uid).then(asJson).then(function (r) {
      if (!sess || sess.uid !== uid) throw new Error('로그인이 바뀌었어요');
      if (!r.ok || !Array.isArray(r.j)) throw new Error('내 자료를 불러오지 못했어요');
      var row = r.j[0], m = meta(), out = { applied: false, empty: !row };
      if (row) {
        /* 시각은 글자가 아니라 값으로 견준다(서버는 +00:00, 앱은 Z 로 적는다) */
        var localNewer = m.dirty && hasLocal() && m.dirty > Date.parse(row.updated_at);
        if (!localNewer && (Date.parse(row.updated_at) !== Date.parse(m.at || '') || !hasLocal())) {
          try { localStorage.setItem(skey(), JSON.stringify(row.data || {})); } catch (e) { throw new Error('이 기기의 저장 공간이 부족해요'); }
          out.applied = true;
        }
        if (!localNewer) metaSet(function (x) { x.at = row.updated_at; x.dirty = 0; });
      }
      pulled = true; setStatus('idle');
      if (meta().dirty || (!row && hasLocal())) pushSoon(200);
      return out;
    }).catch(function (e) { setStatus('error', (e && e.message) || NET); throw e; });
  }
  /* 기기에 저장할 때마다 부른다. 처음 내려받기가 끝나기 전에는 표시만 해 두고 올리지 않는다(빈 기기가 서버 내용을 덮어쓰지 않게) */
  function touch() { if (!sess) return; metaSet(function (m) { m.dirty = Date.now(); }); if (pulled) pushSoon(1500); }
  function pushSoon(ms) { clearTimeout(pushT); pushT = setTimeout(function () { push().catch(function () {}); }, ms); }
  function push(keepalive) {
    if (!sess || !pulled) return Promise.resolve(false);
    if (pushing) return pushing.then(function () { return meta().dirty ? push(keepalive) : true; }, function () { return push(keepalive); });
    clearTimeout(pushT);
    var uid = sess.uid, raw, data, d0 = meta().dirty, at = new Date().toISOString();
    try { raw = localStorage.getItem(skey()); data = raw ? JSON.parse(raw) : null; } catch (e) { data = null; }
    if (!data) return Promise.resolve(false);
    setStatus('push');
    pushing = authed('/rest/v1/fiton_state?on_conflict=user_id', { method: 'POST', keepalive: !!keepalive && raw.length < 60000, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, json: { user_id: uid, data: data, updated_at: at } }).then(function (r) {
      pushing = null;
      if (!r.ok) throw new Error('저장한 내용을 서버에 올리지 못했어요');
      if (sess && sess.uid === uid) metaSet(function (m) { m.at = at; if (m.dirty === d0) m.dirty = 0; });
      setStatus('idle');
      if (sess && meta().dirty) pushSoon(1500);
      return true;
    }).catch(function (e) { pushing = null; setStatus('error', (e && e.message) || NET); if (sess && sess.uid === uid) pushSoon(20000); throw e; }); /* 서버가 거절했거나 연결이 끊겼으면 20초 뒤 다시 */
    return pushing;
  }
  function flush() { return push().catch(function () { return false; }); }

  /* ---------- 사진(아바타·옷 사진·입은 모습) ---------- */
  function opath(name) { return '/storage/v1/object/' + BUCKET + '/' + sess.uid + '/' + encodeURIComponent(name); }
  function lkey(name) { return localId() + ':' + name; }
  var blobBusy = null, onBlobs = null;
  function blobUp(name) { if (!sess) return; metaSet(function (m) { if (m.up.indexOf(name) < 0) m.up.push(name); var i = m.del.indexOf(name); if (i >= 0) m.del.splice(i, 1); }); blobSoon(); }
  function blobDel(name) { if (!sess) return; metaSet(function (m) { if (m.del.indexOf(name) < 0) m.del.push(name); var i = m.up.indexOf(name); if (i >= 0) m.up.splice(i, 1); delete m.blobs[name]; }); blobSoon(); }
  var blobT = null;
  function blobSoon() { clearTimeout(blobT); blobT = setTimeout(function () { blobSync(false).catch(function () {}); }, 800); }
  function pool(list, n, fn) {
    var i = 0;
    function next() { if (i >= list.length) return Promise.resolve(); var x = list[i++]; return Promise.resolve(fn(x)).catch(function () {}).then(next); }
    var ws = []; for (var k = 0; k < Math.min(n, list.length); k++) ws.push(next());
    return Promise.all(ws);
  }
  function listRemote() {
    var all = [], uid = sess.uid;
    function page(off) {
      return authed('/storage/v1/object/list/' + BUCKET, { method: 'POST', json: { prefix: uid + '/', limit: 1000, offset: off, sortBy: { column: 'name', order: 'asc' } } }).then(asJson).then(function (r) {
        if (!r.ok || !Array.isArray(r.j)) throw new Error('사진 목록을 불러오지 못했어요');
        r.j.forEach(function (o) { if (o && o.name && o.id) all.push(o); });
        return r.j.length === 1000 ? page(off + 1000) : all;
      });
    }
    return page(0);
  }
  /* 못 올린 사진 올리기 → 못 지운 사진 지우기 → (down 이면) 서버에만 있거나 서버 쪽이 새로운 사진 내려받기. 기기 사진은 여기서 지우지 않는다 */
  function blobSync(down) {
    if (!sess) return Promise.resolve(0);
    if (blobBusy) return blobBusy.then(function () { return blobSync(down); }, function () { return blobSync(down); });
    var uid = sess.uid, got = 0, same = function () { return sess && sess.uid === uid; };
    blobBusy = pool(meta().up.slice(), 3, function (name) {
      return Core.rawGet(lkey(name)).then(function (b) {
        if (!same()) return;
        if (!b) { metaSet(function (m) { var i = m.up.indexOf(name); if (i >= 0) m.up.splice(i, 1); }); return; }
        return authed(opath(name), { method: 'POST', headers: { 'Content-Type': /^image\/(jpeg|png|webp)$/.test(b.type) ? b.type : 'image/jpeg', 'x-upsert': 'true', 'cache-control': 'max-age=3600' }, body: b }).then(asJson).then(function (r) {
          /* 서버가 받지 않는 파일(너무 큼·형식)만 목록에서 뺀다 — 다시 해도 같으므로. 권한·연결 같은 그 밖의 실패는 남겨 두고 다음에 다시 올린다 */
          var j = r.j || {}, why = String(j.error || '') + ' ' + String(j.message || '');
          var never = r.status === 413 || r.status === 415 || /mime|too large|exceeded the maximum|payload/i.test(why);
          if (same() && (r.ok || never)) metaSet(function (m) { var i = m.up.indexOf(name); if (i >= 0) m.up.splice(i, 1); if (r.ok) m.blobs[name] = 'mine'; });
        });
      });
    }).then(function () {
      if (!same()) return;
      return pool(meta().del.slice(), 3, function (name) {
        /* 서버는 「사진 없음」도 「토큰 오류」도 400 으로 돌려준다(본문 statusCode 가 404 / 403). 없어서 못 지운 것만 끝난 것으로 보고, 그 밖은 남겨 두고 다음에 다시 지운다 */
        return authed(opath(name), { method: 'DELETE' }).then(asJson).then(function (r) { var gone = r.status === 404 || r.status === 400 && String((r.j || {}).statusCode) === '404'; if (same() && (r.ok || gone)) metaSet(function (m) { var i = m.del.indexOf(name); if (i >= 0) m.del.splice(i, 1); }); });
      });
    }).then(function () {
      if (!down || !same()) return;
      return listRemote().then(function (list) {
        if (!same()) return;
        var m = meta(), need = [], seen = {};
        list.forEach(function (o) {
          seen[o.name] = 1;
          if (m.up.indexOf(o.name) >= 0 || m.del.indexOf(o.name) >= 0) return;
          if (m.blobs[o.name] === 'mine') { m.blobs[o.name] = o.updated_at; return; } /* 이 기기가 올린 것 */
          if (m.blobs[o.name] !== o.updated_at) need.push(o);
        });
        Object.keys(m.blobs).forEach(function (k) { if (!seen[k]) delete m.blobs[k]; });
        jset(mkey(), m);
        return pool(need, 4, function (o) {
          return authed(opath(o.name)).then(function (r) { if (!r.ok) throw new Error('받기 실패'); return r.blob(); }).then(function (b) {
            if (!same()) return;
            return Core.rawPut(lkey(o.name), b).then(function () { got++; metaSet(function (x) { x.blobs[o.name] = o.updated_at; }); });
          });
        });
      });
    }).then(function () { blobBusy = null; if (got && onBlobs && same()) try { onBlobs(got); } catch (e) {} return got; }, function (e) { blobBusy = null; throw e; });
    return blobBusy;
  }

  /* ---------- 이 기기에 있던 프로필(닉네임+PIN) 자료를 계정으로 옮겨 담기. 원래 자료는 지우지 않는다 ---------- */
  function idbKeys() {
    return new Promise(function (res) {
      try {
        var rq = indexedDB.open('fit-test', 1);
        rq.onupgradeneeded = function () { rq.result.createObjectStore('blobs'); };
        rq.onerror = function () { res([]); };
        rq.onsuccess = function () {
          var d = rq.result, out = [];
          try {
            var c = d.transaction('blobs', 'readonly').objectStore('blobs').openKeyCursor();
            c.onsuccess = function () { var cur = c.result; if (cur) { out.push(String(cur.key)); cur.continue(); } else { d.close(); res(out); } };
            c.onerror = function () { d.close(); res(out); };
          } catch (e) { d.close(); res(out); }
        };
      } catch (e) { res([]); }
    });
  }
  function importLocal(fromId) {
    if (!sess) return Promise.reject(new Error('로그인이 필요해요'));
    var raw = null; try { raw = localStorage.getItem(Core.KEY + ':' + fromId); } catch (e) {}
    if (!raw) return Promise.reject(new Error('가져올 자료가 없어요'));
    var pre = fromId + ':';
    return idbKeys().then(function (keys) {
      var names = keys.filter(function (k) { return k.indexOf(pre) === 0; }).map(function (k) { return k.slice(pre.length); });
      return names.reduce(function (p, name) {
        return p.then(function () { return Core.rawGet(pre + name); }).then(function (b) { return b ? Core.rawPut(lkey(name), b) : null; });
      }, Promise.resolve()).then(function () {
        try { localStorage.setItem(skey(), raw); } catch (e) { throw new Error('이 기기의 저장 공간이 부족해요'); }
        metaSet(function (m) { names.forEach(function (n) { if (m.up.indexOf(n) < 0) m.up.push(n); }); });
        touch(); blobSoon();
        return names.length;
      });
    });
  }

  /* ---------- 이 기기에 남아 있는 다른 계정의 자료(2026-11-23: 11-22 서버를 새 FITON 프로젝트로 바꾸기 전 계정 등). 가져오기 목록에 쓴다 ----------
     · localStorage 'fit-test-v1:acc_<계정 id>' 중 지금 계정이 아닌 것. 옷·기록·치수가 하나도 없으면 뺀다. at = 그 계정이 마지막으로 서버와 같아진 시각(있으면) */
  function oldAccounts() {
    var out = [], me = localId(), pre = Core.KEY + ':acc_';
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i); if (!k || k.indexOf(pre) !== 0) continue;
        var id = k.slice(Core.KEY.length + 1); if (id === me) continue;
        var s = null; try { s = JSON.parse(localStorage.getItem(k)); } catch (e) {}
        if (!s || typeof s !== 'object') continue;
        var p = s.profile || {}, nc = Array.isArray(s.closet) ? s.closet.length : 0, nl = Object.keys(s.looks || {}).length;
        if (!nc && !nl && !p.height) continue;
        var mt = jget(META_KEY + ':' + id.slice(4)) || {}, at = Date.parse(mt.at || '') || mt.dirty || 0;
        out.push({ id: id, closet: nc, gender: p.gender || '', height: p.height || '', at: at });
      }
    } catch (e) {}
    return out.sort(function (a, b) { return b.closet - a.closet || b.at - a.at; });
  }

  /* 화면을 떠날 때 못 올린 내용이 있으면 한 번 더 시도(작을 때만 끝까지 보내진다. 못 보내면 다음에 열 때 올린다) */
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && sess && pulled && meta().dirty) push(true).catch(function () {}); });
  window.addEventListener('online', function () { if (sess && pulled) { if (meta().dirty) pushSoon(300); blobSoon(); } });

  window.FitSync = {
    enabled: function () { return !!(cfg().url && cfg().anon); },
    session: session, localId: localId, signUp: signUp, signIn: signIn, signOut: signOut, recover: recover, setPassword: setPassword, fromLink: fromLink,
    hasLocal: hasLocal, pull: pull, touch: touch, flush: flush, blobUp: blobUp, blobDel: blobDel, blobSync: blobSync, importLocal: importLocal, oldAccounts: oldAccounts,
    pending: function () { if (!sess) return 0; var m = meta(); return (m.dirty ? 1 : 0) + m.up.length + m.del.length; },
    status: function () { return status; },
    on: function (h) { onExpire = h.expire || null; onStatus = h.status || null; onBlobs = h.blobs || null; }
  };
})();
