# PoxStar 🌟

Página oficial de **PoxStar**, estudio indie de videojuegos de AugustoCLive.
Sitio estático servido desde GitHub Pages en [poxstar.com](https://poxstar.com),
con los juegos jugables directamente en el navegador.

## 🎮 Juegos

**01 · Pichanga** — *Gran estreno · online.* Fútbol 2D al estilo de los FIFA de
los 90, de uno contra uno a cuatro contra cuatro: cámara de transmisión que
sigue al balón sobre la cancha inclinada, arcos con red y altura, banderines,
vallas publicitarias, radar de jugadores, marcador y «¡GOOOL!» en letra
pixelada, y futbolistas en pixel art de 16 bits que corren, chutan y celebran
(cada nombre tiene siempre la misma piel, pelo y peinado).

- **Con amigos:** «Crear sala privada» da un código de cinco letras y un enlace
  (`pichanga.html#sala=CÓDIGO`). Quien crea la sala es el anfitrión: elige
  duración, goles para ganar, cancha, si los bots completan los equipos y su
  nivel, mueve gente de equipo y decide cuándo empieza. Hay chat en la sala y
  en el partido.
- **Partida rápida:** mira seis salas públicas fijas; si alguna tiene hueco
  entra —a mitad de partido, en lugar de un bot— y si no, abre una. En las
  públicas el partido arranca solo en cuanto hay dos personas.
- **Sin conexión:** contra la máquina (1v1, 2v2 o 3v3; fácil, normal o
  difícil) o dos personas en el mismo teclado.

Controles:

- **WASD / flechas** moverse · **Espacio / X** chutar · **Shift / C** correr
  (gasta energía) · **Enter / T** chat · **Esc** pausa · **M** sonido
- Chutar al tocar es un pase; **mantener el chute mientras llegas al balón carga
  un cañonazo** (el aro dorado), a cambio de ir más lento.
- Dos en un teclado: J1 WASD + Espacio + Shift izq.; J2 flechas + Enter (o L) +
  Shift der. (o K). Mando: stick o cruceta, A chuta, B o gatillo corre.
- En móvil, joystick y botones en pantalla; en vertical la cancha se gira.

`pichanga.html` es **un solo archivo** y para jugar sin conexión no pide nada
de fuera (las fuentes de Google son opcionales: sin ellas tira de las del
sistema). El online no tiene servidor propio:

- Va **de navegador a navegador** (WebRTC) con [PeerJS](https://peerjs.com)
  1.5.4, que se descarga sólo al pulsar un botón online, de cdnjs o, si falla,
  de jsDelivr, con su hash SRI. El servidor público de PeerJS sólo presenta a
  los jugadores; el partido viaja directo. Si una red no deja conectar directo,
  PeerJS usa sus servidores TURN públicos.
- **Manda el anfitrión:** simula a 60 pasos por segundo y envía el estado 30
  veces por segundo; los invitados mandan sus controles y pintan lo que les
  llega interpolado (unos 67 ms por detrás). Por eso conviene que quien abre la
  sala tenga buena conexión, y si cierra la pestaña la sala se acaba: no hay
  traspaso de anfitrión. Si sólo cambia de pestaña, un Worker mantiene la
  simulación, porque el navegador congela `requestAnimationFrame` en segundo
  plano.
- Las salas son IDs de PeerJS: `poxstar-pichanga-v1-CÓDIGO` las privadas y
  `poxstar-pichanga-v1-pub-0…5` las públicas. Si cambias el protocolo, sube el
  `v1` y `PROTO` a la vez, para que no se mezclen versiones.
- Lo que llega de otros jugadores se trata como no fiable: nombres y chat se
  limpian y se pintan como texto, los controles se acotan y hay un tope de
  mensajes por segundo.
- Averiguar que una sala no existe tarda unos 5–7 s: el servidor de PeerJS
  espera 5 s antes de responder que no hay nadie. Por eso la partida rápida
  tarda eso cuando no hay nadie esperando.

**Probar el online en local**, sin depender del servidor público:

```bash
npx peerjs --port 9000          # un servidor PeerJS propio
python -m http.server 8000
# y en dos ventanas:
# http://localhost:8000/pichanga.html?peerhost=localhost&peerport=9000&peersecure=0
```

Con `#debug` en la URL expone `window.__pich`, con `sim(segundos)` para
adelantar la simulación y `autopilot(true)` para que tu jugador lo lleve la IA.
Así se probó el online de punta a punta (sala privada, chat, partido, final,
partida rápida, entrar en lugar de un bot, anfitrión que se va) con varios
Chromium contra un servidor PeerJS local, y así se afinaron los bots, jugando
partidos de tres minutos entre ellos: unos 7 goles por partido en 1v1, 3 en
2v2 y 1,5–2 en 3v3 y 4v4; el nivel difícil le gana al normal doce de doce.

**La cámara** (`aimCamera`) sigue al balón con suavizado sin enseñar más allá del
estadio; la cancha se aplasta en vertical (`SQ = 0.72`) para dar la inclinación
de las transmisiones, y el zoom deja al futbolista en ~1/8 del alto de la
pantalla. En móvil vertical se ve todo el ancho y la cancha se gira. Todo es
una transformación afín, así que la cancha sigue saliendo de una sola imagen
cacheada.

**Los futbolistas** se dibujan con rectángulos sobre una rejilla de «píxel de
arte» (`drawFootballer`), en vista tres cuartos y siempre de pie aunque la
cancha se gire en vertical; se ordenan por profundidad con el balón. La física
sigue siendo la de un disco de radio 15: la figura se pinta 1,15 veces más
grande (`FIG_SCALE`, 1,15) para que se lea. Cuesta unos 50 µs por jugador; con 4
contra 4 en un móvil simulado (CPU ×4) el cuadro entero se pinta en 1,8 ms de
mediana. El diseño salió de un banco de pruebas que pinta todas las vistas,
fases de carrera, chute y celebración a escala grande y a tamaño de móvil.

La portada (`img/pichanga-portada.webp`) es un partido de 3 contra 3 de
verdad, con bots, capturado tal cual se ve en pantalla.

**02 · Polemon: Edición Aventura** — *Nuevo.* Un RPG de criaturas al estilo
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

**03 · Furious Cars 2** — La secuela de Furious Cars, ahora en 3D
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

**04 · República de Lemuy** — MMO de acción y conquista sobre la isla de Lemuy,
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

**05 · Putup** — Simulador de creador. Vives en una casa 3D (estudio, salón,
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

**06 · Carrera Loca** — Endless arcade de carreras con estética neón.

**07 · BREACH // 2044** — Puzzle de intrusión cyberpunk. Recorres una matriz de
código alternando fila y columna para llenar el búfer; un démon se sube si su
secuencia aparece seguida dentro de él. Niveles con matriz y búfer crecientes.

- Ratón o **↑↓←→** + **Enter**
- Los démones se generan a partir de un recorrido válido real, así que **siempre
  hay solución** dentro del búfer.

**08 · NEON RUNNER** — Runner de gravedad invertible sobre ciudad neón.

- **Espacio** / clic / toque — invertir gravedad

**09 · DAEMON** — Shooter de arena por oleadas con gráficos vectoriales.

- **WASD** / flechas — moverse · **ratón** — apuntar · **clic** — disparar
- En móvil: arrastrar para moverse, dispara y apunta solo

**10 · Furious Cars 1** — Endless racer top-down. Tres vidas, tráfico infinito.

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
├── polemon.html        # Juego 02 — empaquetado desde jesusccl/Concurso (ver arriba)
├── furious-cars-2.html # Juego 03 — copia de jesusccl/miprogramagpt (ver arriba)
├── pichanga.html       # Juego 01 — fútbol online, un solo archivo hecho aquí
├── furious-cars.html   # Juego 10 (también embebido en index)
├── carrera-loca.html   # Juego 06
├── breach-2044.html    # Juego 07
├── neon-runner.html    # Juego 08
├── daemon.html         # Juego 09
├── putup.html          # Juego 05 — un solo archivo, generado por build-putup.cjs
├── build-putup.cjs     # Genera putup.html desde outputs/putup/
├── outputs/            # Material de Putup tal y como sale de su compilación
├── launcher.html       # Launcher web (no enlazado desde la home)
├── img/                # Capturas de Polemon, Furious Cars 2, Lemuy y Putup, y la portada de Pichanga
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
- **La ficha de Pichanga no pesa al abrir la home:** su portada (44 KB) va
  con `loading="lazy"` y, mirado en 1440×900, 1920×1080 y móvil, no se descarga
  hasta llegar al catálogo. El juego son 162 KB (50 KB comprimido) y PeerJS
  (93 KB) sólo baja cuando alguien pulsa un botón online.
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
