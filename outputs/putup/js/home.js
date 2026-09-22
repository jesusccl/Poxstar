'use strict';
/* Putup · La casa al estilo Sims: el creador recorre las habitaciones y el jardín e interactúa con objetos. */

const WALK_SPEED = 3.6;
const PLAYER_R = 0.24;
const PC_REACH = 1.45;

let player = { x: 0, z: 1.5 };
const avatar = { yaw: 2.6, walk: 0, move: 0, target: null, step: 0, steam: 0, snore: 1.5, y: 0, room: ROOMS[0], fridgeT: 0, nap: 0 };
const view = { angle: 0.62, goal: 0.62, dist: 14, distGoal: 14, tx: 0, tz: 1.5 };

/* ---------- Interacciones (E o clic sobre el objeto) ---------- */
const INTERACTIONS = [
  { id: 'pc', at: [-2.6, 1.35, -4.6], spot: [PC_SPOT.x, PC_SPOT.z], yaw: Math.PI, reach: PC_REACH,
    label: () => (pending ? 'Continuar edición' : 'Usar ordenador'), act: () => (pending ? editor() : desktop()) },
  { id: 'tv', at: [10.5, 1.26, -4.7], spot: [10.5, -0.55], yaw: Math.PI, label: () => (homeState.tv ? 'Apagar la tele' : 'Ver la tele'), act: toggleTV },
  { id: 'fridge', at: [14.3, 1.1, 3.65], spot: [13.35, 3.65], yaw: Math.PI / 2, label: () => 'Picar algo', act: snack },
  { id: 'coffee', at: [14.6, 1.1, 9.9], spot: [13.6, 9.9], yaw: Math.PI / 2, label: () => 'Preparar café', act: coffee },
  { id: 'bed', at: [4.1, 0.6, -3.6], spot: [2.75, -3.4], yaw: Math.PI / 2, label: () => 'Echar una siesta', act: nap },
  { id: 'sink', at: [-2.3, 0.95, 5.3], spot: [-2.3, 6.0], yaw: Math.PI, label: () => 'Lavarse las manos', act: washHands },
  { id: 'tub', at: [-3.55, 0.6, 10.45], spot: [-3.55, 9.45], yaw: 0, label: () => 'Hacer burbujas', act: bubbles },
  { id: 'mail', at: [4.4, GROUND + 1.1, 17.0], spot: [4.4, 16.3], yaw: 0, label: () => (hasMail() ? 'Leer cartas de fans' : 'Mirar el buzón'), act: readMail },
  // La recreativa del salón abre la misma biblioteca que el ordenador, sin subir al estudio.
  { id: 'arcade', at: [13.9, 1.32, -2.6], spot: [13.2, -2.6], yaw: Math.PI / 2, when: () => save.arcade >= 1,
    label: () => 'Jugar en la recreativa', act: () => desktop() },
];
const isNear = it => Math.hypot(player.x - it.spot[0], player.z - it.spot[1]) < (it.reach || 1.3);
function nearestInteraction() {
  let best = null, bestD = Infinity;
  for (const it of INTERACTIONS) {
    if (it.when && !it.when()) continue;
    const d = Math.hypot(player.x - it.spot[0], player.z - it.spot[1]);
    if (isNear(it) && d < bestD) { best = it; bestD = d; }
  }
  return best;
}
function interact(it) {
  avatar.target = null;
  avatar.yaw = it.yaw;
  Sound.click();
  it.act();
}
function nearPC() { return isNear(INTERACTIONS[0]); }
function usePC() { interact(INTERACTIONS[0]); }

const SNACKS = ['un yogur de fresa', 'una manzana crujiente', 'un trozo de pizza fría', 'unas uvas', 'un batido de plátano'];
function toggleTV() {
  homeState.tv = !homeState.tv;
  toast(homeState.tv ? 'Tele encendida: ¡están echando Salto neón!' : 'Tele apagada.');
}
function snack() {
  avatar.fridgeT = 2.2;
  emit([13.9, 1.2, 3.65], 10, { color: ['dff4ff', 'ffffff'], speed: 0.8, up: 0.6, gravity: 0.5, life: 1, size: 0.04, glow: 6 });
  toast(`Te comes ${SNACKS[Math.floor(Math.random() * SNACKS.length)]}. ¡A crear con energía!`);
}
function coffee() {
  emit([14.5, 1.3, 9.9], 14, { color: 'ffffff', speed: 0.12, up: 0.5, gravity: -0.2, life: 1.8, size: 0.05, alpha: 0.4 });
  Sound.coin();
  toast('☕ Café recién hecho. ¡Energía para editar!');
}
function nap() {
  avatar.nap = 3.2;
  toast('Zzz… una siesta corta para recargar ideas.');
}
function washHands() {
  emit([-2.3, 0.95, 5.3], 16, { color: ['a9d6e8', 'ffffff'], speed: 0.4, up: 0.2, gravity: 4, life: 0.6, size: 0.03 });
  toast('Manos limpias ✨');
}
function bubbles() {
  emit([-3.55, 0.7, 10.45], 22, { color: ['ffffff', 'cfe8ff', 'ffd6f0'], speed: 0.6, up: 1.2, gravity: -0.3, life: 2.4, size: 0.07, alpha: 0.55, glow: 6 });
  toast('¡Burbujas! El patito está feliz.');
}

