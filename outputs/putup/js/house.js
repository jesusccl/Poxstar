'use strict';
/* Putup · La casa: habitaciones, suelos, paredes con vista recortada al estilo Sims, puertas y ventanas.
   Las paredes se generan en tramos de 1 m a partir de los rectángulos de las habitaciones; cada cara
   toma el color de la habitación (o de la fachada) a la que da. */

const WALL_H = 3.2, WALL_T = 0.16, CUT_H = 0.64, LOW_H = 0.9, GROUND = -0.3, RAIL_Y = 1.1, DOOR_TOP = 2.25;

const ROOMS = [
  { id: 'studio', name: 'ESTUDIO', x0: -5, x1: 5, z0: -5, z1: 5, floor: ['plank', 'c9a383'], paint: '7f8bb3', wainscot: '5c678f' },
  { id: 'living', name: 'SALÓN', x0: 5, x1: 15, z0: -5, z1: 3, floor: ['plank', 'a27a5c'], paint: 'c9ab8e', wainscot: '8f7160' },
  { id: 'kitchen', name: 'COCINA', x0: 5, x1: 15, z0: 3, z1: 11, floor: ['checker', 'ebe6dc', '5a6178'], paint: 'a9c4ae', wainscot: 'e3ddd0' },
  { id: 'hall', name: 'RECIBIDOR', x0: 0, x1: 5, z0: 5, z1: 11, floor: ['plank', 'b58d69'], paint: 'b3a0c4', wainscot: '76668b' },
  { id: 'bath', name: 'BAÑO', x0: -5, x1: 0, z0: 5, z1: 11, floor: ['checker', 'dfe9ee', 'c3d6df'], paint: '9cc3d2', wainscot: 'eef2f4' },
];
const HOUSE = Object.freeze({ x0: -5, x1: 15, z0: -5, z1: 11 });
const FACADE = Object.freeze({ paint: 'e4dccb', trim: 'f4efe4', cap: 'efe9dc' });
const TRIM = 'e9e4dc';

/* Huecos: puertas interiores, arco, puerta de entrada y ventanas (alféizar y dintel en metros). */
const OPENINGS = [
  { axis: 'x', at: 5, c: 1.3, w: 1.2, kind: 'door' },
  { axis: 'z', at: 5, c: 0.8, w: 1.2, kind: 'door' },
  { axis: 'x', at: 5, c: 7.6, w: 1.2, kind: 'door' },
  { axis: 'x', at: 0, c: 9.0, w: 1.2, kind: 'door' },
  { axis: 'z', at: 3, c: 10, w: 4, kind: 'arch' },
  { axis: 'z', at: 11, c: 2.5, w: 1.2, kind: 'front' },
  { axis: 'x', at: -5, c: -0.9, w: 1.72, kind: 'window', bottom: 1.2, top: 2.5 },
  { axis: 'x', at: 15, c: -1.0, w: 1.8, kind: 'window', bottom: 1.0, top: 2.5 },
  { axis: 'z', at: -5, c: 6.6, w: 1.2, kind: 'window', bottom: 1.1, top: 2.5 },
  { axis: 'x', at: 15, c: 8.2, w: 1.4, kind: 'window', bottom: 1.35, top: 2.45 },
  { axis: 'z', at: 11, c: 8.6, w: 1.8, kind: 'window', bottom: 1.0, top: 2.5 },
  { axis: 'x', at: -5, c: 8.0, w: 1.0, kind: 'window', bottom: 1.6, top: 2.5, frosted: true },
];
const holeTop = o => (o.kind === 'window' ? o.top : o.kind === 'arch' ? 2.5 : DOOR_TOP);
const holeBottom = o => (o.kind === 'window' ? o.bottom : 0);

function roomAt(x, z) { return ROOMS.find(r => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) || null; }
const inHouse = (x, z) => x > HOUSE.x0 && x < HOUSE.x1 && z > HOUSE.z0 && z < HOUSE.z1;

