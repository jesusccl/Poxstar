'use strict';
/* Putup · Salón, cocina, recibidor y baño: muebles, decoración de pared, luces y colisiones. */

const homeState = { tv: false, fridge: 0, fridgeGoal: 0 };

const ROOM_SOLIDS = [
  // Salón
  [10.5, -4.62, 2.6, 0.5], [8.8, -4.6, 0.36, 0.36], [12.2, -4.6, 0.36, 0.36], [10.5, -1.6, 1.6, 0.8], [10.5, 0.6, 3.1, 1.05],
  [7.4, -1.6, 0.95, 0.95], [8.4, 0.7, 0.5, 0.5], [13.3, 1.9, 0.4, 0.4], [5.3, -3.3, 0.45, 1.65], [14.3, -4.3, 0.7, 0.7],
  // Cocina
  [14.55, 3.65, 0.74, 0.82], [14.59, 7.5, 0.66, 6.2], [12.8, 10.59, 3.1, 0.66], [14.6, 10.66, 0.66, 0.52],
  [8.2, 6.6, 1.8, 1.0], [7.7, 5.85, 0.5, 0.5], [8.7, 5.85, 0.5, 0.5], [7.7, 7.35, 0.5, 0.5], [8.7, 7.35, 0.5, 0.5], [5.9, 10.3, 0.6, 0.6],
  // Recibidor
  [0.3, 6.9, 0.4, 1.2], [4.55, 10.45, 0.5, 0.5], [4.65, 9.3, 0.42, 1.0], [0.45, 10.45, 0.55, 0.55], [1.35, 10.6, 0.3, 0.3],
  // Baño
  [-3.55, 10.45, 2.32, 0.95], [-4.5, 6.3, 0.8, 0.5], [-2.3, 5.35, 1.1, 0.52], [-0.55, 10.4, 0.5, 0.5], [-0.5, 5.55, 0.5, 0.5],
  // Casa de al lado · salón
  [25.0, -1.1, 2.1, 0.82], [25.0, 0.7, 1.1, 0.6], [23.0, -1.3, 0.4, 0.4], [27.3, 4.2, 0.55, 0.55],
  // Casa de al lado · taller
  [30.4, -1.3, 2.3, 0.75], [32.6, 1.6, 0.34, 1.9], [29.8, 0.5, 0.38, 0.38], [29.1, 4.3, 0.6, 0.4],
];

function roomLights(t) {
  const tvLight = homeState.tv ? [{ pos: [10.5, 1.2, -4.0], color: hsl((t * 30) % 360, 0.6, 0.6), power: 0.55 + 0.1 * Math.sin(t * 11), range: 5 }] : [];
  return {
    living: [
      ...tvLight,
      { pos: [13.3, 1.8, 1.9], color: [255, 185, 110], power: 0.7, range: 4.2 },
      { pos: [8.4, 1.1, 0.7], color: [255, 190, 120], power: 0.5, range: 3 },
      { pos: [14.5, 1.8, -1.0], color: [110, 140, 255], power: 0.28, range: 4 },
      ...(save.arcade ? [{ pos: [13.6, 1.3, -2.6], color: hsl((t * 50) % 360, 0.75, 0.62), power: 0.5, range: 3.4 }] : []),
    ],
    kitchen: [
      { pos: [8.2, 2.2, 6.6], color: [255, 200, 130], power: 0.75, range: 4.5 },
      { pos: [14.2, 1.6, 7.2], color: [255, 225, 170], power: 0.45, range: 3.4 },
      ...(homeState.fridge > 0.05 ? [{ pos: [13.9, 1.1, 3.65], color: [220, 240, 255], power: 0.6 * homeState.fridge, range: 2.6 }] : []),
    ],
    hall: [{ pos: [2.5, 2.7, 8], color: [255, 205, 150], power: 0.6, range: 4.5 }],
    bath: [{ pos: [-2.3, 2.2, 5.5], color: [235, 245, 255], power: 0.65, range: 4 }],
    // Casa de al lado: el vecino tiene la luz encendida a estas horas.
    vsala: [
      { pos: [23.0, 1.8, -1.3], color: [255, 205, 150], power: 0.62, range: 4 },
      { pos: [25.0, 2.6, 1.0], color: [255, 215, 165], power: 0.5, range: 4.6 },
    ],
    vtaller: [
      { pos: [30.4, 2.4, -1.0], color: [240, 248, 255], power: 0.66, range: 4.4 },
      { pos: [32.3, 1.7, 1.6], color: [255, 210, 150], power: 0.3, range: 3 },
    ],
  };
}

