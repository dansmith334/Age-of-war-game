const FACE_ASSETS = {
  tank: 'assets/faces/adult-man.png',
  support: 'assets/faces/older-woman-toddler.png',
  charger: 'assets/faces/angry-selfie-kid.png',
  runner: 'assets/faces/smiling-boy-car.png',
  commander: 'assets/faces/staircase-family-selfie.png',
  ranged: 'assets/faces/pink-haired-woman-phone.png',
  legend: 'assets/faces/gray-haired-older-man.png'
};

const UNIT_LIBRARY = {
  tank: { name: 'Tank Dad', role: 'tank', hp: 240, atk: 20, speed: 24, range: 28, rate: 0.9, cost: 45, face: 'tank', body: '#5f75ff' },
  runner: { name: 'Zoom Boy', role: 'runner', hp: 90, atk: 14, speed: 66, range: 22, rate: 0.5, cost: 28, face: 'runner', body: '#22c55e' },
  ranged: { name: 'Phone Mage', role: 'ranged', hp: 95, atk: 18, speed: 30, range: 170, rate: 1.15, projectile: 'bolt', cost: 42, face: 'ranged', body: '#ff5ca8' },
  charger: { name: 'Angry Dash', role: 'charger', hp: 125, atk: 26, speed: 32, range: 24, rate: 1.2, burst: true, cost: 50, face: 'charger', body: '#f97316' },
  support: { name: 'Nana Cheer', role: 'support', hp: 120, atk: 9, speed: 25, range: 120, rate: 1.5, heal: 16, cost: 48, face: 'support', body: '#14b8a6' },
  lobber: { name: 'Sock Lobber', role: 'lobber', hp: 112, atk: 22, speed: 24, range: 190, rate: 1.35, projectile: 'arc', cost: 56, face: 'runner', body: '#a855f7' },
  legend: { name: 'Grand Legend', role: 'legend', hp: 390, atk: 44, speed: 26, range: 160, rate: 1.0, projectile: 'bolt', cost: 140, face: 'legend', body: '#facc15' }
};

const PROTOTYPES = {
  A: {
    title: 'Prototype A — Classic Baseline',
    desc: 'Balanced energy, readable combat, small upgrades.',
    matchLen: 240,
    energyRate: 12,
    maxEnergy: 180,
    teamSizeCap: 18,
    spawnable: ['runner', 'tank', 'ranged', 'charger', 'support', 'lobber'],
    upgrades: [
      { id: 'eco', name: 'Eco +2/s', cost: 80, apply: s => s.mod.energyRate += 2 },
      { id: 'atk', name: 'Army +15% ATK', cost: 100, apply: s => s.mod.damageMul += 0.15 }
    ],
    enemy: { cadence: 2.5, cheapBias: 0.5, ramp: 0.06 }
  },
  B: {
    title: 'Prototype B — Fast Chaos',
    desc: 'Quick games, cheap swarms, goofy speed and particles.',
    matchLen: 160,
    energyRate: 23,
    maxEnergy: 220,
    teamSizeCap: 34,
    globalSpeed: 1.22,
    spawnable: ['runner', 'runner', 'charger', 'ranged', 'support'],
    upgrades: [{ id: 'frenzy', name: 'Frenzy +20% SPD', cost: 90, apply: s => s.mod.speedMul += 0.2 }],
    enemy: { cadence: 1.35, cheapBias: 0.78, ramp: 0.12 }
  },
  C: {
    title: 'Prototype C — Tech Tree',
    desc: 'Slower start, unlock tiers, stronger upgrade progression.',
    matchLen: 280,
    energyRate: 9,
    maxEnergy: 210,
    teamSizeCap: 20,
    spawnable: ['runner', 'support'],
    techTree: [
      { id: 'tier2', name: 'Unlock Tier 2', cost: 85, apply: s => s.unlock('tank', 'ranged') },
      { id: 'tier3', name: 'Unlock Tier 3', cost: 125, apply: s => s.unlock('charger', 'lobber') },
      { id: 'legend', name: 'Unlock Legend', cost: 170, apply: s => s.unlock('legend') },
      { id: 'eco', name: 'Eco +3/s', cost: 110, apply: s => s.mod.energyRate += 3 },
      { id: 'fort', name: 'Base HP +350', cost: 120, apply: s => s.playerBase.hp += 350 }
    ],
    enemy: { cadence: 2.7, cheapBias: 0.42, ramp: 0.08 }
  },
  D: {
    title: 'Prototype D — Hero Ability',
    desc: 'Distinct identities, fewer units, dramatic specials.',
    matchLen: 220,
    energyRate: 11,
    maxEnergy: 190,
    teamSizeCap: 14,
    spawnable: ['tank', 'ranged', 'support', 'legend'],
    abilities: [
      { id: 'meteor', name: 'Family Meteor', cd: 24, action: s => s.heroBlast(false) },
      { id: 'pepTalk', name: 'Pep Talk Heal', cd: 18, action: s => s.teamHeal(false) }
    ],
    enemy: { cadence: 2.3, cheapBias: 0.55, ramp: 0.1 }
  }
};

