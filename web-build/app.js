'use strict';
/* Contract Breaker -- browser front-end.
 * Wires the existing engine (loaded globally via engine.bundle.js) to the
 * DOM. No game logic lives here beyond small UI-only helpers (card blurbs,
 * enemy intent strings, node layout math). */

// ---------------------------------------------------------------------
// UI-only flavor text (does not affect gameplay -- the engine doesn't
// store a description string on Card, so this is purely for display).
// ---------------------------------------------------------------------
const CARD_BLURBS = {
  'severed-vow': 'Deals damage. Costs 1 less each turn it goes unplayed.',
  'reckoning-scale': 'Choose one: deal damage, or heal.',
  'last-scream': 'A massive hit -- but it costs you Faith to unleash.',
  'hidden-blade': 'Bonus damage if this is the first card played this turn.',
  'tide-that-remembers': 'A wave of remembered damage.',
  'oathkeepers-last-stand': "Hits harder the lower your Faith runs.",
  'wrath-of-the-storm-king': 'Strikes twice in one blow.',
  'long-vigil': 'Raises a shield that absorbs the next damage taken.',
  'mirror-of-what-was': 'Deals damage, then echoes the last card you played.',
  'weeping-crown': 'Burns the enemy; stronger the more of your cards are corrupted.',
  'soul-ascending': 'Sacrifice a card from your hand to fully restore your Faith.',
  'field-of-the-fallen': 'Damage scales with how many cards are in your discard pile.',
  'banner-of-the-broken-oath': 'Your next card played this turn costs nothing.',
  'titan-of-the-deep': 'A devastating blow -- but it corrupts this card at once.',
  'rite-of-the-bleeding-altar': 'Drains your own Faith to deal heavy damage.',
  'vacant-throne': 'Draw a card, scrying what comes next.',
  'blood-communion': 'Deals damage and heals a little Faith in return.',
  'blood-rite': 'Deals bonus damage if the enemy is already burning.',
  'titans-wake': 'A heavy blow that also wears down another card in hand.',
  'echo-of-the-god': 'A cheap strike that also draws a card.',
  'whispering-ash': 'Draws two cards.',
  'gravebound-oath': 'Deals double damage to a badly wounded enemy.',
  'ashen-ward': 'Raises a large shield.',
  'pact-of-embers': 'Applies a burn to the enemy.',
  'unbroken-choir': 'Restores a flat amount of Faith.',
  'faithbreakers-gambit': 'Free to play, but costs you Faith when cast.',
  'cinder-wake': 'Deals more damage for every card you have sacrificed.',
  'hollow-chant': 'Cleanses some wear from a decaying card.',
  'bound-in-silence': 'A reckless strike that wears itself down twice as fast.',
  'last-ember': 'Deals damage and heals Faith equal to your discard pile.',
};

function cardBlurb(card) {
  return CARD_BLURBS[card.id] || card.type;
}

// Hard character cap for the hand-card effect text, truncated on a word
// boundary with an ellipsis. The card panel is small and short in
// landscape, so this guarantees the text always fits its fixed-height box
// (see .hand-card-effect in index.html) instead of depending on
// -webkit-line-clamp alone, which has proven unreliable across WebView
// versions (it let text overflow and get hard-clipped mid-word).
const HAND_CARD_BLURB_MAX = 44;

function truncateForCard(text, max = HAND_CARD_BLURB_MAX) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return base.replace(/[.,;:]$/, '') + '…';
}

