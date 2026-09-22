#!/usr/bin/env node
'use strict';
/* Empaqueta outputs/putup/ en el putup.html de la raíz: un solo fichero, sin
   ninguna petición externa, que es como se sirve el juego en poxstar.com.
   El original se compilaba con `work/build.cjs`, que no vino en la subida;
   esto hace la parte que el sitio necesita. Uso: node build-putup.cjs */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'outputs', 'putup');
const OUT = path.join(__dirname, 'putup.html');
const leer = f => fs.readFileSync(path.join(SRC, f), 'utf8');

let html = leer('index.html');

// El manifest y los iconos son ficheros aparte: en un solo fichero no existen.
html = html.replace(/^[ \t]*<link rel="manifest"[^>]*>\r?\n/m, '');

// La hoja de estilos, dentro.
const css = leer('style.css');
html = html.replace(/^[ \t]*<link rel="stylesheet" href="style\.css">[ \t]*$/m,
  () => '  <style>\n' + css.replace(/\s*$/, '') + '\n  </style>');

// Cada script, en su sitio y en el mismo orden.
let n = 0;
html = html.replace(/^[ \t]*<script src="(js\/[^"?]+\.js)(?:\?[^"]*)?"><\/script>[ \t]*$/gm,
  (_, f) => { n++; return '  <script>\n' + leer(f).replace(/\s*$/, '') + '\n  </script>'; });

if (/<(script src|link rel="stylesheet")/.test(html)) {
  console.error('Quedan referencias externas sin empotrar:');
  console.error(html.match(/<(?:script src|link rel="stylesheet")[^>]*>/g).join('\n'));
  process.exit(1);
}

fs.writeFileSync(OUT, html);
console.log(`putup.html reconstruido · ${n} scripts + 1 hoja de estilos · ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
