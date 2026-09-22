'use strict';
/* Putup · Ritmo pixel: notas que caen en cuatro carriles al compás de la música (128 BPM).
   Las notas se colocan sobre la rejilla de la música, que empieza con la cuenta atrás. */

const BEAT = 60 / 128;
const RITMO_KEYS = { ArrowLeft: 0, KeyD: 0, ArrowDown: 1, KeyF: 1, ArrowUp: 2, KeyJ: 2, ArrowRight: 3, KeyK: 3 };
const LANE_COLORS = ['#ff7ab5', '#6c8fd8', '#b7f675', '#f7e36b'];
const LANE_ARROWS = ['←', '↓', '↑', '→'];
const LANE_NOTES = [72, 75, 79, 82];
const FALL = 1.5;                         // segundos que tarda una nota en bajar hasta la línea
const JUDGE = [[0.055, 'PERFECTO', 300, '#b7f675'], [0.11, 'BIEN', 150, '#6c8fd8'], [0.16, 'JUSTO', 60, '#f7e36b']];
const BEAT_OFFSET = 0.06 - ARCADE_INTRO;  // la música arranca 0,06 s después de empezar la cuenta atrás

/** Partitura aleatoria: más notas y algún acorde a medida que avanza la canción. */
function ritmoChart(duration) {
  const notes = [];
  for (let k = 2; ; k++) {
    const t = BEAT_OFFSET + (k * BEAT) / 2;
    if (t > duration - 1) break;
    if (t < 1) continue;
    const level = t / duration, onBeat = k % 2 === 0;
    if (Math.random() > (onBeat ? 0.78 : 0.12 + level * 0.4)) continue;
    const lane = Math.floor(Math.random() * 4);
    notes.push({ t, lane, state: 0 });
    if (onBeat && level > 0.45 && Math.random() < 0.2) notes.push({ t, lane: (lane + 2) % 4, state: 0 });
  }
  return notes;
}
const ritmoMult = combo => 1 + Math.min(2, Math.floor(combo / 10)) * 0.5;

function ritmoPress(s, lane, a) {
  s.pressed[lane] = 0.12;
  let best = null;
  for (const n of s.notes) {
    if (n.state || n.lane !== lane) continue;
    const d = Math.abs(n.t - a.time);
    if (d < JUDGE[JUDGE.length - 1][0] && (!best || d < Math.abs(best.t - a.time))) best = n;
  }
  if (!best) return;
  const d = Math.abs(best.t - a.time), [, label, pts, color] = JUDGE.find(j => d < j[0]);
  best.state = 1;
  s.combo++;
  s.bestCombo = Math.max(s.bestCombo, s.combo);
  s.score += Math.round(pts * ritmoMult(s.combo));
  s.judge = { label, color, t: 0.5 };
  if (label === 'PERFECTO') { s.perfect++; s.streak++; } else { s.good++; s.streak = 0; }
  Sound.note(LANE_NOTES[lane] + (label === 'PERFECTO' ? 12 : 0), 0.08);
  const g = ritmoGeometry(s);
  burst2d(g.laneX(lane), g.hitY, label === 'PERFECTO' ? 14 : 7, [LANE_COLORS[lane], '#ffffff'], 260, 5);
  if (s.combo === 20 || s.combo === 40 || s.combo === 60) arcadeEvent(`Combo de ${s.combo} notas seguidas`, '🔥', 3 + s.combo / 20);
  if (s.streak === 10) arcadeEvent('Racha de 10 perfectos', '🎯', 4);
}
/** Posiciones en pantalla (dependen del tamaño de la ventana). */
function ritmoGeometry() {
  const w = Math.min(520, R.w * 0.86), x0 = (R.w - w) / 2, lw = w / 4;
  const area = arcadeArea(150, 116), top = area.top, hitY = top + area.height;
  return { w, x0, lw, top, hitY, laneX: l => x0 + lw * (l + 0.5), yOf: t => hitY - (t / FALL) * (hitY - top) };
}

