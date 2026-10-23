# PoxStar — guía para trabajar desde otro PC

Todo lo necesario para retomar el proyecto en cualquier computador: qué hay,
cómo se prueba, cómo se publica y cómo se trabaja con Claude Code y sus agentes.
El detalle de cada juego está en el [README](README.md).

## En una línea

**poxstar.com** es el sitio estático del estudio indie de **AugustoCLive**:
una portada (`index.html`) y once juegos que se juegan en el navegador, cada
uno en un solo archivo HTML. Se publica solo con GitHub Pages desde la rama
`main` de `jesusccl/Poxstar`. No hay build, ni npm, ni servidor propio.

## 1. Preparar el PC

Necesitas:

- **Git** y acceso al repositorio `jesusccl/Poxstar` en GitHub.
- **Python 3** (sólo para servir la carpeta en local) o cualquier servidor estático.
- **Node 18 o más** (para `tools/canal.mjs` y las pruebas con navegador).
- Opcional: **Claude Code** (`npm i -g @anthropic-ai/claude-code`) para seguir
  trabajando como hasta ahora.

```bash
git clone https://github.com/jesusccl/Poxstar.git
cd Poxstar
python3 -m http.server 8000
# abre http://localhost:8000
```

Ábrelo siempre servido, no con doble clic: en `file://` fallan `localStorage`
y el reproductor de YouTube.

## 2. Qué hay en el repositorio

| Archivo | Qué es |
|---|---|
| `index.html` | La portada: franja naranja con «poxstar», catálogo, canal de YouTube, estudio y comunidad |
| `pichanga.html` | 01 · Fútbol 2D online (gran estreno) |
| `battle-universe.html` | 02 · Estrategia espacial en tiempo real (nuevo) |
| `polemon.html` | 03 · RPG de criaturas estilo Game Boy |
| `furious-cars-2.html` | 04 · Carreras 3D (three.js desde jsDelivr) |
| *(fuera del repo)* | 05 · República de Lemuy, MMO en el servidor de casa: <https://dell.taila1b256.ts.net/> |
| `putup.html` | 06 · Simulador de creador (lo genera `build-putup.cjs`) |
| `carrera-loca.html`, `breach-2044.html`, `neon-runner.html`, `daemon.html`, `furious-cars.html` | 07–11 · Arcades |
| `launcher.html` | Launcher web antiguo (no enlazado desde la portada) |
| `img/` | Capturas, tarjetas (`card-*`), portadas de arcades (`arcade-*`) y de Battle Universe (`bu-*`) |
| `tools/canal.mjs` | Trae los últimos vídeos del canal de YouTube a la portada |
| `data/canal.json` | Lo último que trajo |
| `.github/workflows/canal.yml` | Ejecuta `canal.mjs` cada seis horas y hace commit si cambió algo |
| `outputs/` | Material fuente de Putup (pesado, ~15 MB) |
| `build-putup.cjs` | Genera `putup.html` desde `outputs/putup/` (`node build-putup.cjs`) |
| `mods/agentes/` | El mod de Claude Code con el panel de agentes (ver §6) |
| `README.md` | Documentación larga: cada juego, controles, rendimiento, Halloween |
| `CNAME`, `.nojekyll`, `robots.txt`, `sitemap.xml`, `og-image.png` | Lo de GitHub Pages y buscadores |

Dos juegos vienen de otros repositorios y aquí sólo hay una copia:
**Polemon** (de `jesusccl/Concurso`, se empaqueta con su `tools/build.mjs`) y
**Furious Cars 2** (de `jesusccl/miprogramagpt`, rama
`claude/compassionate-faraday-68hhm6`). Si cambian allí, hay que volver a copiarlos.

## 3. La portada

- Una sola tipografía (Archivo, variable), tema claro/oscuro con botón
  (`localStorage` `pox-theme`) y nada pesado en movimiento salvo la cinta.
- **Halloween** del 1 de octubre al 2 de noviembre, solo; `?halloween=1` o
  `?halloween=0` lo fuerzan para probar.
