import test from 'node:test';
import assert from 'node:assert/strict';
import { Vessel } from '../src/game/Vessel.js';
import { Enemy } from '../src/game/Enemy.js';
import { Combat, MERCY_THRESHOLD_RATIO } from '../src/game/Combat.js';
import { MemoryShardBoss, BossCombat } from '../src/game/BossCombat.js';
import { Deck } from '../src/cards/Deck.js';
import { Card } from '../src/cards/Card.js';

function silentLog() {}

function makeStrike(id, power = 10) {
  return new Card({ id, name: id, cost: 1, power, effect: ({ enemy, card }) => enemy.takeDamage(card.power) });
}

function setupCombat({ maxFaith = 50, allowMercy = true, CombatClass = Combat, EnemyClass = Enemy, cardPower = 46 } = {}) {
  const player = new Vessel({ name: 'Player', maxFaith: 30, energyPerTurn: 10 });
  const strike = makeStrike('strike', cardPower);
  const deck = new Deck([strike, makeStrike('b'), makeStrike('c')]);
  const enemy = new EnemyClass({ name: 'Foe', maxFaith, damage: 1 });
  const combat = new CombatClass({ player, deck, enemy, log: silentLog, allowMercy });
  deck.hand = [strike];
  deck.drawPile = deck.drawPile.filter((c) => c !== strike);
  combat.startPlayerTurn();
  return { player, deck, enemy, combat, strike };
}

test('a mercy-eligible fight pauses instead of ending once Faith crosses the threshold', () => {
  const { combat, enemy } = setupCombat({ maxFaith: 50 });
  const expectedThreshold = Math.max(1, Math.round(50 * MERCY_THRESHOLD_RATIO));
  assert.equal(combat.mercyThreshold, expectedThreshold);

  combat.playCard(0); // 46 damage vs 50 Faith -> would be 4, below the ~6 threshold

  assert.equal(combat.over, false, 'the fight should pause for the mercy choice, not end');
  assert.equal(combat.pendingMercy, true);
  assert.equal(combat.result, null);
  assert.equal(enemy.faith, expectedThreshold, 'Faith should be held exactly at the threshold, not below it');
});

test('an overkill blow that would drop Faith to 0 or below still gets held at the mercy threshold', () => {
  const { combat, enemy } = setupCombat({ maxFaith: 20, cardPower: 999 });
  combat.playCard(0);
  assert.equal(combat.pendingMercy, true);
  assert.ok(enemy.faith > 0, 'the enemy should not actually reach 0 while a mercy choice is pending');
  assert.equal(enemy.faith, combat.mercyThreshold);
});

test('playCard and endPlayerTurn are both rejected while a mercy choice is pending', () => {
  const { combat } = setupCombat({ maxFaith: 50 });
  combat.playCard(0);
  assert.equal(combat.pendingMercy, true);
  assert.throws(() => combat.playCard(0), /mercy/i);
  combat.endPlayerTurn(); // should silently no-op, not throw, not advance the fight
  assert.equal(combat.over, false);
  assert.equal(combat.pendingMercy, true);
});

test('resolveMercy("mercy") spares the enemy: fight ends, no further damage, no loot', () => {
  const { combat, enemy } = setupCombat({ maxFaith: 50 });
  combat.playCard(0);
  const heldFaith = enemy.faith;

  const result = combat.resolveMercy('mercy');

  assert.equal(result, 'mercy');
  assert.equal(combat.result, 'mercy');
  assert.equal(combat.over, true);
  assert.equal(combat.pendingMercy, false);
  assert.equal(combat.mercyGranted, true);
  assert.equal(enemy.faith, heldFaith, 'the enemy should survive at exactly the held Faith');

  // No loot: graft is only legal after a true 'win'.
  const someCard = combat.deck.allCards()[0];
  assert.throws(() => combat.graft({ id: 'x', apply: () => {} }, someCard), /Can only graft/);
});

test('resolveMercy("kill") finishes off a non-boss enemy as a normal win', () => {
  const { combat, enemy } = setupCombat({ maxFaith: 50 });
  combat.playCard(0);
  const result = combat.resolveMercy('kill');

  assert.equal(result, 'win');
  assert.equal(combat.result, 'win');
  assert.equal(combat.over, true);
  assert.equal(enemy.faith, 0);
});

test('resolveMercy rejects an unknown choice and rejects being called with nothing pending', () => {
  const { combat } = setupCombat({ maxFaith: 50 });
  assert.throws(() => combat.resolveMercy('mercy'), /no mercy choice/i);

  combat.playCard(0);
  assert.throws(() => combat.resolveMercy('spare'), /unknown mercy choice/i);
});

test('a fight without allowMercy never pauses, even on a lethal blow well past where mercy would trigger', () => {
  const { combat, enemy } = setupCombat({ maxFaith: 50, allowMercy: false, cardPower: 999 });
  combat.playCard(0);

  assert.equal(combat.pendingMercy, false);
  assert.equal(combat.over, true);
  assert.equal(combat.result, 'win');
  assert.equal(enemy.faith, 0);
});

test('choosing "kill" on the tethered final boss before Anchoring still reforms it, and mercy is not asked twice', () => {
  const player = new Vessel({ name: 'Player', maxFaith: 30, energyPerTurn: 10 });
  const strike = makeStrike('strike', 46);
  const deck = new Deck([strike, makeStrike('b'), makeStrike('c')]);
  const boss = new MemoryShardBoss({ name: 'Memory Shard', maxFaith: 50, damage: 1 });
  const combat = new BossCombat({ player, deck, enemy: boss, log: silentLog, allowMercy: true });
  deck.hand = [strike];
  deck.drawPile = deck.drawPile.filter((c) => c !== strike);
  combat.startPlayerTurn();

  combat.playCard(0);
  assert.equal(combat.pendingMercy, true);

  combat.resolveMercy('kill');
  assert.equal(combat.over, false, 'the tether should hold and reform the boss rather than ending the fight');
  assert.equal(boss.tethered, true);
  assert.ok(boss.faith > 0);
  assert.equal(combat.mercyResolved, true);
  assert.equal(combat.pendingMercy, false, 'mercy should not ask again this combat, even once the boss is low again');
});

test('choosing "mercy" on the tethered final boss ends the fight immediately, tether and all', () => {
  const player = new Vessel({ name: 'Player', maxFaith: 30, energyPerTurn: 10 });
  const strike = makeStrike('strike', 46);
  const deck = new Deck([strike, makeStrike('b'), makeStrike('c')]);
  const boss = new MemoryShardBoss({ name: 'Memory Shard', maxFaith: 50, damage: 1 });
  const combat = new BossCombat({ player, deck, enemy: boss, log: silentLog, allowMercy: true });
  deck.hand = [strike];
  deck.drawPile = deck.drawPile.filter((c) => c !== strike);
  combat.startPlayerTurn();

  combat.playCard(0);
  combat.resolveMercy('mercy');

  assert.equal(combat.over, true);
  assert.equal(combat.result, 'mercy');
  assert.equal(boss.tethered, true, 'sparing it leaves the tether exactly as it was -- no forced resolution either way');
});
