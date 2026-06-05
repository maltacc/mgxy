import { buildAdjacency, canPlace } from './generator';
import { Cell, COUNT, Grid, Puzzle } from './types';

export interface Move {
  idx: number;
  value: Cell;
}

export function findForcedMove(board: Grid, puzzle: Puzzle): Move | null {
  const adj = buildAdjacency(puzzle.constraints);
  for (let idx = 0; idx < COUNT; idx++) {
    if (board[idx] !== 0) continue;
    const canSun = canPlace(board, adj, idx, 1);
    const canMoon = canPlace(board, adj, idx, 2);
    if (canSun && !canMoon) return { idx, value: 1 };
    if (!canSun && canMoon) return { idx, value: 2 };
  }
  return null;
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

// Finds the next hint cell. First returns any forced move from the current board
// (deduction can proceed). When deduction is stuck, advances via full propagation
// then BFS-scans for the first valid solution move that doesn't trivially complete
// both sides of a relation pair.
export function findHintMove(board: Grid, puzzle: Puzzle): Move | null {
  // If there's a forced move from the current board state, show that first.
  // This covers deduction-solvable boards (including many minimal puzzles) where
  // the full deduction loop would fill everything and leave no BFS candidates.
  const forced = findForcedMove(board, puzzle);
  if (forced) return forced;

  // No forced move — advance a copy as far as deduction allows to find the stuck
  // state, then BFS for the next valid move from the solution.
  const { givens, constraints, solution } = puzzle;
  const adj = buildAdjacency(constraints);

  const advanced = board.slice() as Grid;
  let changed = true;
  while (changed) {
    changed = false;
    for (let idx = 0; idx < COUNT; idx++) {
      if (advanced[idx] !== 0) continue;
      const canSun = canPlace(advanced, adj, idx, 1);
      const canMoon = canPlace(advanced, adj, idx, 2);
      if (canSun && !canMoon) { advanced[idx] = 1; changed = true; }
      else if (!canSun && canMoon) { advanced[idx] = 2; changed = true; }
    }
  }

  // First pass: prefer cells that don't complete both sides of a relation pair
  for (let idx = 0; idx < COUNT; idx++) {
    if (advanced[idx] !== 0) continue;
    const v = solution[idx] as Cell;
    if (!canPlace(advanced, adj, idx, v)) continue;
    const fillsRelation = constraints.some(
      ({ a, b }) => (idx === a && givens[b] !== 0) || (idx === b && givens[a] !== 0),
    );
    if (fillsRelation) continue;
    return { idx, value: v };
  }

  // Fallback: any valid ambiguous cell
  for (let idx = 0; idx < COUNT; idx++) {
    if (advanced[idx] !== 0) continue;
    const v = solution[idx] as Cell;
    if (canPlace(advanced, adj, idx, v)) return { idx, value: v };
  }

  return null;
}