'use strict';
/* Putup · Motor 3D mínimo sobre Canvas 2D.
   Cada primitiva se convierte en polígonos que se ordenan por capa y profundidad
   (algoritmo del pintor). Incluye iluminación direccional + luces puntuales,
   niebla, recorte contra el plano cercano, brillos y partículas. */

const NEAR = 0.12;
const NO = Object.freeze({});
/** Respeta la preferencia del sistema: sin sacudidas ni líneas de velocidad. */
const REDUCED_MOTION = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const LAYER = Object.freeze({ BG: 0, FLOOR: 1, WALL: 1.5, RUG: 1.8, DECAL: 2, TRACK: 3, OBJ: 5 });

const V3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  scale: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: a => Math.hypot(a[0], a[1], a[2]),
  norm(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
};
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a, b, t) => a + (b - a) * t;
/** Interpolación exponencial independiente de los FPS. */
const damp = (a, b, rate, dt) => lerp(a, b, 1 - Math.exp(-rate * dt));
const rand = (a, b) => a + Math.random() * (b - a);
/** Pseudoaleatorio determinista (para detalles que no deben parpadear entre fotogramas). */
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/* ---------- Color ---------- */
const colorCache = new Map();
function rgb(c) {
  if (typeof c !== 'string') return c;
  let v = colorCache.get(c);
  if (!v) {
    const n = parseInt(c.replace('#', ''), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    colorCache.set(c, v);
  }
  return v;
}
const mixRGB = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function css(c, a = 1) {
  const r = clamp(c[0] | 0, 0, 255), g = clamp(c[1] | 0, 0, 255), b = clamp(c[2] | 0, 0, 255);
  return a < 1 ? `rgba(${r},${g},${b},${a.toFixed(3)})` : `rgb(${r},${g},${b})`;
}
/** Tono HSL → RGB (0-255), para luces que cambian de color. */
function hsl(h, s, l) {
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

/* ---------- Estado del renderizador ---------- */
const R = {
  ctx: null, w: 0, h: 0, dpr: 1,
  cam: null, faces: [], groups: [], drawOrder: [], sortBreaks: 0, cur: null, layer: LAYER.OBJ, group: null, base: { depth: 0, gd: 0, sub: 0 },
  light: V3.norm([-0.35, 1, 0.45]), ambient: 0.56, diffuse: 0.46,
  lights: [], fog: null, // fog = { color:[r,g,b], near, far }
};

function setCamera(pos, target, zoom = 1.1, horizon = 0.54) {
  const f = V3.norm(V3.sub(target, pos));
  const r = V3.norm(V3.cross(f, [0, 1, 0]));
  const u = V3.cross(r, f);
  R.cam = { pos, f, r, u, focal: Math.min(R.w, R.h) * zoom, cx: R.w / 2, cy: R.h * horizon };
}
function toCam(p) {
  const c = R.cam, v = [p[0] - c.pos[0], p[1] - c.pos[1], p[2] - c.pos[2]];
  return [V3.dot(v, c.r), V3.dot(v, c.u), V3.dot(v, c.f)];
}
function toScreen(c) {
  const k = R.cam.focal / c[2];
  return [R.cam.cx + c[0] * k, R.cam.cy - c[1] * k];
}
/** Mundo → pantalla. Devuelve [x, y, profundidad] o null si queda detrás de la cámara. */
function project(p) {
  const c = toCam(p);
  return c[2] < NEAR ? null : [...toScreen(c), c[2]];
}
/** Rayo (dirección normalizada en el mundo) que pasa por un píxel de la pantalla. */
function screenRay(sx, sy) {
  const c = R.cam, x = (sx - c.cx) / c.focal, y = (c.cy - sy) / c.focal;
  return V3.norm([c.f[0] + c.r[0] * x + c.u[0] * y, c.f[1] + c.r[1] * x + c.u[1] * y, c.f[2] + c.r[2] * x + c.u[2] * y]);
}
/** Punto donde el rayo de un píxel corta el plano horizontal y = h (o null). */
function pickPlane(sx, sy, h = 0) {
  const d = screenRay(sx, sy), o = R.cam.pos;
  if (Math.abs(d[1]) < 1e-6) return null;
  const t = (h - o[1]) / d[1];
  return t > 0 ? [o[0] + d[0] * t, h, o[2] + d[2] * t] : null;
}

/** ¿Una esfera (centro, radio) cae dentro de la pantalla? Sirve para no generar lo que no se ve. */
function onScreen(p, r = 1) {
  const c = toCam(p);
  if (c[2] < -r) return false;
  if (c[2] < NEAR + r) return true;
  const s = toScreen(c), k = (r * R.cam.focal) / c[2];
  return s[0] + k > 0 && s[0] - k < R.w && s[1] + k > 0 && s[1] - k < R.h;
}

/* ---------- Objetos (grupos) ----------
   Todo lo de la capa OBJ se agrupa por objeto. Cada grupo guarda su caja en el mundo y en pantalla.
   La profundidad del centro da el orden estable general. Para la oclusión pared-objeto se añaden solo
   las relaciones espaciales inequívocas y se resuelven antes de pintar. */
function newGroup(depth, kind = 'object') {
  return { box: [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity], sb: [Infinity, Infinity, -Infinity, -Infinity], faces: [], depth, kind, behind: null };
}
/** Empieza un objeto; su punto de apoyo en el suelo desempata cuando las cajas se cruzan. */
function beginGroup(anchor, kind = 'object') { const d = toCam([anchor[0], 0, anchor[2]])[2]; R.cur = newGroup(d, kind); R.group = d; }
function endGroup() {
  const g = R.cur;
  R.cur = null;
  R.group = null;
  if (g && g.faces.length) R.groups.push(g);
}
function growBox(g, pts) {
  const b = g.box;
  for (const p of pts) {
    if (p[0] < b[0]) b[0] = p[0]; if (p[1] < b[1]) b[1] = p[1]; if (p[2] < b[2]) b[2] = p[2];
    if (p[0] > b[3]) b[3] = p[0]; if (p[1] > b[4]) b[4] = p[1]; if (p[2] > b[5]) b[5] = p[2];
  }
}
/** Mete una cara ya proyectada en su grupo (o en uno propio) si es de la capa de objetos. */
function pushFace(f, world) {
  if (f.layer !== LAYER.OBJ) { R.faces.push(f); return; }
  const g = R.cur || newGroup(f.depth), sb = g.sb;
  if (!R.cur) { growBox(g, world); R.groups.push(g); }
  g.faces.push(f);
  const pts = f.dot ? [[f.dot[0] - f.dot[2], f.dot[1] - f.dot[2]], [f.dot[0] + f.dot[2], f.dot[1] + f.dot[2]]]
    : f.line ? [[f.line[0], f.line[1]], [f.line[2], f.line[3]]] : f.pts;
  for (const p of pts) {
    if (p[0] < sb[0]) sb[0] = p[0]; if (p[1] < sb[1]) sb[1] = p[1];
    if (p[0] > sb[2]) sb[2] = p[0]; if (p[1] > sb[3]) sb[3] = p[1];
  }
}
/** Rango conservador de profundidad de la caja de un grupo, ya en el eje de la cámara. */
function groupDepthRange(g) {
  const b = g.box, c = R.cam, x = (b[0] + b[3]) / 2, y = (b[1] + b[4]) / 2, z = (b[2] + b[5]) / 2;
  const center = (x - c.pos[0]) * c.f[0] + (y - c.pos[1]) * c.f[1] + (z - c.pos[2]) * c.f[2];
  const radius = Math.abs(c.f[0]) * (b[3] - b[0]) / 2 + Math.abs(c.f[1]) * (b[4] - b[1]) / 2
    + Math.abs(c.f[2]) * (b[5] - b[2]) / 2;
  return [center - radius, center + radius, center];
}
/** 1 si a está delante de b, -1 si detrás, 0 si la separación es ambigua en perspectiva. */
function frontOf(a, b, cam) {
  const A = a.box, B = b.box, e = 1e-3;
  if (a.zFar < b.zNear - e) return 1;
  if (b.zFar < a.zNear - e) return -1;
  let relation = 0;
  for (let k = 0; k < 3; k++) {
    let candidate = 0;
    if (A[k] > B[k + 3] + e) {
      if (cam[k] >= A[k] - e) candidate = 1;
      else if (cam[k] <= B[k + 3] + e) candidate = -1;
    } else if (B[k] > A[k + 3] + e) {
      if (cam[k] >= B[k] - e) candidate = -1;
      else if (cam[k] <= A[k + 3] + e) candidate = 1;
    }
    if (!candidate) continue;
    if (relation && relation !== candidate) return 0;
    relation = candidate;
  }
  return relation;
}
function sortGroups(groups) {
  const cam = R.cam.pos, out = [];
  for (const g of groups) {
    [g.zNear, g.zFar, g.sortDepth] = groupDepthRange(g);
    g.behind = [];
    g.front = [];
    g.degree = 0;
  }
  const fartherFirst = (a, b) => b.sortDepth - a.sortDepth || b.depth - a.depth;
  groups.sort(fartherFirst);
  for (let i = 0; i < groups.length; i++) {
    const a = groups[i], A = a.sb;
    for (let j = i + 1; j < groups.length; j++) {
      const b = groups[j], B = b.sb;
      // El orden por cajas se usa para la oclusión que importa: pared frente a objeto.
      // Entre muebles (o entre tramos contiguos) la profundidad central es más estable.
      if ((a.kind === 'wall') === (b.kind === 'wall')) continue;
      if (A[2] <= B[0] || B[2] <= A[0] || A[3] <= B[1] || B[3] <= A[1]) continue;
      const f = frontOf(a, b, cam);
      if (f > 0) a.behind.push(b); else if (f < 0) b.behind.push(a);
    }
  }
  for (const g of groups) {
    g.degree = g.behind.length;
    for (const h of g.behind) h.front.push(g);
  }
  const remaining = new Set(groups), ready = groups.filter(g => !g.degree);
  R.sortBreaks = 0;
  while (remaining.size) {
    ready.sort(fartherFirst);
    let g = ready.shift();
    if (!g) {
      g = [...remaining].sort(fartherFirst)[0];
      R.sortBreaks++;
    }
    if (!remaining.delete(g)) continue;
    out.push(g);
    for (const f of g.front) {
      if (f.degree > 0) f.degree--;
      if (!f.degree && remaining.has(f)) ready.push(f);
    }
  }
  return out;
}

/* ---------- Polígonos ---------- */
function clipNear(pts) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], ain = a[2] >= NEAR, bin = b[2] >= NEAR;
    if (ain) out.push(a);
    if (ain !== bin) {
      const t = (NEAR - a[2]) / (b[2] - a[2]);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]);
    }
  }
  return out;
}
/** Normal por el método de Newell: robusta incluso con polígonos cóncavos. */
function newell(w) {
  let x = 0, y = 0, z = 0;
  for (let i = 0; i < w.length; i++) {
    const a = w[i], b = w[(i + 1) % w.length];
    x += (a[1] - b[1]) * (a[2] + b[2]);
    y += (a[2] - b[2]) * (a[0] + b[0]);
    z += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return [x, y, z];
}
function litColor(base, n, center) {
  const k = R.ambient + 0.08 * n[1] + R.diffuse * Math.max(0, V3.dot(n, R.light));
  let r = base[0] * k, g = base[1] * k, b = base[2] * k;
  for (const L of R.lights) {
    const d = V3.sub(L.pos, center), dist = V3.len(d);
    if (dist >= L.range) continue;
    const facing = 0.25 + 0.75 * Math.max(0, V3.dot(n, d) / (dist || 1));
    const s = (1 - dist / L.range) ** 2 * facing * L.power;
    r += L.color[0] * s * (0.3 + 0.7 * base[0] / 255);
    g += L.color[1] * s * (0.3 + 0.7 * base[1] / 255);
    b += L.color[2] * s * (0.3 + 0.7 * base[2] / 255);
  }
  return [r, g, b];
}
/**
 * Añade un polígono plano (vértices en sentido antihorario vistos desde delante).
 * Opciones: emissive, alpha, glow (px de desenfoque), glowColor, twoSided, layer, noFog.
 * over: la cara es una calcomanía sobre la última cara normal visible (pantallas, cuadros):
 * hereda su profundidad y se pinta justo después, en el orden en que se añade.
 */
function face(w, color, o = NO) {
  const cam = R.cam, layer = o.layer ?? R.layer;
  if (R.cur && layer === LAYER.OBJ) growBox(R.cur, w);
  let n = newell(w);
  const nl = V3.len(n);
  if (nl < 1e-9) return;
  n = [n[0] / nl, n[1] / nl, n[2] / nl];
  const facing = V3.dot(n, V3.sub(w[0], cam.pos));
  if (facing >= 0) { if (!o.twoSided) return; n = [-n[0], -n[1], -n[2]]; }
  let pts = w.map(toCam);
  let behind = 0;
  for (const p of pts) if (p[2] < NEAR) behind++;
  if (behind === pts.length) return;
  if (behind) { pts = clipNear(pts); if (pts.length < 3) return; }
  let depth = 0, sub = 0, gd;
  for (const p of pts) depth += p[2];
  depth /= pts.length;
  if (o.over) { depth = R.base.depth; gd = R.base.gd; sub = ++R.base.sub; }
  else { gd = R.group ?? depth; R.base = { depth, gd, sub: 0 }; }
  const base = rgb(color);
  let col = base;
  if (!o.emissive) {
    let cx = 0, cy = 0, cz = 0;
    for (const p of w) { cx += p[0]; cy += p[1]; cz += p[2]; }
    col = litColor(base, n, [cx / w.length, cy / w.length, cz / w.length]);
  }
  if (R.fog && !o.noFog) col = mixRGB(col, R.fog.color, clamp((depth - R.fog.near) / (R.fog.far - R.fog.near), 0, 1));
  const alpha = o.alpha ?? 1;
  pushFace({
    pts: pts.map(toScreen), depth, gd, sub, layer,
    fill: css(col, alpha), alpha, blur: o.glow || 0, glowColor: o.glowColor || css(col),
  }, w);
}

/* ---------- Primitivas ---------- */
const BOX_CORNERS = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
const BOX_FACES = [[3, 2, 1, 0], [5, 6, 7, 4], [1, 5, 4, 0], [7, 6, 2, 3], [2, 6, 5, 1], [4, 7, 3, 0]];
const TOP = 3;
/** Caja a partir de sus 8 esquinas ya transformadas. o.top pinta la tapa de otro color. */
function cuboid(pts, color, o = NO) {
  for (let i = 0; i < 6; i++) {
    const f = BOX_FACES[i];
    face([pts[f[0]], pts[f[1]], pts[f[2]], pts[f[3]]], i === TOP && o.top ? o.top : color, o);
  }
}
/** Caja centrada en (x, y, z); o.ry la gira sobre el eje vertical. */
function box(x, y, z, w, h, d, color, o = NO) {
  const c = o.ry ? Math.cos(o.ry) : 1, s = o.ry ? Math.sin(o.ry) : 0;
  cuboid(BOX_CORNERS.map(([a, b, e]) => {
    const lx = a * w / 2, lz = e * d / 2;
    return [x + lx * c + lz * s, y + b * h / 2, z - lx * s + lz * c];
  }), color, o);
}
/**
 * Sistema de coordenadas local con giro (yaw). Devuelve part(), que dibuja cajas
 * relativas al origen; rot/pivot las inclinan sobre el eje X local (brazos, piernas, hojas).
 */
function rig(x, y, z, yaw) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return function part(lx, ly, lz, w, h, d, color, o = NO, rot = 0, pivot = ly) {
    const cr = Math.cos(rot), sr = Math.sin(rot);
    cuboid(BOX_CORNERS.map(([a, b, e]) => {
      const py = ly + b * h / 2 - pivot, pz = e * d / 2;
      const X = lx + a * w / 2, Y = pivot + py * cr - pz * sr, Z = lz + py * sr + pz * cr;
      return [x + X * c + Z * s, y + Y, z - X * s + Z * c];
    }), color, o);
  };
}

