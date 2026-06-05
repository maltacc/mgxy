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

// fisher-yates shuffle
function shuffle<T>(array: T[]): T[] {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function buildAdjacency(constraints: EdgeConstraint[]): Adjacency {
    // build relations of cell + its adjacent cells for quick lookup during generation
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

    // Treat the target cell as v when scanning windows
    const atRow = (col: number): number => {
        if (col < 0 || col >= SIZE) return -1;
        return col === c ? v : grid[indexOf(r, col)];
    };

    for (const start of [c - 2, c - 1, c]) {
        if (start >= 0 && start + 2 < SIZE) {
            if (atRow(start) === v && atRow(start + 1) === v && atRow(start + 2) === v) {
                return true;
            }
        }
    }

    const atCol = (row: number): number => {
        if (row < 0 || row >= SIZE) return -1;
        return row === r ? v : grid[indexOf(row, c)];
    };

    for (const start of [r - 2, r - 1, r]) {
        if (start >= 0 && start + 2 < SIZE) {
            if (atCol(start) === v && atCol(start + 1) === v && atCol(start + 2) === v) {
                return true;
            }
        }
    }

    return false;
}

// can X val be placed at cur empty cell without breaking a rule
export function canPlace(grid: Grid, adj: Adjacency, idx: number, v: Cell): boolean {
    const r = rowOf(idx);
    const c = colOf(idx);
    
    // no more than 3 consecutive symbols
    if (makesTriple(grid, idx, v)) {
        return false;
    }

    // no more than 3 of a symbol per line
    let rowCount = 0; 
    let colCount = 0; 
    for (let i = 0; i < SIZE; i++) {
        if (grid[indexOf(r, i)] === v) rowCount++;
        if (grid[indexOf(i, c)] === v) colCount++;
    }
    if (rowCount >= PER_LINE || colCount >= PER_LINE) {
        return false;
    }

    //  = / x adhered to
    const neighbors = adj.get(idx); 
    if (neighbors) {
        for (const edge of neighbors) {
            const other = grid[edge.other];
            if (other !== 0) {
                if (edge.relation === '=' && other !== v) {
                    return false;
                }
                if (edge.relation === 'x' && other === v) {
                    return false;
                }
            }
        }
    }
    return true;
}

// count num solns for puzzle 
// stop early once LIMIT solns found
export function countSolutions(
    givens: Grid, 
    constraints: EdgeConstraint[],
    limit = 2
): number {
    const grid = givens.slice() as Grid;
    const order: number[] = []; 
    for (let i = 0; i < COUNT; i++) {
        if (givens[i] === 0) {
            order.push(i);
        }
    }

    const adj = buildAdjacency(constraints);
    let count = 0;

    const recurse = (pos: number) => {
        if (pos == order.length) {
            count++; 
            return count >= limit; // stop if we reach limit
        }

        const idx = order[pos];
        for (let v = 1; v <= 2; v++) {
            if (canPlace(grid, adj, idx, v as Cell)) {
                grid[idx] = v as Cell;
                const stop = recurse(pos + 1);
                if (stop) return true;
                grid[idx] = 0;
            }
        }
        return false;
    }

    recurse(0);
    return count;
}

export function generateSolution(): Grid {
    const grid = emptyGrid();
    const adj: Adjacency = new Map();

    const recurse = (pos: number): boolean => {
        if (pos == COUNT) {
            return true;
        }

        const values = Math.random() < 0.5 ? [1, 2] : [2, 1]; // randomize order of trying sun vs moon
        for (const v of values) {
            if (canPlace(grid, adj, pos, v as Cell)) {
                grid[pos] = v as Cell;
                if (recurse(pos + 1)) {
                    return true;
                }
                grid[pos] = 0;
            }
        }
        return false;
    }
    recurse(0); 
    return grid;
}

// every adj edge of the soln (labelled with = or x)
function allEdges(solution: Grid): EdgeConstraint[] {
    const edges: EdgeConstraint[] = [];
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const idx = indexOf(r, c);
            if (c < SIZE - 1) {
                edges.push({
                    a: idx,
                    b: indexOf(r, c + 1),
                    relation: solution[idx] === solution[indexOf(r, c + 1)] ? '=' : 'x',
                });
            }
            if (r < SIZE - 1) {
                edges.push({
                    a: idx,
                    b: indexOf(r + 1, c),
                    relation: solution[idx] === solution[indexOf(r + 1, c)] ? '=' : 'x',
                });
            }
        }
    }
    return edges;
}

