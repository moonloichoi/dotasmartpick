import { MAX, state, loadState, saveState } from "../core/state.js";
import { HEROES, ITEMS, loadData, placeholder } from "../core/data.js";
import { buildSuggestions } from "../core/logic.js";

const $ = (id) => document.getElementById(id);

const slots = $("slots");
const progress = $("progress");
const btnClear = $("btnClear");
const search = $("search");
const clearSearch = $("clearSearch");
const pool = $("pool");
const suggestPick = $("suggestPick");
const suggestItem = $("suggestItem");
const toastEl = $("toast");

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.style.display = "block";
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (toastEl.style.display = "none"), 1800);
}

function renderQueue() {
  slots.innerHTML = "";
  for (let i = 0; i < MAX; i++) {
    const s = document.createElement("div");
    const slug = state.enemyQueue[i];
    if (slug) {
      s.className = "slot filled";
      const img = new Image();
      img.src = HEROES[slug]?.img || placeholder("HERO");
      img.alt = HEROES[slug]?.name || "";
      s.title = (HEROES[slug]?.name || "") + " — click to remove";
      s.onclick = () => {
        state.enemyQueue.splice(i, 1);
        update();
      };
      s.appendChild(img);
    } else {
      s.className = "slot";
      s.textContent = i + 1;
    }
    slots.appendChild(s);
  }
  progress.textContent = `${state.enemyQueue.length}/${MAX}`;
}

function renderPool() {
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
        <img src="${h.img || placeholder("HERO")}" alt="${h.name}">
        <div class="tname">${h.name}</div>
        ${picked ? '<div class="badge">PICKED</div>' : ""}
      `;
      t.onclick = () => {
        const idx = state.enemyQueue.indexOf(slug);
        if (idx >= 0) state.enemyQueue.splice(idx, 1);
        else if (state.enemyQueue.length < MAX) state.enemyQueue.push(slug);
        else toast("You have queued 5 enemies already!");
        update();
      };
      pool.appendChild(t);
    });
}

function renderSuggestions() {
  const { heroSources, itemSources } = buildSuggestions(state.enemyQueue, HEROES);

  const heroList = [...heroSources.keys()]
    .filter((s) => HEROES[s])
    .sort((a, b) => HEROES[a].name.localeCompare(HEROES[b].name));

  suggestPick.innerHTML = heroList.length
    ? ""
    : `<span style="color:var(--muted)">Add heroes to the queue.</span>`;

  heroList.forEach((slug) => {
    const h = HEROES[slug];
    const e = document.createElement("div");
    e.className = "sug";
    e.setAttribute("aria-disabled", "true");
    e.innerHTML = `<img src="${h.img || placeholder("HERO")}" alt="${h.name}">
                   <div class="sname">${h.name}</div>`;
    const srcWrap = document.createElement("div");
    srcWrap.className = "sources";
    const sources = [...(heroSources.get(slug) || [])];
    sources.slice(0, 4).forEach((s) => {
      const box = document.createElement("div");
      box.className = "src";
      box.innerHTML = `<img src="${HEROES[s]?.img || placeholder("H")}" alt="${HEROES[s]?.name || ""}">`;
      srcWrap.appendChild(box);
    });
    if (sources.length > 4) {
      const more = document.createElement("div");
      more.className = "src more";
      more.textContent = `+${sources.length - 4}`;
      srcWrap.appendChild(more);
    }
    e.appendChild(srcWrap);
    suggestPick.appendChild(e);
  });

  const itemList = [...itemSources.keys()].sort((a, b) =>
    (ITEMS[a]?.name || a).localeCompare(ITEMS[b]?.name || b)
  );

  suggestItem.innerHTML = itemList.length
    ? ""
    : `<span style="color:var(--muted)">Add heroes to the queue.</span>`;

  itemList.forEach((key) => {
    const meta = ITEMS[key] || { name: key, img: placeholder("ITEM") };
    const e = document.createElement("div");
    e.className = "sug";
    e.setAttribute("aria-disabled", "true");
    e.innerHTML = `<img src="${meta.img}" alt="${meta.name}">
                   <div class="sname">${meta.name}</div>`;
    const srcWrap = document.createElement("div");
    srcWrap.className = "sources";
    const sources = [...(itemSources.get(key) || [])];
    sources.slice(0, 4).forEach((s) => {
      const box = document.createElement("div");
      box.className = "src";
      box.innerHTML = `<img src="${HEROES[s]?.img || placeholder("H")}" alt="${HEROES[s]?.name || ""}">`;
      srcWrap.appendChild(box);
    });
    if (sources.length > 4) {
      const more = document.createElement("div");
      more.className = "src more";
      more.textContent = `+${sources.length - 4}`;
      srcWrap.appendChild(more);
    }
    e.appendChild(srcWrap);
    suggestItem.appendChild(e);
  });
}

function update() {
  renderQueue();
  renderPool();
  renderSuggestions();
  saveState();
}

btnClear.addEventListener("click", () => {
  state.enemyQueue = [];
  update();
});
search.addEventListener("input", () => renderPool());
clearSearch.addEventListener("click", () => {
  search.value = "";
  renderPool();
});

(async function init() {
  loadState();
  await loadData();
  update();
})();
