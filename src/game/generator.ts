import {
  Cell,
  COUNT,
  EdgeConstraint,
  emptyGrid,
  Grid,
  PER_LINE,
  Puzzle,
  Relation,
  SIZE,
  rowOf,
  colOf,
  indexOf,
} from "./types";

type Adjacency = Map<number, { other: number; relation: Relation }[]>;

export function buildAdjacency(constraints: EdgeConstraint[]): Adjacency {
  const map: Adjacency = new Map();
  const add = (a: number, b: number, relation: Relation) => {
    const list = map.get(a) ?? [];
    list.push({ other: b, relation });
    map.set(a, list);
  };
  for (const edge of constraints) {
    add(edge.a, edge.b, edge.relation);
    add(edge.b, edge.a, edge.relation);
  }
  return map;
}

function makesTriple(grid: Grid, idx: number, v: Cell): boolean {
  const r = rowOf(idx);
  const c = colOf(idx);

  const atRow = (col: number): number => {
    if (col < 0 || col >= SIZE) return -1;
    return col === c ? v : grid[indexOf(r, col)];
  };
  for (const start of [c - 2, c - 1, c]) {
    if (start >= 0 && start + 2 < SIZE) {
      if (
        atRow(start) === v &&
        atRow(start + 1) === v &&
        atRow(start + 2) === v
      )
        return true;
    }
  }

  const atCol = (row: number): number => {
    if (row < 0 || row >= SIZE) return -1;
    return row === r ? v : grid[indexOf(row, c)];
  };
  for (const start of [r - 2, r - 1, r]) {
    if (start >= 0 && start + 2 < SIZE) {
      if (
        atCol(start) === v &&
        atCol(start + 1) === v &&
        atCol(start + 2) === v
      )
        return true;
    }
  }

  return false;
}

export function canPlace(
  grid: Grid,
  adj: Adjacency,
  idx: number,
  v: Cell,
): boolean {
  const r = rowOf(idx);
  const c = colOf(idx);

  if (makesTriple(grid, idx, v)) return false;

  let rowCount = 0;
  let colCount = 0;
  for (let i = 0; i < SIZE; i++) {
    if (grid[indexOf(r, i)] === v) rowCount++;
    if (grid[indexOf(i, c)] === v) colCount++;
  }
  if (rowCount >= PER_LINE || colCount >= PER_LINE) return false;

  const neighbors = adj.get(idx);
  if (neighbors) {
    for (const edge of neighbors) {
      const other = grid[edge.other];
      if (other !== 0) {
        if (edge.relation === "=" && other !== v) return false;
        if (edge.relation === "x" && other === v) return false;
      }
    }
  }
  return true;
}

// The 8 symmetries of a square grid (rotations + reflections).
// Each maps (row, col) → (new_row, new_col).
const SYMMETRIES: Array<(r: number, c: number) => [number, number]> = [
  (r, c) => [r, c],                         // identity
  (r, c) => [c, SIZE - 1 - r],              // rotate 90° CW
  (r, c) => [SIZE - 1 - r, SIZE - 1 - c],  // rotate 180°
  (r, c) => [SIZE - 1 - c, r],              // rotate 270° CW
  (r, c) => [r, SIZE - 1 - c],              // flip horizontal
  (r, c) => [SIZE - 1 - r, c],              // flip vertical
  (r, c) => [c, r],                          // transpose
  (r, c) => [SIZE - 1 - c, SIZE - 1 - r],  // anti-transpose
];

function applySymmetry(
  grid: Grid,
  sym: (r: number, c: number) => [number, number],
): Grid {
  const result = emptyGrid();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const [nr, nc] = sym(r, c);
      result[indexOf(nr, nc)] = grid[indexOf(r, c)];
    }
  }
  return result as Grid;
}

