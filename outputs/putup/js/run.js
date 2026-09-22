'use strict';
/* Putup · Minijuego "Salto neón": tres carriles, bloques que se saltan, muros que se esquivan
   y estrellas que se encadenan en rachas. */

const LANE_W = 1.9, RUN_TIME = 35, INTRO = 2.4, OUTRO = 1.6, PLAYER_Z = 2, GRAVITY = 20, JUMP_V = 8;
const CITY_SPAN = 154;

const THEMES = {
  night: {
    sky: ['#0b0a26', '#2a1553', '#c2407e'], fog: [58, 28, 92], sun: ['#ffe07a', '#ff4f9a'], ground: '140d2c',
    grid: 'd24fff', track: ['373c68', '41477a'], rail: 'b7f675', lane: 'c7d2ee', mountains: ['#1c1240', '#2b1a55'],
    building: ['241f48', '2c2656', '1f1a40'], windows: ['ffd98a', '8ee8ff', 'ff9ad0'], trim: ['2ee6ff', 'ff5fd2'],
  },
  sunset: {
    sky: ['#2b1a4d', '#c2507a', '#ffb36b'], fog: [196, 104, 118], sun: ['#fff4b0', '#ff6f4f'], ground: '3a1a3e',
    grid: 'ffb36b', track: ['9e6a80', 'ab788d'], rail: 'ffd36e', lane: 'ffe6c8', mountains: ['#5a2a5e', '#7a3a6a'],
    building: ['6b3a6b', '7a4474', '5e3260'], windows: ['ffe6a0', 'fff3c9', 'ffb36b'], trim: ['ffd36e', 'ff7ab5'],
  },
};
const theme = () => THEMES[save.theme] || THEMES.night;

let run = null;

function buildCity() {
  const list = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 14; i++) {
      const w = 2 + Math.random() * 2.5;
      list.push({ side, w, h: 3 + Math.random() * 9, d: 3 + Math.random() * 4, x: side * (8 + Math.random() * 6 + w / 2),
        z: -i * 11 - Math.random() * 4, c: i % 3, seed: Math.random() * 100, trim: Math.random() < 0.5 });
    }
  }
  return list;
}

function startRun() {
  closeModal();
  clearEffects();
  mode = 'run';
  run = {
    time: 0, clock: 0, intro: INTRO, outro: 0, go: 0, beep: 0,
    x: 0, lane: 0, y: 0, vy: 0, speed: 12, dist: 0, walk: 0, tilt: 0, jumpHeld: false, buffer: 0,
    score: 0, hits: 0, stars: 0, combo: 0, bestCombo: 0, inv: 0, shake: 0, flash: 0,
    objects: [], next: 1.3, events: [], city: buildCity(),
  };
  setModeUI();
  Sound.startMusic();
}

const playing = () => mode === 'run' && run && run.intro <= 0 && run.outro <= 0;

function doJump() {
  run.vy = JUMP_V;
  run.jumpHeld = true;
  Sound.jump();
  emit([run.x, 0.05, PLAYER_Z], 6, { color: 'c7d2ee', speed: 1.5, up: 0.6, gravity: 3, life: 0.4, size: 0.05, alpha: 0.6 });
}
function jump() {
  if (!playing()) return false;
  if (run.y <= 0.01 && !run.jumpHeld) { doJump(); return true; }
  if (run.y > 0.01) run.buffer = 0.15; // se ejecuta al aterrizar
  return false;
}
function releaseJump() { if (run) run.jumpHeld = false; }
function steer(dir) {
  if (!playing()) return;
  const lane = clamp(run.lane + dir, -1, 1);
  if (lane !== run.lane) { run.lane = lane; run.tilt = dir; Sound.lane(); }
}

const comboMult = c => Math.min(4, 1 + Math.floor(c / 3));
const stamp = t => '00:' + String(Math.floor(t)).padStart(2, '0');

function addEvent(text, icon, weight) {
  if (run.events.some(e => e.text === text && run.time - e.t < 4)) return;
  run.events.push({ t: run.time, text, icon, weight });
}