/* ---------- Tramos de pared ---------- */
const SEGMENTS = (() => {
  const map = new Map();
  const add = (axis, at, i) => {
    const key = `${axis}${at}:${i}`;
    if (map.has(key)) return;
    const m = i + 0.5, side = d => (axis === 'x' ? roomAt(at + d, m) : roomAt(m, at + d));
    map.set(key, {
      key, axis, at, a0: i, a1: i + 1, neg: side(-0.1), pos: side(0.1), h: WALL_H, ext0: false, ext1: false,
      holes: OPENINGS.filter(o => o.axis === axis && o.at === at && o.c + o.w / 2 > i && o.c - o.w / 2 < i + 1),
    });
  };
  for (const r of ROOMS) {
    for (let x = r.x0; x < r.x1; x++) { add('z', r.z0, x); add('z', r.z1, x); }
    for (let z = r.z0; z < r.z1; z++) { add('x', r.x0, z); add('x', r.x1, z); }
  }
  // Donde un muro termina o gira, se alarga medio grosor para cerrar la esquina.
  for (const s of map.values()) {
    s.ext0 = !map.has(`${s.axis}${s.at}:${s.a0 - 1}`);
    s.ext1 = !map.has(`${s.axis}${s.at}:${s.a1}`);
  }
  return [...map.values()];
})();
const SEGMENT_BY_KEY = new Map(SEGMENTS.map(s => [s.key, s]));

let wallMode = 'cut';        // 'cut' (inteligentes) · 'low' (medias) · 'up' (completas)
let LIT = {};                // luces de cada habitación en este fotograma
const WALL_MODES = { cut: 'inteligentes', low: 'medias', up: 'completas' };
function cycleWallMode() {
  const order = Object.keys(WALL_MODES);
  wallMode = order[(order.indexOf(wallMode) + 1) % order.length];
  return WALL_MODES[wallMode];
}
const useLights = room => { R.lights = LIT[room ? room.id : 'outside'] || []; };

/** Indica si un tramo cruza el corredor visual entre la cámara y el personaje. */
function wallBlocksView(s, cam, focus) {
  if (!focus) return false;
  const cx = cam[0], cz = cam[2], fx = focus[0], fz = focus[1];
  const delta = s.axis === 'x' ? fx - cx : fz - cz;
  if (Math.abs(delta) < 0.001) return false;
  const t = (s.at - (s.axis === 'x' ? cx : cz)) / delta;
  if (t <= 0.04 || t >= 0.98) return false;
  const along = s.axis === 'x' ? cz + (fz - cz) * t : cx + (fx - cx) * t;
  // Un pequeño margen recorta varios tramos contiguos y evita una ranura dentada.
  return along > s.a0 - 0.85 && along < s.a1 + 0.85;
}

/** Altura objetivo: solo baja las paredes que realmente tapan la habitación o al personaje. */
function updateWalls(dt, cam, here, focus) {
  for (const s of SEGMENTS) {
    const camPos = s.axis === 'x' ? cam[0] > s.at : cam[2] > s.at;
    const near = camPos ? s.pos : s.neg, far = camPos ? s.neg : s.pos;
    let goal = WALL_H;
    if (wallMode === 'low') goal = LOW_H;
    else if (wallMode === 'cut') {
      const facesCurrentRoom = !!here && far === here && near !== here;
      goal = facesCurrentRoom || wallBlocksView(s, cam, focus) ? CUT_H : WALL_H;
    }
    s.h = Math.abs(goal - s.h) < 0.01 ? goal : damp(s.h, goal, 9, dt);
  }
}
const segmentAt = (axis, at, along) => SEGMENT_BY_KEY.get(`${axis}${at}:${Math.floor(along)}`);
const wallIsUp = (axis, at, along) => { const s = segmentAt(axis, at, along); return !!s && s.h > WALL_H - 0.05; };

