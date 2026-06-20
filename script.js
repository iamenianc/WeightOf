const LYRIC_OFFSET = 0.0; // Adjust this value to sync lyrics better (positive = delay, negative = advance)
let els = [];
let cur = -1;

function getSection(t) {
  if (t >= 168.580 && t < 195.140) return 'b'; // bridge
  if ((t >= 62.580 && t < 97.600) || (t >= 124.120 && t < 168.580) || t >= 195.140) return 'c'; // chorus
  return 'v'; // verse
}

const LYRIC_SHEET = [
  "he carried our sins",
  "on that rugged tree",
  "to win our pardon",
  "and our victory",
  "in jars of clay",
  "we carry the news",
  "Christ is risen",
  "Grace has broken through",
  "No condemnation now",
  "is ours to dread",
  "by your word",
  "the faintest soul is fed",
  "We have believed",
  "and so we loudly speak",
  "the name of Jesus",
  "Strength unto the weak",
  
  // Chorus 1
  "We do not Hope",
  "in what is seen",
  "but cling to Christ",
  "our certainty",
  "the weight of glory",
  "yet to come",
  "it's the song",
  "of heaven",
  "now begun",
  "it's the song",
  "of heaven",
  "now begun",
  
  "A new life we live",
  "by his mighty hand",
  "Through every grief",
  "to the promised Land",
  "The Spirit's here",
  "he knows our needs",
  "and from his throne",
  "our saviour intercedes",
  
  // Chorus 2
  "We do not Hope",
  "in what is seen",
  "but cling to Christ",
  "our certainty",
  "the weight of glory",
  "yet to come",
  "it's the song",
  "of heaven",
  "now begun",
  "it's the song",
  "of heaven",
  "now begun",
  
  "Beyond the reach",
  "of mortal sight",
  "yet clearer still",
  "than brightest light",
  "in every trial",
  "and every fall",
  "the hope of glory",
  "outweighs them all",
  
  // Chorus 3
  "We do not Hope",
  "in what is seen",
  "but cling to Christ",
  "our certainty",
  "the weight of glory",
  "yet to come",
  "it's the song",
  "of heaven",
  "now begun",
  
  // Chorus 4
  "We do not Hope",
  "in what is seen",
  "but cling to Christ",
  "our certainty",
  "the weight of glory",
  "yet to come",
  "it's the song",
  "of heaven",
  "now begun",
  "it's the song",
  "of heaven",
  "now begun"
];

function processWords(rawWords) {
  const filtered = rawWords.filter(w => {
    const clean = w.word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()…?"']/g,"").trim();
    return clean !== 'music' && clean !== 'hmm';
  });

  const lines = [];
  let wordIdx = 0;

  for (const sheetLine of LYRIC_SHEET) {
    const sheetWords = sheetLine.split(/\s+/).filter(Boolean);
    if (wordIdx >= filtered.length) break;

    const group = filtered.slice(wordIdx, wordIdx + sheetWords.length);
    wordIdx += sheetWords.length;

    if (group.length === 0) continue;

    const text = group.map(w => w.word).join(' ');
    const t = group[0].start;
    const sec = getSection(t);

    lines.push({
      t,
      text,
      sec,
      words: group
    });
  }
  return lines;
}

const aud   = document.getElementById('aud');
const stage = document.getElementById('stage');
const gate  = document.getElementById('gate');
const bar   = document.getElementById('bar');
const pp    = document.getElementById('pp');
const timeEl= document.getElementById('time');
const seek  = document.getElementById('seek');
const fill  = document.getElementById('fill');
const knob  = document.getElementById('knob');