/* ---------- Piezas genéricas ---------- */
/** Sofá orientado: `yaw` 0 mira hacia +z; `len` es el ancho. */
function drawCouch(x, z, yaw, len, body, cushion, pillows = []) {
  const p = rig(x, 0, z, yaw), seats = Math.max(1, Math.round(len / 1.1)), sw = (len - 0.5) / seats;
  shadow(x, z, len / 2 + 0.1, 0.62, 0.28);
  beginGroup([x, 0, z]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) p(sx * (len / 2 - 0.12), 0.05, sz * 0.4, 0.08, 0.1, 0.08, '3a2f2a');
  p(0, 0.28, 0, len, 0.36, 1.0, body);
  p(0, 0.8, -0.4, len, 0.72, 0.22, body);
  for (let i = 0; i < seats; i++) {
    const cx = -len / 2 + 0.25 + sw * (i + 0.5);
    p(cx, 0.53, 0.12, sw - 0.04, 0.14, 0.76, cushion);
    p(cx, 0.8, -0.22, sw - 0.06, 0.46, 0.14, cushion);
  }
  for (const s of [-1, 1]) p(s * (len / 2 - 0.12), 0.52, 0.02, 0.24, 0.56, 1.04, body, { top: cushion });
  pillows.forEach(([px, c]) => p(px, 0.74, -0.1, 0.32, 0.32, 0.12, c, { ry: px * 0.4 }));
  endGroup();
}
function drawTableLamp(x, y, z, shade = 'ffe2b0') {
  box(x, y + 0.03, z, 0.18, 0.06, 0.18, '2a2f45');
  box(x, y + 0.22, z, 0.03, 0.34, 0.03, '2a2f45');
  box(x, y + 0.46, z, 0.34, 0.24, 0.34, shade, { emissive: true, glow: 16, glowColor: 'rgba(255,200,120,.55)' });
}
/** Módulo de cocina bajo con encimera; `face` = dirección hacia la que mira el frente (+1/-1 en el eje). */
function counterModule(axis, x, z, w, kind, t) {
  const d = 0.62, frontSign = -1; // todos los tramos miran hacia el interior (-x o -z)
  const bx = axis === 'x' ? d : w, bz = axis === 'x' ? w : d;
  box(x, 0.43, z, bx - 0.02, 0.86, bz - 0.02, 'f2efe8');
  box(x + (axis === 'x' ? -0.02 : 0), 0.885, z + (axis === 'z' ? -0.02 : 0), bx + 0.03, 0.05, bz + 0.03, '3a3f55', { top: '4a5068' });
  const f = axis === 'x' ? makeFrame([x - d / 2 + 0.005, 0, z], [0, 0, 1], [0, 1, 0]) : makeFrame([x, 0, z - d / 2 + 0.005], [-1, 0, 0], [0, 1, 0]);
  if (kind === 'stove') {
    rectOn(f, 0, 0.42, w - 0.1, 0.62, '2b3042');
    rectOn(f, 0, 0.45, w - 0.24, 0.34, '4a5470', { over: true });
    rectOn(f, 0, 0.72, w - 0.2, 0.03, 'c9ced9', { over: true });
    for (let i = -1; i <= 1; i += 2) for (let j = -1; j <= 1; j += 2) {
      const cx = x + (axis === 'x' ? i * 0.13 : j * 0.13), cz = z + (axis === 'x' ? j * 0.13 : i * 0.13);
      discOn(floorFrame(0.913), cx, -cz, 0.09, '1b1e28', NO, 0, 12);
      discOn(floorFrame(0.915), cx, -cz, 0.05, Math.sin(t * 3 + i + j) > 0.95 ? 'ff6a3d' : '2b2f3d', { emissive: true }, 0, 10);
    }
  } else if (kind === 'sink') {
    rectOn(f, -w / 4 + 0.01, 0.44, w / 2 - 0.06, 0.62, 'e4e0d8');
    rectOn(f, w / 4 - 0.01, 0.44, w / 2 - 0.06, 0.62, 'e4e0d8');
    floorRect(x + (axis === 'x' ? 0.05 : 0), z + (axis === 'z' ? 0.05 : 0), axis === 'x' ? 0.38 : w - 0.18, axis === 'x' ? w - 0.18 : 0.38, 0.912, '9aa3b5');
    const fx = x + (axis === 'x' ? 0.22 : 0), fz = z + (axis === 'z' ? 0.22 : 0);
    box(fx, 1.02, fz, 0.04, 0.22, 0.04, 'c9ced9');
    box(fx - (axis === 'x' ? 0.08 : 0), 1.12, fz - (axis === 'z' ? 0.08 : 0), axis === 'x' ? 0.18 : 0.03, 0.03, axis === 'x' ? 0.03 : 0.18, 'c9ced9');
  } else if (kind === 'drawers') {
    for (let k = 0; k < 3; k++) {
      rectOn(f, 0, 0.18 + k * 0.25, w - 0.08, 0.21, 'e4e0d8');
      rectOn(f, 0, 0.24 + k * 0.25, 0.18, 0.025, 'aab0bd', { over: true });
    }
  } else {
    rectOn(f, 0, 0.44, w - 0.08, 0.72, 'e4e0d8');
    rectOn(f, frontSign * (w / 2 - 0.12), 0.62, 0.025, 0.16, 'aab0bd', { over: true });
  }
}
function drawChairAt(x, z, yaw, color = 'b88660') {
  const p = rig(x, 0, z, yaw);
  shadow(x, z, 0.26, 0.26, 0.2);
  beginGroup([x, 0, z]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) p(sx * 0.17, 0.22, sz * 0.17, 0.04, 0.44, 0.04, '6b4a36');
  p(0, 0.46, 0, 0.44, 0.05, 0.44, color);
  p(0, 0.78, -0.2, 0.44, 0.6, 0.04, color);
  endGroup();
}

