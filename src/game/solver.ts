import { buildAdjacency, canPlace } from './generator'; 
import { Cell, COUNT, Grid, Puzzle } from './types';

export interface Move {
    idx: number; 
    value: Cell; 
}

// find valid cell
export function findForcedMove(board: Grid, puzzle: Puzzle): Move | null {
    const adj = buildAdjacency(puzzle.constraints);
    
    for (let idx = 0; idx < COUNT; idx++) {
        if (board[idx] !== 0) continue; // skip filled cells
        const canSun = canPlace(board, adj, idx, 1);
        const canMoon = canPlace(board, adj, idx, 2);
        if (canSun && !canMoon) {
            return { idx, value: 1 };
        }
        if (!canSun && canMoon) {
            return { idx, value: 2 };
        }
    }
    return null; // no forced move found
}

export function autoFillForced(board: Grid, puzzle: Puzzle): Grid {
    const next = board.slice() as Grid;
    let move = findForcedMove(next, puzzle);
    while (move) {
        next[move.idx] = move.value;
        move = findForcedMove(next, puzzle);
    }
    return next;
}

// getHint (not needed)