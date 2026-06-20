const LINES = [
  [11.340, "He carried our sins on that rugged tree", "v"],
  [18.660, "To win our pardon and our victory", "v"],
  [24.080, "In jars of clay we carry the news", "v"],
  [30.720, "Christ is risen, grace has broken through", "v"],
  [37.320, "No condemnation now is ours to dread", "v"],
  [44.080, "By Your Word the faintest soul is fed", "v"],
  [49.620, "We have believed and so we loudly speak", "v"],
  [56.380, "The name of Jesus strength unto the weak", "v"],
  [62.580, "We do not hope in what is seen", "c"],
  [69.180, "But cling to Christ our certainty", "c"],
  [75.040, "The weight of glory yet to come", "c"],
  [81.740, "It's the song of heaven now begun", "c"],
  [88.160, "It's the song of heaven now begun", "c"],
  [97.600, "A new life we live by His mighty hand", "v"],
  [104.240, "Through every grief to the promised land", "v"],
  [110.820, "The Spirit's here, He knows our needs", "v"],
  [117.280, "And from His throne our Savior intercedes", "v"],
  [124.120, "We do not hope in what is seen", "c"],
  [129.940, "But cling to Christ our certainty", "c"],
  [135.800, "The weight of glory yet to come", "c"],
  [142.740, "It's the song of heaven now begun", "c"],
  [148.700, "It's the song of heaven now begun", "c"],
  [168.580, "Beyond the reach of mortal sight", "b"],
  [174.780, "Yet clearer still than brightest light", "b"],
  [181.940, "In every trial and every fall", "b"],
  [187.780, "The hope of glory outweighs them all", "b"],
  [195.140, "We do not hope in what is seen", "c"],
  [200.640, "But cling to Christ our certainty", "c"],
  [206.340, "The weight of glory yet to come", "c"],
  [213.200, "It's the song of heaven now begun", "c"],
  [219.380, "We do not hope in what is seen", "c"],
  [226.160, "But cling to Christ our certainty", "c"],
  [231.880, "The weight of glory yet to come", "c"],
  [238.460, "It's the song of heaven now begun", "c"],
  [244.660, "It's the song of heaven now begun", "c"]
];
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
    
    // Check for emphasis words (hope, seen, see) ignoring punctuation and case
    const cleanWord = w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()…?"']/g,"");
    if (cleanWord === 'hope' || cleanWord === 'seen' || cleanWord === 'see') {
      s.classList.add('emphasis');
    }
    
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
    els.forEach((o,i)=>{
      if(i===idx) {
        showLine(i);
      } else if (i === cur) {
        hideLine(i);
      } else {
        o.el.classList.remove('out');
        o.words.forEach(w=>w.classList.remove('in'));
      }
    });
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
const ARTWORK_SIZE     = 1.1; // Adjusts the diameter/size of the colored blobs (1.0 = default, 1.5 = larger, 0.7 = smaller)
const ARTWORK_SPEED    = 4.0; // Adjusts the speed of the blob movement animation (1.0 = default, 2.0 = double speed, 0.5 = half speed)
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
  tt = (tt + 0.0045 * ARTWORK_SPEED + 10000) % 10000;
  ctx.clearRect(0,0,W,H);
  ctx.globalCompositeOperation='multiply';
  blobs.forEach(b=>{
    const cx=(b.x + Math.sin(tt*b.sp*6+b.ph)*0.13)*W;
    const cy=(b.y + Math.cos(tt*b.sp*5+b.ph*1.3)*0.13)*H;
    const rad=Math.max(0, (b.r*(1+level*0.5))*Math.min(W,H)*ARTWORK_SIZE);
    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,rad);
    const alpha=Math.max(0.0, Math.min(1.0, (0.18+level*0.12)*ARTWORK_STRENGTH));
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