/* ---------- Salón ---------- */
function drawLiving(t) {
  const F = floorFrame(0.01), o = { layer: LAYER.RUG }, ov = { ...o, over: true };
  rectOn(F, 10.5, 1.4, 4.6, 3.3, 'b3664f', o, 0);
  rectOn(F, 10.5, 1.4, 4.2, 2.9, 'e8d8b8', ov, 0);
  for (let k = -3; k <= 3; k++) rectOn(F, 10.5 + k * 0.55, 1.4, 0.12, 2.9, 'c9a27a', ov, 0);
  // Mueble de la tele, tele y altavoces.
  shadow(10.5, -4.62, 1.4, 0.35, 0.26);
  beginGroup([10.5, 0, -4.62]);
  box(10.5, 0.27, -4.62, 2.6, 0.46, 0.5, '3a2f2a', { top: '4a3c34' });
  for (const k of [-1, 0, 1]) {
    box(10.5 + k * 0.85, 0.27, -4.365, 0.8, 0.36, 0.02, '52433a');
    box(10.5 + k * 0.85, 0.3, -4.35, 0.14, 0.025, 0.02, 'c9a55a');
  }
  box(10.5, 0.53, -4.68, 0.5, 0.04, 0.26, '1f2230');
  box(10.5, 0.7, -4.72, 0.08, 0.34, 0.05, '1f2230');
  box(10.5, 1.26, -4.72, 2.16, 1.22, 0.07, '15171f');
  box(10.5, 0.56, -4.45, 1.1, 0.07, 0.1, '1f2436');
  const f = makeFrame([10.5, 1.26, -4.684], [1, 0, 0], [0, 1, 0]), ov2 = { emissive: true, over: true };
  if (homeState.tv) {
    rectOn(f, 0, 0, 2.02, 1.1, '2a1553', { emissive: true, glow: 26, glowColor: 'rgba(190,120,255,.45)' });
    rectOn(f, 0, -0.18, 2.02, 0.4, '1a0f38', ov2);
    discOn(f, 0, 0.12, 0.24, 'ffb36b', ov2, 0.004, 16);
    for (let k = 0; k < 3; k++) rectOn(f, 0, 0.02 + k * 0.05, 0.5, 0.018, '2a1553', ov2);
    polyOn(f, [[-0.3, -0.55], [0.3, -0.55], [0.05, -0.02], [-0.05, -0.02]], '41477a', ov2);
    const jump = Math.abs(Math.sin(t * 4)) * 0.16, lane = Math.round(Math.sin(t * 0.7)) * 0.12;
    rectOn(f, lane, -0.38 + jump, 0.07, 0.1, 'b7f675', ov2);
    rectOn(f, -0.9 + ((t * 0.08) % 1) * 1.8, -0.5, 0.05, 0.05, 'f7e36b', ov2);
    rectOn(f, 0, -0.52, 2.02, 0.03, 'b7f675', { ...ov2, alpha: 0.5 });
  } else {
    rectOn(f, 0, 0, 2.02, 1.1, '0c0e16', { emissive: true });
    polyOn(f, [[-0.9, 0.5], [-0.8, -0.1], [-0.4, 0.5]], 'ffffff', { emissive: true, over: true, alpha: 0.06 });
  }
  endGroup();
  for (const sx of [8.8, 12.2]) {
    shadow(sx, -4.6, 0.25, 0.25, 0.22);
    beginGroup([sx, 0, -4.6]);
    box(sx, 0.45, -4.6, 0.34, 0.9, 0.34, '1f2436');
    const sf = makeFrame([sx, 0, -4.429], [1, 0, 0], [0, 1, 0]);
    discOn(sf, 0, 0.62, 0.1, '3a4260', NO, 0.002, 12);
    discOn(sf, 0, 0.3, 0.12, '3a4260', NO, 0.002, 12);
    endGroup();
  }
  // Mesa de centro con revista, mando y taza.
  shadow(10.5, -1.6, 0.9, 0.5, 0.25);
  beginGroup([10.5, 0, -1.6]);
  box(10.5, 0.4, -1.6, 1.6, 0.06, 0.8, 'b88660', { top: 'c99a72' });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(10.5 + sx * 0.72, 0.19, -1.6 + sz * 0.32, 0.06, 0.38, 0.06, '6b4a36');
  box(10.5, 0.1, -1.6, 1.4, 0.03, 0.64, '6b4a36');
  box(10.2, 0.44, -1.5, 0.42, 0.015, 0.3, 'e25ab5', { ry: 0.2 });
  box(10.9, 0.445, -1.7, 0.08, 0.025, 0.2, '1f2230');
  box(10.7, 0.49, -1.4, 0.1, 0.12, 0.1, 'e9e3d6', { top: '5a3a28' });
  endGroup();
  drawCouch(10.5, 0.6, Math.PI, 3.0, '3f7f86', '4d949b', [[-1.1, 'f0c75a'], [1.1, 'e0955f']]);
  drawCouch(7.4, -1.6, Math.PI / 2, 1.0, 'd9a441', 'e6b85a');
  shadow(8.4, 0.7, 0.3, 0.3, 0.22);
  beginGroup([8.4, 0, 0.7]);
  box(8.4, 0.3, 0.7, 0.45, 0.6, 0.45, 'b88660', { top: 'c99a72' });
  drawTableLamp(8.4, 0.6, 0.7);
  endGroup();
  shadow(13.3, 1.9, 0.25, 0.25, 0.25);
  beginGroup([13.3, 0, 1.9]);
  box(13.3, 0.02, 1.9, 0.34, 0.04, 0.34, '2a2f45');
  box(13.3, 0.86, 1.9, 0.04, 1.66, 0.04, '2a2f45');
  box(13.3, 1.8, 1.9, 0.44, 0.34, 0.44, 'ffe2b0', { emissive: true, glow: 22, glowColor: 'rgba(255,200,120,.6)' });
  endGroup();
  // Estantería alta.
  shadow(5.3, -3.3, 0.3, 0.9, 0.24);
  beginGroup([5.3, 0, -3.3]);
  box(5.12, 1.1, -3.3, 0.05, 2.2, 1.6, '5a4636');
  for (const zz of [-4.08, -2.52]) box(5.3, 1.1, zz, 0.42, 2.2, 0.04, '6b5446');
  for (let k = 0; k < 5; k++) {
    box(5.3, 0.04 + k * 0.52, -3.3, 0.42, 0.04, 1.56, '6b5446');
    if (k < 4) drawBooks(-4.05, 0.06 + k * 0.52, 5.32, 1.5, 21 + k * 7, 0.3, true);
  }
  box(5.3, 2.2, -3.3, 0.44, 0.04, 1.62, '6b5446');
  endGroup();
  shadow(14.3, -4.3, 0.45, 0.45, 0.25);
  beginGroup([14.3, 0, -4.3]); drawPlant(14.3, -4.3, t + 1, 1.35); endGroup();
  if (save.arcade) drawArcadeCabinet(t);
}

/** Máquina recreativa del salón: la marquesina lleva el nombre de tu canal y la
    pantalla juega sola a una partida que no acaba nunca. */
