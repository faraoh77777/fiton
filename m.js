/* FITON 모바일 (m.html) — 2026-11-20 첫 화면(영상)·회원가입·로그인·서버 저장(fit-sync.js) 추가. 1~2단계: 앱 틀·화면 이동·프로필·내 치수·기본 모델/내 아바타 고르기·요금제·설정·옷장(보기)·기록(보기).
   설계: fiton-mobile-설계\v3_전신보임_빠진화면추가_큰글자\모바일_v3.html. 동작 기준은 PC 앱(pc.js)이다.
   · PC 앱과 같은 저장소(localStorage 'fit-test-v1:<프로필 id>', IndexedDB 'fit-test')를 같은 형식으로 읽고 쓴다. 저장 값에 새 항목을 만들지 않는다.
   · 「pc.js N~M행 그대로」 표시 사이의 코드는 pc.js 에서 한 글자도 바꾸지 않고 옮긴 것이다(핏 계산·저장·프로필을 새로 짜지 않기 위해). pc.js 를 고치면 여기도 같이 맞춘다.
   · 2026-11-20 3단계: 옷 넣기(앨범·카메라·붙여넣기) → 옷 확인(이름·가격·종류·사이즈 표·구매 링크) → 옷장에 저장. 읽기·저장은 PC 옷장 입력 칸(ui.cf)과 같은 코드(closetPhoto·sizeCap·cfSave)를 그대로 쓴다.
   · 2026-11-20 4단계(1차): 홈 옷 칸 6개(겉옷·이너·상의·하의·원피스·신발) → 옷장에서 고르기(C2) → 입히기(C3, 앞모습만) → 입은 모습(C4) · 실패 안내(C7).
     입히기·결과 정리(얼굴 되돌리기·아바타 모습 비교·옷만 합치기·배경)는 pc.js 의 wearAll·genPoll 을 그대로 쓰고, 화면 쪽(대기·완료·실패 표시)만 모바일로 새로 짰다(waitStart·waitEnd·genFinish).
   · 2026-11-20 4단계(2차): C4 의 「핏 자세히」 → 핏 서랍(C5). 판정·부위별 등급·사이즈 비교는 PC 피팅룸 핏 칸(viewFitting)의 계산·문구를 그대로 쓰고, 서랍 모양만 모바일로(fitSheet).
   · 2026-11-20 4단계(3차): 옆·뒷모습. C1 방향 버튼 = 만들 방향(PC genViews, 방향마다 1회), C4 방향 버튼 = 만든 그림 보기. 만들기는 PC wearAll·angNext 그대로.
   · 2026-11-20 5단계: 옷장 카드를 누르면 「입어보기 · 고치기 · 구매 · 지우기」(목업 D1), 기록 크게 보기에 「홈에서 보기 · 지우기 · 구매하기」(7단계에 「다시 입기」→「홈에서 보기」, PC 「피팅룸에서 보기」에 맞춤)(목업 D3).
     고치기는 「옷 확인」 화면을 PC editItem(cfLoad)·cfSave 그대로 써서 고치고, 지우기는 PC delItem·histDel·dropTryon 그대로(사진·입은 모습 함께 지움).
   · 2026-11-20 6단계: 내 아바타 = PC 와 같은 앞·옆·뒤 사진 올리기·지우기(normAvatar 표준 틀·avSetup 배경색) + 아바타 만들기(PC 와 같은 avatar-make.js 창, avMake 그대로).
   · 2026-11-21 홈/피팅룸 나누기(목업 fiton-mobile-설계\v1_홈피팅룸분리): 홈 = 최근 입은 모습 보기만(옷 이름·사이즈·핏 한 줄 + 기록 보기·피팅룸에서 입어보기).
     예전 홈의 옷 칸 6개·방향·입어보기·입은 모습·핏 서랍·구매·실패 안내·쓸어 내리기는 그대로 「피팅룸」(#fit, viewFit)으로 옮김. 아래 가운데 ＋ = 피팅룸.
     옷 넣기 창(B2)은 피팅룸 옷 칸의 「새 옷 넣기」·빈 피팅룸 버튼·옷장 위 「＋ 옷 넣기」에서 연다. 옷장·기록·옷 저장·입히기가 끝나면 피팅룸으로(PC 와 같음).
   · 2026-11-21 쇼츠형 한 화면(목업 fiton-mobile-설계\v4_쿠팡네이버삭제, 색은 v2 = 옛 쇼츠 색: 사진 위 흰 글씨·흰 카드·빨간 버튼). 아래 탭 5개를 없앰.
     화면 가득 사진 + 위 「추천 코디 / 내 모습」 + 오른쪽 둥근 버튼(옷장·핏·내 몸·기록·설정) + 아래 흰 카드.
     추천 코디(#home) = PC 홈 「이번 계절 코디」(stylesIn·importStyle 그대로)를 넘겨 보고 「이 코디 입어보기」(PC styleTry 와 같이 옷 칸에 넣고 입히기).
     내 모습(#fit) = 예전 홈·피팅룸을 한 카드로(옷 칸 6개·만들 방향·입어보기·구매). 사진을 좌우로 쓸면 추천 코디/입어본 모습을 넘김.
     옷장·기록·내 몸·설정·요금제·핏 자세히 = 아래에서 올라오는 창(내용은 예전 화면 그대로). 옷장 아래 「쇼핑 링크」 = PC 「링크에서 이름·가격 가져오기」(linkRead 그대로).
     핏 창에 PC 허리띠 선택(wearOpt 그대로)·결과 그림 저장(PC savePic 과 같은 파일 이름). 바지 길이는 PC 에서 2026-11-18 사용자 지시로 지운 기능이라 넣지 않음.
   · 아직 안 하는 것: 액세서리(사용자 지시로 끔, PC 도 tryon-config acc:false)·기록 날짜별 묶기(사용자 지시로 뺌). 그 버튼들은 「다음 단계에서 연결돼요」 안내만 띄운다. */
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
  var MPAGES = ['intro', 'home', 'fit', 'closet', 'history', 'me', 'plan', 'set'];
  /* cf: 「옷 확인」(목업 B3)에 넣고 있는 옷 = PC 옷장 입력 칸과 같은 모양(blankForm). null 이면 그 화면이 아님. 모바일만 쓰는 값: catAuto(이름으로 종류를 골라도 됨)·catHit(이름으로 골랐음)·catName·readCat(읽기 시작할 때의 종류)·tOpen(표 고치기 열림) */
  /* 4단계: pick = 옷 고르기 창(C2)에 연 종류 · slotsOpen = 입은 모습이 있어도 옷 칸을 펼침 · buy = 구매 링크 창 · genWait = 입히는 중 표시(이름·사이즈·안내·시작 시각).
     fit = 핏 서랍(C5) 열림 · fitSz = 그 안의 사이즈 비교 펼침 · fitTab = 핏을 보는 옷 종류(PC 와 같은 이름).
     view·angle·genErr·genSizes 는 PC 입히기 코드(wearAll·genPoll·angDone)가 쓰는 값이라 PC 와 같은 이름·같은 처음 값 */
  /* 5단계: itm = 옷장 카드를 눌러 연 창(D1)의 옷 id · buy 가 문자열이면 그 옷(또는 옷 조합 키)의 구매 창 */
  /* 2026-11-21 쇼츠형: styleI = 보고 있는 추천 코디 번호 · base = 창(옷장·기록·내 몸·설정·요금제)을 닫으면 돌아갈 화면(home = 추천 코디, fit = 내 모습) */
  var ui = { page: pageFromHash(), styleI: 0, base: 'fit', bodyTab: null, closetCat: 'outer', meEdit: false, plus: false, cf: null, onb: 0, onbBase: null, mediaReady: false, vkey: '', itm: null,
    view: 'me', angle: 'front', genErr: null, genSizes: {}, pick: null, slotsOpen: false, buy: false, genWait: null, fitTab: null, fit: false, fitSz: false, low: true /* 2026-11-23 사용자 지시: 피팅룸 아래 카드는 처음부터 내려가 있고, 다른 창을 열었다 닫아도 그대로 */,
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
  /* 7단계: 알림 글을 짧은 사이에 두 번 띄우면 같은 자리에 겹쳐 보여(PC toast 는 새 상자를 계속 만듦) 휴대폰에서는 앞 알림을 지우고 새 알림만 보인다 */
  var toast0 = toast;
  toast = function (msg, ms) { Array.prototype.forEach.call(document.querySelectorAll('.toast'), function (t) { t.remove(); }); toast0(msg, ms); };
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
  function pageFromHash() { var p = (location.hash || '').replace('#', ''); return MPAGES.indexOf(p) >= 0 ? p : 'intro'; } /* 2026-11-23 주소에 화면 이름이 없으면 소개(홈) */
  function go(p) { if ((ui.page === 'home' || ui.page === 'fit' || ui.page === 'intro') && PANELS[p]) ui.base = ui.page; ui.page = p; ui.plus = false; ui.meEdit = false; ui.cf = null; ui.pick = null; ui.buy = false; ui.fit = false; ui.fitSz = false; ui.itm = null; if (location.hash !== '#' + p) location.hash = '#' + p; render(); }
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

  /* ---------- 추천 코디 (PC 홈 「이번 계절 코디」와 같은 목록·같은 옷장 넣기) ---------- */
  /* ▼ pc.js 282~288행 그대로 */
  function styleForMe(s) { var g = s.gender || 'female'; return g === 'unisex' || g === (isMale() ? 'male' : 'female'); }
  function curSeason() { var m = new Date().getMonth() + 1; return m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'fall' : 'winter'; }
  function seasonName() { return { spring: '봄', summer: '여름', fall: '가을', winter: '겨울' }[curSeason()]; }
  function stylesIn() {
    var mine = FD.styles.some(styleForMe), season = curSeason();
    return FD.styles.filter(function (s) { return (!mine || styleForMe(s)) && (!s.season || s.season === 'all' || s.season === season); });
  }
  /* ▲ */
  /* ▼ pc.js 289~307행 그대로 */
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

  /* ---------- 입혀 볼 옷 조합·신발·만든 그림 기록 (입히기에 쓰는 PC 코드 그대로) ---------- */
  /* ▼ pc.js 142~144행 그대로 */
  var NOT_YET = '겉옷은 상의와 하의를 함께 골랐을 때만 입혀져요. 액세서리는 옷을 입은 그림이 만들어진 뒤 「액세서리 입히기」 버튼으로 따로 입혀요.';
  /* 서버 tryon 에 outfit3(상의+하의+겉옷) 모드를 배포한 뒤 tryon-config.js 에 outer: true 를 넣는다. 배포 전에 켜면 요청이 거절돼요(횟수는 안 빠짐) */
  function outerWearOn() { return !!(window.TRYON_CFG && window.TRYON_CFG.outer === true); }
  /* ▲ */
  /* ▼ pc.js 203행 그대로 */
  function curView() { return who() === 'base' ? 'model' : 'me'; }
  /* ▲ */
  /* ▼ pc.js 334~373행 그대로 */
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
  /* 2026-11-19 13차: 옷장 신발에 신발 종류(kind)가 있으면 그것으로 판단(굽 높이 wearShoeH 와 같은 기준), 없으면 예전처럼 이름으로 */
  function wearsBoots() { var w = wearShoe(); if (w && w.id) return w.kind ? w.kind === 'boots' : /부츠|boot/i.test(w.name || ''); return tryShoeTypeId() === 'boots'; }
  /* 2026-11-16 신발 굽 높이(cm): 옷장 신발에 넣은 굽(mm)이 있으면 그 값, 없으면 신발 종류별 기본값. 바지가 바닥에 끌리는 기준에 쓴다 */
  var SHOE_H = { pumps: 5, sneakers: 2.5, loafers: 2.5, sandals: 1.5, slippers: 1.5, boots: 4 };
  function wearShoeH() {
    var w = wearShoe();
    if (w && w.id) {
      /* 2026-11-19 11차: 순서 = 입력한 굽 → 고른 신발 종류의 기본 굽 → 이름으로 추측 */
      if (E.num(w.heel)) return Math.round(w.heel) / 10;
      if (w.kind && SHOE_H[w.kind] != null) return SHOE_H[w.kind];
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
  /* ▲ */
  /* ▼ pc.js 479~501행 그대로 */
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
  /* ▲ */
  /* ▼ pc.js 540~572행 그대로 */
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
  /* ▲ */
  /* ▼ pc.js 608~702행 그대로 */
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
  /* ▲ */

  /* ---------- 내 아바타 사진 (6단계: PC 아바타 만들기·앞/옆/뒤 올리기와 같은 저장 — 표준 틀 맞춤 normAvatar·배경색 세팅 avSetup) ---------- */
  /* ▼ pc.js 386행 그대로 */
  var mySpan = { seq: -1, v: null, busy: false };
  /* ▲ */
  /* ▼ pc.js 511~534행 그대로 */
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
  /* ▲ */
  /* ▼ pc.js 2336~2351행 그대로 */
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
  /* ▲ */
  /* ▼ pc.js 2361행 그대로 */
  function avMakeBases() { return BASES.map(function (b) { return { id: b.id, name: b.name, g: b.g, h: b.h, w: b.w, img: b.img }; }); }
  /* ▲ */
  /* ▼ pc.js 2365행 그대로 */
  function avatarFront(fl) { return Core.shrink(fl, 2000, 0.92).then(normAvatar).then(function (b) { return blobPut( /* 2026-11-13 A안: 표준 틀(867×1536)에 맞춰 저장 */'avatar', b).then(function () { if (urls.avatar) URL.revokeObjectURL(urls.avatar); urls.avatar = URL.createObjectURL(b); state.avSeq = (state.avSeq || 0) + 1; mySpan = { seq: -1, v: null, busy: false }; /* 새 아바타는 바로 사람 위치를 다시 읽어 눈금·크기에 적용 */ state.who = 'me'; ui.bodyTab = 'me'; ui.view = 'me'; /* 13차: 피팅룸 보기 탭 강조도 내 아바타로 */ save(); render(); avSetup('front', b); }); }).catch(function (err) { toast((err && err.message) || '이미지를 저장하지 못했어요.'); }); }
  /* ▲ */
  /* pc.js 3056행(옆·뒷모습 사진 파일을 고른 뒤)과 같은 저장. PC 는 파일 칸의 change 처리 안에 있어 그대로 떼지 못해 함수로 씀 */
  function avatarAng(kind, fl) { var av = kind.slice(7); Core.shrink(fl, 2000, 0.92).then(normAvatar).then(function (b) { return blobPut(kind, b).then(function () { if (urls.ang[av]) URL.revokeObjectURL(urls.ang[av]); urls.ang[av] = URL.createObjectURL(b); state.avAngSeq = state.avAngSeq || {}; state.avAngSeq[av] = (state.avAngSeq[av] || 0) + 1; save(); render(); avSetup(av, b); }); }).catch(function (err) { toast((err && err.message) || '이미지를 저장하지 못했어요.'); }); }

  /* ---------- 핏 계산 (공통 파일 fit-engine.js 를 PC 와 같은 방법으로 부른다) ---------- */
  /* ▼ pc.js 710~712행 그대로 */
  function evalOne(it, size) {
    try { return E.evaluate({ profile: prof(), items: [{ cat: engCat(it.cat), garment: it, size: size || null, ref: null }] }, cfgNow()).results[0] || null; } catch (e) { return null; }
  }
  /* ▲ */
  /* ▼ pc.js 713~762행 그대로 */
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
  /* ▲ */
  /* ▼ pc.js 1767~1774행 그대로 */
  var HEM_OPTS = [['auto', '기본'], ['above', '짧게'], ['foot', '길게'], ['floor', '바닥']];
  function hemFootOk(it, r, len) {
    var ek = it.ext && it.ext.kind; if (ek === 'shorts' || ek === 'skirt') return false;
    var keys = r.current.parts.map(function (p) { return p.key; });
    if (keys.indexOf('length') >= 0 && keys.indexOf('inseam') < 0) return false;
    return !(isFinite(len.leg) && len.leg < -6);
  }
  function hemNow() { var v = state.hemTo; return HEM_OPTS.some(function (o) { return o[0] === v; }) ? v : 'auto'; }
  /* ▲ */
  /* ▼ pc.js 1779~1785행 그대로 */
  function styleOf(roles) {
    var st = {}, has = function (r) { return roles.indexOf(r) >= 0; };
    if (has('outer')) st.outer = 'open'; /* 2026-11-18 잠그기 선택 삭제: 겉옷은 항상 열어 입힘(예전에 저장된 closed 값은 무시) */
    if (has('bottom')) st.belt = state.beltUse === 'on' ? 'on' : 'off';
    /* 2026-11-18 넣기/빼기 선택 삭제: tuck 은 보내지 않음(그림이 알아서) */
    return Object.keys(st).length ? st : null;
  }
  /* ▲ */
  /* ▼ pc.js 1843~1845행 그대로 */
  function curSize(it) { var s = state.sel[it.cat], f; return (s && s.id === it.id && s.size) || (((f = fitHint(it)) && f.size) || ''); }
  /* 입은 그림을 만들 때 쓴 사이즈(2026-11-10부터 기록). 예전 그림은 기록이 없다 */
  function madeSizes(key) { return (state.lookSize && state.lookSize[key]) || null; }
  /* ▲ */
  /* 핏 서랍(C5)에 쓰는 PC 피팅룸 핏 칸의 판정·이름·표 계산 */
  /* ▼ pc.js 140행 그대로 */
  var GIDX = { tightBad: 0, tight: 1, fit: 2, loose: 3, over: 4 };
  /* ▲ */
  /* ▼ pc.js 196행 그대로 */
  function sgn(n) { return (n >= 0 ? '+' : '') + n; }
  /* ▲ */
  /* ▼ pc.js 1808~1809행 그대로 */
  var FSTYLE = [['tight', 'Slim', '타이트'], ['fit', 'Regular', '정핏'], ['loose', 'Loose', '여유'], ['over', 'Oversized', '오버핏']];
  var CMP_COLS = { outer: ['shoulder', 'chest', 'sleeve', 'length'], inner: ['shoulder', 'chest', 'sleeve', 'length'], top: ['shoulder', 'chest', 'sleeve', 'length'], bottom: ['waist', 'hip', 'thigh', 'inseam', 'length'], dress: ['shoulder', 'chest', 'waist', 'sleeve', 'length'], shoe: ['inner'] };
  /* ▲ */
  /* ▼ pc.js 1811~1814행 그대로 */
  function fieldLabel(it, k) {
    var f = (FIELDS[it.cat] || []).filter(function (x) { return x[0] === k; })[0], t = f ? f[1] : k;
    return it.measureType === 'circ' ? t.replace('단면', '둘레') : t;
  }
  /* ▲ */
  /* ▼ pc.js 1818~1826행 그대로 */
  function imgCols(it) {
    if (!it || it.cat === 'shoe' || !window.FitNotes || !FitNotes.okTable || !FitNotes.okTable(it.table)) return null;
    var t; try { t = FitNotes.tblSync(it, FIELDS[it.cat]); } catch (e) { return null; }
    var o = { name: {}, conv: {}, ci: {}, rows: {} };
    t.keys.forEach(function (k, i) { var nm = String(t.head[i] == null ? '' : t.head[i]).trim(); if (k && nm && o.ci[k] == null) { o.ci[k] = i; o.name[k] = nm; o.conv[k] = t.conv[i]; } });
    t.rows.forEach(function (r) { var l = String(r[0]); if (!(l in o.rows)) o.rows[l] = r; });
    return o;
  }
  function partName(ic, p) { return (ic && ic.name[p.key]) || p.label; }
  /* ▲ */
  /* ▼ pc.js 1829~1834행 그대로 */
  function cmpCell(ic, it, row, k, n, unit) {
    if (!ic || ic.ci[k] == null) return [fieldLabel(it, k), n + unit];
    var r = ic.rows[String(row.label)], cell = r ? String(r[ic.ci[k] + 1] == null ? '' : r[ic.ci[k] + 1]).trim() : '', cv = ic.conv[k];
    if (!cell) return [ic.name[k], n + unit];
    return [ic.name[k], !cv || cv[0] === 1 || cv[0] === 2 ? cell + unit : cell + ' (' + n + unit + ')'];
  }
  /* ▲ */
  /* ▼ pc.js 1836~1842행 그대로 */
  function sizeState(e) {
    if (!E.num(prof().height) || !e || !e.parts || !e.parts.length) return ['s-none', '측정 정보 부족'];
    var tight = e.parts.some(isTight), loose = e.parts.some(isLoose);
    return tight ? ['s-tight', '쪼일 수 있음'] : loose ? ['s-loose', '오버핏일 수 있음'] : /* 2026-11-19 최종 검토 3차 용어 통일: 판정 근거가 핏 등급 「쪼임」·「오버핏」이라 같은 이름으로(「타이트」·「여유」는 그보다 한 칸 안쪽 등급 이름이라 섞여 보였음) */ e.labelEst ? ['s-check', '확인 필요'] : ['s-ok', '적합'];
  }
  function isTight(p) { return p.kind === 'circ' ? p.gradeIdx === 0 : p.gradeKey === 'tightBad'; }
  function isLoose(p) { return p.kind === 'circ' ? p.gradeIdx === 4 : p.gradeKey === 'over'; }
  /* ▲ */
  /* ▼ pc.js 1866~1877행 그대로 */
  function fitVerdict(fr) {
    var res = fr.results, out = { cls: 's-none', st: '측정 정보 부족', b: '옷을 골라 주세요', why: '왼쪽에서 입어볼 옷을 담으면 결과가 나옵니다.' };
    if (!res.length) return out;
    var cur = res.filter(function (r) { return r.current; }), tight = [], loose = [];
    cur.forEach(function (r) { var ic = imgCols(r.garment); r.current.parts.forEach(function (p) { if (isTight(p)) tight.push(r.garment.name + ' ' + partName(ic, p)); else if (isLoose(p)) loose.push(r.garment.name + ' ' + partName(ic, p)); }); });
    if (!E.num(prof().height)) return { cls: 's-none', st: '측정 정보 부족', b: '내 몸 정보가 필요해요', why: '키와 몸무게를 넣으면 핏을 계산해 드려요.' };
    if (!cur.length || !cur.some(function (r) { return r.current.parts && r.current.parts.length; })) return { cls: 's-none', st: '측정 정보 부족', b: '실측값이 필요해요', why: '내 옷장에서 사이즈표를 넣어 주세요.' };
    if (tight.length) return { cls: 's-tight', st: '쪼일 수 있음', b: '조금 작아요', why: tight.join(', ') + ' 부분이 작아요.' };
    if (loose.length) return { cls: 's-loose', st: '오버핏일 수 있음', b: '조금 커요', why: loose.join(', ') + ' 부분이 많이 남아요.' };
    if (cur.some(function (r) { return r.current.labelEst; })) return { cls: 's-check', st: '확인 필요', b: '맞을 것 같아요', why: '실측표가 없는 옷은 표준 치수로 추정했어요. 실측표를 넣으면 정확해져요.' };
    return { cls: 's-ok', st: '적합', b: '잘 맞아요', why: fr.note || '고른 옷 모두 몸에 맞아요.' };
  }
  /* ▲ */

  /* ---------- 입히기 (PC 와 같은 서버 요청·같은 결과 정리. 화면 쪽 waitStart·waitEnd·genFinish 만 아래에 모바일로) ---------- */
  /* ▼ pc.js 765~843행 그대로 */
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
  /* ▲ */
  /* ▼ pc.js 908~912행 그대로 */
  function ensureNotifyPermission() { if (typeof Notification !== 'undefined' && Notification.permission === 'default') { try { Notification.requestPermission(); } catch (e) {} } }
  function notifyDone(title, body) {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || document.visibilityState === 'visible') return;
    try { var n = new Notification(title, { body: body, icon: 'assets/icons/icon-192.png', tag: 'fiton-tryon' }); n.onclick = function () { try { window.focus(); } catch (e) {} n.close(); }; } catch (e) {}
  }
  /* ▲ */
  /* ▼ pc.js 971~1450행 그대로 */
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
        var why = String(j.error || '').slice(0, 200), sbF = subNow(); if (sbF.used > 0) sbF.used--; save(); /* 2026-11-20 서버가 만들지 못했으면 사용자 잘못이 아니므로 횟수를 돌려준다 */
        genFinish(id, false, '입은 모습을 만들지 못했어요. 횟수는 돌려 드렸어요.' + (why ? ' (사유: ' + why + ')' : ' 잠시 뒤 다시 시도해 주세요.'), why ? 15000 : 0);
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
      if (j.status === 'failed') { var why2 = String(j.error || '').slice(0, 200), sbF2 = subNow(); if (sbF2.used > 0) sbF2.used--; save(); angDone(job, false, ANG_NAME[job.view] + '을 만들지 못했어요. 횟수는 돌려 드렸어요.' + (why2 ? ' (사유: ' + why2 + ')' : ' 잠시 뒤 다시 시도해 주세요.')); return; }
      setTimeout(function () { angPoll(job, avB); }, 4000);
    }).catch(function () { setTimeout(function () { angPoll(job, avB); }, 6000); });
  }
  function angDone(job, ok, msg) {
    if (angBusy !== job) return;
    angBusy = null;
    var o = angLoad(); o.cur = null; angSave(o);
    if (ok && ui.page === 'fitting') { ui.view = curView(); ui.angle = job.view; }
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
  /* ▲ */
  /* pc.js 1451~1464행(genFinish)의 저장·상태 처리는 그대로. 다른 점: 피팅룸으로 옮김(옷 확인을 쓰는 중이면 옮기지 않음), 완성 연출(revealShow) 대신 안내 글,
     실패는 피팅룸 서랍의 실패 칸(C7)에 보이므로 피팅룸에서는 안내 글을 겹쳐 띄우지 않는다 */
  function genFinish(id, ok, msg, ms) {
    genPending = null;
    setTimeout(angNext, 0);
    try { localStorage.removeItem(GEN_KEY()); } catch (e) {}
    waitEnd(); ui.fit = false; ui.fitSz = false;
    ui.genErr = ok ? null : (msg || '알 수 없는 이유로 실패했어요. 잠시 뒤 다시 시도해 주세요.');
    if (ok) {
      lookItems(id).forEach(selectItem); save(); ui.view = curView(); ui.slotsOpen = false; ui.pick = null; ui.angle = 'front';
      if (ui.page !== 'fit' && !ui.cf) go('fit');
    }
    if (msg && (ok || ui.page !== 'fit' || ui.cf)) toast(msg, ms || (ok ? 4000 : 0));
    render();
  }
  /* ▼ pc.js 1465~1476행 그대로 */
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
  /* ▲ */
  /* ▼ pc.js 1479~1500행 그대로 */
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
  /* ▲ */
  /* pc.js 1501~1519행(waitStart·waitEnd)과 같은 글·같은 진행 막대 계산. 화면 전체를 덮는 창 대신 홈 서랍(C3)에 보인다 */
  function waitStart(name, size, resume, notes) {
    waitEnd();
    ui.genWait = { name: name, size: size, notes: notes, resume: !!resume, t0: Date.now() };
    waitT = setInterval(waitTick, 500);
    render();
  }
  function waitPct(g) { return (90 * (1 - Math.exp(-(Date.now() - g.t0) / 40000))).toFixed(1); }
  function waitMsg(g) { var el = Date.now() - g.t0; return WAIT_MSGS[el < 500 ? (g.resume ? 1 : 0) : Math.min(WAIT_MSGS.length - 1, 1 + Math.floor(el / 25000))] + '…'; }
  function waitTick() {
    var g = ui.genWait; if (!g) return;
    var m = document.getElementById('gmsg'), b = document.getElementById('gbar');
    if (m) m.textContent = waitMsg(g);
    if (b) b.style.width = waitPct(g) + '%';
    var cards = app.querySelectorAll('.wcard'), dots = app.querySelectorAll('.wdots i'), n = cards.length, k = n ? Math.floor((Date.now() - g.t0) / 7000) % n : 0;
    Array.prototype.forEach.call(cards, function (c, i) { c.classList.toggle('on', i === k); });
    Array.prototype.forEach.call(dots, function (c, i) { c.classList.toggle('on', i === k); });
  }
  function waitEnd() { if (waitT) { clearInterval(waitT); waitT = null; } if (noteT) { clearInterval(noteT); noteT = null; } ui.genWait = null; }

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
  /* pc.js 1565~1571행(enterApp)에서 PC 전용(옷 입력 칸)을 뺌. 입히기 이어받기(genResume)는 4단계부터 — 사진을 다 읽은 뒤에(결과를 urls.tryon 에 넣으므로) */
  function enterApp() {
    ui.lg = { mode: 'list', id: null, err: '', fails: 0, until: 0 }; ui.mediaReady = false;
    clearUrls(); render();
    loadMedia().then(function () { ui.mediaReady = true; render(); genResume(); angResume(); }); /* PC enterApp 과 같이 옆·뒤 만들기도 이어받음 */
  }
  /* 로그아웃·로그인 만료: 기다리던 입히기는 이 화면에서 멈춘다(기기에 남은 기록 fit-gen-pending 은 그대로 두어 다시 로그인하면 6분 안이면 이어받음) */
  function genStop() { genPending = null; angBusy = null; waitEnd(); ui.genErr = null; ui.pick = null; ui.slotsOpen = false; ui.buy = false; ui.fit = false; ui.fitSz = false; ui.itm = null; }
  /* ---------- 계정: 로그인한 뒤 서버 내용 받기 ---------- */
  function mediaAgain() { var uid = user && user.id; return loadMedia().then(function () { if (user && user.id === uid) { ui.mediaReady = true; syncDraw(); } }); }
  function pullBlobs() { Sync.blobSync(true).catch(function () {}); } /* 다 받으면 Sync.on 의 blobs 가 불린다 */
  /* 로그인·가입 직후: 먼저 서버 내용을 받고(받기 전에는 저장하지 않는다) → 서버에 내용이 있으면 바로 홈, 없으면 처음 실행 단계 */
  function afterAuth() {
    user = acctUser(); if (!user) return;
    ui.au = { mode: '', err: '', busy: false, email: '', agree: false, note: '' }; ui.wait = '내 자료를 불러오는 중…'; ui.onb = 0; ui.imp = ''; ui.impSet = false; ui.cf = null; state = null; render();
    Sync.pull().then(function (r) {
      if (!user) return;
      ui.wait = '';
      if (r.empty && !Sync.hasLocal()) {
        state = blankState(); state.kindV = 2; /* pc.js lgCreate 와 같은 새 내용. 저장은 치수를 넣거나 가져오기를 고른 뒤에 */
        if (impAny()) ui.imp = 'ask'; else ui.onb = 1;
        ui.page = 'intro'; enterApp(); return;
      }
      state = load(); ui.page = 'intro'; if (location.hash && location.hash !== '#intro') location.hash = '#intro'; /* 2026-11-23 로그인하면 소개(홈)부터 */
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
  var SVG ={ alb: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M3 16l5-5 4 4 3-3 6 6"></path><circle cx="9" cy="9" r="1.5"></circle></svg>', cam: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"></path><circle cx="12" cy="13" r="3.5"></circle></svg>', pst: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="12" height="17" rx="2"></rect><path d="M9 4V3h6v1M9 10h6M9 14h6"></path></svg>' };
  function bgUrl(u) { return 'background-image:url(&quot;' + h(String(u).replace(/["\\\n\r]/g, encodeURIComponent)) + '&quot;)'; }
  /* 2026-11-21 쇼츠형: 아래 탭 대신 사진 오른쪽 둥근 버튼(목업 v4). 핏 = 내 모습 화면의 핏 창, 나머지 = 아래에서 올라오는 창 */
  var RAIL = [['closet', '옷장', IC[1]], ['fit', '핏', '<path d="M4 7h16M4 12h16M4 17h10"></path>'], ['me', '내 몸', IC[4]], ['history', '기록', IC[3]],
    ['set', '설정', '<circle cx="12" cy="12" r="3.2"></circle><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"></path>']];
  /* 2026-11-23 사용자 지시(1 A): 위 버튼을 뺀 뒤 피팅룸(내 모습, #fit) 들어가는 곳 = 오른쪽 둥근 버튼 맨 위. 피팅룸 안에서는 같은 자리가 「코디」(#home). 옷은 넣지 않고 화면만 옮김 */
  var ROOM_IC = { fit: '<path d="M10 6.5a2 2 0 1 1 2.6 1.9c-.4.1-.6.5-.6.9V10.5"></path><path d="M12 10.5L3.5 16.5a1 1 0 0 0 .6 1.8h15.8a1 1 0 0 0 .6-1.8z"></path>', home: '<rect x="4" y="4" width="7" height="7" rx="1.5"></rect><rect x="13" y="4" width="7" height="7" rx="1.5"></rect><rect x="4" y="13" width="7" height="7" rx="1.5"></rect><rect x="13" y="13" width="7" height="7" rx="1.5"></rect>' };
  function railHtml() {
    var cur = ui.fit ? 'fit' : ui.page === 'fit' ? '' : ui.page; /* 핏 = 핏 창이 열렸을 때만(내 모습 화면 이름도 fit 이라 따로 봄) */
    var to = ui.page === 'fit' ? 'home' : 'fit';
    return '<nav class="rail" aria-label="메뉴"><button type="button" data-act="rail" data-v="room"><i><svg viewBox="0 0 24 24" aria-hidden="true">' + ROOM_IC[to] + '</svg></i><span>' + (to === 'fit' ? '피팅룸' : '코디') + '</span></button>' + RAIL.map(function (r) {
      var on = cur === r[0];
      return '<button type="button" class="' + (on ? 'on' : '') + '" data-act="rail" data-v="' + r[0] + '"' + (on ? ' aria-current="true"' : '') + '><i><svg viewBox="0 0 24 24" aria-hidden="true">' + r[2] + '</svg></i><span>' + r[1] + '</span></button>';
    }).join('') + '</nav>';
  }
  function modesHtml() {
    return '<div class="modes" role="group" aria-label="보기">' + [['home', '추천 코디'], ['fit', '내 모습']].map(function (m) { var on = ui.page === m[0]; return '<button type="button" class="' + (on ? 'on' : '') + '" aria-pressed="' + on + '" data-act="go" data-page="' + m[0] + '">' + m[1] + '</button>'; }).join('') + '</div>';
  }
  /* 화면 가득 사진(전신이 다 보이게: 뒤는 같은 사진을 흐리게, 앞은 잘리지 않게) + 위 줄·보기 고르기·오른쪽 버튼·왼쪽 아래 안내 + 아래 흰 카드 */
  function shortsHtml(pic, alt, foot, card) {
    return '<div class="sv"><div class="bg" style="' + bgUrl(pic) + '"></div><div class="stage"><div class="ph" role="img" aria-label="' + h(alt) + '" style="' + bgUrl(pic) + '"></div><div class="shade"></div>' +
      '<header class="top stop"><div class="tl"><button type="button" class="hbtn" data-act="go" data-page="intro" aria-label="홈(FITON 소개)으로"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC[0] + '</svg></button>' + LOGO + '</div>' + topPills() + '</header>' + railHtml() + /* 2026-11-23 사용자 지시: 위 「추천 코디 / 내 모습」 버튼만 뺌(화면·기능은 그대로) */
      '<div class="sfoot"><button type="button" class="zoombtn" data-act="homeZoom" aria-label="사진 크게 보기">⤢</button>' + (foot || '') + '</div></div>' +
      (card ? '<div class="sheet">' + card + '</div>' : '') + '</div>';
  }
  /* 창(옷장·기록·내 몸·설정·요금제): 뒤에 돌아갈 화면을 그대로 두고 아래에서 올라옴. 내용은 예전 화면 그대로.
     2026-11-23 사용자 지시 「창을 띄워도 위 줄 내용은 항상 같게」: 뒤 화면을 사진만이 아니라 위 줄(홈·FITON·내 아바타·남은)·보기 고르기까지 그대로(핏 창과 같음). 뒤 화면은 누를 수 없게 inert */
  var PANELS = { closet: '내 옷장', history: '입어본 기록', me: '내 몸', plan: '요금제', set: '설정' };
  function panelWrap(p, inner) {
    var b = ui.base === 'home' || ui.base === 'intro' ? ui.base : 'fit', p0 = ui.page, f0 = ui.fit, back;
    ui.page = b; ui.fit = false;
    try { back = b === 'intro' ? viewIntro() : b === 'home' ? viewHome() : viewFit(); } finally { ui.page = p0; ui.fit = f0; }
    return '<div class="pbase" aria-hidden="true" inert>' + back + '</div>' +
      '<div class="dim" data-act="panelClose"></div><section class="panel" role="dialog" aria-label="' + PANELS[p] + '"><div class="grab" aria-hidden="true"></div><button type="button" class="pclose" data-act="panelClose">닫기 ✕</button>' + inner + '</section>';
  }
  /* 옷 넣기 창(목업 B2): 내 모습 옷 칸의 「새 옷 넣기」·빈 내 모습에서 연다. 고르면 「옷 확인」(B3)으로 */
  function plusHtml() {
    if (!ui.plus) return '';
    return '<div class="dim dp" data-act="plusClose"></div><div class="pop" role="dialog" aria-label="옷 사진 넣기"><h2>옷 사진 넣기</h2><p class="p">옷 사진이나 쇼핑 화면 캡처를 넣으면 종류·이름·가격·사이즈 표를 읽어요</p>' +
      '<button type="button" class="pick" data-act="addPick" data-v="album">' + SVG.alb + '앨범에서 고르기<small>캡처·저장한 사진</small></button>' +
      '<button type="button" class="pick" data-act="addPick" data-v="camera">' + SVG.cam + '카메라로 찍기<small>가진 옷</small></button>' +
      '<button type="button" class="pick" data-act="addPick" data-v="paste">' + SVG.pst + '붙여넣기<small>복사한 그림</small></button></div>';
  }
  function subTop(title) { return '<header class="top"><h1>' + title + '</h1></header>'; } /* 창 위 「닫기」로 닫음 */

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
  /* 2026-11-23 가져올 수 있는 예전 자료: 닉네임+PIN 프로필 + 이 브라우저에 남은 다른 계정(11-22 서버를 바꾸기 전 계정 등). PC(pc.js 계정 덩어리)와 같은 글 */
  function oldAccs() { return Sync && Sync.oldAccounts ? Sync.oldAccounts() : []; }
  function impAny() { return Core.readUsers().length > 0 || oldAccs().length > 0; }
  function accLabel(o) {
    var d = o.at ? new Date(o.at) : null;
    return '예전 계정 자료 · 옷 ' + o.closet + '벌' + (o.height ? ' · ' + (o.gender === 'male' ? '남성 ' : '여성 ') + o.height + 'cm' : '') + (d ? ' · ' + (d.getMonth() + 1) + '/' + d.getDate() + ' 저장' : '');
  }
  function viewImport() {
    var lg = ui.lg;
    if (ui.imp === 'pin') {
      var u = Core.userById(lg.id);
      return '<header class="top"><button type="button" class="back" data-act="impBack">‹ 뒤로</button></header><main class="body"><h1 class="h s">PIN 입력</h1><div class="who2">' + (u ? dot(u) + '<b>' + h(u.nick) + '</b>' : '') + '</div>' +
        '<div class="one"><label for="lgpin">PIN 4자리<span class="in"><input type="password" id="lgpin" inputmode="numeric" maxlength="4" autocomplete="off" autofocus></span></label></div>' +
        '<p class="p">그 프로필을 만들 때 정한 PIN이에요. 5번 틀리면 30초 동안 잠깁니다.</p><div class="err" id="lgerr" role="alert">' + h(lg.err) + '</div></main>' +
        '<div class="foot"><button type="button" class="btn" data-act="impGo">가져오기</button></div>';
    }
    return '<header class="top">' + LOGO + '</header><main class="body"><h1 class="h s">이 기기에 있던 자료를 가져올까요?</h1><p class="p">이 브라우저에 예전에 쓰던 프로필이나 계정 자료가 있어요. 고르면 그 자료의 치수·아바타·옷장·기록을 내 계정에 옮겨 담아요. 원래 자료는 그대로 남아요.</p>' +
      (ui.impSet ? '<p class="p" style="color:var(--pri)">지금 계정에 있는 치수·옷장·기록은 고른 자료의 내용으로 바뀌어요(PC 에서도 바뀝니다).</p>' : '') + '<div class="ulist">' +
      Core.readUsers().map(function (u) { return '<button type="button" class="ubtn" data-act="impPick" data-id="' + h(u.id) + '">' + dot(u) + h(u.nick) + '</button>'; }).join('') +
      oldAccs().map(function (o) { return '<button type="button" class="ubtn" data-act="impAcc" data-id="' + h(o.id) + '">' + h(accLabel(o)) + '</button>'; }).join('') + '</div></main>' +
      '<div class="foot"><button type="button" class="btn ghost" data-act="impSkip">' + (ui.impSet ? '가져오지 않고 돌아가기' : '가져오지 않고 새로 시작') + '</button></div>';
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
      '<div class="card col"><b style="font-size:16px">내 아바타</b><p class="p">방금 넣은 내 치수로 입어봐요. 아바타 사진이 없으면 기본 캐릭터 사진에 내 치수로 입혀 드려요.</p><div class="row"><button type="button" class="btn ghost sm" data-act="' + (window.AvatarMake ? 'avMake' : 'soon') + '">아바타 만들기</button><button type="button" class="btn sm" data-act="onbMe">사진 없이 시작</button></div></div>' +
      '<div class="sec"><h2 style="font-size:16px">기본 모델로 시작</h2><span>나중에 바꿀 수 있어요</span></div><p class="p">기본 모델은 그 모델의 치수로 입어봐요. 내 아바타와 내 치수는 바뀌지 않아요.</p>' + modelsHtml(cur, 'onbPick') + '</main>' +
      '<div class="foot"><button type="button" class="btn ghost" data-act="onbStart" data-id="' + h(cur) + '">이 모델로 시작</button></div>';
  }

  /* ---------- 홈 (목업 B1·C1: 전신이 다 보이는 사진 칸 + 아래 서랍) ---------- */
  var POS_BG = { 'p-top': ';background-position:50% 28%', 'p-low': ';background-position:50% 72%', 'p-foot': ';background-position:50% 100%', 'p-mid': ';background-position:50% 45%' }; /* 옷 칸 사진 위치: 옷장 카드(posOf)와 같은 값 */
  /* 홈 사진 칸에 보일 그림: 지금 고른 옷 조합으로 지금 캐릭터에 만든 입은 모습(wornNow = PC 피팅룸과 같은 기준)이 있으면 그것, 없으면 캐릭터 그대로 */
  function homePic() { var wn = wornNow(), av = wn ? homeAng(wn) : 'front'; if (av !== 'front') return { url: urls.angTry[av][wn.key], alt: wn.name + ' 입은 ' + ANG_NAME[av], worn: wn }; return wn ? { url: wn.url, alt: wn.name + ' 입은 모습', worn: wn } :{ url: avatarShow(), alt: (who() === 'base' ? baseModel().name + ' 기본 모델' : '내 아바타') + ' 전신', worn: null }; }
  var SLOT_CATS = ['outer', 'inner', 'top', 'bottom', 'dress', 'shoe'];
  function slotsHtml() {
    return '<div class="slots s6">' + SLOT_CATS.map(function (c) {
      var it = got(c), lab = CATS[c] + (it ? ' ' + h(it.name) + ', 바꾸기' : ' 고르기');
      if (it && it.photo) return '<button type="button" class="slot has" data-act="slotPick" data-cat="' + c + '" style="' + bgUrl(it.photo) + (POS_BG[posOf(it)] || '') + '" aria-label="' + lab + '"><span>' + CATS[c] + '</span></button>';
      return '<button type="button" class="slot' + (it ? ' has' : '') + '" data-act="slotPick" data-cat="' + c + '" aria-label="' + lab + '">' + (it ? '' : '＋') + '<span>' + CATS[c] + '</span></button>';
    }).join('') + '</div>';
  }
  /* 방향(목업 C1·C4). C1 = 만들 방향 고르기(PC 실행 칸의 genView 와 같은 값 state.genViews, 방향마다 1회. 사진이 없는 방향은 흐리게 + 이유 = PC angWhy).
     C4 = 볼 방향(만든 그림이 있는 방향만. 만드는 중이면 「만드는 중」). 옆·뒤 만들기·저장은 PC 코드(wearAll·angNext·angPoll) 그대로 */
  var DIRS = [['front', '앞', '앞모습'], ['side', '옆', '옆모습'], ['back', '뒤', '뒷모습']];
  function homeAng(wn) { var v = ui.angle; return v !== 'front' && wn && angTryOk(v, wn.key) ? v : 'front'; }
  function dirsHtml(see, wn) {
    var gv = genViews(), cur = see ? homeAng(wn) : '';
    return '<div class="dirs" role="group" aria-label="' + (see ? '보는 방향' : '만들 방향') + '"><span>' + (see ? '보기' : '방향') + '</span><div class="seg">' + DIRS.map(function (d) {
      var v = d[0], on, ok, why = '';
      if (see) { ok = v === 'front' || angTryOk(v, wn.key); on = v === cur; if (!ok) why = angBusy && angBusy.view === v && angBusy.key === wn.key ? 'busy' : 'none'; }
      else { ok = v === 'front' || !!angSrc(v); on = ok && gv.indexOf(v) >= 0; }
      return '<button type="button" class="' + (on ? 'on' : ok ? '' : 'dis') + '" aria-pressed="' + on + '" data-act="' + (see ? 'angPick' : 'genView') + '" data-v="' + v + '"' + (why ? ' data-why="' + why + '"' : '') + '>' + (on && !see ? '✓ ' : '') + d[see ? 2 : 1] + (why === 'busy' ? '…' : '') + '</button>';
    }).join('') + '</div></div>';
  }
  /* 입은 모습 아래 한 줄: 만들 때 사이즈. 신발·사이즈가 지금 고른 것과 다르면 다시 입히라고(pc.js 1846~1865행 stageStatus 와 같은 판단·같은 문구) */
  function wornNote(wn, set) {
    if (state.lookShoe && state.lookShoe[wn.key] && set.length && set[0].cat !== 'shoe' && state.lookShoe[wn.key] !== shoeSig()) return { warn: true, t: '신발이 바뀌었어요. 지금 보이는 그림은 예전 신발로 만든 거예요. 다시 입혀야 고른 신발이 그림에 반영돼요.' };
    var ms = madeSizes(wn.key), its = lookItems(wn.key), multi = its.length > 1;
    if (!ms) return { warn: false, t: wn.name + ' · 만들 때 사이즈 기록 없음' };
    var t = wn.name + ' · 만들 때 사이즈 ' + its.map(function (x) { return (multi ? CATS[x.cat] + ' ' : '') + (ms[x.id] || '?'); }).join(', ');
    if (its.some(function (x) { return ms[x.id] && curSize(x) && ms[x.id] !== curSize(x); })) return { warn: true, t: t + ' — 지금 고른 사이즈와 달라요. 다시 입혀야 그림에 반영돼요.' };
    return { warn: false, t: t };
  }
  /* C5 핏 서랍 내용. 계산·판정·문구는 PC 피팅룸 핏 칸(pc.js 1878~1972행 viewFitting 의 fitcard·사이즈 비교)과 같다.
     PC 와 다른 점: 옷 탭은 2벌 이상일 때만, 고른 사이즈를 큰 글자로(목업 C5), 사이즈 비교는 「다른 사이즈로 보기」를 눌러 펼침, 구매하기는 홈의 구매 창(buyOpen) */
  function fitSheet() {
  /* ▼ pc.js 1879행 그대로 */
    var fr = fitResults(); fr.results = (fr.results || []).filter(function (r) { return r.cat !== 'shoe'; }); /* 2026-11-13 사용자 지시: 신발은 핏 내용(태그·탭·판정)에 넣지 않음 */
  /* ▲ */
    var res = fr.results;
    if (!res.length) return '<p class="p">신발은 핏을 계산하지 않아요. 옷을 함께 고르면 여기에서 옷의 핏을 볼 수 있어요.</p>';
  /* ▼ pc.js 1937~1944행 그대로 */
    var vd = fitVerdict(fr), active = res.filter(function (r) { return r.cat === ui.fitTab; })[0] || res[0] || null, parts = active && active.current ? active.current.parts : [];
    var names = BASE_CFG.gradeNames[active && active.cat === 'shoe' ? 'shoe' : 'body'];
    var aic = active ? imgCols(active.garment) : null;
    var partHtml = parts.map(function (p) {
      var idx = p.kind === 'circ' ? p.gradeIdx : GIDX[p.gradeKey], val2 = p.kind === 'circ' ? p.grade + ' ' + sgn(p.ease) + (p.unit || (active.cat === 'shoe' ? 'mm' : 'cm')) : p.text, pn = partName(aic, p);
      return '<div class="part"><div class="ph"><b>' + h(pn) + '</b><span class="muted">' + h(val2) + '</span></div><div class="segs" role="img" aria-label="' + h(pn + ' ' + val2) + '">' +
        [0, 1, 2, 3, 4].map(function (i) { return '<div class="seg' + (i === idx ? ' g-' + p.gradeKey : '') + '"></div>'; }).join('') + '</div></div>';
    }).join('');
  /* ▲ */
  /* ▼ pc.js 1946행 그대로 */
    var ag = active && active.garment, buy = '', buyNote = '';
  /* ▲ */
  /* ▼ pc.js 1964~1969행 그대로 */
      var unit = active.cat === 'shoe' ? 'mm' : 'cm';
      var szCards = (ag.sizes || []).map(function (row) {
        var e = (active.all || []).filter(function (x) { return x.size === row.label; })[0], st = sizeState(e), on = row.label === active.chosen, rec = row.label === active.recommended;
        return '<button type="button" class="szc' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="size" data-cat="' + active.cat + '" data-v="' + h(row.label) + '"><div class="szh"><b>' + h(row.label) + '</b>' + (on ? '<em>선택됨</em>' : rec ? '<em>추천</em>' : '') + '<span class="chip ' + st[0] + '">' + h(st[1]) + '</span></div>' +
          '<dl>' + (active.cat === 'shoe' && !E.num(row.inner) ? '<dt>표기 사이즈</dt><dd>' + h(row.label) + '</dd><dt>안쪽 길이 실측</dt><dd class="na">정보 없음</dd>' : (CMP_COLS[active.cat] || []).map(function (k) { var n = E.num(row[k]), c = n ? cmpCell(aic, ag, row, k, n, unit) : [aic && aic.name[k] || fieldLabel(ag, k)]; return '<dt>' + h(c[0]) + '</dt>' + (n ? '<dd>' + h(c[1]) + '</dd>' : '<dd class="na">정보 없음</dd>'); }).join('')) + '</dl></button>';
      }).join('');
  /* ▲ */
    var pref = (FSTYLE.filter(function (f) { return f[0] === (state.profile.pref || 'fit'); })[0] || FSTYLE[1])[2];
    var tabs = res.length > 1 ? '<div class="chips" role="tablist" aria-label="옷별 핏 보기">' + res.map(function (r) { var o = r === active; return '<button type="button" role="tab" aria-selected="' + o + '" class="chip' + (o ? ' on' : '') + '" data-act="fitTab" data-cat="' + r.cat + '">' + CATS[r.cat] + '</button>'; }).join('') + '</div>' : '';
    var ch = active.chosen ? String(active.chosen) : '', rc = active.recommended ? String(active.recommended) : '';
    return tabs +
      '<div class="size"><div class="L">' + (ch ? h(ch) : '–') + '</div><div><p>' + h(ag.name) + (rc ? ' · ' + (ch && ch !== rc ? '추천 ' + h(rc) : h(rc) + ' 추천') : '') + '</p><small>' + (who() === 'base' ? '기본 모델(' + h(baseModel().name) + ') 치수와 옷 실측으로 계산한 결과' : '내 몸 치수와 옷 실측으로 계산한 결과') + '</small></div></div>' +
      '<div class="verdict"><span class="chip ' + vd.cls + '">' + h(vd.st) + '</span><b>' + h(vd.b) + '</b><span class="muted">' + h(vd.why) + '</span></div>' +
      (parts.length ? '<div class="scale" aria-hidden="true">' + names.map(function (n) { return '<span>' + h(n) + '</span>'; }).join('') + '</div>' : '') +
      (active.current && active.current.labelEst ? '<p class="note">실측표가 없어 표준 치수로 추정했어요. 실측표를 넣으면 정확해져요.</p>' : '') + partHtml +
      (rc ? '<p class="note">추천 사이즈: <b>' + h(rc) + '</b> (핏 스타일 ' + h(pref) + ' 기준)</p>' : '') +
      '<button type="button" class="btn ghost sm" data-act="fitSz" aria-expanded="' + !!ui.fitSz + '">' + (ui.fitSz ? '사이즈 비교 닫기' : '다른 사이즈로 보기') + '</button>' + /* 구매하기는 핏 창 아래(결과 그림 저장 옆) */
      (ui.fitSz ? (szCards ? '<p class="note">누르면 그 사이즈로 바뀌어요. 그림은 다시 입혀야 바뀌어요.</p><div class="szrow">' + szCards + '</div>' : '<p class="note">이 옷은 사이즈 표가 없어요.</p>') : '') +
      '<p class="note">' + AI_NOTE + '</p>';
  }
  /* 7단계 사용자 지시: AI 옷 입기는 참고용이라는 안내. C4 입은 모습에 짧은 한 줄, 핏 서랍 맨 아래에 전체 문구(PC 「추정 결과이며 실제 착용감을 보장하지 않습니다」 대신) */
  var AI_SHORT = 'AI로 만든 그림이라 참고용이에요. 실제 옷과 다를 수 있어요.';
  var AI_NOTE = 'FITON의 AI 옷 입기는 AI로 만든 그림이라 참고용이에요. 실제 옷의 색·핏·길이·질감과 다를 수 있어요. 사이즈 추천은 입력한 치수와 옷 실측표로 계산한 추정이라 착용감을 보장하지 않아요. 구매 전에 쇼핑몰의 상품 정보를 꼭 확인해 주세요.';
  /* 위 줄 오른쪽: 지금 입어보는 쪽·남은 횟수(홈·피팅룸 같이) */
  /* 2026-11-23 사용자 지시: 위 줄 「내 아바타 ▾」 버튼은 카드의 「기본 모델/내 아바타」와 중복이라 뺌 */ function topPills() {
    var leftSay = unlimited() ? '이번 달 남은 횟수 제한 없음(시험 중)' : '이번 달 남은 횟수 ' + planNow().limit + '회 중 ' + tryLeft() + '회'; /* pc.js 1577행과 같은 문구 */
    return '<div class="pills"><button type="button" class="pill" data-act="go" data-page="plan" aria-label="' + leftSay + ', 요금제 보기">남은 <b>' + leftText() + '</b></button></div>';
  }
  /* 2026-11-21 쇼츠형 「추천 코디」(목업 v4 1번 = 옛 쇼츠 첫 화면): PC 홈 「이번 계절 코디」와 같은 목록(stylesIn). 그 계절 코디가 없으면 내 성별 코디 전체.
     「이 코디 … 입어보기」 = PC styleTry 와 같이 옷장에 넣고(importStyle) 옷 칸에 고른 뒤 내 모습에서 입히기(wearAll, 고른 방향마다 1회) */
  function lookList() { var L = stylesIn(); if (!L.length) L = FD.styles.filter(styleForMe); return L.filter(function (s) { return s.modelImage; }); }
  function curLook() { var L = lookList(), n = L.length; return n ? L[((ui.styleI % n) + n) % n] : null; }
  var LOOK_CATS = ['top', 'bottom', 'dress', 'shoe']; /* importStyle 이 옷 칸에 넣는 종류 */
  /* 2026-11-23 피팅룸(내 모습) 카드의 「기본 모델 / 내 아바타」. 값은 내 몸 창(bTab)·위 「내 아바타 ▾」와 같은 state.who */
  function whoSegHtml() {
    var w = who();
    return '<div class="seg who2" role="group" aria-label="누구에게 입힐까요">' + [['base', '기본 모델'], ['me', '내 아바타']].map(function (t) { var on = w === t[0]; return '<button type="button" class="' + (on ? 'on' : '') + '" aria-pressed="' + on + '" data-act="lookWho" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
  }
  function viewHome() {
    var L = lookList(), n = L.length, st = curLook(), w = who(), card;
    if (!st) {
      card = '<p class="big">추천 코디가 아직 없어요</p><p class="p">옷 사진이나 쇼핑 화면 캡처 1장이면 내 모습에서 입어볼 수 있어요</p><button type="button" class="btn" data-act="go" data-page="fit">내 모습에서 입어보기</button>';
      return shortsHtml(avatarShow(), (w === 'base' ? baseModel().name + ' 기본 모델' : '내 아바타') + ' 전신', '', card);
    }
    var i = ((ui.styleI % n) + n) % n;
    var items = LOOK_CATS.filter(function (c) { return st.items && st.items[c]; }).map(function (c) {
      var src = st.items[c], it = Object.assign({}, src, { cat: c, gender: src.gender || st.gender || 'female' }), r = evalOne(it, null);
      return '<span>' + h(shortName(it)) + (r && r.chosen ? ' <b>' + h(r.chosen) + '</b>' : '') + '</span>';
    }).join('');
    card = '<div class="lhead">' + (n > 1 ? '<button type="button" class="ar" data-act="lookMove" data-v="-1" aria-label="이전 코디">‹</button>' : '') +
      '<div class="lt"><b>' + h(st.title) + '</b><span>' + (st.priceText ? h(st.priceText) + ' · ' : '') + (i + 1) + '/' + n + '</span></div>' /* 2026-11-23 사용자 지시: 「· 올 가을 유행」 글 지움 */ +
      (n > 1 ? '<button type="button" class="ar" data-act="lookMove" data-v="1" aria-label="다음 코디">›</button>' : '') + '<button type="button" class="pill2" data-act="lookFit" aria-label="이 코디 핏 보기">핏 보기</button></div>' /* 2026-11-23 사용자 지시: 코디 이름 덜 잘리게 「핏 보기」로 줄임 */ +
      (items ? '<div class="litems">' + items + '</div>' : '') +
      /* 2026-11-23 사용자 지시: 버튼 이름은 「피팅룸」. 바로 입히지 않고 피팅룸(내 모습)으로 옷만 넣어 보냄. 기본 모델/내 아바타는 피팅룸 카드에서 고름. 「이 코디 핏 보기」는 위 코디 이름 줄 오른쪽 */
      '<button type="button" class="btn cta" data-act="lookWear">피팅룸</button>';
    return shortsHtml(st.modelImage, st.title + ' 기본 모델 착용 모습', '<span class="snote">기본 모델 착용 · AI 생성 이미지</span>', card);
  }
  /* 2026-11-23 사용자 지시: 「홈은 PC 버전 글을 넣어 FITON 이 무엇인지 알려 주는 화면, 피팅룸은 따로」. 글은 PC 홈(pc.js 1725~1727행)·소개(1552행) 그대로.
     사진 = 원본(지금 입어보는 쪽 전신)·입은 모습(가장 최근 입어본 모습, 없으면 추천 코디 모델 사진). 입어보기는 「피팅룸 들어가기」(추천 코디·내 모습)에서만 */
  function viewIntro() {
    var hl = ui.mediaReady ? histList().reverse() : [], st0 = lookList()[0] || null, wn = hl[0] && urls.tryon[hl[0].key];
    var after = wn ? { url: wn, alt: lookName(hl[0].key) + ' 입은 모습' } : st0 ? { url: st0.modelImage, alt: st0.title + ' 입은 모습' } : null;
    var pic = function (u, alt, lb, on) { return '<div class="ipic"><img src="' + h(u) + '" alt="' + h(alt) + '"><span' + (on ? ' class="on"' : '') + '>' + lb + '</span></div>'; };
    return '<div class="intro"><header class="top stop istop">' + LOGO /* 2026-11-23 사용자 지시: 소개 위 줄도 피팅룸과 같은 모양(반투명 어두운 막+흐림, 흰 글씨) */ + '<div class="pills"><button type="button" class="pill" data-act="go" data-page="set">설정</button></div></header>' +
      '<main class="body ibody"><div class="ipics' + (after ? '' : ' one') + '">' + pic(avatarShow(), (who() === 'base' ? baseModel().name + ' 기본 모델' : '내 아바타') + ' 전신', '원본', false) + (after ? pic(after.url, after.alt, '입은 모습', true) : '') + '</div>' +
      '<h1 class="h">입어보고 사는 온라인 쇼핑,<br><em>내 몸에 먼저 입혀 보세요</em></h1><p class="p">옷 사진 한 장이면 AI가 내 치수로 입혀 보고, 맞는 사이즈까지 알려 드려요.</p>' +
      '<ol class="isteps"><li><b>1</b>옷 사진 넣기</li><li><b>2</b>옷 종류 누르기</li><li><b>3</b>내 아바타로 확인</li></ol>' +
      '<p class="lsay">쇼츠에서 본 스타일, <em>바로 입어보기</em></p></main>' +
      '<div class="ifoot"><button type="button" class="btn cta" data-act="go" data-page="home">피팅룸 들어가기</button></div></div>';
  }
  /* 2026-11-21 쇼츠형 「내 모습」(목업 v4 2번): 예전 홈·피팅룸을 한 카드로. 입히는 중·실패·옷 없음·쓸어 내림은 예전 피팅룸과 같고,
     그 밖에는 이름·만들 때 사이즈·핏 한 줄·옷 칸 6개·만들 방향·구매하기·입어보기를 한 카드에. 옆·뒷모습 보기는 사진 왼쪽 아래(만든 방향만) */
  function viewFit() {
    var hp = homePic(), pic = hp.url, n = state.closet.length, set = wearSet(), wn = hp.worn, card, foot = '';
    if (wn && !genPending) {
      var angs = ANGS.filter(function (v) { return angTryOk(v, wn.key); }), cur = homeAng(wn);
      foot = angs.length ? '<div class="aview" role="group" aria-label="보는 방향">' + ['front'].concat(angs).map(function (v) { var on = v === cur; return '<button type="button" class="' + (on ? 'on' : '') + '" aria-pressed="' + on + '" data-act="angPick" data-v="' + v + '">' + ANG_NAME[v].replace('모습', '') + '</button>'; }).join('') + '</div>'
        : '<span class="snote">입은 모습 · AI 생성 · 참고용</span>';
    }
    if (genPending) {
      /* C3 입히는 중 */
      var g = ui.genWait || { name: lookName(genPending), size: '', notes: null, resume: true, t0: Date.now() };
      card = '<div class="gwait" role="status"><div class="ghead"><b id="gmsg">' + h(waitMsg(g)) + '</b><span>보통 1~2분</span></div><div class="gbar"><b id="gbar" style="width:' + waitPct(g) + '%"></b></div>' +
        '<p class="gname">' + h(g.name) + (g.size ? '<small>' + h(g.size) + '</small>' : '') + '</p><p class="p">다른 화면을 봐도 계속 만들어요. 다 되면 알려 드려요.</p>' + notesHtml(g.notes) + '</div>';
    } else if (ui.genErr) {
      /* C7 실패: 이유와 다음에 할 일 */
      card = '<div class="gerr" role="alert"><b>입혀 보지 못했어요</b><p>' + h(ui.genErr) + '</p><div class="row"><button type="button" class="btn ghost sm" data-act="errClose">닫기</button>' + (set.length ? '<button type="button" class="btn sm" data-act="wear">다시 시도</button>' : '') + '</div></div>';
    } else if (!n) {
      card = '<p class="big">입어볼 옷을 먼저 넣어 주세요</p><p class="p">쇼핑 화면 캡처나 옷 사진 1장이면 돼요</p><button type="button" class="btn" data-act="plus">＋ 옷 사진 넣기</button>' +
        '<button type="button" class="lk" data-act="go" data-page="home">추천 코디 입어보기</button>';
    } else if (ui.low) {
      /* 카드를 손가락으로 쓸어 내린 상태: 한 줄만 남기고 사진을 크게. 이 줄을 누르거나 위로 쓸면 다시 펼침 */
      card = '<button type="button" class="fitx" data-act="lowOff" aria-expanded="false" aria-label="카드 펼치기"><span class="fxbar" aria-hidden="true"></span><span class="fxrow"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"></path></svg>옷 고르고 입어보기</span></button>'; /* 2026-11-23 사용자 지시: 「⌃ 펼치기」 글자 버튼 대신 손잡이 줄 + 빨간 알약 버튼 */
    } else {
      var nt = wn ? wornNote(wn, set) : null, fitLine = '';
      if (set.length) { try { var fr = fitResults(); if (fr.results.length) { var vd = fitVerdict(fr); fitLine = '<p class="hfit">핏 <span class="chip ' + vd.cls + '">' + h(vd.st) + '</span><button type="button" class="more" data-act="fitOpen">자세히 ›</button></p>'; } } catch (e) {} }
      var uses = genViews().length;
      card = '<div class="grab" aria-hidden="true"></div>' +
        '<div class="fhead"><p class="ctitle">' + h(wn ? wn.name : set.length ? lookName(setKey(set)) : '입어볼 옷을 골라 주세요') + '</p>' + whoSegHtml() + '</div>' +
        (nt ? '<p class="wline' + (nt.warn ? ' warn' : '') + '">' + h(nt.t.indexOf(wn.name + ' · ') === 0 ? nt.t.slice(wn.name.length + 3) : nt.t) + '</p>' : '') + fitLine +
        '<p class="lbl">입을 옷 (누르면 옷장에서 고르기)</p>' + slotsHtml() +
        '<div class="drow">' + dirsHtml(false) + (wn ? '<button type="button" class="pill2" data-act="buyOpen">구매하기</button>' : '') + '</div>' +
        (angBusy ? '<p class="wline" role="status">' + h(ANG_NAME[angBusy.view]) + '을 만들고 있어요. 보통 1~2분, 다 되면 알려 드려요.</p>' : '') +
        '<button type="button" class="btn cta" data-act="wear"' + (angBusy ? ' disabled' : '') + '>' + (wn ? '다시 입어보기' : '입어보기') + '<small>' + (set.length ? (uses ? uses + '회 사용' : '방향을 골라 주세요') : '입을 옷을 먼저 골라 주세요') + '</small></button>' +
        (wn ? '<p class="ainote">' + AI_SHORT + '</p>' : '');
    }
    return shortsHtml(pic, hp.alt, foot, card) + (ui.fit ? fitPanel() : '');
  }
  /* 핏 창(목업 v4 4번): PC 피팅룸 오른쪽 핏 분석(fitSheet) + 허리띠(PC 옷 칸의 허리띠 줄, wearOpt 그대로) + 결과 그림 저장 · 구매하기 */
  function fitPanel() {
    var set = wearSet(), wn = wornNow(), belt = state.beltUse === 'on' ? 'on' : 'off';
    var nt = wn ? wornNote(wn, set) : null;
    return '<div class="dim" data-act="fitClose"></div><section class="panel fitp" role="dialog" aria-label="핏 자세히"><div class="grab" aria-hidden="true"></div><div class="top"><h1>핏 자세히</h1></div><button type="button" class="pclose" data-act="fitClose">닫기 ✕</button>' +
      '<div class="fitd" role="region" aria-label="핏 결과">' + (nt && nt.warn ? '<p class="wline warn">' + h(nt.t) + '</p>' : '') +
      (set.length ? fitSheet() : '<p class="p">입을 옷을 먼저 골라 주세요. 옷 칸에 옷을 넣으면 내 치수와 옷 실측으로 핏을 계산해요.</p>') +
      (got('bottom') ? '<div class="opt" role="group" aria-label="허리띠"><em>허리띠</em><div class="seg">' + [['off', '사용 안 함'], ['on', '사용']].map(function (o) { var on = belt === o[0]; return '<button type="button" class="' + (on ? 'on' : '') + '" aria-pressed="' + on + '" data-act="wearOpt" data-k="beltUse" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div></div><p class="note">허리띠는 다음에 입어볼 때 그림에 반영돼요.</p>' : '') +
      '</div><div class="pfoot"><button type="button" class="btn ghost" data-act="savePic">결과 그림 저장</button><button type="button" class="btn" data-act="buyOpen">구매하기</button></div></section>';
  }
  /* C2 옷 칸을 누르면: 그 종류만 모아 보여 주고, 누르면 바로 칸에 넣고 닫힘. 맨 앞은 새 옷 넣기. 고른 옷을 다시 누르면 뺌(PC 옷장 pickItem 과 같은 동작) */
  function pickHtml() {
    var c = ui.pick; if (!c || !CATS[c]) return '';
    var s = state.sel[c], list = state.closet.filter(function (x) { return x.cat === c; });
    return '<div class="dim dp" data-act="pickClose"></div><div class="pop pk" role="dialog" aria-label="' + CATS[c] + ' 고르기"><div class="pkh"><h2>' + CATS[c] + ' 고르기</h2><button type="button" class="x" data-act="pickClose">닫기 ✕</button></div><div class="pkgrid">' +
      '<button type="button" class="g pkn" data-act="pickNew"><div class="im"><span aria-hidden="true">＋</span></div><p>새 옷 넣기</p></button>' +
      list.map(function (it) {
        var on = !!(s && s.id === it.id), r = evalOne(it, on ? s.size : null);
        return '<button type="button" class="g' + (on ? ' sel' : '') + '" data-act="pickItem" data-id="' + h(it.id) + '" aria-pressed="' + on + '"><div class="im">' + (it.photo ? '<img src="' + h(it.photo) + '" alt="" loading="lazy" class="' + posOf(it) + '">' : '<span aria-hidden="true">' + SHIRT + '</span>') +
          (r && r.chosen ? '<span class="tag">' + h(r.chosen) + '</span>' : '') + (on ? '<span class="tag r">고름</span>' : '') + '</div><p>' + h(it.name) + '</p><small>' + (on ? '누르면 빼기' : it.kind === 'under' ? '사이즈 확인용' : r && r.chosen ? (who() === 'base' ? '모델' : '내') + ' 추천 ' + h(r.chosen) : '') + '</small></button>';
      }).join('') + '</div>' + (list.length ? '' : '<p class="p">아직 ' + CATS[c] + '이(가) 없어요. 「새 옷 넣기」로 넣어 주세요.</p>') + '</div>';
  }
  /* 구매하기: 입은 옷 가운데 구매 링크가 있는 것(링크는 PC 와 같은 safeUrl 확인). ui.buy 가 키(문자열)면 그 기록의 옷(5단계 기록 크게 보기) */
  function buyHtml() {
    if (!ui.buy) return '';
    var wn = typeof ui.buy === 'string' ? { key: ui.buy } : wornNow(), its = wn ? lookItems(wn.key) : [];
    var rows = its.filter(function (x) { return safeUrl(x.url); });
    return '<div class="dim dp" data-act="buyClose"></div><div class="pop" role="dialog" aria-label="구매하기"><div class="pkh"><h2>구매하기</h2><button type="button" class="x" data-act="buyClose">닫기 ✕</button></div>' +
      (rows.length ? rows.map(function (x) { return '<a class="pick" href="' + h(safeUrl(x.url)) + '" target="_blank" rel="noopener noreferrer">' + h(CATS[x.cat] + ' · ' + shortName(x)) + '<small>쇼핑몰 열기 ›</small></a>'; }).join('') : '<p class="p">입은 옷에 구매 링크가 없어요. 옷을 넣을 때 「구매 링크」 칸에 주소를 넣으면 여기서 바로 열 수 있어요.</p>') + '</div>';
  }

  /* ---------- 옷장 (목업 D1: 종류 탭 + 2줄 카드. 종류는 PC 와 같은 CAT_ORDER. 카드를 누르면 입어보기·고치기·구매·지우기 창) ---------- */
  function itmHtml() {
    var it = ui.itm && item(ui.itm); if (!it) return '';
    var id = h(it.id), u = safeUrl(it.url), pr = priceText(it.price), what = it.cat === 'shoe' ? '신발' : '옷';
    return '<div class="dim dp" data-act="itmClose"></div><div class="pop itm" role="dialog" aria-label="' + h(it.name) + '"><div class="pkh"><h2>' + h(shortName(it)) + '</h2><button type="button" class="x" data-act="itmClose">닫기 ✕</button></div>' +
      '<div class="itmtop"><div class="im">' + (it.photo ? '<img src="' + h(it.photo) + '" alt="" class="' + posOf(it) + '">' : '<span aria-hidden="true">' + SHIRT + '</span>') + '</div><div><b>' + h(it.name) + '</b><small>' + h(CATS[it.cat]) + (pr ? ' · ' + pr : '') + '</small></div></div>' +
      '<button type="button" class="pick" data-act="itmWear" data-id="' + id + '">입어보기<small>' + (it.kind === 'under' ? '사이즈 확인용' : '내 모습 옷 칸에 넣기') + '</small></button>' +
      '<button type="button" class="pick" data-act="editItem" data-id="' + id + '">고치기<small>이름·사이즈 표·사진</small></button>' +
      (u ? '<a class="pick" href="' + h(u) + '" target="_blank" rel="noopener noreferrer">구매<small>쇼핑몰 열기 ›</small></a>' : '<button type="button" class="pick" data-act="editItem" data-id="' + id + '">구매 링크 넣기<small>링크가 없어요</small></button>') +
      '<button type="button" class="pick del" data-act="delItem" data-id="' + id + '">지우기<small>' + what + '으로 만든 입은 모습도 함께</small></button></div>';
  }
  function viewCloset() {
    var total = state.closet.length;
    if (total && !state.closet.some(function (x) { return x.cat === ui.closetCat; })) ui.closetCat = CAT_ORDER.filter(function (c) { return state.closet.some(function (x) { return x.cat === c; }); })[0] || ui.closetCat; /* 2026-11-21 보던 종류가 비어 있으면 옷이 있는 종류부터 */
    var cat = ui.closetCat, list = state.closet.filter(function (x) { return x.cat === cat; });
    var chips = '<div class="chips" role="tablist" aria-label="옷 종류">' + CAT_ORDER.map(function (c) {
      var k = state.closet.filter(function (x) { return x.cat === c; }).length;
      return '<button type="button" role="tab" aria-selected="' + (cat === c) + '" class="chip' + (cat === c ? ' on' : '') + '" data-act="closetCat" data-cat="' + c + '">' + CATS[c] + (k ? '<small>' + k + '</small>' : '') + '</button>';
    }).join('') + '</div>';
    var cards = list.length ? '<div class="grid">' + list.map(function (it) {
      /* pc.js 2085~2086행(옷 카드 아랫줄)과 같은 계산: 고른 옷이면 고른 사이즈, 아니면 추천 사이즈 · 등급. 계산이 안 되면 사이즈 이름들 */
      var s = state.sel[cat], on = !!(s && s.id === it.id), r = evalOne(it, on ? s.size : null), g = r && r.current && r.current.primary, sub = r && r.chosen ? (on ? '' : '추천 ') + r.chosen + (g ? ' · ' + g.grade : '') : (it.sizes || []).map(function (z) { return z.label; }).join(' ');
      if (it.cat === 'shoe' && E.num(it.heel)) sub += (sub ? ' · ' : '') + '굽 ' + it.heel + 'mm';
      var pr = priceText(it.price);
      /* 2026-11-21 쇼츠형(목업 v4 3번): 누르면 옷 칸에 넣고 내 모습으로(창이 닫힘). 「⋯」 또는 길게 누르면 고치기·구매·지우기 창(D1) */
      return '<div class="g' + (on ? ' sel' : '') + '"><button type="button" class="gtap" data-act="itmPick" data-id="' + h(it.id) + '" aria-pressed="' + on + '" aria-label="' + h(it.name) + (on ? ' 고름 · 누르면 뺌' : ' 고르기') + '"><div class="im">' + (it.photo ? '<img src="' + h(it.photo) + '" alt="" loading="lazy" draggable="false" class="' + posOf(it) + '">' : '<span aria-hidden="true">' + SHIRT + '</span>') + (on ? '<span class="tag">고름</span>' : '') + (it.kind && KIND_NAME[it.kind] ? '<span class="tag r">' + KIND_NAME[it.kind] + '</span>' : '') + '</div><p>' + h(it.name) + '</p><small>' + h(sub) + (pr ? (sub ? ' · ' : '') + pr : '') + '</small></button>' +
        '<button type="button" class="gmore" data-act="itmOpen" data-id="' + h(it.id) + '" aria-label="' + h(it.name) + ' 고치기·구매·지우기">⋯</button></div>';
    }).join('') + '</div>'
      : '<div class="empty"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC[1] + '</svg><b>' + (total ? CATS[cat] + '이(가) 아직 없어요' : '옷장이 비어 있어요') + '</b><span>아래 「새 옷 넣기」로 넣어요.</span></div>';
    var nsel = wearSet().length, add = '<div class="foot cfoot"><button type="button" class="btn cta" data-act="itmGo">피팅룸 가기<small>' + (nsel ? nsel + '벌 골랐어요' : '옷을 눌러 고르세요') + '</small></button><p class="lbl">새 옷 넣기</p><div class="addrow">' +
      '<button type="button" data-act="addPick" data-v="album">앨범</button><button type="button" data-act="addPick" data-v="camera">카메라</button><button type="button" data-act="addPick" data-v="paste">붙여넣기</button>' +
      '<button type="button" class="new" data-act="addLink">쇼핑 링크</button></div><p class="lbl">옷을 누르면 고르고, 다시 누르면 빼요 · 길게 누르거나 「⋯」: 고치기 · 구매 · 지우기</p></div>';
    return '<header class="top"><h1>내 옷장 <small class="cnt">' + total + '벌</small></h1></header><main class="body">' + chips + cards + '</main>' + add;
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
    return '<header class="top"><h1>입어본 기록 <small class="cnt">전체 ' + (ui.mediaReady ? list.length : 0) + '</small></h1></header><main class="body">' + inner + '</main>';
  }

  /* 기록 크게 보기(D3) 아래 버튼. wear = pc.js 2950행 histShow 와 같은 옷 고르기(횟수 안 씀, 그 입은 모습을 홈에 보임) — PC 는 피팅룸으로 가므로 홈으로 가게 손으로 씀.
     del = PC histDel 그대로(묻고 지움) · buy = 그 기록의 옷 구매 링크 창 */
  var VACTS = '<div class="row vacts"><button type="button" class="btn ghost sm" data-v="a:wear">내 모습에서 보기</button><button type="button" class="btn ghost sm" data-v="a:del">지우기</button><button type="button" class="btn sm" data-v="a:buy">구매하기</button></div>';
  function histAct(v, e) {
    var key = e.key;
    if (v === 'del') { var n = histList().length; ACT.histDel({ dataset: { id: key } }); return histList().length < n ? 'drop' : ''; }
    if (v === 'buy') { closeViewer(); ui.buy = key; render(); return ''; }
    if (v !== 'wear') return '';
    var its = lookItems(key); if (!its.length) return '';
    var hc = its.map(function (x) { return x.cat; }); Object.keys(state.sel).forEach(function (c) { if (hc.indexOf(c) < 0) delete state.sel[c]; }); its.forEach(selectItem); state.wearLast = key; save(); ui.view = curView();
    closeViewer(); go('fit'); ui.slotsOpen = false; ui.genErr = null; ui.angle = 'front'; render();
    if (urls.tryon[key] && !tryonOk(key)) toast('이 입은 모습은 지금과 다른 캐릭터로 만든 것이라 내 모습에는 보이지 않아요. 입어본 기록에서는 계속 볼 수 있어요.', 6000);
    return '';
  }
  /* 옷 고치기: 불러온 때와 값이 같은지(닫을 때 바뀐 게 있을 때만 묻기) */
  function cfSnap(f) { return JSON.stringify([f.cat, f.name, f.price, f.url, f.heel, f.photo, f.measureType, f.table, f.sizes, !!f.sizeBig]); }

  /* ---------- 내 정보 (목업 D4. PC 「내 몸 정보」의 두 탭 + 요금제·설정 입구) ---------- */
  function kvHtml(rows) { return '<div class="kv">' + rows.map(function (r) { var v = r[1] == null ? '' : String(r[1]); return '<div>' + r[0] + (v === '' ? '<b class="auto">자동</b>' : '<b>' + h(v) + (r[2] ? '<small>' + r[2] + '</small>' : '') + '</b>') + '</div>'; }).join('') + '</div>'; }
  function viewMe() {
    var p = state.profile, m = p.m || {}, w = who(), tab = ui.bodyTab === 'base' || ui.bodyTab === 'me' ? ui.bodyTab : w, b = baseModel(), body;
    if (ui.meEdit) {
      return '<header class="top"><button type="button" class="back" data-act="meEditOff">‹ 내 몸</button><h1 class="mid">내 치수</h1></header><main class="body">' + bodyForm() + '</main>' +
        '<div class="foot"><button type="button" class="btn" data-act="meSave">저장</button></div>';
    }
    var seg = '<div class="seg" role="group" aria-label="캐릭터 종류">' + [['base', '기본 모델'], ['me', '내 아바타']].map(function (t) { return '<button type="button" class="' + (tab === t[0] ? 'on' : '') + '" aria-pressed="' + (tab === t[0]) + '" data-act="bTab" data-v="' + t[0] + '">' + t[1] + (w === t[0] ? ' · 사용 중' : '') + '</button>'; }).join('') + '</div>';
    if (tab === 'base') {
      body = '<div class="card me"><div class="im"><img src="' + h(b.img) + '" alt="' + h(b.name) + ' 앞모습 전신" class="' + (b.preset ? 'ct' : '') + '"></div><div class="tx"><b>' + h(b.name) + '</b><small>읽기 전용 · ' + (b.ang ? '키 ' + b.h + 'cm·몸무게 ' + b.w + 'kg 기준' : '한국 ' + (b.preset ? h(b.name.replace(/(남성|여성)$/, ' $1')) : '20대 ' + (b.g === 'male' ? '남성' : '여성')) + ' 평균') + ' 가정치</small></div></div>' + /* 문구는 pc.js 2180행 */
        '<p class="p">아래에서 모델을 누르면 그 모델로 입어봐요. 내 아바타와 내 치수는 바뀌지 않아요.</p>' + modelsHtml(b.id, 'bPreset') +
        '<div class="sec"><h2 style="font-size:16px">' + h(b.name) + ' 치수</h2></div>' + kvHtml([['성별', b.g === 'male' ? '남성' : '여성'], ['키', b.h, 'cm'], ['몸무게', b.w, 'kg']].concat(MFIELDS.map(function (f, i) { return [f[1], b.m[i], f[2]]; }))) +
        '<div class="callout">내 사이즈는 「내 아바타」에서 내 치수로 봐요.</div>';
    } else {
      /* 6단계: PC 「내 아바타」와 같은 앞·옆·뒤 3장(올리기·바꾸기·지우기, 눌러서 크게 보기) + 아바타 만들기(avatar-make.js). 문구는 pc.js 2200행 */
      body = '<div class="avs">' + ['front'].concat(ANGS).map(function (av) {
        var f = av === 'front', u = f ? urls.avatar : urls.ang[av], src = f ? (u || (p.gender === 'male' ? 'assets/avatar_male.jpg?v=t' : 'assets/avatar_default.jpg?v=t')) : u, alt = f && !u ? '기본 캐릭터 전신' : '내 아바타 ' + ANG_NAME[av];
        return '<div class="avc">' + (src ? '<button type="button" class="avim" data-act="avZoom" data-v="' + av + '" aria-label="' + alt + ' 크게 보기"><img src="' + h(src) + '" alt=""></button>' : '<div class="avim none">' + ANG_NAME[av] + '<br>없음</div>') +
          '<button type="button" class="btn ghost sm" data-act="avPick" data-v="' + (f ? 'avatar' : 'avatar_' + av) + '" aria-label="' + ANG_NAME[av] + (u ? ' 바꾸기' : ' 올리기') + '">' + ANG_NAME[av].charAt(0) + (u ? ' 바꾸기' : ' 올리기') + '</button>' +
          (u ? '<button type="button" class="lk" data-act="' + (f ? 'avatarDel' : 'avatarAngDel') + '" data-v="' + av + '" aria-label="' + ANG_NAME[av] + ' 지우기">지우기</button>' : '') + '</div>';
      }).join('') + '</div>' +
        (window.AvatarMake ? '<button type="button" class="btn" data-act="avMake">아바타 만들기</button>' : '') +
        '<p class="p">' + (urls.avatar ? '앞모습은 직접 올린 내 아바타 사진이에요.' : '앞모습 정면 전신 이미지를 올려 주세요. 올리지 않으면 기본 캐릭터 사진에 내 치수로 입혀 드려요.') + ' 앞모습은 정면 전신, 몸선이 보이는 나시·반바지 차림, 단색 배경 사진이 가장 잘 맞아요. 옆모습·뒷모습은 선택이에요. 올려 두면 옷을 입힐 때 옆·뒤도 골라서 만들 수 있어요(앞 사진과 같은 옷차림·배경의 전신 사진).' + (urls.avatar ? '' : ' 옆·뒤는 앞모습 사진을 먼저 올려야 쓰여요.') + '</p>' +
        '<div class="sec"><h2 style="font-size:16px">내 치수</h2><button type="button" data-act="meEditOn">고치기 ›</button></div>' +
        kvHtml([['성별', p.gender === 'male' ? '남성' : '여성'], ['키', p.height, 'cm'], ['몸무게', p.weight, 'kg']].concat(MFIELDS.map(function (f) { return [f[1], m[f[0]], f[2]]; }))) +
        '<div class="callout">모르는 칸은 비우면 키·몸무게로 추정해요.</div>';
    }
    return '<header class="top"><h1>내 몸 <small class="cnt">' + h(planNow().name) + ' 플랜</small></h1></header><main class="body">' + seg + body +
      '<div class="list"><button type="button" data-act="go" data-page="plan">요금제 <span>' + h(planNow().name) + ' · 남은 ' + leftText() + ' ›</span></button><button type="button" data-act="go" data-page="set">설정 <span>계정 · 선호 핏 ›</span></button><a href="privacy.html">개인정보 처리방침 <span>›</span></a></div></main>';
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
      }).join('') + '</main>';
  }

  /* ---------- 설정 (pc.js 2224~2231행 viewSettings 와 같은 항목. 화면 색(스킨)은 모바일에 아직 없음) ---------- */
  function viewSettings() {
    return subTop('설정') + '<main class="body"><section class="card col" aria-label="계정"><div class="sec"><h2 style="font-size:16px">계정</h2></div><div class="me"><div class="im" style="width:56px;height:75px"><img src="' + h(avatarShow()) + '" alt=""></div><div class="tx"><b class="el">' + h(user.email || user.nick) + '</b><small>' + (Sync.pending() ? '아직 서버에 올리지 못한 내용이 있어요. 인터넷에 연결되면 올려요.' : '로그인한 계정 · 서버에 저장됨') + '</small></div></div>' +
      '<div class="row"><button type="button" class="btn ghost sm" data-act="go" data-page="me">내 몸 정보 고치기</button><button type="button" class="btn ghost sm" data-act="logout">로그아웃</button></div>' + (impAny() ? '<button type="button" class="btn ghost sm" data-act="impOpen">예전 자료 가져오기</button>' : '') + '</section>' +
      '<section class="card col" aria-label="선호 핏"><div class="sec"><h2 style="font-size:16px">선호 핏</h2></div><p class="p">' + PREF_SAY + '</p>' + prefSeg() + '</section>' +
      '<section class="card col" aria-label="요금제"><div class="size"><div class="L">' + leftText() + '</div><div><p>이번 달 남은 횟수' + (unlimited() ? ' · 제한 없음(시험 중)' : '') + '</p><small>지금은 ' + h(planNow().name) + ' 플랜</small></div></div><button type="button" class="btn ghost sm" data-act="go" data-page="plan">요금제 보기</button></section></main>';
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
    if (kind === 'avatar') { avatarFront(file); return; } /* 6단계: 내 아바타 앞·옆·뒤 사진 */
    if (kind === 'avatar_side' || kind === 'avatar_back') { avatarAng(kind, file); return; }
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
    /* 5단계: f.id 가 있으면 옷장의 옷 고치기(PC editItem 과 같이 cfLoad 로 불러옴). 저장은 같은 cfSave(PC 「수정 저장」) */
    /* 2026-11-21 옷장 「쇼핑 링크」로 열면 구매 링크 칸이 맨 위 + PC 와 같은 「링크에서 이름·가격 가져오기」(linkReadOn = PC 와 같은 서버 설정이 있을 때만) */
    var urlRow = '<div class="one"><label for="purl">' + (f.linkFirst ? '쇼핑 링크' : '구매 링크 (선택)') + '<span class="in"><input id="purl" type="url" inputmode="url" autocapitalize="off" spellcheck="false" data-cf="url" placeholder="https://..." value="' + h(f.url) + '"></span></label></div>' +
      (f.linkFirst && linkReadOn() ? '<button type="button" class="btn ghost sm" data-act="linkRead"' + (f.linkBusy ? ' disabled' : '') + '>' + (f.linkBusy ? '읽는 중…' : '링크에서 이름·가격 가져오기') + '</button>' : '');
    return '<header class="top"><button type="button" class="back" data-act="addCancel">‹ ' + (f.id ? '닫기' : '취소') + '</button><h1 class="mid">' + (f.id ? (sh ? '신발 고치기' : '옷 고치기') : '옷 확인') + '</h1><span class="sp"></span></header><main class="body">' +
      (f.linkFirst ? urlRow + (f.err ? '<p class="err" role="alert">' + h(f.err) + '</p>' : '') + '<p class="p">링크로 못 읽는 쇼핑몰은 아래 사진 칸에 상품 화면 캡처를 넣으면 이름·가격을 읽어요.</p>' : '') +
      '<div class="addtop"><button type="button" class="aph" data-act="addPick" data-v="photo" aria-label="' + (f.photo ? '옷 사진 바꾸기' : '옷 사진 넣기') + '">' + (f.photo ? '<img src="' + h(f.photo) + '" alt="">' : '<span aria-hidden="true">＋</span>') + '<small>' + (f.photo ? '사진 바꾸기' : '사진 넣기') + '</small></button>' +
      '<div class="aff"><label for="pname">' + (sh ? '신발 이름' : '옷 이름') + '<span class="in"><input id="pname" type="text" data-cf="name" maxlength="60" placeholder="예: 반팔 티" value="' + h(f.name) + '"></span></label>' +
      '<label for="pprice">가격<span class="in"><input id="pprice" type="text" inputmode="numeric" data-cf="price" placeholder="예: 19,900원" value="' + h(f.price) + '"></span></label></div></div>' +
      (f.photoMsg ? '<p class="p" data-ocr="photo" role="status">' + h(f.photoMsg) + '</p>' : '') +
      '<div class="sec"><h2 style="font-size:16px">종류</h2>' + (f.catAuto && f.catHit ? '<span>이름을 보고 골랐어요</span>' : '') + '</div>' + chips +
      '<div class="sec"><h2 style="font-size:16px">사이즈 표</h2><span>' + (sh ? '단위 mm' : (f.measureType === 'circ' ? '둘레' : '단면') + ' · cm') + (rec ? ' · ' + (who() === 'base' ? '모델' : '내') + ' 추천 <b class="rec">' /* 추천은 지금 입어보는 쪽(prof) 기준: 기본 모델이면 그 모델 치수 */ + h(rec) + '</b>' : '') + '</span></div>' +
      (f.sizeMsg ? '<p class="callout" data-ocr="size" role="status">' + h(f.sizeMsg) + '</p>' : '') + tb +
      '<div class="row"><button type="button" class="btn ghost sm" data-act="addPick" data-v="size">' + (f.sizeBig ? '표 사진 다시 넣기' : '표 사진 넣기') + '</button><button type="button" class="btn ghost sm" data-act="tblOpen" aria-pressed="' + !!f.tOpen + '">' + (f.tOpen ? '고치기 끝' : '직접 고치기') + '</button></div>' +
      (sh ? '<div class="one"><label for="pheel">굽 높이 (선택)<span class="in"><input id="pheel" type="text" inputmode="decimal" autocomplete="off" data-cf="heel" maxlength="3" placeholder="예: 70" value="' + h(f.heel == null ? '' : f.heel) + '"><small>mm</small></span></label></div>' : '') +
      (f.linkFirst ? '' : urlRow + (f.err ? '<p class="err" role="alert">' + h(f.err) + '</p>' : '')) +
      (f.id ? '<button type="button" class="lk del" data-act="delItem" data-id="' + h(f.id) + '">' + (sh ? '신발 삭제' : '옷 삭제') + '</button>' : '') + '</main>' +
      '<div class="foot"><div class="row"><button type="button" class="btn ghost" data-act="addSave" data-v="closet">' + (f.id ? '수정 저장' : '옷장에만 저장') + '</button><button type="button" class="btn" data-act="addSave" data-v="try">저장하고 입어보기</button></div></div>';
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
    /* 2026-11-21 쇼츠형: 옷장·기록·내 몸·요금제·설정은 사진 위로 올라오는 창(panelWrap). 고르기·구매·옷장 카드·옷 넣기 작은 창은 어느 화면에서나 맨 위에 */
    var inner = cf ? viewAdd() : ui.onb === 1 ? viewOnbBody() : ui.onb === 2 ? viewOnbModel() :
      (p === 'intro' ? viewIntro() : PANELS[p] ? panelWrap(p, p === 'closet' ? viewCloset() : p === 'history' ? viewHistory() : p === 'me' ? viewMe() : p === 'plan' ? viewPlan() : viewSettings()) : p === 'fit' ? viewFit() : viewHome()) +
      pickHtml() + buyHtml() + itmHtml() + plusHtml();
    var ae = document.activeElement, keep = ae && app.contains(ae) && ae.id, sel = null, scr = null, b0 = app.querySelector('.panel .body') || app.querySelector('.body'), /* 창 뒤 화면(.pbase)의 .body 말고 창 것 */ c0 = app.querySelector('.chips'), f0 = app.querySelector('.fitd');
    try { sel = keep && ae.selectionStart; } catch (e) {}
    if (ui.vkey === key) scr = [b0 ? b0.scrollTop : 0, c0 ? c0.scrollLeft : 0, f0 ? f0.scrollTop : 0];
    var vk = {}; /* 다시 그려도 아직 저장 안 한 몸 치수 입력은 그대로 둔다 */
    if (ui.vkey === key) Array.prototype.forEach.call(app.querySelectorAll('#h,#w,input[data-mf]'), function (i) { if (i.id) vk[i.id] = i.value; });
    app.innerHTML = inner; ui.vkey = key;
    Object.keys(vk).forEach(function (k) { var e = document.getElementById(k); if (e && e.value !== vk[k]) e.value = vk[k]; });
    if (scr) { var b1 = app.querySelector('.panel .body') || app.querySelector('.body'), c1 = app.querySelector('.chips'); if (b1) b1.scrollTop = scr[0]; if (c1) c1.scrollLeft = scr[1]; var f1 = app.querySelector('.fitd'); if (f1) f1.scrollTop = scr[2]; } /* 핏 서랍(C5)도 탭·사이즈를 눌러 다시 그려도 보던 자리 그대로 */
    if (keep) { var a = document.getElementById(keep); if (a) { a.focus(); try { if (sel != null) a.setSelectionRange(sel, sel); } catch (e) {} } }
    railFit(); phFeather(); if (railRO) { railRO.disconnect(); Array.prototype.forEach.call(app.querySelectorAll('.sv .sheet'), function (el) { railRO.observe(el); }); }
  }
  /* 2026-11-23 오른쪽 둥근 버튼이 6개(맨 위 피팅룸/코디)라, 아래 카드가 높으면(피팅룸 옷 칸 카드) 위 줄과 겹침 → 그때만 버튼 아래 이름을 숨기고 간격을 줄임(키 작은 화면 max-height:690 과 같은 모양). 카드를 내리고 올릴 때도 다시 잼 */
  /* 2026-11-23 사용자 지시(폰 캡처: 사진 양옆·아래에 경계선이 보임): 사진(.ph, 전신이 다 보이게 contain)의 실제 그려진 네모를 재서 가장자리를 부드럽게 지워 뒤의 흐린 같은 사진과 이어 붙임 */
  var phDims = {};
  function phFeather() {
    Array.prototype.forEach.call(app.querySelectorAll('.sv .stage .ph'), function (el) {
      var m = /url\(["']?(.*?)["']?\)/.exec(el.style.backgroundImage || ''); if (!m) return;
      var u = m[1], d = phDims[u];
      if (!d) { var im = new Image(); im.onload = function () { phDims[u] = [im.naturalWidth, im.naturalHeight, phEdges(im)]; phFeather(); }; im.src = u; return; }
      var W = el.clientWidth, H = el.clientHeight; if (!W || !H || !d[0] || !d[1]) return;
      var s = Math.min(W / d[0], H / d[1]), w = d[0] * s, h = d[1] * s, l = (W - w) / 2, t = H - h, f = 28, ft = 16, fb = 8;
      var mk = 'linear-gradient(90deg,transparent ' + l.toFixed(1) + 'px,#000 ' + (l + f).toFixed(1) + 'px,#000 ' + (l + w - f).toFixed(1) + 'px,transparent ' + (l + w).toFixed(1) + 'px),linear-gradient(180deg,transparent ' + t.toFixed(1) + 'px,#000 ' + (t + ft).toFixed(1) + 'px,#000 ' + (t + h - fb).toFixed(1) + 'px,transparent ' + (t + h).toFixed(1) + 'px)';
      el.style.webkitMaskImage = mk; el.style.maskImage = mk; el.style.webkitMaskComposite = 'source-in'; el.style.maskComposite = 'intersect';
      /* 2026-11-24 사용자 지시(폰 캡처: 인물이 작고 양옆 바탕색이 부자연스러움): 사진이 화면보다 좁게 그려져 양옆이 비면, 뒤 흐린 바탕을 사진 왼쪽·오른쪽 가장자리의 실제 색(줄마다)으로 채워 사진 바탕과 이어 붙임 */
      var sv = el.closest('.sv'), bg = sv && sv.querySelector(':scope>.bg'), ed = d[2];
      if (bg && ed) {
        var er = el.getBoundingClientRect(), br = bg.getBoundingClientRect(), y0 = er.top - br.top + t;
        var gr = function (arr) { return 'linear-gradient(180deg,' + arr.map(function (c, i) { return c + ' ' + (y0 + h * (i + 0.5) / arr.length).toFixed(1) + 'px'; }).join(',') + ')'; };
        bg.style.background = gr(ed[0]) + ' left top/50.5% 100% no-repeat,' + gr(ed[1]) + ' right top/50.5% 100% no-repeat,' + ed[2];
      }
    });
  }
  /* 사진 왼쪽·오른쪽 끝 2% 띠의 색을 48줄로 잰다. 다른 사이트 사진 등 읽을 수 없으면 null(예전 흐린 바탕 그대로) */
  function phEdges(im) {
    try {
      var N = 48, c = document.createElement('canvas'); c.width = 50; c.height = N;
      var x = c.getContext('2d'); x.drawImage(im, 0, 0, 50, N);
      var a = x.getImageData(0, 0, 50, N).data, L = [], R = [], i, k, sum = [0, 0, 0];
      var px = function (col, row) { var o = (row * 50 + col) * 4; return [a[o], a[o + 1], a[o + 2]]; };
      for (i = 0; i < N; i++) {
        var l = px(0, i), l2 = px(1, i), r = px(49, i), r2 = px(48, i);
        L.push('rgb(' + [0, 1, 2].map(function (j) { return Math.round((l[j] + l2[j]) / 2); }).join(',') + ')');
        R.push('rgb(' + [0, 1, 2].map(function (j) { return Math.round((r[j] + r2[j]) / 2); }).join(',') + ')');
        for (k = 0; k < 3; k++) sum[k] += l[k] + r[k];
      }
      var T = [], B = [], cl = function (o) { return 'rgb(' + Math.round((a[o] + a[o + 50 * 4]) / 2) + ',' + Math.round((a[o + 1] + a[o + 1 + 50 * 4]) / 2) + ',' + Math.round((a[o + 2] + a[o + 2 + 50 * 4]) / 2) + ')'; };
      for (i = 0; i < 50; i++) { T.push(cl(i * 4)); B.push(cl(((N - 2) * 50 + i) * 4)); }
      return [L, R, 'rgb(' + sum.map(function (v) { return Math.round(v / (2 * N)); }).join(',') + ')', T, B];
    } catch (e) { return null; }
  }
  function railFit() {
    /* 2026-11-23 사용자 지시: 오른쪽 둥근 버튼은 위 줄 바로 아래 한 자리에 고정(카드 높이와 상관없이). 카드가 올라와 버튼과 겹칠 때만 이름을 숨기고 간격을 줄임 */
    Array.prototype.forEach.call(app.querySelectorAll('.sv'), function (sv) {
      var r = sv.querySelector('.rail'), sh = sv.querySelector('.sheet'); if (!r) return;
      r.classList.remove('tight', 'tight2'); if (!sh) return;
      var st = sh.getBoundingClientRect().top - 4;
      if (r.getBoundingClientRect().bottom > st) r.classList.add('tight');
      if (r.getBoundingClientRect().bottom > st) r.classList.add('tight2'); /* 그래도 겹치면: 누르는 곳 44px 는 그대로, 동그라미만 40px·간격 0 */
    });
  }
  var railRO = window.ResizeObserver ? new ResizeObserver(function () { railFit(); phFeather(); }) : null;
  window.addEventListener('resize', function () { railFit(); phFeather(); });

  /* ---------- 크게 보기 (목업 D3: 검은 배경에 원본 그대로, 이전·다음 버튼, 두 손가락 확대. 사진은 바꾸지 않고 보여 주기만 한다) ---------- */
  var viewer = null;
  function closeViewer() { if (!viewer) return; document.removeEventListener('keydown', viewer.key); viewer.el.remove(); var b = viewer.back; viewer = null; if (b && b.isConnected && b.focus) b.focus(); }
  /* onAct(v, e): 아래 칸의 「a:v」 버튼(5단계 기록의 다시 입기·지우기·구매하기). 'drop' 을 돌려주면 그 장을 목록에서 빼고(없으면 닫음) 이웃 장을 보인다 */
  function openViewer(list, idx, onAct) {
    closeViewer(); if (!list.length) return;
    var o = document.createElement('div'), z = { k: 1, x: 0, y: 0 }, t0 = null, lastTap = 0, img = null, infoOn = false; /* 2026-11-23 사진은 화면 전체, 옷 정보는 위 「옷 정보」를 눌러 사진 위에 펼침(처음엔 접힘) */
    o.className = 'viewer' + (list.some(function (x) { return x.info; }) ? ' hasdock' : ''); o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', '사진 크게 보기');
    function apply() { if (img) img.style.transform = 'translate(' + z.x + 'px,' + z.y + 'px) scale(' + z.k + ')'; }
    function clamp() { var st = o.querySelector('.vstage'), mx = st.clientWidth * (z.k - 1) / 2, my = st.clientHeight * (z.k - 1) / 2; z.x = Math.max(-mx, Math.min(mx, z.x)); z.y = Math.max(-my, Math.min(my, z.y)); }
    function draw() {
      var e = list[idx], n = list.length; z = { k: 1, x: 0, y: 0 };
      o.innerHTML = '<div class="vstage"><div class="vbg" style="' + bgUrl(e.url) + '"></div><img alt="' + h(e.alt || '') + '" src="' + h(e.url) + '" draggable="false">' +
        (n > 1 ? '<button type="button" class="navb l" data-v="prev" aria-label="이전"' + (idx === 0 ? ' disabled' : '') + '>‹</button><button type="button" class="navb r" data-v="next" aria-label="다음"' + (idx === n - 1 ? ' disabled' : '') + '>›</button>' : '') +
        '<div class="vhint">두 손가락으로 확대</div></div>' +
        '<header class="top vtop"><button type="button" class="back" data-v="close">✕ 닫기</button><div class="pills">' + (n > 1 ? '<span class="pill st">' + (idx + 1) + ' / ' + n + '</span>' : '') +
        '</div></header>' + /* 2026-11-23 사용자 지시: 입어본 기록 크게 보기의 옷 정보는 항상 아래에 내려가 있고, 보고 싶을 때 올렸다 내림(위 「옷 정보」 버튼 대신 아래 손잡이 줄+빨간 알약) */
        (e.info ? '<div class="vdock"' + (infoOn ? ' hidden' : '') + '><button type="button" class="fitx" data-v="info" aria-expanded="false" aria-label="상품 정보 올리기"><span class="fxbar" aria-hidden="true"></span><span class="fxrow"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"></path></svg>상품 정보 보기</span></button></div><div class="vinfo"' + (infoOn ? '' : ' hidden') + '><button type="button" class="vgrab" data-v="info" aria-expanded="true" aria-label="상품 정보 내리기"><span class="fxbar" aria-hidden="true"></span></button>' + e.info + '</div>' : '');
      var vinf = o.querySelector('.vinfo'); if (vinf) { var sy = null; vinf.addEventListener('touchstart', function (ev) { sy = ev.touches[0].clientY; }, { passive: true }); vinf.addEventListener('touchend', function (ev) { var dy = ev.changedTouches[0].clientY - sy; if (sy != null && dy > 50 && vinf.scrollTop <= 0) { infoOn = false; vinf.hidden = true; var vd2 = o.querySelector('.vdock'); if (vd2) vd2.hidden = false; } sy = null; }, { passive: true }); }
      img = o.querySelector('.vstage img');
      var st = o.querySelector('.vstage');
      /* 2026-11-24 사용자 지시: 크게 보기에서 사진이 화면보다 작게 그려져 검은 띠(엣지)가 생김 → 남는 곳을 사진 가장자리의 실제 색으로 채워 화면이 사진 바탕으로 꽉 차 보이게 하고, 이어지는 가장자리는 부드럽게 지움 */
      (function (u, im0) {
        function fill() {
          var d = phDims[u], vb = st.querySelector('.vbg'), W = st.clientWidth, H = st.clientHeight;
          if (!d || !vb || !W || !H || img !== im0) return;
          var s = Math.min(W / d[0], H / d[1]), w = d[0] * s, hh = d[1] * s, l = (W - w) / 2, tp = (H - hh) / 2, gx = l > 1.5, gy = tp > 1.5, ed = d[2];
          if (!ed || (!gx && !gy)) return;
          var f = 24, mk = [];
          mk.push(gx ? 'linear-gradient(90deg,transparent ' + l.toFixed(1) + 'px,#000 ' + (l + f).toFixed(1) + 'px,#000 ' + (l + w - f).toFixed(1) + 'px,transparent ' + (l + w).toFixed(1) + 'px)' : 'linear-gradient(#000,#000)');
          mk.push(gy ? 'linear-gradient(180deg,transparent ' + tp.toFixed(1) + 'px,#000 ' + (tp + f).toFixed(1) + 'px,#000 ' + (tp + hh - f).toFixed(1) + 'px,transparent ' + (tp + hh).toFixed(1) + 'px)' : 'linear-gradient(#000,#000)');
          var m = mk.join(','); im0.style.webkitMaskImage = m; im0.style.maskImage = m; im0.style.webkitMaskComposite = 'source-in'; im0.style.maskComposite = 'intersect';
          var gv = function (arr) { return 'linear-gradient(180deg,' + arr.map(function (c, i) { return c + ' ' + (tp + hh * (i + 0.5) / arr.length).toFixed(1) + 'px'; }).join(',') + ')'; };
          var gh = function (arr) { return 'linear-gradient(90deg,' + arr.map(function (c, i) { return c + ' ' + (l + w * (i + 0.5) / arr.length).toFixed(1) + 'px'; }).join(',') + ')'; };
          var layers = [];
          if (gx) { layers.push(gv(ed[0]) + ' left top/' + (l + f) + 'px 100% no-repeat'); layers.push(gv(ed[1]) + ' right top/' + (l + f) + 'px 100% no-repeat'); }
          if (gy) { layers.push(gh(ed[3]) + ' left top/100% ' + (tp + f) + 'px no-repeat'); layers.push(gh(ed[4]) + ' left bottom/100% ' + (tp + f) + 'px no-repeat'); }
          layers.push(ed[2]);
          vb.style.display = 'block'; vb.style.position = 'absolute'; vb.style.inset = '0'; vb.style.filter = 'none'; vb.style.background = layers.join(',');
        }
        if (phDims[u]) setTimeout(fill, 0);
        else { var q = new Image(); q.onload = function () { phDims[u] = [q.naturalWidth, q.naturalHeight, phEdges(q)]; fill(); }; q.src = u; }
      })(e.url, img);
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
      else if (b.dataset.v === 'info') { infoOn = !infoOn; var vi = o.querySelector('.vinfo'), vd = o.querySelector('.vdock'); if (vi) vi.hidden = !infoOn; if (vd) vd.hidden = infoOn; }
      else if (b.dataset.v === 'prev' && idx > 0) { idx--; infoOn = false; draw(); }
      else if (b.dataset.v === 'next' && idx < list.length - 1) { idx++; infoOn = false; draw(); }
      else if (onAct && b.dataset.v.indexOf('a:') === 0) {
        var me = viewer, r = onAct(b.dataset.v.slice(2), list[idx]);
        if (r === 'drop' && viewer === me) { list.splice(idx, 1); if (!list.length) closeViewer(); else { if (idx >= list.length) idx = list.length - 1; draw(); } }
      }
    });
    viewer = { el: o, back: document.activeElement, key: function (ev) { if (ev.key === 'Escape') closeViewer(); else if (ev.key === 'ArrowLeft' && idx > 0) { idx--; draw(); } else if (ev.key === 'ArrowRight' && idx < list.length - 1) { idx++; draw(); } } };
    document.body.appendChild(o); document.addEventListener('keydown', viewer.key); draw();
  }

  /* ---------- 지우기 (PC 그대로) ---------- */
  /* ▼ pc.js 2644~2657행 그대로 */
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
  /* ▲ */
  var PCDEL = {
  /* ▼ pc.js 2901~2908행 그대로 */
    delItem: function (el) {
      if (genPending && String(genPending).split('+').indexOf(el.dataset.id) >= 0) { toast('입히는 중인 옷은 지금 삭제할 수 없어요. 끝난 뒤 다시 해 주세요.'); return; }
      var it = item(el.dataset.id); if (!it || !confirm('"' + it.name + '"을(를) 내 ' + (it.cat === 'shoe' ? '신발장' : '옷장') + '에서 삭제할까요? 이 ' + (it.cat === 'shoe' ? '신발' : '옷') + '으로 만든 입은 모습도 함께 지워져요.')) return;
      state.closet = state.closet.filter(function (x) { return x.id !== it.id; });
      Object.keys(state.sel).forEach(function (c) { if (state.sel[c] && state.sel[c].id === it.id) delete state.sel[c]; });
      dropTryon(it.id); Object.keys(state.looks || {}).forEach(function (k) { if (k.split('+').indexOf(it.id) >= 0) dropTryon(k); });
      blobDel('gphoto:' + it.id).catch(function () {}); blobDel('gphoto0:' + it.id).catch(function () {}); blobDel('gsize:' + it.id).catch(function () {}); ui.cfModal = false; ui.cf = blankForm(ui.closetCat); save(); render();
    },
  /* ▲ */
  };
  var PCAV = { /* pc.js 에서 ACT 의 마지막 줄이라 끝에 쉼표가 없어 따로 묶음 */
  /* ▼ pc.js 2983행 그대로 */
    avatarDel: function () { if (!confirm('내 아바타 사진을 지울까요? 내 치수는 그대로 남아요.')) return; state.who = who(); /* 고른 적이 없던 사용자도 사진을 지운 뒤 지금 쓰던 쪽에 그대로 남는다 */ if (urls.avatar) URL.revokeObjectURL(urls.avatar); urls.avatar = null; state.avSeq = (state.avSeq || 0) + 1; save(); blobDel('avatar').catch(function () {}); render(); }
  /* ▲ */
  };

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
      if ((f.id ? cfSnap(f) !== f.snap : f.photo || String(f.name || '').trim() || f.tEdit) && !confirm(f.id ? '고친 내용을 저장하지 않고 닫을까요?' : '넣은 옷을 저장하지 않고 나갈까요?')) return;
      go(ui.page);
    },
    /* 저장은 PC 와 같은 cfSave(값 확인·겉옷 확인·옷장에 넣기). 저장되면(ui.cf.saved) 옷장으로, 「저장하고 입어보기」면 이 옷을 입어볼 옷으로 고르고 홈(옷 칸이 보이게)으로.
       입히기는 홈의 「입어보기」로(횟수가 쓰이므로 저장만으로 바로 입히지 않는다) */
    addSave: function (el) {
      if (!ui.cf) return;
      /* 사진에서 아직 읽는 중이면(휴대폰 글자 읽기는 1분 가까이 걸릴 수 있음) 지금 저장하면 읽은 값이 안 들어간다 → 묻는다. 읽는 중 = PC 코드가 띄우는 「읽는 중」 글 */
      if (/읽는 중/.test(String(ui.cf.photoMsg || '') + ' ' + String(ui.cf.sizeMsg || '')) && !confirm('아직 사진에서 이름·가격이나 사이즈 표를 읽는 중이에요.\n지금 저장하면 읽은 값은 들어가지 않아요. 그래도 저장할까요?')) return;
      ui.cf.saved = false; ACT.cfSave();
      if (!ui.cf || !ui.cf.saved) return;
      var it = item(ui.cf.id), tryNow = el.dataset.v === 'try';
      if (tryNow && it && it.kind !== 'under') { selectItem(it); save(); ui.slotsOpen = true; ui.low = false; ui.genErr = null; }
      go(tryNow ? 'fit' : 'closet');
      var ts = document.querySelectorAll('.toast'), msg = !tryNow ? '' : it && it.kind === 'under' ? '옷장에 저장했어요. 언더웨어는 사이즈 확인용이라 입어보기에는 쓰지 않아요.' : '옷장에 저장하고 입어볼 옷으로 골랐어요. 아래 「입어보기」를 누르면 입혀 드려요.';
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
    homeZoom: function () { var st = ui.page === 'home' ? curLook() : null, hp = homePic(); openViewer([st ? { url: st.modelImage, alt: st.title + ' 기본 모델 착용 모습' } : ui.page === 'home' ? { url: avatarShow(), alt: hp.alt } : { url: hp.url, alt: hp.alt }], 0); },
    /* 2026-11-21 쇼츠형: 오른쪽 둥근 버튼. 핏 = 내 모습의 핏 창, 나머지 = 창(다시 누르면 닫힘) */
    rail: function (el) {
      var v = el.dataset.v;
      if (v === 'room') { go(ui.page === 'fit' ? 'home' : 'fit'); return; }
      if (v === 'fit') { if (ui.page === 'fit' && ui.fit) { ACT.fitClose(); return; } if (ui.page !== 'fit') go('fit'); ACT.fitOpen(); return; }
      if (ui.page === v) { ACT.panelClose(); return; }
      go(v);
    },
    panelClose: function () { go(ui.base === 'home' || ui.base === 'intro' ? ui.base : 'fit'); },
    /* 추천 코디: 넘기기·입힐 대상·핏 보기·입어보기 */
    lookMove: function (el) { ui.styleI += Number(el.dataset.v) || 1; render(); },
    lookWho: function (el) {
      /* 내 몸 창의 「기본 모델/내 아바타」(bTab)와 같은 값(state.who)을 바꾼다. 내 아바타는 사진이 없어도 기본 캐릭터에 내 치수로 입힘(처음 실행 「사진 없이 시작」과 같음) */
      var v = el.dataset.v === 'me' ? 'me' : 'base'; if (who() === v) return;
      state.who = v; ui.bodyTab = v; ui.view = curView(); save(); render();
    },
    lookFit: function () { var st = curLook(); if (!st) return; importStyle(st); ui.view = curView(); ui.fitTab = null; ui.genErr = null; go('fit'); ACT.fitOpen(); },
    lookWear: function () {
      var st = curLook(); if (!st) return;
      if (genPending || angBusy) { go('fit'); toast('지금 입히고 있어요. 다 되면 다시 눌러 주세요.', 3000); return; }
      importStyle(st); ui.view = curView(); ui.fitTab = null; ui.genErr = null; go('fit'); /* 2026-11-23: 옷 칸에만 넣고 입히지 않음(횟수 안 씀). 입히기는 피팅룸 「입어보기」 */
      toast('옷 칸에 넣었어요. 입힐 사람을 고르고 「입어보기」를 눌러 주세요.', 3500);
    },
    /* 핏 창: 결과 그림 저장(pc.js 2778행 savePic 과 같은 파일 이름. 지금 보고 있는 방향의 그림) */
    savePic: function () {
      var hp = homePic(); if (!hp.worn) { toast('저장할 입은 모습이 아직 없어요.'); return; }
      var a = document.createElement('a'); a.href = hp.url; a.download = 'FITON_' + String(hp.worn.name + (homeAng(hp.worn) !== 'front' ? '_' + ANG_NAME[homeAng(hp.worn)] : '')).replace(/[\\/:*?"<>|]/g, '_').slice(0, 40) + '.png'; document.body.appendChild(a); a.click(); a.remove();
    },
  /* ▼ pc.js 2769행 그대로 */
    wearOpt: function (el) { if (el.dataset.k === 'outerClosed') state.outerClosed = el.dataset.v === 'closed' ? 'closed' : 'open'; else if (el.dataset.k === 'beltUse') state.beltUse = el.dataset.v === 'on' ? 'on' : 'off'; else if (el.dataset.k === 'tuckIn') state.tuckIn = el.dataset.v === 'in' ? 'in' : 'out'; save(); render(); },
  /* ▲ */
    /* 옷장 「쇼핑 링크」: 빈 옷 확인을 링크 칸부터 열고, PC 와 같은 「링크에서 이름·가격 가져오기」(linkRead) */
    addLink: function () {
      ui.plus = false; closeViewer();
      var f = ui.cf = blankForm('top'); f.catAuto = true; f.catHit = false; f.tOpen = false; f.linkFirst = true;
      if (location.hash !== '#add') location.hash = '#add';
      render(); var i = document.getElementById('purl'); if (i) i.focus();
    },
  /* ▼ pc.js 2830~2855행 그대로 */
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
        }).catch(function (e) { if (ui.cf !== f) return; f.linkBusy = false; var em = (e && e.message) || '링크를 읽지 못했어요.'; f.err = /\((403|429)\)/.test(em) ? '이 쇼핑몰은 자동으로 읽지 못하게 막아 두었어요. 바로 아래 칸에 상품 화면 캡처를 붙여넣으면 이름·가격을 채워요.' : em; render(); });
    },
  /* ▲ */
    /* 4단계 입어보기 (C1·C2·C4·C7). 입히기는 PC 와 같은 wearAll(앞모습만) */
    wear: function () { ui.genErr = null; ui.fit = false; ui.fitSz = false; ui.angle = 'front'; wearAll(); }, /* 고른 방향(state.genViews)마다 1회 — PC 와 같음 */
    /* 만들 방향 켜고 끄기: 사진이 없는 방향은 PC 처럼 고를 수 없고 이유(angWhy)를 알려 줌 */
    genView: function (el) {
      var gv = el.dataset.v; if (gv !== 'front' && !angSrc(gv)) { toast(angWhy(gv), 3500); return; }
      state.genViews = state.genViews || { front: true }; state.genViews[gv] = !state.genViews[gv]; save(); render(); /* = pc.js 2743행 genView */
    },
    /* 볼 방향: 만든 그림이 있는 방향만 */
    angPick: function (el) {
      var w = el.dataset.why, v = el.dataset.v;
      if (w === 'busy') { toast(ANG_NAME[v] + '을 만들고 있어요. 다 되면 알려 드려요.', 3000); return; }
      if (w === 'none') { toast('이 옷의 ' + ANG_NAME[v] + '은 아직 만들지 않았어요. 아래 카드의 방향에서 ' + ANG_NAME[v] + '을 켜고 다시 입어 보세요.', 4500); return; }
      ui.angle = v; render();
    },
    errClose: function () { ui.genErr = null; render(); },
    slotsOpen: function () { ui.slotsOpen = true; ui.low = false; ui.fit = false; ui.fitSz = false; render(); },
    lowOff: function () { ui.low = false; render(); },
    /* C5 핏 서랍 열기·닫기·사이즈 비교 펼치기. 옷 탭(fitTab)·사이즈 바꾸기(size)는 아래 PC 코드 그대로 — 사이즈를 바꿔도 횟수는 쓰지 않고, 그림은 「다시 입히기」를 눌러야 바뀐다 */
    fitOpen: function () { ui.fit = true; ui.low = false; ui.fitSz = false; render(); var d = app.querySelector('.fitd'); if (d) d.scrollTop = 0; },
    fitClose: function () { ui.fit = false; ui.fitSz = false; render(); },
    fitSz: function () { ui.fitSz = !ui.fitSz; render(); },
  /* ▼ pc.js 2767행 그대로 */
    fitTab: function (el) { ui.fitTab = el.dataset.cat; render(); },
  /* ▲ */
  /* ▼ pc.js 2771행 그대로 */
    size: function (el) { var s = state.sel[el.dataset.cat]; if (s) { s.size = el.dataset.v; save(); render(); } },
  /* ▲ */
    slotsClose: function () { ui.slotsOpen = false; render(); },
    slotPick: function (el) { if (CATS[el.dataset.cat]) { ui.pick = el.dataset.cat; ui.plus = false; render(); } },
    pickClose: function () { ui.pick = null; render(); },
    pickNew: function () { ui.pick = null; ui.plus = true; render(); },
    /* pc.js 2786행 pickItem 과 같은 고르기·빼기(옷장 입력 칸 불러오기는 PC 전용이라 뺌). 다 빼면 마지막 입은 그림 기록도 지움(pc.js 2768행 unsel 과 같음) */
    pickItem: function (el) {
      var it = item(el.dataset.id); if (!it) return;
      if (it.kind === 'under') { toast('언더웨어는 사이즈 확인용으로만 저장돼요. 입어보기에는 쓰지 않아요.', 4000); return; }
      var c = state.sel[it.cat];
      if (c && c.id === it.id) { delete state.sel[it.cat]; if (!wearSet().length) delete state.wearLast; }
      else { state.sel[it.cat] = { id: it.id, size: null }; exclusiveSel(it.cat); }
      ui.pick = null; ui.genErr = null; ui.fit = false; ui.fitSz = false; save(); render();
    },
    buyOpen: function () { ui.buy = true; render(); },
    buyClose: function () { ui.buy = false; render(); },
    histOpen: function (el) { openViewer(histList().map(function (e) { return { key: e.key, url: urls.tryon[e.key], alt: lookName(e.key) + ' 입은 모습', info: histInfo(e) + VACTS }; }), Number(el.dataset.i) || 0, histAct); },
  /* ▼ pc.js 2951행 그대로 */
    histDel: function (el) { if (!confirm('이 입은 모습을 삭제할까요?')) return; dropTryon(el.dataset.id); ui.cmp = null; save(); render(); },
  /* ▲ */
    /* 5단계 옷장 카드 창(D1) */
    itmOpen: function (el) { if (item(el.dataset.id)) { ui.itm = el.dataset.id; ui.plus = false; render(); } },
    itmClose: function () { ui.itm = null; render(); },
    /* 2026-11-23 사용자 지시: 옷장에서 옷을 누르면 바로 피팅룸으로 가지 말고 고르기/빼기(다시 누르면 선택 해제). 다 고른 뒤 아래 「피팅룸 가기」로 이동 */
    itmPick: function (el) {
      var it = item(el.dataset.id); if (!it) return;
      if (it.kind === 'under') { toast('언더웨어는 사이즈 확인용으로만 저장돼요. 입어보기에는 쓰지 않아요.', 4000); return; }
      var c = state.sel[it.cat];
      if (c && c.id === it.id) { delete state.sel[it.cat]; if (!wearSet().length) delete state.wearLast; } else selectItem(it);
      ui.genErr = null; save(); render();
    },
    itmGo: function () { ui.genErr = null; ui.low = false; go('fit'); ui.slotsOpen = true; render(); },
    itmWear: function (el) {
      var it = item(el.dataset.id); if (!it) return;
      if (it.kind === 'under') { toast('언더웨어는 사이즈 확인용으로만 저장돼요. 입어보기에는 쓰지 않아요.', 4000); return; }
      selectItem(it); save(); ui.low = false; go('fit'); ui.slotsOpen = true; ui.genErr = null; render();
      toast('입어볼 옷으로 골랐어요. 아래 「입어보기」를 누르면 입혀 드려요.', 3500);
    },
    /* 고치기 = pc.js 2824행 editItem 과 같이 cfLoad 로 불러와 「옷 확인」 화면에서 고침. 이름으로 종류 바꾸기·처음 사진 AI 읽기는 하지 않음 */
    editItem: function (el) {
      var it = item(el.dataset.id); if (!it) return;
      ui.itm = null; ui.plus = false; closeViewer();
      cfLoad(it); var f = ui.cf; f.catAuto = false; f.catHit = false; f.tOpen = false; f.snap = cfSnap(f);
      if (location.hash !== '#add') location.hash = '#add';
      render();
    },
    /* 지우기 = PC delItem 그대로(입히는 중이면 막음·묻기·사진·입은 모습 함께 지움). PC 는 끝에 빈 입력 칸을 여는데 모바일은 그게 「옷 확인」 화면이라 지운 뒤 옷장으로 */
    delItem: function (el) {
      var id = el.dataset.id; PCDEL.delItem(el);
      if (!item(id)) { ui.cf = null; ui.itm = null; go('closet'); toast('지웠어요.', 2500); }
    },
    /* 로그아웃: 아직 못 올린 내용이 있으면 먼저 올리고(최대 6초) 나간다. 이 기기에 저장된 자료는 지우지 않는다 */
    logout: function () {
      var done = function () {
        if (!user) return;
        Sync.signOut(); closeViewer(); genStop(); clearUrls(); user = null; state = null; ui.onb = 0; ui.imp = ''; ui.wait = ''; ui.meEdit = false; ui.plus = false; ui.bodyTab = null; ui.cf = null;
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
    impSkip: function () { ui.imp = ''; if (ui.impSet) ui.impSet = false; else ui.onb = 1; render(); },
    /* 2026-11-23 설정에서 다시 열기(이미 자료가 있는 계정: 덮어쓴다는 것을 화면에 적고, 가져오기 직전에 한 번 더 묻는다) */
    impOpen: function () { if (!user || !impAny()) return; if (genPending) { toast('입은 모습을 만드는 중에는 가져올 수 없어요. 끝난 뒤 다시 눌러 주세요.', 4000); return; } ui.impSet = true; ui.imp = 'ask'; ui.lg.err = ''; render(); },
    /* 2026-11-23 이 브라우저에 남은 예전 계정 자료 가져오기(PIN 없음). 원래 자료는 지우지 않는다 */
    impAcc: function (el) {
      var o = oldAccs().filter(function (x) { return x.id === el.dataset.id; })[0]; if (!o) { render(); return; }
      if (ui.impSet && !confirm('지금 계정의 치수·옷장·기록(옷 ' + ((state && state.closet || []).length) + '벌)이 예전 계정 자료(옷 ' + o.closet + '벌)로 바뀌어요. 계속할까요?')) return;
      ui.wait = '가져오는 중…'; render();
      Sync.importLocal(o.id).then(function (n) {
        ui.wait = ''; ui.imp = ''; ui.impSet = false; state = load(); save(); ui.page = 'home'; enterApp();
        toast('예전 계정 자료를 가져왔어요(옷 ' + o.closet + '벌).' + (n ? ' 사진 ' + n + '장은 서버에 올리는 중이에요.' : ''), 4000);
      }, function (e) { ui.wait = ''; render(); toast((e && e.message) || '가져오지 못했어요.', 4000); });
    },
    impGo: function () {
      var u = Core.userById(ui.lg.id); if (!u) { ACT.impBack(); return; }
      if (!checkPin(u)) return;
      if (ui.impSet && !confirm('지금 계정의 치수·옷장·기록이 ' + u.nick + ' 프로필의 내용으로 바뀌어요. 계속할까요?')) return;
      ui.wait = '가져오는 중…'; render();
      Sync.importLocal(u.id).then(function (n) {
        ui.wait = ''; ui.imp = ''; ui.impSet = false; state = load(); save(); ui.page = 'home'; enterApp();
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
    /* 6단계 내 아바타: 사진 고르기·크게 보기는 모바일, 만들기·지우기는 PC 그대로 */
    avPick: function (el) { var k = el.dataset.v; if (k === 'avatar' || k === 'avatar_side' || k === 'avatar_back') pickFile(k, false); },
    avZoom: function (el) { var v = el.dataset.v, f = v === 'front', u = f ? urls.avatar || (state.profile.gender === 'male' ? 'assets/avatar_male.jpg?v=t' : 'assets/avatar_default.jpg?v=t') : urls.ang[v]; if (u) openViewer([{ url: u, alt: f && !urls.avatar ? '기본 캐릭터 전신' : '내 아바타 ' + ANG_NAME[v] }], 0); },
  /* ▼ pc.js 2744~2753행 그대로 */
    avMake: function () {
      if (!window.AvatarMake) return;
      AvatarMake.open({ bases: avMakeBases(), gender: state.profile.gender === 'male' ? 'male' : 'female', cfg: Core.genEnabled() ? window.TRYON_CFG : null, device: Core.deviceId(), seg: segLoad, hasAvatar: !!urls.avatar,
        onDone: function (blob, info) { var q = state.avSeq || 0, had = urls.ang.side || urls.ang.back;
          /* 만들기 창에서 고른 기본 체형의 성별이 프로필 성별과 다르면, 저장에 성공한 뒤 프로필 성별을 그 체형에 맞춘다(옷 입히기·옷 기본 성별·추천이 아바타와 어긋나지 않게). 키·몸무게·치수는 그대로. */
          var bb = info && info.method === 'base' && BASES.filter(function (b) { return b.id === info.base; })[0], ng = bb && (bb.g === 'male' ? 'male' : 'female'), gch = ng && ng !== (state.profile.gender === 'male' ? 'male' : 'female');
          avatarFront(blob).then(function () { if ((state.avSeq || 0) === q) return;
            if (gch) { state.profile.gender = ng; save(); render(); }
            toast((had ? '내 아바타 앞모습을 바꿨어요. 옆·뒷모습은 예전 사진 그대로라서, 새 앞모습과 다르면 다시 올리거나 지워 주세요.' : '내 아바타 앞모습을 저장했어요.') + (gch ? ' 고른 체형에 맞춰 내 치수의 성별을 ' + (ng === 'male' ? '남성' : '여성') + '으로 바꿨어요.' : ''), had || gch ? 9000 : 4500); }); } });
    },
  /* ▲ */
  /* ▼ pc.js 2755행 그대로 */
    avatarAngDel: function (el) { var av = el.dataset.v; if (ANGS.indexOf(av) < 0 || !confirm('내 아바타 ' + ANG_NAME[av] + ' 사진을 지울까요?')) return; if (urls.ang[av]) URL.revokeObjectURL(urls.ang[av]); urls.ang[av] = null; state.avAngSeq = state.avAngSeq || {}; state.avAngSeq[av] = (state.avAngSeq[av] || 0) + 1; save(); blobDel('avatar_' + av).catch(function () {}); render(); },
  /* ▲ */
    avatarDel: function () { PCAV.avatarDel(); },
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
    if (Date.now() - swAt < 400) return; /* 방금 쓸어서 칸을 움직였으면, 손을 뗀 자리의 버튼이 같이 눌리지 않게 */
    if (lpHeld) { lpHeld = false; return; } /* 옷장 카드를 길게 눌러 창을 열었으면 손을 뗄 때의 누르기는 버림(그 자리에 새로 뜬 창의 버튼이 눌리지 않게). 다음 손대기(touchstart)에서 풀림 */
    var el = e.target.closest('[data-act]');
    if (el && ACT[el.dataset.act]) ACT[el.dataset.act](el);
  });
  /* 2026-11-21 쇼츠형 손가락 쓸기(화면은 손을 뗄 때 한 번만 바뀐다, 끌려오는 움직임 없음)
     · 내 모습 아래 카드: 아래로 = 한 줄만 남기고 사진을 크게, 위로 = 다시 펼침. 카드 안에서 따로 넘겨 보는 곳(실패 이유)에서 시작한 쓸기는 건드리지 않는다
     · 사진 좌우: 추천 코디 = 이전·다음 코디, 내 모습 = 입어본 모습(기록)을 차례로(목업 v4 「사진을 좌우로 넘기면」)
     · 창(옷장·기록·내 몸·설정·요금제·핏) 손잡이·제목 줄을 아래로 = 닫기 */
  var sw = null, swAt = 0, lp = null, lpHeld = false;
  function sheetSwipe(down) {
    if (!user || !state || ui.page !== 'fit' || ui.fit || ui.cf || ui.onb || ui.imp || ui.wait || genPending || ui.genErr || !state.closet.length) return false;
    if (down) { if (ui.low) return false; ui.low = true; render(); return true; }
    if (ui.low) { ui.low = false; render(); return true; }
    return false;
  }
  /* 내 모습에서 사진을 좌우로: 입어본 기록 가운데 지금 캐릭터로 만든 것을 차례로. 고르는 방법은 기록 「내 모습에서 보기」(histAct wear = pc.js histShow)와 같음(횟수 안 씀) */
  function histMove(d) {
    if (genPending || angBusy) return false;
    var L = histList().filter(function (e) { return tryonOk(e.key) && lookItems(e.key).length; }); if (!L.length) return false;
    var wn = wornNow(), i = -1; L.forEach(function (e, k) { if (wn && e.key === wn.key) i = k; });
    if (i >= 0 && L.length < 2) return false;
    var e = L[i < 0 ? 0 : ((i + d) % L.length + L.length) % L.length], its = lookItems(e.key), hc = its.map(function (x) { return x.cat; });
    Object.keys(state.sel).forEach(function (c) { if (hc.indexOf(c) < 0) delete state.sel[c]; }); its.forEach(selectItem); state.wearLast = e.key; save();
    ui.view = curView(); ui.genErr = null; ui.angle = 'front'; ui.fitSz = false; render(); return true;
  }
  function photoSwipe(left) {
    if (!user || !state || ui.cf || ui.onb || ui.imp || ui.wait || ui.fit || viewer) return false;
    if (ui.page === 'home') { if (lookList().length < 2) return false; ui.styleI += left ? 1 : -1; render(); return true; }
    if (ui.page === 'fit') return histMove(left ? 1 : -1);
    return false;
  }
  /* 알림 글(.toast)은 body 에 붙어 칸 위를 덮는다. 알림 위에서 시작했어도 그 자리가 칸 안이면 칸을 쓴 것으로 본다 → 그래서 document 에서 듣는다 */
  function inSheet(g, x, y) {
    if (!g || !g.closest) return false;
    if (g.closest('.sv .sheet')) return !g.closest('.gerr p');
    if (!g.closest('.toast')) return false;
    var sh = app.querySelector('.sv .sheet'), r = sh && sh.getBoundingClientRect();
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }
  document.addEventListener('touchstart', function (e) {
    sw = null; if (lp) { clearTimeout(lp.t); lp = null; } lpHeld = false;
    var t = e.touches, g = e.target; if (t.length !== 1 || !g || !g.closest) return;
    var x = t[0].clientX, y = t[0].clientY;
    if (g.closest('.panel') && g.closest('.grab,.panel>.top,.pclose')) sw = { x: x, y: y, k: 'panel' };
    else if (inSheet(g, x, y)) sw = { x: x, y: y, k: 'sheet' };
    else if (g.closest('.sv .stage') && !g.closest('.rail,.modes,.stop,.sfoot')) sw = { x: x, y: y, k: 'photo' };
    var gt = g.closest('.gtap'); /* 옷장 카드 길게 누르기 = 「⋯」(고치기·구매·지우기) */
    if (gt) lp = { x: x, y: y, t: setTimeout(function () { lp = null; if (!gt.isConnected) return; lpHeld = true; ACT.itmOpen(gt); }, 550) };
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (!lp || !e.touches[0]) return;
    if (Math.abs(e.touches[0].clientX - lp.x) > 10 || Math.abs(e.touches[0].clientY - lp.y) > 10) { clearTimeout(lp.t); lp = null; }
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (lp) { clearTimeout(lp.t); lp = null; }
    var s = sw, t = e.changedTouches && e.changedTouches[0]; sw = null;
    if (!s || !t || e.touches.length) return;
    var dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (s.k === 'photo') { if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && photoSwipe(dx < 0)) swAt = Date.now(); return; }
    if (Math.abs(dy) < 40 || Math.abs(dy) < Math.abs(dx) * 1.5) return;
    if (s.k === 'panel') { if (dy > 0) { swAt = Date.now(); if (ui.fit) ACT.fitClose(); else ACT.panelClose(); } return; }
    if (sheetSwipe(dy > 0)) swAt = Date.now();
  }, { passive: true });
  document.addEventListener('touchcancel', function () { sw = null; if (lp) { clearTimeout(lp.t); lp = null; } }, { passive: true });
  /* 컴퓨터 오른쪽 누르기·안드로이드 길게 누르기(contextmenu)도 옷장 카드 창 */
  app.addEventListener('contextmenu', function (e) {
    var gt = e.target && e.target.closest && e.target.closest('.gtap'); if (!gt) return;
    e.preventDefault(); if (lp) { clearTimeout(lp.t); lp = null; lpHeld = true; }
    if (ui.itm !== gt.dataset.id) ACT.itmOpen(gt);
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
    var p = pageFromHash(); closeViewer(); if (p !== ui.page || drop) { if ((ui.page === 'home' || ui.page === 'fit' || ui.page === 'intro') && PANELS[p]) ui.base = ui.page; ui.page = p; ui.plus = false; ui.meEdit = false; ui.pick = null; ui.buy = false; ui.fit = false; ui.fitSz = false; ui.itm = null; render(); }
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
    expire: function () { if (!user) return; closeViewer(); genStop(); clearUrls(); user = null; state = null; ui.cf = null; ui.onb = 0; ui.imp = ''; ui.wait = ''; ui.au = { mode: 'login', err: '다시 로그인해 주세요', busy: false, email: '', agree: false, note: '' }; render(); },
    blobs: function () { mediaAgain(); } /* 서버에서 사진을 받으면 화면에 반영 */
  });
  function boot() {
    if (user && Sync.hasLocal()) {
      /* 이 기기에 내 자료가 있으면 바로 열고, 뒤에서 서버와 맞춘다(다른 기기에서 고친 것이 더 새로우면 그 내용으로) */
      state = load(); render(); loadMedia().then(function () { ui.mediaReady = true; render(); genResume(); angResume(); });
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
