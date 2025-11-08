// main.js
const L = window.OutpickLogic;
let HEROES = {};
let ITEMS = {};
let enemyQueue = [];
const MAX = 5;

// ==== ELEMENTS ====
const $ = (id) => document.getElementById(id);
const grid = $("grid"),
  slots = $("slots"),
  progress = $("progress"),
  clearBtn = $("clear"),
  pickList = $("pickList"),
  itemList = $("itemList"),
  search = $("search"),
  clearSearchBtn = $("clearSearch"),
  toastEl = $("toast");

const heroImg = (slug) => L.slugToImg("./assets/heroes", slug);
const itemImg = (slug) => L.slugToImg("./assets/items", slug);

// ==== TOAST ====
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.style.display = "block";
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (toastEl.style.display = "none"), 1800);
}

// ==== LOAD DATA ====
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

// ==== QUEUE RENDER ====
function renderQueue() {
  slots.innerHTML = "";
  for (let i = 0; i < MAX; i++) {
    const box = document.createElement("div");
    const slug = enemyQueue[i];
    if (slug) {
      box.className = "slot filled";
      const img = new Image();
      img.src = HEROES[slug]?.img;
      img.alt = HEROES[slug]?.name || "";
      img.title = HEROES[slug]?.name || "";
      box.onclick = () => {
        enemyQueue.splice(i, 1);
        update();
      };
      box.appendChild(img);
    } else {
      box.className = "slot";
      box.textContent = i + 1;
    }
    slots.appendChild(box);
  }
  progress.textContent = `${enemyQueue.length}/${MAX}`;
}

// ==== POOL RENDER ====
function renderPool() {
  grid.innerHTML = "";
  const term = (search.value || "").trim().toLowerCase();

  Object.entries(HEROES)
    .filter(([_, h]) => !term || h.name.toLowerCase().includes(term))
    .sort((a, b) => a[1].name.localeCompare(b[1].name))
    .forEach(([slug, h]) => {
      const picked = enemyQueue.includes(slug);
      const el = document.createElement("div");
      el.className = "tile" + (picked ? " picked" : "");
      el.innerHTML = `
        <div class="thumb">
          <img src="${h.img}" alt="${h.name}">
          ${picked ? '<div class="pickedBadge">PICKED</div>' : ""}
        </div>
        <div class="name">${h.name}</div>
      `;
      el.onclick = () => {
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
      grid.appendChild(el);
    });
}

// ==== SUGGESTIONS ====
function renderSuggestions() {
  const { heroSources, itemSources } = L.buildSourceMaps(enemyQueue, HEROES);

  // HEROES
  pickList.innerHTML = "";
  const heroList = L.topFiveHeroes(heroSources, HEROES);
  if (heroList.length === 0) {
    pickList.innerHTML = `<span class="muted">Add heroes to the queue.</span>`;
  } else {
    heroList.forEach((slug) => {
      const h = HEROES[slug];
      const card = document.createElement("div");
      card.className = "sug hero";
      card.innerHTML = `
        <div class="thumb">
          <img src="${h.img}" alt="${h.name}">
          <div class="sources"></div>
        </div>
        <div class="sname">${h.name}</div>
      `;
      const srcWrap = card.querySelector(".sources");
      // Hiển thị đủ tất cả icon nguồn
      Array.from(heroSources.get(slug) || []).forEach((srcSlug) => {
        const box = document.createElement("div");
        box.className = "src";
        box.innerHTML = `<img src="${HEROES[srcSlug]?.img}" alt="${HEROES[srcSlug]?.name || ""}">`;
        srcWrap.appendChild(box);
      });
      pickList.appendChild(card);
    });
  }

  // ITEMS
  itemList.innerHTML = "";
  const itemKeys = L.topFiveItems(itemSources, ITEMS);
  if (itemKeys.length === 0) {
    itemList.innerHTML = `<span class="muted">Add heroes to the queue.</span>`;
  } else {
    itemKeys.forEach((key) => {
      const meta = ITEMS[key] || { name: key, img: "" };
      const card = document.createElement("div");
      card.className = "sug item";
      card.innerHTML = `
        <div class="thumb">
          <img src="${meta.img}" alt="${meta.name}">
          <div class="sources"></div>
        </div>
        <div class="sname">${meta.name}</div>
      `;
      const srcWrap = card.querySelector(".sources");
      Array.from(itemSources.get(key) || []).forEach((srcSlug) => {
        const box = document.createElement("div");
        box.className = "src";
        box.innerHTML = `<img src="${HEROES[srcSlug]?.img}" alt="${HEROES[srcSlug]?.name || ""}">`;
        srcWrap.appendChild(box);
      });
      itemList.appendChild(card);
    });
  }
}

// ==== STATE ====
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

// ==== EVENTS ====
clearBtn.onclick = () => {
  enemyQueue = [];
  update();
};
search.oninput = () => renderPool();
clearSearchBtn.onclick = () => {
  search.value = "";
  renderPool();
  search.focus();
};

// ==== INIT ====
function init() {
  load();
  update();
}
loadData();
