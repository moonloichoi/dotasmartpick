// ui/main.js
// Giữ NGUYÊN layout & class name gốc, chỉ xử lý render + inline style tỉ lệ ảnh,
// nguồn trùng, hover nhẹ, và cập nhật suggestion ngay khi pick/unpick.

import { MAX, state, loadState, saveState } from "../core/state.js";
import { HEROES, ITEMS, loadData, placeholder } from "../core/data.js";
import { buildSuggestions } from "../core/logic.js";

const $ = (id) => document.getElementById(id);

// DOM refs (ID giữ nguyên như bản gốc)
const slots       = $("slots");
const progress    = $("progress");
const btnClear    = $("btnClear");
const search      = $("search");
const clearSearch = $("clearSearch");
const pool        = $("pool");
const suggestPick = $("suggestPick");
const suggestItem = $("suggestItem");
const toastEl     = $("toast");

// toast nhỏ (không đổi layout)
function toast(msg){
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.style.display = "block";
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> (toastEl.style.display="none"), 1500);
}

/* ---------- RENDER ---------- */

function renderQueue(){
  if (!slots) return;
  slots.innerHTML = "";
  for (let i = 0; i < MAX; i++){
    const wrap = document.createElement("div");
    const slug = state.enemyQueue[i];
    if (slug){
      const h = HEROES[slug];
      wrap.className = "slot filled";
      const img = document.createElement("img");
      img.src = h?.img || placeholder("HERO");
      img.alt = h?.name || "HERO";

      // đảm bảo đúng tỉ lệ 16:9, không méo (inline, không đụng CSS gốc)
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      wrap.appendChild(img);

      // click để remove
      wrap.title = `${h?.name || ""} — click to remove`;
      wrap.onclick = () => {
        state.enemyQueue.splice(i, 1);
        update();
      };
    } else {
      wrap.className = "slot";
      wrap.textContent = (i + 1);
    }
    slots.appendChild(wrap);
  }
  if (progress) progress.textContent = `${state.enemyQueue.length}/${MAX}`;
}

function attachTileHover(el){
  // hover nhẹ  (không cần CSS)
  el.style.transition = "transform .12s ease";
  el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.03)"; });
  el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });
}

function renderPool(){
  if (!pool) return;
  pool.innerHTML = "";
  const term = (search?.value || "").trim().toLowerCase();

  Object.entries(HEROES)
    .filter(([_, h]) => !term || h.name.toLowerCase().includes(term))
    .sort((a, b) => a[1].name.localeCompare(b[1].name))
    .forEach(([slug, h]) => {
      const picked = state.enemyQueue.includes(slug);

      const t = document.createElement("div");
      t.className = "tile" + (picked ? " picked" : "");
      attachTileHover(t);

      // hero thumb 16:9
      const im = document.createElement("img");
      im.src = h.img;
      im.alt = h.name;
      im.loading = "lazy";
      im.style.width = "100%";
      im.style.height = "100%";
      im.style.objectFit = "cover";

      const nm = document.createElement("div");
      nm.className = "tname";
      nm.textContent = h.name;

      t.appendChild(im);
      t.appendChild(nm);

      if (picked){
        const badge = document.createElement("div");
        badge.className = "badge";
        badge.textContent = "PICKED";
        t.appendChild(badge);
      }

      t.title = picked ? `${h.name} — click to remove` : `${h.name} — click to add`;
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
  if (!suggestPick || !suggestItem) return;

  const { heroSources, itemSources } = buildSuggestions(state.enemyQueue, HEROES);

  /* ===== HEROES YOU SHOULD PICK ===== */
  const heroList = [...heroSources.keys()]
    .filter(s => HEROES[s])
    .sort((a, b) => HEROES[a].name.localeCompare(HEROES[b].name));

  suggestPick.innerHTML = heroList.length ? "" : "Add heroes to the queue.";

  heroList.forEach(slug => {
    const h = HEROES[slug];

    const e = document.createElement("div");
    e.className = "sug";
    e.setAttribute("aria-disabled", "true");

    // thumb hero 16:9
    const im = document.createElement("img");
    im.src = h.img;
    im.alt = h.name;
    im.loading = "lazy";
    im.style.width = "100%";
    im.style.height = "100%";
    im.style.objectFit = "cover";
    e.appendChild(im);

    const nm = document.createElement("div");
    nm.className = "sname";
    nm.textContent = h.name;
    e.appendChild(nm);

    const srcWrap = document.createElement("div");
    srcWrap.className = "sources";

    // GIỮ TRÙNG: hiện đủ số icon (ví dụ Bloodseeker x2)
    const srcArr = heroSources.get(slug) || [];
    const cap = Math.min(srcArr.length, 8); // tránh quá dài
    for (let i = 0; i < cap; i++){
      const sSlug = srcArr[i];
      const box = document.createElement("div");
      box.className = "src";
      const sHero = HEROES[sSlug];
      box.innerHTML = `<img src="${sHero?.img || placeholder('HERO')}" alt="${sHero?.name || ''}" loading="lazy">`;
      // đảm bảo icon 28x28, không méo
      const img = box.querySelector("img");
      img.style.width = "28px";
      img.style.height = "28px";
      img.style.objectFit = "cover";
      srcWrap.appendChild(box);
    }
    if (srcArr.length > cap){
      const more = document.createElement("div");
      more.className = "src more";
      more.textContent = `+${srcArr.length - cap}`;
      srcWrap.appendChild(more);
    }

    e.appendChild(srcWrap);
    suggestPick.appendChild(e);
  });

  /* ===== ITEMS YOU SHOULD BUY ===== */
  const itemList = [...itemSources.keys()]
    .sort((a, b) => (ITEMS[a]?.name || a).localeCompare(ITEMS[b]?.name || b));

  suggestItem.innerHTML = itemList.length ? "" : "Add heroes to the queue.";

  itemList.forEach(key => {
    const meta = ITEMS[key] || { name: key, img: placeholder("ITEM") };

    const e = document.createElement("div");
    e.className = "sug item";
    e.setAttribute("aria-disabled", "true");

    // item thumbnail 88x64 (chuẩn), không làm đổi layout khác
    const im = document.createElement("img");
    im.src = meta.img || placeholder("ITEM");
    im.alt = meta.name;
    im.loading = "lazy";
    im.style.width = "88px";
    im.style.height = "64px";
    im.style.objectFit = "cover";
    e.appendChild(im);

    const nm = document.createElement("div");
    nm.className = "sname";
    nm.textContent = meta.name;
    e.appendChild(nm);

    const srcWrap = document.createElement("div");
    srcWrap.className = "sources";

    const srcArr = itemSources.get(key) || [];
    const cap = Math.min(srcArr.length, 8);
    for (let i = 0; i < cap; i++){
      const sSlug = srcArr[i];
      const box = document.createElement("div");
      box.className = "src";
      const sHero = HEROES[sSlug];
      box.innerHTML = `<img src="${sHero?.img || placeholder('HERO')}" alt="${sHero?.name || ''}" loading="lazy">`;
      const img = box.querySelector("img");
      img.style.width = "28px";
      img.style.height = "28px";
      img.style.objectFit = "cover";
      srcWrap.appendChild(box);
    }
    if (srcArr.length > cap){
      const more = document.createElement("div");
      more.className = "src more";
      more.textContent = `+${srcArr.length - cap}`;
      srcWrap.appendChild(more);
    }

    e.appendChild(srcWrap);
    suggestItem.appendChild(e);
  });
}

function update(){
  renderQueue();
  renderPool();
  renderSuggestions();
  saveState();
}

/* ---------- INIT ---------- */
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
