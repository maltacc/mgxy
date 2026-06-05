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
    indexOf
} from './types';

type Adjacency = Map<number, { other: number, relation: Relation }[]>;

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
            if (atRow(start) === v && atRow(start + 1) === v && atRow(start + 2) === v) return true;
        }
    }

    const atCol = (row: number): number => {
        if (row < 0 || row >= SIZE) return -1;
        return row === r ? v : grid[indexOf(row, c)];
    };
    for (const start of [r - 2, r - 1, r]) {
        if (start >= 0 && start + 2 < SIZE) {
            if (atCol(start) === v && atCol(start + 1) === v && atCol(start + 2) === v) return true;
        }
    }

    return false;
}

export function canPlace(grid: Grid, adj: Adjacency, idx: number, v: Cell): boolean {
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
                if (edge.relation === '=' && other !== v) return false;
                if (edge.relation === 'x' && other === v) return false;
            }
        }
    }
    return true;
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
    return grid;
}

// Counts valid completions of a partial board, stopping at maxCount.
function countSolutions(givens: Grid, constraints: EdgeConstraint[], maxCount: number): number {
    const board = givens.slice() as Grid;
    const adj = buildAdjacency(constraints);
    let count = 0;

    const solve = (pos: number): void => {
        if (count >= maxCount) return;
        if (pos === COUNT) { count++; return; }
        if (board[pos] !== 0) { solve(pos + 1); return; }
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

function hasUniqueSolution(givens: Grid, constraints: EdgeConstraint[]): boolean {
    return countSolutions(givens, constraints, 2) === 1;
}

function getAdjacentIndices(idx: number): number[] {
    const r = rowOf(idx), c = colOf(idx);
    return ([-1, 1] as const).flatMap(d => [
        [r + d, c],
        [r, c + d],
    ]).filter(([r2, c2]) => r2 >= 0 && r2 < SIZE && c2 >= 0 && c2 < SIZE)
      .map(([r2, c2]) => indexOf(r2, c2));
}

// Iteratively removes fixed cells (and optionally replaces with edge constraints)
// while the puzzle retains a unique solution. Mutates givens in-place; returns
// the final constraints array.
function minimizePuzzle(
    givens: Grid,
    constraints: EdgeConstraint[],
    includeConstraints: boolean
): EdgeConstraint[] {
    let changed = true;
    while (changed) {
        changed = false;
        for (let idx = 0; idx < COUNT; idx++) {
            if (givens[idx] === 0) continue;

            const saved = givens[idx];
            givens[idx] = 0;

            if (hasUniqueSolution(givens, constraints)) {
                changed = true;
                continue;
            }

            if (includeConstraints) {
                let replaced = false;
                for (const idx2 of getAdjacentIndices(idx)) {
                    if (givens[idx2] === 0) continue;
                    const dup = constraints.some(
                        e => (e.a === idx && e.b === idx2) || (e.a === idx2 && e.b === idx)
                    );
                    if (dup) continue;

                    for (const relation of ['=', 'x'] as Relation[]) {
                        const candidate = [...constraints, { a: idx, b: idx2, relation }];
                        if (hasUniqueSolution(givens, candidate)) {
                            constraints = candidate;
                            changed = true;
                            replaced = true;
                            break;
                        }
                    }
                    if (replaced) break;
                }
                if (replaced) continue;
            }

            givens[idx] = saved;
        }
    }
    return constraints;
}

export function generatePuzzle(): Puzzle {
    const CANDIDATES = 20;
    let bestGivens: Grid | null = null;
    let bestConstraints: EdgeConstraint[] = [];
    let bestSolution: Grid | null = null;
    let bestClueCount = Infinity;

    for (let i = 0; i < CANDIDATES; i++) {
        const solution = generateSolution();
        const givens = solution.slice() as Grid;
        const constraints = minimizePuzzle(givens, [], true);
        const clueCount = givens.filter(v => v !== 0).length + constraints.length;
        if (clueCount < bestClueCount) {
            bestClueCount = clueCount;
            bestGivens = givens;
            bestConstraints = constraints;
            bestSolution = solution;
        }
    }

    return {
        givens: bestGivens!,
        constraints: bestConstraints,
        solution: bestSolution!,
    };
}
