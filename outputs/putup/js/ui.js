'use strict';
/* Putup · Interfaz HTML: marcadores, misión, avisos y ventanas (ordenador, canal, tienda, editor…). */

const $ = s => document.querySelector(s);
const modal = $('#modal'), panel = $('#panel');
// Las dos últimas portadas llegan con el pack de miniaturas de la tienda.
const THUMBS = [{ icon: '★', label: 'RÉCORD' }, { icon: '↗', label: 'ÉPICO' }, { icon: '▶', label: 'MI PARTIDA' },
  { icon: '🔥', label: 'POLÉMICO' }, { icon: '📘', label: 'GUÍA' }];
const shown = { subs: save.subs, views: save.views, money: save.money };
let toastLeft = 0, modalOnClose = null, promptText = '';

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function toast(text, kind = '') {
  const el = $('#toast');
  el.textContent = text;
  el.className = 'show ' + kind;
  toastLeft = 3.2;
}

/* ---------- Marcadores y misión ---------- */
function stats() { updateMission(); }
function updateMission() {
  const subs = save.subs, next = nextMilestone(subs), prev = prevMilestone(subs);
  let title, detail;
  if (pending) { title = 'Tienes una grabación'; detail = 'Vuelve al ordenador (E) para editarla y publicarla.'; }
  else if (!save.videos.length) { title = 'Tu primer vídeo'; detail = 'Acércate al ordenador iluminado y pulsa E, o haz clic en él.'; }
  else if (subs < MONETIZE_AT) { title = 'Camino a los 100'; detail = 'Con 100 suscriptores se desbloquean los ingresos ficticios.'; }
  else if (next) {
    title = `Rumbo a ${fmt(next)}`;
    detail = next === PLAQUE_AT ? 'A los 1.000 suscriptores recibirás una placa para tu pared.' : 'Mejora tu equipo en la tienda: más calidad, más alcance.';
  } else { title = '¡Leyenda de Putup!'; detail = 'Has superado todos los hitos. Sigue creando por diversión.'; }
  $('#objective').textContent = title;
  $('#detail').textContent = detail;
  const pct = next ? ((subs - prev) / (next - prev)) * 100 : 100;
  $('#progress').innerHTML = `<i style="width:${pct.toFixed(1)}%"></i>`;
  $('#progress-label').textContent = next ? `${fmt(subs)} / ${fmt(next)} suscriptores` : `${fmt(subs)} suscriptores`;
}
const setStatText = key => { $('#' + key).textContent = (key === 'money' ? '$ ' : '') + fmt(shown[key]); };
/** Muestra los valores guardados sin animación (al arrancar). */
function syncStats() {
  for (const key of ['subs', 'views', 'money']) { shown[key] = save[key]; setStatText(key); }
}
/** Anima los contadores de la cabecera hacia los valores guardados. */
function tickStats(dt) {
  for (const key of ['subs', 'views', 'money']) {
    if (shown[key] === save[key]) continue;
    const before = Math.floor(shown[key]);
    shown[key] = Math.abs(save[key] - shown[key]) < 1 ? save[key] : damp(shown[key], save[key], 5, dt);
    if (Math.floor(shown[key]) !== before) {
      setStatText(key);
      $('#' + key).parentElement.classList.add('bump');
    } else if (shown[key] === save[key]) $('#' + key).parentElement.classList.remove('bump');
  }
}
function tickUI(dt) {
  if (toastLeft > 0 && (toastLeft -= dt) <= 0) $('#toast').classList.remove('show');
  tickStats(dt);
  const it = mode === 'home' && modal.hidden && !(avatar.nap > 0) ? nearestInteraction() : null;
  const text = it ? it.label() : '';
  if (text !== promptText) {
    promptText = text;
    const el = $('#prompt');
    if (text) el.innerHTML = `<kbd>E</kbd> ${text}`;
    el.classList.toggle('show', !!text);
  }
}
function setModeUI() {
  document.body.dataset.mode = mode;
  setTouchControls();
  $('#arcade-controls').textContent = mode === 'arcade' && arcade
    ? (arcade.def.controls || arcade.def.hint || '') : '';
  const rec = record ? '● GRABANDO' : 'PRÁCTICA';
  $('#location').textContent = mode === 'run' ? `${rec} · SALTO NEÓN`
    : mode === 'arcade' ? `${rec} · ${gameById(arcade.id).name.toUpperCase()}`
    : mode === 'cards' ? `${rec} · POLENOM` : '● CASA / ' + placeName();
}
/* ---------- Barra táctil ----------
   Un teléfono no tiene teclado: cada modo declara los botones que necesita.
   `code` envía esa tecla al juego y `hold` la mantiene pulsada mientras dure el dedo. */
