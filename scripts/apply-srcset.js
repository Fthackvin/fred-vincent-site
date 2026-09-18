/* Wire the generated variants into the case-study markup.
 *
 * Every sizes= string below was measured, not guessed: _devtest.html loaded
 * each page in a same-origin iframe at the thirteen widths the inspector
 * offers, read getBoundingClientRect().width off every <img>, and the
 * percentages fell out of that. They are rounded UP to the next whole percent
 * so the browser is never handed a number smaller than the real box.
 *
 * The original file is always the last candidate, so a wide or high-density
 * screen keeps exactly the file it gets today. Only narrow screens change.
 *
 *   node scripts/apply-srcset.js [--check]
 *
 * Idempotent: an <img> that already carries a srcset is left alone.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

/* dir -> [ [sizes, [file, ...]], ... ] */
const PLAN = {
  'work/monet': [
    ['100vw', [
      's1-logotype.webp', 's2-composition.webp', 's3-cap.webp', 's4-typefaces.webp',
      's5-environment.webp', 's7-grid.webp', 's8-editorial.webp', 's9-embossed.webp',
    ]],
    ['(min-width: 1600px) 66vw, 80vw', ['s10-web.webp', 's11-mobile.webp']],
  ],
  'work/tag-tuition': [
    ['(min-width: 1600px) 33vw, (min-width: 1280px) 49vw, (min-width: 1024px) 56vw, 59vw',
      ['tag-logo.webp']],
    ['(min-width: 1600px) 16vw, (min-width: 1280px) 22vw, 44vw', [
      'metamorphosis-cover.webp', 'metamorph-1.webp', 'metamorph-2.webp',
      'sutton-hoo-part-1.webp', 'sutton-hoo-part-2.webp', 'rune-alphabet.webp',
      'runes-exercise.webp', 'hand-gestures-1.webp', 'hand-gestures-2.webp',
    ]],
    ['(min-width: 1600px) 14vw, (min-width: 1280px) 20vw, 40vw',
      ['creative-comprehension-cover.webp']],
    ['(min-width: 1600px) 10vw, (min-width: 1280px) 15vw, (min-width: 720px) 29vw, 45vw', [
      'book-darwin.webp', 'book-runes.webp', 'book-constellations.webp',
      'book-caterpillar.webp', 'book-cryptology.webp', 'book-insects.webp',
    ]],
  ],
  'work/kaizen-onboarding': [
    ['(min-width: 1600px) 32vw, (min-width: 1280px) 45vw, 91vw', [
      '8d7ff78b-e63b-4772-8bc3-5515617c6935_split.webp',
      '266511a0-56df-45d6-b6d0-78c8f6e20057_split.webp',
      '7856d4c5-4291-4462-beae-9150f553331b_split.webp',
      '47ef0253-panorama-detail.webp',
      '47ef0253-f4af-477d-adf3-eae127686c53_6509x1001.webp',
      '44a1dba5-0a9f-4153-b544-94744509c76d_1812x232.webp',
      '740ad6a7-67a8-4b09-a170-f36a1665014d_2292x704.webp',
      '39853f81-bb55-4529-bbc9-439f8748efb4_1076x1082.webp',
      'f08a3843-87b8-4702-a801-35ae020f1e1c_split.webp',
      'b592ca52-972d-4bf9-8e09-eac0fbdaacd0_1502x984.webp',
      'e049b162-876d-4b54-a79f-65aeac8fe8a2_1522x978.webp',
      '1d68f93c-ca93-4efd-af81-1fde92b037c8_1354x640.webp',
      '266511a0-56df-45d6-b6d0-78c8f6e20057_heuristics.webp',
    ]],
  ],
  'work/suitepad': [
    ['(min-width: 1600px) 32vw, (min-width: 1280px) 45vw, 91vw', [
      'screens/homepage-first-load.webp', 'screens/answer-weather-cards.webp',
      'screens/keyboard-text-entry.webp', 'screens/edge-cases.webp',
      'screens/suitepad-clickthrough.webp', 'screens/suitepad-ai-in-room.webp',
    ]],
  ],
  'work/linro': [
    ['(min-width: 1600px) 94vw, 92vw', [
      'screens/linro-violations.webp', 'screens/linro-agents.webp',
      'screens/linro-simulate.webp',
    ]],
  ],
};

function intrinsicWidth(file) {
  const out = execFileSync('sips', ['-g', 'pixelWidth', file], { encoding: 'utf8' });
  return Number((out.match(/pixelWidth:\s*(\d+)/) || [])[1] || 0);
}

const WIDTHS = [480, 768, 1024, 1440, 1920];
let changed = 0;
let skipped = 0;

for (const [dir, groups] of Object.entries(PLAN)) {
  const page = join(ROOT, dir, 'index.html');
  let html = readFileSync(page, 'utf8');
  const before = html;

  for (const [sizes, files] of groups) {
    for (const file of files) {
      const abs = join(ROOT, dir, file);
      if (!existsSync(abs)) { console.warn(`  missing source: ${dir}/${file}`); continue; }

      const stem = file.replace(/\.webp$/, '');
      const candidates = WIDTHS
        .filter((w) => existsSync(join(ROOT, dir, `${stem}-${w}.webp`)))
        .map((w) => `${stem}-${w}.webp ${w}w`);
      if (!candidates.length) continue;
      candidates.push(`${file} ${intrinsicWidth(abs)}w`);

      /* Match the <img ...> that carries this src and nothing else. */
      const re = new RegExp(`<img(?![^>]*\\bsrcset=)([^>]*?)src="${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
      const next = html.replace(re, (m, pre) =>
        `<img${pre}src="${file}"\n               srcset="${candidates.join(', ')}"\n               sizes="${sizes}"`);
      if (next === html) { skipped++; continue; }
      html = next;
      changed++;
    }
  }

  if (html !== before) {
    if (!CHECK) writeFileSync(page, html);
    console.log(`${CHECK ? 'would update' : 'updated'} ${dir}/index.html`);
  }
}

console.log(`\n${changed} <img> wired, ${skipped} already had srcset or did not match.`);
