// ui/main.js
import { MAX, state, loadState, saveState } from "../core/state.js";
import { HEROES, ITEMS, loadData, placeholder } from "../core/data.js";
import { buildSuggestions } from "../core/logic.js";

const $ = (id) => document.getElementById(id);

// DOM
const slots       = $("slots");
const progressEl  = $("progress");
const btnClear    = $("btnClear");
const search      = $("search");
const clearSearch = $("clearSearch");
const pool        = $("pool");
const suggestPick = $("suggestPick");
const suggestItem = $("suggestItem");
const toastEl     = $("toast");

function toast(msg){
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.style.display = "block";
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> (toastEl.style.display="none"), 1600);
}

/* ========== RENDER ========== */

function renderQueue(){
  slots.innerHTML = "";
  for (let i = 0; i < MAX; i++){
    const w = document.createElement("div");
    const slug = state.enemyQueue[i];
    if (slug){
      const h = HEROES[slug];
      w.className = "slot filled";
      w.innerHTML = `
        <img src="${h?.img || placeholder('HERO')}" alt="${h?.name || 'HERO'}" loading="lazy" />
      `;
      w.title = `${h?.name || ""} — Click to remove`;
      w.onclick = () => {
        state.enemyQueue.splice(i, 1);
        update();
      };
    } else {
      w.className = "slot";
      w.textContent = (i + 1);
    }
    slots.appendChild(w);
  }
  progressEl.textContent = `${state.enemyQueue.length}/${MAX}`;
}

function renderPool(){
  pool.innerHTML = "";
  const term = (search?.value || "").trim().toLowerCase();

  Object.entries(HEROES)
    .filter(([_, h]) => !term || h.name.toLowerCase().includes(term))
    .sort((a, b) => a[1].name.localeCompare(b[1].name))
    .forEach(([slug, h]) => {
      const picked = state.enemyQueue.includes(slug);
      const t = document.createElement("div");
      t.className = "tile" + (picked ? " picked" : "");
      t.innerHTML = `
        <img src="${h.img}" alt="${h.name}" loading="lazy" />
        <div class="tname">${h.name}</div>
        ${picked ? '<div class="badge">PICKED</div>' : ''}
      `;
      t.title = picked ? `${h.name} — Click to remove` : `${h.name} — Click to add`;

      t.onclick = () => {
        const idx = state.enemyQueue.indexOf(slug);
        if (idx >= 0){
          state.enemyQueue.splice(idx, 1);
        } else {
          if (state.enemyQueue.length >= MAX) return toast("You have queued 5 enemies already!");
          state.enemyQueue.push(slug);
        }
        update();
      };

      pool.appendChild(t);
    });
}

function renderSuggestions(){
  const { heroSources, itemSources } = buildSuggestions(state.enemyQueue, HEROES);

  // ===== HEROES YOU SHOULD PICK =====
  const heroList = [...heroSources.keys()]
    .filter(s => HEROES[s])
    .sort((a, b) => HEROES[a].name.localeCompare(HEROES[b].name));

  suggestPick.innerHTML = heroList.length ? "" : `Add heroes to the queue.`;

  heroList.forEach(slug => {
    const h = HEROES[slug];
    const card = document.createElement("div");
    card.className = "sug";
    card.setAttribute("aria-disabled", "true");
    card.innerHTML = `
      <img src="${h.img}" alt="${h.name}" loading="lazy" />
      <div class="sname">${h.name}</div>
    `;

    const srcWrap = document.createElement("div");
    srcWrap.className = "sources";

    // HIỂN THỊ ĐẦY ĐỦ icon nguồn (KỂ CẢ TRÙNG)
    const sources = heroSources.get(slug) || [];
    const visible = Math.min(sources.length, 8);
    for (let i = 0; i < visible; i++){
      const sSlug = sources[i];
      const box = document.createElement("div");
      box.className = "src";
      const srcH = HEROES[sSlug];
      box.innerHTML = `<img src="${srcH?.img || placeholder('HERO')}" alt="${srcH?.name || ''}" loading="lazy" />`;
      srcWrap.appendChild(box);
    }
    if (sources.length > visible){
      const more = document.createElement("div");
      more.className = "src more";
      more.textContent = `+${sources.length - visible}`;
      srcWrap.appendChild(more);
    }

    card.appendChild(srcWrap);
    suggestPick.appendChild(card);
  });

  // ===== ITEMS YOU SHOULD BUY =====
  const itemList = [...itemSources.keys()]
    .sort((a, b) => (ITEMS[a]?.name || a).localeCompare(ITEMS[b]?.name || b));

  suggestItem.innerHTML = itemList.length ? "" : `Add heroes to the queue.`;

  itemList.forEach(key => {
    const meta = ITEMS[key] || { name: key, img: placeholder("ITEM") };
    const card = document.createElement("div");
    card.className = "sug item"; // để CSS áp 88x64
    card.setAttribute("aria-disabled", "true");
    card.innerHTML = `
      <img src="${meta.img || placeholder('ITEM')}" alt="${meta.name}" loading="lazy" />
      <div class="sname">${meta.name}</div>
    `;

    const srcWrap = document.createElement("div");
    srcWrap.className = "sources";

    const sources = itemSources.get(key) || [];
    const visible = Math.min(sources.length, 8);
    for (let i = 0; i < visible; i++){
      const sSlug = sources[i];
      const box = document.createElement("div");
      box.className = "src";
      const srcH = HEROES[sSlug];
      box.innerHTML = `<img src="${srcH?.img || placeholder('HERO')}" alt="${srcH?.name || ''}" loading="lazy" />`;
      srcWrap.appendChild(box);
    }
    if (sources.length > visible){
      const more = document.createElement("div");
      more.className = "src more";
      more.textContent = `+${sources.length - visible}`;
      srcWrap.appendChild(more);
    }

    card.appendChild(srcWrap);
    suggestItem.appendChild(card);
  });
}

function update(){
  renderQueue();
  renderPool();
  renderSuggestions();
  saveState();
}

/* ========== INIT ========== */

btnClear?.addEventListener("click", () => {
  state.enemyQueue = [];
  update();
});

search?.addEventListener("input", () => {
  renderPool();
});

clearSearch?.addEventListener("click", () => {
  if (!search) return;
  search.value = "";
  renderPool();
});

(async function init(){
  loadState();
  await loadData();
  update();
})();