/* ---------- Geometría de pared ---------- */
/** Cara vertical en el plano perpendicular a `axis` (x = p o z = p) mirando hacia `sign`. */
function wallQuad(axis, p, sign, a0, a1, y0, y1, color, o = NO) {
  if (axis === 'x') {
    face(sign > 0 ? [[p, y0, a1], [p, y0, a0], [p, y1, a0], [p, y1, a1]] : [[p, y0, a0], [p, y0, a1], [p, y1, a1], [p, y1, a0]], color, o);
  } else {
    face(sign > 0 ? [[a0, y0, p], [a1, y0, p], [a1, y1, p], [a0, y1, p]] : [[a1, y0, p], [a0, y0, p], [a0, y1, p], [a1, y1, p]], color, o);
  }
}
/** Rectángulo horizontal (tapa hacia arriba) a la altura y. */
function floorRect(x, z, w, d, y, color, o = NO) {
  face([[x - w / 2, y, z + d / 2], [x + w / 2, y, z + d / 2], [x + w / 2, y, z - d / 2], [x - w / 2, y, z - d / 2]], color, o);
}
/** Caja alineada con la pared: tramo [a0,a1] a lo largo, [t0,t1] a lo ancho (coordenada del eje) y [y0,y1]. */
function wallBox(axis, a0, a1, t0, t1, y0, y1, color, o = NO) {
  const w = Math.abs(a1 - a0), d = Math.abs(t1 - t0), ca = (a0 + a1) / 2, ct = (t0 + t1) / 2;
  if (axis === 'x') box(ct, (y0 + y1) / 2, ca, d, y1 - y0, w, color, o);
  else box(ca, (y0 + y1) / 2, ct, w, y1 - y0, d, color, o);
}
const sideColor = (room, y) => (room ? (y < RAIL_Y - 0.01 ? room.wainscot : room.paint) : FACADE.paint);

/** Trozos macizos del tramo (quitando puertas y ventanas), recortados a su altura actual. */
function segmentPieces(s) {
  const a0 = s.a0 - (s.ext0 ? WALL_T / 2 : 0), a1 = s.a1 + (s.ext1 ? WALL_T / 2 : 0);
  const prev = SEGMENT_BY_KEY.get(`${s.axis}${s.at}:${s.a0 - 1}`);
  const next = SEGMENT_BY_KEY.get(`${s.axis}${s.at}:${s.a1}`);
  const edge = neighbor => !neighbor ? [0, s.h] : neighbor.h < s.h - 0.02 ? [neighbor.h, s.h] : null;
  // e0/e1: canto visible al inicio/fin del trozo, como rango de alturas [y0, y1] (o null).
  let pieces = [{ a0, a1, y0: 0, y1: s.h, e0: edge(prev), e1: edge(next) }];
  for (const o of s.holes) {
    const h0 = o.c - o.w / 2, h1 = o.c + o.w / 2, bottom = holeBottom(o), top = holeTop(o), next = [];
    for (const p of pieces) {
      if (p.a1 <= h0 || p.a0 >= h1) { next.push(p); continue; }
      const jamb = [Math.max(p.y0, bottom), Math.min(p.y1, top)];
      if (p.a0 < h0) next.push({ ...p, a1: h0, e1: jamb });
      if (p.a1 > h1) next.push({ ...p, a0: h1, e0: jamb });
      const m0 = Math.max(p.a0, h0), m1 = Math.min(p.a1, h1);
      if (bottom > p.y0) next.push({ a0: m0, a1: m1, y0: p.y0, y1: Math.min(p.y1, bottom), e0: null, e1: null });
      if (p.y1 > top) next.push({ a0: m0, a1: m1, y0: Math.max(p.y0, top), y1: p.y1, e0: null, e1: null });
    }
    pieces = next;
  }
  return pieces.filter(p => p.y1 - p.y0 > 0.005 && p.a1 - p.a0 > 0.005);
}

