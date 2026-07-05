const canvas = document.getElementById('arena');
const ctx = canvas.getContext('2d');

const phaseLabel = document.getElementById('phaseLabel');
const roundLabel = document.getElementById('roundLabel');
const scoreLabel = document.getElementById('scoreLabel');
const creditsLabel = document.getElementById('creditsLabel');
const timerLabel = document.getElementById('timerLabel');
const siteLabel = document.getElementById('siteLabel');
const objectiveLabel = document.getElementById('objectiveLabel');
const allyAlive = document.getElementById('allyAlive');
const enemyAlive = document.getElementById('enemyAlive');
const plantLabel = document.getElementById('plantLabel');
const feedLog = document.getElementById('feedLog');
const loadoutSummary = document.getElementById('loadoutSummary');
const agentRoster = document.getElementById('agentRoster');
const weaponShop = document.getElementById('weaponShop');
const startButton = document.getElementById('startButton');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const overlayButton = document.getElementById('overlayButton');

const TILE = 48;
const WIDTH = 23;
const HEIGHT = 13;
const MAP_W = WIDTH * TILE;
const MAP_H = HEIGHT * TILE;

canvas.width = MAP_W;
canvas.height = MAP_H;

const AGENTS = {
  iron: {
    name: 'Iron Vanguard',
    role: 'Controller',
    tag: 'Shield line',
    color: '#6fd9ff',
    hp: 120,
    armor: 70,
    speed: 126,
    ability: 'Repulsor Screen',
    ultimate: 'Overclock Armor',
    kit: 'Places a curved screen that blocks shots and lets allies push.'
  },
  web: {
    name: 'Web Runner',
    role: 'Vanguard',
    tag: 'Entry burst',
    color: '#ffb557',
    hp: 100,
    armor: 30,
    speed: 152,
    ability: 'Web Zip',
    ultimate: 'Swing Break',
    kit: 'Dashes toward the aim point and can break a bad angle.'
  },
  mystic: {
    name: 'Mystic Gatekeeper',
    role: 'Controller',
    tag: 'Space control',
    color: '#b89aff',
    hp: 102,
    armor: 40,
    speed: 124,
    ability: 'Portal Step',
    ultimate: 'Time Fold',
    kit: 'Teleports short range and can rewind to a safer position.'
  },
  shadow: {
    name: 'Shadow Panther',
    role: 'Sentinel',
    tag: 'Trap anchor',
    color: '#7dffba',
    hp: 110,
    armor: 55,
    speed: 134,
    ability: 'Vibranium Trap',
    ultimate: 'Hunter State',
    kit: 'Drops a trap and punishes aggressive pushes.'
  }
};

const WEAPONS = {
  v9: {
    name: 'V-9 Classic',
    type: 'Sidearm',
    cost: 0,
    damage: 18,
    range: 530,
    fireRate: 3.6,
    spread: 0.045,
    speed: 720,
    mag: 12,
    reload: 1.12,
    desc: 'Free starter sidearm. Reliable and quick to recover.'
  },
  copperhead: {
    name: 'Copperhead',
    type: 'SMG',
    cost: 450,
    damage: 12,
    range: 420,
    fireRate: 10.8,
    spread: 0.1,
    speed: 700,
    mag: 24,
    reload: 1.3,
    desc: 'Fast close-range weapon for moving fights.'
  },
  atlas: {
    name: 'Atlas',
    type: 'Rifle',
    cost: 900,
    damage: 22,
    range: 640,
    fireRate: 6.3,
    spread: 0.055,
    speed: 760,
    mag: 20,
    reload: 1.55,
    desc: 'Balanced default rifle for the core tactical loop.'
  },
  monarch: {
    name: 'Monarch',
    type: 'Rifle',
    cost: 1200,
    damage: 30,
    range: 700,
    fireRate: 4.4,
    spread: 0.04,
    speed: 800,
    mag: 12,
    reload: 1.7,
    desc: 'High-damage rifle for disciplined peeks and clutch shots.'
  }
};

const TEAM_COLORS = {
  ally: '#4be4ff',
  enemy: '#ff637f'
};

const state = {
  phase: 'lobby',
  round: 1,
  maxRounds: 3,
  allyScore: 0,
  enemyScore: 0,
  credits: 800,
  lossStreak: 0,
  buyTimer: 15,
  roundTimer: 90,
  attackTeam: 'ally',
  attackSite: 'A',
  objective: 'Prepare',
  playerAgent: 'iron',
  playerWeapon: 'atlas',
  ownedWeapons: new Set(['v9', 'atlas']),
  units: [],
  bullets: [],
  effects: [],
  traps: [],
  logs: [],
  planted: null,
  playerUnit: null,
  fireHeld: false,
  keys: new Set(),
  pointer: { x: MAP_W / 2, y: MAP_H / 2 },
  cameraAngle: -Math.PI / 2,
  cameraBob: 0,
  mouseCaptured: false,
  crosshairSpread: 0,
  matchFinished: false,
  carryDrop: null,
  overlayLocked: true,
  lastHitTick: 0
};

const sites = {
  A: { x: 10.2, y: 2.2, w: 2.8, h: 2.1, label: 'A' },
  B: { x: 10.2, y: 8.7, w: 2.8, h: 2.1, label: 'B' }
};

const grid = Array.from({ length: HEIGHT }, (_, y) =>
  Array.from({ length: WIDTH }, (_, x) => (x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1 ? '#' : '.'))
);

function fillRect(x, y, w, h) {
  for (let row = y; row < y + h; row += 1) {
    for (let col = x; col < x + w; col += 1) {
      if (grid[row] && grid[row][col]) {
        grid[row][col] = '#';
      }
    }
  }
}

fillRect(4, 2, 1, 3);
fillRect(7, 4, 2, 1);
fillRect(8, 8, 2, 1);
fillRect(15, 2, 1, 3);
fillRect(15, 8, 1, 3);
fillRect(18, 5, 2, 1);
fillRect(10, 5, 3, 1);

