import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStrings } from '../i18n/useStrings';
import { describeStrings, type Tuning } from '../music/tunings';
import { useSettings } from '../state/settings';
import { colors, IN_TUNE_CENTS, spacing } from './theme';

/** Kropka na plakietce struny: wynik pomiaru menzury. */
export type StringBadge = 'ok' | 'adjust';

interface StringRowProps {
  tuning: Tuning;
  /** String marked by the parent — pinned on the tuner, selected on intonation. */
  markedIndex: number | null;
  onPressString: (index: number) => void;
  /** Spoken suffix for the marked chip, e.g. "pinned". */
  markedLabel: string;
  /** String the tuner is currently reading, or null when there is no pitch. */
  activeIndex?: number | null;
  /** Deviation of the active string, in cents. */
  cents?: number;
  badges?: Record<number, StringBadge>;
}

/**
 * Struny aktywnego stroju jako dotykalne plakietki. Znaczenie dotknięcia
 * zależy od ekranu — na tunerze przypina pomiar do struny, na menzurze
 * wybiera strunę do sprawdzenia — więc sam wiersz tylko zgłasza indeks.
 */
export function StringRow({
  tuning,
  markedIndex,
  onPressString,
  markedLabel,
  activeIndex = null,
  cents = 0,
  badges,
}: StringRowProps) {
  const accidental = useSettings((state) => state.accidental);
  const t = useStrings();

  const names = describeStrings(tuning, accidental);
  const inTune = Math.abs(cents) <= IN_TUNE_CENTS;

  return (
    <View style={styles.row}>
      {names.map((note, index) => {
        const active = index === activeIndex;
        const marked = index === markedIndex;
        const badge = badges?.[index];
        return (
          <Pressable
            key={`${note.name}${note.octave}-${index}`}
            style={({ pressed }) => [
              styles.string,
              active && styles.stringActive,
              active && inTune && styles.stringInTune,
              marked && styles.stringMarked,
              pressed && styles.pressed,
            ]}
            onPress={() => onPressString(index)}
            accessibilityRole="button"
            accessibilityState={{ selected: marked }}
            accessibilityLabel={`${note.name}${note.octave}${marked ? `, ${markedLabel}` : ''}${
              badge ? `, ${badge === 'ok' ? t.tuner.badgeOk : t.tuner.badgeAdjust}` : ''
            }`}
          >
            <Text style={[styles.name, active && styles.nameActive]}>{note.name}</Text>
            <Text style={styles.octave}>{note.octave}</Text>
            {badge && (
              <View
                style={[styles.badge, badge === 'ok' ? styles.badgeOk : styles.badgeAdjust]}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  string: {
    flexDirection: 'row',
    alignItems: 'baseline',
    minWidth: 46,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stringActive: {
    borderColor: colors.textMuted,
    backgroundColor: colors.surfaceRaised,
  },
  stringInTune: {
    borderColor: colors.inTune,
  },
  stringMarked: {
    borderColor: colors.accent,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
  nameActive: {
    color: colors.text,
  },
  octave: {
    fontSize: 10,
    color: colors.textMuted,
    marginLeft: 1,
  },
  badge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: spacing.xs,
    // Kropka wisi przy literze, a nie na linii bazowej tekstu.
    alignSelf: 'center',
  },
  badgeOk: {
    backgroundColor: colors.inTune,
  },
  badgeAdjust: {
    backgroundColor: colors.nearTune,
  },
  pressed: {
    opacity: 0.6,
  },
});
