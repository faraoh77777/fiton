/* FITON for PC — 승인된 설계(fiton-pc-설계\v9_설계요약_결정반영\*.dc.html)의 화면을 그대로 옮기고, 예시 값 자리에 실제 데이터를 연결했다.
   폰 앱(shorts.js)과 같은 저장소·같은 입히기 서버를 쓴다. 공통 기능은 fit-core.js, 핏 계산은 fit-engine.js.
   겉옷·액세서리: 화면과 저장은 설계대로 동작하지만, 입히기 서버가 아직 받지 못해 입은 그림에는 들어가지 않는다(폰 앱·서버 수정 뒤 연결, 2026-11-06 사용자 결정).
   새 저장 값: sel.outer, accs, accSel. 폰 앱은 이 값을 읽지 않으며, 저장할 때 그대로 보존한다. */
(function () {
  'use strict';

  var Core = window.FitCore, E = window.FitEngine, KEY = Core.KEY, CUR_KEY = Core.CUR_KEY;
  var FD = window.FITON || { styles: [], plans: { free: { name: '무료', limit: 3, price: '', features: [] } } };
  var BASE_CFG = JSON.parse(JSON.stringify(window.FIT_CONFIG));
  var CATS = { outer: '겉옷', inner: '이너', top: '상의', bottom: '하의', dress: '원피스', shoe: '신발' };
  var CAT_ORDER = ['outer', 'inner', 'top', 'bottom', 'dress', 'shoe'];
  /* 용도 태그(kind): 옷장을 보기 좋게 나누는 값. 입히기·핏·서버 요청은 cat(겉옷·상의·하의…)만 쓰고 kind 는 쓰지 않는다. 언더웨어만 입히기에서 뺀다 */
  var KINDS = [['suit', '정장'], ['inner', '이너(티·드레스셔츠)'], ['home', '홈웨어'], ['sport', '트레이닝·요가'], ['outdoor', '아웃도어(등산·골프·스키)'], ['swim', '수영·비치'], ['dance', '댄스·발레'], ['costume', '유니폼·코스튬'], ['maternity', '임산부'], ['hanbok', '한복'], ['two', '투피스·세트'], ['under', '언더웨어']];
  var KIND_NAME = {}; KINDS.forEach(function (k) { KIND_NAME[k[0]] = k[1].replace(/\(.*\)/, ''); });
  var KIND_GUESS = [['under', /속옷|언더웨어|팬티|브라|런닝|내의|보정|스타킹|양말/], ['maternity', /임산부|임부|수유복|maternity/i], ['hanbok', /한복|저고리|수의|당의/], ['swim', /수영|비키니|래쉬|래시|비치웨어|스윔|모노키니|swim/i], ['dance', /댄스|발레|에어로빅|레오타드|무용/], ['outdoor', /등산|골프|스키복|스노보드|보드복|아웃도어|트레킹|고어텍스|바람막이|캠핑/], ['costume', /유니폼|코스튬|코스프레|교복|작업복|근무복/], ['home', /잠옷|파자마|홈웨어|라운지|수면|극세사/], ['sport', /트레이닝|츄리닝|운동|조거|요가|레깅스|저지|스포츠|러닝|기능성/], ['two', /투피스|세트|셋업|set/i], ['suit', /정장|수트|슈트|블레이저|자켓|재킷|슬랙스/], ['inner', /티셔츠|반팔|드레스셔츠|와이셔츠|셔츠|나시|민소매|이너|히트텍/]];
  var DRESS_KINDS = /^(maternity|hanbok|swim|dance|outdoor|costume|home|sport|two)$/; /* 원피스는 정장·이너·언더웨어 추측은 하지 않는다 */
  /* 2026-11-13 이름에 겉에 입는 옷 단어가 있는데 분류가 상의면 저장할 때 한 번 묻는다(겉옷은 상의 위에 겹쳐 입혀진다) */
  var OUTER_WORDS = /재킷|자켓|블레이저|코트|트렌치|점퍼|패딩|카디건|가디건|집업|야상|무스탕|바람막이/;
  function guessKind(name, cat) {
    if (cat === 'shoe') return '';
    var t = String(name || '');
    for (var i = 0; i < KIND_GUESS.length; i++) if (KIND_GUESS[i][1].test(t)) { if (cat === 'dress' && !DRESS_KINDS.test(KIND_GUESS[i][0])) continue; return KIND_GUESS[i][0]; }
    return '';
  }
  var GGENDER = { female: '여성용', male: '남성용', unisex: '공용' };
  var PREFS = [['tight', '타이트'], ['fit', '정핏'], ['loose', '여유'], ['over', '오버핏']];
  var TOPF = [['chest', '가슴단면'], ['shoulder', '어깨'], ['length', '총장'], ['sleeve', '소매'], ['armhole', '암홀단면'], ['sleeve_width', '소매통단면'], ['hem', '밑단단면']];
  var FIELDS = {
    outer: TOPF, inner: TOPF, top: TOPF,
    bottom: [['waist', '허리단면'], ['hip', '엉덩이단면'], ['thigh', '허벅지단면'], ['knee', '무릎단면'], ['rise', '밑위'], ['inseam', '기장(인심)'], ['hem', '밑단단면'], ['length', '총장(스커트)']],
    dress: [['chest', '가슴단면'], ['shoulder', '어깨'], ['waist', '허리단면'], ['hip', '엉덩이단면'], ['length', '총장'], ['sleeve', '소매'], ['armhole', '암홀단면'], ['sleeve_width', '소매통단면'], ['hem', '밑단단면']],
    shoe: [['inner', '안쪽 길이(mm)']]
  };
  var MFIELDS = [['chest', '가슴둘레', 'cm'], ['shoulder', '어깨너비', 'cm'], ['waist', '허리둘레', 'cm'], ['hip', '엉덩이둘레', 'cm'], ['thigh', '허벅지둘레', 'cm'],
    ['arm', '팔길이', 'cm'], ['inseam', '다리 안쪽 길이', 'cm'], ['rise', '밑위(앞)', 'cm'], ['foot', '발길이', 'mm']];
  /* 2026-11-11 기본 캐릭터 8명(한국 10~40대 남·여 평균 가정치, 10대는 만 19세 성인 기준). m: chest, shoulder, waist, hip, thigh, arm, inseam, rise, foot */
  var PRESETS = [
    { id: 'f10', name: '10대여성', g: 'female', h: 160, w: 52, m: [84, 38, 67, 90, 52, 54, 72, 25, 235] },
    { id: 'f20', name: '20대여성', g: 'female', h: 161, w: 54, m: [85, 38, 69, 91, 53, 55, 73, 25, 237] },
    { id: 'f30', name: '30대여성', g: 'female', h: 161, w: 57, m: [87, 38.5, 72, 93, 54, 55, 73, 26, 237] },
    { id: 'f40', name: '40대여성', g: 'female', h: 160, w: 59, m: [90, 38.5, 76, 94, 55, 54, 72, 26, 237] },
    { id: 'm10', name: '10대남성', g: 'male', h: 172, w: 62, m: [90, 43, 73, 92, 54, 59, 79, 26, 255] },
    { id: 'm20', name: '20대남성', g: 'male', h: 174, w: 70, m: [95, 44, 79, 95, 56, 60, 80, 26, 260] },
    { id: 'm30', name: '30대남성', g: 'male', h: 173, w: 73, m: [97, 44.5, 83, 96, 57, 60, 79, 27, 260] },
    { id: 'm40', name: '40대남성', g: 'male', h: 171, w: 73, m: [98, 44.5, 85, 96, 57, 59, 78, 27, 258] }
  ];
  /* 2026-11-12 기본 모델과 내 아바타 분리. 기본 모델 = 처음 나오는 기본 여성·남성(20대 평균 치수) + 위 8명. 치수는 읽기 전용이고 내 치수(state.profile)를 덮어쓰지 않는다.
     state.who('base'|'me')·state.baseId 만 새로 저장한다. state.profile 과 'avatar' 사진은 예전 그대로 「내 아바타」 자료(폰 앱과 같은 형식 유지) */
  var BASES = [
    { id: 'female', name: '기본 여성', g: 'female', h: 161, w: 54, m: [85, 38, 69, 91, 53, 55, 73, 25, 237], img: 'assets/avatar_default.jpg?v=t' },
    { id: 'male', name: '기본 남성', g: 'male', h: 174, w: 70, m: [95, 44, 79, 95, 56, 60, 80, 26, 260], img: 'assets/avatar_male.jpg?v=t' }
  ].concat(PRESETS.map(function (x) { return { id: x.id, name: x.name, g: x.g, h: x.h, w: x.w, m: x.m, img: 'assets/avatars/' + x.id + '.png', preset: true }; }))
    /* 2026-11-19 얼굴 사진 1장으로 만든 기본 모델(FASHN model-swap + edit). 앞·옆·뒷모습 사진이 모두 있다(ang). 치수는 키 171·몸무게 70 기준 가정치 */
    .concat([{ id: 'cool', name: '멋진남자', g: 'male', h: 171, w: 70, m: [96, 44, 81, 95, 56, 59, 78, 26, 258], img: 'assets/avatars/cool.jpg?v=a', preset: true, ang: { side: 'assets/avatars/cool_side.jpg?v=a', back: 'assets/avatars/cool_back.jpg?v=a' } }]);
  var SHOE_TYPES =[['pumps', '구두 (기본)'], ['sneakers', '운동화'], ['loafers', '로퍼'], ['sandals', '샌들'], ['boots', '부츠']];
  var ACC_TYPES = {
    '모자': { part: 'head', top: '3%', left: '44%', icon: 'M8 5h8l2 9H6zM3 14h18l-1 3H4z' },
    '안경': { part: 'head', top: '9%', left: '42%', icon: 'M3 10h7v3a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM14 10h7v3a3 3 0 0 1-3 3h-1a3 3 0 0 1-3-3zM10 11h4' },
    '귀걸이': { part: 'head', top: '12%', left: '57%', small: true, icon: 'M12 3v8M12 11a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
    '스카프·목도리': { part: 'neck', top: '16%', left: '46%', icon: 'M5 6c4 3 10 3 14 0M5 6v3c4 3 10 3 14 0V6M9 11l-2 10h4l2-9' },
    '목걸이': { part: 'neck', top: '22%', left: '47%', small: true, icon: 'M5 4c0 7 3 11 7 12 4-1 7-5 7-12M12 16v2M12 18l-2 2 2 2 2-2z' },
    '가방': { part: 'body', top: '45%', left: '62%', icon: 'M5 10h14l1 10H4zM8 10V7a4 4 0 0 1 8 0v3' },
    '벨트': { part: 'body', top: '38%', left: '44%', icon: 'M2 10h20v5H2zM9 8h6v9H9zM12 12.5h3' },
    '비니·털모자': { part: 'head', top: '3%', left: '44%', icon: 'M5 14a7 7 0 0 1 14 0zM4 14h16v3H4zM12 5V3' },
    '머리띠': { part: 'head', top: '4%', left: '44%', icon: 'M4 14c0-6 4-10 8-10s8 4 8 10M4 14h2M18 14h2' },
    '헤어핀·집게': { part: 'head', top: '5%', left: '57%', small: true, icon: 'M6 8h12v4H6zM8 12v7M12 12v7M16 12v7' },
    '선글라스': { part: 'head', top: '9%', left: '42%', icon: 'M2 10h20M4 10h7v4a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM13 10h7v4a3 3 0 0 1-3 3h-1a3 3 0 0 1-3-3z' },
    '헤드폰': { part: 'head', top: '8%', left: '42%', icon: 'M4 15v-3a8 8 0 0 1 16 0v3M3 14h4v6H3zM17 14h4v6h-4z' },
    '마스크': { part: 'head', top: '12%', left: '44%', icon: 'M4 8h16v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM4 10H2M20 10h2M8 12h8M8 15h8' },
    '넥타이': { part: 'neck', top: '24%', left: '47%', icon: 'M9 3h6l-1 4 2 12-4 3-4-3 2-12z' },
    '나비넥타이': { part: 'neck', top: '18%', left: '46%', small: true, icon: 'M3 8l7 4-7 4zM21 8l-7 4 7 4zM10 10h4v4h-4z' },
    '초커': { part: 'neck', top: '19%', left: '47%', small: true, icon: 'M4 8c3 5 13 5 16 0M4 8v2c3 5 13 5 16 0V8' },
    '브로치·핀': { part: 'neck', top: '30%', left: '55%', small: true, icon: 'M12 3l2.5 5 5.5.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.5-.8z' },
    '팔찌': { part: 'body', top: '44%', left: '72%', small: true, icon: 'M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
    '장갑': { part: 'body', top: '52%', left: '74%', icon: 'M7 21v-8L5 9l2-1 2 3V4h2v7V3h2v8V4h2v8V6h2v10l-2 5z' },
    '백팩': { part: 'body', top: '36%', left: '62%', icon: 'M7 8a5 5 0 0 1 10 0v12H7zM7 14h10M10 8h4' },
    '클러치·파우치': { part: 'body', top: '50%', left: '28%', icon: 'M3 8h18v10H3zM3 12h18M11 12h2v2h-2z' },
    '우산': { part: 'body', top: '45%', left: '78%', icon: 'M3 12a9 9 0 0 1 18 0zM12 12v7a2 2 0 0 0 4 0M12 3V2' },
    '양말·스타킹': { part: 'body', top: '88%', left: '44%', icon: 'M8 3h7v9l4 4a3 3 0 0 1-2 5H9a3 3 0 0 1-2-3z' },
    '발찌': { part: 'body', top: '90%', left: '50%', small: true, icon: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 3v2M12 19v2' },
    '시계': { part: 'body', top: '44%', left: '24%', small: true, icon: 'M9 3h6l1 4H8zM9 21h6l1-4H8zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 9.5V12l1.8 1.2' },
    '반지': { part: 'body', top: '50%', left: '26%', small: true, icon: 'M12 8a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM9 4h6l-3 4z' }
  };
  var ACC_TABS = [['all', '전체'], ['head', '머리·얼굴'], ['neck', '목'], ['body', '몸·손']];
  var PAGES = [
    ['home', '홈', '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"></path>'],
    ['fitting', '피팅룸', '<path d="M12 7a2 2 0 1 0-2-2M12 7v2L3 16a1.5 1.5 0 0 0 1 3h16a1.5 1.5 0 0 0 1-3l-9-7"></path>'],
    ['closet', '내 옷장', '<rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M12 3v18M9 11v2M15 11v2"></path>'],
    ['accessory', '액세서리', '<path d="M6 3h12l3 6-9 12L3 9zM3 9h18"></path>'],
    ['history', '입어본 기록', '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>'],
    ['body', '내 몸 정보', '<path d="M3 8h18v8H3zM7 8v3M11 8v4M15 8v3M19 8v3"></path>']
  ];
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"></path></svg>';
  var SHIRT = '<svg viewBox="0 0 24 24"><path d="M8 3l4 3 4-3 5 4-3 4-2-1v11H8V10l-2 1-3-4zM12 6v15"></path></svg>';
  var GIDX = { tightBad: 0, tight: 1, fit: 2, loose: 3, over: 4 };
  var TAG_TOP = { shoulder: 22, chest: 33, waist: 42, hip: 50, thigh: 58, shoe: 92 };
  var NOT_YET = '겉옷은 상의와 하의를 함께 골랐을 때만 입혀져요. 액세서리는 옷을 입은 그림이 만들어진 뒤 「액세서리 입히기」 버튼으로 따로 입혀요.';
  /* 서버 tryon 에 outfit3(상의+하의+겉옷) 모드를 배포한 뒤 tryon-config.js 에 outer: true 를 넣는다. 배포 전에 켜면 요청이 거절돼요(횟수는 안 빠짐) */
  function outerWearOn() { return !!(window.TRYON_CFG && window.TRYON_CFG.outer === true); }

  var app = document.getElementById('app');
  var user = (function () { try { return Core.userById(localStorage.getItem(CUR_KEY)); } catch (e) { return null; } })();
  var state = null, urls = { avatar: null, tryon: {}, ang: { side: null, back: null }, angTry: { side: {}, back: {} } }, genPending = null, syncDue = false;
  var ANGS = ['side', 'back'], ANG_NAME = { front: '앞모습', side: '옆모습', back: '뒷모습' }, angBusy = null; /* 2026-11-18 옆·뒷모습 입히기: 방향별 아바타 사진(avatar_side/back)과 결과(tryon_side:/tryon_back:<id>)는 폰 앱과 섞이지 않게 따로 저장 */
  var ui = { page: pageFromHash(), view: 'me', angle: 'front', zoom: 1, rpOff: false, ruler: true, lenmark: true, genErr: null, genSizes: {}, left: 'clothes', fitTab: null, closetCat: 'outer', closetKind: 'all', homeKind: '', accTab: 'all', cmp: null, pend: null, homeCat: null, linkEdit: null, accFull: false,
    cf: null, af: null, lg: { mode: 'list', id: null, err: '', fails: 0, until: 0 } };

  /* ---------- 저장 (폰 앱과 같은 형식) ---------- */
  function blankState() {
    return { step: 'profile', profile: { gender: 'female', height: '', weight: '', pref: 'fit', m: {} }, closet: [], sel: {}, draft: null, motion: 0, cfg: null, feel: {}, seq: 1,
      styleId: null, view: 'model', sub: { plan: 'free', used: 0, month: '' }, accs: [], accSel: [] };
  }
  function load() {
    var s = blankState();
    try { var raw = localStorage.getItem(KEY + ':' + user.id); if (raw) s = Object.assign(s, JSON.parse(raw)); } catch (e) { /* 메모리로만 동작 */ }
    if (!Array.isArray(s.accs)) s.accs = [];
    if (!Array.isArray(s.accSel)) s.accSel = [];
    return s;
  }
  function save() { if (!user) return; try { localStorage.setItem(KEY + ':' + user.id, JSON.stringify(state)); } catch (e) { toast('저장 공간이 부족해 저장하지 못했어요.'); } }
  function bk(k) { return user.id + ':' + k; }
  function blobGet(k) { return Core.rawGet(bk(k)); }
  function blobPut(k, v) { return Core.rawPut(bk(k), v); }
  function blobDel(k) { return Core.rawDel(bk(k)); }
  function clearUrls() {
    if (urls.avatar) URL.revokeObjectURL(urls.avatar);
    Object.keys(urls.tryon).forEach(function (k) { if (urls.tryon[k]) URL.revokeObjectURL(urls.tryon[k]); });
    ANGS.forEach(function (v) { if (urls.ang[v]) URL.revokeObjectURL(urls.ang[v]); Object.keys(urls.angTry[v]).forEach(function (k) { URL.revokeObjectURL(urls.angTry[v][k]); }); });
    urls = { avatar: null, tryon: {}, ang: { side: null, back: null }, angTry: { side: {}, back: {} } };
  }
  function loadMedia() {
    if (!user) return Promise.resolve();
    var uid = user.id, ids = state.closet.map(function (x) { return x.id; }).concat(Object.keys(state.looks || {}));
    var angIds = [];   /* 옆·뒷모습 결과는 만든 기록(state.angBase)이 있는 것만 읽는다 */
    ANGS.forEach(function (v) { Object.keys((state.angBase && state.angBase[v]) || {}).forEach(function (id) { angIds.push([v, id]); }); });
    var none = function () { return null; };
    return Promise.all([blobGet('avatar'), blobGet('avatar_side').catch(none), blobGet('avatar_back').catch(none)].concat(ids.map(function (id) { return blobGet('tryon:' + id); })).concat(angIds.map(function (a) { return blobGet('tryon_' + a[0] + ':' + a[1]).catch(none); }))).then(function (r) {
      if (!user || user.id !== uid) return;
      clearUrls();
      if (r[0]) urls.avatar = URL.createObjectURL(r[0]);
      if (r[1]) urls.ang.side = URL.createObjectURL(r[1]);
      if (r[2]) urls.ang.back = URL.createObjectURL(r[2]);
      ids.forEach(function (id, j) { if (r[3 + j]) urls.tryon[id] = URL.createObjectURL(r[3 + j]); });
      angIds.forEach(function (a, j) { var b = r[3 + ids.length + j]; if (b) urls.angTry[a[0]][a[1]] = URL.createObjectURL(b); });
    });
  }

  /* ---------- 유틸 ---------- */
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function sgn(n) { return (n >= 0 ? '+' : '') + n; }
  function item(id) { return state.closet.filter(function (x) { return x.id === id; })[0] || null; }
  function accItem(id) { return state.accs.filter(function (x) { return x.id === id; })[0] || null; }
  /* 지금 입어보는 쪽: 고른 적이 없으면 내 사진이 있을 때만 '내 아바타', 없으면 '기본 모델' */
  function who() { return state && (state.who === 'base' || state.who === 'me') ? state.who : (urls.avatar ? 'me' : 'base'); }
  function baseModel() {
    var id = state && state.baseId, b = BASES.filter(function (x) { return x.id === id; })[0];
    return b || BASES[state && state.profile && state.profile.gender === 'male' ? 1 : 0];
  }
  /* 핏 계산·성별에 쓰는 몸 정보: 기본 모델이면 그 모델 치수, 내 아바타면 내 치수. 선호 핏(pref)은 늘 내 설정 */
  function prof() {
    var p = (state && state.profile) || {};
    if (who() !== 'base') return p;
    var b = baseModel(), m = {};
    MFIELDS.forEach(function (f, i) { m[f[0]] = String(b.m[i]); });
    return { gender: b.g, height: String(b.h), weight: String(b.w), pref: p.pref, m: m };
  }
  function myPic() { return who() === 'me' && urls.avatar ? urls.avatar : null; } /* 내가 올린 사진을 쓰는 중일 때만 */
  /* 8명 사진은 투명 PNG 라 예전(고르면 흰 바탕 사본을 저장)과 같게 흰 바탕 사본을 만들어 보여 준다. 만들기 전 잠깐은 원본 주소 */
  var basePic = { id: null, url: null };
  function ensureBasePic() {
    var b = baseModel(); if (who() !== 'base' || !b.preset || basePic.id === b.id) return;
    if (basePic.url) URL.revokeObjectURL(basePic.url);
    basePic = { id: b.id, url: null };
    fetch(b.img).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (bl) { return Core.shrink(bl, 1000, 0.92); })
      .then(function (bl) { if (basePic.id !== b.id) return; basePic.url = URL.createObjectURL(bl); render(); }).catch(function () {});
  }
  function charPic() { var b = baseModel(); return myPic() || (who() === 'base' && b.preset ? (basePic.id === b.id && basePic.url) || b.img : null); } /* 기본 여성·남성 사진이 아닌 캐릭터 사진 */
  function isMale() { return !!(state && state.profile && prof().gender === 'male'); }
  function garGender(it) { var g = it && it.gender; return GGENDER[g] ? g : (isMale() ? 'male' : 'female'); }
  function engCat(c) { return c === 'outer' || c === 'inner' ? 'top' : c; } /* 핏 계산에서 겉옷·이너는 상의와 같은 항목으로 잰다 */
  function safeUrl(u) {
    u = String(u || '').trim(); if (!u) return '';
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    try { var x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch (e) { return ''; }
  }
  function priceText(v) { var n = Number(String(v == null ? '' : v).replace(/[^\d.]/g, '')); return n > 0 ? n.toLocaleString('ko-KR') + '원' : ''; }
  function cfgNow() {
    var c = JSON.parse(JSON.stringify(BASE_CFG));
    if (state.cfg) {
      Object.keys(state.cfg.grades || {}).forEach(function (k) { if (c.grades[k]) c.grades[k].th = state.cfg.grades[k].slice(); });
      Object.keys(state.cfg.fabric || {}).forEach(function (k) { if (c.fabric[k]) c.fabric[k].bonus = state.cfg.fabric[k]; });
    }
    return c;
  }
  function toast(msg, ms) {
    var el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg; document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, ms || 4500);
  }
  function pageFromHash() { var p = (location.hash || '').replace('#', ''); return p === 'plan' || p === 'set' || (p !== 'accessory' || accOn()) && PAGES.some(function (x) { return x[0] === p; }) ? p : 'home'; }
  function go(p) { ui.page = p; ui.accFull = false; ui.linkEdit = null; if (location.hash !== '#' + p) location.hash = '#' + p; render(); window.scrollTo(0, 0); }
  function exclusiveSel(cat) {
    /* 2026-11-12 사용자 결정: 원피스 위에 상의(종류 제한 없음)를 겹쳐 입을 수 있다. 원피스와 하의만 서로 바꿔 끼운다 */
    if (cat === 'dress') delete state.sel.bottom;
    else if (cat === 'bottom') delete state.sel.dress;
  }
  function selectItem(it) { var c = state.sel[it.cat]; state.sel[it.cat] = { id: it.id, size: c && c.id === it.id ? c.size : null }; exclusiveSel(it.cat); }
  function defaultSizes(cat) { return (cat === 'shoe' ? ['250', '260', '270'] : ['S', 'M', 'L']).map(function (l) { return { label: l }; }); }
  /* 새 옷 등록 칸이 비어 있으면 지금 보고 있는 옷 종류 탭을 따라간다(탭은 하의인데 종류가 겉옷으로 저장되던 문제) */
  function formFollow(cat) { var f = ui.cf; if (!f || f.id || f.photo || f.name || f.cat === cat) return; ui.cf = blankForm(cat); }
  /* 2026-11-12 「이미지 표」: 옷 추가·수정 칸의 사이즈표(신발 제외)는 f.table(항목 이름·순서·숫자 그대로)로 다루고, 계산용 sizes 는 저장할 때 표에서 만든다(fit-notes.js tbl*) */
  function mkTable(cat, mt, sizes) { return window.FitNotes && FitNotes.tblFromSizes && cat !== 'shoe' ? FitNotes.tblFromSizes(cat, mt, sizes, FIELDS[cat]) : null; }
  function linkReadOn() { var c = window.TRYON_CFG; return !!(c && c.url && c.anon); }
  function blankForm(cat) { return { id: null, cat: cat, name: '', price: '', url: '', measureType: cat === 'shoe' ? '' : 'flat', sizes: defaultSizes(cat), table: mkTable(cat, 'flat', defaultSizes(cat)), photo: '', big: null, sizeDone: false, sizeMsg: '', photoMsg: '', saved: false, err: '' }; }
  function blankAcc() { return { id: null, type: '모자', name: '', price: '', url: '', photo: '', big: null, saved: false, err: '' }; }
  function posOf(it) { if (String(it.id).indexOf('s_') !== 0 || it.ext) return ''; /* 옷만 뽑은 사진은 상품 사진이라 모델 사진처럼 자르지 않는다 */ return { outer: 'p-top', inner: 'p-top', top: 'p-top', bottom: 'p-low', dress: 'p-mid', shoe: 'p-foot' }[it.cat] || ''; }

  /* ---------- 구독 횟수 ---------- */
  function monthKey() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2); }
  function subNow() {
    var s = state.sub;
    if (!s || typeof s !== 'object') s = state.sub = { plan: 'free', used: 0, month: '' };
    if (!FD.plans[s.plan]) s.plan = 'free';
    if (s.month !== monthKey()) { s.month = monthKey(); s.used = 0; }
    s.used = Number(s.used) || 0;
    return s;
  }
  function planNow() { return FD.plans[subNow().plan]; }
  function unlimited() { return !!(window.TRYON_CFG && window.TRYON_CFG.unlimited); }
  function tryLeft() { return unlimited() ? 999 : Math.max(0, planNow().limit - subNow().used); }

  /* ---------- 코디 자료 ---------- */
  function styleForMe(s) { var g = s.gender || 'female'; return g === 'unisex' || g === (isMale() ? 'male' : 'female'); }
  function curSeason() { var m = new Date().getMonth() + 1; return m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'fall' : 'winter'; }
  function seasonName() { return { spring: '봄', summer: '여름', fall: '가을', winter: '겨울' }[curSeason()]; }
  function stylesIn() {
    var mine = FD.styles.some(styleForMe), season = curSeason();
    return FD.styles.filter(function (s) { return (!mine || styleForMe(s)) && (!s.season || s.season === 'all' || s.season === season); });
  }
  function importStyle(st) {
    delete state.sel.outer;
    ['top', 'bottom', 'dress', 'shoe'].forEach(function (cat) {
      var src = st.items && st.items[cat];
      if (!src) { delete state.sel[cat]; return; }
      var id = 's_' + st.id + '_' + cat;
      if (!item(id)) {
        var rec = JSON.parse(JSON.stringify(src));
        rec.id = id; rec.cat = cat; rec.isRef = false; rec.refSize = '';
        if (!rec.gender) rec.gender = st.gender || 'female';
        if (!rec.photo) rec.photo = st.modelImage || '';
        rec.sizes = (rec.sizes || []).map(function (s) { var r = {}; Object.keys(s).forEach(function (k) { r[k] = String(s[k]); }); return r; });
        state.closet.push(rec);
      }
      var cur = state.sel[cat];
      if (!cur || cur.id !== id) state.sel[cat] = { id: id, size: null };
    });
    state.styleId = st.id; save();
  }

  /* ---------- 조합·입은 모습 ---------- */
  function got(c) { var x = state.sel[c]; return x ? item(x.id) : null; }
  function lookItems(key) { return String(key).split('+').map(item).filter(Boolean); }
  function lookName(key) { return lookItems(key).map(shortName).join(' + '); }
  /* 2026-11-19 사용자 지시: 상품명이 너무 길어 화면에는 짧은 이름. 옷장에서 직접 넣은 짧은 이름(it.short)이 먼저, 없으면 자동(브랜드·광고어·괄호·영문 빼고 끝쪽 옷 종류 단어). 원래 이름(it.name)은 그대로 보관 */
  var SN_DROP = /^(여성|여자|남성|남자|공용|여성용|남성용|가성비|빅사이즈|데일리|따뜻한|기본|베이직|스탠다드|신상|인기|간절기|겨울|여름|봄|가을|사계절|봄가을|하프기장|롱|숏|슬림핏|루즈핏|오버핏|고탄력|사방스판|스판|허리밴딩|허리조절|노수선|면접|복장|세트|무지|단독|특가|국내생산|[0-9A-Z]{5,})$/i;
  var SN_KEY = /(티셔츠|셔츠|블라우스|니트|스웨터|카디건|가디건|맨투맨|후드티|후드|조끼|베스트|자켓|재킷|코트|패딩|점퍼|트렌치|원피스|스커트|치마|청바지|데님|슬랙스|바지|팬츠|레깅스|조거|반바지|쇼츠|터틀넥|폴라|모크넥|민소매|나시|탑|운동화|스니커즈|로퍼|부츠|구두|힐|샌들|슬리퍼|플랫)/;
  function shortName(it) {
    if (!it) return '';
    var own = String(it.short || '').trim(); if (own) return own;
    var EN = { CARDIGAN: '카디건', SKIRT: '스커트', PANTS: '팬츠', JACKET: '재킷', COAT: '코트', SHIRT: '셔츠', BLOUSE: '블라우스', DRESS: '원피스', KNIT: '니트', JEANS: '청바지', TEE: '티셔츠', VEST: '조끼', HOODIE: '후드' };
    var raw = String(it.name || '').replace(/[A-Za-z]+/g, function (m) { return EN[m.toUpperCase()] || m; }).replace(/[(\[［【][^)\]］】]*[)\]］】]/g, ' ').replace(/[^0-9A-Za-z가-힣\s]/g, ' ');
    var w = raw.split(/\s+/).filter(function (x) { return x && !/^[A-Za-z0-9]+$/.test(x) && !SN_DROP.test(x); });
    if (!w.length) return String(it.name || CATS[it.cat] || '').slice(0, 14);
    /* 옷 종류에 맞는 단어를 먼저 찾음(정장 세트처럼 이름에 재킷·바지가 같이 있으면 겉옷은 재킷, 하의는 바지) */
    var CK = { outer: /(자켓|재킷|코트|패딩|점퍼|트렌치|카디건|가디건|조끼|베스트)/, bottom: /(청바지|데님|슬랙스|바지|팬츠|레깅스|조거|반바지|쇼츠|스커트|치마)/, dress: /(원피스|드레스)/ }[it.cat];
    var k = -1, i;
    if (CK) for (i = w.length - 1; i >= 0; i--) if (CK.test(w[i])) { k = i; break; }
    if (k < 0) for (i = w.length - 1; i >= 0; i--) if (SN_KEY.test(w[i])) { k = i; break; }
    var out = k < 0 ? w.slice(-2) : (k > 0 && !SN_KEY.test(w[k - 1]) && w[k - 1].length <= 6 ? [w[k - 1], w[k]] : [w[k]]);
    out = out.join(' '); return out.length > 14 ? out.slice(0, 14) : out;
  }
  function shortLabel(it) { return (CATS[it.cat] || '') + ' · ' + shortName(it); }
  /* 서버가 받을 수 있는 옷: 원피스(+그 위 상의) 또는 상의·하의, 옷 없이 신발만이면 신발 */
  /* 2026-11-13 서버 tryon 에 cat=multi(이너·겉옷 포함 최대 4벌)를 배포한 뒤 tryon-config.js 에 multi: true 를 넣는다. 켜지기 전에는 이너를 입히지 않는다 */
  function multiOn() { return !!(window.TRYON_CFG && window.TRYON_CFG.multi === true); }
  function wearSet() {
    if (multiOn()) {
      var ms = (got('dress') ? [got('dress'), got('top'), got('inner'), got('outer')] : [got('top'), got('inner'), got('bottom'), got('outer')]).filter(Boolean);
      return ms.length ? ms : [got('shoe')].filter(Boolean);
    }
    if (got('dress')) return [got('dress'), got('top')].filter(Boolean);
    var set = [got('top'), got('bottom')].filter(Boolean);
    if (set.length === 2 && got('outer') && outerWearOn()) set.push(got('outer')); /* 2026-11-13 상의+하의 위에 겉옷(재킷·코트): 서버 cat=outfit3 */
    return set.length ? set : [got('shoe')].filter(Boolean);
  }
  function setKey(set) { return set.map(function (x) { return x.id; }).join('+'); }
  function shoeChoices() { return state.closet.filter(function (x) { return x.cat === 'shoe' && x.photo; }); }
  function tryShoeItem() {
    var cur = state.tryShoe || '';
    if (cur.indexOf('closet:') !== 0) return null;
    return shoeChoices().filter(function (x) { return x.id === cur.slice(7); })[0] || null;
  }
  function tryShoeTypeId() { var cur = state.tryShoe || ''; return cur.indexOf('type:') === 0 ? cur.slice(5) : 'pumps'; }
  function wearsBoots() { var w = wearShoe(); if (w && w.id) return /부츠|boot/i.test(w.name || ''); return tryShoeTypeId() === 'boots'; }
  /* 2026-11-16 신발 굽 높이(cm): 옷장 신발에 넣은 굽(mm)이 있으면 그 값, 없으면 신발 종류별 기본값. 바지가 바닥에 끌리는 기준에 쓴다 */
  var SHOE_H = { pumps: 5, sneakers: 2.5, loafers: 2.5, sandals: 1.5, boots: 4 };
  function wearShoeH() {
    var w = wearShoe();
    if (w && w.id) {
      if (E.num(w.heel)) return Math.round(w.heel) / 10;
      return /부츠|boot/i.test(w.name || '') ? 4 : /운동화|스니커|sneaker/i.test(w.name || '') ? 2.5 : /샌들|슬리퍼|sandal/i.test(w.name || '') ? 1.5 : /로퍼|loafer/i.test(w.name || '') ? 2.5 : /구두|힐|펌프|pump|heel/i.test(w.name || '') ? 5 : 3;
    }
    var t = tryShoeTypeId(); return SHOE_H[t] != null ? SHOE_H[t] : 3;
  }
  /* 2026-11-17 입은 그림을 만들 때의 신발 표시(옷장 신발 id 또는 종류). 신발을 바꾸면 옛 그림 위에 안내를 띄우는 데 쓴다 */
  function shoeSig() { var w = wearShoe(); return w && w.id ? 's:' + w.id : 't:' + tryShoeTypeId(); }
  function wearShoe() {
    var it = tryShoeItem(), sel = got('shoe');
    if (!sel && (it || state.tryShoe)) return it;
    return sel && sel.photo ? sel : null;
  }
  function avatarShow() { return charPic() || (isMale() ? 'assets/avatar_male.jpg?v=t' : 'assets/avatar_default.jpg?v=t'); }
  /* 2026-11-11 피팅룸 큰 화면 전용: 기본 여성 캐릭터는 좌우로 배경을 넓힌 사진(경계선 방지). 서버 전송·작은 카드·3D는 원본 사용 */
  function avatarStage() { return charPic() || (isMale() ? 'assets/avatar_male_wide.jpg?v=w' : 'assets/avatar_default_wide.jpg'); }
  /* 2026-11-13 키 비례 머리 위치(사용자 지시): 발끝선은 칸 높이 95%에 고정하고, 머리 꼭대기는 키에 비례(190cm = 3%, 190 넘으면 190 으로 봄).
     사진 파일(Kling 에 보내는 아바타·저장된 입은 모습)은 그대로 두고 피팅룸 화면에서만 같은 비율로 줄여 보여 준다 — 아바타·입은 모습·원본과 비교·옆/뒤/모션 모두 같은 값.
     키가 없거나 사람 위치를 모르는 사진(예전에 올린 내 사진 등)은 줄이지 않는다 */
  var HS = { F: 98, T0: 8, REF: 190 }; /* 2026-11-13 내 키 표시가 보기 탭과 겹쳐 머리 3→8%, 아래 여유로 발끝 95→98% */
  var HSPAN = { /* 그림별 [머리 꼭대기 %, 발끝 %] — 2026-11-13 측정(칸 높이 기준) */
    'avatar_default.jpg': [6.05, 94.53], 'avatar_default_wide.jpg': [6.05, 94.53], 'avatar_default_side_wide.jpg': [6.77, 95.12], 'avatar_default_back_wide.jpg': [5.40, 94.60], 'avatar_default_motion.mp4': [5.53, 95.06],
    'avatar_male.jpg': [6.71, 96.09], 'avatar_male_wide.jpg': [6.71, 96.09], 'avatar_male_side_wide.jpg': [6.97, 96.55], 'avatar_male_back_wide.jpg': [5.27, 95.83],
    f10: [2.94, 98.90], f20: [3.46, 96.76], f30: [3.90, 98.24], f40: [3.46, 96.62], m10: [3.82, 96.40], m20: [5.74, 97.35], m30: [4.04, 97.72], m40: [5.59, 97.43], cool: [6.90, 96.03]
  };
  var mySpan = { seq: -1, v: null, busy: false };
  function charSpan() {
    if (myPic()) {
      var q = state.avSeq || 0;
      if (mySpan.seq !== q && !mySpan.busy) { mySpan.busy = true; personSpan(urls.avatar).then(function (v) { mySpan = { seq: q, v: v, busy: false }; if (v) render(); }); }
      return mySpan.seq === q ? mySpan.v : null;
    }
    var b = baseModel();
    if (who() === 'base' && b.preset) return HSPAN[b.id];
    return HSPAN[isMale() ? 'avatar_male_wide.jpg' : 'avatar_default_wide.jpg'];
  }
  function spanOf(u) { var m = String(u || '').match(/avatar_(?:default|male)[a-z_]*\.(?:jpg|mp4)/); return m && HSPAN[m[0]] ? HSPAN[m[0]] : charSpan(); }
  function hsMap(span, hOver) {
    var hgt = hOver || E.num(prof().height); if (!hgt || !span || !(span[1] > span[0])) return null;
    /* 2026-11-13 사용자 결정(고정 크기): 키와 상관없이 누구나 머리 꼭대기 3%·발끝 95% 로 크게 같은 크기로 보여 준다(새 가입자는 자기 아바타를 새로 만들므로).
       키는 눈금에 「내 키 N cm」로 적고, 옷 기장 선은 그 사람 키 기준 비율로 그린다 */
    var k = Math.min(1.06, (HS.F - HS.T0) / (span[1] - span[0]));
    return { k: k, ty: HS.F - span[1] * k, s0: span[0], s1: span[1] };
  }
  /* 2026-11-13 위치표시: 그림 속 사람(머리 꼭대기~발끝)을 기준으로 한 비율. 기본 여성 사진에서 잰 값(어깨 0.197·가슴 0.305·허벅지 0.587),
     허리=인심+밑위, 엉덩이=인심+밑위×0.39 (몸 치수가 있으면 계산, 기본값에서 ±0.04 넘게 벗어나면 그만큼만) */
  var TAG_FR = { shoulder: 0.197, chest: 0.305, waist: 0.406, hip: 0.497, thigh: 0.587, shoe: 0.97 };
  function tagFr(key, bv) {
    var f = TAG_FR[key];
    if (bv && bv.height && bv.inseam != null && bv.rise != null && (key === 'waist' || key === 'hip')) {
      var c = 1 - (bv.inseam + (key === 'waist' ? 1 : 0.39) * bv.rise) / bv.height;
      if (isFinite(c)) f = Math.max(f - 0.04, Math.min(f + 0.04, c));
    }
    return f;
  }
  function tagY(m, key, bv) { return m ? Math.round(((m.s0 + tagFr(key, bv) * (m.s1 - m.s0)) * m.k + m.ty) * 100) / 100 : TAG_TOP[key]; }
  function hsY(m, p) { return m ? Math.round((p * m.k + m.ty) * 100) / 100 : p; }
  function hsX(m, p) { return m ? Math.round((50 + (p - 50) * m.k) * 100) / 100 : p; }
  function hsAttr(m) { return m ? ' style="--hk:' + m.k.toFixed(4) + ';--hy:' + m.ty.toFixed(3) + '%"' : ''; }
  /* 2026-11-13 키 눈금: 발끝선(95%)과 150~190cm 머리 높이 점선, 내 키는 진한 선. 눈금 위치는 그림과 상관없이 같음(머리 = F-(F-T0)*키/REF) */
  function rulerHtml(hgt, res, tagsR, bodyV) {
    var H = hgt, shH = 0; try { if (wearShoe() || state.tryShoe) shH = wearShoeH() || 0; } catch (e) { shH = 0; } /* 2026-11-16 사용자 지시: 바닥선=신발 뒤꿈치가 닿는 곳, 신발 신은 머리 꼭대기 = 키+굽 */
    var yy = function (c) { return Math.round((HS.F - (HS.F - HS.T0) * Math.max(0, c) / ((H || HS.REF) + shH)) * 100) / 100; }, o = '';
    var lab = function (t) { return '<b class="l">' + t + '</b><b class="r">' + t + '</b>'; };
    if (ui.ruler) {
      /* 2026-11-19 사용자 지시: 발끝(바닥) 표시는 필요 없어 삭제 — 「바닥(뒤꿈치)」「바닥(신발 밑)」 선을 그리지 않음. 신발 굽 높이 선은 정보라 그대로 */
      if (shH) o += '<i class="rl rme" style="top:' + yy(shH) + '%">' + lab('뒤꿈치 끝(키 기준) · 굽 ' + (Math.round(shH * 10) / 10) + 'cm') + '</i>';
      /* 2026-11-13 아바타 본인 치수만: 150~190 기준 눈금은 쓰지 않고 발끝선·내 키만 */
      if (H) o += '<i class="rl rme" style="top:' + yy(H + shH) + '%">' + lab('내 키 ' + Math.round(H) + 'cm' + (shH ? ' (뒤꿈치 끝~머리)' : '')) + '</i>';
    }
    /* 옷 기장 숫자(실선): 상의·원피스 = 어깨선(키×0.835) − 총장 이 밑단 높이, 하의 = 바닥에서 −(옷 인심−다리 인심). 모두 바닥 위 cm */
    if (ui.lenmark && H) {
      var seen = {};
      /* 2026-11-14 사용자 지시: 웃옷은 가장 바깥 옷(겉옷 > 상의 > 이너) 하나만 총장·밑단 선을 보여 준다(앞선 "상의·겉옷 선 안 씀" 결정을 이 범위로 바꿈) */
      var outerR = null; ['outer', 'top', 'inner'].some(function (c) { return (res || []).some(function (r) { if (r.cat === c && r.current) { outerR = r; return true; } return false; }); });
      (res || []).forEach(function (r) {
        if (!r.current || seen[r.cat]) return;
        if (r.cat === 'bottom') return; /* 2026-11-14 사용자 지시: 바지(하의)는 밑단·총장 표시 안 함, 웃옷만 */
        if ((r.cat === 'top' || r.cat === 'outer' || r.cat === 'inner') && r !== outerR) return;
        var pm = {}; r.current.parts.forEach(function (q) { pm[q.key] = q; });
        r.current.parts.forEach(function (q) {
          if (q.key !== 'length' && q.key !== 'inseam') return;
          var hem = q.ratio != null ? q.ratio * H : isFinite(q.diff) ? -q.diff : null; if (hem == null || seen[r.cat]) return; seen[r.cat] = 1;
          var txt = hem < 0 ? '바닥에 끌림 +' + (Math.round(-hem * 10) / 10) + 'cm' : '바닥 위 ' + (Math.round(hem * 10) / 10) + 'cm';
          if (r.cat === 'bottom') txt += hem < 0 ? ' → 수선 ' + (Math.round(-hem * 10) / 10) + 'cm 줄이기' : ' (수선 불필요)'; /* 바지 밑단: 바닥에 끌리면 줄일 길이 */
          var wh = ''; /* 허리~밑단 길이(옷 치수): 바지 = 밑위+인심, 스커트 = 총장 */
          if (r.cat === 'bottom' && bodyV && bodyV.vals) {
            var bv = bodyV.vals, ru = pm.rise && isFinite(pm.rise.diff) && bv.rise != null ? bv.rise + pm.rise.diff : bv.rise, wl = null;
            if (q.key === 'inseam' && ru != null && bv.inseam != null) wl = ru + bv.inseam + pm.inseam.diff;
            else if (q.key === 'length' && ru != null && bv.inseam != null) wl = ru + bv.inseam + q.diff;
            if (wl != null) wh = '총장 ' + (Math.round(wl * 10) / 10) + 'cm · ';
          }
          /* 2026-11-14 총장 숫자: 하의는 위에서 못 구했을 때 고른 사이즈 표의 총장 값, 웃옷은 표의 총장 값(없으면 어깨선 기준 역산) */
          if (!wh) {
            var gr = (r.garment && r.garment.sizes || []).filter(function (x) { return x.label === r.chosen; })[0], gl = gr ? parseFloat(gr.length) : NaN;
            if (!isFinite(gl) && r.cat !== 'bottom' && q.ratio != null) gl = 0.835 * H - q.ratio * H;
            if (isFinite(gl)) wh = '총장 ' + (Math.round(gl * 10) / 10) + 'cm · ';
          }
          var zn = ''; if (r.cat === 'bottom') { var hz = hem * 170 / H; zn = hz <= 0 ? '바닥(끌림)' : hz < 4 ? '발등' : hz < 10 ? '발목(복숭아뼈) 근처' : hz < 25 ? '발목 위~종아리 아래' : hz < 40 ? '종아리' : '무릎 부근'; zn = ' · 위치: ' + zn; }
          /* 2026-11-14 사용자 지시: 파란 밑단 설명은 왼쪽·오른쪽 두 번 길게 나오지 않고 오른쪽에 한 번, 줄을 바꿔서 보여 준다 */
          var rl = [r.cat === 'bottom' ? '하의 밑단 위치' : (CATS[r.cat] || '') + ' 밑단']; if (wh) rl.push(wh.replace(/ · $/, '')); rl.push(txt); if (zn) rl.push(zn.replace(/^ · /, ''));
          /* 2026-11-19 사용자 지시: 총장(밑단) 설명은 오른쪽 핏 표시와 겹쳐서 왼쪽으로 옮김 */
          o += '<i class="rl rlen" style="top:' + yy(hem) + '%"><b class="l">' + rl.join('<br>') + '</b></i>';
        });
      });
    }
    return o || tagsR ? '<div class="ruler">' + o + (tagsR || '') + '</div>' : '';
  }
  /* 눈금·기장 줄이 사진이 아니라 이미지 창 양끝까지 가도록 사진 옆 여백만큼 늘린다 */
  function placeRuler() {
    var rr = app.querySelector('.vwrap .fig>.ruler'), f = rr && rr.parentNode, b = f && f.parentNode;
    if (!rr || !b) return;
    var fb = f.getBoundingClientRect(), bb = b.getBoundingClientRect();
    rr.style.left = -Math.max(0, Math.floor(fb.left - bb.left)) + 'px'; rr.style.right = -Math.max(0, Math.floor(bb.right - b.offsetLeft * 0 - fb.right - (b.offsetWidth - b.clientWidth))) + 'px';
  }
  window.addEventListener('resize', function () { placeRuler(); });
  /* 사진에서 사람 위·아래·가운데 찾기(줄마다 왼쪽·오른쪽 끝 색을 배경으로 보고 다른 곳을 사람으로 봄, facekeep.js 와 같은 방식) */
  function personScan(img) {
    var w = 360, h = Math.round(w * img.naturalHeight / img.naturalWidth), c = document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d', { willReadFrequently: true }); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(img, 0, 0, w, h);
    var d = g.getImageData(0, 0, w, h).data, M = 4, x, y, k, L = [], R = [];
    for (y = 0; y < h; y++) {
      var l = [0, 0, 0], r = [0, 0, 0];
      for (x = 0; x < 3; x++) for (k = 0; k < 3; k++) { l[k] += d[(y * w + x) * 4 + k] / 3; r[k] += d[(y * w + w - 1 - x) * 4 + k] / 3; }
      L.push(l); R.push(r);
    }
    var y0 = -1, y1 = -1, xa = w, xb = -1;
    for (y = M; y < h - M; y++) {
      var n = 0;
      for (x = M; x < w - M; x++) {
        var o = (y * w + x) * 4, t = x / (w - 1), s = 0;
        for (k = 0; k < 3; k++) s += Math.abs(d[o + k] - (L[y][k] * (1 - t) + R[y][k] * t));
        if (s > 54) { n++; if (x < xa) xa = x; if (x > xb) xb = x; }
      }
      if (n >= 2) { if (y0 < 0) y0 = y; y1 = y; }
    }
    if (y0 < 0) return { w: w, h: h, L: L, R: R, ok: false };
    var top = y0 / h, feet = (y1 + 1) / h, cx = (xa + xb) / 2 / w;
    return { w: w, h: h, L: L, R: R, top: top, feet: feet, cx: cx, ok: feet - top >= 0.6 && top > 0.01 && feet < 0.99 && cx > 0.3 && cx < 0.7 };
  }
  /* 화면 칸(542:960)과 비율이 같은 사진만 [위 %, 발끝 %] — 다르면(예전에 올린 사진) null = 줄이지 않음 */
  function personSpan(u) {
    return fetch(u).then(function (r) { return r.blob(); }).then(blobImg).then(function (img) {
      if (Math.abs(img.naturalWidth / img.naturalHeight - 542 / 960) > 0.012) return null;
      var S = personScan(img); return S.ok && S.feet - S.top >= 0.8 ? [S.top * 100, S.feet * 100] : null; /* 전신이 칸을 거의 채운 사진만(상반신 사진을 비율만 맞춘 것 등은 줄이지 않음) */
    }).catch(function () { return null; });
  }
  /* 2026-11-13 A안: 내 아바타를 올릴 때 표준 틀(Kling 결과와 같은 비율 0.5645 = 867×1536, 기본 여성·남성 사진과 같은 크기)에 맞춰 저장 — 머리 꼭대기 6%·발끝 95%·가운데.
     사람을 못 찾으면 비율만 맞춘다. 모자라는 곳은 그 줄의 가장자리 색으로 채우고, 사진 가장자리는 부드럽게 섞는다(사진을 늘리지 않음) */
  function normAvatar(blob) {
    return blobImg(blob).then(function (img) {
      var W = 867, H = 1536, S = personScan(img), iw = img.naturalWidth, ih = img.naturalHeight, sc, dx, dy, y;
      if (S.ok) { sc = (0.95 - 0.06) * H / ((S.feet - S.top) * ih); dy = 0.95 * H - S.feet * ih * sc; dx = 0.5 * W - S.cx * iw * sc; }
      else { sc = Math.min(W / iw, H / ih); dx = (W - iw * sc) / 2; dy = (H - ih * sc) / 2; }
      var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      var g = cv.getContext('2d');
      function rgb(a) { return 'rgb(' + Math.round(a[0]) + ',' + Math.round(a[1]) + ',' + Math.round(a[2]) + ')'; }
      for (y = 0; y < H; y++) {
        var sy = Math.max(0, Math.min(S.h - 1, Math.round((y - dy) / sc / ih * S.h))), gr = g.createLinearGradient(0, 0, W, 0);
        gr.addColorStop(0, rgb(S.L[sy])); gr.addColorStop(1, rgb(S.R[sy])); g.fillStyle = gr; g.fillRect(0, y, W, 1);
      }
      var tw = Math.max(1, Math.round(iw * sc)), th = Math.max(1, Math.round(ih * sc)), t = document.createElement('canvas'); t.width = tw; t.height = th;
      var tc = t.getContext('2d'); tc.imageSmoothingQuality = 'high'; tc.drawImage(img, 0, 0, tw, th);
      tc.globalCompositeOperation = 'destination-in';
      [[tw, 0], [0, th]].forEach(function (v) {
        var f = 0.03, gr = tc.createLinearGradient(0, 0, v[0], v[1]);
        gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(f, 'rgba(0,0,0,1)'); gr.addColorStop(1 - f, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        tc.fillStyle = gr; tc.fillRect(0, 0, tw, th);
      });
      g.drawImage(t, Math.round(dx), Math.round(dy));
      return new Promise(function (ok) { cv.toBlob(function (b) { ok(b || blob); }, 'image/jpeg', 0.92); });
    }).catch(function () { return blob; });
  }
  /* 2026-11-13 A안: 입은 모습의 머리를 원본 아바타 머리 위치·크기에 맞춘다(Kling 결과가 1~5px·0.25~0.5% 어긋나는 것 보정).
     머리 상자(밝기 평균을 뺀 차이)가 가장 잘 맞는 크기(±1.5%, 0.25% 간격)·이동(높이 1920 기준 ±24px)을 찾아 그림 전체를 옮긴다. 나아지지 않으면 blob 없음 */
  /* 2026-11-14 배경색 맞춤: Kling 이 회색 배경 톤을 조금씩 바꿔 그려서 옷을 입히는 순간 배경색이 달라 보이던 것.
     결과 그림 양끝 띠의 줄별 색과 원본 아바타 양끝 띠의 줄별 색 차이(delta)를, 양끝에서 이어진 '배경과 비슷한' 픽셀에만 더한다(사람·옷은 그대로).
     못 하면(배경이 안 이어짐·차이 없음) null → 그림 그대로 */
  function bgMatch(res, av) {
    return Promise.all([blobImg(res), blobImg(av)]).then(function (im) {
      var R = im[0], V = im[1], W = R.naturalWidth, H = R.naturalHeight;
      if (!W || !H || !V.naturalWidth) return null;
      function px(img) { var c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.drawImage(img, 0, 0, W, H); return { c: c, x: x, d: x.getImageData(0, 0, W, H) }; }
      var r = px(R), a = px(V), d = r.d.data, bw = Math.max(2, Math.round(W * 0.012));
      function rows(dd) { /* 줄별 양끝 띠 평균 → 위아래 ±6줄 평활 */
        var o = new Float32Array(H * 3), y, i, k, s, n;
        for (y = 0; y < H; y++) { s = [0, 0, 0]; n = 0; for (i = 0; i < bw; i++) for (k = 0; k < 3; k++) { s[k] += dd[(y * W + i) * 4 + k] + dd[(y * W + W - 1 - i) * 4 + k]; } n = bw * 2; for (k = 0; k < 3; k++) o[y * 3 + k] = s[k] / n; }
        var p = new Float32Array(H * 3), j, m; for (y = 0; y < H; y++) for (k = 0; k < 3; k++) { s = 0; m = 0; for (j = Math.max(0, y - 6); j <= Math.min(H - 1, y + 6); j++) { s += o[j * 3 + k]; m++; } p[y * 3 + k] = s / m; }
        return p;
      }
      var RR = rows(d), AA = rows(a.d.data), dl = new Float32Array(H * 3), big = 0, y, k;
      for (y = 0; y < H; y++) for (k = 0; k < 3; k++) { dl[y * 3 + k] = AA[y * 3 + k] - RR[y * 3 + k]; if (Math.abs(dl[y * 3 + k]) > big) big = Math.abs(dl[y * 3 + k]); }
      if (big < 3) return null; /* 원래부터 거의 같음 */
      var T = 22, T0 = 8, dist = new Uint8Array(W * H), mask = new Uint8Array(W * H), stack = new Int32Array(W * H), sp = 0, i, p;
      for (y = 0; y < H; y++) for (i = 0; i < W; i++) { p = y * W + i; var q = p * 4, e = Math.max(Math.abs(d[q] - RR[y * 3]), Math.abs(d[q + 1] - RR[y * 3 + 1]), Math.abs(d[q + 2] - RR[y * 3 + 2])); dist[p] = e > 255 ? 255 : e; }
      for (y = 0; y < H; y++) { [0, W - 1].forEach(function (x0) { var pp = y * W + x0; if (dist[pp] <= T && !mask[pp]) { mask[pp] = 1; stack[sp++] = pp; } }); }
      while (sp) {
        p = stack[--sp]; var px0 = p % W, py0 = (p - px0) / W, nb = [px0 > 0 ? p - 1 : -1, px0 < W - 1 ? p + 1 : -1, py0 > 0 ? p - W : -1, py0 < H - 1 ? p + W : -1], t;
        for (t = 0; t < 4; t++) { var np = nb[t]; if (np >= 0 && !mask[np] && dist[np] <= T) { mask[np] = 1; stack[sp++] = np; } }
      }
      var cnt = 0; for (p = 0; p < W * H; p++) cnt += mask[p];
      if (cnt < W * H * 0.15) return null; /* 배경이 이어져 잡히지 않음 */
      for (y = 0; y < H; y++) for (i = 0; i < W; i++) {
        p = y * W + i; if (!mask[p]) continue;
        var wt = dist[p] <= T0 ? 1 : 1 - (dist[p] - T0) / (T - T0), q2 = p * 4;
        for (k = 0; k < 3; k++) { var v = d[q2 + k] + dl[y * 3 + k] * wt; d[q2 + k] = v < 0 ? 0 : v > 255 ? 255 : v; }
      }
      r.x.putImageData(r.d, 0, 0);
      return new Promise(function (ok) { r.c.toBlob(function (b) { ok(b ? { blob: b, delta: Math.round(big) } : null); }, /png/i.test(res.type) ? 'image/png' : 'image/jpeg', 0.94); });
    }).catch(function () { return null; });
  }
  /* 2026-11-16 액세서리 배경 유지: AI 가 액세서리를 입히며 배경을 다시 그려 얼룩·흐림이 생기므로, 옷 입은 그림(av)에서 사람(+액세서리가 있을 만한 둘레 30px)을 뺀 나머지는 av 의 배경을 그대로 쓴다.
     사람 둘레 안에서도 결과와 av 가 크게(70↑) 다른 곳(액세서리)만 결과를 쓴다. 사람 윤곽을 못 잡으면 null → 기존 bgMatch */
  function bgKeep(res, av) {
    return Promise.all([blobImg(res), blobImg(av)]).then(function (im) {
      var R = im[0], V = im[1], W = R.naturalWidth, H = R.naturalHeight;
      if (!W || !H || !V.naturalWidth || Math.abs(W / H - V.naturalWidth / V.naturalHeight) > 0.03) return null;
      function px(img) { var c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.drawImage(img, 0, 0, W, H); return { c: c, x: x, d: x.getImageData(0, 0, W, H) }; }
      var r = px(R), a = px(V), d = r.d.data, b = a.d.data, N = W * H, y, i, p, k, bw = Math.max(2, Math.round(W * 0.012));
      var row = new Float32Array(H * 3), s, t, j;
      for (y = 0; y < H; y++) { s = [0, 0, 0]; for (i = 0; i < bw; i++) for (k = 0; k < 3; k++) s[k] += b[(y * W + i) * 4 + k] + b[(y * W + W - 1 - i) * 4 + k]; for (k = 0; k < 3; k++) row[y * 3 + k] = s[k] / (bw * 2); }
      var rs = new Float32Array(H * 3), m; for (y = 0; y < H; y++) for (k = 0; k < 3; k++) { s = 0; m = 0; for (j = Math.max(0, y - 6); j <= Math.min(H - 1, y + 6); j++) { s += row[j * 3 + k]; m++; } rs[y * 3 + k] = s / m; }
      var bg = new Uint8Array(N), st = new Int32Array(N), sp = 0, T = 22;
      function isBg(q) { y = (q / W) | 0; var o = q * 4; return Math.max(Math.abs(b[o] - rs[y * 3]), Math.abs(b[o + 1] - rs[y * 3 + 1]), Math.abs(b[o + 2] - rs[y * 3 + 2])) <= T; }
      for (y = 0; y < H; y++) [0, W - 1].forEach(function (x0) { var pp = y * W + x0; if (!bg[pp] && isBg(pp)) { bg[pp] = 1; st[sp++] = pp; } });
      for (i = 0; i < W; i++) [0, N - W].forEach(function (o0) { var pp = o0 + i; if (!bg[pp] && isBg(pp)) { bg[pp] = 1; st[sp++] = pp; } });
      while (sp) { p = st[--sp]; var x1 = p % W, nb = [x1 > 0 ? p - 1 : -1, x1 < W - 1 ? p + 1 : -1, p >= W ? p - W : -1, p < N - W ? p + W : -1]; for (t = 0; t < 4; t++) { var np = nb[t]; if (np >= 0 && !bg[np] && isBg(np)) { bg[np] = 1; st[sp++] = np; } } }
      var per = new Uint8Array(N), pc = 0; for (p = 0; p < N; p++) { per[p] = bg[p] ? 0 : 1; pc += per[p]; }
      if (pc < N * 0.02 || pc > N * 0.8) return null; /* 사람 윤곽을 못 잡음 */
      function dil(mk, rad) { /* 정사각 팽창(누적합) */
        var tmp = new Int32Array(N), out = new Uint8Array(N), acc, x;
        for (y = 0; y < H; y++) { acc = 0; var rb = y * W; var ps = new Int32Array(W + 1); for (x = 0; x < W; x++) ps[x + 1] = ps[x] + mk[rb + x]; for (x = 0; x < W; x++) tmp[rb + x] = ps[Math.min(W, x + rad + 1)] - ps[Math.max(0, x - rad)]; }
        for (x = 0; x < W; x++) { var ps2 = new Int32Array(H + 1); for (y = 0; y < H; y++) ps2[y + 1] = ps2[y] + (tmp[y * W + x] > 0 ? 1 : 0); for (y = 0; y < H; y++) out[y * W + x] = (ps2[Math.min(H, y + rad + 1)] - ps2[Math.max(0, y - rad)]) > 0 ? 1 : 0; }
        return out;
      }
      var core = dil(per, 4), near = dil(per, 30), strong = new Uint8Array(N);
      for (p = 0; p < N; p++) { if (core[p] || !near[p]) continue; var o = p * 4; if (Math.max(Math.abs(d[o] - b[o]), Math.abs(d[o + 1] - b[o + 1]), Math.abs(d[o + 2] - b[o + 2])) > 70) strong[p] = 1; }
      var strongD = dil(strong, 2), used = 0;
      for (p = 0; p < N; p++) {
        if (core[p] || (near[p] && strongD[p])) { used++; continue; }
        var q = p * 4; d[q] = b[q]; d[q + 1] = b[q + 1]; d[q + 2] = b[q + 2];
      }
      r.x.putImageData(r.d, 0, 0);
      return new Promise(function (ok) { r.c.toBlob(function (bl) { ok(bl ? { blob: bl } : null); }, 'image/jpeg', 0.94); });
    }).catch(function () { return null; });
  }
  function headAlign(res, av) {
    return Promise.all([blobImg(res), blobImg(av)]).then(function (im) {
      var R = im[0], V = im[1], Rw = R.naturalWidth, Rh = R.naturalHeight;
      if (Math.abs(Rw / Rh - V.naturalWidth / V.naturalHeight) > 0.03) return null;
      var S = personScan(V); if (!S.ok) return null;
      var w = 864, h = Math.round(w * Rh / Rw); /* 0.25% 크기 차이를 가릴 수 있게 크게 보고, 결과 쪽은 사이값(bilinear)으로 읽는다 */
      function gray(img) {
        var c = document.createElement('canvas'); c.width = w; c.height = h;
        var x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
        var d = x.getImageData(0, 0, w, h).data, o = new Float32Array(w * h);
        for (var i = 0; i < w * h; i++) o[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
        return o;
      }
      var A = gray(V), B = gray(R), span = (S.feet - S.top) * h, hh = span * 0.13;
      var by0 = Math.max(0, Math.round(S.top * h - hh * 0.08)), by1 = Math.round(S.top * h + hh), bx0 = Math.round(S.cx * w - hh * 0.55), bx1 = Math.round(S.cx * w + hh * 0.55);
      if (bx0 < 0 || bx1 >= w || by1 - by0 < 12) return null;
      var cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2, RNG = Math.max(2, Math.round(24 / 1920 * h));
      function score(s, dx, dy, st) {
        var n = 0, sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, i, j;
        for (j = by0; j <= by1; j += st) for (i = bx0; i <= bx1; i += st) {
          var tx = cx + (i - cx) * s + dx, ty = cy + (j - cy) * s + dy, x0 = Math.floor(tx), y0 = Math.floor(ty), fx = tx - x0, fy = ty - y0;
          if (x0 < 0 || y0 < 0 || x0 + 1 >= w || y0 + 1 >= h) return 1e12;
          var q = y0 * w + x0, va = A[j * w + i], vb = (B[q] * (1 - fx) + B[q + 1] * fx) * (1 - fy) + (B[q + w] * (1 - fx) + B[q + w + 1] * fx) * fy;
          sa += va; sb += vb; saa += va * va; sbb += vb * vb; sab += va * vb; n++;
        }
        return ((saa - sa * sa / n) + (sbb - sb * sb / n) - 2 * (sab - sa * sb / n)) / n;
      }
      var base = score(1, 0, 0, 1), best = { e: 1e12, s: 1, dx: 0, dy: 0 }, s, dx, dy, e, si;
      /* 1) 크기 그대로 위치만 크게 2) 그 둘레에서 크기(0.25% 간격)·위치(0.5px)를 촘촘히 */
      for (dy = -RNG; dy <= RNG; dy += 2) for (dx = -RNG; dx <= RNG; dx += 2) { e = score(1, dx, dy, 3); if (e < best.e) best = { e: e, s: 1, dx: dx, dy: dy }; }
      var c0 = best; best = { e: 1e12 };
      for (si = -6; si <= 6; si++) { s = 1 + si * 0.0025; for (dy = c0.dy - 3; dy <= c0.dy + 3; dy += 0.5) for (dx = c0.dx - 3; dx <= c0.dx + 3; dx += 0.5) { e = score(s, dx, dy, 2); if (e < best.e) best = { e: e, s: s, dx: dx, dy: dy }; } }
      best.e = score(best.s, best.dx, best.dy, 1);
      var info = { s: Math.round(best.s * 10000) / 10000, dx: Math.round(best.dx * Rw / w), dy: Math.round(best.dy * Rh / h), e: Math.round(best.e), base: Math.round(base) };
      if (!(best.e < base * 0.97) || (Math.abs(best.s - 1) < 0.001 && !best.dx && !best.dy)) return { blob: null, info: info };
      /* 아바타 좌표 a → 결과 좌표 r = c + s(a - c) + d. 출력(아바타 틀) 전체가 결과의 어느 네모인지 */
      var kx = Rw / w, ky = Rh / h, sx = (cx - cx * best.s + best.dx) * kx, sy = (cy - cy * best.s + best.dy) * ky;
      var out = document.createElement('canvas'); out.width = Rw; out.height = Rh;
      var ox = out.getContext('2d'); ox.imageSmoothingQuality = 'high'; ox.drawImage(R, 0, 0); ox.drawImage(R, sx, sy, Rw * best.s, Rh * best.s, 0, 0, Rw, Rh);
      return new Promise(function (ok) { out.toBlob(function (b) { ok({ blob: b, info: info }); }, /png/i.test(res.type) ? 'image/png' : 'image/jpeg', 0.94); });
    }).catch(function () { return null; });
  }
  /* 2026-11-12 입은 모습을 만들 때 쓴 캐릭터(내 아바타·기본 남성·기본 여성)를 적어 두고, 지금 캐릭터와 다르면 "지금 입은 모습"으로 보여 주지 않는다.
     (성별을 바꾸면 남성 캐릭터 옆에 여성 캐릭터로 만든 결과가 나오던 문제) 기록은 지우지 않으며 입어본 기록에는 그대로 남는다. 적어 둔 값이 없는 예전 결과는 그대로 보여 준다 */
  function curBase() { return myPic() ? 'avatar:' + (state.avSeq || 0) : charPic() ? 'preset:' + baseModel().id : (isMale() ? 'male' : 'female'); } /* avSeq: 아바타를 올리기·기본 캐릭터 고르기·지우기 할 때마다 1씩 올라가는 번호 */
  /* 2026-11-13 만든 캐릭터 기록이 없는 예전 결과: 내 사진이 저장돼 있는데 기본 모델로 입어보는 중이면 내 아바타로 만든 그림일 수 있어 보여 주지 않는다(기록·기록 목록에는 그대로 남음) */
  function tryonOk(key) { var b = state.aiBase && state.aiBase[key]; return !!urls.tryon[key] && (b ? b === curBase() : !(who() === 'base' && urls.avatar)); }
  /* 2026-11-13 옷 유지: 상의는 그대로 두고 하의만 바꿀 때, 아바타에 두 벌을 처음부터 다시 그리지 않고 「그 상의를 입은 그림」을 바탕으로 보내 하의만 바꾼다
     (처음부터 다시 그리면 같은 상의인데 색·디자인이 조금씩 달라짐. 2026-11-12 실제 시험: 바탕 위에 하의만 바꾸면 상의 유지 3/3).
     바탕이 될 수 있는 그림: 원본 캐릭터에 바로 입힌 것(덧입힌 그림은 안 됨 = 한 단계까지만) · 지금 캐릭터로 만든 것 · 같은 상의를 같은 사이즈·같은 사진으로 입은 것. 원피스가 낀 그림은 안 쓴다 */
  function photoSig(it) {
    var t = String(it.photo || '') + '|' + (it.ext ? it.ext.kind + ':' + (it.ext.color || '') : ''), n = 0, i;
    for (i = 0; i < t.length; i++) n = (n * 31 + t.charCodeAt(i)) | 0;
    return t.length + ':' + n;
  }
  function keepBase(set, key) {
    if (set.length !== 2 || set[0].cat !== 'top' || set[1].cat !== 'bottom') return null;
    var top = set[0], sz = curSize(top), sig = photoSig(top);
    var c = [top.id].concat(Object.keys(state.looks || {})).filter(function (k) {
      if (k === key || k.split('+').indexOf(top.id) < 0 || !tryonOk(k)) return false;
      if (state.aiStack && state.aiStack[k]) return false;
      if (!state.aiBase || state.aiBase[k] !== curBase()) return false;   /* 만든 캐릭터 기록이 없는 예전 그림은 바탕으로 쓰지 않는다(다른 사람 그림 위에 입히는 일 방지) */
      var its = lookItems(k);
      if (its.length !== k.split('+').length || its.some(function (x) { return x.cat !== 'top' && x.cat !== 'bottom'; })) return false;
      var ms = madeSizes(k), sg = state.lookSig && state.lookSig[k];
      if (!ms || !Object.prototype.hasOwnProperty.call(ms, top.id) || ms[top.id] !== sz) return false;
      return !sg || sg[top.id] == null || sg[top.id] === sig;   /* 사진 기록이 없는 예전 그림은 그대로 쓴다 */
    });
    if (!c.length) return null;
    return c.indexOf(top.id) >= 0 ? top.id : (c.indexOf(state.wearLast) >= 0 ? state.wearLast : c[c.length - 1]);
  }
  function baseData(k) {
    return blobGet('tryon:' + k).then(function (b) { if (!b) throw new Error('base'); return Core.shrink(b, 2048, 0.9); }).then(Core.blobToDataUrl).then(Core.klingSafe)
      .then(function (u) { return /^data:image\/jpeg;base64,/.test(u) && u.length < 3900000 ? u : null; }).catch(function () { return null; });
  }
  function wornNow() {
    var set = wearSet(), key = set.length ? setKey(set) : '';
    if (key && tryonOk(key)) return { key: key, url: urls.tryon[key], name: lookName(key) };
    var l = state.wearLast;
    /* 2026-11-18 사용자: 옷을 다 빼면 원래 아바타. 고른 옷이 0벌이면 마지막 입은 그림(wearLast)을 보여 주지 않음 */
    void l;
    return null;
  }
  /* ---------- 2026-11-18 옆·뒷모습 ---------- */
  /* 그 방향으로 입힐 아바타 사진: 내 아바타(앞 사진 있음)는 직접 올린 옆·뒤 사진, 기본 여성·남성은 준비된 사진, 프리셋 기본 모델은 없음 */
  function angSrc(v) {
    if (myPic()) return urls.ang[v] || null;
    if (charPic()) { var pb = baseModel(); return who() === 'base' && pb.ang ? pb.ang[v] || null : null; } /* 2026-11-19 옆·뒤 사진이 있는 기본 모델(멋진남자) */
    return 'assets/avatar_' + (isMale() ? 'male' : 'default') + '_' + v + '.jpg';
  }
  function angBaseNow(v) { var q = state.avAngSeq || {}; return myPic() ? 'avatar:' + (state.avSeq || 0) + ':' + (q[v] || 0) : charPic() ? (who() === 'base' && baseModel().ang ? 'preset:' + baseModel().id : '') : (isMale() ? 'male' : 'female'); }
  function angTryOk(v, key) { return !!(key && urls.angTry[v][key] && state.angBase && state.angBase[v] && state.angBase[v][key] && state.angBase[v][key] === angBaseNow(v)); }
  function angWhy(v) { return myPic() ? '내 아바타 화면에서 ' + ANG_NAME[v] + ' 사진을 올리면 고를 수 있어요.' : '이 기본 모델은 ' + ANG_NAME[v] + ' 사진이 없어 앞모습만 만들 수 있어요.'; }
  function genViews() { var g = state.genViews || { front: true }; return ['front'].concat(ANGS).filter(function (v) { return g[v] && (v === 'front' || angSrc(v)); }); }
  function angWornKey(set) { var w = wornNow(); return w ? w.key : set.length ? setKey(set) : ''; }
  function modelShow() {
    var st = FD.styles.filter(function (s) { return s.id === state.styleId; })[0];
    /* 2026-11-12 코디 예시 사진은 내 성별(또는 공용) 코디일 때만. 남성인데 여성 모델 사진이 「기본 모델」로 나오던 문제 */
    return st && st.modelImage && styleForMe(st) && wearSet().some(function (x) { return String(x.id).indexOf('s_' + st.id + '_') === 0; }) ? st.modelImage : (who() === 'base' && baseModel().preset && charPic()) || (isMale() ? 'assets/avatar_male_wide.jpg?v=w' : 'assets/avatar_default_wide.jpg'); /* 2026-11-14 고른 기본 모델(프리셋)이 있으면 그 사진 */
  }

  /* ---------- 핏 계산 ---------- */
  function evalOne(it, size) {
    try { return E.evaluate({ profile: prof(), items: [{ cat: engCat(it.cat), garment: it, size: size || null, ref: null }] }, cfgNow()).results[0] || null; } catch (e) { return null; }
  }
  function fitResults() {
    var out = [], items = [];
    ['top', 'bottom', 'dress', 'shoe'].forEach(function (cat) {
      var s = state.sel[cat], it = s && item(s.id);
      if (!it) return;
      var ref = null;
      if (cat !== 'shoe') {
        var r = state.closet.filter(function (x) { return x.cat === cat && x.isRef && x.id !== it.id; })[0];
        if (r) ref = { garment: r, row: r.sizes.filter(function (z) { return z.label === r.refSize; })[0] || r.sizes[0] };
      }
      items.push({ cat: cat, garment: it, size: s.size || null, ref: ref });
    });
    var note = '';
    try { var ev = E.evaluate({ profile: prof(), items: items }, cfgNow()); out = ev.results; note = ev.note || ''; } catch (e) { out = []; }
    ['inner', 'outer'].forEach(function (c) { var o = got(c); if (o) { var ro = evalOne(o, state.sel[c].size); if (ro) { ro = Object.assign({}, ro, { cat: c }); out = [ro].concat(out); } } });
    return { results: out, note: note };
  }
  function fitHint(it) {
    try {
      if (!E.num(prof().height) || it.cat === 'shoe') return null;
      var s = state.sel[it.cat], r = evalOne(it, s && s.id === it.id ? s.size : null);
      if (!r || !r.current) return null;
      var ease = {}, len = {};
      r.current.parts.forEach(function (p) {
        if (p.kind === 'circ' && /^(chest|waist|hip|thigh)$/.test(p.key) && isFinite(p.ease)) ease[p.key] = p.ease;
        if (/^(shoulder|sleeve|rise)$/.test(p.key) && isFinite(p.diff)) len[p.key] = p.diff;
        /* 원피스: 밑단이 무릎 바로 아래(0.25~0.30)면 서버가 '종아리 미디'로 읽어 Kling 이 너무 길게 그리므로 '무릎'(0.30)으로 보낸다 */
        if (p.key === 'length' && it.cat !== 'bottom' && isFinite(p.ratio)) len.hem = (it.cat === 'dress' && p.ratio >= 0.25 && p.ratio < 0.30) ? 0.30 : p.ratio;
        if (p.key === 'sleeve' && isFinite(p.pos)) len.sleevePos = p.pos;
        /* 2026-11-13 하의 기장도 키(다리 길이)로 계산해 보낸다(사용자 결정 변경). 인심이 있으면 인심, 없으면 총장(스커트 등). 서버가 배포되기 전에는 서버가 이 값을 쓰지 않음 */
        if (it.cat === 'bottom' && (p.key === 'inseam' || (p.key === 'length' && len.leg == null)) && isFinite(p.diff)) { len.leg = p.diff; if (isFinite(p.pos)) len.legPos = p.pos; }
      });
      /* 2026-11-18 사용자 지시: 바지 길이 선택 줄 삭제, 바지는 기본으로 발등까지. 단 짧은 바지(다리보다 6cm 넘게 짧음 — 2026-11-14 지시로 늘려 그리지 않음)·반바지·치마(총장만 있는 사이즈표)는 계산값 그대로 */
      if (it.cat === 'bottom' && hemFootOk(it, r, len)) len.hemTo = 'foot';
      if (it.cat === 'bottom' && wearsBoots()) len.boots = 1;
      if (it.cat === 'bottom' && E.num(prof().height)) { var shH = wearShoeH(); if (shH != null) len.shoeH = shH; }
      if (!Object.keys(ease).length && !Object.keys(len).length) return null;
      return { size: r.chosen, ease: ease, len: len, fabric: it.fabric || null };
    } catch (e) { return null; }
  }
  function wearSize(it) {
    var s = state.sel[it.cat], picked = s && s.id === it.id ? s.size : null;
    if (picked) return picked + ' 사이즈';
    var f = fitHint(it);
    return f && f.size ? f.size + ' 사이즈 (추천)' : '';
  }
  function wearSizes(set) {
    if (set.length < 2) return set[0] ? wearSize(set[0]) : '';
    return set.map(function (x) { var z = wearSize(x); return z ? CATS[x.cat] + ' ' + z : ''; }).filter(Boolean).join(' · ');
  }

  /* ---------- 입히기 (폰 앱과 같은 서버 요청) ---------- */
  var GEN_KEY = function () { return 'fit-gen-pending:' + (user ? user.id : ''); };
  function avatarData() {
    /* 내 아바타가 없으면 기본 캐릭터 파일을 직접 보낸다(서버가 가져오던 기본 캐릭터 주소가 404 라 입히기가 실패했음) */
    var src = avatarShow(); /* 기본 모델로 입어보는 중이면 내 사진이 저장돼 있어도 보내지 않는다 */
    return fetch(src).then(function (r) { if (!r.ok) throw new Error('avatar'); return r; }).then(function (r) { return r.blob(); }).then(function (b) { return Core.shrink(b, 1280, 0.88); }).then(Core.blobToDataUrl).then(Core.klingSafe).catch(function () { return null; });
  }
  function photoData(it) {
    return blobGet('gphoto:' + it.id).catch(function () { return null; }).then(function (b) {
      if (b) return Core.blobToDataUrl(b);
      var p = String(it.photo || '');
      if (/^data:/i.test(p)) return p;
      return fetch(p).then(function (r) { if (!r.ok) throw new Error('상품 사진을 불러오지 못했습니다.'); return r.blob(); }).then(Core.blobToDataUrl);
    }).then(Core.klingSafe);
  }
  /* 2026-11-10 밤: 스타일 기본 신발은 사진이 모델 전신 사진(assets/styles/look*.jpg)이라, 그대로 보내면 Kling 이 그 모델의 얼굴·머리를 가져온다(실제 시험 R1).
     신발로 같이 보낼 때는 발 부분만 잘라 보낸다(가로 20~80%, 세로 79~100%). 사용자가 직접 넣은 신발 사진은 그대로 보낸다 */
  function isModelShot(it) { return String(it.photo || '').indexOf('assets/styles/') === 0; } /* id 가 s_ 여도 사용자가 사진을 바꿨으면 그 사진은 자르지 않는다 */
  /* 2026-11-11 실제 Kling 시험: 신발 사진(아래 21%)에 바지 밑단이 크게 보이면 상의만 골라도 하의가 그 바지로 바뀐다 → 스타일 사진마다 신발 윗선 바로 위에서 좁게 자른다(모르는 사진은 예전 범위) */
  var FEET_TOP = { 'assets/styles/look1.jpg': 0.89, 'assets/styles/look2.jpg': 0.885, 'assets/styles/look3.jpg': 0.835, 'assets/styles/look4.jpg': 0.855, 'assets/styles/look5.jpg': 0.885 };
  /* 2026-11-11 실제 Kling 시험(K8·K9): 좁게 잘라도 남는 바지 밑단을 배경색으로 칠해 보내면 하의가 원본대로 유지된다(밑단이 보이면 2회 모두 슬랙스로 바뀜).
     값 = 자른 사진 위에서 칠할 높이 비율. 실제 시험한 look1 만 넣는다(look2 데님·look5 파자마 밑단은 시험 전이라 넣지 않음, look3·4 는 맨다리) */
  var FEET_HEM = { 'assets/styles/look1.jpg': 0.10 };
  function hemPaint(c, frac) {
    var rows = Math.round(c.height * frac); if (rows < 1 || c.width < 8) return;
    var g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, rows), p = d.data, w = c.width;
    for (var y = 0; y < rows; y++) {
      var o = y * w * 4, l = o + 3 * 4, r = o + (w - 4) * 4, L = [p[l], p[l + 1], p[l + 2]], R = [p[r], p[r + 1], p[r + 2]];
      for (var x = 0; x < w; x++) { var t = x / (w - 1), i = o + x * 4; p[i] = L[0] + (R[0] - L[0]) * t; p[i + 1] = L[1] + (R[1] - L[1]) * t; p[i + 2] = L[2] + (R[2] - L[2]) * t; }
    }
    g.putImageData(d, 0, 0);
  }
  function feetCrop(u, photo) {
    return new Promise(function (res) {
      var img = new Image();
      img.onload = function () {
        var top = FEET_TOP[String(photo || '')], sx = img.width * (top ? 0.28 : 0.2), sy = img.height * (top || 0.79), sw = img.width * (top ? 0.44 : 0.6), sh = img.height - sy, k = Math.max(1, 640 / sw);
        var c = document.createElement('canvas'); c.width = Math.round(sw * k); c.height = Math.round(sh * k);
        c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
        try { var hem = FEET_HEM[String(photo || '')]; if (hem) hemPaint(c, hem); res(c.toDataURL('image/jpeg', 0.92)); } catch (e) { res(u); }
      };
      img.onerror = function () { res(u); };
      img.src = u;
    });
  }
  function shoeData(it) { return isModelShot(it) ? photoData(it).then(function (u) { return feetCrop(u, it.photo); }).then(Core.klingSafe) : photoData(it); }
  /* 2026-11-11 (권장 순서 3번) 옷 사진에 사람 얼굴이 나오면 Kling 이 그 사람의 얼굴·머리를 따라 그릴 수 있다 → 얼굴(턱) 아래만 잘라 보낸다.
     사람 영역 구분 모델로 얼굴 살(3)의 가장 큰 덩어리를 찾는다. 얼굴이 없거나 작으면, 얼굴이 사진 아래쪽까지 차지하면, 모델을 못 쓰거나 오래 걸리면 사진을 그대로 보낸다 */
  var HEADCUT = { W: 512, face: 0.004, maxChin: 0.5, margin: 0.015, timeout: 12000 };
  function headCut(u) {
    return new Promise(function (res) {
      var end = false, tm = setTimeout(function () { done(u, 'timeout'); }, HEADCUT.timeout);
      function done(v, why) {
        if (end) return; end = true; clearTimeout(tm);
        try { console.debug('[fiton-cut] ' + why); } catch (e) {}
        res(v);
      }
      var img = new Image();
      img.onerror = function () { done(u, 'skip img'); };
      img.onload = function () {
        segLoad().then(function (seg) {
          var W = HEADCUT.W, H = Math.round(W * img.naturalHeight / img.naturalWidth);
          return Promise.resolve(segMask(seg, img, W, H)).then(function (m) {
            var f = new Uint8Array(W * H), i, best = null;
            for (i = 0; i < W * H; i++) if (m[i] === 3) f[i] = 1;
            segParts(f, W, H).forEach(function (c) { if (!best || c.px.length > best.px.length) best = c; });
            if (!best || best.px.length < HEADCUT.face * W * H) { done(u, 'none'); return; }
            var cut = (best.y1 + 1) / H + HEADCUT.margin;
            if (cut > HEADCUT.maxChin) { done(u, 'low ' + cut.toFixed(2)); return; }
            var sy = Math.round(cut * img.naturalHeight), c2 = document.createElement('canvas'); c2.width = img.naturalWidth; c2.height = img.naturalHeight - sy;
            var g = c2.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c2.width, c2.height);
            g.drawImage(img, 0, sy, img.naturalWidth, c2.height, 0, 0, c2.width, c2.height);
            done(c2.toDataURL('image/jpeg', 0.92), 'cut ' + cut.toFixed(3));
          });
        }).catch(function (e) { done(u, 'skip ' + (e && e.message)); });
      };
      img.src = u;
    });
  }
  function garData(it) { return it.cat === 'shoe' || it.ext ? photoData(it) : photoData(it).then(headCut).then(Core.klingSafe); } /* 옷만 뽑은 사진엔 얼굴이 없다 */

  /* ---------- 옷만 뽑기 (2026-11-12 사용자 결정: 뽑을 때 종류+색을 고른다) ----------
     코디 사진에서 그 옷만 흰 배경 상품 사진으로 뽑아 이 옷의 사진으로 바꾼다. 원래 사진은 photo0·gphoto0: 에 보관해 되돌릴 수 있다.
     값은 서버 tryon 의 EX_KINDS·EX_COLORS 목록과 같아야 한다(목록 밖 값은 서버가 거절) */
  var EX_KIND = {
    top: [['coat', '코트'], ['jacket', '재킷'], ['cardigan', '카디건'], ['jumper', '점퍼·집업'], ['shirt', '셔츠'], ['blouse', '블라우스'], ['tee', '티셔츠'], ['knit', '니트'], ['sweatshirt', '맨투맨'], ['sleeveless', '민소매']],
    bottom: [['pants', '바지'], ['jeans', '청바지'], ['shorts', '반바지'], ['skirt', '치마']],
    dress: [['dress', '원피스']]
  };
  EX_KIND.outer = EX_KIND.top; EX_KIND.inner = EX_KIND.top;
  var EX_COLOR = [['black', '검정'], ['white', '흰색'], ['ivory', '아이보리'], ['beige', '베이지'], ['brown', '갈색'], ['gray', '회색'], ['navy', '남색'], ['blue', '파랑'], ['skyblue', '하늘색'], ['green', '초록'], ['khaki', '카키'], ['red', '빨강'], ['pink', '분홍'], ['yellow', '노랑'], ['purple', '보라'], ['orange', '주황']];
  function exName(list, v) { var m = list.filter(function (x) { return x[0] === v; })[0]; return m ? m[1] : ''; }
  function exLabel(ex, cat) { return ex ? ((ex.color ? exName(EX_COLOR, ex.color) + ' ' : '') + exName(EX_KIND[cat] || [], ex.kind)) : ''; }
  function exArea(it) {
    if (!EX_KIND[it.cat] || !it.photo) return '';
    var id = h(it.id);
    if (ui.exBusy === it.id) return '<p class="hint" role="status">옷만 뽑는 중… (1~2분)</p>';
    if (ui.exEdit && ui.exEdit.id === it.id) {
      var ks = EX_KIND[it.cat];
      return '<label>뽑을 옷 종류<select id="exk">' + ks.map(function (k) { return '<option value="' + k[0] + '">' + k[1] + '</option>'; }).join('') + '</select></label>' +
        '<label>색 (선택)<select id="exc"><option value="">고르지 않음</option>' + EX_COLOR.map(function (c) { return '<option value="' + c[0] + '">' + c[1] + '</option>'; }).join('') + '</select></label>' +
        '<div class="lkacts"><button type="button" class="lk" data-act="exGo" data-id="' + id + '">뽑기</button><button type="button" class="lk" data-act="exCancel">취소</button></div>';
    }
    if (it.ext) return '<button type="button" class="lk" data-act="exUndo" data-id="' + id + '" title="뽑은 옷: ' + h(exLabel(it.ext, it.cat)) + '">원래 사진으로</button>';
    return ''; /* 2026-11-14 사용자 결정: 「옷만 뽑기」 시작 버튼 삭제(이미 뽑은 옷의 「원래 사진으로」만 남김) */
  }
  function isAutoName(n) {
    var s = String(n || '').trim(), cats = Object.keys(CATS).map(function (k) { return CATS[k]; }).join('|');
    return new RegExp('^(캡처 )?(' + cats + ') \\d+$').test(s);
  }
  function exRun(id, kind, color) {
    var it = item(id); if (!it) return;
    ui.exBusy = id; ui.exEdit = null; render();
    var fail = function (msg) { ui.exBusy = null; toast(msg, 8000); render(); };
    photoData(it).then(function (g) {
      return Core.genCall({ action: 'extract', device: Core.deviceId(), cat: it.cat === 'inner' ? 'top' : it.cat, garment: g, ekind: kind, ecolor: color });
    }).then(function (res) {
      if (!res.ok || !res.j.taskId) throw new Error((res.j && res.j.error) || '요청을 접수하지 못했습니다.');
      subNow().used++; save(); /* 서버가 접수한 뒤에만 횟수를 뺀다(입어보기와 같음) */
      var t0 = Date.now();
      (function poll() {
        if (Date.now() - t0 > 4 * 60 * 1000) { fail('옷만 뽑는 데 너무 오래 걸려 중단했어요. 나중에 다시 시도해 주세요.'); return; }
        Core.genCall({ action: 'status', taskId: res.j.taskId }).then(function (r) {
          if (!r.ok) throw new Error('retry');
          var j = r.j;
          if (j.status === 'failed') { fail('옷만 뽑지 못했어요.' + (j.error ? ' (사유: ' + String(j.error).slice(0, 200) + ')' : '')); return; }
          if (j.status !== 'success' || !j.image) { setTimeout(poll, 4000); return; }
          var blob = Core.imageBlob(j);
          return Promise.all([Core.shrink(blob, 1280, 0.88), Core.shrink(blob, 240, 0.8).then(Core.blobToDataUrl)]).then(function (a) {
            var cur = item(id); if (!cur) { ui.exBusy = null; render(); return; }
            /* 처음 뽑을 때만 원래 사진을 보관한다(다시 뽑으면 보관본은 그대로) */
            var keep = cur.ext ? Promise.resolve() : blobGet('gphoto:' + id).catch(function () { return null; }).then(function (b) { cur.photo0 = cur.photo; return b ? blobPut('gphoto0:' + id, b) : blobDel('gphoto0:' + id).catch(function () {}); });
            return keep.then(function () { return blobPut('gphoto:' + id, a[0]); }).then(function () {
              /* 자동 이름(「캡처 상의 14」·「상의 3」)이거나 지난번 뽑기로 붙인 이름 그대로면 뽑은 종류·색으로 바꾼다. 직접 지은 이름은 그대로. 되돌리기용으로 원래 이름 보관 */
              var rename = isAutoName(cur.name) || (cur.ext && cur.name0 != null && cur.name === exLabel(cur.ext, cur.cat));
              cur.photo = a[1]; cur.ext = { kind: kind, color: color || '' };
              if (rename) { if (cur.name0 == null) cur.name0 = cur.name; cur.name = exLabel(cur.ext, cur.cat) || cur.name; }
              ui.exBusy = null; save(); toast(rename ? '옷만 뽑았어요. 이름을 "' + cur.name + '"(으)로 바꿨어요.' : '"' + cur.name + '" 사진을 뽑은 옷(' + exLabel(cur.ext, cur.cat) + ')으로 바꿨어요.', 5000); render();
            });
          }).catch(function (e) { fail('뽑은 사진을 저장하지 못했어요. (' + ((e && e.message) || '') + ')'); });
        }).catch(function () { setTimeout(poll, 6000); }); /* 상태 확인이 잠깐 안 되면 다시 묻는다 */
      })();
    }).catch(function (err) { fail((err && err.message) || '요청을 접수하지 못했습니다.'); });
  }
  function ensureNotifyPermission() { if (typeof Notification !== 'undefined' && Notification.permission === 'default') { try { Notification.requestPermission(); } catch (e) {} } }
  function notifyDone(title, body) {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || document.visibilityState === 'visible') return;
    try { var n = new Notification(title, { body: body, icon: 'assets/icons/icon-192.png', tag: 'fiton-tryon' }); n.onclick = function () { try { window.focus(); } catch (e) {} n.close(); }; } catch (e) {}
  }
  /* 2026-11-16 액세서리 착용(2단계): 이미 만든 「옷 입은 그림」 위에 고른 액세서리(최대 4개)만 서버가 더 입힌다(action=accessorize, 새 횟수는 안 씀).
     같은 입은 모습 칸의 그림을 새 그림으로 바꾸고, 옷만 입은 그림은 tryon:<key>@noacc 로 남긴다. 얼굴 되돌리기·옷만 합치기는 안 한다(선글라스·모자까지 지워지므로) */
  var ACC_LIMIT = 4;
  function accOn() { return !!(window.TRYON_CFG && window.TRYON_CFG.acc === true); }
  function accWear() {
    var worn = wornNow(), accs = selAccs();
    if (genPending || !Core.genEnabled()) return;
    if (!accs.length) { toast('입힐 액세서리를 먼저 골라 주세요.'); return; }
    if (!worn) { toast('먼저 옷을 입은 그림을 만들어 주세요. 액세서리는 그 그림 위에 입혀져요.'); return; }
    if (accs.length > ACC_LIMIT) { toast('액세서리는 한 번에 ' + ACC_LIMIT + '개까지 입혀요. 선택을 줄여 주세요.'); return; }
    var noPhoto = accs.filter(function (x) { return !x.photo; })[0];
    if (noPhoto) { toast('"' + noPhoto.name + '"의 사진이 없어요. 액세서리 페이지에서 사진을 넣어 주세요.'); return; }
    if (!confirm('옷을 입은 그림 위에 액세서리 ' + accs.length + '개를 더 입혀요. 선택한 액세서리 사진과 지금 그림이 AI 이미지 생성 서버로 전송됩니다. 지금 그림은 「옷만 입은 그림」으로 따로 보관돼요. 계속할까요?')) return;
    var key = worn.key, useKey = state.aiAcc && state.aiAcc[key] ? key + '@noacc' : key;   /* 이미 액세서리를 입힌 그림이면 「옷만 입은 그림」에서 다시 시작해 고른 것을 한 번에 입힌다(그림 위에 계속 덧입히면 배경이 얼룩지고 색이 흐려짐: 2026-11-16 시험) */
    ensureNotifyPermission();
    ui.genErr = null; genPending = key; render(); waitStart(worn.name + ' + 액세서리 ' + accs.length + '개', '', false, null);
    Promise.all([baseData(useKey), blobGet('tryon:' + useKey)].concat(accs.map(garData))).then(function (a) {
      if (!a[0]) throw new Error('입은 그림을 읽지 못했어요. 다시 만들어 주세요.');
      if (a.slice(2).some(function (x) { return !x; })) throw new Error('액세서리 사진을 읽지 못했어요.');
      var body = { device: Core.deviceId(), action: 'accessorize', gender: isMale() ? 'male' : 'female', image: a[0], items: accs.map(function (x, k) { return { type: x.type, name: String(x.name || '').slice(0, 60), image: a[2 + k] }; }) };
      return Core.genCall(body).then(function (res) {
        if (!res.ok || !res.j.taskId) throw new Error((res.j && res.j.error) || '요청을 접수하지 못했어요.');
        accPoll(key, res.j.taskId, Date.now(), a[1], accs, useKey !== key);
      });
    }).catch(function (err) { genFinish(key, false, (err && err.message) || '액세서리 요청을 접수하지 못했어요.'); });
  }
  function accPoll(key, taskId, t0, baseBlob, accs, hasNoacc) {
    if (!user || genPending !== key) return;
    if (Date.now() - t0 > 6 * 60 * 1000) { genFinish(key, false, '액세서리를 입히는 데 너무 오래 걸려 중단했어요. 나중에 다시 시도해 주세요.'); return; }
    Core.genCall({ action: 'status', taskId: taskId }).then(function (res) {
      if (!res.ok) throw new Error('retry');
      var j = res.j;
      if (j.status === 'success' && j.image) {
        var blob = Core.imageBlob(j), head = accs.some(function (x) { return (ACC_TYPES[x.type] || {}).part === 'head'; });
        /* 아바타 모습 불변: 옷 입은 그림과 몸 비율·위치가 달라졌으면 버린다(머리·얼굴 액세서리는 머리 윤곽이 달라지므로 머리 폭·꼭대기는 보지 않는다) */
        return shapeCheck(blob, baseBlob, null, blob).then(function (why) {
          if (why && !(head && (why === 'head' || why === 'pos'))) { var er = new Error(why); er.changed = true; throw er; }
          return bgKeep(blob, baseBlob).then(function (k2) { if (k2 && k2.blob) return k2.blob; return bgMatch(blob, baseBlob).then(function (m) { return m && m.blob ? m.blob : blob; }, function () { return blob; }); });
        }).then(function (b2) {
          blob = b2;
          return (hasNoacc ? Promise.resolve() : blobPut('tryon:' + key + '@noacc', baseBlob).catch(function () {})).then(function () { return blobPut('tryon:' + key, blob); });
        }).then(function () {
          if (urls.tryon[key]) URL.revokeObjectURL(urls.tryon[key]);
          urls.tryon[key] = URL.createObjectURL(blob);
          state.aiAcc = state.aiAcc || {}; state.aiAcc[key] = accs.map(function (x) { return x.id; });
          state.wearLast = key; save();
          var msg = '액세서리 ' + accs.length + '개를 입은 모습이 완성됐어요!';
          notifyDone('FITON', msg);
          genFinish(key, true, msg);
        });
      }
      if (j.status === 'failed') { var why2 = String(j.error || '').slice(0, 200); genFinish(key, false, '액세서리를 입히지 못했어요.' + (why2 ? ' (사유: ' + why2 + ')' : ' 잠시 뒤 다시 시도해 주세요.')); return; }
      setTimeout(function () { accPoll(key, taskId, t0, baseBlob, accs, hasNoacc); }, 4000);
    }).catch(function (err) {
      if (err && err.changed) { genFinish(key, false, '액세서리를 입힌 그림에서 아바타의 ' + (err.message === 'height' ? '몸 비율이' : '얼굴이나 몸 모양이') + ' 달라져서 보여 주지 않았어요. 옷만 입은 그림은 그대로예요. 다시 시도해 주세요. [이유: ' + err.message + ']', 15000); return; }
      setTimeout(function () { accPoll(key, taskId, t0, baseBlob, accs, hasNoacc); }, 6000);
    });
  }
  /* 2026-11-18 입히기 요청 내용 만들기(앞모습 입히기에 있던 코드를 그대로 떼어 옆·뒷모습에도 씀). a=[첫 옷, 아바타, 신발, 둘째, 셋째…] */
  function genBody(key, set, a, isMulti, it, second, third, shoeIt, fix) {
      if (isMulti) {
        var mb = { device: Core.deviceId(), cat: 'multi', gender: isMale() ? 'male' : 'female', items: [] };
        set.forEach(function (x, k) {
          var o = { role: x.cat, image: k === 0 ? a[0] : a[2 + k], garmentGender: garGender(x) };
          if (x.name) o.name = String(x.name).slice(0, 60);
          var fh2 = fitHint(x); if (fh2) o.fit = fh2;
          if (x.ext) { o.extracted = 1; o.ekind = x.ext.kind; o.ecolor = x.ext.color || ''; }
          mb.items.push(o);
        });
        if (a[2]) { mb.shoe = a[2]; if (shoeIt.name) mb.shoeName = String(shoeIt.name).slice(0, 60); if (E.num(shoeIt.heel)) mb.shoeHeel = Math.round(shoeIt.heel); }
        else mb.shoeType = tryShoeTypeId();
        if (a[1]) mb.avatar = a[1];
        var sty = styleOf(set.map(function (x) { return x.cat; })); if (sty) mb.style = sty; if (fix && sty && sty.outer === 'closed') ui.genFix[key] = sty;
        return mb;
      }
      /* 두 벌: 상의+하의 = outfit, 원피스+그 위 상의 = layered(garment 원피스, garment2 상의) */
      var body = { device: Core.deviceId(), cat: second ? (it.cat === 'dress' ? 'layered' : (third && a[4] ? 'outfit3' : 'outfit')) : (it.cat === 'inner' || it.cat === 'outer' ? 'top' : it.cat), garment: a[0], gender: isMale() ? 'male' : 'female' };
      if (a[2]) { body.shoe = a[2]; if (shoeIt.name) body.shoeName = String(shoeIt.name).slice(0, 60); if (E.num(shoeIt.heel)) body.shoeHeel = Math.round(shoeIt.heel); }
      else if (it.cat !== 'shoe') body.shoeType = tryShoeTypeId();
      if (it.name) body.name = String(it.name).slice(0, 60);
      if (it.cat !== 'shoe') body.garmentGender = garGender(it);
      if (a[1]) body.avatar = a[1];
      if (body.cat === 'outfit' || body.cat === 'outfit3') { var sty2 = styleOf((body.cat === 'outfit3' ? ['outer'] : []).concat(['top', 'bottom'])); if (sty2) { body.style = sty2; if (fix && sty2.outer === 'closed') ui.genFix[key] = sty2; } }
      var fh = fitHint(it); if (fh) body.fit = fh;
      if (it.ext) { body.extracted = 1; body.ekind = it.ext.kind; body.ecolor = it.ext.color || ''; } /* 옷만 뽑은 사진: 서버가 코디 사진 문장 대신 그 옷 이름(종류·색)으로 입힌다 */
      if (second) {
        body.garment2 = a[3]; body.garmentGender2 = garGender(second);
        if (second.ext) { body.extracted2 = 1; body.ekind2 = second.ext.kind; body.ecolor2 = second.ext.color || ''; }
        if (second.name) body.name2 = String(second.name).slice(0, 60);
        var f2 = fitHint(second); if (f2) body.fit2 = f2;
      }
      if (third && a[4]) {
        body.garment3 = a[4];
        if (third.name) body.name3 = String(third.name).slice(0, 60);
        if (third.ext) { body.extracted3 = 1; body.ekind3 = third.ext.kind; body.ecolor3 = third.ext.color || ''; }
      }
      return body;
  }
  function wearAll(opt) {
    var set = wearSet(), frontOnly = !!(opt && opt.frontOnly);
    if (genPending || angBusy || !Core.genEnabled()) return;
    if (!set.length) { toast(got('outer') || got('inner') || state.accSel.length ? NOT_YET + ' 상의·하의·원피스·신발을 함께 골라 주세요.' : '입을 옷을 먼저 골라 주세요.'); return; }
    var noPhoto = set.filter(function (x) { return !x.photo; })[0];
    if (noPhoto) { toast('"' + noPhoto.name + '"의 상품 사진이 없어요. 내 옷장에서 수정해 사진을 넣어 주세요.'); return; }
    var views = frontOnly ? ['front'] : genViews(), angV = views.filter(function (v) { return v !== 'front'; }), doFront = views.indexOf('front') >= 0;   /* 2026-11-18 고른 방향(앞·옆·뒤)마다 1회씩 */
    if (!views.length) { toast('만들 방향(앞모습·옆모습·뒷모습)을 하나 이상 골라 주세요.'); return; }
    if (tryLeft() <= 0) { toast('이번 달 입어보기 횟수를 다 썼어요.'); go('plan'); return; }
    if (tryLeft() < views.length) { toast('남은 횟수(' + tryLeft() + '회)보다 고른 방향(' + views.length + '개)이 많아요. 방향을 줄여 주세요.'); return; }
    var it = set[0], second = set[1] || null, third = set[2] || null, key = setKey(set), first = false;
    try { first = !localStorage.getItem('fit-gen-ok'); } catch (e) { first = true; }
    if (first && !confirm('고른 옷의 상품 사진이 AI 이미지 생성 서버(Supabase·Kling)로 전송되어 입은 모습을 만듭니다. 내 얼굴 사진과 몸 정보는 전송되지 않아요. 만들어진 이미지는 AI가 생성한 것이라 실제 상품과 다를 수 있고, 플랜별 월 횟수와 하루 이용 한도가 있습니다. 계속할까요?')) return;
    if (doFront && urls.tryon[key] && !confirm('이미 만든 입은 모습이 있습니다. 다시 만들면 입어보기 횟수가 한 번 더 쓰입니다. (남은 ' + tryLeft() + '회) 계속할까요?')) return;
    if (myPic()) {
      var avFirst = false;
      try { avFirst = !localStorage.getItem('fit-gen-av-ok'); } catch (e) { avFirst = true; }
      if (avFirst && !confirm('내 아바타 이미지도 옷을 입히는 동안 AI 이미지 생성 서버(Supabase·Kling)로 전송됩니다. 서버에는 저장하지 않고 입히기 요청에만 쓰입니다. 계속할까요?')) return;
      try { localStorage.setItem('fit-gen-av-ok', '1'); } catch (e) {}
    }
    var angDup = angV.filter(function (v) { return angTryOk(v, key); });
    if (angDup.length && !confirm('이미 만든 ' + angDup.map(function (v) { return ANG_NAME[v]; }).join('·') + '이 있습니다. 다시 만들면 방향마다 입어보기 횟수가 한 번씩 더 쓰입니다. 계속할까요?')) return;
    try { localStorage.setItem('fit-gen-ok', '1'); } catch (e) {}
    ensureNotifyPermission();
    if (angV.length) angQueue(key, angV);   /* 옆·뒷모습은 앞모습이 끝난 뒤 하나씩 이어서 만든다(서버 작업은 한 번에 하나) */
    if (!doFront) { ui.genErr = null; toast(angV.map(function (v) { return ANG_NAME[v]; }).join('·') + '을 만들기 시작했어요. 보통 방향마다 1~2분 걸려요.', 5000); angNext(); return; }
    ui.genErr = null; ui.genBase = ui.genBase || {}; ui.genBase[key] = curBase(); ui.genSizes[key] = {}; set.forEach(function (x) { ui.genSizes[key][x.id] = curSize(x); });
    ui.genShoe = ui.genShoe || {}; ui.genShoe[key] = set[0].cat !== 'shoe' ? shoeSig() : null;
    ui.genSig = ui.genSig || {}; ui.genSig[key] = {}; set.forEach(function (x) { ui.genSig[key][x.id] = photoSig(x); });
    ui.genStack = ui.genStack || {}; ui.genStack[key] = null; ui.genFix = ui.genFix || {}; ui.genFix[key] = null;
    var isMulti = multiOn() && set.length >= 2 && set.some(function (x) { return x.cat === 'inner' || x.cat === 'outer'; });   /* 이너·겉옷이 낀 조합은 서버 cat=multi */
    var baseKey = isMulti ? null : keepBase(set, key);
    genPending = key; render(); waitStart(lookName(key), wearSizes(set), false, notesFor(set));
    var shoeIt = it.cat !== 'shoe' ? wearShoe() : null;
    if (!multiOn() && got('inner')) toast('이너는 서버 업데이트 뒤에 입혀져요. 이번에는 이너 없이 만들어요.', 5000);
    if (!multiOn() && got('outer') && set.length !== 3) toast(outerWearOn() ? '겉옷은 상의와 하의를 함께 골랐을 때만 입혀져요. 이번에는 겉옷 없이 만들어요.' : '겉옷은 아직 입은 그림에 들어가지 않아요. 이번에는 겉옷 없이 만들어요.', 5000);
    (baseKey ? baseData(baseKey) : Promise.resolve(null)).then(function (bd) {
      if (isMulti) return Promise.all([garData(set[0]), avatarData(), shoeIt ? shoeData(shoeIt) : null].concat(set.slice(1).map(garData)));   /* a[0]=첫 옷 a[1]=아바타 a[2]=신발 a[3..]=나머지 옷 */
      /* 옷 유지: 바탕 그림을 읽었으면 하의 하나만 보낸다(서버는 cat=bottom 문장 = 지금 상의 그대로). 못 읽으면 예전처럼 두 벌을 한 번에 */
      if (bd) { ui.genStack[key] = baseKey; it = set[1]; second = null; toast('"' + set[0].name + '"은(는) 입은 그대로 두고 하의만 바꿔 입혀요.', 5000); }
      return Promise.all([garData(it), bd || avatarData(), shoeIt ? shoeData(shoeIt) : null, second ? garData(second) : null, third && !bd ? garData(third) : null]);
    }).then(function (a) {
      return Core.genCall(genBody(key, set, a, isMulti, it, second, third, shoeIt, true));
    }).then(function (res) {
      if (!res.ok || !res.j.taskId) throw new Error((res.j && res.j.error) || '요청을 접수하지 못했습니다.');
      subNow().used++; save(); /* 서버가 접수한 뒤에만 횟수를 뺀다 */
      var t0 = Date.now();
      try { localStorage.setItem(GEN_KEY(), JSON.stringify({ id: key, taskId: res.j.taskId, t0: t0, sz: ui.genSizes[key] || null, base: ui.genBase[key] || null, sig: ui.genSig[key] || null, shoe: (ui.genShoe && ui.genShoe[key]) || null, stack: ui.genStack[key] || null, fix: ui.genFix[key] || null })); } catch (e) {}
      segLoad().catch(function () {});   /* 그림을 기다리는 동안 옷만 합치기용 모델을 미리 받아 둔다 */
      genPoll(key, res.j.taskId, t0);
    }).catch(function (err) { var em = (err && err.message) || '요청을 접수하지 못했습니다.'; if ((third || isMulti) && /옷 종류가 올바르지/.test(em)) em = '이너·겉옷까지 함께 입히려면 서버 업데이트가 필요해요. (횟수는 차감되지 않았습니다)'; genFinish(key, false, em); });
  }
  /* 2026-11-11 사용자 원칙: 어떤 경우에도 아바타 모습이 바뀌면 안 된다 → 만든 그림을 원본 아바타와 비교해 달라졌으면 보여 주지 않고 버린다(횟수는 돌려준다).
     사람 윤곽(줄마다 양끝 배경색과 다른 곳)의 머리 꼭대기·발끝·머리 폭·머리 가운데를 그림 크기에 대한 비율로 잰다.
     실제 시험(2026-11-10) 정상 결과: 머리 폭 차이 0~1.3%, 머리 꼭대기 0.3%p 이내, 키 0.4~1.6% / 얼굴이 바뀐 결과: 머리 폭 +24.6%, 머리 꼭대기 2.1%p, 키 +2.9% */
  var SHAPE_LIMIT = { headW: 0.10, top: 0.015, cx: 0.02, height: 0.04 };
  function silOf(blob) {
    return new Promise(function (res) {
      var u = URL.createObjectURL(blob), img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(u);
        try {
          var w = 360, hh = Math.round(w * img.naturalHeight / img.naturalWidth), c = document.createElement('canvas'); c.width = w; c.height = hh;
          var x2 = c.getContext('2d', { willReadFrequently: true }); x2.drawImage(img, 0, 0, w, hh);
          var d = x2.getImageData(0, 0, w, hh).data, rows = [], y, x, k, i;
          for (y = 6; y < hh - 6; y++) {
            var L = [0, 0, 0], R = [0, 0, 0], a = -1, b = -1, n = 0;
            for (k = 0; k < 3; k++) { for (i = 0; i < 4; i++) { L[k] += d[(y * w + i) * 4 + k] / 4; R[k] += d[(y * w + w - 1 - i) * 4 + k] / 4; } }
            for (x = 6; x < w - 6; x++) {
              var t = x / (w - 1), sum = 0, o = (y * w + x) * 4;
              for (k = 0; k < 3; k++) sum += Math.abs(d[o + k] - (L[k] * (1 - t) + R[k] * t));
              if (sum > 54) { if (a < 0) a = x; b = x; n++; }
            }
            if (n >= 3) rows.push([y, a, b]);
          }
          if (!rows.length) { res(null); return; }
          var y0 = rows[0][0], y1 = rows[rows.length - 1][0], H = y1 - y0, xa = w, xb = -1;
          rows.forEach(function (r) { if (r[0] <= y0 + H * 0.13) { if (r[1] < xa) xa = r[1]; if (r[2] > xb) xb = r[2]; } });
          res({ ratio: img.naturalWidth / img.naturalHeight, top: y0 / hh, bottom: y1 / hh, height: H / hh, headW: (xb - xa) / w, cx: (xa + xb) / 2 / w });
        } catch (e) { res(null); }
      };
      img.onerror = function () { URL.revokeObjectURL(u); res(null); };
      img.src = u;
    });
  }
  /* 달라졌으면 이유(글자), 같거나 비교할 수 없으면 ''. raw=서버가 만든 그림, kept=얼굴을 되돌린 뒤 그림 */
  function shapeCheck(raw, av, dbg, kept) {
    if (!av) return Promise.resolve('');
    if (dbg && dbg.info && kept === raw) return Promise.resolve('face');   /* 머리 위치를 쟀는데 원본 얼굴을 되돌리지 못함 = 얼굴·머리 모양이 다름 */
    return Promise.all([silOf(av), silOf(raw)]).then(function (m) {
      var a = m[0], b = m[1];
      if (!a || !b || a.height < 0.6 || a.headW <= 0 || Math.abs(a.ratio - b.ratio) > 0.03) return '';   /* 전신 사진이 아니면 비교할 수 없다 */
      ui.lastShape = { a: a, b: b }; if (dbg) dbg.cmp = 1;
      if (Math.abs(b.headW / a.headW - 1) > SHAPE_LIMIT.headW) return 'head';
      if (Math.abs(b.top - a.top) > SHAPE_LIMIT.top || Math.abs(b.cx - a.cx) > SHAPE_LIMIT.cx) return 'pos';
      if (Math.abs(b.height / a.height - 1) > SHAPE_LIMIT.height) return 'height';
      return '';
    }).catch(function () { return ''; });
  }
  /* 2026-11-11 옷만 합치기: 만든 그림에서 옷·신발만 쓰고, 원본과 결과 둘 다 머리·피부이거나 둘 다 배경인 곳은 원본 아바타 픽셀로 되돌린다.
     사람 영역 구분 모델(MediaPipe selfie_multiclass: 0 배경 1 머리 2 몸 피부 3 얼굴 피부 4 옷 5 기타)을 기기 안에서 돌린다. 그림은 밖으로 나가지 않는다.
     모델 파일(vendor/mp, 약 26MB)은 처음 쓸 때 한 번 받는다. 못 받거나 실패·시간 초과면 합치지 않고 얼굴만 되돌린 그림을 그대로 쓴다. */
  var MERGE = { W: 768, dir: 'vendor/mp', timeout: 40000, minKeep: 0.3, maxKeep: 0.97, cover: 0.85, extra: 0.12, bgDiff: 26 };
  var segP = null;
  function segLoad() {
    if (!segP) segP = import('./' + MERGE.dir + '/vision_bundle.mjs').then(function (m) {
      return m.FilesetResolver.forVisionTasks(MERGE.dir + '/wasm').then(function (fs) {
        return m.ImageSegmenter.createFromOptions(fs, { baseOptions: { modelAssetPath: MERGE.dir + '/selfie_multiclass.tflite', delegate: 'CPU' }, runningMode: 'IMAGE', outputCategoryMask: true, outputConfidenceMasks: false });
      });
    }).catch(function (e) { segP = null; throw e; });
    return segP;
  }
  function blobImg(blob) {
    return new Promise(function (ok, no) {
      var u = URL.createObjectURL(blob), im = new Image();
      im.onload = function () { URL.revokeObjectURL(u); ok(im); };
      im.onerror = function () { URL.revokeObjectURL(u); no(new Error('img')); };
      im.src = u;
    });
  }
  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
  /* 캔버스 하나를 구분해 (dw×dh) 크기 칸에 맞춰 돌려준다 */
  function segRun(seg, cvs, dw, dh) {
    var r = seg.segment(cvs), m = r.categoryMask, a = m.getAsUint8Array(), mw = m.width, mh = m.height, o = new Uint8Array(dw * dh), x, y;
    for (y = 0; y < dh; y++) { var sy = Math.min(mh - 1, Math.floor(y * mh / dh)) * mw; for (x = 0; x < dw; x++) o[y * dw + x] = a[sy + Math.min(mw - 1, Math.floor(x * mw / dw))]; }
    m.close(); if (r.close) r.close();
    return o;
  }
  /* 그림을 W×H로 맞춰 구분. 세로로 긴 그림은 정사각형 조각으로 나눠 구분하고(손·발이 더 잘 보임), 전체 구분에 없는 덩어리(빈 배경의 헛것)는 지운다 */
  function segMask(seg, img, W, H) {
    var c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(img, 0, 0, W, H);
    var whole = segRun(seg, c, W, H);
    if (H <= W) return Promise.resolve(whole);
    var n = Math.ceil((H - W) / (W * 0.5)) + 1, best = new Float32Array(W * H).fill(-1), out = new Uint8Array(W * H), i = 0;
    function step() {
      if (i >= n) { segGhost(out, whole, W, H); return out; }
      var y0 = Math.round((H - W) * i / (n - 1)), t = document.createElement('canvas'), x, y; t.width = W; t.height = W;
      t.getContext('2d').drawImage(c, 0, y0, W, W, 0, 0, W, W);
      var a = segRun(seg, t, W, W);
      for (y = 0; y < W; y++) {
        var wgt = Math.min(y, W - 1 - y) + (i === 0 && y < W / 2 ? W : 0) + (i === n - 1 && y > W / 2 ? W : 0);
        for (x = 0; x < W; x++) { var k = (y0 + y) * W + x; if (wgt > best[k]) { best[k] = wgt; out[k] = a[y * W + x]; } }
      }
      i++; return tick().then(step);
    }
    return tick().then(step);
  }
  /* 사람으로 잡힌 덩어리 가운데 전체 구분의 사람 영역과 겹치는 부분이 20%도 안 되는 것은 배경으로 돌린다 */
  function segGhost(m, whole, W, H) {
    var lab = new Int32Array(W * H), st = new Int32Array(W * H), id = 0, p, q, sp, k, area, hit, x;
    for (p = 0; p < W * H; p++) {
      if (!m[p] || lab[p]) continue;
      id++; sp = 0; st[sp++] = p; lab[p] = id; area = 0; hit = 0; var list = [];
      while (sp) {
        q = st[--sp]; list.push(q); area++; if (whole[q]) hit++; x = q % W;
        if (x > 0 && m[q - 1] && !lab[q - 1]) { lab[q - 1] = id; st[sp++] = q - 1; }
        if (x < W - 1 && m[q + 1] && !lab[q + 1]) { lab[q + 1] = id; st[sp++] = q + 1; }
        if (q >= W && m[q - W] && !lab[q - W]) { lab[q - W] = id; st[sp++] = q - W; }
        if (q < W * (H - 1) && m[q + W] && !lab[q + W]) { lab[q + W] = id; st[sp++] = q + W; }
      }
      if (hit < area * 0.2) for (k = 0; k < list.length; k++) m[list[k]] = 0;
    }
  }
  function segPix(img, W, H) {
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, W, H);
    return x.getImageData(0, 0, W, H).data;
  }
  /* 0이 아닌 칸의 덩어리 목록(칸 번호들과 둘러싼 네모) */
  function segParts(m, W, H) {
    var lab = new Uint8Array(W * H), st = new Int32Array(W * H), out = [], p, q, sp, x, y;
    for (p = 0; p < W * H; p++) {
      if (!m[p] || lab[p]) continue;
      sp = 0; st[sp++] = p; lab[p] = 1; var c = { px: [], x0: W, x1: 0, y0: H, y1: 0 };
      while (sp) {
        q = st[--sp]; c.px.push(q); x = q % W; y = (q - x) / W;
        if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y;
        if (x > 0 && m[q - 1] && !lab[q - 1]) { lab[q - 1] = 1; st[sp++] = q - 1; }
        if (x < W - 1 && m[q + 1] && !lab[q + 1]) { lab[q + 1] = 1; st[sp++] = q + 1; }
        if (q >= W && m[q - W] && !lab[q - W]) { lab[q - W] = 1; st[sp++] = q - W; }
        if (q < W * (H - 1) && m[q + W] && !lab[q + W]) { lab[q + W] = 1; st[sp++] = q + W; }
      }
      out.push(c);
    }
    return out;
  }
  /* 0/1 칸을 r칸만큼 넓히거나(grow) 줄인다. 정사각형 (2r+1) 기준, 가장자리는 끝 값을 이어 씀 */
  function morph(m, W, H, r, grow) {
    var t = new Uint8Array(W * H), o = new Uint8Array(W * H), x, y, d, v, g = grow ? 1 : 0;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) { v = 1 - g; for (d = -r; d <= r; d++) if (m[y * W + Math.min(W - 1, Math.max(0, x + d))] === g) { v = g; break; } t[y * W + x] = v; }
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) { v = 1 - g; for (d = -r; d <= r; d++) if (t[Math.min(H - 1, Math.max(0, y + d)) * W + x] === g) { v = g; break; } o[y * W + x] = v; }
    return o;
  }
  function softEdge(m, W, H, sigma) {
    var R = Math.ceil(sigma * 3), ker = [], s = 0, i, x, y, d, v, a = new Float32Array(W * H), b = new Float32Array(W * H);
    for (i = -R; i <= R; i++) { v = Math.exp(-i * i / (2 * sigma * sigma)); ker.push(v); s += v; }
    for (i = 0; i < ker.length; i++) ker[i] /= s;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) { v = 0; for (d = -R; d <= R; d++) v += ker[d + R] * m[y * W + Math.min(W - 1, Math.max(0, x + d))]; a[y * W + x] = v; }
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) { v = 0; for (d = -R; d <= R; d++) v += ker[d + R] * a[Math.min(H - 1, Math.max(0, y + d)) * W + x]; b[y * W + x] = v; }
    return b;
  }
  /* raw=만든 그림(얼굴을 되돌린 것), av=그때 보낸 아바타. 합친 그림(Blob)을 돌려주고, 합칠 수 없으면 실패(reject) */
  function clothMergeRun(raw, av) {
    var t0 = Date.now(), seg, R, V, W = MERGE.W, H, ma;
    return segLoad().then(function (s) { seg = s; return Promise.all([blobImg(raw), blobImg(av)]); }).then(function (im) {
      R = im[0]; V = im[1]; H = Math.round(W * R.naturalHeight / R.naturalWidth);
      return segMask(seg, V, W, H);
    }).then(function (m) { ma = m; return tick().then(function () { return segMask(seg, R, W, H); }); }).then(function (mr) {
      var N = W * H, sk = new Uint8Array(N), bg = new Uint8Array(N), gar = new Uint8Array(N), skR = new Uint8Array(N), i, n = 0, ng = 0, parts = [];
      /* 배경은 모델이 둘 다 배경이라 해도 두 그림의 색이 비슷한 칸만 되돌린다(모델이 옷자락·그림자를 배경으로 잘못 보면 원본 배경이 옷을 지운다) */
      var pa = segPix(V, W, H), pr = segPix(R, W, H), o;
      for (i = 0; i < N; i++) {
        var a = ma[i], b = mr[i];
        if (b >= 1 && b <= 3) skR[i] = 1;
        o = i * 4;
        if (a === 0 && b === 0 && Math.abs(pa[o] - pr[o]) < MERGE.bgDiff && Math.abs(pa[o + 1] - pr[o + 1]) < MERGE.bgDiff && Math.abs(pa[o + 2] - pr[o + 2]) < MERGE.bgDiff) bg[i] = 1;
        if (b >= 4) { gar[i] = 1; ng++; }
      }
      /* 머리·손·다리 같은 살 덩어리마다 원본과 자리가 맞는지 본다. 맞는 덩어리만 원본으로 되돌린다(자리가 다르면 두 그림이 겹쳐 보인다).
         cover = 덩어리 가운데 원본도 살인 비율, extra = 덩어리 바로 옆에서 원본은 살인데 결과는 배경인 넓이(덩어리 넓이 대비) */
      segParts(skR, W, H).forEach(function (c) {
        var px = c.px, L = px.length, k, cov = 0, ex = 0, d = 6, x, y, p;
        if (L < 40) return;
        for (k = 0; k < L; k++) { p = ma[px[k]]; if (p >= 1 && p <= 3) cov++; }
        var x0 = Math.max(0, c.x0 - d), x1 = Math.min(W - 1, c.x1 + d), y0 = Math.max(0, c.y0 - d), y1 = Math.min(H - 1, c.y1 + d), bw = x1 - x0 + 1, bh = y1 - y0 + 1, loc = new Uint8Array(bw * bh);
        for (k = 0; k < L; k++) loc[(Math.floor(px[k] / W) - y0) * bw + (px[k] % W - x0)] = 1;
        loc = morph(loc, bw, bh, d, true);
        for (y = 0; y < bh; y++) for (x = 0; x < bw; x++) { p = (y + y0) * W + x + x0; if (loc[y * bw + x] && mr[p] === 0 && ma[p] >= 1 && ma[p] <= 3) ex++; }
        var ok = cov / L >= MERGE.cover && ex / L <= MERGE.extra;
        parts.push([L, Math.round(cov / L * 100), Math.round(ex / L * 100), ok ? 1 : 0]);
        if (ok) for (k = 0; k < L; k++) { p = ma[px[k]]; if (p >= 1 && p <= 3) sk[px[k]] = 1; }
      });
      /* 살은 옷 가장자리에서 조금 물러나 좁게 섞고, 배경은 사람에게서 멀찍이 떨어진 곳부터 넓게 섞는다(신발 그림자 둘레에 띠가 생기지 않게) */
      sk = morph(sk, W, H, 2, false); gar = morph(gar, W, H, 2, true); bg = morph(bg, W, H, 8, false);
      for (i = 0; i < N; i++) { if (gar[i]) sk[i] = 0; n += sk[i] | bg[i]; }
      var ratio = n / N;
      if (!ng || ratio < MERGE.minKeep || ratio > MERGE.maxKeep) throw new Error('merge-range ' + ratio.toFixed(3));
      var al = softEdge(sk, W, H, 2), al2 = softEdge(bg, W, H, 5);
      for (i = 0; i < N; i++) if (al2[i] > al[i]) al[i] = al2[i];
      var mc = document.createElement('canvas'); mc.width = W; mc.height = H;
      var mx = mc.getContext('2d'), id = mx.createImageData(W, H), d = id.data;
      for (i = 0; i < N; i++) { d[i * 4 + 3] = Math.round(al[i] * 255); }
      mx.putImageData(id, 0, 0);
      var ow = R.naturalWidth, oh = R.naturalHeight, out = document.createElement('canvas'), tc = document.createElement('canvas'); out.width = tc.width = ow; out.height = tc.height = oh;
      var ox = out.getContext('2d'), tx = tc.getContext('2d');
      tx.imageSmoothingQuality = 'high'; tx.drawImage(V, 0, 0, ow, oh);
      tx.globalCompositeOperation = 'destination-in'; tx.drawImage(mc, 0, 0, ow, oh);
      ox.drawImage(R, 0, 0); ox.drawImage(tc, 0, 0);
      return new Promise(function (done, no) {
        out.toBlob(function (b) {
          if (!b) { no(new Error('merge-blob')); return; }
          ui.lastMerge = { keep: Math.round(ratio * 1000) / 10, ms: Date.now() - t0, parts: parts };
          try { console.debug('[fiton-merge] ' + JSON.stringify(ui.lastMerge)); } catch (e) {}
          done(b);
        }, /png/i.test(raw.type) ? 'image/png' : 'image/jpeg', 0.94);
      });
    });
  }
  /* 2026-11-17 레이어 분리(fit-layer.js): 성공하면 합성한 그림(Blob), 못 하면 null */
  function layerSwap(raw, av) {
    if (!window.FitLayer) return Promise.resolve(null);
    var t0 = Date.now(), seg, R, V, W = MERGE.W, H, ma;
    var run = segLoad().then(function (s) { seg = s; return Promise.all([blobImg(raw), blobImg(av)]); }).then(function (im) {
      R = im[0]; V = im[1]; H = Math.round(W * R.naturalHeight / R.naturalWidth);
      return segMask(seg, V, W, H);
    }).then(function (m) { ma = m; return tick().then(function () { return segMask(seg, R, W, H); }); }).then(function (mr) {
      var res = FitLayer.core(R, V, mr, ma, W, H);
      if (!res || res.fail) { try { console.debug('[fiton-layer] skip ' + (res && res.fail)); } catch (e) {} return null; }
      var c = document.createElement('canvas'); c.width = res.W; c.height = res.H; c.getContext('2d').putImageData(res.out, 0, 0);
      return new Promise(function (ok) { c.toBlob(function (b) { try { console.debug('[fiton-layer] ok keep ' + res.keep.toFixed(3) + ' ' + (Date.now() - t0) + 'ms'); } catch (e) {} ok(b || null); }, /png/i.test(raw.type) ? 'image/png' : 'image/jpeg', 0.94); });
    });
    return new Promise(function (res) { var end = false, tm = setTimeout(function () { if (!end) { end = true; res(null); } }, MERGE.timeout); run.then(function (b) { if (!end) { end = true; clearTimeout(tm); res(b); } }, function () { if (!end) { end = true; clearTimeout(tm); res(null); } }); });
  }
  /* 합치기에 실패하거나 너무 오래 걸리면 null */
  function clothMerge(raw, av) {
    return new Promise(function (res) {
      var end = false, tm = setTimeout(function () { if (!end) { end = true; res(null); } }, MERGE.timeout);
      clothMergeRun(raw, av).then(function (b) { if (!end) { end = true; clearTimeout(tm); res(b); } }, function (e) {
        try { console.debug('[fiton-merge] skip ' + (e && e.message)); } catch (e2) {}
        if (!end) { end = true; clearTimeout(tm); res(null); }
      });
    });
  }
  function genPoll(id, taskId, t0) {
    if (!user || genPending !== id) return;
    if (Date.now() - t0 > 6 * 60 * 1000) { genFinish(id, false, '입은 모습을 만드는 데 너무 오래 걸려 중단했어요. 나중에 다시 시도해 주세요.'); return; }
    Core.genCall({ action: 'status', taskId: taskId }).then(function (res) {
      if (!res.ok) throw new Error('retry');
      var j = res.j;
      if (j.status === 'success' && j.image && ui.genFix && ui.genFix[id]) {
        /* 2026-11-13 겉옷 잠그기: 문장만으로는 상품 사진의 열린 모양을 따라가서, 완성된 그림 한 장에 2차 수정(앞 닫기)을 한 번 더 한다. 못 하면 1차 그림 그대로 쓴다 */
        var fx = ui.genFix[id]; ui.genFix[id] = null;
        return Core.genCall({ action: 'restyle', device: Core.deviceId(), image: j.image, style: fx }).then(function (r2) {
          if (!r2.ok || !r2.j.taskId) throw new Error('skip');
          try { var sv = JSON.parse(localStorage.getItem(GEN_KEY()) || 'null'); if (sv && sv.id === id) { sv.taskId = r2.j.taskId; sv.fix = null; localStorage.setItem(GEN_KEY(), JSON.stringify(sv)); } } catch (e) {}
          genPoll(id, r2.j.taskId, t0);
        }).catch(function () { toast('겉옷 앞 닫기(2차 수정)를 하지 못했어요. 닫기 전 그림을 보여 드려요.', 7000); genPoll(id, taskId, t0); });
      }
      if (j.status === 'success' && j.image) {
        var blob = Core.imageBlob(j), dbg = {}, raw = blob, avBlob = null;
        /* AI가 매번 다시 그리는 얼굴을 원본 아바타 얼굴로 되돌린다(실패하면 원래 결과 그대로) */
        var keep = window.FaceKeep ? fetch(avatarShow()).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (av) { avBlob = av; return FaceKeep.apply(blob, av, { debug: dbg }); }).catch(function () { return blob; }) : Promise.resolve(blob);
        return keep.then(function (b2) {
          return shapeCheck(raw, avBlob, dbg, b2).then(function (why) { if (why) { var er = new Error(why); er.changed = true; throw er; } return b2; });
        }).then(function (b2) {
          /* 2026-11-13 A안: 머리 위치·크기를 원본 아바타에 맞춘다(옷만 바뀌는 느낌). 못 맞추면 그대로 */
          if (!avBlob) return b2;
          return headAlign(b2, avBlob).then(function (a) { ui.lastAlign = a && a.info; try { console.debug('[fiton-align] ' + JSON.stringify(ui.lastAlign)); } catch (e) {} return a && a.blob ? a.blob : b2; }, function () { return b2; });
        }).then(function (b2) {
          /* 원본과 비교할 수 있었던(전신·같은 비율) 그림만 옷만 합치기를 한다. 안 되면 얼굴만 되돌린 그림 그대로 */
          if (!dbg.cmp || !avBlob) return b2;
          return clothMerge(b2, avBlob).then(function (m) { return m || b2; });
        }).then(function (b2) {
          /* 2026-11-14 배경색 맞춤(원본 아바타 배경색으로). 못 하면 그대로 */
          if (!avBlob) return b2;
          /* 2026-11-17 배경·캐릭터 레이어 분리: 사람만 오려 아바타 원본 배경 위에 다시 얹는다(얼룩·배경색 변화 제거). 못 하면 예전 배경색 맞춤 */
          return layerSwap(b2, avBlob).then(function (l) { if (l) return l; return bgMatch(b2, avBlob).then(function (m) { try { if (m) console.debug('[fiton-bg] delta ' + m.delta); } catch (e) {} return m && m.blob ? m.blob : b2; }); }, function () { return bgMatch(b2, avBlob).then(function (m) { return m && m.blob ? m.blob : b2; }); });
        }).then(function (b2) { blob = b2; return blobPut('tryon:' + id, blob).catch(function () { toast('결과를 이 기기에 저장하지 못했어요. 「결과 저장」으로 내려받아 주세요.', 8000); }); }).then(function () {
          if (urls.tryon[id]) URL.revokeObjectURL(urls.tryon[id]);
          urls.tryon[id] = URL.createObjectURL(blob);
          state.aiGen = state.aiGen || {}; state.aiGen[id] = true;
          state.aiBase = state.aiBase || {}; state.aiBase[id] = (ui.genBase && ui.genBase[id]) || curBase();
          if (state.aiHem) delete state.aiHem[id];
          if (state.aiAcc) delete state.aiAcc[id];   /* 새로 옷을 입혔으니 액세서리를 입힌 그림 기록은 지운다 */
          if (state.aiOver) delete state.aiOver[id];
          /* 옷 유지: 덧입힌 그림인지(바탕 그림 이름)와 만들 때의 옷 사진 표시를 적어 둔다. 덧입힌 그림은 다음 바탕으로 쓰지 않는다 */
          state.aiStack = state.aiStack || {}; if (ui.genStack && ui.genStack[id]) state.aiStack[id] = ui.genStack[id]; else delete state.aiStack[id];
          state.lookShoe = state.lookShoe || {}; if (ui.genShoe && ui.genShoe[id]) state.lookShoe[id] = ui.genShoe[id]; else delete state.lookShoe[id];
          state.lookSig = state.lookSig || {}; if (ui.genSig && ui.genSig[id]) state.lookSig[id] = ui.genSig[id]; else delete state.lookSig[id];
          if (id.indexOf('+') > 0) { state.looks = state.looks || {}; state.looks[id] = 1; }
          state.lookSize = state.lookSize || {}; if (ui.genSizes[id]) state.lookSize[id] = ui.genSizes[id]; else delete state.lookSize[id];
          state.wearLast = id; save();
          var msg = (lookName(id) || '옷') + ' 입은 모습이 완성됐어요!';
          notifyDone('FITON', msg);
          genFinish(id, true, msg);
        });
      }
      if (j.status === 'failed') {
        var why = String(j.error || '').slice(0, 200);
        genFinish(id, false, '입은 모습을 만들지 못했어요.' + (why ? ' (사유: ' + why + ')' : ' 잠시 뒤 다시 시도해 주세요.'), why ? 15000 : 0);
        return;
      }
      setTimeout(function () { genPoll(id, taskId, t0); }, 4000);
    }).catch(function (err) {
      if (err && err.changed) {
        /* 아바타 모습이 달라진 그림은 저장하지도 보여 주지도 않는다. 사용자 잘못이 아니므로 횟수를 돌려준다 */
        var sb = subNow(); if (sb.used > 0) sb.used--; save();
        ui.lastReject = err.message;
        try { console.debug('[fiton-reject] ' + err.message + ' ' + JSON.stringify(ui.lastShape || null)); } catch (e3) {}
        genFinish(id, false, '만든 그림에서 아바타의 ' + (err.message === 'height' ? '몸 비율이' : '얼굴이나 머리 모양이') + ' 원본과 달라져서 보여 주지 않았어요. 횟수는 돌려 드렸어요. 다시 시도해 주세요. (상품 사진에 사람이 크게 나오면 이런 일이 생길 수 있어요) [이유: ' + err.message + ']', 15000);
        return;
      }
      setTimeout(function () { genPoll(id, taskId, t0); }, 6000);
    });
  }
  /* ---------- 2026-11-18 옆·뒷모습 입히기 (앞모습과 같은 서버 요청, 아바타만 그 방향 사진) ----------
     대기열은 localStorage 에 두어 새로 고침해도 이어 간다. 얼굴 되돌리기·머리 맞추기·옷만 합치기는 앞모습 기준이라 쓰지 않고,
     몸 윤곽 비교(shapeCheck)로 아바타가 달라졌으면 버리고 횟수를 돌려준다. 배경은 그 방향 아바타 배경에 맞춘다 */
  function angKey() { return 'fit-gen-ang:' + (user ? user.id : ''); }
  function angLoad() { try { var o = JSON.parse(localStorage.getItem(angKey()) || 'null'); if (o && o.q) return o; } catch (e) {} return { q: [], cur: null }; }
  function angSave(o) { try { if (!o.q.length && !o.cur) localStorage.removeItem(angKey()); else localStorage.setItem(angKey(), JSON.stringify(o)); } catch (e) {} }
  var ANG_TTL = 15 * 60 * 1000;   /* 넣은 지 15분이 지난 대기열 항목은 만들지 않고 버린다 */
  function angQueue(key, vs) { var o = angLoad(), t = Date.now(); vs.forEach(function (v) { o.q.push({ key: key, view: v, base: angBaseNow(v), t: t }); }); angSave(o); }
  function angAvBlob(v) { var src = angSrc(v); if (!src) return Promise.resolve(null); return fetch(src).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).catch(function () { return null; }); }
  function angNext() {
    if (!user || genPending || angBusy || !Core.genEnabled()) return;
    var o = angLoad(), now = Date.now();
    o.q = o.q.filter(function (x) { return x && x.t && now - x.t < ANG_TTL; });
    var job = o.q.shift();
    if (!job) { angSave(o); return; }
    var set = lookItems(job.key);
    if (!set.length || !angSrc(job.view) || angBaseNow(job.view) !== job.base) { angSave(o); toast(ANG_NAME[job.view] + '은(는) 그사이 아바타나 옷이 바뀌어 만들지 않았어요.', 6000); angNext(); return; }
    if (tryLeft() <= 0) { o.q = []; angSave(o); toast('입어보기 횟수를 다 써서 ' + ANG_NAME[job.view] + '은(는) 만들지 않았어요.', 6000); render(); return; }
    job.uid = user.id; angBusy = job; angSave(o); render();
    var it = set[0], second = set[1] || null, third = set[2] || null, avB = null;
    var isMulti = multiOn() && set.length >= 2 && set.some(function (x) { return x.cat === 'inner' || x.cat === 'outer'; });
    var shoeIt = it.cat !== 'shoe' ? wearShoe() : null;
    angAvBlob(job.view).then(function (b) {
      if (!b) throw new Error(ANG_NAME[job.view] + ' 아바타 사진을 읽지 못했어요.');
      avB = b; return Core.shrink(b, 1280, 0.88).then(Core.blobToDataUrl).then(Core.klingSafe);
    }).then(function (avd) {
      if (!avd) throw new Error(ANG_NAME[job.view] + ' 아바타 사진을 보낼 수 없어요.');
      return Promise.all(isMulti ? [garData(set[0]), avd, shoeIt ? shoeData(shoeIt) : null].concat(set.slice(1).map(garData))
        : [garData(it), avd, shoeIt ? shoeData(shoeIt) : null, second ? garData(second) : null, third ? garData(third) : null]);
    }).then(function (a) {
      return Core.genCall(genBody(job.key, set, a, isMulti, it, second, third, shoeIt, false));
    }).then(function (res) {
      if (!res.ok || !res.j.taskId) throw new Error((res.j && res.j.error) || '요청을 접수하지 못했습니다.');
      subNow().used++; save();   /* 서버가 접수한 뒤에만 횟수를 뺀다 */
      job.taskId = res.j.taskId; job.t0 = Date.now();
      var o2 = angLoad(); o2.cur = job; angSave(o2);
      angPoll(job, avB);
    }).catch(function (err) { angDone(job, false, ANG_NAME[job.view] + '을 만들지 못했어요. ' + ((err && err.message) || '') + ' (횟수는 차감되지 않았습니다)'); });
  }
  function angPoll(job, avB) {
    if (!user || user.id !== job.uid || angBusy !== job) return;
    if (Date.now() - job.t0 > 6 * 60 * 1000) { angDone(job, false, ANG_NAME[job.view] + '을 만드는 데 너무 오래 걸려 중단했어요.'); return; }
    Core.genCall({ action: 'status', taskId: job.taskId }).then(function (res) {
      if (!res.ok) throw new Error('retry');
      var j = res.j;
      if (j.status === 'success' && j.image) {
        var raw = Core.imageBlob(j);
        shapeCheck(raw, avB, null, raw).then(function (why) {
          if (why) {
            var sb = subNow(); if (sb.used > 0) sb.used--; save();
            try { console.debug('[fiton-reject-' + job.view + '] ' + why + ' ' + JSON.stringify(ui.lastShape || null)); } catch (e3) {}
            angDone(job, false, '만든 ' + ANG_NAME[job.view] + '에서 아바타 ' + (why === 'height' ? '몸 비율이' : '머리 모양·위치가') + ' 원본과 달라져서 보여 주지 않았어요. 횟수는 돌려 드렸어요. [이유: ' + why + ']');
            return;
          }
          var bg = !avB ? Promise.resolve(raw) : layerSwap(raw, avB).then(function (l) { return l || bgMatch(raw, avB).then(function (m) { return m && m.blob ? m.blob : raw; }); });
          return bg.catch(function () { return raw; }).then(function (b2) {
            return blobPut('tryon_' + job.view + ':' + job.key, b2).catch(function () { toast('결과를 이 기기에 저장하지 못했어요. 「결과 저장」으로 내려받아 주세요.', 8000); }).then(function () {
              var u = urls.angTry[job.view]; if (u[job.key]) URL.revokeObjectURL(u[job.key]); u[job.key] = URL.createObjectURL(b2);
              state.angBase = state.angBase || {}; state.angBase[job.view] = state.angBase[job.view] || {}; state.angBase[job.view][job.key] = job.base; save();
              var msg = (lookName(job.key) || '옷') + ' ' + ANG_NAME[job.view] + '이 완성됐어요!';
              notifyDone('FITON', msg); angDone(job, true, msg);
            });
          });
        }).catch(function () { angDone(job, false, ANG_NAME[job.view] + ' 그림을 정리하지 못했어요. 다시 시도해 주세요.'); });
        return;
      }
      if (j.status === 'failed') { var why2 = String(j.error || '').slice(0, 200); angDone(job, false, ANG_NAME[job.view] + '을 만들지 못했어요.' + (why2 ? ' (사유: ' + why2 + ')' : ' 잠시 뒤 다시 시도해 주세요.')); return; }
      setTimeout(function () { angPoll(job, avB); }, 4000);
    }).catch(function () { setTimeout(function () { angPoll(job, avB); }, 6000); });
  }
  function angDone(job, ok, msg) {
    if (angBusy !== job) return;
    angBusy = null;
    var o = angLoad(); o.cur = null; angSave(o);
    if (ok && ui.page === 'fitting') { ui.view = 'me'; ui.angle = job.view; }
    toast(msg, ok ? 5000 : 12000); render();
    setTimeout(angNext, 0);
  }
  function angResume() {
    if (!user || angBusy || !Core.genEnabled()) return;
    var o = angLoad(), c = o.cur;
    if (c && c.taskId && c.uid === user.id && Date.now() - c.t0 < 6 * 60 * 1000) { angBusy = c; render(); angAvBlob(c.view).then(function (b) { angPoll(c, b); }); return; }
    if (c) { o.cur = null; angSave(o); }
    angNext();
  }
  function genFinish(id, ok, msg, ms) {
    genPending = null;
    setTimeout(angNext, 0);   /* 2026-11-18 앞모습이 끝나면 고른 옆·뒷모습을 이어서 */
    try { localStorage.removeItem(GEN_KEY()); } catch (e) {}
    waitEnd();
    ui.genErr = ok ? null : (msg || '알 수 없는 이유로 실패했어요. 잠시 뒤 다시 시도해 주세요.');
    if (ok) {
      lookItems(id).forEach(selectItem); save(); ui.view = 'me';
      if (ui.page !== 'fitting') go('fitting'); else render();
      if (urls.tryon[id]) { whenVisible(function () { revealShow(id); }); return; }
    }
    if (msg) toast(msg, ms);
    render();
  }
  function genResume() {
    if (!user || genPending || !Core.genEnabled()) return;
    try {
      var p = JSON.parse(localStorage.getItem(GEN_KEY()) || 'null');
      if (p && p.id && p.taskId && lookItems(p.id).length && Date.now() - p.t0 < 6 * 60 * 1000) { if (p.sz) ui.genSizes[p.id] = p.sz; if (p.base) { ui.genBase = ui.genBase || {}; ui.genBase[p.id] = p.base; } ui.genSig = ui.genSig || {}; ui.genSig[p.id] = p.sig || null; ui.genShoe = ui.genShoe || {}; ui.genShoe[p.id] = p.shoe || null; ui.genStack = ui.genStack || {}; ui.genStack[p.id] = p.stack || null; ui.genFix = ui.genFix || {}; ui.genFix[p.id] = p.fix || null; genPending = p.id; render(); waitStart(lookName(p.id), wearSizes(lookItems(p.id)), true, notesFor(lookItems(p.id))); genPoll(p.id, p.taskId, p.t0); }
      else if (p) localStorage.removeItem(GEN_KEY());
    } catch (e) {}
  }
  function whenVisible(fn) {
    if (document.visibilityState !== 'hidden') { fn(); return; }
    document.addEventListener('visibilitychange', function f() { if (document.visibilityState === 'hidden') return; document.removeEventListener('visibilitychange', f); fn(); });
  }

  /* ---------- 대기 화면 · 완성 공개 연출 ---------- */
  var waitT = null, WAIT_MSGS = ['피팅룸으로 가는 중', '옷 입는 중', '거울 앞에 서는 중', '마무리하는 중'];
  /* 대기 화면 안내 슬라이드(참고용). aifit 사이즈 분석이 실패해도 대기 화면은 그대로 뜬다 */
  function notesFor(set) {
    try {
      if (!window.FitNotes || !set || !set.length) return null;
      var items = set.map(function (it) {
        var s = state.sel[it.cat], f = null, sz = s && s.id === it.id && s.size ? s.size : (((f = fitHint(it)) && f.size) || '');
        return { item: it, size: sz };
      });
      var vals = {}; try { vals = E.bodyOf(prof()).vals || {}; } catch (e) {}
      return window.FitNotes.forSet(items, prof(), vals);
    } catch (e) { return null; }
  }
  var NOTE_ICON = { warn: '⚠️', result: '🔍', info: '📝', tip: '💡' }, NOTE_KIND = { warn: '주의', result: '분석 결과', info: '참고', tip: '팁' };
  var noteT = null;
  function notesHtml(n) {
    if (!n || !n.slides || !n.slides.length) return '';
    return '<div class="wnotes" aria-live="off"><div class="wcards">' + n.slides.map(function (s, i) {
      return '<article class="wcard ' + h(s.type) + (i ? '' : ' on') + '"><small>' + (s.icon || NOTE_ICON[s.type] || '') + ' ' + (NOTE_KIND[s.type] || '') + '</small><b>' + h(s.title) + '</b><p>' + h(s.body || '') + '</p></article>';
    }).join('') + '</div><div class="wdots">' + n.slides.map(function (s, i) { return '<i' + (i ? '' : ' class="on"') + '></i>'; }).join('') + '</div>' +
      '<div class="wfoot">' + h(n.footer || '') + (n.confidence ? ' · 분석 정확도 ' + h(n.confidence) : '') + '</div></div>';
  }
  function waitStart(name, size, resume, notes) {
    waitEnd();
    var o = document.createElement('div'); o.id = 'wait'; o.setAttribute('role', 'status');
    o.innerHTML = '<div class="wb"><div class="sign">FITTING ROOM</div><h2 id="wmsg">' + WAIT_MSGS[resume ? 1 : 0] + '…</h2><div>' + h(name) + '</div>' +
      (size ? '<div class="muted">' + h(size) + '</div>' : '') + '<div class="wbar"><b id="wbar"></b></div><div class="muted">보통 1~2분 걸려요. 닫고 다른 옷을 봐도 됩니다.</div>' + notesHtml(notes) + '<button type="button" class="btn" id="wclose" style="padding:0 20px">닫고 계속 보기</button></div>';
    document.body.appendChild(o);
    o.querySelector('#wclose').addEventListener('click', function () { o.style.display = 'none'; });
    var cards = o.querySelectorAll('.wcard'), dots = o.querySelectorAll('.wdots i'), ni = 0;
    if (cards.length > 1) noteT = setInterval(function () {
      cards[ni].classList.remove('on'); dots[ni].classList.remove('on'); ni = (ni + 1) % cards.length; cards[ni].classList.add('on'); dots[ni].classList.add('on');
    }, 7000);
    var t0 = Date.now();
    waitT = setInterval(function () {
      var s = Math.min(WAIT_MSGS.length - 1, 1 + Math.floor((Date.now() - t0) / 25000)), m = document.getElementById('wmsg');
      if (m) m.textContent = WAIT_MSGS[s] + '…';
      var b = document.getElementById('wbar'); if (b) b.style.width = (90 * (1 - Math.exp(-(Date.now() - t0) / 40000))).toFixed(1) + '%';
    }, 500);
  }
  function waitEnd() { if (waitT) { clearInterval(waitT); waitT = null; } if (noteT) { clearInterval(noteT); noteT = null; } var o = document.getElementById('wait'); if (o) o.remove(); }
  function revealKey(e) { if (e.key === 'Escape') revealClose(); }
  function revealClose() { var o = document.getElementById('reveal'); if (o) o.remove(); document.removeEventListener('keydown', revealKey); }
  function revealShow(id) {
    revealClose();
    var u = urls.tryon[id], name = lookName(id), size = wearSizes(lookItems(id));
    var o = document.createElement('div'); o.id = 'reveal'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', '입은 모습 완성');
    o.innerHTML = '<img class="bg" alt="" src="' + u + '"><img class="pic" alt="' + h(name) + ' 입은 모습" src="' + u + '"><div class="glow2"></div><div class="tt">짠! 다 입었어요</div>' +
      '<div class="nt"><small>화면을 누르면 닫혀요</small></div><button type="button" class="x" aria-label="닫기">✕</button>';
    o.addEventListener('click', revealClose);
    document.body.appendChild(o);
    document.addEventListener('keydown', revealKey);
  }

  /* ---------- 로그인 (설계에서 미뤄 둔 화면) ---------- */
  function dot(u) { return '<span class="dot">' + h(String(u.nick || '?').charAt(0)) + '</span>'; }
  function viewLogin() {
    /* 2026-11-10 목업(Login.dc.html): 왼쪽 로고·사진 2장·문구, 오른쪽 상자. 입력 칸 id 와 data-act 는 그대로 */
    var lg = ui.lg, users = Core.readUsers(), body = '', st0 = FD.styles[0];
    if (lg.mode === 'list') {
      body = (users.length ? '<h1>프로필 고르기</h1><p class="sub">이 브라우저에 있는 프로필을 고르세요. 폰에서 만든 프로필은 폰 안에만 있어요.</p><div class="ulist">' +
        users.map(function (u) { return '<button type="button" class="ubtn" data-act="lgPick" data-id="' + h(u.id) + '">' + dot(u) + h(u.nick) + '</button>'; }).join('') + '</div>'
        : '<h1>시작하기</h1><p class="sub">프로필을 만들어 시작하세요.</p>') + '<button type="button" class="new" data-act="lgNew">새 프로필 만들기</button>';
    } else if (lg.mode === 'pin') {
      var u = Core.userById(lg.id);
      body = '<h1>PIN 입력</h1><div style="display:flex;align-items:center;gap:12px">' + (u ? dot(u) + '<b style="font-size:20px">' + h(u.nick) + '</b>' : '') + '</div><label>PIN 4자리<input type="password" id="lgpin" inputmode="numeric" maxlength="4" autocomplete="off" autofocus></label>' +
        '<p class="sub">PIN이 5번 틀리면 30초 동안 잠깁니다.</p><div class="err" id="lgerr">' + h(lg.err) + '</div><button type="button" class="new" data-act="lgLogin">들어가기</button><button type="button" class="btn" data-act="lgBack">뒤로</button>';
    } else {
      body = '<h1>새 프로필 만들기</h1><label>닉네임<input type="text" id="lgnick" maxlength="12" autofocus></label><div class="g2"><label>PIN 4자리<input type="password" id="lgpin" inputmode="numeric" maxlength="4" autocomplete="off"></label><label>PIN 확인<input type="password" id="lgpin2" inputmode="numeric" maxlength="4" autocomplete="off"></label></div>' +
        '<div class="g3"><label>성별<select id="lggender"><option value="female">여성</option><option value="male">남성</option></select></label><label>키(cm)<input type="number" id="lgh"></label><label>몸무게(kg)<input type="number" id="lgw"></label></div>' +
        '<div class="err" id="lgerr">' + h(lg.err) + '</div><button type="button" class="new" data-act="lgCreate">프로필 만들기</button><button type="button" class="btn" data-act="lgBack">뒤로</button>';
    }
    return '<div class="login"><section class="lintro" aria-label="FITON 소개"><div class="logo">' + LOGO_MARK + '</div><div class="lpics"><img src="assets/avatar_default.jpg" alt="기본 캐릭터 전신">' +
      (st0 && st0.modelImage ? '<img src="' + h(st0.modelImage) + '" alt="' + h(st0.title) + ' 입은 모습">' : '') + '</div><p class="lsay">쇼츠에서 본 스타일, <em>바로 입어보기</em></p></section>' +
      '<main class="lmain"><div class="lbox"><div class="logo lblogo">' + LOGO_MARK + '</div>' + body + '</div></main></div>';
  }
  function lgErr(msg) { ui.lg.err = msg; var e = document.getElementById('lgerr'); if (e) e.textContent = msg; var p = document.getElementById('lgpin'); if (p) { p.value = ''; p.focus(); } }
  function val(id) { var e = document.getElementById(id); return e ? e.value : ''; }
  function checkPin(u) {
    var lg = ui.lg, pin = val('lgpin');
    if (Date.now() < lg.until) { lgErr(Math.ceil((lg.until - Date.now()) / 1000) + '초 뒤에 다시 시도해 주세요.'); return false; }
    if (Core.pinHash(u.salt, pin) === u.pin) return true;
    lg.fails++;
    if (lg.fails >= 5) { lg.fails = 0; lg.until = Date.now() + 30000; lgErr('PIN이 5번 틀려 30초 동안 잠깁니다.'); } else lgErr('PIN이 맞지 않습니다.');
    return false;
  }
  function enterApp() {
    try { localStorage.setItem(CUR_KEY, user.id); } catch (e) {}
    ui.lg = { mode: 'list', id: null, err: '', fails: 0, until: 0 }; ui.cf = blankForm(ui.closetCat || 'top'); ui.af = blankAcc();
    clearUrls(); render();
    loadMedia().then(function () { render(); genResume(); angResume(); });
  }

  /* ---------- 공통 틀 ---------- */
  var TITLES = { home: '홈', fitting: '피팅룸', closet: '내 옷장', accessory: '액세서리', history: '입어본 기록', body: '내 몸 정보', plan: '요금제', set: '설정' };
  function leftText() { return unlimited() ? '∞' : tryLeft() + '/' + planNow().limit; }
  function side() {
    /* 2026-11-10 B 스튜디오: 88px 아이콘 메뉴. 남은 횟수 칸=요금제 화면, 맨 아래=설정 화면. 새로 입어보기는 위쪽 줄(topbar)로 옮겼다 */
    var leftSay = unlimited() ? '이번 달 남은 횟수 제한 없음(시험 중)' : '이번 달 남은 횟수 ' + planNow().limit + '회 중 ' + tryLeft() + '회', pl = ui.page === 'plan', st = ui.page === 'set';
    return '<nav class="side" aria-label="주 메뉴"><button type="button" class="logo" data-act="go" data-page="home" aria-label="FITON 홈">FIT<i>ON</i></button>' +
      PAGES.filter(function (p) { return p[0] !== 'accessory' || accOn(); }).map(function (p) { var on = ui.page === p[0]; return '<button type="button" class="nv' + (on ? ' on' : '') + '" data-act="go" data-page="' + p[0] + '"' + (on ? ' aria-current="page"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + p[2] + '</svg>' + p[1] + '</button>'; }).join('') +
      '<div class="foot"><button type="button" class="left' + (pl ? ' on' : '') + '" data-act="go" data-page="plan"' + (pl ? ' aria-current="page"' : '') + ' title="' + leftSay + ' · 요금제 보기" aria-label="' + leftSay + ', 요금제 보기"><b>' + leftText() + '</b>남은 횟수</button>' +
      '<button type="button" class="nv' + (st ? ' on' : '') + '" data-act="go" data-page="set"' + (st ? ' aria-current="page"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"></path><circle cx="16" cy="7" r="2"></circle><circle cx="8" cy="17" r="2"></circle></svg>설정</button></div></nav>';
  }
  /* 위쪽 줄: 화면 제목 + (피팅룸이면 보기 전환·패널 접기, 그 밖에는 새로 입어보기) + 닉네임 */
  /* 2026-11-19 홈 위쪽 줄 스킨 드롭다운: 지금 스킨(색 점+이름)을 누르면 3개가 펼쳐지고, 고르면 바로 바뀌고 닫힌다. 바깥을 누르거나 Esc 로도 닫힌다. 설정의 스킨 카드와 같은 값(skin.js) */
  function skinDot(s) { return '<i class="skdot" aria-hidden="true" style="background:linear-gradient(135deg,' + h(s.sw[0]) + ' 50%,' + h(s.sw[2]) + ' 50%)"></i>'; }
  function skinDrop() {
    var FS = window.FitSkin; if (!FS) return '';
    var now = FS.list.filter(function (s) { return s.id === FS.cur(); })[0] || FS.list[0];
    return '<div class="skindd"><button type="button" class="tl skinbtn" id="skinbtn" data-act="skinMenu" aria-haspopup="true" aria-expanded="' + !!ui.skinOpen + '" aria-label="스킨 바꾸기, 지금 ' + h(now.name) + '">' + skinDot(now) + h(now.name) + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg></button>' +
      (ui.skinOpen ? '<div class="skinmenu" role="group" aria-label="스킨">' + FS.list.map(function (s) { var o = s.id === now.id; return '<button type="button" class="' + (o ? 'on' : '') + '" aria-pressed="' + o + '" data-act="skinPick" data-v="' + h(s.id) + '">' + skinDot(s) + '<span>' + h(s.name) + '</span>' + (o ? CHECK : '') + '</button>'; }).join('') + '</div>' : '') + '</div>';
  }
  function topbar() {
    var fit = ui.page === 'fitting', v = ui.view;
    /* 2026-11-10: 피팅룸은 위쪽 줄을 없애 입은 모습을 키운다. 보기 전환·패널 접기는 입은 모습 카드 안(fitTabs·fitToggle)으로 옮겼다 */
    /* 2026-11-12 다섯 화면 일관성(A안): 피팅룸도 다른 화면과 같은 위쪽 줄(제목 왼쪽 · 새로 입어보기와 닉네임 오른쪽)을 쓴다. 보기 전환·패널 접기는 그대로 입은 모습 카드 안 */
    fit = false;
    var mid = fit ? '<div class="vtabs" role="tablist" aria-label="보기 선택">' + [['model', '기본 모델'], ['me', '내 아바타'], ['cmp', '원본과 비교']].map(function (t) { return '<button type="button" role="tab" aria-selected="' + (v === t[0]) + '" class="' + (v === t[0] ? 'on' : '') + '" data-act="view" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' : '';
    var act = fit ? '<button type="button" class="tl" data-act="rpToggle" aria-controls="rpanel" aria-expanded="' + !ui.rpOff + '">' + (ui.rpOff ? '패널 펼치기' : '패널 접기') + '</button>'
      : '<button type="button" class="tnew" data-act="go" data-page="fitting"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>새로 입어보기</button>';
    return '<header class="topbar"><h1>' + TITLES[ui.page] + '</h1>' + mid + '<div class="tacts">' + (ui.page === 'home' ? skinDrop() : '') + act + '<span class="tnick">' + h(user.nick) + ' 님</span></div></header>';
  }
  function buyHtml(it, cls) { var u = safeUrl(it.url); return '<a class="' + cls + '" data-buyid="' + h(it.id) + '" href="' + h(u) + '" target="_blank" rel="noopener noreferrer" aria-label="' + h(it.name) + ' 구매하기">구매하기' + ARROW + '</a>'; }
  /* 구매하기로 링크를 연 뒤 FITON 화면으로 돌아오면 "상품 페이지가 열렸나요?" 확인 팝업을 띄운다.
     다른 사이트가 열렸는지는 브라우저가 알려 주지 않아서 사용자가 직접 답한다(시간이 지나 없어진 상품을 나중에 입어볼 때를 대비). */
  var buyAsk = null;
  function buyAskClose() { var o = document.getElementById('buyask'); if (o) o.remove(); document.removeEventListener('keydown', buyAskKey); buyAsk = null; }
  function buyAskKey(e) { if (e.key === 'Escape') buyAskClose(); }
  function buyAskShow() {
    if (!buyAsk || document.getElementById('buyask')) return;
    var it = item(buyAsk.id) || accItem(buyAsk.id); if (!it) { buyAsk = null; return; }
    var o = document.createElement('div'); o.id = 'buyask'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', '상품 페이지 확인');
    o.innerHTML = '<div class="bk"><h2>상품 페이지가 열렸나요?</h2><p><b>' + h(it.name) + '</b></p><p class="muted">링크가 열리지 않거나 판매가 끝난 상품이라면 알려 주세요. 나중에 이 옷을 입어볼 때 "현재 없는 상품"으로 보여 드려요.</p>' +
      '<div class="ba"><button type="button" class="btn" data-bk="ok">잘 열렸어요</button><button type="button" class="btn warnb" data-bk="gone">열리지 않아요 · 상품이 없어요</button></div></div>';
    o.addEventListener('click', function (e) {
      var b = e.target.closest('[data-bk]'); if (!b) { if (e.target === o) buyAskClose(); return; }
      if (b.dataset.bk === 'gone') { var t = item(buyAsk.id) || accItem(buyAsk.id); if (t) { t.gone = true; save(); } buyAskClose(); render(); toast('상품이 없는 것으로 표시했어요. 새 링크로 바꿀 수 있어요.', 4500); }
      else buyAskClose();
    });
    document.body.appendChild(o); document.addEventListener('keydown', buyAskKey);
    var f = o.querySelector('[data-bk="ok"]'); if (f) f.focus();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-buyid]'); if (!a) return;
    buyAsk = { id: a.dataset.buyid, t: Date.now() };
    /* 새 탭으로 넘어갔다가 돌아오면(보이는 상태로 바뀌면) 묻는다. 탭이 안 넘어가면(팝업 차단 등) 3초 뒤 묻는다 */
    var left = false, onVis = function () { if (document.visibilityState === 'hidden') left = true; else if (left) { document.removeEventListener('visibilitychange', onVis); setTimeout(buyAskShow, 400); } };
    document.addEventListener('visibilitychange', onVis);
    setTimeout(function () { if (!left && buyAsk) { document.removeEventListener('visibilitychange', onVis); buyAskShow(); } }, 3000);
  });
  /* 카드 아래 구매 영역: 링크 있음 / 없어진 상품 / 링크 없음 (옷장·액세서리 공통) */
  function buyArea(it, kind) {
    var ed = ui.linkEdit && ui.linkEdit.id === it.id, out = '', id = h(it.id);
    if (ed) return '<label>상품 링크<input type="url" id="lkin" placeholder="https://..."></label>' + (ui.linkEdit.err ? '<p class="gone" role="alert">https://로 시작하는 주소를 넣어 주세요.</p>' : '') +
      '<div class="lkacts"><button type="button" class="lk" data-act="linkSave" data-kind="' + kind + '" data-id="' + id + '">저장</button><button type="button" class="lk" data-act="linkCancel">취소</button></div>';
    if (it.gone) out = '<p class="gone">이 상품은 현재 없는 것으로 보입니다</p><button type="button" class="lk" data-act="linkOpen" data-id="' + id + '">링크 바꾸기</button>';
    else if (safeUrl(it.url)) out = buyHtml(it, 'buy');
    else out = '<button type="button" class="lk" data-act="linkOpen" data-id="' + id + '">구매 링크 넣기</button>';
    return out;
  }

  /* ---------- 홈 ---------- */
  /* 2026-11-14 홈 「입은 모습」: 입어본 기록 그림을 슬라이드로 4초마다 옆으로 넘김. 마우스를 올리면 멈추고 떼면 이어서 넘김(기록 2장 이상, 동작 줄임 설정이면 안 넘김) */
  var homeHover = false;
  document.addEventListener('mouseover', function (e) { if (e.target.closest && e.target.closest('.hslide')) homeHover = true; });
  document.addEventListener('mouseout', function (e) { if (e.target.closest && e.target.closest('.hslide') && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.hslide'))) homeHover = false; });
  /* 2026-11-18 사용자 지시: 홈 「최근 입어본 옷」은 한 줄, 마우스로 끌거나 휠을 굴려 좌우로 넘겨 본다. 끌고 놓을 때는 카드 클릭으로 치지 않음 */
  var rowDrag = null, rowMoved = false;
  document.addEventListener('mousedown', function (e) {
    var r = e.button === 0 && e.target.closest && e.target.closest('.g6'); if (!r) return;
    rowDrag = { el: r, x: e.clientX, s: r.scrollLeft }; rowMoved = false; e.preventDefault();
  });
  document.addEventListener('mousemove', function (e) {
    if (!rowDrag) return;
    var dx = e.clientX - rowDrag.x; if (Math.abs(dx) > 5) { rowMoved = true; rowDrag.el.classList.add('drag'); }
    rowDrag.el.scrollLeft = rowDrag.s - dx;
  });
  document.addEventListener('mouseup', function () { if (rowDrag) rowDrag.el.classList.remove('drag'); rowDrag = null; setTimeout(function () { rowMoved = false; }, 0); });
  document.addEventListener('click', function (e) { if (rowMoved && e.target.closest && e.target.closest('.g6')) { e.preventDefault(); e.stopPropagation(); rowMoved = false; } }, true);
  document.addEventListener('wheel', function (e) {
    var r = e.target.closest && e.target.closest('.g6'); if (!r || r.scrollWidth <= r.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault(); r.scrollLeft += e.deltaY;
  }, { passive: false });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-g6]'); if (!b) return;
    var r = document.querySelector('.g6'); if (r) r.scrollBy({ left: (+b.getAttribute('data-g6')) * r.clientWidth * 0.8, behavior: 'smooth' });
  });
  setInterval(function () {
    var box = document.querySelector('.hslide'); if (!box || document.hidden || homeHover) return;
    try {
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var n = +box.getAttribute('data-n') || 0; if (n < 2) return;
      /* 2026-11-18 사용자 지시: 마지막 다음에 처음으로 되감지 말고 원처럼 이어서 돈다 — 맨 끝의 첫 그림 복사본으로 넘어간 뒤, 움직임 없이 진짜 첫 그림 자리로 바꿔 놓는다 */
      var tr = box.querySelector('.htrack'), i = (+box.getAttribute('data-ri') || 0) + 1;
      tr.style.transform = 'translateX(-' + (i * 100) + '%)';
      if (i >= n) {
        i = 0;
        setTimeout(function () { tr.style.transition = 'none'; tr.style.transform = 'translateX(0)'; void tr.offsetWidth; tr.style.transition = 'transform .7s ease'; }, 750);
      }
      box.setAttribute('data-ri', i);
      homeSlideSync(i);
    } catch (e) { }
  }, 4000);
  /* 2026-11-18 홈 B안(v14): 슬라이드가 넘어가면 옆 글(옷 이름·추천 사이즈·피팅룸 버튼)과 점 표시도 같이 바꾼다 */
  var homeInfo = [];
  function homeSlideSync(i) {
    var d = homeInfo[i], inf = document.querySelector('.b1 .info'); if (!d || !inf) return;
    inf.querySelector('h3').textContent = d.name;
    var sz = inf.querySelector('.szbox'); if (sz) { sz.innerHTML = d.szIn; sz.hidden = !d.szIn; }
    inf.querySelector('.btn').setAttribute('data-id', d.key);
    var lb = inf.querySelector('small'); if (lb) lb.textContent = i ? '최근 입어본 옷' : '방금 입어본 옷';
    Array.prototype.forEach.call(document.querySelectorAll('.b1 .dots i'), function (el, k) { el.className = k === i ? 'cur' : ''; });
  }
  /* 추천 사이즈: 핏 계산(evalOne)의 recommended 값만 씀. 키가 없거나 계산이 안 되면 빈 목록(→ 화면에서 숨김, 가짜 값 금지). 신발은 핏 내용에서 빼기로 함(2026-11-13) */
  function homeRec(items) {
    try { if (!E.num(prof().height)) return []; } catch (e) { return []; }
    return items.filter(function (it) { return it.cat !== 'shoe'; }).map(function (it) {
      var r = evalOne(it, null); if (!r || !r.recommended) return null;
      var e = (r.all || []).filter(function (x) { return x.size === r.recommended; })[0];
      return { cat: it.cat, size: String(r.recommended), st: sizeState(e)[1] };
    }).filter(Boolean);
  }
  function homeRecBox(rs) {
    if (!rs.length) return '';
    var who0 = who() === 'base' ? '기본 모델 치수로 계산한 추천 사이즈' : '내 치수로 계산한 추천 사이즈';
    return rs.length === 1 ? '<b>' + h(rs[0].size) + '</b><span><strong>' + h(rs[0].st) + '</strong>' + who0 + '</span>'
      : '<b class="mul">' + h(rs.map(function (r) { return r.size; }).join(' · ')) + '</b><span><strong>' + h(rs.map(function (r) { return CATS[r.cat] + ' ' + r.size; }).join(' · ')) + '</strong>' + who0 + '</span>';
  }
  /* 아래 카드의 옷 부분 확대 위치: 상의만 = 몸통, 하의만 = 허리~무릎, 신발만 = 발, 원피스·여러 벌 = 덜 확대해 넓게 */
  function homeZoom(items) {
    var c = items.map(function (x) { return x.cat; }), up = c.some(function (k) { return /^(top|outer|inner)$/.test(k); }), lo = c.indexOf('bottom') >= 0, dr = c.indexOf('dress') >= 0, sh = c.indexOf('shoe') >= 0;
    if (dr || (up && lo) || (up && sh) || (lo && sh)) return 'z wide';
    if (lo) return 'z lo'; if (sh) return 'z sh'; return 'z';
  }
  function viewHome() {
    /* 2026-11-10 목업(Main.dc.html): 왼쪽 글+입력 상자, 오른쪽 사진 2장(원본·입은 모습) */
    var hl = histList().reverse() /* 2026-11-14 홈 그림은 입어본 기록에서(최근 것부터). 기록이 없으면 예전 샘플 코디 */, list = stylesIn(), p = ui.pend, hc = ui.homeCat, st0 = list[0] || FD.styles[0] || null, base = isMale() ? 'assets/avatar_male_home.jpg?v=b' : 'assets/avatar_default.jpg?v=t';
    var kpills = KINDS.map(function (k) { return '<button type="button" class="pill kp' + (ui.homeKind === k[0] ? ' on' : '') + '" aria-pressed="' + (ui.homeKind === k[0]) + '" data-act="homeKind" data-v="' + k[0] + '">' + h(KIND_NAME[k[0]]) + '</button>'; }).join('');
    var pills = ['outer', 'inner', 'top', 'bottom', 'dress', 'shoe'].map(function (c) { return '<button type="button" class="pill' + (hc === c ? ' on' : '') + '" data-act="homeCat" data-cat="' + c + '">' + CATS[c] + '</button>'; }).join('') +
      (accOn() ? '<button type="button" class="pill' + (hc === 'acc' ? ' on' : '') + '" data-act="homeCat" data-cat="acc">액세서리</button>' : '');
    var drop = p ? '<img src="' + p.url + '" alt="넣은 옷 사진" style="width:56px;height:56px;object-fit:cover;border-radius:10px"><span>사진을 넣었어요. 아래에서 옷 종류를 눌러 주세요.</span><button type="button" class="lk" data-act="pendClear" style="margin-left:auto;flex:none">사진 빼기</button>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"></rect><circle cx="9" cy="10" r="2"></circle><path d="M21 16l-5-5-8 9"></path></svg><span>옷 사진을 여기에 끌어다 놓거나 <kbd>Ctrl</kbd> + <kbd>V</kbd> 로 붙여넣으세요</span>';
    return '<main class="main homemain"><section class="hero2" aria-label="옷 사진 넣기"><div class="hleft">' +
      '<div class="season">올 ' + seasonName() + ' 유행할 패션</div><h2 class="herotitle">입어보고 사는 온라인 쇼핑,<br><em>내 몸에 먼저 입혀 보세요</em></h2><p class="herosub">옷 사진 한 장이면 AI가 내 치수로 입혀 보고, 맞는 사이즈까지 알려 드려요.</p>' +
      '<div class="comp" data-dz="home"><div class="drop">' + drop + '</div><div class="krow" role="group" aria-label="용도 (선택)"><small>용도 (선택)</small>' + kpills + '</div><div class="crow' + (p ? ' ask' : '') + '">' + pills +
      '<label class="go" style="display:inline-flex;align-items:center;flex-direction:row;justify-content:center;font-size:20px;line-height:1;padding:0 20px;color:var(--onPri);cursor:pointer" title="옷 사진 파일 선택"><span aria-hidden="true">+</span><input type="file" class="fhid" accept="image/*" data-file="quick" aria-label="옷 사진 파일 선택"></label></div></div>' +
      '<div class="steps"><span><b>1</b>옷 사진 넣기</span><span><b>2</b>옷 종류 누르기</span><span><b>3</b>내 아바타로 확인</span></div></div>' +
      /* 2026-11-18 홈 B안(v14): 입어본 기록이 있으면 위 = 세로 9:16 슬라이드 + 옆 글(옷 이름·추천 사이즈·피팅룸 버튼), 아래 = 「최근 입어본 옷」 옷 부분 확대 카드. 기록이 없으면 예전 그대로(샘플 코디·원본) */
      (hl[0] ? homeHeroB(hl) : '<div class="hpics' + (st0 && st0.modelImage && styleForMe(st0) ? '' : ' one') + '">' + (st0 && st0.modelImage && styleForMe(st0) ? '<div class="hpic"><img src="' + h(st0.modelImage) + '" alt="' + h(st0.title) + ' 입은 모습"><span class="on">입은 모습</span></div>' : '<div class="hpic"><img src="' + base + '" alt="기본 캐릭터 전신"><span>원본</span></div>') + '</div>') + '</section>' + /* 2026-11-14 홈의 「원본」 그림 삭제(입은 모습만). 입은 모습 그림이 하나도 없을 때만 원본을 보여 줌 */
      (hl.length ? homeCardsB(hl) : '<section class="sec"><div class="sh"><h2 class="sectitle">이번 ' + seasonName() + ' 코디</h2><span>눌러서 바로 입어 보세요</span></div><div class="grid5">' +
        list.map(function (st) { return '<button type="button" class="stylelk" data-act="styleTry" data-id="' + h(st.id) + '" style="padding:0;text-align:left"><img src="' + h(st.modelImage) + '" alt="' + h(st.title) + '" loading="lazy"><div class="cap"><b>' + h(st.title) + '</b><span>입어보기</span></div></button>'; }).join('') + '</div></section>') +
      '</main>';
  }
  function homeHeroB(hl) {
    var L = hl.slice(0, 10);
    homeInfo = L.map(function (e) { return { key: e.key, name: e.items.map(shortLabel).join(' + '), szIn: homeRecBox(homeRec(e.items)) }; });
    var d = homeInfo[0];
    return '<div class="hpics b1"><div class="hpic hslide stage" data-ri="0" data-n="' + L.length + '"><div class="htrack" style="display:flex;height:100%;transition:transform .7s ease">' + L.map(function (e, k) { return '<div class="hs"><img class="hsbg" src="' + h(urls.tryon[e.key]) + '" alt="" aria-hidden="true"><img class="hsfg" src="' + h(urls.tryon[e.key]) + '" alt="' + h(homeInfo[k].name) + ' 입은 모습"></div>'; }).join('') + (L.length > 1 ? '<div class="hs" aria-hidden="true"><img class="hsbg" src="' + h(urls.tryon[L[0].key]) + '" alt=""><img class="hsfg" src="' + h(urls.tryon[L[0].key]) + '" alt=""></div>' : '') + '</div><span class="on">입은 모습</span>' +
      (L.length > 1 ? '<div class="dots" aria-hidden="true">' + L.map(function (e, k) { return '<i' + (k ? '' : ' class="cur"') + '></i>'; }).join('') + '</div>' : '') + '</div>' +
      '<div class="info" aria-live="polite"><small>방금 입어본 옷</small><h3>' + h(d.name) + '</h3><div class="szbox"' + (d.szIn ? '' : ' hidden') + '>' + d.szIn + '</div>' +
      '<button type="button" class="btn" data-act="histShow" data-id="' + h(d.key) + '">피팅룸에서 자세히 보기</button></div></div>';
  }
  function homeCardsB(hl) {
    return '<section class="sec g6sec"><div class="sh"><h2 class="sectitle">최근 입어본 옷</h2><span>마우스로 끌거나 휠을 굴려 좌우로 넘겨 보세요 · 눌러서 피팅룸에서 보세요</span><span class="g6nav"><button type="button" data-g6="-1" aria-label="이전 옷">‹</button><button type="button" data-g6="1" aria-label="다음 옷">›</button></span></div><div class="g6">' +
      hl.map(function (e) {
        var t = e.items.map(shortName).join(' + '), rs = homeRec(e.items), u = h(urls.tryon[e.key]);
        return '<button type="button" class="ck" data-act="histShow" data-id="' + h(e.key) + '"><div class="ph"><img class="' + homeZoom(e.items) + '" src="' + u + '" alt="' + h(t) + ' 옷 부분" loading="lazy"><img class="mini" src="' + u + '" alt="" aria-hidden="true" loading="lazy"></div><div class="m"><b>' + h(t) + '</b>' +
          (rs.length ? '<small>추천 사이즈 ' + h(rs.map(function (r) { return rs.length > 1 ? CATS[r.cat] + ' ' + r.size : r.size; }).join(' · ')) + '</small>' : '') + '</div></button>';
      }).join('') + '</div></section>';
  }

  /* ---------- 피팅룸 ---------- */
  function slotHtml(cat, role) {
    var it = got(cat);
    if (!it) {
      var shoeSel = cat === 'shoe' ? '<label>입어볼 때 신발<select data-chg="shoe">' + shoeOpts() + '</select></label>' : '';
      return '<div class="slot"><div class="srow"><span class="thumb" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg></span><div class="sname"><small>' + CATS[cat] + '</small><button type="button" data-act="toCloset" data-cat="' + cat + '">' + (cat === 'shoe' ? '신발장에서 고르기' : '옷장에서 고르기') + '</button></div></div>' + shoeSel + '</div>';
    }
    var s = state.sel[cat], r = evalOne(it, s.size), on = s.size || (r && r.chosen) || '';
    /* 2026-11-14 사용자 지시: 입어볼 것 칸은 이미지만(이름·사이즈는 오른쪽 핏 분석·사이즈 비교에 있어 중복). 이름은 마우스를 올리면 보임 */
    return '<div class="slot" title="' + h(role + ' · ' + it.name + (on ? ' · ' + on : '')) + '"><div class="srow">' + (it.photo ? '<img src="' + h(it.photo) + '" alt="' + h(it.name) + '" class="' + posOf(it) + '">' : '<span class="thumb" aria-hidden="true">' + SHIRT + '</span>') +
      '<div class="sname" style="flex:1"></div><button type="button" class="rm" aria-label="' + h(it.name) + ' 빼기" data-act="unsel" data-cat="' + cat + '">빼기</button></div>' +
      (cat === 'bottom' ? hemShortNote(it) + optRow('beltUse', '허리띠', [['off', '사용안함'], ['on', '사용']], state.beltUse === 'on' ? 'on' : 'off') : '') + '</div>'; /* 2026-11-18 사용자 지시: 겉옷 열기/잠그기·상의 빼기/넣기 줄 삭제 */
  }
  /* 2026-11-13 바지 길이 선택: 자동(옷 길이와 다리 길이로 계산) 또는 발목 위·발목·발등·바닥. 입히기 그림 문장에 쓰임(서버 tryon) */
  var HEM_OPTS = [['auto', '기본'], ['above', '짧게'], ['foot', '길게'], ['floor', '바닥']];
  function hemFootOk(it, r, len) {
    var ek = it.ext && it.ext.kind; if (ek === 'shorts' || ek === 'skirt') return false;
    var keys = r.current.parts.map(function (p) { return p.key; });
    if (keys.indexOf('length') >= 0 && keys.indexOf('inseam') < 0) return false;
    return !(isFinite(len.leg) && len.leg < -6);
  }
  function hemNow() { var v = state.hemTo; return HEM_OPTS.some(function (o) { return o[0] === v; }) ? v : 'auto'; }
  /* 2026-11-13 입는 모양 선택: 겉옷 열기/잠그기, 상의·이너 바지에 넣기/빼기 (서버 tryon 의 style 문장) */
  function optRow(key, title, opts, cur) {
    return '<div class="hemrow one" role="group" aria-label="' + h(title) + '"><small>' + h(title) + '</small><div class="sizes">' + opts.map(function (o) { return '<button type="button" class="sz' + (cur === o[0] ? ' on' : '') + '" aria-pressed="' + (cur === o[0]) + '" data-act="wearOpt" data-k="' + key + '" data-v="' + o[0] + '">' + h(o[1]) + '</button>'; }).join('') + '</div></div>';
  }
  function styleOf(roles) {
    var st = {}, has = function (r) { return roles.indexOf(r) >= 0; };
    if (has('outer')) st.outer = 'open'; /* 2026-11-18 잠그기 선택 삭제: 겉옷은 항상 열어 입힘(예전에 저장된 closed 값은 무시) */
    if (has('bottom')) st.belt = state.beltUse === 'on' ? 'on' : 'off';
    /* 2026-11-18 넣기/빼기 선택 삭제: tuck 은 보내지 않음(그림이 알아서) */
    return Object.keys(st).length ? st : null;
  }
  /* 2026-11-14 사용자 지시: 바지 총장이 다리 길이보다 짧으면 자동으로 늘려 보이면 안 되고 짧다고 알려 준다. leg = 옷 인심(총장) − 내 다리 인심(cm), 음수면 짧음 */
  function hemShortNote(it) {
    try {
      var f = fitHint(it), lg = f && f.len ? f.len.leg : null;
      if (lg == null || !isFinite(lg) || lg >= -6) return '';
      var lp = f.len.legPos, where = lg < -12 && isFinite(lp) ? (lp < 0.2 ? '허벅지 위쪽' : lp < 0.35 ? '허벅지 중간' : lp < 0.5 ? '무릎 근처' : lp < 0.7 ? '무릎 바로 아래' : '종아리') + '까지만' : '발목보다 약 ' + Math.max(1, Math.round(-lg - 6)) + 'cm 위까지만';
      return '<p class="amsg" role="note">이 바지는 총장이 짧아요. ' + where + ' 와요. 그림에서 더 길게 나와도 실제 길이는 이만큼 짧아요.</p>';
    } catch (e) { return ''; }
  }
  function hemRow() {
    var cur = hemNow();
    return '<div class="hemrow one" role="group" aria-label="바지 길이"><small>바지 길이</small><div class="sizes">' + HEM_OPTS.map(function (o) { return '<button type="button" class="sz' + (cur === o[0] ? ' on' : '') + '" aria-pressed="' + (cur === o[0]) + '" data-act="hemTo" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div></div>';
  }
  function shoeOpts() {
    var cur = state.tryShoe || '', ti = tryShoeItem();
    return '<optgroup label="신발 종류">' + SHOE_TYPES.map(function (t) { return '<option value="type:' + t[0] + '"' + (cur === 'type:' + t[0] || (!cur && t[0] === 'pumps') ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</optgroup>' +
      (shoeChoices().length ? '<optgroup label="내 신발장">' + shoeChoices().map(function (x) { return '<option value="closet:' + h(x.id) + '"' + (ti && ti.id === x.id ? ' selected' : '') + '>' + h(x.name || '신발') + '</option>'; }).join('') + '</optgroup>' : '');
  }
  function clothesCount() { return ['outer', 'inner', 'top', 'bottom', 'dress', 'shoe'].filter(got).length; }
  function selAccs() { return state.accSel.map(accItem).filter(Boolean); }
  /* 2026-11-10 목업(Fitting.dc.html) 반영: 왼쪽 입어볼 것(캐릭터·고른 옷·초기화) · 가운데 뷰어·사이즈 비교 · 오른쪽 핏 분석·핏 스타일·실행. 보기 전환은 위쪽 줄(topbar).
     핏 스타일은 저장된 선호 핏(profile.pref)과 같은 값이라 추천 사이즈·판정에 실제로 쓰인다. 입은 그림은 바뀌지 않는다. */
  var FSTYLE = [['tight', 'Slim', '타이트'], ['fit', 'Regular', '정핏'], ['loose', 'Loose', '여유'], ['over', 'Oversized', '오버핏']];
  var CMP_COLS = { outer: ['shoulder', 'chest', 'sleeve', 'length'], inner: ['shoulder', 'chest', 'sleeve', 'length'], top: ['shoulder', 'chest', 'sleeve', 'length'], bottom: ['waist', 'hip', 'thigh', 'inseam', 'length'], dress: ['shoulder', 'chest', 'waist', 'sleeve', 'length'], shoe: ['inner'] };
  var ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2];
  function fieldLabel(it, k) {
    var f = (FIELDS[it.cat] || []).filter(function (x) { return x[0] === k; })[0], t = f ? f[1] : k;
    return it.measureType === 'circ' ? t.replace('단면', '둘레') : t;
  }
  /* 2026-11-12 피팅룸 사이즈 카드·핏 설명의 항목 이름을 사이즈표(이미지 표)의 이름 그대로 쓴다.
     표가 저장된 옷만(예전 옷·신발은 null → 앱 기본 이름 그대로). 폰에서 고쳐 표와 sizes 가 어긋난 옷은 tblSync 가 sizes 기준으로 맞춘 표를 쓴다.
     반환: { name:{칸:이름}, conv:{칸:환산}, ci:{칸:열 위치}, rows:{사이즈 이름:표의 줄} } */
  function imgCols(it) {
    if (!it || it.cat === 'shoe' || !window.FitNotes || !FitNotes.okTable || !FitNotes.okTable(it.table)) return null;
    var t; try { t = FitNotes.tblSync(it, FIELDS[it.cat]); } catch (e) { return null; }
    var o = { name: {}, conv: {}, ci: {}, rows: {} };
    t.keys.forEach(function (k, i) { var nm = String(t.head[i] == null ? '' : t.head[i]).trim(); if (k && nm && o.ci[k] == null) { o.ci[k] = i; o.name[k] = nm; o.conv[k] = t.conv[i]; } });
    t.rows.forEach(function (r) { var l = String(r[0]); if (!(l in o.rows)) o.rows[l] = r; });
    return o;
  }
  function partName(ic, p) { return (ic && ic.name[p.key]) || p.label; }
  /* 사이즈 카드 한 칸: 이름과 숫자는 표에 적힌 그대로(이름은 「가슴둘레」인데 숫자는 계산용 단면값이 나오는 일이 없게).
     cm 가 아닌 표(인치 등)는 적힌 숫자 옆에 계산에 쓰는 cm 값을 같이 보여 준다. n = 계산용 값(sizes) */
  function cmpCell(ic, it, row, k, n, unit) {
    if (!ic || ic.ci[k] == null) return [fieldLabel(it, k), n + unit];
    var r = ic.rows[String(row.label)], cell = r ? String(r[ic.ci[k] + 1] == null ? '' : r[ic.ci[k] + 1]).trim() : '', cv = ic.conv[k];
    if (!cell) return [ic.name[k], n + unit];
    return [ic.name[k], !cv || cv[0] === 1 || cv[0] === 2 ? cell + unit : cell + ' (' + n + unit + ')'];
  }
  /* 사이즈 하나의 판정 → [표시 클래스, 문구]. 근거(내 몸 치수·옷 실측)가 없으면 확정하지 않는다 */
  function sizeState(e) {
    if (!E.num(prof().height) || !e || !e.parts || !e.parts.length) return ['s-none', '측정 정보 부족'];
    var tight = e.parts.some(isTight), loose = e.parts.some(isLoose);
    return tight ? ['s-tight', '타이트할 수 있음'] : loose ? ['s-loose', '여유 있음'] : e.labelEst ? ['s-check', '확인 필요'] : ['s-ok', '적합'];
  }
  function isTight(p) { return p.kind === 'circ' ? p.gradeIdx === 0 : p.gradeKey === 'tightBad'; }
  function isLoose(p) { return p.kind === 'circ' ? p.gradeIdx === 4 : p.gradeKey === 'over'; }
  function curSize(it) { var s = state.sel[it.cat], f; return (s && s.id === it.id && s.size) || (((f = fitHint(it)) && f.size) || ''); }
  /* 입은 그림을 만들 때 쓴 사이즈(2026-11-10부터 기록). 예전 그림은 기록이 없다 */
  function madeSizes(key) { return (state.lookSize && state.lookSize[key]) || null; }
  function stageStatus(set, worn) {
    var cls = 'wait', t = '피팅을 시작해 주세요', sub = set.length ? '오른쪽 패널의 「가상 피팅 시작」을 누르면 AI가 옷을 입혀요.' : '왼쪽에서 입어볼 옷을 골라 주세요.', btn = '';
    if (genPending) { cls = 'run'; t = 'AI가 의류를 착용하고 있습니다'; sub = lookName(genPending) + ' · 보통 1~2분 걸려요. 다른 화면을 봐도 됩니다.'; btn = '<button type="button" data-act="waitShow">진행 화면 보기</button>'; }
    else if (ui.genErr) { cls = 'fail'; t = '피팅을 완료하지 못했습니다'; sub = ui.genErr; btn = set.length ? '<button type="button" data-act="wear">다시 시도</button>' : ''; }
    else if (worn && state.lookShoe && state.lookShoe[worn.key] && set.length && set[0].cat !== 'shoe' && state.lookShoe[worn.key] !== shoeSig()) {
      cls = 'fail'; t = '신발이 바뀌었어요'; sub = '지금 보이는 그림은 예전 신발로 만든 거예요. 다시 입혀야 고른 신발이 그림에 반영돼요.'; btn = '<button type="button" data-act="wear">다시 입히기</button>';
    }
    else if (worn) {
      cls = 'done'; t = '피팅 결과가 준비되었습니다';
      var ms = madeSizes(worn.key), its = lookItems(worn.key), multi = its.length > 1;
      if (!ms) sub = worn.name + ' · 만들 때 사이즈 기록 없음';
      else {
        sub = worn.name + ' · 만들 때 사이즈 ' + its.map(function (x) { return (multi ? CATS[x.cat] + ' ' : '') + (ms[x.id] || '?'); }).join(', ');
        if (its.some(function (x) { return ms[x.id] && curSize(x) && ms[x.id] !== curSize(x); })) sub += ' — 지금 고른 사이즈와 달라요. 다시 입혀야 그림에 반영돼요.';
      }
    }
    /* 2026-11-10: 진행 중·실패만 사진 칸 위에 보여 준다(시작 안내·완료 안내 줄은 뺌) */
    if (cls === 'wait' || cls === 'done') return '';
    return '<div class="vstatus ' + cls + '" role="status"><i aria-hidden="true"></i><div class="st"><b>' + h(t) + '</b><span>' + h(sub) + '</span></div>' + btn + '</div>';
  }
  function fitVerdict(fr) {
    var res = fr.results, out = { cls: 's-none', st: '측정 정보 부족', b: '옷을 골라 주세요', why: '왼쪽에서 입어볼 옷을 담으면 결과가 나옵니다.' };
    if (!res.length) return out;
    var cur = res.filter(function (r) { return r.current; }), tight = [], loose = [];
    cur.forEach(function (r) { var ic = imgCols(r.garment); r.current.parts.forEach(function (p) { if (isTight(p)) tight.push(r.garment.name + ' ' + partName(ic, p)); else if (isLoose(p)) loose.push(r.garment.name + ' ' + partName(ic, p)); }); });
    if (!E.num(prof().height)) return { cls: 's-none', st: '측정 정보 부족', b: '내 몸 정보가 필요해요', why: '키와 몸무게를 넣으면 핏을 계산해 드려요.' };
    if (!cur.length || !cur.some(function (r) { return r.current.parts && r.current.parts.length; })) return { cls: 's-none', st: '측정 정보 부족', b: '실측값이 필요해요', why: '내 옷장에서 사이즈표를 넣어 주세요.' };
    if (tight.length) return { cls: 's-tight', st: '타이트할 수 있음', b: '조금 작아요', why: tight.join(', ') + ' 부분이 작아요.' };
    if (loose.length) return { cls: 's-loose', st: '여유 있음', b: '조금 커요', why: loose.join(', ') + ' 부분이 많이 남아요.' };
    if (cur.some(function (r) { return r.current.labelEst; })) return { cls: 's-check', st: '확인 필요', b: '맞을 것 같아요', why: '실측표가 없는 옷은 표준 치수로 추정했어요. 실측표를 넣으면 정확해져요.' };
    return { cls: 's-ok', st: '적합', b: '잘 맞아요', why: fr.note || '고른 옷 모두 몸에 맞아요.' };
  }
  function viewFitting() {
    var fr = fitResults(); fr.results = (fr.results || []).filter(function (r) { return r.cat !== 'shoe'; }); /* 2026-11-13 사용자 지시: 신발은 핏 내용(태그·탭·판정)에 넣지 않음 */
    var res = fr.results, accs = selAccs(), set = wearSet(), hasOuter = !!got('outer'), left = accOn() ? ui.left : 'clothes', cc = clothesCount();
    var slots = slotHtml('outer', '겉옷 · 맨 바깥') + slotHtml('inner', '이너 · 상의 위, 겉옷 안쪽 (조끼 등)') + (got('dress') ? slotHtml('dress', '원피스') + slotHtml('top', hasOuter ? '상의 · 원피스 위, 겉옷 안쪽' : '상의 · 원피스 위') : slotHtml('top', hasOuter ? '상의 · 겉옷 안쪽' : '상의') + slotHtml('bottom', '하의')) + slotHtml('shoe', '신발');
    var accPane = '<div class="slot"><div class="ahead"><span>착용할 액세서리 ' + accs.length + ' / 10개</span></div>' + accs.map(function (a) {
      return '<div class="arow"><div class="sname"><small>' + h(a.type) + '</small><b>' + h(a.name) + '</b></div><button type="button" class="rm" aria-label="' + h(a.name) + ' 빼기" data-act="accToggle" data-id="' + h(a.id) + '">빼기</button></div>' +
        (a.gone ? '<p class="amsg">이 상품은 현재 없는 것으로 보입니다</p>' : safeUrl(a.url) ? buyHtml(a, 'abuy') : '<button type="button" class="abuy" data-act="go" data-page="accessory">액세서리 메뉴에서 링크 넣기</button>');
    }).join('') + (ui.accFull ? '<p class="amsg" role="status">액세서리는 10개까지 착용할 수 있어요. 하나를 뺀 뒤 다시 골라 주세요.</p>' : '') +
      (accs.some(function (a) { return (ACC_TYPES[a.type] || {}).small; }) ? '<p class="rule">' + h(accs.filter(function (a) { return (ACC_TYPES[a.type] || {}).small; }).map(function (a) { return a.type; }).join(', ')) + '는 전신에서 작게 보여요. 크게 보기로 확인해 주세요.</p>' : '') + '</div>' +
      '<div class="ahead"><span>저장한 액세서리에서 고르기</span></div><div class="alist">' + (state.accs.length ? state.accs.map(function (o) {
        var on = state.accSel.indexOf(o.id) >= 0;
        return '<button type="button" class="aitem' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="accToggle" data-id="' + h(o.id) + '"><span><small>' + h(o.type) + '</small>' + h(o.name) + '</span>' + (on ? '<em>착용</em>' : '') + '</button>';
      }).join('') : '<p class="rule">저장한 액세서리가 없어요.</p>') + '</div>';
    var label = [], wearN = set.length + (set[0] && set[0].cat !== 'shoe' && got('shoe') ? 1 : 0);
    if (wearN) label.push('옷 ' + wearN + '벌');
    var worn = wornNow(), v = ui.view, url = v === 'model' ? modelShow() : worn ? worn.url : avatarStage(), front = ui.angle === 'front', z = ui.zoom;
    /* ----- 뷰어 ----- */
    var tags = '', tagsR = '', seen = {}, hm = v === 'me' && front ? hsMap(spanOf(url)) : (v === 'model' && front && /avatar_(default|male)_wide/.test(url) ? hsMap(spanOf(url), BASES[isMale() ? 1 : 0].h) : null); /* 2026-11-13 키 비례(코디 예시 사진은 그대로, 기본 모델 탭의 기본 여성·남성 샘플은 그 모델 키로 같은 규칙) */
    var tbv = null; try { tbv = hm ? (E.bodyOf(prof(), cfgNow()) || {}).vals : null; if (tbv) tbv = { height: E.num(prof().height), inseam: tbv.inseam, rise: tbv.rise }; } catch (e) {}
    ui.footTop = tagY(hm, 'shoe', tbv);
    if (v === 'me') res.forEach(function (r) {
      if (!r.current) return;
      r.current.parts.forEach(function (p) {
        if (seen[p.key] || TAG_TOP[p.key] == null || !p.gradeKey) return; seen[p.key] = 1;
        var tg = h(p.key === 'shoe' ? '발' : p.label) + ' ' + h(p.grade || { tightBad: '작음', fit: '정핏', over: '큼' }[p.gradeKey] || '');
        if (hm) tagsR += '<i class="rl rtag" style="top:' + tagY(hm, p.key, tbv) + '%"><div class="tag' + (p.key === 'shoe' ? ' tfoot' : '') + '"><i class="g-' + p.gradeKey + '"></i>' + tg + '</div></i>'; /* 2026-11-13 핏 표시: 이미지 창 오른쪽 가장자리, 마우스를 올리면 위치 선 */
        else tags += '<div class="tag' + (p.key === 'shoe' ? ' tfoot' : '') + '" style="top:' + tagY(hm, p.key, tbv) + '%"><i class="g-' + p.gradeKey + '"></i>' + tg + '</div>';
      });
    });
    var pins = true ? '' : accs.map(function (a) { var t = ACC_TYPES[a.type] || {}; return '<div class="pin" style="top:' + (hm ? hsY(hm, parseFloat(t.top)) + '%' : t.top) + ';left:' + (hm ? hsX(hm, parseFloat(t.left)) + '%' : t.left) + '"><i></i>' + h(a.type) + '</div>'; }).join('');
    var angleName = { side: '측면', back: '후면', motion: '모션' }[ui.angle];
    /* 2026-11-11 기본 여성 캐릭터(옷 입히기 전·내 아바타 없음)는 Kling 마스터 캐릭터의 옆·뒷모습 사진을 보여 준다. 입어 본 결과는 여전히 정면만 */
    var gn = isMale() ? 'male' : 'default', gq = isMale() ? '?v=w' : '', mo = ui.angle === 'motion';
    var angImg = !front && v === 'me' && !worn && !charPic() ? 'assets/avatar_' + gn + '_' + (mo ? 'wide' : ui.angle + '_wide') + '.jpg' + gq : (!front && !mo && !myPic() && (v === 'me' ? !worn : v === 'model' && url === charPic()) && angSrc(ui.angle)) || ''; /* 2026-11-19 옆·뒤 사진이 있는 기본 모델(멋진남자)은 「기본 모델」 보기에서도 옆·뒤를 보여 준다 */
    var motSeq = ['assets/avatar_' + gn + '_wide.jpg' + gq, 'assets/avatar_' + gn + '_side_wide.jpg' + gq, 'assets/avatar_' + gn + '_back_wide.jpg' + gq, 'assets/avatar_' + gn + '_side_wide.jpg' + gq].join('|');
    var vidMo = mo && !isMale() && v === 'me' && !worn && !charPic();
    /* 2026-11-18 옆·뒷모습 입은 그림(있으면 먼저), 옷 입기 전이면 내가 올린 옆·뒤 사진 */
    var angV2 = !front && !mo && v === 'me' ? ui.angle : '', angK = angV2 ? angWornKey(set) : '', angRes = angV2 && angTryOk(angV2, angK) ? urls.angTry[angV2][angK] : '';
    var angMine = angV2 && !angRes && !worn && myPic() && urls.ang[angV2] ? urls.ang[angV2] : '', angPend = !!(angV2 && angBusy && angBusy.view === angV2 && angBusy.key === angK);
    var angMsg = mo ? '모션은 기본 캐릭터(옷 입히기 전)에서만 볼 수 있어요.' : v !== 'me' ? '옆모습·뒷모습은 「내 아바타」 보기에서 볼 수 있어요.' : angPend ? 'AI가 ' + ANG_NAME[angV2] + '을 만들고 있어요. 보통 1~2분 걸려요.'
      : !angSrc(ui.angle) ? angWhy(ui.angle) : '이 옷의 ' + ANG_NAME[ui.angle] + '은 아직 만들지 않았어요. 오른쪽 「가상 피팅 시작」 위에서 ' + ANG_NAME[ui.angle] + '을 켜고 입혀 보세요.';
    var hmA = vidMo ? hsMap(HSPAN['avatar_default_motion.mp4']) : angImg ? hsMap(spanOf(angImg)) : null, hmC = v === 'cmp' && front ? hsMap(charSpan()) : null;
    var fig = vidMo ? '<div class="fig' + (hmA ? ' hs' : '') + '"' + hsAttr(hmA) + '><video src="assets/avatar_default_motion.mp4" autoplay muted loop playsinline preload="auto" aria-label="캐릭터 모션"></video></div>'
      : angRes || angMine ? '<div class="fig"><img src="' + h(angRes || angMine) + '" alt="' + h((angRes ? (worn ? worn.name + ' ' : '') + '입은 ' : '내 아바타 ') + ANG_NAME[angV2]) + '"></div>'
      : angImg ? '<div class="fig wide' + (hmA ? ' hs' : '') + '"' + hsAttr(hmA) + '><img src="' + angImg + '"' + (mo ? ' data-motion="' + motSeq + '"' : '') + ' alt="캐릭터 ' + h(mo ? '모션' : ui.angle === 'side' ? '옆모습' : '뒷모습') + '"></div>'
      : !front ? '<div class="fig vphf"><div class="vph"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M4 17l5-5 4 4 3-3 4 4M9 3v0"></path><path d="M3 3l18 18"></path></svg><b>' + angleName + (angPend ? ' 만드는 중' : ' 이미지 없음') + '</b><p>' + h(angMsg) + ' 앞모습 그림을 돌려서 보여 주지는 않아요.</p></div></div>'
      : v === 'cmp' ? '<div class="fig cmpv' + (hmC ? ' hs' : '') + '"' + hsAttr(hmC) + '><figure><img src="' + h(avatarShow()) + '" alt="원본 아바타"><figcaption>원본</figcaption></figure><figure><img src="' + h(worn ? worn.url : avatarShow()) + '" alt="입은 모습"><figcaption>' + (worn ? '입은 모습' : '아직 입은 모습이 없어요') + '</figcaption></figure></div>'
      : '<div class="fig' + (/avatar_(default|male)_wide/.test(url) ? ' wide' : '') + (hm ? ' hs' : '') + '"' + hsAttr(hm) + '><img src="' + h(url) + '" alt="' + h(v === 'model' ? '기본 모델 코디 예시' : worn ? worn.name + ' 입은 모습' : '캐릭터') + '">' + (hm && v !== 'model' && (ui.ruler || ui.lenmark) ? rulerHtml(E.num(prof().height), res, tagsR, (function () { try { return E.bodyOf(prof(), cfgNow()); } catch (e) { return null; } })()) : '') + tags + pins + '</div>';
    var zoomOk = front && v !== 'cmp', zi = ZOOMS.indexOf(z);
    var whoSay = v === 'model' ? (/^assets\/styles\//.test(url) ? '기본 모델 · 코디 예시 사진(샘플)' : '기본 모델 (샘플)') : (who() === 'base' ? '기본 모델 · ' + baseModel().name : myPic() ? '내 아바타' : '내 아바타 · 사진 없음(기본 캐릭터 사진)') + (v === 'cmp' ? ' · 원본과 비교' : '');
    var what = v !== 'model' && worn ? worn.name : set.length ? set.map(function (x) { return x.name; }).join(' + ') : '고른 옷 없음';
    /* 2026-11-10: 사진 칸(vwrap)을 카드 높이 전체로. 이름(왼쪽 위)·보기 전환(오른쪽 위)·방향(아래 가운데)은 사진 칸 위에 겹쳐 놓고, 확대·도구 버튼은 사진 칸 밖(오른쪽/아래). 3D로 보기 버튼과 평소 상태 줄은 뺐다 */
    var zoomHtml = '<div class="vbar"><div class="zoomctl" role="group" aria-label="이미지 확대·축소"><button type="button" data-act="zoom" data-v="-" aria-label="축소"' + (zoomOk && zi > 0 ? '' : ' disabled') + '>−</button><output aria-live="polite">' + Math.round(z * 100) + '%</output><button type="button" data-act="zoom" data-v="+" aria-label="확대"' + (zoomOk && zi < ZOOMS.length - 1 ? '' : ' disabled') + '>+</button><button type="button" data-act="zoom" data-v="1"' + (zoomOk && z !== 1 ? '' : ' disabled') + '>맞춤</button></div></div>';
    var viewer = '<section class="card2 viewer" aria-label="입은 모습"><div class="vwrap"><div class="vname"><small>' + h(whoSay) + '</small><b title="' + h(what) + '">' + h(what) + '</b></div>' +
      '<div class="vtabs" role="tablist" aria-label="보기 선택">' + [['model', '기본 모델'], ['me', '내 아바타'], ['cmp', '원본과 비교']].map(function (t) { var use = (t[0] === 'model' && who() === 'base') || (t[0] === 'me' && who() === 'me'); return '<button type="button" role="tab" aria-selected="' + (v === t[0]) + '" class="' + (v === t[0] ? 'on' : '') + '" data-act="view" data-v="' + t[0] + '">' + t[1] + (use ? ' · 사용 중' : '') + '</button>'; }).join('') + '</div>' +
      '<div class="angles" role="group" aria-label="보는 방향">' + [['front', '앞모습'], ['side', '옆모습'], ['back', '뒷모습'], ['motion', '모션']].map(function (a) { var o = ui.angle === a[0]; return '<button type="button" class="' + (o ? 'on' : '') + '" aria-pressed="' + o + '" data-act="angle" data-v="' + a[0] + '">' + a[1] + '</button>'; }).join('') + '</div>' +
      '<div class="vbox' + (v === 'cmp' && front ? ' cmpbox' : '') + '" style="--z:' + z + '">' + fig + '</div>' + stageStatus(set, v === 'model' ? null : worn) + '</div>' + zoomHtml +
      '<div class="tools"><button type="button" class="tl" data-act="zoomStage">크게 보기</button>' + '<button type="button" class="tl" data-act="savePic">결과 저장</button><button type="button" class="tl" data-act="rpToggle" aria-controls="rpanel" aria-expanded="' + !ui.rpOff + '">' + (ui.rpOff ? '패널 펼치기' : '패널 접기') + '</button></div></section>';
    /* ----- 실측 핏 분석 (AI 이미지와 분리) ----- */
    var vd = fitVerdict(fr), active = res.filter(function (r) { return r.cat === ui.fitTab; })[0] || res[0] || null, parts = active && active.current ? active.current.parts : [];
    var names = BASE_CFG.gradeNames[active && active.cat === 'shoe' ? 'shoe' : 'body'];
    var aic = active ? imgCols(active.garment) : null;
    var partHtml = parts.map(function (p) {
      var idx = p.kind === 'circ' ? p.gradeIdx : GIDX[p.gradeKey], val2 = p.kind === 'circ' ? p.grade + ' ' + sgn(p.ease) + (p.unit || (active.cat === 'shoe' ? 'mm' : 'cm')) : p.text, pn = partName(aic, p);
      return '<div class="part"><div class="ph"><b>' + h(pn) + '</b><span class="muted">' + h(val2) + '</span></div><div class="segs" role="img" aria-label="' + h(pn + ' ' + val2) + '">' +
        [0, 1, 2, 3, 4].map(function (i) { return '<div class="seg' + (i === idx ? ' g-' + p.gradeKey : '') + '"></div>'; }).join('') + '</div></div>';
    }).join('');
    /* 구매하기: 링크가 있으면 실행 칸의 시작 버튼 옆 버튼(buy), 없거나 없어진 상품이면 그 아래 안내(buyNote) */
    var ag = active && active.garment, buy = '', buyNote = '';
    if (ag) {
      if (ag.gone) buyNote = '<p class="gone">이 상품은 현재 없는 것으로 보입니다</p>';
      else if (safeUrl(ag.url)) buy = '<a class="buy1" data-buyid="' + h(ag.id) + '" href="' + h(safeUrl(ag.url)) + '" target="_blank" rel="noopener noreferrer" aria-label="' + h(ag.name) + ' 구매하기">' + CATS[active.cat] + ' 구매하기' + ARROW + '</a>';
      else buyNote = '<p class="gone">이 ' + (active.cat === 'shoe' ? '신발' : '옷') + '은 구매 링크가 없어요. <button type="button" data-act="toCloset" data-cat="' + active.cat + '" style="color:inherit;font-weight:700;text-decoration:underline">' + (active.cat === 'shoe' ? '신발장에서 넣기' : '옷장에서 넣기') + '</button></p>';
    }
    var fitcard = '<section class="card2 fitcard" aria-label="핏 결과"><div class="ch"><h2>실측 기반 핏 분석</h2><small>AI 이미지와 별개 계산</small></div><div class="verdict"><small>' + (who() === 'base' ? '기본 모델(' + h(baseModel().name) + ') 치수와 옷 실측으로 계산한 결과' : '내 몸 치수와 옷 실측으로 계산한 결과') + '</small><span class="chip ' + vd.cls + '">' + h(vd.st) + '</span><b>' + h(vd.b) + '</b><span class="muted">' + h(vd.why) + '</span></div>' +
      (res.length ? '<div class="ftabs" role="tablist" aria-label="옷별 핏 보기">' + res.map(function (r) { var o = r === active; return '<button type="button" role="tab" aria-selected="' + o + '" class="' + (o ? 'on' : '') + '" data-act="fitTab" data-cat="' + r.cat + '">' + CATS[r.cat] + '</button>'; }).join('') + '</div>' : '') +
      (active ? '<div class="ph"><b>' + h(ag.name) + '</b><span class="muted">' + h(active.chosen || '') + '</span></div><div class="scale" aria-hidden="true">' + names.map(function (n) { return '<span>' + h(n) + '</span>'; }).join('') + '</div>' +
        (active.current && active.current.labelEst ? '<p class="note">실측표가 없어 표준 치수로 추정했어요. 실측표를 넣으면 정확해져요.</p>' : '') + partHtml + (active.recommended ? '<p class="note">추천 사이즈: <b>' + h(active.recommended) + '</b> (핏 스타일 ' + h((FSTYLE.filter(function (f) { return f[0] === (state.profile.pref || 'fit'); })[0] || FSTYLE[1])[1]) + ' 기준)</p>' : '') : '') +
      '<p class="note">추정 결과이며 실제 착용감을 보장하지 않습니다. 액세서리는 핏을 계산하지 않고 착용한 모습만 보여 줍니다.</p></section>';
    /* ----- 사이즈 비교 ----- */
    /* 2026-11-10: 착용 사진은 빼고 글자만. 넓은 화면(1800 이상)은 입은 모습 사진 오른쪽 칸(szin), 그보다 좁으면 아래 카드(sizecmp) — 둘 중 하나만 보인다(pc.css) */
    var sizecmp, szin;
    if (!active) {
      sizecmp = '<section class="card2 sizecmp" aria-label="사이즈 비교"><div class="ch"><h2>사이즈 비교</h2></div><p class="note">옷을 고르면 사이즈별 실측과 핏 판정을 나란히 보여 드려요.</p></section>';
      szin = '<aside class="szin" aria-label="사이즈 비교"><div class="szt"><b>사이즈 비교</b></div><p class="note">옷을 고르면 사이즈별 실측과 핏 판정을 보여 드려요.</p></aside>';
    } else {
      var unit = active.cat === 'shoe' ? 'mm' : 'cm';
      var szCards = (ag.sizes || []).map(function (row) {
        var e = (active.all || []).filter(function (x) { return x.size === row.label; })[0], st = sizeState(e), on = row.label === active.chosen, rec = row.label === active.recommended;
        return '<button type="button" class="szc' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="size" data-cat="' + active.cat + '" data-v="' + h(row.label) + '"><div class="szh"><b>' + h(row.label) + '</b>' + (on ? '<em>선택됨</em>' : rec ? '<em>추천</em>' : '') + '<span class="chip ' + st[0] + '">' + h(st[1]) + '</span></div>' +
          '<dl>' + (active.cat === 'shoe' && !E.num(row.inner) ? '<dt>표기 사이즈</dt><dd>' + h(row.label) + '</dd><dt>안쪽 길이 실측</dt><dd class="na">정보 없음</dd>' : (CMP_COLS[active.cat] || []).map(function (k) { var n = E.num(row[k]), c = n ? cmpCell(aic, ag, row, k, n, unit) : [aic && aic.name[k] || fieldLabel(ag, k)]; return '<dt>' + h(c[0]) + '</dt>' + (n ? '<dd>' + h(c[1]) + '</dd>' : '<dd class="na">정보 없음</dd>'); }).join('')) + '</dl></button>';
      }).join('');
      sizecmp = '<section class="card2 sizecmp" aria-label="사이즈 비교"><div class="ch"><h2>사이즈 비교 · ' + h(CATS[active.cat]) + ' ' + h(ag.name) + '</h2><small>누르면 그 사이즈로 바뀌어요</small></div><div class="szrow">' + szCards + '</div></section>';
      szin = '<aside class="szin" aria-label="사이즈 비교"><div class="szt"><b>사이즈 비교 · ' + h(CATS[active.cat]) + '</b><small title="' + h(ag.name) + '">' + h(ag.name) + ' · 누르면 그 사이즈로 바뀌어요</small></div><div class="szlist">' + szCards + '</div></aside>';
    }
    viewer = viewer.replace(/<\/section>$/, function () { return szin + '</section>'; });
    /* ----- 왼쪽 패널(입어볼 것) · 오른쪽 패널(핏 분석·핏 스타일·실행) ----- */
    var pref = state.profile.pref || 'fit';
    var rpanel = '<aside class="rpanel" id="rpanel" aria-label="입어볼 것">' +
      '<section class="card2" aria-label="캐릭터"><div class="ch"><h2>캐릭터</h2></div><div class="chr"><img src="' + h(avatarShow()) + '" alt=""><div class="sname"><small>' + (who() === 'base' ? '기본 모델 치수 기준 · ' + baseModel().h + 'cm ' + baseModel().w + 'kg' : myPic() ? '내 치수 기준 · 직접 올린 이미지' : '내 치수 기준 · 사진 없음') + '</small><b>' + (who() === 'base' ? h(baseModel().name) : '내 아바타') + '</b></div><button type="button" class="chbtn" data-act="go" data-page="body" aria-label="캐릭터 변경">변경</button></div></section>' +
      '<section class="card2" aria-label="고른 옷"><div class="ch"><h2>입어볼 것</h2></div><div class="ftabs fxTab" role="tablist" aria-label="입어볼 것 종류">' +
      '<button type="button" role="tab" aria-selected="' + (left === 'clothes') + '" class="' + (left === 'clothes' ? 'on' : '') + '" data-act="left" data-v="clothes">옷 ' + cc + '벌</button>' + (accOn() ? '<button type="button" role="tab" aria-selected="' + (left === 'acc') + '" class="' + (left === 'acc' ? 'on' : '') + '" data-act="left" data-v="acc">액세서리 ' + accs.length + '개</button>' : '') + '</div>' +
      '<div class="picks">' + (left === 'clothes' ? slots + '<p class="rule">종류마다 한 벌씩 입혀요. 원피스를 고르면 하의 칸은 빠지고, 상의는 원피스 위에 입혀져요.</p>' : accPane) + '</div>' +
      (left === 'clothes' ? '<button type="button" class="add" data-act="go" data-page="closet">옷장에서 다른 옷 고르기</button>' : '<button type="button" class="add" data-act="go" data-page="accessory">새 액세서리 저장</button>') +
      ((hasOuter && !(set.length === 3)) ? '<p class="amsg">' + NOT_YET + '</p>' : '') + '</section>' +
      '<button type="button" class="reset" data-act="resetSel"' + (genPending ? ' disabled' : '') + '>초기화</button><span class="savest">✓ 고른 내용은 자동 저장돼요</span></aside>';
    var fitside = '<aside class="fitside" aria-label="핏 분석과 실행">' + fitcard +
      '<section class="card2" aria-label="핏 스타일"><div class="ch"><h2>핏 스타일</h2><small>참고 옵션</small></div><div class="fstyle" role="group" aria-label="핏 스타일">' +
      FSTYLE.map(function (f) { var o = pref === f[0]; return '<button type="button" class="' + (o ? 'on' : '') + '" aria-pressed="' + o + '" data-act="fitStyle" data-v="' + f[0] + '">' + f[1] + '<small>' + f[2] + '</small></button>'; }).join('') +
      '</div><p class="rule">추천 사이즈와 핏 판정 기준이 바뀌어요. 입은 그림은 상품 사진의 핏대로 만들어져 이 선택으로 바뀌지 않아요.</p></section>' +
      '<section class="card2 runcard" aria-label="실행">' + (Core.genEnabled() ? '' : '<p class="demo" role="note">AI 입히기 서버가 연결되지 않은 데모 상태예요. 가상 피팅 시작을 눌러도 실제 결과는 만들어지지 않습니다.</p>') +
      '<div class="fstyle" role="group" aria-label="만들 방향" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:6px">' + ['front'].concat(ANGS).map(function (gv) { var ok = gv === 'front' || !!angSrc(gv), on = ok && !!(state.genViews || { front: true })[gv]; return '<button type="button" class="' + (on ? 'on' : '') + '" aria-pressed="' + on + '" data-act="genView" data-v="' + gv + '"' + (ok ? '' : ' disabled style="opacity:.45;cursor:not-allowed" title="' + h(angWhy(gv)) + '"') + '>' + ANG_NAME[gv] + '<small>' + (ok ? (on ? '만들기' : '안 만들기') : '사진 없음') + '</small></button>'; }).join('') + '</div><p class="rule" style="margin:0 0 8px">고른 방향마다 입어보기 1회씩 써요. 옆·뒷모습은 앞모습 다음에 하나씩 만들어요.</p>' +
      '<div class="runrow"><button type="button" class="wear" data-act="wear"' + (set.length && genViews().length && !genPending && !angBusy && Core.genEnabled() ? '' : ' disabled') + '>' + (genPending || angBusy ? '진행 중' + (angBusy && !genPending ? '(' + ANG_NAME[angBusy.view] + ')' : '') + '… 다른 걸 해도 돼요' : '가상 피팅 시작<small>' + h((label.join(' · ') || '고른 옷') + ' · ' + (genViews().length ? genViews().map(function (gv) { return ANG_NAME[gv]; }).join('·') + ' · 남은 횟수 ' + genViews().length + '회 사용' : '방향을 골라 주세요')) + '</small>') + '</button>' + buy + '</div>' + (accOn() ? '<div class="runrow"><button type="button" class="wear" data-act="wearAcc"' + (accs.length && wornNow() && !genPending && Core.genEnabled() ? '' : ' disabled') + '>' + (genPending ? '진행 중… 다른 걸 해도 돼요' : '액세서리 입히기<small>' + (accs.length ? '액세서리 ' + accs.length + '개 · 옷 입은 그림 위에' : '액세서리를 먼저 골라 주세요') + (accs.length > ACC_LIMIT ? ' (최대 ' + ACC_LIMIT + '개)' : '') + '</small>') + '</button></div>' : '') + buyNote + '</section></aside>';
    return '<main class="main fitmain"><div class="fitgrid' + (ui.rpOff ? ' rpoff' : '') + '">' + rpanel + viewer + sizecmp + fitside + '</div></main>';
  }

  /* ---------- 내 옷장 ---------- */
  /* 2026-11-10 밤: 옷 실측값이 보통 범위(cm, 단면 기준)를 벗어나면 저장 전에 확인한다(실제 시험: 원피스 총장 10 이 그대로 저장돼 미니로 그려짐).
     크롭·미니처럼 실제로 짧은 옷도 있으므로 막지 않고 묻기만 한다. 둘레로 넣은 옷은 가슴·허리·엉덩이·허벅지 등 단면 항목의 범위를 2배로 본다 */
  var SIZE_OK = {
    top: { chest: [25, 90], shoulder: [20, 75], length: [30, 130], sleeve: [3, 95], armhole: [10, 45], sleeve_width: [5, 40], hem: [20, 120] },
    outer: { chest: [25, 95], shoulder: [20, 80], length: [35, 150], sleeve: [3, 95], armhole: [10, 50], sleeve_width: [5, 45], hem: [20, 150] },
    inner: { chest: [25, 90], shoulder: [20, 75], length: [25, 130], sleeve: [0, 95], armhole: [10, 45], sleeve_width: [5, 40], hem: [20, 120] },
    dress: { chest: [25, 90], shoulder: [20, 75], waist: [20, 85], hip: [28, 95], length: [60, 165], sleeve: [3, 95], armhole: [10, 45], sleeve_width: [5, 40], hem: [20, 200] },
    bottom: { waist: [20, 85], hip: [28, 95], thigh: [15, 55], knee: [10, 45], rise: [15, 50], inseam: [3, 100], hem: [8, 150], length: [20, 125] },
    shoe: { inner: [150, 350] }
  };
  var HALF = { chest: 1, waist: 1, hip: 1, thigh: 1, knee: 1, hem: 1, armhole: 1, sleeve_width: 1 };
  function oddSizes(cat, measureType, sizes) {
    var ok = SIZE_OK[cat] || {}, out = [], circ = measureType === 'circ';
    sizes.forEach(function (z) {
      (FIELDS[cat] || []).forEach(function (x) {
        var k = x[0], r = ok[k], raw = z[k];
        if (!r || raw == null || String(raw).trim() === '') return;
        var v = Number(raw), m = circ && HALF[k] ? 2 : 1, lo = r[0] * m, hi = r[1] * m, nm = circ ? x[1].replace('단면', '둘레') : x[1], u = cat === 'shoe' ? '' : 'cm';
        if (!(v >= lo && v <= hi)) out.push('· ' + (z.label || '') + ' ' + nm + ' ' + raw + u + ' (보통 ' + lo + '~' + hi + u + ')');
      });
    });
    return out;
  }
  /* 2026-11-12 표 위 「계산 기준」 표시: 저장된 옷을 다시 열어도 단면/둘레 기준이 보이게. 기준과 다르게 계산하는 항목(이름을 「가슴둘레」로 고친 항목 등)은 따로 적는다 */
  function basisText(f) {
    var t = f.table, circ = f.measureType === 'circ', ex = [];
    t.keys.forEach(function (k, i) {
      var c = t.conv[i]; if (!k || !HALF[k] || !c) return;
      var u = c[0] / c[1] / (circ ? 2 : 0.5); /* 단위 환산만 남으면(1·인치 2.54·mm 0.1) 기준과 반대로 적힌 항목 */
      if ([1, 2.54, 0.1].some(function (x) { return Math.abs(u - x) < 0.001; })) ex.push(String(t.head[i]).trim());
    });
    return '계산 기준: ' + (circ ? '둘레 (가슴·허리 같은 항목을 한 바퀴 잰 값으로 계산)' : '단면 (가슴·허리 같은 항목을 펼쳐 놓고 잰 폭으로 계산)') +
      (ex.length ? ' · ' + ex.join(', ') + ' 항목은 ' + (circ ? '단면으로' : '둘레로') + ' 계산' : '');
  }
  function formTable(f) {
    var t = f.table;
    return '<p class="hint" id="tbasis" style="font-size:13px">' + h(basisText(f)) + '</p><div style="overflow-x:auto"><table class="imgt"><thead><tr><th scope="col">사이즈</th>' + t.head.map(function (x, ci) {
      return '<th scope="col"><button type="button" class="thx" data-act="colDel" data-i="' + ci + '" aria-label="' + h(x) + ' 항목 삭제" title="항목 삭제">✕</button><textarea rows="2" autocomplete="off" spellcheck="false" id="th' + ci + '" data-th="' + ci + '" title="' + h(x) + '" aria-label="항목 이름">' + h(x) + '</textarea><small class="tu" id="tu' + ci + '">' + (t.keys[ci] || !String(x).trim() ? '' : '계산 안 씀') + '</small></th>';
    }).join('') + '<th></th></tr></thead><tbody>' +
      t.rows.map(function (r, i) { return '<tr><td><input type="text" id="sl' + i + '" data-sl="' + i + '" value="' + h(r[0]) + '" aria-label="사이즈 이름"></td>' + t.head.map(function (x, ci) { return '<td><input type="text" inputmode="decimal" autocomplete="off" id="sf' + i + '_' + ci + '" data-sf="' + i + ':' + ci + '" value="' + h(r[ci + 1] == null ? '' : r[ci + 1]) + '" aria-label="' + h(r[0] + ' ' + x) + '"></td>'; }).join('') + '<td><button type="button" class="rm" style="min-width:32px;min-height:32px;padding:0" data-act="sizeDel" data-i="' + i + '" aria-label="사이즈 삭제">✕</button></td></tr>'; }).join('') +
      '</tbody></table></div><div class="lkacts" style="justify-content:flex-start"><button type="button" class="lk" data-act="sizeAdd">+ 사이즈 추가</button><button type="button" class="lk" data-act="colAdd">+ 항목 추가</button></div>' +
      '<p class="hint" style="font-size:13px">항목 이름과 숫자는 사이즈표에 적힌 그대로 넣어요. 「계산 안 씀」 항목은 표에만 남고 핏 계산에는 쓰지 않아요.</p>';
  }
  /* 항목 이름을 고쳤을 때: 그 이름으로 핏 계산에 쓸 칸을 다시 찾는다(같은 칸이면 AI 가 정한 환산은 그대로) */
  function headKey(ci) {
    var f = ui.cf, t = f.table; if (!t || t.head[ci] == null) return;
    var taken = {}; t.keys.forEach(function (k, i) { if (k && i !== ci) taken[k] = 1; });
    if (!t.k0) { t.k0 = t.keys.slice(); t.c0 = t.conv.slice(); } /* 처음(AI 가 읽었을 때·저장돼 있던) 칸과 환산: 이름을 고쳤다가 같은 칸으로 돌아오면 그 환산을 다시 쓴다 */
    var r = FitNotes.tblResolve(t.head[ci], f.cat, f.measureType, taken, FIELDS[f.cat]);
    if (r) { t.conv[ci] = r.conv || (r.key === t.k0[ci] ? t.c0[ci] : null); t.keys[ci] = r.key; } else { t.keys[ci] = null; t.conv[ci] = null; }
    var e = document.getElementById('tu' + ci); if (e) e.textContent = t.keys[ci] || !String(t.head[ci]).trim() ? '' : '계산 안 씀';
    var b = document.getElementById('tbasis'); if (b) b.textContent = basisText(f);
  }
  function closetForm(modal) {
    var f = ui.cf, fs = FIELDS[f.cat], circ = f.measureType === 'circ';
    var table = f.table ? formTable(f) : '<div style="overflow-x:auto"><table><thead><tr><th scope="col">사이즈</th>' + fs.map(function (x) { return '<th scope="col">' + h(circ ? x[1].replace('단면', '둘레') : x[1]).replace(/(.)(단면|둘레)$/, '$1<br>$2').replace(/\s*\(/, '<br>(') + '</th>'; }).join('') + '<th></th></tr></thead><tbody>' +
      f.sizes.map(function (z, i) { return '<tr><td><input type="text" id="sl' + i + '" data-sl="' + i + '" value="' + h(z.label) + '" aria-label="사이즈 이름"></td>' + fs.map(function (x) { return '<td><input type="text" inputmode="decimal" autocomplete="off" id="sf' + i + x[0] + '" data-sf="' + i + ':' + x[0] + '" value="' + h(z[x[0]] == null ? '' : z[x[0]]) + '" aria-label="' + h(z.label + ' ' + x[1]) + '"></td>'; }).join('') + '<td><button type="button" class="rm" style="min-width:32px;min-height:32px;padding:0" data-act="sizeDel" data-i="' + i + '" aria-label="사이즈 삭제">✕</button></td></tr>'; }).join('') + '</tbody></table></div><button type="button" class="lk" data-act="sizeAdd">+ 사이즈 추가</button>';
    var sh = f.cat === 'shoe', ttl = f.id ? '입력한 값 · 수정' : sh ? '새 신발 추가' : '새 옷 추가';
    return (modal ? '<div class="cfmodal"><div class="cfback" data-act="cfCancel"></div><div class="cfbox" role="dialog" aria-modal="true" aria-label="' + ttl + '">' : '') + '<aside class="pan fxR' + (modal ? ' inmodal' : '') + '" style="flex:1 1 340px" aria-label="' + ttl + '"><div class="cfh"><h2>' + ttl + '</h2>' + (modal ? '<button type="button" class="thx" data-act="cfCancel" aria-label="닫기" title="닫기">✕</button>' : '') + '</div>' +
      '<div class="dz' + (f.sizeDone ? ' done' : '') + '" id="dzsize" tabindex="0" data-dz="size">' + (f.sizeUrl ? '<img class="szimg" src="' + h(f.sizeUrl) + '" alt="저장한 사이즈표 이미지" title="눌러서 크게 보기" data-act="zoomSize" style="display:block;max-width:100%;max-height:200px;margin:0 auto 6px;border-radius:8px;cursor:zoom-in">' : '') + '<b>① 사이즈표 캡처</b><span data-ocr="size">' + h(f.sizeMsg || '') + (f.sizeMsg ? '' : '끌어다 놓거나 이 칸을 누른 뒤 <kbd>Ctrl</kbd> + <kbd>V</kbd>. 값을 자동으로 읽어요.') + '</span><div class="dzacts" style="justify-content:flex-start;margin-top:6px"><label class="fbtn" title="사진 파일 선택" style="border:0;background:none;min-height:30px;padding:0 6px;font-size:17px;line-height:1"><span aria-hidden="true">+</span><input type="file" accept="image/*" data-file="sizeCap" aria-label="사이즈표 사진 파일 선택"></label></div></div>' + table +
      '<div class="dz' + (f.photo ? ' done' : '') + '" id="dzphoto" tabindex="0" data-dz="photo">' + (f.photo ? '<img src="' + h(f.photo) + '" alt="넣은 상품 사진 미리 보기">' : '') + '<b>② 상품 사진 캡처</b><span data-ocr="photo">' + h(f.photoMsg || '') + (f.photoMsg ? '' : '끌어다 놓거나 <kbd>Ctrl</kbd> + <kbd>V</kbd> 로 붙여넣기. 이름과 가격도 자동으로 채워요.') + '</span><div class="dzacts" style="justify-content:flex-start;margin-top:6px"><label class="fbtn" title="' + (f.photo ? '다른 사진 선택' : '사진 파일 선택') + '" style="border:0;background:none;min-height:30px;padding:0 6px;font-size:17px;line-height:1"><span aria-hidden="true">+</span><input type="file" accept="image/*" data-file="photo" aria-label="상품 사진 파일 선택"></label></div></div>' +
      (f.cat === 'shoe' || !linkReadOn() ? '' : '<div class="dz' + (f.detailDone ? ' done' : '') + '" id="dzdetail" tabindex="0" data-dz="detail"><b>③ 상세 이미지 (선택)</b><span>' + h(f.detailMsg || '') + (f.detailMsg ? '' : '소재·혼용률이 있는 상세 캡처를 끌어다 놓거나 <kbd>Ctrl</kbd> + <kbd>V</kbd>. 원단 선택을 자동으로 채워요.') + '</span><div class="dzacts" style="justify-content:flex-start;margin-top:6px"><label class="fbtn" title="사진 파일 선택" style="border:0;background:none;min-height:30px;padding:0 6px;font-size:17px;line-height:1"><span aria-hidden="true">+</span><input type="file" accept="image/*" data-file="detailCap" aria-label="상세 이미지 파일 선택"></label></div></div>') +
      '<label for="pkind">' + (sh ? '종류 (신발)' : '옷 종류') + '<select id="pkind" data-chg="cfCat">' + CAT_ORDER.map(function (c) { return '<option value="' + c + '"' + (f.cat === c ? ' selected' : '') + '>' + CATS[c] + '</option>'; }).join('') + '</select></label>' +
      (sh ? '' : '<p class="hint">' + ({ outer: '겉옷: 재킷·코트·카디건처럼 맨 겉에 입는 옷', inner: '이너: 상의 위·겉옷 안쪽에 겹쳐 입는 조끼·니트 베스트 등', top: '상의: 티셔츠·셔츠·블라우스·니트', bottom: '하의: 바지·치마', dress: '원피스: 원피스·드레스' }[f.cat] || '') + '</p>') +
      (f.cat === 'shoe' ? '' : '<label for="pkindk">용도 (선택)<select id="pkindk" data-chg="cfKind"><option value="">자동으로 정하기</option>' + KINDS.map(function (k) { return '<option value="' + k[0] + '"' + (f.kind === k[0] ? ' selected' : '') + '>' + h(k[1]) + '</option>'; }).join('') + '</select></label>') +
      /* 2026-11-12 사용자 결정(1번): 원단 4종(핏 계산 fit-config·서버 입히기 문장이 이미 아는 값만) 고르는 칸 */
      (f.cat === 'shoe' ? '' : '<label for="pfab">원단 (선택)<select id="pfab" data-chg="cfFab">' + Object.keys(cfgNow().fabric).map(function (k) { return '<option value="' + k + '"' + ((f.fabric || 'normal') === k ? ' selected' : '') + '>' + h(cfgNow().fabric[k].label + (k === 'normal' ? ' (모르면 그대로)' : '')) + '</option>'; }).join('') + '</select></label><p class="hint">' + (f.material ? '상품 페이지 소재: ' + h(f.material) + ' · ' : '') + '스판·니트는 늘어나서 조금 작아도 덜 끼고, 데님은 안 늘어나 더 끼게 계산해요.</p>') +
      '<label for="pname">' + (sh ? '신발 이름' : '옷 이름') + '<input id="pname" type="text" data-cf="name" value="' + h(f.name) + '" maxlength="60"></label>' +
      '<label for="pshort">짧은 이름 (화면 표시용, 비우면 자동)<input id="pshort" type="text" data-cf="short" value="' + h(f.short || '') + '" placeholder="' + h(shortName({ name: f.name, cat: f.cat })) + '" maxlength="14"></label>' +
      (sh ? '<label for="pheel">굽 높이 (mm, 선택)<input id="pheel" type="text" inputmode="decimal" autocomplete="off" data-cf="heel" placeholder="예: 70 (운동화 20~30, 구두 50~90)" value="' + h(f.heel == null ? '' : f.heel) + '" maxlength="3"></label>' : '') + '<label for="pprice">가격<input id="pprice" type="text" data-cf="price" value="' + h(f.price) + '"></label><label for="purl">상품 링크 (선택)<input id="purl" type="url" data-cf="url" placeholder="https://..." value="' + h(f.url) + '"></label>' +
      (linkReadOn() ? '<button type="button" class="lk" data-act="linkRead"' + (f.linkBusy ? ' disabled' : '') + '>' + (f.linkBusy ? '읽는 중…' : '링크에서 이름·가격 가져오기') + '</button>' : '') +
      '<p class="hint">상품 주소를 넣으면 ' + (sh ? '신발' : '옷') + ' 카드에 구매하기가 생겨요.</p>' + (f.err ? '<p class="gone" role="alert">' + h(f.err) + '</p>' : '') + (f.saved ? '<p class="ok" role="status">저장했어요.</p>' : '') +
      '<button type="button" class="save" data-act="cfSave">' + (f.id ? '수정 저장' : sh ? '신발장에 저장' : '옷장에 저장') + '</button>' + (f.id ? '<div class="lkacts"><button type="button" class="lk" data-act="cfCancel">닫기</button><button type="button" class="lk" data-act="delItem" data-id="' + h(f.id) + '" style="color:var(--errText)">' + (sh ? '신발 삭제' : '옷 삭제') + '</button></div>' : '') + '</aside>' + (modal ? '</div></div>' : '');
  }
  function viewCloset() {
    var modalOn = !ui.cf.id && (ui.cfModal || !!(ui.cf.photo || ui.cf.name || ui.cf.sizeDone)); if (ui.cf.id) ui.cfModal = false;
    var cat = ui.closetCat, all = state.closet.filter(function (x) { return x.cat === cat; });
    var kc = {}; all.forEach(function (x) { if (x.kind) kc[x.kind] = (kc[x.kind] || 0) + 1; });
    var kindNow = ui.closetKind !== 'all' && kc[ui.closetKind] ? ui.closetKind : 'all', list = all.filter(function (x) { return kindNow === 'all' || x.kind === kindNow; });
    var kindChips = Object.keys(kc).length ? '<div class="kchips" role="group" aria-label="용도로 걸러 보기"><button type="button" class="' + (kindNow === 'all' ? 'on' : '') + '" aria-pressed="' + (kindNow === 'all') + '" data-act="closetKind" data-v="all">전체 ' + all.length + '</button>' + KINDS.filter(function (k) { return kc[k[0]]; }).map(function (k) { return '<button type="button" class="' + (kindNow === k[0] ? 'on' : '') + '" aria-pressed="' + (kindNow === k[0]) + '" data-act="closetKind" data-v="' + k[0] + '">' + KIND_NAME[k[0]] + ' ' + kc[k[0]] + '</button>'; }).join('') + '</div>' : '';
    var chips = CAT_ORDER.filter(got).map(function (c) { var it = got(c), s = state.sel[c], r = evalOne(it, s.size); return '<button type="button" class="pc" aria-label="' + h(it.name) + ' 빼기" data-act="unsel" data-cat="' + c + '"><small>' + CATS[c] + '</small>' + h(it.name) + ' ' + h(s.size || (r && r.chosen) || '') + ' ×</button>'; }).join(''), n = CAT_ORDER.filter(got).length;
    /* 2026-11-12 A안: 목록(용도 칩·옷 카드·고른 옷 줄·안내)을 카드(fxCard) 하나로 감싼다. 탭은 카드 위 */
    return '<main class="main mflex"><div class="col fxL" style="flex:3 1 560px"><div class="tabs fxTab" role="tablist" aria-label="옷 종류">' +
      CAT_ORDER.map(function (c) { return '<button type="button" role="tab" aria-selected="' + (cat === c) + '" class="' + (cat === c ? 'on' : '') + '" data-act="closetCat" data-cat="' + c + '">' + CATS[c] + (got(c) ? ' 1' : '') + '</button>'; }).join('') + '</div><div class="fxCard"><div class="cfadd"><button type="button" class="lk" data-act="cfNew">' + (cat === 'shoe' ? '+ 새 신발 추가' : '+ 새 옷 추가') + '</button></div>' + kindChips + '<div class="grid4">' +
      (list.length ? list.map(function (it) {
        var s = state.sel[cat], on = !!(s && s.id === it.id), r = evalOne(it, on ? s.size : null), g = r && r.current && r.current.primary, sub = r && r.chosen ? (on ? '' : '추천 ') + r.chosen + (g ? ' · ' + g.grade : '') : (it.sizes || []).map(function (z) { return z.label; }).join(' ');
        if (it.cat === 'shoe' && E.num(it.heel)) sub += (sub ? ' · ' : '') + '굽 ' + it.heel + 'mm';
        return '<div class="tile' + (on ? ' on' : '') + (it.kind === 'under' ? ' nowear' : '') + '">' + (it.kind && KIND_NAME[it.kind] ? '<span class="kb' + (it.kind === 'under' ? ' u' : '') + '">' + KIND_NAME[it.kind] + (it.kind === 'under' ? ' · 입히기 제외' : '') + '</span>' : '') + '<button type="button" class="pick" aria-pressed="' + on + '" data-act="pickItem" data-id="' + h(it.id) + '">' + (it.photo ? '<img src="' + h(it.photo) + '" alt="" class="' + posOf(it) + '">' : '<span class="noimg" aria-hidden="true">' + SHIRT + '</span>') + (on ? '<span class="chk">고름</span>' : '') + '<span class="tb"><b>' + h(it.name) + '</b><span>' + h(sub) + '</span></span></button><div class="bf">' + buyArea(it, 'c') + exArea(it) + '<button type="button" class="lk" data-act="editItem" data-id="' + h(it.id) + '">수정</button></div></div>';
      }).join('') : '<p class="hint">' + (kindNow !== 'all' ? KIND_NAME[kindNow] + ' 옷이 없어요.' : CATS[cat] + '이(가) 아직 없어요. 「' + (cat === 'shoe' ? '+ 새 신발 추가' : '+ 새 옷 추가') + '」를 눌러 주세요.') + '</p>') + '</div>' +
      '<div class="bar"><div class="picked"><b>' + (n ? '옷 ' + n + '벌' : '고른 옷 없음') + '</b>' + chips + '</div>' + (n ? '<button type="button" class="go2" data-act="go" data-page="fitting">한 번에 입어보기</button>' : '') + '</div>' +
      '<p class="hint">종류마다 한 벌씩 골라요. 겉옷과 상의를 함께 고르면 상의가 겉옷 안쪽으로 입혀지고, 원피스를 고르면 하의는 빠지고, 상의는 원피스 위에 입혀져요. 신발은 한 켤레만 골라 신어볼 수 있고 굽 높이도 적어 둘 수 있어요. 액세서리는 액세서리 메뉴에 따로 저장해요.</p></div></div>' + (modalOn ? closetPlaceholder() + closetForm(true) : ui.cf.id ? closetForm(false) : closetPlaceholder()) + '</main>';
  }
  /* 2026-11-13 옷장: 새 옷은 창으로 추가, 옷을 누르면 입력한 값이 오른쪽에 보인다 */
  function closetPlaceholder() {
    return '<aside class="pan fxR" style="flex:1 1 340px" aria-label="입력한 값"><h2>입력한 값</h2><p class="hint">옷을 누르면 입력한 사이즈표·이름·가격이 여기에 보여요. 값은 여기서 바로 고칠 수 있어요.</p><button type="button" class="save" data-act="cfNew">+ 새 옷 추가</button></aside>';
  }
  function cfLoad(it) {
    ui.cf = Object.assign(blankForm(it.cat), JSON.parse(JSON.stringify(it)));
    ui.cf.table = it.cat !== 'shoe' && window.FitNotes && FitNotes.tblSync ? FitNotes.tblSync(it, FIELDS[it.cat]) : null;
    if (it.hasSize) blobGet('gsize:' + it.id).catch(function () { return null; }).then(function (b) { if (b && ui.cf && ui.cf.id === it.id && !ui.cf.sizeUrl) { ui.cf.sizeUrl = URL.createObjectURL(b); render(); } });
  }

  /* ---------- 액세서리 ---------- */
  function viewAccessory() {
    var tab = ui.accTab, f = ui.af, list = state.accs.filter(function (x) { return tab === 'all' || (ACC_TYPES[x.type] || {}).part === tab; }), accs = selAccs();
    return '<main class="main mflex"><div class="col fxL" style="flex:3 1 560px"><div class="tabs fxTab" role="tablist" aria-label="착용 부위">' +
      ACC_TABS.map(function (t) { return '<button type="button" role="tab" aria-selected="' + (tab === t[0]) + '" class="' + (tab === t[0] ? 'on' : '') + '" data-act="accTab" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div class="fxCard"><div class="grid4">' +
      (list.length ? list.map(function (it) {
        var on = state.accSel.indexOf(it.id) >= 0, t = ACC_TYPES[it.type] || {}, sub = [it.type, priceText(it.price) || it.price || (t.small ? '크게 보기로 확인' : '전신에서 잘 보여요')].join(' · ');
        return '<div class="tile acc' + (on ? ' on' : '') + '"><button type="button" class="pick" aria-pressed="' + on + '" data-act="accToggle" data-id="' + h(it.id) + '">' + (it.photo ? '<img src="' + h(it.photo) + '" alt="">' : '<span class="noimg" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="' + (t.icon || '') + '"></path></svg></span>') + (on ? '<span class="chk">고름</span>' : '') + '<span class="tb"><b>' + h(it.name) + '</b><span>' + h(sub) + '</span></span></button><div class="bf">' + buyArea(it, 'a') + '<button type="button" class="lk" data-act="accEdit" data-id="' + h(it.id) + '">수정</button><button type="button" class="lk" data-act="accDel" data-id="' + h(it.id) + '">삭제</button></div></div>';
      }).join('') : '<p class="hint">저장한 액세서리가 없어요. 오른쪽에서 사진을 넣어 저장해 주세요.</p>') + '</div>' +
      '<div class="bar"><div class="picked"><b>' + (accs.length ? '착용할 액세서리 ' + accs.length + '개' : '고른 액세서리 없음') + '</b>' + accs.map(function (a) { return '<button type="button" class="pc" aria-label="' + h(a.name) + ' 빼기" data-act="accToggle" data-id="' + h(a.id) + '"><small>' + h(a.type) + '</small>' + h(a.name) + ' ×</button>'; }).join('') + '</div>' + (accs.length ? '<button type="button" class="go2" data-act="toFitAcc">피팅룸에서 착용하기</button>' : '') + '</div>' +
      '<p class="hint">여기는 액세서리를 저장해 두는 곳이에요. 10개까지 골라 피팅룸에서 옷과 함께 착용합니다.</p>' + (ui.accFull ? '<p class="gone" role="status">액세서리는 10개까지 고를 수 있어요. 하나를 뺀 뒤 다시 골라 주세요.</p>' : '') + '</div></div>' +
      '<aside class="pan fxR" style="flex:1 1 340px" aria-label="' + (f.id ? '액세서리 수정' : '새 액세서리 저장') + '"><h2>' + (f.id ? '액세서리 수정' : '새 액세서리 저장') + '</h2><div class="dz center' + (f.photo ? ' done' : '') + '" tabindex="0" data-dz="acc" aria-label="액세서리 사진 넣는 칸. 사진을 끌어다 놓거나 붙여넣기">' + (f.photo ? '<img src="' + h(f.photo) + '" alt="넣은 액세서리 사진 미리 보기">' : '<b>상품 사진</b><span>끌어다 놓거나 이 칸을 누른 뒤 <kbd>Ctrl</kbd> + <kbd>V</kbd></span>') +
      '<div class="dzacts"><label class="fbtn" title="' + (f.photo ? '다른 사진 선택' : '사진 파일 선택') + '" style="border:0;background:none;min-height:30px;padding:0 6px;font-size:17px;line-height:1"><span aria-hidden="true">+</span><input type="file" accept="image/*" data-file="accPhoto" aria-label="액세서리 사진 파일 선택"></label>' + (f.photo ? '<button type="button" class="lk" data-act="afClear">사진 빼기</button>' : '') + '</div></div>' +
      '<label for="atype">종류<select id="atype" data-chg="afType">' + Object.keys(ACC_TYPES).map(function (k) { return '<option' + (f.type === k ? ' selected' : '') + '>' + h(k) + '</option>'; }).join('') + '</select></label>' +
      '<label for="aname">이름<input id="aname" type="text" data-af="name" placeholder="예: 블랙 버킷햇" value="' + h(f.name) + '"></label><label for="aprice">가격 (선택)<input id="aprice" type="text" data-af="price" placeholder="예: 29,000원" value="' + h(f.price) + '"></label><label for="aurl">상품 링크 (선택)<input id="aurl" type="url" data-af="url" placeholder="https://..." value="' + h(f.url) + '"></label>' +
      '<p class="hint">사이즈표는 필요 없어요. 상품 주소를 넣으면 카드에 구매하기가 생겨요.</p>' + (f.err ? '<p class="gone" role="alert">' + h(f.err) + '</p>' : '') + (f.saved ? '<p class="ok" role="status">저장했어요.</p>' : '') + '<button type="button" class="save" data-act="afSave">' + (f.id ? '수정 저장' : '액세서리 저장') + '</button>' + (f.id ? '<button type="button" class="lk" data-act="afCancel">수정 취소</button>' : '') + '</aside></main>';
  }

  /* ---------- 입어본 기록 ---------- */
  function histList() {
    var looks = Object.keys(state.looks || {}).filter(function (k) { return urls.tryon[k] && lookItems(k).length; }).map(function (k) { return { key: k, items: lookItems(k) }; });
    return looks.concat(state.closet.filter(function (x) { return urls.tryon[x.id]; }).map(function (x) { return { key: x.id, items: [x] }; }));
  }
  /* 2026-11-13 입어본 기록: 입은 사이즈(만들 때 저장한 state.lookSize)와 그 사이즈의 옷 치수(내 옷장 표)를 보여 준다 */
  function lookSizeOf(key, it) { var t = state.lookSize && state.lookSize[key]; return t && typeof t === 'object' && t[it.id] ? String(t[it.id]) : ''; } /* lookSize[그림 키] = { 옷 id: 사이즈 이름 } */
  /* 2026-11-19 사용자 지시: 옷 카드 아래 한 줄 글 대신, 카드 안에 입은 사이즈의 치수를 표(항목·치수)로. 사이즈표가 저장된 옷은 표에 적힌 이름·숫자 그대로(피팅룸 사이즈 카드와 같은 cmpCell), 없는 옷·신발은 앱 기본 이름 */
  function lookSizeTable(key, it) {
    var lb = lookSizeOf(key, it); if (!lb) return '';
    var z = (it.sizes || []).filter(function (r) { return String(r.label) === lb; })[0]; if (!z) return '';
    var unit = it.cat === 'shoe' ? 'mm' : 'cm', ic = imgCols(it), t = null, rows = [];
    if (ic && ic.rows[lb]) { try { t = FitNotes.tblSync(it, FIELDS[it.cat]); } catch (e) { t = null; } }
    var cmOnly = !!t && it.cat !== 'shoe' && !(t.conv || []).some(function (cv) { return cv && cv[0] !== 1 && cv[0] !== 2; });
    if (t) t.head.forEach(function (nm, i) {
      nm = String(nm == null ? '' : nm).trim(); var cell = String(ic.rows[lb][i + 1] == null ? '' : ic.rows[lb][i + 1]).trim(); if (!nm || !cell || /^[-–—\/.·~\s]+$/.test(cell)) return; /* 「-」·「/」처럼 값이 없는 칸은 줄을 만들지 않는다 */
      var k = t.keys[i], n = k && ic.ci[k] === i ? E.num(z[k]) : 0;
      /* 계산에 안 쓰는 칸(예: 자켓의 허리): 숫자만 적힌 cm 표의 칸이면 cm 를 붙이고, 체중·키 같은 칸과 글자가 섞인 칸은 적힌 그대로 */
      var r = n ? cmpCell(ic, it, z, k, n, unit) : [nm, cmOnly && /^\d+(\.\d+)?$/.test(cell) && /길이|기장|총장|둘레|단면|너비|넓이|폭|밑위|밑단|소매|어깨|가슴|허리|엉덩이|허벅지|팔뚝|암홀/.test(nm) && !/kg|체중|몸무게|inch|인치/i.test(nm) ? cell + unit : cell];
      if (/cm$/.test(r[1])) r[0] = r[0].replace(/\s*\(\s*cm\s*\)$/i, '');
      rows.push(r);
    });
    else (FIELDS[it.cat] || []).forEach(function (f) {
      var v = z[f[0]]; if (v == null || String(v).trim() === '') return;
      var n = E.num(v); rows.push([fieldLabel(it, f[0]).replace(/\s*\(mm\)$/, ''), n ? n + unit : String(v)]);
    });
    if (!rows.length) return '';
    return '<table class="lstb" aria-label="' + h((CATS[it.cat] || '') + ' ' + lb + ' 사이즈 치수') + '"><tbody>' + rows.map(function (r) { return '<tr><th scope="row">' + h(r[0]) + '</th><td>' + h(r[1]) + '</td></tr>'; }).join('') + '</tbody></table>';
  }
  function viewHistory() {
    var list = histList(), cur = list.filter(function (e) { return e.key === ui.cmp; })[0] || list[0] || null;
    return '<main class="main mflex"><div class="col fxL" style="flex:2 1 420px"><div class="fxCard"><p class="sub">옷이나 옷 조합마다 마지막으로 입힌 모습 한 장이 저장돼요.</p>' +
      (list.length ? '<div class="grid3">' + list.map(function (e) {
        var on = cur === e, title = e.items.map(shortLabel).join(' + ');
        /* 2026-11-19 사용자 지시: 작은 그림 아래 옷 이름·구매하기 없앰(마우스를 올리면 짧은 이름), 내용은 오른쪽 큰 그림 옆으로 */
        return '<div class="card hcard' + (on ? ' on' : '') + '" title="' + h(title) + '"><button type="button" class="pick" aria-label="' + h(title) + ' 크게 보기" aria-pressed="' + on + '" data-act="histPick" data-id="' + h(e.key) + '"><img src="' + urls.tryon[e.key] + '" alt=""></button></div>';
      }).join('') + '</div>' : '<p class="hint">아직 입어본 기록이 없어요. 피팅룸에서 입어 보면 여기에 쌓여요.</p>') + '</div></div>' +
      (cur ? '<aside class="cmp fxR hdet" style="flex:3 1 620px;max-width:none" aria-label="고른 기록"><figure><img src="' + urls.tryon[cur.key] + '" alt="입은 모습 (눌러서 크게 보기)" role="button" tabindex="0" class="zoomimg" data-act="histZoom" data-id="' + h(cur.key) + '"></figure>' +
        '<div class="hinfo"><h2>입은 옷 ' + cur.items.length + '벌</h2>' + cur.items.map(function (i) {
          var lb = lookSizeOf(cur.key, i);
          return '<div class="hit"><small>' + h(CATS[i.cat] || '') + (lb ? ' · ' + h(lb) + ' 사이즈' : '') + '</small><b title="' + h(i.name) + '">' + h(shortName(i)) + '</b>' + lookSizeTable(cur.key, i) + (i.gone ? '<p class="gone">이 상품은 현재 없는 것으로 보입니다</p>' : safeUrl(i.url) ? buyHtml(i, 'buy') : '') + '</div>';
        }).join('') +
        '<div class="acts hacts"><button type="button" class="b pri" data-act="histShow" data-id="' + h(cur.key) + '">피팅룸에서 보기</button><button type="button" class="b d" data-act="histDel" data-id="' + h(cur.key) + '">삭제</button></div></div></aside>' : '') + '</main>';
  }

  /* 2026-11-12 로그인 화면 로고: 옷걸이 마크 + 두 색 글자(FIT + ON) */
  var LOGO_MARK = '<span class="lgmark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7.5a2.2 2.2 0 1 1 2.2-2.2c0 1.4-2.2 1.5-2.2 3.2v1l8.2 5.4a1.2 1.2 0 0 1-.7 2.2H4.5a1.2 1.2 0 0 1-.7-2.2L12 9.5"></path></svg></span><span>FIT<i>ON</i></span>';

  /* ---------- 내 몸 정보 ---------- */
  function viewBody() {
    /* 2026-11-12 「기본 모델」·「내 아바타」 두 탭. 탭은 보기만 바꾸고, 「사용 중」 표시가 붙은 쪽으로 입어본다(기본 모델은 모델을 누르면, 내 아바타는 내 치수를 「저장」하면 바뀜. 「…로 입어보기」 버튼은 없앰) */
    var p = state.profile, m = p.m || {}, w = who(), tab = ui.bodyTab === 'base' || ui.bodyTab === 'me' ? ui.bodyTab : w, b = baseModel();
    var nowName = w === 'base' ? '기본 모델 · ' + b.name : '내 아바타';
    var head = '<section class="pan" style="flex:1 1 100%" aria-label="입어볼 캐릭터 선택"><h2>입어볼 캐릭터</h2><p class="sub">지금 입어보는 캐릭터: <b style="color:var(--pri)">' + h(nowName) + '</b>. 핏 계산도 이쪽 치수로 해요.</p>' +
      '<div class="segtoggle fxTab" role="group" aria-label="캐릭터 종류">' + [['base', '기본 모델'], ['me', '내 아바타']].map(function (t) { return '<button type="button" class="' + (tab === t[0] ? 'on' : '') + '" aria-pressed="' + (tab === t[0]) + '" data-act="bTab" data-v="' + t[0] + '">' + t[1] + (w === t[0] ? ' · 사용 중' : '') + '</button>'; }).join('') + '</div></section>';
    if (tab === 'base') {
      var ro = function (label, val, unit) { return '<label>' + label + '<span class="in"><input type="text" value="' + h(val) + '" readonly aria-readonly="true" tabindex="-1" style="opacity:.85">' + (unit ? '<small>' + unit + '</small>' : '') + '</span></label>'; };
      return '<main class="main mflex">' + head + '<section class="pan fxL fxBody" style="flex:1 1 340px" aria-label="기본 모델"><h2>기본 모델</h2>' +
        /* 2026-11-18 기본 모델도 내 아바타처럼 앞·옆·뒷모습 3장을 같은 크기로 나란히. 옆·뒤 사진은 기본 여성·남성만 있음(assets/avatar_<default|male>_side/back.jpg), 연령대 모델은 「없음」 칸 */
        '<div style="grid-column:1 / -1;display:grid;grid-template-columns:repeat(3,minmax(0,300px));gap:14px">' + ['front'].concat(ANGS).map(function (av) {
          var src = av === 'front' ? b.img : b.ang ? b.ang[av] : b.preset ? '' : 'assets/avatar_' + (b.id === 'male' ? 'male' : 'default') + '_' + av + '.jpg?v=t';
          return '<div style="display:flex;flex-direction:column;gap:8px;min-width:0">' + (src ? '<img class="av zoomimg" role="button" tabindex="0" data-act="bodyZoom" title="눌러서 크게 보기" src="' + h(src) + '" alt="' + h(b.name) + ' ' + ANG_NAME[av] + ' 전신" style="max-width:none;object-fit:' + (b.preset ? 'contain' : 'cover') + ';background:#fff">' : '<div class="av" style="max-width:none;border:1px dashed var(--line);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:14px">' + ANG_NAME[av] + ' 없음</div>') + '<div style="text-align:center;font-size:14px;font-weight:700">' + ANG_NAME[av] + '</div></div>';
        }).join('') + '</div><p class="sub" style="grid-column:1 / -1">아래에서 모델을 누르면 그 모델로 입어봐요. 내 아바타와 내 치수는 바뀌지 않아요.</p>' +
        '<div class="fxMods" style="grid-column:1 / -1;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px">' +
        BASES.map(function (x) { var on = x.id === b.id; return '<button type="button" class="lk" style="padding:4px;border-style:solid;' + (on ? 'border-color:var(--pri);box-shadow:0 0 0 1px var(--pri);color:var(--pri);' : '') + 'display:flex;flex-direction:column;align-items:center;gap:4px;font-size:13px" aria-pressed="' + on + '" data-act="bPreset" data-id="' + x.id + '" aria-label="' + x.name + ' 기본 모델 고르기"><img src="' + h(x.img) + '" alt="" style="width:100%;aspect-ratio:9/16;object-fit:' + (x.preset ? 'contain' : 'cover') + ';border-radius:8px;background:#fff">' + x.name + (on ? ' ✓' : '') + '</button>'; }).join('') + '</div></section>' +
        '<section class="pan fxR" style="flex:2 1 520px" aria-label="기본 모델 치수"><h2>' + h(b.name) + ' 치수</h2><p class="sub">읽기 전용이에요. ' + (b.ang ? '키 ' + b.h + 'cm·몸무게 ' + b.w + 'kg 기준' : '한국 ' + (b.preset ? h(b.name.replace(/(남성|여성)$/, ' $1')) : '20대 ' + (b.g === 'male' ? '남성' : '여성')) + ' 평균') + ' 가정치이며, 기본 모델로 입어볼 때는 이 치수로 핏을 계산해요.</p>' +
        '<div class="g3">' + ro('성별', b.g === 'male' ? '남성' : '여성', '') + ro('키', b.h, 'cm') + ro('몸무게', b.w, 'kg') + '</div><h2>자세한 치수</h2><div class="g3">' +
        MFIELDS.map(function (f, i) { return ro(f[1], b.m[i], f[2]); }).join('') + '</div><div class="callout">내 몸에 맞는 사이즈를 보려면 위에서 「내 아바타」를 골라 내 치수를 넣어 주세요.</div></section></main>';
    }
    return '<main class="main mflex">' + head + '<section class="pan fxL fxBody" style="flex:1 1 340px" aria-label="내 아바타"><h2>내 아바타</h2>' +
      /* 2026-11-18 앞·옆·뒷모습 3장을 앞모습 큰 사진과 같은 크기(.av, 9:16)로 나란히. fxBody 2칸 배치 대신 가로 전체(grid-column 1/-1)를 씀 */
      '<div style="grid-column:1 / -1;display:grid;grid-template-columns:repeat(3,minmax(0,300px));gap:14px">' + ['front'].concat(ANGS).map(function (av) {
        var f = av === 'front', u = f ? urls.avatar : urls.ang[av], src = f ? (u || (p.gender === 'male' ? 'assets/avatar_male.jpg?v=t' : 'assets/avatar_default.jpg?v=t')) : u;
        return '<div style="display:flex;flex-direction:column;gap:8px;min-width:0">' + (src ? '<img class="av zoomimg" role="button" tabindex="0" data-act="bodyZoom" title="눌러서 크게 보기" src="' + h(src) + '" alt="' + (f && !u ? '기본 캐릭터 전신' : '내 아바타 ' + ANG_NAME[av]) + '" style="max-width:none">' : '<div class="av" style="max-width:none;border:1px dashed var(--line);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:14px">' + ANG_NAME[av] + ' 없음</div>') +
          '<label class="btn" style="display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--fg);font-size:15px;font-weight:700">' + ANG_NAME[av] + ' 올리기<input type="file" class="fhid" accept="image/*" data-file="' + (f ? 'avatar' : 'avatar_' + av) + '" aria-label="' + ANG_NAME[av] + ' 이미지 파일 선택"></label>' + (u ? (f ? '<button type="button" class="lk" data-act="avatarDel">' : '<button type="button" class="lk" data-act="avatarAngDel" data-v="' + av + '">') + ANG_NAME[av] + ' 지우기</button>' : '') + '</div>';
      }).join('') + '</div>' + avSetupHtml() + '<p class="sub" style="grid-column:1 / -1">' + (urls.avatar ? '앞모습은 직접 올린 내 아바타 사진이에요.' : '앞모습 정면 전신 이미지를 올려 주세요. 올리지 않으면 기본 캐릭터 사진에 내 치수로 입혀 드려요.') + ' 앞모습은 정면 전신, 몸선이 보이는 나시·반바지 차림, 단색 배경 사진이 가장 잘 맞아요. 옆모습·뒷모습은 선택이에요. 올려 두면 옷을 입힐 때 옆·뒤도 골라서 만들 수 있어요(앞 사진과 같은 옷차림·배경의 전신 사진).' + (urls.avatar ? '' : ' 옆·뒤는 앞모습 사진을 먼저 올려야 쓰여요.') + '</p></section>' +
      '<section class="pan fxR" style="flex:2 1 520px" aria-label="내 치수"><h2>내 치수</h2><p class="sub">성별, 키, 몸무게만 넣어도 시작할 수 있어요.</p><div class="segtoggle" role="group" aria-label="성별"><button type="button" class="' + (p.gender === 'male' ? 'on' : '') + '" data-act="bGender" data-v="male">남성</button><button type="button" class="' + (p.gender !== 'male' ? 'on' : '') + '" data-act="bGender" data-v="female">여성</button></div>' +
      '<div class="g2"><label for="h">키<span class="in"><input id="h" type="number" value="' + h(p.height) + '"><small>cm</small></span></label><label for="w">몸무게<span class="in"><input id="w" type="number" value="' + h(p.weight) + '"><small>kg</small></span></label></div>' +
      '<h2>자세한 치수</h2><div class="callout">모르는 칸은 비워 두세요. 키와 몸무게로 자동 추정해요. 재서 넣을수록 핏이 정확해져요.</div><div class="g3">' +
      MFIELDS.map(function (f, i) { return '<label for="m' + i + '">' + f[1] + '<span class="in"><input id="m' + i + '" type="number" step="0.1" data-mf="' + f[0] + '" placeholder="자동" value="' + h(m[f[0]] == null ? '' : m[f[0]]) + '"><small>' + f[2] + '</small></span></label>'; }).join('') + '</div><button type="button" class="save" data-act="bSave">저장</button></section></main>';
  }

  /* ---------- 요금제 · 설정 (2026-11-10 목업 Plan.dc.html · Settings.dc.html: 옆 창이 아니라 따로 화면) ---------- */
  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"></path></svg>';
  function viewPlan() {
    var s = subNow();
    return '<main class="main planmain"><section class="card2 plannow" aria-label="지금 플랜"><div class="bignum"><b>' + leftText() + '</b><div><small>이번 달 남은 횟수' + (unlimited() ? ' · 제한 없음(시험 중)' : '') + '</small><strong>지금은 ' + h(planNow().name) + ' 플랜</strong></div></div>' +
      '<p class="sub">결제 연결 전이에요. 플랜 선택은 이 기기 안에서만 적용됩니다. 가격은 예정 값입니다.</p></section><div class="plans">' +
      Object.keys(FD.plans).map(function (k) {
        var p = FD.plans[k], on = k === s.plan;
        return '<section class="plan' + (on ? ' on' : '') + '" aria-label="' + h(p.name) + '"><div class="plh"><h2>' + h(p.name) + '</h2>' + (on ? '<span>사용 중</span>' : '') + '</div><div class="plprice">' + h(p.price) + '</div>' +
          '<div class="pllimit"><b>' + h(p.limit) + '</b><span>회 / 월 입어보기</span></div><ul>' + (p.features || []).map(function (f) { return '<li>' + CHECK + '<span>' + h(f) + '</span></li>'; }).join('') + '</ul>' +
          '<button type="button" class="plbtn" aria-pressed="' + on + '" data-act="planPick" data-plan="' + h(k) + '">' + (on ? '이 플랜 쓰는 중' : '이 플랜 선택') + '</button></section>';
      }).join('') + '</div></main>';
  }
  /* 2026-11-19 스킨 선택: 블랙·화이트·부티크 색 버전을 설정에서 바꾼다(skin.js 가 색 파일만 갈아 끼움, 새로 고침 없음). skin.js 가 없으면 카드를 안 그린다 */
  function skinCard() {
    var FS = window.FitSkin; if (!FS) return '';
    return '<section class="card2" aria-label="스킨"><div><h2>스킨</h2><p class="sub">화면 색만 바뀌어요. 옷·기록·입힌 그림은 그대로입니다.</p></div><div class="skins" role="group" aria-label="스킨">' +
      FS.list.map(function (s) { var o = FS.cur() === s.id; return '<button type="button" class="' + (o ? 'on' : '') + '" aria-pressed="' + o + '" data-act="skinPick" data-v="' + h(s.id) + '"><span class="sw" aria-hidden="true" style="background:' + h(s.sw[0]) + '"><i style="background:' + h(s.sw[1]) + '"></i><i style="background:' + h(s.sw[2]) + '"></i></span><b>' + h(s.name) + '</b>' + (o ? '<em>사용 중</em>' : '') + '</button>'; }).join('') + '</div></section>';
  }
  function viewSettings() {
    var pref = state.profile.pref || 'fit';
    return '<main class="main setmain"><section class="card2 setprof" aria-label="프로필"><h2>프로필</h2><div class="prow"><img src="' + h(avatarShow()) + '" alt=""><div><b>' + h(user.nick) + ' 님</b><small>이 브라우저에 저장된 프로필</small></div></div>' +
      '<button type="button" class="obtn" data-act="go" data-page="body">내 몸 정보 고치기</button><button type="button" class="obtn" data-act="logout">프로필 바꾸기</button></section>' +
      '<div class="setcol">' + skinCard() + '<section class="card2" aria-label="선호 핏"><div><h2>선호 핏</h2><p class="sub">사이즈 추천과 핏 판정에만 반영돼요. 입힌 그림은 바뀌지 않습니다.</p></div><div class="prefs" role="group" aria-label="선호 핏">' +
      PREFS.map(function (x) { var o = pref === x[0]; return '<button type="button" class="' + (o ? 'on' : '') + '" aria-pressed="' + o + '" data-act="fitStyle" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div></section>' +
      '<section class="card2 setplan" aria-label="요금제"><div class="bignum sm"><b>' + leftText() + '</b><div><small>이번 달 남은 횟수</small><strong>' + h(planNow().name) + ' 플랜</strong></div></div><button type="button" class="plbtn" data-act="go" data-page="plan">요금제 보기</button></section></div></main>';
  }

  /* ---------- 그리기 ---------- */
  function render() {
    syncDue = false;
    if (!user) { app.className = ''; app.innerHTML = viewLogin(); return; }
    ensureBasePic(); avSetupAuto(); /* 2026-11-19 아바타 세팅: 저장값 없는 내 아바타 사진은 한 번 자동 실행(비동기) */
    var p = ui.page, inner = p === 'fitting' ? viewFitting() : p === 'closet' ? viewCloset() : p === 'accessory' ? viewAccessory() : p === 'history' ? viewHistory() : p === 'body' ? viewBody() : p === 'plan' ? viewPlan() : p === 'set' ? viewSettings() : viewHome();
    var ae = document.activeElement, keep = ae && ae.id, sel = null, scr = {};
    try { sel = keep && ae.selectionStart; } catch (e) {}
    ['.grid4', '.picks', 'aside.pan', '.rpanel', '.fitside', '.vbox'].forEach(function (q) { var e = app.querySelector(q); if (e) scr[q] = e.scrollTop; });
    var vk = {}, lkb = app.querySelector('[data-act="linkSave"]'), lkid = lkb && lkb.dataset.id; /* 다시 그려도 아직 저장 안 한 몸 치수·링크 입력은 그대로 둔다 */
    Array.prototype.forEach.call(app.querySelectorAll('#h,#w,#lkin,input[data-mf]'), function (i) { if (i.id) vk[i.id] = i.value; });
    app.className = 'pg-' + p;
    app.innerHTML = '<div class="app">' + side() + topbar() + inner + '</div>';
    var lkb2 = app.querySelector('[data-act="linkSave"]');
    Object.keys(vk).forEach(function (k) { if (k === 'lkin' && !(lkb2 && lkb2.dataset.id === lkid)) return; var e = document.getElementById(k); if (e && e.value !== vk[k]) e.value = vk[k]; });
    /* 2026-11-10 피팅룸: 사진 한 장 보기일 때 사진의 양쪽 가장자리 색을 사진 칸 전체로 늘린다(pc.css .vwrap.bgx) */
    var bw = app.querySelector('.vwrap'), bi = bw && bw.querySelector('.vbox:not(.cmpbox)>.fig:not(.cmpv)>img, .vbox:not(.cmpbox)>.fig:not(.cmpv)>video');
    /* 2026-11-10 저녁: 사용자 지시 "사진을 늘리면 안 됨, 원본 이미지 유지" → 배경 늘리기 끔(.bgx를 붙이지 않는다) */
    if (false && bi) { bw.style.setProperty('--bg', 'url("' + String(bi.getAttribute('src')).replace(/["\\\n\r]/g, encodeURIComponent) + '")'); bw.classList.add('bgx'); }
    /* 2026-11-11: 기본 캐릭터(직접 올린 아바타가 없을 때)만 — 사진은 그대로 두고, 사진 뒤 칸(.vbox)에 사진 양끝 배경색을 세로 그라데이션으로 깐다 */
    /* 2026-11-12: 기본 모델(프리셋 — 지금 8명·앞으로 새로 만드는 모델 모두)도 같이 칠한다. 직접 올린 내 아바타 사진만 제외 */
    /* 2026-11-14: 내 아바타 사진·내 아바타로 입은 그림도 기본 모델과 같은 방식으로 칠한다(예전엔 제외돼 양옆이 기본 배경색으로 남았음) */
    if (bi) paintStageBg(bi, bw.querySelector('.vbox')); /* 기본 캐릭터·기본 모델(프리셋)·내 아바타 + 기본 모델 탭(코디 예시 사진) */
    /* 2026-11-18 홈 입은 모습 슬라이드: 흐린 사진(.hsbg)으로 채우던 양옆을 사진 자신의 양끝 배경색 세로 그라데이션으로 칠한다(옷 색 얼룩·경계선 제거). 색을 못 읽으면 예전 흐린 사진 그대로 */
    Array.prototype.forEach.call(app.querySelectorAll('.hslide .hsfg'), paintSlideBg);
    Object.keys(scr).forEach(function (q) { var e = app.querySelector(q); if (e) e.scrollTop = scr[q]; });
    if (keep) { var a = document.getElementById(keep); if (a) { a.focus(); try { if (sel != null) a.setSelectionRange(sel, sel); } catch (e) {} } }
    liftFootTag();
    placeRuler();
  }

  /* 2026-11-12 「발 …」 핏 표시가 아래 방향 버튼(앞모습·옆모습·뒷모습·모션)에 가려지던 것: 실제 화면 위치를 재서 겹치면 그만큼만 위로 올린다(창 폭·확대와 무관하게). 안 겹치면 원래 자리 그대로 */
  function liftFootTag() {
    var t = app.querySelector('.vwrap .fig .tag.tfoot'), an = app.querySelector('.vwrap>.angles');
    if (!t || !an) return;
    if (t.parentNode.classList.contains('rtag')) { /* 오른쪽 가장자리 핏 표시: 방향 버튼과 겹치면 위로 옮김 */
      t.style.transform = '';
      var a0 = an.getBoundingClientRect(), r0 = t.getBoundingClientRect();
      if (!(r0.right <= a0.left || r0.left >= a0.right || r0.bottom <= a0.top || r0.top >= a0.bottom)) t.style.transform = 'translateY(' + (-(r0.bottom - a0.top) - 8) + 'px)';
      return;
    }
    t.style.top = (ui.footTop != null ? ui.footTop : TAG_TOP.shoe) + '%'; /* 2026-11-13 키 비례 위치 */
    var a = an.getBoundingClientRect(), r = t.getBoundingClientRect();
    if (r.right <= a.left || r.left >= a.right || r.bottom <= a.top || r.top >= a.bottom) return;
    t.style.top = (t.offsetTop - (r.bottom - a.top) - 8) + 'px';
  }
  window.addEventListener('resize', liftFootTag);

  /* 사진 왼쪽·오른쪽 끝 띠의 색을 위→아래 12곳에서 읽어(양쪽 평균) 사진 높이에 맞춘 그라데이션을 칸 배경으로. 읽기가 막히면(캔버스 보안) 아무것도 안 바꾼다 */
  /* 2026-11-14 사용자 지시: 옷을 입을 때마다 배경색이 변하지 않게, 칠할 색은 입은 그림이 아니라 아바타(기본 모델·내 아바타) 원본 사진의 양끝에서 한 번만 읽어 저장해 둔다.
     같은 색을 크게 보기 창(openFull)에도 쓴다. 원본을 읽을 수 없으면(캔버스 보안) 예전처럼 지금 보이는 그림에서 읽는다 */
  var BGC = {};
  /* 2026-11-19 사용자 지시(배경 경계선): 사진 배경이 왼쪽·오른쪽 밝기가 달라(예: 왼쪽 195·오른쪽 185) 양쪽 평균 한 색으로 칠하면 양옆에 경계선이 보였다.
     → 왼쪽 띠·오른쪽 띠 색을 따로(cols.L / cols.R) 읽고, 24칸으로 나눠 칸마다 줄 여러 개·폭 1~4% 띠를 평균(한 줄 1픽셀 읽기의 얼룩 없앰). cols 자체는 예전처럼 양쪽 평균 */
  function edgeCols(img) {
    var w = img.naturalWidth || img.videoWidth, h = img.naturalHeight || img.videoHeight; if (!w || !h) return null;
    var N = 24, cw = 200, ch = Math.max(N, Math.round(cw * h / w)), c = document.createElement('canvas'); c.width = cw; c.height = ch;
    var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cw, ch); g.drawImage(img, 0, 0, cw, ch); /* 투명 PNG(흰 바탕 사본을 만들기 전 잠깐)는 흰 바탕으로 읽는다 — 검게 칠해지지 않게 */
    var d = g.getImageData(0, 0, cw, ch).data, x0 = 2, x1 = 8, cols = [], L = [], R = [];
    function avg(y0, y1, xa, xb) { var s = [0, 0, 0], n = 0; for (var y = y0; y < y1; y++) for (var x = xa; x < xb; x++) { var o = (y * cw + x) * 4; s[0] += d[o]; s[1] += d[o + 1]; s[2] += d[o + 2]; n++; } return [s[0] / n, s[1] / n, s[2] / n]; }
    for (var i = 0; i < N; i++) {
      var ya = Math.floor(i * ch / N), yb = Math.max(ya + 1, Math.floor((i + 1) * ch / N));
      var l = avg(ya, yb, x0, x1), r = avg(ya, yb, cw - x1, cw - x0);
      L.push(l.map(Math.round)); R.push(r.map(Math.round)); cols.push([0, 1, 2].map(function (k) { return Math.round((l[k] + r[k]) / 2); }));
    }
    cols.L = L; cols.R = R;
    return cols;
  }
  /* 칸(el) 배경 칠하기: 사진 왼쪽 바깥 = 사진 왼쪽 끝 색, 오른쪽 바깥 = 오른쪽 끝 색, 사진 폭 안에서는 왼쪽→오른쪽으로 서서히 바뀜(가운데 이음매 없음).
     ys[i] = i번째 색의 세로 위치(px, el 기준), xl·xr = 사진 왼쪽·오른쪽 끝(px, el 기준). 작은 캔버스(1/4 크기)에 그려 칸 크기로 늘린다 */
  function bgPaint(el, cols, ys, xl, xr) {
    var W = el.clientWidth, H = el.clientHeight, n = cols.length, L = cols.L || cols, R = cols.R || cols;
    if (!W || !H || !n) return;
    var s = 4, cw = Math.max(8, Math.ceil(W / s)), chh = Math.max(8, Math.ceil(H / s)), c = document.createElement('canvas'); c.width = cw; c.height = chh;
    var g = c.getContext('2d'), a = Math.min(xl, xr) / s, b = Math.max(xl + 1, xr) / s;
    function at(A, y) {
      if (y <= ys[0]) return A[0]; if (y >= ys[n - 1]) return A[n - 1];
      for (var j = 0; j < n - 1; j++) if (y < ys[j + 1]) { var t = (y - ys[j]) / Math.max(1, ys[j + 1] - ys[j]); return [0, 1, 2].map(function (k) { return A[j][k] + (A[j + 1][k] - A[j][k]) * t; }); }
      return A[n - 1];
    }
    var rgb = function (k) { return 'rgb(' + k.map(Math.round).join(',') + ')'; };
    for (var yy = 0; yy < chh; yy++) {
      var y = (yy + 0.5) * s, gr = g.createLinearGradient(a, 0, b, 0); gr.addColorStop(0, rgb(at(L, y))); gr.addColorStop(1, rgb(at(R, y)));
      g.fillStyle = gr; g.fillRect(0, yy, cw, 1);
    }
    el.style.background = 'url(' + c.toDataURL() + ') 0 0 / 100% 100% no-repeat';
  }
  /* 창 크기가 바뀌면 칠한 배경을 다시 맞춘다(사진 위치·크기가 바뀌므로). el.__bgRe = 다시 칠하는 함수 */
  (function () { var tm = 0; window.addEventListener('resize', function () { clearTimeout(tm); tm = setTimeout(function () { document.querySelectorAll('.bgre').forEach(function (e) { if (e.isConnected && e.__bgRe) try { e.__bgRe(); } catch (x) {} }); }, 150); }); })();
  function bgHook(el, fn) { el.__bgRe = fn; el.classList.add('bgre'); }
  function stageCols(img, cb) {
    var base = avatarStage(), key = base + '|' + (state.avSeq || 0);
    if (BGC[key]) { cb(BGC[key]); return; }
    function from(im, store) { var c = null; try { c = edgeCols(im); } catch (e) {} if (c && store) BGC[key] = c; return c; }
    if (String(img.getAttribute('src') || '') === base) { cb(from(img, true)); return; }
    var b = new Image(); b.crossOrigin = 'anonymous';
    b.onload = function () { cb(from(b, true) || from(img, false)); };
    b.onerror = function () { cb(from(img, false)); };
    b.src = base;
  }
  /* 2026-11-19 배경 경계선 검토: 옆·뒷모습·모션은 앞모습 아바타와 사진 배경이 달라 앞모습 색을 쓰면 경계선이 생김 → 그 보기에서는 지금 보이는 사진에서 읽는다(사진 주소별로 저장). 앞모습은 예전대로 아바타 원본 색 */
  /* 2026-11-19 아바타 세팅(별도 기능 avatar-setup.js): 내 아바타 앞·옆·뒤 사진을 올리면 그 사진의 배경색(좌·우 따로)과 배경 점검 결과를 한 번 읽어
     state.avBg[front|side|back] = { seq, L, R, warn } 로 저장. 이미 올려 둔 사용자도 처음 볼 때 한 번 자동 실행. 배경 칠하기는 저장값을 먼저 씀 */
  function avSeqOf(v) { return v === 'front' ? (state.avSeq || 0) : ((state.avAngSeq || {})[v] || 0); }
  function avBgOk(v) { var b = state.avBg && state.avBg[v]; return b && b.seq === avSeqOf(v) && b.L ? b : null; }
  var avSetBusy = {};
  function avSetup(v, src) {
    if (!window.AvatarSetup || avSetBusy[v] === 1) return;
    var seq = avSeqOf(v); avSetBusy[v] = 1;
    AvatarSetup.run(src).then(function (r) {
      if (!r) { avSetBusy[v] = 2; return; } /* 못 읽으면 이번 접속에서는 다시 하지 않음(예전 방식으로 칠함) */
      avSetBusy[v] = 0; if (seq !== avSeqOf(v)) return;
      state.avBg = state.avBg || {}; state.avBg[v] = { seq: seq, L: r.L, R: r.R, warn: r.warn, t: Date.now() }; save(); render();
    });
  }
  function avSetupAuto() {
    if (!window.AvatarSetup || !user) return;
    ['front'].concat(ANGS).forEach(function (v) { var u = v === 'front' ? urls.avatar : urls.ang[v]; if (u && !avBgOk(v) && !avSetBusy[v]) avSetup(v, u); });
  }
  function avSetupHtml() {
    var vs = ['front'].concat(ANGS).filter(function (v) { return v === 'front' ? urls.avatar : urls.ang[v]; }); if (!vs.length) return '';
    var warn = [], parts = vs.map(function (v) { var b = avBgOk(v); if (b && b.warn) b.warn.forEach(function (t) { if (warn.indexOf(t) < 0) warn.push(t); }); return ANG_NAME[v] + ' ' + (b ? '✓' : avSetBusy[v] === 2 ? '읽기 실패' : '세팅 중…'); });
    return '<div class="avset" style="grid-column:1 / -1;display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;font-size:13px"><b>아바타 세팅 · 배경색 맞춤</b><span>' + parts.join(' · ') + '</span>' +
      '<button type="button" class="lk" data-act="avSetupRe" style="font-size:13px;padding:2px 10px">다시 하기</button>' + (warn.length ? '<span style="flex-basis:100%;color:var(--muted)">' + warn.map(h).join(' ') + '</span>' : '') + '</div>';
  }
  function colsFor(img, cb) {
    if (myPic()) { /* 아바타 세팅 저장값: 앞모습은 내 아바타, 옆·뒷모습은 그 방향 내 사진(입힌 옆·뒤 그림도 그 사진 배경에 맞춰져 있음) */
      var v = img.hasAttribute('data-motion') ? '' : ui.angle, sv = v && avBgOk(v), sc = sv && AvatarSetup.toCols(sv);
      if (sc) { cb(sc); return; }
    }
    if (ui.angle === 'front' && !img.hasAttribute('data-motion')) { stageCols(img, cb); return; }
    var k = 'img|' + (img.getAttribute('src') || ''); if (BGC[k]) { cb(BGC[k]); return; }
    var c = null; try { c = edgeCols(img); } catch (e) {} if (c) BGC[k] = c; cb(c);
  }
  function paintSlideBg(img) {
    function go() {
      var cols = null; try { cols = edgeCols(img); } catch (e) {}
      var hs = img.parentNode; if (!cols || !hs || !hs.isConnected) return;
      var N = cols.length;
      var hr = hs.getBoundingClientRect(), ir = img.getBoundingClientRect(), hh = hs.clientHeight;
      bgPaint(hs, cols, cols.map(function (k, i) { return (i + 0.5) / N * hh; }), ir.left - hr.left, ir.right - hr.left);
      hs.classList.add('bgc'); bgHook(hs, go);
    }
    if (img.complete && img.naturalWidth) go(); else img.addEventListener('load', go, { once: true });
  }
  function paintStageBg(img, box) {
    if (!img || !box) return;
    function go() {
      try {
        var w = img.naturalWidth || img.videoWidth, h = img.naturalHeight || img.videoHeight; if (!w || !h) return;
        colsFor(img, function (cols) {
          if (!cols || !box.isConnected || !img.isConnected) return;
          var N = cols.length, fig = img.parentNode, top = fig.offsetTop, fh = fig.offsetHeight; if (!fh) return;
          /* 2026-11-13 키 비례로 사진을 줄여 보여 줄 때는 줄인 사진의 줄 위치에 맞춰 색을 깐다 */
          var hk = parseFloat(fig.style.getPropertyValue('--hk')) || 1, hy = (parseFloat(fig.style.getPropertyValue('--hy')) || 0) / 100;
          var br = box.getBoundingClientRect(), ir = img.getBoundingClientRect(), bl = br.left + box.clientLeft;
          bgPaint(box, cols, cols.map(function (k, i) { return top + (hy + (i + 0.5) / N * hk) * fh; }), ir.left - bl, ir.right - bl);
          box.classList.add('bgc'); bgHook(box, go);
        });
      } catch (e) {}
    }
    if (img.hasAttribute('data-motion') && !img.__mbg) { img.__mbg = 1; img.addEventListener('load', function () { requestAnimationFrame(go); }); } /* 모션: 사진이 바뀔 때마다 그 사진 색으로 */
    if (img.tagName === 'VIDEO') { if (img.readyState >= 2) requestAnimationFrame(go); else img.addEventListener('loadeddata', function () { requestAnimationFrame(go); }, { once: true }); } else if (img.complete && img.naturalWidth) requestAnimationFrame(go); else img.addEventListener('load', function () { requestAnimationFrame(go); }, { once: true });
  }

  /* 2026-11-11 모션 버튼: 기본 캐릭터 앞→옆→뒤→옆 사진을 이어서 돌려 보여 준다(AI 생성 없음·비용 없음) */
  (function () { var mi = 0; setInterval(function () { var im = document.querySelector('img[data-motion]'); if (!im) { mi = 0; return; } var l = im.getAttribute('data-motion').split('|'); mi = (mi + 1) % l.length; im.src = l[mi]; }, 1000); })();

  /* ---------- 3D ---------- */
  function circOf(it, v) { var n = E.num(v); return n ? (it.measureType === 'circ' ? n : n * 2) : 0; }
  function collect3d(res) {
    var bv = E.bodyOf(prof(), cfgNow()).vals, gars = [];
    res.forEach(function (r) {
      if ((r.cat !== 'top' && r.cat !== 'bottom') || !r.garment) return;
      var row = r.garment.sizes.filter(function (z) { return z.label === r.chosen; })[0]; if (!row) return;
      var p = r.current && r.current.primary, heat = p ? p.gradeKey : 'fit';
      if (r.cat === 'top') { var c = circOf(r.garment, row.chest); if (c) gars.push({ cat: 'top', heat: heat, chest: c, shoulder: E.num(row.shoulder) || 0, length: E.num(row.length) || 0, sleeve: E.num(row.sleeve) || 0 }); }
      else { var w = circOf(r.garment, row.waist), hp = circOf(r.garment, row.hip), th = circOf(r.garment, row.thigh); if (w || hp) gars.push({ cat: 'bottom', heat: heat, waist: w, hip: hp, thigh: th, rise: E.num(row.rise) || 0, inseam: E.num(row.inseam) || 0 }); }
    });
    return { body: { height: bv.height, chest: bv.chest, shoulder: bv.shoulder, waist: bv.waist, hip: bv.hip, thigh: bv.thigh, arm: bv.arm, inseam: bv.inseam, rise: bv.rise, foot: bv.foot }, garments: gars };
  }
  function close3d() { var o = document.getElementById('d3view'); if (o) o.remove(); if (window.Fit3D) Fit3D.pause(); document.removeEventListener('keydown', key3d); }
  function key3d(e) { if (e.key === 'Escape') close3d(); }
  function open3d() {
    close3d();
    if (!E.num(prof().height)) { toast('내 몸 정보에 키를 먼저 넣어 주세요.'); return; }
    var o = document.createElement('div'); o.id = 'd3view';
    if (!(window.Fit3D && Fit3D.supported())) o.innerHTML = '<div class="d3off">이 기기에서는 3D를 표시할 수 없어요.</div><button type="button" class="fsx" aria-label="닫기">✕</button>';
    else {
      var H = Fit3D.heat, names = [['tightBad', '많이 껴요'], ['tight', '약간 껴요'], ['fit', '딱 맞아요'], ['loose', '넉넉해요'], ['over', '너무 커요']];
      o.innerHTML = '<div id="d3host"></div><div class="d3legend">' + names.map(function (n) { return '<span><i style="background:#' + ('000000' + H[n[0]].toString(16)).slice(-6) + '"></i>' + n[1] + '</span>'; }).join('') + '</div><div class="d3dirs"><button type="button" data-turn="0">앞모습</button><button type="button" data-turn="1">옆모습</button><button type="button" data-turn="2">뒷모습</button></div><div class="d3hint">좌우로 밀면 돌아가요</div><button type="button" class="fsx" aria-label="닫기">✕</button>';
    }
    o.addEventListener('click', function (e) {
      if (e.target.closest('.fsx')) close3d();
      else if (e.target.closest('[data-turn]') && window.Fit3D) { var b = e.target.closest('[data-turn]'); Fit3D.turn(Number(b.dataset.turn) * Math.PI / 2); o.querySelectorAll('[data-turn]').forEach(function (x) { x.classList.toggle('on', x === b); }); }
    });
    document.body.appendChild(o); document.addEventListener('keydown', key3d);
    var host = o.querySelector('#d3host');
    if (host) { Fit3D.setFace({ url: isMale() ? 'assets/avatar_male.jpg?v=t' : 'assets/avatar_default.jpg?v=t', kind: 'avatar' }); Fit3D.mount(host, collect3d(fitResults().results)); }
  }

  /* ---------- 사진 받기 ---------- */
  function pendClear() { if (ui.pend) URL.revokeObjectURL(ui.pend.url); ui.pend = null; }
  function addFromFile(file, cat) {
    return Promise.all([Core.shrink(file, 240, 0.8).then(Core.blobToDataUrl), Core.shrink(file, 1280, 0.88)]).then(function (a) {
      var rec = { id: 'p' + (state.seq++), cat: cat, gender: isMale() ? 'male' : 'female', name: '', measureType: cat === 'shoe' ? '' : 'flat', fabric: 'normal', photo: a[0], price: '', url: '', isRef: false, refSize: '', sizes: defaultSizes(cat) };
      rec.name = '캡처 ' + CATS[cat] + ' ' + rec.id.slice(1);
      rec.kind = cat === 'shoe' ? '' : (ui.homeKind || '');
      state.closet.push(rec); if (rec.kind !== 'under') selectItem(rec); if (cat === 'shoe') state.tryShoe = ''; save();
      return blobPut('gphoto:' + rec.id, a[1]).catch(function () {}).then(function () { return rec; });
    });
  }
  function routeHome(cat) {
    var f = ui.pend && ui.pend.file; if (!f) return;
    if (genPending && cat !== 'outer' && cat !== 'inner' && cat !== 'acc') { toast('지금 다른 옷을 만드는 중이에요. 끝난 뒤 다시 해 주세요.'); return; } /* 넣어 둔 사진은 그대로 둔다 */
    pendClear(); ui.homeCat = null;
    if (cat === 'acc') { setAccPhoto(f); go('accessory'); return; }
    addFromFile(f, cat).then(function () {
      var under = ui.homeKind === 'under' && cat !== 'shoe'; ui.homeKind = '';
      if (under) { ui.closetCat = cat; go('closet'); toast('언더웨어는 옷장에 저장했어요. 사이즈 확인용이라 입어보기에는 쓰지 않아요.', 5000); return; }
      ui.left = 'clothes'; go('fitting');
      if (cat === 'outer' || cat === 'inner') toast((cat === 'inner' ? '이너' : '겉옷') + '는 상의·하의와 함께 골랐을 때 입혀져요. 상의·하의를 골라 「가상 피팅 시작」을 눌러 주세요.', 6000); else wearAll({ frontOnly: true });
    }).catch(function (err) { toast((err && err.message) || '사진을 읽지 못했습니다.'); render(); });
  }
  function homeFile(file) {
    pendClear(); ui.pend = { file: file, url: URL.createObjectURL(file) };
    if (ui.page !== 'home') { go('home'); }
    if (ui.homeCat) routeHome(ui.homeCat); else render();
  }
  function setAccPhoto(file) {
    Promise.all([Core.shrink(file, 240, 0.8).then(Core.blobToDataUrl), Core.shrink(file, 1280, 0.88)]).then(function (a) { ui.af.photo = a[0]; ui.af.big = a[1]; ui.af.err = ''; ui.af.saved = false; render(); }).catch(function (err) { ui.af.err = (err && err.message) || '사진을 읽지 못했어요.'; render(); });
  }
  function ocrMsg(k, t) { var el = app.querySelector('[data-ocr="' + k + '"]'); if (el) el.textContent = t; }
  /* AI 읽기 경고의 개발용 표현('length', variants)을 사용자 말로 바꾼다. 같은 치수가 숏/롱처럼 여러 버전이면 앱은 한 값만 저장한다. */
  var WARN_KEYS = { length: '총장', chest: '가슴', shoulder: '어깨', sleeve: '소매길이', armhole: '암홀', sleeve_width: '소매통', hem: '밑단', waist: '허리', hip: '엉덩이', thigh: '허벅지', knee: '무릎', rise: '밑위', inseam: '기장(인심)' };
  function friendlyWarn(w) {
    var m = /^'([^']+)' 치수가 여러 버전입니다\(([^)]*)\)\. 기본값은 '([^']*)'/.exec(String(w));
    if (!m) return w;
    return (WARN_KEYS[m[1]] || m[1]) + ' 항목이 여러 버전(' + m[2] + ')으로 있어요. ' + m[3] + ' 값만 넣었어요. 나머지는 필요하면 직접 입력해 주세요.';
  }
  /* AI 가 읽은 결과를 옷 추가 칸에 넣는다(처음 읽었을 때 + 읽은 뒤 옷 종류를 바꿨을 때) */
  function applyRead(f, r) {
    f.sizes = r.sizes; f.measureType = r.measureType; f.sizeDone = true;
    /* 2026-11-12 「이미지 표」: 항목 이름·순서·사이즈 이름·숫자를 이미지 그대로 표에 넣는다. 표를 못 만들면 앱 기본 이름 표(A+B 때와 같음) */
    var img = !!r.table; f.table = r.table || mkTable(f.cat, r.measureType, r.sizes);
    /* 예전엔 보통 범위 밖 값을 뺐지만 이제 그대로 넣으므로 「제외」 안내는 빼고 「확인이 필요한 값」으로 알린다 */
    var ws = (r.warnings || []).filter(function (w) { return !(img && /밖이라 제외/.test(String(w))); });
    f.sizeMsg = (img ? 'AI가 사이즈표의 항목 이름과 숫자를 이미지 그대로 넣었어요(' + (r.measureType === 'flat' ? '단면' : '둘레') + ' 기준으로 계산).' : r.measureType === 'flat' ? 'AI가 사이즈표 숫자 그대로(단면 cm) 넣었어요.' : 'AI가 읽었어요(둘레 cm 기준).') + ' 값이 맞는지 확인해 주세요.' +
      (r.unused && r.unused.length ? ' 핏 계산에 안 쓰는 항목: ' + r.unused.join(', ') + '.' : '') +
      (r.dropped && r.dropped.length ? ' ' + (img ? '표에 넣지 못한 항목: ' : '넣을 칸이 없어 뺀 항목: ') + r.dropped.join(', ') + '.' : '') +
      (r.check && r.check.length ? ' 보통 범위를 벗어나 확인이 필요한 값: ' + r.check.slice(0, 4).join(', ') + (r.check.length > 4 ? ' 외 ' + (r.check.length - 4) + '개' : '') + '.' : '') +
      (ws.length ? ' 참고: ' + friendlyWarn(ws[0]) : '');
    f.capRaw = r.raw || null; f.tEdit = false; /* 손으로 고치기 전에 옷 종류를 바꾸면 같은 글을 새 종류로 다시 푼다 */
  }
  /* 2026-11-13 상세 이미지(보조): 소재·신축성만 읽어 원단 선택을 채운다(서버 detailread). 핏 계산 방식은 그대로 */
  function detailCap(file) {
    var f = ui.cf, c = window.TRYON_CFG;
    if (!linkReadOn() || !f || f.cat === 'shoe') return;
    f.detailMsg = '상세 이미지를 읽는 중입니다…'; f.detailDone = false; render();
    Core.shrink(file, 1600, 0.85).then(Core.blobToDataUrl).then(function (img) {
      return fetch(c.url.replace(/\/$/, '') + '/functions/v1/detailread', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: c.anon, Authorization: 'Bearer ' + c.anon }, body: JSON.stringify({ device: Core.deviceId(), image: img }) });
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j && j.error || '상세 이미지를 읽지 못했어요.'); return j; }); })
      .then(function (j) {
        if (ui.cf !== f) return;
        var o = {}; try { var m = String(j.text || '').match(/\{[\s\S]*\}/); o = m ? JSON.parse(m[0]) : {}; } catch (e) { o = {}; }
        var mat = String(o.material || '').trim().slice(0, 120), fb = String(o.fabric || '');
        if (mat) f.material = mat;
        var msg = [];
        if (fb !== 'unknown' && cfgNow().fabric[fb] && (!f.fabric || f.fabric === 'normal') && fb !== 'normal') { f.fabric = fb; msg.push('원단을 ' + cfgNow().fabric[fb].label + '(으)로 골랐어요'); }
        else if (cfgNow().fabric[fb] && fb !== 'unknown' && f.fabric && f.fabric !== 'normal' && f.fabric !== fb) msg.push('이미 고른 원단(' + cfgNow().fabric[f.fabric].label + ')은 바꾸지 않았어요');
        if (mat) msg.push('소재: ' + mat);
        f.detailMsg = msg.length ? msg.join(' · ') + '. 맞는지 확인해 주세요.' : '소재 정보를 찾지 못했어요. 원단은 직접 골라 주세요.'; f.detailDone = !!(mat || fb !== 'unknown'); f.saved = false; render();
      }).catch(function (e) { if (ui.cf !== f) return; f.detailMsg = (e && e.message) || '상세 이미지를 읽지 못했어요.'; render(); });
  }
  function sizeCap(file) {
    var f = ui.cf;
    /* 2026-11-13 사이즈표 이미지도 옷과 함께 저장(저장 때 gsize:<id> 로 보관) */
    Core.shrink(file, 1400, 0.9).then(function (b) { if (ui.cf !== f || !b) return; f.sizeBig = b; f.sizeUrl = URL.createObjectURL(b); f.saved = false; render(); }).catch(function () {});
    /* 서버(AI)로 읽기를 켜 둔 경우(TRYON_CFG.sizeRead) 먼저 시도하고, 안 되면 아래 브라우저 글자 읽기로 넘어간다 */
    if (window.FitNotes && FitNotes.enabled() && f.cat !== 'shoe') {
      f.sizeMsg = 'AI가 사이즈표를 읽는 중입니다…'; f.sizeDone = false; render();
      FitNotes.readCapture(file, f.cat, prof().gender, Core.shrink, Core.blobToDataUrl, Core.deviceId()).then(function (r) {
        if (ui.cf !== f) return;
        applyRead(f, r); render();
      }).catch(function (err) { if (ui.cf !== f) return; f.capRaw = (err && err.raw) || null; f.sizeMsg = ''; sizeOcrFallback(file, f); });
      return;
    }
    sizeOcrFallback(file, f);
  }
  function sizeOcrFallback(file, f) {
    if (!window.SizeOcr) { f.sizeMsg = '글자 인식을 쓸 수 없어요. 표에 직접 입력해 주세요.'; render(); return; }
    f.sizeMsg = '글자를 읽는 중입니다. 처음에는 1분 가까이 걸릴 수 있어요.'; f.sizeDone = false; render();
    var prog = function (s, p) { if (p != null && ui.cf === f) { f.sizeMsg = '글자를 읽는 중… ' + Math.round(p * 100) + '%'; ocrMsg('size', f.sizeMsg); } };
    /* 2026-11-13 다국어: 한글·영어로 표를 못 읽으면 일본어·중국어(간체·번체)로 한 번 더 읽는다 */
    SizeOcr.recognize(file, prog).then(function (text) {
      var r0 = SizeOcr.parse(text, engCat(f.cat));
      if (r0.sizes.length || f.cat === 'shoe' || !SizeOcr.LANGS_ALT) return r0;
      if (ui.cf === f) { f.sizeMsg = '다른 언어(일본어·중국어)로 다시 읽는 중입니다…'; ocrMsg('size', f.sizeMsg); }
      return SizeOcr.recognize(file, prog, SizeOcr.LANGS_ALT).then(function (t2) { return SizeOcr.parse(t2, engCat(f.cat)); }, function () { return r0; });
    }).then(function (r) {
      if (ui.cf !== f) return;
      if (!r.sizes.length) { f.sizeMsg = '사이즈표를 읽지 못했어요. 글자가 크고 또렷하게 다시 캡처하거나 표에 직접 입력해 주세요.'; render(); return; }
      f.sizes = r.sizes; if (r.circ) f.measureType = 'circ';
      f.table = mkTable(f.cat, f.measureType, r.sizes); f.capRaw = null; /* 예비 글자 인식은 아는 항목만 앱 기본 이름으로 */
      f.sizeDone = true; f.sizeMsg = '자동으로 읽었어요. 값이 맞는지 확인해 주세요.' + (r.bad && r.bad.length ? ' 의심되는 칸: ' + r.bad.join(', ') : ''); render();
    }).catch(function (err) { if (ui.cf === f) { f.sizeMsg = (err && err.message) || '글자를 읽지 못했어요.'; render(); } });
  }
  function closetPhoto(file) {
    var f = ui.cf;
    Promise.all([Core.shrink(file, 240, 0.8).then(Core.blobToDataUrl), Core.shrink(file, 1280, 0.88)]).then(function (a) { f.photo = a[0]; f.big = a[1]; f.saved = false; if (ui.cf === f) render(); }).catch(function (err) { f.err = (err && err.message) || '사진을 읽지 못했어요.'; render(); });
    if (!window.SizeOcr || (f.name && f.price)) return;
    f.photoMsg = '상품 이름·가격을 읽는 중입니다.';
    SizeOcr.recognize(file, function (s, p) { if (p != null && ui.cf === f) { f.photoMsg = '상품 이름·가격을 읽는 중… ' + Math.round(p * 100) + '%'; ocrMsg('photo', f.photoMsg); } }).then(function (text) {
      if (ui.cf !== f) return;
      var r = SizeOcr.parseProduct(text), ok = false;
      if (r.name && !f.name) { f.name = r.name; ok = true; }
      if (r.price != null && !f.price) { f.price = String(r.price); ok = true; }
      f.photoMsg = ok ? '이름·가격을 읽어 채웠어요. 맞는지 확인해 주세요.' : '이름·가격을 읽지 못했어요. 아래에 직접 넣어 주세요.'; render();
    }).catch(function () { if (ui.cf === f) { f.photoMsg = '이름·가격을 읽지 못했어요. 아래에 직접 넣어 주세요.'; render(); } });
  }
  function takeImage(file, dz) {
    if (!user || !file || !/^image\//.test(file.type)) return;
    var d = dz || (ui.page === 'accessory' ? 'acc' : ui.page === 'closet' ? 'photo' : 'home');
    if (d === 'acc') setAccPhoto(file); else if (d === 'size') sizeCap(file); else if (d === 'detail') detailCap(file); else if (d === 'photo') closetPhoto(file); else homeFile(file);
  }
  document.addEventListener('paste', function (e) {
    var items = (e.clipboardData && e.clipboardData.items) || [];
    for (var i = 0; i < items.length; i++) if (items[i].kind === 'file' && /^image\//.test(items[i].type)) {
      var f = items[i].getAsFile(); if (!f) continue;
      e.preventDefault();
      var a = document.activeElement, z = a && a.closest && a.closest('[data-dz]');
      takeImage(f, z ? z.dataset.dz : null); return;
    }
  });
  function dzOf(e) { return e.target.closest && e.target.closest('[data-dz]'); }
  document.addEventListener('dragover', function (e) { var d = dzOf(e); if (d) { e.preventDefault(); d.classList.add('over'); } });
  document.addEventListener('dragleave', function (e) { var d = dzOf(e); if (d) d.classList.remove('over'); });
  document.addEventListener('drop', function (e) {
    var d = dzOf(e); if (!d) return;
    e.preventDefault(); d.classList.remove('over');
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) takeImage(f, d.dataset.dz);
  });

  /* ---------- 동작 ---------- */
  function dropTryon(id) {
    if (urls.tryon[id]) URL.revokeObjectURL(urls.tryon[id]);
    delete urls.tryon[id]; blobDel('tryon:' + id).catch(function () {});
    ANGS.forEach(function (v) { if (urls.angTry[v][id]) URL.revokeObjectURL(urls.angTry[v][id]); delete urls.angTry[v][id]; blobDel('tryon_' + v + ':' + id).catch(function () {}); if (state.angBase && state.angBase[v]) delete state.angBase[v][id]; });
    if (state.aiHem) delete state.aiHem[id];
    if (state.aiOver) delete state.aiOver[id];
    if (state.aiBase) delete state.aiBase[id];
    if (state.looks) delete state.looks[id];
    if (state.lookSize) delete state.lookSize[id];
    if (state.aiStack) delete state.aiStack[id];
    if (state.lookSig) delete state.lookSig[id];
    if (state.lookShoe) delete state.lookShoe[id];
    if (state.wearLast === id) delete state.wearLast;
  }
  function openFull(u, alt, paint) {
    var o = document.createElement('div'), back = document.activeElement; o.className = 'zoom'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', '사진 크게 보기');
    o.innerHTML = '<img alt="' + h(alt || '') + '" src="' + h(u) + '"><button type="button" class="x" aria-label="닫기">✕</button>';
    /* 2026-11-14 사용자 지시: 크게 보기도 피팅룸 화면처럼 사진은 그대로 두고 양옆·위아래를 아바타 배경색 그라데이션으로 채운다(paint 가 있을 때만) */
    if (paint) {
      var zi = o.querySelector('img');
      /* 2026-11-14 사용자 지시: 기본 모델도 내 아바타와 같은 크기로 — 피팅룸 본 화면과 같은 규칙(머리 꼭대기 8%·발끝 98%, hsMap)으로 줄여·옮겨 보여 준다. 사람 위치를 모르면 그대로 */
      var zm = hsMap(spanOf(u));
      if (zm) { zi.style.height = '100%'; zi.style.width = 'auto'; zi.style.maxWidth = '100%'; zi.style.transformOrigin = '50% 0'; zi.style.transform = 'translateY(' + zm.ty.toFixed(3) + '%) scale(' + zm.k.toFixed(4) + ')'; }
      (function () {
        function go() {
          try {
            colsFor(zi, function (cols) {
              if (!cols || !o.isConnected) return;
              var r = zi.getBoundingClientRect(), N = cols.length;
              bgPaint(o, cols, cols.map(function (k, i) { return r.top + (i + 0.5) / N * r.height; }), r.left, r.right); bgHook(o, go);
            });
          } catch (e) {}
        }
        if (zi.complete && zi.naturalWidth) requestAnimationFrame(go); else zi.addEventListener('load', function () { requestAnimationFrame(go); }, { once: true });
      })();
    }
    /* 2026-11-19 사용자 지시: 크게 보기에서 휠·두 번 누르기로 더 확대하고 마우스로 끌어 이동. 끌었으면 닫지 않음(배경색 칠하기 보기는 제외) */
    var pz = { k: 1, x: 0, y: 0, d: null, moved: false }, pimg = o.querySelector('img');
    function papply() { pimg.style.transform = 'translate(' + pz.x + 'px,' + pz.y + 'px) scale(' + pz.k + ')'; pimg.style.cursor = pz.k > 1 ? (pz.d ? 'grabbing' : 'grab') : 'zoom-in'; }
    if (!paint) {
      pimg.style.transition = 'transform .15s'; pimg.draggable = false; papply();
      var tip = document.createElement('div'); tip.className = 'ztip'; tip.textContent = '휠·두 번 클릭으로 확대 · 확대 후 끌어서 이동'; o.appendChild(tip);
      o.addEventListener('wheel', function (e) { e.preventDefault(); var k0 = pz.k; pz.k = Math.min(5, Math.max(1, pz.k * (e.deltaY < 0 ? 1.2 : 1 / 1.2))); if (pz.k === 1) { pz.x = 0; pz.y = 0; } else { var r = pimg.getBoundingClientRect(), cx = e.clientX - (r.left + r.width / 2), cy = e.clientY - (r.top + r.height / 2), f = pz.k / k0; pz.x -= cx * (f - 1); pz.y -= cy * (f - 1); } papply(); }, { passive: false });
      pimg.addEventListener('dblclick', function (e) { e.stopPropagation(); if (pz.k > 1) { pz.k = 1; pz.x = 0; pz.y = 0; } else { var r = pimg.getBoundingClientRect(); pz.k = 2.5; pz.x = -(e.clientX - (r.left + r.width / 2)) * 1.5; pz.y = -(e.clientY - (r.top + r.height / 2)) * 1.5; } papply(); });
      pimg.addEventListener('mousedown', function (e) { if (e.button !== 0 || pz.k <= 1) return; e.preventDefault(); pz.d = { x: e.clientX - pz.x, y: e.clientY - pz.y }; pz.moved = false; pimg.style.transition = 'none'; papply(); });
      o.addEventListener('mousemove', function (e) { if (!pz.d) return; pz.x = e.clientX - pz.d.x; pz.y = e.clientY - pz.d.y; pz.moved = true; papply(); });
      o.addEventListener('mouseup', function () { if (!pz.d) return; pz.d = null; pimg.style.transition = 'transform .15s'; papply(); });
      pimg.addEventListener('click', function (e) { e.stopPropagation(); pz.moved = false; });
    }
    function key(e) { if (e.key === 'Escape') close(); }
    function close() { o.remove(); document.removeEventListener('keydown', key); if (back && back.isConnected && back.focus) back.focus(); }
    o.addEventListener('click', function () { if (pz.moved) { pz.moved = false; return; } close(); }); o.querySelector('.x').addEventListener('click', function (e) { e.stopPropagation(); close(); }); document.body.appendChild(o); document.addEventListener('keydown', key); o.querySelector('.x').focus();
  }
  function stageUrl() { if (ui.view === 'me' && (ui.angle === 'side' || ui.angle === 'back')) { var ak = angWornKey(wearSet()); if (angTryOk(ui.angle, ak)) return urls.angTry[ui.angle][ak]; } var w = wornNow(); return ui.view === 'model' ? modelShow() : w ? w.url : avatarStage(); }
  var ACT = {
    go: function (el) { go(el.dataset.page); },
    /* 폰 앱(shorts.js ACT.plan)과 같은 동작: 결제 연결 전이라 이 기기 안에서만 플랜을 바꾼다 */
    planPick: function (el) { var k = el.dataset.plan; if (!FD.plans[k] || subNow().plan === k) return; subNow().plan = k; save(); toast(FD.plans[k].name + ' 플랜으로 바꿨어요 (결제 연동 전 체험용).'); render(); },
    logout: function () {
      if (genPending && !confirm('입은 모습을 만드는 중이에요. 프로필을 바꾸면 이 화면에서는 결과를 받지 못해요. 계속할까요?')) return;
      try { localStorage.removeItem(CUR_KEY); } catch (e) {}
      genPending = null; angBusy = null; ui.genErr = null; waitEnd(); pendClear(); clearUrls(); user = null; state = null; render();
    },
    lgNew: function () { ui.lg.mode = 'new'; ui.lg.err = ''; render(); },
    lgPick: function (el) { ui.lg.mode = 'pin'; ui.lg.id = el.dataset.id; ui.lg.err = ''; render(); },
    lgBack: function () { ui.lg.mode = 'list'; ui.lg.err = ''; render(); },
    lgLogin: function () { var u = Core.userById(ui.lg.id); if (!u) { ACT.lgBack(); return; } if (!checkPin(u)) return; user = u; state = load(); enterApp(); },
    lgCreate: function () {
      var users = Core.readUsers(), nick = val('lgnick').trim(), pin = val('lgpin'), pin2 = val('lgpin2');
      if (!nick) return lgErr('닉네임을 입력해 주세요.');
      if (users.some(function (u) { return u.nick === nick; })) return lgErr('이미 있는 닉네임입니다.');
      if (!/^\d{4}$/.test(pin)) return lgErr('PIN은 숫자 4자리로 입력해 주세요.');
      if (pin !== pin2) return lgErr('PIN 확인이 일치하지 않습니다.');
      var salt = Math.random().toString(36).slice(2, 10), g = val('lggender') || 'female', hh = val('lgh'), ww = val('lgw');
      var u = { id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nick: nick, salt: salt, pin: Core.pinHash(salt, pin), created: Date.now() };
      users.push(u); Core.writeUsers(users); user = u; state = blankState();
      state.profile.gender = g; state.profile.height = hh; state.profile.weight = ww;
      save(); enterApp();
    },
    homeKind: function (el) { ui.homeKind = ui.homeKind === el.dataset.v ? '' : el.dataset.v; render(); },
    homeCat: function (el) { var c = el.dataset.cat; if (ui.pend) { routeHome(c); return; } ui.homeCat = ui.homeCat === c ? null : c; render(); },
    pendClear: function () { pendClear(); render(); },
    styleTry: function (el) { var st = FD.styles.filter(function (s) { return s.id === el.dataset.id; })[0]; if (!st) return; importStyle(st); ui.left = 'clothes'; ui.view = styleForMe(st) ? 'model' : 'me'; ui.fitTab = null; go('fitting'); },
    left: function (el) { ui.left = el.dataset.v; ui.accFull = false; render(); },
    /* 2026-11-14 피팅룸 「기본 모델/내 아바타」 탭은 보기만이 아니라 입어볼 대상도 같이 고른다(예전엔 탭만 바뀌고 입히기는 내 아바타로 나갔음). 내 아바타 사진이 없으면 「내 아바타」 탭은 대상을 바꾸지 않는다 */
    view: function (el) {
      var v = el.dataset.v;
      if (v === 'model' && who() !== 'base') { state.who = 'base'; ui.bodyTab = 'base'; save(); }
      else if (v === 'me' && who() !== 'me' && urls.avatar) { state.who = 'me'; ui.bodyTab = 'me'; save(); }
      ui.view = v; render();
    },
    angle: function (el) { ui.angle = el.dataset.v; render(); },
    genView: function (el) { var gv = el.dataset.v; state.genViews = state.genViews || { front: true }; state.genViews[gv] = !state.genViews[gv]; save(); render(); },
    avSetupRe: function () { state.avBg = {}; avSetBusy = {}; save(); avSetupAuto(); render(); toast('아바타 세팅을 다시 하고 있어요.'); },
    avatarAngDel: function (el) { var av = el.dataset.v; if (ANGS.indexOf(av) < 0 || !confirm('내 아바타 ' + ANG_NAME[av] + ' 사진을 지울까요?')) return; if (urls.ang[av]) URL.revokeObjectURL(urls.ang[av]); urls.ang[av] = null; state.avAngSeq = state.avAngSeq || {}; state.avAngSeq[av] = (state.avAngSeq[av] || 0) + 1; save(); blobDel('avatar_' + av).catch(function () {}); render(); },
    zoom: function (el) { var i = ZOOMS.indexOf(ui.zoom), d = el.dataset.v; ui.zoom = d === '1' ? 1 : ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, i + (d === '+' ? 1 : -1)))]; render(); },
    rpToggle: function () { ui.rpOff = !ui.rpOff; render(); },
    fitStyle: function (el) { state.profile.pref = el.dataset.v; save(); render(); },
    skinPick: function (el) { var was = ui.skinOpen; ui.skinOpen = false; if ((window.FitSkin && window.FitSkin.set(el.dataset.v)) || was) { render(); if (was) { var sb = document.getElementById('skinbtn'); if (sb) sb.focus(); } } },
    skinMenu: function () { ui.skinOpen = !ui.skinOpen; render(); },
    resetSel: function () {
      if (genPending) return;
      state.sel = {}; state.accSel = []; delete state.wearLast; ui.genErr = null; ui.zoom = 1; ui.angle = 'front'; ui.fitTab = null; ui.accFull = false; save(); render();
      toast('고른 옷과 액세서리를 모두 뺐어요. 내 옷장과 입어본 기록은 그대로 남아 있어요.', 4000);
    },
    waitShow: function () { var o = document.getElementById('wait'); if (o) o.style.display = ''; },
    fitTab: function (el) { ui.fitTab = el.dataset.cat; render(); },
    unsel: function (el) { delete state.sel[el.dataset.cat]; if (!wearSet().length) delete state.wearLast; /* 2026-11-18 옷을 다 빼면 마지막 입은 그림 대신 원래 아바타 */ save(); render(); },
    wearOpt: function (el) { if (el.dataset.k === 'outerClosed') state.outerClosed = el.dataset.v === 'closed' ? 'closed' : 'open'; else if (el.dataset.k === 'beltUse') state.beltUse = el.dataset.v === 'on' ? 'on' : 'off'; else if (el.dataset.k === 'tuckIn') state.tuckIn = el.dataset.v === 'in' ? 'in' : 'out'; save(); render(); },
    hemTo: function (el) { state.hemTo = el.dataset.v; save(); render(); },
    size: function (el) { var s = state.sel[el.dataset.cat]; if (s) { s.size = el.dataset.v; save(); render(); } },
    toCloset: function (el) { ui.closetCat = el.dataset.cat; formFollow(ui.closetCat); go('closet'); },
    wear: wearAll,
    wearAcc: accWear,
    zoomStage: function () { openFull(stageUrl(), '입은 모습', true); },
    open3d: open3d,
    savePic: function () {
      var w = wornNow(), ak = ui.view === 'me' && (ui.angle === 'side' || ui.angle === 'back') ? angWornKey(wearSet()) : '';
      if (ak && angTryOk(ui.angle, ak)) w = { url: urls.angTry[ui.angle][ak], name: (lookName(ak) || '옷') + '_' + ANG_NAME[ui.angle] };
      if (!w) { toast('저장할 입은 모습이 아직 없어요.'); return; }
      var a = document.createElement('a'); a.href = w.url; a.download = 'FITON_' + String(w.name).replace(/[\\/:*?"<>|]/g, '_').slice(0, 40) + '.png'; document.body.appendChild(a); a.click(); a.remove();
    },
    closetKind: function (el) { ui.closetKind = el.dataset.v; render(); },
    closetCat: function (el) { ui.closetCat = el.dataset.cat; formFollow(ui.closetCat); ui.closetKind = 'all'; ui.linkEdit = null; render(); },
    pickItem: function (el) { var it = item(el.dataset.id); if (!it) return; ui.cfModal = false; cfLoad(it); if (it.kind === 'under') { toast('언더웨어는 사이즈 확인용으로만 저장돼요. 입어보기에는 쓰지 않아요.', 4000); render(); return; } var c = state.sel[it.cat]; if (c && c.id === it.id) delete state.sel[it.cat]; else { state.sel[it.cat] = { id: it.id, size: null }; exclusiveSel(it.cat); } save(); render(); },
    linkOpen: function (el) { ui.linkEdit = { id: el.dataset.id, err: false }; render(); var i = document.getElementById('lkin'); if (i) i.focus(); },
    linkCancel: function () { ui.linkEdit = null; render(); },
    linkSave: function (el) {
      var u = val('lkin').trim(), it = el.dataset.kind === 'a' ? accItem(el.dataset.id) : item(el.dataset.id);
      if (!/^https?:\/\//i.test(u) || !safeUrl(u)) { ui.linkEdit.err = true; render(); return; }
      if (it) { it.url = u; it.gone = false; save(); } ui.linkEdit = null; render();
    },
    markGone: function (el) { var it = el.dataset.kind === 'a' ? accItem(el.dataset.id) : item(el.dataset.id); if (it) { it.gone = true; save(); render(); } },
    exOpen: function (el) {
      if (!Core.genEnabled()) { toast('지금은 AI 기능을 쓸 수 없어요.'); return; }
      if (ui.exBusy) { toast('다른 옷을 뽑는 중이에요. 끝난 뒤 다시 해 주세요.'); return; }
      ui.exEdit = { id: el.dataset.id }; ui.linkEdit = null; render();
    },
    exCancel: function () { ui.exEdit = null; render(); },
    exGo: function (el) {
      var it = item(el.dataset.id), k = document.getElementById('exk'), c = document.getElementById('exc');
      if (!it || !k) return;
      if (genPending) { toast('지금 입은 모습을 만드는 중이에요. 끝난 뒤 다시 해 주세요.'); return; }
      if (ui.exBusy) { toast('다른 옷을 뽑는 중이에요. 끝난 뒤 다시 해 주세요.'); return; }
      if (tryLeft() <= 0) { toast('이번 달 입어보기 횟수를 다 썼어요.'); go('plan'); return; }
      var ex = { kind: k.value, color: c ? c.value : '' };
      if (!confirm('사진 속에서 「' + exLabel(ex, it.cat) + '」만 흰 배경 상품 사진으로 뽑아 이 옷의 사진으로 바꿔요.\n\n· 상품 사진이 AI 이미지 생성 서버(Supabase·Kling)로 전송돼요.\n· 입어보기 횟수 1회가 쓰여요. (남은 ' + tryLeft() + '회)\n· 1~2분 걸려요. 원래 사진은 보관돼 「원래 사진으로」로 되돌릴 수 있어요.\n\n계속할까요?')) return;
      exRun(it.id, ex.kind, ex.color);
    },
    exUndo: function (el) {
      var it = item(el.dataset.id); if (!it || !it.ext) return;
      if (genPending && String(genPending).split('+').indexOf(it.id) >= 0) { toast('입히는 중인 옷은 지금 바꿀 수 없어요. 끝난 뒤 다시 해 주세요.'); return; }
      if (!confirm('"' + it.name + '"을(를) 원래 사진으로 되돌릴까요? 뽑은 사진은 지워져요.')) return;
      var id = it.id;
      blobGet('gphoto0:' + id).catch(function () { return null; }).then(function (b) { return b ? blobPut('gphoto:' + id, b) : blobDel('gphoto:' + id).catch(function () {}); }).then(function () {
        var cur = item(id); if (!cur) return;
        /* 뽑기로 붙인 이름이 그대로면 원래 이름으로(그사이 직접 고쳤으면 그대로) */
        if (cur.name0 != null && cur.name === exLabel(cur.ext, cur.cat)) cur.name = cur.name0;
        cur.photo = cur.photo0 || cur.photo; delete cur.photo0; delete cur.ext; delete cur.name0;
        blobDel('gphoto0:' + id).catch(function () {}); save(); toast('원래 사진으로 되돌렸어요.', 2500); render();
      }).catch(function () { toast('되돌리지 못했어요. 다시 시도해 주세요.'); });
    },
    editItem: function (el) {
      var it = item(el.dataset.id); if (!it) return; ui.cfModal = false;
      /* 저장된 이미지 표가 있으면 그대로, 없거나(예전 옷) 폰 앱에서 값을 고쳐 어긋났으면 sizes 기준으로 만든 표(저장 자료는 저장할 때만 바뀐다) */
      cfLoad(it); render();
    },
    zoomSize: function () { if (ui.cf && ui.cf.sizeUrl) openFull(ui.cf.sizeUrl, '사이즈표 이미지'); },
    linkRead: function () {
      var f = ui.cf, c = window.TRYON_CFG, url = String(f && f.url || '').trim();
      if (!linkReadOn() || f.linkBusy) return;
      if (!/^https?:\/\//i.test(url)) { f.err = '상품 링크를 https:// 로 시작하는 주소로 넣어 주세요.'; render(); return; }
      f.linkBusy = true; f.err = ''; render();
      fetch(c.url.replace(/\/$/, '') + '/functions/v1/linkread', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: c.anon, Authorization: 'Bearer ' + c.anon }, body: JSON.stringify({ device: Core.deviceId(), url: url }) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j && j.error || '링크를 읽지 못했어요.'); return j; }); })
        .then(function (j) {
          if (ui.cf !== f) return;
          f.linkBusy = false;
          if (!j.found) { f.err = '이 페이지에서 이름·가격을 찾지 못했어요. 직접 입력해 주세요.'; render(); return; }
          var got = [];
          if (j.title && !String(f.name || '').trim()) { f.name = j.title.slice(0, 60); got.push('이름'); }
          if (j.price && !String(f.price || '').trim()) {
            var n = Number(String(j.price).replace(/,/g, ''));
            f.price = n && (!j.currency || j.currency === 'KRW') ? n.toLocaleString('ko-KR') + '원' : (j.currency ? j.currency + ' ' : '') + j.price; got.push('가격');
          }
          if (j.material && f.cat !== 'shoe') {
            var mt = String(j.material), fb = /데님|denim|청\s*\d|jean/i.test(mt + ' ' + (j.title || '')) ? 'denim' : /(스판덱스|spandex|엘라스탄|elastane|폴리우레탄|polyurethane|스판)\D{0,6}([2-9]|\d{2})\s*%|(스판덱스|spandex|엘라스탄|elastane|폴리우레탄|polyurethane)\s*([2-9]|\d{2})/i.test(mt) ? 'stretch' : /니트|knit|울|wool|캐시미어|cashmere|아크릴|acrylic/i.test(mt + ' ' + (j.title || '')) && /니트|knit|스웨터|sweater|가디건|cardigan/i.test(j.title || mt) ? 'knit' : '';
            if (fb && (!f.fabric || f.fabric === 'normal') && cfgNow().fabric[fb]) { f.fabric = fb; got.push('원단(' + cfgNow().fabric[fb].label + ')'); }
            f.material = mt.slice(0, 120);
          }
          f.saved = false;
          toast(got.length ? got.join('·') + '을(를) 채웠어요. 내용이 맞는지 확인해 주세요.' : '비어 있는 칸이 없어서 바꾸지 않았어요.', 3500); render();
        }).catch(function (e) { if (ui.cf !== f) return; f.linkBusy = false; f.err = (e && e.message) || '링크를 읽지 못했어요.'; render(); });
    },
    cfNew: function () { ui.cf = blankForm(ui.closetCat); ui.cfModal = true; render(); },
    cfCancel: function () { ui.cfModal = false; ui.cf = blankForm(ui.closetCat); render(); },
    sizeAdd: function () { var t = ui.cf.table; ui.cf.tEdit = true; if (t) t.rows.push([''].concat(t.head.map(function () { return ''; }))); else ui.cf.sizes.push({ label: '' }); render(); },
    sizeDel: function (el) { var t = ui.cf.table; ui.cf.tEdit = true; if (t) t.rows.splice(Number(el.dataset.i), 1); else ui.cf.sizes.splice(Number(el.dataset.i), 1); render(); },
    colAdd: function () {
      var t = ui.cf.table; if (!t) return;
      ui.cf.tEdit = true; t.head.push(''); t.keys.push(null); t.conv.push(null); if (t.k0) { t.k0.push(null); t.c0.push(null); } t.rows.forEach(function (r) { r.push(''); }); render();
      var e = document.getElementById('th' + (t.head.length - 1)); if (e) e.focus();
    },
    colDel: function (el) {
      var t = ui.cf.table, i = Number(el.dataset.i); if (!t || !(i >= 0 && i < t.head.length)) return;
      ui.cf.tEdit = true; t.head.splice(i, 1); t.keys.splice(i, 1); t.conv.splice(i, 1); if (t.k0) { t.k0.splice(i, 1); t.c0.splice(i, 1); } t.rows.forEach(function (r) { r.splice(i + 1, 1); }); render();
    },
    cfSave: function () {
      var f = ui.cf, sizes = f.table ? FitNotes.tblSizes(f.table) : f.sizes.filter(function (s) { return String(s.label || '').trim() !== ''; });
      if (!sizes.length) { f.err = '사이즈 이름을 하나 이상 넣어 주세요.'; toast(f.err, 3500); render(); return; }
      if (f.url && (!/^https?:\/\//i.test(String(f.url).trim()) || !safeUrl(f.url))) { f.err = '상품 링크는 https://로 시작하는 주소를 넣어 주세요.'; toast(f.err, 3500); render(); return; }
      var hasM = sizes.some(function (s) { return Object.keys(s).some(function (k) { return k !== 'label' && s[k] != null && s[k] !== ''; }); });
      if (!f.id && !f.photo && !String(f.name || '').trim() && !hasM) { f.err = '상품 사진, 이름, 사이즈표 중 하나는 넣어 주세요.'; toast(f.err, 3500); render(); return; }
      if (f.cat === 'top' && !f.noOuterAsk && OUTER_WORDS.test(String(f.name || ''))) {
        if (confirm('「' + String(f.name).trim().slice(0, 30) + '」은(는) 겉에 입는 옷 같아요.\n\n겉옷으로 저장하면 셔츠 같은 상의 위에 겹쳐 입혀 볼 수 있어요. (정장 재킷·코트·카디건 등)\n\n[확인] 겉옷으로 저장\n[취소] 상의로 그대로 저장')) f.cat = 'outer'; else f.noOuterAsk = true;
      }
      var odd = oddSizes(f.cat, f.measureType, sizes);
      if (odd.length && !confirm('보통 범위를 벗어난 값이 있어요.\n\n' + odd.slice(0, 6).join('\n') + (odd.length > 6 ? '\n… 외 ' + (odd.length - 6) + '개' : '') + '\n\n이 값으로 핏을 계산하고 입은 모습을 그려서, 틀리면 결과가 이상해져요. 그대로 저장할까요?')) { f.err = '표시된 값을 확인한 뒤 다시 저장해 주세요: ' + odd[0].replace(/^· /, ''); toast(f.err, 5000); render(); return; }
      var old = f.id ? item(f.id) : null, rec = old ? JSON.parse(JSON.stringify(old)) : { id: 'p' + (state.seq++), gender: isMale() ? 'male' : 'female', fabric: 'normal', isRef: false, refSize: '' };
      rec.cat = f.cat; rec.name = String(f.name || '').trim() || (CATS[f.cat] + ' ' + rec.id.slice(1)); rec.short = String(f.short || '').trim(); rec.price = f.price; rec.url = f.url; rec.measureType = f.cat === 'shoe' ? '' : f.measureType || 'flat'; rec.sizes = sizes; rec.photo = f.photo;
      if (f.table && f.cat !== 'shoe') rec.table = FitNotes.tblClean(f.table, rec.measureType); else delete rec.table;
      if (f.cat === 'shoe') {
        var hv = String(f.heel == null ? '' : f.heel).replace(/[^\d.]/g, ''), hn = hv === '' ? null : Number(hv);
        if (hn != null && (!(hn >= 0) || hn > 200)) { f.err = '굽 높이는 0~200 mm 사이 숫자로 넣어 주세요.'; toast(f.err, 3500); render(); return; }
        if (hn == null) delete rec.heel; else rec.heel = hn;
      } else delete rec.heel;
      rec.kind = f.cat === 'shoe' ? '' : (f.kind || guessKind(rec.name, f.cat) || '');
      rec.fabric = f.cat === 'shoe' ? 'normal' : (cfgNow().fabric[f.fabric] ? f.fabric : 'normal');
      if (rec.kind === 'under' && state.sel[rec.cat] && state.sel[rec.cat].id === rec.id) delete state.sel[rec.cat];
      if (old) state.closet = state.closet.map(function (x) { return x.id === rec.id ? rec : x; }); else state.closet.push(rec);
      if (old && old.cat !== rec.cat && state.sel[old.cat] && state.sel[old.cat].id === rec.id) delete state.sel[old.cat];
      if (f.sizeBig) { blobPut('gsize:' + rec.id, f.sizeBig).catch(function () {}); rec.hasSize = true; }
      if (f.big) blobPut('gphoto:' + rec.id, f.big).catch(function () {});
      else if (old && old.photo !== rec.photo) blobDel('gphoto:' + rec.id).catch(function () {});
      /* 사진을 새로 넣었거나 바꿨으면 「옷만 뽑은 사진」 표시와 보관한 원래 사진을 지운다(새 사진은 코디 사진일 수 있다) */
      if (rec.ext && (f.big || (old && old.photo !== rec.photo))) { delete rec.ext; delete rec.photo0; blobDel('gphoto0:' + rec.id).catch(function () {}); }
      if (!state.sel[rec.cat] && rec.kind !== 'under') selectItem(rec);
      save(); ui.closetCat = rec.cat; ui.cfModal = false; cfLoad(rec); ui.cf.saved = true; toast((rec.cat === 'shoe' ? '신발장' : '옷장') + '에 저장했어요.', 2500); render();
    },
    delItem: function (el) {
      if (genPending && String(genPending).split('+').indexOf(el.dataset.id) >= 0) { toast('입히는 중인 옷은 지금 삭제할 수 없어요. 끝난 뒤 다시 해 주세요.'); return; }
      var it = item(el.dataset.id); if (!it || !confirm('"' + it.name + '"을(를) 내 ' + (it.cat === 'shoe' ? '신발장' : '옷장') + '에서 삭제할까요? 이 ' + (it.cat === 'shoe' ? '신발' : '옷') + '으로 만든 입은 모습도 함께 지워져요.')) return;
      state.closet = state.closet.filter(function (x) { return x.id !== it.id; });
      Object.keys(state.sel).forEach(function (c) { if (state.sel[c] && state.sel[c].id === it.id) delete state.sel[c]; });
      dropTryon(it.id); Object.keys(state.looks || {}).forEach(function (k) { if (k.split('+').indexOf(it.id) >= 0) dropTryon(k); });
      blobDel('gphoto:' + it.id).catch(function () {}); blobDel('gphoto0:' + it.id).catch(function () {}); blobDel('gsize:' + it.id).catch(function () {}); ui.cfModal = false; ui.cf = blankForm(ui.closetCat); save(); render();
    },
    accTab: function (el) { ui.accTab = el.dataset.v; ui.linkEdit = null; render(); },
    accToggle: function (el) {
      var id = el.dataset.id, i = state.accSel.indexOf(id);
      if (i >= 0) { state.accSel.splice(i, 1); ui.accFull = false; } else if (state.accSel.length >= 10) ui.accFull = true; else { state.accSel.push(id); ui.accFull = false; }
      save(); render();
    },
    toFitAcc: function () { ui.left = 'acc'; go('fitting'); },
    afClear: function () { ui.af.photo = ''; ui.af.big = null; render(); },
    /* 2026-11-16 저장한 액세서리 수정: 오른쪽 입력 칸에 불러와 같은 칸에서 고친다(사진을 안 바꾸면 원래 큰 사진을 그대로 둔다) */
    accEdit: function (el) {
      var it = accItem(el.dataset.id); if (!it) return;
      ui.af = { id: it.id, type: it.type, name: it.name || '', price: it.price || '', url: it.url || '', photo: it.photo || '', big: null, saved: false, err: '' };
      render(); try { var n = app.querySelector('#aname'); if (n) { n.scrollIntoView({ block: 'center' }); n.focus(); } } catch (e) {}
    },
    afCancel: function () { ui.af = blankAcc(); render(); },
    afSave: function () {
      var f = ui.af, name = String(f.name || '').trim(), url = String(f.url || '').trim();
      f.saved = false;
      if (!f.photo) { f.err = '상품 사진을 넣어 주세요.'; render(); return; }
      if (!name) { f.err = '이름을 넣어 주세요.'; render(); return; }
      if (url && (!/^https?:\/\//i.test(url) || !safeUrl(url))) { f.err = '상품 링크는 https://로 시작하는 주소를 넣어 주세요.'; render(); return; }
      if (f.id) {
        var cur = accItem(f.id);
        if (!cur) { f.err = '수정할 액세서리를 찾지 못했어요.'; render(); return; }
        cur.name = name; cur.type = f.type; cur.photo = f.photo; cur.price = String(f.price || '').trim(); cur.url = url; delete cur.gone;
        if (f.big) blobPut('aphoto:' + cur.id, f.big).catch(function () {});
        save(); ui.af = blankAcc(); ui.af.saved = true; render(); return;
      }
      var rec = { id: 'a' + (state.seq++), name: name, type: f.type, photo: f.photo, price: String(f.price || '').trim(), url: url };
      state.accs.unshift(rec); if (f.big) blobPut('aphoto:' + rec.id, f.big).catch(function () {});
      save(); ui.accTab = 'all'; ui.af = blankAcc(); ui.af.saved = true; render();
    },
    accDel: function (el) {
      var it = accItem(el.dataset.id); if (!it || !confirm('"' + it.name + '"을(를) 삭제할까요?')) return;
      state.accs = state.accs.filter(function (x) { return x.id !== it.id; }); state.accSel = state.accSel.filter(function (x) { return x !== it.id; });
      blobDel('aphoto:' + it.id).catch(function () {}); save(); render();
    },
    histPick: function (el) { ui.cmp = el.dataset.id; render(); },
    /* 2026-11-19 사용자 지시: 내 몸 정보에서 아바타(앞·옆·뒤 큰 사진)를 누르면 크게 보기 */
    bodyZoom: function (el) { var u = el.getAttribute('src'); if (u) openFull(u, el.alt); },
    histZoom: function (el) { var u = urls.tryon[el.dataset.id]; if (u) openFull(u, lookName(el.dataset.id)); },
    histShow: function (el) { var key = el.dataset.id, its = lookItems(key); if (!its.length) return; var hc = its.map(function (x) { return x.cat; }); Object.keys(state.sel).forEach(function (c) { if (hc.indexOf(c) < 0) delete state.sel[c]; }); its.forEach(selectItem); state.wearLast = key; save(); ui.view = 'me'; ui.left = 'clothes'; go('fitting'); if (urls.tryon[key] && !tryonOk(key)) toast('이 입은 모습은 지금과 다른 캐릭터로 만든 것이라 피팅룸에는 보이지 않아요. 입어본 기록에서는 계속 볼 수 있어요.', 6000); },
    histDel: function (el) { if (!confirm('이 입은 모습을 삭제할까요?')) return; dropTryon(el.dataset.id); ui.cmp = null; save(); render(); },
    bPreset: function (el) {
      var x = BASES.filter(function (q) { return q.id === el.dataset.id; })[0]; if (!x) return;
      /* 2026-11-12 기본 모델만 바꾼다. 내 아바타 사진·내 치수(state.profile)는 건드리지 않는다 */
      state.baseId = x.id; state.who = 'base'; ui.bodyTab = 'base'; ui.view = 'model'; save(); toast(x.name + ' 기본 모델로 입어봐요.', 2500); render();
    },
    /* 2026-11-14 내 몸 정보의 「기본 모델/내 아바타」 탭도 피팅룸 탭과 같이 입어볼 대상을 바꾼다(어느 쪽에서 바꿔도 같이 바뀜). 내 사진이 없으면 내 아바타로는 바꾸지 않음 */
    bTab: function (el) {
      var v = el.dataset.v === 'me' ? 'me' : 'base';
      ui.bodyTab = v;
      if (v === 'base' && who() !== 'base') { state.who = 'base'; save(); }
      else if (v === 'me' && who() !== 'me' && urls.avatar) { state.who = 'me'; save(); }
      ui.view = who() === 'base' ? 'model' : 'me'; /* 피팅룸 화면도 지금 캐릭터로 같이 바뀌게 */
      render();
    },
    bGender: function (el) { state.profile.gender = el.dataset.v; save(); render(); },
    bSave: function () {
      var bad = null, hv = String(val('h')), wv = String(val('w'));
      if (hv !== '' && !(+hv >= 100 && +hv <= 230)) bad = '키';
      else if (wv !== '' && !(+wv >= 20 && +wv <= 250)) bad = '몸무게';
      else Array.prototype.forEach.call(app.querySelectorAll('[data-mf]'), function (i) {
        if (bad || i.value === '') return;
        var mm = /mm/.test((i.nextElementSibling || {}).textContent || ''), v = +i.value, lb = i.closest('label');
        if (!(v > 0 && v <= (mm ? 400 : 250))) bad = ((lb && lb.firstChild && lb.firstChild.textContent) || '치수').trim();
      });
      if (bad) { toast(bad + ' 값을 확인해 주세요. 너무 크거나 작은 값은 저장되지 않아요.', 4000); return; }
      var p = state.profile; p.height = val('h'); p.weight = val('w'); p.m = p.m || {};
      Array.prototype.forEach.call(app.querySelectorAll('[data-mf]'), function (i) { if (i.value === '') delete p.m[i.dataset.mf]; else p.m[i.dataset.mf] = i.value; });
      /* 2026-11-12 내 치수를 저장하면 「내 아바타」로 입어본다(기본 모델 사용 중이어도 저장한 치수가 피팅룸에 바로 반영되게) */
      var sw = who() !== 'me'; state.who = 'me'; ui.bodyTab = 'me';
      save(); toast(sw ? '저장했어요. 이제 내 아바타로 입어봐요.' : '저장했어요.', 3000); render();
    },
    avatarDel: function () { if (!confirm('내 아바타 사진을 지울까요? 내 치수는 그대로 남아요.')) return; state.who = who(); /* 고른 적이 없던 사용자도 사진을 지운 뒤 지금 쓰던 쪽에 그대로 남는다 */ if (urls.avatar) URL.revokeObjectURL(urls.avatar); urls.avatar = null; state.avSeq = (state.avSeq || 0) + 1; save(); blobDel('avatar').catch(function () {}); render(); }
  };
  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (el && ACT[el.dataset.act]) ACT[el.dataset.act](el);
    else if (e.target.dataset && e.target.closest('.fig') && e.target.tagName === 'IMG') openFull(e.target.getAttribute('src'), e.target.alt, !!e.target.closest('.vwrap') && !e.target.closest('.cmpv, .cmpbox')); /* 피팅룸 큰 사진(비교 화면 제외)은 배경 칠하기·크기 맞춤 */
  });
  /* 마우스 휠로 확대·축소: 피팅룸 입은 모습(위쪽 − 100% + 버튼과 같은 단계), 입어본 기록 오른쪽 사진(1~4배, 다른 기록을 고르면 처음 크기) */
  app.addEventListener('wheel', function (e) {
    if (!e.deltaY) return;
    var fg = e.target.closest('.cmp figure');
    if (fg) {
      var im = fg.querySelector('img'); if (!im) return;
      e.preventDefault();
      var z = Number(im.dataset.z) || 1, nz = Math.max(1, Math.min(4, Math.round((z + (e.deltaY < 0 ? 0.25 : -0.25)) * 100) / 100));
      if (z === 1 && nz > 1) { var r = im.getBoundingClientRect(); im.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%'; }
      im.dataset.z = nz; im.style.transform = nz === 1 ? '' : 'scale(' + nz + ')';
    }
  }, { passive: false });
  /* 스킨 드롭다운: 바깥을 누르면 닫는다(메뉴·버튼 안쪽 누름은 위 ACT 가 처리) */
  document.addEventListener('click', function (e) { if (ui.skinOpen && !(e.target.closest && e.target.closest('.skindd'))) { ui.skinOpen = false; render(); } });
  app.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && ui.skinOpen) { ui.skinOpen = false; render(); var sb0 = document.getElementById('skinbtn'); if (sb0) sb0.focus(); return; }
    if (e.key === 'Escape' && app.querySelector('.cfmodal')) { ui.cfModal = false; ui.cf = blankForm(ui.closetCat); render(); return; }
    if (e.key === 'Enter' && e.target.id && /^lg/.test(e.target.id)) { var b = app.querySelector('[data-act="lgLogin"],[data-act="lgCreate"]'); if (b) b.click(); }
    /* 2026-11-19 내 몸 정보 아바타 사진: 키보드(Enter·Space)로도 크게 보기 */
    if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset && e.target.dataset.act === 'bodyZoom') { e.preventDefault(); e.target.click(); }
  });
  app.addEventListener('input', function (e) {
    var t = e.target, d = t.dataset;
    if (d.cf) { ui.cf[d.cf] = t.value; ui.cf.saved = false; ui.cf.err = ''; }
    else if (d.af) { ui.af[d.af] = t.value; ui.af.saved = false; ui.af.err = ''; }
    else if (d.th != null) { if (ui.cf.table) { ui.cf.tEdit = true; ui.cf.table.head[Number(d.th)] = t.value.replace(/[\r\n]+/g, ' '); headKey(Number(d.th)); } }
    else if (d.sl != null) { ui.cf.tEdit = true; if (ui.cf.table) ui.cf.table.rows[Number(d.sl)][0] = t.value; else ui.cf.sizes[Number(d.sl)].label = t.value; }
    else if (d.sf) {
      var p = d.sf.split(':'); ui.cf.tEdit = true;
      if (ui.cf.table) ui.cf.table.rows[Number(p[0])][Number(p[1]) + 1] = t.value;
      else { var z = ui.cf.sizes[Number(p[0])]; if (t.value === '') delete z[p[1]]; else z[p[1]] = t.value; }
    }
  });
  app.addEventListener('change', function (e) {
    var t = e.target, c = t.dataset.chg;
    if (c === 'shoe') { state.tryShoe = t.value; save(); render(); return; }
    if (t.dataset.th != null) { headKey(Number(t.dataset.th)); return; }
    if (c === 'cfKind') { ui.cf.kind = t.value; render(); return; }
    if (c === 'cfFab') { ui.cf.fabric = cfgNow().fabric[t.value] ? t.value : 'normal'; ui.cf.saved = false; render(); return; }
    if (c === 'cfCat') {
      var f = ui.cf, was = f.cat === 'shoe', now = t.value === 'shoe';
      f.cat = t.value;
      if (was !== now) { f.sizes = defaultSizes(t.value); f.measureType = now ? '' : 'flat'; f.table = mkTable(f.cat, 'flat', f.sizes); f.capRaw = null; }
      else if (f.table) {
        /* AI 로 읽은 표면 같은 글을 새 옷 종류로 다시 푼다(단면/둘레·인치 판단까지 새로).
           아직 손대지 않았으면 통째로 바꾸고, 숫자만 고쳤으면(항목·사이즈 줄은 그대로) 고친 숫자는 두고 계산 칸·환산·단면/둘레만 새로 맞춘다.
           항목이나 줄을 고친 표·직접 입력한 표는 항목 이름으로 계산 칸만 다시 찾는다 */
        var r2 = null, t0 = f.table;
        if (f.capRaw && FitNotes.fromText) { try { r2 = FitNotes.fromText(f.capRaw, f.cat, prof().gender); } catch (e) { r2 = null; } }
        if (r2 && !f.tEdit) applyRead(f, r2);
        else if (r2 && r2.table && r2.table.rows.length === t0.rows.length && JSON.stringify(r2.table.head) === JSON.stringify(t0.head)) {
          applyRead(f, r2); f.table.rows = t0.rows; f.tEdit = true;
        } else f.table = FitNotes.tblRecat(f.table, f.cat, f.measureType, FIELDS[f.cat]);
      }
      render(); return;
    }
    if (c === 'afType') { ui.af.type = t.value; return; }
    var kind = t.dataset.file; if (!kind) return;
    var fl = t.files && t.files[0]; t.value = ''; if (!fl) return;
    if (kind === 'quick') homeFile(fl);
    else if (kind === 'sizeCap') sizeCap(fl);
    else if (kind === 'detailCap') detailCap(fl);
    else if (kind === 'photo') closetPhoto(fl);
    else if (kind === 'accPhoto') setAccPhoto(fl);
    else if (kind === 'avatar_side' || kind === 'avatar_back') { var av = kind.slice(7); Core.shrink(fl, 2000, 0.92).then(normAvatar).then(function (b) { return blobPut(kind, b).then(function () { if (urls.ang[av]) URL.revokeObjectURL(urls.ang[av]); urls.ang[av] = URL.createObjectURL(b); state.avAngSeq = state.avAngSeq || {}; state.avAngSeq[av] = (state.avAngSeq[av] || 0) + 1; save(); render(); avSetup(av, b); }); }).catch(function (err) { toast((err && err.message) || '이미지를 저장하지 못했어요.'); }); }
    else if (kind === 'avatar') Core.shrink(fl, 2000, 0.92).then(normAvatar).then(function (b) { return blobPut( /* 2026-11-13 A안: 표준 틀(867×1536)에 맞춰 저장 */'avatar', b).then(function () { if (urls.avatar) URL.revokeObjectURL(urls.avatar); urls.avatar = URL.createObjectURL(b); state.avSeq = (state.avSeq || 0) + 1; mySpan = { seq: -1, v: null, busy: false }; /* 새 아바타는 바로 사람 위치를 다시 읽어 눈금·크기에 적용 */ state.who = 'me'; ui.bodyTab = 'me'; save(); render(); avSetup('front', b); }); }).catch(function (err) { toast((err && err.message) || '이미지를 저장하지 못했어요.'); });
  });
  window.addEventListener('hashchange', function () { var p = pageFromHash(); if (p !== ui.page) { ui.page = p; render(); window.scrollTo(0, 0); } });
  /* 2026-11-10 다른 탭(검정·밝은 버전)이 같은 프로필을 저장하면 그 내용을 바로 다시 읽는다.
     예전에는 탭마다 옛 내용을 들고 있다가 저장하면서 다른 탭의 변경을 덮어썼다. 폰 앱(shorts.js) 탭은 고치지 않아 그대로다.
     글자를 넣는 중이면 화면은 입력 칸을 벗어난 뒤에 다시 그린다(넣던 글자·한글 조합이 끊기지 않게) */
  var syncT = null;
  function typing() { var a = document.activeElement; return !!(a && app.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== 'file'); }
  function syncDraw() { if (!user) return; if (typing()) { syncDue = true; return; } render(); }
  window.addEventListener('storage', function (e) {
    if (!user || !state || e.newValue == null || e.key !== KEY + ':' + user.id) return;
    state = load();
    if (ui.linkEdit && !item(ui.linkEdit.id) && !accItem(ui.linkEdit.id)) ui.linkEdit = null;
    clearTimeout(syncT);
    syncT = setTimeout(function () { var uid = user && user.id; loadMedia().then(function () { if (user && user.id === uid) syncDraw(); }); }, 200);
  });
  app.addEventListener('focusout', function () { if (syncDue) setTimeout(function () { if (syncDue) syncDraw(); }, 500); });

  /* ---------- 시작 ---------- */
  ui.cf = blankForm('outer'); ui.af = blankAcc();
  if (user) { state = load(); render(); loadMedia().then(function () { render(); genResume(); angResume(); }); }
  else render();
})();
