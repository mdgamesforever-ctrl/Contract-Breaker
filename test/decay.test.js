import test from 'node:test';
import assert from 'node:assert/strict';
import { Card, WEAR_THRESHOLD, DRAWBACK_POOL } from '../src/cards/Card.js';

function makeCard(power = 10) {
  return new Card({
    id: 'wear-card',
    name: 'Wear Card',
    cost: 1,
    power,
    effect: () => {},
  });
}

test('wear counter increases each time a card is played', () => {
  const card = makeCard();
  card.play({});
  card.play({});
  assert.equal(card.wear, 2);
  assert.equal(card.corrupted, false);
});

test('crossing the wear threshold corrupts the card: higher power, a drawback', () => {
  const card = makeCard(10);
  for (let i = 0; i < WEAR_THRESHOLD; i++) {
    card.play({});
  }
  assert.equal(card.corrupted, false, 'should not corrupt before crossing the threshold');

  card.play({});
  assert.equal(card.wear, WEAR_THRESHOLD + 1);
  assert.equal(card.corrupted, true);
  assert.ok(card.power > card.basePower, 'corrupted card should have higher raw power');
  assert.ok(DRAWBACK_POOL.includes(card.drawback), 'corrupted card should carry a drawback from the pool');
});

test('corruption is deterministic with an injected rng and only applies once', () => {
  const card = makeCard(10);
  card.wear = WEAR_THRESHOLD;
  card.corrupt(() => 0); // forces DRAWBACK_POOL[0]
  assert.equal(card.drawback, DRAWBACK_POOL[0]);
  assert.equal(card.power, Math.round(10 * 1.5));

  const before = { ...card };
  card.corrupt(() => 0.999); // no-op: already corrupted
  assert.equal(card.drawback, before.drawback, 'corrupting twice should not reroll the drawback');
});

test('the "Backlash" drawback damages the player when the corrupted card is played', () => {
  const card = makeCard(10);
  card.wear = WEAR_THRESHOLD;
  card.corrupt(() => 0); // Backlash is index 0
  assert.equal(card.drawback.id, 'backlash');

  const self = { takeDamage(n) { this.damageTaken = (this.damageTaken || 0) + n; } };
  card.play({ self });
  assert.equal(self.damageTaken, 1);
});

test('the "Heavy" drawback raises the card\'s cost', () => {
  const card = makeCard(10);
  card.wear = WEAR_THRESHOLD;
  card.corrupt(() => 0.5); // floor(0.5 * 3) === 1 -> Heavy
  assert.equal(card.drawback.id, 'heavy');
  assert.equal(card.cost, card.baseCost + 1);
});
