/* Responsive image variants.
 *
 * The case studies ship one file per picture, sized for a retina desktop. A
 * phone then downloads and — the part that actually hurts — *decodes* the same
 * file. Decode cost is intrinsic pixels, not bytes: kaizen-blocks-mosaic at
 * 2280x1320 costs ~12MB of RAM decoded however small the .webp is on the wire.
 * Several of those at once, inside an in-app browser that is also decoding
 * video, is where Android starts evicting decoded frames and painting the
 * broken-image glyph instead.
 *
 * So: emit narrower siblings and let the browser pick. Widths are the ones the
 * layout actually asks for (see sizes= in each page), doubled for retina.
 *
 *   node scripts/build-responsive-images.js          # build what is missing
 *   node scripts/build-responsive-images.js --force  # rebuild everything
 *   node scripts/build-responsive-images.js --check  # report, write nothing
 *
 * Variants are derivative files and are committed alongside their source so
 * the site stays a plain static deploy with no build step on Vercel.
 */

import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* Below this, a picture is already phone-sized and a variant would only add a
 * file. The flow screens (436px) and the phone stills (405/450px) live here. */
const MIN_SOURCE_WIDTH = 900;

/* The rungs. A source only gets rungs strictly narrower than itself, and never
 * one within 15% of its own width — a 1010px source does not need a 960px
 * twin, that is a second download for no fewer pixels. */
const WIDTHS = [480, 768, 1024, 1440, 1920];
const NEAR = 0.85;

const SKIP_DIRS = new Set(['node_modules', '.git', 'Fonts', 'favicons', 'drawing']);

const args = new Set(process.argv.slice(2));
const FORCE = args.has('--force');
const CHECK = args.has('--check');

/* Only images the pages actually paint. The case-study folders also hold
 * originals nothing renders any more (earlier crops, unused exports, the
 * og:image), and building rungs for those is a hundred files of pure noise. */
function renderedSources() {
  const used = new Set();
  const pages = [];
  (function findPages(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) findPages(p);
      else if (e.name === 'index.html') pages.push(p);
    }
  })(ROOT);

  for (const page of pages) {
    const html = readFileSync(page, 'utf8');
    const dir = dirname(page);
    for (const m of html.matchAll(/<img[^>]*?\ssrc="([^"]+\.webp)"/g)) {
      used.add(join(m[1].startsWith('/') ? ROOT : dir, m[1].replace(/^\//, '')));
    }
    /* Candidates already wired keep their rungs even if the base src moved. */
    for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
      for (const part of m[1].split(',')) {
        const u = part.trim().split(/\s+/)[0];
        if (!u || !/\.webp$/.test(u)) continue;
        used.add(join(u.startsWith('/') ? ROOT : dir, u.replace(/^\//, '')));
      }
    }
  }
  return used;
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(p, out);
    } else if (/\.webp$/i.test(entry.name) && !/-\d+\.webp$/i.test(entry.name)) {
      out.push(p);
    }
  }
  return out;
}

function intrinsicWidth(file) {
  const out = execFileSync('sips', ['-g', 'pixelWidth', file], { encoding: 'utf8' });
  const m = out.match(/pixelWidth:\s*(\d+)/);
  return m ? Number(m[1]) : 0;
}

function variantsFor(width) {
  return WIDTHS.filter((w) => w < width && w < width * NEAR);
}

let built = 0;
let skipped = 0;
let planned = 0;
const report = [];

const RENDERED = renderedSources();

for (const src of walk(ROOT)) {
  if (!RENDERED.has(src)) continue;
  const width = intrinsicWidth(src);
  if (!width || width < MIN_SOURCE_WIDTH) continue;

  const targets = variantsFor(width);
  if (!targets.length) continue;

  const stem = join(dirname(src), basename(src, extname(src)));
  const made = [];

  for (const w of targets) {
    const out = `${stem}-${w}.webp`;
    const fresh =
      existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs;
    if (fresh && !FORCE) {
      skipped++;
      continue;
    }
    planned++;
    if (CHECK) {
      made.push(`${w} (would build)`);
      continue;
    }
    /* -q 82 is where these flatten out: below it the UI screenshots start to
     * show mush around the type, above it the file stops getting smaller. */
    execFileSync('cwebp', ['-quiet', '-q', '82', '-resize', String(w), '0', src, '-o', out]);
    built++;
    made.push(`${w} (${Math.round(statSync(out).size / 1024)}kB)`);
  }

  if (made.length) {
    report.push(`${src.replace(ROOT + '/', '')}  ${width}px -> ${made.join(', ')}`);
  }
}

for (const line of report) console.log(line);
console.log(
  CHECK
    ? `\n${planned} variant(s) missing, ${skipped} already current.`
    : `\nBuilt ${built} variant(s); ${skipped} already current.`
);
