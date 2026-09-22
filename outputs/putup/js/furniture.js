'use strict';
/* Putup · Muebles del estudio, sus luces y sus colisiones. Las mejoras de la tienda se ven aquí. */

const PC_SPOT = Object.freeze({ x: -2.6, z: -2.75 }); // donde se coloca el creador para usar el ordenador
const DESK = Object.freeze({ x: -2.6, z: -4.35, w: 3.0, d: 1.1, top: 0.8 });

/** Rectángulos de colisión [x, z, ancho, fondo]. */
function furnitureSolids() {
  const s = [
    [DESK.x, DESK.z, DESK.w, DESK.d], [-0.72, -4.45, 0.42, 0.86], [-2.6, -3.3, 0.66, 0.62],
    [4.1, -3.85, 1.66, 2.15], [2.9, -4.62, 0.55, 0.5], [3.0, 4.08, 2.7, 1.1], [4.6, 4.55, 0.4, 0.4],
    [-4.62, 2.2, 0.6, 1.72], [-4.2, 4.2, 0.7, 0.7], [2.15, -4.6, 0.4, 0.4],
  ];
  if (save.gear >= 2) s.push([-4.35, -3.1, 0.45, 0.45]);
  if (save.furniture >= 1) s.push([-1.3, 3.5, 0.95, 0.95]);
  return s;
}

function studioLights(t) {
  const L = [];
  L.push({ pos: [-2.6, 1.4, -4.2], color: [120, 230, 170], power: 0.45, range: 3.2 });
  L.push({ pos: [2.95, 1.0, -4.5], color: [255, 180, 100], power: 0.6, range: 3.2 });
  L.push({ pos: [4.6, 1.8, 4.35], color: [255, 185, 110], power: 0.65, range: 3.8 });
  L.push({ pos: [-4.4, 1.9, -0.9], color: [110, 140, 255], power: 0.32, range: 4.2 });
  L.push({ pos: [-0.72, 0.5, -3.9], color: hsl((t * 50) % 360, 0.9, 0.6), power: 0.35, range: 1.9 });
  if (save.gear >= 2) L.push({ pos: [-4.1, 1.8, -3.1], color: [255, 250, 235], power: 0.55, range: 3.4 });
  if (save.gear >= 3) L.push({ pos: [-2.6, 2.8, -4.6], color: hsl((t * 40) % 360, 0.9, 0.6), power: 0.5, range: 3.2 });
  if (save.furniture >= 2) L.push({ pos: [2.0, 2.3, -4.6], color: [255, 90, 200], power: 0.45, range: 3 });
  return L;
}

/** Anillo plano (aro de luz) en un marco de superficie. */
function ringOn(f, a, b, r0, r1, color, o, off = 0.004, seg = 18) {
  for (let i = 0; i < seg; i++) {
    const t0 = (i / seg) * Math.PI * 2, t1 = ((i + 1) / seg) * Math.PI * 2;
    polyOn(f, [[a + Math.cos(t0) * r0, b + Math.sin(t0) * r0], [a + Math.cos(t0) * r1, b + Math.sin(t0) * r1],
      [a + Math.cos(t1) * r1, b + Math.sin(t1) * r1], [a + Math.cos(t1) * r0, b + Math.sin(t1) * r0]], color, o, off);
  }
}