ARCADES.ritmo = {
  duration: 32,
  hint: 'Flechas o D F J K al llegar a la línea',
  init: () => ({ notes: ritmoChart(32), pressed: [0, 0, 0, 0], combo: 0, bestCombo: 0, streak: 0, perfect: 0, good: 0, misses: 0, score: 0, judge: null }),
  update(s, dt, a) {
    for (let i = 0; i < 4; i++) s.pressed[i] = Math.max(0, s.pressed[i] - dt);
    if (s.judge) s.judge.t -= dt;
    for (const n of s.notes) {
      if (n.state || a.time - n.t < JUDGE[JUDGE.length - 1][0]) continue;
      n.state = -1;
      s.misses++;
      if (s.combo >= 15) arcadeEvent(`Se rompió un combo de ${s.combo}`, '💥', 1);
      s.combo = 0;
      s.streak = 0;
      s.judge = { label: 'FALLO', color: '#ff8a7a', t: 0.5 };
      Sound.miss();
    }
  },
  touch: LANE_ARROWS.map((label, lane) => ({ label, code: Object.keys(RITMO_KEYS).find(k => RITMO_KEYS[k] === lane) })),
  key(s, code, a) { if (code in RITMO_KEYS) ritmoPress(s, RITMO_KEYS[code], a); },
  pointer(s, x, y, dx, dy, a) {
    const g = ritmoGeometry(s), lane = Math.floor((x - g.x0) / g.lw);
    if (lane >= 0 && lane < 4) ritmoPress(s, lane, a);
  },
  render(ctx, s, a, t) {
    const g = ritmoGeometry(s), phase = (((a.clock - 0.06) % BEAT) + BEAT) % BEAT, pulse = Math.max(0, 1 - phase / BEAT * 3);
    const bg = ctx.createLinearGradient(0, 0, 0, R.h);
    bg.addColorStop(0, '#120b2e');
    bg.addColorStop(1, `rgb(${40 + pulse * 30},${18 + pulse * 10},${70 + pulse * 40})`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, R.w, R.h);
    // Rayos de fondo que laten con el bombo.
    ctx.save();
    ctx.globalAlpha = 0.06 + pulse * 0.08;
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2 + t * 0.1;
      ctx.fillStyle = i % 2 ? '#ff7ab5' : '#6c8fd8';
      ctx.beginPath();
      ctx.moveTo(R.w / 2, R.h * 0.55);
      ctx.lineTo(R.w / 2 + Math.cos(ang) * R.w, R.h * 0.55 + Math.sin(ang) * R.w);
      ctx.lineTo(R.w / 2 + Math.cos(ang + 0.2) * R.w, R.h * 0.55 + Math.sin(ang + 0.2) * R.w);
      ctx.fill();
    }
    ctx.restore();
    // Pista y líneas de compás.
    roundRect(ctx, g.x0 - 8, g.top - 30, g.w + 16, g.hitY - g.top + 70, 18);
    ctx.fillStyle = 'rgba(8,6,24,.72)';
    ctx.fill();
    for (let l = 0; l < 4; l++) {
      ctx.fillStyle = s.pressed[l] > 0 ? LANE_COLORS[l] + '33' : l % 2 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.06)';
      ctx.fillRect(g.x0 + g.lw * l, g.top - 30, g.lw, g.hitY - g.top + 70);
    }
    ctx.strokeStyle = 'rgba(255,255,255,.08)';
    ctx.lineWidth = 1;
    const first = Math.ceil((a.time - BEAT_OFFSET) / BEAT);
    for (let k = first; k < first + 6; k++) {
      const y = g.yOf(BEAT_OFFSET + k * BEAT - a.time);
      if (y < g.top - 30) break;
      ctx.beginPath(); ctx.moveTo(g.x0, y); ctx.lineTo(g.x0 + g.w, y); ctx.stroke();
    }
    // Receptores.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let l = 0; l < 4; l++) {
      const cx = g.laneX(l), on = s.pressed[l] > 0, size = g.lw * 0.62 * (on ? 1.08 : 1);
      roundRect(ctx, cx - size / 2, g.hitY - size / 2, size, size, 12);
      ctx.lineWidth = 3;
      ctx.strokeStyle = LANE_COLORS[l];
      ctx.shadowColor = LANE_COLORS[l];
      ctx.shadowBlur = on ? 22 : 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = on ? LANE_COLORS[l] : 'rgba(255,255,255,.35)';
      ctx.font = `800 ${Math.round(size * 0.45)}px ${FONT}`;
      ctx.fillText(LANE_ARROWS[l], cx, g.hitY + 1);
    }
    // Notas (recortadas a la pista para que no invadan el marcador).
    ctx.save();
    ctx.beginPath();
    ctx.rect(g.x0 - 8, g.top - 30, g.w + 16, R.h);
    ctx.clip();
    for (const n of s.notes) {
      if (n.state === 1) continue;
      const y = g.yOf(n.t - a.time), cx = g.laneX(n.lane), size = g.lw * 0.56;
      if (y < g.top - 40 || y > R.h) continue;
      ctx.globalAlpha = n.state === -1 ? 0.25 : 1;
      roundRect(ctx, cx - size / 2, y - size / 2, size, size, 12);
      ctx.fillStyle = LANE_COLORS[n.lane];
      ctx.shadowColor = LANE_COLORS[n.lane];
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#17122e';
      ctx.font = `900 ${Math.round(size * 0.5)}px ${FONT}`;
      ctx.fillText(LANE_ARROWS[n.lane], cx, y + 1);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // Veredicto y combo.
    if (s.judge && s.judge.t > 0) {
      const k = 1 + Math.max(0, s.judge.t - 0.35) * 2;
      ctx.font = `900 ${Math.round(34 * k)}px ${FONT}`;
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(10,8,30,.8)';
      ctx.strokeText(s.judge.label, R.w / 2, g.hitY - 120);
      ctx.fillStyle = s.judge.color;
      ctx.fillText(s.judge.label, R.w / 2, g.hitY - 120);
    }
    if (s.combo >= 5) {
      ctx.font = `800 20px ${FONT}`;
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.fillText(`${s.combo} COMBO`, R.w / 2, g.hitY - 82);
    }
  },
  hud: s => ({
    left: `🎯 ${s.perfect}`, right: `✕ ${s.misses}`, rightColor: s.misses ? '#ff8a7a' : '#9fb0cc', score: s.score,
    badge: ritmoMult(s.combo) > 1 ? `COMBO ×${ritmoMult(s.combo)}` : null,
  }),
  outroText: s => `${fmt(s.score)} puntos · combo máx. ${s.bestCombo} · ${s.misses} fallos`,
  result(s) {
    if (s.misses === 0 && s.perfect + s.good > 10) arcadeEvent('¡Canción completa sin un solo fallo!', '👑', 8);
    return {
      score: s.score, stars: Math.floor(s.perfect / 6) + (s.misses === 0 ? 3 : 0), hits: s.misses, bestCombo: s.bestCombo,
      summary: [`🎯 ${s.perfect} perfectos`, `✓ ${s.good} bien`, `✕ ${s.misses} fallos`, `${fmt(s.score)} puntos`, `🔥 combo máx. ${s.bestCombo}`],
      suggest: s.bestCombo >= 30 ? `¡Combo de ${s.bestCombo} en Ritmo pixel!` : '¡Mi reto musical en Putup!',
    };
  },
};
