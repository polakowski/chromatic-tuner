import { StyleSheet, View } from 'react-native';

import { colors } from './theme';

interface LevelMeterProps {
  /** 0..1 input level. */
  level: number;
}

export function LevelMeter({ level }: LevelMeterProps) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.round(level * 100)}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 3,
    width: '45%',
    borderRadius: 2,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.textMuted,
  },
});
