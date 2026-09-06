/* =====================================================================
   Screen → SVG, for Figma.

   Figma has no HTML importer, but it reads SVG well: rects come in as
   frames it can edit, and <text> comes in as real text with the family,
   size and weight intact. So rather than shipping a flat PNG of each
   interface, this walks the rendered document and writes what is actually
   on screen — measured, not re-declared.

   It reads getBoundingClientRect and getComputedStyle, so what it emits is
   the browser's own layout: no second implementation of the CSS to drift
   out of step with the real screen.

   Run it against a screen with `?bare`, from the case study page's console
   or from the screen's own:

     await LinroPrefetch(); copy(LinroToSVG())

   Emitted, in document order:
     · a rect per element with a visible background, border or radius
     · a rect per border edge where the four sides differ
     · a <text> per text-carrying leaf, positioned on its first line's
       baseline and aligned the way the box aligns it
     · inline <svg> children, transplanted whole and positioned
     · <img> pointing at an SVG, read and transplanted the same way
     · a hatch fill written as the lines it actually is

   Not emitted: box-shadows (Figma reads them from SVG filters badly, and
   the interface has none that carry meaning), and background gradients on
   anything but a plain fill — the two hairline highlights are written as
   flat rects at their effective colour instead.
   ===================================================================== */
(function (root) {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  /* rgba() → a hex plus a separate opacity, because Figma keeps fill and
     fill-opacity as two properties and reads them back cleanly. */
  function colour(v) {
    if (!v) return null;
    var m = v.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    var p = m[1].split(',').map(function (n) { return parseFloat(n); });
    var a = p.length > 3 ? p[3] : 1;
    if (a === 0) return null;
    var hex = '#' + p.slice(0, 3).map(function (n) {
      return ('0' + Math.round(n).toString(16)).slice(-2);
    }).join('').toUpperCase();
    return { hex: hex, a: a };
  }
  function num(v) { return Math.round(parseFloat(v) * 100) / 100 || 0; }

  /* Read every referenced SVG once, so the walk itself can stay synchronous
     and the caller gets a string rather than a promise of one. */
  root.LinroPrefetch = function () {
    root.__linroSvgCache = root.__linroSvgCache || {};
    var srcs = [];
    Array.prototype.forEach.call(document.images, function (im) {
      var s = im.getAttribute('src') || '';
      if (/\.svg(\?|$)/.test(s) && srcs.indexOf(s) === -1) srcs.push(s);
    });
    return Promise.all(srcs.map(function (s) {
      return fetch(s).then(function (r) { return r.text(); })
        .then(function (t) { root.__linroSvgCache[s] = t; })
        .catch(function () {});
    }));
  };

  root.LinroToSVG = function (opts) {
    opts = opts || {};
    var target = opts.root || document.body.firstElementChild;
    var base = target.getBoundingClientRect();
    var W = Math.round(base.width), H = Math.round(base.height);
    var out = [];

    function push(s) { out.push(s); }

    function walk(el) {
      var cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return;
      var r = el.getBoundingClientRect();
      var x = num(r.left - base.left), y = num(r.top - base.top);
      var w = num(r.width), h = num(r.height);
      if (w <= 0 || h <= 0) return;

      var tag = el.tagName.toLowerCase();

      /* An inline SVG is already the right thing — take it whole and put it
         where the layout put it, rather than trying to re-derive its paths. */
      if (tag === 'svg') {
        var clone = el.cloneNode(true);
        clone.removeAttribute('style');
        clone.setAttribute('x', x); clone.setAttribute('y', y);
        clone.setAttribute('width', w); clone.setAttribute('height', h);
        push(clone.outerHTML);
        return;
      }

      /* An <img> pointing at an SVG is transplanted whole rather than left as
         a link: Figma does not fetch external hrefs, so a referenced mark
         would arrive as an empty box. Same-origin, so it can just be read —
         `LinroToSVG` is async for this one reason. */
      if (tag === 'img') {
        var src = el.getAttribute('src') || '';
        if (/\.svg(\?|$)/.test(src) && root.__linroSvgCache && root.__linroSvgCache[src]) {
          var doc = new DOMParser().parseFromString(root.__linroSvgCache[src], 'image/svg+xml');
          var node = doc.documentElement;
          node.setAttribute('x', x); node.setAttribute('y', y);
          node.setAttribute('width', w); node.setAttribute('height', h);
          push(node.outerHTML);
        } else {
          push('<image x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
               '" href="' + esc(new URL(src, location.href).href) + '"/>');
        }
        return;
      }

      /* --- the box ---------------------------------------------------- */
      var bg = colour(cs.backgroundColor);
      var rad = num(cs.borderTopLeftRadius);
      if (bg) {
        push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' +
             (rad ? ' rx="' + rad + '"' : '') +
             ' fill="' + bg.hex + '"' + (bg.a < 1 ? ' fill-opacity="' + bg.a + '"' : '') + '/>');
      }

      /* A repeating-linear-gradient is the hatch that means "under suspicion".
         SVG has no equivalent that survives the trip into Figma as anything
         editable, so it is written as the lines it actually is, clipped to the
         box by arithmetic rather than by a clip-path. */
      var bgi = cs.backgroundImage;
      if (bgi && bgi.indexOf('repeating-linear-gradient') === 0) {
        var stripe = colour(bgi.slice(bgi.indexOf('(') + 1)) || { hex: '#E8EAEA', a: 1 };
        var step = 3, sw = 1;
        var g = [];
        for (var c = x + y; c <= (x + w) + (y + h); c += step) {
          var pts = [];
          [[x, y, 1, 0, w], [x, y, 0, 1, h], [x, y + h, 1, 0, w], [x + w, y, 0, 1, h]]
            .forEach(function (e) {
              var t = e[2] ? c - e[1] - e[0] : c - e[0] - e[1];
              if (t >= 0 && t <= e[4]) pts.push(e[2] ? [e[0] + t, e[1]] : [e[0], e[1] + t]);
            });
          if (pts.length >= 2) {
            pts.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
            var A = pts[0], B = pts[pts.length - 1];
            if (Math.abs(A[0] - B[0]) > .01 || Math.abs(A[1] - B[1]) > .01) {
              g.push('<line x1="' + num(A[0]) + '" y1="' + num(A[1]) + '" x2="' + num(B[0]) +
                     '" y2="' + num(B[1]) + '" stroke="' + stripe.hex + '" stroke-width="' + sw + '"/>');
            }
          }
        }
        if (g.length) push('<g>' + g.join('') + '</g>');
      }

      /* --- borders, one edge at a time --------------------------------- */
      [['Top', x, y, w, num(cs.borderTopWidth)],
       ['Bottom', x, y + h - num(cs.borderBottomWidth), w, num(cs.borderBottomWidth)],
       ['Left', x, y, num(cs.borderLeftWidth), h],
       ['Right', x + w - num(cs.borderRightWidth), y, num(cs.borderRightWidth), h]
      ].forEach(function (e, i) {
        var side = e[0];
        var bw = i < 2 ? e[4] : e[3];
        if (!bw || cs['border' + side + 'Style'] === 'none') return;
        var c = colour(cs['border' + side + 'Color']);
        if (!c) return;
        var bx = e[1], by = e[2], bwid = i < 2 ? e[3] : e[3], bhei = i < 2 ? e[4] : e[4];
        push('<rect x="' + bx + '" y="' + by + '" width="' + bwid + '" height="' + bhei +
             '" fill="' + c.hex + '"' + (c.a < 1 ? ' fill-opacity="' + c.a + '"' : '') + '/>');
      });

      /* --- text ---------------------------------------------------------
         Every direct text node, measured with a Range rather than derived
         from the box. A leaf test misses most of this interface: a nav item
         is `<span class="ic">…</span>Agents<span>12</span>`, a row title is
         `test-agent acquired <em>admin</em> beyond granted scope`, a pill is
         `<i></i>Denied`. All of those hold text alongside an element, so
         anything that only emits childless nodes drops the label and keeps
         the badge.

         SVG text does not wrap, so a run that wraps in the browser is split
         at the same points the browser broke it — found by walking the
         characters and grouping them by which line box they landed in. */
      for (var ci = 0; ci < el.childNodes.length; ci++) {
        var node = el.childNodes[ci];
        if (node.nodeType !== 3) continue;
        var raw = node.nodeValue;
        if (!raw || !raw.trim()) continue;

        var fs = num(cs.fontSize);
        var lh = cs.lineHeight === 'normal' ? fs * 1.2 : num(cs.lineHeight);
        var col = colour(cs.color) || { hex: '#000000', a: 1 };
        var fam = esc(cs.fontFamily.split(',')[0].replace(/["']/g, ''));
        var ls = num(cs.letterSpacing);

        var rng = document.createRange();
        var runs = [];
        var cur = null;
        for (var ch = 0; ch < raw.length; ch++) {
          rng.setStart(node, ch); rng.setEnd(node, ch + 1);
          var cr = rng.getBoundingClientRect();
          if (!cr.width && !cr.height) continue;          /* a collapsed space */
          if (!cur || Math.abs(cr.top - cur.top) > 1) {
            cur = { top: cr.top, left: cr.left, bottom: cr.bottom, text: '' };
            runs.push(cur);
          }
          cur.text += raw[ch];
        }
        for (var ri = 0; ri < runs.length; ri++) {
          var run = runs[ri];
          var t = run.text.replace(/\s+/g, ' ').trim();
          if (!t) continue;
          /* The range's box is the line box, so the baseline sits an ascent
             below where the glyphs start inside it, not at its top. */
          var lineH = run.bottom - run.top;
          var baseline = run.top - base.top + (lineH - fs) / 2 + fs * 0.8;
          push('<text x="' + num(run.left - base.left) + '" y="' + num(baseline) + '"' +
            ' font-family="' + fam + '" font-size="' + fs + '" font-weight="' + cs.fontWeight + '"' +
            (ls ? ' letter-spacing="' + ls + '"' : '') +
            ' fill="' + col.hex + '"' + (col.a < 1 ? ' fill-opacity="' + col.a + '"' : '') +
            '>' + esc(t) + '</text>');
        }
      }

      for (var i = 0; i < el.children.length; i++) walk(el.children[i]);
    }

    walk(target);

    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H +
      '" viewBox="0 0 ' + W + ' ' + H + '" fill="none">\n' +
      '<rect width="' + W + '" height="' + H + '" fill="#0A0C0E"/>\n' +
      out.join('\n') + '\n</svg>';
  };
})(window);