/** Marco 2D sobre una superficie: origen, eje u (horizontal) y eje v (vertical). */
function makeFrame(o, u, v) { return { o, u, v, n: V3.cross(u, v) }; }
function onFrame(f, a, b, off = 0) {
  return [
    f.o[0] + f.u[0] * a + f.v[0] * b + f.n[0] * off,
    f.o[1] + f.u[1] * a + f.v[1] * b + f.n[1] * off,
    f.o[2] + f.u[2] * a + f.v[2] * b + f.n[2] * off,
  ];
}
function rectOn(f, a, b, w, h, color, o = NO, off = 0.004) {
  face([onFrame(f, a - w / 2, b - h / 2, off), onFrame(f, a + w / 2, b - h / 2, off),
    onFrame(f, a + w / 2, b + h / 2, off), onFrame(f, a - w / 2, b + h / 2, off)], color, o);
}
function polyOn(f, pts, color, o = NO, off = 0.004) { face(pts.map(([a, b]) => onFrame(f, a, b, off)), color, o); }
function discOn(f, a, b, rx, color, o = NO, off = 0.004, seg = 18, ry = rx) {
  const pts = [];
  for (let i = 0; i < seg; i++) {
    const t = (i / seg) * Math.PI * 2;
    pts.push(onFrame(f, a + Math.cos(t) * rx, b + Math.sin(t) * ry, off));
  }
  face(pts, color, o);
}
/** Caja que sobresale de una pared vertical (profundidad hacia el interior de la sala). */
function boxOn(f, a, b, w, h, depth, color, o = NO, off = 0) {
  const c = onFrame(f, a, b, off + depth / 2);
  if (Math.abs(f.u[0]) > 0.5) box(c[0], c[1], c[2], w, h, depth, color, o);
  else box(c[0], c[1], c[2], depth, h, w, color, o);
}
const floorFrame = (y = 0) => makeFrame([0, y, 0], [1, 0, 0], [0, 0, -1]);
/** Sombra de contacto suave en el suelo. */
function shadow(x, z, rx, rz, alpha = 0.3, y = 0.012) {
  const f = floorFrame(y), o = { emissive: true, noFog: true, layer: LAYER.DECAL };
  discOn(f, x, -z, rx * 1.3, [8, 10, 26], { ...o, alpha: alpha * 0.45 }, 0, 16, rz * 1.3);
  discOn(f, x, -z, rx, [8, 10, 26], { ...o, alpha }, 0, 16, rz);
}
/** Estrella de cinco puntas extruida, girando sobre el eje vertical. */
function star3(x, y, z, r, spin, color, o = NO) {
  const c = Math.cos(spin), s = Math.sin(spin), t = r * 0.18, outline = [];
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5, k = i % 2 ? r * 0.45 : r;
    outline.push([Math.cos(a) * k, Math.sin(a) * k]);
  }
  const P = (px, py, pz) => [x + px * c + pz * s, y + py, z - px * s + pz * c];
  const front = outline.map(([a, b]) => P(a, b, t)), back = outline.map(([a, b]) => P(a, b, -t));
  face(front, color, o);
  face(back.slice().reverse(), color, o);
  const side = { ...o, glow: 0, emissive: false };
  for (let i = 0; i < 10; i++) {
    const j = (i + 1) % 10;
    face([front[i], back[i], back[j], front[j]], color, side);
  }
}
/** Punto luminoso (partículas, estrellas del cielo…). */
function dot3(p, radius, color, o = NO) {
  const c = toCam(p);
  if (c[2] < NEAR) return;
  const s = toScreen(c), r = radius * R.cam.focal / c[2];
  if (r < 0.2) return;
  const alpha = o.alpha ?? 1, layer = o.layer ?? R.layer;
  if (R.cur && layer === LAYER.OBJ) growBox(R.cur, [p]);
  pushFace({ dot: [s[0], s[1], r], depth: c[2], gd: R.group ?? c[2], sub: 0, layer,
    fill: css(rgb(color), alpha), alpha, blur: o.glow || 0, glowColor: o.glowColor || css(rgb(color)) }, [p]);
}
/** Segmento 3D con grosor en unidades del mundo (se adelgaza con la distancia). */
function line3(a, b, color, width, o = NO) {
  let p = toCam(a), q = toCam(b);
  if (p[2] < NEAR && q[2] < NEAR) return;
  if (p[2] < NEAR || q[2] < NEAR) {
    const t = (NEAR - p[2]) / (q[2] - p[2]), m = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, NEAR];
    if (p[2] < NEAR) p = m; else q = m;
  }
  const depth = (p[2] + q[2]) / 2;
  let col = rgb(color);
  if (R.fog && !o.noFog) col = mixRGB(col, R.fog.color, clamp((depth - R.fog.near) / (R.fog.far - R.fog.near), 0, 1));
  const alpha = o.alpha ?? 1, layer = o.layer ?? R.layer;
  if (R.cur && layer === LAYER.OBJ) growBox(R.cur, [a, b]);
  pushFace({ line: [...toScreen(p), ...toScreen(q)], width: Math.max(0.6, width * R.cam.focal / depth),
    depth, gd: R.group ?? depth, sub: 0, layer, fill: css(col, alpha), alpha, blur: o.glow || 0, glowColor: css(col) }, [a, b]);
}

