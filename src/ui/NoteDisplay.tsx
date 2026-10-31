import { StyleSheet, Text, View } from 'react-native';

import type { TunerReading } from '../audio/useTuner';
import { colors, IN_TUNE_CENTS, spacing, toneColor } from './theme';

interface NoteDisplayProps {
  reading: TunerReading;
}

function formatCents(cents: number): string {
  const rounded = Math.round(cents);
  if (rounded === 0) {
    return '0';
  }
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

export function NoteDisplay({ reading }: NoteDisplayProps) {
  const { note, frequency, cents } = reading;
  const hasPitch = note !== null && frequency !== null;
  const accent = hasPitch ? toneColor(cents) : colors.textMuted;

  return (
    <View style={styles.container}>
      <View style={styles.noteRow}>
        <Text style={[styles.note, { color: accent }]}>{hasPitch ? note.letter : '--'}</Text>
        <View style={styles.marks}>
          <Text style={[styles.accidental, { color: accent }]}>
            {hasPitch ? note.accidental : ''}
          </Text>
          <Text style={styles.octave}>{hasPitch ? note.octave : ''}</Text>
        </View>
      </View>

      <Text style={styles.frequency}>
        {hasPitch ? `${frequency.toFixed(1)} Hz` : 'Play a note'}
      </Text>

      <Text style={[styles.cents, { color: accent }]}>
        {hasPitch
          ? Math.abs(cents) <= IN_TUNE_CENTS
            ? 'In tune'
            : `${formatCents(cents)} cents`
          : ' '}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  note: {
    fontSize: 120,
    fontWeight: '200',
    lineHeight: 132,
    fontVariant: ['tabular-nums'],
  },
  marks: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.lg,
  },
  accidental: {
    fontSize: 48,
    fontWeight: '200',
  },
  octave: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.textMuted,
    marginTop: spacing.md,
    marginLeft: 2,
  },
  frequency: {
    fontSize: 20,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  cents: {
    marginTop: spacing.xs,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
    height: 20,
  },
});
