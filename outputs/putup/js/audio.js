'use strict';
/* Putup · Efectos y música sintetizados con Web Audio (sin archivos externos).
   Si el navegador no tiene Web Audio, todas las funciones son inofensivas. */

const Sound = (() => {
  let ac = null, master = null, music = null, noiseBuf = null, timer = null, nextAt = 0, step = 0, muted = false;
  const VOLUME = 0.5;

  function audio() {
    if (ac) return ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ac = new AC(); } catch { return null; }
    master = ac.createGain();
    master.gain.value = muted ? 0 : VOLUME;
    master.connect(ac.destination);
    music = ac.createGain();
    music.gain.value = 0.28;
    music.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.6, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ac;
  }

  function tone(freq, dur, { type = 'sine', vol = 0.15, slide = 0, at = 0, out = null } = {}) {
    const a = audio();
    if (!a || muted) return;
    const t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out || master);
    o.start(t); o.stop(t + dur + 0.03);
  }

  function noise(dur, { vol = 0.2, freq = 1200, type = 'lowpass', at = 0, out = null } = {}) {
    const a = audio();
    if (!a || muted) return;
    const t = a.currentTime + at, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out || master);
    s.start(t); s.stop(t + dur + 0.02);
  }

  /* Música del minijuego: bajo, arpegio y batería a 128 BPM, programados por adelantado. */
  const BASS = [45, 45, 48, 43, 41, 41, 43, 40];
  const ARP = [0, 7, 12, 7, 3, 10, 15, 10];
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  const STEP = 60 / 128 / 4;
  function schedule() {
    if (!ac) return;
    while (nextAt < ac.currentTime + 0.15) {
      const at = Math.max(0, nextAt - ac.currentTime), s = step % 16, bar = Math.floor(step / 16) % BASS.length;
      if (s % 4 === 0) tone(150, 0.2, { vol: 0.55, slide: -110, at, out: music });
      if (s % 4 === 2) noise(0.05, { vol: 0.12, freq: 7000, type: 'highpass', at, out: music });
      if (s === 4 || s === 12) noise(0.14, { vol: 0.16, freq: 1800, type: 'bandpass', at, out: music });
      if (s % 2 === 0) tone(midi(BASS[bar]), STEP * 1.8, { type: 'sawtooth', vol: 0.09, at, out: music });
      if (s % 2 === 1) tone(midi(BASS[bar] + 24 + ARP[(step >> 1) % ARP.length]), STEP * 1.5, { type: 'triangle', vol: 0.05, at, out: music });
      nextAt += STEP;
      step++;
    }
  }

  return {
    get muted() { return muted; },
    unlock() { const a = audio(); if (a && a.state === 'suspended') a.resume(); },
    setMuted(m) {
      muted = !!m;
      if (master) master.gain.setTargetAtTime(muted ? 0 : VOLUME, ac.currentTime, 0.03);
    },
    startMusic() {
      const a = audio();
      if (!a || timer) return;
      nextAt = a.currentTime + 0.06;
      step = 0;
      timer = setInterval(schedule, 30);
    },
    stopMusic() { clearInterval(timer); timer = null; },
    click: () => tone(720, 0.05, { type: 'triangle', vol: 0.05 }),
    step: () => noise(0.04, { vol: 0.03, freq: 500 }),
    lane: () => tone(480, 0.07, { type: 'sine', vol: 0.06, slide: 120 }),
    jump: () => tone(260, 0.2, { type: 'square', vol: 0.05, slide: 420 }),
    land: () => noise(0.09, { vol: 0.09, freq: 500 }),
    star(combo = 1) {
      const f = 660 * Math.pow(2, Math.min(combo - 1, 12) / 12);
      tone(f, 0.12, { type: 'triangle', vol: 0.12 });
      tone(f * 1.5, 0.2, { type: 'triangle', vol: 0.09, at: 0.06 });
    },
    hit() {
      noise(0.4, { vol: 0.35, freq: 900 });
      tone(150, 0.35, { type: 'sawtooth', vol: 0.14, slide: -100 });
    },
    beep: high => tone(high ? 988 : 494, high ? 0.4 : 0.16, { type: 'square', vol: 0.07 }),
    finish: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, { type: 'triangle', vol: 0.1, at: i * 0.09 })),
    publish() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.35, { type: 'triangle', vol: 0.09, at: i * 0.08 }));
      noise(0.5, { vol: 0.05, freq: 6000, type: 'highpass', at: 0.4 });
    },
    /** Nota musical (Ritmo pixel): midi = número de nota. */
    note: (n, vol = 0.1) => tone(midi(n), 0.22, { type: 'triangle', vol }),
    miss: () => tone(170, 0.14, { type: 'sawtooth', vol: 0.05, slide: -70 }),
    card: () => noise(0.07, { vol: 0.09, freq: 2800, type: 'highpass' }),
    shine() { [1319, 1568, 2093].forEach((f, i) => tone(f, 0.25, { type: 'triangle', vol: 0.06, at: i * 0.07 })); },
    coin: () => { tone(988, 0.08, { type: 'square', vol: 0.05 }); tone(1319, 0.25, { type: 'square', vol: 0.05, at: 0.07 }); },
  };
})();