/* ---------- Escritorio y equipo ---------- */
function drawDesk(t) {
  shadow(DESK.x, DESK.z, 1.7, 0.7, 0.28);
  beginGroup([DESK.x, DESK.top, DESK.z]);
  box(DESK.x, 0.76, DESK.z, DESK.w, 0.07, DESK.d, 'b88660', { top: 'c99a72' });
  box(-3.75, 0.37, DESK.z, 0.6, 0.72, 1.0, '424b66', { top: '4a5373' });
  for (const [y, h] of [[0.56, 0.26], [0.24, 0.3]]) {
    box(-3.75, y, -3.84, 0.52, h, 0.02, '4d5775');
    box(-3.75, y + 0.03, -3.826, 0.16, 0.025, 0.02, 'c9ced9');
  }
  for (const z of [-4.8, -3.9]) box(-1.18, 0.36, z, 0.07, 0.72, 0.07, '2d3348');
  box(-1.18, 0.14, DESK.z, 0.05, 0.05, 0.84, '2d3348');
  // Alfombrilla, teclado (RGB con el nivel 3) y ratón.
  box(-2.45, 0.797, -4.0, 1.7, 0.006, 0.5, '1e2436');
  box(-2.75, 0.815, -4.02, 0.78, 0.03, 0.24, '2c3348');
  for (let r = 0; r < 3; r++) {
    const lit = save.gear >= 3;
    box(-2.75, 0.832, -4.1 + r * 0.075, 0.72, 0.006, 0.05, lit ? hsl((t * 60 + r * 40) % 360, 0.9, 0.62) : '59638a', lit ? { emissive: true } : NO);
  }
  box(-2.0, 0.815, -4.0, 0.08, 0.035, 0.13, 'd8dbe6');
  // Taza y plantita.
  box(-3.95, 0.87, -4.0, 0.12, 0.15, 0.12, 'e9e3d6', { top: '5a3a28' });
  box(-3.875, 0.87, -4.0, 0.03, 0.08, 0.05, 'e9e3d6');
  box(-1.4, 0.87, -4.62, 0.14, 0.14, 0.14, 'e9e3d6', { top: '5a3d2e' });
  for (let k = 0; k < 4; k++) rig(-1.4, 0.94, -4.62, k * 1.6)(0, 0.09, 0.02, 0.06, 0.18, 0.03, '6fa56b', NO, 0.4, 0);
  drawMonitor(t);
  if (save.gear >= 1) drawMicAndCam();
  if (save.gear >= 3) drawSecondMonitor(t);
  if (save.capture) drawCaptureBox(t);
  if (save.pocket4) drawPocketCam(-3.55, 0.795, -4.2, 0.35, 'pocket4', t);
  if (save.pocket4p) drawPocketCam(-3.3, 0.795, -4.05, 0.15, 'pocket4p', t);
  endGroup();
}

function drawMonitor(t) {
  box(-2.6, 0.805, -4.62, 0.44, 0.025, 0.26, '2a3044');
  box(-2.6, 1.0, -4.67, 0.07, 0.4, 0.05, '2a3044');
  box(-2.6, 1.38, -4.64, 1.34, 0.78, 0.06, '1c2233');
  const f = makeFrame([-2.6, 1.38, -4.61], [1, 0, 0], [0, 1, 0]), o = { emissive: true, over: true };
  rectOn(f, 0, 0, 1.24, 0.68, '0f1a2e', { emissive: true, glow: 24, glowColor: 'rgba(140,235,150,.45)' });
  rectOn(f, 0, 0.3, 1.24, 0.08, '18233b', o);
  rectOn(f, -0.56, 0.3, 0.07, 0.035, 'b7f675', o);
  rectOn(f, 0.08, 0.3, 0.42, 0.035, '2a3654', o);
  rectOn(f, -0.14, 0.02, 0.8, 0.44, pending ? '3a1f35' : '22406a', o);
  rectOn(f, -0.14, -0.1, 0.8, 0.2, pending ? '4a2440' : '2d5a86', o);
  discOn(f, -0.14, 0.02, 0.09, 'ffffff', { ...o, alpha: 0.18 }, 0.004, 14);
  polyOn(f, [[-0.17, -0.03], [-0.08, 0.02], [-0.17, 0.07]], 'b7f675', o);
  const p = (t * 0.06) % 1;
  rectOn(f, -0.14, -0.24, 0.8, 0.02, '2d3a55', o);
  rectOn(f, -0.54 + 0.4 * p, -0.24, 0.8 * p, 0.02, 'b7f675', o);
  ['6c6ce0', 'e0955f', '9b5fc0'].forEach((c, i) => {
    rectOn(f, 0.43, 0.17 - i * 0.14, 0.3, 0.09, c, o);
    rectOn(f, 0.4, 0.105 - i * 0.14, 0.24, 0.018, '2a3654', o);
  });
  if (pending && Math.floor(t * 2) % 2) {
    discOn(f, -0.48, 0.2, 0.025, 'ff4d4d', o, 0.004, 10);
    rectOn(f, -0.4, 0.2, 0.09, 0.025, 'ff4d4d', o);
  }
}

