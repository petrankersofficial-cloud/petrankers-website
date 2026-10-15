(function () {
  'use strict';
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var mq = function (q) { return window.matchMedia(q).matches; };
  var cfg = function (el) { try { return JSON.parse(el.getAttribute('data-settings') || '{}'); } catch (e) { return {}; } };

  /* Google Analytics */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', 'G-CEL898Z5B9');
  var ga = document.createElement('script');
  ga.async = true;
  ga.src = 'https://www.googletagmanager.com/gtag/js?id=G-CEL898Z5B9';
  document.head.appendChild(ga);

  /* Mobile dropdown menu toggle */
  $$('.elementor-menu-toggle').forEach(function (btn) {
    var toggle = function () {
      var open = !btn.classList.contains('elementor-active');
      btn.classList.toggle('elementor-active', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      var nav = btn.nextElementSibling;
      if (nav) nav.setAttribute('aria-hidden', open ? 'false' : 'true');
    };
    btn.addEventListener('click', toggle);
    btn.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });

  /* Off-canvas panel */
  function setOffCanvas(el, open) {
    el.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) el.removeAttribute('inert'); else el.setAttribute('inert', '');
    document.body.classList.toggle('e-off-canvas__no-scroll', open);
  }
  $$('.e-off-canvas').forEach(function (el) {
    var ov = el.querySelector('.e-off-canvas__overlay');
    if (ov) ov.addEventListener('click', function () { setOffCanvas(el, false); });
    el.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (a && a.getAttribute('href').charAt(0) === '#') setOffCanvas(el, false);
    });
  });
  $$('a[href^="#elementor-action"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var h = decodeURIComponent(a.getAttribute('href'));
      var el = document.querySelector('.e-off-canvas');
      if (!el) return;
      if (h.indexOf('off_canvas:close') > -1) setOffCanvas(el, false);
      else if (h.indexOf('off_canvas:toggle') > -1) setOffCanvas(el, el.getAttribute('aria-hidden') === 'true');
      else setOffCanvas(el, true);
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') $$('.e-off-canvas').forEach(function (el) { setOffCanvas(el, false); });
  });

  /* Accordions (native details/summary; optionally one open at a time) */
  $$('.elementor-widget-n-accordion').forEach(function (w) {
    var one = cfg(w).max_items_expended === 'one';
    $$('details.e-n-accordion-item', w).forEach(function (d) {
      var s = d.querySelector('summary');
      if (s) s.setAttribute('aria-expanded', d.open ? 'true' : 'false');
      d.addEventListener('toggle', function () {
        if (s) s.setAttribute('aria-expanded', d.open ? 'true' : 'false');
        if (one && d.open) $$('details.e-n-accordion-item', w).forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  });

  /* Tabs */
  $$('.elementor-widget-n-tabs').forEach(function (w) {
    var tabs = $$('.e-n-tab-title', w);
    var panels = $$('.e-n-tabs-content > .e-con', w);
    function show(i) {
      tabs.forEach(function (t, n) {
        var on = n === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.setAttribute('tabindex', on ? '0' : '-1');
      });
      panels.forEach(function (p, n) { p.classList.toggle('e-active', n === i); });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(i); });
      t.addEventListener('keydown', function (e) {
        var n = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
        if (n > -1) { e.preventDefault(); show(n); tabs[n].focus(); }
      });
    });
  });

  /* Carousels */
  function bp(v, t, m) { return mq('(max-width:767px)') ? (m || v) : mq('(max-width:1024px)') ? (t || v) : v; }
  function size(o) { return o && o.size !== '' && o.size != null ? parseFloat(o.size) : null; }
  function carousel(w, o) {
    var root = w.querySelector('.swiper');
    var wrap = root && root.querySelector('.swiper-wrapper');
    if (!wrap) return;
    var orig = $$(':scope > .swiper-slide', wrap);
    var idx = 0, timer = null, raf = null, spv = 1, gap = 0, sw = 0, hovered = false;
    var pag = o.pagination ? w.querySelector('.swiper-pagination') : null;
    function layout() {
      spv = Math.max(1, parseInt(o.spv(), 10) || 1);
      gap = o.gap();
      var cw = root.clientWidth;
      sw = (cw - gap * (spv - 1)) / spv;
      $$(':scope > .swiper-slide', wrap).forEach(function (s) { s.style.width = sw + 'px'; s.style.marginRight = gap + 'px'; });
    }
    function go(i, instant) {
      var max = Math.max(0, orig.length - spv);
      idx = Math.min(Math.max(i, 0), max);
      wrap.style.transitionDuration = instant ? '0ms' : (o.speed || 500) + 'ms';
      wrap.style.transform = 'translate3d(' + (-idx * (sw + gap)) + 'px,0,0)';
      if (pag) $$('.swiper-pagination-bullet', pag).forEach(function (b, n) { b.classList.toggle('swiper-pagination-bullet-active', n === idx); });
    }
    function bullets() {
      if (!pag) return;
      pag.innerHTML = '';
      var n = Math.max(0, orig.length - spv + 1);
      if (n < 2) return;
      pag.classList.add('swiper-pagination-clickable', 'swiper-pagination-bullets', 'swiper-pagination-horizontal');
      for (var i = 0; i < n; i++) {
        var b = document.createElement('span');
        b.className = 'swiper-pagination-bullet';
        b.setAttribute('role', 'button');
        b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        (function (k) { b.addEventListener('click', function () { go(k); }); })(i);
        pag.appendChild(b);
      }
    }
    function start() {
      clearInterval(timer);
      if (!o.autoplay || orig.length <= spv) return;
      timer = setInterval(function () {
        if (hovered && o.pauseHover) return;
        go(idx >= orig.length - spv ? 0 : idx + 1);
      }, o.delay || 5000);
    }
    function marquee() {
      var clones = $$(':scope > .swiper-slide', wrap).slice(orig.length);
      clones.forEach(function (c) { c.remove(); });
      for (var k = 0; k < 2; k++) orig.forEach(function (s) { var c = s.cloneNode(true); c.setAttribute('aria-hidden', 'true'); wrap.appendChild(c); });
      layout();
      wrap.style.transitionDuration = '0ms';
      var x = 0, last = null, cycle = orig.length * (sw + gap), pxMs = (sw + gap) / (o.speed || 3500);
      cancelAnimationFrame(raf);
      (function tick(t) {
        if (last !== null) x = (x + (t - last) * pxMs) % cycle;
        last = t;
        wrap.style.transform = 'translate3d(' + (-x) + 'px,0,0)';
        raf = requestAnimationFrame(tick);
      })(performance.now());
    }
    function init() {
      if (o.marquee) { marquee(); return; }
      layout(); bullets(); go(idx, true); start();
    }
    root.addEventListener('mouseenter', function () { hovered = true; });
    root.addEventListener('mouseleave', function () { hovered = false; });
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(init, 150); });
    init();
  }
  $$('.elementor-widget-image-carousel').forEach(function (w) {
    var s = cfg(w);
    carousel(w, {
      marquee: s.autoplay === 'yes' && Number(s.autoplay_speed) <= 1,
      speed: Number(s.speed) || 3500,
      spv: function () { return bp(s.slides_to_show || 3, s.slides_to_show_tablet, s.slides_to_show_mobile); },
      gap: function () { return bp(size(s.image_spacing_custom) || 0, size(s.image_spacing_custom_tablet), size(s.image_spacing_custom_mobile)) || 0; },
      autoplay: s.autoplay === 'yes', delay: Number(s.autoplay_speed) || 5000, pauseHover: true
    });
  });
  $$('.elementor-widget-testimonial-carousel').forEach(function (w) {
    var s = cfg(w);
    carousel(w, {
      speed: Number(s.speed) || 500, pagination: s.pagination === 'bullets',
      spv: function () { return bp(s.slides_per_view || 1, s.slides_per_view_tablet || 2, s.slides_per_view_mobile || 1); },
      gap: function () { return bp(size(s.space_between) || 0, size(s.space_between_tablet), size(s.space_between_mobile)) || 0; },
      autoplay: s.autoplay === 'yes', delay: Number(s.autoplay_speed) || 5000, pauseHover: s.pause_on_hover === 'yes'
    });
  });
  $$('.elementor-widget-nested-carousel').forEach(function (w) {
    var s = cfg(w);
    carousel(w, {
      speed: Number(s.speed) || 500,
      spv: function () { return bp(s.slides_to_show || 1, s.slides_to_show_tablet, s.slides_to_show_mobile); },
      gap: function () { return bp(size(s.image_spacing_custom) || 0, size(s.image_spacing_custom_tablet), size(s.image_spacing_custom_mobile)) || 0; }
    });
  });

  /* Table of contents (blog post) */
  $$('.elementor-widget-table-of-contents').forEach(function (w) {
    var s = cfg(w);
    var tags = (s.headings_by_tags || ['h2', 'h3']).join(',');
    var scope = document.querySelector('.elementor-widget-theme-post-content') || document.body;
    var heads = $$(tags, scope);
    var body = w.querySelector('.elementor-toc__body');
    if (!body) return;
    var icon = (s.icon && s.icon.rendered_tag) || '';
    var ul = document.createElement('ul');
    ul.className = 'elementor-toc__list-wrapper';
    var parent = null, parentLevel = 0;
    heads.forEach(function (h, i) {
      if (!h.id) h.id = 'elementor-toc__heading-anchor-' + i;
      var lvl = parseInt(h.tagName.charAt(1), 10);
      var li = document.createElement('li');
      li.className = 'elementor-toc__list-item';
      li.innerHTML = '<div class="elementor-toc__list-item-text-wrapper">' + icon + '<a href="#' + h.id + '" class="elementor-toc__list-item-text"></a></div>';
      li.querySelector('a').textContent = h.textContent.trim();
      if (parent && lvl > parentLevel) {
        var sub = parent.querySelector(':scope > ul');
        if (!sub) { sub = document.createElement('ul'); sub.className = 'elementor-toc__list-wrapper'; parent.appendChild(sub); }
        sub.appendChild(li);
      } else { ul.appendChild(li); parent = li; parentLevel = lvl; }
    });
    body.innerHTML = '';
    body.appendChild(ul);
    $$('.elementor-toc__toggle-button', w).forEach(function (b) {
      b.addEventListener('click', function () {
        var c = w.classList.toggle('elementor-toc--collapsed');
        body.style.display = c ? 'none' : '';
      });
    });
  });

  /* Newsletter form: opens the visitor's email app (no server on static hosting) */
  $$('form.elementor-form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var m = f.querySelector('input[type="email"]');
      var body = 'Please add me to the Pet Rankers mailing list: ' + (m ? m.value : '');
      window.location.href = 'mailto:seo@petrankers.com?subject=' + encodeURIComponent('Newsletter signup') + '&body=' + encodeURIComponent(body);
    });
  });
})();

