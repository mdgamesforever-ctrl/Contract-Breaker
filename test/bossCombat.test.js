import test from 'node:test';
import assert from 'node:assert/strict';
import { Vessel } from '../src/game/Vessel.js';
import { MemoryShardBoss, BossCombat } from '../src/game/BossCombat.js';
import { Deck } from '../src/cards/Deck.js';
import { Card } from '../src/cards/Card.js';

function silentLog() {}

function makeStrike(id, power = 10) {
  return new Card({ id, name: id, cost: 1, power, effect: ({ enemy, card }) => enemy.takeDamage(card.power) });
}

test('a memory-shard boss reforms instead of dying until the tether is Anchored away', () => {
  const player = new Vessel({ name: 'Player', maxFaith: 30, energyPerTurn: 5 });
  const deck = new Deck([makeStrike('a'), makeStrike('b'), makeStrike('c')]);
  const boss = new MemoryShardBoss({ name: 'Memory Shard', maxFaith: 20, damage: 1 });
  const combat = new BossCombat({ player, deck, enemy: boss, log: silentLog });

  deck.hand = deck.drawPile.splice(0, 3);
  combat.startPlayerTurn();

  // Bring the boss to lethal damage without ever anchoring.
  combat.playCard(0); // -10 -> 10 remaining
  combat.playCard(0); // -10 -> would be 0, but the tether holds

  assert.equal(combat.over, false, 'the boss should reform instead of the fight ending');
  assert.equal(boss.tethered, true);
  assert.ok(boss.faith > 0, 'boss reforms with nonzero Faith');
  assert.equal(boss.faith, Math.round(20 * 0.25));

  // Anchoring severs the tether (sacrifice the remaining hand card).
  const targetCard = deck.findById('a');
  combat.anchor(0, targetCard);
  assert.equal(combat.anchorUsed, true);
  assert.equal(combat.over, false, 'anchoring alone does not finish a boss still above 0 Faith');

  // Finish it off now that the tether is broken.
  boss.takeDamage(boss.faith);
  combat._checkWinLoss();

  assert.equal(combat.over, true);
  assert.equal(combat.result, 'win');
  assert.equal(boss.tethered, false);
});

test('the player can still lose a boss fight normally', () => {
  const player = new Vessel({ name: 'Player', maxFaith: 5, energyPerTurn: 3 });
  const deck = new Deck([makeStrike('a', 1)]);
  const boss = new MemoryShardBoss({ name: 'Memory Shard', maxFaith: 100, damage: 99 });
  const combat = new BossCombat({ player, deck, enemy: boss, log: silentLog });

  combat.startPlayerTurn();
  combat.playCard(0);
  combat.endPlayerTurn();

  assert.equal(combat.over, true);
  assert.equal(combat.result, 'loss');
});
