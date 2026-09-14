// Grafting abilities offered by the five starter enemies. Same shape as
// src/game/abilities.js: apply(card) permanently mutates a player card.

export const woundThatFesters = {
  id: 'wound-that-festers',
  name: 'Wound That Festers',
  description: 'Permanently adds 2 raw power.',
  apply: (card) => {
    card.basePower += 2;
    if (!card.corrupted) card.power = card.basePower;
  },
};

export const broodcall = {
  id: 'broodcall',
  name: 'Broodcall',
  description: 'Permanently reduces the cost by 1 (minimum 0).',
  apply: (card) => {
    card.baseCost = Math.max(0, card.baseCost - 1);
    if (!card.corrupted) card.cost = card.baseCost;
  },
};

export const reliquaryBinding = {
  id: 'reliquary-binding',
  name: 'Reliquary Binding',
  description: "Wraps the card's effect to also apply a small shield.",
  apply: (card) => {
    const originalEffect = card.effect;
    card.effect = (ctx) => {
      originalEffect(ctx);
      ctx.self.addShield(3);
    };
  },
};

export const widowsThread = {
  id: 'widows-thread',
  name: "Widow's Thread",
  description: "Wraps the card's effect to also apply a small burn.",
  apply: (card) => {
    const originalEffect = card.effect;
    card.effect = (ctx) => {
      originalEffect(ctx);
      ctx.enemy.applyBurn(2);
    };
  },
};

export const beckoningChorus = {
  id: 'beckoning-chorus',
  name: 'Beckoning Chorus',
  description: "Wraps the card's effect to also draw a card.",
  apply: (card) => {
    const originalEffect = card.effect;
    card.effect = (ctx) => {
      originalEffect(ctx);
      if (ctx.deck) ctx.deck.draw(1);
    };
  },
};
