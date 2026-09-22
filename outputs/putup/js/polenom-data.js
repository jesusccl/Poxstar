'use strict';
/* Putup · Polenom: tipos, criaturas, objetos e ilustraciones (SVG generado para cada criatura).
   Todas las criaturas y nombres son originales de Putup. */

const PTYPES = {
  fuego: { name: 'Fuego', icon: '🔥', body: '#ff8a4c', dark: '#c8532a', bg: ['#ffe6c9', '#ffab7a'], weak: 'agua' },
  agua: { name: 'Agua', icon: '💧', body: '#4fa8ff', dark: '#2b72c4', bg: ['#dcf1ff', '#8cc8ff'], weak: 'rayo' },
  planta: { name: 'Planta', icon: '🌿', body: '#6cc070', dark: '#3b8a42', bg: ['#eaf8d8', '#a6db86'], weak: 'fuego' },
  rayo: { name: 'Rayo', icon: '⚡', body: '#ffd23f', dark: '#c9960d', bg: ['#fff8cf', '#ffe07a'], weak: 'tierra' },
  tierra: { name: 'Tierra', icon: '🪨', body: '#c29265', dark: '#86592f', bg: ['#f5e6d1', '#d4b28c'], weak: 'planta' },
};

const FX_TEXT = {
  stun: 'Lanza una moneda: si sale cara, el rival queda aturdido y no ataca en su turno.',
  heal20: 'Cura 20 PV a este Polenom.',
  bench10: 'Hace 10 de daño a cada Polenom del banco rival.',
  recoil20: 'Este Polenom también recibe 20 de daño.',
  draw: 'Roba una carta.',
};

const atk = (name, cost, dmg, fx = null) => ({ name, cost, dmg, fx });
const POLENOMS = [
  { id: 'chispin', name: 'Chispín', type: 'fuego', hp: 60, rarity: 1, shape: 0, attacks: [atk('Chispa', 1, 20), atk('Brasa', 2, 40)] },
  { id: 'llamaron', name: 'Llamarón', type: 'fuego', hp: 90, rarity: 2, shape: 1, attacks: [atk('Zarpazo', 1, 20, 'draw'), atk('Llamarada', 3, 70)] },
  { id: 'fogonazo', name: 'Fogonazo', type: 'fuego', hp: 130, rarity: 3, shape: 2, attacks: [atk('Ascuas', 2, 40, 'bench10'), atk('Erupción', 4, 120, 'recoil20')] },
  { id: 'gotin', name: 'Gotín', type: 'agua', hp: 60, rarity: 1, shape: 0, attacks: [atk('Salpicar', 1, 20), atk('Chorro', 2, 40)] },
  { id: 'burbujon', name: 'Burbujón', type: 'agua', hp: 90, rarity: 2, shape: 1, attacks: [atk('Burbujas', 1, 10, 'stun'), atk('Ola', 3, 70)] },
  { id: 'marejada', name: 'Marejada', type: 'agua', hp: 130, rarity: 3, shape: 2, attacks: [atk('Marea', 2, 50, 'heal20'), atk('Tsunami', 4, 110, 'bench10')] },
  { id: 'brotito', name: 'Brotito', type: 'planta', hp: 60, rarity: 1, shape: 0, attacks: [atk('Hojita', 1, 20), atk('Látigo', 2, 40)] },
  { id: 'hojarasco', name: 'Hojarasco', type: 'planta', hp: 90, rarity: 2, shape: 1, attacks: [atk('Absorber', 1, 20, 'heal20'), atk('Remolino verde', 3, 60)] },
  { id: 'musgolem', name: 'Musgolem', type: 'planta', hp: 140, rarity: 3, shape: 2, attacks: [atk('Raíces', 2, 40, 'heal20'), atk('Selva viva', 4, 110)] },
  { id: 'zapito', name: 'Zapito', type: 'rayo', hp: 60, rarity: 1, shape: 0, attacks: [atk('Chasquido', 1, 20), atk('Descarga', 2, 30, 'stun')] },
  { id: 'voltin', name: 'Voltín', type: 'rayo', hp: 80, rarity: 2, shape: 1, attacks: [atk('Estática', 1, 20, 'stun'), atk('Rayo doble', 3, 70)] },
  { id: 'truenazo', name: 'Truenazo', type: 'rayo', hp: 120, rarity: 3, shape: 2, attacks: [atk('Tormenta', 2, 50, 'bench10'), atk('Megavoltio', 4, 130, 'recoil20')] },
  { id: 'guijarrin', name: 'Guijarrín', type: 'tierra', hp: 70, rarity: 1, shape: 0, attacks: [atk('Placaje', 1, 20), atk('Pedrada', 2, 40)] },
  { id: 'pedrusco', name: 'Pedrusco', type: 'tierra', hp: 100, rarity: 2, shape: 1, attacks: [atk('Rodar', 2, 40), atk('Derrumbe', 3, 70)] },
  { id: 'terremolo', name: 'Terremolo', type: 'tierra', hp: 140, rarity: 3, shape: 2, attacks: [atk('Temblor', 2, 40, 'bench10'), atk('Gran sacudida', 4, 120)] },
];
for (const p of POLENOMS) p.retreat = p.shape === 2 ? 2 : 1;
const POLENOM_BY_ID = Object.fromEntries(POLENOMS.map(p => [p.id, p]));