function drawSegment(s) {
  const pieces = segmentPieces(s), full = s.h > WALL_H - 0.05, t = WALL_T / 2;
  const mid = (s.a0 + s.a1) / 2;
  beginGroup(s.axis === 'x' ? [s.at, 0, mid] : [mid, 0, s.at], 'wall');
  for (const [sign, room] of [[-1, s.neg], [1, s.pos]]) {
    useLights(room);
    const faceAt = s.at + sign * t, t0 = sign < 0 ? s.at - t : s.at, t1 = sign < 0 ? s.at : s.at + t;
    for (const p of pieces) {
      const splits = room && p.y0 < RAIL_Y && p.y1 > RAIL_Y ? [[p.y0, RAIL_Y], [RAIL_Y, p.y1]] : [[p.y0, p.y1]];
      for (const [y0, y1] of splits) {
        wallQuad(s.axis, faceAt, sign, p.a0, p.a1, y0, y1, sideColor(room, y0));
        if (room && full && y0 < 0.01) wallQuad(s.axis, faceAt + sign * 0.004, sign, p.a0, p.a1, 0, 0.13, TRIM, { over: true });
        if (room && full && y1 > WALL_H - 0.01) wallQuad(s.axis, faceAt + sign * 0.004, sign, p.a0, p.a1, WALL_H - 0.09, WALL_H, TRIM, { over: true });
        if (room && full && Math.abs(y0 - RAIL_Y) < 0.01) wallQuad(s.axis, faceAt + sign * 0.004, sign, p.a0, p.a1, RAIL_Y - 0.02, RAIL_Y + 0.03, TRIM, { over: true });
      }
      // Tapa superior y cantos (extremos del muro y laterales de los huecos).
      if (s.axis === 'x') floorRect((t0 + t1) / 2, (p.a0 + p.a1) / 2, t1 - t0, p.a1 - p.a0, p.y1, FACADE.cap);
      else floorRect((p.a0 + p.a1) / 2, (t0 + t1) / 2, p.a1 - p.a0, t1 - t0, p.y1, FACADE.cap);
      const other = s.axis === 'x' ? 'z' : 'x';
      for (const [e, at, dir] of [[p.e0, p.a0, -1], [p.e1, p.a1, 1]]) {
        if (e && e[1] - e[0] > 0.005) wallQuad(other, at, dir, t0, t1, e[0], e[1], sideColor(room, 1.5));
      }
    }
  }
  for (const o of s.holes) drawOpeningPart(s, o, full);
  endGroup();
}

/** Marcos, cristal y umbral del hueco, recortados al tramo para que se ordenen con él. */
function drawOpeningPart(s, o, full) {
  const h0 = Math.max(o.c - o.w / 2, s.a0), h1 = Math.min(o.c + o.w / 2, s.a1), top = holeTop(o), bottom = holeBottom(o);
  const t = WALL_T / 2, lo = o.c - o.w / 2, hi = o.c + o.w / 2;
  for (const [sign, room] of [[-1, s.neg], [1, s.pos]]) {
    useLights(room);
    const out = s.at + sign * t, c = room ? TRIM : FACADE.trim;
    // Marco que sobresale alrededor del hueco.
    if (!full && s.h < bottom) continue;
    const ht = Math.min(top, s.h);
    if (lo >= s.a0 && lo < s.a1) wallBox(s.axis, lo - 0.08, lo, out, out + sign * 0.03, bottom, ht, c);
    if (hi > s.a0 && hi <= s.a1) wallBox(s.axis, hi, hi + 0.08, out, out + sign * 0.03, bottom, ht, c);
    if (full) wallBox(s.axis, Math.max(h0 - 0.08, s.a0), Math.min(h1 + 0.08, s.a1), out, out + sign * 0.03, top, top + 0.08, c);
    if (o.kind === 'window') wallBox(s.axis, Math.max(h0 - 0.1, s.a0), Math.min(h1 + 0.1, s.a1), out, out + sign * (room ? 0.14 : 0.06), bottom - 0.05, bottom, c);
  }
  if (o.kind === 'window' && s.h > bottom + 0.05) {
    const y1 = Math.min(top, s.h);
    useLights(null);
    const glass = o.frosted ? { alpha: 0.75, twoSided: true, emissive: true } : { alpha: 0.22, twoSided: true, emissive: true };
    wallQuad(s.axis, s.at, 1, h0, h1, bottom, y1, o.frosted ? 'dce8ef' : '9fc4ff', glass);
    if (!o.frosted) {
      const k = 0.3;
      if (o.c > s.a0 && o.c < s.a1) wallBox(s.axis, o.c - 0.02, o.c + 0.02, s.at - 0.02, s.at + 0.02, bottom, y1, 'e8e2d6');
      if (full) wallBox(s.axis, h0, h1, s.at - 0.02, s.at + 0.02, (bottom + top) / 2 - 0.02, (bottom + top) / 2 + 0.02, 'e8e2d6');
      const g0 = Math.max(h0, o.c - k), g1 = Math.min(h1, o.c - k + 0.12);
      if (g1 > g0) wallQuad(s.axis, s.at + 0.01, 1, g0, g1, bottom + 0.2, Math.min(y1, bottom + 0.6), 'ffffff', { alpha: 0.12, twoSided: true, emissive: true });
    }
  }
  if (o.kind !== 'window') {
    // Umbral: une los suelos de ambos lados.
    const w = h1 - h0, c = (h0 + h1) / 2;
    if (s.axis === 'x') floorRect(s.at, c, WALL_T, w, 0.003, 'b0906c', { layer: LAYER.FLOOR });
    else floorRect(c, s.at, w, WALL_T, 0.003, 'b0906c', { layer: LAYER.FLOOR });
  }
}

