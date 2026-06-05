import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import {
  fetchLeaderboard,
  fetchTimes,
  postSolveTime,
} from "../src/lib/supabase";
import type { LeaderboardPlayer } from "../src/lib/supabase";
import { Board } from "../src/components/Board";
import { Controls } from "../src/components/Controls";
import { GoogleAuthButton } from "../src/components/GoogleAuthButton";
import { PlayerCard } from "../src/components/PlayerCard";
import { StatsRow } from "../src/components/StatsRow";
import { TimesGraph } from "../src/components/TimesGraph";
import { useAuth } from "../src/context/AuthContext";
import { useGame } from "../src/hooks/useGame";
import { colors, formatTime } from "../src/theme";

type Tab = "game" | "history";

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

function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <View style={tabStyles.bar}>
      {(["game", "history"] as Tab[]).map((tab) => {
        const isActive = active === tab;
        const ic = isActive ? colors.accent : colors.subtle;
        return (
          <Pressable
            key={tab}
            style={tabStyles.tab}
            onPress={() => onChange(tab)}
          >
            {tab === "game" ? (
              <GameIcon color={ic} />
            ) : (
              <HistoryIcon color={ic} />
            )}
            <Text style={[tabStyles.label, isActive && tabStyles.activeLabel]}>
              {tab === "game" ? "Game" : "History"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function DiffGraph({ label, times }: { label: string; times: number[] }) {
  if (times.length === 0) return null;
  const best = Math.min(...times);
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  return (
    <View style={histStyles.diffSection}>
      <Text style={histStyles.diffHeading}>{label}</Text>
      <StatsRow best={best} avg={avg} solves={times.length} />
      <View style={histStyles.graphCard}>
        <TimesGraph times={times} />
        <Text style={histStyles.graphCaption}>
          Last {times.length} solve{times.length === 1 ? "" : "s"}
        </Text>
      </View>
    </View>
  );
}

function HistoryContent({ refreshKey }: { refreshKey: number }) {
  const { user } = useAuth();
  const [hardTimes, setHardTimes] = useState<number[]>([]);
  const [minimalTimes, setMinimalTimes] = useState<number[]>([]);
  const [others, setOthers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      fetchTimes(user.sub, "hard"),
      fetchTimes(user.sub, "minimal"),
      fetchLeaderboard(user.sub),
    ])
      .then(([hard, minimal, players]) => {
        setHardTimes(hard);
        setMinimalTimes(minimal);
        setOthers(players);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, refreshKey]);

  if (!user) {
    return (
      <View style={histStyles.empty}>
        <Text style={histStyles.emptyTitle}>Sign in to see your history</Text>
        <Text style={histStyles.emptySub}>
          Your solve times are saved when you're signed in
        </Text>
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

  if (hardTimes.length === 0 && minimalTimes.length === 0) {
    return (
      <View style={histStyles.empty}>
        <Text style={histStyles.emptyTitle}>No solves yet</Text>
        <Text style={histStyles.emptySub}>
          Complete a puzzle to see your times here
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={histStyles.scrollView}
      contentContainerStyle={histStyles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={histStyles.heading}>Your history</Text>

      <DiffGraph label="Hard" times={hardTimes} />
      <DiffGraph label="Minimal" times={minimalTimes} />

      <View style={histStyles.othersSection}>
        <Text style={histStyles.sectionHeading}>Other players</Text>
        {others.length === 0 ? (
          <Text style={histStyles.emptySub}>No other players yet</Text>
        ) : (
          <>
            <Text style={histStyles.sectionSub}>
              Average times over their last {30} solves
            </Text>
            <View style={histStyles.playerList}>
              {others.map((player, i) => (
                <PlayerCard
                  key={player.userId}
                  player={player}
                  colorIndex={i}
                />
              ))}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const BOARD_WRAP_H_PAD = 16; // must match styles.boardWrap paddingHorizontal

function BoardSkeleton({
  containerWidth,
  containerHeight,
}: {
  containerWidth: number;
  containerHeight: number;
}) {
  const size = Math.max(
    120,
    Math.min(containerWidth - 20, containerHeight - 20, 460),
  );
  return (
    <View style={[skeletonStyles.frame, { width: size, height: size }]}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  frame: {
    borderRadius: 18,
    backgroundColor: colors.board,
    borderWidth: 1,
    borderColor: "#dde2eb",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1B2233",
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
});

export default function GameScreen() {
  const game = useGame();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("game");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [historyMounted, setHistoryMounted] = useState(false);
  const [boardContainerW, setBoardContainerW] = useState(0);
  const [boardContainerH, setBoardContainerH] = useState(0);

  useEffect(() => {
    if (!game.solved || !user) return;
    postSolveTime(user.sub, game.seconds, game.difficulty)
      .then(() => setHistoryRefreshKey((k) => k + 1))
      .catch(() => {});
  }, [game.solved, user, game.difficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (tab: Tab) => {
    if (tab === "history") setHistoryMounted(true);
    setActiveTab(tab);
  };

  const handleNewGame = () => {
    game.newGame();
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.logo}>∞Tango</Text>
          <GoogleAuthButton />
        </View>

        <View style={styles.contentWrap}>
          {activeTab === "game" && (
            <>
              <View style={styles.timerRow}>
                <Text selectable={false} style={styles.timer}>
                  {formatTime(game.seconds)}
                </Text>
                {game.solved ? (
                  <Text style={styles.solvedBadge}>Solved</Text>
                ) : (
                  <View style={styles.diffToggle}>
                    {(["hard", "minimal"] as const).map((d) => (
                      <Pressable
                        key={d}
                        onPress={() => game.setDifficulty(d)}
                        style={[
                          styles.diffBtn,
                          game.difficulty === d && styles.diffBtnActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.diffLabel,
                            game.difficulty === d && styles.diffLabelActive,
                          ]}
                        >
                          {d === "hard" ? "Hard" : "Minimal"}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View
                style={styles.boardWrap}
                onLayout={(e) => {
                  setBoardContainerW(
                    e.nativeEvent.layout.width - BOARD_WRAP_H_PAD * 2,
                  );
                  setBoardContainerH(e.nativeEvent.layout.height);
                }}
              >
                {game.loading || boardContainerW === 0 ? (
                  <BoardSkeleton
                    containerWidth={boardContainerW}
                    containerHeight={boardContainerH}
                  />
                ) : game.paused && !game.solved ? (
                  <View style={styles.pauseOverlay}>
                    <Text style={styles.pauseTitle}>Paused</Text>
                    <Text style={styles.pauseHint}>Press ▶ to resume</Text>
                  </View>
                ) : (
                  <Board
                    board={game.board}
                    puzzle={game.puzzle!}
                    violations={game.violations}
                    hintCell={game.hintCell}
                    solved={game.solved}
                    onCell={game.cycleCell}
                    containerWidth={boardContainerW}
                    containerHeight={boardContainerH}
                  />
                )}
              </View>

              <View style={styles.controls}>
                <Controls
                  canUndo={game.canUndo}
                  paused={game.paused}
                  onUndo={game.undo}
                  onClear={game.clear}
                  onPause={game.togglePause}
                  onNew={handleNewGame}
                  onHint={game.showHint}
                />
              </View>
            </>
          )}

          {historyMounted && (
            <View
              style={[
                styles.histContainer,
                activeTab !== "history" && styles.hidden,
              ]}
            >
              <HistoryContent refreshKey={historyRefreshKey} />
            </View>
          )}
        </View>

        <TabBar active={activeTab} onChange={handleTabChange} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, width: "100%", backgroundColor: colors.bg },
  contentWrap: { flex: 1, width: "100%", maxWidth: 500, alignSelf: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  logo: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.5,
  },
  timerRow: { alignItems: "center", paddingTop: 8, paddingBottom: 8, gap: 4 },
  timer: {
    fontSize: 32,
    fontWeight: "600",
    color: colors.text,
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
  },
  diffToggle: {
    flexDirection: "row",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gridLine,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  diffBtn: {
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  diffBtnActive: {
    backgroundColor: colors.accent,
  },
  diffLabel: { fontSize: 13, color: colors.subtle, fontWeight: "500" },
  diffLabelActive: { color: "#fff", fontWeight: "700" },
  solvedBadge: {
    fontSize: 13,
    color: colors.success,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  boardWrap: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  histContainer: { flex: 1, paddingHorizontal: 16 },
  hidden: { display: "none" },
  pauseOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  pauseTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 1,
  },
  pauseHint: { fontSize: 14, color: colors.subtle },
  controls: { paddingVertical: 12, paddingHorizontal: 20 },
});

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: "#e8ecf3",
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 3,
  },
  label: { fontSize: 11, color: colors.subtle, fontWeight: "500" },
  activeLabel: { color: colors.accent, fontWeight: "700" },
});

const histStyles = StyleSheet.create({
  scrollView: { flex: 1 },
  scroll: { flexGrow: 1, paddingVertical: 8, width: "100%" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  emptySub: { fontSize: 14, color: colors.subtle, textAlign: "center" },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
    marginTop: 4,
  },
  graphCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dde2eb",
    padding: 16,
    gap: 6,
    marginBottom: 24,
  },
  graphCaption: { fontSize: 11, color: colors.subtle, textAlign: "right" },
  diffSection: { gap: 10, marginBottom: 24 },
  diffHeading: { fontSize: 18, fontWeight: "700", color: colors.text },
  othersSection: { gap: 12, paddingBottom: 16 },
  sectionHeading: { fontSize: 18, fontWeight: "700", color: colors.text },
  sectionSub: { fontSize: 13, color: colors.subtle, marginBottom: 4 },
  playerList: { gap: 12 },
});
