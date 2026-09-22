'use strict';
/* Putup · Modelos compuestos por cajas: el creador, su gato y las plantas. */

const PAL = Object.freeze({
  skin: 'edc2a2', hair: '34304e', hoodie: 'b7f675', hoodieDark: '86c24a', pants: '394b77',
  shoe: 'ece8df', sole: '2a2f45', eye: '1d2033', blush: 'f2a194', gear: '1f2436',
});

/**
 * El creador. pose: walk (fase del paso), move (0-1), air (0-1 en el salto),
 * t (tiempo), headset (auriculares), cheer (brazos arriba), gadget (cámara de bolsillo en la mano).
 */
function drawCreator(x, y, z, yaw, pose = NO) {
  const { walk = 0, move = 0, air = 0, t = 0, headset = false, cheer = 0, gadget = null } = pose;
  const part = rig(x, y, z, yaw);
  const swing = Math.sin(walk) * 0.75 * move;
  const bob = Math.abs(Math.cos(walk)) * 0.045 * move + Math.sin(t * 2.3) * 0.008 * (1 - move);
  const legL = lerp(swing, -0.6, air), legR = lerp(-swing, 0.35, air);
  const up = Math.max(air, cheer);
  const armL = lerp(-swing * 0.9, -2.5 + Math.sin(t * 9) * 0.2 * cheer, up);
  // Con una cámara de bolsillo, el brazo derecho la sostiene delante (pose de vlog).
  const armR = gadget ? lerp(-1.05 + Math.sin(walk) * 0.06 * move, -2.5, up) : lerp(swing * 0.9, -2.5 - Math.sin(t * 9) * 0.2 * cheer, up);
  const blink = t % 3.7 < 0.12;

  // Piernas y zapatillas (giran en la cadera).
  for (const [side, rot] of [[-1, legL], [1, legR]]) {
    const lx = side * 0.12;
    part(lx, 0.29, 0, 0.17, 0.46, 0.2, PAL.pants, NO, rot, 0.52);
    part(lx, 0.055, 0.035, 0.19, 0.1, 0.27, PAL.shoe, NO, rot, 0.52);
    part(lx, 0.008, 0.035, 0.2, 0.025, 0.28, PAL.sole, NO, rot, 0.52);
  }
  // Torso con sudadera.
  const b = bob;
  part(0, 0.79 + b, 0, 0.48, 0.56, 0.3, PAL.hoodie);
  part(0, 0.64 + b, 0.151, 0.3, 0.12, 0.012, PAL.hoodieDark);
  part(0, 1.03 + b, -0.11, 0.38, 0.12, 0.12, PAL.hoodieDark);
  part(-0.06, 0.93 + b, 0.152, 0.02, 0.1, 0.01, 'f4f1e8');
  part(0.06, 0.93 + b, 0.152, 0.02, 0.1, 0.01, 'f4f1e8');
  // Brazos (giran en el hombro).
  for (const [side, rot] of [[-1, armL], [1, armR]]) {
    const lx = side * 0.32;
    part(lx, 0.8 + b, 0, 0.15, 0.42, 0.18, PAL.hoodie, NO, rot, 1.0 + b);
    part(lx, 0.545 + b, 0, 0.13, 0.12, 0.15, PAL.skin, NO, rot, 1.0 + b);
  }
  if (gadget) {
    // Cámara de bolsillo vertical en la mano, con el objetivo mirando al creador.
    const c = POCKET_LOOK[gadget], piv = 1.0 + b, hy = piv - 0.455 * Math.cos(armR), hz = -0.455 * Math.sin(armR);
    part(0.32, hy + 0.1, hz + 0.03, 0.055, 0.17, 0.04, c.body);
    part(0.32, hy + 0.12, hz + 0.051, 0.042, 0.05, 0.004, '2a4f7a', { emissive: true });
    part(0.32, hy + 0.2, hz + 0.035, 0.07, 0.03, 0.05, c.accent);
    part(0.32, hy + 0.245, hz + 0.04, 0.06, 0.06, 0.06, c.head);
    part(0.32, hy + 0.245, hz + 0.008, 0.032, 0.032, 0.004, '7fb6ff', { emissive: true });
  }
  // Cabeza.
  part(0, 1.08 + b, 0, 0.14, 0.06, 0.14, PAL.skin);
  part(0, 1.29 + b, 0, 0.38, 0.37, 0.36, PAL.skin);
  part(0, 1.49 + b, -0.01, 0.41, 0.09, 0.39, PAL.hair);
  part(0, 1.33 + b, -0.165, 0.41, 0.3, 0.07, PAL.hair);
  part(-0.195, 1.39 + b, -0.03, 0.04, 0.14, 0.3, PAL.hair);
  part(0.195, 1.39 + b, -0.03, 0.04, 0.14, 0.3, PAL.hair);
  part(0.05, 1.43 + b, 0.175, 0.32, 0.07, 0.04, PAL.hair);
  for (const side of [-1, 1]) {
    part(side * 0.085, 1.3 + b, 0.182, 0.055, blink ? 0.012 : 0.075, 0.012, PAL.eye);
    if (!blink) part(side * 0.085 - 0.012, 1.315 + b, 0.19, 0.018, 0.018, 0.004, 'ffffff', { emissive: true });
    part(side * 0.135, 1.225 + b, 0.181, 0.06, 0.03, 0.01, PAL.blush);
  }
  part(0, 1.2 + b, 0.181, 0.07, 0.018, 0.01, 'a0524a');
  if (headset) {
    part(0, 1.52 + b, 0, 0.46, 0.05, 0.09, PAL.gear);
    for (const side of [-1, 1]) {
      part(side * 0.215, 1.31 + b, 0, 0.07, 0.17, 0.17, PAL.gear);
      part(side * 0.252, 1.31 + b, 0, 0.01, 0.08, 0.08, PAL.hoodie, { emissive: true });
    }
  }
}

