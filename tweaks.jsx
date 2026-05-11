// PoxStar Tweaks — primary color, theme, typography, motion

const POX_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#FF4A1C",
  "dark": false,
  "fontPair": "archivo",
  "motion": true
}/*EDITMODE-END*/;

const FONT_PAIRS = {
  archivo: {
    label: "Archivo · Editorial",
    display: "'Archivo', system-ui, sans-serif",
    text:    "'Space Grotesk', system-ui, sans-serif",
    mono:    "'JetBrains Mono', ui-monospace, monospace"
  },
  bricolage: {
    label: "Bricolage · Soft",
    display: "'Bricolage Grotesque', system-ui, sans-serif",
    text:    "'Bricolage Grotesque', system-ui, sans-serif",
    mono:    "'Space Mono', ui-monospace, monospace"
  },
  spaceMono: {
    label: "Mono · Arcade",
    display: "'Space Mono', ui-monospace, monospace",
    text:    "'Space Grotesk', system-ui, sans-serif",
    mono:    "'Space Mono', ui-monospace, monospace"
  }
};

function PoxTweaksApp(){
  const [t, setTweak] = useTweaks(POX_TWEAK_DEFAULTS);

  React.useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--accent', t.accent);
    r.dataset.theme  = t.dark ? 'dark' : 'light';
    r.dataset.motion = t.motion ? '1' : '0';
    const pair = FONT_PAIRS[t.fontPair] || FONT_PAIRS.archivo;
    r.style.setProperty('--font-display', pair.display);
    r.style.setProperty('--font-text',    pair.text);
    r.style.setProperty('--font-mono',    pair.mono);
  }, [t.accent, t.dark, t.fontPair, t.motion]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Color" />
      <TweakColor
        label="Acento"
        value={t.accent}
        options={['#FF4A1C', '#2A6FDB', '#1F8A5B', '#E11D74']}
        onChange={(v) => setTweak('accent', v)}
      />
      <TweakToggle
        label="Modo oscuro"
        value={t.dark}
        onChange={(v) => setTweak('dark', v)}
      />

      <TweakSection label="Tipografía" />
      <TweakSelect
        label="Par tipográfico"
        value={t.fontPair}
        options={[
          { value: 'archivo',   label: FONT_PAIRS.archivo.label },
          { value: 'bricolage', label: FONT_PAIRS.bricolage.label },
          { value: 'spaceMono', label: FONT_PAIRS.spaceMono.label }
        ]}
        onChange={(v) => setTweak('fontPair', v)}
      />

      <TweakSection label="Movimiento" />
      <TweakToggle
        label="Animaciones"
        value={t.motion}
        onChange={(v) => setTweak('motion', v)}
      />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<PoxTweaksApp />);
