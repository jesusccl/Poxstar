'use strict';
/* Putup · El jardín: la parcela como una maqueta flotante con césped, senda, porche, setos, valla,
   árboles, estanque, buzón y un patio trasero. El suelo del jardín está un escalón por debajo de la casa. */

const LOT = Object.freeze({ x0: -10, x1: 38, z0: -9, z1: 18 });
const PORCH = Object.freeze({ x0: 1.3, x1: 3.7, z0: 11, z1: 12.3 });
const STEP = Object.freeze({ x0: 1.6, x1: 3.4, z0: 12.3, z1: 12.9 });
const STEP_VECINA = Object.freeze({ x0: 21.4, x1: 22, z0: 2.4, z1: 3.6 });
/** Losas del sendero que une las dos casas. */
const LOSAS = [[16.4, 3.0], [17.6, 3.0], [18.8, 3.0], [20.0, 3.0], [21.0, 3.0]];
const POND = Object.freeze({ x: -7.6, z: 8.8, rx: 1.25, rz: 2.0 });
const TREES = [[-7.5, -6.5, 1.2], [17.3, -6.8, 1.0], [-7.8, 15.0, 1.1], [17.0, 15.2, 1.3], [-7.8, 3.5, 0.9], [18.2, 4.8, 1.0],
  [26.5, -5.5, 1.15], [35.5, -4.0, 1.0], [27.0, 9.5, 1.2], [35.2, 9.0, 0.95]];
const BUSHES = [[-3.8, 11.75], [-1.9, 11.75], [5.7, 11.8], [14.4, 11.8], [15.8, -2.6], [15.8, 1.6], [-5.8, -3.2], [-5.8, 1.4],
  [21.4, 0.8], [21.4, 5.2], [34.6, 2.0]];
const PATH_LIGHTS = [[1.7, 14.0], [3.3, 15.4], [1.7, 16.8]];

/** Altura del suelo: casa y porche a 0, escalón intermedio y césped más abajo. */
function groundY(x, z) {
  if (inHouse(x, z)) return 0;
  if (x > PORCH.x0 && x < PORCH.x1 && z >= PORCH.z0 - 0.1 && z < PORCH.z1) return 0;
  if (x > STEP.x0 && x < STEP.x1 && z >= STEP.z0 && z < STEP.z1) return GROUND / 2;
  if (x > STEP_VECINA.x0 && x < STEP_VECINA.x1 && z > STEP_VECINA.z0 && z < STEP_VECINA.z1) return GROUND / 2;
  return GROUND;
}

const GARDEN_SOLIDS = [
  ...TREES.map(([x, z]) => [x, z, 0.5, 0.5]),
  ...BUSHES.map(([x, z]) => [x, z, 0.8, 0.7]),
  ...PATH_LIGHTS.map(([x, z]) => [x, z, 0.2, 0.2]),
  [POND.x, POND.z, POND.rx * 2, POND.rz * 2], [4.4, 17.0, 0.4, 0.4], [0.9, 17.0, 0.3, 0.3], [12.5, 15.6, 1.7, 0.6],
  [-2.6, 13.2, 0.35, 0.35], [10.5, -6.8, 1.3, 1.3], [13.4, -6.2, 0.6, 0.6], [1.4, 12.2, 0.14, 0.14], [3.6, 12.2, 0.14, 0.14],
];

function gardenLights(t) {
  const flicker = 0.9 + 0.1 * Math.sin(t * 13) * Math.sin(t * 7);
  return [
    { pos: [0.9, 2.3, 17.0], color: [255, 200, 130], power: 0.75, range: 5.5 },
    { pos: [2.5, 2.0, 12.5], color: [255, 195, 120], power: 0.6, range: 4 },
    ...PATH_LIGHTS.map(([x, z]) => ({ pos: [x, 0.2, z], color: [255, 220, 150], power: 0.3, range: 2 })),
    { pos: [8.6, 1.6, 11.8], color: [255, 205, 140], power: 0.45, range: 3.8 },
    { pos: [15.8, 1.6, -1.0], color: [255, 205, 140], power: 0.4, range: 3.5 },
    { pos: [-5.8, 1.7, -0.9], color: [180, 200, 255], power: 0.35, range: 3.5 },
    { pos: [13.4, 0.9, -6.2], color: [255, 120, 60], power: 0.45 * flicker, range: 2.6 },
    { pos: [POND.x, 0.5, POND.z], color: [120, 170, 255], power: 0.25, range: 3 },
    ...(save.garden ? [{ pos: [10.5, GROUND + 2.3, -6.6], color: [255, 210, 145], power: 0.55, range: 6 }] : []),
  ];
}

