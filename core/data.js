export let HEROES = {};
export let ITEMS = {};

export async function loadData() {
  const [heroesRes, itemsRes] = await Promise.all([
    fetch("./heroes.json"),
    fetch("./items.json"),
  ]);
  HEROES = await heroesRes.json();
  ITEMS = await itemsRes.json();
}

export const placeholder = (type) =>
  type === "ITEM"
    ? "https://placehold.co/88x64?text=Item"
    : "https://placehold.co/128x72?text=Hero";