async function initTranscript() {
  try {
    const response = await fetch('Lyrics/weight_transcript.json');
    const data = await response.json();
    const processed = processWords(data.words);

    els = processed.map((L) => {
      const { t, text, sec, words } = L;
      const div = document.createElement('div');
      div.className = 'line ' + sec;

      words.forEach((wObj, wi) => {
        const s = document.createElement('span');
        s.className = 'word';
        s.textContent = wObj.word;
        s.style.transitionDelay = (wi * 0.085) + 's';

        const cleanWord = wObj.word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()…?"']/g,"");
        if (cleanWord === 'hope' || cleanWord === 'seen' || cleanWord === 'see' || cleanWord === 'christ' || cleanWord === 'glory' || cleanWord === 'certainty') {
          s.classList.add('emphasis');
        }

        div.appendChild(s);
        if (wi < words.length - 1) {
          div.appendChild(document.createTextNode(' '));
        }
      });

      stage.appendChild(div);
      return {
        t,
        el: div,
        words: [...div.querySelectorAll('.word')],
        wordData: words
      };
    });

    updateBar();
    attemptAutoplay();
  } catch (e) {
    console.error('Error loading transcript:', e);
  }
}

initTranscript();

function showLine(i){ els[i].el.classList.remove('out'); els[i].words.forEach(w=>w.classList.add('in')); }
function hideLine(i){ els[i].el.classList.add('out'); els[i].words.forEach(w=>w.classList.remove('in')); }

/* recompute which line should be visible for an arbitrary time (handles seeking) */
function syncLines(force){
  const t = aud.currentTime + LYRIC_OFFSET;
  let idx=-1;
  for(let i=0;i<els.length;i++){ if(els[i].t<=t) idx=i; else break; }
  
  if (idx !== -1) {
    const lineStart = els[idx].t;
    const nextLineStart = (idx < els.length - 1) ? els[idx+1].t : Infinity;
    const duration = nextLineStart - lineStart;
    const cappedDuration = Math.min(duration, 6.0);
    
    if (t > lineStart + cappedDuration) {
      idx = -1;
    }
  }

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
  if(!aud.paused) {
    syncLines(false);
    if (aud.duration && aud.currentTime >= aud.duration - 5.0) {
      attribution.classList.remove('hide');
    }
  }
  updateBar();
  requestAnimationFrame(loop);
}

/* ---------- abstract generative art ---------- */
const ARTWORK_STRENGTH = 2.1; // Adjusts the opacity/strength of the colored artwork (1.0 = default, 2.0 = stronger, 0.5 = weaker)
const ARTWORK_SIZE     = 1.5; // Adjusts the diameter/size of the colored blobs (1.0 = default, 1.5 = larger, 0.7 = smaller)
const ARTWORK_SPEED    = 3.1; // Adjusts the speed of the blob movement animation (1.0 = default, 2.0 = double speed, 0.5 = half speed)
const cv = document.getElementById('art');
const ctx = cv.getContext('2d');
let W,H,DPR;
function resize(){ DPR=Math.min(devicePixelRatio||1,2); W=cv.width=innerWidth*DPR; H=cv.height=innerHeight*DPR; cv.style.width=innerWidth+'px'; cv.style.height=innerHeight+'px'; }
resize(); addEventListener('resize',resize);

let analyser, freqData, level=0, AC;
function initAudio(){
  if (analyser) return;
  try{
    AC = new (window.AudioContext||window.webkitAudioContext)();
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
let started = false;
function start(){
  if(started) return;
  started = true;
  initAudio();
  if(AC && AC.state === 'suspended') AC.resume();
  const p = aud.play();
  if(p&&p.catch) p.catch(()=>{});
  gate.classList.add('hidden');
  setPP(); flashBar();
  requestAnimationFrame(loop);
}
async function attemptAutoplay() {
  initAudio();
  try {
    await aud.play();
    start();
  } catch(e) {
    console.log("Autoplay blocked, waiting for click.", e);
  }
}
gate.addEventListener('click',start);
addEventListener('keydown',e=>{
  if(e.key===' '){ e.preventDefault(); aud.paused?aud.play():aud.pause(); }
  if(e.key==='ArrowRight') aud.currentTime=Math.min((aud.duration||0),aud.currentTime+5);
  if(e.key==='ArrowLeft')  aud.currentTime=Math.max(0,aud.currentTime-5);
});

/* ---------- attribution overlay triggers ---------- */
const attribution = document.getElementById('attribution');

aud.addEventListener('ended', () => {
  attribution.classList.remove('hide');
});

