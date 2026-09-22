'use strict';
/* Putup · Entrada, bucle principal y arranque. */

const canvas = $('#world');
R.ctx = canvas.getContext('2d');
const keys = new Set(); // teclas pulsadas por código físico (funciona igual en QWERTY y AZERTY)
let pointer = null;

/* ---------- Teclado ---------- */
const KEY_NAMES = { ' ': 'Space', spacebar: 'Space', escape: 'Escape', esc: 'Escape', arrowup: 'ArrowUp', arrowdown: 'ArrowDown', arrowleft: 'ArrowLeft', arrowright: 'ArrowRight' };
/** Código físico de la tecla; si el navegador no lo da (teclados virtuales), se deduce de e.key. */
function keyCode(e) {
  if (e.code) return e.code;
  const k = (e.key || '').toLowerCase();
  return k.length === 1 && k >= 'a' && k <= 'z' ? 'Key' + k.toUpperCase() : KEY_NAMES[k] || e.key;
}
window.addEventListener('keydown', e => {
  const tag = e.target && e.target.tagName, code = keyCode(e);
  if (tag === 'INPUT' || tag === 'TEXTAREA') { if (code === 'Escape') closeModal(); return; }
  if (modal.hidden && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) e.preventDefault();
  Sound.unlock();
  if (code === 'Escape') {
    if (!modal.hidden) closeModal();
    else if (mode === 'run' || mode === 'arcade') pause();
    else if (mode === 'cards') polQuit();
    return;
  }
  if (code === 'KeyM' && !e.repeat) { toggleSound(); return; }
  if (!modal.hidden) return;
  keys.add(code);
  if (e.repeat) return;
  if (mode === 'home') {
    const it = nearestInteraction();
    if (code === 'KeyE' && it) interact(it);
    else if (code === 'KeyC') toggleWalls();
    else if (code === 'KeyH') help();
  } else if (mode === 'run') {
    if (code === 'KeyA' || code === 'ArrowLeft') steer(-1);
    else if (code === 'KeyD' || code === 'ArrowRight') steer(1);
    else if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') jump();
    else if (code === 'KeyP') pause();
  } else if (mode === 'arcade') {
    if (code === 'KeyP') pause(); else arcadeKey(code);
  }
});
window.addEventListener('keyup', e => {
  const code = keyCode(e);
  keys.delete(code);
  if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') releaseJump();
});
const pausable = () => (mode === 'run' || mode === 'arcade') && modal.hidden;
window.addEventListener('blur', () => { keys.clear(); pointer = null; if (pausable()) pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && pausable()) pause(); });

/* ---------- Ratón y táctil ----------
   Casa: arrastrar gira la cámara, clic camina (o usa el ordenador), rueda acerca.
   Carrera: deslizar a los lados cambia de carril, hacia arriba salta; tocar el tercio izquierdo/derecho también. */
canvas.addEventListener('pointerdown', e => {
  Sound.unlock();
  pointer = { x: e.clientX, sx: e.clientX, sy: e.clientY, moved: false };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (!pointer) {
    if (mode === 'home' && e.pointerType === 'mouse') canvas.classList.toggle('over-pc', modal.hidden && !!pickInteraction(e.clientX, e.clientY));
    return;
  }
  const dx = e.clientX - pointer.x;
  pointer.x = e.clientX;
  if (Math.hypot(e.clientX - pointer.sx, e.clientY - pointer.sy) > 6) pointer.moved = true;
  if (mode === 'home' && pointer.moved) { view.goal += dx * 0.007; canvas.classList.add('dragging'); }
  else if (mode === 'arcade' && arcadePlaying() && arcade.def.drag) arcade.def.drag(arcade.s, e.clientX, e.clientY, arcade);
});
canvas.addEventListener('pointerup', e => {
  const p = pointer;
  pointer = null;
  canvas.classList.remove('dragging');
  if (!p || !modal.hidden) return;
  const dx = e.clientX - p.sx, dy = e.clientY - p.sy;
  if (mode === 'home') {
    if (!p.moved) homeClick(e.clientX, e.clientY);
  } else if (mode === 'run') {
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) steer(Math.sign(dx));
    else if (dy < -40) jump();
    else if (!p.moved) {
      if (e.clientX < R.w / 3) steer(-1);
      else if (e.clientX > (R.w * 2) / 3) steer(1);
      else jump();
    }
    releaseJump();
  } else if (mode === 'arcade') arcadePointer(e.clientX, e.clientY, dx, dy);
});
canvas.addEventListener('pointercancel', () => { pointer = null; canvas.classList.remove('dragging'); });
canvas.addEventListener('wheel', e => {
  if (mode !== 'home' || !modal.hidden) return;
  e.preventDefault();
  view.distGoal = clamp(view.distGoal + Math.sign(e.deltaY) * 1.2, 7, 28);
}, { passive: false });

