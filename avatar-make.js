/* 2026-11-19 아바타 만들기(별도 기능) — 사용자 지시: 「남녀 기본체형을 만들고 선택해서 아바타를 만드는 방법과, 본인의 전신 사진을 찍어와 만드는 두 가지 방법을 선택해서 사용하게」
   방법 1 (base)  : 기본 체형 하나를 고르고 얼굴 사진 1장을 올린다 → 서버(avatar 함수, FASHN model-swap)가 그 체형 몸에 얼굴을 입힌 전신 그림을 만든다.
   방법 2 (photo) : 내 전신 사진을 올린다 → 지금은 그 사진을 그대로 내 아바타로 쓴다(무료, 서버로 보내지 않음). AI 로 정리하는 단계는 CFG.photoAI 를 켜야 나온다(서버 자리만 있음).
   이 파일은 자기 창(겹쳐 뜨는 창)만 그리고, 만든 그림(Blob)을 o.onDone 으로 돌려준다. 저장·표준 틀 맞춤·배경 세팅은 앱(pc.js)의 기존 올리기 경로가 한다.
   쓰는 법: AvatarMake.open({ bases:[{id,name,img,g}], gender:'female'|'male', cfg:TRYON_CFG, device:'…', seg:function(){return Promise<segmenter>}, onDone:function(blob, info){} }) */
