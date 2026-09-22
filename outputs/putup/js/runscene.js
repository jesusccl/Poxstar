'use strict';
/* Putup · Dibujo del circuito "Salto neón" y su interfaz sobre el lienzo. */

const FONT = '"Segoe UI", system-ui, sans-serif';

function runCamera() {
  const r = run, k = r.shake * 0.5;
  const jx = k ? rand(-k, k) : 0, jy = k ? rand(-k, k) : 0;
  setCamera([r.x * 0.35 + jx, 5.6 + r.y * 0.25 + jy, 11.2], [r.x * 0.55, 0.8 + r.y * 0.2, -9], 1.1, 0.52);
}

/* ---------- Fondo 2D: cielo, estrellas, sol y montañas ---------- */
function drawRunSky(th, t) {
  const ctx = R.ctx, hp = project([0, 0, -600]), hz = hp ? hp[1] : R.h * 0.42;
  const sky = ctx.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, th.sky[0]);
  sky.addColorStop(0.62, th.sky[1]);
  sky.addColorStop(1, th.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, R.w, hz + 2);
  for (let i = 0; i < 70; i++) {
    const a = 0.25 + 0.6 * Math.abs(Math.sin(t * (0.5 + hash(i) * 2) + i)), s = hash(i * 9.1) > 0.9 ? 2.2 : 1.3;
    ctx.fillStyle = `rgba(255,255,255,${(a * (1 - hash(i * 3.7))).toFixed(2)})`;
    ctx.fillRect(hash(i) * R.w, hash(i * 3.7) * hz * 0.75, s, s);
  }
  // Sol a franjas (synthwave), recortado al cielo.
  const r = Math.min(R.w, R.h) * 0.17, sx = R.w / 2 - run.x * 8, sy = hz - r * 0.3;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, R.w, hz); ctx.clip();
  ctx.shadowColor = th.sun[1];
  ctx.shadowBlur = 70;
  const sun = ctx.createLinearGradient(0, sy - r, 0, sy + r);
  sun.addColorStop(0, th.sun[0]);
  sun.addColorStop(1, th.sun[1]);
  ctx.fillStyle = sun;
  ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(sx, sy, r + 1, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = sky;
  const band = r * 0.14, scroll = (t * 10) % band;
  for (let k = 0; k < 8; k++) {
    const y = sy + k * band + scroll - band * 0.2;
    if (y > sy - band * 0.5) ctx.fillRect(sx - r - 2, y, 2 * r + 4, 1 + ((y - sy) / r) * band * 0.55);
  }
  ctx.restore();
  // Dos capas de montañas con paralaje.
  for (let layer = 0; layer < 2; layer++) {
    const H = R.h * (layer ? 0.07 : 0.11), shift = run.x * (layer ? 14 : 7), seed = layer * 3.1;
    ctx.fillStyle = th.mountains[layer];
    ctx.beginPath();
    ctx.moveTo(0, hz + 1);
    for (let x = 0; x <= R.w + 20; x += 20) {
      const u = x + shift, n = (Math.sin(u * 0.011 + seed) * 0.5 + Math.sin(u * 0.027 + seed * 2) * 0.3 + Math.sin(u * 0.063) * 0.2 + 1) / 2;
      ctx.lineTo(x, hz - n * H);
    }
    ctx.lineTo(R.w, hz + 1);
    ctx.closePath();
    ctx.fill();
    if (layer) { ctx.strokeStyle = `#${th.grid}55`; ctx.lineWidth = 1.2; ctx.stroke(); }
  }
  // Bajo el horizonte, el color de la niebla: el suelo lejano se funde con él.
  ctx.fillStyle = css(th.fog);
  ctx.fillRect(0, hz, R.w, R.h - hz);
}

