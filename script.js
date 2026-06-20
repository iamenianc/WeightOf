const LINES = [[13.0, "He carried our sins, on that rugged tree", "v"], [18.5, "to win our pardon and our victory.", "v"], [24.0, "In jars of clay we carry the news:", "v"], [29.5, "Christ is risen\u2026", "v"], [33.0, "Grace has broken through.", "v"], [38.0, "No condemnation now is ours to dread\u2026", "v"], [44.0, "by your word the faintest soul is fed.", "v"], [50.0, "We have believed and so we loudly speak", "v"], [56.0, "the name of Jesus", "v"], [59.5, "Strength unto the Weak.", "v"], [64.0, "We do not Hope", "c"], [67.0, "in what is seen", "c"], [70.0, "But cling to Christ our certainty", "c"], [75.0, "The weight of glory yet to come", "c"], [80.0, "it's the song of heaven now begun.", "c"], [85.0, "it's the song of heaven now begun.", "c"], [90.0, "A new life we live,", "v"], [94.0, "by his mighty hand,", "v"], [98.0, "Through every grief, to the promised Land", "v"], [104.0, "The Spirit's here, he knows our needs", "v"], [110.0, "and from his throne, our saviour intercedes", "v"], [117.0, "We do not hope", "c"], [120.0, "in what is seen", "c"], [123.0, "But cling to Christ our certainty", "c"], [128.0, "The weight of glory yet to come", "c"], [133.0, "it's the song of heaven now begun.", "c"], [138.0, "it's the song of heaven now begun.", "c"], [144.0, "We do not hope in what is seen", "c"], [149.0, "But cling to Christ our certainty", "c"], [154.0, "The weight of glory yet to come", "c"], [159.0, "it's the song of heaven now begun.", "c"], [164.0, "it's the song of heaven now begun.", "c"], [172.0, "Beyond the reach of mortal sight,", "b"], [176.5, "yet clearer still, than brightest Light,", "b"], [181.0, "In every trial and every fall,", "b"], [185.5, "the hope of glory outweighs them all", "b"], [192.0, "We do not hope in what is seen", "c"], [197.0, "But cling to Christ our certainty", "c"], [202.0, "The weight of glory yet to come", "c"], [207.0, "it's the song of heaven now begun.", "c"], [213.0, "We do not hope in what is seen", "c"], [218.0, "But cling to Christ our certainty", "c"], [223.0, "The weight of glory yet to come", "c"], [228.0, "it's the song of heaven now begun.", "c"], [233.0, "it's the song of heaven now begun.", "c"]];
const aud   = document.getElementById('aud');
const stage = document.getElementById('stage');
const gate  = document.getElementById('gate');
const bar   = document.getElementById('bar');
const pp    = document.getElementById('pp');
const timeEl= document.getElementById('time');
const seek  = document.getElementById('seek');
const fill  = document.getElementById('fill');
const knob  = document.getElementById('knob');

/* ---------- build line elements ---------- */
const els = LINES.map((L)=>{
  const [t,text,sec] = L;
  const div = document.createElement('div');
  div.className = 'line '+sec;
  text.split(' ').forEach((w,wi)=>{
    const s=document.createElement('span');
    s.className='word'; s.textContent=w+' ';
    s.style.transitionDelay=(wi*0.085)+'s';
    div.appendChild(s);
  });
  stage.appendChild(div);
  return {t, el:div, words:[...div.querySelectorAll('.word')]};
});

let cur = -1;
function showLine(i){ els[i].el.classList.remove('out'); els[i].words.forEach(w=>w.classList.add('in')); }
function hideLine(i){ els[i].el.classList.add('out'); els[i].words.forEach(w=>w.classList.remove('in')); }

/* recompute which line should be visible for an arbitrary time (handles seeking) */
function syncLines(force){
  const t = aud.currentTime;
  let idx=-1;
  for(let i=0;i<els.length;i++){ if(els[i].t<=t) idx=i; else break; }
  if(idx!==cur || force){
    els.forEach((o,i)=>{ if(i!==idx){ o.el.classList.remove('out'); o.words.forEach(w=>w.classList.remove('in')); } });
    if(idx>=0) showLine(idx);
    cur=idx;
  }
}

/* ---------- transport ---------- */
function fmt(s){ s=Math.max(0,s|0); return (s/60|0)+':'+String(s%60).padStart(2,'0'); }
function updateBar(){
  const d = aud.duration||0, t = aud.currentTime;
  const pct = d? (t/d*100):0;
  fill.style.width = pct+'%';
  knob.style.left  = pct+'%';
  timeEl.textContent = fmt(t)+' / '+fmt(d);
}
function setPP(){ pp.innerHTML = aud.paused ? '&#9654;' : '&#10074;&#10074;'; }
pp.addEventListener('click', ()=>{ aud.paused?aud.play():aud.pause(); });
aud.addEventListener('play', ()=>{ document.body.classList.add('playing'); setPP(); });
aud.addEventListener('pause',()=>{ document.body.classList.remove('playing'); setPP(); });

