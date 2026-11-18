/* FaceKeep — 입힌 결과 이미지의 얼굴을 원본 아바타 얼굴로 되돌린다(AI가 매번 얼굴을 다시 그려 달라지는 문제 대응).
   1) 아바타에서 머리 영역(사람 윗부분)을 찾고 2) 결과 이미지에서 같은 머리 위치를 맞춰 3) 원본 머리를 가장자리를 부드럽게 섞어 덮는다.
   전신 사진이 아니거나 위치가 안 맞으면 아무것도 바꾸지 않고 원래 결과를 그대로 돌려준다. */
(function () {
  var HEAD = 0.17;            /* 머리 영역 = 사람 키의 위쪽 17% (정수리~턱) */
  var BASE_W = 720;           /* 분석용 기준 너비 */

  function loadImg(blob) {
    return new Promise(function (ok, no) {
      var u = URL.createObjectURL(blob), im = new Image();
      im.onload = function () { URL.revokeObjectURL(u); ok(im); };
      im.onerror = function () { URL.revokeObjectURL(u); no(new Error('img')); };
      im.src = u;
    });
  }
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function gray(img, w, h) {
    var c = cv(w, h), x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, w, h);
    var d = x.getImageData(0, 0, w, h).data, g = new Float32Array(w * h), rgb = d;
    for (var i = 0; i < w * h; i++) g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    return { g: g, d: rgb, w: w, h: h };
  }
  function median(a) { a = a.slice().sort(function (p, q) { return p - q; }); return a[a.length >> 1]; }

  /* 아바타에서 사람 영역(배경과 다른 곳)의 위·아래·머리 좌우 범위 */
  function findHead(G) {
    var w = G.w, h = G.h, d = G.d, x, y, M = 6;
    /* 배경 = 그 줄의 왼쪽·오른쪽 가장자리 색을 이어 만든 그라데이션(비네팅 있는 배경 대응) */
    function edge(py, side, k) { var s = 0, c = 0; for (var i = 0; i < 4; i++) { s += d[(py * w + (side ? w - 1 - i : i)) * 4 + k]; c++; } return s / c; }
    var L = [], Rr = [];
    for (y = 0; y < h; y++) { L.push([edge(y, 0, 0), edge(y, 0, 1), edge(y, 0, 2)]); Rr.push([edge(y, 1, 0), edge(y, 1, 1), edge(y, 1, 2)]); }
    function fg(px, py) {
      if (px < M || px >= w - M || py < M || py >= h - M) return false;
      var o = (py * w + px) * 4, t = px / (w - 1), sum = 0;
      for (var k = 0; k < 3; k++) sum += Math.abs(d[o + k] - (L[py][k] * (1 - t) + Rr[py][k] * t));
      return sum > 54;
    }
    var y0 = -1, y1 = -1, row;
    for (y = 0; y < h; y++) { row = 0; for (x = 0; x < w; x++) if (fg(x, y)) row++; if (row >= 3) { if (y0 < 0) y0 = y; y1 = y; } }
    if (y0 < 0) return null;
    var hh = (y1 - y0) * HEAD, yEnd = Math.round(y0 + hh), xa = w, xb = -1;
    for (y = y0; y <= yEnd; y++) for (x = 0; x < w; x++) if (fg(x, y)) { if (x < xa) xa = x; if (x > xb) xb = x; }
    if (xb < 0) return null;
    return { y0: y0, y1: y1, yEnd: yEnd, xa: xa, xb: xb, full: (y1 - y0) / h };
  }

  /* 머리 조각(a의 상자)과 가장 잘 겹치는 위치·크기를 b에서 찾는다. 밝기 평균을 빼고 비교해 조명 차이에 덜 민감하게 */
  function score(A, B, bx, by, sx, sy, ox, oy, s, step) {
    var n = 0, sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, i, j, ag = A.g, bg = B.g, aw = A.w, bw = B.w;
    for (j = 0; j < sy; j += step) for (i = 0; i < sx; i += step) {
      var tx = Math.round(ox + i * s), ty = Math.round(oy + j * s);
      if (tx < 0 || ty < 0 || tx >= bw || ty >= B.h) return 1e12;
      var va = ag[(by + j) * aw + bx + i], vb = bg[ty * bw + tx];
      sa += va; sb += vb; saa += va * va; sbb += vb * vb; sab += va * vb; n++;
    }
    /* 평균을 뺀 값끼리의 차이 제곱 평균 (조명 차이에 덜 민감) */
    return ((saa - sa * sa / n) + (sbb - sb * sb / n) - 2 * (sab - sa * sb / n)) / n;
  }
  function align(A, B, box, scale) {
    var bw = box.xb - box.xa + 1, bh = box.yEnd - box.y0 + 1, best = { e: 1e12, s: 1, ox: box.xa, oy: box.y0 }, s, dx, dy, e;
    var R = Math.round(A.w * 0.09), ss = [0.92, 0.96, 1, 1.04, 1.08];
    for (var si = 0; si < ss.length; si++) { s = ss[si];
      for (dy = -R; dy <= R; dy += 2) for (dx = -R; dx <= R; dx += 2) {
        e = score(A, B, box.xa, box.y0, bw, bh, box.xa + dx, box.y0 + dy, s, 3);
        if (e < best.e) best = { e: e, s: s, ox: box.xa + dx, oy: box.y0 + dy };
      }
    }
    /* 한 번 더 촘촘하게 */
    var c = best, s2;
    for (s2 = c.s - 0.02; s2 <= c.s + 0.021; s2 += 0.01)
      for (dy = -2; dy <= 2; dy++) for (dx = -2; dx <= 2; dx++) {
        e = score(A, B, box.xa, box.y0, bw, bh, c.ox + dx, c.oy + dy, s2, 1);
        if (e < best.e) best = { e: e, s: s2, ox: c.ox + dx, oy: c.oy + dy };
      }
    best.base = score(A, B, box.xa, box.y0, bw, bh, box.xa, box.y0, 1, 2);
    return best;
  }

  /* resultBlob: 서버가 만든 입은 모습, avatarBlob: 그때 보낸 아바타. 성공하면 얼굴을 되돌린 Blob, 아니면 resultBlob 그대로 */
  function apply(resultBlob, avatarBlob, opt) {
    opt = opt || {};
    return Promise.all([loadImg(resultBlob), loadImg(avatarBlob)]).then(function (im) {
      var R = im[0], V = im[1];
      if (Math.abs(R.naturalWidth / R.naturalHeight - V.naturalWidth / V.naturalHeight) > 0.03) return resultBlob;
      var w = BASE_W, h = Math.round(w * V.naturalHeight / V.naturalWidth);
      var A = gray(V, w, h), B = gray(R, w, h), box = findHead(A);
      if (!box || box.full < 0.6) return resultBlob;               /* 전신 사진이 아님 */
      var bw = box.xb - box.xa + 1, bh = box.yEnd - box.y0 + 1;
      if (bw < 30 || bh < 30) return resultBlob;
      var p = align(A, B, box), ok = isFinite(p.e) && p.e < 1e11;
      if (opt.debug) opt.debug.info = { box: box, p: p };
      if (!ok || p.e > (opt.limit || 900)) return resultBlob;      /* 머리 위치를 못 맞춤 → 원래 결과 유지 */
      /* 결과 이미지 실제 해상도 기준 좌표로 환산 */
      var k = R.naturalWidth / w, pad = Math.round(bw * 0.12);
      /* 아바타 상자(작은 좌표)가 결과 이미지의 어느 위치·크기로 가는지 */
      function mapX(ax) { return (p.ox + (ax - box.xa) * p.s) * k; }
      function mapY(ay) { return (p.oy + (ay - box.y0) * p.s) * k; }
      var ax0 = box.xa - pad, ay0 = Math.max(0, box.y0 - pad), ax1 = box.xb + 1 + pad, ay1 = box.yEnd + 1 + Math.round(bh * 0.08);
      var dx0 = mapX(ax0), dy0 = mapY(ay0), dw = (ax1 - ax0) * p.s * k, dh = (ay1 - ay0) * p.s * k;
      var out = cv(R.naturalWidth, R.naturalHeight), ctx = out.getContext('2d');
      ctx.drawImage(R, 0, 0);
      var t = cv(Math.max(1, Math.round(dw)), Math.max(1, Math.round(dh))), tc = t.getContext('2d');
      tc.drawImage(V, ax0 / w * V.naturalWidth, ay0 / h * V.naturalHeight, (ax1 - ax0) / w * V.naturalWidth, (ay1 - ay0) / h * V.naturalHeight, 0, 0, t.width, t.height);
      /* 타원형 부드러운 가장자리 */
      tc.globalCompositeOperation = 'destination-in';
      tc.save(); tc.translate(t.width / 2, t.height / 2); tc.scale(1, t.height / t.width);
      var rr = t.width / 2, g = tc.createRadialGradient(0, 0, rr * 0.62, 0, 0, rr);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      tc.fillStyle = g; tc.fillRect(-rr, -rr, rr * 2, rr * 2); tc.restore();
      ctx.drawImage(t, dx0, dy0);
      return new Promise(function (done) {
        out.toBlob(function (b) { done(b || resultBlob); }, /png/i.test(resultBlob.type) ? 'image/png' : 'image/jpeg', 0.94);
      });
    }).catch(function () { return resultBlob; });
  }
  window.FaceKeep = { apply: apply };
})();
