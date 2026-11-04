/* ==========================================================================
   THE LAB — every entry lives here, newest first.

   To add something, copy one block, change it, save. That is all. The Lab
   page shows every entry; the homepage shows the first six.

     title    what it is, in a few words
     date     'YYYY-MM' — shown as "Oct 2026"
     kind     'Vignette' | 'Interface' | 'Story' | 'Project'
              (these become the filters on the Lab page)
     media    one of:
                { vignette: 'dots' | 'atlas' | 'hold' }   a live piece
                { video: '/path.mp4', poster: '/path.webp' }
                { image: '/path.webp', alt: '...' }
                { empty: true }                            a slot to fill
     action   the line at the foot of the tile:
                { label: 'Open the case study', href: '/work/linro/' }
                or { label: 'In progress' } for no link
     draft    true shows the tile with a striped ground, as unfinished
   ========================================================================== */
window.LAB = [
  {
    title: 'Week to week',
    date: '2026-11',
    kind: 'Story',
    href: '/lab/stories/week-to-week/',
    media: { video: '/work/kaizen-brand-and-product/kaizen-weeks.mp4', poster: '/work/kaizen-brand-and-product/kaizen-weeks.webp', phone: '576 / 1174' },
    action: { label: 'Read the story', href: '/lab/stories/week-to-week/' },
  },
  {
    title: 'Effort, not pace',
    date: '2026-11',
    kind: 'Story',
    href: '/lab/stories/effort-not-pace/',
    media: { video: '/work/kaizen-brand-and-product/kaizen-rpe.mp4', poster: '/work/kaizen-brand-and-product/kaizen-rpe-7.webp', phone: '576 / 1174' },
    action: { label: 'Read the story', href: '/lab/stories/effort-not-pace/' },
  },
  {
    title: 'A smooth line of progress',
    date: '2026-11',
    kind: 'Interface',
    media: { video: '/work/kaizen-brand-and-product/kaizen-fitness-scrub.mp4', poster: '/work/kaizen-brand-and-product/kaizen-fitness-scrub.webp', phone: '576 / 1192' },
    action: { label: 'Open the case study', href: '/work/kaizen-brand-and-product/' },
  },
  {
    title: 'Dots that gather',
    onIce: true,
    date: '2026-10',
    kind: 'Vignette',
    media: { vignette: 'dots' },
    action: { label: 'Move through it, tap to gather' },
  },
  {
    title: 'Lineage hover',
    date: '2026-10',
    kind: 'Interface',
    media: { video: '/work/linro/screens/linro-lineage-hover.mp4', poster: '/work/linro/screens/linro-lineage-hover.webp' },
    action: { label: 'Open the case study', href: '/work/linro/' },
  },
  {
    title: 'Hold to enter',
    onIce: true,
    date: '2026-11',
    kind: 'Interface',
    media: { vignette: 'hold' },
    action: { label: 'From the Monet app', href: '/work/monet/' },
  },
  {
    title: 'Warburg\'s Atlas',
    onIce: true,
    date: '2026-10',
    kind: 'Project',
    href: '/lab/atlas/',
    media: { image: '/lab/atlas/melencolia-600.webp', alt: 'Albrecht Dürer, Melencolia I, engraving, 1514.' },
    action: { label: 'Work in progress', href: '/lab/atlas/' },
  },
  {
    title: 'Drawing the Linro wordmark',
    date: '2026-10',
    kind: 'Story',
    media: { image: '/work/general/linro-mark-bars.svg', alt: 'The Linro wordmark.', pad: true, background: '#000' },
    action: { label: 'Read the story', href: '/lab/stories/drawing-the-linro-mark/' },
  },
  {
    title: 'Terminal, with the brand in it',
    date: '2026-10',
    kind: 'Interface',
    media: { video: '/work/linro/screens/linro-terminal.mp4', poster: '/work/linro/screens/linro-terminal.webp' },
    action: { label: 'Open the case study', href: '/work/linro/' },
  },
  {
    title: 'The clarity to change',
    date: '2026-11',
    kind: 'Vignette',
    media: { video: '/work/monet/arrival-1200.mp4', poster: '/work/monet/arrival.webp' },
    action: { label: 'Open the case study', href: '/work/monet/' },
  },
  {
    title: 'cohort.art',
    href: '/lab/cohort/',
    date: '2021-11',
    kind: 'Project',
    media: { video: '/lab/cohort/gallery-recording.mp4', poster: '/lab/cohort/gallery-recording.webp' },
    action: { label: 'View the exhibition', href: '/lab/cohort/' },
  },
  {
    title: 'Voice, as a filter',
    date: '2026-10',
    kind: 'Interface',
    media: { video: '/work/linro/screens/linro-voice-filter.mp4', poster: '/work/linro/screens/linro-voice-filter.webp' },
    action: { label: 'Open the case study', href: '/work/linro/' },
  },
];

/* Entries marked onIce stay here, ready to come back, but are left off the site.
   Delete the onIce line to bring one back. */
window.LAB_ALL = window.LAB;
window.LAB = window.LAB_ALL.filter(function (e) { return !e.onIce; });

