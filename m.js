/* FITON 모바일 (m.html) — 2026-11-20 첫 화면(영상)·회원가입·로그인·서버 저장(fit-sync.js) 추가. 1~2단계: 앱 틀·화면 이동·프로필·내 치수·기본 모델/내 아바타 고르기·요금제·설정·옷장(보기)·기록(보기).
   설계: fiton-mobile-설계\v3_전신보임_빠진화면추가_큰글자\모바일_v3.html. 동작 기준은 PC 앱(pc.js)이다.
   · PC 앱과 같은 저장소(localStorage 'fit-test-v1:<프로필 id>', IndexedDB 'fit-test')를 같은 형식으로 읽고 쓴다. 저장 값에 새 항목을 만들지 않는다.
   · 「pc.js N~M행 그대로」 표시 사이의 코드는 pc.js 에서 한 글자도 바꾸지 않고 옮긴 것이다(핏 계산·저장·프로필을 새로 짜지 않기 위해). pc.js 를 고치면 여기도 같이 맞춘다.
   · 2026-11-20 3단계: 옷 넣기(앨범·카메라·붙여넣기) → 옷 확인(이름·가격·종류·사이즈 표·구매 링크) → 옷장에 저장. 읽기·저장은 PC 옷장 입력 칸(ui.cf)과 같은 코드(closetPhoto·sizeCap·cfSave)를 그대로 쓴다.
   · 아직 안 하는 것: 옷 입히기·아바타 만들기·옷장/기록 수정. 그 버튼들은 「다음 단계에서 연결돼요」 안내만 띄운다. */