/* ---------- Dibujo ---------- */
function resizeRenderer(canvas) {
  const w = window.innerWidth, h = window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
  if (w === R.w && h === R.h && dpr === R.dpr) return false;
  R.w = w; R.h = h; R.dpr = dpr;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  R.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return true;
}
function beginFrame() {
  R.faces.length = 0; R.groups.length = 0; R.drawOrder.length = 0; R.sortBreaks = 0;
  R.lights = []; R.fog = null; R.group = null; R.cur = null; R.layer = LAYER.OBJ;
}
const faceOrder = (a, b) => a.layer - b.layer || b.gd - a.gd || b.depth - a.depth || a.sub - b.sub;
const inGroupOrder = (a, b) => b.depth - a.depth || a.sub - b.sub;
function renderFaces() {
  R.faces.sort(faceOrder);
  const before = R.faces.filter(f => f.layer < LAYER.OBJ), after = R.faces.filter(f => f.layer > LAYER.OBJ);
  paintFaces(before);
  R.drawOrder = sortGroups(R.groups);
  for (const g of R.drawOrder) paintFaces(g.faces.sort(inGroupOrder));
  paintFaces(after);
}
function paintFaces(list) {
  const ctx = R.ctx;
  ctx.lineJoin = 'round';
  for (const f of list) {
    if (f.blur) { ctx.shadowColor = f.glowColor; ctx.shadowBlur = f.blur * R.dpr; }
    if (f.dot) {
      ctx.fillStyle = f.fill;
      ctx.beginPath(); ctx.arc(f.dot[0], f.dot[1], f.dot[2], 0, Math.PI * 2); ctx.fill();
    } else if (f.line) {
      ctx.strokeStyle = f.fill; ctx.lineWidth = f.width;
      ctx.beginPath(); ctx.moveTo(f.line[0], f.line[1]); ctx.lineTo(f.line[2], f.line[3]); ctx.stroke();
    } else {
      const p = f.pts;
      ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
      ctx.closePath();
      ctx.fillStyle = f.fill; ctx.fill();
      if (f.alpha === 1) { ctx.strokeStyle = f.fill; ctx.lineWidth = 0.7; ctx.stroke(); } // tapa las juntas entre caras
    }
    if (f.blur) { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; }
  }
}

