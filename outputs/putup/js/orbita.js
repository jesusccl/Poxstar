'use strict';
/* Órbita viral: movimiento continuo, disparos, escudo y asteroides. Coordenadas
   normalizadas para que una ventana distinta no cambie las reglas de la partida. */
function orbitField() {
  const area = arcadeArea(96, 102), top = area.top, available = area.height;
  // En un monitor la pista es apaisada; en un teléfono se estira a lo alto en vez de
  // dejar media pantalla vacía. `a` es su proporción: con ella una distancia medida en
  // coordenadas normalizadas vale lo mismo en los dos sitios.
  const w = Math.min(780, R.w - 32, available * 1.4), h = Math.min(available, w * 1.5);
  return { x: (R.w - w) / 2, y: top + Math.max(0, (available - h) / 2), w, h, a: h / w };
}
function orbitBurst(x, y, color) {
  const g = orbitField(); burst2d(g.x + x * g.w, g.y + y * g.h, 12, [color, '#eefaff'], 180, 3);
}
function orbitShoot(s) {
  if (s.fire > 0) return;
  s.fire = .16;
  s.shots.push({ x: s.x, y: s.y - .035, dead: false });
  Sound.note(80, .022);
}
function orbitShield(s) {
  if (s.cooldown > 0 || s.shield > 0) return;
  s.shield = 2; s.cooldown = 8; Sound.shine();
  arcadeEvent('Escudo de emergencia activado', '◈', 1.5);
}
function orbitSpawn(s, a) {
  const size = rand(.033, .064);
  s.rocks.push({ x: rand(.07, .93), y: -.09, r: size, speed: rand(.17, .25) + a.time * .0025,
    drift: rand(-.035, .035), hp: size > .049 ? 2 : 1, dead: false, spin: rand(0, 6.28) });
}
function orbitHit(s, a, rock) {
  rock.dead = true;
  if (s.shield > 0) { s.saved++; s.score += 30; orbitBurst(rock.x, rock.y, '#7de1fa'); Sound.star(1); return; }
  if (s.inv > 0) return;
  s.hits++; s.lives--; s.inv = 1.3; s.combo = 0; a.flash = 1; a.shake = .4;
  Sound.hit(); orbitBurst(s.x, s.y, '#ff9d87');
  arcadeEvent('Impacto en plena lluvia de asteroides', '☄', 1);
  if (s.lives <= 0) arcadeOver('FIN DEL VUELO');
}
const ORBIT_DIR = { ArrowLeft: [-1,0], KeyA: [-1,0], ArrowRight: [1,0], KeyD: [1,0], ArrowUp: [0,-1], KeyW: [0,-1], ArrowDown: [0,1], KeyS: [0,1] };
ARCADES.orbita = {
  duration: 45,
  hint: 'WASD / flechas · Espacio: disparar · E: escudo',
  controls: 'WASD / flechas: pilotar · Espacio: disparar · E: escudo (8 s de recarga)',
  init: () => ({ x: .5, y: .83, lives: 3, hits: 0, inv: 0, rocks: [], shots: [], crystals: [],
    spawn: .5, fire: 0, cooldown: 0, shield: 0, killed: 0, stars: 0, saved: 0, score: 0, combo: 0, bestCombo: 0 }),
  key(s, code) {
    if (code === 'Space') orbitShoot(s);
    if (code === 'KeyE') orbitShield(s);
    // A discrete nudge also makes quick taps responsive on low-refresh displays.
    if (ORBIT_DIR[code]) { s.x = clamp(s.x + ORBIT_DIR[code][0] * .018, .035, .965); s.y = clamp(s.y + ORBIT_DIR[code][1] * .018, .12, .94); }
  },
  touch: [{ label: '◈ Escudo', code: 'KeyE' }, { label: '✦ Disparar', code: 'Space', hold: true, big: true }],
  drag(s, x, y) {
    const g = orbitField();
    s.x = clamp((x - g.x) / g.w, .035, .965); s.y = clamp((y - g.y) / g.h, .12, .94);
  },
  pointer(s, x, y) {
    const g = orbitField();
    if (x < g.x || x > g.x + g.w || y < g.y || y > g.y + g.h) return;
    s.x = clamp((x - g.x) / g.w, .035, .965); s.y = clamp((y - g.y) / g.h, .12, .94); orbitShoot(s);
  },
  update(s, dt, a) {
    const aspect = orbitField().a;
    let dx = 0, dy = 0;
    for (const [key, v] of Object.entries(ORBIT_DIR)) if (keys.has(key)) { dx += v[0]; dy += v[1]; }
    const length = Math.hypot(dx, dy) || 1;
    s.x = clamp(s.x + dx / length * dt * .65, .035, .965);
    s.y = clamp(s.y + dy / length * dt * .85, .12, .94);
    for (const k of ['fire', 'inv', 'cooldown', 'shield']) s[k] = Math.max(0, s[k] - dt);
    if (keys.has('Space')) orbitShoot(s);
    if ((s.spawn -= dt) <= 0) { orbitSpawn(s, a); s.spawn += Math.max(.28, .83 - a.time * .01); }
    for (const shot of s.shots) { shot.prevY = shot.y; shot.y -= dt * 1.65; }
    for (const r of s.rocks) {
      r.y += r.speed * dt; r.x += r.drift * dt; r.spin += dt;
      for (const b of s.shots) {
        // Test the whole travelled segment so fast shots cannot skip a rock.
        const closestY = clamp(r.y, b.y, b.prevY ?? b.y);
        if (b.dead || r.dead || Math.hypot(b.x - r.x, (closestY - r.y) * aspect) > r.r + .012) continue;
        b.dead = true; r.hp--;
        if (r.hp <= 0) {
          r.dead = true; s.killed++; s.combo++; s.bestCombo = Math.max(s.bestCombo, s.combo);
          s.score += 75 + Math.min(4, Math.floor(s.combo / 5)) * 25;
          orbitBurst(r.x, r.y, '#b7f675'); Sound.star(Math.min(s.combo, 8));
          if (s.killed % 3 === 0) s.crystals.push({ x: r.x, y: r.y, dead: false });
          if (s.combo === 5 || s.combo === 10 || s.combo === 20) arcadeEvent(`${s.combo} asteroides sin recibir daño`, '☄', 3 + s.combo / 10);
        }
      }
      if (!r.dead && Math.hypot(s.x-r.x, (s.y-r.y) * aspect) < r.r + .022) orbitHit(s, a, r);
      if (s.lives <= 0) break;
    }
    for (const c of s.crystals) {
      c.y += dt * .18;
      if (Math.hypot(c.x-s.x, (c.y-s.y) * aspect) < .052) {
        c.dead = true; s.stars++; s.score += 150; Sound.coin(); orbitBurst(c.x, c.y, '#f7e36b');
        arcadeEvent('Cristal cósmico recuperado', '✦', 2.5);
      }
    }
    s.shots = s.shots.filter(b => !b.dead && b.y > -.1);
    s.rocks = s.rocks.filter(r => !r.dead && r.y < 1.15);
    s.crystals = s.crystals.filter(c => !c.dead && c.y < 1.12);
  },
  render(ctx, s, a, t) {
    const g = orbitField(), bg = ctx.createLinearGradient(0,0,R.w,R.h);
    bg.addColorStop(0,'#0d1029'); bg.addColorStop(.55,'#172746'); bg.addColorStop(1,'#291944');
    ctx.fillStyle=bg;ctx.fillRect(0,0,R.w,R.h);
    for(let i=0;i<95;i++) {
      const x=(i*173.73)%R.w, y=(i*91.27+t*(12+i%4*9))%R.h;
      ctx.globalAlpha=.25+(i%6)*.11;ctx.fillStyle=i%3?'#d5e8ff':'#9dcfff';ctx.fillRect(x,y,i%4===0?2:1,2);
    }
    ctx.globalAlpha=1;
    ctx.strokeStyle='#72aaff35';ctx.lineWidth=1;roundRect(ctx,g.x,g.y,g.w,g.h,18);ctx.stroke();
    ctx.save();roundRect(ctx,g.x,g.y,g.w,g.h,18);ctx.clip();
    for(const r of s.rocks) {
      const x=g.x+r.x*g.w,y=g.y+r.y*g.h,radius=r.r*g.w;
      ctx.save();ctx.translate(x,y);ctx.rotate(r.spin);ctx.beginPath();
      for(let i=0;i<9;i++){const rad=radius*(i%2?.8:1),ang=i/9*Math.PI*2;i?ctx.lineTo(Math.cos(ang)*rad,Math.sin(ang)*rad):ctx.moveTo(Math.cos(ang)*rad,Math.sin(ang)*rad)}
      ctx.closePath();ctx.fillStyle=r.hp>1?'#9485ba':'#78859e';ctx.fill();ctx.strokeStyle='#d3b8e6';ctx.lineWidth=2;ctx.stroke();
      ctx.fillStyle='#101f3d55';ctx.beginPath();ctx.arc(-radius*.22,-radius*.18,radius*.23,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    ctx.fillStyle='#a7f4fd';for(const b of s.shots){ctx.fillRect(g.x+b.x*g.w-2,g.y+b.y*g.h-10,4,15)}
    for(const c of s.crystals){ctx.fillStyle='#f7e36b';starIcon(ctx,g.x+c.x*g.w,g.y+c.y*g.h,11)}
    const px=g.x+s.x*g.w,py=g.y+s.y*g.h;
    if(s.shield>0){ctx.strokeStyle='#7de1fa';ctx.fillStyle='#7de1fa22';ctx.lineWidth=2;ctx.beginPath();ctx.arc(px,py,34+Math.sin(t*10)*2,0,Math.PI*2);ctx.fill();ctx.stroke()}
    if(s.inv<=0||Math.floor(t*12)%2){
      ctx.fillStyle='#ffad77';ctx.beginPath();ctx.moveTo(px-7,py+13);ctx.lineTo(px,py+27+Math.sin(t*40)*6);ctx.lineTo(px+7,py+13);ctx.fill();
      ctx.fillStyle='#dcf4f1';ctx.beginPath();ctx.moveTo(px,py-24);ctx.lineTo(px+22,py+20);ctx.lineTo(px,py+10);ctx.lineTo(px-22,py+20);ctx.closePath();ctx.fill();
      ctx.fillStyle='#83b9ee';ctx.beginPath();ctx.moveTo(px,py-10);ctx.lineTo(px+6,py+6);ctx.lineTo(px-6,py+6);ctx.closePath();ctx.fill();
    }
    ctx.restore();ctx.textAlign='center';ctx.fillStyle='#a6c5df';ctx.font=`600 12px ${FONT}`;
    ctx.fillText(s.shield>0?'◈ ESCUDO ACTIVO':s.cooldown>0?`Escudo disponible en ${Math.ceil(s.cooldown)} s`:byInput('◈','E')+' · ESCUDO LISTO',R.w/2,g.y+g.h+23);
  },
  hud: s => ({left:'♥ '.repeat(Math.max(0,s.lives)).trim(),leftColor:'#ffa5be',score:s.score,right:`☄ ${s.killed}`,badge:s.combo>=5?`RACHA ${s.combo}`:null}),
  outroText: s => `${s.killed} asteroides · ${s.stars} cristales · ${fmt(s.score)} puntos`,
  result: s => ({score:s.score,stars:s.stars+Math.floor(s.killed/4),hits:s.hits,bestCombo:s.bestCombo,
    summary:[`☄ ${s.killed} asteroides`,`✦ ${s.stars} cristales`,`♥ ${s.lives} vidas`,`${fmt(s.score)} puntos`],
    suggest:s.killed>=15?`¡Destruí ${s.killed} asteroides en Órbita viral!`:'¡Mi primera misión en Órbita viral!'})
};