function generateSolution(): Grid {
  const grid = emptyGrid();
  const adj: Adjacency = new Map();

  const recurse = (pos: number): boolean => {
    if (pos === COUNT) return true;
    const values = Math.random() < 0.5 ? [1, 2] : [2, 1];
    for (const v of values) {
      if (canPlace(grid, adj, pos, v as Cell)) {
        grid[pos] = v as Cell;
        if (recurse(pos + 1)) return true;
        grid[pos] = 0;
      }
    }
    return false;
  };
  recurse(0);

  const sym = SYMMETRIES[Math.floor(Math.random() * SYMMETRIES.length)];
  return applySymmetry(grid, sym);
}

// Counts valid completions of a partial board, stopping at maxCount.
function countSolutions(
  givens: Grid,
  constraints: EdgeConstraint[],
  maxCount: number,
): number {
  const board = givens.slice() as Grid;
  const adj = buildAdjacency(constraints);
  let count = 0;

  const solve = (pos: number): void => {
    if (count >= maxCount) return;
    if (pos === COUNT) {
      count++;
      return;
    }
    if (board[pos] !== 0) {
      solve(pos + 1);
      return;
    }
    for (const v of [1, 2] as Cell[]) {
      if (canPlace(board, adj, pos, v)) {
        board[pos] = v;
        solve(pos + 1);
        board[pos] = 0;
      }
    }
  };

  solve(0);
  return count;
}

function hasUniqueSolution(
  givens: Grid,
  constraints: EdgeConstraint[],
): boolean {
  return countSolutions(givens, constraints, 2) === 1;
}

function getAdjacentIndices(idx: number): number[] {
  const r = rowOf(idx),
    c = colOf(idx);
  return ([-1, 1] as const)
    .flatMap((d) => [
      [r + d, c],
      [r, c + d],
    ])
    .filter(([r2, c2]) => r2 >= 0 && r2 < SIZE && c2 >= 0 && c2 < SIZE)
    .map(([r2, c2]) => indexOf(r2, c2));
}

// Iteratively removes fixed cells (and optionally replaces with edge constraints)
// while the puzzle retains a unique solution. Mutates givens in-place; returns
// the final constraints array.
function minimizePuzzle(
  givens: Grid,
  solution: Grid, // Crucial: must pass the full valid solution
  constraints: EdgeConstraint[],
  includeConstraints: boolean,
): EdgeConstraint[] {
  let changed = true;
  while (changed) {
    changed = false;

    for (let idx = 0; idx < COUNT; idx++) {
      if (givens[idx] === 0) continue;

      const saved = givens[idx];

      // 1. Try removing the cell entirely
      givens[idx] = 0;
      if (hasUniqueSolution(givens, constraints)) {
        changed = true;
        continue; // Successfully removed, move to next
      }
      // Revert if it broke uniqueness
      givens[idx] = saved;

      // 2. Try replacing with a constraint
      if (includeConstraints) {
        for (const idx2 of getAdjacentIndices(idx)) {
          if (givens[idx2] === 0) continue;

          // Check for existing constraints to avoid duplicates
          const exists = constraints.some(
            (e) => (e.a === idx && e.b === idx2) || (e.a === idx2 && e.b === idx),
          );
          if (exists) continue;

          // FIX: Only try the relation that matches the known valid solution
          const relation: Relation = (solution[idx] === solution[idx2]) ? "=" : "x";
          const candidate = [...constraints, { a: idx, b: idx2, relation }];

          // Temporarily remove the cell and apply the constraint
          givens[idx] = 0;
          if (hasUniqueSolution(givens, candidate)) {
            constraints = candidate;
            changed = true;
            break; 
          }
          // Revert if the constraint didn't preserve uniqueness
          givens[idx] = saved;
        }
      }
      if (changed) break; // Restart loop if modification occurred
    }
  }
  return constraints;
}


