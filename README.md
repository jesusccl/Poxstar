# PoxStar 🌟

Página oficial de **PoxStar**, estudio indie de videojuegos de AugustoCLive.
Sitio estático servido desde GitHub Pages en [poxstar.com](https://poxstar.com),
con los juegos jugables directamente en el navegador.

## 🎮 Juegos

**01 · Polemon: Edición Aventura** — *Gran estreno.* Un RPG de criaturas al estilo
de los clásicos de Game Boy. Eliges inicial (Charmandro, Bulbasor o Squirtel) en
el laboratorio del Profesor Roble y recorres la región de Kantia —mapa de
160×156 casillas, 9 ciudades, 15 rutas y 8 mazmorras— capturando entre **121
especies** de **18 tipos**, con combates por turnos, evoluciones, **8 gimnasios**
y la Liga. Es un fan-juego no oficial: los gráficos se generan por código y la
música es propia; la página lo dice junto al juego.

- **Flechas / WASD** moverse · **Z / espacio / Enter** aceptar · **X** cancelar
- **Mantener B o Mayús** correr · **Esc / C / Q** menú · **M** silenciar
- En móvil, cruceta y botones A, B y MENÚ en pantalla
- La partida se guarda en `localStorage` (clave `polemon_save_v1`)

`polemon.html` es el juego entero en **un solo archivo** (474 KB, hasta la fuente
Press Start 2P va incrustada) y no pide nada de fuera: funciona sin conexión.
Sale de [`jesusccl/Concurso`](https://github.com/jesusccl/Concurso), rama
`ccr-f384db3e-cm9qya` (commit `9775b32`), con su propio empaquetador:

```bash
cd polemon && node tools/build.mjs ../../Poxstar/polemon.html
```

Si el juego cambia allí, hay que volver a generarlo y copiarlo.

Las diez capturas de `img/polemon-*.webp` salen del lienzo del juego leído
píxel a píxel (`toDataURL`), usando los guiones de pantallas de su
`tests/screens.mjs` y algunos propios: el gimnasio de Celestia y el encuentro con
Miutú se lanzan como en el juego, con su mapa, su líder y su equipo reales. Están
a ×2 sin suavizado y en WebP sin pérdida (102 KB las diez); en la página se
pintan con `image-rendering: pixelated`. El logotipo de la sección lo dibuja la
propia función `drawLogo()` del juego sobre transparente, y pesa tan poco
(338 bytes) que va incrustado en el HTML.

**Un fallo del juego, sin tocar aquí:** al crear a los líderes de gimnasio,
`T()` en `js/world/trainers.js` compone `title: 'Líder ' + nombre` pero luego
hace `Object.assign(..., o)` con el `title: 'Líder'` que se le pasa, que lo
pisa. Por eso el combate anuncia «¡Líder quiere luchar!» sin el nombre. Se
arregla en el repo del juego; la copia de aquí sigue al original.

**02 · Furious Cars 2** — La secuela de Furious Cars, ahora en 3D
(three.js). Ocho pilotos en pista —tú y siete rivales con IA—, **seis coches**
(Viper GT, Phantom R, Blaze S, Toro V12, Bravo 69 y Cóndor RS) y **dos
circuitos**: Sierra Dorada y el volcán Osorno. Carrera de 1, 3 o 5 vueltas, o
**modo libre**: sin muros, te bajas del auto, paseas por la ciudad, te subes a
cualquier coche aparcado y puedes subir hasta la cumbre del volcán. Un relator
narra adelantamientos, derrapes y saltos (con voz si el navegador tiene una en
español; si no, en subtítulos).

- **WASD** / flechas conducir · **Shift** nitro · **espacio** freno de mano
  (derrapar recarga el nitro)
- **F** bajar / subir del auto (modo libre) · **C** cámara · **R** volver a la
  pista · **P** pausa · **M** sonido · **V** relator
- Funciona con mando; en móvil salen botones en pantalla y arranca en calidad
  «rápida»

`furious-cars-2.html` es **una copia literal** del juego tal como está en
[`jesusccl/miprogramagpt`](https://github.com/jesusccl/miprogramagpt), rama
`claude/compassionate-faraday-68hhm6` (commit `73c8ee1`, 157 KB). Ojo: la
`main` de ese repo tiene una versión anterior de 82 KB; la buena es la de la
rama. Si el juego cambia allí, hay que volver a copiarlo.

A diferencia de Putup, **no es autónomo**: carga three.js 0.160 desde jsDelivr
(con un `importmap`) y sus dos fuentes desde Google Fonts. Necesita conexión
la primera vez.

Trae un gancho para pruebas automáticas: abriéndolo con `#debug` en la URL
expone `window.__fc2`, con `sim(segundos)` para adelantar la simulación con
piloto automático sin tener que pintar cada cuadro. Las ocho capturas de
`img/fc2-*.webp` salieron así, del juego de verdad, en calidad «ultra».

**03 · República de Lemuy** — MMO de acción y conquista sobre la isla de Lemuy,
en Chiloé. Diez villas (de Puqueldón, nivel 1, a Detif, nivel 22), veinticuatro
criaturas de la mitología chilota, cinco clases, clanes, territorios y banderas.

- **WASD** caminar · **espacio** atacar · **Q** habilidad · **F** objetivo
- **E** entrar a una casa · **B** bote · **T** bus municipal · **Enter** chat
- En móvil, joystick en pantalla

No vive en este repo: corre en el servidor propio del estudio y se publica con
[Tailscale](https://tailscale.com) en <https://dell.taila1b256.ts.net/>. Desde el
sitio se enlaza directo (franja del hero, ficha 03 del catálogo, sección
`#lemuy`, pie de página y el launcher). **Si el servidor está apagado, el enlace
no abre** — es lo único del sitio que depende de una máquina encendida.

**04 · Putup** — Simulador de creador. Vives en una casa 3D (estudio, salón,
cocina, recibidor, baño y jardín), con la casa del vecino al otro lado de la
parcela, y grabas partidas en el ordenador, las editas
—momentos, título, miniatura— y las publicas para que crezca el canal. El dinero
ficticio se gasta en mejoras que aparecen de verdad en la habitación.

Dentro del ordenador hay **seis juegos**: Salto neón (carreras), Ritmo pixel
(música), Serpiente de likes, Órbita viral (naves), Memoria viral (parejas) y
**Polenom**, un juego de cartas por turnos con quince criaturas originales y
cinco tipos que se ganan entre sí.

- **WASD** caminar · **clic** ir o usar · **arrastrar** girar la cámara
- **E** usar objeto · **C** paredes · **M** sonido · **Esc** pausa
- En móvil se juega a dedo, con los botones que cada juego necesita

`putup.html` es el juego entero en **un solo archivo**, sin ninguna petición
externa. Ya no es una copia de `outputs/Putup.html`: se genera desde las fuentes
de `outputs/putup/` con

```bash
node build-putup.cjs
```

que mete dentro la hoja de estilos y los 22 scripts. **Si tocas algo en
`outputs/putup/`, vuelve a ejecutarlo** o el sitio seguirá sirviendo lo viejo.

### El orden de dibujado

El motor pinta con el algoritmo del pintor: agrupa cada objeto, y para decidir
quién tapa a quién busca un eje que separe sus cajas. Dos cosas iban mal y se
veían como «la mesa le come el respaldo a la silla» o «se ve un mueble de la
habitación de al lado»:

- Las relaciones sólo se calculaban **entre una pared y un objeto**. Entre dos
  muebles se dejaba al orden por profundidad, que no basta cuando se solapan:
  una silla arrimada a una mesa tiene el centro más lejos y se pintaba debajo.
- El desempate usaba **el centro de la caja**. Una estantería pegada a la pared
  tiene el centro casi en el plano del muro, perdía el desempate y salía
  aplastada contra la pared.

Medido con `?qa=render` (el ayudante que trae el juego: teleporta la cámara y
vuelca el orden de dibujado en `window.__qaRender`), sobre 40 cámaras repartidas
por la casa: **de 847 pares mal ordenados a 13**, a cambio de un 4,5 % de fps.

Si vuelves a tocar esto, mide el orden REAL de pintado (`R.drawOrder`), no
`R.groups`: `R.groups` queda ordenado por profundidad y da cifras que no se
corresponden con lo que se ve.

### La casa de al lado

La parcela tiene dos casas. La segunda —salón y taller— se añadió aprovechando
la maquinaria que ya existía: **todo sale de los rectángulos de `ROOMS`**. Los
tramos de pared, los suelos, las esquinas y las colisiones se generan solos a
partir de ahí, así que añadir una casa es sobre todo declararla:

- `js/house.js` — dos entradas nuevas en `ROOMS` (con un campo `house` para la
  etiqueta de sitio), sus huecos en `OPENINGS`, y `HOUSES`, que es la lista por
  la que ahora pasan los cimientos y el `inHouse()`.
- `js/rooms.js` — `drawVecinaSala` y `drawVecinaTaller`, sus entradas en el mapa
  `content`, sus luces y sus colisiones de mueble.
- `js/garden.js` — la parcela se ensancha (`LOT.x1` de 20 a 38), el sendero de
  losas entre las dos casas, el escalón de la entrada y algo de arbolado.

Si añades una tercera, ése es el camino. Cuidado con dos cosas: `drawRooms`
busca cada habitación por id en el mapa `content` y **revienta si falta**, y los
rectángulos tienen que ir en coordenadas enteras, porque los tramos de pared se
generan de metro en metro.

### Aviso sobre `outputs/putup/`

Las fuentes de `outputs/putup/` son **más nuevas** que el `outputs/Putup.html`
que venía en la subida: se diferencian sólo en el motor (92 líneas), una línea
de `house.js` y seis de `garden.js`; el resto de módulos son idénticos. Lo que
se publica sale de las fuentes.

**05 · Carrera Loca** — Endless arcade de carreras con estética neón.

**06 · BREACH // 2044** — Puzzle de intrusión cyberpunk. Recorres una matriz de
código alternando fila y columna para llenar el búfer; un démon se sube si su
secuencia aparece seguida dentro de él. Niveles con matriz y búfer crecientes.

- Ratón o **↑↓←→** + **Enter**
- Los démones se generan a partir de un recorrido válido real, así que **siempre
  hay solución** dentro del búfer.

**07 · NEON RUNNER** — Runner de gravedad invertible sobre ciudad neón.

- **Espacio** / clic / toque — invertir gravedad

**08 · DAEMON** — Shooter de arena por oleadas con gráficos vectoriales.

- **WASD** / flechas — moverse · **ratón** — apuntar · **clic** — disparar
- En móvil: arrastrar para moverse, dispara y apunta solo

**09 · Furious Cars 1** — Endless racer top-down. Tres vidas, tráfico infinito.

- ← → / A D — moverse lateral
- ↑ ↓ / W S — adelantar/frenar (más arriba = más rápido)
- **M** — silenciar sonido
- 9 colores de coche a elegir (se guardan entre sesiones)

Los cinco arcades del repo guardan récord en `localStorage` y respetan
`prefers-reduced-motion`. El número de cada ficha es su posición en el catálogo,
no su orden de salida.

## 🎃 Halloween

Del **1 de octubre al 2 de noviembre** la portada se viste de noche sola: el
hero pasa a un cielo nocturno con luna, telarañas, una araña colgando,
murciélagos y un cementerio al pie; el logotipo se convierte en una calabaza
con vela, «poxstar» se pinta de calabaza con goterones, la cinta lleva
calabazas en vez de puntos y el resto de la página toma tonos pergamino y
ciruela (o morado casi negro en el tema oscuro).

Es una capa aparte, fácil de quitar o de alargar:

- Un script en el `<head>` pone la clase `halloween` en `<html>` si la fecha
  cae en la temporada, antes del primer pintado (sin fogonazo naranja).
  Para probarlo fuera de fecha: `?halloween=1`; para verlo sin él: `?halloween=0`.
- Todo el estilo va en el bloque «Halloween» del CSS, bajo `html.halloween`.
  Los adornos del hero están en `<div class="hw">` y, fuera de temporada,
  en `display:none`: comprobado píxel a píxel, la portada queda idéntica.
- Para cambiar las fechas, la condición está en ese script del `<head>`.

Lo que se aprendió midiendo (CPU ×4, contexto nuevo cada vez):

- **Nada de `filter` en el rótulo.** El resplandor con `drop-shadow` se
  recalculaba en cada fotograma y, con el hero a la vista, el desplazamiento
  bajaba de 41 a 26 fps; ahora es un degradado de fondo detrás.
- **Sin `var()` dentro de `@keyframes`**: con variables, Chrome no puede llevar
  la animación a la GPU. Los murciélagos se reparten con el retraso.
- **El halo de la luna es un degradado**, no una sombra desenfocada de 180 px.
- **Los adornos sólo existen con el hero en pantalla** (`.hw-fuera` lo
  marca un IntersectionObserver) y **entran después del primer pintado**
  (`.hw-listo`, con un fundido).

Resultado: recorrido de la página 28,9 → 27,5 fps (10 vueltas de cada),
hilo principal en reposo igual, y el primer pintado unos 100 ms más tarde
con la CPU frenada ×4 (unos 25 ms en un equipo normal).

Ojo al medir: la página lleva `scroll-behavior: smooth`. Un `scrollTo` por
fotograma inicia cada vez un desplazamiento suave que apenas avanza, así que
hay que poner `scroll-behavior: auto` antes, o lo que se mide es el hero.
Las cifras de recorrido de Furious Cars 2 y Polemon de más abajo se tomaron
sin eso: valen como comparación antes/después, pero miden sobre todo el hero.

## 📁 Estructura

```
.
├── index.html          # Página principal
├── polemon.html        # Juego 01 — empaquetado desde jesusccl/Concurso (ver arriba)
├── furious-cars-2.html # Juego 02 — copia de jesusccl/miprogramagpt (ver arriba)
├── furious-cars.html   # Juego 09 (también embebido en index)
├── carrera-loca.html   # Juego 05
├── breach-2044.html    # Juego 06
├── neon-runner.html    # Juego 07
├── daemon.html         # Juego 08
├── putup.html          # Juego 04 — un solo archivo, generado por build-putup.cjs
├── build-putup.cjs     # Genera putup.html desde outputs/putup/
├── outputs/            # Material de Putup tal y como sale de su compilación
├── launcher.html       # Launcher web (no enlazado desde la home)
├── img/                # Capturas de Polemon, Furious Cars 2, Lemuy y Putup para los carruseles
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
- **La franja de Polemon** tampoco trae fuentes nuevas: el logotipo es una
  imagen de 338 bytes incrustada, y las estrellas, una sola caja de 2 px con
  sus sombras. Medido igual que la de Furious Cars 2: recorrido de la página
  **57,6 → 57,3 fps** de mediana (10 vueltas de cada, p95 17 ms en las dos) y
  primer pintado sin diferencia medible (dos tandas que se contradicen:
  608 → 568 y 592 → 660 ms). HTML comprimido **+5,6 KB**. En 1440×900 y en el
  móvil abrir la home sigue sin bajar ninguna imagen; en 1920×1080 llegan las
  dos primeras láminas de Polemon (unos 20 KB).
- **El menú pasa a la hamburguesa por debajo de 1000 px** (antes, 900). Con
  ocho enlaces no cabía entre 900 y 1020 px: «Furious 2» se partía en dos
  líneas y el botón «Jugar ahora» se salía de la pantalla.
- **La franja de Furious Cars 2** no carga ninguna fuente nueva (el rótulo es
  Archivo en cursiva, la que ya se usaba, no la Russo One del juego) y su único
  adorno animado es el brillo de la etiqueta, que sólo mueve `transform`.
  Medido antes y después, 16 cargas de cada en orden aleatorio con la CPU
  frenada ×4: primer pintado **672 → 668 ms** (igual), recorrido de la página
  **42 → 43 fps** (igual), HTML comprimido **+4,8 KB**. Al abrir la home sigue
  sin bajarse ninguna captura: sus nueve WebP (611 KB en total) llegan de dos
  en dos según se pasan.

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
