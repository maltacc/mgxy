import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { fetchTimes, postSolveTime } from '../src/lib/supabase';
import { Board } from '../src/components/Board';
import { Controls } from '../src/components/Controls';
import { GoogleAuthButton } from '../src/components/GoogleAuthButton';
import { SolvedPanel } from '../src/components/SolvedPanel';
import { TimesGraph } from '../src/components/TimesGraph';
import { useAuth } from '../src/context/AuthContext';
import { useGame } from '../src/hooks/useGame';
import { colors, formatTime } from '../src/theme';

type Tab = 'game' | 'history';

function GameIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Rect x={3} y={3} width={8} height={8} rx={1.5} fill={color} />
      <Rect x={13} y={3} width={8} height={8} rx={1.5} fill={color} />
      <Rect x={3} y={13} width={8} height={8} rx={1.5} fill={color} />
      <Rect x={13} y={13} width={8} height={8} rx={1.5} fill={color} />
    </Svg>
  );
}

function HistoryIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 18l4-5 4 3 4-6 4 4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <View style={tabStyles.bar}>
      {(['game', 'history'] as Tab[]).map(tab => {
        const isActive = active === tab;
        const ic = isActive ? colors.accent : colors.subtle;
        return (
          <Pressable key={tab} style={tabStyles.tab} onPress={() => onChange(tab)}>
            {tab === 'game' ? <GameIcon color={ic} /> : <HistoryIcon color={ic} />}
            <Text style={[tabStyles.label, isActive && tabStyles.activeLabel]}>
              {tab === 'game' ? 'Game' : 'History'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function HistoryContent({ refreshKey }: { refreshKey: number }) {
  const { user } = useAuth();
  const [times, setTimes] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchTimes(user.sub)
      .then(setTimes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, refreshKey]); // refreshKey changes every time the tab is opened

  if (!user) {
    return (
      <View style={histStyles.empty}>
        <Text style={histStyles.emptyTitle}>Sign in to see your history</Text>
        <Text style={histStyles.emptySub}>Your solve times are saved when you're signed in</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={histStyles.empty}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (times.length === 0) {
    return (
      <View style={histStyles.empty}>
        <Text style={histStyles.emptyTitle}>No solves yet</Text>
        <Text style={histStyles.emptySub}>Complete a puzzle to see your times here</Text>
      </View>
    );
  }

  const best = Math.min(...times);
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);

  return (
    <ScrollView contentContainerStyle={histStyles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={histStyles.heading}>History</Text>

      <View style={histStyles.statsRow}>
        <View style={histStyles.stat}>
          <Text style={histStyles.statLabel}>Best</Text>
          <Text style={histStyles.statValue}>{formatTime(best)}</Text>
        </View>
        <View style={histStyles.divider} />
        <View style={histStyles.stat}>
          <Text style={histStyles.statLabel}>Avg</Text>
          <Text style={histStyles.statValue}>{formatTime(avg)}</Text>
        </View>
        <View style={histStyles.divider} />
        <View style={histStyles.stat}>
          <Text style={histStyles.statLabel}>Solves</Text>
          <Text style={histStyles.statValue}>{times.length}</Text>
        </View>
      </View>

      <View style={histStyles.graphCard}>
        <TimesGraph times={times} />
        <Text style={histStyles.graphCaption}>
          Last {times.length} solve{times.length === 1 ? '' : 's'}
        </Text>
      </View>
    </ScrollView>
  );
}

export default function GameScreen() {
  const game = useGame();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('game');
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const panelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!game.solved) {
      setShowPanel(false);
      return;
    }
    if (user) {
      postSolveTime(user.sub, game.seconds)
        .then(setTimes)
        .catch((err) => { console.error('postSolveTime error:', err); });
    }
    panelTimerRef.current = setTimeout(() => setShowPanel(true), 900);
    return () => { if (panelTimerRef.current) clearTimeout(panelTimerRef.current); };
  }, [game.solved, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (tab: Tab) => {
    if (tab === 'history') setHistoryRefreshKey(k => k + 1);
    setActiveTab(tab);
  };

  const handleNewGame = () => {
    setShowPanel(false);
    setTimes([]);
    game.newGame();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.logo}>∞Tango</Text>
        <GoogleAuthButton />
      </View>

      {activeTab === 'game' && (
        <>
          {!showPanel && (
            <View style={styles.timerRow}>
              <Text selectable={false} style={styles.timer}>{formatTime(game.seconds)}</Text>
              <View style={styles.badge}>
                <Text selectable={false} style={styles.badgeLabel}>Very Hard</Text>
              </View>
            </View>
          )}

          <View style={styles.boardWrap}>
            {showPanel ? (
              <ScrollView
                contentContainerStyle={styles.panelScroll}
                showsVerticalScrollIndicator={false}
              >
                <SolvedPanel
                  solveTime={game.seconds}
                  times={times}
                  isLoggedIn={!!user}
                  onNewGame={handleNewGame}
                />
              </ScrollView>
            ) : game.paused ? (
              <View style={styles.pauseOverlay}>
                <Text style={styles.pauseTitle}>Paused</Text>
                <Text style={styles.pauseHint}>Press ▶ to resume</Text>
              </View>
            ) : (
              <Board
                board={game.board}
                puzzle={game.puzzle}
                violations={game.violations}
                hintCell={null}
                solved={game.solved}
                onCell={game.cycleCell}
              />
            )}
          </View>

          {!showPanel && (
            <View style={styles.controls}>
              <Controls
                canUndo={game.canUndo}
                paused={game.paused}
                onUndo={game.undo}
                onClear={game.clear}
                onPause={game.togglePause}
                onNew={handleNewGame}
              />
            </View>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <View style={styles.boardWrap}>
          <HistoryContent refreshKey={historyRefreshKey} />
        </View>
      )}

      <TabBar active={activeTab} onChange={handleTabChange} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  logo: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  timerRow: { alignItems: 'center', paddingVertical: 12, gap: 6 },
  timer: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gridLine,
    backgroundColor: colors.surface,
  },
  badgeLabel: { fontSize: 13, color: colors.subtle, fontWeight: '500' },
  boardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  panelScroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 16, width: '100%' },
  pauseOverlay: { alignItems: 'center', gap: 10 },
  pauseTitle: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: 1 },
  pauseHint: { fontSize: 14, color: colors.subtle },
  controls: { paddingVertical: 24, paddingHorizontal: 20 },
});

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#e8ecf3',
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 3,
  },
  label: { fontSize: 11, color: colors.subtle, fontWeight: '500' },
  activeLabel: { color: colors.accent, fontWeight: '700' },
});

const histStyles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingVertical: 8, width: '100%' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptySub: { fontSize: 14, color: colors.subtle, textAlign: 'center' },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    marginTop: 4,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statLabel: {
    fontSize: 11,
    color: colors.subtle,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.text },
  divider: { width: 1, height: 32, backgroundColor: '#e8ecf3' },
  graphCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dde2eb',
    padding: 16,
    gap: 6,
  },
  graphCaption: { fontSize: 11, color: colors.subtle, textAlign: 'right' },
});
