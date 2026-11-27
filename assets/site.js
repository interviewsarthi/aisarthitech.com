(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* header background after scrolling */
  var header = document.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 12); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* reveal on scroll */
  var revealed = document.querySelectorAll('.reveal, .journey');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealed.forEach(function (el) { io.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add('in'); });
  }

  /* rotating headline words */
  var rot = document.querySelector('.rotator');
  if (rot) {
    var words = rot.querySelectorAll('span');
    var i = 0;
    words[0].classList.add('on');
    if (!reduce && words.length > 1) {
      setInterval(function () {
        var cur = words[i];
        cur.classList.remove('on'); cur.classList.add('out');
        setTimeout(function () { cur.classList.remove('out'); }, 850);
        i = (i + 1) % words.length;
        words[i].classList.add('on');
      }, 2600);
    }
  }

  /* spotlight glow that follows the pointer on cards */
  if (finePointer) {
    document.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* hero visual tilts towards the pointer */
  var stage = document.querySelector('.stage');
  if (stage && finePointer && !reduce) {
    var inner = stage.querySelector('.stage-inner');
    var hero = document.querySelector('.hero');
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      inner.style.transform = 'rotateY(' + (-9 + x * 10).toFixed(2) + 'deg) rotateX(' + (5 - y * 8).toFixed(2) + 'deg)';
    });
    hero.addEventListener('pointerleave', function () { inner.style.transform = ''; });
  }

  /* app switcher: tabs with auto-advance */
  var sw = document.querySelector('.switcher');
  if (sw) {
    var tabs = Array.prototype.slice.call(sw.querySelectorAll('.tab'));
    var panes = sw.querySelectorAll('.pane');
    var screen = sw.querySelector('.screen');
    var current = 0, timer = null, start = 0, DURATION = 6500, paused = false, visible = false, raf = 0;
    function select(n, user) {
      current = n;
      tabs.forEach(function (t, k) {
        t.setAttribute('aria-selected', k === n ? 'true' : 'false');
        t.tabIndex = k === n ? 0 : -1;
        var bar = t.querySelector('.bar');
        if (bar) bar.style.transform = 'scaleX(0)';
      });
      panes.forEach(function (p, k) { p.classList.toggle('on', k === n); p.setAttribute('aria-hidden', k === n ? 'false' : 'true'); });
      screen.style.setProperty('--k', getComputedStyle(tabs[n]).getPropertyValue('--k'));
      start = performance.now();
      if (user) { paused = true; }
    }
    function tick(now) {
      if (!paused && visible && !reduce) {
        var p = Math.min(1, (now - start) / DURATION);
        var bar = tabs[current].querySelector('.bar');
        if (bar) bar.style.transform = 'scaleX(' + p + ')';
        if (p >= 1) select((current + 1) % tabs.length, false);
      } else { start = now - 0; }
      raf = requestAnimationFrame(tick);
    }
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        select(k, true);
      });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (k + 1) % tabs.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (k - 1 + tabs.length) % tabs.length;
        if (n !== null) { e.preventDefault(); select(n, true); tabs[n].focus(); }
      });
    });
    sw.addEventListener('pointerenter', function () { if (finePointer) paused = true; });
    sw.addEventListener('pointerleave', function () { if (finePointer) { paused = false; start = performance.now(); } });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start = performance.now(); }, { threshold: 0.3 }).observe(sw);
    } else { visible = true; }
    select(0, false);
    raf = requestAnimationFrame(tick);
  }

  /* mission words light up while scrolling */
  var quote = document.querySelector('.mission blockquote');
  if (quote && !reduce) {
    var ws = quote.querySelectorAll('.w');
    var ticking = false;
    function light() {
      ticking = false;
      var r = quote.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
      p = Math.max(0, Math.min(1, p));
      var n = Math.round(p * ws.length);
      for (var k = 0; k < ws.length; k++) ws[k].classList.toggle('lit', k < n);
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(light); } }, { passive: true });
    light();
  } else if (quote) {
    quote.querySelectorAll('.w').forEach(function (w) { w.classList.add('lit'); });
  }

  /* hero network canvas: slow drifting points joined by faint lines */
  var canvas = document.querySelector('.hero-bg canvas');
  if (canvas && !reduce && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var pts = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), running = true, mouse = { x: -999, y: -999 };
    function size() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(90, (W * H) / 16000));
      pts = [];
      for (var k = 0; k < count; k++) {
        pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: Math.random() * 1.4 + 0.4 });
      }
    }
    size();
    window.addEventListener('resize', size);
    canvas.parentNode.parentNode.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { running = en[0].isIntersecting; if (running) requestAnimationFrame(draw); }).observe(canvas);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden && running) requestAnimationFrame(draw); });
    function draw() {
      if (!running || document.hidden) return;
      ctx.clearRect(0, 0, W, H);
      var LINK = 130;
      for (var a = 0; a < pts.length; a++) {
        var p = pts[a];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        for (var b = a + 1; b < pts.length; b++) {
          var q = pts[b], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
          if (d < LINK * LINK) {
            ctx.strokeStyle = 'rgba(150,170,255,' + (0.16 * (1 - Math.sqrt(d) / LINK)).toFixed(3) + ')';
            ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        var md = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        var glow = md < 160 ? 1 - md / 160 : 0;
        ctx.fillStyle = 'rgba(190,205,255,' + (0.45 + glow * 0.5).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r + glow * 1.6, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }
})();