function drawMicAndCam() {
  box(-1.3, 0.83, -4.8, 0.08, 0.08, 0.08, '2a2f45');
  box(-1.3, 1.1, -4.8, 0.035, 0.5, 0.035, '2a2f45');
  const dx = -0.65, dz = 0.65, len = Math.hypot(dx, dz);
  rig(-1.3, 0, -4.8, Math.atan2(dx, dz))(0, 1.36, len / 2, 0.035, 0.035, len, '2a2f45');
  box(-1.95, 1.26, -4.15, 0.1, 0.22, 0.1, '1f2436', { top: '59607a' });
  box(-1.95, 1.32, -4.15, 0.106, 0.06, 0.106, '8b92a8');
  box(-2.6, 1.805, -4.63, 0.16, 0.07, 0.07, '1f2436');
  const f = makeFrame([-2.6, 1.805, -4.594], [1, 0, 0], [0, 1, 0]);
  discOn(f, 0, 0, 0.024, '3a4a7a', { emissive: true }, 0.003, 10);
  if (pending) discOn(f, 0.055, 0, 0.008, 'ff4d4d', { emissive: true, glow: 6 }, 0.004, 6);
}

function drawSecondMonitor(t) {
  const x = -3.72, z = -4.5, ry = 0.38, c = Math.cos(ry), s = Math.sin(ry);
  box(x, 0.805, z, 0.34, 0.025, 0.22, '2a3044', { ry });
  box(x - s * 0.03, 0.98, z - c * 0.03, 0.06, 0.34, 0.05, '2a3044', { ry });
  box(x, 1.32, z, 1.0, 0.6, 0.05, '1c2233', { ry });
  const f = makeFrame([x + s * 0.027, 1.32, z + c * 0.027], [c, 0, -s], [0, 1, 0]), o = { emissive: true, over: true };
  rectOn(f, 0, 0, 0.92, 0.52, '101a2c', { emissive: true, glow: 16, glowColor: 'rgba(160,140,255,.4)' });
  const tick = Math.floor(t * 0.8);
  for (let i = 0; i < 6; i++) {
    const w = 0.3 + hash(i + tick) * 0.35, y = -0.19 + i * 0.075;
    discOn(f, -0.38, y, 0.022, i % 2 ? 'e0955f' : '6c8fd8', o, 0.004, 8);
    rectOn(f, -0.33 + w / 2, y, w, 0.028, i % 3 ? '3a4670' : 'b7f675', o);
  }
}

function drawChair() {
  const race = save.chair >= 1;   // la silla de carreras de la tienda
  const body = race ? '1b2030' : '2b3147', top = race ? '262d42' : '363d58';
  shadow(-2.6, -3.3, race ? 0.52 : 0.45, race ? 0.52 : 0.45, 0.25);
  beginGroup([-2.6, 0.6, -3.3]);
  for (let k = 0; k < 5; k++) {
    const leg = rig(-2.6, 0, -3.3, k * 1.2566 + 0.3);
    leg(0, 0.07, 0.17, 0.05, 0.04, 0.34, race ? '14171f' : '2a2f45');
    leg(0, 0.03, 0.33, 0.06, 0.06, 0.06, '14171f');
  }
  const p = rig(-2.6, 0, -3.3, Math.PI);
  p(0, 0.27, 0, 0.07, 0.36, 0.07, '8b92a8');
  p(0, 0.48, 0, 0.6, 0.1, 0.56, body, { top });
  p(0, 0.96, -0.27, 0.56, 0.9, 0.1, body);
  for (const sd of [-1, 1]) {
    p(sd * 0.2, 0.96, -0.325, 0.07, 0.8, 0.012, 'b7f675');
    p(sd * 0.2, 0.96, -0.214, 0.07, 0.8, 0.012, 'b7f675');
    p(sd * 0.33, 0.63, 0, 0.06, 0.22, 0.06, '2a2f45');
    p(sd * 0.33, 0.75, 0.02, 0.1, 0.04, 0.36, '1f2436');
  }
  if (race) {
    // Alas laterales, reposacabezas y cojín lumbar: se nota desde la puerta.
    for (const sd of [-1, 1]) {
      p(sd * 0.27, 0.55, 0.03, 0.09, 0.14, 0.46, body, { top: 'b7f675' });
      p(sd * 0.26, 1.02, -0.2, 0.08, 0.76, 0.14, body);
    }
    p(0, 1.47, -0.25, 0.32, 0.2, 0.14, '242b3e');
    p(0, 1.47, -0.18, 0.24, 0.1, 0.02, 'b7f675');
    p(0, 0.78, -0.2, 0.32, 0.13, 0.05, 'b7f675');
  }
  p(0, 1.3, -0.2, 0.3, 0.14, 0.08, '1f2436');
  endGroup();
}