- El **bloque del canal** (entre `<!-- canal:inicio -->` y `<!-- canal:fin -->`)
  no se edita a mano: lo reescribe `tools/canal.mjs`. Para refrescarlo en local:
  `node tools/canal.mjs`. En GitHub lo hace el workflow solo; también se lanza
  a mano en *Actions → Canal de YouTube → Run workflow*.
- Las **fichas de capturas** (botón «Ver capturas») son `<dialog>` normales
  dentro de `index.html`, entre `<!-- fichas:inicio -->` y `<!-- fichas:fin -->`.
- Al añadir un juego hay que tocar: la tarjeta del catálogo, su ficha, el
  JSON-LD del `<head>`, el pie, la cinta, los contadores «11 juegos», el
  `sitemap.xml`, el `launcher.html` y el README.

## 4. Probar sin miedo: los ganchos `#debug`

Tres juegos exponen herramientas para pruebas automáticas si se abren con
`#debug` en la URL:

| Juego | Objeto | Lo útil |
|---|---|---|
| Battle Universe | `window.__bu` | `sector(i)`, `rapida(opciones)`, `desafio()`, `piloto(true, dif)` (tu imperio lo lleva la IA), `sim(segundos)`, `estado()`, `pantalla(id)` |
| Pichanga | `window.__pich` | `sim(segundos)`, `autopilot(true)` |
| Furious Cars 2 | `window.__fc2` | `sim(segundos)` con piloto automático |

Con Playwright (o la consola del navegador) se pueden simular cientos de
partidas en segundos. Así se afinó la dificultad de Battle Universe.

Trucos que costaron aprender:

- Al medir el scroll, pon antes `document.documentElement.style.scrollBehavior = 'auto'`.
- Si sirves las fuentes de Google tú mismo en pruebas, pásales el User-Agent
  real del navegador: con uno desconocido Google devuelve TTF enteros (~109 KB
  cada uno) en vez del WOFF2 de 35 KB.
- Mide con contexto nuevo cada vez y varias vueltas en orden aleatorio.

## 5. Publicar

```bash
git pull origin main          # el workflow del canal hace commits cada pocas horas
# ... cambios ...
git add <archivos>
git commit -m "Qué cambia y por qué"
git push origin main          # GitHub Pages publica en uno o dos minutos
```

Comprobar que ya está en vivo:

```bash
curl -s "https://poxstar.com/battle-universe.html?v=$RANDOM" | cmp - battle-universe.html && echo "en vivo"
```

Haz siempre `git pull` antes de empezar: el bot del canal (`github-actions[bot]`)
sube un commit cada vez que cambian las visitas de los vídeos.

## 6. Claude Code y el panel de agentes

Este proyecto se ha hecho con Claude Code, a menudo con varios agentes en
paralelo (uno revisa bugs, otro mide la dificultad, otro programa una función
en su propia copia del repositorio). Para **verlos trabajar** hay un mod:
`mods/agentes/`, un panel lateral con un Claude por agente (con su accesorio
según el tipo, animado mientras trabaja y con lo que está haciendo) y la
lista de tareas con su estado.

Para usarlo en otro PC:

```bash
cd Poxstar
claude --plugin-dir ./mods/agentes
```

Dentro de Claude Code, `/agentes` abre el panel si lo cerraste. Para
comprobarlo después de tocarlo:

```bash
claude plugin validate ./mods/agentes
claude plugin test ./mods/agentes
```

Pedidos que funcionan bien para seguir el proyecto con agentes, por ejemplo:

- «Revisa battle-universe.html con un agente y arregla lo que encuentre.»
- «Mide la dificultad de la campaña con agentes en celular y computador.»
- «Haz un juego nuevo llamado … y agrégalo a la portada como gran estreno.»

## 7. Cosas a tener presentes

- **Lemuy** sólo funciona si el servidor de casa está encendido (Tailscale).
- `outputs/` pesa unos 15 MB y GitHub Pages lo sirve entero aunque nada lo enlace.
- Furious Cars 2 necesita conexión la primera vez (three.js y sus fuentes).
- Las partidas y récords de los juegos viven en el `localStorage` de cada
  navegador: cambiar de PC no los trae.
- Pendiente posible: Battle Universe tiene la dificultad medida con la IA; si
  a una persona le cuesta demasiado, se suben los tiempos de las estrellas
  (`par` en `SECTORES`).
