// Build suggestions from enemy queue using flexible hero schemas
// Return: { heroSources: Map<heroSlug, Set<enemySlug>>, itemSources: Map<itemKey, Set<enemySlug>> }

const ensureSet = (m, k) => (m.has(k) ? m.get(k) : (m.set(k, new Set()), m.get(k)));

export function buildSuggestions(enemyQueue, HEROES) {
  const enemy = enemyQueue.filter(s => s && HEROES[s]);
  const heroSources = new Map(); // hero -> enemies that justify it
  const itemSources = new Map(); // item -> enemies that justify it

  if (enemy.length === 0) return { heroSources, itemSources };

  // Build reverse index: for each hero A, which enemies does A counter?
  // We accept multiple schema fields: counters / good_against
  const allHeroes = Object.keys(HEROES);

  for (const a of allHeroes) {
    const H = HEROES[a];
    if (!H) continue;

    const counters = new Set([
      ...(Array.isArray(H.counters) ? H.counters : []),
      ...(Array.isArray(H.good_against) ? H.good_against : [])
    ]);

    // If any enemy is in A's counters -> A is suggested
    let matched = false;
    for (const e of enemy) {
      if (counters.has(e)) {
        ensureSet(heroSources, a).add(e);
        matched = true;
      }
    }

    // Optional: propagate items from hero meta if hero matched
    if (matched && Array.isArray(H.items)) {
      for (const e of enemy) {
        for (const it of H.items) {
          ensureSet(itemSources, it).add(e);
        }
      }
    }
  }

  // Remove any hero that is itself in enemy queue (can't pick enemy hero)
  for (const e of enemy) heroSources.delete(e);

  return { heroSources, itemSources };
}
