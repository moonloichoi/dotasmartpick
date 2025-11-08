import { itemSlug } from "./data.js";

/** Build suggestion maps with full source tracking */
export function buildSuggestions(enemyQueue, HEROES){
  const heroSources = new Map();  // heroSlug -> Set(enemySlug)
  const itemSources = new Map();  // itemSlug -> Set(enemySlug)

  enemyQueue.forEach(eSlug=>{
    const enemy = HEROES[eSlug];

    // Hero counters: show ALL sources; skip if already in queue
    (enemy?.counters || []).forEach(sug=>{
      if (enemyQueue.includes(sug)) return;
      if (!heroSources.has(sug)) heroSources.set(sug, new Set());
      heroSources.get(sug).add(eSlug);
    });

    // Item counters: same rule
    (enemy?.item_counters || []).forEach(it=>{
      const key = itemSlug(it);
      if (!itemSources.has(key)) itemSources.set(key, new Set());
      itemSources.get(key).add(eSlug);
    });
  });

  return { heroSources, itemSources };
}