/* ---------- Suelos ---------- */
function buildFloor(r) {
  const [kind, c1, c2] = r.floor, list = [], x0 = r.x0 + WALL_T / 2, x1 = r.x1 - WALL_T / 2, z0 = r.z0 + WALL_T / 2, z1 = r.z1 - WALL_T / 2;
  if (kind === 'plank') {
    const base = rgb(c1), cols = Math.round((x1 - x0) / 0.62), cw = (x1 - x0) / cols, seed = r.x0 * 7 + r.z0 * 3;
    for (let i = 0; i < cols; i++) {
      const xa = x0 + i * cw;
      for (let j = 0, z = z0 - hash(seed + i + 0.5) * 2.4; z < z1; j++) {
        const len = 1.6 + hash(seed + i * 5 + j * 3) * 1.4, za = Math.max(z, z0), zb = Math.min(z + len, z1), tone = 0.86 + hash(seed + i * 13 + j * 7) * 0.2;
        if (zb - za > 0.05) list.push({ x0: xa + 0.01, x1: xa + cw - 0.01, z0: za + 0.01, z1: zb - 0.01, color: base.map(v => v * tone) });
        z += len;
      }
    }
  } else {
    const n = Math.round(x1 - x0), m = Math.round(z1 - z0), tw = (x1 - x0) / n, td = (z1 - z0) / m;
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
      list.push({ x0: x0 + i * tw + 0.012, x1: x0 + (i + 1) * tw - 0.012, z0: z0 + j * td + 0.012, z1: z0 + (j + 1) * td - 0.012, color: rgb((i + j) % 2 ? c2 : c1) });
    }
  }
  return list;
}
const FLOORS = new Map(ROOMS.map(r => [r.id, buildFloor(r)]));

