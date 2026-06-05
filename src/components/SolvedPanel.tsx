import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { colors, formatTime } from '../theme';
import { TimesGraph } from './TimesGraph';

interface Props {
  solveTime: number;
  times: number[];
  isLoggedIn: boolean;
  onNewGame: () => void;
}

export function SolvedPanel({ solveTime, times, isLoggedIn, onNewGame }: Props) {
  const translateY = useSharedValue(60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(700, withSpring(0, { damping: 20, stiffness: 160 }));
    opacity.value = withDelay(700, withSpring(1, { damping: 20, stiffness: 160 }));
  }, [opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const best = times.length > 0 ? Math.min(...times) : solveTime;
  const avg = times.length > 0
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : solveTime;

  return (
    <Animated.View style={[styles.card, animStyle]}>
      <Text style={styles.title}>Puzzle solved</Text>
      <Text style={styles.time}>{formatTime(solveTime)}</Text>

      {isLoggedIn && times.length >= 1 && (
        <>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Best</Text>
              <Text style={styles.statValue}>{formatTime(best)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Avg</Text>
              <Text style={styles.statValue}>{formatTime(avg)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Solves</Text>
              <Text style={styles.statValue}>{times.length}</Text>
            </View>
          </View>
          <View style={styles.graphWrap}>
            <TimesGraph times={times} />
          </View>
        </>
      )}

      {!isLoggedIn && (
        <Text style={styles.hint}>Sign in to track your times</Text>
      )}

      <Pressable
        onPress={onNewGame}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      >
        <Text style={styles.btnText}>New puzzle</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dde2eb',
    padding: 24,
    width: '100%',
    shadowColor: '#1B2233',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.subtle,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  time: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statLabel: {
    fontSize: 11,
    color: colors.subtle,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: { fontSize: 16, fontWeight: '700', color: colors.text },
  divider: { width: 1, height: 28, backgroundColor: '#e8ecf3' },
  graphWrap: { marginTop: 8 },
  hint: {
    fontSize: 13,
    color: colors.subtle,
    textAlign: 'center',
    marginVertical: 8,
  },
  btn: {
    marginTop: 16,
    backgroundColor: colors.accent,
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pressed: { opacity: 0.8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
