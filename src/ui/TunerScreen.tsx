import { StyleSheet, View } from 'react-native';

import type { Tuner } from '../audio/useTuner';
import { useStrings } from '../i18n/useStrings';
import { findTuning } from '../music/tunings';
import { useSettings } from '../state/settings';
import { CentsBar } from './CentsBar';
import { NoteDisplay } from './NoteDisplay';
import { StringRow } from './StringRow';
import { StrobeDisplay } from './StrobeDisplay';
import { spacing } from './theme';

interface TunerScreenProps {
  tuner: Tuner;
}

export function TunerScreen({ tuner }: TunerScreenProps) {
  const { reading, deviation, hasPitch } = tuner;
  const t = useStrings();
  const indicator = useSettings((state) => state.indicator);
  const tuningId = useSettings((state) => state.tuningId);
  const lockedString = useSettings((state) => state.lockedString);
  const toggleLockedString = useSettings((state) => state.toggleLockedString);
  const tuning = findTuning(tuningId);

  return (
    <View style={styles.container}>
      <NoteDisplay reading={reading} />

      <View style={styles.indicatorWrapper}>
        {indicator === 'strobe' ? (
          <StrobeDisplay deviation={deviation} hasPitch={hasPitch} />
        ) : (
          <CentsBar deviation={deviation} hasPitch={hasPitch} />
        )}
      </View>

      {tuning && (
        <View style={styles.stringsWrapper}>
          <StringRow
            tuning={tuning}
            activeIndex={reading.stringIndex}
            cents={reading.cents}
            markedIndex={lockedString}
            markedLabel={t.tuner.pinned}
            onPressString={toggleLockedString}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  indicatorWrapper: {
    marginTop: spacing.xl,
  },
  stringsWrapper: {
    marginTop: spacing.lg,
  },
});
