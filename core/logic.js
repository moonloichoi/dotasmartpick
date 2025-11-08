// core/logic.js
// Xây map gợi ý từ enemyQueue, GIỮ TRÙNG LẶP nguồn (không dùng Set).
// Không đổi API: trả về { heroSources, itemSources }

import { itemSlug } from "./data.js";

/**
 * @param {string[]} enemyQueue - danh sách slug hero địch đã chọn
 * @param {Record<string, any>} HEROES - map slug -> meta hero
 * @returns {{ heroSources: Map<string,string[]>, itemSources: Map<string,string[]> }}
 */
export function buildSuggestions(enemyQueue, HEROES) {
  // heroSlug -> Array<enemySlug>
  const heroSources = new Map();
  // itemKey  -> Array<enemySlug>
  const itemSources = new Map();

  for (const eSlug of enemyQueue) {
    const enemy = HEROES[eSlug];
    if (!enemy) continue;

    // Gợi ý hero (counters)
    const counters = enemy?.counters || [];
    for (const sugSlug of counters) {
      // Không gợi ý hero đã nằm sẵn trong queue
      if (enemyQueue.includes(sugSlug)) continue;
      if (!HEROES[sugSlug]) continue;
      const arr = heroSources.get(sugSlug) || [];
      arr.push(eSlug);                // GIỮ TRÙNG
      heroSources.set(sugSlug, arr);
    }

    // Gợi ý item (item_counters)
    const items = enemy?.item_counters || [];
    for (const it of items) {
      const key = itemSlug(it);
      const arr = itemSources.get(key) || [];
      arr.push(eSlug);                // GIỮ TRÙNG
      itemSources.set(key, arr);
    }
  }

  return { heroSources, itemSources };
}