(function () {
  'use strict';

  /* ▼ pc.js 8~12행 그대로 */
  var Core = window.FitCore, E = window.FitEngine, KEY = Core.KEY, CUR_KEY = Core.CUR_KEY;
  var FD = window.FITON || { styles: [], plans: { free: { name: '무료', limit: 3, price: '', features: [] } } };
  var BASE_CFG = JSON.parse(JSON.stringify(window.FIT_CONFIG));
  var CATS = { outer: '겉옷', inner: '이너', top: '상의', bottom: '하의', dress: '원피스', shoe: '신발' };
  var CAT_ORDER = ['outer', 'inner', 'top', 'bottom', 'dress', 'shoe'];
  /* ▲ */
  /* ▼ pc.js 15~69행 그대로 */
  var USES = [['suit', '정장'], ['home', '홈웨어'], ['sport', '트레이닝·요가'], ['outdoor', '아웃도어(등산·골프·스키)'], ['swim', '수영·비치'], ['dance', '댄스·발레'], ['costume', '유니폼·코스튬'], ['maternity', '임산부'], ['hanbok', '한복'], ['two', '투피스·세트'], ['under', '언더웨어']];
  var KINDS = USES; /* 홈 화면 용도 버튼(옷 종류를 고르기 전이라 용도만) */
  var TYPES = {
    outer: [['coat', '코트'], ['jacket', '재킷'], ['padding', '패딩'], ['jumper', '점퍼·집업'], ['cardigan', '카디건'], ['vest', '조끼']],
    inner: [['vest', '조끼'], ['cardigan', '카디건'], ['knit', '니트'], ['tee', '티셔츠'], ['shirt', '셔츠'], ['blouse', '블라우스']],
    top: [['tee', '티셔츠'], ['shirt', '셔츠'], ['blouse', '블라우스'], ['knit', '니트'], ['sweat', '맨투맨·후드'], ['sleeveless', '민소매']],
    bottom: [['jeans', '청바지'], ['slacks', '슬랙스'], ['pants', '바지'], ['shorts', '반바지'], ['skirt', '치마'], ['leggings', '레깅스·트레이닝']],
    dress: [],
    /* 2026-11-19 11차 사용자 결정(세부 탭+기본 굽): 신발도 종류로 나눈다. id 는 SHOE_H(기본 굽)·SHOE_TYPES 와 같은 값. 신발에는 용도(USES)를 붙이지 않는다 */
    shoe: [['sneakers', '운동화'], ['pumps', '구두(힐)'], ['loafers', '로퍼'], ['boots', '부츠'], ['sandals', '샌들'], ['slippers', '슬리퍼']]
  };
  function kindsOf(cat) { return cat === 'shoe' ? TYPES.shoe.slice() : (TYPES[cat] || []).concat(USES); }
  var KIND_NAME = { inner: '티·셔츠류' }; USES.forEach(function (k) { KIND_NAME[k[0]] = k[1].replace(/\(.*\)/, ''); });
  Object.keys(TYPES).forEach(function (c) { TYPES[c].forEach(function (k) { KIND_NAME[k[0]] = k[1]; }); });
  /* 이름으로 추측하는 순서: ① 특수 용도(언더웨어·한복·홈웨어…) ② 그 탭의 옷 종류 ③ 나머지 용도(아웃도어·트레이닝·세트·정장) */
  var USE_FIRST = [['under', /속옷|언더웨어|팬티|브라(?![운우이질])|브래지어|런닝(?!화)|내의|보정\s?속옷|스타킹|양말/], ['maternity', /임산부|임부|수유복|maternity/i], ['hanbok', /한복|저고리|수의|당의/], ['swim', /수영|비키니|래쉬|래시|비치웨어|스윔|모노키니|swim/i], ['dance', /댄스|발레|에어로빅|레오타드|무용/], ['costume', /유니폼|코스튬|코스프레|교복|작업복|근무복/], ['home', /잠옷|파자마|홈웨어|라운지|수면|극세사/]];
  var USE_LAST = [['outdoor', /등산|골프|스키복|스노보드|보드복|아웃도어|트레킹|고어텍스|바람막이|캠핑/], ['sport', /트레이닝|츄리닝|운동|조거|요가|레깅스|저지|스포츠|러닝|기능성/], ['two', /투피스|세트|셋업|\bset\b/i], ['suit', /정장|수트|슈트|블레이저|자켓|재킷|슬랙스/]];
  var TYPE_GUESS = {
    outer: [['padding', /패딩|구스|덕다운|다운\s?(점퍼|자켓|재킷|코트)|푸퍼/], ['coat', /코트|트렌치|무스탕|coat/i], ['jacket', /자켓|재킷|블레이저|라이더|야상|jacket|blazer/i], ['jumper', /점퍼|집업|바람막이|블루종|아노락/], ['cardigan', /카디건|가디건|cardigan/i], ['vest', /조끼|베스트(?!셀러)|vest/i]],
    inner: [['vest', /조끼|베스트(?!셀러)|vest/i], ['cardigan', /카디건|가디건|cardigan/i], ['blouse', /블라우스/], ['tee', /티셔츠|반팔티|긴팔티|면티|폴라티|목폴라|tee\b/i], ['shirt', /셔츠|남방/], ['knit', /니트|스웨터|knit/i]],
    top: [['sleeveless', /민소매|나시|슬리브리스|탱크탑/], ['sweat', /맨투맨|후드티|후디|스웨트|hoodie/i], ['blouse', /블라우스/], ['tee', /티셔츠|반팔티|긴팔티|면티|폴라티|목폴라|tee\b/i], ['shirt', /셔츠|남방/], ['knit', /니트|스웨터|knit/i]],
    bottom: [['skirt', /스커트|치마|skirt/i], ['shorts', /반바지|쇼츠|숏팬츠|[3-5]부|버뮤다|shorts/i], ['leggings', /레깅스|조거|트레이닝|츄리닝/], ['jeans', /청바지|데님|jeans/i], ['slacks', /슬랙스|정장\s?바지/], ['pants', /바지|팬츠|pants/i]],
    /* 신발: 예전 wearShoeH 이름 추측과 같은 순서(부츠→운동화→샌들/슬리퍼→로퍼→구두) */
    shoe: [['boots', /부츠|boot/i], ['sneakers', /운동화|스니커|sneaker/i], ['slippers', /슬리퍼|룸슈즈|실내화|slipper/i], ['sandals', /샌들|sandal/i], ['loafers', /로퍼|loafer/i], ['pumps', /구두|힐|펌프|pump|heel/i]]
  };
  var DRESS_KINDS = /^(maternity|hanbok|swim|dance|outdoor|costume|home|sport|two)$/; /* 원피스는 정장·언더웨어 추측은 하지 않는다 */
  /* 옛 추측(2026-11-19 이전). 저장된 값이 이것과 같으면 자동으로 붙은 값이라 새 추측으로 한 번 바꾼다(kindFix) */
  var OLD_GUESS = [['under', /속옷|언더웨어|팬티|브라|런닝|내의|보정|스타킹|양말/], ['maternity', /임산부|임부|수유복|maternity/i], ['hanbok', /한복|저고리|수의|당의/], ['swim', /수영|비키니|래쉬|래시|비치웨어|스윔|모노키니|swim/i], ['dance', /댄스|발레|에어로빅|레오타드|무용/], ['outdoor', /등산|골프|스키복|스노보드|보드복|아웃도어|트레킹|고어텍스|바람막이|캠핑/], ['costume', /유니폼|코스튬|코스프레|교복|작업복|근무복/], ['home', /잠옷|파자마|홈웨어|라운지|수면|극세사/], ['sport', /트레이닝|츄리닝|운동|조거|요가|레깅스|저지|스포츠|러닝|기능성/], ['two', /투피스|세트|셋업|set/i], ['suit', /정장|수트|슈트|블레이저|자켓|재킷|슬랙스/], ['inner', /티셔츠|반팔|드레스셔츠|와이셔츠|셔츠|나시|민소매|이너|히트텍/]];
  var OLD_DRESS = /^(maternity|hanbok|swim|dance|outdoor|costume|home|sport|two)$/;
  function guessKindOld(name, cat) {
    if (cat === 'shoe') return '';
    var t = String(name || '');
    for (var i = 0; i < OLD_GUESS.length; i++) if (OLD_GUESS[i][1].test(t)) { if (cat === 'dress' && !OLD_DRESS.test(OLD_GUESS[i][0])) continue; return OLD_GUESS[i][0]; }
    return '';
  }
  /* 2026-11-13 이름에 겉에 입는 옷 단어가 있는데 분류가 상의면 저장할 때 한 번 묻는다(겉옷은 상의 위에 겹쳐 입혀진다) */
  var OUTER_WORDS = /재킷|자켓|블레이저|코트|트렌치|점퍼|패딩|카디건|가디건|집업|야상|무스탕|바람막이/;
  function guessKind(name, cat) {
    var t = String(name || ''), i;
    if (cat === 'shoe') { for (i = 0; i < TYPE_GUESS.shoe.length; i++) if (TYPE_GUESS.shoe[i][1].test(t)) return TYPE_GUESS.shoe[i][0]; return ''; }
    var pass = function (list) { for (i = 0; i < list.length; i++) if (list[i][1].test(t)) { if (cat === 'dress' && !DRESS_KINDS.test(list[i][0])) continue; return list[i][0]; } return ''; };
    return pass(USE_FIRST) || pass(TYPE_GUESS[cat] || []) || pass(USE_LAST);
  }
  /* 옷장에 이미 있는 옷의 세부 종류를 새 기준으로 한 번 맞춘다. 비어 있거나 옛 추측과 같은 값(=자동으로 붙은 값)만 바꾸고, 직접 고른 값은 그대로 둔다 */
  function kindFix(s) {
    if (!Array.isArray(s.closet)) return false;
    var ch = false;
    if (!(s.kindV >= 2)) {
      s.closet.forEach(function (x) { if (!x || x.cat === 'shoe') return; var k = x.kind || ''; if (!k || k === guessKindOld(x.name, x.cat)) x.kind = guessKind(x.name, x.cat); });
      s.kindV = 2; ch = true;
    }
    /* 2026-11-19 11차: 신발 종류가 생겨 비어 있는 신발만 이름으로 한 번 채운다(직접 고른 값은 그대로) */
    if (s.kindV < 3) { s.closet.forEach(function (x) { if (x && x.cat === 'shoe' && !x.kind) x.kind = guessKind(x.name, 'shoe'); }); s.kindV = 3; ch = true; }
    return ch;
  }
  /* ▲ */
  /* ▼ pc.js 70~71행 그대로 */
  var GGENDER = { female: '여성용', male: '남성용', unisex: '공용' };
  var PREFS = [['tight', '타이트'], ['fit', '정핏'], ['loose', '여유'], ['over', '오버핏']];
  /* ▲ */
  /* ▼ pc.js 72~78행 그대로 */
  var TOPF = [['chest', '가슴단면'], ['shoulder', '어깨'], ['length', '총장'], ['sleeve', '소매'], ['armhole', '암홀단면'], ['sleeve_width', '소매통단면'], ['hem', '밑단단면']];
  var FIELDS = {
    outer: TOPF, inner: TOPF, top: TOPF,
    bottom: [['waist', '허리단면'], ['hip', '엉덩이단면'], ['thigh', '허벅지단면'], ['knee', '무릎단면'], ['rise', '밑위'], ['inseam', '기장(인심)'], ['hem', '밑단단면'], ['length', '총장(스커트)']],
    dress: [['chest', '가슴단면'], ['shoulder', '어깨'], ['waist', '허리단면'], ['hip', '엉덩이단면'], ['length', '총장'], ['sleeve', '소매'], ['armhole', '암홀단면'], ['sleeve_width', '소매통단면'], ['hem', '밑단단면']],
    shoe: [['inner', '안쪽 길이(mm)']]
  };
  /* ▲ */
  /* ▼ pc.js 79~80행 그대로 */
  var MFIELDS = [['chest', '가슴둘레', 'cm'], ['shoulder', '어깨너비', 'cm'], ['waist', '허리둘레', 'cm'], ['hip', '엉덩이둘레', 'cm'], ['thigh', '허벅지둘레', 'cm'],
    ['arm', '팔길이', 'cm'], ['inseam', '다리 안쪽 길이', 'cm'], ['rise', '밑위(앞)', 'cm'], ['foot', '발길이', 'mm']];
  /* ▲ */
  /* ▼ pc.js 82~99행 그대로 */
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
    .concat([{ id: 'cool', name: '앞옆뒤남성' /* 2026-11-19 최종 검토 8차(블라인드C 15): 「멋진남자」만 튀던 이름 → 다른 모델처럼 「…남성」, 앞·옆·뒤 사진이 다 있는 모델 */, g: 'male', h: 171, w: 70, m: [96, 44, 81, 95, 56, 59, 78, 26, 258], img: 'assets/avatars/cool.jpg?v=a', preset: true, ang: { side: 'assets/avatars/cool_side.jpg?v=a', back: 'assets/avatars/cool_back.jpg?v=a' } }]);
  /* ▲ */
  /* ▼ pc.js 139행 그대로 */
  var SHIRT = '<svg viewBox="0 0 24 24"><path d="M8 3l4 3 4-3 5 4-3 4-2-1v11H8V10l-2 1-3-4zM12 6v15"></path></svg>';
  /* ▲ */

  var app = document.getElementById('app');
  /* 2026-11-20 로그인: 닉네임+PIN 프로필 대신 계정(이메일+비밀번호, fit-sync.js). 계정의 자료는 프로필 id 'acc_<계정 id>' 로 예전과 같은 자리에 저장된다.
     PC 앱의 프로필 목록(fit-users-v1)·지금 프로필(fit-current-user)은 읽기만 하고 바꾸지 않는다(pc.js 147행 var user 를 대신함) */
  var Sync = window.FitSync;
  function acctUser() { var s = Sync.session(); return s ? { id: Sync.localId(), nick: String(s.email || '').split('@')[0] || '회원', email: s.email || '', acct: true } : null; }
  var user = acctUser();
  /* ▼ pc.js 148행 그대로 */
  var state = null, urls = { avatar: null, tryon: {}, ang: { side: null, back: null }, angTry: { side: {}, back: {} } }, genPending = null, syncDue = false;
  /* ▲ */
  /* ▼ pc.js 149행 그대로 */
  var ANGS = ['side', 'back'], ANG_NAME = { front: '앞모습', side: '옆모습', back: '뒷모습' }, angBusy = null; /* 2026-11-18 옆·뒷모습 입히기: 방향별 아바타 사진(avatar_side/back)과 결과(tryon_side:/tryon_back:<id>)는 폰 앱과 섞이지 않게 따로 저장 */
  /* ▲ */
  /* 화면 상태(저장하지 않음). onb: 가입 직후 처음 실행 단계(0 = 아님, 1 = 내 치수 넣기, 2 = 입어볼 모델 고르기)
     au: 첫 화면의 로그인·회원가입 창(mode: '' = 영상만, login, signup, reset, sent, confirm, newpw) / imp: 이 기기에 있던 프로필 자료 가져오기(''·'ask'·'pin') / wait: 서버에서 불러오는 동안 보일 글 */
  var MPAGES = ['home', 'closet', 'history', 'me', 'plan', 'set'];
  /* cf: 「옷 확인」(목업 B3)에 넣고 있는 옷 = PC 옷장 입력 칸과 같은 모양(blankForm). null 이면 그 화면이 아님. 모바일만 쓰는 값: catAuto(이름으로 종류를 골라도 됨)·catHit(이름으로 골랐음)·catName·readCat(읽기 시작할 때의 종류)·tOpen(표 고치기 열림) */
  var ui = { page: pageFromHash(), bodyTab: null, closetCat: 'outer', meEdit: false, plus: false, cf: null, onb: 0, onbBase: null, mediaReady: false, vkey: '',
    au: { mode: '', err: '', busy: false, email: '', agree: false, note: '' }, imp: '', wait: '',
    lg: { mode: 'list', id: null, err: '', fails: 0, until: 0 } };
  var SOON = '다음 단계에서 연결돼요';

  /* ---------- 저장 (PC 앱과 같은 형식) ---------- */
  /* ▼ pc.js 154~170행 그대로 */
  function blankState() {
    return { step: 'profile', profile: { gender: 'female', height: '', weight: '', pref: 'fit', m: {} }, closet: [], sel: {}, draft: null, motion: 0, cfg: null, feel: {}, seq: 1,
      styleId: null, view: 'model', sub: { plan: 'free', used: 0, month: '' }, accs: [], accSel: [] };
  }
  function load() {
    var s = blankState();
    try { var raw = localStorage.getItem(KEY + ':' + user.id); if (raw) s = Object.assign(s, JSON.parse(raw)); } catch (e) { /* 메모리로만 동작 */ }
    if (!Array.isArray(s.accs)) s.accs = [];
    if (!Array.isArray(s.accSel)) s.accSel = [];
    kindFix(s); /* 2026-11-19 세부 종류 새 기준(저장은 다음 저장 때 같이) */
    return s;
  }
  function save() { if (!user) return; try { localStorage.setItem(KEY + ':' + user.id, JSON.stringify(state)); } catch (e) { toast('저장 공간이 부족해 저장하지 못했어요.'); } }
  function bk(k) { return user.id + ':' + k; }
  function blobGet(k) { return Core.rawGet(bk(k)); }
  function blobPut(k, v) { return Core.rawPut(bk(k), v); }
  function blobDel(k) { return Core.rawDel(bk(k)); }
  /* ▲ */
  /* ▼ pc.js 171~192행 그대로 */
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
  /* ▲ */
  /* 기기에 저장할 때마다 서버에도 올리도록 위의 save·blobPut·blobDel 에 한 줄씩 덧붙인다(기기 저장 방식은 그대로) */
  var save0 = save, blobPut0 = blobPut, blobDel0 = blobDel;
  save = function () { save0(); if (user && user.acct) Sync.touch(); };
  blobPut = function (k, v) { return blobPut0(k, v).then(function (r) { if (user && user.acct) Sync.blobUp(k); return r; }); };
  blobDel = function (k) { return blobDel0(k).then(function (r) { if (user && user.acct) Sync.blobDel(k); return r; }); };

  /* ---------- 유틸 ---------- */
  /* ▼ pc.js 195행 그대로 */
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  /* ▲ */
  /* ▼ pc.js 197행 그대로 */
  function item(id) { return state.closet.filter(function (x) { return x.id === id; })[0] || null; }
  /* ▲ */
  /* ▼ pc.js 199~200행 그대로 */
  /* 지금 입어보는 쪽: 고른 적이 없으면 내 사진이 있을 때만 '내 아바타', 없으면 '기본 모델' */
  function who() { return state && (state.who === 'base' || state.who === 'me') ? state.who : (urls.avatar ? 'me' : 'base'); }
  /* ▲ */
  /* ▼ pc.js 205~217행 그대로 */
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
  /* ▲ */
  /* ▼ pc.js 218~230행 그대로 */
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
  /* ▲ */
  /* ▼ pc.js 231~235행 그대로 */
  function safeUrl(u) {
    u = String(u || '').trim(); if (!u) return '';
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    try { var x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch (e) { return ''; }
  }
  /* ▲ */
  /* ▼ pc.js 236~248행 그대로 */
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
  /* ▲ */
  /* pc.js 249~250행(pageFromHash·go)을 모바일 화면 목록에 맞게 고침. 다른 화면으로 가면 저장 안 한 「옷 확인」은 버린다 */
  function pageFromHash() { var p = (location.hash || '').replace('#', ''); return MPAGES.indexOf(p) >= 0 ? p : 'home'; }
  function go(p) { ui.page = p; ui.plus = false; ui.meEdit = false; ui.cf = null; if (location.hash !== '#' + p) location.hash = '#' + p; render(); }
  /* ▼ pc.js 251~257행 그대로 */
  function exclusiveSel(cat) {
    /* 2026-11-12 사용자 결정: 원피스 위에 상의(종류 제한 없음)를 겹쳐 입을 수 있다. 원피스와 하의만 서로 바꿔 끼운다 */
    if (cat === 'dress') delete state.sel.bottom;
    else if (cat === 'bottom') delete state.sel.dress;
  }
  function selectItem(it) { var c = state.sel[it.cat]; state.sel[it.cat] = { id: it.id, size: c && c.id === it.id ? c.size : null }; exclusiveSel(it.cat); }
  function defaultSizes(cat) { return (cat === 'shoe' ? ['250', '260', '270'] : ['S', 'M', 'L']).map(function (l) { return { label: l }; }); }
  /* ▲ */
  /* ▼ pc.js 261~263행 그대로 */
  function mkTable(cat, mt, sizes) { return window.FitNotes && FitNotes.tblFromSizes && cat !== 'shoe' ? FitNotes.tblFromSizes(cat, mt, sizes, FIELDS[cat]) : null; }
  function linkReadOn() { var c = window.TRYON_CFG; return !!(c && c.url && c.anon); }
  function blankForm(cat) { return { id: null, cat: cat, name: '', price: '', url: '', measureType: cat === 'shoe' ? '' : 'flat', sizes: defaultSizes(cat), table: mkTable(cat, 'flat', defaultSizes(cat)), photo: '', big: null, sizeDone: false, sizeMsg: '', photoMsg: '', saved: false, err: '' }; }
  /* ▲ */
  /* ▼ pc.js 265행 그대로 */
  function posOf(it) { if (String(it.id).indexOf('s_') !== 0 || it.ext) return ''; /* 옷만 뽑은 사진은 상품 사진이라 모델 사진처럼 자르지 않는다 */ return { outer: 'p-top', inner: 'p-top', top: 'p-top', bottom: 'p-low', dress: 'p-mid', shoe: 'p-foot' }[it.cat] || ''; }
  /* ▲ */

  /* ---------- 구독 횟수 ---------- */
  /* ▼ pc.js 268~279행 그대로 */
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
  /* ▲ */

  /* ▼ pc.js 310~312행 그대로 */
  function got(c) { var x = state.sel[c]; return x ? item(x.id) : null; }
  function lookItems(key) { return String(key).split('+').map(item).filter(Boolean); }
  function lookName(key) { return lookItems(key).map(shortName).join(' + '); }
  /* ▲ */
  /* ▼ pc.js 314~331행 그대로 */
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
  /* ▲ */
  /* ▼ pc.js 374행 그대로 */
  function avatarShow() { return charPic() || (isMale() ? 'assets/avatar_male.jpg?v=t' : 'assets/avatar_default.jpg?v=t'); }
  /* ▲ */

  /* ---------- 핏 계산 (공통 파일 fit-engine.js 를 PC 와 같은 방법으로 부른다) ---------- */
  /* ▼ pc.js 710~712행 그대로 */
  function evalOne(it, size) {
    try { return E.evaluate({ profile: prof(), items: [{ cat: engCat(it.cat), garment: it, size: size || null, ref: null }] }, cfgNow()).results[0] || null; } catch (e) { return null; }
  }
  /* ▲ */

  /* ---------- 프로필 ---------- */
  /* ▼ pc.js 1534행 그대로 */
  function dot(u) { return '<span class="dot">' + h(String(u.nick || '?').charAt(0)) + '</span>'; }
  /* ▲ */
  /* ▼ pc.js 1555~1564행 그대로 */
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
  /* ▲ */
  /* pc.js 1565~1571행(enterApp)에서 PC 전용(옷 입력 칸·입히기 이어받기)을 뺌 */
  function enterApp() {
    ui.lg = { mode: 'list', id: null, err: '', fails: 0, until: 0 }; ui.mediaReady = false;
    clearUrls(); render();
    loadMedia().then(function () { ui.mediaReady = true; render(); });
  }
  /* ---------- 계정: 로그인한 뒤 서버 내용 받기 ---------- */
  function mediaAgain() { var uid = user && user.id; return loadMedia().then(function () { if (user && user.id === uid) { ui.mediaReady = true; syncDraw(); } }); }
  function pullBlobs() { Sync.blobSync(true).catch(function () {}); } /* 다 받으면 Sync.on 의 blobs 가 불린다 */
  /* 로그인·가입 직후: 먼저 서버 내용을 받고(받기 전에는 저장하지 않는다) → 서버에 내용이 있으면 바로 홈, 없으면 처음 실행 단계 */
  function afterAuth() {
    user = acctUser(); if (!user) return;
    ui.au = { mode: '', err: '', busy: false, email: '', agree: false, note: '' }; ui.wait = '내 자료를 불러오는 중…'; ui.onb = 0; ui.imp = ''; ui.cf = null; state = null; render();
    Sync.pull().then(function (r) {
      if (!user) return;
      ui.wait = '';
      if (r.empty && !Sync.hasLocal()) {
        state = blankState(); state.kindV = 2; /* pc.js lgCreate 와 같은 새 내용. 저장은 치수를 넣거나 가져오기를 고른 뒤에 */
        if (Core.readUsers().length) ui.imp = 'ask'; else ui.onb = 1;
        ui.page = 'home'; enterApp(); return;
      }
      state = load(); ui.page = 'home'; if (location.hash && location.hash !== '#home') location.hash = '#home';
      enterApp(); pullBlobs();
    }, function (e) {
      if (!user) return;
      Sync.signOut(); user = null; state = null; ui.wait = '';
      ui.au = { mode: 'login', err: (e && e.message) || '내 자료를 불러오지 못했어요. 다시 로그인해 주세요', busy: false, email: '', agree: false, note: '' }; render();
    });
  }
  /* ▼ pc.js 1574행 그대로 */
  function leftText() { return unlimited() ? '∞' : tryLeft() + '/' + planNow().limit; }
  /* ▲ */
  /* ▼ pc.js 2124~2127행 그대로 */
  function histList() {
    var looks = Object.keys(state.looks || {}).filter(function (k) { return urls.tryon[k] && lookItems(k).length; }).map(function (k) { return { key: k, items: lookItems(k) }; });
    return looks.concat(state.closet.filter(function (x) { return urls.tryon[x.id]; }).map(function (x) { return { key: x.id, items: [x] }; }));
  }
  /* ▲ */
  /* ▼ pc.js 2129행 그대로 */
  function lookSizeOf(key, it) { var t = state.lookSize && state.lookSize[key]; return t && typeof t === 'object' && t[it.id] ? String(t[it.id]) : ''; } /* lookSize[그림 키] = { 옷 id: 사이즈 이름 } */
  /* ▲ */
  /* ▼ pc.js 2206행 그대로 */
  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"></path></svg>';
  /* ▲ */

  /* ---------- 공통 틀 ---------- */
  var LOGO = '<div class="logo">FIT<i>ON</i></div>';
  var IC = ['<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"></path>', '<rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M12 3v18M9 11v2M15 11v2"></path>', null, '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>', '<circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4 4-6 8-6s8 2 8 6"></path>'];
  var TABS = [['home', '홈'], ['closet', '옷장'], ['plus', '옷 넣기'], ['history', '기록'], ['me', '내 정보']];
  var SVG = { alb: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M3 16l5-5 4 4 3-3 6 6"></path><circle cx="9" cy="9" r="1.5"></circle></svg>', cam: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"></path><circle cx="12" cy="13" r="3.5"></circle></svg>', pst: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="12" height="17" rx="2"></rect><path d="M9 4V3h6v1M9 10h6M9 14h6"></path></svg>' };
  function bgUrl(u) { return 'background-image:url(&quot;' + h(String(u).replace(/["\\\n\r]/g, encodeURIComponent)) + '&quot;)'; }
  function tabsHtml() {
    var cur = ui.page === 'plan' || ui.page === 'set' ? 'me' : ui.page; /* 요금제·설정은 「내 정보」 안의 화면 */
    return '<nav class="tabs" aria-label="주 메뉴">' + TABS.map(function (t, i) {
      if (t[0] === 'plus') return '<button type="button" class="plus' + (ui.plus ? ' open' : '') + '" data-act="plus" aria-expanded="' + !!ui.plus + '" aria-label="옷 넣기"><i aria-hidden="true">＋</i>' + t[1] + '</button>';
      var on = cur === t[0] && !ui.plus;
      return '<button type="button" class="' + (on ? 'on' : '') + '" data-act="go" data-page="' + t[0] + '"' + (on ? ' aria-current="page"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + IC[i] + '</svg>' + t[1] + '</button>';
    }).join('') + '</nav>';
  }
  /* 가운데 ＋ 를 누르면 뜨는 창(목업 B2). 고르면 「옷 확인」(B3)으로 */
  function plusHtml() {
    if (!ui.plus) return '';
    return '<div class="dim" data-act="plusClose"></div><div class="pop" role="dialog" aria-label="옷 사진 넣기"><h2>옷 사진 넣기</h2><p class="p">옷 사진이나 쇼핑 화면 캡처를 넣으면 종류·이름·가격·사이즈 표를 읽어요</p>' +
      '<button type="button" class="pick" data-act="addPick" data-v="album">' + SVG.alb + '앨범에서 고르기<small>캡처·저장한 사진</small></button>' +
      '<button type="button" class="pick" data-act="addPick" data-v="camera">' + SVG.cam + '카메라로 찍기<small>가진 옷</small></button>' +
      '<button type="button" class="pick" data-act="addPick" data-v="paste">' + SVG.pst + '붙여넣기<small>복사한 그림</small></button></div>';
  }
  function subTop(title) { return '<header class="top"><button type="button" class="back" data-act="go" data-page="me">‹ 내 정보</button><h1 class="mid">' + title + '</h1><span class="sp"></span></header>'; }

  /* ---------- 첫 화면 · 로그인 · 회원가입 (목업 v5 E1~E5: 영상이 화면 전체, 누르면 가운데 창) ---------- */
  var HERO_V = 'assets/hero_v4_5cut.mp4', HERO_P = 'assets/hero_v4_5cut_poster.jpg';
  function heroHtml() {
    return '<div class="hero"><video id="hv" poster="' + HERO_P + '" autoplay muted loop playsinline preload="auto" aria-label="옷 5벌을 차례로 입어 보는 예시 영상"><source src="' + HERO_V + '" type="video/mp4"></video><div class="shade"></div><div class="dimv" id="hdim" hidden></div></div>' +
      '<header class="top htop"><div class="logo big">FIT<i>ON</i></div></header>' +
      '<div class="cut" id="hcut" aria-hidden="true" hidden><i></i><i></i><i></i><i></i><i></i></div>' +
      '<div class="hfoot" id="hfoot"><h1 class="h"><em>내 몸에 먼저 입혀 보세요</em></h1><div class="row"><button type="button" class="btn ghost" data-act="auOpen" data-v="login">로그인</button><button type="button" class="btn" data-act="auOpen" data-v="signup">회원가입</button></div><a class="lk" href="privacy.html">개인정보 처리방침</a></div>' +
      '<div class="auwrap" id="auwrap" hidden></div>';
  }
  /* 영상: 소리 없이 자동·반복. 재생이 시작되면 오른쪽 위 점 5개(지금 몇 번째 옷)를 보인다. 영상이 안 뜨면 같은 장면 사진(poster)이 그대로 보이고 점은 숨긴 채로 둔다 */
  function heroStart() {
    var v = document.getElementById('hv'), c = document.getElementById('hcut'); if (!v || !c) return;
    v.muted = true; v.defaultMuted = true;
    v.addEventListener('playing', function () { c.hidden = false; });
    v.addEventListener('timeupdate', function () {
      var d = v.duration || 10, n = Math.min(4, Math.floor(v.currentTime / (d / 5)));
      Array.prototype.forEach.call(c.children, function (i, k) { i.className = k === n ? 'on' : ''; });
    });
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }
  function pwRow(id, label, ac) {
    return '<label for="' + id + '">' + label + '<span class="in"><input type="password" id="' + id + '" autocomplete="' + ac + '" maxlength="72"><button type="button" class="see" data-act="auSee" data-for="' + id + '" aria-pressed="false" aria-label="' + label + ' 보기">보기</button></span></label>';
  }
  var AU_TITLE = { login: '로그인', signup: '회원가입', reset: '비밀번호 다시 정하기', sent: '메일을 보냈어요', newpw: '새 비밀번호' };
  function authCard() {
    var a = ui.au, m = a.mode;
    var head = '<div class="auh"><h2>' + AU_TITLE[m] + '</h2><button type="button" class="x" data-act="auClose" aria-label="닫기">✕</button></div>';
    var mail = '<label for="auemail">이메일<span class="in"><input type="email" id="auemail" inputmode="email" autocomplete="' + (m === 'signup' ? 'email' : 'username') + '" autocapitalize="off" spellcheck="false" placeholder="name@example.com" maxlength="120" value="' + h(a.email) + '"></span></label>';
    var err = '<div class="err" id="auerr" role="alert">' + h(a.err) + '</div>';
    var sw = function (to, q, t) { return '<button type="button" class="lk" data-act="auOpen" data-v="' + to + '">' + q + '<b>' + t + '</b></button>'; };
    if (m === 'signup') return head + mail + pwRow('aupw', '비밀번호 (8자 이상)', 'new-password') + pwRow('aupw2', '비밀번호 한 번 더', 'new-password') +
      '<label class="chk"><input type="checkbox" id="auagree"' + (a.agree ? ' checked' : '') + '><i aria-hidden="true">✓</i><span><a href="privacy.html" target="_blank" rel="noopener">개인정보 처리방침</a>에 동의해요 (꼭)</span></label>' + err +
      '<button type="button" class="btn" id="aubtn" data-act="auSignup">가입하고 시작하기</button>' + sw('login', '이미 회원이신가요?', '로그인');
    if (m === 'reset') return head + '<p class="p">가입한 이메일로 비밀번호를 다시 정하는 링크를 보내 드려요.</p>' + mail + err +
      '<button type="button" class="btn" id="aubtn" data-act="auReset">메일 보내기</button>' + sw('login', '비밀번호가 생각났나요?', '로그인');
    if (m === 'sent') return head + '<p class="p">' + h(a.note) + '</p><button type="button" class="btn" data-act="auOpen" data-v="login">로그인으로</button>';
    if (m === 'newpw') return head + '<p class="p">새로 쓸 비밀번호를 넣어 주세요.</p>' + pwRow('aupw', '새 비밀번호 (8자 이상)', 'new-password') + pwRow('aupw2', '새 비밀번호 한 번 더', 'new-password') + err +
      '<button type="button" class="btn" id="aubtn" data-act="auNewPw">비밀번호 바꾸기</button>';
    return head + mail + pwRow('aupw', '비밀번호', 'current-password') + err +
      '<button type="button" class="btn" id="aubtn" data-act="auLogin">로그인</button>' + sw('reset', '비밀번호를 잊으셨나요?', '다시 정하기') + sw('signup', '처음이신가요?', '회원가입');
  }
  /* 자판이 올라오면 창을 자판 위 남은 자리로 옮긴다(보이는 화면 크기 = visualViewport) */
  function vvFit() {
    var w = document.getElementById('auwrap'), vv = window.visualViewport; if (!w || !vv) return;
    var r = app.getBoundingClientRect();
    w.style.top = Math.max(0, Math.round(vv.offsetTop - r.top)) + 'px'; w.style.height = Math.round(vv.height) + 'px';
    w.classList.toggle('up', vv.height < 560);
  }
  if (window.visualViewport) { window.visualViewport.addEventListener('resize', vvFit); window.visualViewport.addEventListener('scroll', vvFit); }
  /* 영상이 처음부터 다시 돌지 않게 영상 부분은 한 번만 그리고 가운데 창만 바꾼다 */
  function renderAuth() {
    var w = document.getElementById('auwrap');
    if (!w) { app.innerHTML = heroHtml(); w = document.getElementById('auwrap'); heroStart(); }
    var on = !!ui.au.mode;
    document.getElementById('hdim').hidden = !on; document.getElementById('hfoot').hidden = on; document.getElementById('hcut').style.visibility = on ? 'hidden' : '';
    w.hidden = !on; w.innerHTML = on ? '<div class="aucard" role="dialog" aria-modal="true" aria-label="' + AU_TITLE[ui.au.mode] + '">' + authCard() + '</div>' : '';
    vvFit();
  }
  function auErr(msg, id) {
    ui.au.err = msg; var e = document.getElementById('auerr'); if (e) e.textContent = msg;
    Array.prototype.forEach.call(app.querySelectorAll('.aucard .in'), function (x) { x.classList.remove('bad'); });
    var f = id && document.getElementById(id); if (f) { var box = f.closest('.in'); if (box) box.classList.add('bad'); if (f.focus) f.focus(); }
    return false;
  }
  function auBusy(on) { ui.au.busy = on; var b = document.getElementById('aubtn'); if (b) { if (on) { b.dataset.t = b.textContent; b.textContent = '잠시만요…'; b.disabled = true; } else { b.textContent = b.dataset.t || b.textContent; b.disabled = false; } } }
  var MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function auMail() { var em = val('auemail').trim(); ui.au.email = em; if (!em) return auErr('이메일을 넣어 주세요', 'auemail'); if (!MAIL_RE.test(em)) return auErr('이메일 주소를 확인해 주세요', 'auemail'); return em; }
  function auNewPass() {
    var pw = val('aupw'), pw2 = val('aupw2');
    if (pw.length < 8) return auErr('비밀번호는 8자 이상으로 정해 주세요', 'aupw');
    if (pw !== pw2) return auErr('비밀번호 두 칸이 서로 달라요', 'aupw2');
    return pw;
  }

  /* ---------- 이 기기에 있던 프로필(닉네임+PIN) 자료 가져오기 — 가입·첫 로그인 때 한 번. 원래 프로필은 지우지 않는다 ---------- */
  function viewImport() {
    var lg = ui.lg;
    if (ui.imp === 'pin') {
      var u = Core.userById(lg.id);
      return '<header class="top"><button type="button" class="back" data-act="impBack">‹ 뒤로</button></header><main class="body"><h1 class="h s">PIN 입력</h1><div class="who2">' + (u ? dot(u) + '<b>' + h(u.nick) + '</b>' : '') + '</div>' +
        '<div class="one"><label for="lgpin">PIN 4자리<span class="in"><input type="password" id="lgpin" inputmode="numeric" maxlength="4" autocomplete="off" autofocus></span></label></div>' +
        '<p class="p">그 프로필을 만들 때 정한 PIN이에요. 5번 틀리면 30초 동안 잠깁니다.</p><div class="err" id="lgerr" role="alert">' + h(lg.err) + '</div></main>' +
        '<div class="foot"><button type="button" class="btn" data-act="impGo">가져오기</button></div>';
    }
    return '<header class="top">' + LOGO + '</header><main class="body"><h1 class="h s">이 기기에 있던 자료를 가져올까요?</h1><p class="p">이 브라우저에 저장된 프로필이 있어요. 고르면 그 프로필의 치수·아바타·옷장·기록을 내 계정에 옮겨 담아요. 원래 프로필은 그대로 남아요.</p><div class="ulist">' +
      Core.readUsers().map(function (u) { return '<button type="button" class="ubtn" data-act="impPick" data-id="' + h(u.id) + '">' + dot(u) + h(u.nick) + '</button>'; }).join('') + '</div></main>' +
      '<div class="foot"><button type="button" class="btn ghost" data-act="impSkip">가져오지 않고 새로 시작</button></div>';
  }

  /* 내 치수 입력 칸. pc.js 2192~2195행(viewBody 내 치수)과 같은 항목·같은 id(#h·#w·data-mf)·같은 구조(label > 이름 + span.in > input + small 단위)라 저장(bSave)을 그대로 쓴다 */
  function bodyForm() {
    var p = state.profile, m = p.m || {};
    return '<div class="seg" role="group" aria-label="성별"><button type="button" class="' + (p.gender !== 'male' ? 'on' : '') + '" aria-pressed="' + (p.gender !== 'male') + '" data-act="bGender" data-v="female">여성</button><button type="button" class="' + (p.gender === 'male' ? 'on' : '') + '" aria-pressed="' + (p.gender === 'male') + '" data-act="bGender" data-v="male">남성</button></div>' +
      '<div class="two"><label for="h">키<span class="in"><input id="h" type="number" inputmode="decimal" value="' + h(p.height) + '"><small>cm</small></span></label><label for="w">몸무게<span class="in"><input id="w" type="number" inputmode="decimal" value="' + h(p.weight) + '"><small>kg</small></span></label></div>' +
      '<div class="sec"><h2 style="font-size:16px">자세한 치수</h2></div><div class="callout">모르는 칸은 비우면 키·몸무게로 추정해요.</div><div class="two">' +
      MFIELDS.map(function (f, i) { return '<label for="m' + i + '">' + f[1] + '<span class="in"><input id="m' + i + '" type="number" inputmode="decimal" step="0.1" data-mf="' + f[0] + '" placeholder="자동" value="' + h(m[f[0]] == null ? '' : m[f[0]]) + '"><small>' + f[2] + '</small></span></label>'; }).join('') + '</div>';
  }
  function prefSeg() {
    var pref = state.profile.pref || 'fit';
    return '<div class="seg" role="group" aria-label="선호 핏">' + PREFS.map(function (x) { var o = pref === x[0]; return '<button type="button" class="' + (o ? 'on' : '') + '" aria-pressed="' + o + '" data-act="fitStyle" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
  }
  var PREF_SAY = '사이즈 추천과 핏 판정에만 반영돼요. 입힌 그림은 바뀌지 않습니다.';
  /* 목업 v5 E6(= v3 A2): 가입한 바로 뒤 한 번 */
  function viewOnbBody() {
    return '<header class="top"><span class="logo">FIT<i>ON</i></span><span class="pill st">1 / 2</span></header><main class="body"><div class="steps" aria-hidden="true"><i class="on"></i><i></i></div><h1 class="h s">내 치수를 알려 주세요</h1>' +
      bodyForm() + '<div class="sec"><h2 style="font-size:16px">선호 핏</h2></div><p class="p">' + PREF_SAY + '</p>' + prefSeg() + '</main>' +
      '<div class="foot"><button type="button" class="btn" data-act="onbNext">다음</button></div>';
  }
  function modelsHtml(curId, act) {
    return '<div class="models">' + BASES.map(function (x) { var on = x.id === curId; return '<button type="button" class="' + (on ? 'on' : '') + '" aria-pressed="' + on + '" data-act="' + act + '" data-id="' + x.id + '" aria-label="' + x.name + ' 기본 모델 고르기"><img src="' + h(x.img) + '" alt="" loading="lazy" class="' + (x.preset ? 'ct' : '') + '"><span>' + x.name + (on ? ' ✓' : '') + '</span></button>'; }).join('') + '</div>';
  }
  /* 목업 A3 */
  function viewOnbModel() {
    var cur = ui.onbBase || baseModel().id;
    return '<header class="top"><button type="button" class="back" data-act="onbBack">‹ 이전</button><span class="pill st">2 / 2</span></header><main class="body"><div class="steps" aria-hidden="true"><i class="on"></i><i class="on"></i></div><h1 class="h s">누구에게 입혀 볼까요?</h1>' +
      '<div class="card col"><b style="font-size:16px">내 아바타</b><p class="p">방금 넣은 내 치수로 입어봐요. 아바타 사진이 없으면 기본 캐릭터 사진에 내 치수로 입혀 드려요.</p><div class="row"><button type="button" class="btn ghost sm" data-act="soon">아바타 만들기</button><button type="button" class="btn sm" data-act="onbMe">내 치수로 시작</button></div></div>' +
      '<div class="sec"><h2 style="font-size:16px">기본 모델로 시작</h2><span>나중에 바꿀 수 있어요</span></div><p class="p">기본 모델은 그 모델의 치수로 입어봐요. 내 아바타와 내 치수는 바뀌지 않아요.</p>' + modelsHtml(cur, 'onbPick') + '</main>' +
      '<div class="foot"><button type="button" class="btn ghost" data-act="onbStart" data-id="' + h(cur) + '">이 모델로 시작</button></div>';
  }

  /* ---------- 홈 (목업 B1·C1: 전신이 다 보이는 사진 칸 + 아래 서랍) ---------- */
  var POS_BG = { 'p-top': ';background-position:50% 28%', 'p-low': ';background-position:50% 72%', 'p-foot': ';background-position:50% 100%', 'p-mid': ';background-position:50% 45%' }; /* 옷 칸 사진 위치: 옷장 카드(posOf)와 같은 값 */
  function viewHome() {
    var w = who(), pic = avatarShow(), n = state.closet.length;
    var leftSay = unlimited() ? '이번 달 남은 횟수 제한 없음(시험 중)' : '이번 달 남은 횟수 ' + planNow().limit + '회 중 ' + tryLeft() + '회'; /* pc.js 1577행과 같은 문구 */
    var sheet = n ? '<div class="slots">' + ['outer', 'top', 'bottom', 'shoe'].map(function (c) {
        var it = got(c);
        return it && it.photo ? '<button type="button" class="slot has" data-act="soon" style="' + bgUrl(it.photo) + (POS_BG[posOf(it)] || '') + '" aria-label="' + CATS[c] + ' ' + h(it.name) + '"><span>' + CATS[c] + '</span></button>' : '<button type="button" class="slot' + (it ? ' has' : '') + '" data-act="soon" aria-label="' + CATS[c] + (it ? ' ' + h(it.name) : ' 고르기') + '">' + (it ? '' : '＋') + '<span>' + CATS[c] + '</span></button>';
      }).join('') + '</div><button type="button" class="btn" data-act="soon">입어보기</button>'
      : '<p class="big">입어볼 옷을 먼저 넣어 주세요</p><p class="p">쇼핑 화면 캡처나 옷 사진 1장이면 돼요</p><button type="button" class="btn" data-act="plus">＋ 옷 사진 넣기</button>';
    return '<header class="top">' + LOGO + '<div class="pills"><button type="button" class="pill who" data-act="go" data-page="me" aria-label="지금 입어보는 쪽 ' + (w === 'base' ? '기본 모델 ' + h(baseModel().name) : '내 아바타') + ', 바꾸기">' + (w === 'base' ? '기본 모델' : '내 아바타') + ' ▾</button>' +
      '<button type="button" class="pill" data-act="go" data-page="plan" aria-label="' + leftSay + ', 요금제 보기">남은 <b>' + leftText() + '</b></button></div></header>' +
      '<div class="stage"><div class="bg" style="' + bgUrl(pic) + '"></div><div class="ph" role="img" aria-label="' + (w === 'base' ? h(baseModel().name) + ' 기본 모델' : '내 아바타') + ' 전신" style="' + bgUrl(pic) + '"></div><button type="button" class="zoombtn" data-act="homeZoom">⤢ 크게 보기</button></div>' +
      '<div class="sheet"><div class="grab" aria-hidden="true"></div>' + sheet + '</div>' + plusHtml() + tabsHtml();
  }

  /* ---------- 옷장 (보기만. 목업 D1: 종류 탭 + 2줄 카드. 종류는 PC 와 같은 CAT_ORDER) ---------- */
  function viewCloset() {
    var cat = ui.closetCat, list = state.closet.filter(function (x) { return x.cat === cat; }), total = state.closet.length;
    var chips = '<div class="chips" role="tablist" aria-label="옷 종류">' + CAT_ORDER.map(function (c) {
      var k = state.closet.filter(function (x) { return x.cat === c; }).length;
      return '<button type="button" role="tab" aria-selected="' + (cat === c) + '" class="chip' + (cat === c ? ' on' : '') + '" data-act="closetCat" data-cat="' + c + '">' + CATS[c] + (k ? '<small>' + k + '</small>' : '') + '</button>';
    }).join('') + '</div>';
    var cards = list.length ? '<div class="grid">' + list.map(function (it) {
      /* pc.js 2085~2086행(옷 카드 아랫줄)과 같은 계산: 고른 옷이면 고른 사이즈, 아니면 추천 사이즈 · 등급. 계산이 안 되면 사이즈 이름들 */
      var s = state.sel[cat], on = !!(s && s.id === it.id), r = evalOne(it, on ? s.size : null), g = r && r.current && r.current.primary, sub = r && r.chosen ? (on ? '' : '추천 ') + r.chosen + (g ? ' · ' + g.grade : '') : (it.sizes || []).map(function (z) { return z.label; }).join(' ');
      if (it.cat === 'shoe' && E.num(it.heel)) sub += (sub ? ' · ' : '') + '굽 ' + it.heel + 'mm';
      var pr = priceText(it.price);
      return '<div class="g' + (on ? ' sel' : '') + '"><div class="im">' + (it.photo ? '<img src="' + h(it.photo) + '" alt="" loading="lazy" class="' + posOf(it) + '">' : '<span aria-hidden="true">' + SHIRT + '</span>') + (on ? '<span class="tag">고름</span>' : '') + (it.kind && KIND_NAME[it.kind] ? '<span class="tag r">' + KIND_NAME[it.kind] + '</span>' : '') + '</div><p>' + h(it.name) + '</p><small>' + h(sub) + (pr ? (sub ? ' · ' : '') + pr : '') + '</small></div>';
    }).join('') + '</div>'
      : '<div class="empty"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC[1] + '</svg><b>' + (total ? CATS[cat] + '이(가) 아직 없어요' : '옷장이 비어 있어요') + '</b><span>옷은 아래 가운데 ＋ 로 넣어요.</span></div>';
    return '<header class="top"><h1>내 옷장</h1><span class="pill st">옷 ' + total + '벌</span></header><main class="body">' + chips + cards + '</main>' + plusHtml() + tabsHtml();
  }

  /* ---------- 입어본 기록 (보기만. 목업 D2·D3. 저장된 기록에는 날짜가 없어 날짜로 묶지 않는다) ---------- */
  function histInfo(e) {
    return '<h2>입은 옷 ' + e.items.length + '벌</h2>' + e.items.slice().sort(function (a, b) { return CAT_ORDER.indexOf(a.cat) - CAT_ORDER.indexOf(b.cat); }).map(function (i) {
      var lb = lookSizeOf(e.key, i);
      return '<div class="hit"><small>' + h(CATS[i.cat] || '') + (lb ? ' · ' + h(lb) + ' 사이즈' : '') + '</small><b>' + h(shortName(i)) + '</b></div>';
    }).join('');
  }
  function viewHistory() {
    var list = histList();
    var inner = !ui.mediaReady ? '<div class="empty"><span>불러오는 중…</span></div>' : list.length ? '<p class="p">옷이나 옷 조합마다 마지막으로 입힌 모습 한 장이 저장돼요.</p><div class="grid">' + list.map(function (e, i) {
      var title = e.items.map(shortLabel).join(' + '), sz = e.items.map(function (x) { return lookSizeOf(e.key, x); }).filter(Boolean).join(' · ');
      return '<button type="button" class="g hist" data-act="histOpen" data-i="' + i + '" aria-label="' + h(title) + ' 크게 보기"><div class="im"><img src="' + urls.tryon[e.key] + '" alt="" loading="lazy"></div><p>' + h(lookName(e.key)) + '</p><small>' + (sz ? h(sz) + ' 사이즈' : '입은 옷 ' + e.items.length + '벌') + '</small></button>';
    }).join('') + '</div>'
      : '<div class="empty"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC[3] + '</svg><b>아직 입어본 기록이 없어요</b><span>옷을 입어 보면 여기에 쌓여요.</span></div>';
    return '<header class="top"><h1>입어본 기록</h1><span class="pill st">전체 ' + (ui.mediaReady ? list.length : 0) + '</span></header><main class="body">' + inner + '</main>' + plusHtml() + tabsHtml();
  }

  /* ---------- 내 정보 (목업 D4. PC 「내 몸 정보」의 두 탭 + 요금제·설정 입구) ---------- */
  function kvHtml(rows) { return '<div class="kv">' + rows.map(function (r) { var v = r[1] == null ? '' : String(r[1]); return '<div>' + r[0] + (v === '' ? '<b class="auto">자동</b>' : '<b>' + h(v) + (r[2] ? '<small>' + r[2] + '</small>' : '') + '</b>') + '</div>'; }).join('') + '</div>'; }
  function viewMe() {
    var p = state.profile, m = p.m || {}, w = who(), tab = ui.bodyTab === 'base' || ui.bodyTab === 'me' ? ui.bodyTab : w, b = baseModel(), body;
    if (ui.meEdit) {
      return '<header class="top"><button type="button" class="back" data-act="meEditOff">‹ 내 정보</button><h1 class="mid">내 치수</h1><span class="sp"></span></header><main class="body">' + bodyForm() + '</main>' +
        '<div class="foot"><button type="button" class="btn" data-act="meSave">저장</button></div>';
    }
    var seg = '<div class="seg" role="group" aria-label="캐릭터 종류">' + [['base', '기본 모델'], ['me', '내 아바타']].map(function (t) { return '<button type="button" class="' + (tab === t[0] ? 'on' : '') + '" aria-pressed="' + (tab === t[0]) + '" data-act="bTab" data-v="' + t[0] + '">' + t[1] + (w === t[0] ? ' · 사용 중' : '') + '</button>'; }).join('') + '</div>';
    if (tab === 'base') {
      body = '<div class="card me"><div class="im"><img src="' + h(b.img) + '" alt="' + h(b.name) + ' 앞모습 전신" class="' + (b.preset ? 'ct' : '') + '"></div><div class="tx"><b>' + h(b.name) + '</b><small>읽기 전용 · ' + (b.ang ? '키 ' + b.h + 'cm·몸무게 ' + b.w + 'kg 기준' : '한국 ' + (b.preset ? h(b.name.replace(/(남성|여성)$/, ' $1')) : '20대 ' + (b.g === 'male' ? '남성' : '여성')) + ' 평균') + ' 가정치</small></div></div>' + /* 문구는 pc.js 2180행 */
        '<p class="p">아래에서 모델을 누르면 그 모델로 입어봐요. 내 아바타와 내 치수는 바뀌지 않아요.</p>' + modelsHtml(b.id, 'bPreset') +
        '<div class="sec"><h2 style="font-size:16px">' + h(b.name) + ' 치수</h2></div>' + kvHtml([['성별', b.g === 'male' ? '남성' : '여성'], ['키', b.h, 'cm'], ['몸무게', b.w, 'kg']].concat(MFIELDS.map(function (f, i) { return [f[1], b.m[i], f[2]]; }))) +
        '<div class="callout">내 사이즈는 「내 아바타」에서 내 치수로 봐요.</div>';
    } else {
      body = '<div class="card me"><div class="im"><img src="' + h(urls.avatar || (p.gender === 'male' ? 'assets/avatar_male.jpg?v=t' : 'assets/avatar_default.jpg?v=t')) + '" alt="' + (urls.avatar ? '내 아바타 앞모습' : '기본 캐릭터 전신') + '"></div><div class="tx"><b>내 아바타</b><small>' + (urls.avatar ? '앞모습은 직접 올린 내 아바타 사진이에요.' : '아바타 사진이 없어요. 기본 캐릭터 사진에 내 치수로 입혀 드려요.') + '</small><button type="button" class="btn sm" data-act="soon">아바타 만들기</button></div></div>' +
        '<div class="sec"><h2 style="font-size:16px">내 치수</h2><button type="button" data-act="meEditOn">고치기 ›</button></div>' +
        kvHtml([['성별', p.gender === 'male' ? '남성' : '여성'], ['키', p.height, 'cm'], ['몸무게', p.weight, 'kg']].concat(MFIELDS.map(function (f) { return [f[1], m[f[0]], f[2]]; }))) +
        '<div class="callout">모르는 칸은 비우면 키·몸무게로 추정해요.</div>';
    }
    return '<header class="top"><h1>내 정보</h1><span class="pill st">' + h(planNow().name) + ' 플랜</span></header><main class="body">' + seg + body +
      '<div class="list"><button type="button" data-act="go" data-page="plan">요금제 <span>' + h(planNow().name) + ' · 남은 ' + leftText() + ' ›</span></button><button type="button" data-act="go" data-page="set">설정 <span>계정 · 선호 핏 ›</span></button><a href="privacy.html">개인정보 처리방침 <span>›</span></a></div></main>' + plusHtml() + tabsHtml();
  }

  /* ---------- 요금제 (pc.js 2207~2217행 viewPlan 과 같은 내용·같은 문구를 세로 카드로) ---------- */
  function viewPlan() {
    var s = subNow();
    return subTop('요금제') + '<main class="body"><div class="card size"><div class="L">' + leftText() + '</div><div><p>이번 달 남은 횟수' + (unlimited() ? ' · 제한 없음(시험 중)' : '') + '</p><small>지금은 ' + h(planNow().name) + ' 플랜</small></div></div>' +
      '<p class="p">결제 연결 전이에요. 플랜 선택은 이 기기 안에서만 적용됩니다. 가격은 예정 값입니다.' + (unlimited() ? ' 지금은 시험 중이라 횟수 제한 없이 쓸 수 있어요. 아래 플랜별 횟수는 정식 서비스 때 적용돼요.' : '') + '</p>' +
      Object.keys(FD.plans).map(function (k) {
        var p = FD.plans[k], on = k === s.plan;
        return '<section class="card col plan' + (on ? ' on' : '') + '" aria-label="' + h(p.name) + '"><div class="sec"><h2 style="font-size:16px">' + h(p.name) + '</h2>' + (on ? '<span class="onmark">사용 중</span>' : '') + '</div><div class="plprice">' + h(p.price) + '</div>' +
          '<div class="pllimit"><b>' + h(p.limit) + '</b><span>회 / 월 입어보기</span></div><ul>' + (p.features || []).map(function (f) { return '<li>' + CHECK + '<span>' + h(f) + '</span></li>'; }).join('') + '</ul>' +
          '<button type="button" class="btn sm' + (on ? ' off' : '') + '" aria-pressed="' + on + '" data-act="planPick" data-plan="' + h(k) + '">' + (on ? '이 플랜 쓰는 중' : '이 플랜 선택') + '</button></section>';
      }).join('') + '</main>' + plusHtml() + tabsHtml();
  }

  /* ---------- 설정 (pc.js 2224~2231행 viewSettings 와 같은 항목. 화면 색(스킨)은 모바일에 아직 없음) ---------- */
  function viewSettings() {
    return subTop('설정') + '<main class="body"><section class="card col" aria-label="계정"><div class="sec"><h2 style="font-size:16px">계정</h2></div><div class="me"><div class="im" style="width:56px;height:75px"><img src="' + h(avatarShow()) + '" alt=""></div><div class="tx"><b class="el">' + h(user.email || user.nick) + '</b><small>' + (Sync.pending() ? '아직 서버에 올리지 못한 내용이 있어요. 인터넷에 연결되면 올려요.' : '로그인한 계정 · 서버에 저장됨') + '</small></div></div>' +
      '<div class="row"><button type="button" class="btn ghost sm" data-act="go" data-page="me">내 몸 정보 고치기</button><button type="button" class="btn ghost sm" data-act="logout">로그아웃</button></div></section>' +
      '<section class="card col" aria-label="선호 핏"><div class="sec"><h2 style="font-size:16px">선호 핏</h2></div><p class="p">' + PREF_SAY + '</p>' + prefSeg() + '</section>' +
      '<section class="card col" aria-label="요금제"><div class="size"><div class="L">' + leftText() + '</div><div><p>이번 달 남은 횟수' + (unlimited() ? ' · 제한 없음(시험 중)' : '') + '</p><small>지금은 ' + h(planNow().name) + ' 플랜</small></div></div><button type="button" class="btn ghost sm" data-act="go" data-page="plan">요금제 보기</button></section></main>' + plusHtml() + tabsHtml();
  }

  /* ---------- 옷 넣기 · 옷 확인 (목업 v3 B2·B3). 읽기·표·저장은 PC 옷장 입력 칸 코드 그대로 ---------- */
  /* ▼ pc.js 1997~2051행 그대로 */
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
      /* 2026-11-19 최종 검토 8차(블라인드C 4): ✕ 만 있어 뜻이 불분명 → 「✕ 삭제」, 주황 「계산 안 씀」 → 「핏 계산 제외」 + 마우스 설명 */
      return '<th scope="col"><button type="button" class="thx" data-act="colDel" data-i="' + ci + '" aria-label="' + h(x) + ' 항목 삭제" title="이 항목(열)을 표에서 지워요">✕ 삭제</button><textarea rows="2" autocomplete="off" spellcheck="false" id="th' + ci + '" data-th="' + ci + '" title="' + h(x) + '" aria-label="항목 이름">' + h(x) + '</textarea><small class="tu" id="tu' + ci + '" title="' + TU_TIP + '">' + (t.keys[ci] || !String(x).trim() ? '' : TU_TXT) + '</small></th>';
    }).join('') + '<th></th></tr></thead><tbody>' +
      t.rows.map(function (r, i) { return '<tr><td><input type="text" id="sl' + i + '" data-sl="' + i + '" value="' + h(r[0]) + '" aria-label="사이즈 이름"></td>' + t.head.map(function (x, ci) { return '<td><input type="text" inputmode="decimal" autocomplete="off" id="sf' + i + '_' + ci + '" data-sf="' + i + ':' + ci + '" value="' + h(r[ci + 1] == null ? '' : r[ci + 1]) + '" aria-label="' + h(r[0] + ' ' + x) + '"></td>'; }).join('') + '<td><button type="button" class="rm" style="min-width:32px;min-height:32px;padding:0" data-act="sizeDel" data-i="' + i + '" aria-label="사이즈 삭제">✕</button></td></tr>'; }).join('') +
      '</tbody></table></div><div class="lkacts" style="justify-content:flex-start"><button type="button" class="lk" data-act="sizeAdd">+ 사이즈 추가</button><button type="button" class="lk" data-act="colAdd">+ 항목 추가</button></div>' +
      '<p class="hint" style="font-size:13px">항목 이름과 숫자는 사이즈표에 적힌 그대로 넣어요. 항목 이름 아래 주황색 「' + TU_TXT + '」는 이름이 가슴·허리·총장 같은 계산용 치수와 맞지 않아 표에만 남고 핏 계산에는 쓰지 않는다는 뜻이에요(이름을 고치면 계산에 쓸 수 있어요). 이름 위 「✕ 삭제」는 그 항목을 표에서 지워요.</p>';
  }
  var TU_TXT = '핏 계산 제외', TU_TIP = '이 항목 이름은 핏 계산에 쓰는 치수(가슴·허리·총장 등)와 맞지 않아 표에만 남아요. 이름을 고치면 계산에 쓸 수 있어요.';
  /* 항목 이름을 고쳤을 때: 그 이름으로 핏 계산에 쓸 칸을 다시 찾는다(같은 칸이면 AI 가 정한 환산은 그대로) */
  function headKey(ci) {
    var f = ui.cf, t = f.table; if (!t || t.head[ci] == null) return;
    var taken = {}; t.keys.forEach(function (k, i) { if (k && i !== ci) taken[k] = 1; });
    if (!t.k0) { t.k0 = t.keys.slice(); t.c0 = t.conv.slice(); } /* 처음(AI 가 읽었을 때·저장돼 있던) 칸과 환산: 이름을 고쳤다가 같은 칸으로 돌아오면 그 환산을 다시 쓴다 */
    var r = FitNotes.tblResolve(t.head[ci], f.cat, f.measureType, taken, FIELDS[f.cat]);
    if (r) { t.conv[ci] = r.conv || (r.key === t.k0[ci] ? t.c0[ci] : null); t.keys[ci] = r.key; } else { t.keys[ci] = null; t.conv[ci] = null; }
    var e = document.getElementById('tu' + ci); if (e) e.textContent = t.keys[ci] || !String(t.head[ci]).trim() ? '' : TU_TXT;
    var b = document.getElementById('tbasis'); if (b) b.textContent = basisText(f);
  }
  /* ▲ */
  /* ▼ pc.js 2098~2102행 그대로 */
  function cfLoad(it) {
    ui.cf = Object.assign(blankForm(it.cat), JSON.parse(JSON.stringify(it)));
    ui.cf.table = it.cat !== 'shoe' && window.FitNotes && FitNotes.tblSync ? FitNotes.tblSync(it, FIELDS[it.cat]) : null;
    if (it.hasSize) blobGet('gsize:' + it.id).catch(function () { return null; }).then(function (b) { if (b && ui.cf && ui.cf.id === it.id && !ui.cf.sizeUrl) { ui.cf.sizeUrl = URL.createObjectURL(b); render(); } });
  }
  /* ▲ */
  /* ▼ pc.js 2473~2494행 그대로 */
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
  /* ▲ */
  /* ▼ pc.js 2515~2547행 그대로 */
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
  /* ▲ */
  /* ▼ pc.js 2548~2591행 그대로 */
  /* 2026-11-19 상품 화면 캡처 → 이름·가격. 글자 인식 결과의 잡글(아이콘·사진 부분)을 걸러 상품명 줄과 판매가를 고른다.
     sizeocr.js parseProduct 는 폰 앱(shorts.js)도 쓰므로 그대로 두고 PC 는 이것을 쓴다 */
  var PN_NOISE = /적립|쿠폰|배송|도착|만족|상품평|리뷰|후기|평점|별점|판매자|장바구니|구매|결제|혜택|색상|사이즈|수량|옵션|선택|할인|최대|무이자|할부|카드|문의|공유|알림|브랜드관|로켓|품절|원산지|제조|고객|로그인|검색|카테고리|더보기|보러가기|이상/;
  var PN_CLOTH = /청바지|데님|팬츠|바지|슬랙스|레깅스|조거|스커트|치마|원피스|드레스|코트|자켓|재킷|점퍼|패딩|다운|야상|블레이저|가디건|카디건|니트|스웨터|티셔츠|셔츠|남방|블라우스|맨투맨|후드|조끼|트레이닝|셋업|세트|운동화|스니커즈|구두|로퍼|부츠|샌들|슬리퍼|여성|남성|여자|남자|오버핏|와이드|스판|기모|반팔|긴팔/;
  function prodParse(text) {
    var segs = [];
    String(text || '').split(/\r?\n/).forEach(function (l, li) {
      l.split(/\s{3,}|\s[|¦]\s/).forEach(function (s) {
        s = s.replace(/^[^가-힣A-Za-z0-9\[(]+/, '').replace(/[^가-힣A-Za-z0-9\])]+$/, '').replace(/\s+/g, ' ').trim();
        if (s) segs.push({ s: s, li: li });
      });
    });
    /* 이름: 글자 비율이 높고 잡말(배송·적립 등)이 없는 조각. 옷 낱말이 있는 조각을 먼저, 그다음 길이·위쪽 순 */
    var best = null;
    segs.forEach(function (g) {
      var s = g.s, ns = s.replace(/\s+/g, ''), ko = (s.match(/[가-힣]/g) || []).length, lt = (s.match(/[가-힣A-Za-z]/g) || []).length;
      var cl = PN_CLOTH.test(s), nz = PN_NOISE.test(s); /* 상품명에도 「무료배송」「세트 할인」이 붙을 수 있어 옷 낱말이 있으면 점수만 깎는다 */
      if (ns.length < 6 || s.length > 90 || /[>›»]/.test(s) || (nz && !cl)) return;
      if (lt < ns.length * 0.6 || (ko < 4 && lt < 8)) return;
      var words = s.split(' ').filter(function (w) { return /[가-힣]{2,}|[A-Za-z]{3,}/.test(w); }).length;
      if (words < 2) return;
      var sc = lt + (cl ? 40 : 0) - (nz ? 30 : 0) + words * 2 - g.li * 0.3;
      if (!best || sc > best.sc) best = { s: s, sc: sc, cloth: cl };
    });
    var name = best && (best.cloth || best.sc >= 20) ? best.s.slice(0, 60) : '';
    /* 가격: ① 「할인율% 바로 뒤」 금액 ② 없으면 맨 위에서 처음 금액이 나오는 조각의 작은 값(판매가가 보통 맨 위·정가보다 작음).
       금액 = 천 단위 쉼표 숫자(큰 글씨의 「원」은 x·8 로 깨지기 쉬워 원이 없어도 받음) 또는 「원」이 붙은 4자리 이상 숫자.
       적립·쿠폰·할인액·배송비·회원가·카드 혜택 조각은 뺀다 */
    var pPct = null, pTop = null;
    segs.some(function (g) {
      var t = g.s.replace(/\s*([,.])\s*(?=\d)/g, '$1').replace(/(\d)\s+원/g, '$1원'), re = /(\d{1,3}(?:[,.]\d{3})+)|(\d{4,8})원/g, m, ns = [];
      if (/적립|쿠폰|캐시|포인트|할인|배송|도서산간|제주|이상|무이자|할부|개월|상품평|리뷰|만족|회원가|카드|결제|즉시|혜택|최대|명/.test(t)) return false;
      while ((m = re.exec(t))) {
        var n = Number((m[1] || m[2]).replace(/[,.]/g, ''));
        if (!(n >= 1000 && n <= 50000000)) continue;
        if (/%/.test(t.slice(0, m.index))) { pPct = n; return true; }
        ns.push(n);
      }
      if (ns.length && pTop == null) pTop = Math.min.apply(null, ns);
      return false;
    });
    var price = pPct != null ? pPct : pTop;
    return { name: name, price: price };
  }
  /* ▲ */
  /* ▼ pc.js 2607~2619행 그대로 */
  function closetPhoto(file) {
    var f = ui.cf;
    Promise.all([Core.shrink(file, 240, 0.8).then(Core.blobToDataUrl), Core.shrink(file, 1280, 0.88)]).then(function (a) { f.photo = a[0]; f.big = a[1]; f.saved = false; if (ui.cf === f) render(); }).catch(function (err) { f.err = (err && err.message) || '사진을 읽지 못했어요.'; render(); });
    if (!window.SizeOcr || (f.name && f.price)) return;
    f.photoMsg = '상품 이름·가격을 읽는 중입니다.';
    SizeOcr.recognize(file, function (s, p) { if (p != null && ui.cf === f) { f.photoMsg = '상품 이름·가격을 읽는 중… ' + Math.round(p * 100) + '%'; ocrMsg('photo', f.photoMsg); } }).then(function (text) {
      if (ui.cf !== f) return;
      var r = prodParse(text), ok = false;
      if (r.name && !f.name) { f.name = r.name; ok = true; }
      if (r.price != null && !f.price) { f.price = r.price.toLocaleString('ko-KR') + '원'; ok = true; }
      f.photoMsg = ok ? '이름·가격을 읽어 채웠어요. 맞는지 확인해 주세요.' : '이름·가격을 읽지 못했어요. 아래에 직접 넣어 주세요.'; render();
    }).catch(function () { if (ui.cf === f) { f.photoMsg = '이름·가격을 읽지 못했어요. 아래에 직접 넣어 주세요.'; render(); } });
  }
  /* ▲ */
  /* 옷 종류를 바꾸면 PC 와 같은 방법으로 사이즈 표를 새 종류에 맞춘다(pc.js 3029~3046행 = 옷 종류 고르는 칸의 처리. t 는 그 칸 대신) */
  function cfCatTo(v) {
    var c = 'cfCat', t = { value: v };
  /* ▼ pc.js 3029~3046행 그대로 */
    if (c === 'cfCat') {
      var f = ui.cf, was = f.cat === 'shoe', now = t.value === 'shoe';
      f.cat = t.value;
      if (f.kind && !kindsOf(f.cat).some(function (k) { return k[0] === f.kind; })) f.kind = '';
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
  /* ▲ */
  }
  /* 사이즈표를 읽는 사이에 종류가 바뀌면(이름으로 자동으로 고른 경우 등) 읽은 글을 지금 종류로 다시 푼다. 읽기 시작할 때의 종류 = readCat */
  var applyRead0 = applyRead, sizeCap0 = sizeCap;
  applyRead = function (f, r) {
    if (f.cat === 'shoe') { f.sizeMsg = ''; return; } /* 읽는 사이에 신발로 바뀜: 옷 사이즈표는 넣지 않는다(PC 도 신발은 AI 로 읽지 않음) */
    if (f.readCat && f.readCat !== f.cat && r && r.raw && FitNotes.fromText) {
      var r2 = null; try { r2 = FitNotes.fromText(r.raw, f.cat, prof().gender); } catch (e) { r2 = null; }
      if (!r2) { f.readCat = f.cat; applyRead0(f, r); if (f.table) f.table = FitNotes.tblRecat(f.table, f.cat, f.measureType, FIELDS[f.cat]); return; }
      r = r2;
    }
    f.readCat = f.cat; applyRead0(f, r);
  };
  sizeCap = function (file) { if (ui.cf) ui.cf.readCat = ui.cf.cat; sizeCap0(file); };

  /* 읽은 이름으로 옷 종류(탭) 고르기 — PC 에는 없음(PC 는 사람이 고름). 맞는 낱말이 없으면 '' (상의 그대로) */
  var BOTTOM_WORDS = /바지|팬츠|슬랙스|청바지|스커트|치마|레깅스|조거|반바지|쇼츠|숏팬츠|skirt|pants|jeans|trousers/i;
  function guessCat(name) {
    var t = String(name || ''), any = function (l, s) { return l.some(function (x) { return x[1].test(s == null ? t : s); }); };
    var ts = t.replace(/부츠\s?컷|boot\s?cut|힐링/gi, ' '); /* 「부츠컷 팬츠」「힐링」은 신발이 아님 */
    if (any(TYPE_GUESS.shoe, ts) || /신발|스니커즈|뮬/.test(ts)) return 'shoe';
    if (/원피스|점프수트|드레스|dress/i.test(t) && !/드레스\s?셔츠|dress\s?shirt/i.test(t)) return 'dress';
    if (OUTER_WORDS.test(t)) return 'outer';
    if (BOTTOM_WORDS.test(t)) return 'bottom';
    if (any(TYPE_GUESS.top)) return 'top';
    return '';
  }
  /* 사진 고르기: 앱 화면은 서버에서 사진을 받을 때 등 자주 다시 그려져, 그 안의 파일 칸은 고르는 사이에 없어질 수 있다. 그래서 #app 밖의 칸 하나를 누를 때 연다 */
  var picker = document.createElement('input');
  picker.type = 'file'; picker.accept = 'image/*'; picker.hidden = true; picker.id = 'mpick'; picker.tabIndex = -1; picker.setAttribute('aria-hidden', 'true');
  document.body.appendChild(picker);
  picker.addEventListener('change', function () { var fl = picker.files && picker.files[0], k = picker.dataset.kind; picker.value = ''; if (fl) takeFile(fl, k); });
  function pickFile(kind, camera) { picker.dataset.kind = kind; if (camera) picker.setAttribute('capture', 'environment'); else picker.removeAttribute('capture'); picker.value = ''; picker.click(); }
  /* kind: add = 새 옷 사진(옷 확인 열기) · photo = 옷 확인의 사진 바꾸기 · size = 사이즈 표 사진 */
  function takeFile(file, kind) {
    if (!user || !state || !file) return;
    if (!/^image\//.test(file.type)) { toast('그림 파일만 넣을 수 있어요.', 3000); return; }
    if (kind === 'size') { if (ui.cf) sizeCap(file); return; }
    if (kind === 'photo') { if (ui.cf) closetPhoto(file); return; }
    addStart(file);
  }
  var SIZE_ASK = '사이즈 표가 보이는 캡처를 넣으면 숫자를 읽어요. 없으면 「직접 고치기」로 넣어 주세요.';
  function addStart(file) {
    ui.plus = false; closeViewer();
    var f = ui.cf = blankForm('top'); f.catAuto = true; f.catHit = false; f.tOpen = false;
    if (location.hash !== '#add') location.hash = '#add';
    render();
    closetPhoto(file); firstSize(file, f);
  }
  /* 처음 넣은 사진(쇼핑 화면 캡처)에 사이즈 표도 보이면 AI 로 읽는다(목업 B2 「사이즈 표를 읽어요」). 표가 없으면 안내만 —
     글자 읽기 예비 방법은 쓰지 않는다(이름·가격 글자 읽기와 겹쳐 오래 걸림). 이 사진은 사이즈표 이미지로 저장하지 않는다 */
  function firstSize(file, f) {
    if (!window.FitNotes || !FitNotes.enabled()) { f.sizeMsg = SIZE_ASK; render(); return; }
    var READING = '사진에 사이즈 표가 있는지 읽는 중…';
    f.readCat = f.cat; f.sizeMsg = READING; render();
    /* 그사이 표를 고쳤거나 사이즈표 사진을 따로 넣었으면 읽은 것은 넣지 않는다(이 읽기의 「읽는 중」 글만 지움) */
    var skip = function () { if (ui.cf !== f) return true; if (f.tEdit || f.sizeBig) { if (f.sizeMsg === READING) { f.sizeMsg = ''; render(); } return true; } return false; };
    FitNotes.readCapture(file, f.cat, prof().gender, Core.shrink, Core.blobToDataUrl, Core.deviceId()).then(function (r) {
      if (skip()) return;
      applyRead(f, r); render();
    }, function (err) {
      if (skip()) return;
      f.capRaw = (err && err.raw) || null; f.sizeMsg = f.cat === 'shoe' ? '' : SIZE_ASK; render();
    });
  }
  function pasteImage() {
    if (!navigator.clipboard || !navigator.clipboard.read) { toast('이 브라우저에서는 붙여넣기 버튼을 쓸 수 없어요. 앨범에서 골라 주세요.', 3500); return; }
    navigator.clipboard.read().then(function (items) {
      for (var i = 0; i < items.length; i++) {
        var ty = items[i].types.filter(function (x) { return /^image\//.test(x); })[0];
        if (ty) return items[i].getType(ty).then(function (b) { return new File([b], 'paste.' + ty.split('/')[1], { type: ty }); });
      }
      return null;
    }).then(function (fl) { if (fl) takeFile(fl, 'add'); else toast('복사한 그림이 없어요. 쇼핑 앱에서 그림을 복사한 뒤 다시 눌러 주세요.', 3500); },
      function () { toast('복사한 그림을 읽지 못했어요. 앨범에서 골라 주세요.', 3500); });
  }
  function addSizes(f) { try { return f.table ? FitNotes.tblSizes(f.table) : f.sizes.filter(function (s) { return String(s.label || '').trim() !== ''; }); } catch (e) { return []; } }
  /* 신발 표(사이즈 · 안쪽 길이 mm). PC closetForm 의 표 없는 경우와 같은 칸 이름(data-sl·data-sf)이라 입력 처리는 같다 */
  function shoeTable(f, edit) {
    return '<table class="stbl' + (edit ? ' ed' : '') + '"><thead><tr><th scope="col">사이즈</th><th scope="col">안쪽 길이(mm)</th>' + (edit ? '<th></th>' : '') + '</tr></thead><tbody>' + f.sizes.map(function (z, i) {
      if (!edit) return '<tr><th scope="row">' + h(z.label) + '</th><td>' + (z.inner == null || z.inner === '' ? '<span class="nil">–</span>' : h(z.inner)) + '</td></tr>';
      return '<tr><td><input type="text" id="sl' + i + '" data-sl="' + i + '" value="' + h(z.label) + '" aria-label="사이즈 이름"></td><td><input type="text" inputmode="decimal" autocomplete="off" id="sf' + i + 'inner" data-sf="' + i + ':inner" value="' + h(z.inner == null ? '' : z.inner) + '" aria-label="' + h(z.label) + ' 안쪽 길이"></td><td><button type="button" class="rm" data-act="sizeDel" data-i="' + i + '" aria-label="사이즈 삭제">✕</button></td></tr>';
    }).join('') + '</tbody></table>' + (edit ? '<button type="button" class="lk" data-act="sizeAdd">+ 사이즈 추가</button>' : '');
  }
  /* 목업 B3 「옷 확인」 */
  function viewAdd() {
    var f = ui.cf, sh = f.cat === 'shoe', sizes = addSizes(f), rec = '';
    var hasNum = sizes.some(function (s) { return Object.keys(s).some(function (k) { return k !== 'label' && s[k] != null && s[k] !== ''; }); });
    if (hasNum) { var r = evalOne({ id: 'new', cat: f.cat, gender: isMale() ? 'male' : 'female', measureType: sh ? '' : f.measureType || 'flat', fabric: 'normal', sizes: sizes }, null); rec = r && r.chosen ? String(r.chosen) : ''; }
    var tb;
    if (f.tOpen) tb = '<div class="tedit">' + (f.table ? formTable(f) : shoeTable(f, true)) + '</div>';
    else if (f.table) tb = '<div class="tscroll"><table class="stbl"><thead><tr><th scope="col">사이즈</th>' + f.table.head.map(function (x) { return '<th scope="col">' + h(x) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      f.table.rows.map(function (r0) {
        var on = rec && String(r0[0]).trim() === rec;
        return '<tr' + (on ? ' class="on"' : '') + '><th scope="row">' + h(r0[0]) + (on ? '<small>추천</small>' : '') + '</th>' + f.table.head.map(function (x, ci) { var v = r0[ci + 1]; return '<td>' + (v == null || String(v).trim() === '' ? '<span class="nil">–</span>' : h(v)) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
    else tb = '<div class="tscroll">' + shoeTable(f, false) + '</div>';
    var chips = '<div class="chips" role="radiogroup" aria-label="옷 종류">' + CAT_ORDER.map(function (c) { var on = f.cat === c; return '<button type="button" role="radio" aria-checked="' + on + '" class="chip' + (on ? ' on' : '') + '" data-act="addCat" data-cat="' + c + '">' + CATS[c] + '</button>'; }).join('') + '</div>';
    return '<header class="top"><button type="button" class="back" data-act="addCancel">‹ 취소</button><h1 class="mid">옷 확인</h1><span class="sp"></span></header><main class="body">' +
      '<div class="addtop"><button type="button" class="aph" data-act="addPick" data-v="photo" aria-label="' + (f.photo ? '옷 사진 바꾸기' : '옷 사진 넣기') + '">' + (f.photo ? '<img src="' + h(f.photo) + '" alt="">' : '<span aria-hidden="true">＋</span>') + '<small>' + (f.photo ? '사진 바꾸기' : '사진 넣기') + '</small></button>' +
      '<div class="aff"><label for="pname">' + (sh ? '신발 이름' : '옷 이름') + '<span class="in"><input id="pname" type="text" data-cf="name" maxlength="60" placeholder="예: 반팔 티" value="' + h(f.name) + '"></span></label>' +
      '<label for="pprice">가격<span class="in"><input id="pprice" type="text" inputmode="numeric" data-cf="price" placeholder="예: 19,900원" value="' + h(f.price) + '"></span></label></div></div>' +
      (f.photoMsg ? '<p class="p" data-ocr="photo" role="status">' + h(f.photoMsg) + '</p>' : '') +
      '<div class="sec"><h2 style="font-size:16px">종류</h2>' + (f.catAuto && f.catHit ? '<span>이름을 보고 골랐어요</span>' : '') + '</div>' + chips +
      '<div class="sec"><h2 style="font-size:16px">사이즈 표</h2><span>' + (sh ? '단위 mm' : (f.measureType === 'circ' ? '둘레' : '단면') + ' · cm') + (rec ? ' · ' + (who() === 'base' ? '모델' : '내') + ' 추천 <b class="rec">' /* 추천은 지금 입어보는 쪽(prof) 기준: 기본 모델이면 그 모델 치수 */ + h(rec) + '</b>' : '') + '</span></div>' +
      (f.sizeMsg ? '<p class="callout" data-ocr="size" role="status">' + h(f.sizeMsg) + '</p>' : '') + tb +
      '<div class="row"><button type="button" class="btn ghost sm" data-act="addPick" data-v="size">' + (f.sizeBig ? '표 사진 다시 넣기' : '표 사진 넣기') + '</button><button type="button" class="btn ghost sm" data-act="tblOpen" aria-pressed="' + !!f.tOpen + '">' + (f.tOpen ? '고치기 끝' : '직접 고치기') + '</button></div>' +
      (sh ? '<div class="one"><label for="pheel">굽 높이 (선택)<span class="in"><input id="pheel" type="text" inputmode="decimal" autocomplete="off" data-cf="heel" maxlength="3" placeholder="예: 70" value="' + h(f.heel == null ? '' : f.heel) + '"><small>mm</small></span></label></div>' : '') +
      '<div class="one"><label for="purl">구매 링크 (선택)<span class="in"><input id="purl" type="url" inputmode="url" autocapitalize="off" spellcheck="false" data-cf="url" placeholder="https://..." value="' + h(f.url) + '"></span></label></div>' +
      (f.err ? '<p class="err" role="alert">' + h(f.err) + '</p>' : '') + '</main>' +
      '<div class="foot"><div class="row"><button type="button" class="btn ghost" data-act="addSave" data-v="closet">옷장에만 저장</button><button type="button" class="btn" data-act="addSave" data-v="try">저장하고 입어보기</button></div></div>';
  }
  /* 화면 밖에서 붙여넣기(컴퓨터 브라우저·일부 휴대폰 자판): 옷 확인이 열려 있으면 사이즈 표 사진, 아니면 새 옷 사진. 글 칸에 붙여넣는 글은 그대로 둔다 */
  document.addEventListener('paste', function (e) {
    if (!user || !state || ui.au.mode || ui.wait || ui.imp || ui.onb) return;
    var items = (e.clipboardData && e.clipboardData.items) || [];
    for (var i = 0; i < items.length; i++) if (items[i].kind === 'file' && /^image\//.test(items[i].type)) {
      var fl = items[i].getAsFile(); if (!fl) continue;
      e.preventDefault(); takeFile(fl, ui.cf ? 'size' : 'add'); return;
    }
  });

  /* ---------- 그리기 (pc.js 2234~2262행 render 에서 입력 중인 값·커서·스크롤 지키기를 가져옴) ---------- */
  function render() {
    syncDue = false;
    if (!user) { ui.vkey = 'login'; renderAuth(); return; }
    if (ui.wait) { ui.vkey = 'wait'; app.innerHTML = '<div class="empty" role="status"><div class="logo big">FIT<i>ON</i></div><span>' + h(ui.wait) + '</span></div>'; return; }
    if (ui.imp) { ui.vkey = 'imp'; app.innerHTML = viewImport(); return; }
    ensureBasePic();
    /* 옷 확인: 사람이 종류를 고르기 전이면, 읽은(또는 넣은) 이름이 바뀔 때마다 이름으로 종류를 고른다. 바꾸면 cfCatTo 가 다시 그린다 */
    var cf = ui.cf;
    if (cf && cf.catAuto && !cf.tEdit && cf.name && cf.catName !== cf.name) { cf.catName = cf.name; var gc = guessCat(cf.name); if (gc) { cf.catHit = true; if (gc !== cf.cat) { cfCatTo(gc); return; } } }
    var p = ui.page, key = cf ? 'add' : ui.onb ? 'onb' + ui.onb : p + (p === 'me' && ui.meEdit ? ':edit' : '');
    var inner = cf ? viewAdd() : ui.onb === 1 ? viewOnbBody() : ui.onb === 2 ? viewOnbModel() : p === 'closet' ? viewCloset() : p === 'history' ? viewHistory() : p === 'me' ? viewMe() : p === 'plan' ? viewPlan() : p === 'set' ? viewSettings() : viewHome();
    var ae = document.activeElement, keep = ae && app.contains(ae) && ae.id, sel = null, scr = null, b0 = app.querySelector('.body'), c0 = app.querySelector('.chips');
    try { sel = keep && ae.selectionStart; } catch (e) {}
    if (ui.vkey === key) scr = [b0 ? b0.scrollTop : 0, c0 ? c0.scrollLeft : 0];
    var vk = {}; /* 다시 그려도 아직 저장 안 한 몸 치수 입력은 그대로 둔다 */
    if (ui.vkey === key) Array.prototype.forEach.call(app.querySelectorAll('#h,#w,input[data-mf]'), function (i) { if (i.id) vk[i.id] = i.value; });
    app.innerHTML = inner; ui.vkey = key;
    Object.keys(vk).forEach(function (k) { var e = document.getElementById(k); if (e && e.value !== vk[k]) e.value = vk[k]; });
    if (scr) { var b1 = app.querySelector('.body'), c1 = app.querySelector('.chips'); if (b1) b1.scrollTop = scr[0]; if (c1) c1.scrollLeft = scr[1]; }
    if (keep) { var a = document.getElementById(keep); if (a) { a.focus(); try { if (sel != null) a.setSelectionRange(sel, sel); } catch (e) {} } }
  }

  /* ---------- 크게 보기 (목업 D3: 검은 배경에 원본 그대로, 이전·다음 버튼, 두 손가락 확대. 사진은 바꾸지 않고 보여 주기만 한다) ---------- */
  var viewer = null;
  function closeViewer() { if (!viewer) return; document.removeEventListener('keydown', viewer.key); viewer.el.remove(); var b = viewer.back; viewer = null; if (b && b.isConnected && b.focus) b.focus(); }
  function openViewer(list, idx) {
    closeViewer(); if (!list.length) return;
    var o = document.createElement('div'), z = { k: 1, x: 0, y: 0 }, t0 = null, lastTap = 0, img = null;
    o.className = 'viewer'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', '사진 크게 보기');
    function apply() { if (img) img.style.transform = 'translate(' + z.x + 'px,' + z.y + 'px) scale(' + z.k + ')'; }
    function clamp() { var st = o.querySelector('.vstage'), mx = st.clientWidth * (z.k - 1) / 2, my = st.clientHeight * (z.k - 1) / 2; z.x = Math.max(-mx, Math.min(mx, z.x)); z.y = Math.max(-my, Math.min(my, z.y)); }
    function draw() {
      var e = list[idx], n = list.length; z = { k: 1, x: 0, y: 0 };
      o.innerHTML = '<header class="top"><button type="button" class="back" data-v="close">✕ 닫기</button>' + (n > 1 ? '<span class="pill st">' + (idx + 1) + ' / ' + n + '</span>' : '') + '</header>' +
        '<div class="vstage"><img alt="' + h(e.alt || '') + '" src="' + h(e.url) + '" draggable="false">' +
        (n > 1 ? '<button type="button" class="navb l" data-v="prev" aria-label="이전"' + (idx === 0 ? ' disabled' : '') + '>‹</button><button type="button" class="navb r" data-v="next" aria-label="다음"' + (idx === n - 1 ? ' disabled' : '') + '>›</button>' : '') +
        '<div class="vhint">두 손가락으로 확대</div></div>' + (e.info ? '<div class="vinfo">' + e.info + '</div>' : '');
      img = o.querySelector('.vstage img');
      var st = o.querySelector('.vstage');
      st.addEventListener('touchstart', function (ev) {
        var t = ev.touches;
        if (t.length === 2) t0 = { d: Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY), k: z.k };
        else if (t.length === 1) {
          var now = Date.now();
          if (now - lastTap < 300 && !ev.target.closest('button')) { z = z.k > 1 ? { k: 1, x: 0, y: 0 } : { k: 2.5, x: 0, y: 0 }; apply(); lastTap = 0; ev.preventDefault(); return; }
          lastTap = now; t0 = { px: t[0].clientX - z.x, py: t[0].clientY - z.y };
        }
      }, { passive: false });
      st.addEventListener('touchmove', function (ev) {
        var t = ev.touches; if (!t0) return;
        if (t.length === 2 && t0.d) { z.k = Math.max(1, Math.min(4, t0.k * Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY) / t0.d)); clamp(); apply(); ev.preventDefault(); }
        else if (t.length === 1 && t0.px != null && z.k > 1) { z.x = t[0].clientX - t0.px; z.y = t[0].clientY - t0.py; clamp(); apply(); ev.preventDefault(); }
      }, { passive: false });
      st.addEventListener('touchend', function (ev) { if (!ev.touches.length) { t0 = null; if (z.k < 1.05) { z = { k: 1, x: 0, y: 0 }; apply(); } } else if (ev.touches.length === 1) t0 = { px: ev.touches[0].clientX - z.x, py: ev.touches[0].clientY - z.y }; });
      var f = o.querySelector('.back'); if (f) f.focus();
    }
    o.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-v]'); if (!b) return;
      if (b.dataset.v === 'close') closeViewer();
      else if (b.dataset.v === 'prev' && idx > 0) { idx--; draw(); }
      else if (b.dataset.v === 'next' && idx < list.length - 1) { idx++; draw(); }
    });
    viewer = { el: o, back: document.activeElement, key: function (ev) { if (ev.key === 'Escape') closeViewer(); else if (ev.key === 'ArrowLeft' && idx > 0) { idx--; draw(); } else if (ev.key === 'ArrowRight' && idx < list.length - 1) { idx++; draw(); } } };
    document.body.appendChild(o); document.addEventListener('keydown', viewer.key); draw();
  }

  /* ---------- 누르기 ---------- */
  var ACT = {
    go: function (el) { go(el.dataset.page); },
    soon: function () { toast(SOON, 2500); },
    /* 옷 넣기 (B2·B3) */
    addPick: function (el) {
      var v = el.dataset.v;
      if (v === 'paste') { ui.plus = false; render(); pasteImage(); return; }
      pickFile(v === 'photo' || v === 'size' ? v : 'add', v === 'camera');
    },
    addCat: function (el) { var f = ui.cf, c = el.dataset.cat; if (!f || !CATS[c]) return; f.catAuto = false; f.catHit = false; f.saved = false; if (f.cat !== c) cfCatTo(c); else render(); },
    tblOpen: function () { if (ui.cf) { ui.cf.tOpen = !ui.cf.tOpen; render(); } },
    addCancel: function () {
      var f = ui.cf; if (!f) return;
      if ((f.photo || String(f.name || '').trim() || f.tEdit) && !confirm('넣은 옷을 저장하지 않고 나갈까요?')) return;
      go(ui.page);
    },
    /* 저장은 PC 와 같은 cfSave(값 확인·겉옷 확인·옷장에 넣기). 저장되면(ui.cf.saved) 옷장으로, 「저장하고 입어보기」면 이 옷을 입어볼 옷으로 고르고 홈으로.
       입히기는 4단계에서 연결 */
    addSave: function (el) {
      if (!ui.cf) return;
      /* 사진에서 아직 읽는 중이면(휴대폰 글자 읽기는 1분 가까이 걸릴 수 있음) 지금 저장하면 읽은 값이 안 들어간다 → 묻는다. 읽는 중 = PC 코드가 띄우는 「읽는 중」 글 */
      if (/읽는 중/.test(String(ui.cf.photoMsg || '') + ' ' + String(ui.cf.sizeMsg || '')) && !confirm('아직 사진에서 이름·가격이나 사이즈 표를 읽는 중이에요.\n지금 저장하면 읽은 값은 들어가지 않아요. 그래도 저장할까요?')) return;
      ui.cf.saved = false; ACT.cfSave();
      if (!ui.cf || !ui.cf.saved) return;
      var it = item(ui.cf.id), tryNow = el.dataset.v === 'try';
      if (tryNow && it && it.kind !== 'under') { selectItem(it); save(); }
      go(tryNow ? 'home' : 'closet');
      var ts = document.querySelectorAll('.toast'), msg = !tryNow ? '' : it && it.kind === 'under' ? '옷장에 저장했어요. 언더웨어는 사이즈 확인용이라 입어보기에는 쓰지 않아요.' : '옷장에 저장하고 입어볼 옷으로 골랐어요. 입어보기는 다음 단계에서 연결돼요.';
      if (msg && ts.length) ts[ts.length - 1].textContent = msg;
    },
  /* ▼ pc.js 2858~2900행 그대로 */
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
      rec.kind = f.kind || guessKind(rec.name, f.cat) || ''; /* 2026-11-19 11차: 신발도 종류 저장 */
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
  /* ▲ */
    plus: function () { ui.plus = !ui.plus; render(); },
    plusClose: function () { ui.plus = false; render(); },
    closetCat: function (el) { if (CATS[el.dataset.cat]) { ui.closetCat = el.dataset.cat; ui.vkey = ''; render(); } },
    homeZoom: function () { openViewer([{ url: avatarShow(), alt: who() === 'base' ? baseModel().name + ' 기본 모델 전신' : '내 아바타 전신' }], 0); },
    histOpen: function (el) { openViewer(histList().map(function (e) { return { url: urls.tryon[e.key], alt: lookName(e.key) + ' 입은 모습', info: histInfo(e) }; }), Number(el.dataset.i) || 0); },
    /* 로그아웃: 아직 못 올린 내용이 있으면 먼저 올리고(최대 6초) 나간다. 이 기기에 저장된 자료는 지우지 않는다 */
    logout: function () {
      var done = function () {
        if (!user) return;
        Sync.signOut(); closeViewer(); clearUrls(); user = null; state = null; ui.onb = 0; ui.imp = ''; ui.wait = ''; ui.meEdit = false; ui.plus = false; ui.bodyTab = null; ui.cf = null;
        ui.au = { mode: '', err: '', busy: false, email: '', agree: false, note: '' }; render();
      };
      if (!Sync.pending()) return done();
      toast('저장한 내용을 서버에 올리는 중…', 2500);
      Promise.race([Sync.flush().then(function () { return Sync.blobSync(false); }).catch(function () {}), new Promise(function (r) { setTimeout(r, 6000); })]).then(done);
    },
    /* 첫 화면의 로그인·회원가입 창 */
    auOpen: function (el) { var a = ui.au, em = val('auemail').trim(); if (a.busy) return; a.mode = el.dataset.v; a.err = ''; if (em) a.email = em; render(); },
    auClose: function () { var a = ui.au; if (a.busy) return; if (a.mode === 'newpw') { afterAuth(); return; } a.mode = ''; a.err = ''; render(); },
    auSee: function (el) { var i = document.getElementById(el.dataset.for); if (!i) return; var show = i.type === 'password'; i.type = show ? 'text' : 'password'; el.textContent = show ? '숨기기' : '보기'; el.setAttribute('aria-pressed', String(show)); },
    auSignup: function () {
      if (ui.au.busy) return;
      var em = auMail(); if (!em) return; var pw = auNewPass(); if (!pw) return;
      var ag = document.getElementById('auagree'); ui.au.agree = !!(ag && ag.checked);
      if (!ui.au.agree) return auErr('개인정보 처리방침에 동의해 주세요');
      auErr(''); auBusy(true);
      Sync.signUp(em, pw).then(function (r) {
        auBusy(false);
        if (!r.ok) return auErr(r.err);
        if (r.confirm) { ui.au.mode = 'sent'; ui.au.err = ''; ui.au.note = em + ' 으로 가입 확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요.'; render(); return; }
        afterAuth();
      });
    },
    auLogin: function () {
      if (ui.au.busy) return;
      var em = auMail(); if (!em) return; var pw = val('aupw'); if (!pw) return auErr('비밀번호를 넣어 주세요', 'aupw');
      auErr(''); auBusy(true);
      Sync.signIn(em, pw).then(function (r) { auBusy(false); if (!r.ok) return auErr(r.err, 'aupw'); afterAuth(); });
    },
    auReset: function () {
      if (ui.au.busy) return;
      var em = auMail(); if (!em) return;
      auErr(''); auBusy(true);
      Sync.recover(em, location.origin + location.pathname).then(function (r) {
        auBusy(false);
        if (!r.ok) return auErr(r.err);
        ui.au.mode = 'sent'; ui.au.err = ''; ui.au.note = em + ' 으로 비밀번호를 다시 정하는 링크를 보냈어요. 가입한 이메일일 때만 메일이 가요. 메일이 안 보이면 스팸함도 확인해 주세요.'; render();
      });
    },
    auNewPw: function () {
      if (ui.au.busy) return;
      var pw = auNewPass(); if (!pw) return;
      auErr(''); auBusy(true);
      Sync.setPassword(pw).then(function (r) { auBusy(false); if (!r.ok) return auErr(r.err); toast('비밀번호를 바꿨어요.', 2500); afterAuth(); });
    },
    /* 이 기기에 있던 프로필 자료 가져오기 */
    impPick: function (el) { ui.imp = 'pin'; ui.lg = { mode: 'pin', id: el.dataset.id, err: '', fails: ui.lg.fails || 0, until: ui.lg.until || 0 }; render(); },
    impBack: function () { ui.imp = 'ask'; ui.lg.err = ''; render(); },
    impSkip: function () { ui.imp = ''; ui.onb = 1; render(); },
    impGo: function () {
      var u = Core.userById(ui.lg.id); if (!u) { ACT.impBack(); return; }
      if (!checkPin(u)) return;
      ui.wait = '가져오는 중…'; render();
      Sync.importLocal(u.id).then(function (n) {
        ui.wait = ''; ui.imp = ''; state = load(); save(); ui.page = 'home'; enterApp();
        toast(u.nick + ' 프로필의 자료를 가져왔어요.' + (n ? ' 사진 ' + n + '장은 서버에 올리는 중이에요.' : ''), 4000);
      }, function (e) { ui.wait = ''; ui.lg.err = (e && e.message) || '가져오지 못했어요.'; render(); });
    },
    /* 처음 실행 1단계 「다음」: 저장은 PC 와 같은 bSave(값 확인 포함). 저장에 성공했을 때만(bSave 가 bodyTab 을 'me' 로 바꿈) 다음 단계로 */
    onbNext: function () { ui.bodyTab = null; ACT.bSave(); if (ui.bodyTab === 'me') { ui.onb = 2; ui.onbBase = null; render(); } },
    onbBack: function () { ui.onb = 1; render(); },
    onbPick: function (el) { ui.onbBase = el.dataset.id; ui.vkey = 'onb2'; render(); },
    onbMe: function () { ui.onb = 0; go('home'); },
    onbStart: function (el) { ACT.bPreset(el); ui.onb = 0; go('home'); },
    meEditOn: function () { ui.meEdit = true; render(); },
    meEditOff: function () { ui.meEdit = false; render(); },
    meSave: function () { ui.bodyTab = null; ACT.bSave(); if (ui.bodyTab === 'me') { ui.meEdit = false; render(); } else ui.bodyTab = 'me'; },
  /* ▼ pc.js 2701행 그대로 */
    planPick: function (el) { var k = el.dataset.plan; if (!FD.plans[k] || subNow().plan === k) return; subNow().plan = k; save(); toast(FD.plans[k].name + ' 플랜으로 바꿨어요 (결제 연동 전 체험용).'); render(); },
  /* ▲ */
  /* ▼ pc.js 2758행 그대로 */
    fitStyle: function (el) { state.profile.pref = el.dataset.v; save(); render(); },
  /* ▲ */
  /* ▼ pc.js 2952~2982행 그대로 */
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
  /* ▲ */
    noop: function () {}
  };
  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (el && ACT[el.dataset.act]) ACT[el.dataset.act](el);
  });
  /* 자판의 「이동/완료」: 다음 빈 칸으로, 다 찼으면 그 창의 큰 버튼을 누른 것과 같게 */
  app.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.isComposing || !e.target || e.target.tagName !== 'INPUT' || e.target.type === 'checkbox') return;
    var box = !user ? app.querySelector('.aucard') : ui.imp === 'pin' ? app : null; if (!box) return;
    e.preventDefault();
    var ins = Array.prototype.filter.call(box.querySelectorAll('input:not([type=checkbox])'), function (i) { return !i.value; });
    if (ins.length && ins[0] !== e.target) { ins[0].focus(); return; }
    var b = !user ? document.getElementById('aubtn') : app.querySelector('.foot .btn'); if (b) b.click();
  });
  /* 창 밖(어두운 곳)을 누르면 닫는다 */
  app.addEventListener('click', function (e) { if (e.target && e.target.id === 'auwrap') ACT.auClose(); });
  /* 옷 확인 칸에 쓰는 값(이름·가격·링크·사이즈 표)은 쓰는 대로 ui.cf 에 담는다(PC 와 같은 처리) */
  /* ▼ pc.js 3011~3022행 그대로 */
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
  /* ▲ */
  /* 이름을 손으로 고치면 그 뒤로는 이름으로 종류를 바꾸지 않는다(쓰는 중에 화면이 다시 그려져도) */
  app.addEventListener('input', function (e) { if (ui.cf && e.target && e.target.id === 'pname') ui.cf.catAuto = false; });
  /* 주소 #add = 옷 확인 화면. 휴대폰 「뒤로」 등으로 그 주소를 벗어나면 저장 안 한 옷 확인은 버린다 */
  window.addEventListener('hashchange', function () {
    if (/(^#|&)(access_token|error_code)=/.test(location.hash)) { location.reload(); return; } /* 앱이 열린 창에서 메일의 링크를 연 경우: 처음부터 다시 읽는다 */
    if (location.hash === '#add' && ui.cf) return;
    var drop = !!ui.cf; ui.cf = null;
    var p = pageFromHash(); closeViewer(); if (p !== ui.page || drop) { ui.page = p; ui.plus = false; ui.meEdit = false; render(); }
  });
  /* ▼ pc.js 3060~3073행 그대로 */
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
  /* ▲ */

  /* ---------- 시작 ---------- */
  Sync.on({
    expire: function () { if (!user) return; closeViewer(); clearUrls(); user = null; state = null; ui.cf = null; ui.onb = 0; ui.imp = ''; ui.wait = ''; ui.au = { mode: 'login', err: '다시 로그인해 주세요', busy: false, email: '', agree: false, note: '' }; render(); },
    blobs: function () { mediaAgain(); } /* 서버에서 사진을 받으면 화면에 반영 */
  });
  function boot() {
    if (user && Sync.hasLocal()) {
      /* 이 기기에 내 자료가 있으면 바로 열고, 뒤에서 서버와 맞춘다(다른 기기에서 고친 것이 더 새로우면 그 내용으로) */
      state = load(); render(); loadMedia().then(function () { ui.mediaReady = true; render(); });
      Sync.pull().then(function (r) { if (!user) return; if (r.applied) { state = load(); mediaAgain(); } pullBlobs(); }, function () {});
    } else if (user) afterAuth(); /* 로그인은 되어 있는데 이 기기에 자료가 없으면 서버에서 먼저 받는다 */
    else render();
  }
  if (/(^#|&)(access_token|error_code)=/.test(location.hash)) {
    /* 메일의 링크(비밀번호 다시 정하기·가입 확인)로 들어온 경우 */
    Sync.fromLink().then(function (r) {
      if (r && !r.err) { user = acctUser(); if (r.type === 'recovery') { user = null; ui.au.mode = 'newpw'; ui.au.err = ''; render(); return; } }
      else if (r && r.err && !user) { ui.au.mode = 'login'; ui.au.err = r.err; }
      boot();
    });
  } else boot();
})();