function drawArcadeCabinet(t) {
  const x = 14.1, z = -2.6;
  shadow(x, z, 0.75, 0.85, 0.3);
  beginGroup([x, 0, z]);
  box(x, 0.85, z, 0.7, 1.7, 0.84, '2a1f4d', { top: '3d2a6b' });
  box(x + 0.02, 1.86, z, 0.66, 0.32, 0.88, '3d2a6b', { top: '4a3480' });
  box(x - 0.2, 0.78, z, 0.3, 0.1, 0.8, '1c1436', { top: '241a44' });   // panel de mandos
  box(x - 0.24, 0.86, z + 0.16, 0.05, 0.1, 0.05, 'd8dde8');
  box(x - 0.24, 0.93, z + 0.16, 0.08, 0.06, 0.08, 'e04a4a');
  for (let k = 0; k < 3; k++) box(x - 0.24, 0.85, z - 0.06 - k * 0.12, 0.09, 0.03, 0.09, ['f7e36b', 'b7f675', 'ff7ab5'][k], { emissive: true });
  box(x, 0.08, z, 0.72, 0.16, 0.86, '1c1436');
  // Pantalla: mira hacia -x, igual que quien se sienta en el sofá.
  const f = makeFrame([x - 0.352, 1.32, z], [0, 0, 1], [0, 1, 0]), o = { emissive: true, over: true };
  rectOn(f, 0, 0, 0.66, 0.52, '120b2e', { emissive: true, glow: 18, glowColor: 'rgba(150,110,255,.5)' });
  for (let k = 0; k < 5; k++) {
    const u = ((t * 0.35 + k * 0.2) % 1);
    rectOn(f, -0.28 + ((k * 0.13 + t * 0.06) % 0.56), 0.22 - u * 0.44, 0.06, 0.06, ['f7e36b', 'ff7ab5', 'b7f675'][k % 3], o, 0.006);
  }
  rectOn(f, Math.sin(t * 1.7) * 0.22, -0.2, 0.12, 0.05, 'b7f675', o, 0.006);
  rectOn(f, 0, -0.245, 0.66, 0.02, '41477a', o, 0.006);
  // Marquesina con el nombre del canal.
  const m = makeFrame([x - 0.312, 1.86, z], [0, 0, 1], [0, 1, 0]);
  rectOn(m, 0, 0, 0.72, 0.26, '160f30', { emissive: true }, 0.004);
  textOn(m, 0, 0, channelName(), 'ff7ab5', { emissive: true, glow: 10, over: true },
    0.008, Math.min(0.03, 0.62 / Math.max(7, textCols(channelName(), 9))), 9);
  endGroup();
}
// Pared oeste del salón: cuadro; pared norte: balda con plantas; pared este: cortinas de la ventana.
decor('living', 'x', 5, 1, -1.0, f => {
  boxOn(f, 1.0, 1.9, 1.3, 0.9, 0.04, 'e8e2d6');
  rectOn(f, 1.0, 1.9, 1.16, 0.76, '2d4a6b', NO, 0.045);
  for (let k = 0; k < 4; k++) discOn(f, 0.6 + k * 0.26, 1.8 + Math.sin(k * 2) * 0.12, 0.09 + k * 0.02, ['f0c75a', 'e0955f', 'b7f675', 'ff7ab5'][k], { over: true }, 0.045, 12);
});
decor('living', 'z', -5, 1, 10.5, f => {
  boxOn(f, 10.5, 2.45, 2.0, 0.05, 0.24, '5a4636');
  for (const [dx, c] of [[-0.7, '6fa56b'], [0, '5c9159'], [0.7, '6fa56b']]) {
    box(10.5 + dx, 2.55, -4.92 + 0.12, 0.14, 0.14, 0.14, 'e9e3d6');
    box(10.5 + dx, 2.7, -4.92 + 0.12, 0.2, 0.18, 0.2, c);
  }
});
decor('living', 'x', 15, -1, -1.0, f => drawCurtains(f, -1.0, 1.9, 'e0b86a', 'c99a4a'));
function drawCurtains(f, a, w, color, fold) {
  boxOn(f, a, 2.72, w + 1.0, 0.04, 0.04, '3a3f55', NO, 0.12);
  for (const side of [-1, 1]) {
    const ca = a + side * (w / 2 + 0.25);
    boxOn(f, ca, 1.66, 0.4, 2.1, 0.08, color, NO, 0.06);
    for (let k = -1; k <= 1; k++) rectOn(f, ca + k * 0.13, 1.66, 0.035, 2.08, fold, NO, 0.141);
  }
}