function spawnWave() {
  const r = run, lane = Math.floor(Math.random() * 3) - 1, z = -34;
  const wall = r.time > 8 && Math.random() < 0.28;
  const blocked = [lane];
  r.objects.push({ type: wall ? 'wall' : 'block', x: lane * LANE_W, z, hit: false });
  if (!wall && r.time > 16 && Math.random() < 0.35) {
    const other = [-1, 0, 1].filter(l => l !== lane)[Math.floor(Math.random() * 2)];
    blocked.push(other);
    r.objects.push({ type: 'block', x: other * LANE_W, z, hit: false });
  }
  const roll = Math.random();
  if (!wall && roll < 0.4) {
    r.objects.push({ type: 'star', x: lane * LANE_W, z, y: 1.95, hit: false }); // premio por saltar el bloque
  } else {
    const free = [-1, 0, 1].filter(l => !blocked.includes(l)), sl = free[Math.floor(Math.random() * free.length)];
    const trail = roll > 0.78 ? 3 : 1;
    for (let i = 0; i < trail; i++) {
      r.objects.push({ type: 'star', x: sl * LANE_W, z: z - 3 - i * 1.6, y: trail > 1 || Math.random() < 0.5 ? 0.9 : 1.7, hit: false });
    }
  }
}

function crash(o) {
  const r = run;
  o.hit = true;
  r.hits++;
  r.inv = 1.1;
  r.combo = 0;
  r.shake = REDUCED_MOTION ? 0 : 0.5;
  r.flash = 1;
  const colors = o.type === 'wall' ? ['e2508f', 'ff9ad0', 'ffffff'] : ['f1a078', 'ffcf9e', 'c9674a'];
  emit([o.x, 0.6, o.z], 18, { color: colors, speed: 5, up: 4, gravity: 14, life: 0.9, size: 0.09 });
  popup([r.x, 2.3, PLAYER_Z], '¡Choque!', '#ff8a7a', 26);
  Sound.hit();
  if (r.hits === 1) addEvent('Un choque inesperado… ¡y seguimos!', '💥', 1);
}
function collect(o) {
  const r = run, y = o.y ?? 1.7;
  o.hit = true;
  r.stars++;
  r.combo++;
  r.bestCombo = Math.max(r.bestCombo, r.combo);
  const mult = comboMult(r.combo);
  r.score += 100 * mult;
  emit([o.x, y, o.z], 14, { color: ['f7e36b', 'b7f675', 'ffffff'], speed: 3.5, up: 2.5, gravity: 4, life: 0.6, size: 0.07, glow: 8 });
  popup([o.x, y + 0.45, o.z], mult > 1 ? `+${100 * mult}  ×${mult}` : '+100', '#f7e36b');
  Sound.star(r.combo);
  if (y > 1.5) addEvent('Una estrella en pleno salto', '★', 2);
  if (r.combo === 3 || r.combo === 6 || r.combo === 10) addEvent(`Racha de ${r.combo} estrellas seguidas`, '🔥', 3 + r.combo / 3);
}

function moveWorld(dt) {
  const r = run, v = r.speed * dt;
  r.dist += v;
  for (const o of r.objects) o.z += v;
  r.objects = r.objects.filter(o => o.z < 12);
  for (const b of r.city) {
    b.z += v;
    if (b.z - b.d / 2 > 14) { b.z -= CITY_SPAN; b.h = 3 + Math.random() * 9; b.seed = Math.random() * 100; }
  }
}

