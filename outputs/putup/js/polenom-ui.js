'use strict';
/* Putup · Polenom: mesa de juego, menú, sobres y colección (interfaz HTML). */

const PACK_PRICE = 60;
const polRoot = () => $('#cards');
const dots = (n, total, cls) => Array.from({ length: total }, (_, i) => `<i class="${i < n ? cls : ''}"></i>`).join('');

function polShow() {
  const root = polRoot();
  root.hidden = false;
  if (!root.dataset.ready) {
    root.dataset.ready = '1';
    root.addEventListener('click', polClick);
  }
}
function polHide() { polRoot().hidden = true; }

/** Criatura en juego (activa o en el banco). */
function monHTML(m, who, slot, can) {
  if (!m) return `<div class="pmon empty">${who === 'you' && slot === 'active' ? 'Baja un Polenom' : ''}</div>`;
  const left = Math.max(0, m.card.hp - m.dmg), pct = (left / m.card.hp) * 100, hit = pol.flash && pol.flash.uid === m.uid;
  return `<div class="pmon t-${m.card.type} ${slot === 'active' ? 'big' : ''} ${can ? 'can' : ''} ${hit ? 'hit' : ''} ${m.holo ? 'holo' : ''}" data-act="${who === 'you' ? 'mine' : 'theirs'}" data-slot="${slot}">`
    + `<div class="pm-art">${polArt(m.card)}</div>`
    + `<div class="pm-name">${m.card.name} <span>${PTYPES[m.card.type].icon}</span></div>`
    + `<div class="pm-hp ${pct < 35 ? 'low' : ''}"><i style="width:${pct.toFixed(0)}%"></i><span>${left}/${m.card.hp}</span></div>`
    + `<div class="pm-energy">${'⚡'.repeat(m.energy) || '<em>sin energía</em>'}</div>`
    + (m.stun ? '<span class="pm-stun" title="Aturdido">💫</span>' : '')
    + (hit ? `<span class="pm-dmg">-${pol.flash.dmg}${pol.flash.mult > 1 ? ' ×2' : ''}</span>` : '')
    + '</div>';
}
function polHint() {
  if (pol.over) return pol.win ? '¡Has ganado!' : 'Fin del combate';
  if (pol.turn === 'foe') return `Turno de ${pol.rival}…`;
  if (pol.need === 'promote') return 'Tu Polenom cayó: elige en tu banco quién sale a combatir.';
  if (pol.pick && pol.pick.kind === 'cambio') return 'Elige el Polenom del banco que pasa a ser el activo.';
  if (pol.pick && pol.pick.kind === 'retreat') return 'Elige el Polenom del banco que sustituye al activo.';
  if (pol.energyLeft > 0) return 'Toca uno de tus Polenom para unirle energía ⚡ · Baja Polenom desde tu mano.';
  return pol.turnNo === 1 ? 'En el primer turno no se puede atacar. Prepara tu equipo.' : 'Elige un ataque o termina el turno.';
}
function polRender() {
  if (!pol || mode !== 'cards') return;
  const you = pol.you, foe = pol.foe, myTurn = yourTurn(), picking = pol.pick || pol.need === 'promote';
  const act = you.active;
  const attacks = act ? act.card.attacks.map((a, i) => {
    const mult = foe.active ? weakMult(act, foe.active) : 1, ok = myTurn && !pol.pick && canAttack('you', i);
    return `<button class="pol-atk ${ok ? 'primary' : ''}" data-act="attack" data-i="${i}" ${ok ? '' : 'disabled'}>`
      + `<span>${'●'.repeat(a.cost)}</span> ${a.name} <b>${a.dmg * mult}${mult > 1 ? ' ×2' : ''}</b></button>`;
  }).join('') : '';
  const canRetreat = myTurn && !pol.pick && act && !pol.retreated && you.bench.length && act.energy >= act.card.retreat;
  polRoot().innerHTML = `
    <div class="pol-top">
      <div class="pol-logo">POLE<span>NOM</span></div>
      <div class="pol-score"><span>Tú ${dots(you.prizes, PRIZES_TO_WIN, 'me')}</span><b>vs</b><span>${dots(foe.prizes, PRIZES_TO_WIN, 'them')} ${pol.rival}</span></div>
      ${record ? `<span class="pol-rec">● REC ${stamp(pol.time)}</span>` : '<span class="pol-rec off">Práctica</span>'}
      <button data-act="quit">Salir</button>
    </div>
    <div class="pol-field">
      <div class="pol-row foe">
        <div class="pol-pile">🂠 ${foe.deck.length}<small>mazo</small></div>
        <div class="pol-bench">${[0, 1, 2].map(i => monHTML(foe.bench[i], 'foe', 'b' + i, false)).join('')}</div>
        ${monHTML(foe.active, 'foe', 'active', false)}
        <div class="pol-pile">✋ ${foe.hand.length}<small>mano</small></div>
      </div>
      <div class="pol-mid ${pol.turn === 'you' ? 'mine' : ''}"><b>${pol.turn === 'you' ? 'TU TURNO' : 'TURNO RIVAL'}</b><span>${pol.log[0] || ''}</span></div>
      <div class="pol-row you">
        <div class="pol-pile">🂠 ${you.deck.length}<small>mazo</small></div>
        ${monHTML(act, 'you', 'active', myTurn && !picking && pol.energyLeft > 0)}
        <div class="pol-bench">${[0, 1, 2].map(i => monHTML(you.bench[i], 'you', 'b' + i, (myTurn && pol.energyLeft > 0) || picking)).join('')}</div>
        <div class="pol-actions">${attacks}</div>
      </div>
    </div>
    <div class="pol-hand">${you.hand.map((c, i) => polCardHTML(c.card, { holo: c.holo, extra: `data-act="hand" data-i="${i}"`, cls: myTurn ? 'playable' : '' })).join('')}</div>
    <div class="pol-bar"><span>${polHint()}</span>
      <button data-act="retreat" ${canRetreat ? '' : 'disabled'}>↩ Retirar (${act ? '●'.repeat(act.card.retreat) : '-'})</button>
      <button data-act="end" class="${myTurn ? 'primary' : ''}" ${myTurn && !pol.pick ? '' : 'disabled'}>Terminar turno →</button>
    </div>`;
}
function polClick(e) {
  const el = e.target.closest('[data-act]');
  if (!el || !pol) return;
  const a = el.dataset.act, i = +el.dataset.i, slot = el.dataset.slot;
  Sound.unlock();
  if (a === 'quit') { polQuit(); return; }
  if (!yourTurn() && !(a === 'mine' && pol.need === 'promote')) return;
  if (a === 'hand') {
    const c = pol.you.hand[i];
    if (!c) return;
    if (!c.card.item) { if (!benchFromHand('you', i)) toast('Tu banco está lleno (máximo 3).'); }
    else if (c.card.id === 'cambio') { if (pol.you.bench.length) pol.pick = { kind: 'cambio', hand: i }; else toast('No tienes Polenom en el banco.'); }
    else if (!useItem('you', i)) toast(c.card.id === 'pocion' ? 'Tu Polenom activo no está herido.' : 'Ahora no puedes usar esa carta.');
  } else if (a === 'mine') {
    const bi = slot && slot[0] === 'b' ? +slot.slice(1) : -1, mon = bi >= 0 ? pol.you.bench[bi] : pol.you.active;
    if (!mon) return;
    if (pol.need === 'promote') { if (bi >= 0) promote('you', bi); return; }
    if (pol.pick && pol.pick.kind === 'cambio') { if (bi >= 0) useItem('you', pol.pick.hand, bi); pol.pick = null; }
    else if (pol.pick && pol.pick.kind === 'retreat') { if (bi >= 0) retreat('you', bi); pol.pick = null; }
    else if (!attachEnergy('you', mon)) toast('Ya has unido la energía de este turno.');
  } else if (a === 'attack') attack('you', i);
  else if (a === 'retreat') pol.pick = pol.pick ? null : { kind: 'retreat' };
  else if (a === 'end') endTurn();
  polRender();
}
function polQuit() {
  if (pol && !pol.over) {
    show(heading('POLENOM', '¿Abandonar el combate?') + `<p>Si sales ahora, la partida cuenta como derrota.</p>
      <div class="row"><button id="stay" class="primary">Seguir jugando</button><button id="leave">Abandonar</button></div>`);
    bind('stay', closeModal);
    bind('leave', () => { save.plosses++; persist(); closeModal(); polExit(); polenomMenu(); });
    return;
  }
  polExit();
}
function polExit() {
  pol = null;
  polHide();
  mode = 'home';
  setModeUI();
}
function polResult() {
  const win = pol.win, rec = polRecording();
  show(heading('POLENOM · FIN DEL COMBATE', win ? '¡Victoria!' : 'Derrota') + `
    <div class="summary">${rec.summary.map(s => `<span>${s}</span>`).join('')}</div>
    <p>${win ? '🎴 Ganas <b>un sobre</b> de Polenom. ¡Ábrelo en el menú!' : 'Mejora tu mazo abriendo sobres y vuelve a intentarlo.'}</p>
    <div class="row">${record ? '<button id="pol-edit" class="primary">Editar el vídeo →</button>' : ''}
      <button id="pol-again" class="${record ? '' : 'primary'}">Otra partida</button><button id="pol-menu">Menú de Polenom</button></div>`);
  bind('pol-edit', () => { polExit(); finishRecording('polenom', rec); });
  bind('pol-again', () => { polExit(); startPolenom(); });
  bind('pol-menu', () => { polExit(); polenomMenu(); });
}

