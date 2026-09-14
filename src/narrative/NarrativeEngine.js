import { shuffle } from '../utils/shuffle.js';

// Reveals a pool of story fragments ("memory shards") in randomized order as
// the player passes through nodes, tracks which have been seen via a flag
// set, and fires a one-time "recontextualization" event once enough shards
// have been collected. `rng` and `log` are injectable for deterministic
// tests.
export class NarrativeEngine {
  constructor({ shards, threshold = 3, rng = Math.random, log = () => {} }) {
    if (threshold < 1) throw new Error('threshold must be at least 1');
    this.threshold = threshold;
    this.log = log;
    this.pool = shuffle(shards, rng);
    this.revealed = [];
    this.seen = new Set();
    this.recontextualized = false;
    this.twist = null;
  }

  get remaining() {
    return this.pool.length;
  }

  hasSeen(shardId) {
    return this.seen.has(shardId);
  }

  // Reveals the next shard from the randomized pool, or null once exhausted.
  revealNext() {
    if (this.pool.length === 0) return null;
    const shard = this.pool.shift();
    this.revealed.push(shard);
    this.seen.add(shard.id);
    this.log(`[Memory Shard] ${shard.text}`);
    this._maybeRecontextualize();
    return shard;
  }

  _maybeRecontextualize() {
    if (this.recontextualized || this.revealed.length < this.threshold) return null;
    this.recontextualized = true;
    const affected = [...new Set(this.revealed.map((s) => s.about).filter(Boolean))];
    this.twist = {
      type: 'recontextualization',
      affected,
      message: affected.length
        ? `Recontextualization: everything you thought you knew about ${affected.join(', ')} was a lie.`
        : 'Recontextualization: everything you thought you knew was a lie.',
    };
    this.log(`*** ${this.twist.message} ***`);
    return this.twist;
  }
}