const RUN_TOUCH = [
  { label: '◀', act: 'left' },
  { label: '⤒ Saltar', act: 'jump', big: true },
  { label: '▶', act: 'right' },
];
function touchControls() {
  if (mode === 'run') return RUN_TOUCH;
  if (mode === 'arcade' && arcade) return arcade.def.touch || [];
  return [];
}
function setTouchControls() {
  const bar = $('#touch'), items = touchControls();
  bar.innerHTML = items.map(b => `<button type="button" data-touch="${b.act || ''}" data-code="${b.code || ''}"`
    + `${b.hold ? ' data-hold="1"' : ''}${b.big ? ' class="big"' : ''}>${b.label}</button>`).join('');
  bar.hidden = !items.length;
}
function updateWallsButton() {
  const b = $('#walls');
  b.innerHTML = `🧱 <span class="wl">Paredes ${WALL_MODES[wallMode]}</span>`;
  b.title = 'Cambiar la vista de las paredes (C)';
}
function toggleWalls() {
  cycleWallMode();
  updateWallsButton();
  toast('Paredes ' + WALL_MODES[wallMode] + ' (C)');
}
/** Etiqueta con la cámara de bolsillo que usas, si tienes alguna. */
function cameraBadge() {
  const c = pocketCamera();
  return c ? `<span class="badge">${c.icon} Grabas con ${c.name} · +${Math.round(c.camera * 100)} % alcance</span>` : '';
}
function updateSoundButton() {
  const b = $('#sound');
  b.textContent = save.muted ? '🔇' : '🔊';
  b.title = save.muted ? 'Activar sonido (M)' : 'Silenciar (M)';
  b.setAttribute('aria-pressed', String(save.muted));
}
function toggleSound() {
  save.muted = !save.muted;
  Sound.setMuted(save.muted);
  persist();
  updateSoundButton();
  toast(save.muted ? 'Sonido desactivado (M)' : 'Sonido activado (M)');
}

/* ---------- Ventanas ---------- */
function show(html, { onClose = null, wide = false } = {}) {
  keys.clear();
  panel.classList.toggle('wide', wide);
  avatar.target = null;
  modalOnClose = onClose;
  panel.innerHTML = html;
  modal.hidden = false;
  panel.classList.remove('pop');
  void panel.offsetWidth; // reinicia la animación de entrada
  panel.classList.add('pop');
  bind('close', closeModal);
  const first = panel.querySelector('.primary');
  if (first) first.focus();
}
function closeModal() {
  if (modal.hidden) return;
  modal.hidden = true;
  keys.clear();
  const focused = document.activeElement;
  if (focused && focused !== document.body && focused.blur) focused.blur(); // que Espacio no pulse un botón oculto
  const cb = modalOnClose;
  modalOnClose = null;
  if (cb) cb();
  if ((mode === 'run' && run && run.outro <= 0) || (mode === 'arcade' && arcade && arcade.outro <= 0)) Sound.startMusic();
  updateMission();
}
function bind(id, fn) {
  const el = document.getElementById(id);
  if (el) el.onclick = () => { Sound.click(); fn(); };
}
function heading(tag, title) {
  return `<div class="row between"><span class="eyebrow">${tag}</span><button id="close" class="ghost" aria-label="Cerrar">✕ Cerrar</button></div><h1>${title}</h1>`;
}
function thumbArt(i, title = '') {
  const t = THUMBS[i] || THUMBS[0];
  return `<div class="thumb t${i}"><span class="thumb-icon">${t.icon}</span><span class="thumb-label">${t.label}</span>${title ? `<span class="thumb-title">${escapeHTML(title)}</span>` : ''}</div>`;
}
function ago(iso) {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (!Number.isFinite(s)) return '';
  if (s < 60) return 'hace un momento';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return `hace ${Math.floor(s / 86400)} d`;
}
const miniStats = items => `<div class="mini-stats">${items.map(([v, l]) => `<div><b>${v}</b><small>${l}</small></div>`).join('')}</div>`;

