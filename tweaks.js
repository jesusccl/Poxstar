/* ══════════════════════════════════════════════════════════════════
   PoxStar Tweaks — panel de diseño (opt-in con ?tweaks=1)
   Vanilla JS. Sin React, sin Babel, sin CDN.
   Sustituye a tweaks.jsx + tweaks-panel.jsx.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var DEFAULTS = {
    accent: '#FF4A1C',
    dark: document.documentElement.dataset.theme === 'dark',
    fontPair: 'archivo',
    motion: true
  };

  var FONT_PAIRS = {
    archivo: {
      label: 'Archivo · Editorial',
      display: "'Archivo', system-ui, sans-serif",
      text: "'Space Grotesk', system-ui, sans-serif",
      mono: "'JetBrains Mono', ui-monospace, monospace",
      extra: null
    },
    bricolage: {
      label: 'Bricolage · Soft',
      display: "'Bricolage Grotesque', system-ui, sans-serif",
      text: "'Bricolage Grotesque', system-ui, sans-serif",
      mono: "'Space Mono', ui-monospace, monospace",
      extra: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&family=Space+Mono:wght@400;700&display=swap'
    },
    spaceMono: {
      label: 'Mono · Arcade',
      display: "'Space Mono', ui-monospace, monospace",
      text: "'Space Grotesk', system-ui, sans-serif",
      mono: "'Space Mono', ui-monospace, monospace",
      extra: 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap'
    }
  };

  var STORE = 'pox-tweaks';
  var state = Object.assign({}, DEFAULTS);
  try {
    var saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved) state = Object.assign(state, saved);
  } catch (e) {}

  var loadedFonts = {};
  function loadFont(href) {
    if (!href || loadedFonts[href]) return;
    loadedFonts[href] = true;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }

  function apply() {
    var r = document.documentElement;
    r.style.setProperty('--accent', state.accent);
    r.dataset.theme = state.dark ? 'dark' : 'light';
    r.dataset.motion = state.motion ? '1' : '0';

    var pair = FONT_PAIRS[state.fontPair] || FONT_PAIRS.archivo;
    loadFont(pair.extra);
    r.style.setProperty('--font-display', pair.display);
    r.style.setProperty('--font-text', pair.text);
    r.style.setProperty('--font-mono', pair.mono);

    try {
      localStorage.setItem(STORE, JSON.stringify(state));
      // Mantiene el tema en sync con el botón de la barra (index.html).
      localStorage.setItem('pox-theme', state.dark ? 'dark' : 'light');
    } catch (e) {}
  }

  function set(key, value) { state[key] = value; apply(); }

  /* ── Estilos del panel ───────────────────────────────────────── */
  var css = document.createElement('style');
  css.textContent = [
    '#pox-tweaks{position:fixed;top:14px;right:14px;z-index:120;width:250px;',
    '  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;',
    '  color:#F5F0E8;background:rgba(14,14,14,.94);border:1px solid rgba(245,240,232,.16);',
    '  border-radius:12px;backdrop-filter:blur(12px);box-shadow:0 18px 44px -16px rgba(0,0,0,.7);',
    '  overflow:hidden;user-select:none}',
    '#pox-tweaks header{display:flex;align-items:center;justify-content:space-between;',
    '  padding:10px 12px;background:rgba(245,240,232,.06);cursor:default}',
    '#pox-tweaks header b{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:600}',
    '#pox-tweaks .x{background:none;border:0;color:inherit;cursor:pointer;font-size:15px;',
    '  line-height:1;padding:2px 4px;opacity:.6}',
    '#pox-tweaks .x:hover{opacity:1}',
    '#pox-tweaks .body{padding:6px 12px 14px;max-height:70vh;overflow:auto}',
    '#pox-tweaks[data-open="false"] .body{display:none}',
    '#pox-tweaks .sec{margin:14px 0 8px;font-size:9.5px;letter-spacing:.18em;',
    '  text-transform:uppercase;opacity:.45}',
    '#pox-tweaks .row{display:flex;align-items:center;justify-content:space-between;',
    '  gap:10px;padding:6px 0}',
    '#pox-tweaks .row > span{opacity:.85}',
    '#pox-tweaks .swatches{display:flex;gap:6px}',
    '#pox-tweaks .sw{width:20px;height:20px;border-radius:50%;border:2px solid transparent;',
    '  cursor:pointer;padding:0;outline-offset:2px}',
    '#pox-tweaks .sw[aria-pressed="true"]{border-color:#F5F0E8}',
    '#pox-tweaks select{background:#1c1c1c;color:#F5F0E8;border:1px solid rgba(245,240,232,.2);',
    '  border-radius:6px;padding:5px 7px;font:inherit;cursor:pointer;max-width:130px}',
    '#pox-tweaks .swt{width:38px;height:21px;border-radius:999px;border:0;cursor:pointer;',
    '  background:rgba(245,240,232,.22);position:relative;transition:background .2s;padding:0}',
    '#pox-tweaks .swt[aria-pressed="true"]{background:var(--accent,#FF4A1C)}',
    '#pox-tweaks .swt i{position:absolute;top:3px;left:3px;width:15px;height:15px;',
    '  border-radius:50%;background:#fff;transition:transform .22s cubic-bezier(.2,.8,.2,1)}',
    '#pox-tweaks .swt[aria-pressed="true"] i{transform:translateX(17px)}',
    '#pox-tweaks .reset{margin-top:14px;width:100%;background:rgba(245,240,232,.1);',
    '  color:inherit;border:1px solid rgba(245,240,232,.18);border-radius:7px;',
    '  padding:7px;font:inherit;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}',
    '#pox-tweaks .reset:hover{background:rgba(245,240,232,.2)}',
    '@media (max-width:720px){#pox-tweaks{width:auto;left:14px;right:14px}}'
  ].join('');
  document.head.appendChild(css);

  /* ── Construcción del panel ──────────────────────────────────── */
  var root = document.createElement('aside');
  root.id = 'pox-tweaks';
  root.dataset.open = 'true';
  root.setAttribute('aria-label', 'Panel de tweaks de diseño');

  var head = document.createElement('header');
  var title = document.createElement('b');
  title.textContent = 'Tweaks';
  var closeBtn = document.createElement('button');
  closeBtn.className = 'x';
  closeBtn.type = 'button';
  closeBtn.textContent = '–';
  closeBtn.setAttribute('aria-label', 'Plegar panel');
  closeBtn.addEventListener('click', function () {
    var open = root.dataset.open !== 'true';
    root.dataset.open = String(open);
    closeBtn.textContent = open ? '–' : '+';
  });
  head.appendChild(title);
  head.appendChild(closeBtn);

  var body = document.createElement('div');
  body.className = 'body';

  function section(label) {
    var d = document.createElement('div');
    d.className = 'sec';
    d.textContent = label;
    body.appendChild(d);
  }

  function row(label, control) {
    var r = document.createElement('div');
    r.className = 'row';
    var s = document.createElement('span');
    s.textContent = label;
    r.appendChild(s);
    r.appendChild(control);
    body.appendChild(r);
    return r;
  }

  function colorControl(options) {
    var box = document.createElement('div');
    box.className = 'swatches';
    options.forEach(function (hex) {
      var b = document.createElement('button');
      b.className = 'sw';
      b.type = 'button';
      b.style.background = hex;
      b.title = hex;
      b.setAttribute('aria-label', 'Acento ' + hex);
      b.setAttribute('aria-pressed', String(state.accent === hex));
      b.addEventListener('click', function () {
        set('accent', hex);
        box.querySelectorAll('.sw').forEach(function (o) {
          o.setAttribute('aria-pressed', String(o.style.background === b.style.background));
        });
      });
      box.appendChild(b);
    });
    return box;
  }

  function toggleControl(key) {
    var b = document.createElement('button');
    b.className = 'swt';
    b.type = 'button';
    b.setAttribute('aria-pressed', String(!!state[key]));
    b.appendChild(document.createElement('i'));
    b.addEventListener('click', function () {
      set(key, !state[key]);
      b.setAttribute('aria-pressed', String(!!state[key]));
    });
    return b;
  }

  function selectControl(key, options) {
    var sel = document.createElement('select');
    options.forEach(function (o) {
      var op = document.createElement('option');
      op.value = o.value;
      op.textContent = o.label;
      if (state[key] === o.value) op.selected = true;
      sel.appendChild(op);
    });
    sel.addEventListener('change', function () { set(key, sel.value); });
    return sel;
  }

  section('Color');
  row('Acento', colorControl(['#FF4A1C', '#2A6FDB', '#1F8A5B', '#E11D74']));
  row('Modo oscuro', toggleControl('dark'));

  section('Tipografía');
  row('Par tipográfico', selectControl('fontPair', Object.keys(FONT_PAIRS).map(function (k) {
    return { value: k, label: FONT_PAIRS[k].label };
  })));

  section('Movimiento');
  row('Animaciones', toggleControl('motion'));

  var reset = document.createElement('button');
  reset.className = 'reset';
  reset.type = 'button';
  reset.textContent = 'Restablecer';
  reset.addEventListener('click', function () {
    try { localStorage.removeItem(STORE); } catch (e) {}
    location.reload();
  });
  body.appendChild(reset);

  root.appendChild(head);
  root.appendChild(body);
  document.body.appendChild(root);

  apply();
})();
