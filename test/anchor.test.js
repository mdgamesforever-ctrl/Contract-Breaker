import test from 'node:test';
import assert from 'node:assert/strict';
import { Card, WEAR_THRESHOLD } from '../src/cards/Card.js';
import { Deck } from '../src/cards/Deck.js';
import { Vessel } from '../src/game/Vessel.js';
import { Enemy } from '../src/game/Enemy.js';
import { Combat } from '../src/game/Combat.js';

function silentLog() {}

function makeCard(id, power = 10) {
  return new Card({ id, name: id, cost: 1, power, effect: () => {} });
}

test('anchoring sacrifices one card to reset another card\'s wear to zero', () => {
  const player = new Vessel({ name: 'Player', maxFaith: 30 });
  const worn = makeCard('worn');
  const sacrifice = makeCard('sacrifice');
  for (let i = 0; i <= WEAR_THRESHOLD; i++) worn.play({}); // corrupt it
  assert.equal(worn.corrupted, true);

  const deck = new Deck([worn, sacrifice]);
  deck.hand = [worn, sacrifice];
  deck.drawPile = [];
  const enemy = new Enemy({ name: 'Foe', maxFaith: 50 });
  const combat = new Combat({ player, deck, enemy, log: silentLog });

  combat.anchor(1, worn); // sacrifice index 1 ("sacrifice") to reset "worn"

  assert.equal(worn.wear, 0);
  assert.equal(worn.corrupted, false);
  assert.equal(worn.drawback, null);
  assert.equal(worn.power, worn.basePower);

  // The sacrificed card is permanently exiled, not returned to hand/discard.
  assert.equal(deck.hand.length, 1);
  assert.equal(deck.hand[0], worn);
  assert.equal(deck.exile.length, 1);
  assert.equal(deck.exile[0], sacrifice);
  assert.equal(deck.discardPile.includes(sacrifice), false);
});

test('anchor throws when there is no card at the sacrifice index', () => {
  const player = new Vessel({ name: 'Player', maxFaith: 30 });
  const deck = new Deck([makeCard('a')]);
  deck.hand = [];
  const enemy = new Enemy({ name: 'Foe', maxFaith: 50 });
  const combat = new Combat({ player, deck, enemy, log: silentLog });

  assert.throws(() => combat.anchor(0, makeCard('x')), /No card at hand index/);
});
