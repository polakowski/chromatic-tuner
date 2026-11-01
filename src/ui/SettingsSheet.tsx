import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  DEFAULT_REFERENCE_A,
  MAX_REFERENCE_A,
  MIN_REFERENCE_A,
  normalizeReferenceA,
  REFERENCE_A_PRESETS,
  useSettings,
  type Indicator,
  type Sensitivity,
} from '../state/settings';
import type { Accidental } from '../music/notes';
import { Segmented, type SegmentedOption } from './Segmented';
import { colors, spacing } from './theme';

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

const SENSITIVITY_OPTIONS: SegmentedOption<Sensitivity>[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const INDICATOR_OPTIONS: SegmentedOption<Indicator>[] = [
  { value: 'bar', label: 'Cents bar' },
  { value: 'strobe', label: 'Strobe' },
];

const ACCIDENTAL_OPTIONS: SegmentedOption<Accidental>[] = [
  { value: 'sharp', label: 'Sharps ♯' },
  { value: 'flat', label: 'Flats ♭' },
];

const STEPS = [-1, -0.1, 0.1, 1];

function formatStep(step: number): string {
  const sign = step > 0 ? '+' : '−';
  return `${sign}${Math.abs(step)}`;
}

export function SettingsSheet({ visible, onClose }: SettingsSheetProps) {
  const referenceA = useSettings((state) => state.referenceA);
  const accidental = useSettings((state) => state.accidental);
  const sensitivity = useSettings((state) => state.sensitivity);
  const indicator = useSettings((state) => state.indicator);
  const setReferenceA = useSettings((state) => state.setReferenceA);
  const adjustReferenceA = useSettings((state) => state.adjustReferenceA);
  const resetReferenceA = useSettings((state) => state.resetReferenceA);
  const setAccidental = useSettings((state) => state.setAccidental);
  const setSensitivity = useSettings((state) => state.setSensitivity);
  const setIndicator = useSettings((state) => state.setIndicator);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
              <Text style={styles.close}>Done</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionLabel}>Reference A</Text>
            <View style={styles.referenceRow}>
              <ReferenceInput
                // Zmiana wartości z zewnątrz (stepper, preset, reset) przemontowuje
                // pole, więc jego lokalny stan startuje od nowej wartości.
                key={`${referenceA}-${visible}`}
                value={referenceA}
                onCommit={setReferenceA}
              />
              <Text style={styles.unit}>Hz</Text>
            </View>
            <Text style={styles.hint}>
              {MIN_REFERENCE_A}–{MAX_REFERENCE_A} Hz
            </Text>

            <View style={styles.stepperRow}>
              {STEPS.map((step) => (
                <Pressable
                  key={step}
                  style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
                  onPress={() => adjustReferenceA(step)}
                  accessibilityRole="button"
                >
                  <Text style={styles.stepText}>{formatStep(step)}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.presetRow}>
              {REFERENCE_A_PRESETS.map((preset) => {
                const selected = normalizeReferenceA(preset) === referenceA;
                return (
                  <Pressable
                    key={preset}
                    style={({ pressed }) => [
                      styles.preset,
                      selected && styles.presetSelected,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setReferenceA(preset)}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.presetText, selected && styles.presetTextSelected]}>
                      {preset}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {referenceA !== DEFAULT_REFERENCE_A && (
              <Pressable onPress={resetReferenceA} hitSlop={8} accessibilityRole="button">
                <Text style={styles.reset}>Reset to {DEFAULT_REFERENCE_A} Hz</Text>
              </Pressable>
            )}

            <Text style={styles.sectionLabel}>Indicator</Text>
            <Segmented
              options={INDICATOR_OPTIONS}
              value={indicator}
              onChange={setIndicator}
              accessibilityLabel="Indicator style"
            />

            <Text style={styles.sectionLabel}>Notation</Text>
            <Segmented
              options={ACCIDENTAL_OPTIONS}
              value={accidental}
              onChange={setAccidental}
              accessibilityLabel="Notation"
            />

            <Text style={styles.sectionLabel}>Microphone sensitivity</Text>
            <Segmented
              options={SENSITIVITY_OPTIONS}
              value={sensitivity}
              onChange={setSensitivity}
              accessibilityLabel="Microphone sensitivity"
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface ReferenceInputProps {
  value: number;
  onCommit: (value: number) => void;
}

/**
 * Pole częstotliwości z własnym stanem edycji — pozwala przejść przez
 * niepełne wartości (np. "43" w drodze do "432") bez ich zatwierdzania.
 */
function ReferenceInput({ value, onCommit }: ReferenceInputProps) {
  const [draft, setDraft] = useState(() => value.toFixed(1));

  const commit = () => {
    const parsed = Number.parseFloat(draft.replace(',', '.'));
    if (Number.isFinite(parsed)) {
      onCommit(parsed);
      setDraft(normalizeReferenceA(parsed).toFixed(1));
    } else {
      setDraft(value.toFixed(1));
    }
  };

  return (
    <TextInput
      style={styles.referenceInput}
      value={draft}
      onChangeText={setDraft}
      onBlur={commit}
      onSubmitEditing={commit}
      keyboardType="decimal-pad"
      returnKeyType="done"
      selectTextOnFocus
      accessibilityLabel="Reference A frequency in hertz"
    />
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  close: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sectionLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  referenceInput: {
    flexGrow: 0,
    minWidth: 130,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 32,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontSize: 18,
    color: colors.textMuted,
  },
  hint: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textMuted,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  stepButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  stepText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  preset: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  presetSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  presetText: {
    fontSize: 14,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  presetTextSelected: {
    color: colors.background,
    fontWeight: '700',
  },
  reset: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.accent,
  },
  pressed: {
    opacity: 0.6,
  },
});
