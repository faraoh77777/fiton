/*!
 * size-extract.js — 쇼핑몰 캡처 이미지에서 "사이즈표만" 골라내기
 *
 * 1단계(AI): 이미지 → JSON. 프롬프트가 사이즈표만 뽑고 나머지(검색창·가격·버튼·리뷰·모델정보)는 버리도록 지시
 * 2단계(코드): AI가 실수로 섞어 넣은 내용을 규칙으로 한 번 더 걸러냄 → size-normalizer로 넘길 2차원 표
 *
 * 사용:
 *   const X = SizeExtract.create(normalizer);              // normalizer = SizeNormalizer.create(dict)
 *   const req = X.buildClaudeRequest(base64Jpeg, 'image/jpeg'); // 서버(Supabase Edge Function)에서 API 호출
 *   const out = X.process(modelText, { category, gender });   // 걸러진 표 + 정규화 결과
 * API 키는 브라우저에 두지 말고 Edge Function 등 서버 쪽에서 호출하세요.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SizeExtract = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- 1) AI에게 줄 지시문 ----------
  const EXTRACT_PROMPT = `이 이미지는 쇼핑몰 화면 캡처입니다. 사이즈 정보만 추출하세요.

[추출할 것]
- 옷·신발·모자의 "실측 사이즈표" (제품사이즈, 실측사이즈, SIZE, 사이즈 가이드 등)
- 표가 아니라 글로 적힌 사이즈 수치 (예: "FREE / 어깨 52 가슴 60 총장 70")
- 표 제목, 단위 표기(cm, inch, 단면/둘레), 표 바로 아래의 측정 안내 문구(오차 등)

[무시할 것 — 절대 표에 넣지 마세요]
- 검색창, 메뉴, 탭(상품요약·상세정보·리뷰·추천상품), 버튼(구매하기·선물하기·장바구니)
- 가격, 할인, 쿠폰, 배송, 적립, 상태바(시간·배터리)
- 리뷰, 별점, 추천 상품, 광고 문구, 상품 사진 속 글자
- 모델 착용 정보(모델 키/몸무게/착용 사이즈) → model 항목에 따로 적기
- 세탁 방법, 소재 혼용률 표 → material 항목에 따로 적기

[규칙]
- 이미지에 보이는 글자와 숫자만 그대로 옮기세요. 추측해서 채우지 마세요.
- 표가 잘려서 일부만 보이면 보이는 부분만 적고 partial을 true로 하세요.
- 셀이 비어 있으면 ""로 두세요. 한 셀 안의 줄바꿈은 공백으로 합치세요 (예: "S (25~26)").
- 표는 화면에 보이는 방향 그대로 첫 행부터 옮기세요 (가로·세로 바꾸지 마세요).
- 사이즈 정보가 없으면 found를 false로 하세요.

[출력: JSON만, 다른 말 없이]
{
  "found": true,
  "tables": [
    { "title": "제품사이즈", "unit": "cm", "measureNote": "단면", "partial": false,
      "rows": [["사이즈","S (25~26)","M (27~28)"],["허리","32","34"]] }
  ],
  "texts": ["글로 적힌 사이즈 수치가 있으면 원문 그대로"],
  "notes": ["사이즈 측정 방법에 따라 1-2cm 오차"],
  "product": { "title": "", "category": "top|bottom|dress|shoes|hat|unknown", "gender": "men|women|unisex|unknown" },
  "model": "", "material": ""
}`;

  function create(normalizer) {
    const N = normalizer;

    // Claude Messages API 요청 본문 (서버에서 fetch로 보냄)
    function buildClaudeRequest(base64, mediaType = 'image/jpeg', model = 'claude-sonnet-5-5') {
      return {
        model, max_tokens: 2000,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: EXTRACT_PROMPT },
        ] }],
      };
    }

    // ---------- 2) AI 응답에서 JSON 꺼내기 ----------
    function parseModelOutput(text) {
      if (text && typeof text === 'object') return text;
      const s = String(text || '');
      const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
      const body = fence ? fence[1] : s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1);
      try { return JSON.parse(body); } catch (e) { return { found: false, error: 'AI 응답을 JSON으로 읽지 못했습니다' }; }
    }

    // ---------- 3) 코드로 한 번 더 거르기 ----------
    const NOISE = /(원|₩|\$|할인|쿠폰|적립|배송|구매|선물|장바구니|리뷰|별점|추천|검색|맨위로|상품요약|상세정보|무료|혜택|이벤트|로그인|찜|공유|문의|%\s*off|sale)/i;
    const MODEL = /(모델|model|착용)/i;
    const NOTE = /(오차|측정|기준|참고|단위|상이|차이)/;

    const isNum = (c) => /^\s*\d+(\.\d+)?(\s*[~∼～\-–]\s*\d+(\.\d+)?)?\s*(cm|mm|inch|인치|")?\s*$/i.test(String(c));

    function rowKind(row, cat) {
      const label = String(row[0] || '').trim();
      const cells = row.slice(1);
      const joined = row.join(' ');
      if (!label && cells.every((c) => !String(c).trim())) return 'empty';
      if (MODEL.test(label)) return 'model';
      if (NOISE.test(joined) && !N.resolveKey(label, cat)) return 'noise';
      if (N.resolveKey(label, cat)) return cells.some(isNum) ? 'measure' : 'measureNoValue';
      if (N.isSizeLabel(label, cat) || /^(사이즈|size|구분|호칭)$/i.test(label)) return 'size';
      if (NOTE.test(joined) && cells.filter(isNum).length === 0) return 'note';
      return 'unknown';
    }

    // 표가 사이즈표인지 점수 매기기
    function tableScore(rows, cat) {
      if (!rows || rows.length < 2) return 0;
      const head = rows[0];
      const sizeCols = head.slice(1).filter((c) => N.isSizeLabel(c, cat)).length;
      const keyCols = head.slice(1).filter((c) => N.resolveKey(c, cat)).length;
      const sizeRows = rows.slice(1).filter((r) => N.isSizeLabel(r[0], cat)).length;
      const keyRows = rows.slice(1).filter((r) => N.resolveKey(r[0], cat)).length;
      const nums = rows.slice(1).flatMap((r) => r.slice(1)).filter(isNum).length;
      const noise = rows.filter((r) => NOISE.test(r.join(' '))).length;
      return (Math.max(sizeCols + keyRows, keyCols + sizeRows) * 2) + Math.min(nums, 20) * 0.5 - noise * 3;
    }

    function cleanTable(rows, cat) {
      const kept = [], dropped = [], notes = [], model = [];
      // 가로 표(사이즈가 첫 행)인지 세로 표인지 먼저 판단
      const sizeInHead = rows[0].slice(1).filter((c) => N.isSizeLabel(c, cat)).length >= 2;
      rows.forEach((r, i) => {
        const row = r.map((c) => String(c == null ? '' : c).replace(/\s+/g, ' ').trim());
        if (i === 0) { kept.push(row); return; }
        const k = rowKind(row, cat);
        if (k === 'empty') return;
        if (k === 'model') { model.push(row.join(' ')); dropped.push({ row, reason: '모델 정보' }); return; }
        if (k === 'note') { notes.push(row.filter(Boolean).join(' ')); dropped.push({ row, reason: '안내 문구' }); return; }
        if (k === 'noise') { dropped.push({ row, reason: '가격·버튼 등 화면 요소' }); return; }
        if (sizeInHead && k !== 'measure') { dropped.push({ row, reason: k === 'measureNoValue' ? '수치 없음' : '사이즈 항목 아님' }); return; }
        if (!sizeInHead && k === 'unknown' && !row.slice(1).some(isNum)) { dropped.push({ row, reason: '수치 없음' }); return; }
        kept.push(row);
      });
      // 열 정리: 헤더가 비어 있고 값도 거의 없는 열 제거
      const width = kept[0].length;
      const keepCol = [...Array(width).keys()].filter((ci) => ci === 0 || kept[0][ci] || kept.slice(1).some((r) => isNum(r[ci] || '')));
      const table = kept.map((r) => keepCol.map((ci) => r[ci] == null ? '' : r[ci]));
      return { table, dropped, notes, model };
    }

    // ---------- 4) 전체 처리 ----------
    function process(modelText, opts = {}) {
      const data = parseModelOutput(modelText);
      const product = data.product || {};
      const cat = opts.category || (product.category && product.category !== 'unknown' ? product.category : 'top');
      const gender = opts.gender || (product.gender && product.gender !== 'unknown' ? product.gender : 'unisex');
      const report = { found: false, category: cat, gender, notes: [].concat(data.notes || []), dropped: [], model: data.model || '', material: data.material || '', warnings: [] };
      if (data.error) { report.warnings.push(data.error); return report; }

      // 여러 표 중 사이즈표 고르기
      const tables = (data.tables || []).map((t) => ({ t, score: tableScore(t.rows, cat) })).sort((a, b) => b.score - a.score);
      const best = tables.find((x) => x.score >= 4);
      tables.filter((x) => x !== best).forEach((x) => report.dropped.push({ table: x.t.title || '(제목 없음)', reason: '사이즈표 아님' }));

      if (best) {
        const c = cleanTable(best.t.rows, cat);
        report.dropped.push(...c.dropped);
        report.notes.push(...c.notes);
        if (c.model.length) report.model = [report.model, ...c.model].filter(Boolean).join(' / ');
        const unit = /inch|인치/i.test((best.t.unit || '') + (best.t.title || '')) ? 'inch' : undefined;
        const title = [best.t.title, best.t.unit, best.t.measureNote].filter(Boolean).join(' ');
        const r = N.normalizeTable(c.table, { category: cat, gender, unit, title });
        Object.assign(report, { found: r.sizes.length > 0, source: 'table', title: best.t.title, table: c.table, result: r });
        if (best.t.partial) report.warnings.push('표가 잘려 일부만 보입니다. 나머지 부분도 캡처해 주세요');
      } else if ((data.texts || []).length) {
        const r = N.parseSizeText(data.texts.join('\n'), { category: cat, gender });
        Object.assign(report, { found: r.sizes.length > 0, source: 'text', result: r });
      }
      if (!report.found) report.warnings.push('캡처에서 사이즈표를 찾지 못했습니다. 사이즈표 부분이 보이게 다시 캡처해 주세요');
      return report;
    }

    return { EXTRACT_PROMPT, buildClaudeRequest, parseModelOutput, tableScore, cleanTable, process };
  }

  return { create };
});
