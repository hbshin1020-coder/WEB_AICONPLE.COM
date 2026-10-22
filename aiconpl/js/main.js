/* ============================================================
   AICONPL — UI 동작
   네비 / 지표 카운트업 / 기능 캐러셀 / 매체 탭 / 로고월
   / 하단 고정 바 / 팝업
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.CONFIG || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 로고월 자리표시자 ----------
     실제 고객사 로고로 바꾸려면 아래를 이미지 경로로 교체하십시오.
     예) { img: 'assets/img/logos/brand-a.png', alt: 'BRAND A' }  */
  var LOGOS = [
    { text: 'BRAND A' }, { text: 'BRAND B' }, { text: 'BRAND C' }, { text: 'BRAND D' },
    { text: 'BRAND E' }, { text: 'BRAND F' }, { text: 'BRAND G' },
    { text: 'BRAND H' }, { text: 'BRAND I' }, { text: 'BRAND J' }, { text: 'BRAND K' },
    { text: 'BRAND L' }, { text: 'BRAND M' }, { text: 'BRAND N' },
    { text: 'BRAND O' }, { text: 'BRAND P' }, { text: 'BRAND Q' }, { text: 'BRAND R' },
    { text: 'BRAND S' }, { text: 'BRAND T' }, { text: 'BRAND U' }
  ];

  /* ============ 0. 연락처 반영 ============ */
  function applyContact() {
    var c = CFG.contact || {};
    if (c.tel)      $$('[data-tel]').forEach(function (el) { el.textContent = c.tel; });
    if (c.telHref)  $$('[data-tel-href]').forEach(function (el) { el.setAttribute('href', c.telHref); });
    if (c.email)    $$('[data-email]').forEach(function (el) { el.textContent = c.email; });
    if (c.hours)    $$('[data-hours]').forEach(function (el) { el.textContent = c.hours; });
  }

  /* ============ 1. 모바일 네비 ============ */
  function initNav() {
    var burger = $('#navBurger'), menu = $('#navMenu');
    if (!burger || !menu) return;

    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        menu.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) burger.click();
    });
  }

  /* ============ 2. 지표 + 카운트업 ============ */
  var STAT_ART = [
    '<svg viewBox="0 0 120 110" width="120" height="110" aria-hidden="true"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6C2BF2"/><stop offset="1" stop-color="#8CE99A"/></linearGradient></defs><rect x="22" y="22" width="76" height="16" rx="8" fill="url(#g1)"/><rect x="22" y="47" width="76" height="16" rx="8" fill="url(#g1)" opacity=".7"/><rect x="22" y="72" width="76" height="16" rx="8" fill="url(#g1)" opacity=".4"/></svg>',
    '<svg viewBox="0 0 120 110" width="120" height="110" aria-hidden="true"><defs><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2A2A32"/><stop offset="1" stop-color="#6C2BF2"/></linearGradient></defs><path d="M18 62c22-30 62-30 84 0-22 22-62 22-84 0z" fill="url(#g2)"/><path d="M18 62c22 22 62 22 84 0" fill="none" stroke="#8CE99A" stroke-width="3" opacity=".8"/></svg>',
    '<svg viewBox="0 0 120 110" width="120" height="110" aria-hidden="true"><rect x="20" y="26" width="18" height="58" rx="9" fill="#6C2BF2"/><path d="M46 26h12c10 0 10 58 0 58H46z" fill="#8CE99A"/><path d="M74 26h12c10 0 10 58 0 58H74z" fill="#8CE99A" opacity=".55" transform="scale(-1,1) translate(-172,0)"/><rect x="92" y="26" width="18" height="58" rx="9" fill="#6C2BF2" opacity=".7"/></svg>',
    '<svg viewBox="0 0 120 110" width="120" height="110" aria-hidden="true"><circle cx="46" cy="55" r="29" fill="#6C2BF2"/><circle cx="68" cy="55" r="29" fill="#8CE99A" opacity=".82"/><circle cx="88" cy="55" r="22" fill="#2A2A32"/></svg>'
  ];

  function initStats() {
    var grid = $('#statsGrid');
    if (!grid) return;
    var items = (CFG.stats || []);
    grid.innerHTML = items.map(function (s, i) {
      return '<li class="stat">' +
        '<div class="stat__art">' + (STAT_ART[i] || '') + '</div>' +
        '<p class="stat__num" data-to="' + s.value + '" data-suffix="' + (s.suffix || '') + '">0</p>' +
        '<p class="stat__label">' + s.label + '</p></li>';
    }).join('');

    var nums = $$('.stat__num', grid);
    var fmt = function (n) { return n.toLocaleString('ko-KR'); };

    function run(el) {
      var to = parseInt(el.dataset.to, 10) || 0, sfx = el.dataset.suffix || '';
      if (reduceMotion || to === 0) { el.textContent = fmt(to) + sfx; return; }
      var t0 = performance.now(), dur = 1400;
      (function step(t) {
        var p = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);                 // easeOutCubic
        el.textContent = fmt(Math.round(to * e)) + sfx;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: .4 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ============ 3. 기능 캐러셀 ============ */
  function initFeatures() {
    var slides = $$('.feat__slide'), dots = $('#featDots');
    if (!slides.length || !dots) return;
    var idx = 0;

    dots.innerHTML = slides.map(function (_, i) {
      return '<li><button role="tab" aria-selected="' + (i === 0) +
             '" aria-label="기능 ' + (i + 1) + '번"></button></li>';
    }).join('');
    var dotBtns = $$('button', dots);

    function go(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
      dotBtns.forEach(function (b, i) { b.setAttribute('aria-selected', String(i === idx)); });
      if (idx === 1 && window.AICONPL_MAP) window.AICONPL_MAP.refresh();
    }

    dotBtns.forEach(function (b, i) { b.addEventListener('click', function () { go(i); }); });
    var prev = $('#featPrev'), next = $('#featNext');
    if (prev) prev.addEventListener('click', function () { go(idx - 1); });
    if (next) next.addEventListener('click', function () { go(idx + 1); });

    var stage = $('#featStage');
    if (stage) {
      stage.setAttribute('tabindex', '0');
      stage.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); go(idx - 1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); }
      });
      /* 모바일 스와이프 */
      var x0 = null;
      stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      stage.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1));
        x0 = null;
      }, { passive: true });
    }
  }

  /* ============ 4. 매체 탭 ============ */
  function initMediaTabs() {
    var tabs = $$('#mediaTabs button'), panels = $$('.media__panel');
    if (!tabs.length) return;
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        var m = t.dataset.m;
        tabs.forEach(function (x) { x.setAttribute('aria-selected', String(x === t)); });
        panels.forEach(function (p) { p.classList.toggle('is-active', p.dataset.m === m); });
      });
    });
  }

  /* ============ 5. 로고월 ============ */
  function initLogos() {
    var grid = $('#logoGrid');
    if (!grid) return;
    grid.innerHTML = LOGOS.map(function (l) {
      return '<li>' + (l.img
        ? '<img src="' + l.img + '" alt="' + (l.alt || '') + '" loading="lazy">'
        : l.text) + '</li>';
    }).join('');
  }

  /* ============ 6. 하단 바 + 팝업 (충돌 조율) ============
     규칙
     · 하단 바 : Hero 를 벗어나면 등장, 폼이 보이면 사라짐
     · 팝업    : 지연 후 등장, 닫으면 영구 기억, 모바일은 CSS 로 숨김
     · 데스크톱에서 팝업이 떠 있으면 하단 바는 띄우지 않음
  ============================================================ */
  function initOverlays() {
    var bar = $('#stickyBar'), pop = $('#pop'), popClose = $('#popClose'), popCta = $('#popCta');
    var hero = $('.hero'), contact = $('#contact');
    var isMobile = function () { return window.matchMedia('(max-width: 900px)').matches; };

    var state = { pastHero: false, formVisible: false, popOpen: false };

    function sync() {
      if (!bar) return;
      var show = state.pastHero && !state.formVisible && !(state.popOpen && !isMobile());
      bar.hidden = false;
      bar.classList.toggle('is-on', show);
      if (pop) pop.classList.toggle('is-on', state.popOpen && !state.formVisible);
    }

    if ('IntersectionObserver' in window) {
      if (hero) new IntersectionObserver(function (es) {
        state.pastHero = !es[0].isIntersecting; sync();
      }, { threshold: .15 }).observe(hero);

      if (contact) new IntersectionObserver(function (es) {
        state.formVisible = es[0].isIntersecting; sync();
      }, { threshold: .18 }).observe(contact);
    } else {
      state.pastHero = true; sync();
    }

    /* 팝업 */
    if (pop) {
      var key = (CFG.popup && CFG.popup.storageKey) || 'aiconpl_popup_closed';
      var delay = (CFG.popup && CFG.popup.delayMs) || 3000;
      var closed = false;
      try { closed = localStorage.getItem(key) === '1'; } catch (e) { /* 저장 불가해도 동작 */ }

      if (!closed) {
        setTimeout(function () { pop.hidden = false; state.popOpen = true; sync(); }, delay);
      }
      function closePop() {
        state.popOpen = false;
        pop.classList.remove('is-on');
        setTimeout(function () { pop.hidden = true; }, 300);
        try { localStorage.setItem(key, '1'); } catch (e) {}
        sync();
      }
      if (popClose) popClose.addEventListener('click', closePop);
      if (popCta)   popCta.addEventListener('click', closePop);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && state.popOpen) closePop();
      });
    }
  }

  /* ============ 7. 현재 메뉴 하이라이트 ============ */
  function initScrollSpy() {
    if (!('IntersectionObserver' in window)) return;
    var links = $$('.nav__menu a');
    var map = {};
    links.forEach(function (a) {
      var id = (a.getAttribute('href') || '').replace('#', '');
      if (id && id !== 'top') (map[id] = map[id] || []).push(a);
    });
    var ids = Object.keys(map);
    if (!ids.length) return;

    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-current'); });
        (map[en.target.id] || []).forEach(function (a) { a.classList.add('is-current'); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    ids.forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* ============ 실행 ============ */
  function boot() {
    applyContact();
    initNav();
    initStats();
    initFeatures();
    initMediaTabs();
    initLogos();
    initOverlays();
    initScrollSpy();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