/* The order on the wall. Cards are laid as brickwork in this order, which was
   chosen so pieces from the same project rarely touch, side by side or one
   above another, at desktop width.
   Anything not listed follows, newest first. */
window.LAB_ORDER = [
  'Effort, not pace', 'Voice, as a filter',
  'The clarity to change', 'cohort.art', 'Drawing the Linro wordmark', 'A smooth line of progress',
  'Lineage hover', 'Warburg\'s Atlas', 'Terminal, with the brand in it',
  'Week to week'
];
window.LAB.sort(function (a, b) {
  var i = window.LAB_ORDER.indexOf(a.title), j = window.LAB_ORDER.indexOf(b.title);
  return (i < 0 ? 99 : i) - (j < 0 ? 99 : j);
});


/* --------------------------------------------------------------------------
   Rendering. Nothing below needs touching to add an entry.
   -------------------------------------------------------------------------- */
(function () {
  'use strict';
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function month(d) { var p = d.split('-'); return MONTHS[+p[1] - 1] + ' ' + p[0]; }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'style') Object.assign(n.style, attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function tile(e) {
    var body = el('div', { class: 'tile-body' });
    var m = e.media || {};
    if (m.vignette) body.appendChild(el('div', { 'data-vignette': m.vignette }));
    else if (m.video) {
      var v = el('video', { muted: '', loop: '', playsinline: '', preload: 'none', 'data-poster': m.poster || '', 'aria-label': e.title });
      v.muted = true;
      v.appendChild(el('source', { src: m.video, type: 'video/mp4' }));
      /* Phone recordings stand at a phone's size on a pale ground rather than
         filling the card, so they don't tower over everything else. */
      if (m.phone) { v.style.aspectRatio = m.phone; body.classList.add('tile-body--phone'); }
      body.appendChild(v);
    }
    else if (m.image) {
      var i = el('img', { src: m.image, alt: m.alt || '', loading: 'lazy', decoding: 'async' });
      if (m.pad) { i.style.padding = '18% 10%'; i.style.background = m.background || '#fff'; }
      body.appendChild(i);
    }
    else if (m.empty) body.appendChild(el('div', { style: { aspectRatio: '4 / 3', width: '100%' } }));

    var destination = e.action && e.action.href;
    var linked = destination && !m.vignette;
    var foot = el(linked ? 'span' : destination ? 'a' : 'span', {
      class: 'tile-foot', ...(linked || !destination ? {} : { href: destination }),
      text: (e.action && e.action.label) || ''
    });
    var content = [
      el('div', { class: 'tile-top' }, [el('span', { text: e.title }), el('time', { datetime: e.date, text: month(e.date) })]),
      body
    ];
    if (!linked) content.push(foot);
    var t = el('article', { class: 'tile', 'data-kind': e.kind }, linked
      ? [el('a', { class: 'tile-link', href: destination, 'aria-label': e.title + ': ' + e.action.label }, content)]
      : content);
    if (e.href === '/lab/cohort/') t.setAttribute('data-project', 'cohort');
    if (e.draft) t.setAttribute('data-draft', '');
    return t;
  }

  /* Films only download when they are close, and only play while seen. */
  function wireFilms(root) {
    var vids = root.querySelectorAll('video[data-poster]');
    if (!('IntersectionObserver' in window)) { vids.forEach(function (v) { v.poster = v.dataset.poster; }); return; }
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var near = new IntersectionObserver(function (es) { es.forEach(function (x) {
      if (!x.isIntersecting) return; var v = x.target; near.unobserve(v);
      v.poster = v.dataset.poster; if (!reduce) { v.preload = 'auto'; v.load(); }
    }); }, { rootMargin: '60% 0px' });
    var seen = new IntersectionObserver(function (es) { es.forEach(function (x) {
      if (reduce) return;
      if (x.isIntersecting) { var p = x.target.play(); if (p && p.catch) p.catch(function () {}); }
      else x.target.pause();
    }); }, { threshold: 0.4 });
    vids.forEach(function (v) { near.observe(v); seen.observe(v); });
  }

  /* Brickwork: a card spans as many of the wall's 2px rows as it is tall,
     plus the gap, so the wall packs like a masonry wall but keeps its order.
     Re-measured whenever a card changes size (media loading, resizing). */
  var GAP = 26;
  window.layoutWall = function (mount) {
    function fit(t) { if (t.hidden) return; t.style.gridRowEnd = 'span ' + Math.ceil((t.getBoundingClientRect().height + GAP) / 2); }
    function all() { mount.querySelectorAll('.tile').forEach(fit); }
    all();
    if ('ResizeObserver' in window) {
      if (!mount._ro) mount._ro = new ResizeObserver(function (es) { es.forEach(function (e) { fit(e.target); }); });
      mount.querySelectorAll('.tile').forEach(function (t) { mount._ro.observe(t); });
    } else window.addEventListener('resize', all);
  };

  window.renderLab = function (mount, opts) {
    opts = opts || {};
    var list = window.LAB.slice();
    if (opts.limit) list = list.slice(0, opts.limit);
    list.forEach(function (e) { mount.appendChild(tile(e)); });
    wireFilms(mount);
    window.layoutWall(mount);
    if (window.mountVignettes) window.mountVignettes(mount);
    return list;
  };
})();
