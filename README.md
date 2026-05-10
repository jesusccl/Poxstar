# PoxStar 🌟

Página oficial de **PoxStar**, estudio indie de videojuegos. Sitio estático servido desde GitHub Pages, incluye nuestro juego *Carrera Loca* embebido y jugable.

## 🎮 Juego incluido

**Carrera Loca** — Endless racer top-down. Tres vidas, tráfico infinito, récord persistente.

- ← → / A D — moverse lateral
- ↑ ↓ / W S — adelantar/frenar (más arriba = más rápido)
- **M** — silenciar sonido
- 9 colores de coche a elegir (se guardan entre sesiones)

## 📁 Estructura

```
.
├── index.html          # Página principal de PoxStar
├── carrera-loca.html   # Juego (standalone, también embebido en index)
├── tweaks.jsx          # Lógica del panel de tweaks
├── tweaks-panel.jsx    # Componente UI del panel
├── .nojekyll           # Desactiva Jekyll en GitHub Pages
└── README.md
```

Todo es HTML/CSS/JS plano. No requiere build, ni npm, ni nada.

## 🚀 Desplegar en GitHub Pages

### Opción A: repo nuevo (más rápido)

1. Crea un repo en GitHub (público) — por ejemplo `poxstar`.
2. Sube todos los archivos de esta carpeta a la raíz del repo.
3. En el repo, ve a **Settings → Pages**.
4. En *Source* selecciona `Deploy from a branch`.
5. En *Branch* selecciona `main` y carpeta `/ (root)`. Guarda.
6. Espera 1-2 minutos. Tu sitio estará en `https://<tu-usuario>.github.io/poxstar/`.

### Opción B: desde terminal (si ya tienes git)

```bash
git init
git add .
git commit -m "PoxStar live"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/poxstar.git
git push -u origin main
```

Luego activa Pages igual que en la opción A.

### Opción C: usuario.github.io (raíz)

Si quieres que el sitio sea tu página personal (`https://<tu-usuario>.github.io/` sin subdirectorio), nombra el repo exactamente como `<tu-usuario>.github.io` y sigue los mismos pasos.

## 🔧 Personalizar

- **Color de acento, tema oscuro, tipografía**: panel de Tweaks en la esquina superior derecha del sitio.
- **Récord del juego**: se guarda en `localStorage` del navegador. Para resetear, borra los datos del sitio en las opciones del browser.
- **Editar copy**: todo el texto vive directamente en `index.html`. Sin frameworks, sin templates.

## 🌐 Probar local

Funciona abriendo `index.html` directamente en el browser, pero algunos navegadores bloquean `localStorage` y iframes en `file://`. Para una prueba fiel:

```bash
# Python 3
python3 -m http.server 8000

# Node
npx serve

# PHP
php -S localhost:8000
```

Luego abre `http://localhost:8000`.

## 📝 Licencia

Código del sitio: MIT.
Carrera Loca: © PoxStar 2026.