/** Gato durmiendo en forma de "pan", con respiración y cola que se mueve. */
function drawCat(x, y, z, yaw, t) {
  const part = rig(x, y, z, yaw), br = Math.sin(t * 1.8) * 0.012;
  const FUR = 'e59a52', DARK = 'b8703a', LIGHT = 'f6d7b0';
  part(0, 0.11 + br / 2, 0, 0.3, 0.2 + br, 0.46, FUR);
  part(0, 0.215 + br, -0.06, 0.31, 0.012, 0.05, DARK);
  part(0, 0.215 + br, 0.07, 0.31, 0.012, 0.05, DARK);
  part(0, 0.2, 0.27, 0.24, 0.2, 0.2, FUR);
  part(-0.07, 0.33, 0.27, 0.06, 0.07, 0.05, DARK);
  part(0.07, 0.33, 0.27, 0.06, 0.07, 0.05, DARK);
  part(0, 0.165, 0.372, 0.11, 0.06, 0.01, LIGHT);
  part(-0.055, 0.21, 0.373, 0.05, 0.012, 0.01, '3a2a22');
  part(0.055, 0.21, 0.373, 0.05, 0.012, 0.01, '3a2a22');
  part(0, 0.18, 0.379, 0.03, 0.02, 0.01, 'e58c8c');
  part(-0.08, 0.035, 0.26, 0.08, 0.06, 0.1, LIGHT);
  part(0.08, 0.035, 0.26, 0.08, 0.06, 0.1, LIGHT);
  part(0.17, 0.045, -0.02 + Math.sin(t * 1.2) * 0.025, 0.07, 0.07, 0.42, DARK, { ry: Math.sin(t * 1.2) * 0.12 });
}