/** Caja de captura del escritorio: tres pilotos que parpadean mientras grabas. */
function drawCaptureBox(t) {
  const x = -1.62, y = 0.83, z = -4.3;
  box(x, y, z, 0.3, 0.09, 0.2, '1b2030', { top: '262d42' });
  box(x, y + 0.05, z - 0.02, 0.22, 0.008, 0.12, '2c3348');
  for (let k = 0; k < 3; k++) {
    const on = (t * 2 + k * 0.7) % 2 < 1.2;
    box(x - 0.08 + k * 0.08, y + 0.02, z + 0.102, 0.03, 0.02, 0.006,
      on ? 'b7f675' : '3a4670', on ? { emissive: true, glow: 5 } : NO);
  }
  box(x + 0.16, y, z + 0.06, 0.03, 0.03, 0.03, '59638a');
}

function drawTower(t) {
  shadow(-0.72, -4.45, 0.3, 0.5, 0.25);
  beginGroup([-0.72, 0.45, -4.45]);
  box(-0.72, 0.46, -4.45, 0.42, 0.9, 0.86, '1e2334', { top: '262c40' });
  const side = makeFrame([-0.51, 0.46, -4.45], [0, 0, -1], [0, 1, 0]), col = hsl((t * 50) % 360, 0.9, 0.6);
  const o = { emissive: true, over: true };
  rectOn(side, 0, 0, 0.7, 0.72, '10131f', { emissive: true });
  for (const b of [0.18, -0.14]) {
    discOn(side, 0.18, b, 0.12, col, { ...o, glow: 10 }, 0.004, 14);
    discOn(side, 0.18, b, 0.05, '10131f', o, 0.004, 10);
  }
  rectOn(side, -0.14, 0.02, 0.34, 0.08, '3a4260', o);
  rectOn(side, -0.14, 0.02, 0.32, 0.012, col, o);
  const front = makeFrame([-0.72, 0.46, -4.02], [1, 0, 0], [0, 1, 0]);
  rectOn(front, 0, 0, 0.38, 0.86, '232839');
  rectOn(front, 0, 0.36, 0.1, 0.02, 'b7f675', { emissive: true, over: true, glow: 6 });
  for (let i = 0; i < 4; i++) rectOn(front, 0, -0.1 - i * 0.05, 0.26, 0.015, '141827', { over: true });
  endGroup();
}

function drawRingLight() {
  const x = -4.35, z = -3.1;
  shadow(x, z, 0.3, 0.3, 0.22);
  beginGroup([x, 1, z]);
  box(x, 0.03, z, 0.42, 0.04, 0.42, '2a2f45');
  box(x, 0.92, z, 0.04, 1.76, 0.04, '2a2f45');
  const f = makeFrame([x + 0.03, 1.8, z], [0, 0, -1], [0, 1, 0]);
  ringOn(f, 0, 0, 0.24, 0.32, 'fff6e8', { emissive: true, twoSided: true, glow: 18, glowColor: 'rgba(255,245,220,.8)' });
  box(x + 0.03, 1.8, z, 0.02, 0.22, 0.12, '1f2436');
  endGroup();
}

/* ---------- Dormitorio y salón ---------- */
function drawBed(t) {
  const fancy = save.furniture >= 1, blanket = fancy ? 'a86fa6' : 'c58973', fold = fancy ? 'c895c3' : 'dca08a';
  shadow(4.1, -3.85, 0.95, 1.2, 0.26);
  beginGroup([4.1, 0.5, -3.85]);
  box(4.1, 0.18, -3.85, 1.6, 0.26, 2.12, '9c7358', { top: '8a6449' });
  box(4.1, 0.4, -3.83, 1.5, 0.2, 2.0, 'f1ebe1');
  box(4.1, 0.52, -3.25, 1.54, 0.08, 1.24, blanket);
  box(4.1, 0.565, -3.85, 1.54, 0.05, 0.14, fold);
  box(4.1, 0.38, -2.61, 1.54, 0.36, 0.04, blanket);
  for (const x of [3.75, 4.45]) box(x, 0.58, -4.5, 0.6, 0.13, 0.38, 'fbf7f0');
  box(4.1, 0.72, -4.88, 1.66, 0.95, 0.08, '8a6449');
  box(4.1, 1.21, -4.88, 1.72, 0.05, 0.12, '7a5840');
  endGroup();
  beginGroup([3.8, 0.8, -3.1]);
  drawCat(3.8, 0.56, -3.1, 0.5, t);
  endGroup();
}

