# PoxStar 🌟

Página oficial de **PoxStar**, estudio indie de videojuegos de AugustoCLive.
Sitio estático servido desde GitHub Pages en [poxstar.com](https://poxstar.com),
con los juegos jugables directamente en el navegador.

## 🏠 La portada

Rediseñada en octubre de 2026 para ser más ligera: fondo claro (u oscuro, con
el botón de la barra o según el sistema), una sola tipografía —Archivo,
variable— y casi nada que se mueva solo. De arriba abajo:

- **Portada** (`#top`): la de siempre, con menos peso. Franja naranja
  `#FF4A1C` (en los dos temas, con el texto siempre negro), los rótulos en
  mono —«Estudio independiente», «// Estudio de AugustoCLive», «11 juegos ·
  jugables»—, la ficha negra con la estrella, «poxstar» en grande (las letras
  suben una vez al cargar), «// Since 2026 · por AugustoCLive», el lema
  «Construimos juegos pequeños con ideas grandes», los botones a los juegos y
  al canal, el gran estreno (Pichanga, `#pichanga`) con el césped a rayas, la
  fila de datos y la cinta con los juegos. La ficha con la estrella también
  es el logo de la barra y del pie.
- **Juegos** (`#juegos`): la novedad, Battle Universe, a lo ancho
  (`#battle-universe`), y Polemon, Furious Cars 2, República de Lemuy y Putup
  en tarjetas grandes (`#polemon`, `#furious`, `#lemuy`, `#putup`), cada una
  con «Jugar» y «Ver capturas», que abre una ficha (`<dialog>`) con la galería,
  el texto largo y los datos. Debajo, los cinco arcades con su portada
  (Furious Cars 1 es `#jugar`).
- **Canal** (`#canal`): el canal de YouTube de AugustoCLive —avatar,
  suscriptores, botón de suscribirse, el último vídeo y la lista de los seis
  últimos—. Ver [Canal de YouTube](#-canal-de-youtube).
- **Estudio** (`#estudio`) y **comunidad** (`#comunidad`): quién hace PoxStar,
  Discord, YouTube y el correo.

Con la versión anterior se fueron las franjas a pantalla completa de cada juego
con sus carruseles, la cinta, el cursor propio, el grano, el panel de tweaks
(`tweaks.js`), el juego embebido y el formulario del boletín, que no mandaba
nada a ningún sitio. Las anclas de siempre siguen llevando a su juego.

Las portadas de los arcades (`img/arcade-*.webp`, 800×500) son capturas de los
juegos en marcha; las de las tarjetas grandes (`img/card-*.webp`, 960×540) son
versiones reducidas de una captura de cada uno. Las fichas de capturas se
generaron una vez a partir de las imágenes de `img/` y ahora son HTML normal
dentro de `index.html`, entre `<!-- fichas:inicio -->` y `<!-- fichas:fin -->`.

## 📺 Canal de YouTube

El bloque del canal no se pide a YouTube desde el navegador de quien visita: lo
escribe `tools/canal.mjs` dentro de `index.html`, entre `<!-- canal:inicio -->`
y `<!-- canal:fin -->`, y guarda lo mismo en `data/canal.json`. Así la portada
enseña los vídeos sin JavaScript y sin cargar nada de YouTube hasta que alguien
pulsa reproducir; entonces la miniatura se cambia por el reproductor de
`youtube-nocookie.com`. Pulsar un vídeo de la lista lo pone en el reproductor
(con Ctrl o ⌘ se abre en YouTube, como un enlace normal).

```bash
node tools/canal.mjs        # Node 18 o más; sin dependencias ni clave de API
```

Lee la página pública del canal (nombre, avatar, suscriptores y vídeos) y su
pestaña «Vídeos» (los seis últimos, con visitas y duración). La fecha exacta
sale del feed RSS del canal o, si no responde, de la página de cada vídeo; si
YouTube corta el paso (HTTP 429), usa el «hace 3 días» de la lista —con
precisión de mes si dice «hace 2 meses»— y la afina en una pasada siguiente.
Si no sale ningún vídeo (YouTube cambió su página), no toca nada y termina con
error; si nada cambió, no escribe nada.

`.github/workflows/canal.yml` lo ejecuta cada seis horas, y a mano desde
Actions → «Canal de YouTube» → «Run workflow», y hace commit en `main` sólo si
algo cambió. Para cambiar de canal, `HANDLE` al principio del script.

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

**02 · Battle Universe** — *Nuevo.* Estrategia espacial en tiempo real. Cada
planeta tuyo fabrica naves (los grandes, más deprisa) y las mandas a conquistar:
si la flota llega con más naves de las que lo defienden, el planeta cambia de
dueño. Hasta cuatro imperios con IA propia hacen lo mismo y también se pelean
entre ellos. Campaña de **12 sectores**, con hasta tres estrellas cada uno según
el tiempo, y **batalla rápida** eligiendo rivales (1–4), tamaño de la galaxia,
dificultad (fácil, normal, difícil o brutal) y rarezas. El **Desafío del día** saca de la fecha
una semilla y la configuración (el mismo mapa para todos ese día) y guarda tu
mejor tiempo en `bu_desafio_v1`. Las rarezas:

- **Forja**: fabrica casi el doble. **Fortaleza**: cada defensor vale 1,6.
  **Gigante gaseoso**: enorme y con mucha guarnición. **Nebulosa**: las flotas
  van al 45 %. **Agujero negro**: se traga las flotas que lo cruzan; la línea de
  envío se pone roja antes de mandarlas.
- **Tocar / clic** en tus planetas los elige; tocar otro planeta manda allí el
  porcentaje elegido de cada uno (25, 50, 75 o 100 %). También se puede
  arrastrar del planeta al objetivo, y dos toques seguidos eligen todos.
- Teclado: **1–4** porcentaje · **A** todos · **P / Esc** pausa · **M** sonido ·
  clic derecho envía la selección (también a tus propios planetas).

`battle-universe.html` es **un solo archivo** hecho aquí (83 KB), sin
dependencias: lienzo 2D y Web Audio, con efectos y música sintetizados. Sólo pide
las fuentes a Google Fonts, y sin ellas usa las del sistema. Las galaxias se
generan **simétricas**: los neutrales se colocan en una porción del mapa y se
copian girando alrededor del centro, así cada imperio ve lo mismo a su alrededor.
Los sectores de la campaña usan siempre la misma semilla. El progreso y las
opciones se guardan en `localStorage` (`bu_progreso_v1`, `bu_rapida_v1` y
`bu_ajustes_v1`).

Con `#debug` en la URL expone `window.__bu`: `sector(i)`, `rapida(opciones)`,
`piloto(true)` para que tu imperio lo lleve la IA y `sim(segundos)` para
adelantar la partida sin pintar. Así se afinó la dificultad, jugando cada sector
varias veces con el jugador en piloto automático: los nueve primeros los gana más
o menos tres veces de cada cuatro y los tres últimos bastante menos. Así salieron
también las capturas de `img/bu-*.webp`.

**03 · Polemon: Edición Aventura** — *Nuevo.* Un RPG de criaturas al estilo
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
ven en la ficha «Ver capturas» de Polemon.

**Un fallo del juego, sin tocar aquí:** al crear a los líderes de gimnasio,
`T()` en `js/world/trainers.js` compone `title: 'Líder ' + nombre` pero luego
hace `Object.assign(..., o)` con el `title: 'Líder'` que se le pasa, que lo
pisa. Por eso el combate anuncia «¡Líder quiere luchar!» sin el nombre. Se
arregla en el repo del juego; la copia de aquí sigue al original.

**04 · Furious Cars 2** — La secuela de Furious Cars, ahora en 3D
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

**05 · República de Lemuy** — MMO de acción y conquista sobre la isla de Lemuy,
en Chiloé. Diez villas (de Puqueldón, nivel 1, a Detif, nivel 22), veinticuatro
criaturas de la mitología chilota, cinco clases, clanes, territorios y banderas.

- **WASD** caminar · **espacio** atacar · **Q** habilidad · **F** objetivo
- **E** entrar a una casa · **B** bote · **T** bus municipal · **Enter** chat
- En móvil, joystick en pantalla

No vive en este repo: corre en el servidor propio del estudio y se publica con
[Tailscale](https://tailscale.com) en <https://dell.taila1b256.ts.net/>. Desde el
sitio se enlaza directo (su tarjeta del catálogo, `#lemuy`, su ficha de
capturas, el pie de página y el launcher). **Si el servidor está apagado, el enlace
no abre** — es lo único del sitio que depende de una máquina encendida.

**06 · Putup** — Simulador de creador. Vives en una casa 3D (estudio, salón,
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

**07 · Carrera Loca** — Endless arcade de carreras con estética neón.

**08 · BREACH // 2044** — Puzzle de intrusión cyberpunk. Recorres una matriz de
código alternando fila y columna para llenar el búfer; un démon se sube si su
secuencia aparece seguida dentro de él. Niveles con matriz y búfer crecientes.

- Ratón o **↑↓←→** + **Enter**
- Los démones se generan a partir de un recorrido válido real, así que **siempre
  hay solución** dentro del búfer.

**09 · NEON RUNNER** — Runner de gravedad invertible sobre ciudad neón.

- **Espacio** / clic / toque — invertir gravedad

**10 · DAEMON** — Shooter de arena por oleadas con gráficos vectoriales.

- **WASD** / flechas — moverse · **ratón** — apuntar · **clic** — disparar
- En móvil: arrastrar para moverse, dispara y apunta solo

**11 · Furious Cars 1** — Endless racer top-down. Tres vidas, tráfico infinito.

- ← → / A D — moverse lateral
- ↑ ↓ / W S — adelantar/frenar (más arriba = más rápido)
- **M** — silenciar sonido
- 9 colores de coche a elegir (se guardan entre sesiones)

Los cinco arcades del repo guardan récord en `localStorage` y respetan
`prefers-reduced-motion`. El número de cada juego es su orden en el catálogo de
la portada, no su orden de salida.

## 🎃 Halloween

Del **1 de octubre al 2 de noviembre** la portada se pone de temporada, en
versión ligera: la franja naranja pasa a calabaza, la ficha con la estrella
(la grande y la del logo) se vuelve una calabaza con vela, bajo «poxstar» sale
el letrero «Edición Halloween · ¿truco o trato?», la cinta empieza con «feliz
halloween» y arriba hay una luna y tres murciélagos, quietos. Igual en tema
claro y oscuro.

- Un script en el `<head>` pone la clase `halloween` en `<html>` antes del
  primer pintado. Para probarlo fuera de fecha: `?halloween=1`; para verlo sin
  él: `?halloween=0`. Las fechas están en esa condición.
- El estilo va bajo `.halloween` en el CSS y los adornos en `<div class="hw">`,
  en `display:none` fuera de temporada.

La capa de antes (cielo nocturno, telarañas, araña, cementerio, murciélagos
volando) se fue con el rediseño. Lo que se aprendió midiéndola sigue valiendo:
nada de `filter: drop-shadow` en lo que se repinta, sin `var()` dentro de
`@keyframes` (Chrome no puede llevar la animación a la GPU) y halos con
degradados, no con sombras desenfocadas enormes.

## 📁 Estructura

```
.
├── index.html          # Página principal (el bloque del canal lo escribe tools/canal.mjs)
├── polemon.html        # Juego 03 — empaquetado desde jesusccl/Concurso (ver arriba)
├── furious-cars-2.html # Juego 04 — copia de jesusccl/miprogramagpt (ver arriba)
├── pichanga.html       # Juego 01 — fútbol online, un solo archivo hecho aquí
├── battle-universe.html # Juego 02 — estrategia espacial, un solo archivo hecho aquí
├── furious-cars.html   # Juego 11
├── carrera-loca.html   # Juego 07
├── breach-2044.html    # Juego 08
├── neon-runner.html    # Juego 09
├── daemon.html         # Juego 10
├── putup.html          # Juego 06 — un solo archivo, generado por build-putup.cjs
├── build-putup.cjs     # Genera putup.html desde outputs/putup/
├── outputs/            # Material de Putup tal y como sale de su compilación
├── launcher.html       # Launcher web (no enlazado desde la home)
├── img/                # Capturas de los juegos, tarjetas (card-*) y portadas de los arcades (arcade-*)
├── tools/canal.mjs     # Trae los últimos vídeos de YouTube a la portada
├── mods/agentes/       # Mod de Claude Code: panel con los agentes trabajando (ver PROYECTO.md)
├── PROYECTO.md         # Guía para retomar el proyecto desde otro PC
├── data/canal.json     # Lo que trajo la última vez
├── .github/workflows/canal.yml  # Lo ejecuta cada seis horas
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

### Tema oscuro

Botón en la barra superior. En la primera visita sigue `prefers-color-scheme`
y luego recuerda la elección en `localStorage` (clave `pox-theme`). Los colores
son variables en `:root` (`--bg`, `--surface`, `--ink`, `--accent`…), con su
juego oscuro debajo.

### Capturas de Lemuy

Las nueve imágenes de `img/lemuy-*` **están renderizadas con el motor del propio
juego** (su `pixeles.js` y su `mapa2d.js`, alimentados por `/api/terreno` y
`/api/datos`), no dibujadas a mano: el mapa es el mapa de verdad y los sprites
son los sprites de verdad. Si el juego cambia, hay que volver a generarlas.
Son WebP sin pérdida (516 KB las nueve) y sólo se bajan al abrir su ficha.

### Otros

- **Récord de los juegos**: `localStorage` del navegador. Para resetear, borra
  los datos del sitio en las opciones del navegador.
- **Editar textos**: todo vive directamente en `index.html`, menos el bloque
  del canal, que `tools/canal.mjs` reescribe entero.
- **Animaciones**: la única continua es la cinta de la portada (se para al
  pasar el ratón); con `prefers-reduced-motion: reduce` se apagan la cinta, la
  entrada de las letras y las transiciones.

## ⚡ Rendimiento

La portada nueva contra la anterior, en Chromium con la CPU frenada ×4, a
1440×900, con contexto nuevo en cada carga y cinco cargas de cada en orden
aleatorio (medianas; las dos con la capa de Halloween puesta):

| | Antes | Ahora |
|---|---|---|
| HTML (sin comprimir) | 224 KB | 87 KB |
| Primer pintado (FCP = LCP) | 760 ms | 528 ms |
| Bloqueo del hilo (tareas largas) | 1178 ms | 338 ms |
| Elementos en el DOM | 1383 | 712 |
| Bajado al abrir | 386 KB | 246 KB |
| Bajado tras recorrer la página | 1113 KB | 538 KB |
| Recorrido: fotograma p95 | 83 ms | 17 ms |
| Recorrido: fotogramas de más de 34 ms | 59 % | 1 % |

Con la portada blanca de la primera versión del rediseño el primer pintado
bajaba a ~384 ms; la franja naranja con «poxstar» a 224 px le suma entre 100
y 150 ms con la CPU frenada ×4. La cinta
y la entrada de las letras no cuentan: quitándolas, las cifras se quedan
dentro del ruido (seis cargas de cada variante).

Por qué:

- **Casi nada se mueve solo.** Ni `requestAnimationFrame` permanentes ni
  escuchas de `scroll` o `mousemove`. Lo único continuo es la cinta, que sólo
  mueve `transform` (la hace la GPU, sin tocar el hilo principal); lo demás son
  transiciones al pasar el ratón y la entrada de las letras y de las fichas.
- **Una fuente**, Archivo variable (35 KB el subconjunto latino), con la hoja
  en `media="print"` para no bloquear el primer pintado. Antes eran cuatro.
- **Imágenes pequeñas y perezosas.** Las tarjetas usan versiones de 960 px
  (22–40 KB); las capturas de las fichas están dentro de `<dialog>` cerrados,
  así que no se bajan hasta abrir una, y luego según se pasan.
- **YouTube no carga nada** hasta pulsar reproducir: el canal es HTML estático
  y sus miniaturas van en `loading="lazy"`.

Ojo al medir el desplazamiento: la página lleva `scroll-behavior: smooth`. Un
`scrollTo` por fotograma inicia cada vez un desplazamiento suave que apenas
avanza, así que hay que poner `scroll-behavior: auto` antes, o sólo se mide la
parte de arriba. Y si pruebas con Playwright sirviendo las fuentes tú mismo,
pásale a Google Fonts el User-Agent del navegador: con uno desconocido devuelve
TTF enteros (cuatro de 109 KB) en lugar del WOFF2 de 35 KB.

Algo que se probó en la versión anterior y **se descartó porque salió peor**:
`content-visibility:auto` en las secciones de abajo (primer pintado 428 → 548 ms
y la altura de la página descuadrada, sin ganar un solo fps). Si vuelves a
medir, hazlo con contexto nuevo cada vez y varias vueltas en orden aleatorio:
una sola pasada da lecturas que se contradicen entre sí.

### Peso de `outputs/`

La carpeta `outputs/` pesa unos **15 MB** y GitHub Pages la sirve entera, aunque
nada del sitio enlace a ella: ahí están el `.blend`, el `.glb`, los `.zip`, el
APK y `Putup-blender.html` (5 MB él solo). No frena la portada —no se descarga
nada de ahí al abrirla—, pero infla el repo y queda público. Si sólo quieres
conservar lo jugable, con `putup.html` en la raíz basta.

## 🌐 Probar local

En `file://` fallan `localStorage` y el reproductor de YouTube. Levanta un
servidor:

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
