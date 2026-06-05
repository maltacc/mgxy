import { Grid, MOON, PER_LINE, Puzzle, SUN, SIZE, indexOf } from './types';

function hasThreeConsecutive(board: Grid): Set<number> {
    const violations = new Set<number>();

    const checkLine = (getIdx: (line: number, pos: number) => number) => {
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j <= SIZE - 3; j++) {
                const a = getIdx(i, j), b = getIdx(i, j + 1), c = getIdx(i, j + 2);
                if (board[a] !== 0 && board[a] === board[b] && board[b] === board[c]) {
                    violations.add(a); violations.add(b); violations.add(c);
                }
            }
        }
    };

    checkLine((i, j) => indexOf(i, j));  // rows
    checkLine((i, j) => indexOf(j, i));  // columns
    return violations;
}

function hasValidDistribution(board: Grid): Set<number> {
    const violations = new Set<number>();

    const checkLine = (getIdx: (line: number, pos: number) => number) => {
        for (let i = 0; i < SIZE; i++) {
            let suns = 0, moons = 0;
            for (let j = 0; j < SIZE; j++) {
                const v = board[getIdx(i, j)];
                if (v === SUN) suns++;
                else if (v === MOON) moons++;
            }
            if (suns > PER_LINE || moons > PER_LINE) {
                const over = suns > PER_LINE ? SUN : MOON;
                for (let j = 0; j < SIZE; j++) {
                    const idx = getIdx(i, j);
                    if (board[idx] === over) violations.add(idx);
                }
            }
        }
    };

    checkLine((i, j) => indexOf(i, j));  // rows
    checkLine((i, j) => indexOf(j, i));  // columns
    return violations;
}

function satisfiesConstraints(board: Grid, puzzle: Puzzle): Set<number> {
    const violations = new Set<number>();

    for (const edge of puzzle.constraints) {
        const x = board[edge.a], y = board[edge.b];
        if (x !== 0 && y !== 0) {
            if ((edge.relation === '=' && x !== y) || (edge.relation === 'x' && x === y)) {
                violations.add(edge.a); violations.add(edge.b);
            }
        }
    }

    return violations;
}

export function getViolations(board: Grid, puzzle: Puzzle): Set<number> {
    const violations = new Set<number>();
    for (const v of hasThreeConsecutive(board)) violations.add(v);
    for (const v of hasValidDistribution(board)) violations.add(v);
    for (const v of satisfiesConstraints(board, puzzle)) violations.add(v);
    return violations;
}

export function isSolved(board: Grid, puzzle: Puzzle): boolean {
    return board.every(cell => cell !== 0) && getViolations(board, puzzle).size === 0;
}