function enemyIntent(enemy) {
  switch (enemy.constructor.name) {
    case 'CrownedWound':
      return enemy.coiling
        ? `Winding up a heavy blow (~${enemy.strikeDamage})!`
        : `Coiling -- a lesser strike incoming (~${enemy.coilDamage})`;
    case 'ShriekingBrood':
      return `The brood swarms for ~${enemy.damage} (and growing)`;
    case 'HollowReliquary':
      return `Punishes decay -- deals more per corrupted card you hold`;
    case 'FracturedWidow':
      return `Will fray a card's wear and strike for ~${enemy.damage}`;
    case 'Beckoner':
      return `A flurry of ${enemy.minHits}-${enemy.maxHits} quick strikes`;
    case 'MemoryShardBoss':
      return enemy.tethered
        ? `Tethered -- reforms unless the tether is Anchored away`
        : `Tether severed -- it can finally be broken`;
    case 'GildedLiar':
      return `Shields itself, then strikes for ~${enemy.damage}`;
    case 'Sunderer':
      return `Strips your shield, then strikes for ~${enemy.damage}`;
    case 'Famine':
      return `Hits harder the lower your Faith runs`;
    case 'Verdict':
      return `Strikes for ~${enemy.damage} and mends itself`;
    case 'ChorusUnbound':
      return `Strikes and unravels a card from your draw pile`;
    case 'BrokenAcolyte':
      return `Corrupts a memory and heals off your decay`;
    default:
      return `Strikes for ~${enemy.damage}`;
  }
}

const NODE_ICON = { fight: '⚔️', rest: '🕯️', boss: '👑', miniboss: '💀' };

// ---------------------------------------------------------------------
// Global state
// ---------------------------------------------------------------------
const G = {
  player: null,
  deck: null,
  map: null,
  run: null,
  narrative: null,
  combat: null,
  lastShardText: null,
  lastTwistText: null,
  currentScreen: null,
};

const screenEl = document.getElementById('screen');
const modalOverlay = document.getElementById('modal-overlay');
const modalEl = document.getElementById('modal');

function closeModal() {
  modalOverlay.classList.add('hidden');
  modalEl.innerHTML = '';
}

function openModal(html) {
  modalEl.innerHTML = html;
  modalOverlay.classList.remove('hidden');
}
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// ---------------------------------------------------------------------
// Audio: lazily unlocked on the first tap/click anywhere (browsers block
// audio before a user gesture), mute toggle available on every screen.
// ---------------------------------------------------------------------
const audioToggleBtn = document.getElementById('audio-toggle');

const hasAudioManager = typeof AudioManager !== 'undefined';

function updateAudioToggleLabel() {
  const muted = hasAudioManager && AudioManager.isMuted();
  audioToggleBtn.textContent = muted ? '🔇' : '🔊';
}

if (hasAudioManager) {
  document.addEventListener(
    'pointerdown',
    () => {
      AudioManager.init();
      if (G.currentScreen) AudioManager.playMusic(G.currentScreen);
    },
    { once: true }
  );
  audioToggleBtn.addEventListener('click', () => {
    AudioManager.toggleMuted();
    updateAudioToggleLabel();
  });
  updateAudioToggleLabel();
} else {
  audioToggleBtn.style.display = 'none';
}

function playScreenMusic(name) {
  G.currentScreen = name;
  if (hasAudioManager) AudioManager.playMusic(name);
}

function playSfx(name) {
  if (hasAudioManager) AudioManager.sfx(name);
}

