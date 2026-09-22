'use strict';
/* Putup · Serpiente de likes: come corazones para crecer; chocar con el borde o contigo termina la partida. */

const SNAKE_COLS = 22, SNAKE_ROWS = 14;
const SNAKE_DIRS = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };

function snakeFree(s) {
  for (let tries = 0; tries < 200; tries++) {
    const c = { x: Math.floor(Math.random() * SNAKE_COLS), y: Math.floor(Math.random() * SNAKE_ROWS) };
    if (!s.body.some(b => b.x === c.x && b.y === c.y) && !(s.food && s.food.x === c.x && s.food.y === c.y)) return c;
  }
  return { x: 0, y: 0 };
}
function snakeTurn(s, d) {
  const last = s.queue.length ? s.queue[s.queue.length - 1] : s.dir;
  if (s.queue.length < 2 && !(d[0] === -last[0] && d[1] === -last[1]) && !(d[0] === last[0] && d[1] === last[1])) s.queue.push(d);
}
function snakeGeometry() {
  const area = arcadeArea(96, 96), top = area.top, bottom = top + area.height;
  const cell = Math.floor(Math.min((R.w - 40) / SNAKE_COLS, (bottom - top) / SNAKE_ROWS));
  const w = cell * SNAKE_COLS, h = cell * SNAKE_ROWS;
  return { cell, x0: Math.round((R.w - w) / 2), y0: Math.round(top + (bottom - top - h) / 2), w, h };
}
function snakeStep(s, a) {
  if (s.queue.length) s.dir = s.queue.shift();
  const head = { x: s.body[0].x + s.dir[0], y: s.body[0].y + s.dir[1] };
  const tail = s.grow > 0 ? s.body.length : s.body.length - 1;
  const selfHit = s.body.slice(0, tail).some(b => b.x === head.x && b.y === head.y);
  if (head.x < 0 || head.y < 0 || head.x >= SNAKE_COLS || head.y >= SNAKE_ROWS || selfHit) {
    s.dead = true;
    a.shake = 0.6;
    a.flash = 1;
    Sound.hit();
    arcadeEvent(selfHit ? 'Me mordí la cola… ¡qué nervios!' : 'Choque épico contra el borde', '💥', 1.5);
    const g = snakeGeometry();
    burst2d(g.x0 + (s.body[0].x + 0.5) * g.cell, g.y0 + (s.body[0].y + 0.5) * g.cell, 24, ['#ff8a7a', '#b7f675', '#ffffff'], 300, 6);
    arcadeOver('¡CHOQUE!');
    return;
  }
  s.body.unshift(head);
  if (s.grow > 0) s.grow--; else s.body.pop();
  const g = snakeGeometry(), px = g.x0 + (head.x + 0.5) * g.cell, py = g.y0 + (head.y + 0.5) * g.cell;
  if (head.x === s.food.x && head.y === s.food.y) {
    s.likes++;
    s.grow += 1;
    s.score += 10 * (1 + Math.floor(s.body.length / 8));
    s.food = snakeFree(s);
    Sound.star(Math.min(12, s.likes));
    burst2d(px, py, 10, ['#ff7ab5', '#ffd6e8'], 200, 4);
    const len = s.body.length + s.grow;
    if (len === 10 || len === 15 || len === 20 || len === 30) arcadeEvent(`Serpiente de ${len} bloques`, '🐍', 2 + len / 10);
  }
  if (s.gold && head.x === s.gold.x && head.y === s.gold.y) {
    s.stars++;
    s.score += 50;
    s.gold = null;
    Sound.shine();
    burst2d(px, py, 18, ['#f7e36b', '#ffffff'], 260, 5);
    arcadeEvent('Estrella dorada atrapada al vuelo', '⭐', 3);
  }
  s.rate = Math.max(0.065, 0.13 - s.body.length * 0.0025);
}
function drawHeart(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.9);
  ctx.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.7, y - r * 1.1, x, y - r * 0.35);
  ctx.bezierCurveTo(x + r * 0.7, y - r * 1.1, x + r * 1.4, y - r * 0.1, x, y + r * 0.9);
  ctx.fill();
}

