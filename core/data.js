export let HEROES = {};
export let ITEMS  = {};

const heroImg = (slug) => `./assets/heroes/${slug}.png`;
const itemImg = (slug) => `./assets/items/${slug}.png`;

export async function loadData() {
  const [heroes, items] = await Promise.all([
    fetch('./heroes.json?v=' + Date.now()).then(r => r.json()),
    fetch('./items.json?v=' + Date.now()).then(r => r.json()).catch(() => ({}))
  ]);

  Object.keys(heroes).forEach(slug => { heroes[slug].img = heroImg(slug); });
  Object.keys(items).forEach(slug  => { items[slug].img  = itemImg(slug); });

  HEROES = heroes;
  ITEMS  = items;
}

export function itemSlug(name){
  return name.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
}

export function placeholder(label){
  const t = label || 'HERO';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240">
       <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0" stop-color="#223047"/><stop offset="1" stop-color="#0f1722"/>
       </linearGradient></defs>
       <rect fill="url(#g)" width="400" height="240"/>
       <text x="20" y="210" fill="#cfe1ff" font-family="system-ui,Segoe UI,Roboto" font-size="26" font-weight="700">${t}</text>
     </svg>`
  );
}
