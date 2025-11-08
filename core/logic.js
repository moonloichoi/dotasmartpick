// logic.js (no module export; attach to window)
(function(){
  function slugToImg(basePath, slug) {
    return basePath + "/" + slug + ".png";
  }
  function itemSlug(name) {
    return (name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  }
  function buildSourceMaps(enemyQueue, HEROES) {
    const heroSources = new Map();
    const itemSources = new Map();
    enemyQueue.forEach((eSlug) => {
      const enemy = HEROES[eSlug];
      if (!enemy) return;
      (enemy.counters || []).forEach((sug) => {
        if (enemyQueue.includes(sug)) return;
        if (!heroSources.has(sug)) heroSources.set(sug, new Set());
        heroSources.get(sug).add(eSlug);
      });
      (enemy.item_counters || []).forEach((it) => {
        const key = itemSlug(it);
        if (!itemSources.has(key)) itemSources.set(key, new Set());
        itemSources.get(key).add(eSlug);
      });
    });
    return { heroSources, itemSources };
  }
  function topFiveHeroes(heroSources, HEROES) {
    return Array.from(heroSources.keys())
      .filter((s) => !!HEROES[s])
      .sort((a, b) => (HEROES[a].name || a).localeCompare(HEROES[b].name || b))
      .slice(0, 5);
  }
  function topFiveItems(itemSources, ITEMS) {
    return Array.from(itemSources.keys())
      .sort((a, b) => (ITEMS[a]?.name || a).localeCompare(ITEMS[b]?.name || b))
      .slice(0, 5);
  }
  window.OutpickLogic = {
    slugToImg, itemSlug, buildSourceMaps, topFiveHeroes, topFiveItems
  };
})();
