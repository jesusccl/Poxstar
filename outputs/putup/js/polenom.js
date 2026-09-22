'use strict';
/* Putup · Polenom: reglas del combate por turnos y rival automático.
   Cada turno: robas una carta, puedes bajar Polenom al banco, usar objetos, unir una energía,
   retirarte una vez y atacar (atacar termina el turno). Gana quien consiga 3 premios. */

const PRIZES_TO_WIN = 3, BENCH_MAX = 3;
const RIVALS = ['Nico, el novato', 'Sara, la aficionada', 'Leo, el veterano', 'Maestra Vera'];

let pol = null;
let polUid = 0;

const polShuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const other = who => (who === 'you' ? 'foe' : 'you');
const polLevel = () => Math.min(3, Math.floor(save.pwins / 2));
const itemCards = () => [{ card: PITEMS.pocion }, { card: PITEMS.pocion }, { card: PITEMS.cambio }, { card: PITEMS.energia }];

/** Colección inicial: dos de cada común y una de cada poco común, más un sobre de regalo. */
function ensureStarter() {
  if (save.starter) return false;
  for (const p of POLENOMS) if (p.rarity < 3) save.cards[p.id] = (save.cards[p.id] || 0) + (p.rarity === 1 ? 2 : 1);
  save.packs += 1;
  save.starter = true;
  persist();
  return true;
}
/** Tu mazo: tus mejores Polenom (máx. 2 copias, máx. 4 raros) y cuatro objetos. */
function playerDeck() {
  const owned = POLENOMS.filter(p => save.cards[p.id]).sort((a, b) => b.rarity - a.rarity || b.hp - a.hp), list = [];
  let rares = 0;
  for (const p of owned) {
    for (let k = 0; k < Math.min(2, save.cards[p.id]) && list.length < 12; k++) {
      if (p.rarity === 3 && rares >= 4) break;
      if (p.rarity === 3) rares++;
      list.push({ card: p, holo: k < (save.holos[p.id] || 0) });
    }
  }
  return [...list, ...itemCards()];
}
function rivalDeck(level) {
  const pick = r => POLENOMS.filter(p => p.rarity === r), list = [];
  for (const p of pick(1)) list.push({ card: p });
  for (const p of polShuffle(pick(2)).slice(0, 2 + level)) list.push({ card: p });
  for (const p of polShuffle(pick(3)).slice(0, level)) list.push({ card: p });
  while (list.length < 12) list.push({ card: pick(1)[Math.floor(Math.random() * 5)] });
  // El primer rival no lleva Superenergía.
  return [...list.slice(0, 12), ...itemCards().filter(c => level > 0 || c.card.id !== 'energia')];
}

const inPlay = entry => ({ ...entry, uid: ++polUid, dmg: 0, energy: 0, stun: false });
function newSide(deck, name) { return { name, deck: polShuffle(deck), hand: [], active: null, bench: [], prizes: 0, discard: [], lost: 0 }; }
function polDraw(side, n = 1) { for (let i = 0; i < n && side.deck.length; i++) side.hand.push(side.deck.pop()); }
/** Mano inicial de 5 (se repite si no hay ningún Polenom) y el primero pasa a ser el activo. */
function setupSide(side) {
  for (let k = 0; k < 10; k++) {
    polDraw(side, 5);
    if (side.hand.some(c => !c.card.item)) break;
    side.deck.push(...side.hand.splice(0));
    polShuffle(side.deck);
  }
  const i = side.hand.findIndex(c => !c.card.item);
  side.active = inPlay(side.hand.splice(i, 1)[0]);
}
function polLog(text) { pol.log.unshift(text); pol.log.length = Math.min(pol.log.length, 6); }
function polEvent(text, icon, weight) {
  if (pol.events.some(e => e.text === text)) return;
  pol.events.push({ t: pol.time, text, icon, weight });
}
const yourTurn = () => pol && !pol.over && pol.turn === 'you' && !pol.need;
const weakMult = (att, def) => (PTYPES[def.card.type].weak === att.card.type ? 2 : 1);

