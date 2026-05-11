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
const HTML_PATH = resolve(ROOT, 'index.html');

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

const DOT_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
  + '<circle cx="4" cy="4" r="1"/><circle cx="12" cy="4" r="1"/><circle cx="20" cy="4" r="1"/>'
  + '<circle cx="4" cy="12" r="1"/><circle cx="12" cy="12" r="2.4"/><circle cx="20" cy="12" r="1"/>'
  + '<circle cx="4" cy="20" r="1"/><circle cx="12" cy="20" r="1"/><circle cx="20" cy="20" r="1"/>'
  + '</svg>';

function renderItem(item) {
  const description = item.description
    ? `\n          <p class="rw-desc">${escapeHtml(item.description)}</p>`
    : '';
  const meta = item.category
    ? `${escapeHtml(item.category)} <span class="rw-sep" aria-hidden="true">·</span> ${escapeHtml(item.date)}`
    : escapeHtml(item.date);

  return `      <li class="rw-item fade-up">
        <span class="rw-icon">${DOT_SVG}</span>
        <div class="rw-content">
          <h3 class="rw-title"><a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a></h3>${description}
          <p class="rw-meta">${meta}</p>
        </div>
      </li>`;
}

function renderFallback() {
  return `      <li class="rw-item rw-fallback fade-up">
        <span class="rw-icon">${DOT_SVG}</span>
        <div class="rw-content">
          <h3 class="rw-title"><a href="https://studiovincent.substack.com" target="_blank" rel="noopener noreferrer">Read all writing on Substack</a></h3>
          <p class="rw-meta">SUBSTACK</p>
        </div>
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

  let html;
  try {
    html = await readFile(HTML_PATH, 'utf8');
  } catch (err) {
    console.error(`[build-rss] could not read index.html: ${err.message}`);
    return;
  }

  const startIdx = html.indexOf(MARKER_START);
  const endIdx = html.indexOf(MARKER_END);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    console.error('[build-rss] RSS markers not found; skipping injection.');
    return;
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
    await writeFile(HTML_PATH, next, 'utf8');
    console.log('[build-rss] index.html updated.');
  } else {
    console.log('[build-rss] no changes needed.');
  }
}

main().catch((err) => {
  console.error('[build-rss] unexpected error:', err);
  // Do not fail the build.
});
