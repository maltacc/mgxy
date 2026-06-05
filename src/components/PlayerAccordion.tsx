import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LeaderboardPlayer } from '../lib/supabase';
import { colors, formatTime } from '../theme';
import { TimesGraph } from './TimesGraph';

const PALETTE = ['#6c8bff', '#22a565', '#e05a6e', '#9b6bcc', '#2db5c4', '#e8913a'];

interface Props {
  player: LeaderboardPlayer;
  colorIndex: number;
}

export function PlayerAccordion({ player, colorIndex }: Props) {
  const [open, setOpen] = useState(false);
  const accent = PALETTE[colorIndex % PALETTE.length];

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => setOpen(o => !o)}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <View style={styles.left}>
          {player.picture ? (
            <Image source={{ uri: player.picture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: accent }]}>
              <Text style={styles.initial}>{player.name[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          )}
          <Text style={styles.name} numberOfLines={1}>{player.name}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.latestTime}>{formatTime(player.latestTime)}</Text>
          <Text style={[styles.chevron, open && styles.chevronOpen]}>›</Text>
        </View>
      </Pressable>

      {open && (
        <View style={styles.body}>
          <View style={styles.meta}>
            <Text style={styles.metaText}>Best {formatTime(player.best)}</Text>
            <Text style={styles.metaText}>{player.solveCount} solve{player.solveCount === 1 ? '' : 's'}</Text>
          </View>

          {player.hardTimes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.diffLabel}>Hard</Text>
              <TimesGraph times={player.hardTimes} height={100} accent={accent} />
            </View>
          )}

          {player.minimalTimes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.diffLabel}>Minimal</Text>
              <TimesGraph times={player.minimalTimes} height={100} accent={accent} />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dde2eb',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  pressed: { opacity: 0.7 },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  initial: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  latestTime: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.subtle,
    fontVariant: ['tabular-nums'],
  },
  chevron: {
    fontSize: 20,
    color: colors.subtle,
    transform: [{ rotate: '0deg' }],
  },
  chevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: '#edf0f6',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 12,
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
  section: {
    gap: 4,
  },
  diffLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.subtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
