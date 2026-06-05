import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { colors } from "../theme";

interface Props {
  canUndo: boolean;
  paused: boolean;
  onUndo: () => void;
  onClear: () => void;
  onPause: () => void;
  onNew: () => void;
  onHint: () => void;
}

function UndoIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 0 1 0 12h-3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClearIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
      />
    </Svg>
  );
}

function PauseIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Rect x={6} y={5} width={4} height={14} fill={color} rx={1} />
      <Rect x={14} y={5} width={4} height={14} fill={color} rx={1} />
    </Svg>
  );
}

function PlayIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path fill={color} d="M8 5v14l11-7z" />
    </Svg>
  );
}

function PlusIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path fill={color} d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </Svg>
  );
}

function HintIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2a7 7 0 0 1 4 12.8V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.2A7 7 0 0 1 12 2z"
        stroke={color} strokeWidth={2} strokeLinejoin="round"
      />
      <Path d="M9 21h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function Controls({ canUndo, paused, onUndo, onClear, onPause, onNew, onHint }: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onUndo}
        disabled={!canUndo}
        style={({ pressed }) => [
          styles.btn,
          !canUndo && styles.disabled,
          pressed && canUndo && styles.pressed,
        ]}
      >
        <UndoIcon color={colors.buttonText} />
      </Pressable>

      <Pressable
        onPress={onClear}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      >
        <ClearIcon color={colors.buttonText} />
      </Pressable>

      <Pressable
        onPress={onPause}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      >
        {paused
          ? <PlayIcon color={colors.accent} />
          : <PauseIcon color={colors.buttonText} />}
      </Pressable>

      <Pressable
        onPress={onHint}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      >
        <HintIcon color={colors.buttonText} />
      </Pressable>

      <Pressable
        onPress={onNew}
        style={({ pressed }) => [styles.btn, styles.primary, pressed && styles.pressed]}
      >
        <PlusIcon color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  btn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.button,
    borderWidth: 1,
    borderColor: colors.cellBorder,
    shadowColor: "#1B2233",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});
