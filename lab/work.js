/* ==========================================================================
   The case studies, as one list shared by the homepage and the About page.
   Order here is the order on the site. `pics` are what the hover preview
   cycles through, first to last; the first is also the row's thumbnail
   unless `thumb` gives another. `mark: true` sets that thumb on black.
   ========================================================================== */
window.WORK = [
  { title: 'Linro', href: '/work/linro/',
    desc: 'Giving invisible security infrastructure a visual language built around lineage.',
    tags: 'Brand identity and strategy, product design',
    thumb: '/work/general/linro-mark-bars.svg', mark: true,
    pics: ['/work/linro/screens/linro-homepage-v6.webp', '/work/linro/screens/linro-lineage-hover.webp', '/work/linro/screens/linro-terminal.webp', '/work/linro/screens/linro-platforms-768.webp', '/work/linro/screens/linro-voice-filter.webp'] },
  { title: 'Kaizen', href: '/work/kaizen-brand-and-product/',
    desc: 'Building the brand, the product and the design system for a radically different way to train for a marathon.',
    tags: 'Creative direction, product design, design system',
    pics: ['/videos/feedscroll.webp', '/work/kaizen-brand-and-product/kaizen-blocks-mosaic.webp', '/work/kaizen-brand-and-product/kaizen-design-system.webp', '/work/kaizen-brand-and-product/kaizen-doughnut-a-768.webp'] },
  { title: 'Monet', href: '/work/monet/',
    desc: 'Creating a desirable consumer brand for neuro tech people would actually want to wear.',
    tags: 'Brand identity, product design',
    pics: ['/work/monet/m-shopfront-768.webp', '/work/monet/s2-composition-768.webp', '/work/monet/m-logo-768.webp', '/work/monet/m-interior-768.webp', '/work/monet/m-mobile-768.webp'] },
  { title: 'Tag Tuition', href: '/work/tag-tuition/', previewBackground: '#fff',
    desc: 'Turning a classroom curriculum into illustrated workbooks children could explore independently.',
    tags: 'Creative direction, editorial design, illustration',
    pics: ['/work/general/tag-tuition-splash-480.webp', '/work/tag-tuition/book-constellations.webp', '/work/tag-tuition/book-insects.webp', '/work/tag-tuition/metamorphosis-cover.webp'] },
  { title: 'Kaizen', href: '/work/kaizen-onboarding/',
    desc: 'Finding the problem underneath what users were asking for, and increasing conversion by 10.9%.',
    tags: 'Product design, optimising conversion',
    pics: ['/videos/allaboard.webp', '/work/kaizen-onboarding/39853f81-bb55-4529-bbc9-439f8748efb4_1076x1082-768.webp', '/work/kaizen-onboarding/47ef0253-panorama-detail-768.webp'] },
  { title: 'Suitepad', href: '/work/suitepad/',
    desc: 'Designing how conversational ai could live naturally inside the hotel room.',
    tags: 'Product design, prototyping ai interactions',
    pics: ['/work/suitepad/screens/homepage-first-load-768.webp', '/work/suitepad/screens/answer-weather-cards-768.webp', '/work/suitepad/screens/edge-cases-768.webp', '/work/suitepad/screens/keyboard-text-entry-768.webp'] },
];