/* Cartas de fans: llegan al buzón con cada vídeo publicado. */
const hasMail = () => save.videos.length > save.mail;
const FAN_NOTES = [
  ['¡Me encantó ese salto sobre el bloque!', 'Lucía, 12 años'],
  ['Me suscribí por tu estilo. ¡Sigue así!', 'Marco'],
  ['Mi abuela y yo vemos tus vídeos cada tarde.', 'Abuela Carmen y Nico'],
  ['¿Cuándo sale el próximo? ¡Quiero más estrellas!', '@saltarina'],
  ['Tu estudio se ve cada vez mejor.', 'Tomás'],
  ['Gracias por animarme a crear mi propio canal.', 'Irene'],
  ['Le he dicho a toda mi clase que vea {canal}.', 'Pau'],
  ['{canal} me acompaña mientras estudio. ¡Gracias!', '@martina.dev'],
];
function readMail() {
  if (!hasMail()) { toast('El buzón está vacío. Publica vídeos y llegarán cartas.'); return; }
  const fresh = save.videos.slice(save.mail).slice(-3).reverse();
  save.mail = save.videos.length;
  persist();
  show(heading(`BUZÓN · CARTAS PARA ${escapeHTML(channelName().toUpperCase())}`, fresh.length > 1 ? `${fresh.length} cartas nuevas` : 'Una carta nueva') + `
    <div class="letters">${fresh.map((v, i) => {
      const [note, who] = FAN_NOTES[Math.floor(hash(v.views + i) * FAN_NOTES.length)];
      const text = escapeHTML(note.replace('{canal}', channelName()));
      return `<div class="letter"><span class="tag">SOBRE «${escapeHTML(v.title)}»</span><p>«${text}»</p><span class="fine">— ${who}</span></div>`;
    }).join('')}</div>
    <button id="ok" class="primary">Guardar las cartas</button>`);
  bind('ok', closeModal);
}

