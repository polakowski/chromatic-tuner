import { Pressable, StyleSheet, Text, View } from 'react-native';

import { describeStrings, type Tuning } from '../music/tunings';
import { useSettings } from '../state/settings';
import { colors, IN_TUNE_CENTS, spacing } from './theme';

interface StringRowProps {
  tuning: Tuning;
  /** String the tuner is currently reading, or null when there is no pitch. */
  activeIndex: number | null;
  /** Deviation of the active string, in cents. */
  cents: number;
}

/**
 * Struny aktywnego stroju. Podświetlona jest ta, którą tuner właśnie słyszy;
 * dotknięcie przypina pomiar do konkretnej struny, co ratuje sytuację, gdy
 * jest tak rozstrojona, że automat wybiera sąsiednią. Ponowne dotknięcie zwalnia.
 */
export function StringRow({ tuning, activeIndex, cents }: StringRowProps) {
  const accidental = useSettings((state) => state.accidental);
  const lockedString = useSettings((state) => state.lockedString);
  const toggleLockedString = useSettings((state) => state.toggleLockedString);

  const names = describeStrings(tuning, accidental);
  const inTune = Math.abs(cents) <= IN_TUNE_CENTS;

  return (
    <View style={styles.row}>
      {names.map((note, index) => {
        const active = index === activeIndex;
        const locked = index === lockedString;
        return (
          <Pressable
            key={`${note.name}${note.octave}-${index}`}
            style={({ pressed }) => [
              styles.string,
              active && styles.stringActive,
              active && inTune && styles.stringInTune,
              locked && styles.stringLocked,
              pressed && styles.pressed,
            ]}
            onPress={() => toggleLockedString(index)}
            accessibilityRole="button"
            accessibilityState={{ selected: locked }}
            accessibilityLabel={`${note.name}${note.octave}${locked ? ', pinned' : ''}`}
          >
            <Text style={[styles.name, active && styles.nameActive]}>{note.name}</Text>
            <Text style={styles.octave}>{note.octave}</Text>
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
  stringLocked: {
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
  pressed: {
    opacity: 0.6,
  },
});
