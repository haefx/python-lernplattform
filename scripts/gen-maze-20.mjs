const W = 20;
const H = 20;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateBase() {
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
      if (nx > 0 && nx < W - 1 && ny > 1 && ny < H - 1 && grid[ny][nx] === "#") {
        grid[y + dy / 2][x + dx / 2] = ".";
        carve(nx, ny);
      }
    }
  }

  carve(1, 2);

  grid[0][1] = "E";
  grid[1][1] = "S";
  grid[1][2] = ".";

  const gx = 18;
  grid[0][gx] = "G";
  grid[1][gx] = ".";
  grid[1][gx - 1] = ".";

  for (let x = 0; x < W; x += 1) {
    grid[H - 1][x] = "#";
    if (grid[0][x] === "#") grid[0][x] = "#";
  }
  for (let y = 0; y < H; y += 1) {
    grid[y][0] = "#";
    grid[y][W - 1] = "#";
  }

  grid[0][1] = "E";
  grid[0][gx] = "G";
  grid[1][1] = "S";

  return grid;
}

function bfs(grid, lever, door) {
  let start = null;
  let goal = null;
  const walkable = new Set();

  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const ch = grid[y][x];
      if (ch === "#") continue;
      if (ch === "S") start = [x, y];
      if (ch === "G") goal = [x, y];
      walkable.add(`${x},${y}`);
    }
  }

  const leverKey = lever ? `${lever.x},${lever.y}` : null;
  const doorKey = door ? `${door.x},${door.y}` : null;
  const queue = [[start[0], start[1], lever ? 0 : 1]];
  const seen = new Set([queue[0].join(",")]);

  while (queue.length > 0) {
    const [x, y, activated] = queue.shift();
    if (x === goal[0] && y === goal[1]) return true;

    for (const [dx, dy] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (!walkable.has(key)) continue;
      if (doorKey === key && !activated) continue;
      const nextActivated = activated || key === leverKey;
      const state = `${nx},${ny},${nextActivated}`;
      if (seen.has(state)) continue;
      seen.add(state);
      queue.push([nx, ny, nextActivated]);
    }
  }

  return false;
}

function gridToRows(grid) {
  return grid.map((row) => row.join(""));
}

function placeDoorLevel(base) {
  const grid = base.map((row) => [...row]);

  for (let y = 2; y < H - 2; y += 1) {
    for (let x = 2; x < W - 2; x += 1) {
      if (grid[y][x] !== ".") continue;
      const left = grid[y][x - 1] === ".";
      const right = grid[y][x + 1] === ".";
      const up = grid[y - 1][x] === ".";
      const down = grid[y + 1][x] === ".";
      if (!(left && right && !up && !down)) continue;

      grid[y][x] = "T";
      if (grid[y][x - 2] === ".") {
        grid[y][x - 2] = "H";
        const trial = grid.map((row) => [...row]);
        if (bfs(trial, { x: x - 2, y }, { x, y })) {
          return {
            rows: gridToRows(trial),
            levers: [{ id: "h1", x: x - 2, y, opens: ["t1"] }],
            doors: [{ id: "t1", x, y }],
          };
        }
      }
    }
  }

  return null;
}

for (let i = 0; i < 200; i += 1) {
  const base = generateBase();
  if (!bfs(base, null, null)) continue;

  const level1 = gridToRows(base);
  const level2 = placeDoorLevel(base);

  if (level2) {
    console.log(
      JSON.stringify(
        {
          level1,
          level2: level2.rows,
          levers: level2.levers,
          doors: level2.doors,
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }
}

console.error("No maze found");
process.exit(1);