// Appends a floating "+N"/"-N" number inside `containerId` (which must be
// position:relative) that animates upward and fades, then removes itself.
function showFloatingNumber(containerId, delta) {
  if (!delta) return;
  const container = document.getElementById(containerId);
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'floating-number ' + (delta < 0 ? 'dmg' : 'heal');
  el.textContent = (delta > 0 ? '+' : '') + delta;
  container.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// ---------------------------------------------------------------------
// Title screen
// ---------------------------------------------------------------------
function renderTitleScreen() {
  screenEl.innerHTML = `
    <div id="title-screen">
      <h1 class="brand-title">Contract Breaker</h1>
      <div class="brand-subtitle">a dying god's decaying memories</div>
      <button class="action-btn primary" id="begin-btn" style="flex:0 0 auto;max-width:220px;padding:12px 20px">Begin the Descent</button>
    </div>
  `;
  document.getElementById('begin-btn').addEventListener('click', newRun);
  playScreenMusic('title');
}

// ---------------------------------------------------------------------
// Run setup
// ---------------------------------------------------------------------
function newRun() {
  G.player = new Vessel({ name: 'The Vessel', maxFaith: 50, energyPerTurn: 3 });
  G.deck = new Deck(createStarterDeck());
  G.map = generateRunMap({
    floorCount: 6,
    nodesPerFloor: 4,
    restChance: 0.22,
    enemyPool: ENEMY_ROSTER,
    bossFactory: createDyingGod,
    miniBossFactory: createBrokenAcolyte,
  });
  G.run = new Run({ map: G.map, player: G.player, log: () => {} });
  G.narrative = new NarrativeEngine({ shards: createShardPool(), threshold: 3, log: () => {} });
  G.combat = null;
  G.lastShardText = null;
  G.lastTwistText = null;
  renderMapScreen();
}

// ---------------------------------------------------------------------
// Map screen
// ---------------------------------------------------------------------
function renderMapScreen() {
  const map = G.map;
  const run = G.run;
  const available = new Set(run.availableNodes().map((n) => n.id));
  const visited = new Set(run.visited);

  screenEl.innerHTML = `
    <div id="map-screen" style="background-image:url('${BACKGROUNDS.mapScreen}')">
      <div id="map-scroll">
        <div id="map-svg-wrap"></div>
      </div>
      <div id="map-footer">
        <div id="shard-banner${G.lastTwistText ? ' twist' : ''}">${
          G.lastTwistText || G.lastShardText || 'The descent begins. Choose your path.'
        }</div>
      </div>
    </div>
  `;
  playScreenMusic('map');

  const wrap = document.getElementById('map-svg-wrap');
  const floorCount = map.floors.length;

  // Floors run left -> right, nodes within a floor run top -> bottom, both
  // as percentages of the available area so the whole run always fits in
  // one landscape viewport with no scrolling required. Positions are kept
  // inset from the true edges (6-94% / 14-82%) to leave room for the
  // topbar above and the shard-banner overlay below.
  const positions = new Map();
  map.floors.forEach((floorNodes, f) => {
    const x = 6 + ((f + 1) / (floorCount + 1)) * 88;
    floorNodes.forEach((node, i) => {
      const y = 14 + ((i + 1) / (floorNodes.length + 1)) * 68;
      positions.set(node.id, { x, y });
    });
  });

  // Connection lines first (so nodes render above them).
  for (const node of map.allNodes()) {
    const from = positions.get(node.id);
    for (const targetId of node.connections) {
      const to = positions.get(targetId);
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.left = from.x + '%';
      line.style.top = from.y + '%';
      line.style.width = '2px';
      line.style.height = '2px';
      line.style.background = 'transparent';
      line.style.zIndex = '1';
      wrap.appendChild(line);
      // Position precisely once we know pixel geometry (line drawn below).
      requestAnimationFrame(() => {
        const wrapRect = wrap.getBoundingClientRect();
        const x1 = (from.x / 100) * wrapRect.width;
        const y1 = (from.y / 100) * wrapRect.height;
        const x2 = (to.x / 100) * wrapRect.width;
        const y2 = (to.y / 100) * wrapRect.height;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.hypot(dx, dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        line.style.width = length + 'px';
        line.style.height = '2px';
        line.style.background = '#4a2a20';
        line.style.left = x1 + 'px';
        line.style.top = y1 + 'px';
        line.style.transformOrigin = '0 0';
        line.style.transform = `rotate(${angle}deg)`;
      });
    }
  }

  for (const node of map.allNodes()) {
    const pos = positions.get(node.id);
    const btn = document.createElement('div');
    btn.className = 'map-node';
    if (node.type === 'boss') btn.classList.add('boss');
    if (node.type === 'miniboss') btn.classList.add('miniboss');
    if (visited.has(node.id)) btn.classList.add('visited');
    if (available.has(node.id)) btn.classList.add('available');
    if (run.currentNode && run.currentNode.id === node.id) btn.classList.add('current');
    btn.style.left = pos.x + '%';
    btn.style.top = pos.y + '%';
    btn.textContent = NODE_ICON[node.type];
    btn.title = node.type;
    if (available.has(node.id)) {
      btn.addEventListener('click', () => onNodeClick(node.id));
    }
    wrap.appendChild(btn);

    const label = document.createElement('div');
    label.className = 'map-node-label';
    label.style.left = pos.x + '%';
    label.style.top = `calc(${pos.y}% + 24px)`;
    label.style.position = 'absolute';
    label.style.transform = 'translateX(-50%)';
    label.textContent = node.type;
    wrap.appendChild(label);
  }
}

function onNodeClick(nodeId) {
  const node = G.run.enterNode(nodeId);
  const shard = G.narrative.revealNext();
  G.lastShardText = shard ? `"${shard.text}"` : null;
  G.lastTwistText = G.narrative.twist ? G.narrative.twist.message : null;

  if (node.type === 'rest') {
    G.run.restAtCurrentNode();
    if (G.run.over) renderEndScreen();
    else renderMapScreen();
    return;
  }

  const enemy = node.enemyFactory ? node.enemyFactory() : createCrownedWound();
  const CombatClass = node.type === 'boss' ? BossCombat : Combat;
  G.combat = new CombatClass({ player: G.player, deck: G.deck, enemy, log: combatLog });
  clearLog();
  G.combat.startPlayerTurn();
  renderCombatScreen();
}

// ---------------------------------------------------------------------
// Combat screen
// ---------------------------------------------------------------------
let logLines = [];
function clearLog() {
  logLines = [];
}
function combatLog(msg) {
  logLines.push(msg);
  const panel = document.getElementById('log-panel');
  if (panel) {
    const div = document.createElement('div');
    if (/^-- Turn/.test(msg)) div.className = 'turn-marker';
    div.textContent = msg;
    panel.appendChild(div);
    panel.scrollTop = panel.scrollHeight;
  }
}

function renderCombatScreen() {
  const combat = G.combat;
  const nodeType = G.run.currentNode ? G.run.currentNode.type : 'fight';
  const bg = Run.backgroundForNode(G.run.currentNode);

  screenEl.innerHTML = `
    <div id="combat-screen" style="background-image:url('${bg}')">
      <div class="combat-layer">
        <div id="enemy-zone">
          <div id="enemy-row">
            <img id="enemy-portrait" src="${combat.enemy.art || ''}" alt="${combat.enemy.name}" />
            <div id="enemy-info">
              <div id="enemy-name">${combat.enemy.name}</div>
              <div id="enemy-intent"></div>
              <div class="bar bar-faith" id="enemy-faith-bar">
                <div class="bar-fill" id="enemy-faith-fill"></div>
                <div class="bar-label" id="enemy-faith-label"></div>
              </div>
              <div class="status-pips" id="enemy-status"></div>
            </div>
          </div>
        </div>

        <div id="log-panel"></div>

        <div id="player-zone">
          <div id="player-row">
            <div id="player-name">${G.player.name}</div>
            <div class="bar bar-faith" id="player-faith-bar">
              <div class="bar-fill" id="player-faith-fill"></div>
              <div class="bar-label" id="player-faith-label"></div>
            </div>
            <div id="energy-pips"></div>
          </div>
          <div class="status-pips" id="player-status"></div>
        </div>

        <div id="action-row"></div>
        <div id="hand-zone"></div>
      </div>
    </div>
  `;

  // Replay the log we've accumulated so far this combat.
  const panel = document.getElementById('log-panel');
  panel.innerHTML = '';
  for (const line of logLines) {
    const div = document.createElement('div');
    if (/^-- Turn/.test(line)) div.className = 'turn-marker';
    div.textContent = line;
    panel.appendChild(div);
  }
  panel.scrollTop = panel.scrollHeight;

  playScreenMusic(nodeType === 'boss' || nodeType === 'miniboss' ? 'boss' : 'combat');
  refreshCombatUI();
}

function refreshCombatUI() {
  const combat = G.combat;
  const player = G.player;
  const enemy = combat.enemy;

  const enemyPct = Math.max(0, Math.round((enemy.faith / enemy.maxFaith) * 100));
  document.getElementById('enemy-faith-fill').style.width = enemyPct + '%';
  document.getElementById('enemy-faith-label').textContent = `${enemy.faith}/${enemy.maxFaith} Faith`;
  document.getElementById('enemy-intent').textContent = combat.over ? '' : enemyIntent(enemy);

  const enemyStatus = document.getElementById('enemy-status');
  enemyStatus.innerHTML = '';
  if (enemy.shield > 0) enemyStatus.innerHTML += `<span class="status-pip shield">Shield ${enemy.shield}</span>`;
  if (enemy.burn > 0) enemyStatus.innerHTML += `<span class="status-pip burn">Burn ${enemy.burn}</span>`;

  const playerPct = Math.max(0, Math.round((player.faith / player.maxFaith) * 100));
  document.getElementById('player-faith-fill').style.width = playerPct + '%';
  document.getElementById('player-faith-label').textContent = `${player.faith}/${player.maxFaith} Faith`;

  const pips = document.getElementById('energy-pips');
  pips.innerHTML = '';
  for (let i = 0; i < player.energyPerTurn; i++) {
    const pip = document.createElement('div');
    pip.className = 'energy-pip' + (i < player.energy ? ' filled' : '');
    pips.appendChild(pip);
  }

  const playerStatus = document.getElementById('player-status');
  playerStatus.innerHTML = '';
  if (player.shield > 0) playerStatus.innerHTML += `<span class="status-pip shield">Shield ${player.shield}</span>`;
  if (player.burn > 0) playerStatus.innerHTML += `<span class="status-pip burn">Burn ${player.burn}</span>`;

  renderActionRow();
  renderHand();
}

function renderActionRow() {
  const combat = G.combat;
  const row = document.getElementById('action-row');
  row.innerHTML = '';

  if (!combat.over) {
    const anchorBtn = document.createElement('button');
    anchorBtn.className = 'action-btn';
    anchorBtn.textContent = 'Anchor';
    anchorBtn.disabled = G.deck.hand.length < 2;
    anchorBtn.addEventListener('click', openAnchorFlow);
    row.appendChild(anchorBtn);

    const endBtn = document.createElement('button');
    endBtn.className = 'action-btn primary';
    endBtn.textContent = 'End Turn';
    endBtn.addEventListener('click', () => {
      const beforePlayerFaith = G.player.faith;
      G.combat.endPlayerTurn();
      if (!G.combat.over) G.combat.startPlayerTurn();
      const playerDelta = G.player.faith - beforePlayerFaith;
      if (playerDelta !== 0) {
        showFloatingNumber('player-zone', playerDelta);
        playSfx('damage');
      }
      refreshCombatUI();
      const panel = document.getElementById('log-panel');
      if (panel) panel.scrollTop = panel.scrollHeight;
    });
    row.appendChild(endBtn);
  } else {
    if (combat.result === 'win') {
      const graftBtn = document.createElement('button');
      graftBtn.className = 'action-btn primary';
      graftBtn.textContent = 'Graft Ability';
      graftBtn.disabled = !(combat.enemy.abilities && combat.enemy.abilities.length > 0);
      graftBtn.addEventListener('click', openGraftFlow);
      row.appendChild(graftBtn);
    }
    const continueBtn = document.createElement('button');
    continueBtn.className = 'action-btn' + (combat.result === 'win' ? '' : ' danger');
    continueBtn.textContent = combat.result === 'win' ? 'Continue' : 'Accept Defeat';
    continueBtn.addEventListener('click', finishCombat);
    row.appendChild(continueBtn);
  }
}

function renderHand() {
  const zone = document.getElementById('hand-zone');
  zone.innerHTML = '';
  if (G.combat.over) return;

  G.deck.hand.forEach((card, index) => {
    const el = document.createElement('div');
    el.className = 'hand-card';
    if (card.cost > G.player.energy) el.classList.add('unaffordable');
    if (card.corrupted) el.classList.add('corrupted');

    el.innerHTML = `
      <div class="hand-card-cost">
        <img src="${card.currentArt || ''}" alt="${card.name}" />
        <div class="hand-card-cost-badge">${card.cost}</div>
      </div>
      <div class="hand-card-name">${card.name}</div>
      <div class="hand-card-effect">${truncateForCard(cardBlurb(card))}</div>
      ${card.wear > 0 ? `<div class="hand-card-wear">wear ${card.wear}${card.corrupted ? ' • corrupted' : ''}</div>` : ''}
    `;

    if (card.cost <= G.player.energy) {
      el.addEventListener('click', () => {
        el.classList.add('playing');
        setTimeout(() => attemptPlayCard(index), 190);
      });
    }
    zone.appendChild(el);
  });
}

function attemptPlayCard(index) {
  const card = G.deck.hand[index];
  if (!card) return;

  if (card.id === 'reckoning-scale') {
    openModal(`
      <h2>The Reckoning Scale</h2>
      <div class="modal-sub">Choose one effect.</div>
      <button class="action-btn primary" id="scale-damage">Deal Damage</button>
      <button class="action-btn" id="scale-heal" style="margin-top:8px">Heal</button>
    `);
    document.getElementById('scale-damage').addEventListener('click', () => {
      closeModal();
      playCardNow(index, { choice: 'damage' });
    });
    document.getElementById('scale-heal').addEventListener('click', () => {
      closeModal();
      playCardNow(index, { choice: 'heal' });
    });
    return;
  }

  playCardNow(index, {});
}

function playCardNow(index, options) {
  const enemy = G.combat.enemy;
  const player = G.player;
  const beforeEnemyFaith = enemy.faith;
  const beforePlayerFaith = player.faith;
  let played = false;
  try {
    G.combat.playCard(index, options);
    played = true;
  } catch (err) {
    combatLog(`(${err.message})`);
  }

  if (played) {
    const enemyDelta = enemy.faith - beforeEnemyFaith;
    const playerDelta = player.faith - beforePlayerFaith;
    if (enemyDelta !== 0) showFloatingNumber('enemy-zone', enemyDelta);
    if (playerDelta !== 0) showFloatingNumber('player-zone', playerDelta);
    playSfx(enemyDelta < 0 || playerDelta < 0 ? 'damage' : 'cardPlay');
  }

  refreshCombatUI();
  const panel = document.getElementById('log-panel');
  if (panel) panel.scrollTop = panel.scrollHeight;
}

// ---------------------------------------------------------------------
// Anchor flow: pick a hand card to sacrifice, then a deck card to restore.
// ---------------------------------------------------------------------
function openAnchorFlow() {
  const hand = G.deck.hand;
  if (hand.length < 2) return;

  const items = hand
    .map(
      (card, i) => `
      <div class="modal-item" data-index="${i}">
        <img src="${card.currentArt || ''}" alt="${card.name}" />
        <div class="modal-item-text">
          <div class="modal-item-title">${card.name}</div>
          <div class="modal-item-desc">Cost ${card.cost} • wear ${card.wear}</div>
        </div>
      </div>`
    )
    .join('');

  openModal(`
    <h2>Anchor -- Step 1</h2>
    <div class="modal-sub">Choose a card to sacrifice (it leaves play for good).</div>
    ${items}
  `);

  modalEl.querySelectorAll('.modal-item').forEach((el) => {
    el.addEventListener('click', () => {
      const sacrificeIndex = Number(el.dataset.index);
      openAnchorStepTwo(sacrificeIndex);
    });
  });
}

function openAnchorStepTwo(sacrificeIndex) {
  const sacrifice = G.deck.hand[sacrificeIndex];
  const candidates = G.deck.allCards().filter((c) => c !== sacrifice);

  const items = candidates
    .map(
      (card, i) => `
      <div class="modal-item" data-index="${i}">
        <img src="${card.currentArt || ''}" alt="${card.name}" />
        <div class="modal-item-text">
          <div class="modal-item-title">${card.name}</div>
          <div class="modal-item-desc">wear ${card.wear}${card.corrupted ? ' • corrupted' : ' • pristine'}</div>
        </div>
      </div>`
    )
    .join('');

  openModal(`
    <h2>Anchor -- Step 2</h2>
    <div class="modal-sub">Sacrificing <b>${sacrifice.name}</b>. Choose a card to restore to pristine.</div>
    ${items}
  `);

  modalEl.querySelectorAll('.modal-item').forEach((el) => {
    el.addEventListener('click', () => {
      const target = candidates[Number(el.dataset.index)];
      closeModal();
      try {
        G.combat.anchor(sacrificeIndex, target);
        playSfx('anchor');
      } catch (err) {
        combatLog(`(${err.message})`);
      }
      refreshCombatUI();
    });
  });
}

// ---------------------------------------------------------------------
// Graft flow: pick a defeated enemy's ability, then a deck card to modify.
// ---------------------------------------------------------------------
function openGraftFlow() {
  const abilities = G.combat.enemy.abilities || [];
  if (abilities.length === 0) return;

  const items = abilities
    .map(
      (ability, i) => `
      <div class="modal-item" data-index="${i}">
        <div class="modal-item-text">
          <div class="modal-item-title">${ability.name}</div>
          <div class="modal-item-desc">${ability.description || ''}</div>
        </div>
      </div>`
    )
    .join('');

  openModal(`
    <h2>Graft an Ability</h2>
    <div class="modal-sub">Permanently attach one of ${G.combat.enemy.name}'s abilities to a card.</div>
    ${items}
    <button class="action-btn" id="graft-skip">Skip</button>
  `);

  document.getElementById('graft-skip').addEventListener('click', closeModal);

  modalEl.querySelectorAll('.modal-item').forEach((el) => {
    el.addEventListener('click', () => {
      const ability = abilities[Number(el.dataset.index)];
      openGraftStepTwo(ability);
    });
  });
}

function openGraftStepTwo(ability) {
  const candidates = G.deck.allCards();
  const items = candidates
    .map(
      (card, i) => `
      <div class="modal-item" data-index="${i}">
        <img src="${card.currentArt || ''}" alt="${card.name}" />
        <div class="modal-item-text">
          <div class="modal-item-title">${card.name}</div>
          <div class="modal-item-desc">${cardBlurb(card)}</div>
        </div>
      </div>`
    )
    .join('');

  openModal(`
    <h2>Graft -- Choose a Card</h2>
    <div class="modal-sub">Attaching <b>${ability.name}</b>.</div>
    ${items}
  `);

  modalEl.querySelectorAll('.modal-item').forEach((el) => {
    el.addEventListener('click', () => {
      const target = candidates[Number(el.dataset.index)];
      closeModal();
      try {
        G.combat.graft(ability, target);
        playSfx('graft');
      } catch (err) {
        combatLog(`(${err.message})`);
      }
      renderActionRow();
    });
  });
}

// ---------------------------------------------------------------------
// Combat resolution -> back to map, or end screen.
// ---------------------------------------------------------------------
function finishCombat() {
  refreshCombatUI();
  const victory = G.combat.result === 'win';
  playSfx(victory ? 'victory' : 'defeat');
  G.run.completeCurrentNode({ victory });
  G.combat = null;
  if (G.run.over) renderEndScreen();
  else renderMapScreen();
}

// ---------------------------------------------------------------------
// End screen
// ---------------------------------------------------------------------
function renderEndScreen() {
  const victory = G.run.result === 'victory';
  screenEl.innerHTML = `
    <div id="end-screen">
      <h1 class="brand-title end-brand">Contract Breaker</h1>
      <div id="end-title" class="${victory ? 'victory' : 'defeat'}">${
        victory ? 'THE TETHER IS SEVERED' : 'YOUR FAITH IS BROKEN'
      }</div>
      <div id="end-stats">
        Floors cleared: <b>${G.run.visited.length}</b><br/>
        Memory shards recovered: <b>${G.narrative.revealed.length}</b><br/>
        Final Faith: <b>${G.player.faith}/${G.player.maxFaith}</b><br/>
        ${G.narrative.recontextualized ? '<i>The truth was recontextualized...</i>' : ''}
      </div>
      <button class="action-btn primary" id="restart-btn" style="flex:0 0 auto;max-width:220px;padding:12px 20px">Begin a New Run</button>
    </div>
  `;
  document.getElementById('restart-btn').addEventListener('click', newRun);
  playScreenMusic('title');
}

// ---------------------------------------------------------------------
renderTitleScreen();