function drawNightstand() {
  shadow(2.9, -4.62, 0.36, 0.32, 0.24);
  beginGroup([2.9, 0.4, -4.62]);
  box(2.9, 0.3, -4.62, 0.55, 0.6, 0.5, 'a57a58', { top: 'b88660' });
  box(2.9, 0.4, -4.36, 0.46, 0.18, 0.02, 'b88660');
  box(2.9, 0.4, -4.345, 0.08, 0.03, 0.02, 'e3c56a');
  box(2.75, 0.62, -4.52, 0.2, 0.04, 0.26, '4f7fb8');
  box(2.95, 0.635, -4.72, 0.14, 0.07, 0.14, 'e9e3d6');
  box(2.95, 0.78, -4.72, 0.03, 0.24, 0.03, 'e9e3d6');
  box(2.95, 0.98, -4.72, 0.3, 0.22, 0.3, 'ffd9a0', { emissive: true, glow: 20, glowColor: 'rgba(255,190,110,.65)' });
  endGroup();
}

function drawSofa() {
  const fancy = save.furniture >= 1, body = fancy ? 'b578aa' : '848ba5', cushion = fancy ? 'c690bb' : '979eb8';
  shadow(3.0, 4.1, 1.5, 0.62, 0.28);
  beginGroup([3.0, 0.5, 4.08]);
  for (const x of [1.8, 4.2]) for (const z of [3.65, 4.5]) box(x, 0.05, z, 0.08, 0.1, 0.08, '3a2f2a');
  box(3.0, 0.28, 4.1, 2.6, 0.36, 1.0, body);
  box(3.0, 0.8, 4.5, 2.6, 0.72, 0.22, body);
  for (const x of [2.4, 3.6]) {
    box(x, 0.53, 3.96, 1.12, 0.14, 0.76, cushion);
    box(x, 0.8, 4.32, 1.08, 0.46, 0.14, cushion);
  }
  for (const x of [1.78, 4.22]) box(x, 0.52, 4.08, 0.24, 0.56, 1.04, body, { top: cushion });
  if (fancy) {
    box(1.98, 0.74, 4.18, 0.32, 0.32, 0.12, 'f0c75a', { ry: 0.35 });
    box(4.02, 0.74, 4.18, 0.32, 0.32, 0.12, '5bb3a8', { ry: -0.35 });
    box(4.22, 0.82, 3.95, 0.3, 0.05, 0.62, 'efe7dc');
  }
  endGroup();
}

function drawFloorLamp() {
  shadow(4.6, 4.55, 0.25, 0.25, 0.25);
  beginGroup([4.6, 0, 4.55]);
  box(4.6, 0.02, 4.55, 0.34, 0.04, 0.34, '2a2f45');
  box(4.6, 0.86, 4.55, 0.04, 1.66, 0.04, '2a2f45');
  box(4.6, 1.8, 4.55, 0.42, 0.34, 0.42, 'ffe2b0', { emissive: true, glow: 22, glowColor: 'rgba(255,200,120,.6)' });
  endGroup();
}

function drawCabinet() {
  const x = -4.62, z = 2.2, wood = 'e0d6c6';
  shadow(x, z, 0.4, 0.95, 0.24);
  beginGroup([x, 0.6, z]);
  box(-4.86, 0.56, z, 0.06, 1.12, 1.7, 'b9ad99');
  for (const zz of [1.37, 3.03]) box(x, 0.56, zz, 0.56, 1.12, 0.04, wood);
  box(x, 1.1, z, 0.6, 0.04, 1.72, wood, { top: 'eee6d8' });
  box(x, 0.04, z, 0.56, 0.08, 1.7, wood);
  box(x, 0.57, z, 0.56, 0.03, 1.66, wood);
  drawBooks(1.42, 0.08, -4.64, 1.55, 5, 0.3, true);
  drawBooks(1.42, 0.585, -4.64, 1.55, 9, 0.3, true);
  box(x, 1.18, 2.6, 0.42, 0.12, 0.42, '3a3f55');
  box(x, 1.245, 2.6, 0.32, 0.01, 0.32, '15161c');
  box(x, 1.252, 2.6, 0.1, 0.006, 0.1, 'e05a5a');
  box(-4.72, 1.26, 1.75, 0.04, 0.28, 0.22, '5a4636');
  rectOn(makeFrame([-4.7, 1.26, 1.75], [0, 0, -1], [0, 1, 0]), 0, 0, 0.15, 0.2, '6c8fd8', NO, 0.002);
  endGroup();
}

