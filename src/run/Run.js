import { NODE_TYPES } from './RunMap.js';
import { BACKGROUNDS } from './backgrounds.js';

// Drives sequential progression through a RunMap: pick a reachable node,
// resolve it (fight/rest), and move on -- ending in victory at the boss
// node or defeat if the player's Faith ever breaks. Console-output only;
// `log` is injectable for tests.
export class Run {
  constructor({ map, player, log = () => {} }) {
    this.map = map;
    this.player = player;
    this.log = log;
    this.currentNode = null;
    this.visited = [];
    this.over = false;
    this.result = null; // 'victory' | 'defeat'
    this.log(`[Background: ${BACKGROUNDS.mapScreen}] The Shard Network unfolds.`);
  }

  // Nodes reachable right now: floor 0 if the run hasn't started, otherwise
  // whatever the current node connects to.
  availableNodes() {
    if (this.over) return [];
    if (!this.currentNode) return this.map.startingNodes;
    return this.currentNode.connections.map((id) => this.map.getNode(id));
  }

  enterNode(nodeId) {
    if (this.over) throw new Error('The run has already ended');
    const node = this.availableNodes().find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} is not reachable from here`);
    this.currentNode = node;
    this.visited.push(node.id);
    const background = Run.backgroundForNode(node);
    this.log(`[Background: ${background}]`);
    this.log(`-- Entering ${node.type} node ${node.id} (floor ${node.floor}) --`);
    return node;
  }

  // Marks the current node resolved. `victory: false` ends the run in
  // defeat (a lost fight); reaching the boss node in victory ends the run.
  completeCurrentNode({ victory = true } = {}) {
    if (!this.currentNode) throw new Error('No active node to complete');
    if (this.over) return;

    if (!victory) {
      this.over = true;
      this.result = 'defeat';
      this.log(`Run ends in defeat at ${this.currentNode.id}`);
      return;
    }

    if (this.currentNode.type === NODE_TYPES.BOSS) {
      this.over = true;
      this.result = 'victory';
      this.log('The final memory shard shatters. The run is complete.');
    }
  }

  // Background art for a given node, by node type/kind.
  static backgroundForNode(node) {
    switch (node.type) {
      case NODE_TYPES.BOSS:
        return BACKGROUNDS.bossArena;
      case NODE_TYPES.MINIBOSS:
        return BACKGROUNDS.miniBossArena;
      case NODE_TYPES.REST:
        return BACKGROUNDS.restSanctum;
      default:
        return BACKGROUNDS.nodeTransition;
    }
  }

  // Convenience for resolving a rest node: heals the player and completes it.
  restAtCurrentNode(amount) {
    if (!this.currentNode || this.currentNode.type !== NODE_TYPES.REST) {
      throw new Error('Not currently at a rest node');
    }
    const healAmount = amount ?? Math.round(this.player.maxFaith * 0.3);
    this.player.heal(healAmount);
    this.log(
      `${this.player.name} rests, recovering ${healAmount} Faith ` +
        `(now ${this.player.faith}/${this.player.maxFaith})`
    );
    this.completeCurrentNode({ victory: true });
  }
}
