/*!
 * style-fit.js — 옷 스타일별 키포인트 치수로 핏 판정, 사이즈 추천, 생성용 짧은 문구 만들기
 * 브라우저: <script src="style-fit.js"></script>  const F = StyleFit.create(profilesJson);
 * Node:     const F = require('./style-fit.js').create(require('./style-profiles.json'));
 *
 * 입력 size: size-normalizer.js 결과의 sizes[i] (measurements는 cm 둘레 기준)
 * 입력 body: { gender:'men'|'women', height, weight, shoulder, chest, waist, hip, thigh, inseam, arm, neck } (cm)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.StyleFit = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function create(P) {
    const round1 = (v) => Math.round(v * 10) / 10;
    const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');

    // ---------- 1) 상품명으로 스타일 찾기 ----------
    function detectStyle(title, category) {
      const t = norm(title);
      let best = null;
      for (const [id, st] of Object.entries(P.styles)) {
        if (category && st.category !== category) continue;
        for (const kw of st.keywords) {
          const k = norm(kw);
          if (k && t.includes(k) && (!best || k.length > best.len)) best = { id, len: k.length, keyword: kw };
        }
      }
      if (best) return { styleId: best.id, name: P.styles[best.id].name, matched: best.keyword };
      const def = category && P.defaults[category];
      return def ? { styleId: def, name: P.styles[def].name, matched: null, isDefault: true } : null;
    }

    // ---------- 2) 신체 치수 채우기 (없으면 키·엉덩이로 추정) ----------
    function completeBody(body) {
      const g = body.gender === 'women' ? 'women' : 'men';
      const out = Object.assign({}, body), estimated = [];
      for (const [k, d] of Object.entries(P.bodyKeys)) {
        if (out[k] != null || !d.estimate) continue;
        const base = out[d.estimateFrom];
        if (base == null) continue;
        out[k] = round1(base * d.estimate[g]);
        estimated.push(k);
      }
      return { body: out, estimated };
    }

    function verdictOf(ease, target) {
      const [lo, hi] = target;
      const margin = Math.max(3, (hi - lo) * 0.5);
      if (ease < lo - 4) return 'tight';
      if (ease < lo) return 'slightTight';
      if (ease <= hi) return 'ok';
      if (ease <= hi + margin) return 'loose';
      return 'tooLoose';
    }
    const VERDICT_KO = { tight: '작음', slightTight: '약간 작음', ok: '적정', loose: '약간 큼', tooLoose: '큼' };

    function bandOf(bandId, lengthCm, body) {
      const b = P.lengthBands[bandId];
      const base = body[b && b.base ? b.base : 'height'];
      if (!b || !lengthCm || !base) return null;
      const r = lengthCm / base;
      for (const [lim, label] of b.ratioOfHeight) if (r < lim) return { label, ratio: round1(r * 100) / 100, from: b.from };
      return null;
    }

    // ---------- 3) 한 사이즈를 스타일 기준으로 판정 ----------
    function evaluate(size, bodyIn, styleId, opts = {}) {
      const st = P.styles[styleId];
      if (!st) throw new Error('알 수 없는 스타일: ' + styleId);
      const { body, estimated } = completeBody(bodyIn);
      const m = Object.assign({}, size.measurements, opts.variant && size.variants ? size.variants[opts.variant] : null);
      // 기장 보정: 인심이 없으면 총장 − 밑위
      if (m.inseam == null && m.length != null && m.rise != null && st.category === 'bottom') { m.inseam = round1(m.length - m.rise); m._inseamDerived = true; }
      const stretch = opts.stretch || 'none';
      const adj = P.stretchAdjust[stretch] || 0;
      const warnings = [];
      if (st.stretchExpected && stretch === 'none') warnings.push(`${st.name}은 보통 신축성 소재입니다. 신축성이 없으면 표시보다 작게 느껴질 수 있습니다`);

      const points = [], missingRequired = [], missingBody = [];
      for (const k of st.key) {
        const words = P.verdictWords[k.m === 'inseam' ? 'inseam' : k.m] || null;
        const pt = { key: k.m, name: keyName(k.m), priority: k.p, required: !!k.req };
        let gv = m[k.m];
        if (gv == null) { pt.status = 'missing'; points.push(pt); if (k.req) missingRequired.push(pt.name); continue; }
        pt.garment = gv;

        if (k.band) {
          // 소매 위치: 어깨가 내려온 만큼 소매가 실제로 더 내려옴
          if (k.band === 'sleeve' && m.shoulder != null && body.shoulder != null) gv = round1(gv + Math.max(0, (m.shoulder - body.shoulder) / 2));
          const b = bandOf(k.band, gv, body);
          if (b) { pt.status = 'ok'; pt.band = b.label; pt.phrase = k.band === 'sleeve' ? `${b.label} 소매` : `${b.label} 기장`; }
          else { pt.status = 'info'; if (body.height == null) missingBody.push('키'); }
          points.push(pt); continue;
        }
        if (!k.body || !k.target) { pt.status = 'info'; points.push(pt); continue; }

        let bv = body[k.body];
        if (bv == null) { pt.status = 'noBody'; missingBody.push(P.bodyKeys[k.body].name); points.push(pt); continue; }
        pt.body = bv; pt.bodyEstimated = estimated.includes(k.body);

        // 소매: 어깨가 내려온 만큼 실제 소매 위치가 길어짐
        if (k.m === 'sleeve' && m.shoulder != null && body.shoulder != null) gv = round1(gv + Math.max(0, (m.shoulder - body.shoulder) / 2));
        const isCirc = ['chest', 'waist', 'hip', 'thigh', 'neck'].includes(k.m);
        const target = isCirc && adj ? [k.target[0] + adj, k.target[1]] : k.target;
        const ease = round1(gv - bv);
        const v = verdictOf(ease, target);
        Object.assign(pt, { ease, target, verdict: v, verdictKo: VERDICT_KO[v], status: v === 'ok' ? 'ok' : 'off' });
        if (words) pt.phrase = words[v];
        points.push(pt);
      }

      // 점수: 핵심(1)일수록 무겁게, 목표 범위에서 벗어난 cm만큼 감점
      const W = { 1: 3, 2: 1.5, 3: 0.5 };
      let penalty = 0;
      for (const pt of points) {
        if (pt.ease == null) continue;
        const [lo, hi] = pt.target;
        const off = pt.ease < lo ? lo - pt.ease : pt.ease > hi ? pt.ease - hi : 0;
        penalty += off * W[pt.priority] * (pt.ease < lo ? 1.3 : 1); // 작은 쪽을 더 나쁘게
      }
      for (const n of missingRequired) penalty += 2;
      const score = Math.max(0, Math.round(100 - penalty * 2));

      const keyOff = points.filter((p) => p.priority === 1 && (p.verdict === 'tight' || p.verdict === 'slightTight'));
      let overall = '잘 맞음';
      if (keyOff.some((p) => p.verdict === 'tight') || points.some((p) => p.priority === 2 && p.verdict === 'tight')) overall = '작음';
      else if (keyOff.length) overall = '조금 작음';
      else if (points.some((p) => p.priority === 1 && p.verdict === 'tooLoose')) overall = '큼';
      else if (points.some((p) => p.priority === 1 && p.verdict === 'loose')) overall = '조금 큼';

      const confidence = missingRequired.length ? '낮음' : (points.some((p) => p.bodyEstimated && p.priority === 1) ? '보통' : '높음');
      if (missingRequired.length) warnings.push(`이 스타일의 필수 치수가 사이즈표에 없습니다: ${missingRequired.join(', ')}`);
      if (missingBody.length) warnings.push(`판정에 필요한 신체 치수가 없습니다: ${[...new Set(missingBody)].join(', ')}`);

      // 생성 프롬프트용 짧은 문구 (핵심 → 중요 순, 최대 4개)
      const phrases = points.filter((p) => p.phrase && p.priority <= 2).sort((a, b) => a.priority - b.priority).slice(0, 4).map((p) => p.phrase);
      return { style: st.name, styleId, size: size.std || size.label, overall, score, confidence, points, missingRequired, warnings, prompt: phrases.join(', ') };
    }

    // ---------- 4) 여러 사이즈 중 추천 ----------
    function recommend(sizes, body, styleId, opts) {
      const results = sizes.map((s) => evaluate(s, body, styleId, opts));
      const ranked = [...results].sort((a, b) => b.score - a.score);
      return { best: ranked[0], all: results };
    }

    // ---------- 4-2) 겉옷 안에 받쳐 입을 때 (레이어드) ----------
    // inner/outer: normalizer 결과 사이즈, opts: { innerStyle, outerStyle, tucked }
    function checkLayering(inner, outer, bodyIn, opts = {}) {
      const L = P.layering;
      const rule = L.outer[opts.outerStyle];
      if (!rule) throw new Error('겉옷 스타일 규칙이 없습니다: ' + opts.outerStyle);
      const { body } = completeBody(bodyIn || {});
      const im = inner.measurements, om = outer.measurements;
      const checks = [], phrases = [];
      const add = (key, name, value, range, okMsg, lowMsg, highMsg) => {
        let status = 'ok', msg = okMsg;
        if (value < range[0]) { status = 'bad'; msg = lowMsg; } else if (value > range[1]) { status = 'warn'; msg = highMsg; }
        checks.push({ key, name, value: round1(value), range, status, message: msg });
        if (msg) phrases.push(msg);
      };

      // 1) 가슴 공간 (안쪽 옷 두께 반영)
      if (im.chest != null && om.chest != null) {
        const thick = (L.innerThickness[opts.innerStyle] || 0);
        const gap = om.chest - im.chest - thick;
        add('chest', '가슴 여유(겉옷−안쪽)', gap, rule.chestGap, '안에 입어도 답답하지 않은', '겉옷 안이 꽉 끼는', '겉옷 안이 크게 남는');
      } else checks.push({ key: 'chest', name: '가슴 여유', status: 'missing' });

      // 2) 어깨: 안쪽 옷 어깨가 겉옷보다 넓으면 어깨가 뭉침
      if (im.shoulder != null && om.shoulder != null) {
        const over = im.shoulder - om.shoulder;
        const ok = over <= rule.shoulderMaxOver;
        const msg = ok ? null : '안쪽 옷 어깨가 겉옷 안에서 뭉치는';
        checks.push({ key: 'shoulder', name: '어깨(안쪽−겉옷)', value: round1(over), range: [null, rule.shoulderMaxOver], status: ok ? 'ok' : 'bad', message: msg });
        if (msg) phrases.push(msg);
      }

      // 3) 소매: 긴소매 안쪽 옷만. 셔츠 소매가 재킷 밖으로 1~2.5cm 보이는 게 정석
      const eff = (m) => (m.sleeve == null ? null : m.sleeve + (m.shoulder != null && body.shoulder != null ? Math.max(0, (m.shoulder - body.shoulder) / 2) : 0));
      const iS = eff(im), oS = eff(om);
      const innerLong = iS != null && body.arm != null ? iS / body.arm >= 0.85 : null;
      if (iS != null && oS != null && innerLong) {
        add('sleeve', '소매(안쪽−겉옷)', iS - oS, rule.sleeveDiff,
          opts.outerStyle === 'blazer' ? '셔츠 소매가 재킷 밖으로 살짝 보이는' : '소매 길이가 겉옷과 어울리는',
          '안쪽 소매가 겉옷 안에 숨는', '안쪽 소매가 겉옷 밖으로 많이 나오는');
      } else if (iS != null && innerLong === false && om.sleeve_width != null && im.sleeve_width != null) {
        // 반팔을 긴소매 겉옷 안에: 소매통이 겉옷보다 넓으면 팔 위쪽이 뭉침
        add('sleeve_width', '소매통(겉옷−안쪽)', om.sleeve_width - im.sleeve_width, [2, 99], '반팔 소매가 겉옷 안에서 걸리지 않는', '반팔 소매가 겉옷 팔 안에서 뭉치는', null);
      }

      // 4) 기장: 빼 입을 때 안쪽 옷이 겉옷 아래로 삐져나오는지
      if (!opts.tucked && im.length != null && om.length != null) {
        const over = im.length - om.length;
        const ok = over <= rule.lengthMaxOver;
        const msg = ok ? null : (over > 0 ? '안쪽 옷 밑단이 겉옷 아래로 나오는' : '안쪽 옷 밑단이 겉옷 끝선에 걸리는');
        checks.push({ key: 'length', name: '기장(안쪽−겉옷)', value: round1(over), range: [null, rule.lengthMaxOver], status: ok ? 'ok' : 'warn', message: msg });
        if (msg) phrases.push(msg);
      }

      const bad = checks.filter((c) => c.status === 'bad').length, warn = checks.filter((c) => c.status === 'warn').length;
      return {
        outer: rule.name, overall: bad ? '레이어드 어려움' : warn ? '입을 수 있으나 주의' : '레이어드 적합',
        checks, prompt: phrases.slice(0, 3).join(', '),
      };
    }

    // ---------- 5) 스타일별 필수 신체 치수 (앱 입력 화면용) ----------
    function requiredBodyInputs(styleId) {
      const st = P.styles[styleId];
      const keys = new Set(['height']);
      st.key.forEach((k) => { if (k.body && k.p <= 2) keys.add(k.body); });
      return [...keys].map((k) => ({ key: k, name: P.bodyKeys[k].name, canEstimate: !!P.bodyKeys[k].estimate }));
    }

    const NAMES = { chest: '가슴둘레', shoulder: '어깨너비', waist: '허리둘레', hip: '엉덩이둘레', thigh: '허벅지둘레', neck: '목둘레', sleeve: '소매길이', length: '총장', inseam: '인심(안쪽기장)', rise: '밑위', leg_opening: '밑단' };
    function keyName(k) { return NAMES[k] || k; }

    return { detectStyle, completeBody, evaluate, recommend, checkLayering, requiredBodyInputs, profiles: P };
  }
  return { create };
});