function updateRun(dt) {
  const r = run;
  r.clock += dt;
  r.shake = Math.max(0, r.shake - dt * 2.2);
  r.flash = Math.max(0, r.flash - dt * 2.5);
  r.go = Math.max(0, r.go - dt);
  r.tilt = damp(r.tilt, 0, 8, dt);
  updateParticles(dt, r.intro > 0 ? 0 : r.speed * 0.8);
  updatePopups(dt);
  if (r.intro > 0) {
    r.intro -= dt;
    const n = Math.ceil(r.intro / (INTRO / 3));
    if (r.intro <= 0) { r.go = 0.7; Sound.beep(true); }
    else if (n !== r.beep) { r.beep = n; Sound.beep(false); }
    return;
  }
  if (r.outro > 0) {
    r.outro -= dt;
    moveWorld(dt * 0.2);
    if (r.outro <= 0) endRun();
    return;
  }
  r.time += dt;
  r.speed = 12 + Math.min(r.time, RUN_TIME) * 0.15;
  r.inv = Math.max(0, r.inv - dt);
  r.buffer = Math.max(0, r.buffer - dt);
  moveWorld(dt);
  // Carril y salto.
  r.x += (r.lane * LANE_W - r.x) * Math.min(1, dt * 14);
  const airborne = r.y > 0;
  r.vy -= GRAVITY * dt;
  r.y = Math.max(0, r.y + r.vy * dt);
  if (r.y === 0 && r.vy < 0) {
    r.vy = 0;
    if (airborne) {
      Sound.land();
      emit([r.x, 0.05, PLAYER_Z], 8, { color: 'c7d2ee', speed: 2, up: 0.8, gravity: 4, life: 0.45, size: 0.05, alpha: 0.6 });
      if (r.buffer > 0) { r.buffer = 0; doJump(); }
    }
  }
  r.walk += dt * r.speed * 0.9;
  if (comboMult(r.combo) > 1 && Math.random() < 0.6) {
    emit([r.x + rand(-0.2, 0.2), r.y + 0.8, PLAYER_Z + 0.2], 1, { color: 'b7f675', speed: 0.4, up: 0.4, gravity: 0, life: 0.4, size: 0.045, glow: 6 });
  }
  // Oleadas y colisiones.
  if (r.time > r.next) { r.next += 1.02; spawnWave(); }
  for (const o of r.objects) {
    if (o.hit || Math.abs(o.z - PLAYER_Z) > 0.65 || Math.abs(o.x - r.x) > 0.7) continue;
    if (o.type === 'star') {
      const y = o.y ?? 1.7;
      if (r.y + 1.15 > y && y > r.y - 0.3) collect(o);
    } else if (o.type === 'block' && r.y >= 0.95) {
      o.hit = true;
      o.cleared = true;
      r.score += 50;
      popup([o.x, 1.6, o.z], '+50', '#b7f675', 18);
      addEvent('Salto perfecto sobre un bloque', '↗', 2);
    } else if (r.inv === 0) {
      crash(o);
    }
  }
  if (r.time >= RUN_TIME) {
    r.outro = OUTRO;
    Sound.finish();
    Sound.stopMusic();
  }
}

/** Los 5 mejores momentos, primero uno de cada tipo para que el montaje sea variado. */
function pickMoments(events, max = 5) {
  const ranked = events.slice().sort((a, b) => b.weight - a.weight || a.t - b.t), picked = [], seen = new Set();
  for (const e of ranked) if (picked.length < max && !seen.has(e.text)) { picked.push(e); seen.add(e.text); }
  for (const e of ranked) if (picked.length < max && !picked.includes(e)) picked.push(e);
  return picked.sort((a, b) => a.t - b.t).map(({ t, text, icon }) => ({ t, text, icon }));
}

function endRun() {
  const r = run;
  mode = 'home';
  Sound.stopMusic();
  clearEffects();
  setModeUI();
  finishRecording('neon', {
    score: r.score, stars: r.stars, hits: r.hits, bestCombo: r.bestCombo, events: r.events,
    summary: [`★ ${r.stars} estrellas`, `✕ ${r.hits} choques`, `${fmt(r.score)} puntos`, ...(r.bestCombo >= 3 ? [`🔥 racha de ${r.bestCombo}`] : [])],
    suggest: r.stars >= 10 ? `¡${r.stars} estrellas en Salto neón!` : '¡Mi desafío de saltos en Putup!',
  });
}
function abandonRun() {
  mode = 'home';
  Sound.stopMusic();
  clearEffects();
  setModeUI();
  closeModal();
  toast('Partida descartada. ¡A por la siguiente!');
}
