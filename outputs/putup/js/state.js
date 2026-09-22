'use strict';
/* Putup · Partida guardada, tienda y economía simulada (todo ficticio y local). */

const SAVE_KEY = 'putup-v1';
const MONETIZE_AT = 100;
const MILESTONES = [100, 500, 1000, 5000, 10000, 50000, 100000];
const PLAQUE_AT = 1000;

const SHOP = [
  {
    id: 'gear', name: 'Equipo de grabación', max: 3, prices: [120, 240, 360], icon: '🎙',
    levels: ['Micrófono, auriculares y webcam', 'Aro de luz y paneles acústicos', 'Segundo monitor y luces RGB'],
    perk: '+25 % de alcance por nivel',
  },
  {
    id: 'furniture', name: 'Rincón de creador', max: 2, prices: [80, 160], icon: '🛋',
    levels: ['Alfombra nueva, puf y cojines', 'Letrero de neón con el nombre de tu canal'],
    perk: 'Un estudio con más personalidad',
  },
  {
    id: 'pocket4', name: 'Osmo Pocket 4', max: 1, prices: [200], icon: '📹', camera: 0.15, tag: 'CÁMARA DE BOLSILLO',
    levels: ['Cámara de bolsillo con estabilizador: graba vlogs y partidas sin temblores'],
    perk: '+15 % de alcance · la llevas siempre en la mano',
  },
  {
    id: 'pocket4p', name: 'Osmo Pocket 4P', max: 1, prices: [340], icon: '🎥', camera: 0.25, tag: 'CÁMARA DE BOLSILLO',
    levels: ['La versión 4P de la cámara de bolsillo, con acabado profesional'],
    perk: '+25 % de alcance · sustituye a la Pocket 4 en tu mano',
  },
  {
    id: 'game', name: 'Circuito atardecer', max: 1, prices: [150], icon: '🌇',
    levels: ['Nuevo aspecto para Salto neón: cielo al atardecer'],
    perk: 'Cámbialo cuando quieras desde el ordenador',
  },
  {
    id: 'chair', name: 'Silla de carreras', max: 1, prices: [130], icon: '🪑',
    levels: ['Respaldo alto, cojín lumbar y costuras verdes'],
    perk: '+10 % de alcance · grabar deja de doler',
  },
  {
    id: 'thumbs', name: 'Pack de miniaturas', max: 1, prices: [170], icon: '🎨',
    levels: ['Dos portadas más para tus vídeos: «POLÉMICO» y «GUÍA»'],
    perk: 'Cinco miniaturas donde elegir en el editor',
  },
  {
    id: 'garden', name: 'Jardín de verano', max: 1, prices: [220], icon: '🌳',
    levels: ['Guirnalda de luces, hamaca y barbacoa en el patio'],
    perk: 'Un sitio bonito donde grabar al aire libre',
  },
  {
    id: 'trophies', name: 'Vitrina de hitos', max: 1, prices: [260], icon: '🏆',
    levels: ['Estantería con una placa por cada hito de suscriptores'],
    perk: 'Se llena sola según crece tu canal',
  },
  {
    id: 'arcade', name: 'Máquina recreativa', max: 1, prices: [280], icon: '🕹',
    levels: ['Un mueble arcade encendido en el salón, con tu nombre en la marquesina'],
    perk: 'Abre la biblioteca de juegos sin subir al estudio',
  },
  {
    id: 'capture', name: 'Capturadora 4K', max: 1, prices: [300], icon: '🎛',
    levels: ['Caja de captura con luces en el escritorio'],
    perk: 'Un momento más para elegir en cada grabación',
  },
];
const MAX_THUMB = 4;

const newSave = () => ({
  subs: 0, views: 0, money: 0, best: 0, videos: [], channel: '', theme: 'night', muted: false, mail: 0,
  ...Object.fromEntries(SHOP.map(item => [item.id, 0])),
  records: {}, cards: {}, holos: {}, packs: 0, pwins: 0, plosses: 0, starter: false,
});

/** Nombre de canal utilizable: una línea, sin espacios de sobra y como mucho 18 letras. */
function cleanChannel(raw) {
  return typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim().slice(0, 18) : '';
}
const channelName = () => save.channel || 'Putup';
/** Diccionario {clave: entero ≥ 0} con claves sencillas (récords, cartas). */
function numMap(raw, max = 1e9) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw).slice(0, 80)) {
    if (/^[a-z0-9]{1,24}$/.test(k) && Number.isFinite(+v) && +v > 0) out[k] = clamp(Math.floor(+v), 0, max);
  }
  return out;
}

