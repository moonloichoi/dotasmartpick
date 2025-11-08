// ===== state.js =====
const MAX = 5;
let state = { enemyQueue: [] };

function loadState() {
  try {
    state.enemyQueue = JSON.parse(localStorage.getItem('enemyQueue') || '[]');
  } catch {
    state.enemyQueue = [];
  }
}

function saveState() {
  localStorage.setItem('enemyQueue', JSON.stringify(state.enemyQueue));
}

// ===== Global expose =====
window.MAX = MAX;
window.state = state;
window.loadState = loadState;
window.saveState = saveState;
