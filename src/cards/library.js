import { Card } from './Card.js';

// Factory functions so every caller (demo, tests) gets a fresh Card instance
// with its own independent wear/corruption state.

export function createStrike({ power = 6 } = {}) {
  return new Card({
    id: 'strike',
    name: 'Strike',
    cost: 1,
    power,
    type: 'attack',
    effect: ({ enemy, card }) => enemy.takeDamage(card.power),
  });
}

export function createGuard({ power = 5 } = {}) {
  return new Card({
    id: 'guard',
    name: 'Guard',
    cost: 1,
    power,
    type: 'skill',
    effect: ({ self, card }) => self.heal(Math.round(card.power / 2)),
  });
}

export function createRecollection({ power = 8 } = {}) {
  return new Card({
    id: 'recollection',
    name: 'Recollection',
    cost: 2,
    power,
    type: 'attack',
    effect: ({ enemy, card }) => enemy.takeDamage(card.power),
  });
}

export function createStandardDeck() {
  return [
    createStrike(),
    createStrike(),
    createStrike(),
    createGuard(),
    createGuard(),
    createRecollection(),
  ];
}