function drawBeanbag() {
  shadow(-1.3, 3.5, 0.6, 0.6, 0.26);
  beginGroup([-1.3, 0.3, 3.5]);
  const p = rig(-1.3, 0, 3.5, 0.5);
  p(0, 0.15, 0, 0.95, 0.3, 0.95, 'e0955f');
  p(0, 0.34, 0.05, 0.8, 0.1, 0.78, 'e8a36e');
  p(0, 0.5, -0.28, 0.72, 0.36, 0.3, 'e0955f', NO, -0.25, 0.35);
  endGroup();
}

/* ---------- Suelo: alfombra y luz de luna ---------- */
function drawRug() {
  const fancy = save.furniture >= 1, F = floorFrame(0.01), o = { layer: LAYER.RUG }, ov = { ...o, over: true };
  const [A, B, C, D] = fancy ? ['b9577a', 'efc97a', '5bb3a8', 'f4efe6'] : ['5d6886', '76819f', '8a95b3', '6d7896'];
  rectOn(F, 0, -0.3, 3.9, 3.0, A, o, 0);
  rectOn(F, 0, -0.3, 3.6, 2.7, B, ov, 0);
  rectOn(F, 0, -0.3, 3.3, 2.4, A, ov, 0);
  polyOn(F, [[0, -1.35], [1.35, -0.3], [0, 0.75], [-1.35, -0.3]], C, ov, 0);
  polyOn(F, [[0, -0.8], [0.7, -0.3], [0, 0.2], [-0.7, -0.3]], D, ov, 0);
  for (let z = -1.1; z <= 1.7; z += 0.14) for (const x of [-2.0, 2.0]) floorRect(x, z, 0.12, 0.03, 0.011, B, o);
}
function drawMoonlight() {
  face([[-4.92, 0.013, -1.85], [-4.92, 0.013, 0.05], [-2.6, 0.013, 0.75], [-2.6, 0.013, -1.15]], 'b4c8ff',
    { emissive: true, alpha: 0.07, layer: LAYER.RUG, twoSided: true });
}

/** Todo el mobiliario del estudio. */
function drawStudio(t) {
  drawRug();
  drawMoonlight();
  drawDesk(t);
  drawChair();
  drawTower(t);
  if (save.gear >= 2) drawRingLight();
  drawBed(t);
  drawNightstand();
  drawSofa();
  drawFloorLamp();
  drawCabinet();
  if (save.furniture >= 1) drawBeanbag();
  shadow(-4.2, 4.2, 0.45, 0.45, 0.25);
  beginGroup([-4.2, 0.5, 4.2]); drawPlant(-4.2, 4.2, t, 1.25); endGroup();
  shadow(2.15, -4.6, 0.25, 0.25, 0.22);
  beginGroup([2.15, 0.4, -4.6]); drawPlant(2.15, -4.6, t + 2, 0.75); endGroup();
  if (!save.videos.length || pending) {
    beginGroup([-2.6, 2.1, -3.9]);
    star3(-2.6, 2.1 + Math.sin(t * 3) * 0.07, -3.9, 0.17, t * 2, 'b7f675', { emissive: true, glow: 16 });
    endGroup();
  }
}

/* ---------- Decoración de las paredes del estudio ---------- */
// Pared del fondo (z = -5): balda con libros y trofeo, cuadro, paneles, neón y tira LED.
decor('studio', 'z', -5, 1, -2.9, f => {
  boxOn(f, -2.9, 2.3, 1.5, 0.05, 0.26, 'b88660');
  drawBooks(-3.6, 2.325, -4.92 + 0.13, 0.9, 11, 0.2);
  box(-2.35, 2.345, -4.92 + 0.13, 0.14, 0.04, 0.12, '6b5a3a');
  box(-2.35, 2.43, -4.92 + 0.13, 0.1, 0.14, 0.1, 'e8c35a', { top: 'f4d77a' });
});
decor('studio', 'z', -5, 1, 0.2, f => {
  boxOn(f, 0.2, 2.0, 1.25, 0.92, 0.04, '5a4636');
  rectOn(f, 0.2, 2.0, 1.1, 0.77, 'efe2c6', NO, 0.045);
  discOn(f, 0.45, 2.15, 0.16, 'e8875f', { over: true }, 0.045);
  polyOn(f, [[-0.35, 1.62], [0.75, 1.62], [0.35, 1.72], [0.05, 1.98]], '5c9159', { over: true }, 0.045);
  polyOn(f, [[-0.05, 1.62], [0.75, 1.62], [0.4, 1.9]], '3f6f59', { over: true }, 0.045);
});
for (const a of [-4.3, -0.95]) {
  decor('studio', 'z', -5, 1, a, f => {
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++)
      boxOn(f, a - 0.17 + c * 0.34, 1.55 + r * 0.34, 0.32, 0.32, 0.05, (r + c) % 2 ? '2c3350' : '39406a');
  }, () => save.gear >= 2);
}
decor('studio', 'z', -5, 1, 2.0, f => drawNeonSign(f), () => save.furniture >= 2);
decor('studio', 'z', -5, 1, -2.6, f => {
  rectOn(f, -2.6, 2.98, 4.3, 0.035, hsl((clock * 40) % 360, 0.9, 0.62), { emissive: true, glow: 14 }, 0.01);
}, () => save.gear >= 3);

