/* FITON for PC — 승인된 설계(fiton-pc-설계\v9_설계요약_결정반영\*.dc.html)의 화면을 그대로 옮기고, 예시 값 자리에 실제 데이터를 연결했다.
   폰 앱(shorts.js)과 같은 저장소·같은 입히기 서버를 쓴다. 공통 기능은 fit-core.js, 핏 계산은 fit-engine.js.
   겉옷·액세서리: 화면과 저장은 설계대로 동작하지만, 입히기 서버가 아직 받지 못해 입은 그림에는 들어가지 않는다(폰 앱·서버 수정 뒤 연결, 2026-11-06 사용자 결정).
   새 저장 값: sel.outer, accs, accSel. 폰 앱은 이 값을 읽지 않으며, 저장할 때 그대로 보존한다. */
(function () {
  'use strict';

  var Core = window.FitCore, E = window.FitEngine, KEY = Core.KEY, CUR_KEY = Core.CUR_KEY;
  var FD = window.FITON || { styles: [], plans: { free: { name: '무료', limit: 3, price: '', features: [] } } };
  var BASE_CFG = JSON.parse(JSON.stringify(window.FIT_CONFIG));
  var CATS = { outer: '겉옷', top: '상의', bottom: '하의', dress: '원피스', shoe: '신발' };
  var CAT_ORDER = ['outer', 'top', 'bottom', 'dress', 'shoe'];
  /* 용도 태그(kind): 옷장을 보기 좋게 나누는 값. 입히기·핏·서버 요청은 cat(겉옷·상의·하의…)만 쓰고 kind 는 쓰지 않는다. 언더웨어만 입히기에서 뺀다 */
  var KINDS = [['suit', '정장'], ['inner', '이너(티·드레스셔츠)'], ['home', '홈웨어'], ['sport', '트레이닝'], ['two', '투피스'], ['under', '언더웨어']];
  var KIND_NAME = {}; KINDS.forEach(function (k) { KIND_NAME[k[0]] = k[1].replace(/\(.*\)/, ''); });
  var KIND_GUESS = [['under', /속옷|언더웨어|팬티|브라|런닝|내의|보정|스타킹|양말/], ['home', /잠옷|파자마|홈웨어|라운지|수면|극세사/], ['sport', /트레이닝|츄리닝|운동|조거|요가|레깅스|저지|스포츠|러닝/], ['two', /투피스|세트|셋업|set/i], ['suit', /정장|수트|슈트|블레이저|자켓|재킷|슬랙스/], ['inner', /티셔츠|반팔|드레스셔츠|와이셔츠|셔츠|나시|민소매|이너|히트텍/]];
  function guessKind(name, cat) {
    if (cat === 'shoe' || cat === 'dress') return '';
    var t = String(name || '');
    for (var i = 0; i < KIND_GUESS.length; i++) if (KIND_GUESS[i][1].test(t)) return KIND_GUESS[i][0];
    return '';
  }
  var GGENDER = { female: '여성용', male: '남성용', unisex: '공용' };
  var PREFS = [['tight', '타이트'], ['fit', '정핏'], ['loose', '여유'], ['over', '오버핏']];
  var TOPF = [['chest', '가슴단면'], ['shoulder', '어깨'], ['length', '총장'], ['sleeve', '소매'], ['armhole', '암홀단면'], ['sleeve_width', '소매통단면'], ['hem', '밑단단면']];
  var FIELDS = {
    outer: TOPF, top: TOPF,
    bottom: [['waist', '허리단면'], ['hip', '엉덩이단면'], ['thigh', '허벅지단면'], ['knee', '무릎단면'], ['rise', '밑위'], ['inseam', '기장(인심)'], ['hem', '밑단단면'], ['length', '총장(스커트)']],
    dress: [['chest', '가슴단면'], ['shoulder', '어깨'], ['waist', '허리단면'], ['hip', '엉덩이단면'], ['length', '총장'], ['sleeve', '소매'], ['armhole', '암홀단면'], ['sleeve_width', '소매통단면'], ['hem', '밑단단면']],
    shoe: [['inner', '안쪽 길이(mm)']]
  };
  var MFIELDS = [['chest', '가슴둘레', 'cm'], ['shoulder', '어깨너비', 'cm'], ['waist', '허리둘레', 'cm'], ['hip', '엉덩이둘레', 'cm'], ['thigh', '허벅지둘레', 'cm'],
    ['arm', '팔길이', 'cm'], ['inseam', '다리 안쪽 길이', 'cm'], ['rise', '밑위(앞)', 'cm'], ['foot', '발길이', 'mm']];
  var SHOE_TYPES = [['pumps', '구두 (기본)'], ['sneakers', '운동화'], ['loafers', '로퍼'], ['sandals', '샌들'], ['boots', '부츠']];
  var ACC_TYPES = {
    '모자': { part: 'head', top: '3%', left: '44%', icon: 'M8 5h8l2 9H6zM3 14h18l-1 3H4z' },
    '안경': { part: 'head', top: '9%', left: '42%', icon: 'M3 10h7v3a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM14 10h7v3a3 3 0 0 1-3 3h-1a3 3 0 0 1-3-3zM10 11h4' },
    '귀걸이': { part: 'head', top: '12%', left: '57%', small: true, icon: 'M12 3v8M12 11a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
    '스카프·목도리': { part: 'neck', top: '16%', left: '46%', icon: 'M5 6c4 3 10 3 14 0M5 6v3c4 3 10 3 14 0V6M9 11l-2 10h4l2-9' },
    '목걸이': { part: 'neck', top: '22%', left: '47%', small: true, icon: 'M5 4c0 7 3 11 7 12 4-1 7-5 7-12M12 16v2M12 18l-2 2 2 2 2-2z' },
    '가방': { part: 'body', top: '45%', left: '62%', icon: 'M5 10h14l1 10H4zM8 10V7a4 4 0 0 1 8 0v3' },
    '벨트': { part: 'body', top: '38%', left: '44%', icon: 'M2 10h20v5H2zM9 8h6v9H9zM12 12.5h3' },
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
  var NOT_YET = '겉옷·액세서리는 아직 입은 그림에 들어가지 않아요. 서버가 준비되면 함께 입혀 드려요.';

  var app = document.getElementById('app');
  var user = (function () { try { return Core.userById(localStorage.getItem(CUR_KEY)); } catch (e) { return null; } })();
  var state = null, urls = { avatar: null, tryon: {} }, genPending = null;
  var ui = { page: pageFromHash(), view: 'me', angle: 'front', zoom: 1, rpOff: false, genErr: null, genSizes: {}, left: 'clothes', fitTab: null, closetCat: 'outer', closetKind: 'all', homeKind: '', accTab: 'all', cmp: null, pend: null, homeCat: null, linkEdit: null, accFull: false,
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
    urls = { avatar: null, tryon: {} };
  }
  function loadMedia() {
    if (!user) return Promise.resolve();
    var uid = user.id, ids = state.closet.map(function (x) { return x.id; }).concat(Object.keys(state.looks || {}));
    return Promise.all([blobGet('avatar')].concat(ids.map(function (id) { return blobGet('tryon:' + id); }))).then(function (r) {
      if (!user || user.id !== uid) return;
      clearUrls();
      if (r[0]) urls.avatar = URL.createObjectURL(r[0]);
      ids.forEach(function (id, j) { if (r[1 + j]) urls.tryon[id] = URL.createObjectURL(r[1 + j]); });
    });
  }

  /* ---------- 유틸 ---------- */
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function sgn(n) { return (n >= 0 ? '+' : '') + n; }
  function item(id) { return state.closet.filter(function (x) { return x.id === id; })[0] || null; }
  function accItem(id) { return state.accs.filter(function (x) { return x.id === id; })[0] || null; }
  function isMale() { return !!(state && state.profile && state.profile.gender === 'male'); }
  function garGender(it) { var g = it && it.gender; return GGENDER[g] ? g : (isMale() ? 'male' : 'female'); }
  function engCat(c) { return c === 'outer' ? 'top' : c; } /* 핏 계산에서 겉옷은 상의와 같은 항목으로 잰다 */
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
  function pageFromHash() { var p = (location.hash || '').replace('#', ''); return PAGES.some(function (x) { return x[0] === p; }) ? p : 'home'; }
  function go(p) { ui.page = p; ui.accFull = false; ui.linkEdit = null; if (location.hash !== '#' + p) location.hash = '#' + p; render(); window.scrollTo(0, 0); }
  function exclusiveSel(cat) {
    if (cat === 'dress') { delete state.sel.top; delete state.sel.bottom; }
    else if (cat === 'top' || cat === 'bottom') delete state.sel.dress;
  }
  function selectItem(it) { var c = state.sel[it.cat]; state.sel[it.cat] = { id: it.id, size: c && c.id === it.id ? c.size : null }; exclusiveSel(it.cat); }
  function defaultSizes(cat) { return (cat === 'shoe' ? ['250', '260', '270'] : ['S', 'M', 'L']).map(function (l) { return { label: l }; }); }
  /* 새 옷 등록 칸이 비어 있으면 지금 보고 있는 옷 종류 탭을 따라간다(탭은 하의인데 종류가 겉옷으로 저장되던 문제) */
  function formFollow(cat) { var f = ui.cf; if (!f || f.id || f.photo || f.name || f.cat === cat) return; ui.cf = blankForm(cat); }
  function blankForm(cat) { return { id: null, cat: cat, name: '', price: '', url: '', measureType: cat === 'shoe' ? '' : 'flat', sizes: defaultSizes(cat), photo: '', big: null, sizeDone: false, sizeMsg: '', photoMsg: '', saved: false, err: '' }; }
  function blankAcc() { return { id: null, type: '모자', name: '', price: '', url: '', photo: '', big: null, saved: false, err: '' }; }
  function posOf(it) { if (String(it.id).indexOf('s_') !== 0) return ''; return { outer: 'p-top', top: 'p-top', bottom: 'p-low', dress: 'p-mid', shoe: 'p-foot' }[it.cat] || ''; }

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
  function lookName(key) { return lookItems(key).map(function (x) { return x.name; }).join(' + '); }
  /* 서버가 받을 수 있는 옷: 원피스 또는 상의·하의, 옷 없이 신발만이면 신발 */
  function wearSet() {
    if (got('dress')) return [got('dress')];
    var set = [got('top'), got('bottom')].filter(Boolean);
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
  function wearShoe() {
    var it = tryShoeItem(), sel = got('shoe');
    if (it || state.tryShoe) return it;
    return sel && sel.photo ? sel : null;
  }
  function avatarShow() { return urls.avatar || (isMale() ? 'assets/avatar_male.jpg' : 'assets/avatar_default.jpg'); }
  function wornNow() {
    var set = wearSet(), key = set.length ? setKey(set) : '';
    if (key && urls.tryon[key]) return { key: key, url: urls.tryon[key], name: lookName(key) };
    var l = state.wearLast;
    if (!key && l && urls.tryon[l]) return { key: l, url: urls.tryon[l], name: lookName(l) };
    return null;
  }
  function modelShow() {
    var st = FD.styles.filter(function (s) { return s.id === state.styleId; })[0];
    return st && st.modelImage && wearSet().some(function (x) { return String(x.id).indexOf('s_' + st.id + '_') === 0; }) ? st.modelImage : (isMale() ? 'assets/avatar_male.jpg' : 'assets/avatar_default.jpg');
  }

  /* ---------- 핏 계산 ---------- */
  function evalOne(it, size) {
    try { return E.evaluate({ profile: state.profile, items: [{ cat: engCat(it.cat), garment: it, size: size || null, ref: null }] }, cfgNow()).results[0] || null; } catch (e) { return null; }
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
    try { var ev = E.evaluate({ profile: state.profile, items: items }, cfgNow()); out = ev.results; note = ev.note || ''; } catch (e) { out = []; }
    var o = got('outer');
    if (o) { var ro = evalOne(o, state.sel.outer.size); if (ro) { ro = Object.assign({}, ro, { cat: 'outer' }); out = [ro].concat(out); } }
    return { results: out, note: note };
  }
  function fitHint(it) {
    try {
      if (!E.num(state.profile.height) || it.cat === 'shoe') return null;
      var s = state.sel[it.cat], r = evalOne(it, s && s.id === it.id ? s.size : null);
      if (!r || !r.current) return null;
      var ease = {}, len = {};
      r.current.parts.forEach(function (p) {
        if (p.kind === 'circ' && /^(chest|waist|hip|thigh)$/.test(p.key) && isFinite(p.ease)) ease[p.key] = p.ease;
        if (/^(shoulder|sleeve|rise)$/.test(p.key) && isFinite(p.diff)) len[p.key] = p.diff;
        /* 원피스: 밑단이 무릎 바로 아래(0.25~0.30)면 서버가 '종아리 미디'로 읽어 Kling 이 너무 길게 그리므로 '무릎'(0.30)으로 보낸다 */
        if (p.key === 'length' && it.cat !== 'bottom' && isFinite(p.ratio)) len.hem = (it.cat === 'dress' && p.ratio >= 0.25 && p.ratio < 0.30) ? 0.30 : p.ratio;
        if (p.key === 'sleeve' && isFinite(p.pos)) len.sleevePos = p.pos;
      });
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
    var src = urls.avatar || (isMale() ? 'assets/avatar_male.jpg' : 'assets/avatar_default.jpg');
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
  function ensureNotifyPermission() { if (typeof Notification !== 'undefined' && Notification.permission === 'default') { try { Notification.requestPermission(); } catch (e) {} } }
  function notifyDone(title, body) {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || document.visibilityState === 'visible') return;
    try { var n = new Notification(title, { body: body, icon: 'assets/icons/icon-192.png', tag: 'fiton-tryon' }); n.onclick = function () { try { window.focus(); } catch (e) {} n.close(); }; } catch (e) {}
  }
  function wearAll() {
    var set = wearSet();
    if (genPending || !Core.genEnabled()) return;
    if (!set.length) { toast(got('outer') || state.accSel.length ? NOT_YET + ' 상의·하의·원피스·신발을 함께 골라 주세요.' : '입을 옷을 먼저 골라 주세요.'); return; }
    var noPhoto = set.filter(function (x) { return !x.photo; })[0];
    if (noPhoto) { toast('"' + noPhoto.name + '"의 상품 사진이 없어요. 내 옷장에서 수정해 사진을 넣어 주세요.'); return; }
    if (tryLeft() <= 0) { toast('이번 달 입어보기 횟수를 다 썼어요.'); openSheet('plan'); return; }
    var it = set[0], second = set[1] || null, key = setKey(set), first = false;
    try { first = !localStorage.getItem('fit-gen-ok'); } catch (e) { first = true; }
    if (first && !confirm('고른 옷의 상품 사진이 AI 이미지 생성 서버(Supabase·Kling)로 전송되어 입은 모습을 만듭니다. 내 얼굴 사진과 몸 정보는 전송되지 않아요. 만들어진 이미지는 AI가 생성한 것이라 실제 상품과 다를 수 있고, 플랜별 월 횟수와 하루 이용 한도가 있습니다. 계속할까요?')) return;
    if (urls.tryon[key] && !confirm('이미 만든 입은 모습이 있습니다. 다시 만들면 입어보기 횟수가 한 번 더 쓰입니다. (남은 ' + tryLeft() + '회) 계속할까요?')) return;
    if (urls.avatar) {
      var avFirst = false;
      try { avFirst = !localStorage.getItem('fit-gen-av-ok'); } catch (e) { avFirst = true; }
      if (avFirst && !confirm('내 아바타 이미지도 옷을 입히는 동안 AI 이미지 생성 서버(Supabase·Kling)로 전송됩니다. 서버에는 저장하지 않고 입히기 요청에만 쓰입니다. 계속할까요?')) return;
      try { localStorage.setItem('fit-gen-av-ok', '1'); } catch (e) {}
    }
    try { localStorage.setItem('fit-gen-ok', '1'); } catch (e) {}
    ensureNotifyPermission();
    ui.genErr = null; ui.genSizes[key] = {}; set.forEach(function (x) { ui.genSizes[key][x.id] = curSize(x); });
    genPending = key; render(); waitStart(lookName(key), wearSizes(set), false, notesFor(set));
    var shoeIt = it.cat !== 'shoe' ? wearShoe() : null;
    Promise.all([photoData(it), avatarData(), shoeIt ? photoData(shoeIt) : null, second ? photoData(second) : null]).then(function (a) {
      var body = { device: Core.deviceId(), cat: second ? 'outfit' : it.cat, garment: a[0], gender: isMale() ? 'male' : 'female' };
      if (a[2]) { body.shoe = a[2]; if (shoeIt.name) body.shoeName = String(shoeIt.name).slice(0, 60); }
      else if (it.cat !== 'shoe') body.shoeType = tryShoeTypeId();
      if (it.name) body.name = String(it.name).slice(0, 60);
      if (it.cat !== 'shoe') body.garmentGender = garGender(it);
      if (a[1]) body.avatar = a[1];
      var fh = fitHint(it); if (fh) body.fit = fh;
      if (second) {
        body.garment2 = a[3]; body.garmentGender2 = garGender(second);
        if (second.name) body.name2 = String(second.name).slice(0, 60);
        var f2 = fitHint(second); if (f2) body.fit2 = f2;
      }
      return Core.genCall(body);
    }).then(function (res) {
      if (!res.ok || !res.j.taskId) throw new Error((res.j && res.j.error) || '요청을 접수하지 못했습니다.');
      subNow().used++; save(); /* 서버가 접수한 뒤에만 횟수를 뺀다 */
      var t0 = Date.now();
      try { localStorage.setItem(GEN_KEY(), JSON.stringify({ id: key, taskId: res.j.taskId, t0: t0, sz: ui.genSizes[key] || null })); } catch (e) {}
      genPoll(key, res.j.taskId, t0);
    }).catch(function (err) { genFinish(key, false, (err && err.message) || '요청을 접수하지 못했습니다.'); });
  }
  function genPoll(id, taskId, t0) {
    if (!user || genPending !== id) return;
    if (Date.now() - t0 > 6 * 60 * 1000) { genFinish(id, false, '입은 모습을 만드는 데 너무 오래 걸려 중단했어요. 나중에 다시 시도해 주세요.'); return; }
    Core.genCall({ action: 'status', taskId: taskId }).then(function (res) {
      if (!res.ok) throw new Error('retry');
      var j = res.j;
      if (j.status === 'success' && j.image) {
        var blob = Core.imageBlob(j);
        return blobPut('tryon:' + id, blob).then(function () {
          if (urls.tryon[id]) URL.revokeObjectURL(urls.tryon[id]);
          urls.tryon[id] = URL.createObjectURL(blob);
          state.aiGen = state.aiGen || {}; state.aiGen[id] = true;
          if (state.aiHem) delete state.aiHem[id];
          if (state.aiOver) delete state.aiOver[id];
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
    }).catch(function () { setTimeout(function () { genPoll(id, taskId, t0); }, 6000); });
  }
  function genFinish(id, ok, msg, ms) {
    genPending = null;
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
      if (p && p.id && p.taskId && lookItems(p.id).length && Date.now() - p.t0 < 6 * 60 * 1000) { if (p.sz) ui.genSizes[p.id] = p.sz; genPending = p.id; render(); waitStart(lookName(p.id), wearSizes(lookItems(p.id)), true, notesFor(lookItems(p.id))); genPoll(p.id, p.taskId, p.t0); }
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
      var vals = {}; try { vals = E.bodyOf(state.profile).vals || {}; } catch (e) {}
      return window.FitNotes.forSet(items, state.profile, vals);
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
      '<div class="nt"><b>' + h(name) + '</b>' + (size ? ' · ' + h(size) : '') + '<small>화면을 누르면 닫혀요</small></div><button type="button" class="x" aria-label="닫기">✕</button>';
    o.addEventListener('click', revealClose);
    document.body.appendChild(o);
    document.addEventListener('keydown', revealKey);
  }

  /* ---------- 로그인 (설계에서 미뤄 둔 화면) ---------- */
  function dot(u) { return '<span class="dot">' + h(String(u.nick || '?').charAt(0)) + '</span>'; }
  function viewLogin() {
    var lg = ui.lg, users = Core.readUsers(), body = '';
    if (lg.mode === 'list') {
      body = (users.length ? '<p class="sub">이 브라우저에 있는 프로필을 고르세요. 폰에서 만든 프로필은 폰 안에만 있어요.</p><div class="ulist">' +
        users.map(function (u) { return '<button type="button" class="ubtn" data-act="lgPick" data-id="' + h(u.id) + '">' + dot(u) + h(u.nick) + '</button>'; }).join('') + '</div>'
        : '<p class="sub">프로필을 만들어 시작하세요.</p>') + '<button type="button" class="new" data-act="lgNew">새 프로필 만들기</button>';
    } else if (lg.mode === 'pin') {
      var u = Core.userById(lg.id);
      body = '<div style="display:flex;align-items:center;gap:12px">' + (u ? dot(u) + '<b style="font-size:20px">' + h(u.nick) + '</b>' : '') + '</div><label>PIN 4자리<input type="password" id="lgpin" inputmode="numeric" maxlength="4" autocomplete="off" autofocus></label>' +
        '<div class="err" id="lgerr">' + h(lg.err) + '</div><button type="button" class="new" data-act="lgLogin">들어가기</button><button type="button" class="btn" data-act="lgBack">뒤로</button>';
    } else {
      body = '<label>닉네임<input type="text" id="lgnick" maxlength="12" autofocus></label><div class="g2"><label>PIN 4자리<input type="password" id="lgpin" inputmode="numeric" maxlength="4" autocomplete="off"></label><label>PIN 확인<input type="password" id="lgpin2" inputmode="numeric" maxlength="4" autocomplete="off"></label></div>' +
        '<div class="g3"><label>성별<select id="lggender"><option value="female">여성</option><option value="male">남성</option></select></label><label>키(cm)<input type="number" id="lgh"></label><label>몸무게(kg)<input type="number" id="lgw"></label></div>' +
        '<div class="err" id="lgerr">' + h(lg.err) + '</div><button type="button" class="new" data-act="lgCreate">프로필 만들기</button><button type="button" class="btn" data-act="lgBack">뒤로</button>';
    }
    return '<div class="login"><div class="lbox"><div class="logo">FITON</div>' + body + '</div></div>';
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
    ui.lg = { mode: 'list', id: null, err: '', fails: 0, until: 0 }; ui.cf = blankForm('top'); ui.af = blankAcc();
    clearUrls(); render();
    loadMedia().then(function () { render(); genResume(); });
  }

  /* ---------- 공통 틀 ---------- */
  function side() {
    /* 2026-11-10 B 스튜디오: 88px 아이콘 메뉴. 남은 횟수 칸=요금제 보기, 맨 아래=설정 */
    var left = unlimited() ? '∞' : tryLeft() + '/' + planNow().limit;
    var leftSay = unlimited() ? '이번 달 남은 횟수 제한 없음(시험 중)' : '이번 달 남은 횟수 ' + planNow().limit + '회 중 ' + tryLeft() + '회';
    return '<nav class="side" aria-label="주 메뉴"><button type="button" class="logo" data-act="go" data-page="home">FITON</button><button type="button" class="new" data-act="go" data-page="fitting"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>새로 입어보기</button>' +
      PAGES.map(function (p) { var on = ui.page === p[0]; return '<button type="button" class="nv' + (on ? ' on' : '') + '" data-act="go" data-page="' + p[0] + '"' + (on ? ' aria-current="page"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + p[2] + '</svg>' + p[1] + '</button>'; }).join('') +
      '<div class="foot"><button type="button" class="left" data-act="sheet" data-name="plan" title="' + leftSay + ' · 요금제 보기" aria-label="' + leftSay + ', 요금제 보기"><b>' + left + '</b>남은 횟수</button>' +
      '<button type="button" class="nv me" data-act="sheet" data-name="set" title="' + h(user.nick) + ' 님 설정" aria-label="' + h(user.nick) + ' 님 설정"><img src="' + h(avatarShow()) + '" alt="">설정</button></div></nav>';
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
  function viewHome() {
    var list = stylesIn(), imgs = list.map(function (s) { return s.modelImage; }).filter(Boolean).slice(0, 5), p = ui.pend, hc = ui.homeCat;
    var kpills = KINDS.map(function (k) { return '<button type="button" class="pill kp' + (ui.homeKind === k[0] ? ' on' : '') + '" aria-pressed="' + (ui.homeKind === k[0]) + '" data-act="homeKind" data-v="' + k[0] + '">' + h(KIND_NAME[k[0]]) + '</button>'; }).join('');
    var pills = ['outer', 'top', 'bottom', 'dress', 'shoe'].map(function (c) { return '<button type="button" class="pill' + (hc === c ? ' on' : '') + '" data-act="homeCat" data-cat="' + c + '">' + CATS[c] + '</button>'; }).join('') +
      '<button type="button" class="pill' + (hc === 'acc' ? ' on' : '') + '" data-act="homeCat" data-cat="acc">액세서리</button>';
    var drop = p ? '<img src="' + p.url + '" alt="넣은 옷 사진" style="width:56px;height:56px;object-fit:cover;border-radius:10px"><span>사진을 넣었어요. 아래에서 옷 종류를 눌러 주세요.</span><button type="button" class="lk" data-act="pendClear" style="margin-left:auto;flex:none">사진 빼기</button>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"></rect><circle cx="9" cy="10" r="2"></circle><path d="M21 16l-5-5-8 9"></path></svg><span>옷 사진을 여기에 끌어다 놓거나 <kbd>Ctrl</kbd> + <kbd>V</kbd> 로 붙여넣으세요</span>';
    return '<main class="main"><section class="hero"><div class="strip" aria-hidden="true">' + imgs.map(function (u) { return '<img src="' + h(u) + '" alt="">'; }).join('') + '</div><div class="veil" aria-hidden="true"></div><div class="hin">' +
      '<div class="season">올 ' + seasonName() + ' 유행할 패션</div><h1 class="herotitle">쇼츠에서 본 스타일,<br><em>바로 입어보기</em></h1><p class="herosub">마음에 드는 옷 사진을 넣으면 내 몸에 입혀서 보여 드려요.</p>' +
      '<div class="cwrap"><div class="halo" aria-hidden="true"></div><div class="glow"><div class="comp" data-dz="home"><div class="drop">' + drop + '</div><div class="krow" role="group" aria-label="용도 (선택)"><small>용도 (선택)</small>' + kpills + '</div><div class="crow' + (p ? ' ask' : '') + '">' + pills +
      '<label class="go" style="display:inline-flex;align-items:center;flex-direction:row;color:var(--onPri);cursor:pointer">파일 선택<input type="file" accept="image/*" data-file="quick" hidden></label></div></div></div></div>' +
      '<div class="steps"><span><b>1</b>옷 사진 넣기</span><span><b>2</b>옷 종류 누르기</span><span><b>3</b>내 아바타로 확인</span></div></div></section>' +
      '<section class="sec"><div class="sh"><h2 class="sectitle">이번 ' + seasonName() + ' 코디</h2><span>눌러서 바로 입어 보세요</span></div><div class="grid5">' +
      list.map(function (st) { return '<button type="button" class="stylelk" data-act="styleTry" data-id="' + h(st.id) + '" style="padding:0;text-align:left"><img src="' + h(st.modelImage) + '" alt="' + h(st.title) + '" loading="lazy"><div class="cap"><b>' + h(st.title) + '</b><span>입어보기</span></div></button>'; }).join('') +
      '</div></section></main>';
  }

  /* ---------- 피팅룸 ---------- */
  function slotHtml(cat, role) {
    var it = got(cat);
    if (!it) {
      var shoeSel = cat === 'shoe' ? '<label>입어볼 때 신발<select data-chg="shoe">' + shoeOpts() + '</select></label>' : '';
      return '<div class="slot"><div class="srow"><span class="thumb" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg></span><div class="sname"><small>' + CATS[cat] + '</small><button type="button" data-act="toCloset" data-cat="' + cat + '">옷장에서 고르기</button></div></div>' + shoeSel + '</div>';
    }
    var s = state.sel[cat], r = evalOne(it, s.size), on = s.size || (r && r.chosen) || '';
    return '<div class="slot"><div class="srow">' + (it.photo ? '<img src="' + h(it.photo) + '" alt="" class="' + posOf(it) + '">' : '<span class="thumb" aria-hidden="true">' + SHIRT + '</span>') +
      '<div class="sname"><small>' + h(role) + '</small><b>' + h(it.name) + '</b></div><button type="button" class="rm" aria-label="' + h(it.name) + ' 빼기" data-act="unsel" data-cat="' + cat + '">빼기</button></div>' +
      '<div class="sizes">' + (it.sizes || []).map(function (z) { var o = z.label === on; return '<button type="button" class="sz' + (o ? ' on' : '') + '" aria-pressed="' + o + '" data-act="size" data-cat="' + cat + '" data-v="' + h(z.label) + '">' + h(z.label) + '</button>'; }).join('') + '</div></div>';
  }
  function shoeOpts() {
    var cur = state.tryShoe || '', ti = tryShoeItem();
    return '<optgroup label="신발 종류">' + SHOE_TYPES.map(function (t) { return '<option value="type:' + t[0] + '"' + (cur === 'type:' + t[0] || (!cur && t[0] === 'pumps') ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</optgroup>' +
      (shoeChoices().length ? '<optgroup label="내 옷장 신발">' + shoeChoices().map(function (x) { return '<option value="closet:' + h(x.id) + '"' + (ti && ti.id === x.id ? ' selected' : '') + '>' + h(x.name || '신발') + '</option>'; }).join('') + '</optgroup>' : '');
  }
  function clothesCount() { return ['outer', 'top', 'bottom', 'dress', 'shoe'].filter(got).length; }
  function selAccs() { return state.accSel.map(accItem).filter(Boolean); }
  /* 2026-11-10 FITON_PC_Style_Guide 반영: 가운데 뷰어·실측 핏 분석·사이즈 비교, 오른쪽 설정 패널(캐릭터·입어볼 것·핏 스타일·실행).
     핏 스타일은 저장된 선호 핏(profile.pref)과 같은 값이라 추천 사이즈·판정에 실제로 쓰인다. 입은 그림은 바뀌지 않는다. */
  var FSTYLE = [['tight', 'Slim', '타이트'], ['fit', 'Regular', '정핏'], ['loose', 'Loose', '여유'], ['over', 'Oversized', '오버핏']];
  var CMP_COLS = { outer: ['shoulder', 'chest', 'sleeve', 'length'], top: ['shoulder', 'chest', 'sleeve', 'length'], bottom: ['waist', 'hip', 'thigh', 'inseam', 'length'], dress: ['shoulder', 'chest', 'waist', 'sleeve', 'length'], shoe: ['inner'] };
  var ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2];
  function fieldLabel(it, k) {
    var f = (FIELDS[it.cat] || []).filter(function (x) { return x[0] === k; })[0], t = f ? f[1] : k;
    return it.measureType === 'circ' ? t.replace('단면', '둘레') : t;
  }
  /* 사이즈 하나의 판정 → [표시 클래스, 문구]. 근거(내 몸 치수·옷 실측)가 없으면 확정하지 않는다 */
  function sizeState(e) {
    if (!E.num(state.profile.height) || !e || !e.parts || !e.parts.length) return ['s-none', '측정 정보 부족'];
    var tight = e.parts.some(isTight), loose = e.parts.some(isLoose);
    return tight ? ['s-tight', '타이트할 수 있음'] : loose ? ['s-loose', '여유 있음'] : e.labelEst ? ['s-check', '확인 필요'] : ['s-ok', '적합'];
  }
  function isTight(p) { return p.kind === 'circ' ? p.gradeIdx === 0 : p.gradeKey === 'tightBad'; }
  function isLoose(p) { return p.kind === 'circ' ? p.gradeIdx === 4 : p.gradeKey === 'over'; }
  function curSize(it) { var s = state.sel[it.cat], f; return (s && s.id === it.id && s.size) || (((f = fitHint(it)) && f.size) || ''); }
  /* 입은 그림을 만들 때 쓴 사이즈(2026-11-10부터 기록). 예전 그림은 기록이 없다 */
  function madeSizes(key) { return (state.lookSize && state.lookSize[key]) || null; }
  function stageStatus(set, worn) {
    var cls = 'wait', t = '피팅을 시작해 주세요', sub = set.length ? '오른쪽 패널의 「가상 피팅 시작」을 누르면 AI가 옷을 입혀요.' : '오른쪽 패널에서 입어볼 옷을 골라 주세요.', btn = '';
    if (genPending) { cls = 'run'; t = 'AI가 의류를 착용하고 있습니다'; sub = lookName(genPending) + ' · 보통 1~2분 걸려요. 다른 화면을 봐도 됩니다.'; btn = '<button type="button" data-act="waitShow">진행 화면 보기</button>'; }
    else if (ui.genErr) { cls = 'fail'; t = '피팅을 완료하지 못했습니다'; sub = ui.genErr; btn = set.length ? '<button type="button" data-act="wear">다시 시도</button>' : ''; }
    else if (worn) {
      cls = 'done'; t = '피팅 결과가 준비되었습니다';
      var ms = madeSizes(worn.key), its = lookItems(worn.key), multi = its.length > 1;
      if (!ms) sub = worn.name + ' · 만들 때 사이즈 기록 없음';
      else {
        sub = worn.name + ' · 만들 때 사이즈 ' + its.map(function (x) { return (multi ? CATS[x.cat] + ' ' : '') + (ms[x.id] || '?'); }).join(', ');
        if (its.some(function (x) { return ms[x.id] && curSize(x) && ms[x.id] !== curSize(x); })) sub += ' — 지금 고른 사이즈와 달라요. 다시 입혀야 그림에 반영돼요.';
      }
    }
    return '<div class="vstatus ' + cls + '" role="status"><i aria-hidden="true"></i><div class="st"><b>' + h(t) + '</b><span>' + h(sub) + '</span></div>' + btn + '</div>';
  }
  function fitVerdict(fr) {
    var res = fr.results, out = { cls: 's-none', st: '측정 정보 부족', b: '옷을 골라 주세요', why: '오른쪽 패널에서 입어볼 옷을 담으면 결과가 나옵니다.' };
    if (!res.length) return out;
    var cur = res.filter(function (r) { return r.current; }), tight = [], loose = [];
    cur.forEach(function (r) { r.current.parts.forEach(function (p) { if (isTight(p)) tight.push(r.garment.name + ' ' + p.label); else if (isLoose(p)) loose.push(r.garment.name + ' ' + p.label); }); });
    if (!E.num(state.profile.height)) return { cls: 's-none', st: '측정 정보 부족', b: '내 몸 정보가 필요해요', why: '키와 몸무게를 넣으면 핏을 계산해 드려요.' };
    if (!cur.length || !cur.some(function (r) { return r.current.parts && r.current.parts.length; })) return { cls: 's-none', st: '측정 정보 부족', b: '실측값이 필요해요', why: '내 옷장에서 사이즈표를 넣어 주세요.' };
    if (tight.length) return { cls: 's-tight', st: '타이트할 수 있음', b: '조금 작아요', why: tight.join(', ') + ' 부분이 작아요.' };
    if (loose.length) return { cls: 's-loose', st: '여유 있음', b: '조금 커요', why: loose.join(', ') + ' 부분이 많이 남아요.' };
    if (cur.some(function (r) { return r.current.labelEst; })) return { cls: 's-check', st: '확인 필요', b: '맞을 것 같아요', why: '실측표가 없는 옷은 표준 치수로 추정했어요. 실측표를 넣으면 정확해져요.' };
    return { cls: 's-ok', st: '적합', b: '잘 맞아요', why: fr.note || '고른 옷 모두 몸에 맞아요.' };
  }
  function viewFitting() {
    var fr = fitResults(), res = fr.results, accs = selAccs(), set = wearSet(), hasOuter = !!got('outer'), left = ui.left, cc = clothesCount();
    var slots = slotHtml('outer', '겉옷 · 맨 바깥') + (got('dress') ? slotHtml('dress', '원피스') : slotHtml('top', hasOuter ? '상의 · 겉옷 안쪽' : '상의') + slotHtml('bottom', '하의')) + slotHtml('shoe', '신발');
    var accPane = '<div class="slot"><div class="ahead"><span>착용할 액세서리 ' + accs.length + ' / 3개</span></div>' + accs.map(function (a) {
      return '<div class="arow"><div class="sname"><small>' + h(a.type) + '</small><b>' + h(a.name) + '</b></div><button type="button" class="rm" aria-label="' + h(a.name) + ' 빼기" data-act="accToggle" data-id="' + h(a.id) + '">빼기</button></div>' +
        (a.gone ? '<p class="amsg">이 상품은 현재 없는 것으로 보입니다</p>' : safeUrl(a.url) ? buyHtml(a, 'abuy') : '<button type="button" class="abuy" data-act="go" data-page="accessory">액세서리 메뉴에서 링크 넣기</button>');
    }).join('') + (ui.accFull ? '<p class="amsg" role="status">액세서리는 3개까지 착용할 수 있어요. 하나를 뺀 뒤 다시 골라 주세요.</p>' : '') +
      (accs.some(function (a) { return (ACC_TYPES[a.type] || {}).small; }) ? '<p class="rule">' + h(accs.filter(function (a) { return (ACC_TYPES[a.type] || {}).small; }).map(function (a) { return a.type; }).join(', ')) + '는 전신에서 작게 보여요. 크게 보기로 확인해 주세요.</p>' : '') + '</div>' +
      '<div class="ahead"><span>저장한 액세서리에서 고르기</span></div><div class="alist">' + (state.accs.length ? state.accs.map(function (o) {
        var on = state.accSel.indexOf(o.id) >= 0;
        return '<button type="button" class="aitem' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="accToggle" data-id="' + h(o.id) + '"><span><small>' + h(o.type) + '</small>' + h(o.name) + '</span>' + (on ? '<em>착용</em>' : '') + '</button>';
      }).join('') : '<p class="rule">저장한 액세서리가 없어요.</p>') + '</div>';
    var label = [], wearN = set.length + (set[0] && set[0].cat !== 'shoe' && got('shoe') ? 1 : 0);
    if (wearN) label.push('옷 ' + wearN + '벌');
    var worn = wornNow(), v = ui.view, url = v === 'model' ? modelShow() : worn ? worn.url : avatarShow(), front = ui.angle === 'front', z = ui.zoom;
    /* ----- 뷰어 ----- */
    var tags = '', seen = {};
    if (v === 'me') res.forEach(function (r) {
      if (!r.current) return;
      r.current.parts.forEach(function (p) {
        if (seen[p.key] || TAG_TOP[p.key] == null || !p.gradeKey) return; seen[p.key] = 1;
        tags += '<div class="tag" style="top:' + TAG_TOP[p.key] + '%"><i class="g-' + p.gradeKey + '"></i>' + h(p.key === 'shoe' ? '발' : p.label) + ' ' + h(p.grade || { tightBad: '작음', fit: '정핏', over: '큼' }[p.gradeKey] || '') + '</div>';
      });
    });
    var pins = v === 'cmp' ? '' : accs.map(function (a) { var t = ACC_TYPES[a.type] || {}; return '<div class="pin" style="top:' + t.top + ';left:' + t.left + '"><i></i>' + h(a.type) + '</div>'; }).join('');
    var angleName = { side: '측면', back: '후면' }[ui.angle];
    var fig = !front ? '<div class="vph"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M4 17l5-5 4 4 3-3 4 4M9 3v0"></path><path d="M3 3l18 18"></path></svg><b>' + angleName + ' 지원 이미지 없음</b><p>FITON은 정면 착용 이미지만 만들어요. ' + angleName + ' 결과는 만들지 않으며, 정면 이미지를 돌려 보여 주지도 않습니다.</p></div>'
      : v === 'cmp' ? '<div class="fig cmpv"><figure><img src="' + h(avatarShow()) + '" alt="원본 아바타"><figcaption>원본</figcaption></figure><figure><img src="' + h(worn ? worn.url : avatarShow()) + '" alt="입은 모습"><figcaption>' + (worn ? '입은 모습' : '아직 입은 모습이 없어요') + '</figcaption></figure></div>'
      : '<div class="fig"><img src="' + h(url) + '" alt="' + h(v === 'model' ? '기본 모델 코디 예시' : worn ? worn.name + ' 입은 모습' : '캐릭터') + '"><div class="tape" aria-hidden="true"></div>' + tags + pins + '</div>';
    var zoomOk = front && v !== 'cmp', zi = ZOOMS.indexOf(z);
    var who = v === 'model' ? '기본 모델 · 코디 예시 사진(샘플)' : (urls.avatar ? '내 아바타' : '기본 캐릭터 (샘플)') + (v === 'cmp' ? ' · 원본과 비교' : '');
    var what = v !== 'model' && worn ? worn.name : set.length ? set.map(function (x) { return x.name; }).join(' + ') : '고른 옷 없음';
    var viewer = '<section class="card2 viewer" aria-label="입은 모습"><div class="vhead"><div class="vname"><small>' + h(who) + '</small><b>' + h(what) + '</b></div><div class="vtabs" role="tablist" aria-label="보기 선택">' +
      [['model', '기본 모델'], ['me', '내 아바타'], ['cmp', '원본과 비교']].map(function (t) { return '<button type="button" role="tab" aria-selected="' + (v === t[0]) + '" class="' + (v === t[0] ? 'on' : '') + '" data-act="view" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="vbar"><div class="angles" role="group" aria-label="보는 방향">' + [['front', 'Front'], ['side', 'Side'], ['back', 'Back']].map(function (a) { var o = ui.angle === a[0]; return '<button type="button" class="' + (o ? 'on' : '') + '" aria-pressed="' + o + '" data-act="angle" data-v="' + a[0] + '">' + a[1] + '</button>'; }).join('') + '</div>' +
      '<div class="zoomctl" role="group" aria-label="이미지 확대·축소"><button type="button" data-act="zoom" data-v="-" aria-label="축소"' + (zoomOk && zi > 0 ? '' : ' disabled') + '>−</button><output aria-live="polite">' + Math.round(z * 100) + '%</output><button type="button" data-act="zoom" data-v="+" aria-label="확대"' + (zoomOk && zi < ZOOMS.length - 1 ? '' : ' disabled') + '>+</button><button type="button" data-act="zoom" data-v="1"' + (zoomOk && z !== 1 ? '' : ' disabled') + '>맞춤</button></div></div>' +
      '<div class="vbox' + (v === 'cmp' && front ? ' cmpbox' : '') + '" style="--z:' + z + '">' + fig + '</div>' + stageStatus(set, v === 'model' ? null : worn) +
      '<div class="tools"><button type="button" class="tl" data-act="zoomStage">크게 보기</button><button type="button" class="tl" data-act="open3d">3D로 보기</button><button type="button" class="tl" data-act="savePic">결과 저장</button></div></section>';
    /* ----- 실측 핏 분석 (AI 이미지와 분리) ----- */
    var vd = fitVerdict(fr), active = res.filter(function (r) { return r.cat === ui.fitTab; })[0] || res[0] || null, parts = active && active.current ? active.current.parts : [];
    var names = BASE_CFG.gradeNames[active && active.cat === 'shoe' ? 'shoe' : 'body'];
    var partHtml = parts.map(function (p) {
      var idx = p.kind === 'circ' ? p.gradeIdx : GIDX[p.gradeKey], val2 = p.kind === 'circ' ? p.grade + ' ' + sgn(p.ease) + (p.unit || (active.cat === 'shoe' ? 'mm' : 'cm')) : p.text;
      return '<div class="part"><div class="ph"><b>' + h(p.label) + '</b><span class="muted">' + h(val2) + '</span></div><div class="segs" role="img" aria-label="' + h(p.label + ' ' + val2) + '">' +
        [0, 1, 2, 3, 4].map(function (i) { return '<div class="seg' + (i === idx ? ' g-' + p.gradeKey : '') + '"></div>'; }).join('') + '</div></div>';
    }).join('');
    var ag = active && active.garment, buy = '';
    if (ag) buy = ag.gone ? '<p class="gone">이 상품은 현재 없는 것으로 보입니다</p>' : safeUrl(ag.url) ? '<a class="buy1" data-buyid="' + h(ag.id) + '" href="' + h(safeUrl(ag.url)) + '" target="_blank" rel="noopener noreferrer">' + CATS[active.cat] + ' 구매하기' + ARROW + '</a>' : '<p class="gone">이 옷은 구매 링크가 없어요. <button type="button" data-act="toCloset" data-cat="' + active.cat + '" style="color:inherit;font-weight:700;text-decoration:underline">옷장에서 넣기</button></p>';
    var fitcard = '<section class="card2 fitcard" aria-label="핏 결과"><div class="ch"><h2>실측 기반 핏 분석</h2><small>AI 이미지와 별개 계산</small></div><div class="verdict"><small>내 몸 치수와 옷 실측으로 계산한 결과</small><span class="chip ' + vd.cls + '">' + h(vd.st) + '</span><b>' + h(vd.b) + '</b><span class="muted">' + h(vd.why) + '</span></div>' +
      (res.length ? '<div class="ftabs" role="tablist" aria-label="옷별 핏 보기">' + res.map(function (r) { var o = r === active; return '<button type="button" role="tab" aria-selected="' + o + '" class="' + (o ? 'on' : '') + '" data-act="fitTab" data-cat="' + r.cat + '">' + CATS[r.cat] + '</button>'; }).join('') + '</div>' : '') +
      (active ? '<div class="ph"><b>' + h(ag.name) + '</b><span class="muted">' + h(active.chosen || '') + '</span></div><div class="scale" aria-hidden="true">' + names.map(function (n) { return '<span>' + h(n) + '</span>'; }).join('') + '</div>' +
        (active.current && active.current.labelEst ? '<p class="note">실측표가 없어 표준 치수로 추정했어요. 실측표를 넣으면 정확해져요.</p>' : '') + partHtml + (active.recommended ? '<p class="note">추천 사이즈: <b>' + h(active.recommended) + '</b> (핏 스타일 ' + h((FSTYLE.filter(function (f) { return f[0] === (state.profile.pref || 'fit'); })[0] || FSTYLE[1])[1]) + ' 기준)</p>' : '') : '') +
      '<div class="buyline">' + buy + '</div><p class="note">추정 결과이며 실제 착용감을 보장하지 않습니다. 액세서리는 핏을 계산하지 않고 착용한 모습만 보여 줍니다.</p></section>';
    /* ----- 사이즈 비교 ----- */
    var sizecmp;
    if (!active) sizecmp = '<section class="card2 sizecmp" aria-label="사이즈 비교"><div class="ch"><h2>사이즈 비교</h2></div><p class="note">옷을 고르면 사이즈별 실측과 핏 판정을 나란히 보여 드려요.</p></section>';
    else {
      var ms = worn ? madeSizes(worn.key) : null, wornHas = worn && worn.key.split('+').indexOf(ag.id) >= 0, unit = active.cat === 'shoe' ? 'mm' : 'cm';
      sizecmp = '<section class="card2 sizecmp" aria-label="사이즈 비교"><div class="ch"><h2>사이즈 비교 · ' + h(CATS[active.cat]) + ' ' + h(ag.name) + '</h2><small>누르면 그 사이즈로 바뀌어요 · 착용 이미지는 그 사이즈로 만든 경우에만 보여요</small></div><div class="szrow">' +
        (ag.sizes || []).map(function (row) {
          var e = (active.all || []).filter(function (x) { return x.size === row.label; })[0], st = sizeState(e), on = row.label === active.chosen, rec = row.label === active.recommended;
          var th = wornHas && ms && ms[ag.id] === row.label ? '<img class="szth" src="' + h(worn.url) + '" alt="' + h(row.label) + ' 사이즈 입은 모습">' : '<span class="szno">착용 이미지 없음</span>';
          return '<button type="button" class="szc' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="size" data-cat="' + active.cat + '" data-v="' + h(row.label) + '"><div class="szh"><b>' + h(row.label) + '</b>' + (on ? '<em>선택됨</em>' : rec ? '<em>추천</em>' : '') + '</div>' + th +
            '<dl>' + (active.cat === 'shoe' && !E.num(row.inner) ? '<dt>표기 사이즈</dt><dd>' + h(row.label) + '</dd><dt>안쪽 길이 실측</dt><dd class="na">정보 없음</dd>' : (CMP_COLS[active.cat] || []).map(function (k) { var n = E.num(row[k]); return '<dt>' + h(fieldLabel(ag, k)) + '</dt>' + (n ? '<dd>' + n + unit + '</dd>' : '<dd class="na">정보 없음</dd>'); }).join('')) + '</dl>' +
            '<span class="chip ' + st[0] + '">' + h(st[1]) + '</span></button>';
        }).join('') + '</div></section>';
    }
    /* ----- 오른쪽 설정 패널 ----- */
    var pref = state.profile.pref || 'fit';
    var rpanel = '<aside class="rpanel" id="rpanel" aria-label="피팅 설정">' +
      '<section class="card2" aria-label="캐릭터"><div class="ch"><h2>캐릭터</h2></div><div class="chr"><img src="' + h(avatarShow()) + '" alt=""><div class="sname"><small>' + (urls.avatar ? '직접 올린 이미지' : '샘플 캐릭터') + '</small><b>' + (urls.avatar ? '내 아바타' : '기본 캐릭터') + '</b></div><button type="button" class="chbtn" data-act="go" data-page="body">캐릭터 변경</button></div></section>' +
      '<section class="card2" aria-label="고른 옷"><div class="ch"><h2>입어볼 것</h2></div><div class="ftabs" role="tablist" aria-label="입어볼 것 종류">' +
      '<button type="button" role="tab" aria-selected="' + (left === 'clothes') + '" class="' + (left === 'clothes' ? 'on' : '') + '" data-act="left" data-v="clothes">옷 ' + cc + '벌</button><button type="button" role="tab" aria-selected="' + (left === 'acc') + '" class="' + (left === 'acc' ? 'on' : '') + '" data-act="left" data-v="acc">액세서리 ' + accs.length + '개</button></div>' +
      '<div class="picks">' + (left === 'clothes' ? slots + '<p class="rule">종류마다 한 벌씩 입혀요. 원피스를 고르면 상의와 하의 칸이 원피스 한 칸으로 바뀝니다.</p>' : accPane) + '</div>' +
      (left === 'clothes' ? '<button type="button" class="add" data-act="go" data-page="closet">옷장에서 다른 옷 고르기</button>' : '<button type="button" class="add" data-act="go" data-page="accessory">새 액세서리 저장</button>') +
      (hasOuter || accs.length ? '<p class="amsg">' + NOT_YET + '</p>' : '') + '</section>' +
      '<section class="card2" aria-label="핏 스타일"><div class="ch"><h2>핏 스타일</h2><small>참고 옵션</small></div><div class="fstyle" role="group" aria-label="핏 스타일">' +
      FSTYLE.map(function (f) { var o = pref === f[0]; return '<button type="button" class="' + (o ? 'on' : '') + '" aria-pressed="' + o + '" data-act="fitStyle" data-v="' + f[0] + '">' + f[1] + '<small>' + f[2] + '</small></button>'; }).join('') +
      '</div><p class="rule">추천 사이즈와 핏 판정 기준이 바뀌어요. 입은 그림은 상품 사진의 핏대로 만들어져 이 선택으로 바뀌지 않아요.</p></section>' +
      '<section class="card2 runcard" aria-label="실행">' + (Core.genEnabled() ? '' : '<p class="demo" role="note">AI 입히기 서버가 연결되지 않은 데모 상태예요. 가상 피팅 시작을 눌러도 실제 결과는 만들어지지 않습니다.</p>') +
      '<button type="button" class="wear" data-act="wear"' + (set.length && !genPending && Core.genEnabled() ? '' : ' disabled') + '>' + (genPending ? '진행 중… 다른 걸 해도 돼요' : '가상 피팅 시작<small>' + h((label.join(' · ') || '고른 옷') + ' · 남은 횟수 1회 사용') + '</small>') + '</button>' +
      '<button type="button" class="reset" data-act="resetSel"' + (genPending ? ' disabled' : '') + '>초기화</button></section></aside>';
    return '<main class="main fitmain"><header class="phead"><div><h1>피팅룸</h1><p class="sub">선택한 캐릭터와 옷의 가상 착용 결과를 확인합니다.</p></div><div class="hacts"><span class="savest">✓ 고른 내용은 자동 저장돼요</span>' +
      '<button type="button" class="tl" data-act="rpToggle" aria-controls="rpanel" aria-expanded="' + !ui.rpOff + '">' + (ui.rpOff ? '설정 패널 펼치기' : '설정 패널 접기') + '</button></div></header>' +
      '<div class="fitgrid' + (ui.rpOff ? ' rpoff' : '') + '">' + viewer + fitcard + sizecmp + rpanel + '</div></main>';
  }

  /* ---------- 내 옷장 ---------- */
  function closetForm() {
    var f = ui.cf, fs = FIELDS[f.cat], circ = f.measureType === 'circ';
    var table = '<div style="overflow-x:auto"><table><thead><tr><th scope="col">사이즈</th>' + fs.map(function (x) { return '<th scope="col">' + h(circ ? x[1].replace('단면', '둘레') : x[1]) + '</th>'; }).join('') + '<th></th></tr></thead><tbody>' +
      f.sizes.map(function (z, i) { return '<tr><td><input type="text" id="sl' + i + '" data-sl="' + i + '" value="' + h(z.label) + '" aria-label="사이즈 이름"></td>' + fs.map(function (x) { return '<td><input type="number" step="0.1" id="sf' + i + x[0] + '" data-sf="' + i + ':' + x[0] + '" value="' + h(z[x[0]] == null ? '' : z[x[0]]) + '" aria-label="' + h(z.label + ' ' + x[1]) + '"></td>'; }).join('') + '<td><button type="button" class="rm" style="min-width:32px;min-height:32px;padding:0" data-act="sizeDel" data-i="' + i + '" aria-label="사이즈 삭제">✕</button></td></tr>'; }).join('') + '</tbody></table></div><button type="button" class="lk" data-act="sizeAdd">+ 사이즈 추가</button>';
    return '<aside class="pan" style="flex:1 1 340px" aria-label="' + (f.id ? '옷 수정' : '새 옷 추가') + '"><h2>' + (f.id ? '옷 수정' : '새 옷 추가') + '</h2>' +
      '<div class="dz' + (f.sizeDone ? ' done' : '') + '" id="dzsize" tabindex="0" data-dz="size"><b>① 사이즈표 캡처</b><span data-ocr="size">' + h(f.sizeMsg || '') + (f.sizeMsg ? '' : '끌어다 놓거나 이 칸을 누른 뒤 <kbd>Ctrl</kbd> + <kbd>V</kbd>. 값을 자동으로 읽어요.') + '</span><div class="dzacts" style="justify-content:flex-start;margin-top:6px"><label class="fbtn">사진 파일 선택<input type="file" accept="image/*" data-file="sizeCap" aria-label="사이즈표 사진 파일 선택"></label></div></div>' + table +
      '<div class="dz' + (f.photo ? ' done' : '') + '" id="dzphoto" tabindex="0" data-dz="photo">' + (f.photo ? '<img src="' + h(f.photo) + '" alt="넣은 상품 사진 미리 보기">' : '') + '<b>② 상품 사진 캡처</b><span data-ocr="photo">' + h(f.photoMsg || '') + (f.photoMsg ? '' : '끌어다 놓거나 <kbd>Ctrl</kbd> + <kbd>V</kbd> 로 붙여넣기. 이름과 가격도 자동으로 채워요.') + '</span><div class="dzacts" style="justify-content:flex-start;margin-top:6px"><label class="fbtn">' + (f.photo ? '다른 사진 선택' : '사진 파일 선택') + '<input type="file" accept="image/*" data-file="photo" aria-label="상품 사진 파일 선택"></label></div></div>' +
      '<label for="pkind">옷 종류<select id="pkind" data-chg="cfCat">' + CAT_ORDER.map(function (c) { return '<option value="' + c + '"' + (f.cat === c ? ' selected' : '') + '>' + CATS[c] + '</option>'; }).join('') + '</select></label>' +
      (f.cat === 'shoe' ? '' : '<label for="pkindk">용도 (선택)<select id="pkindk" data-chg="cfKind"><option value="">자동으로 정하기</option>' + KINDS.map(function (k) { return '<option value="' + k[0] + '"' + (f.kind === k[0] ? ' selected' : '') + '>' + h(k[1]) + '</option>'; }).join('') + '</select></label>') +
      '<label for="pname">옷 이름<input id="pname" type="text" data-cf="name" value="' + h(f.name) + '" maxlength="60"></label><label for="pprice">가격<input id="pprice" type="text" data-cf="price" value="' + h(f.price) + '"></label><label for="purl">상품 링크 (선택)<input id="purl" type="url" data-cf="url" placeholder="https://..." value="' + h(f.url) + '"></label>' +
      '<p class="hint">상품 주소를 넣으면 옷 카드에 구매하기가 생겨요.</p>' + (f.err ? '<p class="gone" role="alert">' + h(f.err) + '</p>' : '') + (f.saved ? '<p class="ok" role="status">저장했어요.</p>' : '') +
      '<button type="button" class="save" data-act="cfSave">' + (f.id ? '수정 저장' : '옷장에 저장') + '</button>' + (f.id ? '<div class="lkacts"><button type="button" class="lk" data-act="cfCancel">취소</button><button type="button" class="lk" data-act="delItem" data-id="' + h(f.id) + '" style="color:var(--errText)">옷 삭제</button></div>' : '') + '</aside>';
  }
  function viewCloset() {
    var cat = ui.closetCat, all = state.closet.filter(function (x) { return x.cat === cat; });
    var kc = {}; all.forEach(function (x) { if (x.kind) kc[x.kind] = (kc[x.kind] || 0) + 1; });
    var kindNow = ui.closetKind !== 'all' && kc[ui.closetKind] ? ui.closetKind : 'all', list = all.filter(function (x) { return kindNow === 'all' || x.kind === kindNow; });
    var kindChips = Object.keys(kc).length ? '<div class="kchips" role="group" aria-label="용도로 걸러 보기"><button type="button" class="' + (kindNow === 'all' ? 'on' : '') + '" aria-pressed="' + (kindNow === 'all') + '" data-act="closetKind" data-v="all">전체 ' + all.length + '</button>' + KINDS.filter(function (k) { return kc[k[0]]; }).map(function (k) { return '<button type="button" class="' + (kindNow === k[0] ? 'on' : '') + '" aria-pressed="' + (kindNow === k[0]) + '" data-act="closetKind" data-v="' + k[0] + '">' + KIND_NAME[k[0]] + ' ' + kc[k[0]] + '</button>'; }).join('') + '</div>' : '';
    var chips = CAT_ORDER.filter(got).map(function (c) { var it = got(c), s = state.sel[c], r = evalOne(it, s.size); return '<button type="button" class="pc" aria-label="' + h(it.name) + ' 빼기" data-act="unsel" data-cat="' + c + '"><small>' + CATS[c] + '</small>' + h(it.name) + ' ' + h(s.size || (r && r.chosen) || '') + ' ×</button>'; }).join(''), n = CAT_ORDER.filter(got).length;
    return '<main class="main mflex"><div class="col" style="flex:3 1 560px"><h1>내 옷장</h1><div class="tabs" role="tablist" aria-label="옷 종류">' +
      CAT_ORDER.map(function (c) { return '<button type="button" role="tab" aria-selected="' + (cat === c) + '" class="' + (cat === c ? 'on' : '') + '" data-act="closetCat" data-cat="' + c + '">' + CATS[c] + (got(c) ? ' 1' : '') + '</button>'; }).join('') + '</div>' + kindChips + '<div class="grid4">' +
      (list.length ? list.map(function (it) {
        var s = state.sel[cat], on = !!(s && s.id === it.id), r = evalOne(it, on ? s.size : null), g = r && r.current && r.current.primary, sub = r && r.chosen ? (on ? '' : '추천 ') + r.chosen + (g ? ' · ' + g.grade : '') : (it.sizes || []).map(function (z) { return z.label; }).join(' ');
        return '<div class="tile' + (on ? ' on' : '') + (it.kind === 'under' ? ' nowear' : '') + '">' + (it.kind && KIND_NAME[it.kind] ? '<span class="kb' + (it.kind === 'under' ? ' u' : '') + '">' + KIND_NAME[it.kind] + (it.kind === 'under' ? ' · 입히기 제외' : '') + '</span>' : '') + '<button type="button" class="pick" aria-pressed="' + on + '" data-act="pickItem" data-id="' + h(it.id) + '">' + (it.photo ? '<img src="' + h(it.photo) + '" alt="" class="' + posOf(it) + '">' : '<span class="noimg" aria-hidden="true">' + SHIRT + '</span>') + (on ? '<span class="chk">고름</span>' : '') + '<span class="tb"><b>' + h(it.name) + '</b><span>' + h(sub) + '</span></span></button><div class="bf">' + buyArea(it, 'c') + '<button type="button" class="lk" data-act="editItem" data-id="' + h(it.id) + '">수정</button></div></div>';
      }).join('') : '<p class="hint">' + (kindNow !== 'all' ? KIND_NAME[kindNow] + ' 옷이 없어요.' : CATS[cat] + '이(가) 아직 없어요. 오른쪽에서 새 옷을 추가해 주세요.') + '</p>') + '</div>' +
      '<div class="bar"><div class="picked"><b>' + (n ? '옷 ' + n + '벌' : '고른 옷 없음') + '</b>' + chips + '</div>' + (n ? '<button type="button" class="go2" data-act="go" data-page="fitting">한 번에 입어보기</button>' : '') + '</div>' +
      '<p class="hint">종류마다 한 벌씩 골라요. 겉옷과 상의를 함께 고르면 상의가 겉옷 안쪽으로 입혀지고, 원피스를 고르면 상의와 하의는 빠집니다. 액세서리는 액세서리 메뉴에 따로 저장해요.</p></div>' + closetForm() + '</main>';
  }

  /* ---------- 액세서리 ---------- */
  function viewAccessory() {
    var tab = ui.accTab, f = ui.af, list = state.accs.filter(function (x) { return tab === 'all' || (ACC_TYPES[x.type] || {}).part === tab; }), accs = selAccs();
    return '<main class="main mflex"><div class="col" style="flex:3 1 560px"><h1>액세서리</h1><div class="tabs" role="tablist" aria-label="착용 부위">' +
      ACC_TABS.map(function (t) { return '<button type="button" role="tab" aria-selected="' + (tab === t[0]) + '" class="' + (tab === t[0] ? 'on' : '') + '" data-act="accTab" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div class="grid4">' +
      (list.length ? list.map(function (it) {
        var on = state.accSel.indexOf(it.id) >= 0, t = ACC_TYPES[it.type] || {}, sub = [it.type, priceText(it.price) || it.price || (t.small ? '크게 보기로 확인' : '전신에서 잘 보여요')].join(' · ');
        return '<div class="tile acc' + (on ? ' on' : '') + '"><button type="button" class="pick" aria-pressed="' + on + '" data-act="accToggle" data-id="' + h(it.id) + '">' + (it.photo ? '<img src="' + h(it.photo) + '" alt="">' : '<span class="noimg" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="' + (t.icon || '') + '"></path></svg></span>') + (on ? '<span class="chk">고름</span>' : '') + '<span class="tb"><b>' + h(it.name) + '</b><span>' + h(sub) + '</span></span></button><div class="bf">' + buyArea(it, 'a') + '<button type="button" class="lk" data-act="accDel" data-id="' + h(it.id) + '">삭제</button></div></div>';
      }).join('') : '<p class="hint">저장한 액세서리가 없어요. 오른쪽에서 사진을 넣어 저장해 주세요.</p>') + '</div>' +
      '<div class="bar"><div class="picked"><b>' + (accs.length ? '착용할 액세서리 ' + accs.length + '개' : '고른 액세서리 없음') + '</b>' + accs.map(function (a) { return '<button type="button" class="pc" aria-label="' + h(a.name) + ' 빼기" data-act="accToggle" data-id="' + h(a.id) + '"><small>' + h(a.type) + '</small>' + h(a.name) + ' ×</button>'; }).join('') + '</div>' + (accs.length ? '<button type="button" class="go2" data-act="toFitAcc">피팅룸에서 착용하기</button>' : '') + '</div>' +
      '<p class="hint">여기는 액세서리를 저장해 두는 곳이에요. 3개까지 골라 피팅룸에서 옷과 함께 착용합니다.</p>' + (ui.accFull ? '<p class="gone" role="status">액세서리는 3개까지 고를 수 있어요. 하나를 뺀 뒤 다시 골라 주세요.</p>' : '') + '</div>' +
      '<aside class="pan" style="flex:1 1 340px" aria-label="새 액세서리 저장"><h2>새 액세서리 저장</h2><div class="dz center' + (f.photo ? ' done' : '') + '" tabindex="0" data-dz="acc" aria-label="액세서리 사진 넣는 칸. 사진을 끌어다 놓거나 붙여넣기">' + (f.photo ? '<img src="' + h(f.photo) + '" alt="넣은 액세서리 사진 미리 보기">' : '<b>상품 사진</b><span>끌어다 놓거나 이 칸을 누른 뒤 <kbd>Ctrl</kbd> + <kbd>V</kbd></span>') +
      '<div class="dzacts"><label class="fbtn">' + (f.photo ? '다른 사진 선택' : '사진 파일 선택') + '<input type="file" accept="image/*" data-file="accPhoto" aria-label="액세서리 사진 파일 선택"></label>' + (f.photo ? '<button type="button" class="lk" data-act="afClear">사진 빼기</button>' : '') + '</div></div>' +
      '<label for="atype">종류<select id="atype" data-chg="afType">' + Object.keys(ACC_TYPES).map(function (k) { return '<option' + (f.type === k ? ' selected' : '') + '>' + h(k) + '</option>'; }).join('') + '</select></label>' +
      '<label for="aname">이름<input id="aname" type="text" data-af="name" placeholder="예: 블랙 버킷햇" value="' + h(f.name) + '"></label><label for="aprice">가격 (선택)<input id="aprice" type="text" data-af="price" placeholder="예: 29,000원" value="' + h(f.price) + '"></label><label for="aurl">상품 링크 (선택)<input id="aurl" type="url" data-af="url" placeholder="https://..." value="' + h(f.url) + '"></label>' +
      '<p class="hint">사이즈표는 필요 없어요. 상품 주소를 넣으면 카드에 구매하기가 생겨요.</p>' + (f.err ? '<p class="gone" role="alert">' + h(f.err) + '</p>' : '') + (f.saved ? '<p class="ok" role="status">저장했어요.</p>' : '') + '<button type="button" class="save" data-act="afSave">액세서리 저장</button></aside></main>';
  }

  /* ---------- 입어본 기록 ---------- */
  function histList() {
    var looks = Object.keys(state.looks || {}).filter(function (k) { return urls.tryon[k] && lookItems(k).length; }).map(function (k) { return { key: k, items: lookItems(k) }; });
    return looks.concat(state.closet.filter(function (x) { return urls.tryon[x.id]; }).map(function (x) { return { key: x.id, items: [x] }; }));
  }
  function viewHistory() {
    var list = histList(), cur = list.filter(function (e) { return e.key === ui.cmp; })[0] || list[0] || null;
    return '<main class="main mflex"><div class="col" style="flex:3 1 520px"><h1>입어본 기록</h1><p class="sub">옷이나 옷 조합마다 마지막으로 입힌 모습 한 장이 저장돼요.</p>' +
      (list.length ? '<div class="grid3">' + list.map(function (e) {
        var on = cur === e, title = e.items.map(function (x) { return x.name; }).join(' + ');
        return '<div class="card' + (on ? ' on' : '') + '"><button type="button" class="pick" aria-label="' + h(title) + ' 원본과 비교" aria-pressed="' + on + '" data-act="histPick" data-id="' + h(e.key) + '"><img src="' + urls.tryon[e.key] + '" alt=""></button><div class="its">' +
          e.items.map(function (i) { return '<div class="it"><b>' + h(i.name) + '</b>' + (i.gone ? '<p class="gone">이 상품은 현재 없는 것으로 보입니다</p>' : safeUrl(i.url) ? buyHtml(i, 'buy') : '') + '</div>'; }).join('') + '</div></div>';
      }).join('') + '</div>' : '<p class="hint">아직 입어본 기록이 없어요. 피팅룸에서 입어 보면 여기에 쌓여요.</p>') + '</div>' +
      (cur ? '<aside class="cmp" style="flex:2 1 420px" aria-label="원본과 비교"><div class="two"><figure><img src="' + h(avatarShow()) + '" alt="원본 아바타"><figcaption>원본 아바타</figcaption></figure><figure><img src="' + urls.tryon[cur.key] + '" alt="입은 모습"><figcaption>입은 모습</figcaption></figure></div>' +
        '<div class="acts"><button type="button" class="b" data-act="histZoom" data-id="' + h(cur.key) + '">크게 보기</button><button type="button" class="b" data-act="histShow" data-id="' + h(cur.key) + '">피팅룸에서 보기</button><button type="button" class="b d" data-act="histDel" data-id="' + h(cur.key) + '">삭제</button></div></aside>' : '') + '</main>';
  }

  /* ---------- 내 몸 정보 ---------- */
  function viewBody() {
    var p = state.profile, m = p.m || {};
    return '<main class="main mflex"><section class="pan" style="flex:1 1 340px" aria-label="내 아바타"><h2>내 아바타</h2><img class="av" src="' + h(avatarShow()) + '" alt="' + (urls.avatar ? '내 아바타' : '기본 캐릭터') + ' 전신"><p class="sub">정면 전신 이미지를 올려 주세요. 올리지 않으면 기본 캐릭터로 입혀 드려요.</p>' +
      '<label class="btn" style="display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--fg);font-size:16px;font-weight:700">아바타 이미지 올리기<input type="file" accept="image/*" data-file="avatar" hidden></label>' + (urls.avatar ? '<button type="button" class="lk" data-act="avatarDel">기본 캐릭터로 되돌리기</button>' : '') + '</section>' +
      '<section class="pan" style="flex:2 1 520px" aria-label="내 치수"><h1>내 몸 정보</h1><p class="sub">성별, 키, 몸무게만 넣어도 시작할 수 있어요.</p><div class="segtoggle" role="group" aria-label="성별"><button type="button" class="' + (p.gender === 'male' ? 'on' : '') + '" data-act="bGender" data-v="male">남성</button><button type="button" class="' + (p.gender !== 'male' ? 'on' : '') + '" data-act="bGender" data-v="female">여성</button></div>' +
      '<div class="g2"><label for="h">키<span class="in"><input id="h" type="number" value="' + h(p.height) + '"><small>cm</small></span></label><label for="w">몸무게<span class="in"><input id="w" type="number" value="' + h(p.weight) + '"><small>kg</small></span></label></div>' +
      '<h2>자세한 치수</h2><div class="callout">모르는 칸은 비워 두세요. 키와 몸무게로 자동 추정해요. 재서 넣을수록 핏이 정확해져요.</div><div class="g3">' +
      MFIELDS.map(function (f, i) { return '<label for="m' + i + '">' + f[1] + '<span class="in"><input id="m' + i + '" type="number" step="0.1" data-mf="' + f[0] + '" placeholder="자동" value="' + h(m[f[0]] == null ? '' : m[f[0]]) + '"><small>' + f[2] + '</small></span></label>'; }).join('') + '</div><button type="button" class="save" data-act="bSave">저장</button></section></main>';
  }

  /* ---------- 그리기 ---------- */
  function render() {
    if (!user) { app.className = ''; app.innerHTML = viewLogin(); return; }
    var p = ui.page, inner = p === 'fitting' ? viewFitting() : p === 'closet' ? viewCloset() : p === 'accessory' ? viewAccessory() : p === 'history' ? viewHistory() : p === 'body' ? viewBody() : viewHome();
    var ae = document.activeElement, keep = ae && ae.id, sel = null, scr = {};
    try { sel = keep && ae.selectionStart; } catch (e) {}
    ['.grid4', '.picks', 'aside.pan', '.rpanel', '.vbox'].forEach(function (q) { var e = app.querySelector(q); if (e) scr[q] = e.scrollTop; });
    app.className = 'pg-' + p;
    app.innerHTML = '<div class="app">' + side() + inner + '</div>';
    Object.keys(scr).forEach(function (q) { var e = app.querySelector(q); if (e) e.scrollTop = scr[q]; });
    if (keep) { var a = document.getElementById(keep); if (a) { a.focus(); try { if (sel != null) a.setSelectionRange(sel, sel); } catch (e) {} } }
  }

  /* ---------- 요금제·설정 (설계에서 미뤄 둔 화면) ---------- */
  function closeSheet() { var o = document.getElementById('sheet'); if (o) o.remove(); }
  function openSheet(name) {
    closeSheet();
    var o = document.createElement('div'); o.id = 'sheet'; o.className = 'sheet'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); var s = subNow();
    var inner = name === 'plan' ? '<h2>요금제</h2><p class="sub">결제 연결 전이에요. 지금은 ' + h(planNow().name) + ' 플랜입니다.</p>' + Object.keys(FD.plans).map(function (k) { var p = FD.plans[k]; return '<div class="pan" style="' + (k === s.plan ? 'border-color:var(--coral)' : '') + '"><b>' + h(p.name) + ' · ' + h(p.price) + '</b><span class="hint">' + h((p.features || []).join(', ')) + '</span></div>'; }).join('')
      : '<h2>설정</h2><p class="sub">' + h(user.nick) + ' 님</p><label>선호 핏<select id="spref">' + PREFS.map(function (x) { return '<option value="' + x[0] + '"' + (state.profile.pref === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></label><button type="button" class="btn" id="slogout">프로필 바꾸기</button>';
    o.innerHTML = '<div class="box">' + inner + '<button type="button" class="lk" id="sclose">닫기</button></div>';
    o.addEventListener('click', function (e) { if (e.target === o || e.target.id === 'sclose') closeSheet(); else if (e.target.id === 'slogout') { closeSheet(); ACT.logout(); } });
    o.addEventListener('change', function (e) { if (e.target.id === 'spref') { state.profile.pref = e.target.value; save(); render(); } });
    document.body.appendChild(o);
  }

  /* ---------- 3D ---------- */
  function circOf(it, v) { var n = E.num(v); return n ? (it.measureType === 'circ' ? n : n * 2) : 0; }
  function collect3d(res) {
    var bv = E.bodyOf(state.profile, cfgNow()).vals, gars = [];
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
    if (!E.num(state.profile.height)) { toast('내 몸 정보에 키를 먼저 넣어 주세요.'); return; }
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
    if (host) { Fit3D.setFace({ url: isMale() ? 'assets/avatar_male.jpg' : 'assets/avatar_default.jpg', kind: 'avatar' }); Fit3D.mount(host, collect3d(fitResults().results)); }
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
    pendClear(); ui.homeCat = null;
    if (cat === 'acc') { setAccPhoto(f); go('accessory'); return; }
    if (genPending && cat !== 'outer') { toast('지금 다른 옷을 만드는 중이에요. 끝난 뒤 다시 해 주세요.'); render(); return; }
    addFromFile(f, cat).then(function () {
      var under = ui.homeKind === 'under' && cat !== 'shoe'; ui.homeKind = '';
      if (under) { ui.closetCat = cat; go('closet'); toast('언더웨어는 옷장에 저장했어요. 사이즈 확인용이라 입어보기에는 쓰지 않아요.', 5000); return; }
      ui.left = 'clothes'; go('fitting');
      if (cat === 'outer') toast(NOT_YET, 6000); else wearAll();
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
  function sizeCap(file) {
    var f = ui.cf;
    /* 서버(AI)로 읽기를 켜 둔 경우(TRYON_CFG.sizeRead) 먼저 시도하고, 안 되면 아래 브라우저 글자 읽기로 넘어간다 */
    if (window.FitNotes && FitNotes.enabled() && f.cat !== 'shoe') {
      f.sizeMsg = 'AI가 사이즈표를 읽는 중입니다…'; f.sizeDone = false; render();
      FitNotes.readCapture(file, f.cat, state.profile.gender, Core.shrink, Core.blobToDataUrl, Core.deviceId()).then(function (r) {
        if (ui.cf !== f) return;
        f.sizes = r.sizes; f.measureType = r.measureType; f.sizeDone = true;
        f.sizeMsg = 'AI가 읽었어요(둘레 cm 기준). 값이 맞는지 확인해 주세요.' + (r.warnings && r.warnings.length ? ' 참고: ' + friendlyWarn(r.warnings[0]) : ''); render();
      }).catch(function (err) { if (ui.cf !== f) return; f.sizeMsg = ''; sizeOcrFallback(file, f); });
      return;
    }
    sizeOcrFallback(file, f);
  }
  function sizeOcrFallback(file, f) {
    if (!window.SizeOcr) { f.sizeMsg = '글자 인식을 쓸 수 없어요. 표에 직접 입력해 주세요.'; render(); return; }
    f.sizeMsg = '글자를 읽는 중입니다. 처음에는 1분 가까이 걸릴 수 있어요.'; f.sizeDone = false; render();
    SizeOcr.recognize(file, function (s, p) { if (p != null && ui.cf === f) { f.sizeMsg = '글자를 읽는 중… ' + Math.round(p * 100) + '%'; ocrMsg('size', f.sizeMsg); } }).then(function (text) {
      if (ui.cf !== f) return;
      var r = SizeOcr.parse(text, engCat(f.cat));
      if (!r.sizes.length) { f.sizeMsg = '사이즈표를 읽지 못했어요. 글자가 크고 또렷하게 다시 캡처하거나 표에 직접 입력해 주세요.'; render(); return; }
      f.sizes = r.sizes; if (r.circ) f.measureType = 'circ';
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
    if (d === 'acc') setAccPhoto(file); else if (d === 'size') sizeCap(file); else if (d === 'photo') closetPhoto(file); else homeFile(file);
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
    if (state.aiHem) delete state.aiHem[id];
    if (state.aiOver) delete state.aiOver[id];
    if (state.looks) delete state.looks[id];
    if (state.lookSize) delete state.lookSize[id];
    if (state.wearLast === id) delete state.wearLast;
  }
  function openFull(u, alt) {
    var o = document.createElement('div'); o.className = 'zoom'; o.innerHTML = '<img alt="' + h(alt || '') + '" src="' + h(u) + '">';
    function key(e) { if (e.key === 'Escape') close(); }
    function close() { o.remove(); document.removeEventListener('keydown', key); }
    o.addEventListener('click', close); document.body.appendChild(o); document.addEventListener('keydown', key);
  }
  function stageUrl() { var w = wornNow(); return ui.view === 'model' ? modelShow() : w ? w.url : avatarShow(); }
  var ACT = {
    go: function (el) { go(el.dataset.page); },
    sheet: function (el) { openSheet(el.dataset.name); },
    logout: function () {
      if (genPending && !confirm('입은 모습을 만드는 중이에요. 프로필을 바꾸면 이 화면에서는 결과를 받지 못해요. 계속할까요?')) return;
      try { localStorage.removeItem(CUR_KEY); } catch (e) {}
      genPending = null; ui.genErr = null; waitEnd(); clearUrls(); user = null; state = null; render();
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
    styleTry: function (el) { var st = FD.styles.filter(function (s) { return s.id === el.dataset.id; })[0]; if (!st) return; importStyle(st); ui.left = 'clothes'; ui.view = 'model'; ui.fitTab = null; go('fitting'); },
    left: function (el) { ui.left = el.dataset.v; ui.accFull = false; render(); },
    view: function (el) { ui.view = el.dataset.v; render(); },
    angle: function (el) { ui.angle = el.dataset.v; render(); },
    zoom: function (el) { var i = ZOOMS.indexOf(ui.zoom), d = el.dataset.v; ui.zoom = d === '1' ? 1 : ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, i + (d === '+' ? 1 : -1)))]; render(); },
    rpToggle: function () { ui.rpOff = !ui.rpOff; render(); },
    fitStyle: function (el) { state.profile.pref = el.dataset.v; save(); render(); },
    resetSel: function () {
      if (genPending) return;
      state.sel = {}; state.accSel = []; delete state.wearLast; ui.genErr = null; ui.zoom = 1; ui.angle = 'front'; ui.fitTab = null; ui.accFull = false; save(); render();
      toast('고른 옷과 액세서리를 모두 뺐어요. 내 옷장과 입어본 기록은 그대로 남아 있어요.', 4000);
    },
    waitShow: function () { var o = document.getElementById('wait'); if (o) o.style.display = ''; },
    fitTab: function (el) { ui.fitTab = el.dataset.cat; render(); },
    unsel: function (el) { delete state.sel[el.dataset.cat]; save(); render(); },
    size: function (el) { var s = state.sel[el.dataset.cat]; if (s) { s.size = el.dataset.v; save(); render(); } },
    toCloset: function (el) { ui.closetCat = el.dataset.cat; formFollow(ui.closetCat); go('closet'); },
    wear: wearAll,
    zoomStage: function () { openFull(stageUrl(), '입은 모습'); },
    open3d: open3d,
    savePic: function () {
      var w = wornNow(); if (!w) { toast('저장할 입은 모습이 아직 없어요.'); return; }
      var a = document.createElement('a'); a.href = w.url; a.download = 'FITON_' + String(w.name).replace(/[\\/:*?"<>|]/g, '_').slice(0, 40) + '.png'; document.body.appendChild(a); a.click(); a.remove();
    },
    closetKind: function (el) { ui.closetKind = el.dataset.v; render(); },
    closetCat: function (el) { ui.closetCat = el.dataset.cat; formFollow(ui.closetCat); ui.closetKind = 'all'; ui.linkEdit = null; render(); },
    pickItem: function (el) { var it = item(el.dataset.id); if (!it) return; if (it.kind === 'under') { toast('언더웨어는 사이즈 확인용으로만 저장돼요. 입어보기에는 쓰지 않아요.', 4000); return; } var c = state.sel[it.cat]; if (c && c.id === it.id) delete state.sel[it.cat]; else { state.sel[it.cat] = { id: it.id, size: null }; exclusiveSel(it.cat); } save(); render(); },
    linkOpen: function (el) { ui.linkEdit = { id: el.dataset.id, err: false }; render(); var i = document.getElementById('lkin'); if (i) i.focus(); },
    linkCancel: function () { ui.linkEdit = null; render(); },
    linkSave: function (el) {
      var u = val('lkin').trim(), it = el.dataset.kind === 'a' ? accItem(el.dataset.id) : item(el.dataset.id);
      if (!/^https?:\/\//i.test(u)) { ui.linkEdit.err = true; render(); return; }
      if (it) { it.url = u; it.gone = false; save(); } ui.linkEdit = null; render();
    },
    markGone: function (el) { var it = el.dataset.kind === 'a' ? accItem(el.dataset.id) : item(el.dataset.id); if (it) { it.gone = true; save(); render(); } },
    editItem: function (el) { var it = item(el.dataset.id); if (!it) return; ui.cf = Object.assign(blankForm(it.cat), JSON.parse(JSON.stringify(it))); render(); },
    cfCancel: function () { ui.cf = blankForm(ui.closetCat); render(); },
    sizeAdd: function () { ui.cf.sizes.push({ label: '' }); render(); },
    sizeDel: function (el) { ui.cf.sizes.splice(Number(el.dataset.i), 1); render(); },
    cfSave: function () {
      var f = ui.cf, sizes = f.sizes.filter(function (s) { return String(s.label || '').trim() !== ''; });
      if (!sizes.length) { f.err = '사이즈 이름을 하나 이상 넣어 주세요.'; render(); return; }
      if (f.url && !safeUrl(f.url)) { f.err = '상품 링크를 확인해 주세요.'; render(); return; }
      var old = f.id ? item(f.id) : null, rec = old ? JSON.parse(JSON.stringify(old)) : { id: 'p' + (state.seq++), gender: isMale() ? 'male' : 'female', fabric: 'normal', isRef: false, refSize: '' };
      rec.cat = f.cat; rec.name = String(f.name || '').trim() || (CATS[f.cat] + ' ' + rec.id.slice(1)); rec.price = f.price; rec.url = f.url; rec.measureType = f.cat === 'shoe' ? '' : f.measureType || 'flat'; rec.sizes = sizes; rec.photo = f.photo;
      rec.kind = f.cat === 'shoe' ? '' : (f.kind || guessKind(rec.name, f.cat) || '');
      if (rec.kind === 'under' && state.sel[rec.cat] && state.sel[rec.cat].id === rec.id) delete state.sel[rec.cat];
      if (old) state.closet = state.closet.map(function (x) { return x.id === rec.id ? rec : x; }); else state.closet.push(rec);
      if (old && old.cat !== rec.cat && state.sel[old.cat] && state.sel[old.cat].id === rec.id) delete state.sel[old.cat];
      if (f.big) blobPut('gphoto:' + rec.id, f.big).catch(function () {});
      else if (old && old.photo !== rec.photo) blobDel('gphoto:' + rec.id).catch(function () {});
      if (!state.sel[rec.cat] && rec.kind !== 'under') selectItem(rec);
      save(); ui.closetCat = rec.cat; ui.cf = blankForm(rec.cat); ui.cf.saved = true; render();
    },
    delItem: function (el) {
      var it = item(el.dataset.id); if (!it || !confirm('"' + it.name + '"을(를) 내 옷장에서 삭제할까요? 이 옷으로 만든 입은 모습도 함께 지워져요.')) return;
      state.closet = state.closet.filter(function (x) { return x.id !== it.id; });
      Object.keys(state.sel).forEach(function (c) { if (state.sel[c] && state.sel[c].id === it.id) delete state.sel[c]; });
      dropTryon(it.id); Object.keys(state.looks || {}).forEach(function (k) { if (k.split('+').indexOf(it.id) >= 0) dropTryon(k); });
      blobDel('gphoto:' + it.id).catch(function () {}); ui.cf = blankForm(ui.closetCat); save(); render();
    },
    accTab: function (el) { ui.accTab = el.dataset.v; ui.linkEdit = null; render(); },
    accToggle: function (el) {
      var id = el.dataset.id, i = state.accSel.indexOf(id);
      if (i >= 0) { state.accSel.splice(i, 1); ui.accFull = false; } else if (state.accSel.length >= 3) ui.accFull = true; else { state.accSel.push(id); ui.accFull = false; }
      save(); render();
    },
    toFitAcc: function () { ui.left = 'acc'; go('fitting'); },
    afClear: function () { ui.af.photo = ''; ui.af.big = null; render(); },
    afSave: function () {
      var f = ui.af, name = String(f.name || '').trim(), url = String(f.url || '').trim();
      f.saved = false;
      if (!f.photo) { f.err = '상품 사진을 넣어 주세요.'; render(); return; }
      if (!name) { f.err = '이름을 넣어 주세요.'; render(); return; }
      if (url && !/^https?:\/\//i.test(url)) { f.err = '상품 링크는 https://로 시작하는 주소를 넣어 주세요.'; render(); return; }
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
    histZoom: function (el) { var u = urls.tryon[el.dataset.id]; if (u) openFull(u, lookName(el.dataset.id)); },
    histShow: function (el) { var key = el.dataset.id, its = lookItems(key); if (!its.length) return; its.forEach(selectItem); state.wearLast = key; save(); ui.view = 'me'; ui.left = 'clothes'; go('fitting'); },
    histDel: function (el) { if (!confirm('이 입은 모습을 삭제할까요?')) return; dropTryon(el.dataset.id); ui.cmp = null; save(); render(); },
    bGender: function (el) { state.profile.gender = el.dataset.v; save(); render(); },
    bSave: function () {
      var p = state.profile; p.height = val('h'); p.weight = val('w'); p.m = p.m || {};
      Array.prototype.forEach.call(app.querySelectorAll('[data-mf]'), function (i) { if (i.value === '') delete p.m[i.dataset.mf]; else p.m[i.dataset.mf] = i.value; });
      save(); toast('저장했어요.', 2500); render();
    },
    avatarDel: function () { if (!confirm('내 아바타 이미지를 지우고 기본 캐릭터로 되돌릴까요?')) return; if (urls.avatar) URL.revokeObjectURL(urls.avatar); urls.avatar = null; blobDel('avatar').catch(function () {}); render(); }
  };
  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (el && ACT[el.dataset.act]) ACT[el.dataset.act](el);
    else if (e.target.dataset && e.target.closest('.fig') && e.target.tagName === 'IMG') openFull(e.target.getAttribute('src'), e.target.alt);
  });
  app.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.id && /^lg/.test(e.target.id)) { var b = app.querySelector('[data-act="lgLogin"],[data-act="lgCreate"]'); if (b) b.click(); }
  });
  app.addEventListener('input', function (e) {
    var t = e.target, d = t.dataset;
    if (d.cf) { ui.cf[d.cf] = t.value; ui.cf.saved = false; ui.cf.err = ''; }
    else if (d.af) { ui.af[d.af] = t.value; ui.af.saved = false; ui.af.err = ''; }
    else if (d.sl != null) ui.cf.sizes[Number(d.sl)].label = t.value;
    else if (d.sf) { var p = d.sf.split(':'), z = ui.cf.sizes[Number(p[0])]; if (t.value === '') delete z[p[1]]; else z[p[1]] = t.value; }
  });
  app.addEventListener('change', function (e) {
    var t = e.target, c = t.dataset.chg;
    if (c === 'shoe') { state.tryShoe = t.value; save(); render(); return; }
    if (c === 'cfKind') { ui.cf.kind = t.value; render(); return; }
    if (c === 'cfCat') {
      var f = ui.cf, was = f.cat === 'shoe', now = t.value === 'shoe';
      f.cat = t.value; if (was !== now) { f.sizes = defaultSizes(t.value); f.measureType = now ? '' : 'flat'; } render(); return;
    }
    if (c === 'afType') { ui.af.type = t.value; return; }
    var kind = t.dataset.file; if (!kind) return;
    var fl = t.files && t.files[0]; t.value = ''; if (!fl) return;
    if (kind === 'quick') homeFile(fl);
    else if (kind === 'sizeCap') sizeCap(fl);
    else if (kind === 'photo') closetPhoto(fl);
    else if (kind === 'accPhoto') setAccPhoto(fl);
    else if (kind === 'avatar') Core.shrink(fl, 1000, 0.92).then(function (b) { return blobPut('avatar', b).then(function () { if (urls.avatar) URL.revokeObjectURL(urls.avatar); urls.avatar = URL.createObjectURL(b); render(); }); }).catch(function (err) { toast((err && err.message) || '이미지를 저장하지 못했어요.'); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
  window.addEventListener('hashchange', function () { var p = pageFromHash(); if (p !== ui.page) { ui.page = p; render(); window.scrollTo(0, 0); } });

  /* ---------- 시작 ---------- */
  ui.cf = blankForm('outer'); ui.af = blankAcc();
  if (user) { state = load(); render(); loadMedia().then(function () { render(); genResume(); }); }
  else render();
})();
