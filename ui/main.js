// ===== data.js =====
let HEROES = {};
let ITEMS  = {};

const heroImg = (slug) => `./assets/heroes/${slug}.png`;
const itemImg = (slug) => `./assets/items/${slug}.png`;

async function loadData() {
  try {
    const [heroes, items] = await Promise.all([
      fetch('./heroes.json?v=' + Date.now()).then(r => r.json()),
      fetch('./items.json?v=' + Date.now()).then(r => r.json()).catch(() => ({}))
    ]);
    Object.keys(heroes).forEach(slug => { heroes[slug].img = heroImg(slug); });
    Object.keys(items).forEach(slug  => { items[slug].img  = itemImg(slug); });
    HEROES = heroes; ITEMS = items;
  } catch(e){ console.error(e); HEROES={}; ITEMS={}; }
}

function itemSlug(name){ return name.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''); }
function placeholder(label){
  const t=label||'HERO';
  return 'data:image/svg+xml;utf8,'+encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#223047"/><stop offset="1" stop-color="#0f1722"/></linearGradient></defs>
      <rect fill="url(#g)" width="400" height="240"/>
      <text x="20" y="210" fill="#cfe1ff" font-family="system-ui,Segoe UI,Roboto" font-size="26" font-weight="700">${t}</text>
     </svg>`
  );
}

// ===== state.js =====
const MAX = 5;
let state = { enemyQueue: [] };
function loadState(){
  try{ state.enemyQueue = JSON.parse(localStorage.getItem('enemyQueue')||'[]'); }
  catch{ state.enemyQueue=[]; }
}
function saveState(){ localStorage.setItem('enemyQueue', JSON.stringify(state.enemyQueue)); }

// ===== logic.js =====
function buildSuggestions(enemyQueue, HEROES){
  const heroSources=new Map(), itemSources=new Map();
  enemyQueue.forEach(eSlug=>{
    const enemy=HEROES[eSlug];
    (enemy?.counters||[]).forEach(sug=>{
      if(enemyQueue.includes(sug))return;
      if(!heroSources.has(sug))heroSources.set(sug,new Set());
      heroSources.get(sug).add(eSlug);
    });
    (enemy?.item_counters||[]).forEach(it=>{
      const key=itemSlug(it);
      if(!itemSources.has(key))itemSources.set(key,new Set());
      itemSources.get(key).add(eSlug);
    });
  });
  return {heroSources,itemSources};
}

// ===== main.js core =====
const $ = (id)=>document.getElementById(id);
const slots=$("slots"),progress=$("progress"),btnClear=$("btnClear"),search=$("search"),
      clearSearch=$("clearSearch"),pool=$("pool"),suggestPick=$("suggestPick"),
      suggestItem=$("suggestItem"),toastEl=$("toast");

function toast(msg){
  toastEl.textContent=msg;
  toastEl.style.display="block";
  clearTimeout(toast._t);
  toast._t=setTimeout(()=>toastEl.style.display="none",1800);
}

function renderQueue(){
  slots.innerHTML="";
  for(let i=0;i<MAX;i++){
    const s=document.createElement("div");
    const slug=state.enemyQueue[i];
    if(slug){
      s.className="slot filled";
      const img=new Image();
      img.src=HEROES[slug]?.img||placeholder("HERO");
      img.alt=HEROES[slug]?.name||"";
      s.title=(HEROES[slug]?.name||"")+" — click to remove";
      s.onclick=()=>{state.enemyQueue.splice(i,1);update();};
      s.appendChild(img);
    }else{s.className="slot";s.textContent=i+1;}
    slots.appendChild(s);
  }
  progress.textContent=`${state.enemyQueue.length}/${MAX}`;
}

function renderPool(){
  pool.innerHTML="";
  const term=(search?.value||"").trim().toLowerCase();
  Object.entries(HEROES)
    .filter(([_,h])=>!term||h.name.toLowerCase().includes(term))
    .sort((a,b)=>a[1].name.localeCompare(b[1].name))
    .forEach(([slug,h])=>{
      const picked=state.enemyQueue.includes(slug);
      const t=document.createElement("div");
      t.className="tile"+(picked?" picked":"");
      t.innerHTML=`<img src="${h.img||placeholder('HERO')}" alt="${h.name}">
                   <div class="tname">${h.name}</div>
                   ${picked?'<div class="badge">PICKED</div>':''}`;
      t.onclick=()=>{
        const idx=state.enemyQueue.indexOf(slug);
        if(idx>=0)state.enemyQueue.splice(idx,1);
        else if(state.enemyQueue.length<MAX)state.enemyQueue.push(slug);
        else toast("You have queued 5 enemies already!");
        update();
      };
      pool.appendChild(t);
    });
}

function renderSuggestions(){
  const {heroSources,itemSources}=buildSuggestions(state.enemyQueue,HEROES);

  const heroList=[...heroSources.keys()].filter(s=>HEROES[s])
    .sort((a,b)=>HEROES[a].name.localeCompare(HEROES[b].name));
  suggestPick.innerHTML=heroList.length?"":`<span style="color:var(--muted)">Add heroes to the queue.</span>`;
  heroList.forEach(slug=>{
    const h=HEROES[slug];
    const e=document.createElement("div");
    e.className="sug"; e.innerHTML=`<img src="${h.img||placeholder('HERO')}" alt="${h.name}">
                                     <div class="sname">${h.name}</div>`;
    const srcWrap=document.createElement("div");srcWrap.className="sources";
    const sources=[...(heroSources.get(slug)||[])];
    sources.slice(0,4).forEach(slg=>{
      const box=document.createElement("div");box.className="src";
      box.innerHTML=`<img src="${HEROES[slg]?.img||placeholder('H')}" alt="${HEROES[slg]?.name||''}">`;
      srcWrap.appendChild(box);
    });
    if(sources.length>4){
      const more=document.createElement("div");more.className="src more";
      more.textContent=`+${sources.length-4}`;srcWrap.appendChild(more);
    }
    e.appendChild(srcWrap);suggestPick.appendChild(e);
  });

  const itemList=[...itemSources.keys()].sort((a,b)=>(ITEMS[a]?.name||a).localeCompare(ITEMS[b]?.name||b));
  suggestItem.innerHTML=itemList.length?"":`<span style="color:var(--muted)">Add heroes to the queue.</span>`;
  itemList.forEach(key=>{
    const meta=ITEMS[key]||{name:key,img:placeholder("ITEM")};
    const e=document.createElement("div");
    e.className="sug";
    e.innerHTML=`<img src="${meta.img}" alt="${meta.name}">
                 <div class="sname">${meta.name}</div>`;
    const srcWrap=document.createElement("div");srcWrap.className="sources";
    const sources=[...(itemSources.get(key)||[])];
    sources.slice(0,4).forEach(slg=>{
      const box=document.createElement("div");box.className="src";
      box.innerHTML=`<img src="${HEROES[slg]?.img||placeholder('H')}" alt="${HEROES[slg]?.name||''}">`;
      srcWrap.appendChild(box);
    });
    if(sources.length>4){
      const more=document.createElement("div");more.className="src more";
      more.textContent=`+${sources.length-4}`;srcWrap.appendChild(more);
    }
    e.appendChild(srcWrap);suggestItem.appendChild(e);
  });
}

function update(){ renderQueue(); renderPool(); renderSuggestions(); saveState(); }

btnClear.addEventListener("click",()=>{state.enemyQueue=[];update();});
search.addEventListener("input",()=>renderPool());
clearSearch.addEventListener("click",()=>{search.value="";renderPool();});

(async function init(){ loadState(); await loadData(); update(); })();
