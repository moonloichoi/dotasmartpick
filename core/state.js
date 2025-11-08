export const MAX = 5;

export const state = {
  enemyQueue: [],
};

export function loadState() {
  try {
    state.enemyQueue = JSON.parse(localStorage.getItem("enemyQueue") || "[]");
  } catch {
    state.enemyQueue = [];
  }
}

export function saveState() {
  localStorage.setItem("enemyQueue", JSON.stringify(state.enemyQueue));
}
