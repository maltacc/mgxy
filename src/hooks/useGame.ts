import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generatePuzzle } from '../game/generator';
import { autoFillForced, findHintMove } from "../game/solver";
import { emptyGrid, Grid, nextValue, Puzzle } from '../game/types';
import { getViolations, isSolved } from "../game/validate";

export type Difficulty = 'hard' | 'minimal';

type DiffState = { board: Grid; seconds: number };

export interface GameState {
    puzzle: Puzzle | null;
    board: Grid;
    solved: boolean;
    violations: Set<number>;
    seconds: number;
    showErrors: boolean;
    paused: boolean;
    loading: boolean;
    canUndo: boolean;
    difficulty: Difficulty;
    hintCell: number | null;
    setShowErrors: (value: boolean) => void;
    setDifficulty: (d: Difficulty) => void;
    newGame: () => void;
    cycleCell: (idx: number) => void;
    undo: () => void;
    clear: () => void;
    autoFill: () => void;
    togglePause: () => void;
    showHint: () => void;
}

const STORAGE_KEY = 'tango_game';
const STORAGE_VERSION = 9;

const emptyDiff = (): DiffState => ({ board: emptyGrid(), seconds: 0 });

function loadSaved(): {
    minimalPuzzle: Puzzle;
    hardPuzzle: Puzzle;
    perDiff: Record<Difficulty, DiffState>;
    difficulty: Difficulty;
} | null {
    if (typeof localStorage === 'undefined') return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed.v !== STORAGE_VERSION) return null;
        return parsed;
    } catch { return null; }
}

export function useGame(): GameState {
    const saved = useMemo(loadSaved, []);

    const [minimalPuzzle, setMinimalPuzzle] = useState<Puzzle | null>(saved?.minimalPuzzle ?? null);
    const [hardPuzzle, setHardPuzzle] = useState<Puzzle | null>(saved?.hardPuzzle ?? null);
    const [difficulty, setDifficulty] = useState<Difficulty>(saved?.difficulty ?? 'hard');
    const [perDiff, setPerDiff] = useState<Record<Difficulty, DiffState>>(
        saved?.perDiff ?? { hard: emptyDiff(), minimal: emptyDiff() }
    );
    const [history, setHistory] = useState<Grid[]>([]);
    const [showErrors, setShowErrors] = useState(true);
    const [paused, setPaused] = useState(false);
    const [loading, setLoading] = useState(saved === null);
    const [hintCell, setHintCell] = useState<number | null>(null);

    const puzzle = difficulty === 'minimal' ? minimalPuzzle : hardPuzzle;
    const board = perDiff[difficulty].board;
    const seconds = perDiff[difficulty].seconds;

    useEffect(() => {
        if (!loading) return;
        const minimal = generatePuzzle('minimal');
        const hard = generatePuzzle('hard');
        setMinimalPuzzle(minimal);
        setHardPuzzle(hard);
        setPerDiff({
            minimal: { board: minimal.givens.slice() as Grid, seconds: 0 },
            hard: { board: hard.givens.slice() as Grid, seconds: 0 },
        });
        setLoading(false);
    }, [loading]);

    const solved = useMemo(() => puzzle !== null && isSolved(board, puzzle), [board, puzzle]);
    const rawViolations = useMemo(() => (showErrors && puzzle !== null ? getViolations(board, puzzle) : new Set<number>()), [board, puzzle, showErrors]);
    const [violations, setViolations] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (rawViolations.size === 0) { setViolations(new Set()); return; }
        const id = setTimeout(() => setViolations(rawViolations), 500);
        return () => clearTimeout(id);
    }, [rawViolations]);

    useEffect(() => {
        if (solved || paused || loading) return;
        const id = setInterval(() => {
            setPerDiff(p => ({ ...p, [difficulty]: { ...p[difficulty], seconds: p[difficulty].seconds + 1 } }));
        }, 1000);
        return () => clearInterval(id);
    }, [solved, paused, loading, difficulty]);

    useEffect(() => {
        if (typeof localStorage === 'undefined' || minimalPuzzle === null || hardPuzzle === null) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: STORAGE_VERSION, minimalPuzzle, hardPuzzle, perDiff, difficulty }));
    }, [minimalPuzzle, hardPuzzle, perDiff, difficulty]);

    const newGame = useCallback(() => {
        setMinimalPuzzle(null);
        setHardPuzzle(null);
        setPerDiff({ hard: emptyDiff(), minimal: emptyDiff() });
        setHistory([]);
        setPaused(false);
        setHintCell(null);
        setLoading(true);
    }, []);

    const lastCycleRef = useRef<{ idx: number; time: number } | null>(null);
    const cycleCell = useCallback((idx: number) => {
        if (puzzle === null || puzzle.givens[idx] !== 0 || solved) return;
        setHintCell(null);
        const now = Date.now();
        const prev = lastCycleRef.current;
        const sameCell = prev !== null && prev.idx === idx && now - prev.time < 800;
        lastCycleRef.current = { idx, time: now };
        if (!sameCell) setHistory(h => [...h, board]);
        setPerDiff(p => {
            const next = p[difficulty].board.slice() as Grid;
            next[idx] = nextValue(next[idx]);
            return { ...p, [difficulty]: { ...p[difficulty], board: next } };
        });
    }, [board, difficulty, puzzle, solved]);

    const undo = useCallback(() => {
        setHistory(h => {
            if (h.length === 0) return h;
            const prev = h[h.length - 1];
            setPerDiff(p => ({ ...p, [difficulty]: { ...p[difficulty], board: prev } }));
            return h.slice(0, -1);
        });
    }, [difficulty]);

    const clear = useCallback(() => {
        if (puzzle === null) return;
        setHistory(h => [...h, board]);
        setPerDiff(p => ({ ...p, [difficulty]: { ...p[difficulty], board: puzzle.givens.slice() as Grid } }));
    }, [board, difficulty, puzzle]);

    const autoFill = useCallback(() => {
        if (puzzle === null) return;
        setHistory(h => [...h, board]);
        setPerDiff(p => ({ ...p, [difficulty]: { ...p[difficulty], board: autoFillForced(board, puzzle) } }));
    }, [board, difficulty, puzzle]);

    const togglePause = useCallback(() => setPaused(p => !p), []);

    const showHint = useCallback(() => {
        if (puzzle === null || solved) return;
        const move = findHintMove(board, puzzle);
        setHintCell(move?.idx ?? null);
    }, [board, puzzle, solved]);

    return { puzzle, board, solved, violations, seconds, showErrors, paused, loading, canUndo: history.length > 0, difficulty, hintCell, setShowErrors, setDifficulty, newGame, cycleCell, undo, clear, autoFill, togglePause, showHint };
}