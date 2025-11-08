const ensureSet = (m, k) => (m.has(k) ? m.get(k) : (m.set(k, new Set()), m.get(k)));

export function buildSuggestions(enemyQueue, HEROES) {
  const enemy = enemyQueue.filter(s => s && HEROES[s]);
  const heroSources = new Map();
  const itemSources = new Map();

  if (enemy.length === 0) return { heroSources, itemSources };

  const allHeroes = Object.keys(HEROES);

  for (const a of allHeroes) {
    const H = HEROES[a];
    if (!H) continue;

    const counters = new Set([
      ...(Array.isArray(H.counters) ? H.counters : []),
      ...(Array.isArray(H.good_against) ? H.good_against : [])
    ]);

    let matched = false;
    for (const e of enemy) {
      if (counters.has(e)) {
        ensureSet(heroSources, a).add(e);
        matched = true;
      }
    }

    if (matched && Array.isArray(H.items)) {
      for (const e of enemy) {
        for (const it of H.items) ensureSet(itemSources, it).add(e);
      }
    }
  }

  for (const e of enemy) heroSources.delete(e);
  return { heroSources, itemSources };
}
