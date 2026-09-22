'use strict';
/* Putup · Biblioteca de juegos del ordenador y marco común de los minijuegos arcade:
   cuenta atrás, cronómetro, marcador, momentos grabados, pausa y final de partida. */

const GAMES = [
  { id: 'neon', name: 'Salto neón', tag: 'CARRERAS 3D · 35 S', icon: '🏃', desc: 'Salta bloques, esquiva muros y encadena estrellas.' },
  { id: 'ritmo', name: 'Ritmo pixel', tag: 'MÚSICA · 32 S', icon: '🎵', desc: 'Pulsa las flechas justo al llegar a la línea. ¡Busca el combo perfecto!' },
  { id: 'serpiente', name: 'Serpiente de likes', tag: 'RETRO · 45 S', icon: '🐍', desc: 'Come likes para crecer sin chocar con los bordes ni contigo.' },
  { id: 'polenom', name: 'Polenom', tag: 'CARTAS · COMBATE', icon: '🃏', desc: 'Colecciona criaturas, abre sobres y combate por turnos contra un rival.' },
  { id: 'orbita', name: 'Órbita viral', tag: 'ESPACIO · 45 S', icon: '🚀', fresh: true, medals: [500, 1400, 2600], desc: 'Pilota tu nave, rompe asteroides y recupera cristales. Tu escudo puede salvarte.' },
  { id: 'memoria', name: 'Memoria viral', tag: 'INGENIO · 60 S', icon: '🧠', fresh: true, medals: [900, 2300, 4000], desc: 'Encuentra las parejas en tres tableros. Memoriza, encadena aciertos y usa tus pistas.' },
];
const gameById = id => GAMES.find(g => g.id === id) || GAMES[0];
const ARCADES = {}; // ritmo.js y serpiente.js se registran aquí
const ARCADE_INTRO = 2.4, ARCADE_OUTRO = 1.5;

function launchGame(id) {
  if (id === 'neon') startRun();
  else if (id === 'polenom') polenomMenu();
  else if (gameById(id).fresh) gameBriefing(id);
  else startArcade(id);
}

/** Medallas calculadas con el récord: sobreviven al recargar sin otra copia del progreso. */
function gameMedal(id, score) {
  const goals = gameById(id).medals;
  return goals ? goals.filter(goal => score >= goal).length : 0;
}

/** Cierra una partida: guarda el récord y abre el editor (o el resumen si era práctica). */
function finishRecording(gameId, r) {
  save.records[gameId] = Math.max(save.records[gameId] || 0, r.score);
  if (gameId === 'neon') save.best = Math.max(save.best, r.score);
  persist();
  if (!record) { practiceResult(gameId, r); return; }
  pending = {
    game: gameId, score: r.score, stars: r.stars, hits: r.hits, bestCombo: r.bestCombo || 0,
    events: pickMoments(r.events || [], momentSlots()), summary: r.summary || null, suggest: r.suggest || null,
  };
  thumb = 0;
  editor();
}

/* ---------- Marco arcade ---------- */
let arcade = null;
const sparks = [];

