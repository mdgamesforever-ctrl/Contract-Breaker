// Grafting abilities: each `apply(card)` permanently mutates a player card
// once grafted from a defeated enemy.

export const emberSting = {
  id: 'ember-sting',
  name: 'Ember Sting',
  description: 'Permanently adds 2 raw power.',
  apply: (card) => {
    card.basePower += 2;
    if (!card.corrupted) card.power = card.basePower;
  },
};

export const hollowMending = {
  id: 'hollow-mending',
  name: 'Hollow Mending',
  description: "Wraps the card's effect to also heal 1 Faith on play.",
  apply: (card) => {
    const originalEffect = card.effect;
    card.effect = (ctx) => {
      originalEffect(ctx);
      ctx.self.heal(1);
    };
  },
};