// Pared izquierda (x = -5): cortinas, cactus en el alféizar y placa de los 1.000 suscriptores.
decor('studio', 'x', -5, 1, -0.9, f => {
  const a = 0.9, fancy = save.furniture >= 1, curtain = fancy ? 'c9657a' : '8f7fa8', fold = fancy ? 'a94f64' : '76688f';
  boxOn(f, a, 2.8, 2.9, 0.04, 0.04, '3a3f55', NO, 0.12);
  for (const side of [-1, 1]) {
    const ca = a + side * 1.18;
    boxOn(f, ca, 1.72, 0.4, 2.1, 0.08, curtain, NO, 0.06);
    for (let k = -1; k <= 1; k++) rectOn(f, ca + k * 0.13, 1.72, 0.035, 2.08, fold, NO, 0.141);
  }
  box(-4.92 + 0.08, 1.21, -0.35, 0.12, 0.12, 0.12, 'c77a55');
  box(-4.92 + 0.08, 1.36, -0.35, 0.07, 0.2, 0.07, '6fa56b');
  box(-4.92 + 0.08, 1.39, -0.29, 0.05, 0.1, 0.05, '6fa56b');
});
decor('studio', 'x', -5, 1, 2.2, f => {
  boxOn(f, -2.2, 2.1, 0.7, 0.85, 0.04, '2a2f45');
  rectOn(f, -2.2, 2.12, 0.56, 0.62, 'd9dde8', { glow: 8, glowColor: 'rgba(230,235,255,.5)' }, 0.045);
  rectOn(f, -2.2, 2.17, 0.24, 0.17, 'e04a4a', { over: true }, 0.045);
  polyOn(f, [[-2.24, 2.12], [-2.13, 2.17], [-2.24, 2.22]], 'ffffff', { over: true }, 0.045);
  textOn(f, -2.2, 1.84, channelName(), 'c9a55a', { over: true }, 0.046, Math.min(0.026, 0.52 / Math.max(7, textCols(channelName(), 10))), 10);
}, () => save.subs >= PLAQUE_AT);

// Vitrina de hitos: una placa por cada meta de suscriptores que ya has pasado.
decor('studio', 'x', 5, -1, 1.05, f => {
  const a = 1.05, won = MILESTONES.filter(m => save.subs >= m).length;
  for (let row = 0; row < 2; row++) {
    const b = 1.62 + row * 0.52;
    boxOn(f, a, b, 1.6, 0.06, 0.22, '6b4f38', { top: '7d5e43' });
    for (let i = 0; i < 4; i++) {
      const n = row * 4 + i;
      if (n >= won || n >= MILESTONES.length) break;
      const x = a - 0.6 + i * 0.4, metal = n >= 5 ? 'f7e36b' : n >= 3 ? 'd8dde8' : 'd9a05a';
      boxOn(f, x, b + 0.09, 0.1, 0.11, 0.1, '3a2f26', NO, 0.06);
      boxOn(f, x, b + 0.2, 0.16, 0.13, 0.12, metal, { glow: 6 }, 0.05);
      rectOn(f, x, b + 0.09, 0.08, 0.05, metal, { over: true }, 0.115);
    }
  }
  if (!won) rectOn(f, a, 1.88, 0.5, 0.04, '4a5373', { over: true }, 0.06);
}, () => save.trophies >= 1);

