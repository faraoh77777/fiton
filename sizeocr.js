/* 사이즈표 캡처 → 실측표 자동 입력.
   글자 읽기(OCR)는 브라우저 안에서 Tesseract.js 로 한다. 사진은 서버로 보내지 않고,
   글자 인식 엔진·한글 학습 데이터만 공개 CDN 에서 내려받는다. 읽은 결과는 사람이 확인·수정해야 한다. */
(function (root) {
  'use strict';

  /* 사이즈 이름으로 인정하는 글자: 영문(XXXS~6XL), 일본식(LL·2L~6L), 프리·원사이즈 */
  var SIZE_WORDS = /^(XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|XXXXL|[2-6]XL|LL|[2-6]L|F|FREE|FR|프리|프리사이즈|ONE|ONESIZE|원사이즈|フリー|フリーサイズ|ワンサイズ|均码|均碼)$/i;
  /* 괄호 안 설명(예: S (25~26) 의 25~26)은 사이즈 이름을 찾을 때 뺀다 */
  function noParen(l) { return String(l).normalize('NFKC').replace(/\([^)]*\)/g, ' '); }
  /* 항목별 키워드(공백 제거 후 포함 여부). 위에서부터 먼저 맞는 항목에 줄을 배정한다 */
  var KEYS = {
    /* 상의: 소매통·소매단면은 '소매'보다 먼저 두어 소매길이로 잘못 들어가지 않게 한다 (구체적인 항목이 앞) */
    top: [['chest', ['가슴단면', '가슴둘레', '가슴너비', '가슴폭', '가슴', '흉위', '흉', '바스트', '身幅', '胸囲', '胸围', '胸圍', '胸宽', '胸寬', 'バスト', '胸周り', 'pittopit', 'chest', 'bust']], ['shoulder', ['어깨너비', '어깨단면', '어깨', '견폭', '肩幅', '肩宽', '肩寬', 'shoulder']], ['armhole', ['암홀', '진동', 'アームホール', '袖窿', '袖ぐり', 'armhole']],
      ['sleeve_width', ['소매통', '소매단면', '소매너비', '소매폭', '팔통', '팔단면', '팔뚝', '袖幅', '袖肥', '上臂围', '上臂圍', 'bicep']], ['cuff', ['袖口', 'カフス']], ['sleeve', ['소매길이', '소매기장', '팔길이', '소매장', '소매', '팔', '袖丈', '袖长', '袖長', 'sleeve']], ['hem', ['밑단', '하단', '도련', '裾幅', '裾回り', '下摆', '下擺']],
      ['length', ['총장', '총기장', '옷길이', '상의길이', '총길이', '전체길이', '기장', '길이', '着丈', '身丈', '衣长', '衣長', '总长', '總長', '全长', '全長', 'length']],
      /* 2026-11-12 상의 표의 「허리」 열: 앱 칸은 없지만 이름을 알아야 열 순서가 밀리지 않는다(예전엔 허리 값이 다음 칸에 들어감) */
      ['waist', ['허리단면', '허리둘레', '허리', '웨이스트', 'ウエスト', '腰围', '腰圍', '腰宽', '腰寬', 'waist']]],
    /* 하의: 인심(가랑이~밑단)과 총장(허리~밑단, 스커트·총장만 적힌 바지)을 따로 읽는다. '밑위길이·안쪽길이'의 '길이'가 총장으로 잡히지 않게 긴 말을 먼저 둔다 */
    bottom: [['waist', ['허리단면', '허리둘레', '허리', '웨이스트', 'ウエスト', '腰围', '腰圍', '腰宽', '腰寬', 'waist']], ['hip', ['엉덩이', '힙', 'ヒップ', '臀围', '臀圍', '臀宽', '臀寬']], ['thigh', ['허벅지', '渡り幅', 'わたり', '大腿围', '大腿圍', '大腿宽', '大腿寬', '腿围', '腿圍', 'thigh']], ['knee', ['무릎', '膝幅', 'ひざ幅', '膝围', '膝圍', 'knee']], ['backrise', ['뒷밑위', '뒤밑위', '後股上', '后股上', '后裆', '後襠', 'backrise']], ['rise', ['밑위길이', '앞밑위', '밑위', '股上', '前裆', '前襠', '立裆', '立襠', '裆深']],
      ['inseam', ['인심길이', '안쪽기장', '안쪽길이', '안기장', '인심', '안쪽', '股下', '内长', '內長', '内侧长', '內側長', '内缝', '內縫', 'inseam']], ['hem', ['밑단', '발목단면', '발목둘레', '裾幅', '裾周り', '裤脚', '褲腳', '脚口', '腳口', '裤口', '褲口', 'legopening']], ['length', ['바지기장', '바지길이', '치마기장', '스커트길이', '치마길이', '총장', '총기장', '총길이', '기장', '길이', '総丈', '全丈', 'パンツ丈', 'スカート丈', '裤长', '褲長', '裙长', '裙長', '全长', '全長', '总长', '總長', 'length']]],
    dress: [['chest', ['가슴단면', '가슴둘레', '가슴', '흉위', '흉', '바스트', '身幅', '胸囲', '胸围', '胸圍', '胸宽', '胸寬', 'バスト', 'chest', 'bust']], ['shoulder', ['어깨너비', '어깨단면', '어깨', '견폭', '肩幅', '肩宽', '肩寬', 'shoulder']], ['waist', ['허리단면', '허리둘레', '허리', '웨이스트', 'ウエスト', '腰围', '腰圍', '腰宽', '腰寬', 'waist']], ['hip', ['엉덩이', '힙', 'ヒップ', '臀围', '臀圍', '臀宽', '臀寬']], ['armhole', ['암홀', '진동', 'アームホール', '袖窿', '袖ぐり', 'armhole']],
      ['sleeve_width', ['소매통', '소매단면', '소매너비', '소매폭', '팔통', '팔단면', '팔뚝', '袖幅', '袖肥', 'bicep']], ['cuff', ['袖口', 'カフス']], ['sleeve', ['소매길이', '소매기장', '팔길이', '소매장', '소매', '팔', '袖丈', '袖长', '袖長', 'sleeve']], ['hem', ['밑단', '하단', '도련', '裾幅', '裾回り', '下摆', '下擺']], ['length', ['총장', '총기장', '총길이', '기장', '길이', '着丈', '身丈', '衣长', '衣長', '裙长', '裙長', '总长', '總長', '全长', '全長', 'length']]],
    shoe: [['inner', ['안쪽', '안길이', '발길이', '내부']]]
  };
  var NUM = /\d+(?:\.\d+)?/g;

  function nums(s) { return (String(s).match(NUM) || []).map(Number); }
  function squeeze(s) { return String(s).replace(/\s+/g, '').toLowerCase(); }

  /* 소수점 OCR 오류 보정: "35. 5", "13, 5" → 35.5, 13.5 */
  function fixNum(l) { return l.replace(/(\d)\s*[.,]\s+(\d)(?!\d)/g, '$1.$2'); }

  /* 사이즈가 세로, 항목이 가로인 표 (쿠팡에 흔함): 머리줄의 항목 순서대로 아래 줄 숫자를 읽는다 */
  function parseColumns(lines, cat) {
    var keys = KEYS[cat] || [], hi = -1, order = [];
    for (var i = 0; i < lines.length && hi < 0; i++) {
      var sq = squeeze(lines[i]), hits = [];
      keys.forEach(function (k) {
        k[1].slice().sort(function (a, b) { return b.length - a.length; }).some(function (w) {
          var p = sq.indexOf(w);
          if (p < 0) return false;
          hits.push({ f: k[0], p: p });
          sq = sq.slice(0, p) + new Array(w.length + 1).join('_') + sq.slice(p + w.length);
          return true;
        });
      });
      if (hits.length >= 2) { hi = i; order = hits.sort(function (a, b) { return a.p - b.p; }).map(function (x) { return x.f; }); }
    }
    if (hi < 0) return null;
    var out = [], extra = 0;
    for (var j = hi + 1; j < lines.length; j++) {
      var m = fixNum(lines[j]).normalize('NFKC').match(/^[\s|:\[\(]*((?:[2-6]?XL|XXXXL|XXXL|XXL|XXXS|XXS|XS|[2-6]L|LL|S|M|L|F|FREE|프리사이즈|프리|44|55|66|77|88|99|8[05]|9[05]|1[0-2][05]))(?=\s|$)(.*)$/i);
      if (!m) continue;
      var n = nums(m[2].replace(/\d+\s*[-~]\s*\d+/g, ' ')).filter(function (x) { return x > 0 && x < 300; });
      if (n.length < order.length) continue;
      if (n.length > order.length) extra = Math.max(extra, n.length - order.length);
      var rec = { label: m[1].toUpperCase() };
      order.forEach(function (f, c) { rec[f] = String(n[c]); });
      out.push(rec);
    }
    return out.length ? { sizes: out, found: order.length, extra: extra } : null;
  }

  /* 2026-11-12 사이즈 1개짜리 한 줄 표(예: FREE 총장41 허리(밴딩)30~ 힙44 밑단56): 항목 이름 바로 뒤 숫자 하나씩을 읽는다.
     항목 사이마다 숫자가 정확히 1개일 때만 이 형식으로 본다(가슴 50 52 54 같은 여러 사이즈 줄은 건드리지 않음) */
  function parseInline(lines, cat) {
    var keys = KEYS[cat] || [];
    for (var i = 0; i < lines.length; i++) {
      var raw = fixNum(lines[i]).normalize('NFKC'), sq = raw.replace(/\s+/g, ''), low = sq.toLowerCase(), hits = [];
      keys.forEach(function (k) {
        k[1].slice().sort(function (a, b) { return b.length - a.length; }).some(function (w) {
          var p = low.indexOf(w);
          if (p < 0) return false;
          hits.push({ f: k[0], p: p, e: p + w.length });
          low = low.slice(0, p) + new Array(w.length + 1).join('_') + low.slice(p + w.length);
          return true;
        });
      });
      if (hits.length < 2) continue;
      hits.sort(function (a, b) { return a.p - b.p; });
      var rec = {}, ok = true;
      hits.forEach(function (x, j) {
        var seg = sq.slice(x.e, j + 1 < hits.length ? hits[j + 1].p : sq.length).replace(/\([^)]*\)/g, ' ');
        var n = nums(seg.replace(/(\d)[-~](\d)/g, '$1 $2')).filter(function (v) { return v > 0 && v < 300; });
        if (n.length !== 1 && !(n.length === 2 && /\d[-~]\d/.test(seg))) { ok = false; return; }
        rec[x.f] = String(n[0]);
      });
      if (!ok) continue;
      var lab = noParen(raw.slice(0, raw.search(/[가-힣]/) < 0 ? raw.length : raw.search(/[가-힣]/))).split(/[\s|,/:]+/).filter(function (t) { return SIZE_WORDS.test(t); })[0];
      rec.label = lab ? lab.toUpperCase() : 'FREE';
      return { sizes: [rec], found: hits.length };
    }
    return null;
  }

  /* 사이즈가 커지면 값도 커져야 한다: 이웃과 어긋난 칸을 찾아 알려 준다 */
  function suspect(sizes) {
    var bad = [], fields = {};
    sizes.forEach(function (r) { Object.keys(r).forEach(function (k) { if (k !== 'label') fields[k] = 1; }); });
    Object.keys(fields).forEach(function (f) {
      sizes.forEach(function (r, i) {
        var v = Number(r[f]), p = i > 0 ? Number(sizes[i - 1][f]) : null, q = i < sizes.length - 1 ? Number(sizes[i + 1][f]) : null;
        if ((p != null && !(v >= p)) || (q != null && !(v <= q))) bad.push(r.label + ' ' + f);
      });
    });
    return bad;
  }

  /* OCR 로 읽은 글자 → { sizes:[{label, 필드...}], found:n, circ:bool } (못 읽으면 sizes 빈 배열) */
  function parse(text, cat) {
    var lines = String(text || '').split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    lines = lines.map(function (l) { return l.replace(/(^|[\s|])품(?=[\s|\d]|$)/g, '$1가슴'); });  /* 단독 '품'(가슴 폭)만 가슴으로. 제품·상품의 품은 그대로 */
    if (cat !== 'shoe') {
      /* OCR이 사이즈 이름 'S'를 숫자 '5'로 잘못 읽는 경우가 많아, 줄 맨 앞에 홀로 있는 5만 S로 보정한다
         (5.5처럼 소수점으로 이어지거나 50처럼 다른 숫자와 붙어 있으면 손대지 않는다) */
      lines = lines.map(function (l) { return l.replace(/^5\b(?!\.)/, 'S'); });
      var col = parseColumns(lines, cat), all = lines.join('').replace(/\s+/g, '');
      if (col) {
        var big = col.sizes.some(function (r) { return Number(r.chest || r.waist || r.hip || 0) > 70; });
        return { sizes: col.sizes, found: col.found, circ: (big || /둘레|周り|回り|[围圍]/.test(all)) && !/단면|幅|[宽寬]/.test(all), bad: suspect(col.sizes).concat(col.extra ? ['항목 이름을 다 읽지 못해 열이 밀렸을 수 있음'] : []) };
      }
    }
    if (cat !== 'shoe') {
      var one = parseInline(lines, cat), all1 = lines.join('');
      if (one) return { sizes: one.sizes, found: one.found, circ: /둘레|周り|回り|[围圍]/.test(all1) && !/단면|幅|[宽寬]/.test(all1), bad: [] };
    }
    var keys = KEYS[cat] || [], used = {}, rows = {}, circ = false, flat = false;

    if (cat === 'shoe') {
      var sizes = [];
      lines.some(function (l) { var n = nums(l).filter(function (x) { return x >= 200 && x <= 330 && x % 5 === 0; }); if (n.length >= 3) { sizes = n; return true; } return false; });
      if (!sizes.length) return { sizes: [], found: 0, circ: false };
      return { sizes: sizes.map(function (v) { return { label: String(v) }; }), found: 0, circ: false };
    }

    keys.forEach(function (k) {
      for (var i = 0; i < lines.length; i++) {
        if (used[i]) continue;
        var sq = squeeze(lines[i]);
        if (!k[1].some(function (w) { return sq.indexOf(w) >= 0; })) continue;
        var n = nums(lines[i].replace(/\(.*?\)/g, ' ')).filter(function (x) { return x > 0 && x < 300; });
        if (n.length < 2) continue;
        used[i] = true; rows[k[0]] = n;
        if (/둘레|周り|回り|[围圍]/.test(sq)) circ = true;
        if (/단면|幅|[宽寬]/.test(sq)) flat = true;
        break;
      }
    });
    /* 2026-11-13 세로 표(사이즈가 가로, 항목이 세로)에서 「C 팔 길이」의 '팔'이 글자 인식에서 빠져 「길이」만 남은 줄: 총장을 이미 찾았고 소매가 없으면 소매로 본다 */
    if (cat === 'top' && !rows.sleeve && Object.keys(rows).length) {
      for (var li = 0; li < lines.length; li++) {
        if (used[li]) continue;
        var sl = squeeze(lines[li]);
        if (sl.indexOf('길이') < 0) continue;
        var ns = nums(lines[li].replace(/\(.*?\)/g, ' ')).filter(function (x) { return x > 0 && x < 300; });
        if (ns.length >= 2) { used[li] = true; rows.sleeve = ns; break; }
      }
    }
    var found = Object.keys(rows);
    if (!found.length) return { sizes: [], found: 0, circ: false };

    /* 사이즈 이름 줄: 문자 사이즈(S M L …)가 2개 이상 있는 줄 */
    var labels = null;
    for (var i = 0; i < lines.length && !labels; i++) {
      var toks = noParen(lines[i]).split(/[\s|,/]+/).filter(Boolean);
      var hit = toks.filter(function (t) { return SIZE_WORDS.test(t); });
      if (hit.length >= 2 && hit.length >= toks.length - 3) labels = hit.map(function (t) { return t.toUpperCase(); });
    }
    /* 한국 사이즈 표기(44-55 55-66)처럼 범위가 사이즈 이름인 표: 항목 이름이 없는 줄에서 범위가 둘 이상이면 그대로 사이즈 이름으로 쓴다 */
    for (var rj = 0; rj < lines.length && !labels; rj++) {
      var rg = lines[rj].normalize('NFKC').match(/\d{2,3}\s*[-~]\s*\d{2,3}/g);
      if (!rg || rg.length < 2) continue;
      var sr = squeeze(lines[rj]);
      if (keys.some(function (k) { return k[1].some(function (w) { return sr.indexOf(w) >= 0; }); })) continue;
      labels = rg.map(function (t) { return t.replace(/\s+/g, '').replace('~', '-'); });
    }
    for (var j = 0; j < lines.length && !labels; j++) {
      var sq2 = squeeze(lines[j]);
      if (sq2.indexOf('사이즈') < 0 && sq2.indexOf('size') < 0 && sq2.indexOf('サイズ') < 0 && sq2.indexOf('尺码') < 0 && sq2.indexOf('尺碼') < 0) continue;
      var nn = nums(noParen(lines[j]));
      if (nn.length >= 2) labels = nn.map(String);
    }
    var count = Math.max.apply(null, found.map(function (f) { return rows[f].length; }));
    if (labels && labels.length < count) labels = null;
    /* 개수가 다르면 가장 많이 읽힌 줄 기준으로 맞춘다 */
    var n = labels ? labels.length : count;
    if (!labels) { var DEF = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL', '5XL']; labels = DEF.slice(0, n).concat(new Array(Math.max(0, n - DEF.length)).fill('')); }
    var out = [];
    for (var c = 0; c < n; c++) {
      var rec = { label: labels[c] };
      found.forEach(function (f) {
        var arr = rows[f], off = arr.length - n;     /* 오른쪽 끝을 기준으로 정렬 (앞쪽 잡음 숫자 무시) */
        var v = arr[c + off];
        if (arr.length >= n && v != null) rec[f] = String(v);
      });
      out.push(rec);
    }
    return { sizes: out, found: found.length, circ: circ && !flat, bad: suspect(out) };
  }

  /* 상품 사진 캡처에서 상품 이름·가격 읽기. 화면에 섞여 있는 리뷰·배송·적립 안내 등은 걸러낸다 */
  var PRODUCT_NOISE = ['리뷰', '평점', '별점', '쿠팡', '로켓배송', '무료배송', '당일배송', '판매자', '브랜드관', '알림받기', '사은품',
    '쿠폰', '적립', '할인쿠폰', '이벤트', '광고', '구성', '옵션', '바로구매', '장바구니', '찜하기', '배송비'];
  function parseProduct(text) {
    var lines = String(text || '').split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    var prices = [];
    lines.forEach(function (l) {
      if (/적립|쿠폰/.test(l)) return;
      var m = l.replace(/\s+/g, '').match(/\d[\d,]*(?=원)/g);
      if (!m) return;
      m.forEach(function (s) {
        var n = Number(s.replace(/,/g, ''));
        if (n >= 100 && n <= 50000000) prices.push(n);
      });
    });
    /* 할인 표시는 보통 '세일가 ... 정가' 순서라 작은 값이 실제 가격일 때가 많다 */
    var price = prices.length ? Math.min.apply(null, prices) : null;
    var name = '';
    lines.forEach(function (l) {
      if (l.length < 4 || l.length > 60) return;
      if (PRODUCT_NOISE.some(function (w) { return l.indexOf(w) >= 0; })) return;
      var letters = (l.match(/[가-힣a-zA-Z]/g) || []).length;
      if (letters < l.replace(/\s+/g, '').length * 0.5) return;
      if (letters > (name.match(/[가-힣a-zA-Z]/g) || []).length) name = l;
    });
    return { name: name, price: price };
  }

  var loading = null;
  function loadEngine() {
    if (root.Tesseract) return Promise.resolve();
    if (!loading) loading = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js';
      s.onload = res; s.onerror = function () { loading = null; rej(new Error('글자 인식 엔진을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.')); };
      document.head.appendChild(s);
    });
    return loading;
  }
  /* 표의 긴 가로·세로 선은 글자 인식을 방해하므로 지운다 (글자 획보다 훨씬 긴 검은 줄만) */
  function stripLines(ctx, w, h) {
    var im = ctx.getImageData(0, 0, w, h), d = im.data, min = Math.max(70, Math.round(Math.max(w, h) * 0.045));
    var dark = new Uint8Array(w * h), kill = new Uint8Array(w * h), x, y, run, s;
    for (var i = 0; i < w * h; i++) dark[i] = d[i * 4] < 150 ? 1 : 0;
    for (y = 0; y < h; y++) {
      run = 0;
      for (x = 0; x <= w; x++) {
        if (x < w && dark[y * w + x]) run++;
        else { if (run >= min) for (s = x - run; s < x; s++) kill[y * w + s] = 1; run = 0; }
      }
    }
    for (x = 0; x < w; x++) {
      run = 0;
      for (y = 0; y <= h; y++) {
        if (y < h && dark[y * w + x]) run++;
        else { if (run >= min) for (s = y - run; s < y; s++) kill[s * w + x] = 1; run = 0; }
      }
    }
    for (i = 0; i < w * h; i++) {
      if (kill[i]) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 255; }
      else { var v = dark[i] ? 0 : 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; }
    }
    ctx.putImageData(im, 0, 0);
  }
  /* 작은 캡처도 읽히도록 확대하고 흑백으로 바꾼다 */
  function prep(file) {
    return new Promise(function (res) {
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.max(1, Math.min(3, 1800 / img.width));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        var x = c.getContext('2d');
        x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
        x.imageSmoothingQuality = 'high';
        x.filter = 'grayscale(1) contrast(1.25)';
        x.drawImage(img, 0, 0, c.width, c.height);
        try { stripLines(x, c.width, c.height); } catch (e) { /* 선 제거 실패 시 원본 그대로 */ }
        URL.revokeObjectURL(u);
        c.toBlob(function (b) { res(b || file); }, 'image/png');
      };
      img.onerror = function () { URL.revokeObjectURL(u); res(file); };
      img.src = u;
    });
  }
  function recognize(file, onProgress, langs) {
    var worker = null;
    return loadEngine().then(function () {
      return Promise.all([prep(file), root.Tesseract.createWorker(langs || 'kor+eng', 1, { logger: function (m) { if (onProgress && m && m.progress != null) onProgress(m.status, m.progress); } })]);
    }).then(function (r) {
      worker = r[1];
      return worker.setParameters({ tessedit_pageseg_mode: '6', preserve_interword_spaces: '1' }).then(function () { return worker.recognize(r[0]); });
    }).then(function (r) { return worker.terminate().then(function () { return r.data.text; }); },
      function (e) { if (worker) worker.terminate(); throw e; });
  }

  var LANGS_ALT = 'eng+jpn+chi_sim+chi_tra'; /* 2026-11-13 다국어: 한글로 못 읽은 표는 일본어·중국어(간체·번체)로 한 번 더 */
  root.SizeOcr = { parse: parse, parseProduct: parseProduct, recognize: recognize, LANGS_ALT: LANGS_ALT };
  if (typeof module !== 'undefined') module.exports = root.SizeOcr;
})(typeof window !== 'undefined' ? window : globalThis);