/* Detalles fijos: matas de hierba repartidas por el césped (sin pisar la casa, la senda ni el estanque). */
const TUFTS = (() => {
  const list = [];
  for (let i = 0; list.length < 90 && i < 400; i++) {
    const x = LOT.x0 + 0.8 + hash(i * 3.1) * (LOT.x1 - LOT.x0 - 1.6), z = LOT.z0 + 0.8 + hash(i * 7.7) * (LOT.z1 - LOT.z0 - 1.6);
    if (HOUSES.some(h => x > h.x0 - 0.4 && x < h.x1 + 0.4 && z > h.z0 - 0.4 && z < h.z1 + 1.9)) continue;
    if (Math.abs(x - 2.5) < 1 && z > 12) continue;
    if (Math.hypot((x - POND.x) / POND.rx, (z - POND.z) / POND.rz) < 1.4) continue;
    list.push({ x, z, s: 0.12 + hash(i) * 0.14, c: hash(i * 5.3) > 0.5 ? '5b8a4c' : '3f6a3a' });
  }
  return list;
})();
const FIREFLIES = Array.from({ length: 18 }, (_, i) => ({
  x: LOT.x0 + 1 + hash(i * 9.3) * (LOT.x1 - LOT.x0 - 2), z: hash(i * 4.1) > 0.5 ? 12.5 + hash(i * 2.2) * 5 : -8.5 + hash(i * 2.2) * 3.2, s: hash(i * 6.6) * 10,
}));

