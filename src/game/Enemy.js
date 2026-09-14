import { Vessel } from './Vessel.js';

// An opposing Vessel with a simple fixed attack and a set of abilities that
// can be grafted onto the player's cards once it is defeated. `context`
// (deck, log, etc.) is optional and only used by enemies with more elaborate
// attack patterns -- see src/game/enemies.js.
export class Enemy extends Vessel {
  constructor({ name, maxFaith, damage = 5, abilities = [], art = null }) {
    super({ name, maxFaith, energyPerTurn: 0 });
    this.damage = damage;
    this.abilities = abilities;
    this.art = art;
  }

  takeTurn(target, context = {}) {
    target.takeDamage(this.damage);
    return { type: 'attack', amount: this.damage };
  }
}