/* Pet Rankers home page (brand.css) */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* nav */
  var burger = $('.pr-nav__burger'), panel = $('#pr-panel');
  if (burger && panel) {
    burger.addEventListener('click', function () {
      var open = panel.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('a', panel).forEach(function (a) { a.addEventListener('click', function () { panel.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }); });
  }

  /* scroll reveal */
  var rev = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rev.forEach(function (el) { io.observe(el); });
  } else rev.forEach(function (el) { el.classList.add('is-in'); });

  /* header swap: primary header inside hero, floating bottom header after it */
  var dock = $('#pr-dock'), topNav = $('.pr-nav');
  var hero = $('.pr-hero') || $('main > section');
  if (dock && topNav) {
    var pastHero = false, ctaVisible = false;
    var apply = function () {
      var on = pastHero && !ctaVisible;
      dock.classList.toggle('is-on', on);
      topNav.classList.toggle('is-away', pastHero);
      dock.inert = !on; topNav.inert = pastHero;
      if (pastHero && panel) { panel.classList.remove('is-open'); if (burger) burger.setAttribute('aria-expanded', 'false'); }
    };
    if ('IntersectionObserver' in window && hero) {
      new IntersectionObserver(function (es) { pastHero = !es[0].isIntersecting; apply(); }, { rootMargin: '-90px 0px 0px 0px', threshold: 0 }).observe(hero);
      var cta = $('.pr-cta');
      if (cta) new IntersectionObserver(function (es) { ctaVisible = es[0].isIntersecting; apply(); }, { threshold: 0.25 }).observe(cta);
    } else {
      var chk = function () { pastHero = hero ? hero.getBoundingClientRect().bottom < 90 : window.scrollY > 80; apply(); };
      window.addEventListener('scroll', chk, { passive: true }); chk();
    }
    apply();
  }

  /* video */
  var vf = $('#pr-vf'), v = $('#pr-video'), pb = $('#pr-play');
  if (vf && v && pb) {
    pb.addEventListener('click', function () { vf.classList.add('is-playing'); v.controls = true; v.play(); });
    
  }

  /* geogrid: pins drift from red/grey, to orange, to green */
  var host = $('#pr-pins');
  if (host) {
    var N = 7, pins = [];
    for (var i = 0; i < N * N; i++) {
      var r = Math.floor(i / N), c = i % N, d = Math.hypot(r - 3, c - 3);
      var seed = ((i * 37) % 11) / 11;
      var el = document.createElement('div'), sp = document.createElement('span');
      el.className = 'pr-pin'; el.appendChild(sp); host.appendChild(el);
      pins.push({ el: el, sp: sp, d: d, from: 8 + d * 3.4 + seed * 7, to: 1 + d * 0.3 + seed * 0.8, last: -1 });
    }
    var avgB = $('#pr-avg-b'), avgA = $('#pr-avg-a');
    var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var render = function (p) {
      pins.forEach(function (n) {
        var local = Math.min(1, Math.max(0, (p * 1.5) - (n.d / 5.2) * 0.5));
        var rank = Math.max(1, Math.round(n.from + (n.to - n.from) * ease(local)));
        if (rank === n.last) return; n.last = rank;
        n.sp.textContent = rank > 20 ? '20+' : rank;
        n.el.className = 'pr-pin ' + (rank <= 3 ? 'is-g' : rank <= 10 ? 'is-o' : 'is-r') + (rank <= 3 && local > 0.95 ? '' : '');
      });
      if (avgB) avgB.textContent = (12.2 + (3.6 - 12.2) * ease(p)).toFixed(1);
    };
    if (reduce) render(1);
    else {
      var DUR = 9000, HOLD = 3600, t0 = null, started = false;
      var geo = $('.pr-geo');
      var loop = function (t) {
        if (t0 === null) t0 = t;
        var el = (t - t0) % (DUR + HOLD + 1200);
        var p = el < DUR ? el / DUR : 1;
        if (el > DUR + HOLD) p = Math.max(0, 1 - (el - DUR - HOLD) / 1200);
        render(p);
        requestAnimationFrame(loop);
      };
      render(0);
      if ('IntersectionObserver' in window && geo) {
        new IntersectionObserver(function (es, o) { if (es[0].isIntersecting && !started) { started = true; requestAnimationFrame(loop); o.disconnect(); } }).observe(geo);
      } else requestAnimationFrame(loop);
    }
  }

  /* Calendly: load when near viewport */
  var cal = $('.calendly-inline-widget');
  if (cal) {
    var loadCal = function () {
      if (document.getElementById('cal-js')) return;
      var s = document.createElement('script'); s.id = 'cal-js'; s.async = true;
      s.src = 'https://assets.calendly.com/assets/external/widget.js'; document.body.appendChild(s);
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { loadCal(); o.disconnect(); } }, { rootMargin: '400px' }).observe(cal);
    else loadCal();
  }

  /* footer newsletter */
  $$('form.pr-form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var m = f.querySelector('input[type="email"]');
      window.location.href = 'mailto:seo@petrankers.com?subject=' + encodeURIComponent('Newsletter signup') + '&body=' + encodeURIComponent('Please add me to the Pet Rankers mailing list: ' + (m ? m.value : ''));
    });
  });

  /* copy post link */
  $$('[data-copy-link]').forEach(function (b) {
    b.addEventListener('click', function () {
      var done = function () { b.classList.add('is-copied'); b.setAttribute('aria-label', 'Link copied'); setTimeout(function () { b.classList.remove('is-copied'); b.setAttribute('aria-label', 'Copy link'); }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, done); else done();
    });
  });

  /* legal toc: open on desktop, collapsed on mobile */
  $$('[data-toc-dd]').forEach(function (dd) {
    var mq = window.matchMedia('(max-width: 900px)');
    var set = function () { if (mq.matches) dd.removeAttribute('open'); else dd.setAttribute('open', ''); };
    set(); (mq.addEventListener ? mq.addEventListener('change', set) : mq.addListener(set));
    dd.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { if (mq.matches) dd.removeAttribute('open'); }); });
    dd.querySelector('summary').addEventListener('click', function (e) { if (!mq.matches) e.preventDefault(); });
  });

  /* legal toc: highlight current section */
  var tocLinks = $$('[data-toc]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var tio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) tocLinks.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('data-toc') === e.target.id); }); });
    }, { rootMargin: '-30% 0px -60% 0px' });
    tocLinks.forEach(function (a) { var t = document.getElementById(a.getAttribute('data-toc')); if (t) tio.observe(t); });
  }

  /* cursor spotlight on cards */
  $$('[data-spot]').forEach(function (el) {
    el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
  });

  /* AI answer tabs: cycle platforms */
  $$('[data-ai-tabs]').forEach(function (box) {
    var tabs = box.querySelectorAll('.pr-aians__tabs span'), ans = box.querySelector('.pr-aians__a'), i = 0;
    if (reduce || tabs.length < 2) return;
    setInterval(function () {
      if (document.hidden) return;
      tabs[i].classList.remove('is-on'); i = (i + 1) % tabs.length; tabs[i].classList.add('is-on');
      if (ans) { ans.style.animation = 'none'; void ans.offsetWidth; ans.style.animation = ''; }
    }, 2800);
  });

  /* industries carousel */
  $$('[data-ix]').forEach(function (w) {
    var t = w.querySelector('[data-ix-track]'), p = w.querySelector('[data-ix-prev]'), n = w.querySelector('[data-ix-next]');
    var step = function () { var c = t.querySelector('.pr-ix-card'); return c ? c.getBoundingClientRect().width + 24 : 300; };
    var upd = function () { p.disabled = t.scrollLeft < 8; n.disabled = t.scrollLeft + t.clientWidth > t.scrollWidth - 8; };
    p.addEventListener('click', function () { t.scrollBy({ left: -step(), behavior: 'smooth' }); });
    n.addEventListener('click', function () { t.scrollBy({ left: step(), behavior: 'smooth' }); });
    t.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); upd();
    var down = false, sx = 0, sl = 0, moved = false;
    t.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = t.scrollLeft; });
    window.addEventListener('pointermove', function (e) { if (!down) return; var d = e.clientX - sx; if (Math.abs(d) > 4) { moved = true; t.classList.add('is-drag'); } t.scrollLeft = sl - d; });
    window.addEventListener('pointerup', function () { if (!down) return; down = false; t.classList.remove('is-drag'); });
    t.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
    t.addEventListener('dragstart', function (e) { e.preventDefault(); });

    /* pin section and map vertical scroll to horizontal slide (desktop only) */
    var sec = w.closest('section'), wrap = w.closest('.pr-wrap'), bar = w.querySelector('[data-ix-bar]');
    var cards = [].slice.call(t.querySelectorAll('.pr-ix-card'));
    var mq = window.matchMedia('(min-width: 861px) and (prefers-reduced-motion: no-preference)');
    var start = 0, dist = 0, on = false, ticking = false;
    var layout = function () {
      sec.classList.remove('pr-ix-pin'); sec.style.height = ''; wrap.style.top = ''; t.scrollLeft = 0;
      on = mq.matches; if (!on) { upd(); return; }
      sec.classList.add('pr-ix-pin');
      dist = Math.max(0, t.scrollWidth - t.clientWidth);
      if (!dist) { sec.classList.remove('pr-ix-pin'); on = false; return; }
      var vh = window.innerHeight, wh = wrap.offsetHeight, top = Math.round((vh - wh) / 2);
      wrap.style.top = top + 'px';
      var off = wrap.getBoundingClientRect().top - sec.getBoundingClientRect().top;
      sec.style.height = (sec.offsetHeight + dist) + 'px';
      start = sec.getBoundingClientRect().top + window.pageYOffset + off - top;
      tick();
    };
    var tick = function () {
      ticking = false; if (!on) return;
      var p = Math.min(1, Math.max(0, (window.pageYOffset - start) / dist));
      t.scrollLeft = p * dist;
      if (bar) bar.style.transform = 'scaleX(' + p + ')';
      var cx = t.getBoundingClientRect().left + t.clientWidth / 2;
      cards.forEach(function (c) {
        var r = c.getBoundingClientRect(), d = (r.left + r.width / 2 - cx) / t.clientWidth;
        c.style.transform = 'translateY(' + (Math.abs(d) * 26).toFixed(1) + 'px) rotate(' + (d * 3).toFixed(2) + 'deg)';
      });
    };
    window.addEventListener('scroll', function () { if (on && !ticking) { ticking = true; requestAnimationFrame(tick); } }, { passive: true });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { cards.forEach(function (c) { c.style.transform = ''; }); layout(); }, 150); });
    window.addEventListener('load', layout);
    layout();
  });

  /* Services dropdowns (nav + dock) */
  [['.pr-dd','.pr-dd__btn'],['.pr-dock__dd','.pr-dock__btn']].forEach(function (p) {
    $$(p[0]).forEach(function (dd) {
      var btn = dd.querySelector(p[1]);
      var set = function (o) { dd.classList.toggle('is-open', o); btn.setAttribute('aria-expanded', o ? 'true' : 'false'); };
      btn.addEventListener('click', function (e) { e.stopPropagation(); set(!dd.classList.contains('is-open')); });
      document.addEventListener('click', function (e) { if (!dd.contains(e.target)) set(false); });
      $$('a', dd).forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
      dd.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); btn.focus(); } });
    });
  });
})();