/* ---------- Mundo 3D ---------- */
function drawRunWorld(th, t) {
  const r = run;
  R.layer = -1;
  floorRect(0, -69, 160, 162, -0.03, th.ground, { emissive: true });
  R.layer = 0;
  box(0, -0.26, -69, 6.9, 0.5, 162, '1b1636');
  // Rejilla de neón a ambos lados.
  R.layer = LAYER.FLOOR;
  for (let x = 4.6; x < 42; x += 2.4) {
    for (const s of [-1, 1]) line3([s * x, 0, -150], [s * x, 0, 12], th.grid, 0.04);
  }
  for (let z = 12 - (r.dist % 4); z > -150; z -= 4) {
    line3([-42, 0, z], [-3.6, 0, z], th.grid, 0.04);
    line3([3.6, 0, z], [42, 0, z], th.grid, 0.04);
  }
  // Pista en baldosas que avanzan hacia la cámara.
  for (let k = -1; k < 40; k++) {
    const z1 = Math.min(14, 12 + (r.dist % 8) - k * 4), z0 = 12 + (r.dist % 8) - (k + 1) * 4;
    if (z1 > z0) floorRect(0, (z0 + z1) / 2, 6.9, z1 - z0, 0, th.track[(k + 2) % 2]);
  }
  R.layer = LAYER.WALL;
  for (let z = 12 - (r.dist % 4); z > -120; z -= 4) {
    for (const x of [-0.95, 0.95]) floorRect(x, z, 0.07, 1.6, 0.004, th.lane, { emissive: true });
  }
  for (const x of [-3.5, 3.5]) {
    box(x, 0.09, -69, 0.14, 0.18, 162, th.rail, { emissive: true, glow: 14 });
    for (let z = 12 - (r.dist % 6); z > -90; z -= 6) box(x, 0.3, z, 0.1, 0.42, 0.1, th.rail, { emissive: true });
  }
  R.layer = LAYER.OBJ;
  for (const b of r.city) drawBuilding(b, th);
  for (const o of r.objects) {
    if (o.type === 'star') { if (!o.hit) drawStar(o, t); }
    else if (!o.hit || o.cleared) (o.type === 'wall' ? drawBarrier : drawBlock)(o, t);
  }
  // El creador (parpadea mientras es invulnerable).
  const k = 1 - Math.min(1, r.y * 0.3);
  shadow(r.x, PLAYER_Z, 0.34 * k, 0.28 * k, 0.4 * k, 0.02);
  if (r.inv === 0 || Math.floor(r.clock * 12) % 2) {
    beginGroup([r.x, r.y + 0.8, PLAYER_Z]);
    drawCreator(r.x, r.y, PLAYER_Z, Math.PI - r.tilt * 0.4, {
      walk: r.walk, move: r.intro > 0 || r.y > 0 ? 0 : 1, air: clamp(r.y * 1.4, 0, 1), t: r.clock,
      headset: save.gear >= 1, cheer: r.outro > 0 ? 1 : 0, gadget: pocketModel(),
    });
    endGroup();
  }
  drawParticles();
}

function drawBuilding(b, th) {
  if (b.z < -150) return;
  const col = th.building[b.c];
  beginGroup([b.x, b.h / 2, b.z]);
  box(b.x, b.h / 2, b.z, b.w, b.h, b.d, col, { top: th.building[(b.c + 1) % 3] });
  if (b.z > -95) {
    const f = makeFrame([b.x - b.side * b.w / 2, 0, b.z], [0, 0, b.side], [0, 1, 0]);
    const cols = Math.min(5, Math.floor(b.d / 0.9)), rows = Math.min(8, Math.floor((b.h - 0.8) / 1.1));
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const hsh = hash(b.seed + i * 7 + j * 13);
        if (hsh < 0.6) continue;
        const a = (i - (cols - 1) / 2) * 0.9, c = th.windows[Math.floor(hsh * 97) % 3];
        rectOn(f, a, 1.0 + j * 1.1, 0.38, 0.5, c, { emissive: true, over: true }, 0.005);
      }
    }
  }
  if (b.trim) box(b.x - b.side * b.w / 2, b.h, b.z, 0.08, 0.08, b.d, th.trim[b.c % 2], { emissive: true, glow: 10 });
  endGroup();
}

function drawBlock(o, t) {
  if (!o.cleared) shadow(o.x, o.z, 0.66, 0.6, 0.38, 0.02);
  beginGroup([o.x, 0.5, o.z]);
  box(o.x, 0.5, o.z, 1.05, 1, 1, 'f1a078', { top: 'ffc39a' });
  const f = makeFrame([o.x, 0.5, o.z + 0.5], [1, 0, 0], [0, 1, 0]);
  rectOn(f, 0, 0, 0.9, 0.86, 'e2855c', NO, 0.003);
  for (const b of [-0.26, 0.26]) rectOn(f, 0, b, 0.9, 0.12, '3a2438', { over: true }, 0.003);
  const on = Math.floor(t * 4 + o.z) % 2 === 0;
  box(o.x, 1.06, o.z, 0.16, 0.12, 0.16, on ? 'ff5a3c' : '7a2a1c', on ? { emissive: true, glow: 12 } : NO);
  endGroup();
}