function isSolvableByDeduction(givens: Grid, constraints: EdgeConstraint[]): boolean {
  const board = givens.slice() as Grid;
  const adj = buildAdjacency(constraints);
  let changed = true;
  while (changed) {
    changed = false;
    for (let idx = 0; idx < COUNT; idx++) {
      if (board[idx] !== 0) continue;
      const canSun = canPlace(board, adj, idx, 1);
      const canMoon = canPlace(board, adj, idx, 2);
      if (!canSun && !canMoon) return false; // contradiction
      if (canSun && !canMoon) { board[idx] = 1; changed = true; }
      else if (!canSun && canMoon) { board[idx] = 2; changed = true; }
    }
  }
  return board.every(v => v !== 0);
}

// BFS over stuck cells: find first valid hint that doesn't complete both sides of a
// relation pair (which would make the constraint trivially readable).
function findDeductionHint(
  givens: Grid,
  constraints: EdgeConstraint[],
  solution: Grid,
): number | null {
  const adj = buildAdjacency(constraints);

  // Advance board as far as deduction allows to find genuinely ambiguous cells
  const board = givens.slice() as Grid;
  let changed = true;
  while (changed) {
    changed = false;
    for (let idx = 0; idx < COUNT; idx++) {
      if (board[idx] !== 0) continue;
      const canSun = canPlace(board, adj, idx, 1);
      const canMoon = canPlace(board, adj, idx, 2);
      if (canSun && !canMoon) { board[idx] = 1; changed = true; }
      else if (!canSun && canMoon) { board[idx] = 2; changed = true; }
    }
  }

  // First pass: prefer cells that don't complete both sides of any relation pair
  for (let idx = 0; idx < COUNT; idx++) {
    if (board[idx] !== 0) continue;
    const v = solution[idx] as Cell;
    if (!canPlace(board, adj, idx, v)) continue;
    const fillsRelation = constraints.some(
      ({ a, b }) => (idx === a && givens[b] !== 0) || (idx === b && givens[a] !== 0),
    );
    if (fillsRelation) continue;
    return idx;
  }

  // Fallback: any valid ambiguous cell
  for (let idx = 0; idx < COUNT; idx++) {
    if (board[idx] !== 0) continue;
    const v = solution[idx] as Cell;
    if (canPlace(board, adj, idx, v)) return idx;
  }

  return null;
}

export function generatePuzzle(mode: 'hard' | 'minimal'): Puzzle {
  const CANDIDATES = 10;
  let bestGivens: Grid | null = null;
  let bestConstraints: EdgeConstraint[] = [];
  let bestSolution: Grid | null = null;
  let bestClueCount = Infinity;

  const targetBudget = mode === 'minimal' ? 8 : 16;

  for (let i = 0; i < CANDIDATES; i++) {
    const solution = generateSolution();
    const givens = solution.slice() as Grid;
    const constraints = minimizePuzzle(givens, solution, [], true);
    const clueCount = givens.filter((v) => v !== 0).length + constraints.length;

    if (clueCount < bestClueCount) {
      bestClueCount = clueCount;
      bestGivens = givens;
      bestConstraints = constraints;
      bestSolution = solution;
    }

    if (bestClueCount <= targetBudget) break;
  }

  let { givens, constraints, solution } = { givens: bestGivens!, constraints: bestConstraints, solution: bestSolution! };

  if (mode === 'minimal') {
    // Return the raw minimizer output — unique solution guaranteed, no extra hints.
    return { givens, constraints, solution };
  }

  // Hard mode: add BFS-chosen hints until fully solvable by constraint propagation.
  while (!isSolvableByDeduction(givens, constraints)) {
    const hint = findDeductionHint(givens, constraints, solution);
    if (hint === null) break;
    givens = givens.slice() as Grid;
    givens[hint] = solution[hint];
  }

  // Drop one given from any relation pair where both are filled —
  // the remaining given + the relation makes the removed cell deducible.
  givens = givens.slice() as Grid;
  for (const { a, b } of constraints) {
    if (givens[a] !== 0 && givens[b] !== 0) givens[b] = 0;
  }

  return { givens, constraints, solution };
}