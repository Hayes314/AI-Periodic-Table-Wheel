const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const CW = canvas.width, CH = canvas.height;
const CX = CW/2, CY = CH/2, R = CW/2 - 18;

let rotation = 0;
let spinning = false;
let currentLang = 'zh-Hant';
let currentResultNum = null;

const COLORS = ELEMENTS.map(e=>e.color);
const N = 118;

function shadeColor(hex, factor){
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  const f = Math.min(1, Math.max(0, factor));
  return `rgb(${Math.round(r*f)},${Math.round(g*f)},${Math.round(b*f)})`;
}

function drawWheel(){
  ctx.clearRect(0,0,CW,CH);
  const seg = (Math.PI*2)/N;

  for(let i=0;i<N;i++){
    const start = i*seg + rotation;
    const end = start + seg;
    ctx.beginPath();
    ctx.moveTo(CX,CY);
    ctx.arc(CX,CY,R,start,end);
    ctx.closePath();
    const base = COLORS[i];
    ctx.fillStyle = shadeColor(base, i%2===0 ? 0.55 : 0.38);
    ctx.fill();
    ctx.strokeStyle = 'rgba(10,14,23,.55)';
    ctx.lineWidth = 0.7;
    ctx.stroke();

    const mid = start + seg/2;
    ctx.save();
    ctx.translate(CX,CY);
    ctx.rotate(mid);
    const textR = R - 8;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 15px "Segoe UI",sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.fillText(ELEMENTS[i].sym, textR - 22, 0);
    ctx.font = '10px "Segoe UI",sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.fillText(ELEMENTS[i].num, textR - 2, 0);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(CX,CY,R+6,0,Math.PI*2);
  ctx.strokeStyle = 'rgba(34,211,238,.25)';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function spin(){
  if(spinning) return;
  spinning = true;
  const btn = document.getElementById('spinBtn');
  btn.disabled = true;
  document.getElementById('wheelStatus').textContent = I18N[currentLang].spinning;

  let targetNum;
  if(window.crypto && window.crypto.getRandomValues){
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    targetNum = (arr[0] % 118) + 1;
  }else{
    targetNum = Math.floor(Math.random()*118)+1;
  }

  const seg = (Math.PI*2)/N;
  const targetCenter = (targetNum-1)*seg + seg/2;
  const pointerAngle = -Math.PI/2;
  const baseRotation = pointerAngle - targetCenter;
  const extraTurns = 8 + Math.floor(Math.random()*5);
  const finalRotation = baseRotation + extraTurns*Math.PI*2 + (Math.random()-0.5)*seg*0.25;

  const startRotation = rotation;
  const delta = finalRotation - startRotation;
  const duration = 4200 + Math.random()*800;
  const t0 = performance.now();

  function easeOutCubic(t){ return 1 - Math.pow(1-t,3); }

  function step(now){
    const elapsed = now - t0;
    const p = Math.min(1, elapsed/duration);
    const eased = easeOutCubic(p);
    rotation = startRotation + delta*eased;
    drawWheel();
    if(p < 1){
      requestAnimationFrame(step);
    }else{
      rotation = finalRotation % (Math.PI*2);
      drawWheel();
      spinning = false;
      btn.disabled = false;
      document.getElementById('wheelStatus').textContent = '';
      setTimeout(()=>{ showDetail(targetNum); }, 450);
    }
  }
  requestAnimationFrame(step);
}

function showDetail(num){
  currentResultNum = num;
  const el = byNum.get(num);
  
  const langKey = currentLang === 'zh-Hant' ? 'z' : (currentLang === 'zh-Hans' ? 'h' : 'e');
  const t = I18N[currentLang];
  const detail = DETAILS[num][langKey];
  
  const name = currentLang==='zh-Hant' ? el.zhHant : currentLang==='zh-Hans' ? el.zhHans : el.en;
  const otherName = currentLang==='en' ? el.zhHant : el.en;
  const massStr = Array.isArray(el.mass) ? `[${el.mass[0]}]` : el.mass;
  const catName = currentLang==='en' ? (CAT_EN[el.cat]||el.cat) : el.cat;

  const GAS_SYMS = ['H','He','N','O','F','Ne','Cl','Ar','Kr','Xe','Rn'];
  const LIQUID_SYMS = ['Hg','Br'];
  let stateText = '';
  if(GAS_SYMS.includes(el.sym)) stateText = currentLang==='en'?'Gas':(currentLang==='zh-Hant'?'氣態':'气态');
  else if(LIQUID_SYMS.includes(el.sym)) stateText = currentLang==='en'?'Liquid':(currentLang==='zh-Hant'?'液態':'液态');
  else stateText = currentLang==='en'?'Solid':(currentLang==='zh-Hant'?'固態':'固态');

  let compText = t.noCompounds;
  const c = COMPOUNDS[num];
  if(c && c[currentLang]) compText = c[currentLang];

  let historyText = '';
  if(currentLang==='en'){
    historyText = el.discovery === '古代' ? 'Known since ancient times.' : `Discovered in ${el.discovery.split('·')[0]} by ${el.discovery.split('·')[1]||'unknown'}.`;
  }else if(currentLang==='zh-Hans'){
    historyText = el.discovery === '古代' ? '自古已知。' : `${el.discovery.split('·')[0]}年，由${el.discovery.split('·')[1]||'未知'}发现。`;
  }else{
    historyText = el.discovery === '古代' ? '自古已知。' : `${el.discovery.split('·')[0]}年，由${el.discovery.split('·')[1]||'未知'}發現。`;
  }

  const html = `
    <div class="detail-top">
      <div class="element-hero">
        <div class="element-badge" style="background:linear-gradient(135deg,${el.color}44,${el.color}22); border:1px solid ${el.color}66;">
          <div class="num">${el.num}</div>
          <div class="sym" style="color:${el.color}">${el.sym}</div>
        </div>
        <div class="element-name-block">
          <h2>${name}</h2>
          <div class="en">${otherName} · ${el.sym}</div>
          <div class="element-tags">
            <span class="tag" style="border-color:${el.color}55; color:${el.color}; background:${el.color}12;">${catName}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card"><div class="label">${t.number}</div><div class="value">${el.num}</div></div>
      <div class="stat-card"><div class="label">${t.atomicMass}</div><div class="value">${massStr} <small>g/mol</small></div></div>
      <div class="stat-card"><div class="label">${t.category}</div><div class="value" style="font-size:14px;">${catName}</div></div>
      <div class="stat-card"><div class="label">${t.discovery}</div><div class="value" style="font-size:14px;">${el.discovery}</div></div>
    </div>

    <div class="section-block">
      <h3>◈ ${t.physicalTitle}</h3>
      <div class="bullet"><span class="dot">•</span><span><b>${t.stateLabel}：</b>${stateText}</span></div>
      <div class="bullet"><span class="dot">•</span><span><b>${t.appearanceLabel}：</b>${detail.a}</span></div>
    </div>

    <div class="section-block">
      <h3>◈ ${t.chemistryTitle}</h3>
      <p>${detail.c}</p>
    </div>

    <div class="section-block">
      <h3>◈ ${t.occurrenceTitle}</h3>
      <div class="mini-label">${t.distributionLabel}</div>
      <p>${detail.o}</p>
      <div class="mini-label" style="margin-top:12px;">${t.usesLabel}</div>
      <p>${detail.u}</p>
    </div>

    <div class="section-block">
      <h3>◈ ${t.factTitle}</h3>
      <p>${detail.f}</p>
    </div>

    <div class="section-block">
      <h3>◈ ${t.historyTitle}</h3>
      <p>${historyText}</p>
    </div>

    <div class="section-block">
      <h3>◈ ${t.compoundsTitle}</h3>
      <p>${compText}</p>
    </div>

    <div class="danger-block">
      <h3>☠ ${t.safetyTitle}</h3>
      <p><span class="warn-label">${t.safetyWarn}</span>${detail.s}</p>
    </div>

    <button class="again-btn" id="againBtn">${t.again}</button>
  `;

  document.getElementById('detailContent').innerHTML = html;
  
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('detailPage').classList.add('active');
  document.getElementById('detailPage').scrollTop = 0;
  document.getElementById('langBar').style.display = 'none';

  document.getElementById('againBtn').addEventListener('click', ()=>{
    document.getElementById('detailPage').classList.remove('active');
    document.getElementById('wheelPage').classList.add('active');
    document.getElementById('langBar').style.display = '';
    document.getElementById('wheelPage').scrollTop = 0;
  });
}

function applyLanguage(lang){
  currentLang = lang;
  const t = I18N[lang];
  document.getElementById('i18nTitle').textContent = t.title;
  document.getElementById('i18nSubtitle').textContent = t.subtitle;
  document.getElementById('i18nHint').textContent = t.hint;
  document.getElementById('startBtn').textContent = t.start;
  document.getElementById('spinBtn').textContent = t.spin;
  document.querySelectorAll('#langBar button').forEach(b=>{
    b.classList.toggle('active', b.dataset.lang === lang);
  });
  if(currentResultNum && document.getElementById('detailPage').classList.contains('active')){
    showDetail(currentResultNum);
  }
}

document.getElementById('langBar').addEventListener('click', e=>{
  const btn = e.target.closest('button');
  if(!btn) return;
  applyLanguage(btn.dataset.lang);
});

document.getElementById('startBtn').addEventListener('click', ()=>{
  document.getElementById('startPage').classList.remove('active');
  document.getElementById('wheelPage').classList.add('active');
  drawWheel();
});

document.getElementById('spinBtn').addEventListener('click', spin);
document.getElementById('wheelWrap').addEventListener('click', ()=>{
  if(!document.getElementById('wheelPage').classList.contains('active')) return;
  if(spinning) return;
  spin();
});

applyLanguage('zh-Hant');
drawWheel();