/* ---------- Piezas ---------- */
function drawTree(x, z, s, t) {
  shadow(x, z, 1.25 * s, 1.25 * s, 0.3, GROUND + 0.012);
  beginGroup([x, GROUND, z]);
  const sway = Math.sin(t * 0.8 + x) * 0.04 * s, y = GROUND;
  box(x, y + 0.8 * s, z, 0.3 * s, 1.6 * s, 0.3 * s, '6b4a36');
  const p = rig(x, y, z, x * 0.7);
  p(sway, 2.0 * s, 0, 1.9 * s, 1.0 * s, 1.9 * s, '335c38');
  p(sway * 1.6, 2.8 * s, 0.05, 1.45 * s, 0.9 * s, 1.45 * s, '3f6f42');
  p(sway * 2.2, 3.45 * s, -0.04, 0.9 * s, 0.6 * s, 0.9 * s, '4d8250');
  endGroup();
}
function drawBush(x, z, t) {
  shadow(x, z, 0.5, 0.45, 0.25, GROUND + 0.012);
  beginGroup([x, GROUND, z]);
  const p = rig(x, GROUND, z, x);
  p(0, 0.28, 0, 0.8, 0.56, 0.7, '3d6b3a');
  p(0.05, 0.62, 0, 0.5, 0.3, 0.45, '4d8045');
  endGroup();
}
function drawHedges() {
  const y = GROUND, e = 0.45, runs = [
    ['z', LOT.x0 + e, LOT.z0 + e, LOT.z1 - e], ['z', LOT.x1 - e, LOT.z0 + e, LOT.z1 - e], ['x', LOT.z0 + e, LOT.x0 + e + 0.7, LOT.x1 - e - 0.7],
  ];
  for (const [axis, at, a0, a1] of runs) {
    const n = Math.round((a1 - a0) / 2.6), len = (a1 - a0) / n;
    for (let i = 0; i < n; i++) {
      const c = a0 + len * (i + 0.5), h = 0.85 + hash(at + i) * 0.2, x = axis === 'z' ? at : c, z = axis === 'z' ? c : at;
      if (!onScreen([x, y + 0.5, z], len)) continue;
      beginGroup([x, y, z]);
      box(x, y + h / 2, z, axis === 'z' ? 0.7 : len + 0.02, h, axis === 'z' ? len + 0.02 : 0.7, '3a6436', { top: '4a7c44' });
      endGroup();
    }
  }
}
/** Valla de estacas en el frente, con hueco para la verja. */
function drawFence() {
  const z = LOT.z1 - 0.45, y = GROUND;
  const panels = [];
  for (let x = LOT.x0 + 0.45; x < 1.6 - 0.1; x += 2) panels.push([x, Math.min(x + 2, 1.6)]);
  for (let x = 3.4; x < LOT.x1 - 0.5; x += 2) panels.push([x, Math.min(x + 2, LOT.x1 - 0.45)]);
  for (const [x0, x1] of panels) {
    if (!onScreen([(x0 + x1) / 2, y + 0.5, z], 1.5)) continue;
    beginGroup([(x0 + x1) / 2, y, z]);
    box(x0, y + 0.47, z, 0.1, 0.94, 0.1, 'f4efe4');
    box(x1, y + 0.47, z, 0.1, 0.94, 0.1, 'f4efe4');
    box((x0 + x1) / 2, y + 0.3, z, x1 - x0, 0.06, 0.04, 'e3ddd0');
    box((x0 + x1) / 2, y + 0.66, z, x1 - x0, 0.06, 0.04, 'e3ddd0');
    for (let px = x0 + 0.3; px < x1 - 0.15; px += 0.34) {
      face([[px - 0.05, y + 0.05, z + 0.03], [px + 0.05, y + 0.05, z + 0.03], [px + 0.05, y + 0.8, z + 0.03], [px, y + 0.88, z + 0.03], [px - 0.05, y + 0.8, z + 0.03]],
        'f4efe4', { twoSided: true });
    }
    endGroup();
  }
}
function drawPorch() {
  beginGroup([2.5, GROUND, 11.65]);
  box(2.5, GROUND / 2, 11.65, PORCH.x1 - PORCH.x0, -GROUND, PORCH.z1 - PORCH.z0, 'a57a58', { top: 'b88660' });
  endGroup();
  beginGroup([2.5, GROUND, 12.6]);
  box(2.5, GROUND * 0.75, 12.6, STEP.x1 - STEP.x0, -GROUND / 2, STEP.z1 - STEP.z0, 'a57a58', { top: 'b88660' });
  endGroup();
  for (const x of [1.4, 3.6]) {
    beginGroup([x, 0, 12.2]);
    box(x, 1.3, 12.2, 0.1, 2.6, 0.1, 'f4efe4');
    box(x, 2.0, 12.28, 0.14, 0.2, 0.08, 'ffd98a', { emissive: true, glow: 14, glowColor: 'rgba(255,200,120,.7)' });
    endGroup();
  }
  beginGroup([2.5, 2.6, 11.75]);
  box(2.5, 2.66, 11.75, 2.7, 0.12, 1.34, 'efe9dc', { top: '9a5448' });
  endGroup();
  floorRect(2.5, 11.7, 1.0, 0.5, 0.004, '5a4636', { layer: LAYER.RUG });
}
function drawPond(t) {
  const F = floorFrame(GROUND + 0.01), o = { layer: LAYER.FLOOR, emissive: true };
  discOn(F, POND.x, -POND.z, POND.rx + 0.18, '5b574f', { layer: LAYER.FLOOR }, 0, 22, POND.rz + 0.18);
  discOn(F, POND.x, -POND.z, POND.rx, '24506e', { ...o, over: true }, 0, 22, POND.rz);
  discOn(F, POND.x + 0.25, -POND.z + 0.5, 0.2, 'dfe9ff', { ...o, over: true, alpha: 0.45 }, 0, 12, 0.12);
  for (let k = 0; k < 2; k++) {
    const r = ((t * 0.25 + k * 0.5) % 1) * 0.8;
    ringOn(F, POND.x - 0.3, -POND.z - 0.4, r, r + 0.03, 'a9c8e8', { ...o, over: true, alpha: 0.5 * (1 - r / 0.8) }, 0, 16);
  }
  for (const [dx, dz] of [[-0.5, 0.6], [0.4, -0.9], [0.2, 1.1]]) discOn(F, POND.x + dx, -(POND.z + dz), 0.18, '4d8045', { ...o, over: true, emissive: false }, 0, 8);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2, x = POND.x + Math.cos(a) * (POND.rx + 0.22), z = POND.z + Math.sin(a) * (POND.rz + 0.22);
    beginGroup([x, GROUND, z]);
    box(x, GROUND + 0.08, z, 0.3 + hash(k) * 0.15, 0.16, 0.26, k % 2 ? '8d877c' : '9f998e', { ry: a });
    endGroup();
  }
}
function drawMailbox() {
  const x = 4.4, z = 17.0, y = GROUND, mail = hasMail();
  shadow(x, z, 0.25, 0.25, 0.25, y + 0.012);
  beginGroup([x, y, z]);
  box(x, y + 0.5, z, 0.08, 1.0, 0.08, '5a4636');
  box(x, y + 1.08, z, 0.3, 0.26, 0.46, '3f6d8c', { top: '4d7fa0' });
  box(x, y + 1.08, z - 0.235, 0.24, 0.2, 0.01, '2f5670');
  if (mail) {
    box(x + 0.17, y + 1.25, z + 0.05, 0.03, 0.34, 0.03, 'e04a4a');
    box(x + 0.17, y + 1.36, z - 0.03, 0.02, 0.12, 0.16, 'e04a4a', { emissive: true, glow: 8 });
  } else box(x + 0.17, y + 1.1, z - 0.08, 0.02, 0.04, 0.28, 'e04a4a');
  endGroup();
}
function drawGnome(t) {
  const x = -2.6, z = 13.2, y = GROUND, p = rig(x, y, z, 0.4);
  shadow(x, z, 0.2, 0.2, 0.25, y + 0.012);
  beginGroup([x, y, z]);
  p(0, 0.14, 0, 0.22, 0.28, 0.2, '4d7fa0');
  p(0, 0.34, 0.02, 0.16, 0.14, 0.15, 'f2c9a8');
  p(0, 0.27, 0.07, 0.16, 0.14, 0.08, 'f4f1e8');
  p(0, 0.47, 0, 0.18, 0.1, 0.18, 'e04a4a');
  p(0, 0.57, 0, 0.1, 0.12, 0.1, 'e04a4a');
  endGroup();
}
function drawPatio(t) {
  const F = floorFrame(GROUND + 0.012);
  for (let k = 0; k < 8; k++) rectOn(F, 10.5, 5.2 + 0.4 + k * 0.38, 6.2, 0.35, k % 2 ? 'a57a58' : '9a7050', { layer: LAYER.FLOOR }, 0);
  // Mesa redonda con sombrilla y taburetes.
  shadow(10.5, -6.8, 1.1, 1.1, 0.25, GROUND + 0.02);
  beginGroup([10.5, GROUND, -6.8]);
  box(10.5, GROUND + 0.37, -6.8, 0.1, 0.74, 0.1, '3a3f55');
  box(10.5, GROUND + 0.76, -6.8, 1.0, 0.05, 1.0, 'f4efe4', { ry: 0.4 });
  box(10.5, GROUND + 1.5, -6.8, 0.05, 1.5, 0.05, 'e3ddd0');
  const top = GROUND + 2.35, ring = [];
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; ring.push([10.5 + Math.cos(a) * 1.3, top - 0.35, -6.8 + Math.sin(a) * 1.3]); }
  for (let k = 0; k < 8; k++) face([[10.5, top, -6.8], ring[(k + 1) % 8], ring[k]], k % 2 ? 'e04a4a' : 'f4efe4', { twoSided: true });
  endGroup();
  for (let k = 0; k < 4; k++) {
    const a = k * (Math.PI / 2) + 0.4, x = 10.5 + Math.cos(a) * 0.95, z = -6.8 + Math.sin(a) * 0.95;
    beginGroup([x, GROUND, z]);
    box(x, GROUND + 0.22, z, 0.32, 0.44, 0.32, 'b88660', { top: 'c99a72', ry: a });
    endGroup();
  }
  // Barbacoa con brasas.
  shadow(13.4, -6.2, 0.35, 0.3, 0.25, GROUND + 0.02);
  beginGroup([13.4, GROUND, -6.2]);
  for (const [dx, dz] of [[-0.2, -0.15], [0.2, -0.15], [0, 0.18]]) box(13.4 + dx, GROUND + 0.35, -6.2 + dz, 0.04, 0.7, 0.04, '2a2f45');
  box(13.4, GROUND + 0.78, -6.2, 0.6, 0.18, 0.5, '2a2f45');
  floorRect(13.4, -6.2, 0.5, 0.4, GROUND + 0.875, 'ff7a3d', { emissive: true, glow: 12, glowColor: 'rgba(255,120,60,.7)' });
  endGroup();
  if (Math.random() < 0.08) emit([13.4, GROUND + 1, -6.2], 1, { color: 'aab0bd', speed: 0.1, up: 0.4, gravity: -0.15, life: 2, size: 0.05, alpha: 0.25 });
}
/** Jardín de verano: guirnaldas de bombillas sobre el patio y una hamaca a un lado. */
function drawSummerGarden(t) {
  for (const x of [7.4, 13.6]) {
    beginGroup([x, GROUND, -8.4]);
    box(x, GROUND + 1.4, -8.4, 0.11, 2.8, 0.11, '6b4a36');
    box(x, GROUND + 0.06, -8.4, 0.3, 0.12, 0.3, '4a3528');
    endGroup();
    // Del poste hasta la cara exterior del muro, sin penetrar su espesor.
    const z0 = -8.4, z1 = HOUSE.z0 - WALL_T / 2 - 0.04, top = GROUND + 2.72, n = 9;
    beginGroup([x, GROUND, (z0 + z1) / 2]);
    for (let k = 0; k <= n; k++) {
      const u = k / n, z = z0 + (z1 - z0) * u, y = top - Math.sin(u * Math.PI) * 0.55;
      if (k < n) {
        const u2 = (k + 1) / n, y2 = top - Math.sin(u2 * Math.PI) * 0.55;
        box(x, (y + y2) / 2 - 0.02, z + (z1 - z0) / (n * 2), 0.015, 0.015, Math.abs(z1 - z0) / n, '2a2f45');
      }
      const warm = 0.55 + 0.18 * (0.5 + 0.5 * Math.sin(t * 1.6 + k * 0.8));
      box(x, y - 0.08, z, 0.07, 0.09, 0.07, hsl(42, 0.85, warm), { emissive: true, glow: 9, glowColor: 'rgba(255,215,140,.65)' });
    }
    endGroup();
  }
  // Hamaca colgada de su propio soporte.
  const hx = 16.3, hz = -6.4;
  shadow(hx, hz, 1.0, 2.4, 0.22, GROUND + 0.02);
  beginGroup([hx, GROUND, hz]);
  for (const sz of [-1, 1]) {
    box(hx, GROUND + 0.07, hz + sz * 1.2, 0.8, 0.14, 0.14, '6b4a36');
    box(hx, GROUND + 0.72, hz + sz * 1.12, 0.1, 1.44, 0.1, '7d5e43');
    box(hx, GROUND + 1.42, hz + sz * 1.04, 0.06, 0.06, 0.24, '2a2f45');
  }
  for (let k = 0; k <= 8; k++) {
    const u = k / 8, z = hz - 1.04 + u * 2.08, y = GROUND + 1.38 - Math.sin(u * Math.PI) * 0.62;
    box(hx, y, z, 0.66, 0.07, 0.26, k % 2 ? 'e0955f' : 'f0c75a');
  }
  box(hx, GROUND + 0.82, hz, 0.3, 0.12, 0.3, 'f4efe4');
  endGroup();
}

