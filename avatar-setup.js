/* 2026-11-19 아바타 세팅(별도 기능) — 사용자 지시: 「새 가입자가 올린 사진의 배경색은 모두 다를 수 있어서 올라온 아바타의 배경색에 자동으로 맞춰야 한다. 아바타 셋팅하기처럼, 별도의 기능으로」
   하는 일: 아바타 사진(앞·옆·뒤) 한 장을 받아
     ① 배경색 읽기 — 사진 왼쪽·오른쪽 끝 띠(폭 1~4%)를 위→아래 24칸으로 나눠 칸마다 평균(왼쪽 L·오른쪽 R 따로)
     ② 배경 점검 — 단색인지(칸 안 얼룩), 왼쪽·오른쪽 밝기 차이, 위아래 색 튐 → 주의 문구
   결과(작은 숫자 묶음)는 앱(pc.js)이 아바타와 함께 저장해 두고, 피팅룸·홈·크게 보기 배경을 칠할 때 꺼내 쓴다.
   이 파일은 그림을 바꾸지 않는다(표준 틀 맞춤·빈 칸 채우기는 pc.js normAvatar 가 이미 사진 양끝 색으로 함). */
(function () {
  var N = 24, CW = 200;
  function loadImg(src) {
    return new Promise(function (ok, no) {
      if (src && src.tagName) { if (src.complete && src.naturalWidth) ok(src); else { src.addEventListener('load', function () { ok(src); }, { once: true }); src.addEventListener('error', no, { once: true }); } return; }
      var u = typeof src === 'string' ? src : URL.createObjectURL(src), im = new Image();
      im.onload = function () { if (typeof src !== 'string') URL.revokeObjectURL(u); ok(im); };
      im.onerror = function (e) { if (typeof src !== 'string') URL.revokeObjectURL(u); no(e); };
      im.src = u;
    });
  }
  /* img(그림 요소) → { L:[[r,g,b]…24], R:[…], warn:[문구], stat:{…} } */
  function analyzeImg(img) {
    var w = img.naturalWidth || img.videoWidth, h = img.naturalHeight || img.videoHeight; if (!w || !h) return null;
    var ch = Math.max(N, Math.round(CW * h / w)), c = document.createElement('canvas'); c.width = CW; c.height = ch;
    var g = c.getContext('2d', { willReadFrequently: true }); g.fillStyle = '#fff'; g.fillRect(0, 0, CW, ch); g.drawImage(img, 0, 0, CW, ch);
    var d = g.getImageData(0, 0, CW, ch).data, x0 = 2, x1 = 8, L = [], R = [], noise = 0, jump = 0, lr = 0;
    function band(y0, y1, xa, xb) {
      var s = [0, 0, 0], q = 0, n = 0, y, x, o, k;
      for (y = y0; y < y1; y++) for (x = xa; x < xb; x++) { o = (y * CW + x) * 4; for (k = 0; k < 3; k++) { s[k] += d[o + k]; q += d[o + k] * d[o + k]; } n++; }
      var m = [s[0] / n, s[1] / n, s[2] / n], mm = (m[0] * m[0] + m[1] * m[1] + m[2] * m[2]) / 3;
      return { m: m, sd: Math.sqrt(Math.max(0, q / (n * 3) - mm)) };
    }
    for (var i = 0; i < N; i++) {
      var ya = Math.floor(i * ch / N), yb = Math.max(ya + 1, Math.floor((i + 1) * ch / N));
      var l = band(ya, yb, x0, x1), r = band(ya, yb, CW - x1, CW - x0);
      L.push(l.m.map(Math.round)); R.push(r.m.map(Math.round));
      noise = Math.max(noise, l.sd, r.sd);
      lr = Math.max(lr, Math.abs(lum(l.m) - lum(r.m)));
      if (i) { jump = Math.max(jump, Math.abs(lum(l.m) - lum(L[i - 1])), Math.abs(lum(r.m) - lum(R[i - 1]))); }
    }
    var warn = [];
    if (noise > 18) warn.push('배경 가장자리에 무늬·물건·그림자가 있어요. 단색 벽 앞에서 찍으면 입은 모습 배경이 더 자연스러워요.');
    if (lr > 40) warn.push('사진 왼쪽·오른쪽 배경 밝기 차이가 커요(조명이 한쪽에서 비침). 그대로도 쓸 수 있지만 고르게 밝은 곳이 더 좋아요.');
    if (jump > 35) warn.push('배경 색이 위아래로 갑자기 바뀌는 곳이 있어요(문·가구 경계 등). 벽만 보이게 찍으면 더 좋아요.');
    return { L: L, R: R, warn: warn, stat: { noise: Math.round(noise), lr: Math.round(lr), jump: Math.round(jump) } };
  }
  function lum(c) { return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]; }
  /* 저장해 둔 결과 → pc.js 배경 칠하기가 쓰는 형식(배열 = 좌우 평균, .L/.R = 따로) */
  function toCols(r) {
    if (!r || !r.L || !r.R || r.L.length !== r.R.length) return null;
    var c = r.L.map(function (l, i) { return [0, 1, 2].map(function (k) { return Math.round((l[k] + r.R[i][k]) / 2); }); });
    c.L = r.L; c.R = r.R; return c;
  }
  window.AvatarSetup = {
    /* src: Blob·File·주소·<img> → Promise<결과|null> */
    run: function (src) { return loadImg(src).then(analyzeImg).catch(function () { return null; }); },
    analyzeImg: analyzeImg,
    toCols: toCols
  };
})();
