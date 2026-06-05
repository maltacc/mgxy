import { StyleSheet, Text, View } from 'react-native';
import type { LeaderboardPlayer } from '../lib/supabase';
import { colors, formatTime } from '../theme';
import { TimesGraph } from './TimesGraph';

const PALETTE = ['#6c8bff', '#22a565', '#e05a6e', '#9b6bcc', '#2db5c4', '#e8913a'];

interface Props {
  player: LeaderboardPlayer;
  colorIndex: number;
}

export function PlayerCard({ player, colorIndex }: Props) {
  const accent = PALETTE[colorIndex % PALETTE.length];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={styles.name} numberOfLines={1}>{player.name}</Text>
        <Text style={styles.avg}>{formatTime(player.avg)} avg</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.metaText}>Best {formatTime(player.best)}</Text>
        <Text style={styles.metaText}>{player.solveCount} solve{player.solveCount === 1 ? '' : 's'}</Text>
      </View>
      <TimesGraph times={player.times} height={120} accent={accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dde2eb',
    padding: 14,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  avg: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.subtle,
    fontVariant: ['tabular-nums'],
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 11,
    color: colors.subtle,
    fontVariant: ['tabular-nums'],
  },
});
