import { Combat } from './Combat.js';
import { Enemy } from './Enemy.js';

// A memory-shard boss stays tethered to the dying god: raw damage alone
// can't finish it. The first time its Faith would hit zero it reforms at a
// fraction of its max Faith instead -- the player must Anchor (sacrifice a
// card) at some point in the fight to sever the tether, then finish it off.
export class MemoryShardBoss extends Enemy {
  constructor(opts) {
    super(opts);
    this.tethered = true;
  }
}

export class BossCombat extends Combat {
  constructor(opts) {
    super(opts);
    this.anchorUsed = false;
  }

  anchor(sacrificeIndex, targetCard) {
    const result = super.anchor(sacrificeIndex, targetCard);
    this.anchorUsed = true;
    this._checkWinLoss();
    return result;
  }

  _checkWinLoss() {
    if (this.over) return;

    if (this.player.isDefeated()) {
      this.over = true;
      this.result = 'loss';
      this.log(`${this.player.name}'s Faith is broken. Defeat.`);
      return;
    }

    if (this.enemy.isDefeated()) {
      if (this.enemy.tethered && !this.anchorUsed) {
        const reformed = Math.max(1, Math.round(this.enemy.maxFaith * 0.25));
        this.enemy.faith = reformed;
        this.log(
          `${this.enemy.name}'s tether to the world holds -- it reforms with ${reformed} Faith. ` +
            'Anchor a memory to sever the tether!'
        );
        return;
      }
      this.enemy.tethered = false;
      this.over = true;
      this.result = 'win';
      this.log(`${this.enemy.name}'s tether is severed. The memory shard shatters!`);
    }
  }
}