ARCADES.serpiente = {
  duration: 45,
  hint: 'Flechas o W A S D · desliza en pantallas táctiles',
  init() {
    const s = { body: [{ x: 6, y: 7 }, { x: 5, y: 7 }, { x: 4, y: 7 }], dir: [1, 0], queue: [], step: 0, rate: 0.13, grow: 0, likes: 0, stars: 0, score: 0, dead: false, food: null, gold: null, goldIn: 6, goldLeft: 0 };
    s.food = snakeFree(s);
    return s;
  },
  update(s, dt, a) {
    if (s.dead) return;
    s.step += dt;
    while (s.step >= s.rate && !s.dead) { s.step -= s.rate; snakeStep(s, a); }
    if (s.gold) { if ((s.goldLeft -= dt) <= 0) s.gold = null; }
    else if ((s.goldIn -= dt) <= 0) { s.gold = snakeFree(s); s.goldLeft = 5; s.goldIn = 7 + Math.random() * 4; }
  },
  touch: [{ label: '◀', code: 'ArrowLeft' }, { label: '▲', code: 'ArrowUp' }, { label: '▼', code: 'ArrowDown' }, { label: '▶', code: 'ArrowRight' }],
  key(s, code) { if (SNAKE_DIRS[code]) snakeTurn(s, SNAKE_DIRS[code]); },
  pointer(s, x, y, dx, dy) {
    if (Math.hypot(dx, dy) > 30) { snakeTurn(s, Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]); return; }
    // Toque: gira hacia donde has tocado respecto a la cabeza.
    const g = snakeGeometry(), hx = g.x0 + (s.body[0].x + 0.5) * g.cell, hy = g.y0 + (s.body[0].y + 0.5) * g.cell;
    const ex = x - hx, ey = y - hy;
    snakeTurn(s, s.dir[0] ? [0, Math.sign(ey) || 1] : [Math.sign(ex) || 1, 0]);
  },
  render(ctx, s, a, t) {
    const g = snakeGeometry(), c = g.cell;
    const bg = ctx.createLinearGradient(0, 0, 0, R.h);
    bg.addColorStop(0, '#0c1a22');
    bg.addColorStop(1, '#10302c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, R.w, R.h);
    // Tablero con cuadros y borde de neón.
    ctx.save();
    ctx.shadowColor = '#b7f675';
    ctx.shadowBlur = 24;
    roundRect(ctx, g.x0 - 6, g.y0 - 6, g.w + 12, g.h + 12, 12);
    ctx.fillStyle = '#0a1418';
    ctx.fill();
    ctx.restore();
    for (let y = 0; y < SNAKE_ROWS; y++) for (let x = 0; x < SNAKE_COLS; x++) {
      ctx.fillStyle = (x + y) % 2 ? '#122229' : '#0f1d23';
      ctx.fillRect(g.x0 + x * c, g.y0 + y * c, c, c);
    }
    // Like (corazón que late) y estrella dorada con su tiempo.
    const beat = 1 + Math.sin(t * 8) * 0.08;
    drawHeart(ctx, g.x0 + (s.food.x + 0.5) * c, g.y0 + (s.food.y + 0.52) * c, c * 0.34 * beat, '#ff7ab5');
    if (s.gold) {
      const gx = g.x0 + (s.gold.x + 0.5) * c, gy = g.y0 + (s.gold.y + 0.5) * c;
      ctx.save();
      ctx.shadowColor = '#f7e36b';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#f7e36b';
      starIcon(ctx, gx, gy, c * 0.42);
      ctx.restore();
      ctx.strokeStyle = 'rgba(247,227,107,.6)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(gx, gy, c * 0.55, -Math.PI / 2, -Math.PI / 2 + (s.goldLeft / 5) * Math.PI * 2); ctx.stroke();
    }
    // Serpiente: degradado de lima a turquesa, cabeza con ojos.
    const n = s.body.length;
    for (let i = n - 1; i >= 0; i--) {
      const b = s.body[i], k = i / Math.max(1, n - 1), pad = i === 0 ? 1 : 2.5;
      ctx.fillStyle = `rgb(${Math.round(183 - k * 120)},${Math.round(246 - k * 40)},${Math.round(117 + k * 90)})`;
      roundRect(ctx, g.x0 + b.x * c + pad, g.y0 + b.y * c + pad, c - pad * 2, c - pad * 2, c * 0.3);
      ctx.fill();
    }
    const h = s.body[0], hx = g.x0 + (h.x + 0.5) * c, hy = g.y0 + (h.y + 0.5) * c;
    for (const side of [-1, 1]) {
      const ex = hx + s.dir[0] * c * 0.15 - s.dir[1] * side * c * 0.2, ey = hy + s.dir[1] * c * 0.15 + s.dir[0] * side * c * 0.2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(ex, ey, c * 0.13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#17282a';
      ctx.beginPath(); ctx.arc(ex + s.dir[0] * c * 0.04, ey + s.dir[1] * c * 0.04, c * 0.07, 0, Math.PI * 2); ctx.fill();
    }
  },
  hud: s => ({ left: `❤ ${s.likes}`, leftColor: '#ff9ac8', right: `📏 ${s.body.length + s.grow}`, score: s.score, badge: s.gold ? '⭐ ¡ESTRELLA!' : null }),
  outroText: s => `${fmt(s.score)} puntos · ${s.likes} likes · longitud ${s.body.length + s.grow}`,
  result(s) {
    const len = s.body.length + s.grow;
    return {
      score: s.score, stars: s.stars + Math.floor(len / 6), hits: s.dead ? 1 : 0, bestCombo: len,
      summary: [`❤ ${s.likes} likes`, `⭐ ${s.stars} estrellas doradas`, `📏 longitud ${len}`, `${fmt(s.score)} puntos`, s.dead ? '💥 terminó en choque' : '⏱ aguantó hasta el final'],
      suggest: len >= 15 ? `¡Mi serpiente midió ${len} bloques!` : '¡Reto de la serpiente de likes!',
    };
  },
};