(function () {
  'use strict';
  window.renderWork = function (ol, opts) {
    opts = opts || {};
    (opts.limit ? window.WORK.slice(0, opts.limit) : window.WORK).forEach(function (w) {
      var li = document.createElement('li'); li.className = 'row';
      li.innerHTML = '<a href="' + w.href + '"><img class="thumb' + (w.mark ? ' thumb--mark' : '') + '" src="' + (w.thumb || w.pics[0]) + '" alt="" loading="lazy" decoding="async">' +
        '<b></b><span></span><em></em></a>';
      li.querySelector('b').textContent = w.title; li.querySelector('span').textContent = w.desc; li.querySelector('em').textContent = w.tags;
      li.firstChild.dataset.pics = w.pics.join(' ');
      if (w.previewBackground) li.firstChild.dataset.previewBackground = w.previewBackground;
      ol.appendChild(li);
    });

    /* The peek: one steady frame that follows the pointer. Every picture
       is built and decoded up front and sits in the frame already, so moving
       between projects, or stepping through one, is a straight swap with
       nothing to wait for. Pictures are shown whole. */
    if (!matchMedia('(hover: hover) and (min-width: 800px)').matches) return;
    var peek = document.createElement('div'); peek.className = 'peek'; peek.setAttribute('aria-hidden', 'true');
    document.body.appendChild(peek);
    var shown = null, timer = 0, x = 0, y = 0, tx = 0, ty = 0, raf = 0;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* The frame takes the colour of the picture's own edges, so the space
       around a picture that doesn't fill it reads as more of the picture. */
    var cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
    function edge(img) {
      if (img.dataset.forceBg) { img.dataset.bg = img.dataset.forceBg; return; }
      try {
        var w = 48, h = Math.max(8, Math.round(48 * img.naturalHeight / img.naturalWidth));
        cv.width = w; cv.height = h; cx.drawImage(img, 0, 0, w, h);
        var d = cx.getImageData(0, 0, w, h).data, px = [];
        /* Only the edges that meet the empty space: the sides of a picture
           taller than the frame, the top and bottom of one wider than it. */
        var tall = img.naturalWidth / img.naturalHeight < 4 / 3;
        function take(x, y) { var i = (y * w + x) * 4; px.push([d[i], d[i + 1], d[i + 2]]); }
        if (tall) for (var y = 0; y < h; y++) { take(0, y); take(1, y); take(w - 1, y); take(w - 2, y); }
        else for (var x = 0; x < w; x++) { take(x, 0); take(x, 1); take(x, h - 1); take(x, h - 2); }
        /* The middle value of each channel, so a stray dark corner or a bit
           of interface on the edge can't muddy the colour. */
        function mid(k) { var v = px.map(function (p) { return p[k]; }).sort(function (a, b) { return a - b; }); return v[v.length >> 1]; }
        img.dataset.bg = 'rgb(' + mid(0) + ',' + mid(1) + ',' + mid(2) + ')';
      } catch (e) {}
    }
    function show(img) {
      if (shown === img) return;
      if (shown) shown.classList.remove('on');
      img.classList.add('on'); shown = img;
      if (!img.dataset.bg && img.complete && img.naturalWidth) edge(img);
      if (img.dataset.bg) peek.style.backgroundColor = img.dataset.bg;
    }
    function aim(e) { tx = e.clientX + (e.clientX > innerWidth / 2 ? -240 : 240); ty = Math.min(Math.max(e.clientY, 170), innerHeight - 170); }
    function loop() { x += (tx - x) * .45; y += (ty - y) * .45; peek.style.left = x + 'px'; peek.style.top = y + 'px';
      raf = (Math.abs(tx - x) + Math.abs(ty - y) > .3) ? requestAnimationFrame(loop) : 0; }
    ol.addEventListener('mouseleave', function () { peek.classList.remove('on'); clearInterval(timer); });
    ol.addEventListener('mousemove', function (e) { aim(e); if (!raf) raf = requestAnimationFrame(loop); });
    /* The pictures load once the page has settled, or the moment the pointer
       reaches the list, whichever comes first, so they never hold up the page. */
    var warmed = false;
    function warm() {
      if (warmed) return; warmed = true;
      peek.querySelectorAll('img[data-src]').forEach(function (i) { i.onload = function () { edge(i); if (shown === i && i.dataset.bg) peek.style.backgroundColor = i.dataset.bg; }; i.src = i.dataset.src; if (i.decode) i.decode().catch(function () {}); });
    }
    if (document.readyState === 'complete') setTimeout(warm, 1500); else addEventListener('load', function () { setTimeout(warm, 1500); });
    ol.addEventListener('mouseenter', warm);
    ol.querySelectorAll('a[data-pics]').forEach(function (link) {
      var imgs = link.dataset.pics.split(' ').map(function (src) {
        var i = new Image(); i.alt = ''; i.decoding = 'sync'; i.dataset.src = src; if (link.dataset.previewBackground) { i.dataset.forceBg = link.dataset.previewBackground; i.dataset.bg = link.dataset.previewBackground; }
        peek.appendChild(i); return i;
      });
      link.addEventListener('mouseenter', function (e) {
        var n = 0;
        if (!peek.classList.contains('on')) { aim(e); x = tx; y = ty; peek.style.left = x + 'px'; peek.style.top = y + 'px'; }
        show(imgs[0]); peek.classList.add('on'); clearInterval(timer);
        if (!reduce && imgs.length > 1) timer = setInterval(function () { n = (n + 1) % imgs.length; show(imgs[n]); }, 1200);
      });
    });
  };
})();
