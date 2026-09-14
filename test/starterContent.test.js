import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStarterDeck } from '../src/cards/starterCards.js';
import { ENEMY_ROSTER } from '../src/game/enemies.js';
import { createDyingGod } from '../src/game/bossRoster.js';
import { BACKGROUNDS } from '../src/run/backgrounds.js';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function assertAssetExists(relativePath, label) {
  const full = path.join(PROJECT_ROOT, relativePath);
  assert.ok(fs.existsSync(full), `${label}: expected art file to exist at ${relativePath}`);
}

test('the starter deck has 16 unique, correctly-shaped cards', () => {
  const deck = createStarterDeck();
  assert.equal(deck.length, 16);

  const ids = deck.map((c) => c.id);
  assert.equal(new Set(ids).size, 16, 'card ids should all be unique');

  for (const card of deck) {
    assert.equal(typeof card.name, 'string');
    assert.ok(card.name.length > 0);
    assert.equal(typeof card.cost, 'number');
    assert.ok(card.cost >= 0);
    assert.equal(typeof card.effect, 'function');
    assert.equal(card.wear, 0);
    assert.equal(card.corrupted, false);
  }
});

test('every starter card references an art file that exists on disk', () => {
  for (const card of createStarterDeck()) {
    assert.ok(card.art, `${card.name} should have an art path`);
    assertAssetExists(card.art, card.name);
    if (card.corruptedArt) assertAssetExists(card.corruptedArt, `${card.name} (corrupted)`);
  }
});

test('the manifest variant art files are wired as corrupted-state art, not extra cards', () => {
  const deck = createStarterDeck();
  const byId = Object.fromEntries(deck.map((c) => [c.id, c]));

  assert.equal(byId['last-scream'].corruptedArt, 'assets/cards/card_20_last_scream_of_the_god_variant.png');
  assert.equal(byId['titan-of-the-deep'].corruptedArt, 'assets/cards/card_18_titan_of_the_deep_variant.png');
  assert.equal(byId['rite-of-the-bleeding-altar'].corruptedArt, 'assets/cards/card_16_blood_communion_variant.png');

  // The variant files themselves still exist even though they're not separate cards.
  assertAssetExists('assets/cards/card_17_blood_rite_variant.png', 'Blood Rite variant');

  // Folding 4 variants into 3 base cards still leaves 16 unique mechanical cards.
  assert.equal(deck.length, 16);
});

test('the enemy roster has 5 enemies with distinct attack patterns and existing art', () => {
  assert.equal(ENEMY_ROSTER.length, 5);

  const enemies = ENEMY_ROSTER.map((factory) => factory());
  const names = enemies.map((e) => e.name);
  assert.equal(new Set(names).size, 5, 'enemy names should all be unique');

  for (const enemy of enemies) {
    assert.ok(enemy.art, `${enemy.name} should have an art path`);
    assertAssetExists(enemy.art, enemy.name);
    assert.equal(typeof enemy.takeTurn, 'function');
  }

  // Distinct attack patterns: each should behave differently from a flat hit.
  const player = () => ({ faith: 100, maxFaith: 100, shield: 0, takeDamage(n) { this.faith -= n; } });

  const [crownedWound, shriekingBrood, hollowReliquary, fracturedWidow, beckoner] = enemies;

  // Crowned Wound: telegraphs (small coil), then a big strike.
  const p1 = player();
  const coil = crownedWound.takeTurn(p1);
  const strike = crownedWound.takeTurn(p1);
  assert.notEqual(coil.amount, strike.amount);

  // Shrieking Brood: damage escalates turn over turn.
  const p2 = player();
  const first = shriekingBrood.takeTurn(p2).amount;
  const second = shriekingBrood.takeTurn(p2).amount;
  assert.ok(second > first, 'Shrieking Brood should hit harder as its brood grows');

  // Hollow Reliquary: punishes corrupted cards in the deck.
  const p3 = player();
  const cleanDeck = { allCards: () => [{ corrupted: false }, { corrupted: false }] };
  const dirtyDeck = { allCards: () => [{ corrupted: true }, { corrupted: true }] };
  const cleanHit = hollowReliquary.takeTurn(p3, { deck: cleanDeck }).amount;
  const dirtyHit = hollowReliquary.takeTurn(p3, { deck: dirtyDeck }).amount;
  assert.ok(dirtyHit > cleanHit, 'Hollow Reliquary should punish a corrupted deck harder');

  // Fractured Widow: adds wear to a card in the deck it's given.
  const p4 = player();
  const targetCard = { wear: 0, corrupted: false, applyWear(n) { this.wear += n; } };
  fracturedWidow.takeTurn(p4, { deck: { allCards: () => [targetCard] }, log: () => {} });
  assert.ok(targetCard.wear > 0, 'Fractured Widow should accelerate decay on a deck card');

  // Beckoner: multiple hits per turn.
  const p5 = player();
  const flurry = beckoner.takeTurn(p5);
  assert.ok(flurry.hits >= 2, 'Beckoner should land more than one hit per turn');
});

test('the boss and all three backgrounds reference art that exists on disk', () => {
  const boss = createDyingGod();
  assert.equal(boss.name, 'The Dying God');
  assert.ok(boss.tethered);
  assertAssetExists(boss.art, 'The Dying God');

  assertAssetExists(BACKGROUNDS.mapScreen, 'map screen background');
  assertAssetExists(BACKGROUNDS.nodeTransition, 'node transition background');
  assertAssetExists(BACKGROUNDS.bossArena, 'boss arena background');
});