/* ---------- Movimiento y colisiones ---------- */
/** Estorbos de lo que se ha comprado: aparecen con el mueble y no antes. */
const shopSolids = () => [
  ...(save.arcade ? [[14.1, -2.6, 0.75, 0.9]] : []),
  ...(save.garden ? [[16.3, -6.4, 0.95, 2.6], [7.4, -8.4, 0.32, 0.32], [13.6, -8.4, 0.32, 0.32]] : []),
];
const homeSolids = () => [...WALL_SOLIDS, ...furnitureSolids(), ...ROOM_SOLIDS, ...GARDEN_SOLIDS, ...shopSolids()];
function isFree(x, z, solids) {
  if (x < LOT.x0 + 0.8 || x > LOT.x1 - 0.8 || z < LOT.z0 + 0.8 || z > LOT.z1 - 0.8) return false;
  return !solids.some(([sx, sz, w, d]) => Math.abs(x - sx) < w / 2 + PLAYER_R && Math.abs(z - sz) < d / 2 + PLAYER_R);
}
/** Mueve con colisión eje a eje (así se desliza por las paredes). Devuelve la distancia recorrida. */
function tryMove(dx, dz) {
  const solids = homeSolids(), x0 = player.x, z0 = player.z;
  if (isFree(player.x + dx, player.z, solids)) player.x += dx;
  if (isFree(player.x, player.z + dz, solids)) player.z += dz;
  return Math.hypot(player.x - x0, player.z - z0);
}
function walkTo(x, z, it = null) { avatar.target = { x, z, it }; }
function arrive() {
  const it = avatar.target && avatar.target.it;
  avatar.target = null;
  if (it && isNear(it)) interact(it);
}
/** Gira un ángulo hacia otro por el camino más corto. */
function turnToward(a, b, k) {
  const d = ((((b - a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
  return a + d * Math.min(1, k);
}
const held = (...codes) => codes.some(c => keys.has(c));
/** Habitación actual; en el umbral de una puerta se conserva la anterior. */
function currentRoom() {
  const r = roomAt(player.x, player.z);
  if (r) avatar.room = r;
  else if (!inHouse(player.x, player.z)) avatar.room = null;
  return avatar.room;
}
const placeName = () => (avatar.room ? avatar.room.name : 'JARDÍN');

function updateHome(dt) {
  let ix = held('KeyD', 'ArrowRight') - held('KeyA', 'ArrowLeft');
  let iz = held('KeyS', 'ArrowDown') - held('KeyW', 'ArrowUp');
  let dx = 0, dz = 0, step = WALK_SPEED * dt;
  if (avatar.nap > 0) ix = iz = 0;
  if (ix || iz) {
    avatar.target = null;
    const l = Math.hypot(ix, iz), c = Math.cos(view.angle), s = Math.sin(view.angle);
    ix /= l; iz /= l;
    dx = ix * c + iz * s;
    dz = -ix * s + iz * c;
  } else if (avatar.target) {
    const tx = avatar.target.x - player.x, tz = avatar.target.z - player.z, dist = Math.hypot(tx, tz);
    if (dist < 0.05) arrive();
    else { dx = tx / dist; dz = tz / dist; step = Math.min(step, dist); }
  }
  if (dx || dz) {
    const moved = tryMove(dx * step, dz * step);
    if (avatar.target && moved < step * 0.3) arrive(); // bloqueado: se queda donde pudo llegar
    avatar.yaw = turnToward(avatar.yaw, Math.atan2(dx, dz), 12 * dt);
    avatar.walk += moved * 4.4;
    avatar.move = damp(avatar.move, moved > 1e-4 ? 1 : 0, 12, dt);
    const s = Math.floor(avatar.walk / Math.PI);
    if (s !== avatar.step) { avatar.step = s; Sound.step(); }
  } else {
    avatar.move = damp(avatar.move, 0, 10, dt);
  }
  avatar.y = damp(avatar.y, groundY(player.x, player.z), 14, dt);
  const before = avatar.room, here = currentRoom();
  if (here !== before) setModeUI();
  // Cámara que sigue al creador y paredes recortadas según la habitación.
  view.angle = damp(view.angle, view.goal, 14, dt);
  view.dist = damp(view.dist, view.distGoal, 10, dt);
  view.tx = damp(view.tx, player.x, 6, dt);
  view.tz = damp(view.tz, player.z, 6, dt);
  updateWalls(dt, cameraPos(), here, [player.x, player.z]);
  // Objetos animados de la casa.
  frontDoor.open = damp(frontDoor.open, Math.hypot(player.x - 2.5, player.z - 11) < 2.2 ? 1 : 0, 6, dt);
  avatar.fridgeT = Math.max(0, avatar.fridgeT - dt);
  homeState.fridge = damp(homeState.fridge, avatar.fridgeT > 0 ? 1 : 0, 7, dt);
  if (avatar.nap > 0 && (avatar.nap -= dt) <= 0) { toast('¡Qué buena siesta! Listo para crear.'); popup([player.x, avatar.y + 2.3, player.z], '¡Descansado!', '#b7f675', 20); }
  if ((avatar.steam -= dt) < 0) {
    avatar.steam = 0.3;
    emit([-3.95, 0.96, -4.0], 1, { color: 'ffffff', speed: 0.05, up: 0.25, gravity: -0.12, life: 1.8, size: 0.035, alpha: 0.35 });
  }
  if ((avatar.snore -= dt) < 0) { avatar.snore = 3.2; popup([3.9, 1.0, -3.05], 'z', '#c9d2ff', 15); }
  updateParticles(dt);
  updatePopups(dt);
}

/* ---------- Cámara y selección con el ratón ---------- */
function cameraPos() {
  const a = view.angle, d = view.dist;
  return [view.tx + Math.sin(a) * d, avatar.y + 0.35 + d * 0.74, view.tz + Math.cos(a) * d];
}
function homeCamera() { setCamera(cameraPos(), [view.tx, avatar.y + 0.35, view.tz], 1.1, 0.54); }

/** Objeto interactivo bajo el puntero (usa la cámara del último fotograma). */
function pickInteraction(sx, sy) {
  if (!R.cam) return null;
  let best = null, bestD = Infinity;
  for (const it of INTERACTIONS) {
    if (it.when && !it.when()) continue;
    const p = project(it.at);
    if (!p) continue;
    const d = Math.hypot(p[0] - sx, p[1] - sy), lim = Math.max(26, (0.75 * R.cam.focal) / p[2]);
    if (d < lim && d < bestD) { best = it; bestD = d; }
  }
  return best;
}
function homeClick(sx, sy) {
  const it = pickInteraction(sx, sy);
  if (it) {
    if (isNear(it)) interact(it); else walkTo(it.spot[0], it.spot[1], it);
    return;
  }
  let p = pickPlane(sx, sy, 0);
  if (p && !inHouse(p[0], p[2])) p = pickPlane(sx, sy, GROUND);
  if (p) walkTo(clamp(p[0], LOT.x0 + 0.9, LOT.x1 - 0.9), clamp(p[2], LOT.z0 + 0.9, LOT.z1 - 0.9));
}

/* ---------- Dibujo ---------- */
function drawNightSky(t) {
  const ctx = R.ctx, g = ctx.createLinearGradient(0, 0, 0, R.h);
  g.addColorStop(0, '#0c1230');
  g.addColorStop(0.6, '#1a2548');
  g.addColorStop(1, '#27365c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, R.w, R.h);
  for (let i = 0; i < 90; i++) {
    const a = 0.2 + 0.6 * Math.abs(Math.sin(t * (0.3 + hash(i) * 1.2) + i));
    ctx.fillStyle = `rgba(255,255,255,${(a * (0.4 + hash(i * 2.9) * 0.6)).toFixed(2)})`;
    ctx.fillRect(hash(i * 1.7) * R.w, hash(i * 3.3) * R.h * 0.8, hash(i * 9.1) > 0.9 ? 2 : 1.2, hash(i * 9.1) > 0.9 ? 2 : 1.2);
  }
  const mx = R.w * 0.84, my = R.h * 0.2, mr = Math.min(R.w, R.h) * 0.045;
  ctx.save();
  ctx.shadowColor = 'rgba(230,236,255,.8)';
  ctx.shadowBlur = 40;
  ctx.fillStyle = '#f4efd8';
  ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(200,196,170,.5)';
  ctx.beginPath(); ctx.arc(mx - mr * 0.3, my - mr * 0.2, mr * 0.22, 0, Math.PI * 2); ctx.fill();
}
/** Rombo verde flotando sobre la cabeza, a lo Sims. */
function drawPlumbob(x, y, z, t) {
  const spin = t * 1.6, top = [x, y + 0.26, z], bottom = [x, y - 0.26, z], ring = [];
  for (let k = 0; k < 4; k++) ring.push([x + Math.cos(spin + (k * Math.PI) / 2) * 0.12, y, z + Math.sin(spin + (k * Math.PI) / 2) * 0.12]);
  const o = { emissive: true, glow: 12, glowColor: 'rgba(160,255,110,.7)' };
  for (let k = 0; k < 4; k++) {
    face([top, ring[(k + 1) % 4], ring[k]], k % 2 ? 'b7f675' : '8fdc52', o);
    face([bottom, ring[k], ring[(k + 1) % 4]], k % 2 ? '6fbf3c' : '5aa832', o);
  }
}
function renderHome(t) {
  beginFrame();
  homeCamera();
  drawNightSky(t);
  R.light = V3.norm([-0.35, 1, 0.45]);
  R.ambient = 0.52;
  R.diffuse = 0.42;
  LIT = { studio: studioLights(t), ...roomLights(t), outside: gardenLights(t) };
  drawGarden(t);
  drawHouseShell();
  drawRooms(t);
  if (avatar.target) {
    const k = 0.5 + 0.5 * Math.sin(t * 8), y = groundY(avatar.target.x, avatar.target.z) + 0.016;
    ringOn(floorFrame(y), avatar.target.x, -avatar.target.z, 0.14 + k * 0.03, 0.2 + k * 0.03, 'b7f675', { emissive: true, layer: LAYER.DECAL, alpha: 0.85 }, 0, 16);
  }
  useLights(avatar.room);
  shadow(player.x, player.z, 0.3, 0.26, 0.32, avatar.y + 0.012);
  beginGroup([player.x, avatar.y, player.z]);
  drawCreator(player.x, avatar.y, player.z, avatar.yaw, { walk: avatar.walk, move: avatar.move, t, headset: save.gear >= 1, gadget: pocketModel() });
  endGroup();
  const by = avatar.y + 2.05 + Math.sin(t * 2) * 0.05;
  beginGroup([player.x, by, player.z]);
  drawPlumbob(player.x, by, player.z, t);
  endGroup();
  drawParticles();
  renderFaces();
  drawPopups();
  if (avatar.nap > 0) {
    const k = Math.sin(Math.min(1, (3.2 - avatar.nap) / 3.2) * Math.PI);
    R.ctx.fillStyle = `rgba(6,8,20,${(k * 0.88).toFixed(3)})`;
    R.ctx.fillRect(0, 0, R.w, R.h);
    R.ctx.fillStyle = `rgba(201,210,255,${k.toFixed(3)})`;
    R.ctx.font = `800 ${Math.round(Math.min(R.w, R.h) * 0.08)}px "Segoe UI", system-ui, sans-serif`;
    R.ctx.textAlign = 'center';
    R.ctx.fillText('Z z z', R.w / 2, R.h * 0.45);
  }
}
