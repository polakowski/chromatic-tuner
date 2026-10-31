import { useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { CENTS_RANGE, colors, IN_TUNE_CENTS, NEAR_TUNE_CENTS, spacing } from './theme';

const TICK_STEP = 10;
const INDICATOR_WIDTH = 4;
const TICK_SLOT_WIDTH = 40;

interface CentsBarProps {
  /** Deviation in cents, updated at the analysis rate. */
  deviation: Animated.Value;
  /** 1 while a pitch is detected, 0 otherwise. */
  hasPitch: Animated.Value;
}

/**
 * Poziomy pasek odchyłki: zero w środku, ±50 centów na krańcach.
 * Pozycja i kolor są animowane bez przerysowywania Reacta.
 */
export function CentsBar({ deviation, hasPitch }: CentsBarProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const halfWidth = trackWidth / 2;

  const translateX = deviation.interpolate({
    inputRange: [-CENTS_RANGE, CENTS_RANGE],
    outputRange: [-halfWidth, halfWidth],
    extrapolate: 'clamp',
  });

  // Skokowe progi, a nie gradient — żeby kolor paska zgadzał się z kolorem nuty
  // (patrz toneColor): zielony = nastrojone, bursztynowy = blisko, czerwony = nie.
  const indicatorColor = deviation.interpolate({
    inputRange: [
      -CENTS_RANGE,
      -NEAR_TUNE_CENTS - 0.01,
      -NEAR_TUNE_CENTS,
      -IN_TUNE_CENTS - 0.01,
      -IN_TUNE_CENTS,
      IN_TUNE_CENTS,
      IN_TUNE_CENTS + 0.01,
      NEAR_TUNE_CENTS,
      NEAR_TUNE_CENTS + 0.01,
      CENTS_RANGE,
    ],
    outputRange: [
      colors.offTune,
      colors.offTune,
      colors.nearTune,
      colors.nearTune,
      colors.inTune,
      colors.inTune,
      colors.nearTune,
      colors.nearTune,
      colors.offTune,
      colors.offTune,
    ],
    extrapolate: 'clamp',
  });

  const ticks = [];
  for (let cents = -CENTS_RANGE; cents <= CENTS_RANGE; cents += TICK_STEP) {
    ticks.push(cents);
  }

  return (
    <View style={styles.container}>
      <View style={styles.track} onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}>
        <View style={styles.inTuneZone} />
        <View style={styles.centerLine} />

        {trackWidth > 0 && (
          <Animated.View
            style={[
              styles.indicator,
              {
                backgroundColor: indicatorColor,
                opacity: hasPitch,
                transform: [{ translateX }],
              },
            ]}
          />
        )}
      </View>

      <View style={styles.tickRow}>
        {ticks.map((cents) => (
          <View
            key={cents}
            // Podziałka musi trafiać w te same pozycje co wskaźnik: -50 na lewej krawędzi, +50 na prawej.
            style={[styles.tickSlot, { left: `${((cents + CENTS_RANGE) / (2 * CENTS_RANGE)) * 100}%` }]}
          >
            <View style={[styles.tick, cents === 0 && styles.tickCenter]} />
            {cents % 25 === 0 && (
              <Text style={styles.tickLabel}>{cents > 0 ? `+${cents}` : cents}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  track: {
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  inTuneZone: {
    position: 'absolute',
    height: '100%',
    // ±5 centów z zakresu ±50 to 10% szerokości paska.
    width: `${(IN_TUNE_CENTS / CENTS_RANGE) * 100}%`,
    backgroundColor: 'rgba(57, 217, 138, 0.12)',
  },
  centerLine: {
    position: 'absolute',
    width: StyleSheet.hairlineWidth,
    height: '100%',
    backgroundColor: colors.border,
  },
  indicator: {
    width: INDICATOR_WIDTH,
    height: '72%',
    borderRadius: INDICATOR_WIDTH / 2,
  },
  tickRow: {
    height: 32,
    marginTop: spacing.sm,
  },
  tickSlot: {
    position: 'absolute',
    width: TICK_SLOT_WIDTH,
    marginLeft: -TICK_SLOT_WIDTH / 2,
    alignItems: 'center',
  },
  tick: {
    width: StyleSheet.hairlineWidth,
    height: 6,
    backgroundColor: colors.border,
  },
  tickCenter: {
    height: 10,
    backgroundColor: colors.textMuted,
  },
  tickLabel: {
    marginTop: spacing.xs,
    fontSize: 11,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
});