function startPolenom() {
  closeModal();
  const level = polLevel();
  mode = 'cards';
  pol = {
    you: newSide(playerDeck(), 'Tú'), foe: newSide(rivalDeck(level), RIVALS[level]), rival: RIVALS[level], level,
    turn: null, turnNo: 0, energyLeft: 0, retreated: false, pick: null, need: null, after: null,
    log: [], events: [], time: 0, over: false, win: false, ai: [], aiT: 0, dealt: 0, kos: 0, worst: 0, flash: null,
  };
  setupSide(pol.you);
  setupSide(pol.foe);
  const first = Math.random() < 0.5 ? 'you' : 'foe';
  polLog(first === 'you' ? '🪙 Sale cara: empiezas tú.' : `🪙 Sale cruz: empieza ${pol.rival}.`);
  setModeUI();
  polShow();
  beginTurn(first);
}
function beginTurn(who) {
  pol.turn = who;
  pol.turnNo++;
  pol.energyLeft = 1;
  pol.retreated = false;
  pol.pick = null;
  pol.ai = [];
  polDraw(pol[who], 1);
  if (who === 'foe') { pol.ai = [aiSetup, aiItems, aiEnergy, aiAttack]; pol.aiT = 0.9; }
  else if (!pol.you.active && pol.you.bench.length) pol.need = 'promote';
  polRender();
}
function endTurn() {
  if (pol.over) return;
  const side = pol[pol.turn];
  if (side.active) side.active.stun = false;
  const next = other(pol.turn);
  if (!pol.you.active && pol.you.bench.length) { pol.need = 'promote'; pol.after = () => beginTurn(next); polRender(); return; }
  beginTurn(next);
}
function promote(who, i) {
  const side = pol[who];
  side.active = side.bench.splice(i, 1)[0];
  polLog(`${who === 'you' ? 'Sacas' : `${pol.rival} saca`} a ${side.active.card.name}.`);
  if (who === 'you' && pol.need === 'promote') {
    pol.need = null;
    const after = pol.after;
    pol.after = null;
    if (after) after();
  }
  polRender();
}
/** Baja un Polenom de la mano: al puesto activo si está libre, si no al banco. */
function benchFromHand(who, i) {
  const side = pol[who], c = side.hand[i];
  if (!c || c.card.item) return false;
  if (!side.active) side.active = inPlay(side.hand.splice(i, 1)[0]);
  else if (side.bench.length < BENCH_MAX) side.bench.push(inPlay(side.hand.splice(i, 1)[0]));
  else return false;
  Sound.card();
  return true;
}
function attachEnergy(who, mon) {
  if (pol.energyLeft <= 0 || !mon) return false;
  mon.energy++;
  pol.energyLeft--;
  Sound.card();
  return true;
}
function swapActive(who, i) {
  const side = pol[who], out = side.active;
  side.active = side.bench[i];
  side.bench[i] = out;
}
function useItem(who, i, benchIndex = -1) {
  const side = pol[who], c = side.hand[i];
  if (!c || !c.card.item) return false;
  const id = c.card.id;
  if (id === 'pocion') {
    if (!side.active || side.active.dmg <= 0) return false;
    side.active.dmg = Math.max(0, side.active.dmg - 30);
  } else if (id === 'cambio') {
    if (!side.bench.length || benchIndex < 0 || !side.active) return false;
    swapActive(who, benchIndex);
    side.active.stun = false;
  } else if (id === 'energia') {
    pol.energyLeft++;
  }
  side.discard.push(side.hand.splice(i, 1)[0]);
  polLog(`${who === 'you' ? 'Usas' : `${pol.rival} usa`} ${c.card.name}.`);
  Sound.coin();
  return true;
}
function retreat(who, benchIndex) {
  const side = pol[who], a = side.active;
  if (pol.retreated || !a || a.energy < a.card.retreat || !side.bench[benchIndex]) return false;
  a.energy -= a.card.retreat;
  a.stun = false;
  swapActive(who, benchIndex);
  pol.retreated = true;
  polLog(`${a.card.name} se retira al banco.`);
  return true;
}
function canAttack(who, i) {
  const a = pol[who].active, t = pol[other(who)].active;
  return !!(a && t && !pol.over && pol.turn === who && pol.turnNo > 1 && !a.stun && a.energy >= a.card.attacks[i].cost);
}
function attack(who, i) {
  if (!canAttack(who, i)) return false;
  const me = pol[who], foe = pol[other(who)], mon = me.active, a = mon.card.attacks[i], target = foe.active;
  const mult = weakMult(mon, target), dmg = a.dmg * mult;
  target.dmg += dmg;
  polLog(`${mon.card.name} usa ${a.name}: ${dmg} de daño${mult > 1 ? ' (¡súper eficaz!)' : ''}.`);
  if (a.fx === 'stun' && Math.random() < 0.5) { target.stun = true; polLog(`¡${target.card.name} queda aturdido!`); }
  if (a.fx === 'heal20') mon.dmg = Math.max(0, mon.dmg - 20);
  if (a.fx === 'bench10') for (const b of foe.bench) b.dmg += 10;
  if (a.fx === 'recoil20') mon.dmg += 20;
  if (a.fx === 'draw') polDraw(me, 1);
  pol.flash = { who: other(who), uid: target.uid, dmg, mult, t: 0.9 };
  if (who === 'you') {
    pol.dealt += dmg;
    if (mult > 1) polEvent(`Golpe súper eficaz de ${mon.card.name}`, '💥', 3);
    if (dmg >= 100) polEvent(`${a.name}: ¡${dmg} de daño de un golpe!`, '🔥', 4);
  }
  Sound.hit();
  checkKOs();
  if (!pol.over) endTurn();
  return true;
}
function checkKOs() {
  for (const who of ['foe', 'you']) {
    const side = pol[who], opp = pol[other(who)];
    for (const m of [side.active, ...side.bench].filter(Boolean)) {
      if (m.dmg < m.card.hp) continue;
      if (side.active === m) side.active = null; else side.bench = side.bench.filter(b => b !== m);
      side.discard.push(m);
      side.lost++;
      opp.prizes++;
      polLog(`¡${m.card.name} queda fuera de combate!`);
      if (who === 'foe') { pol.kos++; if (pol.kos === 1) polEvent(`Primer K.O.: cae ${m.card.name}`, '🏆', 3); }
    }
  }
  pol.worst = Math.max(pol.worst, pol.foe.prizes - pol.you.prizes);
  if (pol.you.prizes >= PRIZES_TO_WIN || (!pol.foe.active && !pol.foe.bench.length)) return polFinish(true);
  if (pol.foe.prizes >= PRIZES_TO_WIN || (!pol.you.active && !pol.you.bench.length)) return polFinish(false);
  if (!pol.foe.active && pol.foe.bench.length) promote('foe', bestBench(pol.foe));
}
function polFinish(win) {
  pol.over = true;
  pol.win = win;
  pol.ai = [];
  if (win) { save.pwins++; save.packs++; } else save.plosses++;
  persist();
  if (win) {
    polEvent(`¡Victoria ${pol.you.prizes}-${pol.foe.prizes} contra ${pol.rival}!`, '👑', 6);
    if (pol.worst >= 2) polEvent('¡Remontada épica desde el 0-2!', '🚀', 7);
    Sound.finish();
  } else {
    polEvent(pol.foe.prizes - pol.you.prizes <= 1 ? 'Derrota por la mínima' : `${pol.rival} fue imparable`, '😵', 1.5);
    Sound.miss();
  }
  polRender();
  polResult();
}
/** Resultado de la partida en el formato de las grabaciones. */
function polRecording() {
  const p = pol;
  return {
    score: p.you.prizes * 300 + p.dealt + (p.win ? 500 : 0), stars: p.kos + (p.win ? 3 : 0), hits: p.you.lost, bestCombo: 0, events: p.events,
    summary: [p.win ? '👑 Victoria' : '😵 Derrota', `🏆 ${p.you.prizes} - ${p.foe.prizes} premios`, `💥 ${p.dealt} de daño`, `⚔ contra ${p.rival}`],
    suggest: p.win ? `¡Gané a ${p.rival.split(',')[0]} en Polenom!` : '¡Mi combate de cartas Polenom!',
  };
}