/* ---------- Cocina ---------- */
function drawKitchen(t) {
  const F = floorFrame(0.01);
  rectOn(F, 13.75, -7.4, 0.7, 2.4, 'c96f5a', { layer: LAYER.RUG }, 0);
  rectOn(F, 13.75, -7.4, 0.55, 2.25, 'e08a72', { layer: LAYER.RUG, over: true }, 0);
  // Nevera (su puerta se abre al picar algo).
  const fo = homeState.fridge;
  shadow(14.55, 3.65, 0.45, 0.45, 0.26);
  beginGroup([14.55, 0, 3.65]);
  box(14.58, 0.95, 3.65, 0.68, 1.9, 0.8, 'dfe3ea', { top: 'eceff4' });
  const ff = makeFrame([14.236, 0, 3.65], [0, 0, 1], [0, 1, 0]);
  if (fo > 0.02) {
    rectOn(ff, 0, 0.95, 0.72, 1.8, 'f4f8ff', { emissive: true, glow: 12, glowColor: 'rgba(220,240,255,.5)' });
    for (let k = 0; k < 3; k++) rectOn(ff, 0, 0.5 + k * 0.45, 0.72, 0.02, 'c9d4e2', { over: true });
    [['e0955f', -0.2, 0.62], ['b7f675', 0.1, 0.63], ['ff7ab5', 0.2, 1.08], ['f0c75a', -0.15, 1.52]].forEach(([c, a, b]) => rectOn(ff, a, b, 0.14, 0.18, c, { over: true }));
  }
  const door = rig(14.18, 0, 3.26, -Math.PI / 2 - fo * 1.7);
  door(0.39, 0.95, -0.03, 0.78, 1.86, 0.06, 'e6e9ef');
  door(0.7, 1.2, -0.08, 0.04, 0.5, 0.04, 'aab0bd');
  door(0.39, 1.36, -0.064, 0.76, 0.015, 0.01, 'c9ced9');
  endGroup();
  // Encimera en L: módulos a lo largo de la pared este y de la sur.
  const east = ['base', 'drawers', 'stove', 'base', 'base', 'base', 'sink', 'base', 'drawers', 'base'];
  shadow(14.59, 7.5, 0.4, 3.1, 0.22);
  east.forEach((kind, k) => {
    const z = 4.7 + k * 0.6;
    beginGroup([14.59, 0, z]);
    counterModule('x', 14.59, z, 0.6, kind, t);
    endGroup();
  });
  shadow(12.8, 10.59, 1.6, 0.4, 0.22);
  [11.6, 12.2, 12.8, 13.4, 14.0].forEach((x, k) => {
    beginGroup([x, 0, 10.59]);
    counterModule('z', x, 10.59, 0.6, k === 1 ? 'drawers' : 'base', t);
    endGroup();
  });
  beginGroup([14.6, 0, 10.66]);
  box(14.6, 0.43, 10.66, 0.62, 0.86, 0.5, 'f2efe8');
  box(14.6, 0.885, 10.66, 0.65, 0.05, 0.53, '3a3f55', { top: '4a5068' });
  endGroup();
  // Cafetera, frutero y tabla de cortar sobre la encimera.
  beginGroup([14.6, 0.9, 9.9]);
  box(14.62, 1.08, 9.9, 0.3, 0.34, 0.26, '2a2f45', { top: '3a4260' });
  box(14.52, 0.98, 9.9, 0.12, 0.1, 0.1, 'e9e3d6');
  box(14.47, 1.18, 9.9, 0.02, 0.04, 0.12, 'b7f675', { emissive: true });
  endGroup();
  beginGroup([13.3, 0.9, 10.62]);
  box(13.3, 0.93, 10.62, 0.36, 0.06, 0.36, 'e9e3d6');
  [['e04a4a', -0.06], ['f0c75a', 0.07], ['6fa56b', 0]].forEach(([c, dx], i) => box(13.3 + dx, 1.0, 10.62 + (i - 1) * 0.06, 0.1, 0.1, 0.1, c));
  endGroup();
  // Mesa de comedor con sillas y lámpara colgante.
  shadow(8.2, 6.6, 1.05, 0.62, 0.24);
  beginGroup([8.2, 0, 6.6]);
  box(8.2, 0.76, 6.6, 1.8, 0.06, 1.0, 'c99a72', { top: 'd8ab82' });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(8.2 + sx * 0.8, 0.37, 6.6 + sz * 0.4, 0.07, 0.74, 0.07, '6b4a36');
  box(8.2, 0.8, 6.6, 0.5, 0.02, 0.3, 'f2efe8');
  box(8.2, 0.85, 6.6, 0.22, 0.08, 0.22, 'e9e3d6');
  box(8.15, 0.92, 6.6, 0.08, 0.08, 0.08, 'e04a4a');
  box(8.25, 0.92, 6.62, 0.08, 0.08, 0.08, 'f0c75a');
  endGroup();
  drawChairAt(7.7, 5.85, 0); drawChairAt(8.7, 5.85, 0);
  drawChairAt(7.7, 7.35, Math.PI); drawChairAt(8.7, 7.35, Math.PI);
  beginGroup([8.2, 2.0, 6.6]);
  box(8.2, 2.75, 6.6, 0.015, 0.9, 0.015, '2a2f45');
  box(8.2, 2.22, 6.6, 0.5, 0.18, 0.5, '2a2f45', { top: '3a4260' });
  floorRect(8.2, 6.6, 0.44, 0.44, 2.129, 'ffe2b0', { emissive: true, glow: 18, glowColor: 'rgba(255,210,140,.6)', twoSided: true });
  endGroup();
  shadow(5.9, 10.3, 0.35, 0.35, 0.22);
  beginGroup([5.9, 0, 10.3]); drawPlant(5.9, 10.3, t + 3, 1.0); endGroup();
}
// Armarios altos, campana y azulejos (pared este); armarios sobre el tramo sur; calendario (pared oeste).
decor('kitchen', 'x', 15, -1, 5.3, f => upperCabinets(f, [4.4, 6.2]));
decor('kitchen', 'x', 15, -1, 7.2, f => upperCabinets(f, [6.8, 7.4]));
decor('kitchen', 'x', 15, -1, 9.6, f => upperCabinets(f, [8.95, 10.6]));
decor('kitchen', 'x', 15, -1, 6.5, f => {
  boxOn(f, 6.5, 2.0, 0.66, 0.3, 0.5, 'c9ced9');
  boxOn(f, 6.5, 2.5, 0.26, 0.7, 0.28, 'c9ced9');
  rectOn(f, 6.5, 1.3, 0.66, 0.7, 'dfe8e6', NO, 0.006);
});
decor('kitchen', 'x', 15, -1, 7.5, f => {
  rectOn(f, 7.5, 1.12, 6.2, 0.42, 'dfe8e6', NO, 0.004);
  for (let k = 1; k < 3; k++) rectOn(f, 7.5, 0.91 + k * 0.14, 6.2, 0.008, 'b9c6c4', { over: true }, 0.004);
});
decor('kitchen', 'z', 11, -1, 12.8, f => upperCabinets(f, [11.3, 14.3], 'z'));
decor('kitchen', 'x', 5, 1, 9.6, f => {
  boxOn(f, -9.6, 1.75, 0.5, 0.64, 0.02, 'f4f1e8');
  rectOn(f, -9.6, 1.98, 0.5, 0.14, 'e04a4a', NO, 0.021);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) rectOn(f, -9.78 + c * 0.12, 1.82 - r * 0.12, 0.08, 0.08, (r * 4 + c) % 5 === 2 ? 'b7f675' : 'dcd6ca', NO, 0.021);
});
decor('kitchen', 'z', 11, -1, 8.6, f => drawCurtains(f, -8.6, 1.8, 'f0c75a', 'd6ab45'));
/** Armarios altos entre dos coordenadas (a lo largo de la pared). */
function upperCabinets(f, [c0, c1], axis = 'x') {
  const sgn = axis === 'x' ? 1 : -1, n = Math.max(1, Math.round((c1 - c0) / 0.6)), w = (c1 - c0) / n;
  for (let i = 0; i < n; i++) {
    const a = sgn * (c0 + w * (i + 0.5));
    boxOn(f, a, 2.2, w - 0.02, 0.72, 0.34, 'f2efe8');
    rectOn(f, a, 2.2, w - 0.1, 0.64, 'e4e0d8', NO, 0.345);
    rectOn(f, a + (w / 2 - 0.12) * (i % 2 ? 1 : -1), 1.95, 0.025, 0.14, 'aab0bd', { over: true }, 0.345);
  }
}