/** Acepta partidas antiguas o manipuladas y devuelve siempre datos válidos. */
function sanitizeSave(raw) {
  const s = newSave();
  if (!raw || typeof raw !== 'object') return s;
  const num = (v, max = 1e12) => (Number.isFinite(+v) ? clamp(Math.floor(+v), 0, max) : 0);
  s.subs = num(raw.subs);
  s.views = num(raw.views);
  s.money = num(raw.money);
  s.best = num(raw.best);
  for (const item of SHOP) s[item.id] = num(raw[item.id], item.max);
  // Las partidas antiguas aplicaban el atardecer nada más comprarlo.
  s.theme = s.game && raw.theme !== 'night' ? 'sunset' : 'night';
  s.muted = raw.muted === true;
  s.channel = cleanChannel(raw.channel);
  s.mail = num(raw.mail);
  s.records = numMap(raw.records);
  s.cards = numMap(raw.cards, 99);
  s.holos = numMap(raw.holos, 99);
  s.packs = num(raw.packs, 99);
  s.pwins = num(raw.pwins);
  s.plosses = num(raw.plosses);
  s.starter = raw.starter === true;
  if (Array.isArray(raw.videos)) {
    s.videos = raw.videos.filter(v => v && typeof v === 'object').slice(-200).map(v => ({
      title: String(v.title ?? '').trim().slice(0, 70) || 'Vídeo sin título',
      thumb: num(v.thumb, MAX_THUMB), views: num(v.views), subs: num(v.subs), score: num(v.score),
      game: typeof v.game === 'string' && /^[a-z]{1,16}$/.test(v.game) ? v.game : 'neon',
      date: typeof v.date === 'string' ? v.date : null,
    }));
  }
  s.mail = Math.min(s.mail, s.videos.length);
  return s;
}
function loadSave() {
  try { return sanitizeSave(JSON.parse(localStorage.getItem(SAVE_KEY))); }
  catch { return newSave(); }
}
let save = loadSave();

/* Estado de la sesión (no se guarda). */
let mode = 'home';     // 'home' | 'run'
let record = true;     // la partida se graba para el editor
let pending = null;    // grabación lista para editar y publicar
let thumb = 0;         // miniatura elegida en el editor
let clock = 0;         // segundos desde que arrancó el juego (animaciones)

function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }
  catch { toast('El navegador no pudo guardar. La partida sigue en esta sesión.'); }
}

const fmt = n => Math.floor(n).toLocaleString('es-CL');
const nextMilestone = subs => MILESTONES.find(m => m > subs) ?? null;
const prevMilestone = subs => [0, ...MILESTONES].filter(m => m <= subs).pop();

function shopPrice(item) { return save[item.id] < item.max ? item.prices[save[item.id]] : null; }
function buy(id) {
  const item = SHOP.find(i => i.id === id), price = item && shopPrice(item);
  if (price == null || save.money < price) return false;
  save.money -= price;
  save[id]++;
  if (id === 'game') save.theme = 'sunset';
  persist();
  return true;
}

/** La mejor cámara de bolsillo que tienes (la 4P sustituye a la 4), o null. */
function pocketCamera() {
  const owned = SHOP.filter(i => i.camera && save[i.id]);
  return owned.length ? owned.reduce((a, b) => (b.camera > a.camera ? b : a)) : null;
}
const pocketModel = () => { const c = pocketCamera(); return c ? c.id : null; };

/** Alcance base de un vídeo: premia jugar bien y editar con cuidado. Sin azar. */
function reachEstimate(p, clips, title) {
  const titleBonus = (title.length >= 12 ? 40 : 0) + (/[!¡?¿]/.test(title) ? 25 : 0);
  const base = 320 + p.stars * 40 + clips * 90 + Math.max(0, 120 - p.hits * 20)
    + Math.min(p.score || 0, 4000) * 0.05 + titleBonus + save.subs * 2;
  const cam = pocketCamera();
  return base * (1 + save.gear * 0.25 + save.chair * 0.1) * (1 + (cam ? cam.camera : 0));
}

/** Momentos que ofrece el editor y miniaturas disponibles: los sube la tienda. */
const momentSlots = () => 5 + save.capture;
const thumbCount = () => 3 + save.thumbs * 2;

/** Aplica la publicación a la partida guardada y devuelve el resultado. */
function applyPublish(p, clips, title, thumbIndex, luck = rand(0.92, 1.12)) {
  const views = Math.round(reachEstimate(p, clips, title) * luck);
  const subs = Math.max(20, Math.round(views / 24));
  const before = save.subs;
  save.subs += subs;
  save.views += views;
  const money = save.subs >= MONETIZE_AT ? Math.round(views * 0.14) : 0;
  save.money += money;
  save.best = Math.max(save.best, p.score || 0);
  save.videos.push({ title, thumb: thumbIndex, views, subs, score: p.score || 0, game: p.game || 'neon', date: new Date().toISOString() });
  persist();
  const crossed = MILESTONES.filter(m => before < m && save.subs >= m);
  return { title, thumb: thumbIndex, views, subs, money, crossed };
}