/* ---------- Menú, sobres y colección ---------- */
const ownedCount = () => POLENOMS.filter(p => save.cards[p.id]).length;
function polenomMenu() {
  if (ensureStarter()) toast('¡Recibes tu mazo inicial de Polenom y un sobre de regalo!');
  const hero = ['fogonazo', 'marejada', 'musgolem'].map(id => `<div class="hero-art">${polArt(POLENOM_BY_ID[id])}</div>`).join('');
  show(heading('POLENOM · JUEGO DE CARTAS', 'Colecciona y combate') + `
    <div class="grid">
      <div class="card">
        <div class="pol-hero">${hero}</div>
        <p>Une una energía por turno, ataca y consigue <b>${PRIZES_TO_WIN} premios</b> dejando fuera de combate a los Polenom rivales. Cada tipo es débil a otro: el daño se duplica.</p>
        <div class="type-chain" title="Cada tipo gana al siguiente">🔥 › 🌿 › 🪨 › ⚡ › 💧 › 🔥</div>
        <label class="toggle"><input id="record" type="checkbox" ${record ? 'checked' : ''}><span class="switch"></span> Grabar el combate</label>
        <button id="pol-fight" class="primary wide">Combatir contra ${RIVALS[polLevel()]} →</button>
        <p class="fine">${save.pwins} victorias · ${save.plosses} derrotas · Cada victoria da un sobre y los rivales se vuelven más duros.</p>
      </div>
      <div class="card">
        <span class="tag">TU COLECCIÓN</span>
        <h3>${ownedCount()} / ${POLENOMS.length} Polenom</h3>
        <div class="meter"><i style="width:${((ownedCount() / POLENOMS.length) * 100).toFixed(0)}%"></i></div>
        <div class="stack">
          <button id="pol-open" class="${save.packs ? 'primary' : ''}">🎴 Abrir sobre (${save.packs})</button>
          <button id="pol-buy" ${save.money >= PACK_PRICE ? '' : 'disabled'}>Comprar sobre · $ ${PACK_PRICE}</button>
          <button id="pol-col">📖 Ver colección</button>
        </div>
        <p class="fine">Cada sobre trae 5 cartas y al menos una poco común. Puede salir una rara ★★★ o una brillante ✨.</p>
      </div>
    </div>
    <button id="back">← Volver a los juegos</button>`);
  bind('pol-fight', () => { record = $('#record').checked; startPolenom(); });
  bind('pol-open', openPack);
  bind('pol-buy', () => {
    if (save.money < PACK_PRICE) return;
    save.money -= PACK_PRICE;
    save.packs++;
    persist();
    Sound.coin();
    polenomMenu();
  });
  bind('pol-col', polCollection);
  bind('back', desktop);
}
/** Cinco cartas: cuatro con probabilidades normales y la última al menos poco común. */
function rollPack() {
  const byRarity = r => POLENOMS.filter(p => p.rarity === r);
  return Array.from({ length: 5 }, (_, i) => {
    const r = Math.random(), rarity = i === 4 ? (r < 0.3 ? 3 : 2) : r < 0.72 ? 1 : r < 0.95 ? 2 : 3, list = byRarity(rarity);
    return { card: list[Math.floor(Math.random() * list.length)], holo: Math.random() < (i === 4 ? 0.15 : 0.06) };
  });
}
function openPack() {
  if (save.packs <= 0) { toast('No te quedan sobres: gana combates o compra uno.'); return; }
  save.packs--;
  const cards = rollPack().map(c => ({ ...c, isNew: !save.cards[c.card.id] }));
  for (const c of cards) {
    save.cards[c.card.id] = (save.cards[c.card.id] || 0) + 1;
    if (c.holo) save.holos[c.card.id] = (save.holos[c.card.id] || 0) + 1;
  }
  persist();
  let shown = 0;
  show(heading('POLENOM · SOBRE', 'Abre tu sobre') + `
    <p class="lead">Toca cada carta para darle la vuelta.</p>
    <div class="pack">${cards.map((c, i) => `<button class="pack-card ${c.card.rarity === 3 ? 'rare' : ''}" data-reveal="${i}" aria-label="Carta ${i + 1}">
      <div class="inner"><div class="back"><span>POLE<b>NOM</b></span></div>
      <div class="front">${polCardHTML(c.card, { holo: c.holo })}${c.isNew ? '<span class="new-tag">¡NUEVA!</span>' : ''}</div></div></button>`).join('')}</div>
    <div class="row between"><button id="reveal-all">Revelar todas</button>
      <div class="row">${record ? '<button id="pack-rec" disabled>Grabar la apertura →</button>' : ''}<button id="pack-done" class="primary" disabled>Listo</button></div></div>`);
  const reveal = b => {
    if (b.classList.contains('shown')) return;
    b.classList.add('shown');
    const c = cards[+b.dataset.reveal];
    if (c.card.rarity === 3 || c.holo) Sound.shine(); else Sound.card();
    if (++shown === cards.length) {
      $('#pack-done').disabled = false;
      const rec = $('#pack-rec');
      if (rec) rec.disabled = false;
    }
  };
  panel.querySelectorAll('[data-reveal]').forEach(b => { b.onclick = () => reveal(b); });
  bind('reveal-all', () => panel.querySelectorAll('[data-reveal]').forEach((b, i) => setTimeout(() => reveal(b), i * 180)));
  bind('pack-done', polenomMenu);
  bind('pack-rec', () => {
    const best = cards.slice().sort((a, b) => b.card.rarity - a.card.rarity || b.holo - a.holo);
    const events = cards.map((c, i) => ({
      t: i * 3, icon: c.holo ? '✨' : c.card.rarity === 3 ? '★' : '🎴', weight: c.card.rarity + (c.holo ? 3 : 0) + (c.isNew ? 1 : 0),
      text: `Sale ${c.card.name}${c.holo ? ' brillante' : ''}${c.card.rarity === 3 ? ' (¡rara!)' : ''}${c.isNew ? ' · ¡nueva!' : ''}`,
    }));
    finishRecording('polenom', {
      score: cards.reduce((s, c) => s + c.card.rarity * 100 + (c.holo ? 300 : 0), 0), stars: cards.filter(c => c.card.rarity === 3).length * 2 + cards.filter(c => c.holo).length * 2,
      hits: 0, bestCombo: 0, events, summary: ['🎴 Apertura de sobre', ...best.slice(0, 3).map(c => `${c.holo ? '✨' : '★'.repeat(c.card.rarity)} ${c.card.name}`)],
      suggest: best[0].card.rarity === 3 || best[0].holo ? `¡Me salió ${best[0].card.name}${best[0].holo ? ' brillante' : ''} en Polenom!` : 'Abriendo un sobre de Polenom',
    });
  });
}
function polCollection() {
  const byType = Object.keys(PTYPES).map(type => `<div class="col-type"><span class="tag">${PTYPES[type].icon} ${PTYPES[type].name.toUpperCase()}</span><div class="col-row">`
    + POLENOMS.filter(p => p.type === type).map(p => {
      const n = save.cards[p.id] || 0, h = save.holos[p.id] || 0;
      return n ? `<div class="col-card">${polCardHTML(p, { holo: h > 0 })}<span class="col-count">×${n}${h ? ` · ✨${h}` : ''}</span></div>`
        : `<div class="col-card locked"><div class="pcard ghost"><span>???</span><small>${'★'.repeat(p.rarity)}</small></div></div>`;
    }).join('') + '</div></div>').join('');
  show(heading('POLENOM · COLECCIÓN', `${ownedCount()} de ${POLENOMS.length} descubiertos`) + `<div class="collection">${byType}</div><button id="back">← Volver</button>`);
  bind('back', polenomMenu);
}
