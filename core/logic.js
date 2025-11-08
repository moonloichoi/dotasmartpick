import { itemSlug } from "./data.js";

export function buildSuggestions(enemyQueue, HEROES) {
  const heroSources = new Map();
  const itemSources = new Map();

  enemyQueue.forEach((eSlug) => {
    const enemy = HEROES[eSlug];
    (enemy?.counters || []).forEach((sug) => {
      if (enemyQueue.includes(sug)) return;
      if (!heroSources.has(sug)) heroSources.set(sug, new Set());
      heroSources.get(sug).add(eSlug);
    });
    (enemy?.item_counters || []).forEach((item) => {
      const key = itemSlug(item);
      if (!itemSources.has(key)) itemSources.set(key, new Set());
      itemSources.get(key).add(eSlug);
    });
  });

  return { heroSources, itemSources };
}
