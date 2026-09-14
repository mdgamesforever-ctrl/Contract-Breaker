import test from 'node:test';
import assert from 'node:assert/strict';
import { createShardPool } from '../src/narrative/shards.js';
import { NarrativeEngine } from '../src/narrative/NarrativeEngine.js';

test('the shard pool has 15-20 unique fragments with real text and an "about" tag', () => {
  const shards = createShardPool();
  assert.ok(shards.length >= 15 && shards.length <= 20, `expected 15-20 shards, got ${shards.length}`);

  const ids = shards.map((s) => s.id);
  assert.equal(new Set(ids).size, shards.length, 'shard ids should all be unique');

  for (const shard of shards) {
    assert.equal(typeof shard.text, 'string');
    assert.ok(shard.text.length > 10, `${shard.id} should have real flavor text`);
    assert.equal(typeof shard.about, 'string');
    assert.ok(shard.about.length > 0);
  }
});

test('the shard pool spans multiple story threads ("about" tags), not just one', () => {
  const shards = createShardPool();
  const threads = new Set(shards.map((s) => s.about));
  assert.ok(threads.size >= 4, `expected at least 4 distinct story threads, got ${threads.size}: ${[...threads]}`);
  // The mid-run boss, the final boss, and the mercy choice should all have
  // their own thread -- these are the three story beats this expansion
  // specifically had to cover.
  assert.ok(threads.has('broken-acolyte'));
  assert.ok(threads.has('boss'));
  assert.ok(threads.has('mercy'));
});

test('a full run only ever reveals a handful of shards, but the pool has enough variety for many runs to differ', () => {
  const poolA = createShardPool();
  const poolB = createShardPool();

  // Two separately-seeded engines revealing 6 shards each (a run visits at
  // most ~6 nodes) should usually not reveal the identical 6 shards in the
  // identical order -- the pool has to actually be bigger than one run.
  const engineA = new NarrativeEngine({ shards: poolA, rng: () => 0.123, threshold: 3 });
  const engineB = new NarrativeEngine({ shards: poolB, rng: () => 0.789, threshold: 3 });

  const revealedA = [];
  const revealedB = [];
  for (let i = 0; i < 6; i++) {
    revealedA.push(engineA.revealNext().id);
    revealedB.push(engineB.revealNext().id);
  }

  assert.notDeepEqual(revealedA, revealedB);
});

test('recontextualization still fires against the real shard pool once the threshold is reached', () => {
  const engine = new NarrativeEngine({ shards: createShardPool(), rng: () => 0.42, threshold: 3, log: () => {} });
  engine.revealNext();
  engine.revealNext();
  assert.equal(engine.recontextualized, false);
  engine.revealNext();
  assert.equal(engine.recontextualized, true);
  assert.ok(engine.twist.message.length > 0);
});
