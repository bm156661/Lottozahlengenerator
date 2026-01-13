import initWasm from './wasm-loader.js';

const drawBtn = document.getElementById('drawBtn');
const pool = document.getElementById('ball-pool');
const historyList = document.getElementById('history');
const slots = Array.from(document.querySelectorAll('.slot'));

let wasm = null;

async function init() {
  wasm = await initWasm();
  renderBalls();
  loadHistory();
}

function renderBalls() {
  pool.innerHTML = '';
  for (let i = 1; i <= 49; i++) {
    const b = document.createElement('div');
    b.className = 'ball';
    b.id = `ball-${i}`;
    b.textContent = i;
    pool.appendChild(b);
  }
}

function showHistory() {
  historyList.innerHTML = '';
  const hist = JSON.parse(localStorage.getItem('lotto_history') || '[]');
  hist.slice().reverse().forEach(h => {
    const li = document.createElement('li');
    li.textContent = h.join(', ');
    historyList.appendChild(li);
  });
}

function saveToHistory(combo) {
  const hist = JSON.parse(localStorage.getItem('lotto_history') || '[]');
  hist.push(combo);
  localStorage.setItem('lotto_history', JSON.stringify(hist));
  showHistory();
}

function resetSlots() {
  slots.forEach(s => { s.textContent = ''; s.classList.remove('active'); });
  document.querySelectorAll('.ball').forEach(b => b.classList.remove('picked'));
}

function animateDraw(numbers) {
  resetSlots();
  numbers.forEach((num, idx) => {
    setTimeout(()=>{
      const ball = document.getElementById(`ball-${num}`);
      ball.classList.add('picked');
      const slot = slots[idx];
      slot.classList.add('active');
      slot.textContent = num;
      if (idx === numbers.length -1) {
        saveToHistory(numbers);
      }
    }, idx * 900);
  });
}

function fallbackGenerate() {
  // JS fallback, uses Fisher-Yates shuffle + simple heuristics identical to WASM
  const nums = Array.from({length:49},(_,i)=>i+1);

  function shuffle(a){
    for(let i=a.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];
    }
  }
  function acceptable(a){
    a = a.slice().sort((x,y)=>x-y);
    // consecutive run
    let run=1;
    for(let i=1;i<a.length;i++){ if(a[i]==a[i-1]+1) run++; else run=1; if(run>=4) return false; }
    // birthdays
    if(a.filter(x=>x<=31).length>=5) return false;
    // arithmetic progression check (basic)
    for(let i=0;i<a.length;i++) for(let j=i+1;j<a.length;j++){
      const diff=(a[j]-a[i])/(j-i);
      if(!Number.isInteger(diff)) continue; let len=2; let last=a[j];
      for(let k=j+1;k<a.length;k++){ if(a[k]-last==diff){ len++; last=a[k]; } }
      if(len>=4) return false;
    }
    return true;
  }
  let pick=[];
  for(let t=0;t<200;t++){
    shuffle(nums);
    const cand = nums.slice(0,6).sort((a,b)=>a-b);
    if(acceptable(cand)) return cand;
    pick = cand;
  }
  return pick;
}

async function doDraw() {
  drawBtn.disabled = true;
  drawBtn.textContent = 'Ziehung läuft…';
  let numbers;
  try {
    if (wasm && wasm.generate_lotto) {
      const res = wasm.generate_lotto();
      // wasm returns Uint8Array
      numbers = Array.from(res);
    } else {
      numbers = fallbackGenerate();
    }
  } catch (e) {
    console.error(e);
    numbers = fallbackGenerate();
  }
  animateDraw(numbers);
  setTimeout(()=>{ drawBtn.disabled=false; drawBtn.textContent='Ziehung starten'; }, numbers.length * 900 + 300);
}

// Expose a global fallback so inline onclick works even if module listeners fail
window.startDraw = function() {
  try {
    console.log('startDraw called');
    if (!drawBtn) { console.warn('Button nicht gefunden'); showOverlay('Button nicht gefunden', 1800); return; }
    if (drawBtn.disabled) { showOverlay('Ziehung läuft bereits…', 800); return; }
    // immediate visual feedback
    drawBtn.disabled = true;
    drawBtn.textContent = 'Ziehung läuft…';
    showOverlay('Ziehung gestartet…', 1200);
    doDraw();
  } catch (e) {
    console.error('startDraw error', e);
    showOverlay('Fehler beim Starten', 2200);
  }
};

// Global error handler to make client-side errors visible
window.addEventListener('error', (ev) => {
  console.error('Global error', ev.error || ev.message || ev);
  try { showOverlay('Fehler: ' + (ev.error?.message || ev.message || 'unknown'), 3000); } catch {};
});

// Debug logs for doDraw
const _origDoDraw = doDraw;
async function doDrawLogged() {
  console.log('doDraw start');
  await _origDoDraw();
  console.log('doDraw end');
}
// replace reference
window._doDrawLogged = doDrawLogged;


function loadHistory(){ showHistory(); }

// Auto-start draw if URL includes ?auto=1 or ?draw=1
async function init() {
  wasm = await initWasm();
  renderBalls();
  loadHistory();

  // Setup "open in new tab" button
  const openBtn = document.getElementById('openBtn');
  if (openBtn) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const url = window.location.origin + window.location.pathname + '?auto=1';
      try { window.open(url, '_blank', 'noopener'); showOverlay('Öffne neuen Tab…', 1200); }
      catch (e) { window.location.href = url; }
    });
  }

  // Detect Codespaces / editor embed and show a helpful banner
  const isCodespaceHost = location.host.includes('github.dev') || location.host.includes('app.github.dev') || navigator.userAgent.toLowerCase().includes('codespaces');
  if (isCodespaceHost) {
    const b = document.getElementById('codespace-banner');
    if (b) b.style.display = 'block';
    if (openBtn) openBtn.style.display = 'inline-block';
  }

  // Auto-start draw if URL includes ?auto=1 or ?draw=1
  const params = new URLSearchParams(window.location.search);
  if (params.get('auto') === '1' || params.get('draw') === '1') {
    setTimeout(doDraw, 400);
  }
}

// Intercept F5 / Ctrl+R / Cmd+R to trigger a draw or open generator
function showOverlay(msg, ms = 900) {
  let o = document.getElementById('feedback-overlay');
  if (!o) {
    o = document.createElement('div');
    o.id = 'feedback-overlay';
    document.body.appendChild(o);
  }
  o.textContent = msg;
  o.classList.add('visible');
  setTimeout(() => o.classList.remove('visible'), ms);
}

window.addEventListener('keydown', (e) => {
  const key = e.key;
  if (key === 'F5' || (e.ctrlKey && key.toLowerCase() === 'r') || (e.metaKey && key.toLowerCase() === 'r')) {
    e.preventDefault();
    const isIndex = location.pathname.endsWith('/') || location.pathname.endsWith('index.html') || location.pathname === '';
    if (isIndex) {
      showOverlay('Ziehung gestartet…', 1200);
      if (!drawBtn.disabled) doDraw();
    } else {
      // navigate to index with auto param to open generator
      const base = location.pathname.replace(/\/[^\/]*$/, '/') || '/';
      window.location.href = base + '?auto=1';
    }
  }
});

drawBtn.addEventListener('click', doDraw);

init();
