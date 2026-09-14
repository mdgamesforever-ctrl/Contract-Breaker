// Wear threshold at which a card corrupts (strictly greater than this many plays).
export const WEAR_THRESHOLD = 3;

// Drawback pool rolled from when a card corrupts. Each drawback either
// applies a side effect when the card is played, or adjusts its cost.
export const DRAWBACK_POOL = [
  {
    id: 'backlash',
    name: 'Backlash',
    description: 'Deals 1 damage to your own Faith whenever played.',
    apply: ({ self }) => self.takeDamage(1),
  },
  {
    id: 'heavy',
    name: 'Heavy',
    description: 'Costs 1 additional energy.',
    costDelta: 1,
  },
  {
    id: 'unstable',
    name: 'Unstable',
    description: 'Mills a card from the draw pile whenever played.',
    apply: ({ deck }) => deck && deck.millOne(),
  },
];

let nextInstanceId = 1;

export class Card {
  constructor({ id, name, cost, power = 0, type = 'attack', effect }) {
    if (typeof effect !== 'function') {
      throw new Error(`Card "${id}" requires an effect function`);
    }
    this.id = id;
    this.instanceId = nextInstanceId++;
    this.name = name;
    this.type = type;
    this.baseCost = cost;
    this.cost = cost;
    this.basePower = power;
    this.power = power;
    this.effect = effect;

    this.wear = 0;
    this.corrupted = false;
    this.drawback = null;
    this.graftedAbilities = [];
  }

  // Plays the card against the given context, then advances wear and
  // triggers corruption if the wear threshold has been crossed.
  play(ctx) {
    this.effect({ ...ctx, card: this });
    if (this.drawback && typeof this.drawback.apply === 'function') {
      this.drawback.apply({ ...ctx, card: this });
    }
    this.wear += 1;
    if (!this.corrupted && this.wear > WEAR_THRESHOLD) {
      this.corrupt();
    }
  }

  // Corrupts the card: raw power increases, but a random drawback is
  // attached. `rng` is injectable for deterministic tests.
  corrupt(rng = Math.random) {
    if (this.corrupted) return;
    this.corrupted = true;
    this.power = Math.round(this.basePower * 1.5);
    const drawback = DRAWBACK_POOL[Math.floor(rng() * DRAWBACK_POOL.length)];
    this.drawback = drawback;
    this.cost = this.baseCost + (drawback.costDelta || 0);
  }

  // Resets wear (and any corruption gained from it) back to a pristine state.
  resetWear() {
    this.wear = 0;
    this.corrupted = false;
    this.drawback = null;
    this.power = this.basePower;
    this.cost = this.baseCost;
  }

  // Permanently attaches a defeated enemy's ability to this card.
  graft(ability) {
    this.graftedAbilities.push(ability);
    ability.apply(this);
  }
}