const $ = id => document.getElementById(id);
const canvas = $('battleCanvas');
const ctx = canvas.getContext('2d');
let game = null;

function createMenu() {
  const cards = $('prototypeCards');
  cards.innerHTML = '';
  Object.entries(PROTOTYPES).forEach(([key, p]) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h3>${p.title}</h3><p>${p.desc}</p><button>Play ${key}</button>`;
    card.querySelector('button').onclick = () => startPrototype(key);
    cards.appendChild(card);
  });
}

class BattleGame {
  constructor(kind) {
    this.kind = kind;
    this.rules = PROTOTYPES[kind];
    this.w = canvas.width;
    this.h = canvas.height;
    this.floorY = this.h - 60;
    this.t = 0;
    this.done = false;
    this.units = [];
    this.projectiles = [];
    this.particles = [];
    this.stats = { units: 0, dmg: 0 };
    this.enemyStats = { units: 0, dmg: 0 };
    this.playerBase = { x: 50, hp: 1700, max: 1700 };
    this.enemyBase = { x: this.w - 50, hp: 1700, max: 1700 };
    this.energy = 70;
    this.mod = { energyRate: 0, damageMul: 0, speedMul: 0 };
    this.unlocked = new Set(this.rules.spawnable);
    this.enemyEnergy = 90;
    this.enemyTimer = 0;
    this.last = performance.now();
    this.abilityCooldowns = {};
    (this.rules.abilities || []).forEach(a => this.abilityCooldowns[a.id] = 0);
    this.setupHud();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  setupHud() {
    const hud = $('hud');
    hud.innerHTML = '';
    this.buttons = [];
    const types = Object.keys(UNIT_LIBRARY).filter(k => this.unlocked.has(k));
    types.forEach(type => this.addUnitButton(type));

    (this.rules.upgrades || this.rules.techTree || []).forEach(item => {
      const b = document.createElement('button');
      b.textContent = `${item.name} (${item.cost})`;
      b.onclick = () => {
        if (this.done || this.energy < item.cost || item.used) return;
        this.energy -= item.cost;
        item.apply(this);
        item.used = true;
        b.disabled = true;
      };
      hud.appendChild(b);
      this.buttons.push({ type: null, el: b, cost: item.cost });
    });

    (this.rules.abilities || []).forEach(a => {
      const b = document.createElement('button');
      b.dataset.ability = a.id;
      b.onclick = () => {
        if (this.done || this.abilityCooldowns[a.id] > 0) return;
        a.action(this);
        this.abilityCooldowns[a.id] = a.cd;
      };
      hud.appendChild(b);
      this.buttons.push({ type: null, el: b, ability: a.id, cd: a.cd, name: a.name });
    });
  }

  addUnitButton(type) {
    const unit = UNIT_LIBRARY[type];
    const wrap = document.createElement('button');
    wrap.className = 'unit-btn';
    wrap.innerHTML = `<img src="${FACE_ASSETS[unit.face]}" alt="${unit.name}"><div><div>${unit.name}</div><div class="meta">${unit.cost} energy</div></div>`;
    wrap.onclick = () => this.spawn(false, type);
    $('hud').appendChild(wrap);
    this.buttons.push({ type, el: wrap, cost: unit.cost });
  }

  unlock(...types) {
    let changed = false;
    types.forEach(t => { if (!this.unlocked.has(t)) { this.unlocked.add(t); changed = true; } });
    if (!changed) return;
    this.setupHud();
  }

  spawn(enemy, type) {
    const team = enemy ? -1 : 1;
    const refEnergy = enemy ? 'enemyEnergy' : 'energy';
    const unit = UNIT_LIBRARY[type];
    if (!unit) return false;
    if (!enemy && !this.unlocked.has(type)) return false;
    if (this[refEnergy] < unit.cost) return false;
    if (this.units.filter(u => u.team === team).length >= this.rules.teamSizeCap) return false;
    this[refEnergy] -= unit.cost;
    const x = enemy ? this.w - 110 : 110;
    this.units.push({
      ...structuredClone(unit),
      type,
      team,
      hp: unit.hp,
      max: unit.hp,
      x,
      y: this.floorY,
      attackCd: 0,
      burstCd: 0,
      wobble: Math.random() * 10
    });
    (enemy ? this.enemyStats : this.stats).units++;
    return true;
  }

  heroBlast(enemy) {
    this.units.forEach(u => {
      if (u.team === (enemy ? 1 : -1)) {
        this.hit(u, 60 + (u.role === 'legend' ? 20 : 0), enemy);
        this.particles.push({ x: u.x, y: u.y - 40, life: .5, color: '#ffb703', r: 20 });
      }
    });
  }

  teamHeal(enemy) {
    this.units.forEach(u => {
      if (u.team === (enemy ? -1 : 1)) {
        u.hp = Math.min(u.max, u.hp + 42);
        this.particles.push({ x: u.x, y: u.y - 32, life: .6, color: '#74ffd2', r: 10 });
      }
    });
  }

  hit(target, dmg, enemyDid) {
    const d = dmg * (enemyDid ? 1 : (1 + this.mod.damageMul));
    target.hp -= d;
    this.particles.push({ x: target.x, y: target.y - 32, life: .25, color: '#ffffff', r: 8 });
    (enemyDid ? this.enemyStats : this.stats).dmg += Math.round(d);
  }

  update(dt) {
    if (this.done) return;
    const speed = this.rules.globalSpeed || 1;
    dt *= speed;
    this.t += dt;
    const rate = this.rules.energyRate + this.mod.energyRate;
    this.energy = Math.min(this.rules.maxEnergy, this.energy + rate * dt);
    this.enemyEnergy = Math.min(this.rules.maxEnergy + 40, this.enemyEnergy + (this.rules.energyRate * 0.95) * dt);
    this.enemyTimer -= dt;
    if (this.enemyTimer <= 0) {
      this.enemyThink();
      this.enemyTimer = Math.max(.6, this.rules.enemy.cadence - this.t * this.rules.enemy.ramp * 0.02);
    }

    this.units.forEach(u => {
      u.attackCd -= dt;
      u.burstCd -= dt;
      const foes = this.units.filter(v => v.team !== u.team);
      const nearest = foes.sort((a, b) => Math.abs(a.x - u.x) - Math.abs(b.x - u.x))[0];
      const enemyBase = u.team === 1 ? this.enemyBase : this.playerBase;
      const distBase = Math.abs(enemyBase.x - u.x);
      let target = nearest;
      let dist = nearest ? Math.abs(nearest.x - u.x) : 9999;
      if (!target || distBase < dist) {
        target = enemyBase;
        dist = distBase;
      }

      const supportFront = this.units.filter(v => v.team === u.team && v.role !== 'support').reduce((m, v) => u.team === 1 ? Math.max(m, v.x) : Math.min(m, v.x), u.team === 1 ? -1 : this.w + 1);
      if (u.role === 'support' && supportFront > 0) {
        const desired = supportFront - u.team * 70;
        const d = desired - u.x;
        if (Math.abs(d) > 6) u.x += Math.sign(d) * u.speed * .65 * dt * u.team;
      } else if (dist > u.range) {
        let mv = u.speed * (1 + this.mod.speedMul) * dt * u.team;
        if (u.burst && u.burstCd <= 0) { mv *= 3.1; u.burstCd = 2.4; }
        if (u.role === 'ranged' && nearest && dist < u.range * 0.7) mv *= -0.45;
        u.x += mv;
      } else if (u.attackCd <= 0) {
        if (u.heal) {
          const ally = this.units.find(v => v.team === u.team && v.hp < v.max);
          if (ally) ally.hp = Math.min(ally.max, ally.hp + u.heal);
          this.particles.push({ x: u.x, y: u.y - 42, life: .5, color: '#8ef7d7', r: 11 });
        }
        if (u.atk > 0) {
          if (u.projectile) {
            this.projectiles.push({
              team: u.team,
              x: u.x,
              y: u.y - 45,
              target,
              dmg: u.atk,
              kind: u.projectile,
              t: 0
            });
          } else {
            if ('hp' in target) this.hit(target, u.atk, u.team === -1);
          }
        }
        u.attackCd = u.rate;
      }
    });

    this.projectiles.forEach(p => {
      p.t += dt * 3;
      if (!p.target || p.target.hp <= 0 || p.t >= 1) {
        p.dead = true;
        if (p.target && p.target.hp > 0) this.hit(p.target, p.dmg, p.team === -1);
      } else {
        const tx = p.target.x;
        const ty = p.target.y ? p.target.y - 40 : this.floorY - 20;
        p.x += (tx - p.x) * 0.15;
        p.y += (ty - p.y) * 0.15 - (p.kind === 'arc' ? Math.sin(p.t * Math.PI) * 6 : 0);
      }
    });

    this.units = this.units.filter(u => u.hp > 0 && u.x > 20 && u.x < this.w - 20);
    this.projectiles = this.projectiles.filter(p => !p.dead);
    this.particles.forEach(p => p.life -= dt);
    this.particles = this.particles.filter(p => p.life > 0);

    this.baseContact();
    this.tickAbilities(dt);
    this.updateHud();
    if (this.playerBase.hp <= 0 || this.enemyBase.hp <= 0 || this.t >= this.rules.matchLen) this.finish();
  }

  baseContact() {
    this.units.forEach(u => {
      if (u.team === 1 && u.x > this.enemyBase.x - 26 && u.attackCd <= 0) {
        this.enemyBase.hp -= u.atk * 0.9;
        u.attackCd = u.rate;
      }
      if (u.team === -1 && u.x < this.playerBase.x + 26 && u.attackCd <= 0) {
        this.playerBase.hp -= u.atk * 0.9;
        u.attackCd = u.rate;
      }
    });
  }

  tickAbilities(dt) {
    Object.keys(this.abilityCooldowns).forEach(k => this.abilityCooldowns[k] = Math.max(0, this.abilityCooldowns[k] - dt));
    if (this.kind === 'D' && Math.random() < dt * 0.04) {
      if (Math.random() < 0.5) this.heroBlast(true);
      else this.teamHeal(true);
    }
  }

  enemyThink() {
    const avail = this.kind === 'C'
      ? ['runner', 'support', ...(this.t > 55 ? ['tank', 'ranged'] : []), ...(this.t > 120 ? ['charger', 'lobber'] : []), ...(this.t > 180 ? ['legend'] : [])]
      : this.rules.spawnable;
    const cheap = avail.filter(t => UNIT_LIBRARY[t].cost <= 50);
    const pool = Math.random() < this.rules.enemy.cheapBias ? cheap : avail;
    const pick = pool[Math.floor(Math.random() * pool.length)] || avail[0];
    this.spawn(true, pick);
    if (this.kind === 'B' && Math.random() < 0.45) this.spawn(true, cheap[Math.floor(Math.random() * cheap.length)] || 'runner');
  }

  draw() {
    ctx.clearRect(0, 0, this.w, this.h);
    // bases
    this.drawBase(this.playerBase, false);
    this.drawBase(this.enemyBase, true);
    // ground markers
    ctx.fillStyle = '#00000018';
    for (let i = 100; i < this.w - 100; i += 60) ctx.fillRect(i, this.floorY + 2, 24, 5);

    this.units.forEach(u => this.drawUnit(u));
    this.projectiles.forEach(p => {
      ctx.fillStyle = p.kind === 'arc' ? '#ff5d73' : '#ffe066';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.kind === 'arc' ? 8 : 5, 0, Math.PI * 2);
      ctx.fill();
    });
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life * 1.2);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1 - p.life * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  drawBase(base, enemy) {
    ctx.fillStyle = enemy ? '#75274f' : '#244a7e';
    ctx.fillRect(base.x - 35, this.floorY - 120, 70, 120);
    ctx.fillStyle = '#f8f9ff';
    ctx.fillRect(base.x - 43, this.floorY - 144, 86, 10);
    const hpPct = Math.max(0, base.hp / base.max);
    ctx.fillStyle = hpPct > .4 ? '#56f58a' : '#ff5d73';
    ctx.fillRect(base.x - 43, this.floorY - 144, 86 * hpPct, 10);
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText(enemy ? 'Enemy Base' : 'Your Base', base.x - 33, this.floorY - 152);
  }

  drawUnit(u) {
    const dir = u.team === 1 ? 1 : -1;
    const bob = Math.sin(this.t * 6 + u.wobble) * 2;
    ctx.fillStyle = u.body;
    ctx.fillRect(u.x - 10, u.y - 32 + bob, 20, 26);
    ctx.fillStyle = '#222';
    ctx.fillRect(u.x - 13 * dir, u.y - 9, 26, 6);
    const img = imageCache[FACE_ASSETS[u.face]];
    if (img) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(u.x, u.y - 42 + bob, 13, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, u.x - 13, u.y - 55 + bob, 26, 26);
      ctx.restore();
    } else {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(u.x, u.y - 42 + bob, 13, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#0007';
    ctx.fillRect(u.x - 14, u.y - 59, 28, 5);
    ctx.fillStyle = '#7dff8b';
    ctx.fillRect(u.x - 14, u.y - 59, 28 * Math.max(0, u.hp / u.max), 5);
  }

  updateHud() {
    $('matchInfo').textContent = `${this.rules.title} | Energy ${Math.floor(this.energy)} | Time ${Math.floor(this.t)}s`;
    this.buttons.forEach(b => {
      if (b.type) {
        b.el.disabled = this.done || this.energy < b.cost;
      } else if (b.ability) {
        const c = this.abilityCooldowns[b.ability];
        b.el.textContent = c > 0 ? `${b.name} (${c.toFixed(1)}s)` : b.name;
        b.el.disabled = c > 0 || this.done;
      } else {
        b.el.disabled = b.el.disabled || this.done || this.energy < b.cost;
      }
    });
  }

  finish() {
    this.done = true;
    const victory = this.enemyBase.hp <= 0 || this.playerBase.hp > this.enemyBase.hp;
    $('resultOverlay').classList.remove('hidden');
    $('resultTitle').textContent = victory ? 'Victory 🎉' : 'Defeat 😅';
    $('resultStats').textContent = `${this.rules.title}\nDuration: ${Math.floor(this.t)}s\nYour damage: ${this.stats.dmg}\nYour units spawned: ${this.stats.units}`;
  }

  loop(now) {
    const dt = Math.min(0.04, (now - this.last) / 1000);
    this.last = now;
    this.update(dt);
    this.draw();
    if (!this.stop) requestAnimationFrame(this.loop);
  }

  destroy() {
    this.stop = true;
  }
}

const imageCache = {};
Object.values(FACE_ASSETS).forEach(src => {
  const img = new Image();
  img.src = src;
  imageCache[src] = img;
});

function startPrototype(key) {
  $('menu').classList.remove('active');
  $('game').classList.add('active');
  $('resultOverlay').classList.add('hidden');
  if (game) game.destroy();
  Object.values(PROTOTYPES).forEach(p => {
    [...(p.upgrades || []), ...(p.techTree || [])].forEach(u => { u.used = false; });
  });
  game = new BattleGame(key);
  window.currentPrototype = key;
}

$('backBtn').onclick = () => {
  if (game) game.destroy();
  $('game').classList.remove('active');
  $('menu').classList.add('active');
};
$('menuBtn').onclick = () => $('backBtn').click();
$('restartBtn').onclick = () => startPrototype(window.currentPrototype || 'A');

createMenu();