/* La barra táctil se rehace al cambiar de modo, así que escucha el contenedor.
   Un botón con data-hold entra en `keys` y el juego lo lee como tecla mantenida. */
const touchBar = $('#touch');
touchBar.addEventListener('pointerdown', e => {
  const b = e.target.closest('button');
  if (!b) return;
  e.preventDefault();
  b.setPointerCapture(e.pointerId);
  b.classList.add('down');
  Sound.unlock();
  const act = b.dataset.touch, code = b.dataset.code;
  if (act === 'left') steer(-1);
  else if (act === 'right') steer(1);
  else if (act === 'jump') jump();
  else if (code) { if (b.dataset.hold) keys.add(code); arcadeKey(code); }
});
const touchRelease = e => {
  const b = e.target.closest('button');
  if (!b) return;
  b.classList.remove('down');
  if (b.dataset.code) keys.delete(b.dataset.code);
  if (b.dataset.touch === 'jump') releaseJump();
};
touchBar.addEventListener('pointerup', touchRelease);
touchBar.addEventListener('pointercancel', touchRelease);

/* El botón "atrás" de Android llama aquí: devuelve true si el juego se ha quedado
   la pulsación (cerrar una ventana, pausar) y false para salir de la aplicación. */
window.putupBack = function () {
  if (!modal.hidden) { closeModal(); return true; }
  if (mode === 'run' || mode === 'arcade') { pause(); return true; }
  if (mode === 'cards') { polQuit(); return true; }
  return false;
};
$('#help').onclick = () => { Sound.unlock(); if (mode === 'run' || mode === 'arcade') pause(); else help(); };
$('#sound').onclick = () => { Sound.unlock(); toggleSound(); };
$('#walls').onclick = () => { Sound.unlock(); toggleWalls(); };

/* ---------- Bucle ---------- */
function drawVignette() {
  const ctx = R.ctx, g = ctx.createRadialGradient(R.w / 2, R.h / 2, Math.min(R.w, R.h) * 0.35, R.w / 2, R.h / 2, Math.max(R.w, R.h) * 0.75);
  g.addColorStop(0, 'rgba(6,9,22,0)');
  g.addColorStop(1, 'rgba(6,9,22,.5)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, R.w, R.h);
}

let lastFrame = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  clock += dt;
  resizeRenderer(canvas);
  if (mode === 'run') { if (modal.hidden) updateRun(dt); }
  else if (mode === 'arcade') { if (modal.hidden) updateArcade(dt); }
  else if (mode === 'cards') updatePolenom(dt);
  else updateHome(dt);
  // Una partida puede terminar dentro de su actualización: se dibuja el modo en el que quedó.
  if (mode === 'run') renderRun(clock);
  else if (mode === 'arcade') renderArcade(clock);
  else if (mode === 'cards') { R.ctx.fillStyle = '#10152a'; R.ctx.fillRect(0, 0, R.w, R.h); }
  else renderHome(clock);
  drawVignette();
  tickUI(dt);
  requestAnimationFrame(frame);
}

Sound.setMuted(save.muted);
updateSoundButton();
updateWallsButton();
setModeUI();
syncStats();
stats();
help();
requestAnimationFrame(frame);
