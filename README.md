# PoxStar 🌟

Página oficial de **PoxStar**, estudio indie de videojuegos de AugustoCLive.
Sitio estático servido desde GitHub Pages en [poxstar.com](https://poxstar.com),
con los juegos jugables directamente en el navegador.

## 🎮 Juegos

**01 · República de Lemuy** — MMO de acción y conquista sobre la isla de Lemuy,
en Chiloé. Diez villas (de Puqueldón, nivel 1, a Detif, nivel 22), veinticuatro
criaturas de la mitología chilota, cinco clases, clanes, territorios y banderas.

- **WASD** caminar · **espacio** atacar · **Q** habilidad · **F** objetivo
- **E** entrar a una casa · **B** bote · **T** bus municipal · **Enter** chat
- En móvil, joystick en pantalla

No vive en este repo: corre en el servidor propio del estudio y se publica con
[Tailscale](https://tailscale.com) en <https://dell.taila1b256.ts.net/>. Desde el
sitio se enlaza directo (franja del hero, ficha 01 del catálogo, sección
`#lemuy`, pie de página y el launcher). **Si el servidor está apagado, el enlace
no abre** — es lo único del sitio que depende de una máquina encendida.

**02 · Putup** — Simulador de creador. Vives en una casa 3D (estudio, salón,
cocina, recibidor, baño y jardín), grabas partidas en el ordenador, las editas
—momentos, título, miniatura— y las publicas para que crezca el canal. El dinero
ficticio se gasta en mejoras que aparecen de verdad en la habitación.

Dentro del ordenador hay **seis juegos**: Salto neón (carreras), Ritmo pixel
(música), Serpiente de likes, Órbita viral (naves), Memoria viral (parejas) y
**Polenom**, un juego de cartas por turnos con quince criaturas originales y
cinco tipos que se ganan entre sí.

- **WASD** caminar · **clic** ir o usar · **arrastrar** girar la cámara
- **E** usar objeto · **C** paredes · **M** sonido · **Esc** pausa
- En móvil se juega a dedo, con los botones que cada juego necesita

`putup.html` es el juego entero en **un solo archivo de 308 KB**, sin ninguna
petición externa. Es una copia de `outputs/Putup.html`, que es donde el juego se
compila; si lo regeneras, vuelve a copiarlo a la raíz.

**03 · Carrera Loca** — Endless arcade de carreras con estética neón.

**04 · BREACH // 2044** — Puzzle de intrusión cyberpunk. Recorres una matriz de
código alternando fila y columna para llenar el búfer; un démon se sube si su
secuencia aparece seguida dentro de él. Niveles con matriz y búfer crecientes.

- Ratón o **↑↓←→** + **Enter**
- Los démones se generan a partir de un recorrido válido real, así que **siempre
  hay solución** dentro del búfer.

**05 · NEON RUNNER** — Runner de gravedad invertible sobre ciudad neón.

- **Espacio** / clic / toque — invertir gravedad

**06 · DAEMON** — Shooter de arena por oleadas con gráficos vectoriales.

- **WASD** / flechas — moverse · **ratón** — apuntar · **clic** — disparar
- En móvil: arrastrar para moverse, dispara y apunta solo

**07 · Furious Cars 1** — Endless racer top-down. Tres vidas, tráfico infinito.

- ← → / A D — moverse lateral
- ↑ ↓ / W S — adelantar/frenar (más arriba = más rápido)
- **M** — silenciar sonido
- 9 colores de coche a elegir (se guardan entre sesiones)

Los cinco arcades del repo guardan récord en `localStorage` y respetan
`prefers-reduced-motion`. El número de cada ficha es su posición en el catálogo,
no su orden de salida.

## 📁 Estructura

```
.
├── index.html          # Página principal
├── furious-cars.html   # Juego 07 (también embebido en index)
├── carrera-loca.html   # Juego 03
├── breach-2044.html    # Juego 04
├── neon-runner.html    # Juego 05
├── daemon.html         # Juego 06
├── putup.html          # Juego 02 — un solo archivo, copia de outputs/Putup.html
├── outputs/            # Material de Putup tal y como sale de su compilación
├── launcher.html       # Launcher web (no enlazado desde la home)
├── img/                # Capturas de Lemuy y de Putup para los carruseles
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

## ⚡ Rendimiento

Cosas que se midieron —con Chromium, CPU frenada— y por qué están como están:

- **Las imágenes del carrusel se cargan a mano, no con `loading="lazy"`.** Las
  nueve láminas se apilan en la misma caja absoluta, así que para el navegador
  todas están «en pantalla» y el lazy nativo no difería ninguna: se bajaban las
  nueve (495 KB) al abrir la home. Ahora van en `data-src` y el carrusel carga
  la que toca y la siguiente. Total de la página: **788 KB → 366 KB**, y el
  primer pintado **1000 ms → ~420 ms**.
- **Un solo `requestAnimationFrame` para todo.** Había cuatro bucles
  permanentes (cinta, estrella, cursor y carrusel) despertando la pestaña 60
  veces por segundo sin parar. Ahora hay un reloj compartido: cada pieza se da
  de alta cuando le toca y de baja cuando termina, y sin nadie apuntado el
  reloj se para (medido: de 480 llamadas cada 2 s a 0 en reposo).
- **El movimiento va por tiempo, no por frame.** Los bucles avanzaban una
  cantidad fija por frame, así que en una pantalla de 120 Hz iban al doble de
  velocidad. Ahora usan `dt`.
- **El imán de los botones y el ladeo de las fichas** medían el elemento con
  `getBoundingClientRect()` en cada `mousemove` —lo que obliga a recalcular la
  maqueta a media página— y escribían el estilo varias veces por frame. Ahora
  el rectángulo se cachea y se escribe una vez por frame.
- **La hoja de Google Fonts va con `media="print"`** para que no bloquee el
  primer pintado; como ya iba con `display=swap`, no cambia nada visualmente.

Y algo que se probó y **se descartó porque salió peor**, no por pereza:

- `content-visibility:auto` en las secciones de abajo: primer pintado 428 → 548
  ms y la altura de la página se descuadraba (8579 → 9899 px) sin ganar un solo
  fps.
Si vuelves a medir, hazlo con contexto nuevo cada vez y varias vueltas en orden
aleatorio: una sola pasada da lecturas que se contradicen entre sí.

### Peso de `outputs/`

La carpeta `outputs/` pesa unos **15 MB** y GitHub Pages la sirve entera, aunque
nada del sitio enlace a ella: ahí están el `.blend`, el `.glb`, los `.zip`, el
APK y `Putup-blender.html` (5 MB él solo). No frena la portada —no se descarga
nada de ahí al abrirla—, pero infla el repo y queda público. Si sólo quieres
conservar lo jugable, con `putup.html` en la raíz basta.

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
