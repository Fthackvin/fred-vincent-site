/* ==========================================================================
   Lab stories: films, the contents list, and the eased scroll between parts.
   ========================================================================== */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Films play while they are on screen, and pause off it. */
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
    }); }, { threshold: .4 });
    document.querySelectorAll('[data-story-film]').forEach(function (v) { io.observe(v); });
  }

  /* The contents list follows the reader. */
  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  var heads = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  function mark() {
    var y = window.scrollY + 160, at = -1;
    heads.forEach(function (h, i) { if (h && h.getBoundingClientRect().top + window.scrollY <= y) at = i; });
    links.forEach(function (a, i) { a.classList.toggle('here', i === at); });
  }
  window.addEventListener('scroll', mark, { passive: true }); mark();

  /* Clicking a part eases the page there rather than jumping: a slow start,
     a gentle arrival, and a duration that grows a little with the distance. */
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function glide(to) {
    if (reduce) { window.scrollTo(0, to); return; }
    var from = window.scrollY, d = to - from, start = 0;
    var dur = Math.min(1100, Math.max(520, Math.abs(d) * .45));
    function step(now) {
      if (!start) start = now;
      var t = Math.min(1, (now - start) / dur);
      window.scrollTo(0, from + d * ease(t));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  links.forEach(function (a, i) {
    a.addEventListener('click', function (e) {
      var h = heads[i]; if (!h) return;
      e.preventDefault();
      glide(h.getBoundingClientRect().top + window.scrollY - 96);
      history.replaceState(null, '', a.getAttribute('href'));
    });
  });
})();