/* ---------- Recibidor ---------- */
function drawHall(t) {
  const F = floorFrame(0.01), o = { layer: LAYER.RUG };
  rectOn(F, 2.5, -7.6, 1.3, 3.6, '6c8fd8', o, 0);
  rectOn(F, 2.5, -7.6, 1.1, 3.4, '8aa6e0', { ...o, over: true }, 0);
  rectOn(F, 2.5, -10.45, 1.2, 0.6, '5a4636', o, 0);
  // Consola con jarrón y cuenco para las llaves.
  shadow(0.3, 6.9, 0.28, 0.7, 0.22);
  beginGroup([0.3, 0, 6.9]);
  box(0.3, 0.78, 6.9, 0.36, 0.05, 1.2, '5a4636', { top: '6b5446' });
  for (const zz of [6.35, 7.45]) box(0.3, 0.39, zz, 0.05, 0.76, 0.05, '3a2f2a');
  box(0.3, 0.2, 6.9, 0.3, 0.03, 1.1, '3a2f2a');
  box(0.3, 0.92, 6.55, 0.12, 0.24, 0.12, '6c8fd8');
  for (const [dz, c] of [[-0.03, 'ff7ab5'], [0.04, 'f0c75a'], [0, 'e25ab5']]) box(0.3, 1.1, 6.55 + dz, 0.06, 0.06, 0.06, c);
  box(0.3, 0.83, 7.2, 0.24, 0.05, 0.24, 'c9a55a');
  endGroup();
  // Perchero con abrigos, banco con zapatos, planta y paragüero.
  shadow(4.55, 10.45, 0.3, 0.3, 0.22);
  beginGroup([4.55, 0, 10.45]);
  box(4.55, 0.03, 10.45, 0.4, 0.06, 0.4, '3a2f2a');
  box(4.55, 0.95, 10.45, 0.05, 1.9, 0.05, '5a4636');
  box(4.42, 1.35, 10.45, 0.12, 0.7, 0.3, 'e0955f');
  box(4.68, 1.4, 10.4, 0.12, 0.6, 0.28, '4d7fa0');
  box(4.55, 1.9, 10.45, 0.24, 0.12, 0.24, 'd9a441');
  endGroup();
  shadow(4.65, 9.3, 0.3, 0.6, 0.22);
  beginGroup([4.65, 0, 9.3]);
  box(4.65, 0.44, 9.3, 0.4, 0.06, 1.0, 'b88660', { top: 'c99a72' });
  for (const zz of [8.85, 9.75]) box(4.65, 0.21, zz, 0.36, 0.42, 0.05, '8a6449');
  box(4.62, 0.05, 9.05, 0.14, 0.1, 0.26, 'e04a4a');
  box(4.62, 0.05, 9.4, 0.14, 0.1, 0.26, 'f4f1e8');
  box(4.7, 0.52, 9.5, 0.3, 0.1, 0.3, 'd9a441');
  endGroup();
  shadow(0.45, 10.45, 0.35, 0.35, 0.22);
  beginGroup([0.45, 0, 10.45]); drawPlant(0.45, 10.45, t + 5, 1.0); endGroup();
  beginGroup([1.35, 0, 10.6]);
  box(1.35, 0.25, 10.6, 0.24, 0.5, 0.24, '4d7fa0');
  box(1.3, 0.62, 10.58, 0.03, 0.4, 0.03, 'e04a4a');
  box(1.4, 0.6, 10.63, 0.03, 0.36, 0.03, '2a2f45');
  endGroup();
}
decor('hall', 'x', 0, 1, 6.9, f => {
  boxOn(f, -6.9, 1.75, 0.8, 1.0, 0.04, 'c9a55a');
  rectOn(f, -6.9, 1.75, 0.68, 0.88, 'b9d4e6', NO, 0.045);
  polyOn(f, [[-7.15, 1.4], [-7.0, 1.4], [-6.7, 2.1], [-6.85, 2.1]], 'ffffff', { over: true, alpha: 0.35 }, 0.045);
});
decor('hall', 'x', 5, -1, 5.9, f => {
  boxOn(f, 5.9, 1.8, 0.7, 0.9, 0.03, '1f2436');
  rectOn(f, 5.9, 1.8, 0.6, 0.8, 'b7f675', NO, 0.035);
  polyOn(f, [[5.8, 1.62], [6.08, 1.8], [5.8, 1.98]], '17282a', { over: true }, 0.035);
});
decor('hall', 'z', 11, -1, 0.9, f => {
  boxOn(f, -0.9, 1.8, 0.5, 0.4, 0.03, '5a4636');
  rectOn(f, -0.9, 1.8, 0.42, 0.32, 'e0955f', NO, 0.035);
  discOn(f, -0.95, 1.78, 0.06, 'f6e3c8', { over: true }, 0.035, 10);
  discOn(f, -0.82, 1.78, 0.05, 'f6e3c8', { over: true }, 0.035, 10);
});