function drawGardenProps(t) {
  // Sendero de losas entre las dos casas, y el escalón de la entrada del vecino.
  R.layer = LAYER.DECAL;
  for (const [x, z] of LOSAS) {
    face([[x - 0.45, GROUND + 0.012, z + 0.35], [x + 0.45, GROUND + 0.012, z + 0.35],
          [x + 0.45, GROUND + 0.012, z - 0.35], [x - 0.45, GROUND + 0.012, z - 0.35]], 'b9b2a4');
  }
  R.layer = LAYER.OBJ;
  box((STEP_VECINA.x0 + STEP_VECINA.x1) / 2, GROUND / 4, (STEP_VECINA.z0 + STEP_VECINA.z1) / 2,
      STEP_VECINA.x1 - STEP_VECINA.x0, -GROUND / 2, STEP_VECINA.z1 - STEP_VECINA.z0,
      'cfc7b8', { top: 'ded6c6' });

  // Farola junto a la verja, balizas de la senda y banco.
  beginGroup([0.9, GROUND, 17.0]);
  box(0.9, GROUND + 0.05, 17.0, 0.3, 0.1, 0.3, '2a2f45');
  box(0.9, GROUND + 1.25, 17.0, 0.07, 2.4, 0.07, '2a2f45');
  box(0.9, GROUND + 2.55, 17.0, 0.28, 0.34, 0.28, 'ffe2b0', { emissive: true, glow: 22, glowColor: 'rgba(255,205,130,.7)' });
  box(0.9, GROUND + 2.76, 17.0, 0.36, 0.06, 0.36, '2a2f45');
  endGroup();
  for (const [x, z] of PATH_LIGHTS) {
    beginGroup([x, GROUND, z]);
    box(x, GROUND + 0.2, z, 0.12, 0.4, 0.12, '2a2f45');
    box(x, GROUND + 0.43, z, 0.14, 0.08, 0.14, 'ffe8b8', { emissive: true, glow: 10 });
    endGroup();
  }
  shadow(12.5, 15.6, 0.9, 0.35, 0.22, GROUND + 0.012);
  beginGroup([12.5, GROUND, 15.6]);
  box(12.5, GROUND + 0.42, 15.6, 1.6, 0.06, 0.45, 'b88660', { top: 'c99a72' });
  box(12.5, GROUND + 0.75, 15.8, 1.6, 0.35, 0.05, 'b88660');
  for (const dx of [-0.7, 0.7]) box(12.5 + dx, GROUND + 0.21, 15.6, 0.06, 0.42, 0.4, '2a2f45');
  endGroup();
  drawGnome(t);
  drawMailbox();
  // Parterre de flores delante de la cocina.
  const F = floorFrame(GROUND + 0.008);
  rectOn(F, 9.9, -11.75, 8.6, 0.7, '4a3528', { layer: LAYER.FLOOR }, 0);
  for (let k = 0; k < 14; k++) {
    const x = 5.9 + k * 0.6, z = 11.6 + (k % 2) * 0.25, c = ['ff7ab5', 'f0c75a', 'e0955f', 'b98cf0'][k % 4];
    if (!onScreen([x, 0, z], 0.5)) continue;
    beginGroup([x, GROUND, z]);
    box(x, GROUND + 0.12, z, 0.03, 0.24, 0.03, '4d8045');
    box(x, GROUND + 0.27, z, 0.12, 0.08, 0.12, c);
    endGroup();
  }
}

