/* ============================================================
   build-rss.js — runs at Vercel build time.

   Fetches the Substack RSS feed and injects the 6 most recent
   pieces into index.html between the markers:

     <!-- RSS:writing:start -->
     <!-- RSS:writing:end -->

   Anything between those markers is replaced with freshly-rendered
   HTML. If the fetch fails (network, Substack down, parse error),
   the existing content between the markers is left untouched —
   so the last successful build's content acts as the cache.

   If the markers are missing or the file is unreadable, the script
   exits 0 without making changes so the Vercel build still succeeds.

   How the cron works:
     - vercel.json declares a daily cron at 08:00 UTC that calls
       /api/cron-rebuild.
     - /api/cron-rebuild.js POSTs to the DEPLOY_HOOK_URL env var,
       triggering a fresh Vercel build that re-runs this script.

   Manual rebuild:
     - Visit Vercel dashboard → Deployments → ⋯ → Redeploy.

   To change the feed URL, edit FEED_URL below.
   ============================================================ */

import Parser from 'rss-parser';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const HTML_PATHS = [
  resolve(ROOT, 'index.html'),
  resolve(ROOT, 'about', 'index.html'),
];

const FEED_URL = 'https://studiovincent.substack.com/feed';
const MAX_ITEMS = 6;
const DESC_LIMIT = 120;
const MARKER_START = '<!-- RSS:writing:start -->';
const MARKER_END = '<!-- RSS:writing:end -->';

const parser = new Parser({ timeout: 8000 });

function stripHtml(s) {
  return String(s || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(s, n) {
  if (!s) return '';
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + '…';
}

function formatMonth(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d
    .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    .toUpperCase();
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* Six icon-animation variants. Cycled by item index so each piece in the
   list gets its own micro-flourish when it scrolls into view. The CSS
   keyframes live in index.html under the .rw-item.rw-anim-* selectors. */
const ANIM_VARIANTS = [
  'rw-anim-drop',
  'rw-anim-cascade',
  'rw-anim-pulse',
  'rw-anim-spin',
  'rw-anim-blur',
  'rw-anim-rise',
];

/* Hand-scribbled icons from /drawing/. Each piece in the RSS list gets a
   unique drawing — we walk through this array in order and don't repeat
   any until all eight have been used (the feed only ever returns up to
   MAX_ITEMS, so no item ever shares an icon with another). */
const DRAWINGS = [
  '/drawing/Scan%2066%203.svg',
  '/drawing/Scan%2066%204.svg',
  '/drawing/Scan%2066%205.svg',
  '/drawing/Scan%2066%206.svg',
  '/drawing/Scan%2066%207.svg',
  '/drawing/Scan%2066%208.svg',
  '/drawing/Scan%2066%209.svg',
  '/drawing/Scan%2066%2010.svg',
];

function iconImg(idx) {
  const src = DRAWINGS[idx % DRAWINGS.length];
  return `<img class="rw-scribble" src="${src}" alt="" loading="lazy">`;
}

/* Specific Substack posts are also published as case-study pages on
   this site. When they appear in the feed we link to the local page
   instead of Substack so readers land on the full version. */
const LOCAL_OVERRIDES = {
  'all-aboard': '/work/onboarding-redesign/',
  'answering-the-wrong-question': '/work/feed-redesign/',
};

function resolveLink(originalLink) {
  if (!originalLink) return { href: '', local: false };
  // The Substack URL is .../p/<slug>; grab the slug.
  const m = originalLink.match(/\/p\/([^/?#]+)/);
  const slug = m ? m[1] : '';
  const local = LOCAL_OVERRIDES[slug];
  if (local) return { href: local, local: true };
  return { href: originalLink, local: false };
}

function renderItem(item, idx) {
  const anim = ANIM_VARIANTS[idx % ANIM_VARIANTS.length];
  const { href, local } = resolveLink(item.link);
  const linkAttrs = local ? '' : ' target="_blank" rel="noopener noreferrer"';
  const description = item.description
    ? `\n            <p class="rw-desc">${escapeHtml(item.description)}</p>`
    : '';
  const meta = item.category
    ? `${escapeHtml(item.category)} <span class="rw-sep" aria-hidden="true">·</span> ${escapeHtml(item.date)}`
    : escapeHtml(item.date);

  return `      <li class="rw-item fade-up ${anim}">
        <a class="rw-link" href="${escapeHtml(href)}"${linkAttrs}>
          <span class="rw-icon">${iconImg(idx)}</span>
          <div class="rw-content">
            <h3 class="rw-title">${escapeHtml(item.title)} <span class="rw-arrow" aria-hidden="true">→</span></h3>${description}
            <p class="rw-meta">${meta}</p>
          </div>
        </a>
      </li>`;
}

function renderFallback() {
  return `      <li class="rw-item rw-fallback fade-up rw-anim-drop">
        <a class="rw-link" href="https://studiovincent.substack.com" target="_blank" rel="noopener noreferrer">
          <span class="rw-icon">${iconImg(0)}</span>
          <div class="rw-content">
            <h3 class="rw-title">Read all writing on Substack <span class="rw-arrow" aria-hidden="true">→</span></h3>
            <p class="rw-meta">SUBSTACK</p>
          </div>
        </a>
      </li>`;
}

async function main() {
  let items = null;

  try {
    console.log(`[build-rss] fetching ${FEED_URL}`);
    const feed = await parser.parseURL(FEED_URL);
    items = (feed.items || []).slice(0, MAX_ITEMS).map((it) => ({
      title: it.title || '',
      link: it.link || '',
      date: formatMonth(it.pubDate || it.isoDate || ''),
      description: truncate(stripHtml(it.contentSnippet || it.content || it.description || ''), DESC_LIMIT),
      category: (it.categories && it.categories[0]) || null,
    }));
    console.log(`[build-rss] parsed ${items.length} items`);
  } catch (err) {
    console.error(`[build-rss] fetch failed: ${err.message}`);
    console.error('[build-rss] keeping existing content between markers (last good build acts as cache).');
    return;
  }

  for (const path of HTML_PATHS) {
    let html;
    try {
      html = await readFile(path, 'utf8');
    } catch (err) {
      console.error(`[build-rss] could not read ${path}: ${err.message}`);
      continue;
    }

    const startIdx = html.indexOf(MARKER_START);
    const endIdx = html.indexOf(MARKER_END);
    if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
      console.warn(`[build-rss] markers not found in ${path}; skipping.`);
      continue;
    }

    const before = html.slice(0, startIdx + MARKER_START.length);
    const after = html.slice(endIdx);

    let rendered;
    if (items && items.length > 0) {
      rendered = items.map(renderItem).join('\n');
    } else {
      console.warn('[build-rss] no items parsed; rendering fallback.');
      rendered = renderFallback();
    }

    const next = `${before}\n${rendered}\n      ${after}`;

    if (next !== html) {
      await writeFile(path, next, 'utf8');
      console.log(`[build-rss] ${path} updated.`);
    } else {
      console.log(`[build-rss] ${path} no changes needed.`);
    }
  }
}

main().catch((err) => {
  console.error('[build-rss] unexpected error:', err);
  // Do not fail the build.
});
