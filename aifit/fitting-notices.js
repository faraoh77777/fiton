/*!
 * [FITON 수정] 추천 사이즈 안내: 고른 사이즈에 값이 비어 있는 부위(status 'missing')가 있으면 distance()가 target 없이 죽던 문제를 막음
 * fitting-notices.js — 분석 결과를 보고 피팅룸 대기 화면에 띄울 안내 슬라이드를 자동으로 고름
 * 브라우저: <script src="fitting-notices.js"></script>  FittingNotices.build({...})
 * Node:     require('./fitting-notices.js').build({...})
 *
 * 입력 (있는 것만 넣으면 됨)
 *   normalized : size-normalizer 결과 (normalizeTable / parseSizeText)
 *   extract    : size-extract 결과 (process)
 *   evaluation : style-fit evaluate() 결과 (사용자가 고른 사이즈)
 *   recommend  : style-fit recommend() 결과
 *   variant    : 선택한 기장 버전 이름 (예: '롱버전')
 * 출력: { slides: [{ type, icon, title, body, priority }], footer, confidence }
 *   type: 'warn'(주의) | 'result'(분석 결과) | 'info'(참고) | 'tip'(일반 팁)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FittingNotices = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const FOOTER = '핏 결과는 판매자 실측표를 기준으로 한 참고용이며, 실제 착용감은 소재와 체형에 따라 다를 수 있어요.';

  const TIPS = [
    { icon: '📏', title: '단면과 둘레', body: '단면은 옷을 펼쳐 놓고 잰 폭이에요. 2를 곱하면 둘레가 돼요. AI FIT은 모두 둘레로 바꿔 비교해요.' },
    { icon: '👕', title: '같은 M도 다 달라요', body: '사이즈 이름(S·M·L, 55·66)은 브랜드마다 기준이 달라요. 이름보다 실측 치수를 믿으세요.' },
    { icon: '🧺', title: '내 옷으로 더 정확하게', body: '평소 잘 맞는 옷의 실측을 재서 입력하면, 내 몸 치수보다 더 정확한 비교가 가능해요.' },
    { icon: '🧵', title: '소재도 핏을 바꿔요', body: '스판이 들어간 옷은 표시보다 여유 있게, 린넨·면 100%는 표시 그대로 느껴져요.' },
    { icon: '🔁', title: '사이 사이즈라면', body: '두 사이즈 사이라면 핵심 부위(바지는 허리·엉덩이, 셔츠는 어깨)가 맞는 쪽을 고르세요.' },
  ];

  const NAME = { chest: '가슴', shoulder: '어깨', waist: '허리', hip: '엉덩이', thigh: '허벅지', neck: '목둘레', sleeve: '소매', length: '기장', inseam: '기장', arm: '팔길이', inseamBody: '다리 길이' };
  const BODY = { shoulder: '어깨너비', thigh: '허벅지둘레', inseam: '다리 길이', arm: '팔길이' };
  const FROM = { shoulder: '키', thigh: '엉덩이둘레', inseam: '키', arm: '키' };

  function build(input = {}) {
    const { normalized, extract, evaluation, recommend, variant } = input;
    const slides = [];
    const push = (s) => { if (!slides.some((x) => x.title === s.title)) slides.push(s); };
    const sizes = (normalized && normalized.sizes) || (extract && extract.result && extract.result.sizes) || [];
    const columns = (normalized && normalized.columns) || (extract && extract.result && extract.result.columns) || {};

    // ---- 주의 (상품별) ----
    if (extract && extract.warnings && extract.warnings.some((w) => w.includes('잘려')))
      push({ type: 'warn', icon: '✂️', priority: 1, title: '사이즈표 일부만 보여요', body: '캡처에 표가 다 담기지 않았어요. 나머지 부분도 올려주면 더 정확해져요.' });

    if (sizes.some((s) => s.std === 'FREE'))
      push({ type: 'warn', icon: '⚠️', priority: 1, title: '프리사이즈 상품이에요', body: '프리사이즈는 브랜드마다 기준이 달라요. 표시된 체형 범위보다 실측 치수를 확인하세요.' });

    const noMeasure = sizes.length && sizes.every((s) => !s.measurements || !Object.keys(s.measurements).length);
    if (noMeasure)
      push({ type: 'warn', icon: '📐', priority: 1, title: '실측표가 없어요', body: '사이즈 이름만 있어서 일반 기준으로 추정했어요. 실제 치수와 차이가 날 수 있어요.' });

    const overseas = Object.values(columns).some((c) => /inch/.test(c.conversion || '')) ||
      sizes.some((s) => /us|eu|uk/.test(s.kind || '') || (s.shoe && s.kind === 'shoe' && /^(US|UK|EU)/i.test(s.label)));
    if (overseas)
      push({ type: 'warn', icon: '🌍', priority: 1, title: '해외 사이즈 표기예요', body: '인치·해외 사이즈를 국내 기준으로 바꿔 계산했어요. 수입품은 국내 규격과 차이가 있으니 참고용으로 봐주세요.' });

    if (Object.values(columns).some((c) => /추정/.test(c.conversion || '')))
      push({ type: 'warn', icon: '❓', priority: 2, title: '단위가 적혀 있지 않아요', body: '숫자 크기를 보고 단위를 추정했어요. 판매자 페이지에서 단위를 한 번 확인해 주세요.' });

    if (evaluation) {
      if (evaluation.missingRequired && evaluation.missingRequired.length)
        push({ type: 'warn', icon: '🧩', priority: 1, title: '중요한 치수가 빠졌어요', body: `${evaluation.style}은 ${evaluation.missingRequired.join('·')}가 핏을 좌우하는데 사이즈표에 없어요. 결과 정확도가 낮을 수 있어요.` });
      const estKeys = [...new Set((evaluation.points || []).filter((p) => p.bodyEstimated).map((p) => keyOfBody(p.key)))].filter((k) => BODY[k]);
      if (estKeys.length) {
        const from = [...new Set(estKeys.map((k) => FROM[k]))].join('·');
        push({ type: 'info', icon: '✏️', priority: 2, title: '일부 신체 치수는 추정값이에요', body: `${estKeys.map((k) => BODY[k]).join('·')}는 ${from}로 추정했어요. 직접 입력하면 더 정확해요.` });
      }
      if ((evaluation.warnings || []).some((w) => w.includes('신축성')))
        push({ type: 'info', icon: '🧵', priority: 2, title: '신축성 소재 기준이에요', body: '보통 스판이 들어가는 스타일이에요. 신축성이 없는 소재라면 결과보다 작게 느껴질 수 있어요.' });
    }

    const notes = [].concat((extract && extract.notes) || []).filter((n) => /오차/.test(n));
    if (notes.length)
      push({ type: 'info', icon: '📝', priority: 3, title: '판매자 안내', body: notes[0].replace(/^\*+\s*/, '') });

    const withVariants = sizes.find((s) => s.variants);
    if (withVariants) {
      const names = Object.keys(withVariants.variants);
      push({ type: 'info', icon: '📏', priority: 3, title: '기장 버전이 여러 개예요', body: `${names.join(' / ')}이 있어요. 지금은 ${variant || names[0]} 기준으로 입혀볼게요.` });
    }

    // ---- 분석 결과 ----
    if (evaluation) {
      const pts = (evaluation.points || []).filter((p) => p.ease != null || p.band);
      const line = pts.slice(0, 4).map((p) => p.band ? (p.key === 'sleeve' ? `${p.band} 소매` : /기장/.test(p.band) ? p.band : `기장 ${p.band}`) : `${NAME[p.key] || p.name} ${p.ease > 0 ? '+' : ''}${p.ease}cm(${p.verdictKo})`).join(', ');
      push({ type: 'result', icon: '🔍', priority: 2, title: `${evaluation.style} ${evaluation.size} · ${evaluation.overall}`, body: line ? `내 몸 대비 여유: ${line}` : '핵심 치수를 비교하고 있어요.' });
    }
    if (recommend && recommend.best && evaluation && recommend.best.size !== evaluation.size) {
      const b = recommend.best;
      // 지금 사이즈에서 안 맞던 부위 중 추천 사이즈에서 나아지는 곳을 이유로
      const cur = {}; (evaluation.points || []).forEach((p) => (cur[p.key] = p));
      const better = (b.points || []).filter((p) => p.ease != null && cur[p.key] && cur[p.key].ease != null && cur[p.key].verdict !== 'ok' &&
        Math.abs(distance(p)) < Math.abs(distance(cur[p.key]))).sort((x, y) => x.priority - y.priority);
      const why = [...new Set(better.map((p) => NAME[p.key] || p.name))].slice(0, 3).join('·');
      const worse = (b.points || []).filter((p) => p.priority === 1 && p.verdict !== 'ok' && cur[p.key] && cur[p.key].verdict === 'ok').map((p) => `${NAME[p.key] || p.name} ${p.verdictKo}`);
      push({ type: 'result', icon: '💡', priority: 2, title: `${b.size} 사이즈도 확인해 보세요`,
        body: `${why ? `${b.size} 사이즈는 ${why}가 더 편해요` : `${b.size} 사이즈가 전체 점수가 더 높아요`}${worse.length ? ` (대신 ${worse.join(', ')})` : ''}.` });
    }

    // 정렬: 주의 → 결과 → 참고 → 팁
    const order = { warn: 0, result: 1, info: 2, tip: 3 };
    slides.sort((a, b) => order[a.type] - order[b.type] || a.priority - b.priority);
    // 팁으로 채워 최소 5장
    // 팁은 최소 2장, 전체가 5장이 안 되면 5장까지 채움
    const need = Math.min(TIPS.length, Math.max(2, 5 - slides.length));
    TIPS.slice(0, need).forEach((tip) => slides.push(Object.assign({ type: 'tip', priority: 4 }, tip)));

    let confidence = evaluation ? evaluation.confidence : (noMeasure ? '낮음' : null);
    // 상품별 주의가 있으면 '높음'으로 두지 않음
    if (confidence === '높음' && slides.some((s) => s.type === 'warn')) confidence = '보통';
    return { slides, footer: FOOTER, confidence };
  }

  function keyOfBody(k) { return k === 'sleeve' ? 'arm' : k; }
  // 목표 범위에서 얼마나 벗어났는지 (범위 안이면 0)
  function distance(p) { const [lo, hi] = p.target; return p.ease < lo ? p.ease - lo : p.ease > hi ? p.ease - hi : 0; }

  return { build, TIPS, FOOTER };
});
