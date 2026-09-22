'use strict';
/* Memoria viral: tres tableros de seis parejas. El tiempo, las pistas y la
   resolución de parejas viven en update(), así que una pausa congela todo. */
const MEMORY_SYMBOLS=['★','♫','♥','☀','◆','☾','⚡','✿','☕','☁','♜','✦'];
const MEMORY_COLORS=['#f7df85','#ac9bfa','#fa95b6','#ffc685','#91d4ed','#c3b0ed','#b7f675','#f5ade0','#d4b297','#95d9ce','#b6bde7','#eadfa3'];
function memoryDeal(s) {
  const pool=Array.from({length:6},(_,i)=>(i+(s.round-1)*3)%MEMORY_SYMBOLS.length);
  s.deck=pool.flatMap(id=>[{id,matched:false},{id,matched:false}]);
  for(let i=s.deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[s.deck[i],s.deck[j]]=[s.deck[j],s.deck[i]]}
  s.open=[];s.resolve=0;s.reveal=1.6;s.nextRound=0;s.cursor=0;s.focusVisible=false;
}
function memoryGeometry() {
  const area=arcadeArea(110,108), top=area.top, available=area.height, gap=10;
  const size=Math.min(108,Math.floor((R.w-52)/4)-gap,Math.floor(available/3)-gap);
  const w=4*(size+gap)-gap,h=3*(size+gap)-gap;
  return{size,gap,x:(R.w-w)/2,y:top+Math.max(0,(available-h)/2),w,h};
}
function memoryPick(s,index,a) {
  if(s.reveal>0||s.resolve>0||s.nextRound>0||s.finished||index<0||index>=s.deck.length)return;
  const card=s.deck[index];if(card.matched||s.open.includes(index))return;
  s.open.push(index);Sound.card();
  if(s.open.length===2){s.moves++;s.resolve=.65}
}
function memoryHint(s) {
  if(s.hints<=0||s.open.length||s.resolve||s.reveal>0||s.nextRound>0||s.finished)return;
  s.hints--;s.hintsUsed++;s.reveal=1.5;s.combo=0;Sound.shine();
}
ARCADES.memoria={
  duration:60,
  hint:'Clic en dos cartas · H: pista · 3 tableros',
  controls:'Clic: voltear · Flechas + Enter: elegir · H: pista (2 por partida)',
  init(){const s={round:1,deck:[],open:[],resolve:0,reveal:0,nextRound:0,score:0,pairs:0,moves:0,misses:0,combo:0,bestCombo:0,hints:2,hintsUsed:0,finished:false,cursor:0,focusVisible:false};memoryDeal(s);return s},
  touch:[{label:'💡 Pista',code:'KeyH',big:true}],
  key(s,code,a){
    if(code==='KeyH'){memoryHint(s);return}
    const dir={ArrowLeft:-1,KeyA:-1,ArrowRight:1,KeyD:1,ArrowUp:-4,KeyW:-4,ArrowDown:4,KeyS:4}[code];
    if(dir){s.focusVisible=true;s.cursor=(s.cursor+dir+12)%12;Sound.click()}
    if(code==='Enter'||code==='Space'){s.focusVisible=true;memoryPick(s,s.cursor,a)}
  },
  pointer(s,x,y,dx,dy,a){
    if(Math.hypot(dx,dy)>12)return;
    const g=memoryGeometry(),col=Math.floor((x-g.x)/(g.size+g.gap)),row=Math.floor((y-g.y)/(g.size+g.gap));
    if(col<0||col>3||row<0||row>2)return;
    if((x-g.x)%(g.size+g.gap)>g.size||(y-g.y)%(g.size+g.gap)>g.size)return;
    s.cursor=row*4+col;s.focusVisible=false;memoryPick(s,s.cursor,a);
  },
  update(s,dt,a){
    if(s.finished)return;
    if(s.nextRound>0){s.nextRound-=dt;if(s.nextRound<=0){s.round++;memoryDeal(s)}return}
    if(s.reveal>0){s.reveal=Math.max(0,s.reveal-dt);return}
    if(s.resolve<=0)return;
    s.resolve=Math.max(0,s.resolve-dt);if(s.resolve>0)return;
    const [i,j]=s.open;
    if(s.deck[i].id===s.deck[j].id){
      s.deck[i].matched=s.deck[j].matched=true;s.pairs++;s.combo++;s.bestCombo=Math.max(s.bestCombo,s.combo);
      s.score+=120+Math.min(5,s.combo-1)*30;Sound.star(s.combo);
      const g=memoryGeometry();for(const n of [i,j])burst2d(g.x+(n%4)*(g.size+g.gap)+g.size/2,g.y+Math.floor(n/4)*(g.size+g.gap)+g.size/2,10,[MEMORY_COLORS[s.deck[i].id],'#ffffff'],150,3);
      if(s.combo===3||s.combo===6)arcadeEvent(`${s.combo} parejas seguidas sin fallar`,'◆',3+s.combo/3);
    }else{s.misses++;s.combo=0;Sound.miss()}
    s.open=[];
    if(s.deck.every(c=>c.matched)){
      s.score+=250;arcadeEvent(`Tablero ${s.round} completado`,'★',4+s.round);
      if(s.round>=3){s.finished=true;s.score+=Math.ceil(Math.max(0,60-a.time))*15;arcadeOver('¡MEMORIA PERFECTA!')}
      else s.nextRound=1;
    }
  },
  render(ctx,s,a,t){
    const bg=ctx.createLinearGradient(0,0,R.w,R.h);bg.addColorStop(0,'#20182f');bg.addColorStop(.65,'#283551');bg.addColorStop(1,'#142b3b');ctx.fillStyle=bg;ctx.fillRect(0,0,R.w,R.h);
    const g=memoryGeometry();
    ctx.textAlign='center';ctx.textBaseline='middle';
    for(let n=0;n<12;n++){
      const c=s.deck[n],x=g.x+n%4*(g.size+g.gap),y=g.y+Math.floor(n/4)*(g.size+g.gap),open=c.matched||s.reveal>0||s.open.includes(n);
      ctx.fillStyle=c.matched?'#285c55':open?'#e8e7e0':'#314467';
      roundRect(ctx,x,y,g.size,g.size,12);ctx.fill();ctx.strokeStyle=c.matched?'#99ddba':open?MEMORY_COLORS[c.id]:'#7187ad70';ctx.lineWidth=1.5;ctx.stroke();
      if(open){ctx.font=`700 ${Math.floor(g.size*.46)}px ${FONT}`;ctx.fillStyle=c.matched?'#c8f5d8':'#344363';ctx.fillText(MEMORY_SYMBOLS[c.id],x+g.size/2,y+g.size/2)}
      else{ctx.strokeStyle='#87a3ce55';ctx.lineWidth=1;roundRect(ctx,x+9,y+9,g.size-18,g.size-18,8);ctx.stroke();ctx.font=`800 ${Math.floor(g.size*.3)}px ${FONT}`;ctx.fillStyle='#9fb6db';ctx.fillText('▶',x+g.size/2,y+g.size/2)}
      if(s.focusVisible&&s.cursor===n){roundRect(ctx,x-3,y-3,g.size+6,g.size+6,14);ctx.strokeStyle='#b7f675';ctx.lineWidth=3;ctx.stroke()}
    }
    ctx.font=`600 13px ${FONT}`;ctx.fillStyle='#d8e3f6';
    ctx.fillText(s.nextRound>0?'¡Tablero completo! Preparando el siguiente…':s.reveal>0?'Memoriza las posiciones…':`Tablero ${s.round} / 3 · ${byInput('Pista','H: pista')} (${s.hints} restantes)`,R.w/2,g.y+g.h+26);
    ctx.textBaseline='alphabetic';
  },
  hud:s=>({left:`◆ ${s.pairs} / 18`,leftColor:'#c7b4ff',right:`${s.moves} intentos`,score:s.score,badge:s.combo>=3?`RACHA ${s.combo}`:null}),
  outroText:s=>`${s.pairs} parejas · ${s.moves} intentos · ${fmt(s.score)} puntos`,
  result:s=>({score:s.score,stars:s.pairs,hits:s.misses,bestCombo:s.bestCombo,
    summary:[`◆ ${s.pairs}/18 parejas`,`↻ ${s.moves} intentos`,`✕ ${s.misses} fallos`,`${fmt(s.score)} puntos`],
    suggest:s.finished?'¡Completé los tres tableros de Memoria viral!':`¡Encontré ${s.pairs} parejas en Memoria viral!`})
};
