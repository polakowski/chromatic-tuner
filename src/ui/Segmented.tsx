import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from './theme';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Spoken label for the whole group, e.g. "Notation". */
  accessibilityLabel?: string;
  /** 'block' fills the available width (settings rows), 'pill' hugs its content. */
  variant?: 'block' | 'pill';
  /** 'radio' for a setting, 'tab' when the choice swaps the whole view. */
  itemRole?: 'radio' | 'tab';
}

/** Przełącznik jednokrotnego wyboru — wspólny dla ustawień i dla zmiany ekranu. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  variant = 'block',
  itemRole = 'radio',
}: SegmentedProps<T>) {
  const pill = variant === 'pill';

  return (
    <View
      style={[styles.group, pill && styles.groupPill]}
      accessibilityRole={itemRole === 'tab' ? 'tablist' : 'radiogroup'}
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={[
              styles.segment,
              pill ? styles.segmentPill : styles.segmentBlock,
              selected && styles.segmentSelected,
              selected && pill && styles.segmentSelectedPill,
            ]}
            onPress={() => onChange(option.value)}
            accessibilityRole={itemRole}
            accessibilityState={{ selected }}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
  },
  groupPill: {
    borderRadius: 999,
    // Pigułka ma szerokość treści i stoi na środku, a nie przez całą szerokość.
    alignSelf: 'center',
  },
  segment: {
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentBlock: {
    flex: 1,
  },
  segmentPill: {
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
  },
  segmentSelected: {
    backgroundColor: colors.border,
  },
  segmentSelectedPill: {
    borderRadius: 999,
  },
  label: {
    fontSize: 15,
    color: colors.textMuted,
  },
  labelSelected: {
    color: colors.text,
    fontWeight: '600',
  },
});