// remove constrain thats not required for uniqueness
function minimizeConstraints(givens: Grid, constraints: EdgeConstraint[]): EdgeConstraint[] {
    let kept = constraints.slice();
    for (const edge of constraints) {
        const trial = kept.filter(e => e !== edge);
        if (countSolutions(givens, trial) === 1) {
            kept = trial;
        }   
    }
    return kept;
}

// remove clues not needed for unique soln 
function minimizeGivens(givens: Grid, constraints: EdgeConstraint[]): void {
    const filled = shuffle(
        givens.map((v, i) => (v !== 0 ? i : -1)).filter(i => i >= 0),
    ); 
    for (const i of filled) {
        const value = givens[i];
        givens[i] = 0;
        if (countSolutions(givens, constraints) !== 1) {
            givens[i] = value;
        }
    }
}

// add n extra correct cells to make puzzle easier
function addExtraGivens(givens: Grid, solution: Grid, n: number): void {
    const empties = shuffle(
        givens.map((v, i) => (v === 0 ? i : -1)).filter(i => i >= 0),
    );
    for (let i = 0; i < n && i < empties.length; i++) {
        givens[empties[i]] = solution[empties[i]];
    }
}

// Returns true if every empty cell can be filled using only forced moves
// (cells where exactly one symbol is valid). A puzzle that fails this check
// requires trial-and-error or lookahead — not playable by a regular user.
function isForceSolvable(givens: Grid, constraints: EdgeConstraint[]): boolean {
    const board = givens.slice() as Grid;
    const adj = buildAdjacency(constraints);
    let changed = true;
    while (changed) {
        changed = false;
        for (let idx = 0; idx < COUNT; idx++) {
            if (board[idx] !== 0) continue;
            const canSun = canPlace(board, adj, idx, 1 as Cell);
            const canMoon = canPlace(board, adj, idx, 2 as Cell);
            if (canSun !== canMoon) {
                board[idx] = canSun ? 1 : 2;
                changed = true;
            }
        }
    }
    return board.every(v => v !== 0);
}

// generate fresh puzzle with guaranteed unique soln
export function generatePuzzle(): Puzzle {
    const solution = generateSolution();
    const givens = emptyGrid();
    const edges = shuffle(allEdges(solution));
    const cells = shuffle(Array.from({ length: COUNT }, (_, i) => i));
    
    let constraints: EdgeConstraint[] = []; 
    let edgeIdx = 0; 
    let cellIdx = 0; 
    const edgeBias = 0.85; // very hard 

    let guard = 0; 
    while (countSolutions(givens, constraints) > 1 && guard++ < 400) {
        const pickEdge = cellIdx >= cells.length 
        ? true 
        : edgeIdx >= edges.length
            ? false
            : Math.random() < edgeBias;

        if (pickEdge && edgeIdx < edges.length) {
            constraints.push(edges[edgeIdx++]);
        }
        else if (cellIdx < cells.length) {
            const ci = cells[cellIdx++];
            givens[ci] = solution[ci];
        }
        else if (edgeIdx < edges.length) {
            constraints.push(edges[edgeIdx++]);
        }
        else {
            break;
        }
    }
    constraints = minimizeConstraints(givens, constraints);
    minimizeGivens(givens, constraints);

    // After minimisation the puzzle is unique but may require lookahead to solve.
    // Add back edges (already shuffled in `edges`) until every cell has at least
    // one forced-move step that reaches it — making it human-playable.
    if (!isForceSolvable(givens, constraints)) {
        const extra = edges.filter(
            e => !constraints.some(c => c.a === e.a && c.b === e.b)
        );
        for (const edge of extra) {
            constraints.push(edge);
            if (isForceSolvable(givens, constraints)) break;
        }
    }

    return { givens, constraints, solution };
}