(function () {
  var CFG = { fn: 'avatar', pollMs: 3000, timeout: 240000, minFace: 160, faceOut: 640, photoAI: false };
  var S = null, root = null;
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function loadImg(src) {
    return new Promise(function (ok, no) {
      var u = typeof src === 'string' ? src : URL.createObjectURL(src), im = new Image();
      im.onload = function () { ok(im); }; im.onerror = function () { no(new Error('사진을 열지 못했어요.')); }; im.src = u;
    });
  }
  function call(body) {
    var c = S.o.cfg;
    return fetch(c.url.replace(/\/$/, '') + '/functions/v1/' + CFG.fn, {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: c.anon, Authorization: 'Bearer ' + c.anon }, body: JSON.stringify(body)
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }, function () { return { ok: false, j: {} }; }); });
  }
  function b64Blob(j) {
    var bin = atob(j.image), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return new Blob([u], { type: j.mime || 'image/png' });
  }
  /* 얼굴 자리 찾기: 사람 영역 구분(3 = 얼굴 피부)의 테두리를 머리·턱까지 넓힌 정사각형. 못 찾으면 null */
  function findFace(img) {
    if (!S.o.seg) return Promise.resolve(null);
    var done = false;
    return Promise.race([
      S.o.seg().then(function (seg) {
        var iw = img.naturalWidth, ih = img.naturalHeight, sc = Math.min(1, 512 / Math.max(iw, ih)), w = Math.max(1, Math.round(iw * sc)), ht = Math.max(1, Math.round(ih * sc));
        var c = document.createElement('canvas'); c.width = w; c.height = ht; c.getContext('2d').drawImage(img, 0, 0, w, ht);
        var r = seg.segment(c), m = r.categoryMask, a = m.getAsUint8Array(), mw = m.width, mh = m.height, x0 = mw, x1 = -1, y0 = mh, y1 = -1, n = 0, x, y;
        for (y = 0; y < mh; y++) for (x = 0; x < mw; x++) if (a[y * mw + x] === 3) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        m.close(); if (r.close) r.close(); done = true;
        if (n < mw * mh * 0.002) return null;
        var fx = iw / mw, fy = ih / mh, fw = (x1 - x0 + 1) * fx, fh = (y1 - y0 + 1) * fy, cx = (x0 + x1 + 1) / 2 * fx, cy = (y0 + y1 + 1) / 2 * fy;
        return { cx: cx, cy: cy - fh * 0.12, s: Math.max(fw, fh) * 1.9, face: Math.max(fw, fh) };
      }),
      new Promise(function (ok) { setTimeout(function () { if (!done) ok(null); }, 20000); })
    ]).catch(function () { return null; });
  }
  function clampBox() {
    var b = S.box, im = S.faceImg, mx = Math.min(im.naturalWidth, im.naturalHeight);
    b.s = Math.max(Math.min(40, mx), Math.min(mx, b.s));
    b.cx = Math.max(b.s / 2, Math.min(im.naturalWidth - b.s / 2, b.cx)); b.cy = Math.max(b.s / 2, Math.min(im.naturalHeight - b.s / 2, b.cy));
  }
  /* 자른 얼굴을 서버로 보낼 크기(긴 변 CFG.faceOut)로 */
  function cropFace() {
    var b = S.box, n = Math.round(Math.min(CFG.faceOut, Math.max(512, b.s))), c = document.createElement('canvas'); c.width = n; c.height = n;
    var g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(S.faceImg, b.cx - b.s / 2, b.cy - b.s / 2, b.s, b.s, 0, 0, n, n);
    return c.toDataURL('image/jpeg', 0.92);
  }
  var BTN = 'min-height:46px;padding:0 18px;border-radius:12px;font-weight:700;font-size:16px;border:1px solid var(--line);background:var(--panel2);color:var(--fg);cursor:pointer';
  var PRI = BTN + ';background:var(--pri);border-color:var(--pri);color:var(--onPri)';
  function btn(act, label, pri, off) { return '<button type="button" data-am="' + act + '" style="' + (pri ? PRI : BTN) + (off ? ';opacity:.45;cursor:not-allowed' : '') + '"' + (off ? ' aria-disabled="true"' : '') + '>' + label + '</button>'; }
  function pickCard(act, title, lines, extra) {
    return '<button type="button" data-am="' + act + '" style="flex:1 1 260px;text-align:left;padding:18px;border-radius:14px;border:1px solid var(--line);background:var(--panel2);color:var(--fg);cursor:pointer;display:flex;flex-direction:column;gap:8px">' +
      '<b style="font-size:18px">' + title + '</b>' + lines.map(function (t) { return '<span style="color:var(--muted);font-size:14px">' + t + '</span>'; }).join('') + (extra || '') + '</button>';
  }
  function view() {
    var s = S, o = s.o, t = '', foot = '';
    if (s.step === 'pick') {
      t = '<p style="margin:0;color:var(--muted)">내 아바타 앞모습을 만드는 방법을 골라 주세요.</p><div style="display:flex;flex-wrap:wrap;gap:14px">' +
        pickCard('goBase', '① 기본 체형 + 얼굴 사진', ['기본 체형 하나를 고르고 얼굴 사진 1장을 올리면, 그 체형 몸에 내 얼굴을 입힌 전신 아바타를 만들어요.', '전신 사진이 없어도 돼요. 몸은 고른 기본 체형을 따라요.']) +
        pickCard('goPhoto', '② 내 전신 사진', ['내가 찍은 정면 전신 사진으로 아바타를 만들어요.', '몸이 실제 내 모습 그대로예요. 몸선이 보이는 옷, 단색 배경이 좋아요.']) + '</div>' + (s.msg ? '<p style="margin:0;color:var(--errText,#c33)">' + h(s.msg) + '</p>' : '');
      foot = btn('close', '닫기');
    } else if (s.step === 'base') {
      var list = o.bases.filter(function (b) { return b.g === s.g; });
      t = '<div style="display:flex;gap:8px" role="group" aria-label="성별">' + [['female', '여성'], ['male', '남성']].map(function (g) { return '<button type="button" data-am="g" data-v="' + g[0] + '" aria-pressed="' + (s.g === g[0]) + '" style="' + (s.g === g[0] ? PRI : BTN) + ';min-height:40px">' + g[1] + '</button>'; }).join('') + '</div>' +
        '<p style="margin:0;color:var(--muted)">내 몸에 가장 가까운 체형을 골라 주세요. 얼굴만 내 사진으로 바뀌고, 몸·옷차림·배경은 이 그림 그대로예요.</p>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px">' + (list.length ? list.map(function (b) {
          var on = s.base === b.id;
          return '<button type="button" data-am="base" data-id="' + h(b.id) + '" aria-pressed="' + on + '" style="padding:6px;border-radius:12px;border:2px solid ' + (on ? 'var(--pri)' : 'var(--line)') + ';background:var(--panel2);color:' + (on ? 'var(--pri)' : 'var(--fg)') + ';cursor:pointer;display:flex;flex-direction:column;gap:6px;align-items:center;font-weight:700;font-size:14px">' +
            '<img src="' + h(b.img) + '" alt="" style="width:100%;aspect-ratio:9/16;object-fit:cover;border-radius:8px;background:#fff">' + h(b.name) + (b.h ? '<span style="font-weight:400;color:var(--muted);font-size:13px">' + h(b.h) + 'cm · ' + h(b.w) + 'kg</span>' : '') + '</button>';
        }).join('') : '<span style="color:var(--muted)">이 성별의 기본 체형이 아직 없어요.</span>') + '</div>';
      foot = btn('back', '이전') + btn('toFace', '다음: 얼굴 사진', true, !s.base);
    } else if (s.step === 'face') {
      if (!s.faceImg) {
        t = '<p style="margin:0;color:var(--muted)">얼굴이 크게, 정면으로, 밝게 찍힌 사진 1장을 올려 주세요. 모자·선글라스·마스크는 없는 사진이 좋아요.</p>' +
          '<label style="' + PRI + ';display:flex;align-items:center;justify-content:center;max-width:280px">얼굴 사진 고르기<input type="file" accept="image/*" data-am-file="face" style="position:absolute;width:1px;height:1px;opacity:0" aria-label="얼굴 사진 파일 선택"></label>' + (s.msg ? '<p style="margin:0;color:var(--errText,#c33)">' + h(s.msg) + '</p>' : '');
        foot = btn('back', '이전');
      } else {
        var im = s.faceImg, b = s.box, iw = im.naturalWidth, ih = im.naturalHeight, small = b.s < CFG.minFace;
        t = '<div style="display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start"><div style="flex:0 1 340px;min-width:220px"><div data-am-stage style="position:relative;line-height:0;border-radius:10px;overflow:hidden;touch-action:none;user-select:none;background:#000">' +
          '<img src="' + h(im.src) + '" alt="올린 얼굴 사진" draggable="false" style="width:100%;display:block;opacity:.55">' +
          '<div data-am-box style="position:absolute;left:' + ((b.cx - b.s / 2) / iw * 100) + '%;top:' + ((b.cy - b.s / 2) / ih * 100) + '%;width:' + (b.s / iw * 100) + '%;height:' + (b.s / ih * 100) + '%;border:2px solid var(--pri);box-shadow:0 0 0 9999px rgba(0,0,0,.35);cursor:move;background:url(' + h(im.src) + ') no-repeat;background-size:' + (iw / b.s * 100) + '% ' + (ih / b.s * 100) + '%;background-position:' + (iw > b.s ? (b.cx - b.s / 2) / (iw - b.s) * 100 : 0) + '% ' + (ih > b.s ? (b.cy - b.s / 2) / (ih - b.s) * 100 : 0) + '%"></div></div></div>' +
          '<div style="flex:1 1 240px;display:flex;flex-direction:column;gap:12px"><p style="margin:0">네모 안에 <b>머리 꼭대기부터 턱까지</b> 들어오게 맞춰 주세요. 네모를 끌어 옮기고, 아래 막대로 크기를 바꿔요.' + (s.finding ? ' <span style="color:var(--muted)">얼굴 자리를 찾는 중…</span>' : '') + '</p>' +
          '<label style="display:flex;flex-direction:column;gap:4px;font-size:14px;color:var(--muted)">네모 크기<input type="range" data-am-size min="40" max="' + Math.min(iw, ih) + '" step="1" value="' + Math.round(b.s) + '" aria-label="얼굴 네모 크기"></label>' +
          (small ? '<p style="margin:0;padding:10px 12px;border:1px solid var(--warn,#c80);border-radius:10px;font-size:14px">사진 속 얼굴이 작아요(' + Math.round(b.s) + 'px). 닮은 정도가 떨어질 수 있어요. 얼굴이 더 크게 찍힌 사진을 권해요.</p>' : '') +
          '<label style="display:flex;align-items:center;justify-content:center;' + BTN + ';max-width:220px;min-height:40px;font-size:14px">다른 사진 고르기<input type="file" accept="image/*" data-am-file="face" style="position:absolute;width:1px;height:1px;opacity:0" aria-label="얼굴 사진 파일 다시 선택"></label>' +
          '<label style="display:flex;flex-direction:row;gap:10px;align-items:flex-start;font-size:14px;cursor:pointer"><input type="checkbox" data-am-agree' + (s.agree ? ' checked' : '') + ' style="width:20px;height:20px;flex:none;margin-top:2px"><span>이 얼굴 사진(네모 안)을 아바타를 만들기 위해 앱 서버와 외부 AI 서비스(FASHN)로 보내는 데 동의해요. 만든 뒤 앱 서버에는 저장하지 않아요.</span></label></div></div>';
        foot = btn('back', '이전') + btn('make', '아바타 만들기', true, !s.agree);
      }
    } else if (s.step === 'photo') {
      if (!s.photoUrl) {
        t = '<p style="margin:0;color:var(--muted)">정면을 보고 똑바로 선 전신 사진 1장을 올려 주세요.</p><ul style="margin:0;padding-left:20px;color:var(--muted);font-size:14px;line-height:1.7"><li>머리 꼭대기부터 발끝까지 다 나오게</li><li>팔은 자연스럽게 내리고, 몸선이 보이는 옷(나시·반바지 등)</li><li>단색 벽 앞, 밝은 곳에서</li></ul>' +
          '<label style="' + PRI + ';display:flex;align-items:center;justify-content:center;max-width:280px">전신 사진 고르기<input type="file" accept="image/*" data-am-file="photo" style="position:absolute;width:1px;height:1px;opacity:0" aria-label="전신 사진 파일 선택"></label>' + (s.msg ? '<p style="margin:0;color:var(--errText,#c33)">' + h(s.msg) + '</p>' : '');
        foot = btn('back', '이전');
      } else {
        t = '<div style="display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start"><img src="' + h(s.photoUrl) + '" alt="올린 전신 사진" style="flex:0 1 240px;min-width:160px;max-height:56vh;object-fit:contain;border-radius:10px;background:#fff">' +
          '<div style="flex:1 1 240px;display:flex;flex-direction:column;gap:12px"><p style="margin:0">이 사진을 내 아바타 앞모습으로 써요. 지금은 사진을 내 기기에만 저장해요. 나중에 옷을 입혀볼 때는 이 아바타 사진이 그림을 만드는 서버로 전송돼요.</p>' +
          '<p style="margin:0;color:var(--muted);font-size:14px">저장할 때 앱이 사람 위치를 화면 틀에 맞추고 배경색을 읽어요. 사진 속 옷차림·자세·배경은 바꾸지 않아요.</p>' +
          (CFG.photoAI ? '' : '<p style="margin:0;color:var(--muted);font-size:14px">옷차림·자세·배경을 AI 로 정리해 주는 기능은 준비 중이에요.</p>') +
          '<label style="display:flex;align-items:center;justify-content:center;' + BTN + ';max-width:220px;min-height:40px;font-size:14px">다른 사진 고르기<input type="file" accept="image/*" data-am-file="photo" style="position:absolute;width:1px;height:1px;opacity:0" aria-label="전신 사진 파일 다시 선택"></label></div></div>';
        foot = btn('back', '이전') + btn('usePhoto', '이 사진으로 사용', true);
      }
    } else if (s.step === 'wait') {
      t = '<div style="padding:30px 0;text-align:center" role="status"><b style="font-size:18px">아바타를 만들고 있어요…</b><p style="color:var(--muted);margin:10px 0 0">보통 30초~1분쯤 걸려요. 이 창을 닫지 말아 주세요. <span data-am-sec></span></p></div>';
      foot = btn('cancel', '취소');
    } else if (s.step === 'done') {
      var bs = o.bases.filter(function (b) { return b.id === s.base; })[0];
      t = '<div style="display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start;justify-content:center">' +
        '<figure style="margin:0;flex:0 1 150px;text-align:center;color:var(--muted);font-size:13px"><img src="' + h(s.faceData) + '" alt="보낸 얼굴 사진" style="width:100%;border-radius:10px"><figcaption>보낸 얼굴</figcaption></figure>' +
        (bs ? '<figure style="margin:0;flex:0 1 190px;text-align:center;color:var(--muted);font-size:13px"><img src="' + h(bs.img) + '" alt="고른 기본 체형" style="width:100%;aspect-ratio:9/16;object-fit:cover;border-radius:10px"><figcaption>고른 체형</figcaption></figure>' : '') +
        '<figure style="margin:0;flex:0 1 260px;text-align:center;font-size:14px;font-weight:700"><img src="' + h(s.resUrl) + '" alt="만든 아바타" style="width:100%;border-radius:10px;border:2px solid var(--pri)"><figcaption>만든 아바타</figcaption></figure></div>' +
        (o.hasAvatar ? '<p style="margin:0;color:var(--muted);font-size:14px">「이걸로 사용」을 누르면 지금 내 아바타 앞모습이 이 그림으로 바뀌어요.</p>' : '');
      foot = btn('close', '쓰지 않고 닫기') + btn('again', '다시 만들기') + btn('use', '이걸로 사용', true);
    } else if (s.step === 'fail') {
      t = '<div style="padding:20px 0"><b style="font-size:18px">아바타를 만들지 못했어요.</b><p style="color:var(--muted);margin:10px 0 0">' + h(s.err || '잠시 뒤 다시 해 주세요.') + '</p></div>';
      foot = btn('close', '닫기') + (s.faceImg ? btn('toFace', '다시 해 보기', true) : '');
    }
    var title = { pick: '아바타 만들기', base: '① 기본 체형 고르기', face: '① 얼굴 사진', photo: '② 내 전신 사진', wait: '아바타 만들기', done: '만든 아바타 확인', fail: '아바타 만들기' }[s.step];
    root.innerHTML = '<div role="dialog" aria-modal="true" aria-label="' + h(title) + '" style="width:min(820px,100%);max-height:calc(100vh - 32px);overflow:auto;background:var(--panel);color:var(--fg);border:1px solid var(--line);border-radius:18px;padding:22px;display:flex;flex-direction:column;gap:16px">' +
      '<h2 style="margin:0;font-size:22px">' + h(title) + '</h2>' + t + '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end">' + foot + '</div></div>';
  }
  function fail(msg) { if (!S) return; S.step = 'fail'; S.err = msg; view(); }
  function make() {
    var s = S, tk = ++s.token, t0 = Date.now();
    s.faceData = cropFace(); s.step = 'wait'; view();
    var tm = setInterval(function () { var e = root && root.querySelector('[data-am-sec]'); if (!S || s.token !== tk || s.step !== 'wait') return clearInterval(tm); if (e) e.textContent = '(' + Math.round((Date.now() - t0) / 1000) + '초)'; }, 1000);
    function live() { return S === s && s.token === tk && s.step === 'wait'; }
    call({ action: 'start', method: 'base', device: s.o.device, base: s.base, face: s.faceData }).then(function (r) {
      if (!live()) return;
      if (!r.ok || !r.j.taskId) return fail(r.j.error || '요청을 접수하지 못했어요.');
      var id = r.j.taskId;
      (function poll() {
        setTimeout(function () {
          if (!live()) return;
          if (Date.now() - t0 > CFG.timeout) return fail('시간이 너무 오래 걸려 멈췄어요. 잠시 뒤 다시 해 주세요.');
          call({ action: 'status', taskId: id }).then(function (q) {
            if (!live()) return;
            if (q.ok && q.j.status === 'success' && q.j.image) { s.resBlob = b64Blob(q.j); if (s.resUrl) URL.revokeObjectURL(s.resUrl); s.resUrl = URL.createObjectURL(s.resBlob); s.step = 'done'; view(); }
            else if (q.ok && q.j.status === 'failed') fail(q.j.error || 'AI 가 그림을 만들지 못했어요. 다른 얼굴 사진으로 해 보세요.');
            else if (!q.ok && q.j.error && !q.j.retry) fail(q.j.error);
            else poll();
          }, function () { if (live()) poll(); });
        }, CFG.pollMs);
      })();
    }, function () { if (live()) fail('서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.'); });
  }
  function setFace(file) {
    var s = S; s.msg = '';
    loadImg(file).then(function (im) {
      if (S !== s) return;
      var iw = im.naturalWidth, ih = im.naturalHeight, mn = Math.min(iw, ih);
      if (mn < 80) { s.msg = '사진이 너무 작아요. 더 큰 사진을 올려 주세요.'; view(); return; }
      if (s.faceImg) URL.revokeObjectURL(s.faceImg.src);
      s.faceImg = im; s.box = { cx: iw / 2, cy: Math.min(ih / 2, mn * 0.55), s: mn * 0.8 }; clampBox(); s.finding = !!s.o.seg; s.touched = false; view();
      findFace(im).then(function (f) {
        if (S !== s || s.faceImg !== im) return; s.finding = false;
        if (f && !s.touched) { s.box = { cx: f.cx, cy: f.cy, s: f.s }; clampBox(); }
        if (s.step === 'face') view();
      });
    }).catch(function (e) { if (S === s) { s.msg = e.message; view(); } });
  }
  function setPhoto(file) {
    var s = S; s.msg = '';
    loadImg(file).then(function (im) {
      if (S !== s) return;
      if (im.naturalHeight < im.naturalWidth * 1.1) { URL.revokeObjectURL(im.src); s.msg = '가로로 긴 사진이에요. 머리부터 발끝까지 나온 세로 전신 사진을 올려 주세요.'; view(); return; }
      if (s.photoUrl) URL.revokeObjectURL(s.photoUrl);
      s.photoBlob = file; s.photoUrl = im.src; view();
    }).catch(function (e) { if (S === s) { s.msg = e.message; view(); } });
  }
  function okReplace() { return !S.o.hasAvatar || confirm('지금 내 아바타 앞모습을 이 그림으로 바꿀까요? 예전 앞모습 사진은 지워져요.'); }
  var ACT = {
    close: function () { close(); }, cancel: function () { S.token++; S.step = 'face'; view(); },
    goBase: function () { if (!S.o.cfg) { S.msg = '지금은 서버에 연결할 수 없어 ① 방법을 쓸 수 없어요.'; view(); return; } S.step = 'base'; view(); }, goPhoto: function () { S.step = 'photo'; view(); },
    back: function () { S.msg = ''; S.step = S.step === 'face' ? 'base' : 'pick'; view(); },
    g: function (el) { S.g = el.dataset.v; if (!S.o.bases.some(function (b) { return b.id === S.base && b.g === S.g; })) S.base = null; view(); },
    base: function (el) { S.base = el.dataset.id; view(); },
    toFace: function () { if (S.base) { S.step = 'face'; view(); } },
    make: function () { if (S.agree && S.faceImg && S.base) make(); },
    again: function () { S.step = 'face'; view(); },
    use: function () { var s = S; if (!okReplace()) return; close(true); s.o.onDone(s.resBlob, { method: 'base', base: s.base }); },
    usePhoto: function () { var s = S; if (!okReplace()) return; close(true); s.o.onDone(s.photoBlob, { method: 'photo' }); }
  };
  function onClick(e) {
    if (e.target === root) { if (downRoot && S && S.step !== 'wait' && S.step !== 'done') close(); return; } /* 창 안에서 끌다가 바깥에서 놓은 것은 닫지 않는다 */
    var el = e.target.closest('[data-am]'); if (!el || !S) return;
    if (el.getAttribute('aria-disabled') === 'true') return;
    var f = ACT[el.dataset.am]; if (f) f(el);
  }
  function onChange(e) {
    var t = e.target; if (!S) return;
    if (t.dataset.amFile) { var fl = t.files && t.files[0]; t.value = ''; if (fl) (t.dataset.amFile === 'face' ? setFace : setPhoto)(fl); }
    else if (t.hasAttribute('data-am-agree')) { S.agree = t.checked; view(); }
    else if (t.hasAttribute('data-am-size')) view(); /* 크기 막대를 놓으면 「얼굴이 작아요」 안내를 다시 계산 */
  }
  function onInput(e) { var t = e.target; if (S && t.hasAttribute('data-am-size')) { S.box.s = +t.value; S.touched = true; clampBox(); paintBox(); } }
  /* 네모 끌기·크기 바꾸기 중에는 창 전체를 다시 그리지 않고 네모만 옮긴다 */
  function paintBox() {
    var bx = root.querySelector('[data-am-box]'); if (!bx) return;
    var b = S.box, im = S.faceImg, iw = im.naturalWidth, ih = im.naturalHeight;
    bx.style.left = ((b.cx - b.s / 2) / iw * 100) + '%'; bx.style.top = ((b.cy - b.s / 2) / ih * 100) + '%'; bx.style.width = (b.s / iw * 100) + '%'; bx.style.height = (b.s / ih * 100) + '%';
    bx.style.backgroundSize = (iw / b.s * 100) + '% ' + (ih / b.s * 100) + '%';
    bx.style.backgroundPosition = (iw > b.s ? (b.cx - b.s / 2) / (iw - b.s) * 100 : 0) + '% ' + (ih > b.s ? (b.cy - b.s / 2) / (ih - b.s) * 100 : 0) + '%';
  }
  var drag = null, downRoot = false;
  function onDown(e) {
    downRoot = e.target === root;
    if (!S || S.step !== 'face' || !S.faceImg) return;
    var st = e.target.closest('[data-am-stage]'); if (!st) return;
    var r = st.getBoundingClientRect(), k = S.faceImg.naturalWidth / r.width, px = (e.clientX - r.left) * k, py = (e.clientY - r.top) * k;
    if (!e.target.closest('[data-am-box]')) { S.box.cx = px; S.box.cy = py; clampBox(); paintBox(); }
    drag = { k: k, x: e.clientX, y: e.clientY, cx: S.box.cx, cy: S.box.cy }; S.touched = true; e.preventDefault();
  }
  function onMove(e) { if (!drag || !S || !S.box) return; S.box.cx = drag.cx + (e.clientX - drag.x) * drag.k; S.box.cy = drag.cy + (e.clientY - drag.y) * drag.k; clampBox(); paintBox(); }
  function onUp() { if (drag) { drag = null; if (S && S.step === 'face') view(); } }
  function onKey(e) { if (e.key === 'Escape' && S && S.step !== 'wait') { e.stopPropagation(); close(); } }
  function close(keep) {
    if (!S) return;
    var s = S; S = null; s.token++;
    if (s.faceImg) URL.revokeObjectURL(s.faceImg.src);
    if (s.resUrl) URL.revokeObjectURL(s.resUrl);
    if (s.photoUrl) URL.revokeObjectURL(s.photoUrl);
    document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); document.removeEventListener('keydown', onKey, true);
    if (root && root.parentNode) root.parentNode.removeChild(root); root = null;
    if (!keep && s.o.onClose) s.o.onClose();
  }
  function open(o) {
    if (S) close();
    S = { o: o, step: 'pick', g: o.gender === 'male' ? 'male' : 'female', base: null, faceImg: null, box: null, agree: false, token: 0, msg: '' };
    root = document.createElement('div'); root.id = 'avmake';
    root.style.cssText = 'position:fixed;inset:0;z-index:75;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px';
    root.addEventListener('click', onClick); root.addEventListener('change', onChange); root.addEventListener('input', onInput); root.addEventListener('pointerdown', onDown);
    document.addEventListener('pointermove', onMove); document.addEventListener('pointerup', onUp); document.addEventListener('keydown', onKey, true);
    document.body.appendChild(root); view();
  }
  window.AvatarMake = { open: open, close: function () { close(); }, CFG: CFG, isOpen: function () { return !!S; } };
})();
