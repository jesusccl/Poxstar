#!/usr/bin/env node
// Trae los últimos vídeos del canal de YouTube de AugustoCLive y los pone en la portada.
//
//   node tools/canal.mjs
//
// Lee páginas públicas de youtube.com, sin clave de API: la del canal (nombre,
// avatar, suscriptores, número de vídeos) y la pestaña «Vídeos» (los últimos,
// con visitas, duración y «hace 3 días»). La fecha exacta sale del feed RSS del
// canal o, si no responde, de la página de cada vídeo; si YouTube corta (429),
// se queda la de «hace…», con precisión de mes cuando es «hace 2 meses».
// Escribe data/canal.json y rehace el bloque entre <!-- canal:inicio --> y
// <!-- canal:fin --> de index.html, así que la portada no necesita JavaScript
// para enseñar los vídeos. Lo ejecuta .github/workflows/canal.yml cada pocas horas.
//
// Si nada ha cambiado no escribe nada (y el workflow no hace commit). Si YouTube
// cambia su página y no salen vídeos, no toca nada y termina con error: la
// portada se queda con los últimos datos buenos.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const HANDLE = 'AugustoCLive';
const CANAL = `https://www.youtube.com/@${HANDLE}`;
const MAX = 6;
const CABECERAS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
  'Accept-Language': 'es-ES,es;q=0.9',
  Cookie: 'SOCS=CAI; CONSENT=YES+1',          // sin el muro de cookies de la UE
};

