// State
let rows = 10, cols = 10;
let startR = 0, startC = 0;
let endR = 9,   endC = 9;
let walls = new Set(); // "r,c"

// DOM
const gridEl      = document.getElementById('grid');
const message     = document.getElementById('message');
const rowsInput   = document.getElementById('rows');
const colsInput   = document.getElementById('cols');
const startInput  = document.getElementById('startInput');
const endInput    = document.getElementById('endInput');

// Build Grid
function buildGrid() {
  rows = parseInt(rowsInput.value) || 10;
  cols = parseInt(colsInput.value) || 10;
  walls.clear();
  clampStartEnd();
  renderGrid();
  message.textContent = '';
}

function clampStartEnd() {
  startR = Math.min(startR, rows - 1);
  startC = Math.min(startC, cols - 1);
  endR   = Math.min(endR,   rows - 1);
  endC   = Math.min(endC,   cols - 1);
}

function renderGrid() {
  gridEl.style.gridTemplateColumns = `repeat(${cols}, 36px)`;
  gridEl.innerHTML = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.r = r;
      cell.dataset.c = c;
      applyClass(cell, r, c);
      cell.addEventListener('click', onCellClick);
      gridEl.appendChild(cell);
    }
  }
}

function applyClass(cell, r, c) {
  const key = `${r},${c}`;
  cell.className = 'cell';
  if (r === startR && c === startC)   cell.classList.add('start');
  else if (r === endR && c === endC)  cell.classList.add('end');
  else if (walls.has(key))            cell.classList.add('wall');
}

function getCell(r, c) {
  return gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
}

// Toggle Walls
function onCellClick(e) {
  const r = parseInt(e.target.dataset.r);
  const c = parseInt(e.target.dataset.c);
  if ((r === startR && c === startC) || (r === endR && c === endC)) return;
  const key = `${r},${c}`;
  if (walls.has(key)) walls.delete(key);
  else walls.add(key);
  applyClass(e.target, r, c);
}

// Set Start / End
document.getElementById('setBtn').addEventListener('click', () => {
  const s = startInput.value.split(',').map(Number);
  const en = endInput.value.split(',').map(Number);
  if (s.length === 2 && !isNaN(s[0]) && !isNaN(s[1]) &&
      s[0] >= 0 && s[0] < rows && s[1] >= 0 && s[1] < cols) {
    startR = s[0]; startC = s[1];
  } else {
    message.textContent = 'Invalid start coordinates.'; return;
  }
  if (en.length === 2 && !isNaN(en[0]) && !isNaN(en[1]) &&
      en[0] >= 0 && en[0] < rows && en[1] >= 0 && en[1] < cols) {
    endR = en[0]; endC = en[1];
  } else {
    message.textContent = 'Invalid end coordinates.'; return;
  }
  walls.delete(`${startR},${startC}`);
  walls.delete(`${endR},${endC}`);
  renderGrid();
  message.textContent = '';
});

// BFS
function bfs() {
  const visited = new Set();
  const prev = {};             // "r,c" -> "r,c" parent
  const queue = [[startR, startC]];
  const visitOrder = [];       // for animation
  visited.add(`${startR},${startC}`);

  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];

  while (queue.length) {
    const [r, c] = queue.shift();
    if (r === endR && c === endC) {
      // Reconstruct path
      const path = [];
      let cur = `${endR},${endC}`;
      while (cur !== `${startR},${startC}`) {
        path.push(cur);
        cur = prev[cur];
      }
      return { visitOrder, path };
    }
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      const key = `${nr},${nc}`;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (visited.has(key) || walls.has(key)) continue;
      visited.add(key);
      prev[key] = `${r},${c}`;
      queue.push([nr, nc]);
      visitOrder.push([nr, nc]);
    }
  }
  return { visitOrder, path: null }; // no path found
}

// Animate
function animate(visitOrder, path) {
  let i = 0;
  const interval = setInterval(() => {
    if (i >= visitOrder.length) {
      clearInterval(interval);
      // Draw path after visited animation
      if (!path) {
        message.textContent = 'No path found!';
        return;
      }
      for (const key of path) {
        const [r, c] = key.split(',').map(Number);
        if (r === startR && c === startC) continue;
        if (r === endR   && c === endC)   continue;
        const cell = getCell(r, c);
        if (cell) cell.className = 'cell path';
      }
      message.textContent = `Path found! Length: ${path.length} steps.`;
      return;
    }
    const [r, c] = visitOrder[i];
    if (r === endR && c === endC) { i++; return; } // don't overwrite end color
    const cell = getCell(r, c);
    if (cell && !cell.classList.contains('start')) cell.className = 'cell visited';
    i++;
  }, 30);
}

// Run
document.getElementById('runBtn').addEventListener('click', () => {
  clearVisited();
  message.textContent = 'Running...';
  const { visitOrder, path } = bfs();
  animate(visitOrder, path);
});

// Clear / Reset
function clearVisited() {
  document.querySelectorAll('.cell.visited, .cell.path').forEach(cell => {
    const r = parseInt(cell.dataset.r);
    const c = parseInt(cell.dataset.c);
    applyClass(cell, r, c);
  });
  message.textContent = '';
}

document.getElementById('clearBtn').addEventListener('click', clearVisited);

document.getElementById('resetBtn').addEventListener('click', () => {
  walls.clear();
  clearVisited();
  renderGrid();
});

document.getElementById('buildBtn').addEventListener('click', buildGrid);

// Init
buildGrid();
