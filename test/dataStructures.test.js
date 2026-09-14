import test from 'node:test';
import assert from 'node:assert/strict';
import { Card } from '../src/cards/Card.js';
import { Deck } from '../src/cards/Deck.js';
import { Vessel } from '../src/game/Vessel.js';

test('Card has id, name, cost, effect, and starts with zero wear', () => {
  let hit = 0;
  const card = new Card({
    id: 'test-card',
    name: 'Test Card',
    cost: 2,
    power: 5,
    effect: () => {
      hit += 1;
    },
  });

  assert.equal(card.id, 'test-card');
  assert.equal(card.name, 'Test Card');
  assert.equal(card.cost, 2);
  assert.equal(card.wear, 0);
  assert.equal(card.corrupted, false);

  card.play({});
  assert.equal(hit, 1);
  assert.equal(card.wear, 1);
});

test('Card constructor rejects a missing effect function', () => {
  assert.throws(() => new Card({ id: 'bad', name: 'Bad', cost: 1 }));
});

test('Deck deals cards into draw/discard/hand piles correctly', () => {
  const cards = Array.from({ length: 5 }, (_, i) =>
    new Card({ id: `c${i}`, name: `Card ${i}`, cost: 1, effect: () => {} })
  );
  const deck = new Deck(cards);

  assert.equal(deck.drawPile.length, 5);
  assert.equal(deck.hand.length, 0);
  assert.equal(deck.discardPile.length, 0);

  deck.draw(3);
  assert.equal(deck.hand.length, 3);
  assert.equal(deck.drawPile.length, 2);

  deck.discardHand();
  assert.equal(deck.hand.length, 0);
  assert.equal(deck.discardPile.length, 3);

  // Drawing past the draw pile should reshuffle discard back in.
  const drawn = deck.draw(4);
  assert.equal(drawn.length, 4);
  assert.equal(deck.hand.length, 4);
  assert.equal(deck.drawPile.length + deck.discardPile.length, 1);
});

test('Vessel uses Faith instead of HP, clamped to [0, maxFaith]', () => {
  const vessel = new Vessel({ name: 'Player', maxFaith: 20 });
  assert.equal(vessel.faith, 20);
  assert.equal(vessel.isDefeated(), false);

  vessel.takeDamage(6);
  assert.equal(vessel.faith, 14);

  vessel.heal(100);
  assert.equal(vessel.faith, 20, 'heal should not exceed maxFaith');

  vessel.takeDamage(999);
  assert.equal(vessel.faith, 0, 'damage should not go below 0');
  assert.equal(vessel.isDefeated(), true);
});
