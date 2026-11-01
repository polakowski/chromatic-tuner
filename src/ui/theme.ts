export const colors = {
  background: '#0B0F14',
  surface: '#141A22',
  surfaceRaised: '#1D2631',
  border: '#2A3542',
  text: '#F2F6FA',
  textMuted: '#8A99AB',
  inTune: '#39D98A',
  nearTune: '#F2C14E',
  offTune: '#F2695C',
  accent: '#4C9AFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/** Odchyłka (w centach), w której uznajemy dźwięk za nastrojony. */
export const IN_TUNE_CENTS = 5;
/** Odchyłka, przy której jeszcze jesteśmy "blisko" (żółty zamiast czerwonego). */
export const NEAR_TUNE_CENTS = 20;
/** Zakres pokazywany na pasku centów. */
export const CENTS_RANGE = 50;

export function toneColor(cents: number): string {
  const magnitude = Math.abs(cents);
  if (magnitude <= IN_TUNE_CENTS) {
    return colors.inTune;
  }
  if (magnitude <= NEAR_TUNE_CENTS) {
    return colors.nearTune;
  }
  return colors.offTune;
}

/**
 * Progi kolorów jako argumenty dla `Animated.Value.interpolate` — skokowe,
 * nie gradient, żeby animowany wskaźnik pokazywał ten sam kolor co
 * {@link toneColor} użyty w zwykłym renderze.
 */
export function toneColorInterpolation() {
  return {
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
    extrapolate: 'clamp' as const,
  };
}
