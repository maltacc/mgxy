import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useState } from "react";
import { Grid, Puzzle, SIZE } from "../game/types";
import { Cell } from "./Cell";
import { colors } from "../theme";

interface Props {
    board: Grid;
    puzzle: Puzzle;
    violations: Set<number>;
    hintCell: number | null;
    solved: boolean;
    onCell: (idx: number) => void;
}

const GAP = 2;
const FRAME_PAD = 10; // Board frame padding (each side)

export function Board({ board, puzzle, violations, hintCell, solved, onCell }: Props) {
    const { width: winWidth } = useWindowDimensions();
    const [containerW, setContainerW] = useState(winWidth);
    const [containerH, setContainerH] = useState(9999);

    // Fit within both the measured container width and height (minus frame padding)
    const boardMax = Math.max(120, Math.min(
        containerW - FRAME_PAD * 2,
        containerH - FRAME_PAD * 2,
        460,
    ));
    const cell = Math.max(16, Math.floor((boardMax - GAP * (SIZE + 1)) / SIZE));
    const total = cell * SIZE + GAP * (SIZE + 1);

    return (
        <View
            style={styles.wrapper}
            onLayout={e => {
                setContainerW(e.nativeEvent.layout.width);
                setContainerH(e.nativeEvent.layout.height);
            }}
        >
        <View style={styles.frame}>
            <View style={[styles.grid, { width: total, height: total }]}>
                {Array.from({ length: SIZE * SIZE }, (_, idx) => {
                    const r = Math.floor(idx / SIZE);
                    const c = idx % SIZE;
                    return (
                        <View
                            key={idx}
                            style={{
                                position: 'absolute',
                                left: GAP + c * (cell + GAP),
                                top: GAP + r * (cell + GAP),
                            }}
                        >
                            <Cell
                                value={board[idx]}
                                size={cell}
                                given={puzzle.givens[idx] !== 0}
                                highlight={hintCell === idx}
                                violation={violations.has(idx)}
                                solved={solved}
                                idx={idx}
                                onPress={() => onCell(idx)}
                            />
                        </View>
                    );
                })}

                {puzzle.constraints.map((edge, i) => {
                    const horizontal = edge.b == edge.a + 1; 
                    const ar = Math.floor(edge.a / SIZE);
                    const ac = edge.a % SIZE; 

                    const x = horizontal
                        ? GAP + ac * (cell + GAP) + cell + GAP / 2
                        : GAP + ac * (cell + GAP) + cell / 2;
                    const y = horizontal
                        ? GAP + ar * (cell + GAP) + cell / 2
                        : GAP + ar * (cell + GAP) + cell + GAP / 2;
                    
                    const s = Math.max(15, cell * 0.32); 
                    return (
                        <View
                            key={i}
                            pointerEvents="none"
                            style={[
                                styles.badge,
                                { width: s, height: s, borderRadius: s / 2, left: x - s / 2, top: y - s / 2},
                            ]}>
                                <Text selectable={false} style={[styles.badgeText, { fontSize: s * 0.66 }]}>
                                    {edge.relation == '=' ? '=' : 'x'}
                                </Text>
                        </View>
                    );
                })}
            </View>
        </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
    },
    frame: {
        padding: 10,
        borderRadius: 18,
        backgroundColor: colors.board,
        borderWidth: 1,
        borderColor: '#dde2eb',
        shadowColor: '#1B2233',
        shadowOpacity: 0.1,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
        elevation: 4,
    },
    grid: {
        backgroundColor: '#d8dde8',
        borderRadius: 8,
        overflow: 'hidden',
    },
    badge: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.badgeBg,
    },
    badgeText: {
        color: colors.badgeText,
        fontWeight: '800',
        lineHeight: undefined,
    },
});