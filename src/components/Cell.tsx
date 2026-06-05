import { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Cell as CellValue } from "../game/types";
import { colors } from "../theme";
import { GameSymbol } from "./GameSymbol";

interface Props {
  value: CellValue;
  size: number;
  given: boolean;
  violation: boolean;
  highlight: boolean;
  solved: boolean;
  idx: number;
  onPress: () => void;
}

export function Cell({ value, size, given, violation, highlight, solved, idx, onPress }: Props) {
  const liftProgress = useSharedValue(0);

  useEffect(() => {
    if (!solved) {
      cancelAnimation(liftProgress);
      liftProgress.value = 0;
      return;
    }
    liftProgress.value = withDelay(
      idx * 18,
      withSequence(
        withTiming(1, { duration: 150 }),
        withSpring(0, { damping: 12, stiffness: 180 }),
      ),
    );
  }, [solved, idx, liftProgress]);

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + liftProgress.value * 0.08 },
      { translateY: -liftProgress.value * 5 },
    ],
    zIndex: Math.round(liftProgress.value * 10),
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: liftProgress.value * 0.55,
  }));

  const background = violation
    ? colors.cellError
    : highlight
      ? colors.cellHint
      : given
        ? colors.cellGiven
        : colors.cell;

  return (
    <Animated.View style={[{ width: size, height: size }, wrapperStyle]}>
      <Pressable
        onPress={onPress}
        disabled={given}
        style={[styles.cell, { width: size, height: size, backgroundColor: background }]}
      >
        {value !== 0 && <GameSymbol value={value as 1 | 2} size={size} />}
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
          pointerEvents="none"
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cellBorder,
    overflow: "hidden",
  },
  overlay: {
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
});