function startArcade(id) {
  if (!ARCADES[id]) { toast('Ese juego todavía no está disponible.'); return; }
  closeModal();
  clearEffects();
  sparks.length = 0;
  mode = 'arcade';
  arcade = { id, def: ARCADES[id], time: 0, clock: 0, intro: ARCADE_INTRO, beep: 0, go: 0, outro: 0, message: '', events: [], flash: 0, shake: 0 };
  arcade.s = arcade.def.init(arcade);
  setModeUI();
  Sound.startMusic();
}
const arcadePlaying = () => mode === 'arcade' && arcade && arcade.intro <= 0 && arcade.outro <= 0;
function arcadeEvent(text, icon, weight) {
  const a = arcade;
  if (a.events.some(e => e.text === text && a.time - e.t < 4)) return;
  a.events.push({ t: a.time, text, icon, weight });
}
/** Termina la partida antes de tiempo (o al acabar el reloj) con un mensaje grande. */
function arcadeOver(message) {
  if (arcade.outro > 0) return;
  arcade.outro = ARCADE_OUTRO;
  arcade.message = message;
  Sound.finish();
  Sound.stopMusic();
}
function updateArcade(dt) {
  const a = arcade;
  a.clock += dt;
  a.flash = Math.max(0, a.flash - dt * 2.5);
  a.shake = Math.max(0, a.shake - dt * 2.2);
  a.go = Math.max(0, a.go - dt);
  updateSparks(dt);
  if (a.intro > 0) {
    a.intro -= dt;
    const n = Math.ceil(a.intro / (ARCADE_INTRO / 3));
    if (a.intro <= 0) { a.go = 0.7; Sound.beep(true); }
    else if (n !== a.beep) { a.beep = n; Sound.beep(false); }
    return;
  }
  if (a.outro > 0) {
    a.outro -= dt;
    if (a.outro <= 0) endArcade();
    return;
  }
  a.time += dt;
  a.def.update(a.s, dt, a);
  if (a.time >= a.def.duration) arcadeOver('¡TIEMPO!');
}
function endArcade() {
  const a = arcade, r = a.def.result(a.s, a);
  mode = 'home';
  arcade = null;
  Sound.stopMusic();
  clearEffects();
  setModeUI();
  finishRecording(a.id, { ...r, events: a.events });
}
function abandonGame() {
  if (mode === 'run') { abandonRun(); return; }
  mode = 'home';
  arcade = null;
  Sound.stopMusic();
  setModeUI();
  closeModal();
  toast('Partida descartada. ¡A por la siguiente!');
}
function arcadeKey(code) { if (arcadePlaying() && arcade.def.key) arcade.def.key(arcade.s, code, arcade); }
function arcadePointer(x, y, dx, dy) { if (arcadePlaying() && arcade.def.pointer) arcade.def.pointer(arcade.s, x, y, dx, dy, arcade); }

/** Verdadero cuando se está jugando con el dedo: las instrucciones no pueden hablar
    de teclas que en un teléfono no existen. */
function touchUI() {
  return typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
}
/** Texto según el mando: el primero para el dedo, el segundo para el teclado. */
const byInput = (dedo, tecla) => (touchUI() ? dedo : tecla);

/** Alto que hay que dejarle a la barra táctil. Con teclado no ocupa nada, y con el
    teléfono de lado los botones se van al borde derecho y tampoco estorban abajo. */
function touchBarSpace() {
  const bar = $('#touch');
  if (bar.hidden || R.w > R.h) return 0;
  const rect = bar.getBoundingClientRect && bar.getBoundingClientRect();
  return rect && rect.height ? rect.height + 22 : 0;
}

/** Zona de juego libre entre el marcador y el borde de abajo. Por encima de 620 px de
    alto los márgenes son los de siempre; por debajo (un teléfono tumbado) se encogen en
    proporción, que es mejor que dejar medio tablero fuera de la pantalla. */
function arcadeArea(padBottom = 96, padTop = 102) {
  const k = Math.min(1, R.h / 620), top = hudTop() + padTop * k;
  return { top, height: Math.max(90, R.h - top - padBottom * k - touchBarSpace()) };
}

/* ---------- Chispas 2D ---------- */
function burst2d(x, y, n, colors, speed = 220, size = 4) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random() * 0.7);
    sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.3, life: 0.5 + Math.random() * 0.4, max: 0.9, c: colors[i % colors.length], size });
  }
}
function updateSparks(dt) {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const p = sparks[i];
    p.life -= dt;
    if (p.life <= 0) { sparks.splice(i, 1); continue; }
    p.vy += 520 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}
