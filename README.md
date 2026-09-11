# PoxStar 🌟

Página oficial de **PoxStar**, estudio indie de videojuegos de AugustoCLive.
Sitio estático servido desde GitHub Pages en [poxstar.com](https://poxstar.com),
con los juegos jugables directamente en el navegador.

## 🎮 Juegos

**01 · Furious Cars 1** — Endless racer top-down. Tres vidas, tráfico infinito.

- ← → / A D — moverse lateral
- ↑ ↓ / W S — adelantar/frenar (más arriba = más rápido)
- **M** — silenciar sonido
- 9 colores de coche a elegir (se guardan entre sesiones)

**02 · Carrera Loca** — Endless arcade de carreras con estética neón.

**03 · BREACH // 2044** — Puzzle de intrusión cyberpunk. Recorres una matriz de
código alternando fila y columna para llenar el búfer; un démon se sube si su
secuencia aparece seguida dentro de él. Niveles con matriz y búfer crecientes.

- Ratón o **↑↓←→** + **Enter**
- Los démones se generan a partir de un recorrido válido real, así que **siempre
  hay solución** dentro del búfer.

**04 · NEON RUNNER** — Runner de gravedad invertible sobre ciudad neón.

- **Espacio** / clic / toque — invertir gravedad

**05 · DAEMON** — Shooter de arena por oleadas con gráficos vectoriales.

- **WASD** / flechas — moverse · **ratón** — apuntar · **clic** — disparar
- En móvil: arrastrar para moverse, dispara y apunta solo

Los cinco guardan récord en `localStorage` y respetan `prefers-reduced-motion`.

**06 · República de Lemuy** — MMO de acción y conquista sobre la isla de Lemuy,
en Chiloé. Diez villas (de Puqueldón, nivel 1, a Detif, nivel 22), veinticuatro
criaturas de la mitología chilota, cinco clases, clanes, territorios y banderas.

- **WASD** caminar · **espacio** atacar · **Q** habilidad · **F** objetivo
- **E** entrar a una casa · **B** bote · **T** bus municipal · **Enter** chat
- En móvil, joystick en pantalla

No vive en este repo: corre en el servidor propio del estudio y se publica con
[Tailscale](https://tailscale.com) en <https://dell.taila1b256.ts.net/>. Desde el
sitio se enlaza directo (ficha 06 del catálogo, sección `#lemuy`, pie de página y
el launcher). **Si el servidor está apagado, el enlace no abre** — es lo único
del sitio que depende de una máquina encendida.

## 📁 Estructura

```
.
├── index.html          # Página principal
├── furious-cars.html   # Juego 01 (también embebido en index)
├── carrera-loca.html   # Juego 02
├── breach-2044.html    # Juego 03
├── neon-runner.html    # Juego 04
├── daemon.html         # Juego 05
├── launcher.html       # Launcher web (no enlazado desde la home)
├── img/                # Capturas de República de Lemuy para el carrusel
├── tweaks.js           # Panel de tweaks de diseño (opt-in, vanilla JS)
├── og-image.png        # Imagen para redes sociales (1200×630)
├── robots.txt          # Indexación
├── sitemap.xml         # Mapa del sitio
├── CNAME               # Dominio propio: poxstar.com
├── .nojekyll           # Desactiva Jekyll en GitHub Pages
└── README.md
```

## 🕹️ Nota para modificar los juegos de canvas

`neon-runner.html` y `daemon.html` normalizan el paso de simulación con
`k = dt * 60`, donde `dt` viene **en segundos** desde `requestAnimationFrame`.
A 60 fps eso da 1. Si lo divides además entre 16.7 (mezclando el idioma de
milisegundos), el juego corre al 6 % de velocidad y deja de ser jugable.

Todo es HTML/CSS/JS plano. No requiere build, ni npm, ni nada.

## 🔧 Personalizar

### Panel de tweaks

El panel de color / tema / tipografía / animaciones **ya no se carga en producción**.
Antes se construía con React 18 (build de *desarrollo*) + Babel Standalone desde
un CDN, lo que descargaba ~1,5 MB y compilaba JSX en el navegador de cada visitante.
Ahora es `tweaks.js`, vanilla JS, y sólo se carga si lo pides:

```
https://poxstar.com/?tweaks=1
```

Sus ajustes se guardan en `localStorage` (clave `pox-tweaks`).

### Tema oscuro

Ya no depende del panel: hay un botón en la barra superior. Respeta
`prefers-color-scheme` en la primera visita y luego recuerda la elección
en `localStorage` (clave `pox-theme`).

### Modo VI

Un repinte de atardecer —rosa, naranja y oro, cursivas pesadas, cromado en el
logotipo y neón en las fichas— al estilo de la portada de GTA VI. Se enciende
con el botón **VI** de la barra superior o con el interruptor grande de la
franja `#modo-vi`, y se guarda en `localStorage` (clave `pox-vi`).

Es un **eje aparte** del tema claro/oscuro: los dos se combinan. Técnicamente es
el atributo `data-vi="1"` en `<html>`; toda la hoja del modo cuelga de
`html[data-vi="1"]` y sólo redefine tokens de color, tipografía y sombras. No
cambia ni el contenido ni la disposición, así que apagarlo devuelve el sitio
exactamente a como estaba.

### Carrusel de Lemuy

Las nueve imágenes de `img/` **están renderizadas con el motor del propio
juego** (su `pixeles.js` y su `mapa2d.js`, alimentados por `/api/terreno` y
`/api/datos`), no dibujadas a mano: el mapa es el mapa de verdad y los sprites
son los sprites de verdad. Si el juego cambia, hay que volver a generarlas.

El carrusel avanza solo cada 5,8 s y se para al pasar el ratón, al entrar el
foco, al salir de pantalla, con el botón de pausa y con `prefers-reduced-motion`.
Las imágenes son WebP sin pérdida (516 KB las nueve); sólo la primera se carga de
inmediato, el resto son `loading="lazy"`.

### Otros

- **Récord del juego**: `localStorage` del navegador. Para resetear, borra los
  datos del sitio en las opciones del browser.
- **Editar copy**: todo el texto vive directamente en `index.html`.
- **Animaciones**: se desactivan solas si el sistema tiene
  `prefers-reduced-motion: reduce`.

## 🌐 Probar local

Los iframes y `localStorage` fallan en `file://`. Levanta un servidor:

```bash
python -m http.server 8000
```

Luego abre `http://localhost:8000`.

## 🚀 Desplegar

Push a `main` — GitHub Pages publica la raíz del repo. El `CNAME` apunta a
`poxstar.com`, así que no hace falta tocar nada más.

Tras desplegar, conviene validar los metadatos sociales:

- <https://cards-dev.twitter.com/validator>
- <https://developers.facebook.com/tools/debug/>
- <https://search.google.com/test/rich-results> (para el JSON-LD)

## 📝 Licencia

Código del sitio: MIT.
Furious Cars 1 y Carrera Loca: © PoxStar 2026.
