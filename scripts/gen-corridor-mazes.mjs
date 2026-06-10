const W = 12;
const H = 12;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function key(x, y) {
  return `${x},${y}`;
}

function generateCorridorMaze() {
  const grid = Array.from({ length: H }, () => Array(W).fill("#"));

  function carve(x, y) {
    grid[y][x] = ".";
    for (const [dx, dy] of shuffle([
      [0, 2],
      [0, -2],
      [2, 0],
      [-2, 0],
    ])) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 1 && nx <= W - 2 && ny >= 1 && ny <= H - 2 && grid[ny][nx] === "#") {
        grid[y + dy / 2][x + dx / 2] = ".";
        carve(nx, ny);
      }
    }
  }

  carve(1, 1);

  const gx = W - 2;
  grid[0][1] = "E";
  grid[1][1] = "S";
  grid[0][gx] = "G";

  if (grid[1][gx] === "#") grid[1][gx] = ".";
  if (grid[1][gx - 1] === "#") grid[1][gx - 1] = ".";

  return grid;
}

function parseMeta(grid) {
  let start = null;
  let goal = null;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (grid[y][x] === "S") start = [x, y];
      if (grid[y][x] === "G") goal = [x, y];
    }
  }
  return { start, goal };
}

function isBlocking(ch, destroyedB, doorOpen) {
  if (ch === "#") return true;
  if (ch === "B" && !destroyedB) return true;
  if (ch === "T" && !doorOpen) return true;
  return false;
}

function neighbors4(x, y) {
  return [
    [x, y - 1],
    [x, y + 1],
    [x - 1, y],
    [x + 1, y],
  ];
}

function walkableNeighbors(grid, x, y, destroyedB, doorOpen) {
  return neighbors4(x, y).filter(([nx, ny]) => {
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) return false;
    const ch = grid[ny][nx];
    if ([".", "S", "E", "G", "H", "C"].includes(ch)) return true;
    if (ch === "h") return true;
    if (ch === "B" && destroyedB) return true;
    if (ch === "T" && doorOpen) return true;
    return false;
  });
}

function bfsReach(grid, from, to, destroyedB, doorOpen) {
  const queue = [[from[0], from[1]]];
  const seen = new Set([key(from[0], from[1])]);

  while (queue.length > 0) {
    const [x, y] = queue.shift();
    if (x === to[0] && y === to[1]) return true;

    for (const [nx, ny] of walkableNeighbors(grid, x, y, destroyedB, doorOpen)) {
      const k = key(nx, ny);
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push([nx, ny]);
    }
  }

  return false;
}

function isArticulationCorridor(grid, x, y) {
  if (grid[y][x] !== ".") return false;
  const { start, goal } = parseMeta(grid);
  if (!start || !goal) return false;
  if (x === start[0] && y === start[1]) return false;

  const gridWithout = grid.map((row) => [...row]);
  gridWithout[y][x] = "#";

  return !bfsReach(gridWithout, start, goal, false, true);
}

function findLeverDoor(grid) {
  const trial = grid.map((row) => [...row]);

  for (let y = 2; y < H - 2; y += 1) {
    for (let x = 2; x < W - 3; x += 1) {
      if (trial[y][x] !== ".") continue;
      const left = trial[y][x - 1] === ".";
      const right = trial[y][x + 1] === ".";
      const up = trial[y - 1][x] === "#";
      const down = trial[y + 1][x] === "#";
      if (!(left && right && up && down)) continue;

      const hx = x - 2;
      if (trial[y][hx] !== ".") continue;

      const next = trial.map((row) => [...row]);
      next[y][x] = "T";
      next[y][hx] = "H";

      const { start, goal } = parseMeta(next);
      if (bfsReach(next, start, goal, false, false)) continue;
      if (!bfsReach(next, start, goal, false, true)) continue;

      const queue = [[start[0], start[1], false]];
      const seen = new Set([`${start[0]},${start[1]},0`]);
      let ok = false;

      while (queue.length > 0) {
        const [cx, cy, activated] = queue.shift();
        if (cx === goal[0] && cy === goal[1] && activated) {
          ok = true;
          break;
        }
        for (const [nx, ny] of walkableNeighbors(next, cx, cy, false, activated)) {
          const onLever = nx === hx && ny === y;
          const nextActivated = activated || onLever;
          const state = `${nx},${ny},${nextActivated ? 1 : 0}`;
          if (seen.has(state)) continue;
          if (next[ny][nx] === "T" && !nextActivated) continue;
          seen.add(state);
          queue.push([nx, ny, nextActivated]);
        }
      }

      if (!ok) continue;

      return {
        grid: next,
        levers: [{ id: "h1", x: hx, y, opens: ["t1"] }],
        doors: [{ id: "t1", x, y }],
      };
    }
  }

  return null;
}

