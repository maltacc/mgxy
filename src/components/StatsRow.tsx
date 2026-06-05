import { StyleSheet, Text, View } from 'react-native';
import { colors, formatTime } from '../theme';

interface Props {
  best: number;
  avg: number;
  solves: number;
}

export function StatsRow({ best, avg, solves }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.stat}>
        <Text style={styles.label}>Best</Text>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {formatTime(best)}
        </Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.label}>Avg</Text>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {formatTime(avg)}
        </Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.label}>Solves</Text>
        <Text style={styles.value}>{solves}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    marginBottom: 20,
  },
  stat: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  label: {
    fontSize: 11,
    color: colors.subtle,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    width: '100%',
  },
  divider: {
    width: 1,
    alignSelf: 'center',
    height: 36,
    backgroundColor: '#e8ecf3',
  },
});
