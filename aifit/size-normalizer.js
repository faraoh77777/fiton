/*!
 * size-normalizer.js — 쇼핑몰마다 다른 사이즈표를 표준 형식(cm, 둘레)으로 변환
 * 사용법 (브라우저): <script src="size-normalizer.js"></script>
 *   const N = SizeNormalizer.create(dictJson);
 *   const r = N.normalizeTable(table2D, { category: 'top', gender: 'men' });
 * 사용법 (Node):  const { create } = require('./size-normalizer.js');
 * category: 'top' | 'bottom' | 'dress' | 'shoes' | 'hat'
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SizeNormalizer = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const INCH = 2.54;

  function create(dict) {
    const learned = {}; // 런타임에 추가된 동의어 { cat: { syn: key } }

    // ---------- 공통 유틸 ----------
    const clean = (s) => String(s == null ? '' : s).toLowerCase().replace(/\s+/g, '')
      .replace(/[()\[\]{}:：·_\-\/.,'"`~]/g, '');
    const stripUnits = (s) => s.replace(/inches|inch|인치|cm|mm|kg/g, '');
    const hasHint = (raw, list) => {
      const r = String(raw).toLowerCase().replace(/\s+/g, '');
      return list.some((h) => r.includes(h.toLowerCase().replace(/\s+/g, '')));
    };
    const round1 = (v) => Math.round(v * 10) / 10;
    const median = (arr) => { const a = [...arr].sort((x, y) => x - y); const m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
    const inR = (v, r) => r && v >= r[0] && v <= r[1];

    function keyDefs(cat) {
      const defs = (dict.keys[cat]) || {};
      const out = {};
      for (const [k, d] of Object.entries(defs)) {
        if (d.ref) { const [c, kk] = d.ref.split('.'); out[k] = dict.keys[c][kk]; }
        else out[k] = d;
      }
      return out;
    }

    // ---------- 1) 명칭 통일 ----------
    function resolveKey(header, cat) {
      const defs = keyDefs(cat);
      const full = clean(header);
      const bare = stripUnits(full);
      const body = dict.keys.body;
      const isBody = hasHint(header, dict.headerHints.body);
      const pool = [];
      const push = (d, k, src) => d.synonyms.forEach((s) => pool.push([clean(s), k, src]));
      if (isBody) Object.entries(body).forEach(([k, d]) => push(d, k, 'body'));
      Object.entries(defs).forEach(([k, d]) => push(d, k, cat));
      if (!isBody) Object.entries(body).forEach(([k, d]) => push(d, k, 'body'));
      Object.entries(learned[cat] || {}).forEach(([s, k]) => pool.unshift([clean(s), k, cat]));

      for (const cand of [full, bare]) {
        if (!cand) continue;
        const exact = pool.find(([s]) => s === cand);
        if (exact) return { key: exact[1], group: exact[2], match: 'exact' };
      }
      // 포함 매칭: 가장 긴 동의어 우선 (예: '소매단면'은 '소매'보다 우선)
      let best = null;
      for (const [s, k, g] of pool) {
        if (s.length >= 2 && bare.includes(s) && (!best || s.length > best[0].length)) best = [s, k, g];
      }
      if (best) {
        // 신체 키/몸무게 칼럼은 '권장/신체' 힌트 없이도 인정
        return { key: best[1], group: best[2], match: 'partial' };
      }
      return null;
    }

    function addSynonym(cat, synonym, key) {
      (learned[cat] = learned[cat] || {})[synonym] = key;
    }

    // ---------- 숫자 파싱 ----------
    function parseNumber(cell) {
      if (typeof cell === 'number') return { value: cell };
      let s = String(cell == null ? '' : cell).replace(/,/g, '').trim();
      if (!s || /^[-–—x×]$/i.test(s)) return null;
      // 분수: '7 1/4', '7-1/4'
      const fr = s.match(/(\d+)[\s-]+(\d+)\/(\d+)/);
      if (fr) return { value: +fr[1] + (+fr[2] / +fr[3]) };
      const nums = (s.match(/\d+(?:\.\d+)?/g) || []).map(Number);
      if (!nums.length) return null;
      if (nums.length >= 2 && /[~～\-–]|에서|부터/.test(s)) {
        const lo = Math.min(nums[0], nums[1]), hi = Math.max(nums[0], nums[1]);
        return { value: (lo + hi) / 2, min: lo, max: hi };
      }
      return { value: nums[0] };
    }

    // ---------- 2) 사이즈 호칭 해석 ----------
    const ORDER = dict.sizeLabels.order;
    const ALIAS = dict.sizeLabels.aliases;
    const FREE = dict.sizeLabels.free.map((s) => clean(s));

    function letterOf(token) {
      const t = token.toUpperCase().replace(/[\s_]/g, '');
      if (ORDER.includes(t)) return t;
      if (ALIAS[t]) return ALIAS[t];
      const m = t.match(/^(\d)XL$/); if (m) return ORDER.includes(m[1] + 'XL') ? m[1] + 'XL' : null;
      return null;
    }

    function isSizeLabel(cell, cat) {
      if (cell == null || cell === '') return false;
      const s = String(cell).trim();
      if (FREE.includes(clean(s)) || /^(free|프리|f)\s*[(（]/i.test(s)) return true;
      if (/^(44|55|66|77|88)\s*반$/.test(s)) return true;
      const toks = s.toUpperCase().split(/[\s()\/,|]+/).filter(Boolean);
      if (toks.some((t) => letterOf(t))) return true;
      if (/^(US|UK|EU|JP|KR)\s*\d/.test(s.toUpperCase())) return true;
      if (/^\d+(\.\d)?\s*(호|인치|inch|")?$/i.test(s)) {
        const n = parseFloat(s);
        if (cat === 'shoes') return (n >= 100 && n <= 320) || (n >= 3 && n <= 16) || (n >= 33 && n <= 50);
        if (cat === 'hat') return n >= 46 && n <= 66;
        return n >= 20 && n <= 170;
      }
      if (cat === 'hat' && /^\d+[\s-]+\d\/\d$/.test(s)) return true;
      return false;
    }

    function pickRow(table, test) {
      return table.find(test);
    }

    function parseSizeLabel(label, opts = {}) {
      const cat = opts.category || 'top';
      const gender = opts.gender || 'unisex';
      const raw = String(label == null ? '' : label).trim();
      const res = { raw, std: null, kind: null, estimate: null };
      const KOR = [44, 55, 66, 77, 88, 99];
      const womenRow = (n) => dict.clothingStandards[cat === 'bottom' ? 'women_bottom' : 'women_top'].find((r) => r.korean === n);
      const avgEst = (rows) => {
        const est = {};
        ['body_chest', 'body_waist', 'body_hip', 'height'].forEach((k) => {
          const v = rows.filter((r) => r && r[k]); if (!v.length) return;
          est[k] = round1(v.reduce((s, r) => s + (r[k][0] + r[k][1]) / 2, 0) / v.length);
          est[k + '_range'] = [Math.min(...v.map((r) => r[k][0])), Math.max(...v.map((r) => r[k][1]))];
        });
        return est;
      };

      if (FREE.includes(clean(raw)) || /free|프리|one\s*size|^f\s*[(（]/i.test(raw)) {
        res.std = 'FREE'; res.kind = 'free';
        // 'FREE(55~66)', '프리(44-77)' → 맞는 체형 범위
        const ns = (raw.match(/\d+/g) || []).map(Number).filter((n) => KOR.includes(n));
        if (ns.length && cat !== 'shoes' && cat !== 'hat') {
          const lo = Math.min(...ns), hi = Math.max(...ns);
          const rows = KOR.filter((n) => n >= lo && n <= hi).map(womenRow).filter(Boolean);
          res.fits = rows.map((r) => r.label); res.estimate = avgEst(rows);
        }
        return res;
      }

      // '55반', '66반' → 두 호칭의 중간
      const half = raw.match(/^(44|55|66|77|88)\s*반$/);
      if (half && cat !== 'shoes' && cat !== 'hat') {
        const n = +half[1], next = KOR[KOR.indexOf(n) + 1];
        const rows = [womenRow(n), womenRow(next)].filter(Boolean);
        res.kind = 'women_korean_half'; res.std = rows.map((r) => r.label).join('~'); res.fits = rows.map((r) => r.label); res.estimate = avgEst(rows);
        return res;
      }

      const up = raw.toUpperCase();
      const toks = up.split(/[\s()\/,|]+/).filter(Boolean);
      const letter = toks.map(letterOf).find(Boolean) || null;
      const numTok = toks.find((t) => /^\d+(\.\d+)?/.test(t));
      // 'S (25~26)'처럼 범위가 붙으면 중간값 사용
      const rangeM = raw.match(/(\d+(?:\.\d+)?)\s*[~∼～\-–]\s*(\d+(?:\.\d+)?)/);
      const num = rangeM ? (+rangeM[1] + +rangeM[2]) / 2 : (numTok != null ? parseFloat(numTok) : null);
      if (rangeM) res.labelRange = [+rangeM[1], +rangeM[2]];

      // 아동 '호'
      if (/\d+\s*호/.test(raw) && cat !== 'shoes') {
        const age = parseFloat(raw);
        res.kind = 'kids_age'; res.std = raw; res.estimate = { height: 75 + age * 6 }; return res;
      }

      if (cat === 'shoes') {
        const sys = /^US|US\s/.test(up) ? 'us' : /^UK|UK\s/.test(up) ? 'uk' : /^EU|EU\s|EUR/.test(up) ? 'eu' : null;
        const n = (raw.match(/\d+(\.\d+)?/) || [])[0];
        if (n == null) return res;
        const v = parseFloat(n);
        let conv;
        if (sys) conv = convertShoe({ [sys]: v, gender });
        else if (v >= 100 && v <= 320) conv = convertShoe({ mm: v, gender });
        else if (v >= 33 && v <= 50) conv = convertShoe({ eu: v, gender });
        else if (v >= 3 && v <= 16) conv = convertShoe({ us: v, gender });
        if (conv) { res.std = conv.mm + 'mm'; res.kind = 'shoe'; res.estimate = conv; }
        return res;
      }

      if (cat === 'hat') {
        const fr = raw.match(/(\d)[\s-]+(\d)\/(\d)/);
        if (fr) { const us = +fr[1] + (+fr[2] / +fr[3]); const cm = round1(us * Math.PI * INCH); res.std = cm + 'cm'; res.kind = 'us_fitted'; res.estimate = { head_circumference: cm, us_fitted: us }; return res; }
        if (num != null && num >= 46 && num <= 66) { res.std = num + 'cm'; res.kind = 'head_cm'; res.estimate = { head_circumference: num }; return res; }
        if (num != null && num >= 6.5 && num <= 8) { const cm = round1(num * Math.PI * INCH); res.std = cm + 'cm'; res.kind = 'us_fitted'; res.estimate = { head_circumference: cm, us_fitted: num }; return res; }
        if (letter) {
          const row = dict.hatStandards.letter.find((r) => r.label === letter);
          res.std = letter; res.kind = 'letter'; if (row) res.estimate = { head_circumference: (row.head[0] + row.head[1]) / 2, head_range: row.head };
        }
        return res;
      }

      const isBottom = cat === 'bottom';
      const g = gender === 'women' ? 'women' : 'men';
      const table = dict.clothingStandards[(gender === 'women' ? 'women' : 'men') + (isBottom ? '_bottom' : '_top')];
      let row = null;

      if (num != null) {
        const wKorean = [44, 55, 66, 77, 88, 99];
        if (isBottom) {
          if (num >= 22 && num <= 44 && !/cm/i.test(raw)) { // 인치
            row = pickRow(table, (r) => num >= r.inch[0] - 0.5 && num <= r.inch[1] + 0.5);
            res.kind = 'waist_inch'; res.estimate = { body_waist: round1(num * INCH) };
          } else if (gender === 'women' && wKorean.includes(num)) {
            row = pickRow(table, (r) => r.korean === num); res.kind = 'women_korean';
          } else if (num >= 55 && num <= 110) {
            row = table.reduce((b, r) => (Math.abs(r.kr_cm - num) < Math.abs(b.kr_cm - num) ? r : b));
            res.kind = 'waist_cm'; res.estimate = { body_waist: num };
          } else if (num >= 70 && num <= 170 && num % 5 === 0) { res.kind = 'kids_height'; res.std = String(num); res.estimate = { height: num }; return res; }
        } else {
          if (gender !== 'men' && wKorean.includes(num)) {
            row = pickRow(dict.clothingStandards.women_top, (r) => r.korean === num); res.kind = 'women_korean';
          } else if (num >= 80 && num <= 130 && num % 5 === 0) {
            row = pickRow(table, (r) => r.kr === num); res.kind = 'kr_chest';
            if (!row && num <= 130) res.estimate = { body_chest: num };
          } else if (num >= 32 && num <= 58 && num % 2 === 0) {
            row = pickRow(table, (r) => r.eu === num); res.kind = 'eu';
          } else if (num >= 70 && num <= 170) { res.kind = 'kids_height'; res.std = String(num); res.estimate = { height: num }; return res; }
        }
      }
      if (!row && !letter && num != null && num >= 0 && num <= 6 && Number.isInteger(num)) {
        // 디자이너 브랜드식 0·1·2·3 호칭 → 실측표로만 판단 가능
        res.kind = 'brand_index'; res.std = String(num); return res;
      }
      // 판매자가 영문 호칭(S/M/L)을 직접 적었으면 그 호칭이 우선. 숫자는 신체 추정에만 사용
      if (letter && (!row || row.label !== letter)) {
        const lr = pickRow(table, (r) => r.label === letter);
        if (lr) { row = lr; res.kind = res.kind ? res.kind + '+letter' : 'letter'; }
      }
      if (row) {
        res.std = row.label;
        const est = Object.assign({}, res.estimate);
        ['body_chest', 'body_waist', 'body_hip', 'height'].forEach((k) => { if (row[k] && est[k] == null) est[k] = (row[k][0] + row[k][1]) / 2; });
        res.estimate = est;
      } else if (letter) res.std = letter;
      return res;
    }

    // ---------- 신발 환산 ----------
    function convertShoe(input) {
      const gender = input.gender === 'women' ? 'women' : 'men';
      const tbl = dict.shoeStandards[gender];
      const sys = ['mm', 'us', 'uk', 'eu'].find((k) => input[k] != null);
      if (!sys) return null;
      const v = +input[sys];
      let mm;
      const exact = tbl.find((r) => r[sys] === v);
      if (exact) mm = exact.mm;
      else if (sys === 'mm') mm = v;
      else if (sys === 'eu') mm = Math.round(((v / 1.5) - 1.5) * 10 / 5) * 5;
      else if (sys === 'us') mm = Math.round((gender === 'men' ? v * 10 + 180 : (v - 1.5) * 10 + 180) / 5) * 5;
      else if (sys === 'uk') mm = Math.round((gender === 'men' ? (v + 1) * 10 + 180 : (v + 2.5) * 10 + 180) / 5) * 5;
      const row = tbl.find((r) => r.mm === mm);
      if (row) return { mm, us: row.us, uk: row.uk, eu: row.eu, gender, source: 'table' };
      const usM = (mm - 180) / 10;
      const us = gender === 'men' ? usM : usM + 1.5;
      return { mm, us: Math.round(us * 2) / 2, uk: Math.round((usM - 1) * 2) / 2, eu: Math.round(1.5 * (mm / 10 + 1.5) * 2) / 2, gender, source: 'formula' };
    }

    function normalizeWidth(text) {
      const c = clean(text);
      for (const w of dict.shoeStandards.width) {
        if (w.synonyms.some((s) => clean(s) === c)) return w.std;
      }
      for (const w of dict.shoeStandards.width) {
        if (w.synonyms.some((s) => clean(s).length >= 2 && c.includes(clean(s)))) return w.std;
      }
      return null;
    }

    function hatAdjustType(text) {
      const c = clean(text);
      for (const [t, list] of Object.entries(dict.hatStandards.adjust_types)) if (list.some((s) => c.includes(clean(s)))) return t;
      return null;
    }

    // ---------- 3) 표 정규화 ----------
    function orient(table, cat) {
      const firstCol = table.slice(1).map((r) => r[0]);
      const firstRow = table[0].slice(1);
      const colScore = firstCol.filter((c) => isSizeLabel(c, cat)).length / Math.max(firstCol.length, 1);
      const rowScore = firstRow.filter((c) => isSizeLabel(c, cat)).length / Math.max(firstRow.length, 1);
      const headerKeys = firstRow.filter((c) => resolveKey(c, cat)).length / Math.max(firstRow.length, 1);
      if (rowScore > colScore && rowScore >= 0.5 && headerKeys < 0.5) {
        // 사이즈가 가로(열) 방향 → 전치
        const t = table[0].map((_, i) => table.map((r) => r[i]));
        return { table: t, orientation: 'transposed' };
      }
      return { table, orientation: 'normal' };
    }

    function normalizeTable(input, opts = {}) {
      const cat = opts.category || 'top';
      const gender = opts.gender || 'unisex';
      const warnings = [], unknownHeaders = [], columns = {};
      const rows0 = input.filter((r) => Array.isArray(r) && r.some((c) => c !== '' && c != null));
      if (rows0.length < 2) return { category: cat, sizes: [], columns, warnings: ['표 데이터가 부족합니다'], unknownHeaders };
      const { table, orientation } = orient(rows0, cat);
      const header = table[0];
      const body = table.slice(1);
      const defs = keyDefs(cat);
      const tableUnit = opts.unit || (opts.title && hasHint(opts.title, dict.headerHints.inch) ? 'inch' : null);

      // 열 단위 처리
      const colPlans = [];
      header.forEach((h, ci) => {
        if (ci === 0) return; // 첫 열 = 사이즈 호칭
        const r = resolveKey(h, cat);
        if (!r) { if (String(h).trim()) unknownHeaders.push(String(h)); return; }
        const def = r.group === 'body' ? dict.keys.body[r.key] : defs[r.key];
        const raw = body.map((row) => parseNumber(row[ci]));
        colPlans.push({ ci, header: h, key: r.group === 'body' ? r.key : r.key, group: r.group, def, raw });
      });

      // 같은 치수가 여러 열(숏버전 기장 / 롱버전 기장)이면 버전으로 분리
      const byKey = {};
      colPlans.forEach((p) => (byKey[p.key] = byKey[p.key] || []).push(p));
      for (const plans of Object.values(byKey)) {
        if (plans.length < 2) continue;
        plans.forEach((p) => {
          const v = String(p.header).replace(/\s+/g, '')
            .replace(/(기장|총장|길이|length|사이즈|size|cm|\(.*?\))/gi, '').replace(/[_\-·]/g, '') || p.header;
          p.variant = v;
        });
        const prim = plans.find((p) => /(기본|레귤러|regular|일반|보통)/i.test(p.header)) || plans[0];
        prim.primary = true;
        warnings.push(`'${prim.key}' 치수가 여러 버전입니다(${plans.map((p) => p.variant).join(', ')}). 기본값은 '${prim.variant}', 나머지는 variants에 저장`);
      }

      const sizeMeta = body.map((row) => parseSizeLabel(row[0], { category: cat, gender }));

      for (const p of colPlans) {
        const { def, header: h } = p;
        if (!def || def.measure === 'enum' || /_shoe$/.test(def.measure) || def.measure === 'range') {
          columns[p.key] = { header: h, conversion: def ? def.measure : 'raw', ci: p.ci };
          continue;
        }
        const vals = p.raw.filter(Boolean).map((x) => x.value);
        if (!vals.length) continue;
        let factor = 1, note = [];
        // 단위
        const isInch = hasHint(h, dict.headerHints.inch) || tableUnit === 'inch';
        const isMM = hasHint(h, dict.headerHints.mm) && def.measure !== 'mm';
        if (isInch) { factor *= INCH; note.push('inch→cm'); }
        else if (isMM) { factor *= 0.1; note.push('mm→cm'); }
        if (def.measure === 'mm' && !isInch) {
          const md = median(vals);
          if (md < 40) { factor *= 10; note.push('cm→mm'); }
        }
        p.unitFactor = factor; p.unitNote = note.slice();
        // 단면/둘레
        if (def.measure === 'circ') {
          const md = median(vals) * factor;
          let half;
          if (hasHint(h, dict.headerHints.half)) half = true;
          else if (hasHint(h, dict.headerHints.full)) half = !inR(md, def.fullRange) && inR(md, def.halfRange);
          else if (!isInch && cat !== 'hat' && md < def.halfRange[0] && inR(md * INCH * 2, def.fullRange)) {
            factor *= INCH; half = true; note.push('inch 추정→cm'); warnings.push(`'${h}' 값이 너무 작아 인치 단면으로 추정했습니다`);
          } else if (inR(md, def.halfRange) && !inR(md, def.fullRange)) half = true;
          else if (inR(md, def.fullRange) && !inR(md, def.halfRange)) half = false;
          else half = md <= (def.halfRange[1] + def.fullRange[0]) / 2;
          if (half) { factor *= 2; note.push('단면×2'); p.half = true; }
        } else if (def.measure === 'linear' && !isInch && def.range) {
          const allOut = vals.every((v) => !inR(v * factor, def.range));
          const allInInch = vals.every((v) => inR(v * factor * INCH, def.range));
          if (allOut && allInInch) { factor *= INCH; note.push('inch 추정→cm'); warnings.push(`'${h}' 값이 cm 범위를 벗어나 인치로 추정했습니다`); }
        }
        p.factor = factor;
        /* ci·factor: 「이미지 표」가 이 열을 그대로 다시 계산할 때 쓴다(2026-11-12) */
        columns[p.variant && !p.primary ? p.key + '@' + p.variant : p.key] = { header: h, conversion: note.join(', ') || '그대로', group: p.group, variant: p.variant || undefined, ci: p.ci, factor: factor };
      }
      if (cat === 'bottom') skirtHemPass(colPlans, columns, defs, opts, header, warnings);

      // 행 조립 + 검증
      const sizes = body.map((row, ri) => {
        const m = {}, ranges = {}, extra = {}, variants = {};
        for (const p of colPlans) {
          const cell = row[p.ci];
          const def = p.def;
          if (!def) continue;
          if (def.measure === 'enum') { const w = normalizeWidth(cell); if (w) extra[p.key] = w; continue; }
          if (/_shoe$/.test(def.measure)) { const n = parseNumber(cell); if (n) extra[p.key] = n.value; continue; }
          if (def.measure === 'range') { const n = parseNumber(cell); if (n && n.min != null) ranges[p.key] = [n.min, n.max]; continue; }
          const n = p.raw[ri];
          if (!n || p.factor == null) continue;
          const v = round1(n.value * p.factor);
          /* 단면으로 판단해 ×2 한 열은 단면 범위×2 도 정상으로 본다(2026-11-12: 단면 가슴33 → 66 이 둘레 범위 70 미만이라 빠지던 문제) */
          const chk = def.measure === 'circ' ? (p.half ? [Math.min(def.fullRange[0], def.halfRange[0] * 2), def.fullRange[1]] : def.fullRange) : def.range;
          const chkV = def.measure === 'mm' ? v : v;
          if (chk && !inR(chkV, chk)) { warnings.push(`${row[0]} '${p.header}' 값 ${cell} → ${v}: 정상 범위(${chk[0]}~${chk[1]}) 밖이라 제외`); continue; }
          if (p.variant && !p.primary) { (variants[p.variant] = variants[p.variant] || {})[p.key] = v; continue; }
          if (p.variant) (variants[p.variant] = variants[p.variant] || {})[p.key] = v;
          m[p.key] = v;
          if (n.min != null) ranges[p.key] = [round1(n.min * p.factor), round1(n.max * p.factor)];
        }
        const meta = sizeMeta[ri];
        const out = { label: String(row[0]).trim(), std: meta.std, kind: meta.kind, measurements: m };
        if (Object.keys(ranges).length) out.ranges = ranges;
        if (Object.keys(extra).length) out.extra = extra;
        if (meta.estimate) out.estimate = meta.estimate;
        if (meta.fits) out.fits = meta.fits;
        if (meta.labelRange) out.labelRange = meta.labelRange;
        if (Object.keys(variants).length) out.variants = variants;

        // 신발: 호칭/칼럼으로 mm·US·UK·EU 채우기
        if (cat === 'shoes') {
          const g = gender === 'women' ? 'women' : 'men';
          const base = m.foot_length != null ? { mm: m.foot_length } : extra.us != null ? { us: extra.us } : extra.eu != null ? { eu: extra.eu } : extra.uk != null ? { uk: extra.uk } : null;
          const conv = base ? convertShoe(Object.assign(base, { gender: g })) : meta.estimate;
          if (conv) { out.shoe = { mm: conv.mm, us: extra.us ?? conv.us, uk: extra.uk ?? conv.uk, eu: extra.eu ?? conv.eu }; out.std = conv.mm + 'mm'; }
        }
        // 모자: FREE면 조절범위/기본범위
        if (cat === 'hat') {
          if (meta.std === 'FREE' && m.head_circumference == null && !(ranges.head_circumference || ranges.adjust_range)) {
            out.ranges = Object.assign({}, out.ranges, { head_circumference: dict.hatStandards.free_default });
            warnings.push(`${row[0]}: 머리둘레 정보가 없어 프리사이즈 기본값(${dict.hatStandards.free_default.join('~')}cm)을 사용했습니다`);
          }
          if (m.head_circumference == null && meta.estimate && meta.estimate.head_circumference) m.head_circumference = meta.estimate.head_circumference;
        }
        return out;
      });

      // 단조 증가 검사
      const mono = ['chest', 'waist', 'hip', 'length', 'foot_length', 'head_circumference'];
      for (const k of mono) {
        const seq = sizes.map((s) => s.measurements[k]).filter((v) => v != null);
        for (let i = 1; i < seq.length; i++) if (seq[i] < seq[i - 1]) { warnings.push(`'${k}' 값이 사이즈 순서대로 커지지 않습니다 — 표를 확인하세요`); break; }
      }
      if (opts.description && cat === 'hat') { const t = hatAdjustType(opts.description); if (t) sizes.forEach((s) => (s.adjust = t)); }

      return { category: cat, gender, orientation, sizes, columns, warnings, unknownHeaders };
    }

    /* 2026-11-12 하의 「밑단」이 치마 밑단인지 가린다. 사전의 하의 밑단(leg_opening)은 바지 발목 기준(단면 8~45)이라
       치마 밑단(예: 힙44 밑단56 → 단면, 둘레 112)이 바지 둘레 56 으로 읽히거나 범위 밖으로 빠졌다.
       치마로 보는 경우: ① 표 제목·이름·머리글·글에 치마/스커트/skirt ② 밑단이 엉덩이와 같은 기준(단면/둘레)으로 엉덩이의 0.8배 이상
       (바지는 한쪽 다리 통이라 엉덩이보다 훨씬 좁다) ③ 엉덩이가 없을 때: 밑단 머리글이 「단면」이거나 다른 둘레 열이 단면인데 밑단 숫자가 바지 단면 최대(45)보다 큼,
       또는 머리글이 「둘레」인데 바지 둘레 최대(90)보다 큼. 인심·허벅지·무릎·밑위 열이 있으면 ①이 아닌 한 바지로 본다 */
    function skirtHemPass(colPlans, columns, defs, opts, header, warnings) {
      const sk = defs.skirt_hem;
      if (!sk) return;
      const hems = colPlans.filter((p) => p.key === 'leg_opening' && p.unitFactor != null);
      if (!hems.length) return;
      const SKIRT = /치마|스커트|skirt/i;
      const named = !!opts.skirt || SKIRT.test(String(opts.title || '') + ' ' + String(opts.name || '')) || header.some((h) => SKIRT.test(String(h || '')));
      const pantsOnly = colPlans.some((p) => ['inseam', 'thigh', 'knee', 'rise', 'back_rise'].includes(p.key));
      const others = colPlans.filter((p) => p.def && p.def.measure === 'circ' && p.key !== 'leg_opening' && p.factor != null && p.group !== 'body');
      const hip = others.find((p) => p.key === 'hip');
      const basis = (hip || others[0]) ? !!(hip || others[0]).half : null; // 같은 표 다른 둘레 열이 단면이었는지
      for (const p of hems) {
        const vals = p.raw.filter(Boolean).map((x) => x.value);
        if (!vals.length) continue;
        const md = median(vals) * p.unitFactor;
        const hHalf = hasHint(p.header, dict.headerHints.half), hFull = hasHint(p.header, dict.headerHints.full);
        let isSkirt = named;
        if (!isSkirt && !pantsOnly) {
          if (hip) {
            const hipCm = median(hip.raw.filter(Boolean).map((x) => x.value)) * hip.factor;
            const sameHalf = hHalf ? true : hFull ? false : !!hip.half;
            const hemCm = md * (sameHalf ? 2 : 1);
            isSkirt = hipCm > 0 && hemCm >= hipCm * 0.8;
          } else if (hFull) isSkirt = md > defs.leg_opening.fullRange[1];
          else if (hHalf || basis === true) isSkirt = md > defs.leg_opening.halfRange[1];
        }
        if (!isSkirt) continue;
        // 치마 밑단 기준으로 단면/둘레 다시 판단(머리글 힌트 > 같은 표 다른 둘레 열 기준 > 치마 범위)
        let half;
        if (hHalf) half = true;
        else if (hFull) half = !inR(md, sk.fullRange) && inR(md, sk.halfRange);
        else if (basis != null) half = basis;
        else half = md <= (sk.halfRange[1] + sk.fullRange[0]) / 2;
        const note = p.unitNote.slice();
        p.factor = p.unitFactor * (half ? 2 : 1); p.half = half;
        if (half) note.push('단면×2');
        note.push('치마 밑단으로 판단');
        const oldCol = p.variant && !p.primary ? 'leg_opening@' + p.variant : 'leg_opening';
        delete columns[oldCol];
        p.key = 'skirt_hem'; p.def = sk;
        columns[p.variant && !p.primary ? 'skirt_hem@' + p.variant : 'skirt_hem'] = { header: p.header, conversion: note.join(', '), group: p.group, variant: p.variant || undefined, ci: p.ci, factor: p.factor };
      }
    }

    // ---------- 3-2) 글로 적힌 사이즈 → 표로 변환 후 정규화 ----------
    // 예: "S : 어깨 47 / 가슴 56 / 총장 70\nM : 어깨 49 / 가슴 58 / 총장 72 (단면, 1~3cm 오차)"
    const LABEL_RE = /(?:^|[\s\n\/|,·]|(?<=[\]\)]))[\[\(【]?\s*((?:XXXS|XXS|XS|XXXL|XXL|XL|2XL|3XL|4XL|LL|2L|3L|S|M|L|F|FREE|프리|ONE\s?SIZE)(?:\s*[(（][^)）]{1,10}[)）])?|(?:44|55|66|77|88|99)반?|\d{2,3}(?:\s*[(（](?:XXS|XS|S|M|L|XL|XXL|2XL|3XL)[)）]))\s*(?:사이즈|size)?\s*[\]\)】]?\s*(?=[:：\-–=]|\s*[\/|]|\s+[가-힣A-Za-z])/gi;
    const IGNORE = /(모델|착용|오차|기준|참고|정도|상세|측정|세탁|가능|피팅|키\s*\d+.*몸무게)/;

    function parseSizeText(text, opts = {}) {
      const cat = opts.category || 'top';
      const src = String(text || '').replace(/\r/g, '');
      const globalHalf = /단면/.test(src) && !/둘레/.test(src);
      const globalInch = /(inch|인치)/i.test(src) && !/cm/i.test(src);
      // 모델 정보 줄 제거
      const lines = src.split(/\n+/).filter((l) => !/모델|착용\s*사이즈|model/i.test(l) || /[:：]\s*(어깨|가슴|총장|허리)/.test(l));
      const body = lines.join('\n');

      // 사이즈 호칭 위치 찾기
      const marks = [];
      let m; LABEL_RE.lastIndex = 0;
      while ((m = LABEL_RE.exec(body))) {
        const label = m[1].trim();
        const start = m.index + m[0].indexOf(m[1]);
        // 숫자 호칭(55, 66반)은 ':', '사이즈', 괄호가 붙을 때만 호칭으로 인정 ('가슴 55 /' 오인 방지)
        if (/^\d/.test(label) && !/[\[\(【]|사이즈|size/i.test(m[0]) && !/^\s*[:：]/.test(body.slice(LABEL_RE.lastIndex))) continue;
        marks.push({ label, start, end: LABEL_RE.lastIndex });
      }
      const segs = [];
      if (!marks.length) segs.push({ label: opts.defaultLabel || 'FREE', text: body });
      else marks.forEach((mk, i) => segs.push({ label: mk.label, text: body.slice(mk.end, i + 1 < marks.length ? marks[i + 1].start : body.length) }));

      const PAIR = /([가-힣A-Za-z][가-힣A-Za-z ]{0,14}?)\s*[:：=]?\s*(\d+(?:\.\d+)?(?:\s*[~∼～\-–]\s*\d+(?:\.\d+)?)?)\s*(cm|mm|inch|인치|kg)?/gi;
      const headers = [], rows = [], unknown = new Set();
      for (const sg of segs) {
        const row = { _label: sg.label };
        /* 항목 이름 뒤 괄호 메모(「허리(밴딩)30~」의 (밴딩))는 지운다 — 남겨 두면 「밴딩」이 항목 이름으로 읽혀 허리가 빠진다. 숫자가 든 괄호는 그대로 */
        const segText = sg.text.replace(/([가-힣A-Za-z])\s*[(（]([^)）\d]{1,8})[)）]\s*(?=\d)/g, (all, a, memo) => a + (/단면|둘레|너비/.test(memo) ? memo.trim() : '') + ' ');
        let p; PAIR.lastIndex = 0;
        while ((p = PAIR.exec(segText))) {
          const name = p[1].trim();
          if (!name || IGNORE.test(name)) continue;
          const r = resolveKey(name, cat);
          if (!r) { unknown.add(name); continue; }
          let h = name;
          const def = r.group === 'body' ? dict.keys.body[r.key] : keyDefs(cat)[r.key];
          if (def && def.measure === 'circ' && globalHalf && !hasHint(h, dict.headerHints.half) && !hasHint(h, dict.headerHints.full)) h += '단면';
          if ((p[3] && /inch|인치/i.test(p[3])) || globalInch) h += '(inch)';
          const hk = r.key + '|' + h;
          let hdr = headers.find((x) => x.key === r.key);
          if (!hdr) { hdr = { key: r.key, header: h }; headers.push(hdr); }
          if (row[r.key] == null) row[r.key] = p[2].replace(/\s+/g, '');
        }
        if (Object.keys(row).length > 1) rows.push(row);
      }
      if (!rows.length) return { category: cat, sizes: [], columns: {}, warnings: ['글에서 사이즈 수치를 찾지 못했습니다'], unknownHeaders: [...unknown], source: 'text' };
      const table = [['사이즈', ...headers.map((h) => h.header)], ...rows.map((r) => [r._label, ...headers.map((h) => (r[h.key] != null ? r[h.key] : ''))])];
      const out = normalizeTable(table, Object.assign({}, opts, { skirt: !!opts.skirt || /치마|스커트|skirt/i.test(src) }));
      out.source = 'text';
      out.table = table;
      out.unknownHeaders = [...new Set([...out.unknownHeaders, ...unknown])];
      return out;
    }

    // ---------- 4) 사용자 신체치수와 비교 (핏 판정) ----------
    function fitAgainstBody(size, bodyCm, cat) {
      // bodyCm: { chest, waist, hip, shoulder ... } 신체 둘레 cm
      const pairs = cat === 'bottom' ? [['waist', 'waist'], ['hip', 'hip'], ['thigh', 'thigh']] : [['chest', 'chest'], ['waist', 'waist'], ['hip', 'hip']];
      const out = {};
      for (const [g, b] of pairs) {
        const gv = size.measurements[g], bv = bodyCm[b];
        if (gv == null || bv == null) continue;
        const ease = round1(gv - bv);
        let label;
        if (ease < 0) label = '작음(낌)';
        else if (ease < 4) label = '타이트';
        else if (ease < 10) label = '레귤러';
        else if (ease < 20) label = '루즈';
        else label = '오버핏';
        out[g] = { ease, label };
      }
      return out;
    }

    return { resolveKey, addSynonym, parseNumber, parseSizeLabel, isSizeLabel, convertShoe, normalizeWidth, hatAdjustType, normalizeTable, parseSizeText, fitAgainstBody, dict };
  }

  return { create };
});
