import { Vessel } from './Vessel.js';

// An opposing Vessel with a simple fixed attack and a set of abilities that
// can be grafted onto the player's cards once it is defeated.
export class Enemy extends Vessel {
  constructor({ name, maxFaith, damage = 5, abilities = [] }) {
    super({ name, maxFaith, energyPerTurn: 0 });
    this.damage = damage;
    this.abilities = abilities;
  }

  takeTurn(target) {
    target.takeDamage(this.damage);
    return { type: 'attack', amount: this.damage };
  }
}
