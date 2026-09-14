// A combatant whose life resource is Faith rather than HP.
export class Vessel {
  constructor({ name, maxFaith, energyPerTurn = 3 }) {
    this.name = name;
    this.maxFaith = maxFaith;
    this.faith = maxFaith;
    this.energyPerTurn = energyPerTurn;
    this.energy = 0;
  }

  takeDamage(amount) {
    this.faith = Math.max(0, this.faith - amount);
  }

  heal(amount) {
    this.faith = Math.min(this.maxFaith, this.faith + amount);
  }

  isDefeated() {
    return this.faith <= 0;
  }

  startTurnEnergy() {
    this.energy = this.energyPerTurn;
  }
}