const spawnPoints = {
  ally: [
    { x: 2.5, y: 3.5 },
    { x: 3.5, y: 5.0 },
    { x: 2.8, y: 7.0 },
    { x: 4.0, y: 9.0 },
    { x: 2.6, y: 10.2 }
  ],
  enemy: [
    { x: 20.4, y: 3.5 },
    { x: 19.2, y: 5.2 },
    { x: 20.2, y: 7.1 },
    { x: 19.5, y: 9.0 },
    { x: 20.2, y: 10.2 }
  ]
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleDiff(a, b) {
  let diff = a - b;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

function normalizeAngle(angle) {
  let value = angle;
  while (value <= -Math.PI) value += Math.PI * 2;
  while (value > Math.PI) value -= Math.PI * 2;
  return value;
}

function vectorFromAngle(angle) {
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function getAimAngle(unit) {
  if (unit && unit.isPlayer) {
    return state.cameraAngle;
  }
  return Math.atan2(state.pointer.y - unit.y, state.pointer.x - unit.x);
}

function getCameraPosition() {
  const unit = state.playerUnit;
  return unit ? { x: unit.x, y: unit.y } : { x: MAP_W / 2, y: MAP_H / 2 };
}

function getPlayerCrosshairTarget() {
  const player = state.playerUnit;
  if (!player) {
    return null;
  }

  let best = null;
  let bestScore = Infinity;
  for (const unit of state.units) {
    if (unit.dead || unit.team === player.team) {
      continue;
    }
    const angle = Math.atan2(unit.y - player.y, unit.x - player.x);
    const diff = Math.abs(angleDiff(angle, state.cameraAngle));
    const distance = dist(player, unit);
    if (diff < 0.12 && distance < bestScore && canSee(player, unit)) {
      best = unit;
      bestScore = distance;
    }
  }
  return best;
}

function projectPoint(point, cameraX, cameraY, cameraAngle, fov, width, height) {
  const dx = point.x - cameraX;
  const dy = point.y - cameraY;
  const distance = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const rel = angleDiff(angle, cameraAngle);
  if (Math.abs(rel) > fov / 2 + 0.45) {
    return null;
  }
  const x = ((rel + fov / 2) / fov) * width;
  const scale = Math.max(0.18, Math.cos(rel));
  const size = (TILE * 220 * scale) / Math.max(24, distance);
  return { x, y: height / 2, size, distance, rel };
}

function drawWeaponOverlay() {
  const gunW = canvas.width * 0.22;
  const gunH = canvas.height * 0.18;
  const x = canvas.width - gunW - 34;
  const y = canvas.height - gunH - 24;
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = 'rgba(10, 18, 30, 0.92)';
  ctx.fillRect(x + 20, y + 24, gunW - 40, gunH - 20);
  ctx.fillStyle = 'rgba(75, 228, 255, 0.7)';
  ctx.fillRect(x + 36, y + 40, gunW * 0.45, 14);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(x + 18, y + 48, gunW * 0.18, 10);
  ctx.fillStyle = 'rgba(255, 184, 77, 0.75)';
  ctx.fillRect(x + gunW * 0.55, y + 32, gunW * 0.12, 18);
  ctx.restore();
}

function drawCrosshair() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const spread = 8 + state.crosshairSpread * 16;
  ctx.save();
  ctx.strokeStyle = 'rgba(232, 242, 255, 0.95)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - spread - 9, cy);
  ctx.lineTo(cx - spread - 3, cy);
  ctx.moveTo(cx + spread + 3, cy);
  ctx.lineTo(cx + spread + 9, cy);
  ctx.moveTo(cx, cy - spread - 9);
  ctx.lineTo(cx, cy - spread - 3);
  ctx.moveTo(cx, cy + spread + 3);
  ctx.lineTo(cx, cy + spread + 9);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function rayStep(startX, startY, angle, maxDistance) {
  const step = 6;
  const dir = vectorFromAngle(angle);
  let distance = 0;
  let x = startX;
  let y = startY;

  while (distance < maxDistance) {
    x += dir.x * step;
    y += dir.y * step;
    distance += step;
    if (pointBlocked(x, y, 4)) {
      return { distance, x, y, hit: true };
    }
  }

  return { distance: maxDistance, x, y, hit: false };
}

function canSee(camera, target) {
  return !lineBlocked(camera, target);
}

function cellFromPos(x, y) {
  return {
    col: clamp(Math.floor(x / TILE), 0, WIDTH - 1),
    row: clamp(Math.floor(y / TILE), 0, HEIGHT - 1)
  };
}

function centerOfCell(col, row) {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

function rectCenter(rect) {
  return { x: (rect.x + rect.w / 2) * TILE, y: (rect.y + rect.h / 2) * TILE };
}

function circleRectCollide(cx, cy, r, rx, ry, rw, rh) {
  const nx = clamp(cx, rx, rx + rw);
  const ny = clamp(cy, ry, ry + rh);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy <= r * r;
}

function pointBlocked(x, y, radius = 14) {
  if (x < radius || y < radius || x > MAP_W - radius || y > MAP_H - radius) {
    return true;
  }

  const { col, row } = cellFromPos(x, y);
  for (let cy = row - 1; cy <= row + 1; cy += 1) {
    for (let cx = col - 1; cx <= col + 1; cx += 1) {
      if (cx < 0 || cy < 0 || cx >= WIDTH || cy >= HEIGHT) {
        continue;
      }
      if (grid[cy][cx] === '#') {
        if (circleRectCollide(x, y, radius, cx * TILE, cy * TILE, TILE, TILE)) {
          return true;
        }
      }
    }
  }

  for (const effect of state.effects) {
    if (effect.type === 'screen' && effect.active && circleRectCollide(x, y, radius, effect.x, effect.y, effect.w, effect.h)) {
      return true;
    }
  }

  return false;
}

function lineBlocked(a, b) {
  const steps = Math.max(4, Math.ceil(dist(a, b) / 18));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    if (pointBlocked(x, y, 4)) {
      return true;
    }
  }
  return false;
}

function neighbors(col, row) {
  return [
    { col: col + 1, row },
    { col: col - 1, row },
    { col, row: row + 1 },
    { col, row: row - 1 }
  ].filter(({ col: c, row: r }) => c >= 0 && r >= 0 && c < WIDTH && r < HEIGHT && grid[r][c] !== '#');
}

function pathfind(start, goal) {
  const key = (n) => `${n.col},${n.row}`;
  const open = [start];
  const came = new Map();
  const gScore = new Map([[key(start), 0]]);
  const fScore = new Map([[key(start), Math.abs(start.col - goal.col) + Math.abs(start.row - goal.row)]]);
  const closed = new Set();

  while (open.length) {
    open.sort((a, b) => (fScore.get(key(a)) ?? Infinity) - (fScore.get(key(b)) ?? Infinity));
    const current = open.shift();
    if (current.col === goal.col && current.row === goal.row) {
      const path = [current];
      let cursor = key(current);
      while (came.has(cursor)) {
        const prev = came.get(cursor);
        path.unshift(prev);
        cursor = key(prev);
      }
      return path;
    }

    closed.add(key(current));

    for (const next of neighbors(current.col, current.row)) {
      const nextKey = key(next);
      if (closed.has(nextKey)) {
        continue;
      }
      const tentative = (gScore.get(key(current)) ?? Infinity) + 1;
      if (!open.some((node) => node.col === next.col && node.row === next.row)) {
        open.push(next);
      } else if (tentative >= (gScore.get(nextKey) ?? Infinity)) {
        continue;
      }
      came.set(nextKey, current);
      gScore.set(nextKey, tentative);
      fScore.set(nextKey, tentative + Math.abs(next.col - goal.col) + Math.abs(next.row - goal.row));
    }
  }

  return [start, goal];
}

function logMessage(message, tone = 'cyan') {
  state.logs.unshift({ message, tone, time: performance.now() });
  state.logs = state.logs.slice(0, 12);
  renderLog();
}

function renderLog() {
  feedLog.innerHTML = state.logs
    .map((entry) => `<div class="feed-entry ${entry.tone}">${entry.message}</div>`)
    .join('');
}

function renderRoster() {
  agentRoster.innerHTML = Object.entries(AGENTS)
    .map(([key, agent]) => `
      <button class="card ${state.playerAgent === key ? 'active' : ''}" data-agent="${key}">
        <div class="meta">
          <div>
            <div class="title">${agent.name}</div>
            <div class="tag">${agent.role}</div>
          </div>
          <div class="tag">${agent.tag}</div>
        </div>
        <div class="desc">${agent.kit}</div>
      </button>
    `)
    .join('');

  agentRoster.querySelectorAll('[data-agent]').forEach((button) => {
    button.addEventListener('click', () => {
      if (state.phase !== 'lobby' && state.phase !== 'buy') {
        return;
      }
      state.playerAgent = button.dataset.agent;
      renderRoster();
      renderLoadout();
      logMessage(`Selected ${AGENTS[state.playerAgent].name}.`, 'green');
    });
  });
}

function renderWeapons() {
  weaponShop.innerHTML = Object.entries(WEAPONS)
    .map(([key, weapon]) => {
      const owned = state.ownedWeapons.has(key);
      const affordable = owned || state.credits >= weapon.cost;
      return `
        <button class="card ${state.playerWeapon === key ? 'active' : ''} ${affordable ? '' : 'locked'}" data-weapon="${key}">
          <div class="meta">
            <div>
              <div class="title">${weapon.name}</div>
              <div class="tag">${weapon.type}</div>
            </div>
            <div class="tag">${owned ? 'Owned' : `Cost ${weapon.cost}`}</div>
          </div>
          <div class="desc">${weapon.desc}</div>
          <div class="cost">DMG ${weapon.damage} · ROF ${weapon.fireRate.toFixed(1)} · MAG ${weapon.mag}</div>
        </button>
      `;
    })
    .join('');

  weaponShop.querySelectorAll('[data-weapon]').forEach((button) => {
    button.addEventListener('click', () => {
      if (state.phase !== 'lobby' && state.phase !== 'buy') {
        return;
      }
      const key = button.dataset.weapon;
      if (!state.ownedWeapons.has(key)) {
        const weapon = WEAPONS[key];
        if (state.credits < weapon.cost) {
          logMessage(`Not enough credits for ${weapon.name}.`, 'amber');
          return;
        }
        state.credits -= weapon.cost;
        state.ownedWeapons.add(key);
        logMessage(`Purchased ${weapon.name}.`, 'green');
      } else {
        logMessage(`Equipped ${WEAPONS[key].name}.`, 'cyan');
      }
      state.playerWeapon = key;
      renderWeapons();
      renderLoadout();
      syncHud();
    });
  });
}

function renderLoadout() {
  const agent = AGENTS[state.playerAgent];
  const weapon = WEAPONS[state.playerWeapon];
  loadoutSummary.innerHTML = `
    <h3>${agent.name}</h3>
    <p><strong>${agent.role}</strong> · ${agent.ability}</p>
    <p>${agent.kit}</p>
    <p><strong>${weapon.name}</strong> · ${weapon.type} · ${weapon.damage} dmg · ${weapon.fireRate.toFixed(1)} ROF</p>
    <p class="small-copy">Your chosen agent and weapon carry into the next round when the buy phase begins.</p>
  `;
}

function syncHud() {
  phaseLabel.textContent = state.phase === 'lobby' ? 'Lobby' : state.phase === 'buy' ? 'Buy Phase' : state.phase === 'round' ? 'Round Live' : state.phase === 'roundEnd' ? 'Round End' : 'Match End';
  roundLabel.textContent = String(state.round);
  scoreLabel.textContent = `${state.allyScore} - ${state.enemyScore}`;
  creditsLabel.textContent = String(state.credits);
  timerLabel.textContent = state.phase === 'buy' ? `${Math.ceil(state.buyTimer)}s` : state.phase === 'round' ? `${Math.ceil(state.roundTimer)}s` : '--';
  siteLabel.textContent = state.attackSite;
  objectiveLabel.textContent = state.phase === 'round' ? (state.planted ? 'Defuse / Hold' : 'Plant / Push') : state.objective;
  allyAlive.textContent = String(state.units.filter((unit) => unit.team === 'ally' && !unit.dead).length);
  enemyAlive.textContent = String(state.units.filter((unit) => unit.team === 'enemy' && !unit.dead).length);
  plantLabel.textContent = state.planted ? `${state.planted.team === 'ally' ? 'Allies' : 'Enemies'} planted` : state.carryDrop ? 'Dropped' : 'Idle';
  startButton.textContent = state.phase === 'lobby' ? 'Launch Match' : state.phase === 'buy' ? 'Start Round' : state.phase === 'roundEnd' || state.phase === 'matchEnd' ? 'Replay' : 'In Round';
  startButton.disabled = state.phase === 'round';
  renderLoadout();
  renderRoster();
  renderWeapons();
}

function showOverlay(title, text, buttonText = 'Continue') {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlayButton.textContent = buttonText;
  overlay.classList.add('show');
  state.overlayLocked = true;
}

function hideOverlay() {
  overlay.classList.remove('show');
  state.overlayLocked = false;
}

function makeUnit(team, agentKey, isPlayer = false) {
  const agent = AGENTS[agentKey];
  const weapon = clone(WEAPONS[team === 'ally' && isPlayer ? state.playerWeapon : randomBotWeapon(team)]);
  return {
    id: `${team}-${Math.random().toString(36).slice(2, 8)}`,
    team,
    agentKey,
    name: agent.name,
    color: agent.color,
    x: 0,
    y: 0,
    r: 14,
    hp: agent.hp,
    maxHp: agent.hp,
    armor: agent.armor,
    maxArmor: agent.armor,
    speed: agent.speed,
    weaponKey: isPlayer ? state.playerWeapon : randomBotWeapon(team),
    weapon,
    ammo: weapon.mag,
    reserve: weapon.mag * 3,
    reload: 0,
    shootCooldown: 0,
    abilityCooldown: 0,
    ultimateCharge: 40,
    ultimateActive: 0,
    abilityActive: 0,
    dashEnd: 0,
    previousStates: [],
    carrying: false,
    plantedRole: false,
    dead: false,
    path: [],
    pathIndex: 0,
    target: null,
    isPlayer,
    recoil: 0,
    stealth: 0,
    shield: 0,
    vulnerability: 1,
    trapCharges: 1,
    dashTrail: 0,
    flash: 0,
    spawnIndex: 0,
    moveIntent: { x: 0, y: 0 },
    facing: 0,
    nextThink: 0,
    holdInteract: 0,
    selectedSite: null
  };
}

function randomBotWeapon(team) {
  const options = ['v9', 'copperhead', 'atlas', 'monarch'];
  const index = team === 'enemy' ? Math.floor(rand(0, options.length)) : Math.floor(rand(1, options.length));
  return options[index] ?? 'atlas';
}

function randomBotAgent(index) {
  return ['iron', 'web', 'mystic', 'shadow'][index % 4];
}

function resetRoundUnits() {
  const attackTeam = state.attackTeam;
  const playerAgent = state.playerAgent;
  const playerWeapon = state.playerWeapon;

  state.units = [];

  for (let i = 0; i < 5; i += 1) {
    const allyKey = i === 0 ? playerAgent : randomBotAgent(i);
    const enemyKey = randomBotAgent(i + 1);
    const ally = makeUnit('ally', allyKey, i === 0);
    const enemy = makeUnit('enemy', enemyKey, false);

    const allySpawn = spawnPoints.ally[i];
    const enemySpawn = spawnPoints.enemy[i];
    ally.x = allySpawn.x * TILE;
    ally.y = allySpawn.y * TILE;
    enemy.x = enemySpawn.x * TILE;
    enemy.y = enemySpawn.y * TILE;
    ally.spawnIndex = i;
    enemy.spawnIndex = i;
    ally.weaponKey = i === 0 ? playerWeapon : ally.weaponKey;
    ally.weapon = clone(WEAPONS[ally.weaponKey]);
    ally.ammo = ally.weapon.mag;
    ally.reserve = ally.weapon.mag * 3;
    enemy.weapon = clone(WEAPONS[enemy.weaponKey]);
    enemy.ammo = enemy.weapon.mag;
    enemy.reserve = enemy.weapon.mag * 3;
    state.units.push(ally, enemy);
  }

  state.playerUnit = state.units.find((unit) => unit.isPlayer);

  state.units.forEach((unit) => {
    unit.carrying = false;
    unit.selectedSite = state.attackSite;
  });

  if (attackTeam === 'ally') {
    state.playerUnit.carrying = true;
  } else {
    const carrier = state.units.find((unit) => unit.team === 'enemy' && !unit.dead && unit.spawnIndex === 0);
    if (carrier) {
      carrier.carrying = true;
    }
  }

  state.carryDrop = null;
  state.planted = null;
}

function beginMatch() {
  state.allyScore = 0;
  state.enemyScore = 0;
  state.credits = 800;
  state.lossStreak = 0;
  state.round = 1;
  state.matchFinished = false;
  state.ownedWeapons = new Set(['v9', 'atlas']);
  state.playerWeapon = state.ownedWeapons.has(state.playerWeapon) ? state.playerWeapon : 'atlas';
  state.logs = [];
  logMessage('Match booted. Buy phase started.', 'green');
  startBuyPhase();
}

function startBuyPhase() {
  state.phase = 'buy';
  state.buyTimer = 15;
  state.attackTeam = state.round % 2 === 1 ? 'ally' : 'enemy';
  state.attackSite = state.round % 2 === 1 ? 'A' : 'B';
  state.objective = `${state.attackTeam === 'ally' ? 'Allies attack' : 'Enemies attack'} site ${state.attackSite}`;
  if (document.pointerLockElement === canvas) {
    document.exitPointerLock();
  }
  resetRoundUnits();
  if (state.playerUnit) {
    const target = getSiteTarget(state.playerUnit);
    state.cameraAngle = Math.atan2(target.y - state.playerUnit.y, target.x - state.playerUnit.x);
  }
  state.cameraBob = 0;
  state.crosshairSpread = 0;
  syncHud();
  hideOverlay();
  logMessage(`Round ${state.round} setup: ${state.attackTeam === 'ally' ? 'attack' : 'defend'} on site ${state.attackSite}.`, 'amber');
}

function startRound() {
  hideOverlay();
  state.phase = 'round';
  state.roundTimer = 90;
  state.objective = state.planted ? 'Defuse or hold' : 'Plant or hold';
  if (!document.pointerLockElement) {
    canvas.requestPointerLock().catch(() => {});
  }
  syncHud();
  logMessage(`Round ${state.round} live.`, 'cyan');
}

function awardRound(team, reason) {
  if (state.phase === 'roundEnd' || state.phase === 'matchEnd') {
    return;
  }
  state.phase = 'roundEnd';
  const playerWon = team === 'ally';
  if (playerWon) {
    state.allyScore += 1;
    state.lossStreak = 0;
    state.credits += 3000;
  } else {
    state.enemyScore += 1;
    state.lossStreak += 1;
    state.credits += 1900 + Math.min(1000, state.lossStreak * 500);
  }
  state.objective = playerWon ? 'Round won' : 'Round lost';
  syncHud();
  logMessage(`${team === 'ally' ? 'Allies' : 'Enemies'} win the round (${reason}).`, playerWon ? 'green' : 'red');

  const scoreboardLead = Math.max(state.allyScore, state.enemyScore);
  if (scoreboardLead >= 2 || state.round >= state.maxRounds) {
    state.phase = 'matchEnd';
    const winner = state.allyScore === state.enemyScore ? 'Draw' : state.allyScore > state.enemyScore ? 'Allies' : 'Enemies';
    setTimeout(() => {
      showOverlay(
        `${winner} take the match`,
        `Final score ${state.allyScore} - ${state.enemyScore}. Reload the page or press the button below to replay the prototype.`,
        'Replay'
      );
      state.matchFinished = true;
    }, 700);
    return;
  }

  setTimeout(() => {
    state.round += 1;
    startBuyPhase();
  }, 1400);
}

function getUnit(team, excludeDead = true) {
  return state.units.filter((unit) => unit.team === team && (!excludeDead || !unit.dead));
}

function nearestEnemy(unit) {
  let choice = null;
  let best = Infinity;
  for (const other of state.units) {
    if (other.dead || other.team === unit.team) {
      continue;
    }
    const d = dist(unit, other);
    if (d < best) {
      choice = other;
      best = d;
    }
  }
  return choice;
}

function getSiteTarget(unit) {
  const site = sites[state.attackSite];
  const point = rectCenter(site);
  return {
    x: point.x,
    y: point.y,
    cell: cellFromPos(point.x, point.y)
  };
}

function choosePathTarget(unit, enemyFocus) {
  if (state.planted) {
    if (unit.team !== state.planted.team) {
      return { x: state.planted.x, y: state.planted.y };
    }
    return enemyFocus ? { x: enemyFocus.x, y: enemyFocus.y } : getSiteTarget(unit);
  }

  if (unit.team === state.attackTeam) {
    if (unit.carrying) {
      return getSiteTarget(unit);
    }
    if (state.carryDrop) {
      return state.carryDrop;
    }
    if (enemyFocus && dist(unit, enemyFocus) < 180) {
      return { x: enemyFocus.x, y: enemyFocus.y };
    }
    return getSiteTarget(unit);
  }

  if (enemyFocus && enemyFocus.carrying) {
    return { x: enemyFocus.x, y: enemyFocus.y };
  }

  return getSiteTarget(unit);
}

function attemptShoot(unit, target) {
  if (!target || unit.dead) {
    return;
  }

  if (unit.reload > 0 || unit.shootCooldown > 0 || unit.ammo <= 0) {
    return;
  }

  const weapon = unit.weapon;
  const shootRange = weapon.range + (unit.ultimateActive ? 60 : 0);
  if (dist(unit, target) > shootRange || lineBlocked(unit, target)) {
    return;
  }

  const spread = weapon.spread * (1 + unit.recoil * 0.3);
  const angle = Math.atan2(target.y - unit.y, target.x - unit.x) + rand(-spread, spread);
  const projectile = {
    x: unit.x,
    y: unit.y,
    vx: Math.cos(angle) * weapon.speed,
    vy: Math.sin(angle) * weapon.speed,
    speed: weapon.speed,
    range: weapon.range,
    traveled: 0,
    damage: weapon.damage * (unit.ultimateActive ? 1.1 : 1),
    team: unit.team,
    owner: unit,
    dead: false,
    trail: []
  };

  state.bullets.push(projectile);
  unit.ammo -= 1;
  unit.shootCooldown = 1 / weapon.fireRate;
  unit.recoil = clamp(unit.recoil + 0.25, 0, 1.5);
  state.objective = unit.isPlayer ? 'Firing' : state.objective;
}

function applyDamage(target, projectile) {
  if (target.dead) {
    return;
  }

  let remaining = projectile.damage;
  if (target.armor > 0) {
    const absorbed = Math.min(target.armor, remaining * 0.6);
    target.armor -= absorbed;
    remaining -= absorbed;
  }

  remaining = Math.max(4, remaining * target.vulnerability);
  target.hp -= remaining;
  target.flash = 0.18;
  projectile.dead = true;
  projectile.owner.ultimateCharge = clamp(projectile.owner.ultimateCharge + remaining * 0.7, 0, 100);

  if (target.hp <= 0) {
    target.dead = true;
    target.hp = 0;
    target.carrying = false;
    projectile.owner.ultimateCharge = clamp(projectile.owner.ultimateCharge + 16, 0, 100);
    state.credits += projectile.owner.isPlayer ? 200 : 0;
    logMessage(`${projectile.owner.name} downed ${target.name}.`, projectile.owner.team === 'ally' ? 'green' : 'red');

    if (target.carrying && !state.planted) {
      state.carryDrop = { x: target.x, y: target.y, timer: 8 };
      logMessage('Artifact dropped.', 'amber');
    }

    const alliesAlive = getUnit('ally').some((unit) => !unit.dead);
    const enemiesAlive = getUnit('enemy').some((unit) => !unit.dead);

    if (!state.planted) {
      if (state.attackTeam === 'ally' && !alliesAlive) {
        awardRound('enemy', 'attackers eliminated');
      }
      if (state.attackTeam === 'enemy' && !enemiesAlive) {
        awardRound('ally', 'attackers eliminated');
      }
    }
  }
}

function plantArtifact(team, x, y) {
  state.planted = {
    team,
    x,
    y,
    timer: 15,
    defuse: 0,
    pulse: 0
  };
  state.carryDrop = null;
  logMessage(`${team === 'ally' ? 'Allies' : 'Enemies'} planted the artifact.`, 'amber');
  state.objective = 'Defuse or defend';
}

function defuseArtifact() {
  if (!state.planted) {
    return;
  }
  state.planted.defuse += 0.8;
  if (state.planted.defuse >= 4) {
    logMessage(`${state.planted.team === 'ally' ? 'Allies' : 'Enemies'}' artifact defused.`, 'cyan');
    awardRound(state.planted.team === 'ally' ? 'enemy' : 'ally', 'artifact defused');
    state.planted = null;
  }
}

function unitCellGoal(unit) {
  if (unit.team === state.attackTeam) {
    if (unit.carrying) {
      return cellFromPos(rectCenter(sites[state.attackSite]).x, rectCenter(sites[state.attackSite]).y);
    }
    if (state.carryDrop) {
      return cellFromPos(state.carryDrop.x, state.carryDrop.y);
    }
  }

  if (state.planted && unit.team !== state.planted.team) {
    return cellFromPos(state.planted.x, state.planted.y);
  }

  const enemy = nearestEnemy(unit);
  if (enemy) {
    return cellFromPos(enemy.x, enemy.y);
  }

  const target = getSiteTarget(unit);
  return target.cell;
}

function buildPath(unit, goalCell) {
  const start = cellFromPos(unit.x, unit.y);
  const path = pathfind(start, goalCell);
  unit.path = path;
  unit.pathIndex = 1;
}

function moveUnit(unit, dt) {
  if (unit.dead) {
    return;
  }

  let speed = unit.speed;
  if (unit.ultimateActive && unit.agentKey === 'web') {
    speed *= 1.35;
  }
  if (unit.ultimateActive && unit.agentKey === 'shadow') {
    speed *= 1.22;
  }
  if (unit.ultimateActive && unit.agentKey === 'iron') {
    speed *= 1.08;
  }

  const dx = unit.moveIntent.x * speed * dt;
  const dy = unit.moveIntent.y * speed * dt;

  if (dx !== 0) {
    const nextX = unit.x + dx;
    if (!pointBlocked(nextX, unit.y, unit.r)) {
      unit.x = nextX;
    }
  }

  if (dy !== 0) {
    const nextY = unit.y + dy;
    if (!pointBlocked(unit.x, nextY, unit.r)) {
      unit.y = nextY;
    }
  }

  unit.x = clamp(unit.x, unit.r + 1, MAP_W - unit.r - 1);
  unit.y = clamp(unit.y, unit.r + 1, MAP_H - unit.r - 1);
}

function useAbility(unit) {
  if (unit.dead || unit.abilityCooldown > 0) {
    return;
  }

  const aimAngle = getAimAngle(unit);
  const forward = { x: Math.cos(aimAngle), y: Math.sin(aimAngle) };

  if (unit.agentKey === 'iron') {
    const x = clamp(unit.x + forward.x * 42 - 20, 16, MAP_W - 60);
    const y = clamp(unit.y + forward.y * 42 - 12, 16, MAP_H - 60);
    state.effects.push({ type: 'screen', x, y, w: 56, h: 24, active: true, ttl: 8, team: unit.team });
    unit.abilityCooldown = 18;
    logMessage('Repulsor Screen deployed.', 'cyan');
    return;
  }

  if (unit.agentKey === 'web') {
    const distance = 150;
    const targetX = clamp(unit.x + forward.x * distance, unit.r + 2, MAP_W - unit.r - 2);
    const targetY = clamp(unit.y + forward.y * distance, unit.r + 2, MAP_H - unit.r - 2);
    if (!pointBlocked(targetX, targetY, unit.r)) {
      unit.x = targetX;
      unit.y = targetY;
      unit.dashTrail = 0.35;
      logMessage('Web Zip fired.', 'green');
    } else {
      logMessage('Web Zip blocked by cover.', 'amber');
    }
    unit.abilityCooldown = 13;
    return;
  }

  if (unit.agentKey === 'mystic') {
    const distance = 122;
    const targetX = clamp(unit.x + forward.x * distance, unit.r + 2, MAP_W - unit.r - 2);
    const targetY = clamp(unit.y + forward.y * distance, unit.r + 2, MAP_H - unit.r - 2);
    if (!pointBlocked(targetX, targetY, unit.r)) {
      unit.previousStates.push({ x: unit.x, y: unit.y, hp: unit.hp, armor: unit.armor });
      unit.previousStates = unit.previousStates.slice(-12);
      unit.x = targetX;
      unit.y = targetY;
      logMessage('Portal Step activated.', 'cyan');
    }
    unit.abilityCooldown = 14;
    return;
  }

  if (unit.agentKey === 'shadow') {
    const trapX = clamp(unit.x + forward.x * 60, TILE, MAP_W - TILE);
    const trapY = clamp(unit.y + forward.y * 60, TILE, MAP_H - TILE);
    state.traps.push({ x: trapX, y: trapY, team: unit.team, ttl: 18, armed: true, radius: 18 });
    unit.abilityCooldown = 15;
    logMessage('Vibranium Trap armed.', 'green');
  }
}

function useUltimate(unit) {
  if (unit.dead || unit.ultimateCharge < 100) {
    return;
  }

  unit.ultimateCharge = 0;
  if (unit.agentKey === 'iron') {
    unit.shield += 70;
    unit.ultimateActive = 8;
    logMessage('Overclock Armor online.', 'cyan');
    return;
  }

  if (unit.agentKey === 'web') {
    const angle = getAimAngle(unit);
    const distance = 220;
    unit.x = clamp(unit.x + Math.cos(angle) * distance, unit.r + 2, MAP_W - unit.r - 2);
    unit.y = clamp(unit.y + Math.sin(angle) * distance, unit.r + 2, MAP_H - unit.r - 2);
    for (const other of state.units) {
      if (!other.dead && other.team !== unit.team && dist(unit, other) < 92) {
        other.flash = 0.7;
        other.shootCooldown += 0.8;
      }
    }
    logMessage('Swing Break executed.', 'amber');
    return;
  }

  if (unit.agentKey === 'mystic') {
    const rewind = unit.previousStates.at(-1);
    if (rewind) {
      unit.x = rewind.x;
      unit.y = rewind.y;
      unit.hp = Math.max(rewind.hp, 1);
      unit.armor = rewind.armor;
      unit.previousStates = [];
      logMessage('Time Fold rewound the caster.', 'cyan');
    }
    return;
  }

  if (unit.agentKey === 'shadow') {
    unit.ultimateActive = 8;
    unit.stealth = 8;
    unit.speed += 20;
    logMessage('Hunter State engaged.', 'green');
  }
}

function maybeAutoUseUltimate(unit) {
  if (unit.ultimateCharge < 100) {
    return;
  }

  const enemy = nearestEnemy(unit);
  if (unit.isPlayer) {
    return;
  }

  if (unit.agentKey === 'iron' && enemy && dist(unit, enemy) < 210) {
    useUltimate(unit);
  }
  if (unit.agentKey === 'web' && enemy && dist(unit, enemy) < 240) {
    useUltimate(unit);
  }
  if (unit.agentKey === 'mystic' && unit.hp < unit.maxHp * 0.55) {
    useUltimate(unit);
  }
  if (unit.agentKey === 'shadow' && enemy && dist(unit, enemy) < 180) {
    useUltimate(unit);
  }
}

function botLogic(unit, dt) {
  if (unit.dead) {
    return;
  }

  const enemy = nearestEnemy(unit);
  const wantsAttack = unit.team === state.attackTeam;
  const shouldPlant = wantsAttack && unit.carrying && state.phase === 'round' && !state.planted;
  const goal = choosePathTarget(unit, enemy);

  if (state.planted && unit.team !== state.planted.team) {
    unit.target = { x: state.planted.x, y: state.planted.y };
  } else if (enemy && dist(unit, enemy) < 210 && !lineBlocked(unit, enemy)) {
    unit.target = { x: enemy.x, y: enemy.y };
  } else if (shouldPlant) {
    unit.target = getSiteTarget(unit);
  } else {
    unit.target = goal;
  }

  if (unit.abilityCooldown <= 0 && Math.random() < 0.0045) {
    useAbility(unit);
  }

  maybeAutoUseUltimate(unit);

  const target = unit.target;
  if (target && !lineBlocked(unit, target) && enemy && dist(unit, enemy) < unit.weapon.range) {
    unit.facing = Math.atan2(target.y - unit.y, target.x - unit.x);
    attemptShoot(unit, target);
  }

  if (!target || (enemy && dist(unit, enemy) < 140 && !lineBlocked(unit, enemy))) {
    unit.moveIntent = { x: 0, y: 0 };
    return;
  }

  const goalCell = cellFromPos(target.x, target.y);
  if (!unit.path.length || unit.pathIndex >= unit.path.length || Math.random() < 0.02) {
    buildPath(unit, goalCell);
  }

  const waypoint = unit.path[unit.pathIndex] ? centerOfCell(unit.path[unit.pathIndex].col, unit.path[unit.pathIndex].row) : target;
  const offset = { x: waypoint.x - unit.x, y: waypoint.y - unit.y };
  const len = Math.hypot(offset.x, offset.y) || 1;
  unit.moveIntent = { x: offset.x / len, y: offset.y / len };
  if (len < 16 && unit.pathIndex < unit.path.length - 1) {
    unit.pathIndex += 1;
  }
}

function playerLogic(dt) {
  const unit = state.playerUnit;
  if (!unit || unit.dead) {
    return;
  }

  const forward = vectorFromAngle(state.cameraAngle);
  const right = { x: -forward.y, y: forward.x };
  let moveX = 0;
  let moveY = 0;
  if (state.keys.has('KeyW') || state.keys.has('ArrowUp')) {
    moveX += forward.x;
    moveY += forward.y;
  }
  if (state.keys.has('KeyS') || state.keys.has('ArrowDown')) {
    moveX -= forward.x;
    moveY -= forward.y;
  }
  if (state.keys.has('KeyD') || state.keys.has('ArrowRight')) {
    moveX += right.x;
    moveY += right.y;
  }
  if (state.keys.has('KeyA') || state.keys.has('ArrowLeft')) {
    moveX -= right.x;
    moveY -= right.y;
  }

  const length = Math.hypot(moveX, moveY) || 1;
  unit.moveIntent = state.phase === 'round' || state.phase === 'buy' ? { x: moveX / length, y: moveY / length } : { x: 0, y: 0 };
  unit.facing = state.cameraAngle;
  state.cameraBob = clamp(state.cameraBob + length * dt * 2.8, 0, 1);

  if (state.phase === 'round') {
    const enemy = getPlayerCrosshairTarget();
    state.crosshairSpread = clamp(state.crosshairSpread + (state.fireHeld ? 0.03 : -0.02), 0, 1);
    if (state.fireHeld && enemy) {
      attemptShoot(unit, enemy);
    }

    if (state.keys.has('KeyE')) {
      unit.holdInteract += dt;
    } else {
      unit.holdInteract = 0;
    }

    if (unit.holdInteract > 0.32) {
      if (unit.team === state.attackTeam && unit.carrying && !state.planted) {
        const site = sites[state.attackSite];
        const center = rectCenter(site);
        if (dist(unit, center) < 80) {
          plantArtifact(unit.team, unit.x, unit.y);
          unit.carrying = false;
          unit.holdInteract = 0;
        }
      } else if (state.planted && unit.team !== state.planted.team && dist(unit, { x: state.planted.x, y: state.planted.y }) < 82) {
        defuseArtifact();
      }
    }
  } else {
    state.crosshairSpread = clamp(state.crosshairSpread - 0.03, 0, 1);
  }
}

function updateUnitState(unit, dt) {
  if (unit.dead) {
    return;
  }

  if (unit.shootCooldown > 0) unit.shootCooldown = Math.max(0, unit.shootCooldown - dt);
  if (unit.reload > 0) {
    unit.reload = Math.max(0, unit.reload - dt);
    if (unit.reload === 0 && unit.ammo <= 0) {
      unit.ammo = unit.weapon.mag;
      unit.reserve = Math.max(0, unit.reserve - unit.weapon.mag);
    }
  }

  if (unit.abilityCooldown > 0) unit.abilityCooldown = Math.max(0, unit.abilityCooldown - dt);
  if (unit.ultimateActive > 0) unit.ultimateActive = Math.max(0, unit.ultimateActive - dt);
  if (unit.stealth > 0) unit.stealth = Math.max(0, unit.stealth - dt);
  if (unit.flash > 0) unit.flash = Math.max(0, unit.flash - dt);
  if (unit.recoil > 0) unit.recoil = Math.max(0, unit.recoil - dt * 0.9);
  if (unit.dashTrail > 0) unit.dashTrail = Math.max(0, unit.dashTrail - dt);
  if (unit.reserve > 0 && unit.ammo <= 0 && unit.reload <= 0) {
    unit.reload = unit.weapon.reload;
  }

  if (unit.ultimateActive <= 0 && unit.agentKey === 'shadow') {
    unit.speed = AGENTS.shadow.speed;
  }

  if (unit.agentKey === 'mystic' && Math.random() < 0.04) {
    unit.previousStates.push({ x: unit.x, y: unit.y, hp: unit.hp, armor: unit.armor });
    unit.previousStates = unit.previousStates.slice(-12);
  }

  if (state.phase === 'round') {
    moveUnit(unit, dt);
  }
}

function updateProjectiles(dt) {
  for (const projectile of state.bullets) {
    if (projectile.dead) {
      continue;
    }

    const prevX = projectile.x;
    const prevY = projectile.y;
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.traveled += Math.hypot(projectile.x - prevX, projectile.y - prevY);

    if (projectile.traveled > projectile.range || pointBlocked(projectile.x, projectile.y, 2)) {
      projectile.dead = true;
      continue;
    }

    for (const effect of state.effects) {
      if (effect.type === 'screen' && effect.active && circleRectCollide(projectile.x, projectile.y, 2, effect.x, effect.y, effect.w, effect.h)) {
        projectile.dead = true;
        break;
      }
    }
    if (projectile.dead) {
      continue;
    }

    for (const unit of state.units) {
      if (unit.dead || unit.team === projectile.team) {
        continue;
      }

      const hitRadius = unit.r + 2;
      if (Math.hypot(unit.x - projectile.x, unit.y - projectile.y) <= hitRadius) {
        applyDamage(unit, projectile);
        if (unit.dead && projectile.owner.isPlayer) {
          state.credits += 200;
        }
        break;
      }
    }
  }

  state.bullets = state.bullets.filter((projectile) => !projectile.dead);
}

function updateEffects(dt) {
  state.effects.forEach((effect) => {
    effect.ttl -= dt;
    if (effect.ttl <= 0) {
      effect.active = false;
    }
  });
  state.effects = state.effects.filter((effect) => effect.active !== false);

  state.traps.forEach((trap) => {
    trap.ttl -= dt;
    if (trap.ttl <= 0) {
      trap.dead = true;
    }
  });

  for (const trap of state.traps) {
    if (trap.dead) {
      continue;
    }
    for (const unit of state.units) {
      if (unit.dead || unit.team === trap.team) {
        continue;
      }
      if (dist(unit, trap) < trap.radius + unit.r) {
        trap.dead = true;
        unit.flash = 0.8;
        unit.shootCooldown += 0.9;
        unit.moveIntent = { x: unit.moveIntent.x * 0.4, y: unit.moveIntent.y * 0.4 };
        logMessage('Trap triggered.', 'amber');
        break;
      }
    }
  }

  state.traps = state.traps.filter((trap) => !trap.dead);

  if (state.carryDrop) {
    state.carryDrop.timer -= dt;
    if (state.carryDrop.timer <= 0) {
      state.carryDrop = null;
    }
  }

  if (state.planted) {
    state.planted.timer -= dt;
    state.planted.pulse += dt;
    if (state.planted.timer <= 0) {
      awardRound(state.planted.team, 'artifact detonated');
      state.planted = null;
    }
  }
}

function updateRoundTimers(dt) {
  if (state.phase === 'buy') {
    state.buyTimer -= dt;
    if (state.buyTimer <= 0) {
      startRound();
    }
  }

  if (state.phase === 'round') {
    state.roundTimer -= dt;
    if (state.roundTimer <= 0) {
      if (!state.planted) {
        awardRound(state.attackTeam === 'ally' ? 'enemy' : 'ally', 'time expired');
      }
    }
  }
}

function updateBots(dt) {
  for (const unit of state.units) {
    if (!unit.isPlayer) {
      unit.nextThink -= dt;
      if (unit.nextThink <= 0) {
        unit.nextThink = rand(0.15, 0.35);
        botLogic(unit, dt);
      }
    }
  }
}

function updateState(dt) {
  if (state.phase === 'lobby' || state.phase === 'matchEnd') {
    return;
  }

  playerLogic(dt);
  updateBots(dt);

  for (const unit of state.units) {
    updateUnitState(unit, dt);
  }

  updateProjectiles(dt);
  updateEffects(dt);
  updateRoundTimers(dt);

  syncHud();
}

function drawArena() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const camera = getCameraPosition();
  const cameraAngle = state.cameraAngle;
  const fov = Math.PI / 3;

  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.58);
  sky.addColorStop(0, '#101f34');
  sky.addColorStop(0.55, '#0a1523');
  sky.addColorStop(1, '#060b12');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.58);

  const floor = ctx.createLinearGradient(0, canvas.height * 0.58, 0, canvas.height);
  floor.addColorStop(0, '#0b1524');
  floor.addColorStop(1, '#04070c');
  ctx.fillStyle = floor;
  ctx.fillRect(0, canvas.height * 0.58, canvas.width, canvas.height * 0.42);

  const siteA = sites.A;
  const siteB = sites.B;
  const objectives = [
    { x: siteA.x + siteA.w / 2, y: siteA.y + siteA.h / 2, color: 'rgba(75, 228, 255, 0.75)', radius: 9 },
    { x: siteB.x + siteB.w / 2, y: siteB.y + siteB.h / 2, color: 'rgba(255, 99, 127, 0.75)', radius: 9 }
  ];

  const wallColumns = Math.min(320, canvas.width);
  for (let column = 0; column < wallColumns; column += 1) {
    const screenX = (column / wallColumns) * canvas.width;
    const rayAngle = normalizeAngle(cameraAngle - fov / 2 + (column / wallColumns) * fov);
    const ray = rayStep(camera.x, camera.y, rayAngle, 1200);
    const corrected = ray.distance * Math.cos(angleDiff(rayAngle, cameraAngle));
    const wallHeight = clamp((TILE * 390) / Math.max(24, corrected), 8, canvas.height * 1.28);
    const top = canvas.height / 2 - wallHeight / 2;
    const shade = clamp(210 - corrected * 0.16, 30, 210);
    const fog = clamp(1 - corrected / 1000, 0.12, 1);
    ctx.fillStyle = `rgba(${Math.round(shade)}, ${Math.round(shade * 0.95)}, ${Math.round(shade * 1.12)}, ${fog})`;
    ctx.fillRect(screenX, top, canvas.width / wallColumns + 1.2, wallHeight);
  }

  const billboards = [];
  for (const unit of state.units) {
    if (unit.dead) continue;
    const proj = projectPoint(unit, camera.x, camera.y, cameraAngle, fov, canvas.width, canvas.height);
    if (!proj) continue;
    billboards.push({ type: 'unit', unit, proj });
  }

  for (const marker of objectives) {
    billboards.push({ type: 'objective', marker, proj: projectPoint(marker, camera.x, camera.y, cameraAngle, fov, canvas.width, canvas.height) });
  }

  if (state.planted) {
    billboards.push({ type: 'planted', marker: { x: state.planted.x / TILE, y: state.planted.y / TILE }, proj: projectPoint({ x: state.planted.x, y: state.planted.y }, camera.x, camera.y, cameraAngle, fov, canvas.width, canvas.height) });
  }

  if (state.carryDrop) {
    billboards.push({ type: 'drop', marker: { x: state.carryDrop.x, y: state.carryDrop.y }, proj: projectPoint({ x: state.carryDrop.x, y: state.carryDrop.y }, camera.x, camera.y, cameraAngle, fov, canvas.width, canvas.height) });
  }

  billboards.sort((a, b) => (b.proj?.distance ?? 0) - (a.proj?.distance ?? 0));

  for (const item of billboards) {
    const proj = item.proj;
    if (!proj) continue;
    const x = proj.x;
    const size = item.type === 'objective' ? 18 : item.type === 'drop' ? 18 : Math.min(canvas.height * 1.2, proj.size * 1.35);
    const top = canvas.height / 2 - size * 0.95;
    if (x < -80 || x > canvas.width + 80) continue;

    if (item.type === 'unit') {
      const unit = item.unit;
      const visible = canSee(camera, unit);
      ctx.save();
      ctx.globalAlpha = visible ? 1 : 0.45;
      ctx.fillStyle = unit.team === 'ally' ? 'rgba(75, 228, 255, 0.94)' : 'rgba(255, 99, 127, 0.94)';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.roundRect(x - size * 0.23, top, size * 0.46, size * 1.35, 8);
      ctx.fill();
      ctx.fillStyle = 'rgba(7, 17, 29, 0.72)';
      ctx.beginPath();
      ctx.roundRect(x - size * 0.15, top + size * 0.22, size * 0.3, size * 0.45, 7);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#eaf5ff';
      ctx.font = 'bold 12px Bahnschrift, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(unit.name.split(' ')[0], x, top + size * 1.52);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(x - size * 0.25, top - 12, size * 0.5, 4);
      ctx.fillStyle = '#3cff8a';
      ctx.fillRect(x - size * 0.25, top - 12, size * 0.5 * (unit.hp / unit.maxHp), 4);
      ctx.restore();
      continue;
    }

    if (item.type === 'planted') {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 214, 98, 0.95)';
      ctx.beginPath();
      ctx.arc(x, top + size * 0.72, 11 + Math.sin(performance.now() / 180) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }

    if (item.type === 'drop') {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 184, 77, 0.9)';
      ctx.beginPath();
      ctx.arc(x, top + size * 0.75, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }

    if (item.type === 'objective') {
      ctx.save();
      ctx.fillStyle = item.marker.color;
      ctx.beginPath();
      ctx.arc(x, top + size, item.marker.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (const projectile of state.bullets) {
    ctx.save();
    const proj = projectPoint(projectile, camera.x, camera.y, cameraAngle, fov, canvas.width, canvas.height);
    if (proj) {
      ctx.strokeStyle = projectile.team === 'ally' ? 'rgba(75, 228, 255, 0.9)' : 'rgba(255, 99, 127, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(proj.x, canvas.height / 2);
      ctx.lineTo(proj.x, canvas.height / 2 - 10);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (state.phase === 'round') {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.fillRect(18, 16, 325, 52);
    ctx.fillStyle = '#e8f2ff';
    ctx.font = 'bold 15px Bahnschrift, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Round ${state.round} | ${state.attackTeam === 'ally' ? 'Allies' : 'Enemies'} attacking site ${state.attackSite}`, 28, 36);
    ctx.fillStyle = 'rgba(234, 245, 255, 0.78)';
    ctx.font = '12px Bahnschrift, sans-serif';
    ctx.fillText('Mouse look · Click to lock · WASD move · E interact', 28, 55);
    ctx.restore();
  }

  if (state.planted) {
    const warn = Math.max(0, state.planted.timer);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(canvas.width - 190, 16, 168, 48);
    ctx.fillStyle = '#ffd26a';
    ctx.font = 'bold 17px Bahnschrift, sans-serif';
    ctx.fillText(`Detonation ${warn.toFixed(1)}s`, canvas.width - 176, 44);
    ctx.restore();
  }

  drawWeaponOverlay();
  drawCrosshair();
}

function loop(timestamp) {
  if (!loop.last) {
    loop.last = timestamp;
  }
  const dt = Math.min(0.033, (timestamp - loop.last) / 1000);
  loop.last = timestamp;

  updateState(dt);
  drawArena();
  requestAnimationFrame(loop);
}

canvas.addEventListener('click', async () => {
  if (state.phase === 'round' && !document.pointerLockElement) {
    try {
      await canvas.requestPointerLock();
      state.mouseCaptured = true;
    } catch {
      state.mouseCaptured = false;
    }
  }
});

document.addEventListener('pointerlockchange', () => {
  state.mouseCaptured = document.pointerLockElement === canvas;
});

window.addEventListener('mousemove', (event) => {
  if (state.mouseCaptured || (event.buttons === 1 && canvas.matches(':hover'))) {
    state.cameraAngle = normalizeAngle(state.cameraAngle + event.movementX * 0.0028);
  }
});

window.addEventListener('pointerdown', (event) => {
  if (event.button === 0) {
    state.fireHeld = true;
    if (state.phase === 'round' && !document.pointerLockElement) {
      canvas.requestPointerLock().catch(() => {});
    }
  }
});

window.addEventListener('pointerup', () => {
  state.fireHeld = false;
});

window.addEventListener('keydown', (event) => {
  state.keys.add(event.code);
  if ((event.code === 'Enter' || event.code === 'Space') && state.phase === 'lobby') {
    beginMatch();
    hideOverlay();
  }
  if ((event.code === 'Enter' || event.code === 'Space') && state.phase === 'buy') {
    startRound();
  }
  if (event.code === 'KeyQ' && state.phase === 'round' && state.playerUnit) {
    if (!state.playerUnit.qDown) {
      useAbility(state.playerUnit);
    }
    state.playerUnit.qDown = true;
  }
  if (event.code === 'KeyR' && state.phase === 'round' && state.playerUnit) {
    if (!state.playerUnit.rDown) {
      useUltimate(state.playerUnit);
    }
    state.playerUnit.rDown = true;
  }
  if (event.code === 'Escape' && document.pointerLockElement === canvas) {
    document.exitPointerLock();
  }
});

window.addEventListener('keyup', (event) => {
  state.keys.delete(event.code);
  if (event.code === 'KeyQ' && state.playerUnit) {
    state.playerUnit.qDown = false;
  }
  if (event.code === 'KeyR' && state.playerUnit) {
    state.playerUnit.rDown = false;
  }
  if (event.code === 'KeyE' && state.playerUnit) {
    state.playerUnit.holdInteract = 0;
  }
});

overlayButton.addEventListener('click', () => {
  if (state.phase === 'lobby') {
    beginMatch();
    hideOverlay();
    return;
  }

  if (state.phase === 'buy') {
    hideOverlay();
    startRound();
    return;
  }

  if (state.phase === 'matchEnd') {
    state.phase = 'lobby';
    state.round = 1;
    state.matchFinished = false;
    state.allyScore = 0;
    state.enemyScore = 0;
    state.credits = 800;
    state.lossStreak = 0;
    state.bullets = [];
    state.effects = [];
    state.traps = [];
    state.planted = null;
    state.carryDrop = null;
    state.logs = [];
    state.ownedWeapons = new Set(['v9', 'atlas']);
    state.playerWeapon = 'atlas';
    state.playerAgent = 'iron';
    renderRoster();
    renderWeapons();
    renderLoadout();
    syncHud();
    showOverlay('Artifact Strike', 'Choose an agent, buy a weapon, and launch the first round. The enemy squad will alternate between attack and defense to simulate the round-based flow from the docs.', 'Enter Match');
  }
});

startButton.addEventListener('click', () => {
  if (state.phase === 'lobby') {
    beginMatch();
    hideOverlay();
  } else if (state.phase === 'buy') {
    startRound();
  } else if (state.phase === 'matchEnd') {
    state.phase = 'lobby';
    state.round = 1;
    state.matchFinished = false;
    state.allyScore = 0;
    state.enemyScore = 0;
    state.credits = 800;
    state.lossStreak = 0;
    state.bullets = [];
    state.effects = [];
    state.traps = [];
    state.planted = null;
    state.carryDrop = null;
    state.logs = [];
    state.ownedWeapons = new Set(['v9', 'atlas']);
    state.playerWeapon = 'atlas';
    state.playerAgent = 'iron';
    renderRoster();
    renderWeapons();
    renderLoadout();
    syncHud();
    showOverlay('Artifact Strike', 'Choose an agent, buy a weapon, and launch the first round. The enemy squad will alternate between attack and defense to simulate the round-based flow from the docs.', 'Enter Match');
  }
});

document.addEventListener('contextmenu', (event) => event.preventDefault());

function init() {
  renderRoster();
  renderWeapons();
  renderLoadout();
  syncHud();
  logMessage('Prototype ready. Launch the match to begin.', 'cyan');
  requestAnimationFrame(loop);
}

init();
