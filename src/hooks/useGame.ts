import { useCallback, useEffect, useMemo, useState } from "react";
import { generatePuzzle } from '../game/generator';
import { autoFillForced } from "../game/solver";
import { Grid, nextValue, Puzzle } from '../game/types';
import { getViolations, isSolved } from "../game/validate";

export interface GameState {
    puzzle: Puzzle;
    board: Grid;
    solved: boolean;
    violations: Set<number>;
    seconds: number;
    showErrors: boolean;
    paused: boolean;
    canUndo: boolean;
    setShowErrors: (value: boolean) => void;
    newGame: () => void;
    cycleCell: (idx: number) => void;
    undo: () => void;
    clear: () => void;
    autoFill: () => void;
    togglePause: () => void;
}

const STORAGE_KEY = 'tango_game';
const STORAGE_VERSION = 3; // bump when generator logic changes to discard stale saves

function loadSaved(): { puzzle: Puzzle; board: Grid; seconds: number } | null {
    if (typeof localStorage === 'undefined') return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed.v !== STORAGE_VERSION) return null;
        const { puzzle, board, seconds } = parsed;
        if (puzzle && board && typeof seconds === 'number') return { puzzle, board, seconds };
    } catch {}
    return null;
}

function getInitialState(): { puzzle: Puzzle; board: Grid; seconds: number } {
    const saved = loadSaved();
    if (saved) return saved;
    const puzzle = generatePuzzle();
    return { puzzle, board: puzzle.givens.slice() as Grid, seconds: 0 };
}

export function useGame(): GameState {
    const [{ puzzle: initPuzzle, board: initBoard, seconds: initSeconds }] = useState(getInitialState);
    const [puzzle, setPuzzle] = useState<Puzzle>(initPuzzle);
    const [board, setBoard] = useState<Grid>(initBoard);
    const [history, setHistory] = useState<Grid[]>([]);
    const [seconds, setSeconds] = useState(initSeconds);
    const [showErrors, setShowErrors] = useState(true);
    const [paused, setPaused] = useState(false);

    const solved = useMemo(() => isSolved(board, puzzle), [board, puzzle]);

    const rawViolations = useMemo(
        () => (showErrors ? getViolations(board, puzzle) : new Set<number>()),
        [board, puzzle, showErrors]
    );

    // Show errors only after 0.5s of inactivity; clear them immediately when fixed
    const [violations, setViolations] = useState<Set<number>>(new Set());
    useEffect(() => {
        if (rawViolations.size === 0) { setViolations(new Set()); return; }
        const id = setTimeout(() => setViolations(rawViolations), 500);
        return () => clearTimeout(id);
    }, [rawViolations]);

    // Timer — stops when solved or paused
    useEffect(() => {
        if (solved || paused) return;
        const id = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(id);
    }, [solved, paused]);

    // Auto-pause when tab loses focus
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const onVisibility = () => { if (document.hidden) setPaused(true); };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, []);

    // Persist puzzle + board + seconds to localStorage
    useEffect(() => {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: STORAGE_VERSION, puzzle, board, seconds }));
    }, [puzzle, board, seconds]);

    const newGame = useCallback(() => {
        const generated = generatePuzzle();
        setPuzzle(generated);
        setBoard(generated.givens.slice() as Grid);
        setHistory([]);
        setSeconds(0);
        setPaused(false);
    }, []);

    const cycleCell = useCallback((idx: number) => {
        if (puzzle.givens[idx] !== 0 || solved) return;
        setHistory(h => [...h, board]);
        setBoard(prev => {
            const next = prev.slice() as Grid;
            next[idx] = nextValue(next[idx]);
            return next;
        });
    }, [board, puzzle, solved]);

    const undo = useCallback(() => {
        setHistory(h => {
            if (h.length === 0) return h;
            setBoard(h[h.length - 1]);
            return h.slice(0, -1);
        });
    }, []);

    const clear = useCallback(() => {
        setHistory(h => [...h, board]);
        setBoard(puzzle.givens.slice() as Grid);
    }, [board, puzzle]);

    const autoFill = useCallback(() => {
        setHistory(h => [...h, board]);
        setBoard(autoFillForced(board, puzzle));
    }, [board, puzzle]);

    const togglePause = useCallback(() => setPaused(p => !p), []);

    return {
        puzzle,
        board,
        solved,
        violations,
        seconds,
        showErrors,
        paused,
        canUndo: history.length > 0,
        setShowErrors,
        newGame,
        cycleCell,
        undo,
        clear,
        autoFill,
        togglePause,
    };
}