function drawBarrier(o) {
  shadow(o.x, o.z, 0.95, 0.32, 0.38, 0.02);
  beginGroup([o.x, 1.1, o.z]);
  for (const s of [-1, 1]) box(o.x + s * 0.8, 1.15, o.z, 0.14, 2.3, 0.3, '2a2f45');
  box(o.x, 1.3, o.z, 1.5, 1.7, 0.18, 'b8356f', { top: 'e2508f' });
  const f = makeFrame([o.x, 1.3, o.z + 0.09], [1, 0, 0], [0, 1, 0]), neon = { emissive: true, over: true, glow: 10 };
  rectOn(f, 0, 0, 1.4, 1.6, '4a1436', { emissive: true }, 0.003);
  for (let k = 0; k < 3; k++) {
    const d = k * 0.4 - 0.4;
    polyOn(f, [[-0.3 + d, -0.7], [-0.08 + d, -0.7], [0.3 + d, 0.7], [0.08 + d, 0.7]], 'ff5fa2', neon, 0.003);
  }
  box(o.x, 2.22, o.z, 1.62, 0.08, 0.22, 'ff5fa2', { emissive: true, glow: 14 });
  endGroup();
}

function drawStar(o, t) {
  const y = (o.y ?? 1.7) + Math.sin(t * 4 + o.z) * 0.08;
  discOn(floorFrame(0.02), o.x, -o.z, 0.42, 'f7e36b', { emissive: true, alpha: 0.16, layer: LAYER.DECAL }, 0, 12);
  beginGroup([o.x, y, o.z]);
  star3(o.x, y, o.z, 0.34, t * 3 + o.z * 0.3, 'f7e36b', { emissive: true, glow: 14, glowColor: 'rgba(247,227,107,.85)' });
  endGroup();
}

/* ---------- Capa 2D: líneas de velocidad, HUD y mensajes ---------- */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}
function starIcon(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, k = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k);
  }
  ctx.closePath();
  ctx.fill();
}

function drawSpeedLines() {
  const r = run;
  if (REDUCED_MOTION || r.intro > 0 || r.outro > 0) return;
  const ctx = R.ctx, n = Math.round(4 + (r.speed - 12) * 2.5), cx = R.w / 2, cy = R.h * 0.5;
  ctx.strokeStyle = 'rgba(255,255,255,.14)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, d = (0.55 + Math.random() * 0.45) * Math.max(R.w, R.h) * 0.6, len = 30 + Math.random() * 60;
    ctx.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
    ctx.lineTo(cx + Math.cos(a) * (d + len), cy + Math.sin(a) * (d + len));
  }
  ctx.stroke();
}

