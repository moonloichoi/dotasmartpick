import { itemSlug } from "./data.js";

/** Build hero & item suggestion maps with full source tracking */
export function buildSuggestions(enemyQueue, HEROES){
  const heroSources = new Map();   // heroSlug -> Set(enemySlugs)
  const itemSources = new Map();   // itemSlug -> Set(enemySlugs)

  enemyQueue.forEach(eSlug=>{
    const enemy = HEROES[eSlug];
    if(!enemy) return;

    // Hero counters
    (enemy.counters || []).forEach(sug=>{
      if(enemyQueue.includes(sug)) return;
      if(!heroSources.has(sug)) heroSources.set(sug, new Set());
      heroSources.get(sug).add(eSlug);   // add every source distinctly
    });

    // Item counters
    (enemy.item_counters || []).forEach(it=>{
      const key = itemSlug(it);
      if(!itemSources.has(key)) itemSources.set(key, new Set());
      itemSources.get(key).add(eSlug);
    });
  });

  // Convert sets to arrays so multiple sources show correctly
  for(const [k,v] of heroSources) heroSources.set(k, Array.from(v));
  for(const [k,v] of itemSources) itemSources.set(k, Array.from(v));

  return { heroSources, itemSources };
}
