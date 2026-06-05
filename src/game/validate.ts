import { COUNT, Grid, MOON, PER_LINE, Puzzle, SUN, SIZE } from './types';

// return set of cell indices that violate constraints 
export function getViolations(board: Grid, puzzle: Puzzle): Set<number> {
    const violations = new Set<number>();

    // 3 in a line
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const idx = r * SIZE + c;
            if (c <= SIZE - 3) {
                const a = board[idx];
                if (a !== 0 && a === board[idx + 1] && a === board[idx + 2]) {
                    violations.add(idx);
                    violations.add(idx + 1);
                    violations.add(idx + 2);
                }
            }
            if (r <= SIZE - 3) {
                const a = board[idx];
                if (a !== 0 && a === board[idx + SIZE] && a === board[idx + 2 * SIZE]) {
                    violations.add(idx);
                    violations.add(idx + SIZE);
                    violations.add(idx + 2 * SIZE);
                }
            }
        }
    }

    // too many of a symbol in a row/col 
    const flag = (indices: number[]) => {
        let suns = 0; 
        let moons = 0; 

        for (const i of indices) {
            if (board[i] === SUN) suns++;
            else if (board[i] === MOON) moons++;
        }
        if (suns > PER_LINE || moons > PER_LINE) {
            const over = suns > PER_LINE ? SUN : MOON;
            for (const i of indices) {
                if (board[i] === over) {
                    violations.add(i);
                }
            }
        }
    }
    for (let r = 0; r < SIZE; r++) {
        flag(Array.from({ length: SIZE }, (_, i) => r * SIZE + i));
    }
    for (let c = 0; c < SIZE; c++) {
        flag(Array.from({ length: SIZE }, (_, i) => i * SIZE + c));
    }

    // broken constraint signs
    for (const edge of puzzle.constraints) {
        const x = board[edge.a];
        const y = board[edge.b];
        if (x !== 0 && y !== 0) {
            if ((edge.relation === '=' && x !== y) || (edge.relation === 'x' && x === y)) {
                violations.add(edge.a).add(edge.b);
            }
        }
    }
    return violations;
}

// board solved when it's completely filled with no violations
export function isSolved(board: Grid, puzzle: Puzzle): boolean {
    return board.every(cell => cell !== 0) && getViolations(board, puzzle).size === 0;
}