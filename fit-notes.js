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

  function engCat(c) { return c === 'outer' ? 'top' : c; }
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

  /* size-extract 결과 → 앱 옷장 형식 { sizes:[{label, chest, ...}], measureType:'circ' }  (aifit 은 모두 cm 둘레로 바꿔 줌) */
  function toCloset(report, cat) {
    var keys = FIELD_KEYS[engCat(cat)];
    if (!report || !report.found || !report.result || !keys) return null;
    var sizes = report.result.sizes.map(function (z) {
      var row = { label: String(z.std || z.label).replace(/\s*[(（].*$/, '') || String(z.label) };
      keys.forEach(function (k) { var m = z.measurements || {}, v = m[k]; if (v == null && k === 'hem') v = m.leg_opening; if (v != null) row[k] = String(v); });
      return row;
    }).filter(function (r) { return keys.some(function (k) { return r[k] != null; }); });
    return sizes.length ? { sizes: sizes, measureType: 'circ', warnings: (report.warnings || []).concat(report.result.warnings || []) } : null;
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
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j && j.error || '사이즈표를 읽지 못했어요.'); return j; }); }).then(function (j) {
      var X = root.SizeExtract.create(root.SizeNormalizer.create(root.AIFIT_DICT));
      var rep = X.process(j.text, { category: engCat(cat), gender: aiGender(gender) });
      var out = toCloset(rep, cat);
      if (!out) throw new Error((rep.warnings && rep.warnings[0]) || '캡처에서 사이즈표를 찾지 못했어요.');
      out.notes = rep.notes || [];
      return out;
    });
  }

  return { forSet: forSet, tableOf: tableOf, one: one, aiGender: aiGender, enabled: enabled, toCloset: toCloset, readCapture: readCapture };
});
