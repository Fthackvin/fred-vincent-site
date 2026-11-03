/* ==========================================================================
   Live vignettes. Each is a small function given an empty element.
   To add one: write mount.yourname = function (host) { ... } and use
   media: { vignette: 'yourname' } in entries.js.
   ========================================================================== */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mount = {};

  /* --- Dots: the site's lattice, pushed aside by the pointer and gathered
     into a ring on a tap. Sleeps when nothing is moving. ------------------ */
  mount.dots = function (host) {
    var c = document.createElement('canvas'); c.className = 'v-dots'; host.appendChild(c);
    var ctx = c.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
    var pts = [], W = 0, H = 0, px = -1e4, py = -1e4, gather = 0, gatherT = 0, raf = 0, last = 0;
    function size() {
      var r = c.getBoundingClientRect(); W = r.width; H = r.height;
      c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = []; var g = 14;
      for (var y = g / 2; y < H; y += g) for (var x = g / 2; x < W; x += g) pts.push({ hx: x, hy: y, x: x, y: y, vx: 0, vy: 0 });
      pts.forEach(function (p, i) { var a = i / pts.length * Math.PI * 2 * 7; var rr = Math.min(W, H) * (.18 + .16 * ((i * 37) % 100) / 100); p.rx = W / 2 + Math.cos(a) * rr; p.ry = H / 2 + Math.sin(a) * rr; });
      draw();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#141414';
      for (var i = 0; i < pts.length; i++) { var p = pts[i]; ctx.beginPath(); ctx.arc(p.x, p.y, 1.15, 0, 6.283); ctx.fill(); }
    }
    function step(t) {
      var dt = Math.min(32, t - (last || t)) / 16.67; last = t;
      if (gatherT) gather = Math.max(0, Math.min(1, gather + (gatherT > 0 ? .022 : -.018) * dt));
      if (gatherT > 0 && gather >= 1 && t - gatherT > 1800) gatherT = -1;
      if (gatherT < 0 && gather <= 0) gatherT = 0;
      var moving = gatherT !== 0;
      var e = gather < .5 ? 2 * gather * gather : 1 - Math.pow(-2 * gather + 2, 2) / 2;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i], tx = p.hx + (p.rx - p.hx) * e, ty = p.hy + (p.ry - p.hy) * e;
        var dx = p.x - px, dy = p.y - py, d2 = dx * dx + dy * dy;
        if (d2 < 3600) { var f = (1 - d2 / 3600) * 1.6; var d = Math.sqrt(d2) || 1; p.vx += dx / d * f; p.vy += dy / d * f; }
        p.vx += (tx - p.x) * .06; p.vy += (ty - p.y) * .06; p.vx *= .82; p.vy *= .82;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (Math.abs(p.vx) + Math.abs(p.vy) > .02) moving = true;
      }
      draw();
      raf = moving ? requestAnimationFrame(step) : 0; if (!raf) last = 0;
    }
    function wake() { if (!raf && !reduce) raf = requestAnimationFrame(step); }
    c.addEventListener('pointermove', function (ev) { var r = c.getBoundingClientRect(); px = ev.clientX - r.left; py = ev.clientY - r.top; wake(); });
    c.addEventListener('pointerleave', function () { px = py = -1e4; wake(); });
    c.addEventListener('click', function () { if (!gatherT) { gatherT = performance.now(); wake(); } });
    new ResizeObserver(size).observe(c);
  };

  /* --- Atlas: prints pinned to a dark cloth, joined by thread. Drag one and
     the threads follow. ---------------------------------------------------- */
  mount.atlas = function (host) {
    var box = document.createElement('div'); box.className = 'v-atlas'; host.appendChild(box);
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); box.appendChild(svg);
    var prints = [
      { src: '/work/monet/s2-composition-480.webp', x: .06, y: .10, r: -3 },
      { src: '/work/monet/m-textures-480.webp', x: .40, y: .30, r: 2 },
      { src: '/work/general/tag-tuition-splash-480.webp', x: .68, y: .08, r: 4 },
      { src: '/work/monet/m-shopfront-480.webp', x: .14, y: .56, r: 1.5 }
    ];
    var links = [[0, 1], [1, 2], [1, 3]];
    var els = prints.map(function (p) {
      var i = document.createElement('img'); i.className = 'print'; i.src = p.src; i.alt = ''; i.draggable = false;
      i.style.left = p.x * 100 + '%'; i.style.top = p.y * 100 + '%'; i.style.transform = 'rotate(' + p.r + 'deg)';
      var pin = document.createElement('span'); pin.className = 'pin'; box.appendChild(i); box.appendChild(pin); p.el = i; p.pin = pin; return p;
    });
    var lines = links.map(function () {
      var l = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      l.setAttribute('fill', 'none'); l.setAttribute('stroke', '#C9B98F'); l.setAttribute('stroke-width', '1'); l.setAttribute('opacity', '.8');
      svg.appendChild(l); return l;
    });
    function anchor(p) { var b = box.getBoundingClientRect(), r = p.el.getBoundingClientRect(); return [r.left - b.left + r.width / 2, r.top - b.top + 8]; }
    function redraw() {
      els.forEach(function (p) { var a = anchor(p); p.pin.style.left = a[0] + 'px'; p.pin.style.top = a[1] + 'px'; });
      links.forEach(function (k, i) { var a = anchor(els[k[0]]), b = anchor(els[k[1]]); var mx = (a[0] + b[0]) / 2, my = Math.max(a[1], b[1]) + 26;
        lines[i].setAttribute('d', 'M' + a + ' Q' + mx + ',' + my + ' ' + b); });
    }
    els.forEach(function (p) {
      p.el.addEventListener('pointerdown', function (ev) {
        ev.preventDefault(); p.el.setPointerCapture(ev.pointerId);
        var b = box.getBoundingClientRect(), sx = ev.clientX, sy = ev.clientY, ox = p.el.offsetLeft, oy = p.el.offsetTop;
        p.el.style.zIndex = 3;
        function mv(e) { p.el.style.left = Math.max(-20, Math.min(b.width - 40, ox + e.clientX - sx)) + 'px'; p.el.style.top = Math.max(-10, Math.min(b.height - 30, oy + e.clientY - sy)) + 'px'; redraw(); }
        function up() { p.el.removeEventListener('pointermove', mv); p.el.removeEventListener('pointerup', up); p.el.style.zIndex = ''; }
        p.el.addEventListener('pointermove', mv); p.el.addEventListener('pointerup', up);
      });
      p.el.addEventListener('load', redraw);
    });
    new ResizeObserver(redraw).observe(box);
  };

  /* --- Hold to enter: the Monet arrival's one control. Holding fills it;
     letting go early lets it drain back. ---------------------------------- */
  mount.hold = function (host) {
    var box = document.createElement('div'); box.className = 'v-hold';
    box.style.backgroundImage = 'url(/work/monet/arrival.webp)';
    box.innerHTML = '<button type="button"><i></i>Enter</button><span class="said">Welcome in. The atelier is this way.</span>';
    host.appendChild(box);
    var b = box.querySelector('button'), fill = b.querySelector('i'), v = 0, dir = 0, raf = 0, last = 0;
    function tick(t) {
      var dt = (t - (last || t)) / 1000; last = t;
      v = Math.max(0, Math.min(1, v + dir * dt / (dir > 0 ? 1.1 : .5)));
      fill.style.transform = 'scaleX(' + v + ')';
      if (v >= 1 && dir > 0) { box.classList.add('done'); dir = 0; setTimeout(function () { box.classList.remove('done'); dir = -1; go(); }, 2600); }
      raf = (dir !== 0 && !(v === 0 && dir < 0)) ? requestAnimationFrame(tick) : 0; if (!raf) last = 0;
    }
    function go() { if (!raf) raf = requestAnimationFrame(tick); }
    function press(e) { e.preventDefault(); if (box.classList.contains('done')) return; dir = 1; if (reduce) { v = 1; } go(); }
    function release() { if (dir > 0) { dir = -1; go(); } }
    b.addEventListener('pointerdown', press); b.addEventListener('pointerup', release); b.addEventListener('pointerleave', release);
    b.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) press(e); });
    b.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') release(); });
  };

  window.mountVignettes = function (root) {
    (root || document).querySelectorAll('[data-vignette]').forEach(function (h) {
      if (h.dataset.mounted) return; h.dataset.mounted = '1';
      var fn = mount[h.dataset.vignette]; if (fn) fn(h);
    });
  };
})();