/* ---------- Partículas y textos flotantes ---------- */
const particles = [];
const popups = [];
function emit(p, count, { color = 'ffffff', speed = 3, up = 2, gravity = 9, life = 0.7, size = 0.06, glow = 0, spread = 1, alpha = 1 } = {}) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, s = speed * (0.35 + Math.random() * 0.65);
    particles.push({
      p: [p[0] + rand(-0.1, 0.1) * spread, p[1] + rand(-0.1, 0.1) * spread, p[2] + rand(-0.1, 0.1) * spread],
      v: [Math.cos(a) * s, up * (0.4 + Math.random()), Math.sin(a) * s],
      life: life * (0.6 + Math.random() * 0.4), max: life, color: Array.isArray(color) ? color[i % color.length] : color, size, gravity, glow, alpha,
    });
  }
}
function updateParticles(dt, drift = 0) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const q = particles[i];
    q.life -= dt;
    if (q.life <= 0) { particles[i] = particles[particles.length - 1]; particles.pop(); continue; }
    q.v[1] -= q.gravity * dt;
    q.p[0] += q.v[0] * dt; q.p[1] += q.v[1] * dt; q.p[2] += (q.v[2] + drift) * dt;
    if (q.p[1] < 0.02 && q.gravity > 0) { q.p[1] = 0.02; q.v[1] *= -0.35; q.v[0] *= 0.7; q.v[2] *= 0.7; }
  }
}
function drawParticles() {
  for (const q of particles) {
    const k = q.life / q.max;
    dot3(q.p, q.size * (0.4 + 0.6 * k), q.color, { alpha: q.alpha * Math.min(1, k * 1.6), glow: q.glow });
  }
}
function popup(p, text, color = '#b7f675', size = 22) { popups.push({ p: [...p], text, color, size, life: 1.1 }); }
function updatePopups(dt) {
  for (let i = popups.length - 1; i >= 0; i--) {
    popups[i].life -= dt;
    popups[i].p[1] += dt * 1.1;
    if (popups[i].life <= 0) popups.splice(i, 1);
  }
}
function drawPopups() {
  const ctx = R.ctx;
  ctx.textAlign = 'center';
  for (const q of popups) {
    const s = project(q.p);
    if (!s) continue;
    const pop = Math.min(1, (1.1 - q.life) * 8);
    ctx.globalAlpha = Math.min(1, q.life * 2.5);
    ctx.font = `800 ${Math.round(q.size * (0.7 + 0.3 * pop))}px "Segoe UI", system-ui, sans-serif`;
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,14,30,.75)';
    ctx.strokeText(q.text, s[0], s[1]);
    ctx.fillStyle = q.color; ctx.fillText(q.text, s[0], s[1]);
  }
  ctx.globalAlpha = 1;
}
function clearEffects() { particles.length = 0; popups.length = 0; }