function help() {
  show(heading('BIENVENIDO A TU ESTUDIO', 'Tu próxima gran historia.') + `
    <p class="lead">Esto es <strong>Putup</strong>, una pequeña demo 3D sobre empezar como creador.</p>
    <div class="grid">
      <div class="card">
        <h3>01 · Vive tu estudio</h3>
        <p>Tu casa tiene estudio, salón, cocina, recibidor, baño y jardín. Camina con <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> o las flechas, o <b>haz clic en el suelo</b>. Arrastra para girar la cámara y usa la rueda para acercarla. Junto a un objeto pulsa <kbd>E</kbd> (o haz clic en él): ordenador, tele, nevera, cafetera, cama, bañera, buzón… <kbd>C</kbd> cambia la vista de las paredes.</p>
        <h3>02 · Graba una partida</h3>
        <p>En el ordenador tienes seis juegos: <b>Salto neón</b>, <b>Ritmo pixel</b>, <b>Serpiente de likes</b>, <b>Polenom</b> y dos novedades: <b>Órbita viral</b> (naves y asteroides) y <b>Memoria viral</b> (parejas y rachas). Supera tus récords para conseguir medallas en los juegos nuevos.</p>
      </div>
      <div class="card">
        <h3>03 · Construye tu canal</h3>
        <p>Elige momentos, título y miniatura. Publica para ganar vistas y suscriptores. Con <b>100 suscriptores</b> ganas dinero ficticio para mejorar tu estudio, y las mejoras se ven en la habitación.</p>
        <p class="fine"><kbd>M</kbd> silencia · <kbd>Esc</kbd> pausa o cierra ventanas.</p>
        <p class="fine">Futuro: móvil, realidad virtual y personajes detallados.</p>
      </div>
    </div>
    <button id="start" class="primary">${save.videos.length ? 'Volver a casa →' : 'Entrar en casa →'}</button>`);
  bind('start', closeModal);
}

function desktop() {
  const themes = save.game ? `<div class="seg" role="group" aria-label="Aspecto del circuito">
      <button data-theme="night" class="${save.theme === 'night' ? 'on' : ''}">🌙 Noche</button>
      <button data-theme="sunset" class="${save.theme === 'sunset' ? 'on' : ''}">🌇 Atardecer</button></div>` : '';
  const art = {
    neon: `<div class="art art-${save.theme}" aria-hidden="true"><span class="art-sun"></span><span class="art-road"></span><span class="art-star">★</span></div>`,
    ritmo: '<div class="art art-ritmo" aria-hidden="true"><i>←</i><i>↓</i><i>↑</i><i>→</i></div>',
    serpiente: '<div class="art art-snake" aria-hidden="true"><span class="snk"></span><span class="hrt">❤</span></div>',
    polenom: `<div class="art art-pol" aria-hidden="true">${['chispin', 'gotin', 'brotito'].map(id => polArt(POLENOM_BY_ID[id])).join('')}</div>`,
    orbita: '<div class="art art-orbita" aria-hidden="true"><span class="orbit-planet"></span><span class="orbit-ship">➤</span><i>✦</i><b>✧</b></div>',
    memoria: '<div class="art art-memoria" aria-hidden="true"><i>★</i><i>♥</i><i>▶</i><i>★</i></div>',
  };
  const best = id => save.records[id] || (id === 'neon' ? save.best : 0);
  show(heading('PUTUP STUDIO · TU ORDENADOR', 'Elige un juego. Crea una historia.') + `
    <div class="row between"><p class="lead">Graba tus mejores partidas, dale tu estilo y encuentra a tu audiencia.</p>
      <label class="toggle"><input id="record" type="checkbox" ${record ? 'checked' : ''}><span class="switch"></span> Grabar la partida</label></div>
    ${cameraBadge()}
    <div class="library-heading"><div><span class="eyebrow">TU BIBLIOTECA</span><h2>Seis formas de crear</h2></div><span class="library-new">2 juegos nuevos · sin compras</span></div>
    <div class="games">${GAMES.map(g => `<div class="card game ${g.fresh ? 'game-new' : ''}">${art[g.id]}<span class="tag">${g.fresh ? 'NUEVO · ' : ''}${g.tag}</span><h3>${g.icon} ${g.name}</h3><p>${g.desc}</p>
      ${g.id === 'neon' ? themes : ''}${g.id === 'polenom' ? `<p class="fine">Colección ${ownedCount()}/${POLENOMS.length} · Sobres ${save.packs} · ${save.pwins} victorias</p>` : ''}
      <button class="primary wide" data-game="${g.id}">${g.id === 'polenom' ? 'Abrir Polenom →' : 'Jugar y crear →'}</button>
      ${best(g.id) ? `<p class="fine">Récord: <b>${fmt(best(g.id))}</b></p>` : ''}
      ${g.medals ? `<div class="medal-track" aria-label="${gameMedal(g.id, best(g.id))} de 3 medallas">${g.medals.map((goal, i) => `<span class="${best(g.id) >= goal ? 'earned' : ''}" title="${['Bronce','Plata','Oro'][i]}: ${goal} puntos">${['🥉','🥈','🥇'][i]} ${fmt(goal)}</span>`).join('')}</div>` : ''}</div>`).join('')}</div>
    <div class="card channel-strip">
      <div><span class="tag">TU CANAL</span><h3>${save.videos.length ? 'Tu comunidad crece' : 'Todo empieza con un vídeo'}</h3></div>
      ${miniStats([[save.videos.length, 'vídeos'], [fmt(save.views), 'vistas'], [fmt(save.subs), 'suscriptores']])}
      <div class="row"><button id="channel">▶ Ver publicaciones</button><button id="shop">🛒 Tienda del estudio</button></div>
    </div>
    <p class="fine">Demo local · Progreso guardado en este navegador · Todos los ingresos son ficticios.</p>`, { wide: true });
  panel.querySelectorAll('[data-game]').forEach(b => {
    b.onclick = () => { record = $('#record').checked; Sound.click(); launchGame(b.dataset.game); };
  });
  bind('channel', channel);
  bind('shop', shop);
  panel.querySelectorAll('[data-theme]').forEach(b => {
    b.onclick = () => { save.theme = b.dataset.theme; persist(); Sound.click(); desktop(); };
  });
}