/** Planta de interior con hojas que se mecen. */
function drawPlant(x, z, t, size = 1) {
  box(x, 0.22 * size, z, 0.5 * size, 0.44 * size, 0.5 * size, 'c77a55', { top: '5a3d2e' });
  box(x, 0.46 * size, z, 0.56 * size, 0.06 * size, 0.56 * size, 'b56b4a', { top: '4a3226' });
  for (let k = 0; k < 8; k++) {
    const h = (0.5 + (k % 4) * 0.13) * size, lean = 0.3 + (k % 3) * 0.2 + Math.sin(t * 1.3 + k) * 0.04;
    const part = rig(x, 0.46 * size, z, k * 0.8 + 0.3);
    part(0, h / 2, 0.05, 0.15 * size, h, 0.04, k % 2 ? '6fa56b' : '5c9159', NO, lean, 0);
  }
}

/**
 * Libros en fila sobre una balda. Avanzan por X desde `start` (o por Z si alongZ),
 * con `fixed` como la otra coordenada horizontal.
 */
function drawBooks(start, y, fixed, width, seed, depth = 0.24, alongZ = false) {
  const colors = ['c0645c', '4f7fb8', 'e0b457', '6aa57c', '8c6bb8', 'd98b5f', '3f4a6b', 'e7ddc9'];
  let off = 0;
  for (let i = 0; off < width - 0.06; i++) {
    const w = 0.05 + hash(seed + i) * 0.05, h = 0.22 + hash(seed + i * 3.1) * 0.14;
    if (off + w > width) break;
    const c = colors[Math.floor(hash(seed + i * 5.3) * colors.length)], mid = start + off + w / 2;
    if (alongZ) box(fixed, y + h / 2, mid, depth, h, w, c);
    else box(mid, y + h / 2, fixed, w, h, depth, c);
    off += w + (hash(seed + i * 7.7) > 0.85 ? 0.07 : 0.004); // algún hueco para que no parezca un bloque
  }
}

/* ---------- Cámaras de bolsillo con estabilizador (Osmo Pocket 4 y 4P) ---------- */
const POCKET_LOOK = {
  pocket4: { body: '2b2e36', head: '1f2229', accent: 'b7f675', label: '4' },
  pocket4p: { body: 'c8ccd4', head: '2a2d35', accent: 'e0a35a', label: '4P' },
};
/** Cámara de bolsillo de pie sobre su base de carga (yaw 0: objetivo hacia +z); k = escala. */
function drawPocketCam(x, y, z, yaw, model, t, k = 1.35) {
  const c = POCKET_LOOK[model], pan = Math.sin(t * 0.7 + x) * 0.35, scaled = f => (lx, ly, lz, w, h, d, col, o) => f(lx * k, ly * k, lz * k, w * k, h * k, d * k, col, o);
  const p = scaled(rig(x, y, z, yaw));
  p(0, 0.012, 0, 0.12, 0.024, 0.1, '1b1e28');
  p(0, 0.13, 0, 0.07, 0.21, 0.045, c.body);
  p(0, 0.155, 0.024, 0.052, 0.06, 0.004, '2a4f7a', { emissive: true });
  p(0, 0.155, 0.0265, 0.03, 0.012, 0.002, 'b7f675', { emissive: true });
  p(0, 0.09, 0.024, 0.018, 0.018, 0.004, 'e04a4a', { emissive: true });
  p(0, 0.25, 0, 0.075, 0.03, 0.05, c.accent);
  // Cabezal con estabilizador: gira despacio como si siguiera algo.
  const h = scaled(rig(x, y, z, yaw + pan));
  h(0.035, 0.29, 0, 0.012, 0.06, 0.03, c.head);
  h(0, 0.31, 0, 0.07, 0.07, 0.07, c.head);
  h(0, 0.31, 0.036, 0.042, 0.042, 0.004, '101218');
  h(0, 0.31, 0.039, 0.024, 0.024, 0.003, '7fb6ff', { emissive: true, glow: 4 });
}

/* ---------- Rótulos de píxeles ----------
   Para escribir en una pared no hay texturas: cada letra son 5 filas de puntos que se
   dibujan con cuadraditos, como un letrero de bombillas. Casi todas miden 3 puntos de
   ancho; la M, la N y la W necesitan más para no confundirse entre ellas. */