// Pared derecha (x = 5): reloj con la hora real y póster de Salto neón.
decor('studio', 'x', 5, -1, -1.3, f => {
  const now = new Date(), a = -1.3, b = 2.25;
  discOn(f, a, b, 0.33, '2a2f45', NO, 0.02);
  discOn(f, a, b, 0.28, 'f4f1e8', { over: true }, 0.02);
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2;
    discOn(f, a + Math.sin(ang) * 0.23, b + Math.cos(ang) * 0.23, i % 3 ? 0.01 : 0.018, '2a2f45', { over: true }, 0.02, 6);
  }
  const sec = now.getSeconds() + now.getMilliseconds() / 1000, min = now.getMinutes() + sec / 60, hr = (now.getHours() % 12) + min / 60;
  clockHand(f, a, b, (hr / 12) * Math.PI * 2, 0.14, 0.03, '2a2f45');
  clockHand(f, a, b, (min / 60) * Math.PI * 2, 0.21, 0.02, '2a2f45');
  clockHand(f, a, b, (sec / 60) * Math.PI * 2, 0.23, 0.008, 'e04a4a');
});
decor('studio', 'x', 5, -1, 3.4, f => {
  boxOn(f, 3.4, 2.0, 0.86, 1.16, 0.03, '1f2436');
  rectOn(f, 3.4, 2.0, 0.76, 1.06, '2a1f4d', NO, 0.035);
  discOn(f, 3.4, 2.05, 0.22, 'ff8a5c', { over: true }, 0.035);
  for (let k = 0; k < 3; k++) rectOn(f, 3.4, 1.95 + k * 0.07, 0.46, 0.022, '2a1f4d', { over: true }, 0.035);
  rectOn(f, 3.4, 1.72, 0.76, 0.3, '3d2a6b', { over: true }, 0.035);
  for (let k = -3; k <= 3; k++) rectOn(f, 3.4 + k * 0.1, 1.72, 0.01, 0.3, 'e25ab5', { over: true }, 0.035);
  rectOn(f, 3.4, 2.38, 0.56, 0.1, 'b7f675', { over: true }, 0.035);
});

// Pared delantera (z = 5): fotos enmarcadas sobre el sofá.
decor('studio', 'z', 5, -1, 3.0, f => {
  [[-3.6, 2.0, 'e0955f'], [-3.0, 2.12, '6c8fd8'], [-2.4, 2.0, '9b5fc0']].forEach(([a, b, c], i) => {
    boxOn(f, a, b, 0.42, 0.52, 0.03, '5a4636');
    rectOn(f, a, b, 0.34, 0.44, c, NO, 0.035);
    discOn(f, a, b + 0.05, 0.07, 'f6e3c8', { over: true }, 0.035, 10);
    rectOn(f, a, b - 0.12, 0.2, 0.12, i === 1 ? 'b7f675' : 'f6e3c8', { over: true }, 0.035);
  });
});

/** Manecilla del reloj (ang en radianes, en el sentido de las agujas desde las 12). */
function clockHand(f, a, b, ang, len, w, color) {
  const dx = Math.sin(ang), dy = Math.cos(ang), px = dy * w / 2, py = -dx * w / 2;
  polyOn(f, [[a + px, b + py], [a + dx * len + px * 0.4, b + dy * len + py * 0.4], [a + dx * len - px * 0.4, b + dy * len - py * 0.4], [a - px, b - py]],
    color, { over: true }, 0.02);
}

/** Letrero de neón con el logo (botón de reproducir dentro de un marco). */
/** Letrero de neón de la pared: lleva escrito el nombre que le hayas puesto al canal. */
function drawNeonSign(f) {
  const a = 2.0, b = 2.35, pulse = 0.85 + 0.15 * Math.sin(clock * 3), pink = [255 * pulse, 90 * pulse, 200 * pulse];
  const o = { emissive: true, glow: 16 };
  const cols = Math.max(7, textCols(channelName(), 10)), cell = Math.min(0.062, 1.0 / cols);
  const w = cols * cell + 0.66, h = 0.56;             // el rótulo crece con el nombre
  boxOn(f, a, b, w + 0.12, h + 0.1, 0.03, '161a2b');
  rectOn(f, a, b + h / 2, w, 0.03, pink, o, 0.04);
  rectOn(f, a, b - h / 2, w, 0.03, pink, o, 0.04);
  rectOn(f, a - w / 2, b, 0.03, h, pink, o, 0.04);
  rectOn(f, a + w / 2, b, 0.03, h, pink, o, 0.04);
  const left = a - w / 2 + 0.14;
  polyOn(f, [[left, b - 0.13], [left + 0.25, b], [left, b + 0.13]], 'b7f675', o, 0.04);
  textOn(f, left + 0.31 + (cols * cell) / 2, b, channelName(), pink, o, 0.042, cell, 10);
}