async function bajar(url) {
  const r = await fetch(url, { headers: CABECERAS });
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
  return r.text();
}
function datosIniciales(html) {
  const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if (!m) throw new Error('la página no trae ytInitialData');
  return JSON.parse(m[1]);
}
function* recorre(o) {
  if (o && typeof o === 'object') {
    yield o;
    for (const v of Object.values(o)) yield* recorre(v);
  }
}
const meta = (html, prop) => (html.match(new RegExp(`<meta property="${prop}" content="([^"]*)"`)) || [])[1] || '';
const escapa = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const desescapa = s => String(s).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const MESES = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, sept: 9, oct: 10, nov: 11, dic: 12 };
function fechaIso(texto) {           // «11 oct 2026», «Estreno: 11 oct 2026»… → 2026-10-11
  const m = (texto || '').toLowerCase().match(/(\d{1,2}) (?:de )?([a-zé]{3,4})\.?(?: de)? (\d{4})/);
  if (!m || !MESES[m[2]]) return null;
  return `${m[3]}-${String(MESES[m[2]]).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}
const UNIDAD = { segundo: 1e3, minuto: 6e4, hora: 36e5, 'día': 864e5, semana: 6048e5, mes: 2592e6, 'año': 31536e6 };
function haceIso(texto) {            // «hace 3 días» → { fecha: '2026-10-09', precision: 'dia' }
  const m = (texto || '').toLowerCase().match(/hace (\d+) (segundo|minuto|hora|d[íi]a|semana|mes|año)/);
  if (!m) return null;
  const u = m[2].replace('dia', 'día');
  const iso = new Date(Date.now() - Number(m[1]) * UNIDAD[u]).toISOString().slice(0, 10);
  return u === 'mes' || u === 'año' ? { fecha: iso.slice(0, 7), precision: 'mes' } : { fecha: iso, precision: 'dia' };
}
const MES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
const fechaBonita = iso => { const [a, m, d] = iso.split('-').map(Number); return d ? `${d} ${MES_CORTO[m - 1]} ${a}` : `${MES_CORTO[m - 1]} ${a}`; };
const espera = ms => new Promise(r => setTimeout(r, ms));

async function leerCanal() {
  const html = await bajar(CANAL);
  const texto = re => (html.match(re) || [])[1] || '';
  return {
    nombre: desescapa(meta(html, 'og:title')) || HANDLE,
    handle: '@' + HANDLE,
    url: CANAL,
    id: texto(/"externalId":"(UC[\w-]{22})"/) || texto(/"channelId":"(UC[\w-]{22})"/),
    avatar: meta(html, 'og:image').replace(/=s\d+-/, '=s160-'),
    suscriptores: texto(/"content":"([\d.,\s]+(?:mil |M )?suscriptor(?:es)?)"/),
    videos: texto(/"content":"([\d.,\s]+v[íi]deos?)"/),
  };
}
async function leerVideos(canalId, previos) {
  const d = datosIniciales(await bajar(CANAL + '/videos'));
  const videos = [];
  for (const o of recorre(d)) {
    if (!o.lockupViewModel) continue;
    const l = o.lockupViewModel, md = l.metadata?.lockupMetadataViewModel;
    if (!l.contentId || !md) continue;
    let vistas = '', duracion = '', hace = null;
    for (const x of recorre(l)) {
      const et = typeof x.accessibilityLabel === 'string' ? x.accessibilityLabel : '';
      if (!vistas && /visualizaci/i.test(et)) vistas = et;
      if (!hace && /^(?:emitido |estrenado )?hace /i.test(et)) hace = haceIso(et);
      if (!duracion && x.thumbnailBadgeViewModel && /^\d+:\d{2}(?::\d{2})?$/.test(x.thumbnailBadgeViewModel.text || '')) duracion = x.thumbnailBadgeViewModel.text;
    }
    videos.push({
      id: l.contentId,
      titulo: (md.title?.content || '').trim(),
      vistas: vistas.replace(/visualizaci(ón|ones)/i, m => /ones/i.test(m) ? 'vistas' : 'vista'),
      duracion,
      ...(hace || { fecha: null, precision: null }),
      exacta: false,
    });
    if (videos.length === MAX) break;
  }

  // Fechas exactas: 1) el feed RSS (una sola petición); 2) la de la vez anterior;
  // 3) la página de cada vídeo, parando en cuanto YouTube diga que no.
  const exactas = new Map();
  try {
    const xml = await bajar(`https://www.youtube.com/feeds/videos.xml?channel_id=${canalId}`);
    for (const e of xml.split('<entry>').slice(1)) {
      const id = (e.match(/<yt:videoId>([\w-]+)</) || [])[1], f = (e.match(/<published>(\d{4}-\d{2}-\d{2})/) || [])[1];
      if (id && f) exactas.set(id, f);
    }
  } catch (e) { console.warn('Sin feed RSS:', e.message); }
  for (const p of previos) if (p.exacta && !exactas.has(p.id)) exactas.set(p.id, p.fecha);
  let paginas = true;
  for (const v of videos) {
    if (!exactas.has(v.id) && paginas) {
      try {
        const f = fechaIso((((await bajar(`https://www.youtube.com/watch?v=${v.id}`)).match(/"dateText":\{"simpleText":"([^"]+)"/)) || [])[1]);
        if (f) exactas.set(v.id, f);
        await espera(800);
      } catch (e) { paginas = false; console.warn('Sin páginas de vídeo:', e.message); }
    }
    if (exactas.has(v.id)) Object.assign(v, { fecha: exactas.get(v.id), precision: 'dia', exacta: true });
    else {                                        // la aproximada de la vez anterior no baila de un día a otro
      const p = previos.find(p => p.id === v.id && p.fecha);
      if (p && (p.precision === v.precision || !v.fecha)) Object.assign(v, { fecha: p.fecha, precision: p.precision });
    }
  }
  return videos;
}

// ── el HTML del bloque (las clases son las de index.html) ──
const ICONO_PLAY = '<svg viewBox="0 0 68 48" aria-hidden="true"><path class="fondo" d="M66.5 7.7a8.5 8.5 0 0 0-6-6C55.2.3 34 .3 34 .3s-21.2 0-26.5 1.4a8.5 8.5 0 0 0-6 6C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.5 8.5 0 0 0 6 6C12.8 47.7 34 47.7 34 47.7s21.2 0 26.5-1.4a8.5 8.5 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3Z"/><path fill="#fff" d="M45 24 27 14v20z"/></svg>';
const datosVideo = v => [v.vistas, v.fecha && `<time datetime="${v.fecha}">${fechaBonita(v.fecha)}</time>`, v.duracion].filter(Boolean).join(' · ');
function bloque(canal, videos) {
  const [p] = videos;
  const cifras = [canal.suscriptores, canal.videos].filter(Boolean).join(' · ');
  return `<!-- canal:inicio — lo genera tools/canal.mjs; no editar a mano -->
    <div class="canal-cab">
      <img class="canal-avatar" src="${escapa(canal.avatar)}" width="68" height="68" alt="" loading="lazy" decoding="async">
      <div class="canal-nombre">
        <h2 id="canal-titulo">${escapa(canal.nombre)}</h2>
        <p><a href="${canal.url}" target="_blank" rel="noopener">${escapa(canal.handle)}</a>${cifras ? ` · ${escapa(cifras)}` : ''}</p>
      </div>
      <a class="btn btn-yt" href="${canal.url}?sub_confirmation=1" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z"/></svg>
        Suscribirse
      </a>
    </div>

    <div class="canal-cuerpo">
      <figure class="yt" data-id="${p.id}">
        <button class="yt-play" type="button" aria-label="Reproducir «${escapa(p.titulo)}»">
          <img src="https://i.ytimg.com/vi/${p.id}/sddefault.jpg" width="640" height="480" alt="" loading="lazy" decoding="async">
          ${ICONO_PLAY}
        </button>
        <figcaption>
          <span class="yt-etiqueta">Último vídeo</span>
          <b class="yt-titulo">${escapa(p.titulo)}</b>
          <span class="yt-datos">${datosVideo(p)}</span>
        </figcaption>
      </figure>

      <div class="yt-lado">
        <h3>Últimos vídeos</h3>
        <ol class="yt-lista">
${videos.map((v, i) => `          <li><a href="https://www.youtube.com/watch?v=${v.id}" data-id="${v.id}"${i ? '' : ' aria-current="true"'} target="_blank" rel="noopener">
            <img src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg" width="320" height="180" alt="" loading="lazy" decoding="async">
            <span><b>${escapa(v.titulo)}</b><small>${datosVideo(v)}</small></span>
          </a></li>`).join('\n')}
        </ol>
        <a class="yt-todos" href="${canal.url}/videos" target="_blank" rel="noopener">Ver todos en YouTube <span aria-hidden="true">↗</span></a>
      </div>
    </div>
    <!-- canal:fin -->`;
}

const rutaJson = join(RAIZ, 'data', 'canal.json');
let previo = null;
try { previo = JSON.parse(readFileSync(rutaJson, 'utf8')); } catch {}
const canal = await leerCanal();
const videos = await leerVideos(canal.id, previo?.videos || []);
if (!videos.length || !videos[0].titulo) {
  console.error('No ha salido ningún vídeo: YouTube habrá cambiado su página. No se toca nada.');
  process.exit(1);
}
for (const v of videos) console.log(`  ${v.fecha || '?'}${v.exacta ? '' : '~'} ${v.id} ${v.titulo} · ${v.vistas} · ${v.duracion}`);
const ruta = join(RAIZ, 'index.html');
const html = readFileSync(ruta, 'utf8');
if (!/<!-- canal:inicio[\s\S]*?<!-- canal:fin -->/.test(html)) {
  console.error('index.html no tiene el bloque <!-- canal:inicio --> … <!-- canal:fin -->');
  process.exit(1);
}
const nuevo = html.replace(/<!-- canal:inicio[\s\S]*?<!-- canal:fin -->/, () => bloque(canal, videos));
if (nuevo === html && JSON.stringify({ canal, videos }) === JSON.stringify({ canal: previo?.canal, videos: previo?.videos })) {
  console.log('Sin cambios.');
  process.exit(0);
}
mkdirSync(dirname(rutaJson), { recursive: true });
writeFileSync(rutaJson, JSON.stringify({ actualizado: new Date().toISOString(), canal, videos }, null, 2) + '\n');
writeFileSync(ruta, nuevo);
console.log(`${canal.nombre} (${canal.handle}) · ${canal.suscriptores} · ${canal.videos}`);