function findBrittleAndCharger(grid) {
  const { start, goal } = parseMeta(grid);
  const candidates = [];

  for (let y = 1; y < H - 1; y += 1) {
    for (let x = 1; x < W - 1; x += 1) {
      if (!isArticulationCorridor(grid, x, y)) continue;
      const nbrs = walkableNeighbors(grid, x, y, false, true);
      if (nbrs.length !== 2) continue;

      const gridWithB = grid.map((row) => [...row]);
      gridWithB[y][x] = "B";
      if (!bfsReach(gridWithB, start, goal, true, true)) continue;
      if (bfsReach(gridWithB, start, goal, false, true)) continue;

      const dist = Math.abs(x - start[0]) + Math.abs(y - start[1]);
      if (dist < 3 || dist > 8) continue;

      candidates.push({ x, y, dist, nbrs });
    }
  }

  candidates.sort((a, b) => a.dist - b.dist);

  for (const brittle of candidates) {
    const gridWithB = grid.map((row) => [...row]);
    gridWithB[brittle.y][brittle.x] = "B";

    const reachable = new Set();
    const queue = [[start[0], start[1]]];
    reachable.add(key(start[0], start[1]));

    while (queue.length > 0) {
      const [cx, cy] = queue.shift();
      for (const [nx, ny] of walkableNeighbors(gridWithB, cx, cy, false, true)) {
        const k = key(nx, ny);
        if (reachable.has(k)) continue;
        reachable.add(k);
        queue.push([nx, ny]);
      }
    }

    const chargerCandidates = [];
    for (const k of reachable) {
      const [cx, cy] = k.split(",").map(Number);
      if (gridWithB[cy][cx] !== ".") continue;
      const d = Math.abs(cx - start[0]) + Math.abs(cy - start[1]);
      if (d < 1 || d > 6) continue;
      chargerCandidates.push({ x: cx, y: cy, d });
    }

    chargerCandidates.sort((a, b) => a.d - b.d);

    for (const charger of chargerCandidates) {
      const finalGrid = gridWithB.map((row) => [...row]);
      finalGrid[charger.y][charger.x] = "C";

      if (validateLevel3(finalGrid, charger, brittle)) {
        return { grid: finalGrid, charger, brittle };
      }
    }
  }

  return null;
}

function validateLevel3(grid, charger, brittle) {
  const { start, goal } = parseMeta(grid);
  let hx = null;
  let tx = null;
  let ty = null;

  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (grid[y][x] === "H") hx = [x, y];
      if (grid[y][x] === "T") [tx, ty] = [x, y];
    }
  }

  const queue = [
    {
      x: start[0],
      y: start[1],
      charge: 0,
      laser: false,
      b: false,
      lever: false,
    },
  ];
  const seen = new Set();

  while (queue.length > 0) {
    const state = queue.shift();
    const sig = `${state.x},${state.y},${state.charge},${state.laser ? 1 : 0},${state.b ? 1 : 0},${state.lever ? 1 : 0}`;
    if (seen.has(sig)) continue;
    seen.add(sig);

    if (state.x === goal[0] && state.y === goal[1] && state.b && state.lever) {
      return true;
    }

    const doorOpen = state.lever;
    const destroyedB = state.b;

    for (const [nx, ny] of walkableNeighbors(grid, state.x, state.y, destroyedB, doorOpen)) {
      if (grid[ny][nx] === "T" && !doorOpen) continue;
      queue.push({ ...state, x: nx, y: ny });
    }

    if (
      state.x === charger.x &&
      state.y === charger.y &&
      !state.laser &&
      state.charge < 5
    ) {
      const nextCharge = state.charge + 1;
      queue.push({
        ...state,
        charge: nextCharge,
        laser: nextCharge >= 5,
      });
    }

    if (state.laser && !destroyedB) {
      for (const [ddx, ddy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        let x = state.x + ddx;
        let y = state.y + ddy;
        for (let i = 0; i < 12; i += 1) {
          if (x < 0 || y < 0 || x >= W || y >= H) break;
          if (grid[y][x] === "B") {
            queue.push({ ...state, b: true, laser: false, charge: 0 });
            break;
          }
          if (grid[y][x] === "#" || (grid[y][x] === "T" && !doorOpen)) break;
          x += ddx;
          y += ddy;
        }
      }
    }

    if (hx && state.x === hx[0] && state.y === hx[1] && !state.lever) {
      queue.push({ ...state, lever: true });
    }
  }

  return false;
}

function isPassable(ch) {
  return [".", "S", "E", "G", "H", "h", "C"].includes(ch);
}

/** Keine 2×2-Flächen aus freien Feldern (offene Räume). */
function hasOpenRooms(grid) {
  for (let y = 0; y < H - 1; y += 1) {
    for (let x = 0; x < W - 1; x += 1) {
      let open = 0;
      for (const [dx, dy] of [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ]) {
        const ch = grid[y + dy][x + dx];
        if (isPassable(ch)) open += 1;
      }
      if (open === 4) return true;
    }
  }
  return false;
}

function gridToRows(grid) {
  return grid.map((row) => row.join(""));
}

const stats = { base: 0, rooms: 0, lever: 0, l3: 0 };

for (let attempt = 0; attempt < 2000; attempt += 1) {
  const base = generateCorridorMaze();
  const { start, goal } = parseMeta(base);
  if (!bfsReach(base, start, goal, false, true)) continue;
  stats.base += 1;
  if (hasOpenRooms(base)) {
    stats.rooms += 1;
    continue;
  }

  const level1 = gridToRows(base);
  const leverDoor = findLeverDoor(base);
  if (!leverDoor) continue;
  stats.lever += 1;

  if (hasOpenRooms(leverDoor.grid)) continue;

  const level3extra = findBrittleAndCharger(leverDoor.grid);
  if (!level3extra) continue;
  stats.l3 += 1;

  if (hasOpenRooms(level3extra.grid)) continue;

  console.log(
    JSON.stringify(
      {
        level1,
        level2: gridToRows(leverDoor.grid),
        levers: leverDoor.levers,
        doors: leverDoor.doors,
        level3: gridToRows(level3extra.grid),
        charger: level3extra.charger,
        brittle: level3extra.brittle,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

console.error("No corridor mazes found", stats);
process.exit(1);