function drawSparks(ctx) {
  for (const p of sparks) {
    ctx.globalAlpha = Math.min(1, p.life * 2);
    ctx.fillStyle = p.c;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

/* ---------- Dibujo común ---------- */
function drawArcadeHUD(a) {
  const ctx = R.ctx, w = Math.min(460, R.w - 32), x = (R.w - w) / 2, y = hudTop(), h = 60, hud = a.def.hud(a.s, a);
  ctx.save();
  roundRect(ctx, x, y, w, h, 16);
  ctx.fillStyle = 'rgba(14,20,40,.82)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.1)';
  ctx.stroke();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `800 20px ${FONT}`;
  ctx.fillStyle = hud.leftColor || '#f3f5ff';
  ctx.fillText(hud.left, x + 18, y + h / 2 + 1);
  ctx.textAlign = 'center';
  ctx.font = `600 10px ${FONT}`;
  ctx.fillStyle = '#9fb0cc';
  ctx.fillText('PUNTOS', x + w / 2, y + 17);
  ctx.font = `800 24px ${FONT}`;
  ctx.fillStyle = '#f3f5ff';
  ctx.fillText(fmt(hud.score), x + w / 2, y + 39);
  ctx.textAlign = 'right';
  ctx.font = `700 15px ${FONT}`;
  ctx.fillStyle = hud.rightColor || '#9fb0cc';
  ctx.fillText(hud.right, x + w - 18, y + h / 2 + 1);
  const total = a.def.duration, p = clamp(a.time / total, 0, 1), left = Math.ceil(Math.max(0, total - a.time));
  roundRect(ctx, x + 14, y + h - 7, w - 28, 3, 2);
  ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fill();
  roundRect(ctx, x + 14, y + h - 7, (w - 28) * (1 - p), 3, 2);
  ctx.fillStyle = left <= 5 ? '#ff8a7a' : '#b7f675'; ctx.fill();
  ctx.textAlign = 'left';
  ctx.font = `700 12px ${FONT}`;
  ctx.fillStyle = left <= 5 ? '#ff8a7a' : '#c9d4e8';
  ctx.fillText(`${left} s`, x + 14, y + h + 16);
  if (record) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffb3ab';
    ctx.fillText(`REC ${stamp(a.time)}`, x + w - 14, y + h + 16);
    ctx.fillStyle = Math.floor(a.clock * 2) % 2 === 0 ? '#ff4d4d' : 'rgba(255,77,77,.3)';
    ctx.beginPath(); ctx.arc(x + w - 80, y + h + 16, 5, 0, Math.PI * 2); ctx.fill();
  }
  if (hud.badge) {
    roundRect(ctx, R.w / 2 - 60, y + h + 6, 120, 22, 11);
    ctx.fillStyle = '#b7f675'; ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#17282a';
    ctx.font = `800 12px ${FONT}`;
    ctx.fillText(hud.badge, R.w / 2, y + h + 17);
  }
  ctx.restore();
}
function renderArcade(t) {
  const a = arcade, ctx = R.ctx;
  ctx.save();
  if (a.shake && !REDUCED_MOTION) ctx.translate(rand(-1, 1) * a.shake * 14, rand(-1, 1) * a.shake * 14);
  a.def.render(ctx, a.s, a, t);
  drawSparks(ctx);
  ctx.restore();
  if (a.flash > 0) {
    ctx.fillStyle = `rgba(255,70,70,${(a.flash * 0.22).toFixed(3)})`;
    ctx.fillRect(0, 0, R.w, R.h);
  }
  drawArcadeHUD(a);
  if (a.intro > 0) {
    const step = ARCADE_INTRO / 3, n = Math.ceil(a.intro / step), frac = (a.intro % step) / step;
    bigText(String(n), n === 3 ? a.def.hint : null, 0.8 + frac * 0.4);
  } else if (a.go > 0) bigText('¡YA!', null, 1 + (0.7 - a.go) * 0.4, '#b7f675');
  else if (a.outro > 0) bigText(a.message, a.def.outroText(a.s, a), 0.8, '#f7e36b');
}
