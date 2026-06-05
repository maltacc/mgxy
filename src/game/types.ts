export type Cell = 0 | 1 | 2; // 0: empty, 1: sun, 2: moon

export const EMPTY: Cell = 0;
export const SUN: Cell = 1;
export const MOON: Cell = 2;

export const SIZE = 6; // default board size 
export const COUNT = SIZE * SIZE; 
export const PER_LINE = SIZE / 2; // num of each symbol per line

export type Grid = Cell[]; // idx'd as row * SIZE + col
export type Relation = '=' | 'x'; 

// constraint between 2 adj cells
export interface EdgeConstraint {
    a: number; 
    b: number; 
    relation: Relation;
}

export interface Puzzle {
    givens: Grid; // intial symbols given with board
    constraints: EdgeConstraint[]; // x or = 
    solution: Grid; 
}

export function rowOf(idx: number): number {
    return Math.floor(idx / SIZE);
}

export function colOf(idx: number): number {
    return idx % SIZE;
}

export function indexOf(row: number, col: number): number {
    return row * SIZE + col;
}

export function nextValue(v: Cell): Cell {
    return ((v + 1) % 3) as Cell; // cycle through symbols
}

export function emptyGrid(): Grid {
    return new Array(COUNT).fill(EMPTY) as Grid;
}
