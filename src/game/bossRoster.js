import { MemoryShardBoss } from './BossCombat.js';
import { emberSting, hollowMending } from './abilities.js';

export function createDyingGod(overrides = {}) {
  return new MemoryShardBoss({
    name: 'The Dying God',
    maxFaith: 55,
    damage: 6,
    abilities: [emberSting, hollowMending],
    art: 'assets/boss/boss_01_the_dying_god.png',
    ...overrides,
  });
}
