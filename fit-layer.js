/* 2026-11-17 ③ 배경·캐릭터 레이어 분리 시험본 (pc.js 반영 전).
   결과 그림(res)에서 사람만 오려(투명도 a) 원본 아바타(av)의 깨끗한 배경판 위에 다시 얹는다.
   - 사람 대략 영역: MediaPipe 구분(seg 결과, 0=배경) — 768 폭
   - 가장자리: 마스크 경계 띠 안에서만 「결과 그림 자신의 배경색(줄별 양끝 띠, 좌→우 보간)」과의 색 차이로 투명도 계산
   - 마스크 안쪽(줄인 영역)은 무조건 사람(흰 옷+밝은 배경 구멍 방지), 띠 밖은 무조건 배경(얼룩 제거)
   - 배경판: 아바타 원본에서 아바타 사람(넓힌 것)을 뺀 곳은 아바타 픽셀, 사람 자리는 아바타 줄별 배경색 보간으로 채움
   - 띠의 반투명 픽셀은 결과 배경색을 빼고(색 번짐 제거) 배경판 색과 섞는다
   못 하면 null */
(function (G) {
  var L = { W: 768, grow: 14, shrink: 3, T0: 12, T1: 42, avGrow: 10, fill: 90, minArea: 0.04, maxArea: 0.7, bright: 14, wTop: 0.30, wBot: 0.72, white: 0.5 };
  function rowBg(d, W, H) { /* 줄마다 왼쪽·오른쪽 띠 평균 (±6줄 평활) → [L,R] 각 rgb */
    var bw = Math.max(2, Math.round(W * 0.012)), o = new Float32Array(H * 6), y, i, k;
    for (y = 0; y < H; y++) for (k = 0; k < 3; k++) {
      var sl = 0, sr = 0; for (i = 0; i < bw; i++) { sl += d[(y * W + i) * 4 + k]; sr += d[(y * W + W - 1 - i) * 4 + k]; }
      o[y * 6 + k] = sl / bw; o[y * 6 + 3 + k] = sr / bw;
    }
    var p = new Float32Array(H * 6), j, s, m;
    for (y = 0; y < H; y++) for (k = 0; k < 6; k++) { s = 0; m = 0; for (j = Math.max(0, y - 6); j <= Math.min(H - 1, y + 6); j++) { s += o[j * 6 + k]; m++; } p[y * 6 + k] = s / m; }
    return p;
  }
  function bgAt(rb, W, x, y, k) { var t = x / (W - 1); return rb[y * 6 + k] * (1 - t) + rb[y * 6 + 3 + k] * t; }
  function upMask(m, mw, mh, W, H) { var o = new Uint8Array(W * H), x, y; for (y = 0; y < H; y++) { var sy = Math.min(mh - 1, Math.floor(y * mh / H)) * mw; for (x = 0; x < W; x++) o[y * W + x] = m[sy + Math.min(mw - 1, Math.floor(x * mw / W))] ? 1 : 0; } return o; }
  function box(mk, W, H, r) { /* 정사각 (2r+1) 안에 1 이 몇 개인지(누적합) */
    var t = new Int32Array(W * H), o = new Int32Array(W * H), x, y;
    for (y = 0; y < H; y++) { var ps = new Int32Array(W + 1), rb = y * W; for (x = 0; x < W; x++) ps[x + 1] = ps[x] + mk[rb + x]; for (x = 0; x < W; x++) t[rb + x] = ps[Math.min(W, x + r + 1)] - ps[Math.max(0, x - r)]; }
    for (x = 0; x < W; x++) { var p2 = new Int32Array(H + 1); for (y = 0; y < H; y++) p2[y + 1] = p2[y] + t[y * W + x]; for (y = 0; y < H; y++) o[y * W + x] = p2[Math.min(H, y + r + 1)] - p2[Math.max(0, y - r)]; }
    return o;
  }
  function grow(mk, W, H, r) { var b = box(mk, W, H, r), o = new Uint8Array(W * H); for (var i = 0; i < W * H; i++) o[i] = b[i] > 0 ? 1 : 0; return o; }
  function shrink(mk, W, H, r) { var full = (2 * r + 1) * (2 * r + 1), b = box(mk, W, H, r), o = new Uint8Array(W * H), x, y; for (y = 0; y < H; y++) for (x = 0; x < W; x++) { var i = y * W + x, nx = Math.min(W - 1, x + r) - Math.max(0, x - r) + 1, ny = Math.min(H - 1, y + r) - Math.max(0, y - r) + 1; o[i] = b[i] >= nx * ny ? 1 : 0; } return o; }
  function blur(a, W, H, r) { var R = Math.max(1, r), o = new Float32Array(W * H), t = new Float32Array(W * H), x, y, s; for (y = 0; y < H; y++) { s = 0; for (x = -R; x <= R; x++) s += a[y * W + Math.min(W - 1, Math.max(0, x))]; for (x = 0; x < W; x++) { t[y * W + x] = s / (2 * R + 1); s += a[y * W + Math.min(W - 1, x + R + 1)] - a[y * W + Math.max(0, x - R)]; } } for (x = 0; x < W; x++) { s = 0; for (y = -R; y <= R; y++) s += t[Math.min(H - 1, Math.max(0, y)) * W + x]; for (y = 0; y < H; y++) { o[y * W + x] = s / (2 * R + 1); s += t[Math.min(H - 1, y + R + 1) * W + x] - t[Math.max(0, y - R) * W + x]; } } return o; }
  /* R, V = Image(결과, 아바타), mr / ma = 768 폭 구분 결과(0 배경) — 없으면 seg 로 만든다 */
  function bgLayerCore(R, V, mr, ma, mw, mh) {
    var W = R.naturalWidth, H = R.naturalHeight, N = W * H, i, k, x, y;
    if (!W || !H || Math.abs(W / H - V.naturalWidth / V.naturalHeight) > 0.03) return null;
    function px(img) { var c = document.createElement('canvas'); c.width = W; c.height = H; var g = c.getContext('2d', { willReadFrequently: true }); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.drawImage(img, 0, 0, W, H); return { c: c, g: g, id: g.getImageData(0, 0, W, H) }; }
    var r = px(R), a = px(V), d = r.id.data, b = a.id.data;
    var m = upMask(mr, mw, mh, W, H), area = 0; for (i = 0; i < N; i++) area += m[i];
    if (area < N * L.minArea || area > N * L.maxArea) return null;
    var sc = W / 867, inner = shrink(m, W, H, Math.max(1, Math.round(L.shrink * sc))), outer = grow(m, W, H, Math.round(L.grow * sc));
    var rbR = rowBg(d, W, H), rbA = rowBg(b, W, H);
    /* 2026-11-17 흰 옷 판정(B안): 사람 몸통~치마 구역(키의 30~72%) 안쪽 픽셀 중 결과 배경색과 색 차이가 작은(e<T1) 비율이 높으면
       옷이 배경과 구분 안 되는 것 → 레이어 분리를 포기(fail 'white')하고 예전 배경색 맞춤으로 넘긴다 */
    var wy0 = H, wy1 = -1; for (i = 0; i < N; i++) if (m[i]) { var wy = (i / W) | 0; if (wy < wy0) wy0 = wy; if (wy > wy1) wy1 = wy; }
    var wa = wy0 + (wy1 - wy0) * L.wTop, wb = wy0 + (wy1 - wy0) * L.wBot, wn = 0, wnear = 0, wlum = 0;
    for (y = Math.max(0, Math.floor(wa)); y < Math.min(H, Math.ceil(wb)); y++) for (x = 0; x < W; x++) {
      i = y * W + x; if (!inner[i]) continue; var ow = i * 4, ew = 0; for (k = 0; k < 3; k++) ew = Math.max(ew, Math.abs(d[ow + k] - bgAt(rbR, W, x, y, k)));
      wn++; if (ew < L.T1) wnear++; wlum += 0.299 * d[ow] + 0.587 * d[ow + 1] + 0.114 * d[ow + 2];
    }
    L.lastWhite = wn ? wnear / wn : 0; L.lastLum = wn ? wlum / wn : 0;
    if (L.white > 0 && L.lastWhite > L.white) return { fail: 'white ' + L.lastWhite.toFixed(3) };
    /* 투명도 */
    var al = new Float32Array(N);
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x; if (inner[i]) { al[i] = 1; continue; } if (!outer[i]) continue;
      var o = i * 4, e = 0; for (k = 0; k < 3; k++) e = Math.max(e, Math.abs(d[o + k] - bgAt(rbR, W, x, y, k)));
      al[i] = e <= L.T0 ? 0 : e >= L.T1 ? 1 : (e - L.T0) / (L.T1 - L.T0);
    }
    /* 2026-11-17 구분 마스크 구멍 메우기: 마스크가 몸 옆을 크게(띠보다 넓게) 놓친 곳을 사람 색(배경과 크게 다름)으로 이어서 채운다.
       사람 안쪽에서 시작해 배경과 확실히 다른 픽셀(e>=T1)만, 거리 한도 안에서, 발밑 구역 위쪽에서만 번진다(바닥 그림자·배경 얼룩은 제외) */
    var gy0 = H, gy1 = -1; for (i = 0; i < N; i++) if (m[i]) { var yy0 = (i / W) | 0; if (yy0 < gy0) gy0 = yy0; if (yy0 > gy1) gy1 = yy0; }
    var gyMax = gy1 - (gy1 - gy0) * 0.16, gLim = Math.round(L.fill * sc), dist = new Int16Array(N), qu = new Int32Array(N), qh = 0, qt = 0;
    for (y = 1; y < H - 1; y++) for (x = 1; x < W - 1; x++) { i = y * W + x; if (al[i] >= 0.99 && (al[i - 1] === 0 || al[i + 1] === 0 || al[i - W] === 0 || al[i + W] === 0)) { qu[qt++] = i; } }
    while (qh < qt) {
      i = qu[qh++]; x = i % W; y = (i - x) / W; var dd = dist[i]; if (dd >= gLim) continue;
      var nb = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1];
      for (var ni = 0; ni < 4; ni++) {
        var j = nb[ni]; if (j < 0 || al[j] !== 0 || dist[j] || m[j]) continue;
        var jx = j % W, jy = (j - jx) / W; 
        var o3 = j * 4, e3 = 0; for (k = 0; k < 3; k++) e3 = Math.max(e3, Math.abs(d[o3 + k] - bgAt(rbR, W, jx, jy, k)));
        var lum3 = 0.299 * (d[o3] - bgAt(rbR, W, jx, jy, 0)) + 0.587 * (d[o3 + 1] - bgAt(rbR, W, jx, jy, 1)) + 0.114 * (d[o3 + 2] - bgAt(rbR, W, jx, jy, 2));
        if (e3 < (jy > gyMax ? L.T1 * 2 : L.T1) && !(jy <= gyMax && lum3 >= L.bright)) continue; /* 흰 옷: 배경보다 밝은 픽셀은 색 차이가 작아도 사람으로 잇는다(그림자는 어두워서 제외) */ /* 발밑 구역은 바닥 그림자 때문에 기준 2배 */
        al[j] = 1; dist[j] = dd + 1; qu[qt++] = j;
      }
    }
    /* 2026-11-17 구멍 검사: 채우기로도 못 이은 곳(배경과 확실히 다른데 사람으로 안 잡힌 픽셀)이 사람 옆에 많으면 합성 포기(→ 예전 배경색 맞춤) */
    var leak = 0, outer2 = grow(m, W, H, Math.round(L.fill * sc * 1.5));
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) { i = y * W + x; if (al[i] > 0 || !outer2[i]) continue; var o4 = i * 4, e4 = 0; for (k = 0; k < 3; k++) e4 = Math.max(e4, Math.abs(d[o4 + k] - bgAt(rbR, W, x, y, k))); if (e4 >= (y > gyMax ? L.T1 * 2 : L.T1 * 1.5)) leak++; }
    if (leak > area * 0.004) return { fail: 'leak ' + (leak / area).toFixed(4) };
    L.lastLeak = leak / area;
    /* 띠 안 1px 잡티 정리: 아주 약하게 흐린 값과 원래 값 중 작은 쪽(바깥 점 제거) — 안쪽은 그대로 */
    var bl = blur(al, W, H, 1); for (i = 0; i < N; i++) if (!inner[i] && outer[i]) al[i] = Math.min(al[i], bl[i] * 1.15 > 1 ? 1 : bl[i] * 1.15);
    var kept = 0; for (i = 0; i < N; i++) kept += al[i];
    if (kept < area * 0.85 || kept > area * 1.25) return { fail: 'area ' + (kept / area).toFixed(3) };
    /* 배경판 */
    var am = upMask(ma, mw, mh, W, H), amG = grow(am, W, H, Math.round(L.avGrow * sc)), plate = new Uint8ClampedArray(N * 4);
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) { i = y * W + x; var q = i * 4; for (k = 0; k < 3; k++) plate[q + k] = amG[i] ? bgAt(rbA, W, x, y, k) : b[q + k]; plate[q + 3] = 255; }
    /* 사람 자리 채운 곳과 원래 배경 경계를 부드럽게 */
    var pf = new Float32Array(N); for (i = 0; i < N; i++) pf[i] = amG[i]; pf = blur(pf, W, H, Math.round(6 * sc));
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) { i = y * W + x; if (pf[i] <= 0 || pf[i] >= 1) continue; var q2 = i * 4; for (k = 0; k < 3; k++) plate[q2 + k] = bgAt(rbA, W, x, y, k) * pf[i] + b[q2 + k] * (1 - pf[i]); }
    /* 발밑 구역: 사람 아래쪽 넓은 네모(가장자리 부드럽게). 배경판은 아바타 배경색 보간(아바타 그림자 자국 제거),
       결과 그림의 그림자 명암(결과 밝기 ÷ 결과 배경색 밝기)만 배경판에 곱한다 → 그림자는 결과 그대로, 얼룩·색 변화는 버림 */
    var y0 = H, y1 = -1, x0 = W, x1 = -1;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) if (m[y * W + x]) { if (y < y0) y0 = y; if (y > y1) y1 = y; if (x < x0) x0 = x; if (x > x1) x1 = x; }
    var ph = y1 - y0, fz = { t: y1 - ph * 0.16, l: x0 - W * 0.12, r: x1 + W * 0.12, f: 40 * sc }, wz = new Float32Array(N);
    function ramp(v) { return v <= 0 ? 0 : v >= 1 ? 1 : v; }
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) wz[y * W + x] = ramp((y - fz.t) / fz.f) * ramp((x - fz.l) / fz.f) * ramp((fz.r - x) / fz.f);
    for (i = 0; i < N; i++) { if (!wz[i]) continue; var q4 = i * 4, xx = i % W, yy = (i - xx) / W; for (k = 0; k < 3; k++) plate[q4 + k] = plate[q4 + k] * (1 - wz[i]) + bgAt(rbA, W, xx, yy, k) * wz[i]; }
    /* 합성 (+띠 색 번짐 제거) */
    var cut = new Uint8ClampedArray(N * 4), out = r.g.createImageData(W, H), od = out.data;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x; var q3 = i * 4, A = al[i], sh = 1;
      if (wz[i] && A < 1) {
        var lr = 0.299 * d[q3] + 0.587 * d[q3 + 1] + 0.114 * d[q3 + 2], lb = 0.299 * bgAt(rbR, W, x, y, 0) + 0.587 * bgAt(rbR, W, x, y, 1) + 0.114 * bgAt(rbR, W, x, y, 2);
        sh = lb > 1 ? lr / lb : 1; sh = sh < 0.25 ? 0.25 : sh > 1 ? 1 : sh; sh = 1 + (sh - 1) * wz[i];
      }
      for (k = 0; k < 3; k++) {
        var F = d[q3 + k];
        if (A > 0 && A < 1) { F = (d[q3 + k] - (1 - A) * bgAt(rbR, W, x, y, k)) / A; F = F < 0 ? 0 : F > 255 ? 255 : F; }
        var o1 = F * A + plate[q3 + k] * (1 - A);
        if (wz[i] && A < 1) { /* 발밑: 결과 픽셀에 배경 톤 차이만 더한다(그림자·신발 가장자리 그대로, 테두리 없음) */
          var o2 = d[q3 + k] + (1 - A) * sh * (plate[q3 + k] - bgAt(rbR, W, x, y, k)), lim = plate[q3 + k] + A * 255;
          if (o2 > lim) o2 = lim; /* 그림자(어두워짐)만 살리고 밝은 얼룩은 배경판보다 밝아지지 않게 */
          o1 = o1 * (1 - wz[i]) + o2 * wz[i];
        }
        cut[q3 + k] = F; od[q3 + k] = o1;
      }
      cut[q3 + 3] = Math.round(A * 255); od[q3 + 3] = 255;
    }
    return { W: W, H: H, out: out, cut: new ImageData(cut, W, H), plate: new ImageData(plate, W, H), keep: kept / area };
  }
  G.FitLayer = { L: L, core: bgLayerCore };
})(window);