const PITEMS = {
  pocion: { id: 'pocion', item: true, name: 'Poción', icon: '🧪', text: 'Cura 30 PV a tu Polenom activo.' },
  cambio: { id: 'cambio', item: true, name: 'Cambio', icon: '🔄', text: 'Cambia tu Polenom activo por uno de tu banco (sin gastar energía).' },
  energia: { id: 'energia', item: true, name: 'Superenergía', icon: '✨', text: 'Une una energía extra este turno.' },
};
const RARITY_NAME = ['', 'Común', 'Poco común', 'Rara'];

/* ---------- Ilustraciones ---------- */
let polArtSeq = 0;
function polAccessory(type, s, top, rx, cy) {
  const L = 60 - rx, Rr = 60 + rx;
  switch (type) {
    case 'fuego': {
      const f = (x, y, k) => `<path d="M${x} ${y - 18 * k} C${x + 8 * k} ${y - 7 * k} ${x + 9 * k} ${y + 1} ${x} ${y + 3} C${x - 9 * k} ${y + 1} ${x - 8 * k} ${y - 7 * k} ${x} ${y - 18 * k}Z" fill="#ff5a1f"/>`
        + `<path d="M${x} ${y - 10 * k} C${x + 4 * k} ${y - 4 * k} ${x + 4 * k} ${y} ${x} ${y + 1} C${x - 4 * k} ${y} ${x - 4 * k} ${y - 4 * k} ${x} ${y - 10 * k}Z" fill="#ffd23f"/>`;
      return f(60, top + 3, s === 2 ? 1.3 : 1) + (s === 2 ? f(L + 6, top + 12, 0.8) + f(Rr - 6, top + 12, 0.8) : '') + (s >= 1 ? f(Rr + 6, cy + 6, 0.7) : '');
    }
    case 'agua': {
      const drop = `<path d="M60 ${top - 14} C67 ${top - 4} 67 ${top + 3} 60 ${top + 4} C53 ${top + 3} 53 ${top - 4} 60 ${top - 14}Z" fill="#c9ecff" stroke="#2b72c4" stroke-width="2"/>`;
      const fins = `<path d="M${L + 2} ${cy} l-11 -7 l3 13z" fill="#2b72c4"/><path d="M${Rr - 2} ${cy} l11 -7 l-3 13z" fill="#2b72c4"/>`;
      const crest = s === 2 ? `<path d="M${L + 8} ${top + 6} q8 -14 16 -2 q8 -14 16 -2 q8 -14 16 -2" fill="none" stroke="#e8f7ff" stroke-width="4" stroke-linecap="round"/>` : '';
      return fins + drop + crest;
    }
    case 'planta': {
      const leaves = `<path d="M60 ${top + 3} L60 ${top - 8}" stroke="#3b8a42" stroke-width="2.5"/>`
        + `<ellipse cx="52" cy="${top - 9}" rx="9" ry="4.5" transform="rotate(-25 52 ${top - 9})" fill="#8fdc52" stroke="#3b8a42" stroke-width="1.5"/>`
        + `<ellipse cx="68" cy="${top - 9}" rx="9" ry="4.5" transform="rotate(25 68 ${top - 9})" fill="#8fdc52" stroke="#3b8a42" stroke-width="1.5"/>`;
      const flower = s === 2 ? [0, 72, 144, 216, 288].map(a => `<circle cx="${60 + Math.cos(a * Math.PI / 180) * 5}" cy="${top - 16 + Math.sin(a * Math.PI / 180) * 5}" r="4" fill="#ff9ac8"/>`).join('') + `<circle cx="60" cy="${top - 16}" r="3" fill="#ffd23f"/>` : '';
      const moss = s >= 1 ? `<ellipse cx="${L + 8}" cy="${cy + 6}" rx="6" ry="4" fill="#3b8a42" opacity=".6"/><ellipse cx="${Rr - 10}" cy="${cy - 4}" rx="5" ry="3" fill="#3b8a42" opacity=".6"/>` : '';
      return leaves + flower + moss;
    }
    case 'rayo': {
      const ant = (x, d) => `<path d="M${x} ${top + 4} l${-4 * d} -8 l${5 * d} 1 l${-4 * d} -9" fill="none" stroke="#1d2033" stroke-width="2.4" stroke-linejoin="round"/><circle cx="${x - 3 * d}" cy="${top - 13}" r="3" fill="#fff36b" stroke="#c9960d"/>`;
      const bolt = s >= 1 ? `<path d="M${Rr + 2} ${cy - 10} l9 3 l-5 5 l9 3 l-15 11 l4 -9 l-7 -2z" fill="#ffe34d" stroke="#c9960d" stroke-width="1.5"/>` : '';
      return ant(52, 1) + ant(68, -1) + bolt;
    }
    default: {
      const rock = (x, y, k) => `<path d="M${x - 7 * k} ${y + 3} l${3 * k} ${-9 * k} l${7 * k} ${-2 * k} l${5 * k} ${8 * k} l${-2 * k} ${4 * k}z" fill="#9a8f84" stroke="#5f554c" stroke-width="1.5"/>`;
      const horns = s === 2 ? `<path d="M${L + 6} ${top + 8} l-6 -16 l12 10z" fill="#e8dccb" stroke="#86592f"/><path d="M${Rr - 6} ${top + 8} l6 -16 l-12 10z" fill="#e8dccb" stroke="#86592f"/>` : '';
      return rock(60, top + 2, s === 2 ? 1.3 : 1) + (s >= 1 ? rock(L + 8, cy + 4, 0.8) + rock(Rr - 6, cy - 2, 0.7) : '') + horns;
    }
  }
}
/** Ilustración SVG de una criatura (fondo de su tipo, cuerpo según su forma, carita y detalles). */
function polArt(card) {
  const T = PTYPES[card.type], id = `pa${++polArtSeq}`, s = card.shape;
  const cy = [60, 55, 55][s], rx = [21, 19, 30][s], ry = [18, 25, 24][s], top = cy - ry;
  const eyeR = [5, 5.5, 5][s], ex = rx * 0.38, ey = cy - ry * 0.15;
  const feet = [-1, 1].map(d => `<ellipse cx="${60 + d * rx * 0.5}" cy="${cy + ry - 2}" rx="7" ry="4" fill="${T.dark}"/>`).join('');
  const arms = s ? [-1, 1].map(d => `<ellipse cx="${60 + d * (rx + 2)}" cy="${cy + 4}" rx="5" ry="8" fill="${T.body}" stroke="${T.dark}" stroke-width="2" transform="rotate(${d * 20} ${60 + d * (rx + 2)} ${cy + 4})"/>`).join('') : '';
  const eyes = [-1, 1].map(d => `<ellipse cx="${60 + d * ex}" cy="${ey}" rx="${eyeR * 0.8}" ry="${eyeR}" fill="#fff"/><circle cx="${60 + d * ex + 0.8}" cy="${ey + 1}" r="${eyeR * 0.5}" fill="#1d2033"/><circle cx="${60 + d * ex + 2}" cy="${ey - 1.2}" r="1.2" fill="#fff"/><ellipse cx="${60 + d * (ex + 5)}" cy="${ey + 7}" rx="4" ry="2.4" fill="#ff6a86" opacity=".45"/>`).join('');
  const mouth = s === 2
    ? `<path d="M54 ${ey + 8} Q60 ${ey + 16} 66 ${ey + 8}Z" fill="#7a2a3a"/><path d="M56 ${ey + 8} l2 3 l2 -3z" fill="#fff"/>`
    : `<path d="M55 ${ey + 8} Q60 ${ey + 13} 65 ${ey + 8}" stroke="#1d2033" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">`
    + `<stop offset="0" stop-color="${T.bg[0]}"/><stop offset="1" stop-color="${T.bg[1]}"/></linearGradient></defs>`
    + `<rect width="120" height="90" fill="url(#${id})"/><circle cx="96" cy="18" r="10" fill="#fff" opacity=".35"/>`
    + `<ellipse cx="60" cy="${cy + ry + 3}" rx="${rx + 10}" ry="6" fill="#000" opacity=".13"/>`
    + feet + arms + `<ellipse cx="60" cy="${cy}" rx="${rx}" ry="${ry}" fill="${T.body}" stroke="${T.dark}" stroke-width="2.5"/>`
    + `<ellipse cx="60" cy="${cy + ry * 0.35}" rx="${rx * 0.55}" ry="${ry * 0.42}" fill="#fff" opacity=".25"/>`
    + polAccessory(card.type, s, top, rx, cy) + eyes + mouth + '</svg>';
}

