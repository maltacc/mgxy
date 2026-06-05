import { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { Circle, Line, Polyline, Svg, Text as SvgText } from 'react-native-svg';
import { colors, formatTime } from '../theme';

interface Props {
  times: number[]; // seconds, newest-first (API order)
}

export function TimesGraph({ times }: Props) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  // display oldest → newest left → right
  const pts = [...times].reverse();

  if (w === 0) return <View style={{ height: 140 }} onLayout={onLayout} />;
  if (pts.length === 0) return null;

  const H = 140;
  const PAD = { top: 12, right: 12, bottom: 28, left: 48 };
  const plotW = w - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const maxT = Math.max(...pts);
  const minT = Math.min(...pts);
  const range = Math.max(maxT - minT, 30);

  const px = (i: number) =>
    PAD.left + (pts.length > 1 ? (i / (pts.length - 1)) * plotW : plotW / 2);
  const py = (t: number) =>
    PAD.top + plotH - ((t - minT) / range) * plotH;

  const ticks = [minT, minT + range / 2, maxT];
  const polyPts = pts.map((t, i) => `${px(i)},${py(t)}`).join(' ');

  return (
    <View onLayout={onLayout}>
      <Svg width={w} height={H}>
        {ticks.map((t, i) => (
          <Line
            key={i}
            x1={PAD.left} y1={py(t)}
            x2={PAD.left + plotW} y2={py(t)}
            stroke="#e8ecf3" strokeWidth={1}
          />
        ))}
        {ticks.map((t, i) => (
          <SvgText
            key={i}
            x={PAD.left - 6} y={py(t) + 4}
            textAnchor="end" fontSize={10} fill={colors.subtle}
          >
            {formatTime(Math.round(t))}
          </SvgText>
        ))}
        {pts.length > 1 && (
          <Polyline
            points={polyPts}
            fill="none"
            stroke={colors.accent}
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
              cx={px(i)} cy={py(t)}
              r={isMostRecent ? 5 : 3}
              fill={isMostRecent ? colors.accent : '#fff'}
              stroke={colors.accent}
              strokeWidth={isMostRecent ? 0 : 1.5}
            />
          );
        })}
      </Svg>
    </View>
  );
}