function gameBriefing(id) {
  const g = gameById(id), isOrbit = id === 'orbita';
  const steps = isOrbit ? [
    ['01', 'Pilota y dispara', byInput('Arrastra el dedo para pilotar y mantén pulsado «Disparar».', 'WASD o flechas para moverte. Mantén Espacio para disparar.') + ' Los asteroides grandes necesitan dos impactos.'],
    ['02', 'Protege tu nave', 'Tienes tres vidas. ' + byInput('Toca «Escudo»', 'Pulsa E') + ' para activar un escudo de dos segundos; vuelve a estar disponible tras ocho segundos.'],
    ['03', 'Persigue los cristales', 'Cada tercer asteroide destruido deja un cristal. Recógelo para sumar 150 puntos y encadena destrucciones sin recibir daño.']
  ] : [
    ['01', 'Mira y recuerda', 'Cada tablero muestra brevemente sus seis parejas. Después, ' + byInput('toca dos cartas', 'haz clic en dos cartas') + ' para descubrirlas.'],
    ['02', 'Encadena aciertos', 'Las parejas seguidas dan más puntos.' + byInput('', ' También puedes elegir con las flechas y voltear con Enter o Espacio.')],
    ['03', 'Completa tres tableros', 'Tienes 60 segundos y dos pistas: ' + byInput('toca «Pista»', 'pulsa H') + ' para mirar las cartas si no hay una pareja abierta. Terminar rápido da puntos extra.']
  ];
  show(heading('NUEVO EN TU BIBLIOTECA', `${g.icon} ${g.name}`) + `
    <p class="lead">${g.desc}</p><div class="briefing-steps">${steps.map(([n,t,d]) => `<div class="card"><span class="eyebrow">${n}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}</div>
    <div class="briefing-goal"><span>Primer objetivo: <b>🥉 ${fmt(g.medals[0])} puntos</b></span><span>${record ? '● Grabación activada · podrás publicar al terminar' : 'Práctica · el récord sí se guarda'}</span></div>
    <div class="row"><button id="start-arcade" class="primary">${record ? 'Grabar y jugar' : 'Jugar en práctica'} →</button><button id="back">← Biblioteca</button></div>`);
  bind('start-arcade', () => startArcade(id));
  bind('back', desktop);
}

/** Ponle nombre al canal: sale en el letrero del estudio, en la placa y en la recreativa. */
function renameChannel(after = channel) {
  show(heading('TU CANAL', save.channel ? 'Cambia el nombre' : 'Ponle nombre a tu canal') + `
    <p class="lead">Se verá en el letrero de neón del estudio, en la placa de la pared, en la máquina
    recreativa del salón y en las cartas de tus fans.</p>
    <div class="field"><input id="cname" type="text" maxlength="18" autocomplete="off" placeholder="Putup" value="${escapeHTML(save.channel)}"><span id="cleft" class="count"></span></div>
    <p class="fine">Hasta 18 letras. En los carteles se dibuja en mayúsculas y sin tildes.</p>
    <div class="row"><button id="save-name" class="primary">Guardar nombre</button><button id="cancel">Cancelar</button></div>`);
  const input = $('#cname'), left = $('#cleft');
  const sync = () => { left.textContent = 18 - input.value.length; };
  input.addEventListener('input', sync);
  sync();
  input.focus();
  bind('save-name', () => {
    save.channel = cleanChannel(input.value);
    persist();
    Sound.shine();
    toast(save.channel ? `Tu canal ya se llama ${save.channel}.` : 'Tu canal vuelve a llamarse Putup.');
    after();
  });
  bind('cancel', after);
}

function channel() {
  const vids = save.videos.slice().reverse();
  show(heading('TU CANAL EN PUTUP', escapeHTML(channelName())) + `
    <div class="row between">
      <p class="lead">${save.channel ? 'Tu rincón, con tu nombre.' : 'Todavía se llama como la plataforma: ponle el tuyo.'}</p>
      <button id="rename">✏ ${save.channel ? 'Cambiar nombre' : 'Ponerle nombre'}</button>
    </div>
    ${miniStats([[fmt(save.subs), 'suscriptores'], [fmt(save.views), 'vistas'], [vids.length, 'vídeos'], [fmt(save.best), 'mejor puntuación']])}
    <div class="grid videos">${vids.length ? vids.map(v => `
      <div class="card video">${thumbArt(v.thumb, v.title)}<span class="tag">${gameById(v.game).icon} ${gameById(v.game).name.toUpperCase()}</span><h3>${escapeHTML(v.title)}</h3>
      <p>${fmt(v.views)} vistas · +${fmt(v.subs)} suscriptores${v.date ? ' · ' + ago(v.date) : ''}</p></div>`).join('')
      : '<p>Todavía no hay vídeos. ¡Graba tu primera partida!</p>'}</div>
    <button id="back">← Volver al estudio</button>`);
  bind('rename', () => renameChannel());
  bind('back', desktop);
}

function shop() {
  show(heading('TIENDA · SOLO DINERO FICTICIO', 'Hazlo tuyo') + `
    <div class="row between"><p>Los ingresos se desbloquean con ${MONETIZE_AT} suscriptores. Las mejoras aparecen en tu estudio.</p><div class="wallet">$ ${fmt(save.money)}</div></div>
    <div class="grid three">${SHOP.map(item => {
      const lvl = save[item.id], price = shopPrice(item), maxed = price == null, afford = !maxed && save.money >= price;
      return `<div class="card shop-item ${maxed ? 'owned' : ''}">
        <div class="shop-icon" aria-hidden="true">${item.icon}</div>
        <span class="tag">${maxed ? 'COMPLETO' : lvl ? `NIVEL ${lvl} DE ${item.max}` : item.tag || 'MEJORA DEL ESTUDIO'}</span>
        <h3>${item.name}</h3>
        <p>${maxed ? item.levels[item.max - 1] : item.levels[lvl]}</p>
        <p class="fine">${item.perk}</p>
        <div class="pips">${item.levels.map((_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</div>
        <button data-buy="${item.id}" class="${afford ? 'primary' : ''}" ${afford ? '' : 'disabled'}>${maxed ? 'Adquirido ✓' : `Comprar · $ ${fmt(price)}`}</button>
      </div>`;
    }).join('')}</div>
    <button id="back">← Volver</button>`);
  bind('back', desktop);
  panel.querySelectorAll('[data-buy]').forEach(b => {
    b.onclick = () => {
      if (!buy(b.dataset.buy)) return;
      Sound.coin();
      stats();
      shop();
      toast('¡Mejora instalada! Cierra la ventana para verla en tu estudio.');
    };
  });
}

function editor() {
  const p = pending, g = gameById(p.game || 'neon'), clips = p.events.length ? p.events : [{ t: 0, text: `Primeros pasos en ${g.name}`, icon: '▶' }];
  const suggested = p.suggest || (p.stars >= 10 ? `¡${p.stars} estrellas en Salto neón!` : '¡Mi desafío de saltos en Putup!');
  const summary = p.summary || [`★ ${p.stars} estrellas`, `✕ ${p.hits} choques`, `${fmt(p.score)} puntos`, ...(p.bestCombo >= 3 ? [`🔥 racha de ${p.bestCombo}`] : [])];
  show(heading('PASO 2 · EDICIÓN', 'Dale tu toque.') + `
    <div class="summary"><span class="game-chip">${g.icon} ${g.name}</span>${summary.map(s => `<span>${s}</span>`).join('')}</div>
    ${cameraBadge()}
    <div class="grid">
      <div class="card">
        <span class="tag">MOMENTOS GRABADOS</span>
        ${clips.map(e => `<label class="clip"><input class="moment" type="checkbox" checked><span class="clip-icon">${e.icon}</span><span class="clip-time">${stamp(e.t)}</span><span>${escapeHTML(e.text)}</span></label>`).join('')}
        <p class="fine">Cada momento seleccionado suma alcance al montaje.</p>
      </div>
      <div class="card">
        <label for="title">Título del vídeo</label>
        <div class="field"><input id="title" type="text" maxlength="70" autocomplete="off" value="${escapeHTML(suggested)}"><span id="count" class="count"></span></div>
        <label>Elige una miniatura</label>
        <div class="thumbs">${THUMBS.slice(0, thumbCount()).map((t, i) => `<button class="thumb-pick ${i === thumb ? 'select' : ''}" data-thumb="${i}" aria-label="Miniatura ${t.label}">${thumbArt(i)}</button>`).join('')}</div>
        <div class="reach"><div class="row between"><span class="fine">ALCANCE ESTIMADO</span><b id="reach-num"></b></div><div class="meter"><i id="reach-bar"></i></div><p class="fine" id="reach-tip"></p></div>
      </div>
    </div>
    <div class="row between"><span class="fine">Publicación simulada: no se sube nada a Internet.</span><button id="publish" class="primary">Publicar en Putup →</button></div>`,
  { onClose: () => toast('Grabación guardada en esta sesión. Pulsa E en el ordenador para seguir editando.') });
  const best = reachEstimate(p, clips.length, '¡Un título perfecto!');
  const refresh = () => {
    const title = $('#title').value.trim(), n = panel.querySelectorAll('.moment:checked').length, est = reachEstimate(p, n, title);
    $('#count').textContent = `${title.length}/70`;
    $('#reach-num').textContent = `≈ ${fmt(est)} vistas`;
    $('#reach-bar').style.width = `${Math.min(100, (est / best) * 100).toFixed(0)}%`;
    $('#reach-tip').textContent = !title ? 'Tu vídeo necesita un título.'
      : !/[!¡?¿]/.test(title) ? 'Consejo: un título con emoción (¡!) atrae más vistas.'
      : title.length < 12 ? 'Consejo: los títulos más descriptivos llegan más lejos.'
      : n < clips.length ? 'Incluye más momentos para un montaje más completo.' : '¡Montaje redondo!';
  };
  $('#title').oninput = refresh;
  panel.querySelectorAll('.moment').forEach(m => { m.onchange = refresh; });
  panel.querySelectorAll('[data-thumb]').forEach(b => {
    b.onclick = () => {
      thumb = +b.dataset.thumb;
      Sound.click();
      panel.querySelectorAll('[data-thumb]').forEach(x => x.classList.toggle('select', x === b));
    };
  });
  bind('publish', publish);
  refresh();
}

function publish() {
  const input = $('#title'), title = input.value.trim().slice(0, 70);
  if (!title) { toast('Ponle un título a tu vídeo', 'warn'); input.focus(); return; }
  const clips = document.querySelectorAll('.moment:checked').length;
  const res = applyPublish(pending, clips, title, thumb);
  pending = null;
  Sound.publish();
  stats();
  const extra = res.crossed.filter(m => m !== MONETIZE_AT && m !== PLAQUE_AT);
  show(heading('PASO 3 · PUBLICADO', '¡Ya estás en Putup!') + `
    <div class="published">${thumbArt(res.thumb, res.title)}<p>Tu vídeo «${escapeHTML(res.title)}» ha encontrado su audiencia.</p></div>
    <div class="grid three">
      <div class="card center"><div class="big" data-count="${res.views}">0</div><p>vistas simuladas</p></div>
      <div class="card center"><div class="big" data-count="${res.subs}" data-prefix="+">+0</div><p>nuevos suscriptores</p></div>
      <div class="card center"><div class="big ${res.money ? '' : 'dim'}" data-count="${res.money}" data-prefix="$ ">$ 0</div><p>ingresos ficticios</p></div>
    </div>
    ${res.crossed.includes(MONETIZE_AT) ? '<p class="banner">🎉 ¡100 suscriptores! Has desbloqueado la monetización ficticia.</p>' : ''}
    ${res.crossed.includes(PLAQUE_AT) ? '<p class="banner">🏆 ¡1.000 suscriptores! Tu placa de plata ya cuelga en la pared del estudio.</p>' : ''}
    ${extra.map(m => `<p class="banner">🚀 ¡Superaste los ${fmt(m)} suscriptores!</p>`).join('')}
    ${save.subs < MONETIZE_AT ? `<p>Te faltan ${fmt(MONETIZE_AT - save.subs)} suscriptores para desbloquear los ingresos ficticios.</p>` : ''}
    ${save.channel ? '' : '<p class="banner">✏ Tu canal todavía no tiene nombre propio.</p>'}
    <button id="continue" class="primary">Continuar creando →</button>
    ${save.channel ? '' : '<button id="name-it">✏ Ponerle nombre al canal</button>'}
    <div class="confetti" aria-hidden="true">${confetti(40)}</div>`);
  countUp();
  bind('name-it', () => renameChannel(desktop));
  bind('continue', desktop);
}
function confetti(n) {
  const colors = ['#b7f675', '#f7e36b', '#ff7ab5', '#6c8fd8', '#ffffff'];
  let s = '';
  for (let i = 0; i < n; i++) {
    s += `<i style="--x:${rand(0, 100).toFixed(1)}%;--d:${rand(0, 0.7).toFixed(2)}s;--r:${Math.round(rand(-540, 540))}deg;--c:${colors[i % colors.length]}"></i>`;
  }
  return s;
}
function countUp() {
  const els = panel.querySelectorAll('[data-count]'), start = performance.now(), dur = 1200;
  const step = now => {
    const k = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - k, 3);
    els.forEach(el => { el.textContent = (el.dataset.prefix || '') + fmt(+el.dataset.count * e); });
    if (k < 1 && !modal.hidden) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function practiceResult(gameId, r) {
  const g = gameById(gameId), summary = r.summary || [`★ ${r.stars} estrellas`, `✕ ${r.hits} choques`, `${fmt(r.score)} puntos`];
  show(heading(`PRÁCTICA · ${g.name.toUpperCase()}`, '¡Buen entrenamiento!') + `
    <div class="summary">${summary.map(s => `<span>${s}</span>`).join('')}</div>
    <p>No activaste la grabación, así que esta partida no se puede publicar.</p>
    <div class="row"><button id="again" class="primary">Jugar otra vez grabando</button><button id="pc">Volver al ordenador</button></div>`);
  bind('again', () => { record = true; launchGame(gameId); });
  bind('pc', desktop);
}

function pause() {
  if ((mode !== 'run' && mode !== 'arcade') || !modal.hidden) return;
  Sound.stopMusic();
  show(heading(mode === 'run' ? 'SALTO NEÓN' : gameById(arcade.id).name.toUpperCase(), 'Partida en pausa') + `
    <p>${record ? 'La grabación continuará cuando vuelvas.' : 'Estás en una partida de práctica.'}</p>
    <div class="row"><button id="resume" class="primary">Seguir jugando</button><button id="quit">Abandonar partida</button></div>`);
  bind('resume', closeModal);
  bind('quit', abandonGame);
}