/* ---------- Baño ---------- */
function drawBath(t) {
  const F = floorFrame(0.01);
  rectOn(F, -3.5, -9.55, 1.0, 0.5, 'b7f675', { layer: LAYER.RUG }, 0);
  rectOn(F, -2.3, -6.05, 0.9, 0.45, '9b5fc0', { layer: LAYER.RUG }, 0);
  // Bañera con agua y patito.
  shadow(-3.55, 10.45, 1.2, 0.5, 0.22);
  beginGroup([-3.55, 0, 10.45]);
  box(-3.55, 0.3, 10.45, 2.3, 0.6, 0.9, 'f4f4f0', { top: 'fbfbf8' });
  floorRect(-3.55, 10.45, 2.05, 0.66, 0.605, 'a9d6e8', { emissive: true, alpha: 0.9 });
  for (let k = 0; k < 5; k++) dot3([-4.3 + k * 0.35, 0.62, 10.35 + Math.sin(t * 2 + k) * 0.08], 0.03, 'ffffff', { alpha: 0.6 });
  const dy = Math.sin(t * 2) * 0.01;
  box(-3.0, 0.66 + dy, 10.4, 0.12, 0.08, 0.16, 'f7d33b');
  box(-3.0, 0.73 + dy, 10.34, 0.08, 0.07, 0.08, 'f7d33b');
  box(-3.0, 0.72 + dy, 10.29, 0.04, 0.02, 0.04, 'f08a3b');
  box(-4.6, 0.72, 10.75, 0.05, 0.22, 0.05, 'c9ced9');
  endGroup();
  // Váter.
  shadow(-4.5, 6.3, 0.35, 0.3, 0.22);
  beginGroup([-4.5, 0, 6.3]);
  box(-4.4, 0.2, 6.3, 0.46, 0.4, 0.36, 'f4f4f0');
  box(-4.35, 0.43, 6.3, 0.52, 0.06, 0.4, 'fbfbf8');
  box(-4.78, 0.7, 6.3, 0.2, 0.46, 0.5, 'f4f4f0', { top: 'fbfbf8' });
  box(-4.72, 0.95, 6.18, 0.02, 0.03, 0.08, 'c9ced9');
  endGroup();
  // Lavabo.
  shadow(-2.3, 5.35, 0.6, 0.3, 0.22);
  beginGroup([-2.3, 0, 5.35]);
  box(-2.3, 0.4, 5.35, 1.1, 0.8, 0.5, '9b5fc0', { top: 'f4f4f0' });
  const sf = makeFrame([-2.3, 0, 5.601], [1, 0, 0], [0, 1, 0]);
  for (const a of [-0.27, 0.27]) {
    rectOn(sf, a, 0.4, 0.5, 0.66, 'ab72cc');
    rectOn(sf, a + (a < 0 ? 0.19 : -0.19), 0.58, 0.025, 0.14, 'e8e2d6', { over: true });
  }
  floorRect(-2.3, 5.38, 0.5, 0.32, 0.805, 'dfe8ee');
  box(-2.3, 0.9, 5.18, 0.04, 0.18, 0.04, 'c9ced9');
  box(-2.3, 0.97, 5.25, 0.03, 0.03, 0.14, 'c9ced9');
  box(-1.95, 0.87, 5.25, 0.08, 0.14, 0.08, 'f0c75a');
  endGroup();
  // Cesto de la ropa y planta.
  shadow(-0.55, 10.4, 0.3, 0.3, 0.22);
  beginGroup([-0.55, 0, 10.4]);
  box(-0.55, 0.3, 10.4, 0.42, 0.6, 0.42, 'c9a27a', { top: '8a6449' });
  box(-0.5, 0.62, 10.35, 0.3, 0.08, 0.3, '6c8fd8');
  endGroup();
  shadow(-0.5, 5.55, 0.3, 0.3, 0.22);
  beginGroup([-0.5, 0, 5.55]); drawPlant(-0.5, 5.55, t + 7, 0.8); endGroup();
}
decor('bath', 'z', 5, 1, -2.3, f => {
  boxOn(f, -2.3, 1.75, 0.9, 0.9, 0.03, 'c9ced9');
  rectOn(f, -2.3, 1.75, 0.82, 0.82, 'b9d4e6', NO, 0.035);
  polyOn(f, [[-2.62, 1.4], [-2.48, 1.4], [-2.2, 2.1], [-2.34, 2.1]], 'ffffff', { over: true, alpha: 0.4 }, 0.035);
  boxOn(f, -2.3, 2.3, 0.7, 0.06, 0.06, 'f4f8ff', { emissive: true, glow: 12, glowColor: 'rgba(235,245,255,.7)' });
});
decor('bath', 'x', 0, -1, 6.4, f => {
  boxOn(f, 6.4, 1.3, 0.8, 0.03, 0.08, 'c9ced9');
  boxOn(f, 6.2, 1.05, 0.34, 0.5, 0.06, 'ff7ab5');
  boxOn(f, 6.62, 1.1, 0.3, 0.4, 0.06, 'f0c75a');
});
decor('bath', 'x', -5, 1, 10.5, f => {
  boxOn(f, -10.5, 2.0, 0.05, 0.6, 0.05, 'c9ced9');
  boxOn(f, -10.5, 2.28, 0.2, 0.05, 0.3, 'c9ced9', NO, 0.02);
});

/* ---------- Casa de al lado ----------
   Dos piezas: el salón de quien vive enfrente y su taller. Usan los mismos
   ayudantes que el resto de la casa; lo único propio son las coordenadas. */
function drawVecinaSala(t) {
  const F = floorFrame(0.01), o = { layer: LAYER.RUG };
  rectOn(F, 25.0, -1.6, 2.6, 2.0, '9c6f4a', o, 0);
  rectOn(F, 25.0, -1.6, 2.3, 1.7, 'b0805a', { ...o, over: true }, 0);

  // Sofá de dos plazas contra la pared norte.
  shadow(25.0, -1.1, 1.1, 0.45, 0.22);
  beginGroup([25.0, 0, -1.1]);
  box(25.0, 0.22, -1.1, 2.1, 0.44, 0.82, '7b6a8f', { top: '8d7aa3' });
  box(25.0, 0.62, -1.42, 2.1, 0.5, 0.2, '6a5b7c');
  for (const xx of [24.1, 25.9]) box(xx, 0.5, -1.05, 0.18, 0.3, 0.78, '6a5b7c');
  for (const xx of [24.55, 25.45]) box(xx, 0.5, -1.2, 0.72, 0.12, 0.6, '8d7aa3', { top: '9d8ab3' });
  box(24.5, 0.62, -0.95, 0.34, 0.24, 0.12, 'f0c75a');
  endGroup();

  // Mesa baja con taza y libro.
  shadow(25.0, 0.7, 0.55, 0.35, 0.2);
  beginGroup([25.0, 0, 0.7]);
  box(25.0, 0.36, 0.7, 1.1, 0.06, 0.6, 'b88660', { top: 'c99a72' });
  for (const [xx, zz] of [[24.55, 0.45], [25.45, 0.45], [24.55, 0.95], [25.45, 0.95]])
    box(xx, 0.18, zz, 0.06, 0.36, 0.06, '6b5440');
  box(24.78, 0.43, 0.62, 0.12, 0.09, 0.12, 'f4f1e8');
  box(25.25, 0.41, 0.78, 0.26, 0.04, 0.18, '4d7fa0');
  endGroup();

  // Lámpara de pie y planta en las esquinas.
  shadow(23.0, -1.3, 0.3, 0.3, 0.2);
  beginGroup([23.0, 0, -1.3]);
  box(23.0, 0.04, -1.3, 0.34, 0.08, 0.34, '3a2f2a');
  box(23.0, 0.8, -1.3, 0.06, 1.5, 0.06, '5a4636');
  box(23.0, 1.68, -1.3, 0.42, 0.3, 0.42, 'f0d9a8', { top: 'f7e8c8' });
  endGroup();
  shadow(27.3, 4.2, 0.35, 0.35, 0.22);
  beginGroup([27.3, 0, 4.2]); drawPlant(27.3, 4.2, t + 2.5, 1.05); endGroup();

  // Alfombrilla y zapatos junto a la entrada.
  rectOn(F, 22.5, -3.0, 0.5, 0.9, '5a4636', o, 0);
  beginGroup([22.6, 0, 3.8]);
  box(22.6, 0.05, 3.7, 0.14, 0.1, 0.26, '3f6f59');
  box(22.6, 0.05, 4.02, 0.14, 0.1, 0.26, '3f6f59');
  endGroup();
}
decor('vsala', 'z', -2, 1, 26.6, f => {
  boxOn(f, 26.6, 1.85, 0.72, 0.56, 0.04, '5a4636');
  rectOn(f, 26.6, 1.85, 0.6, 0.44, 'e8dcc0', NO, 0.045);
  polyOn(f, [[26.35, 1.66], [27.0, 1.66], [26.78, 1.96], [26.5, 1.82]], '7fa37a', { over: true }, 0.045);
  discOn(f, 26.42, 1.98, 0.07, 'f0c75a', { over: true }, 0.045, 10);
});
decor('vsala', 'x', 22, 1, -0.4, f => {
  for (let i = 0; i < 3; i++) boxOn(f, 0.4 + i * 0.02, 1.35 + i * 0.42, 0.7, 0.04, 0.16, 'a8845f');
});

