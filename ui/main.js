// main.js
import { slugToImg, itemSlug, buildSourceMaps, topFiveHeroes, topFiveItems } from "./logic.js";

let HEROES = {};
let ITEMS = {};
const MAX = 5;
let enemyQueue = [];

const $ = (id) => document.getElementById(id);
const slots = $("slots"),
  grid = $("grid"),
  progress = $("progress"),
  clearBtn = $("clear");
const search = $("search"),
  pickList = $("pickList"),
  itemList = $("itemList"),
  clearSearchBtn = $("clearSearch"),
  toastEl = $("toast");

const heroImg = (slug) => slugToImg("./assets/heroes", slug);
const itemImg = (slug) => slugToImg("./assets/items", slug);

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.style.display = "block";
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (toastEl.style.display = "none"), 1800);
}

async function loadData() {
  const [heroes, items] = await Promise.all([
    fetch("./heroes.json?v=" + Date.now()).then((r) => r.json()),
    fetch("./items.json?v=" + Date.now()).then((r) => r.json()).catch(() => ({})),
  ]);
  Object.keys(heroes).forEach((s) => (heroes[s].img = heroImg(s)));
  Object.keys(items).forEach((s) => (items[s].img = itemImg(s)));
  HEROES = heroes;
  ITEMS = items;
  init();
}

/* ===== Queue ===== */
function renderQueue() {
  slots.innerHTML = "";
  for (let i = 0; i < MAX; i++) {
    const s = document.createElement("div");
    const slug = enemyQueue[i];
    if (slug) {
      s.className = "slot filled";
      const img = new Image();
      img.src = HEROES[slug]?.img;
      img.alt = HEROES[slug]?.name || "";
      s.title = (HEROES[slug]?.name || "") + " — click to remove";
      s.onclick = () => {
        enemyQueue.splice(i, 1);
        update();
      };
      s.appendChild(img);
    } else {
      s.className = "slot";
      s.textContent = i + 1;
    }
    slots.appendChild(s);
  }
  progress.textContent = `${enemyQueue.length}/${MAX}`;
}

/* ===== Pool ===== */
function renderPool() {
  grid.innerHTML = "";
  const term = (search?.value || "").trim().toLowerCase();

  Object.entries(HEROES)
    .filter(([_, h]) => !term || h.name.toLowerCase().includes(term))
    .sort((a, b) => a[1].name.localeCompare(b[1].name))
    .forEach(([slug, h]) => {
      const picked = enemyQueue.includes(slug);
      const t = document.createElement("div");
      t.className = "tile" + (picked ? " picked" : "");
      t.innerHTML = `
        <div class="thumb">
          <img src="${h.img}" alt="${h.name}">
          ${picked ? '<div class="pickedBadge">PICKED</div>' : ""}
        </div>
        <div class="name">${h.name}</div>
      `;
      t.onclick = () => {
        const idx = enemyQueue.indexOf(slug);
        if (idx >= 0) {
          enemyQueue.splice(idx, 1);
        } else if (enemyQueue.length < MAX) {
          enemyQueue.push(slug);
        } else {
          toast("You have queued 5 enemies already!");
          return;
        }
        update();
      };
      grid.appendChild(t);
    });
}

/* ===== Suggestions ===== */
function renderSuggestions() {
  const { heroSources, itemSources } = buildSourceMaps(enemyQueue, HEROES);

  // ---- HEROES (1 hàng 5 ô, đứng yên) ----
  pickList.innerHTML = "";
  const heroList = topFiveHeroes(heroSources, HEROES);
  if (heroList.length === 0) {
    pickList.innerHTML = `<span class="muted">Add heroes to the queue.</span>`;
  } else {
    heroList.forEach((slug) => {
      const h = HEROES[slug];
      const e = document.createElement("div");
      e.className = "sug hero";
      e.innerHTML = `
        <div class="thumb">
          <img src="${h.img}" alt="${h.name}">
          <div class="sources"></div>
        </div>
        <div class="sname">${h.name}</div>
      `;
      const srcWrap = e.querySelector(".sources");
      // HIỂN THỊ ĐỦ TẤT CẢ NGUỒN
      [...(heroSources.get(slug) || [])].forEach((slg) => {
        const box = document.createElement("div");
        box.className = "src";
        box.innerHTML = `<img src="${HEROES[slg]?.img}" alt="${HEROES[slg]?.name || ""}">`;
        srcWrap.appendChild(box);
      });
      pickList.appendChild(e);
    });
  }

  // ---- ITEMS (1 hàng 5 ô, đứng yên) ----
  itemList.innerHTML = "";
  const itemKeys = topFiveItems(itemSources, ITEMS);
  if (itemKeys.length === 0) {
    itemList.innerHTML = `<span class="muted">Add heroes to the queue.</span>`;
  } else {
    itemKeys.forEach((key) => {
      const meta = ITEMS[key] || { name: key, img: "" };
      const e = document.createElement("div");
      e.className = "sug item";
      e.innerHTML = `
        <div class="thumb">
          <img src="${meta.img}" alt="${meta.name}">
          <div class="sources"></div>
        </div>
        <div class="sname">${meta.name}</div>
      `;
      const srcWrap = e.querySelector(".sources");
      [...(itemSources.get(key) || [])].forEach((slg) => {
        const box = document.createElement("div");
        box.className = "src";
        box.innerHTML = `<img src="${HEROES[slg]?.img}" alt="${HEROES[slg]?.name || ""}">`;
        srcWrap.appendChild(box);
      });
      itemList.appendChild(e);
    });
  }
}

/* ===== State & Init ===== */
function save() {
  localStorage.setItem("enemyQueue", JSON.stringify(enemyQueue));
}
function load() {
  try {
    enemyQueue = JSON.parse(localStorage.getItem("enemyQueue") || "[]");
  } catch {
    enemyQueue = [];
  }
}
function update() {
  renderQueue();
  renderPool();
  renderSuggestions();
  save();
}

clearBtn.onclick = () => {
  enemyQueue = [];
  update();
};
search.addEventListener("input", () => renderPool());
clearSearchBtn.onclick = () => {
  search.value = "";
  renderPool();
  search.focus();
};

function init() {
  load();
  update();
}
loadData();
