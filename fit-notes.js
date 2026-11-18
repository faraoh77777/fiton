/* FITON 피팅룸 대기 화면 안내 — 옷장 데이터를 aifit/ 사이즈 분석 코드에 연결하는 어댑터.
   저장된 옷 데이터는 읽기만 한다(저장 형식은 폰·PC 공통이라 바꾸지 않는다).
   결과는 '참고용 안내'로만 쓴다. 피팅룸 핏 판정(fit-engine.js)은 그대로 둔다(2026-11-06 사용자 결정).
   브라우저: window.FitNotes / Node(시험): require('./fit-notes.js') */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else root.FitNotes = factory(root);
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  /* 옷장 항목(필드 이름) → 사이즈표 머리글. flat=단면(펼친 폭), circ=둘레 */
  var HEAD = {
    top: { chest: ['가슴단면', '가슴둘레'], shoulder: ['어깨너비', '어깨너비'], length: ['총장', '총장'], sleeve: ['소매길이', '소매길이'] },
    bottom: { waist: ['허리단면', '허리둘레'], hip: ['엉덩이단면', '엉덩이둘레'], thigh: ['허벅지단면', '허벅지둘레'], rise: ['밑위', '밑위'], inseam: ['인심길이', '인심길이'], length: ['총장', '총장'] },
    dress: { chest: ['가슴단면', '가슴둘레'], shoulder: ['어깨너비', '어깨너비'], waist: ['허리단면', '허리둘레'], hip: ['엉덩이단면', '엉덩이둘레'], length: ['총장', '총장'], sleeve: ['소매길이', '소매길이'] }
  };
  var ORDER = { warn: 0, result: 1, info: 2, tip: 3 };

  function libs() {
    if (typeof require === 'function' && typeof module === 'object') {
      var N = require('./aifit/size-normalizer.js').create(require('./aifit/size-dictionary.json'));
      return { N: N, F: require('./aifit/style-fit.js').create(require('./aifit/style-profiles.json')), NT: require('./aifit/fitting-notices.js') };
    }
    if (!root.SizeNormalizer || !root.StyleFit || !root.FittingNotices || !root.AIFIT_DICT) return null;
    var N2 = root.SizeNormalizer.create(root.AIFIT_DICT);
    return { N: N2, F: root.StyleFit.create(root.AIFIT_PROFILES), NT: root.FittingNotices };
  }
  var cache = null;
  function L() { return cache || (cache = libs()); }

  function engCat(c) { return c === 'outer' || c === 'inner' ? 'top' : c; }
  /* fiton 은 female/male, aifit 은 women/men 으로 쓴다(그대로 넘기면 여성도 남성 기준으로 계산된다) */
  function aiGender(g) { return g === 'male' ? 'men' : 'women'; }

  /* 옷장 항목 → 사이즈표(2차원). 값이 하나도 없는 항목(열)은 뺀다 */
  function tableOf(it) {
    var cat = engCat(it.cat), heads = HEAD[cat];
    if (!heads) return null;
    var circ = it.measureType === 'circ', rows = (it.sizes || []).filter(function (r) { return r && String(r.label || '').trim(); });
    var keys = Object.keys(heads).filter(function (k) { return rows.some(function (r) { return r[k] !== '' && r[k] != null && isFinite(parseFloat(r[k])); }); });
    if (!keys.length || rows.length < 1) return null;
    return [['사이즈'].concat(keys.map(function (k) { var h = heads[k]; return h[circ ? 1 : 0]; }))]
      .concat(rows.map(function (r) { return [String(r.label)].concat(keys.map(function (k) { return r[k] == null ? '' : String(r[k]); })); }));
  }

  /* body: { height, chest, waist, hip, shoulder, thigh, inseam, arm, rise } (cm) — 앱이 쓰는 값(입력값 또는 키·몸무게 추정값) */
  function one(it, sizeLabel, gender, body) {
    var lib = L(); if (!lib) return null;
    var cat = engCat(it.cat);
    if (!HEAD[cat]) return null;
    var table = tableOf(it); if (!table) return null;
    var g = aiGender(gender);
    var r = lib.N.normalizeTable(table, { category: cat, gender: g, title: it.measureType === 'circ' ? '둘레' : '단면' });
    if (!r.sizes.length) return null;
    var ex = { result: r, warnings: [], notes: [] };
    var ev = null, rec = null;
    var b = Object.assign({ gender: g }, body || {});
    if (b.height) {
      var st = lib.F.detectStyle(it.name || '', cat);
      if (st) {
        var cur = r.sizes.filter(function (s) { return s.label === sizeLabel || s.std === sizeLabel; })[0] || r.sizes[0];
        try { ev = lib.F.evaluate(cur, b, st.styleId); rec = lib.F.recommend(r.sizes, b, st.styleId); } catch (e) { ev = rec = null; }
      }
    }
    return lib.NT.build({ extract: ex, normalized: r, evaluation: ev, recommend: rec });
  }

  /* set: [{ item, size }] (피팅룸에 입히는 옷들). 반환: { slides, footer, confidence } 또는 null */
  function forSet(set, profile, body) {
    var lib = L(); if (!lib) return null;
    var outs = [];
    set.forEach(function (x) { try { var o = one(x.item, x.size, profile && profile.gender, body); if (o) outs.push({ it: x.item, o: o }); } catch (e) { /* 이 옷은 건너뜀 */ } });
    var multi = set.length > 1, seen = {}, slides = [], tips = [];
    outs.forEach(function (x) {
      x.o.slides.forEach(function (s) {
        var s2 = Object.assign({}, s);
        /* 옷이 둘 이상이면 어느 옷 얘기인지 앞에 붙인다 */
        if (multi && s.type !== 'tip') s2.title = '[' + String(x.it.name || '').slice(0, 14) + '] ' + s.title;
        if (seen[s2.title]) return; seen[s2.title] = 1;
        (s2.type === 'tip' ? tips : slides).push(s2);
      });
    });
    slides.sort(function (a, b) { return ORDER[a.type] - ORDER[b.type] || (a.priority || 9) - (b.priority || 9); });
    var want = Math.max(2, 5 - slides.length);
    slides = slides.concat(tips.slice(0, want));
    if (!slides.length) {
      /* 분석할 치수가 없으면 일반 팁만 */
      var T = lib.NT.TIPS || []; slides = T.slice(0, 3).map(function (t) { return Object.assign({ type: 'tip' }, t); });
    }
    var conf = null, rank = { '낮음': 0, '보통': 1, '높음': 2 };
    outs.forEach(function (x) { if (x.o.confidence && (conf == null || rank[x.o.confidence] < rank[conf])) conf = x.o.confidence; });
    return { slides: slides.slice(0, 8), footer: lib.NT.FOOTER, confidence: conf };
  }

  /* ---------- AI 사이즈표 읽기(서버 함수 sizeread) ---------- */
  var FIELD_KEYS = { top: ['chest', 'shoulder', 'length', 'sleeve', 'armhole', 'sleeve_width', 'hem'], bottom: ['waist', 'hip', 'thigh', 'knee', 'rise', 'inseam', 'hem', 'length'], dress: ['chest', 'shoulder', 'waist', 'hip', 'length', 'sleeve', 'armhole', 'sleeve_width', 'hem'] };
  function enabled() { var c = root.TRYON_CFG; return !!(c && c.url && c.anon && c.sizeRead && root.SizeExtract); }

  /* size-extract 결과 → 앱 옷장 형식 { sizes:[{label, chest, ...}], measureType, dropped }
     2026-11-12 사용자 결정(A+B): aifit 은 단면을 ×2 해 둘레로 바꿔 주지만, 사이즈표가 단면이면 숫자를 이미지 그대로(단면) 넣는다
     (핏 계산은 measureType 'flat' 이면 ×2 해서 계산하므로 결과는 같다). 한 표에 단면·둘레가 섞여 있으면 예전처럼 둘레로 넣는다.
     넣을 칸이 없거나 이름을 몰라 뺀 열은 dropped(이미지의 머리글 그대로)로 알려 준다 */
  function hemKey(m) { return m.leg_opening != null ? 'leg_opening' : m.skirt_hem != null ? 'skirt_hem' : 'hem'; }
  function defOf(cat, k) {
    var lib = L(), d = lib && lib.N && lib.N.dict && lib.N.dict.keys[cat] && lib.N.dict.keys[cat][k];
    if (d && d.ref) { var p = d.ref.split('.'); d = lib.N.dict.keys[p[0]][p[1]]; }
    return d || null;
  }
  function toCloset(report, cat) {
    var ec = engCat(cat), keys = FIELD_KEYS[ec];
    if (!report || !report.found || !report.result || !keys) return null;
    var res = report.result, cols = res.columns || {};
    /* 칸마다 실제로 쓴 측정 키(밑단은 바지/치마 키) */
    var used = {};
    res.sizes.forEach(function (z) { var m = z.measurements || {}; keys.forEach(function (k) { var mk = k === 'hem' && m[k] == null ? hemKey(m) : k; if (m[mk] != null) used[k] = mk; }); });
    var circK = Object.keys(used).filter(function (k) { var d = defOf(ec, used[k]); return d && d.measure === 'circ'; });
    var halfK = circK.filter(function (k) { return /단면×2/.test((cols[used[k]] || {}).conversion || ''); });
    var flat = circK.length > 0 && halfK.length === circK.length;
    var sizes = res.sizes.map(function (z) {
      /* 사이즈 이름도 이미지 그대로(2026-11-12 「이미지 표」부터 괄호 설명 XS(44) 도 그대로 둔다. 핏 계산 stdLookup 은 괄호 안팎을 나눠 읽는다) */
      var row = { label: String(z.label).trim() || String(z.std || z.label) }, m = z.measurements || {};
      keys.forEach(function (k) {
        var v = used[k] ? m[used[k]] : null; if (v == null) return;
        if (flat && circK.indexOf(k) >= 0) v = Math.round(v / 2 * 10) / 10;
        row[k] = String(v);
      });
      return row;
    });
    var keepRow = sizes.map(function (r) { return keys.some(function (k) { return r[k] != null; }); });
    sizes = sizes.filter(function (r, i) { return keepRow[i]; });
    /* 뺀 열: 이름을 모르는 열 + 알지만 이 옷 종류에 칸이 없는 열(신체 권장치 열은 뺌) */
    var usedMk = Object.keys(used).map(function (k) { return used[k]; }), dropped = [];
    /* 머리글 앞 번호(「3.허리」의 3.)는 떼고 보여 준다 */
    var add = function (h) { h = String(h || '').trim().replace(/^\d+\s*[.)]\s*/, ''); if (h && dropped.indexOf(h) < 0) dropped.push(h); };
    (res.unknownHeaders || []).forEach(add);
    Object.keys(cols).forEach(function (ck) { var c = cols[ck], base = ck.split('@')[0]; if (c.group === 'body' || usedMk.indexOf(base) >= 0 || ck.indexOf('@') >= 0) return; add(c.header || base); });
    if (!sizes.length) return null;
    var out = { sizes: sizes, measureType: flat ? 'flat' : 'circ', dropped: dropped, warnings: (report.warnings || []).concat(res.warnings || []) };
    /* 2026-11-12 「이미지 표」: 항목 이름·순서·사이즈 이름·숫자를 이미지 그대로 담은 표. 계산용 값(sizes)은 이 표에서 다시 만든다 */
    try {
      var tb = imgTable(report, ec, used, flat, circK, keepRow);
      if (tb) {
        var old = sizes, now = tblSizes(tb);
        out.table = tb; out.sizes = now;
        /* 표에 그대로 남긴 항목(계산에는 안 씀) / 표에도 못 넣은 항목(글로 적힌 사이즈의 모르는 이름) */
        out.unused = tb.head.filter(function (hh, i) { return !tb.keys[i] && String(hh).trim(); });
        out.dropped = dropped.filter(function (d) { return !tb.head.some(function (hh) { return String(hh).trim().replace(/^\d+\s*[.)]\s*/, '') === d; }); });
        /* 예전에는 보통 범위 밖이라 빼던 값: 이제 이미지 그대로 넣고, 확인하라고 알려 준다 */
        out.check = [];
        now.forEach(function (r, i) { var o = old[i] || {}; Object.keys(r).forEach(function (k) { if (k !== 'label' && o[k] == null) out.check.push(r.label + ' ' + tb.head[tb.keys.indexOf(k)] + ' ' + tb.rows[i][tb.keys.indexOf(k) + 1]); }); });
      }
    } catch (e) { /* 표를 못 만들면 예전처럼 값만 넘긴다(화면이 앱 기본 이름으로 표를 만든다) */ }
    return out;
  }

  /* ---------- 「이미지 표」(2026-11-12) ----------
     table = { head:[항목 이름…], keys:[계산에 쓰는 칸 이름 또는 null…], conv:[[곱, 나눔] 또는 null…], rows:[[사이즈 이름, 값…]…], mt:'flat'|'circ' }
     head·rows 는 이미지(또는 사용자가 입력한) 글자 그대로. keys 가 null 인 항목은 표에만 두고 핏 계산에는 안 쓴다.
     계산용 값 = round1(round1(숫자×곱)÷나눔) (conv 가 null 이면 입력한 글자 그대로) — AI 읽기 때 정한 환산(인치·단면×2)을 그대로 되풀이한다 */
  var CIRC_KEYS = { chest: 1, waist: 1, hip: 1, thigh: 1, knee: 1, hem: 1, armhole: 1, sleeve_width: 1 };
  function r1(v) { return Math.round(v * 10) / 10; }
  function parseNum(c) { var lib = L(); if (lib && lib.N.parseNumber) { var n = lib.N.parseNumber(c); return n ? n.value : null; } var v = parseFloat(c); return isFinite(v) ? v : null; }
  function colVal(cell, conv) {
    var s = cell == null ? '' : String(cell);
    if (s.trim() === '') return null;
    if (!conv) return s;
    var n = parseNum(s); if (n == null) return null;
    return String(r1(r1(n * conv[0]) / conv[1]));
  }
  function okTable(t) {
    return !!(t && Array.isArray(t.head) && Array.isArray(t.keys) && Array.isArray(t.conv) && Array.isArray(t.rows) && t.keys.length === t.head.length && t.conv.length === t.head.length &&
      t.rows.every(function (r) { return Array.isArray(r) && r.length === t.head.length + 1; }));
  }
  /* 표 → 계산용 sizes(사이즈 이름이 빈 줄은 뺀다) */
  function tblSizes(t) {
    return t.rows.filter(function (r) { return String(r[0] == null ? '' : r[0]).trim() !== ''; }).map(function (r) {
      var o = { label: r[0] };
      t.keys.forEach(function (k, i) { if (!k || o[k] != null) return; var v = colVal(r[i + 1], t.conv[i]); if (v != null) o[k] = v; });
      return o;
    });
  }
  /* 예전 옷·직접 입력·예비 글자 인식: 앱 기본 항목 이름으로 표를 만든다. fields = [[칸 이름, 화면 이름]…] (pc.js FIELDS) */
  function tblFromSizes(cat, mt, sizes, fields) {
    var circ = mt === 'circ', head = [], keys = [], conv = [];
    (fields || []).forEach(function (f) { keys.push(f[0]); head.push(circ ? f[1].replace('단면', '둘레') : f[1]); conv.push(null); });
    /* 이 옷 종류의 기본 칸에 없는 값도 잃지 않게 열로 둔다 */
    (sizes || []).forEach(function (z) { Object.keys(z || {}).forEach(function (k) { if (k !== 'label' && keys.indexOf(k) < 0) { keys.push(k); head.push(k); conv.push(null); } }); });
    return { head: head, keys: keys, conv: conv, mt: circ ? 'circ' : 'flat', rows: (sizes || []).map(function (z) { return [z.label == null ? '' : String(z.label)].concat(keys.map(function (k) { return z[k] == null ? '' : String(z[k]); })); }) };
  }
  /* 항목 이름 → 계산에 쓰는 칸. taken = 이미 다른 열이 쓰는 칸 { chest: 1, … }. 못 찾으면 null(표에만 두는 항목) */
  function tblResolve(name, cat, mt, taken, fields) {
    var ec = engCat(cat), ok = FIELD_KEYS[ec], nm = String(name == null ? '' : name).trim().replace(/^\d+\s*[.)]\s*/, ''), k = null;
    if (!nm || !ok) return null;
    (fields || []).forEach(function (f) { if (!k && (nm === f[1] || nm === f[1].replace('단면', '둘레'))) k = f[0]; });
    if (!k) {
      var lib = L(), r = null;
      try { r = lib && lib.N.resolveKey(nm, ec); } catch (e) { r = null; }
      if (!r || r.group === 'body') return null;
      k = r.key === 'leg_opening' || r.key === 'skirt_hem' ? 'hem' : r.key;
    }
    if (ok.indexOf(k) < 0 || (taken && taken[k])) return null;
    var conv = null;
    if (CIRC_KEYS[k]) { if (mt !== 'circ' && /둘레/.test(nm)) conv = [1, 2]; else if (mt === 'circ' && /단면/.test(nm)) conv = [2, 1]; }
    return { key: k, conv: conv };
  }
  /* 옷 종류를 바꿨을 때: 숫자가 하나도 없으면 새 종류의 기본 표로, 있으면 항목 이름으로 칸을 다시 찾는다 */
  function tblRecat(t, cat, mt, fields) {
    var any = t.rows.some(function (r) { return r.slice(1).some(function (c) { return String(c == null ? '' : c).trim() !== ''; }); });
    if (!any) return tblFromSizes(cat, mt, t.rows.map(function (r) { return { label: r[0] }; }), fields);
    var taken = {}, keys = [], conv = [];
    t.head.forEach(function (hh, i) {
      var r = tblResolve(hh, cat, mt, taken, fields);
      if (r) { taken[r.key] = 1; keys.push(r.key); conv.push(r.key === t.keys[i] ? t.conv[i] : r.conv); } else { keys.push(null); conv.push(null); }
    });
    return { head: t.head.slice(), keys: keys, conv: conv, mt: mt === 'circ' ? 'circ' : 'flat', rows: t.rows.map(function (r) { return r.slice(); }) };
  }
  function sameVal(x, y) {
    var ex = x == null || String(x).trim() === '', ey = y == null || String(y).trim() === '';
    if (ex || ey) return ex && ey;
    var nx = parseFloat(x), ny = parseFloat(y);
    return isFinite(nx) && isFinite(ny) ? Math.abs(nx - ny) <= 0.051 : String(x) === String(y);
  }
  function sameSizes(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (String(a[i].label) !== String(b[i].label)) return false;
      var ks = {}; Object.keys(a[i]).concat(Object.keys(b[i])).forEach(function (k) { if (k !== 'label') ks[k] = 1; });
      for (var k in ks) if (!sameVal(a[i][k], b[i][k])) return false;
    }
    return true;
  }
  /* 저장된 옷 → 화면에 보여 줄 표. 저장된 표가 없으면(예전 옷) 앱 기본 이름으로 만든다.
     폰 앱에서 값을 고쳐 표와 sizes 가 어긋났으면 sizes 가 기준: 표의 항목 이름·순서·안 쓰는 항목은 그대로 두고,
     달라진 항목은 sizes 값을 그대로 적는다(그 항목의 환산은 없앤다 — sizes 값이 이미 계산용 값이므로). 저장 자료는 건드리지 않는다 */
  function tblSync(it, fields) {
    var mt = it.measureType === 'circ' ? 'circ' : 'flat', sizes = (it.sizes || []).filter(function (z) { return z && String(z.label == null ? '' : z.label).trim() !== ''; });
    if (!okTable(it.table)) return tblFromSizes(it.cat, mt, it.sizes || [], fields);
    var t = JSON.parse(JSON.stringify(it.table));
    if (t.mt === mt && sameSizes(tblSizes(t), sizes)) return t;
    var old = t.rows.filter(function (r) { return String(r[0] == null ? '' : r[0]).trim() !== ''; }), der = tblSizes(t), usedRow = {};
    var from = sizes.map(function (z) { for (var j = 0; j < old.length; j++) if (!usedRow[j] && String(old[j][0]) === String(z.label)) { usedRow[j] = 1; return j; } return -1; });
    var rows = sizes.map(function (z, ri) { return from[ri] >= 0 ? old[from[ri]].slice() : [String(z.label)].concat(t.head.map(function () { return ''; })); });
    var seen = {};
    t.keys.forEach(function (k, i) {
      if (!k) return;
      if (seen[k]) { t.keys[i] = null; t.conv[i] = null; return; } /* 같은 칸을 가리키는 두 번째 항목은 계산에서 뺀다 */
      seen[k] = 1;
      var diff = t.mt !== mt || sizes.some(function (z, ri) { return !sameVal(from[ri] >= 0 ? der[from[ri]][k] : null, z[k]); });
      if (!diff) return;
      t.conv[i] = null; rows.forEach(function (r, ri) { r[i + 1] = sizes[ri][k] == null ? '' : String(sizes[ri][k]); });
    });
    /* 표에 없던 칸(폰에서 새로 넣은 값)은 앱 기본 이름으로 뒤에 붙인다 */
    var names = {}; (fields || []).forEach(function (f) { names[f[0]] = mt === 'circ' ? f[1].replace('단면', '둘레') : f[1]; });
    sizes.forEach(function (z) { Object.keys(z).forEach(function (k) {
      if (k === 'label' || seen[k]) return; seen[k] = 1;
      t.head.push(names[k] || k); t.keys.push(k); t.conv.push(null); rows.forEach(function (r, ri) { r.push(sizes[ri][k] == null ? '' : String(sizes[ri][k])); });
    }); });
    t.rows = rows; t.mt = mt;
    return t;
  }
  /* 저장용: 사이즈 이름이 빈 줄, 이름도 값도 없는 항목은 뺀다 */
  function tblClean(t, mt) {
    var rows = t.rows.filter(function (r) { return String(r[0] == null ? '' : r[0]).trim() !== ''; });
    var keep = t.head.map(function (hh, i) { return String(hh == null ? '' : hh).trim() !== '' || rows.some(function (r) { return String(r[i + 1] == null ? '' : r[i + 1]).trim() !== ''; }); });
    var pick = function (a) { return a.filter(function (x, i) { return keep[i]; }); };
    return { head: pick(t.head).map(function (x) { return String(x == null ? '' : x); }), keys: pick(t.keys), conv: pick(t.conv), mt: mt === 'circ' ? 'circ' : 'flat',
      rows: rows.map(function (r) { return [r[0]].concat(pick(r.slice(1)).map(function (c) { return c == null ? '' : String(c); })); }) };
  }
  /* AI 가 읽은 표(report) → 이미지 표. used = { 앱 칸: 실제 측정 키 }, keepRow = toCloset 이 남긴 줄 */
  function imgTable(report, ec, used, flat, circK, keepRow) {
    var res = report.result, cols = res.columns || {}, T, nci;
    if (report.source === 'text') { T = res.table; }
    else if (res.orientation === 'transposed' && report.view && report.viewMap) {
      /* 사이즈가 첫 줄에 가로로 놓인 표: 세로(사이즈가 줄)로 돌린다. 이름을 모르는 치수 줄도 항목으로 남긴다 */
      var V = report.view; T = V[0].map(function (x, j) { return V.map(function (r) { return r[j]; }); });
      nci = report.viewMap;
    } else T = report.table;
    if (!T || T.length < 2) return null;
    var w = T[0].length, body = T.slice(1);
    if (body.length !== res.sizes.length) return null;
    var byCi = {};
    Object.keys(cols).forEach(function (ck) {
      var c = cols[ck]; if (c.ci == null || ck.indexOf('@') >= 0 || c.group === 'body') return;
      var k = Object.keys(used).filter(function (x) { return used[x] === ck; })[0]; if (!k) return;
      byCi[c.ci] = { key: k, conv: [c.factor == null ? 1 : c.factor, flat && circK.indexOf(k) >= 0 ? 2 : 1] };
    });
    var head = [], keys = [], conv = [], idx = [];
    for (var c = 1; c < w; c++) {
      var name = String(T[0][c] == null ? '' : T[0][c]).trim();
      if (!name && !body.some(function (r) { return String(r[c] == null ? '' : r[c]).trim() !== ''; })) continue;
      var m = byCi[nci ? nci[c] : c];
      head.push(name); keys.push(m ? m.key : null); conv.push(m ? m.conv : null); idx.push(c);
    }
    var rows = body.filter(function (r, i) { return keepRow[i]; }).map(function (r) { return [String(r[0] == null ? '' : r[0]).trim()].concat(idx.map(function (c) { return r[c] == null ? '' : String(r[c]).trim(); })); });
    return rows.length && head.length ? { head: head, keys: keys, conv: conv, mt: flat ? 'flat' : 'circ', rows: rows } : null;
  }

  /* 캡처(Blob/File) → 서버가 읽은 글 → 걸러서 옷장 형식으로. 실패하면 Promise 거부(호출한 쪽이 기존 글자 읽기로 넘어간다) */
  function readCapture(file, cat, gender, shrink, toUrl, deviceId) {
    if (!enabled()) return Promise.reject(new Error('off'));
    var c = root.TRYON_CFG;
    return shrink(file, 1600, 0.85).then(toUrl).then(function (dataUrl) {
      return fetch(c.url.replace(/\/$/, '') + '/functions/v1/sizeread', {
        method: 'POST', headers: { 'Content-Type': 'application/json', apikey: c.anon, Authorization: 'Bearer ' + c.anon },
        body: JSON.stringify({ device: deviceId, image: dataUrl })
      });
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j && j.error || '사이즈표를 읽지 못했어요.'); return j; }); }).then(function (j) { return fromText(j.text, cat, gender); });
  }
  /* 서버가 읽은 글(raw) → 옷장 형식. 옷 종류를 바꾸면 같은 글을 새 종류로 다시 푼다(단면/둘레·인치 판단이 옷 종류마다 달라서) */
  function fromText(text, cat, gender) {
    var lib = L(); if (!lib) throw new Error('사이즈 분석 코드를 불러오지 못했어요.');
    var SX = root.SizeExtract || (typeof require === 'function' && typeof module === 'object' ? require('./aifit/size-extract.js') : null);
    var rep = SX.create(lib.N).process(text, { category: engCat(cat), gender: aiGender(gender) });
    var out = toCloset(rep, cat);
    /* 이 옷 종류로는 못 풀었어도 읽은 글은 넘긴다(옷 종류를 바꾸면 다시 풀 수 있게) */
    if (!out) { var er = new Error((rep.warnings && rep.warnings[0]) || '캡처에서 사이즈표를 찾지 못했어요.'); er.raw = text; throw er; }
    out.notes = rep.notes || [];
    out.raw = text;
    return out;
  }

  return { forSet: forSet, tableOf: tableOf, one: one, aiGender: aiGender, enabled: enabled, toCloset: toCloset, readCapture: readCapture, fromText: fromText,
    tblSizes: tblSizes, tblFromSizes: tblFromSizes, tblResolve: tblResolve, tblRecat: tblRecat, tblSync: tblSync, tblClean: tblClean, okTable: okTable };
});
