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

// ---- Abilities offered by the 5 expansion enemies (src/game/enemies.js) ----

export const gildedWard = {
  id: 'gilded-ward',
  name: 'Gilded Ward',
  description: "Permanently increases the card's raw power by 20%.",
  apply: (card) => {
    card.basePower = Math.round(card.basePower * 1.2);
    if (!card.corrupted) card.power = card.basePower;
  },
};

export const sunderersEdge = {
  id: 'sunderers-edge',
  name: "Sunderer's Edge",
  description: "Wraps the card's effect to also strip 3 shield from the enemy.",
  apply: (card) => {
    const originalEffect = card.effect;
    card.effect = (ctx) => {
      originalEffect(ctx);
      if (ctx.enemy) ctx.enemy.shield = Math.max(0, ctx.enemy.shield - 3);
    };
  },
};

export const famishedGrasp = {
  id: 'famished-grasp',
  name: 'Famished Grasp',
  description: "Wraps the card's effect to also deal 1 bonus damage per corrupted card in your deck.",
  apply: (card) => {
    const originalEffect = card.effect;
    card.effect = (ctx) => {
      originalEffect(ctx);
      const corruptedCount = ctx.deck ? ctx.deck.allCards().filter((c) => c.corrupted).length : 0;
      if (corruptedCount > 0 && ctx.enemy) ctx.enemy.takeDamage(corruptedCount);
    };
  },
};

export const verdictsMercy = {
  id: 'verdicts-mercy',
  name: "Verdict's Mercy",
  description: "Wraps the card's effect to also heal 3 Faith when played below half Faith.",
  apply: (card) => {
    const originalEffect = card.effect;
    card.effect = (ctx) => {
      originalEffect(ctx);
      if (ctx.self && ctx.self.faith <= ctx.self.maxFaith * 0.5) ctx.self.heal(3);
    };
  },
};

export const unravelersMark = {
  id: 'unravelers-mark',
  name: "Unraveler's Mark",
  description: 'Permanently adds 1 raw power and reduces cost by 1 (minimum 0).',
  apply: (card) => {
    card.basePower += 1;
    card.baseCost = Math.max(0, card.baseCost - 1);
    if (!card.corrupted) {
      card.power = card.basePower;
      card.cost = card.baseCost;
    }
  },
};
