import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStarterDeck } from '../src/cards/starterCards.js';
import { ENEMY_ROSTER } from '../src/game/enemies.js';
import { createDyingGod, createBrokenAcolyte, BrokenAcolyte } from '../src/game/bossRoster.js';
import { MemoryShardBoss } from '../src/game/BossCombat.js';
import { BACKGROUNDS } from '../src/run/backgrounds.js';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function assertAssetExists(relativePath, label) {
  const full = path.join(PROJECT_ROOT, relativePath);
  assert.ok(fs.existsSync(full), `${label}: expected art file to exist at ${relativePath}`);
}

test('the card pool has ~30 unique, correctly-shaped cards', () => {
  const deck = createStarterDeck();
  assert.equal(deck.length, 30);

  const ids = deck.map((c) => c.id);
  assert.equal(new Set(ids).size, 30, 'card ids should all be unique');

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

test('every card in the pool references an art file that exists on disk', () => {
  for (const card of createStarterDeck()) {
    assert.ok(card.art, `${card.name} should have an art path`);
    assertAssetExists(card.art, card.name);
    if (card.corruptedArt) assertAssetExists(card.corruptedArt, `${card.name} (corrupted)`);
  }
});

test('the 4 manifest variant art files are now standalone playable cards, not corrupted-state art', () => {
  const deck = createStarterDeck();
  const byId = Object.fromEntries(deck.map((c) => [c.id, c]));

  assert.ok(byId['blood-communion'], 'Blood Communion (card_16) should be a standalone card');
  assert.equal(byId['blood-communion'].art, 'assets/cards/card_16_blood_communion_variant.png');
  assert.ok(byId['blood-rite'], 'Blood Rite (card_17) should be a standalone card');
  assert.equal(byId['blood-rite'].art, 'assets/cards/card_17_blood_rite_variant.png');
  assert.ok(byId['titans-wake'], "Titan's Wake (card_18) should be a standalone card");
  assert.equal(byId['titans-wake'].art, 'assets/cards/card_18_titan_of_the_deep_variant.png');
  assert.ok(byId['echo-of-the-god'], 'Echo of the God (card_20) should be a standalone card');
  assert.equal(byId['echo-of-the-god'].art, 'assets/cards/card_20_last_scream_of_the_god_variant.png');

  // Their old base cards no longer point at those files as corruptedArt.
  assert.equal(byId['last-scream'].corruptedArt, null);
  assert.equal(byId['titan-of-the-deep'].corruptedArt, null);
  assert.equal(byId['rite-of-the-bleeding-altar'].corruptedArt, null);
});

test('the 4 repurposed variant cards have working, distinct mechanics', () => {
  const player = { faith: 20, maxFaith: 20, shield: 0, burn: 0, takeDamage(n) { this.faith -= n; }, heal(n) { this.faith = Math.min(this.maxFaith, this.faith + n); } };
  const enemy = { faith: 50, maxFaith: 50, shield: 0, burn: 0, takeDamage(n) { this.faith -= n; } };

  const deck = createStarterDeck();
  const byId = Object.fromEntries(deck.map((c) => [c.id, c]));

  // Blood Communion: damages the enemy and heals self.
  const startFaith = player.faith;
  byId['blood-communion'].effect({ self: player, enemy, card: byId['blood-communion'] });
  assert.ok(player.faith >= startFaith, 'Blood Communion should heal the player');

  // Blood Rite: bonus damage if the enemy is already burning.
  const cleanEnemy = { faith: 50, maxFaith: 50, burn: 0, takeDamage(n) { this.faith -= n; } };
  const burningEnemy = { faith: 50, maxFaith: 50, burn: 3, takeDamage(n) { this.faith -= n; } };
  byId['blood-rite'].effect({ enemy: cleanEnemy, card: byId['blood-rite'] });
  byId['blood-rite'].effect({ enemy: burningEnemy, card: byId['blood-rite'] });
  assert.ok(50 - burningEnemy.faith > 50 - cleanEnemy.faith, 'Blood Rite should deal bonus damage to a burning enemy');

  // Titan's Wake: damages the enemy and wears a random other hand card.
  const otherCard = { wear: 0, applyWear(n) { this.wear += n; } };
  const handDeck = { hand: [byId['titans-wake'], otherCard] };
  byId['titans-wake'].effect({ enemy, deck: handDeck, card: byId['titans-wake'] });
  assert.ok(otherCard.wear > 0, "Titan's Wake should apply wear to another hand card");

  // Echo of the God: damages the enemy and draws a card.
  let drew = 0;
  const drawDeck = { draw: (n) => { drew += n; } };
  byId['echo-of-the-god'].effect({ enemy, deck: drawDeck, card: byId['echo-of-the-god'] });
  assert.equal(drew, 1, 'Echo of the God should draw a card');
});

test('the enemy roster has 10 enemies with distinct attack patterns and existing art', () => {
  assert.equal(ENEMY_ROSTER.length, 10);

  const enemies = ENEMY_ROSTER.map((factory) => factory());
  const names = enemies.map((e) => e.name);
  assert.equal(new Set(names).size, 10, 'enemy names should all be unique');

  for (const enemy of enemies) {
    assert.ok(enemy.art, `${enemy.name} should have an art path`);
    assertAssetExists(enemy.art, enemy.name);
    assert.equal(typeof enemy.takeTurn, 'function');
  }

  const player = () => ({ faith: 100, maxFaith: 100, shield: 0, takeDamage(n) { this.faith -= n; } });

  const [
    crownedWound,
    shriekingBrood,
    hollowReliquary,
    fracturedWidow,
    beckoner,
    gildedLiar,
    sunderer,
    famine,
    verdict,
    chorusUnbound,
  ] = enemies;

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

  // Gilded Liar: shields itself before/while striking.
  const p6 = player();
  assert.equal(gildedLiar.shield, 0);
  gildedLiar.takeTurn(p6);
  assert.ok(gildedLiar.shield > 0, 'Gilded Liar should shield itself when it attacks');

  // Sunderer: strips the target's shield in addition to attacking.
  const p7 = player();
  p7.shield = 10;
  const sunder = sunderer.takeTurn(p7);
  assert.ok(p7.shield < 10, 'Sunderer should strip some of the target shield');
  assert.ok(sunder.shieldStripped > 0);

  // Famine: hits harder the lower the target's Faith already is.
  const healthy = { faith: 100, maxFaith: 100, shield: 0, takeDamage(n) { this.faith -= n; } };
  const wounded = { faith: 10, maxFaith: 100, shield: 0, takeDamage(n) { this.faith -= n; } };
  const healthyHit = famine.takeTurn(healthy).amount;
  const woundedHit = famine.takeTurn(wounded).amount;
  assert.ok(woundedHit > healthyHit, 'Famine should hit a low-Faith target harder');

  // Verdict: heals itself as well as attacking.
  const p9 = player();
  const startFaith = verdict.faith;
  verdict.takeDamage(5);
  verdict.takeTurn(p9);
  assert.ok(verdict.faith > startFaith - 5, 'Verdict should heal itself when it attacks');

  // Chorus Unbound: mills a card from the player's draw pile.
  const p10 = player();
  let milled = null;
  const millDeck = { millOne: () => (milled = { id: 'x', name: 'X' }) };
  const result = chorusUnbound.takeTurn(p10, { deck: millDeck, log: () => {} });
  assert.equal(result.milled, 'x', "Chorus Unbound should mill a card from the player's draw pile");
  assert.ok(milled);
});

test('two distinct bosses exist: the final tethered boss and a mid-run boss with a different mechanic', () => {
  const dyingGod = createDyingGod();
  assert.equal(dyingGod.name, 'The Dying God');
  assert.ok(dyingGod instanceof MemoryShardBoss);
  assert.ok(dyingGod.tethered, 'The Dying God should use the Anchor/tether reform mechanic');
  assertAssetExists(dyingGod.art, 'The Dying God');

  const acolyte = createBrokenAcolyte();
  assert.equal(acolyte.name, 'The Broken Acolyte');
  assert.ok(acolyte instanceof BrokenAcolyte);
  assert.ok(!(acolyte instanceof MemoryShardBoss), 'The Broken Acolyte should NOT use the tether/reform mechanic');
  assert.equal(acolyte.tethered, undefined, 'The Broken Acolyte has no tether state at all');
  assertAssetExists(acolyte.art, 'The Broken Acolyte');

  // Distinct mechanic: corrupts a hand/deck card and heals off existing corruption.
  const player = { faith: 100, maxFaith: 100, shield: 0, takeDamage(n) { this.faith -= n; } };
  const corruptedCard = { id: 'c1', name: 'Corrupted Card', wear: 5, corrupted: true, applyWear(n) { this.wear += n; } };
  const cleanCard = { id: 'c2', name: 'Clean Card', wear: 0, corrupted: false, applyWear(n) { this.wear += n; } };
  const deck = { allCards: () => [corruptedCard, cleanCard] };

  const startAcolyteFaith = acolyte.faith;
  acolyte.takeDamage(20);
  const result = acolyte.takeTurn(player, { deck, log: () => {} });
  assert.equal(result.type, 'ruinous-mirror');
  assert.ok(result.healed > 0, 'The Broken Acolyte should heal off the corrupted card already in the deck');
  assert.ok(acolyte.faith > startAcolyteFaith - 20, 'the heal should have offset some of the prior damage');
});

test('all 5 backgrounds (including the 2 new placeholder variants) reference art that exists on disk', () => {
  assertAssetExists(BACKGROUNDS.mapScreen, 'map screen background');
  assertAssetExists(BACKGROUNDS.nodeTransition, 'node transition background');
  assertAssetExists(BACKGROUNDS.bossArena, 'boss arena background');
  assertAssetExists(BACKGROUNDS.restSanctum, 'rest sanctum background');
  assertAssetExists(BACKGROUNDS.miniBossArena, 'mini-boss arena background');
});
