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
  constructor({
    id,
    name,
    cost,
    power = 0,
    type = 'attack',
    effect,
    art = null,
    corruptedArt = null,
    decayWhenUnplayed = false,
  }) {
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
    this.art = art;
    this.corruptedArt = corruptedArt;

    this.wear = 0;
    this.corrupted = false;
    this.drawback = null;
    this.graftedAbilities = [];

    // "Severed Vow"-style cards get cheaper each turn they sit unplayed.
    this.decayWhenUnplayed = decayWhenUnplayed;
    this.unplayedTurns = 0;
  }

  get currentArt() {
    return this.corrupted && this.corruptedArt ? this.corruptedArt : this.art;
  }

  // Advances wear by `amount`, triggering corruption once the threshold is
  // crossed. Split out from play() so effects that force extra wear (e.g. a
  // self-corrupting card, or an enemy that accelerates decay) can reuse it.
  applyWear(amount = 1) {
    this.wear += amount;
    if (!this.corrupted && this.wear > WEAR_THRESHOLD) {
      this.corrupt();
    }
  }

  // Plays the card against the given context, then advances wear and
  // triggers corruption if the wear threshold has been crossed.
  play(ctx) {
    this.effect({ ...ctx, card: this });
    if (this.drawback && typeof this.drawback.apply === 'function') {
      this.drawback.apply({ ...ctx, card: this });
    }
    this.unplayedTurns = 0;
    if (this.decayWhenUnplayed) this.cost = this.baseCost;
    this.applyWear(1);
  }

  // Called once per player turn for a card that sat in hand unplayed. Only
  // has an effect when `decayWhenUnplayed` is set (e.g. "Severed Vow").
  onTurnPassedUnplayed() {
    if (!this.decayWhenUnplayed) return;
    this.unplayedTurns += 1;
    this.cost = Math.max(0, this.baseCost - this.unplayedTurns);
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
    this.unplayedTurns = 0;
  }

  // Permanently attaches a defeated enemy's ability to this card.
  graft(ability) {
    this.graftedAbilities.push(ability);
    ability.apply(this);
  }
}