/** Parte superior del HUD: justo debajo de la cabecera HTML (que en móvil ocupa dos filas). */
function hudTop() {
  const header = document.querySelector('header'), rect = header && header.getBoundingClientRect && header.getBoundingClientRect();
  return Math.max(86, rect ? rect.bottom + 6 : 104);
}
function drawRunHUD() {
  const ctx = R.ctx, r = run, w = Math.min(460, R.w - 32), x = (R.w - w) / 2, y = hudTop(), h = 60;
  ctx.save();
  roundRect(ctx, x, y, w, h, 16);
  ctx.fillStyle = 'rgba(14,20,40,.8)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.1)';
  ctx.stroke();
  ctx.textBaseline = 'middle';
  // Estrellas.
  ctx.fillStyle = '#f7e36b';
  ctx.shadowColor = '#f7e36b'; ctx.shadowBlur = 10;
  starIcon(ctx, x + 30, y + h / 2, 11);
  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';
  ctx.font = `800 22px ${FONT}`;
  ctx.fillStyle = '#f3f5ff';
  ctx.fillText(String(r.stars), x + 48, y + h / 2 + 1);
  // Puntos.
  ctx.textAlign = 'center';
  ctx.font = `600 10px ${FONT}`;
  ctx.fillStyle = '#9fb0cc';
  ctx.fillText('PUNTOS', x + w / 2, y + 17);
  ctx.font = `800 24px ${FONT}`;
  ctx.fillStyle = '#f3f5ff';
  ctx.fillText(fmt(r.score), x + w / 2, y + 39);
  // Choques.
  ctx.textAlign = 'right';
  ctx.font = `700 15px ${FONT}`;
  ctx.fillStyle = r.hits ? '#ff8a7a' : '#9fb0cc';
  ctx.fillText(`✕ ${r.hits}`, x + w - 18, y + h / 2 + 1);
  // Tiempo restante.
  const p = clamp(r.time / RUN_TIME, 0, 1), left = Math.ceil(Math.max(0, RUN_TIME - r.time));
  roundRect(ctx, x + 14, y + h - 7, w - 28, 3, 2);
  ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fill();
  roundRect(ctx, x + 14, y + h - 7, (w - 28) * (1 - p), 3, 2);
  ctx.fillStyle = left <= 5 ? '#ff8a7a' : '#b7f675'; ctx.fill();
  ctx.textAlign = 'left';
  ctx.font = `700 12px ${FONT}`;
  ctx.fillStyle = left <= 5 ? '#ff8a7a' : '#c9d4e8';
  ctx.fillText(`${left} s`, x + 14, y + h + 16);
  // Grabación.
  if (record) {
    const on = Math.floor(r.clock * 2) % 2 === 0;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffb3ab';
    ctx.fillText(`REC ${stamp(r.time)}`, x + w - 14, y + h + 16);
    ctx.fillStyle = on ? '#ff4d4d' : 'rgba(255,77,77,.3)';
    ctx.beginPath(); ctx.arc(x + w - 80, y + h + 16, 5, 0, Math.PI * 2); ctx.fill();
  }
  // Racha.
  const mult = comboMult(r.combo);
  if (mult > 1) {
    const label = `RACHA ×${mult}`, pw = 104;
    roundRect(ctx, R.w / 2 - pw / 2, y + h + 6, pw, 22, 11);
    ctx.fillStyle = '#b7f675'; ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#17282a';
    ctx.font = `800 12px ${FONT}`;
    ctx.fillText(label, R.w / 2, y + h + 17);
  }
  ctx.restore();
}

function bigText(text, sub, scale = 1, color = '#f3f5ff') {
  const ctx = R.ctx, size = Math.round(Math.min(R.w, R.h) * 0.16 * scale);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${size}px ${FONT}`;
  ctx.lineWidth = Math.max(4, size * 0.06);
  ctx.strokeStyle = 'rgba(12,10,32,.8)';
  ctx.strokeText(text, R.w / 2, R.h * 0.44);
  ctx.shadowColor = color; ctx.shadowBlur = 30;
  ctx.fillStyle = color;
  ctx.fillText(text, R.w / 2, R.h * 0.44);
  if (sub) {
    ctx.shadowBlur = 0;
    ctx.font = `700 ${Math.round(size * 0.2)}px ${FONT}`;
    ctx.fillStyle = '#e8ecff';
    ctx.fillText(sub, R.w / 2, R.h * 0.44 + size * 0.62);
  }
  ctx.restore();
}

function drawRunOverlay() {
  const r = run, ctx = R.ctx;
  if (r.flash > 0) {
    ctx.fillStyle = `rgba(255,70,70,${(r.flash * 0.22).toFixed(3)})`;
    ctx.fillRect(0, 0, R.w, R.h);
  }
  drawRunHUD();
  if (r.intro > 0) {
    const step = INTRO / 3, n = Math.ceil(r.intro / step), frac = (r.intro % step) / step;
    bigText(String(n), n === 3 ? 'A / D o ← / → cambiar carril · Espacio saltar' : null, 0.8 + frac * 0.4);
  } else if (r.go > 0) {
    bigText('¡YA!', null, 1 + (0.7 - r.go) * 0.4, '#b7f675');
  } else if (r.outro > 0) {
    bigText('¡TIEMPO!', `${fmt(r.score)} puntos · ${r.stars} ★ · racha máx. ×${comboMult(r.bestCombo)}`, 0.8, '#f7e36b');
  }
}

function renderRun(t) {
  const th = theme();
  beginFrame();
  runCamera();
  R.light = V3.norm([0.25, 1, 0.7]);
  R.ambient = 0.6;
  R.diffuse = 0.42;
  R.fog = { color: th.fog, near: 22, far: 115 };
  drawRunSky(th, t);
  drawRunWorld(th, t);
  renderFaces();
  drawPopups();
  drawSpeedLines();
  drawRunOverlay();
}
