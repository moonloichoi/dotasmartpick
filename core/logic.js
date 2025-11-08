// logic.js
// Chứa các hàm xử lý dữ liệu hero/item và tính toán counter logic

(function () {
  // Helper chuyển slug thành đường dẫn ảnh
  function slugToImg(base, slug) {
    return base + "/" + slug + ".png";
  }

  // Helper chuyển tên item thành slug hợp lệ
  function itemSlug(name) {
    return (name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  }

  // Tạo bản đồ nguồn counter:
  // heroSources: { heroSlug -> Set(enemySlug) }
  // itemSources: { itemSlug -> Set(enemySlug) }
  function buildSourceMaps(enemyQueue, HEROES) {
    const heroSources = new Map();
    const itemSources = new Map();

    enemyQueue.forEach((slug) => {
      const enemy = HEROES[slug];
      if (!enemy) return;

      // Gợi ý hero counter
      (enemy.counters || []).forEach((target) => {
        if (enemyQueue.includes(target)) return; // tránh self-queue
        if (!heroSources.has(target)) heroSources.set(target, new Set());
        heroSources.get(target).add(slug);
      });

      // Gợi ý item counter
      (enemy.item_counters || []).forEach((itemName) => {
        const key = itemSlug(itemName);
        if (!itemSources.has(key)) itemSources.set(key, new Set());
        itemSources.get(key).add(slug);
      });
    });

    return { heroSources, itemSources };
  }

  // Lấy top 5 heroes gợi ý (alphabetical để ổn định)
  function topFiveHeroes(heroSources, HEROES) {
    return Array.from(heroSources.keys())
      .filter((h) => HEROES[h])
      .sort((a, b) => HEROES[a].name.localeCompare(HEROES[b].name))
      .slice(0, 5);
  }

  // Lấy top 5 items gợi ý
  function topFiveItems(itemSources, ITEMS) {
    return Array.from(itemSources.keys())
      .sort((a, b) =>
        (ITEMS[a]?.name || a).localeCompare(ITEMS[b]?.name || b)
      )
      .slice(0, 5);
  }

  // Đưa ra toàn bộ hàm cho main.js dùng
  window.OutpickLogic = {
    slugToImg,
    itemSlug,
    buildSourceMaps,
    topFiveHeroes,
    topFiveItems,
  };
})();
