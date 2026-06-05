import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Circle, Line, Path, Polyline, Svg } from 'react-native-svg';
import { colors, formatTime } from '../theme';

interface Props {
  times: number[]; // seconds, newest-first
  height?: number;
  accent?: string;
}

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export function TimesGraph({ times, height = 160, accent = colors.accent }: Props) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const pts = [...times].reverse();

  if (w === 0) return <View style={{ height }} onLayout={onLayout} />;
  if (pts.length === 0) return null;

  const PAD = { top: 12, right: 12, bottom: 24, left: 50 };
  const plotW = w - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;

  const rawMin = Math.min(...pts);
  const rawMax = Math.max(...pts);
  const padding = Math.max(15, Math.round((rawMax - rawMin) * 0.15));
  const minT = Math.max(0, rawMin - padding);
  const maxT = rawMax + padding;
  const range = Math.max(maxT - minT, 30);

  const px = (i: number) =>
    PAD.left + (pts.length > 1 ? (i / (pts.length - 1)) * plotW : plotW / 2);
  const py = (t: number) => PAD.top + plotH - ((t - minT) / range) * plotH;

  const tickCount = 3;
  const ticks = Array.from({ length: tickCount }, (_, i) => minT + (range * i) / (tickCount - 1));
  const polyPts = pts.map((t, i) => `${px(i)},${py(t)}`).join(' ');

  const bottomY = PAD.top + plotH;
  const fillD = pts.length > 1
    ? `M ${px(0)},${bottomY} L ${pts.map((t, i) => `${px(i)},${py(t)}`).join(' L ')} L ${px(pts.length - 1)},${bottomY} Z`
    : null;

  return (
    <View style={{ height, position: 'relative' }} onLayout={onLayout}>
      <Svg width={w} height={height}>
        {ticks.map((t, i) => (
          <Line
            key={`grid-${i}`}
            x1={PAD.left}
            y1={py(t)}
            x2={PAD.left + plotW}
            y2={py(t)}
            stroke="#edf0f6"
            strokeWidth={1}
          />
        ))}
        {fillD && (
          <Path d={fillD} fill={accent} fillOpacity={0.08} stroke="none" />
        )}
        {pts.length > 1 && (
          <Polyline
            points={polyPts}
            fill="none"
            stroke={accent}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {pts.map((t, i) => {
          const isMostRecent = i === pts.length - 1;
          return (
            <Circle
              key={i}
              cx={px(i)}
              cy={py(t)}
              r={isMostRecent ? 4.5 : pts.length > 20 ? 2 : 3}
              fill={isMostRecent ? accent : '#fff'}
              stroke={accent}
              strokeWidth={isMostRecent ? 0 : 1.5}
            />
          );
        })}
      </Svg>
      {ticks.map((t, i) => (
        <Text
          key={`label-${i}`}
          style={[
            styles.yLabel,
            { top: py(t) - 7, left: 0, width: PAD.left - 6 },
          ]}
        >
          {formatTime(Math.round(t))}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  yLabel: {
    position: 'absolute',
    fontSize: 9,
    color: colors.subtle,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
    fontFamily: FONT,
  },
});
