// A combatant whose life resource is Faith rather than HP.
export class Vessel {
  constructor({ name, maxFaith, energyPerTurn = 3 }) {
    this.name = name;
    this.maxFaith = maxFaith;
    this.faith = maxFaith;
    this.energyPerTurn = energyPerTurn;
    this.energy = 0;
    this.shield = 0;
    this.burn = 0;
  }

  // Shield absorbs incoming damage before Faith is touched.
  takeDamage(amount) {
    const absorbed = Math.min(this.shield, amount);
    this.shield -= absorbed;
    const remaining = amount - absorbed;
    this.faith = Math.max(0, this.faith - remaining);
    return remaining;
  }

  heal(amount) {
    this.faith = Math.min(this.maxFaith, this.faith + amount);
  }

  addShield(amount) {
    this.shield += amount;
  }

  applyBurn(amount) {
    this.burn += amount;
  }

  // Resolves any pending burn as a single damage instance, then clears it.
  tickBurn(log = () => {}) {
    if (this.burn <= 0) return 0;
    const amount = this.burn;
    this.burn = 0;
    this.takeDamage(amount);
    log(`${this.name} burns for ${amount} -> Faith: ${this.faith}/${this.maxFaith}`);
    return amount;
  }

  isDefeated() {
    return this.faith <= 0;
  }

  startTurnEnergy() {
    this.energy = this.energyPerTurn;
  }
}
