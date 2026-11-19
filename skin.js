/* FITON for PC — 스킨(색 버전) 선택 (2026-11-19)
   pc-black.html · pc-white.html · pc-wine.html 의 <head> 에서 pc.css 바로 뒤에 읽는다(화면이 그려지기 전에 색 파일을 끼워 넣어 번쩍임이 없다).
   고른 스킨은 이 브라우저(localStorage 'fiton-skin')에 저장한다. 저장값이 없으면 연 파일의 기본 스킨(<html data-skin>).
   스킨을 바꾸면 색 파일(<link id="skin">)만 갈아 끼우고 주소도 그 스킨 파일로 맞춘다(새로 고침 없음).
   색 파일 버전 번호(?v=)는 여기 한 곳에서만 관리한다. sw = 설정 화면 견본 색(바탕·카드·강조). */
(function () {
  var KEY = 'fiton-skin';
  var SKINS = [
    { id: 'black', name: '블랙', css: '', tc: '#0E0F11', page: 'pc-black.html', sw: ['#0E0F11', '#22252B', '#C6F432'] },
    { id: 'white', name: '화이트', css: 'pc-white.css?v=20261119a', tc: '#F3F4EF', page: 'pc-white.html', sw: ['#F3F4EF', '#FFFFFF', '#4E7A00'] },
    { id: 'wine', name: '부티크', css: 'pc-wine.css?v=20261119a', tc: '#FAF7F2', page: 'pc-wine.html', sw: ['#FAF7F2', '#FFFFFF', '#9E1B42'] }
  ];
  function find(id) { for (var i = 0; i < SKINS.length; i++) if (SKINS[i].id === id) return SKINS[i]; return null; }
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  var cur = find(saved) || find(root.getAttribute('data-skin')) || SKINS[0];

  function meta(s) { var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', s.tc); root.setAttribute('data-skin', s.id); }
  function url(s) { /* 주소를 그 스킨 파일로(쿼리·# 뒤는 그대로). file:// 처럼 막히는 곳에서는 그냥 둔다 */
    try {
      var here = location.pathname.split('/').pop();
      if (here && here !== s.page && find(here.replace(/^pc-|\.html$/g, ''))) history.replaceState(history.state, '', s.page + location.search + location.hash);
    } catch (e) {}
  }

  /* 색 파일 link 는 모두 class="skinlink". 지금 쓰는 것 하나만 남기고 나머지는 지운다(빠르게 연달아 눌러도 옛 색 파일이 남지 않게) */
  var live = null;
  function sweep() { var ls = document.querySelectorAll('link.skinlink'); for (var i = 0; i < ls.length; i++) if (ls[i] !== live && ls[i].parentNode) ls[i].parentNode.removeChild(ls[i]); }

  /* 처음: 색 파일을 막는(blocking) 방식으로 끼워 넣는다 */
  if (cur.css) { document.write('<link rel="stylesheet" class="skinlink" id="skin" href="' + cur.css + '">'); live = document.getElementById('skin'); }
  meta(cur); url(cur);

  window.FitSkin = {
    list: SKINS,
    cur: function () { return cur.id; },
    set: function (id) {
      var s = find(id); if (!s || s === cur) return false;
      if (s.css) { /* 새 색 파일이 다 읽힌 뒤에 옛 파일을 뺀다(중간에 검정이 번쩍이지 않게) */
        var l = document.createElement('link'); l.rel = 'stylesheet'; l.className = 'skinlink'; l.href = s.css;
        var done = function () { if (live === l) sweep(); };
        l.onload = done; l.onerror = done;
        var ls = document.querySelectorAll('link.skinlink'), after = ls.length ? ls[ls.length - 1] : document.querySelector('link[href^="pc.css"]');
        after.insertAdjacentElement('afterend', l);
        live = l;
      } else { live = null; sweep(); }
      cur = s; meta(s); url(s);
      try { localStorage.setItem(KEY, s.id); } catch (e) {}
      return true;
    }
  };
})();