/* ---------- Rival automático ---------- */
function bestBench(side) {
  let best = 0;
  side.bench.forEach((m, i) => { const b = side.bench[best]; if (m.energy * 30 + (m.card.hp - m.dmg) > b.energy * 30 + (b.card.hp - b.dmg)) best = i; });
  return best;
}
const bestAttack = (who, mon) => {
  const target = pol[other(who)].active;
  let best = -1, score = -1;
  mon.card.attacks.forEach((a, i) => {
    if (!canAttack(who, i)) return;
    const dmg = a.dmg * weakMult(mon, target), s = dmg + (dmg >= target.card.hp - target.dmg ? 1000 : 0);
    if (s > score) { score = s; best = i; }
  });
  return best;
};
function aiSetup() {
  const side = pol.foe;
  if (!side.active && side.bench.length) promote('foe', bestBench(side));
  side.hand.map((c, i) => [c, i]).filter(([c]) => !c.card.item).sort((a, b) => a[0].card.hp - b[0].card.hp)
    .map(([, i]) => i).sort((a, b) => b - a).forEach(i => benchFromHand('foe', i));
}
/** El primer rival juega sin trucos: no se retira ni usa Cambio y apura más las pociones. */
const aiSmart = () => pol.level >= 1;
function aiItems() {
  const side = pol.foe;
  for (let i = side.hand.length - 1; i >= 0; i--) {
    const c = side.hand[i].card;
    if (!c.item || !side.active) continue;
    if (c.id === 'pocion' && side.active.dmg >= (aiSmart() ? 30 : 50)) useItem('foe', i);
    else if (c.id === 'energia') useItem('foe', i);
    else if (c.id === 'cambio' && aiSmart() && side.bench.length && pol.you.active && weakMult(pol.you.active, side.active) > 1) {
      const j = side.bench.findIndex(m => weakMult(pol.you.active, m) === 1);
      if (j >= 0) useItem('foe', i, j);
    }
  }
}
function aiEnergy() {
  const side = pol.foe;
  while (pol.energyLeft > 0 && side.active) {
    const a = side.active, need = Math.max(...a.card.attacks.map(k => k.cost));
    const target = a.energy < need || !side.bench.length ? a : side.bench.reduce((m, b) => (b.card.rarity > m.card.rarity ? b : m));
    attachEnergy('foe', target);
  }
}
function aiAttack() {
  const side = pol.foe;
  if (aiSmart() && side.active && !pol.retreated && side.active.dmg >= side.active.card.hp - 20 && side.bench.length) {
    const j = bestBench(side);
    if (side.bench[j].card.hp - side.bench[j].dmg > 40) retreat('foe', j);
  }
  const i = side.active ? bestAttack('foe', side.active) : -1;
  if (i >= 0) attack('foe', i); else { polLog(`${pol.rival} pasa el turno.`); endTurn(); }
}
/** Ejecuta de golpe los pasos pendientes del rival (pruebas y simulaciones). */
function polRunAI() {
  let guard = 0;
  while (pol && !pol.over && pol.turn === 'foe' && pol.ai.length && guard++ < 20) pol.ai.shift()();
}
function updatePolenom(dt) {
  if (!pol) return;
  pol.time += dt;
  if (pol.flash && (pol.flash.t -= dt) <= 0) { pol.flash = null; polRender(); }
  if (pol.over || pol.turn !== 'foe' || !pol.ai.length || pol.need || !modal.hidden) return;
  if ((pol.aiT -= dt) <= 0) {
    pol.ai.shift()();
    pol.aiT = 0.8;
    polRender();
  }
}
