import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useStrings } from '../i18n/useStrings';
import { colors, spacing } from './theme';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Spoken name of the control and heading of the open list, e.g. "Tuning". */
  label: string;
}

/**
 * Lista rozwijana oparta wyłącznie na prymitywach React Native.
 *
 * Celowo bez natywnego pickera: na iOS jest on kołem przewijanym o stałej
 * wysokości 216 px, a nie rozwijaną listą, więc ten sam kod dawałby trzy różne
 * kontrolki. Tutaj wszystkie platformy dostają to samo i w skórce aplikacji.
 */
export function Select<T extends string>({ options, value, onChange, label }: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const t = useStrings();

  const selected = options.find((option) => option.value === value);

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected ? selected.label : ''}`}
      >
        <Text style={styles.triggerLabel} numberOfLines={1}>
          {selected ? selected.label : ''}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
        >
          {/* Pochłania dotknięcia, żeby stuknięcie w listę nie zamykało tła. */}
          <View style={styles.panel} onStartShouldSetResponder={() => true}>
            <Text style={styles.panelTitle}>{label}</Text>
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    style={({ pressed }) => [
                      styles.option,
                      active && styles.optionActive,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                      {option.label}
                    </Text>
                    {active && <Text style={styles.check}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  triggerLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  chevron: {
    fontSize: 14,
    color: colors.textMuted,
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '70%',
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
  },
  panelTitle: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    // Odstęp od pierwszej pozycji listy.
    paddingBottom: spacing.md,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.md,
  },
  optionActive: {
    backgroundColor: colors.surfaceRaised,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.textMuted,
  },
  optionLabelActive: {
    color: colors.text,
    fontWeight: '600',
  },
  check: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
  },
  pressed: {
    opacity: 0.6,
  },
});