function seekTo(clientX){
  const r = seek.getBoundingClientRect();
  const p = Math.min(1,Math.max(0,(clientX-r.left)/r.width));
  if(aud.duration){ aud.currentTime = p*aud.duration; updateBar(); syncLines(true); }
}
let dragging=false;
seek.addEventListener('pointerdown',e=>{ dragging=true; seek.setPointerCapture(e.pointerId); seekTo(e.clientX); });
seek.addEventListener('pointermove',e=>{ if(dragging) seekTo(e.clientX); });
seek.addEventListener('pointerup',  ()=>{ dragging=false; });

/* auto-hide the bar while playing; reveal on mouse move */
let hideTimer;
function flashBar(){
  bar.classList.add('show');
  clearTimeout(hideTimer);
  if(!aud.paused) hideTimer=setTimeout(()=>bar.classList.remove('show'),2600);
}
addEventListener('mousemove',flashBar);
addEventListener('touchstart',flashBar);

/* ---------- main loop ---------- */
function loop(){
  if(!aud.paused) syncLines(false);
  updateBar();
  requestAnimationFrame(loop);
}

/* ---------- abstract generative art ---------- */
const ARTWORK_STRENGTH = 2.0; // Adjusts the opacity/strength of the colored artwork (1.0 = default, 2.0 = stronger, 0.5 = weaker)
const ARTWORK_SIZE     = 1.6; // Adjusts the diameter/size of the colored blobs (1.0 = default, 1.5 = larger, 0.7 = smaller)
const ARTWORK_SPEED    = 3.0; // Adjusts the speed of the blob movement animation (1.0 = default, 2.0 = double speed, 0.5 = half speed)
const cv = document.getElementById('art');
const ctx = cv.getContext('2d');
let W,H,DPR;
function resize(){ DPR=Math.min(devicePixelRatio||1,2); W=cv.width=innerWidth*DPR; H=cv.height=innerHeight*DPR; cv.style.width=innerWidth+'px'; cv.style.height=innerHeight+'px'; }
resize(); addEventListener('resize',resize);

let analyser, freqData, level=0;
function initAudio(){
  try{
    const AC = new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state==='suspended') AC.resume();
    const src = AC.createMediaElementSource(aud);
    analyser = AC.createAnalyser(); analyser.fftSize=256;
    freqData = new Uint8Array(analyser.frequencyBinCount);
    src.connect(analyser); analyser.connect(AC.destination);
  }catch(e){}
}

const blobs=[...Array(5)].map((_,i)=>({
  x:Math.random(), y:Math.random(),
  r:0.20+Math.random()*0.22,
  ph:Math.random()*Math.PI*2,
  sp:0.06+Math.random()*0.09,
  hue:[28,40,205,265,150][i%5]
}));
let tt=0;
function paint(){
  if(analyser){ analyser.getByteFrequencyData(freqData);
    let s=0; for(let i=0;i<24;i++) s+=freqData[i];
    level += ((s/24/255) - level)*0.08;
  } else { level += ((aud.paused?0.12:0.32) - level)*0.04; }
  tt = (tt + 0.0045 * ARTWORK_SPEED) % 10000;
  ctx.clearRect(0,0,W,H);
  ctx.globalCompositeOperation='multiply';
  blobs.forEach(b=>{
    const cx=(b.x + Math.sin(tt*b.sp*6+b.ph)*0.13)*W;
    const cy=(b.y + Math.cos(tt*b.sp*5+b.ph*1.3)*0.13)*H;
    const rad=(b.r*(1+level*0.5))*Math.min(W,H)*ARTWORK_SIZE;
    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,rad);
    const alpha=Math.min(1.0, (0.18+level*0.12)*ARTWORK_STRENGTH);
    g.addColorStop(0,'hsla('+b.hue+',60%,70%,'+alpha+')');
    g.addColorStop(1,'hsla('+b.hue+',60%,70%,0)');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.arc(cx,cy,rad,0,Math.PI*2); ctx.fill();
  });
  ctx.globalCompositeOperation='source-over';
  requestAnimationFrame(paint);
}
paint();

/* ---------- start ---------- */
aud.addEventListener('loadedmetadata',updateBar);
function start(){
  initAudio();
  const p = aud.play();
  if(p&&p.catch) p.catch(()=>{});
  gate.classList.add('hidden');
  setPP(); flashBar();
  requestAnimationFrame(loop);
}
gate.addEventListener('click',start);
addEventListener('keydown',e=>{
  if(e.key===' '){ e.preventDefault(); aud.paused?aud.play():aud.pause(); }
  if(e.key==='ArrowRight') aud.currentTime=Math.min((aud.duration||0),aud.currentTime+5);
  if(e.key==='ArrowLeft')  aud.currentTime=Math.max(0,aud.currentTime-5);
});

/* ---------- attribution overlay triggers ---------- */
const attribution = document.getElementById('attribution');
const closeAttr = document.getElementById('close-attr');

aud.addEventListener('ended', () => {
  attribution.classList.remove('hide');
});

closeAttr.addEventListener('click', () => {
  attribution.classList.add('hide');
});