const PIXEL_FONT = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  B: ['##.', '#.#', '##.', '#.#', '##.'],
  C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'],
  F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'],
  L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#'],
  O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  Q: ['.#.', '#.#', '#.#', '##.', '.##'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'],
  X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
  Z: ['###', '..#', '.#.', '#..', '###'],
  0: ['###', '#.#', '#.#', '#.#', '###'],
  1: ['.#.', '##.', '.#.', '.#.', '###'],
  2: ['##.', '..#', '.#.', '#..', '###'],
  3: ['###', '..#', '.##', '..#', '###'],
  4: ['#.#', '#.#', '###', '..#', '..#'],
  5: ['###', '#..', '###', '..#', '###'],
  6: ['###', '#..', '###', '#.#', '###'],
  7: ['###', '..#', '.#.', '.#.', '.#.'],
  8: ['###', '#.#', '###', '#.#', '###'],
  9: ['###', '#.#', '###', '..#', '###'],
  ' ': ['..', '..', '..', '..', '..'],
  '.': ['...', '...', '...', '...', '.#.'],
  ',': ['...', '...', '...', '.#.', '#..'],
  '-': ['...', '...', '###', '...', '...'],
  '+': ['...', '.#.', '###', '.#.', '...'],
  '!': ['.#.', '.#.', '.#.', '...', '.#.'],
  '?': ['##.', '..#', '.#.', '...', '.#.'],
  "'": ['.#.', '.#.', '...', '...', '...'],
  '&': ['.#.', '#.#', '.#.', '#.#', '.##'],
  '·': ['...', '...', '.#.', '...', '...'],
  '>': ['#..', '##.', '###', '##.', '#..'],
};
// Las tildes y la eñe se dibujan con su letra base: el alfabeto no tiene acentos.
const FONT_FOLD = { 'Á': 'A', 'À': 'A', 'Ä': 'A', 'Â': 'A', 'É': 'E', 'È': 'E', 'Ë': 'E', 'Ê': 'E', 'Í': 'I', 'Ì': 'I', 'Ï': 'I', 'Î': 'I', 'Ó': 'O', 'Ò': 'O', 'Ö': 'O', 'Ô': 'O', 'Ú': 'U', 'Ù': 'U', 'Ü': 'U', 'Û': 'U', 'Ñ': 'N', 'Ç': 'C', '▶': '>' };
/** Deja solo lo que el alfabeto sabe dibujar, en mayúsculas y con un máximo de letras. */
function fontText(s, max = 12) {
  return [...String(s ?? '').toUpperCase()].map(c => FONT_FOLD[c] || c).filter(c => c in PIXEL_FONT).slice(0, max).join('');
}
/** Ancho de un rótulo en puntos, contando un hueco entre letras. */
function textCols(s, max) {
  const t = fontText(s, max);
  return t ? [...t].reduce((n, c) => n + PIXEL_FONT[c][0].length + 1, -1) : 0;
}
/** Escribe `text` centrado en (a, b) de un marco, con `cell` metros por punto. */
function textOn(f, a, b, text, color, o = NO, off = 0.01, cell = 0.05, max = 12) {
  const s = fontText(text, max);
  if (!s) return;
  const cols = textCols(s, max), a0 = a - (cols * cell) / 2 + cell / 2, b0 = b + 2 * cell;
  for (let row = 0; row < 5; row++) {
    const on = [];
    let x = 0;
    for (const ch of s) {
      const line = PIXEL_FONT[ch][row];
      for (let c = 0; c < line.length; c++) on[x + c] = line[c] === '#';
      x += line.length + 1;
    }
    // Los puntos seguidos salen como una sola cara: un rótulo largo no dispara los polígonos.
    for (let c = 0; c < cols; c++) {
      if (!on[c]) continue;
      let end = c;
      while (on[end + 1]) end++;
      const n = end - c + 1;
      rectOn(f, a0 + (c + (n - 1) / 2) * cell, b0 - row * cell, n * cell, cell, color, o, off);
      c = end;
    }
  }
}
