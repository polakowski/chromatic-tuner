import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useTuner } from '../audio/useTuner';
import { useSettings } from '../state/settings';
import { CentsBar } from './CentsBar';
import { StrobeDisplay } from './StrobeDisplay';
import { LevelMeter } from './LevelMeter';
import { NoteDisplay } from './NoteDisplay';
import { SettingsSheet } from './SettingsSheet';
import { colors, spacing } from './theme';

export function TunerScreen() {
  const { reading, deviation, hasPitch, permission, status, error, requestPermission, start } =
    useTuner();
  const referenceA = useSettings((state) => state.referenceA);
  const indicator = useSettings((state) => state.indicator);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Na web pierwsze uruchomienie AudioContext wymaga gestu użytkownika.
  const needsGesture = status === 'blocked' || status === 'error';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.referenceChip, pressed && styles.pressed]}
          onPress={() => setSettingsVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`Reference A is ${referenceA} hertz. Open settings.`}
        >
          <Text style={styles.referenceLabel}>A</Text>
          <Text style={styles.referenceValue}>{referenceA.toFixed(1)}</Text>
          <Text style={styles.referenceUnit}>Hz</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {permission === 'denied' && (
          <Prompt
            title="Microphone access needed"
            body="The tuner listens through the microphone. Grant access to continue."
            action="Allow microphone"
            onPress={() => void requestPermission()}
          />
        )}

        {permission === 'granted' && needsGesture && (
          <Prompt
            title="Ready to listen"
            body="Browsers need a tap before they hand over the microphone."
            action="Start tuner"
            onPress={() => void start()}
          />
        )}

        {(permission === 'pending' || (permission === 'granted' && !needsGesture)) && (
          <>
            <NoteDisplay reading={reading} />
            <View style={styles.indicatorWrapper}>
              {indicator === 'strobe' ? (
                <StrobeDisplay deviation={deviation} hasPitch={hasPitch} />
              ) : (
                <CentsBar deviation={deviation} hasPitch={hasPitch} />
              )}
            </View>
          </>
        )}
      </View>

      <View style={styles.footer}>
        {error ? <Text style={styles.error}>{error}</Text> : <LevelMeter level={reading.level} />}
      </View>

      <SettingsSheet visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </SafeAreaView>
  );
}

interface PromptProps {
  title: string;
  body: string;
  action: string;
  onPress: () => void;
}

function Prompt({ title, body, action, onPress }: PromptProps) {
  return (
    <View style={styles.message}>
      <Text style={styles.messageTitle}>{title}</Text>
      <Text style={styles.messageBody}>{body}</Text>
      <Pressable
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        onPress={onPress}
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonText}>{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  referenceChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  referenceLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  referenceValue: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  referenceUnit: {
    fontSize: 12,
    color: colors.textMuted,
  },
  content: {
    flex: 1,
    width: '100%',
    // Na tablecie i w przeglądarce treść nie rozjeżdża się na całą szerokość.
    maxWidth: 520,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  indicatorWrapper: {
    marginTop: spacing.xl,
  },
  footer: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  message: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  messageBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.textMuted,
  },
  primaryButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  error: {
    fontSize: 12,
    color: colors.offTune,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
