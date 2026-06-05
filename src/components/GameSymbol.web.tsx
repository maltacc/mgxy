import { useId } from 'react';
import { Circle, Defs, Mask, Svg } from 'react-native-svg';
import { colors } from '../theme';

interface Props {
  value: 1 | 2;
  size: number;
}

export function GameSymbol({ value, size }: Props) {
  if (size <= 0) return null;
  const uid = useId().replace(/:/g, '');
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.34;

  if (value === 1) {
    return (
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} fill={colors.sun} />
      </Svg>
    );
  }

  // bite radius 0.72 (vs ~1.05 before) → thicker crescent with rounder tips
  const maskId = `moon${uid}`;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <Mask id={maskId}>
          <Circle cx={cx} cy={cy} r={r} fill="white" />
          <Circle cx={cx + r * 0.48} cy={cy - r * 0.22} r={r * 0.72} fill="black" />
        </Mask>
      </Defs>
      <Circle cx={cx} cy={cy} r={r} fill={colors.moon} mask={`url(#${maskId})`} />
    </Svg>
  );
}