function drawVecinaTaller(t) {
  const F = floorFrame(0.01), o = { layer: LAYER.RUG };
  rectOn(F, 30.4, -1.4, 1.9, 1.1, '6f7a6a', o, 0);

  // Banco de trabajo con tablero, tornillo y herramientas.
  shadow(30.4, -1.3, 1.2, 0.4, 0.22);
  beginGroup([30.4, 0, -1.3]);
  box(30.4, 0.44, -1.3, 2.3, 0.08, 0.75, '9c7a52', { top: 'b08c5e' });
  for (const xx of [29.4, 31.4]) { box(xx, 0.2, -1.55, 0.1, 0.4, 0.1, '6b5440'); box(xx, 0.2, -1.05, 0.1, 0.4, 0.1, '6b5440'); }
  box(29.55, 0.56, -1.3, 0.18, 0.16, 0.2, '8d8375', { top: 'a39a8c' });
  for (const [xx, c] of [[30.1, 'e04a4a'], [30.35, '4d7fa0'], [30.6, 'f0c75a']])
    box(xx, 0.53, -1.5, 0.07, 0.1, 0.07, c);
  box(31.0, 0.52, -1.2, 0.34, 0.08, 0.22, '2a2f45');
  endGroup();

  // Estantería con cajas y botes.
  shadow(32.55, 1.6, 0.25, 0.9, 0.2);
  beginGroup([32.55, 0, 1.6]);
  box(32.6, 0.9, 1.6, 0.34, 1.8, 1.9, 'a8845f', { top: 'b89a6f' });
  for (const yy of [0.5, 1.0, 1.5]) box(32.55, yy, 1.6, 0.3, 0.05, 1.85, '8a6a48');
  for (const [yy, zz, c] of [[0.66, 1.0, '4d7fa0'], [0.66, 1.45, 'e04a4a'], [1.16, 1.2, '7fa37a'], [1.16, 2.0, 'f0c75a'], [1.66, 1.6, 'd9a441']])
    box(32.55, yy, zz, 0.24, 0.26, 0.3, c);
  endGroup();

  // Taburete y caja de herramientas en el suelo.
  shadow(29.8, 0.5, 0.26, 0.26, 0.2);
  beginGroup([29.8, 0, 0.5]);
  box(29.8, 0.3, 0.5, 0.34, 0.06, 0.34, 'b88660', { top: 'c99a72' });
  for (const [xx, zz] of [[29.67, 0.37], [29.93, 0.37], [29.67, 0.63], [29.93, 0.63]])
    box(xx, 0.15, zz, 0.05, 0.3, 0.05, '6b5440');
  endGroup();
  shadow(29.1, 4.3, 0.3, 0.22, 0.2);
  beginGroup([29.1, 0, 4.3]);
  box(29.1, 0.14, 4.3, 0.6, 0.28, 0.4, 'e04a4a', { top: 'ef6a5a' });
  box(29.1, 0.32, 4.3, 0.12, 0.08, 0.32, '2a2f45');
  endGroup();
}
decor('vtaller', 'z', -2, 1, 31.6, f => {
  boxOn(f, 31.6, 1.9, 0.9, 0.06, 0.2, '8a6a48');
  for (const [dx, c] of [[-0.3, 'e04a4a'], [-0.1, '4d7fa0'], [0.1, 'f0c75a'], [0.3, '7fa37a']])
    boxOn(f, 31.6 + dx, 2.12, 0.1, 0.34, 0.05, c);
});
decor('vtaller', 'x', 28, -1, 3.6, f => {
  boxOn(f, -3.6, 1.7, 0.5, 0.7, 0.03, '5a4636');
  rectOn(f, -3.6, 1.7, 0.42, 0.6, 'cfd9c8', NO, 0.035);
});

function drawRooms(t) {
  const visible = r => onScreen([(r.x0 + r.x1) / 2, 1, (r.z0 + r.z1) / 2], Math.hypot(r.x1 - r.x0, r.z1 - r.z0) / 2 + 1);
  const content = { studio: drawStudio, living: drawLiving, kitchen: drawKitchen, hall: drawHall, bath: drawBath,
                    vsala: drawVecinaSala, vtaller: drawVecinaTaller };
  for (const r of ROOMS) {
    if (!visible(r)) continue;
    useLights(r);
    content[r.id](t);
  }
}
