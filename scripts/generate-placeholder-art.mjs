// Generates simple placeholder SVG art (solid color + name + "PLACEHOLDER ART"
// label) for expansion content that doesn't have real generated art yet.
// Every file this script writes is also listed in ASSET_TODO.md with what it
// should eventually depict -- re-run after adding new placeholder entries
// below, never hand-edit the generated SVGs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Wraps `text` onto multiple <tspan> lines of roughly `maxChars` each,
// centered horizontally at `x`, starting at `y` with `lineHeight` spacing.
function wrapTspans(text, x, y, lineHeight, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines
    .map((line, i) => `<tspan x="${x}" y="${y + i * lineHeight}">${escapeXml(line)}</tspan>`)
    .join('');
}

function makeSvg({ width, height, bg, accent, label, sublabel }) {
  const titleY = height / 2 - 10;
  const titleLines = wrapTspans(label, width / 2, titleY, 30, 16);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${bg}" />
  <rect x="6" y="6" width="${width - 12}" height="${height - 12}" fill="none" stroke="${accent}" stroke-width="3" stroke-dasharray="10 6" />
  <line x1="0" y1="0" x2="${width}" y2="${height}" stroke="${accent}" stroke-width="1" opacity="0.25" />
  <line x1="${width}" y1="0" x2="0" y2="${height}" stroke="${accent}" stroke-width="1" opacity="0.25" />
  <text x="${width / 2}" y="${titleY}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="26" font-weight="bold" fill="${accent}">${titleLines}</text>
  ${sublabel ? `<text x="${width / 2}" y="${titleY + 46}" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="${accent}" opacity="0.85">${escapeXml(sublabel)}</text>` : ''}
  <text x="${width / 2}" y="${height - 22}" text-anchor="middle" font-family="monospace" font-size="15" letter-spacing="2" fill="#ffffff">PLACEHOLDER ART</text>
</svg>`;
}

// { outPath, label, sublabel, kind } -- kind picks dimensions + palette.
const KIND_DIMS = {
  card: { width: 300, height: 420 },
  enemy: { width: 320, height: 320 },
  boss: { width: 420, height: 420 },
  background: { width: 960, height: 540 },
};

// A distinct dark-fantasy-ish color per entry so placeholders are at least
// visually distinguishable from each other at a glance.
const PALETTE = [
  ['#3a1414', '#d4af6a'],
  ['#122a1c', '#6ea8d4'],
  ['#241238', '#9b4fd0'],
  ['#2a1d08', '#e08a3c'],
  ['#1a1010', '#c23b3b'],
  ['#0d1f26', '#6ea8d4'],
  ['#2b1a05', '#f0d38a'],
  ['#1c0f24', '#9b4fd0'],
  ['#20120e', '#e08a3c'],
  ['#141c14', '#d4af6a'],
  ['#231515', '#c23b3b'],
  ['#0f1a2a', '#6ea8d4'],
  ['#2a0f1f', '#9b4fd0'],
  ['#1f1f0a', '#f0d38a'],
  ['#12241f', '#6ea8d4'],
  ['#2c1608', '#e08a3c'],
  ['#181818', '#a89a8c'],
  ['#301616', '#c23b3b'],
];

const ENTRIES = [
  // ---- 10 new expansion cards ----
  { outPath: 'assets/cards/placeholder_card_21_whispering_ash.svg', kind: 'card', label: 'Whispering Ash', sublabel: 'Expansion Card' },
  { outPath: 'assets/cards/placeholder_card_22_gravebound_oath.svg', kind: 'card', label: 'Gravebound Oath', sublabel: 'Expansion Card' },
  { outPath: 'assets/cards/placeholder_card_23_ashen_ward.svg', kind: 'card', label: 'Ashen Ward', sublabel: 'Expansion Card' },
  { outPath: 'assets/cards/placeholder_card_24_pact_of_embers.svg', kind: 'card', label: 'Pact of Embers', sublabel: 'Expansion Card' },
  { outPath: 'assets/cards/placeholder_card_25_unbroken_choir.svg', kind: 'card', label: 'Unbroken Choir', sublabel: 'Expansion Card' },
  { outPath: 'assets/cards/placeholder_card_26_faithbreakers_gambit.svg', kind: 'card', label: "Faithbreaker's Gambit", sublabel: 'Expansion Card' },
  { outPath: 'assets/cards/placeholder_card_27_cinder_wake.svg', kind: 'card', label: 'Cinder Wake', sublabel: 'Expansion Card' },
  { outPath: 'assets/cards/placeholder_card_28_hollow_chant.svg', kind: 'card', label: 'Hollow Chant', sublabel: 'Expansion Card' },
  { outPath: 'assets/cards/placeholder_card_29_bound_in_silence.svg', kind: 'card', label: 'Bound in Silence', sublabel: 'Expansion Card' },
  { outPath: 'assets/cards/placeholder_card_30_the_last_ember.svg', kind: 'card', label: 'The Last Ember', sublabel: 'Expansion Card' },
  // ---- 5 new expansion enemies ----
  { outPath: 'assets/enemies/placeholder_enemy_06_the_gilded_liar.svg', kind: 'enemy', label: 'The Gilded Liar', sublabel: 'Expansion Enemy' },
  { outPath: 'assets/enemies/placeholder_enemy_07_the_sunderer.svg', kind: 'enemy', label: 'The Sunderer', sublabel: 'Expansion Enemy' },
  { outPath: 'assets/enemies/placeholder_enemy_08_the_famine.svg', kind: 'enemy', label: 'The Famine', sublabel: 'Expansion Enemy' },
  { outPath: 'assets/enemies/placeholder_enemy_09_the_verdict.svg', kind: 'enemy', label: 'The Verdict', sublabel: 'Expansion Enemy' },
  { outPath: 'assets/enemies/placeholder_enemy_10_the_chorus_unbound.svg', kind: 'enemy', label: 'The Chorus Unbound', sublabel: 'Expansion Enemy' },
  // ---- 1 new mid-run boss ----
  { outPath: 'assets/boss/placeholder_boss_02_the_broken_acolyte.svg', kind: 'boss', label: 'The Broken Acolyte', sublabel: 'Mid-Run Boss' },
  // ---- 2 new backgrounds ----
  { outPath: 'assets/backgrounds/placeholder_bg_04_the_hollow_sanctum.svg', kind: 'background', label: 'The Hollow Sanctum', sublabel: 'Rest Node Background' },
  { outPath: 'assets/backgrounds/placeholder_bg_05_the_acolytes_hollow.svg', kind: 'background', label: "The Acolyte's Hollow", sublabel: 'Mid-Run Boss Arena Background' },
];

for (let i = 0; i < ENTRIES.length; i++) {
  const entry = ENTRIES[i];
  const dims = KIND_DIMS[entry.kind];
  const [bg, accent] = PALETTE[i % PALETTE.length];
  const svg = makeSvg({ ...dims, bg, accent, label: entry.label, sublabel: entry.sublabel });
  const full = path.join(ROOT, entry.outPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, svg);
  console.log(`Wrote ${entry.outPath}`);
}

console.log(`\nGenerated ${ENTRIES.length} placeholder art files.`);