function drawGarden(t) {
  useLights(null);
  // Bloque de la parcela (tierra por los lados, césped arriba).
  R.layer = -2;
  box((LOT.x0 + LOT.x1) / 2, GROUND - 0.7, (LOT.z0 + LOT.z1) / 2, LOT.x1 - LOT.x0, 1.4, LOT.z1 - LOT.z0, '5e4432', { top: '44703d' });
  box((LOT.x0 + LOT.x1) / 2, GROUND - 1.45, (LOT.z0 + LOT.z1) / 2, LOT.x1 - LOT.x0 - 0.6, 0.1, LOT.z1 - LOT.z0 - 0.6, '4a3528');
  R.layer = LAYER.FLOOR;
  for (const g of TUFTS) floorRect(g.x, g.z, g.s, g.s * 0.6, GROUND + 0.004, g.c);
  for (let z = 13.4; z < LOT.z1 - 0.4; z += 0.8) floorRect(2.5 + Math.sin(z * 1.7) * 0.08, z, 0.95, 0.55, GROUND + 0.006, 'b8b2a6');
  drawPond(t);
  R.layer = LAYER.OBJ;
  drawHedges();
  drawFence();
  for (const [x, z, s] of TREES) if (onScreen([x, 2, z], 3 * s)) drawTree(x, z, s, t);
  for (const [x, z] of BUSHES) if (onScreen([x, 0, z], 1)) drawBush(x, z, t);
  drawPorch();
  if (onScreen([2.5, 1, 15.5], 5)) drawGardenProps(t);
  if (onScreen([11.5, 1, -6.8], 4)) drawPatio(t);
  if (save.garden && onScreen([12.5, 1, -7], 6)) drawSummerGarden(t);
  for (const f of FIREFLIES) {
    const x = f.x + Math.sin(t * 0.4 + f.s) * 0.8, z = f.z + Math.cos(t * 0.33 + f.s) * 0.6, y = GROUND + 0.8 + Math.sin(t * 0.9 + f.s) * 0.4;
    const on = 0.5 + 0.5 * Math.sin(t * 2.3 + f.s * 3);
    if (on > 0.25) dot3([x, y, z], 0.035, 'd8ff7a', { alpha: on, glow: 10 });
  }
}
