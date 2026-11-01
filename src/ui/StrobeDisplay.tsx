import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { advancePhase, BAND_MULTIPLIERS } from './strobePhase';
import { colors, spacing, toneColorInterpolation } from './theme';

const STRIPE_WIDTH = 26;
/** Jeden pełny okres wzoru to jasny plus ciemny pasek. */
const PERIOD = STRIPE_WIDTH * 2;
const BAND_HEIGHT = 30;
/** Po powrocie z tła rAF potrafi oddać ogromny krok — ucinamy go. */
const MAX_FRAME_SECONDS = 0.1;

interface StrobeDisplayProps {
  /** Deviation in cents, updated at the analysis rate. */
  deviation: Animated.Value;
  /** 1 while a pitch is detected, 0 otherwise. */
  hasPitch: Animated.Value;
}

/**
 * Tarcza strobo: trzy pasma przewijane z prędkością proporcjonalną do odchyłki,
 * w stosunku harmonicznym 1:2:4. Wzór staje w miejscu dopiero przy czystym
 * stroju, a im węższe pasmo, tym czulej pokazuje resztkowy błąd.
 */
export function StrobeDisplay({ deviation, hasPitch }: StrobeDisplayProps) {
  const [width, setWidth] = useState(0);
  const [offsets] = useState(() => BAND_MULTIPLIERS.map(() => new Animated.Value(0)));

  const centsRef = useRef(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const subscription = deviation.addListener(({ value }) => {
      centsRef.current = value;
    });

    let frame = 0;
    let previous = Date.now();

    const tick = () => {
      const now = Date.now();
      const delta = Math.min((now - previous) / 1000, MAX_FRAME_SECONDS);
      previous = now;

      phaseRef.current = advancePhase(phaseRef.current, centsRef.current, delta);
      for (let band = 0; band < offsets.length; band++) {
        const bandPhase = (phaseRef.current * BAND_MULTIPLIERS[band]) % 1;
        offsets[band].setValue(bandPhase * PERIOD);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      deviation.removeListener(subscription);
    };
  }, [deviation, offsets]);

  const stripeColor = deviation.interpolate(toneColorInterpolation());
  // Pasek jest przesunięty o okres w lewo, więc przy fazie 1 wzór pokrywa się z fazą 0.
  const stripeCount = width > 0 ? Math.ceil((width + 2 * PERIOD) / STRIPE_WIDTH) : 0;

  return (
    <View style={styles.container} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {BAND_MULTIPLIERS.map((multiplier, band) => (
        <View key={multiplier} style={styles.band}>
          {stripeCount > 0 && (
            <Animated.View
              style={[
                styles.stripes,
                { opacity: hasPitch, transform: [{ translateX: offsets[band] }] },
              ]}
            >
              {Array.from({ length: stripeCount }, (_, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.stripe,
                    index % 2 === 0 ? { backgroundColor: stripeColor } : styles.stripeGap,
                  ]}
                />
              ))}
            </Animated.View>
          )}
        </View>
      ))}

      <View style={styles.legend}>
        <Text style={styles.legendText}>♭ flat</Text>
        <Text style={styles.legendHint}>still = in tune</Text>
        <Text style={styles.legendText}>sharp ♯</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: spacing.xs,
  },
  band: {
    height: BAND_HEIGHT,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  stripes: {
    flexDirection: 'row',
    position: 'absolute',
    left: -PERIOD,
    height: '100%',
  },
  stripe: {
    width: STRIPE_WIDTH,
    height: '100%',
  },
  stripeGap: {
    backgroundColor: 'transparent',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  legendText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  legendHint: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