/* ---------- Cartas en HTML ---------- */
function polCardHTML(card, { holo = false, extra = '', cls = '' } = {}) {
  if (card.item) {
    return `<div class="pcard item ${cls}" ${extra}><div class="pc-head"><b>${card.name}</b><span class="pc-type">OBJETO</span></div>`
      + `<div class="pc-art item-art">${card.icon}</div><p class="pc-text">${card.text}</p></div>`;
  }
  const T = PTYPES[card.type];
  return `<div class="pcard t-${card.type} ${holo ? 'holo' : ''} ${cls}" ${extra}>`
    + `<div class="pc-head"><b>${card.name}</b><span class="pc-hp">${card.hp} PV</span><span class="pc-type">${T.icon}</span></div>`
    + `<div class="pc-art">${polArt(card)}</div>`
    + `<div class="pc-attacks">${card.attacks.map(a => `<div class="pc-atk"><span class="pc-cost">${'●'.repeat(a.cost)}</span><span class="pc-name">${a.name}</span><b>${a.dmg}</b></div>`
      + (a.fx ? `<small>${FX_TEXT[a.fx]}</small>` : '')).join('')}</div>`
    + `<div class="pc-foot"><span>Débil a ${PTYPES[T.weak].icon}</span><span>Retirada ${'●'.repeat(card.retreat)}</span><span class="pc-rar" title="${RARITY_NAME[card.rarity]}">${'★'.repeat(card.rarity)}</span></div></div>`;
}