function drawHouseShell() {
  const cam = R.cam.pos;
  useLights(null);
  R.layer = LAYER.BG;
  box((HOUSE.x0 + HOUSE.x1) / 2, GROUND / 2 - 0.01, (HOUSE.z0 + HOUSE.z1) / 2, HOUSE.x1 - HOUSE.x0 + WALL_T, -GROUND + 0.02, HOUSE.z1 - HOUSE.z0 + WALL_T, '9d978e', { top: '2e2628' });
  R.layer = LAYER.FLOOR;
  for (const r of ROOMS) {
    if (!onScreen([(r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2], Math.hypot(r.x1 - r.x0, r.z1 - r.z0) / 2)) continue;
    useLights(r);
    for (const p of FLOORS.get(r.id)) face([[p.x0, 0.002, p.z1], [p.x1, 0.002, p.z1], [p.x1, 0.002, p.z0], [p.x0, 0.002, p.z0]], p.color);
  }
  R.layer = LAYER.OBJ;
  for (const s of SEGMENTS) {
    const mid = (s.a0 + s.a1) / 2;
    if (onScreen(s.axis === 'x' ? [s.at, 1.5, mid] : [mid, 1.5, s.at], 2)) drawSegment(s);
  }
  drawFrontDoor();
  for (const d of DECOR) {
    const facing = d.sign * ((d.axis === 'x' ? cam[0] : cam[2]) - d.at) > 0;
    if (facing && wallIsUp(d.axis, d.at, d.c) && (!d.when || d.when())) {
      useLights(d.room ? ROOMS.find(r => r.id === d.room) : null);
      const f = sideFrame(d.axis, d.at, d.sign);
      beginGroup(onFrame(f, d.axis === 'x' ? -d.sign * d.c : d.sign * d.c, 0));
      d.draw(f);
      endGroup();
    }
  }
}

/* ---------- Puerta de entrada (se abre sola al acercarse) ---------- */
const frontDoor = { open: 0 };
function drawFrontDoor() {
  const o = OPENINGS.find(q => q.kind === 'front'), hx = o.c - o.w / 2, z = o.at, ang = frontDoor.open * 1.45; // hacia dentro
  useLights(ROOMS.find(r => r.id === 'hall'));
  beginGroup([hx + 0.3, 0, z - 0.3]);
  const part = rig(hx, 0, z, ang);
  part(o.w / 2 - 0.02, DOOR_TOP / 2, 0, o.w - 0.06, DOOR_TOP - 0.03, 0.06, '3f6d8c');
  part(o.w / 2, 1.55, 0.035, o.w - 0.4, 0.55, 0.01, '4d7fa0');
  part(o.w / 2, 0.6, 0.035, o.w - 0.4, 0.7, 0.01, '4d7fa0');
  part(o.w - 0.16, 1.05, 0.05, 0.05, 0.05, 0.05, 'e3c56a');
  part(o.w - 0.16, 1.05, -0.05, 0.05, 0.05, 0.05, 'e3c56a');
  endGroup();
}

/* ---------- Colisiones de las paredes ---------- */
const WALL_SOLIDS = (() => {
  const list = [];
  for (const s of SEGMENTS) {
    let spans = [[s.a0, s.a1]];
    for (const o of s.holes) {
      if (o.kind === 'window') continue;
      const h0 = o.c - o.w / 2, h1 = o.c + o.w / 2;
      spans = spans.flatMap(([a, b]) => (b <= h0 || a >= h1 ? [[a, b]] : [[a, Math.min(b, h0)], [Math.max(a, h1), b]].filter(([p, q]) => q - p > 0.01)));
    }
    for (const [a, b] of spans) list.push(s.axis === 'x' ? [s.at, (a + b) / 2, WALL_T, b - a] : [(a + b) / 2, s.at, b - a, WALL_T]);
  }
  return list;
})();

/* ---------- Decoración de pared ---------- */
/** Marco de la cara de una pared: a = coordenada a lo largo (con signo según el lado), b = altura. */
function sideFrame(axis, at, sign) {
  return axis === 'z'
    ? makeFrame([0, 0, at + sign * WALL_T / 2], [sign, 0, 0], [0, 1, 0])
    : makeFrame([at + sign * WALL_T / 2, 0, 0], [0, 0, -sign], [0, 1, 0]);
}
const DECOR = [];
/** Registra decoración en la cara `sign` de una pared, centrada en `c` (coordenada del mundo a lo largo). */
function decor(room, axis, at, sign, c, draw, when) { DECOR.push({ room, axis, at, sign, c, draw, when }); }
