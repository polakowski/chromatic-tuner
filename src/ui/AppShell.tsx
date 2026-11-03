import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useTuner } from '../audio/useTuner';
import { useStrings } from '../i18n/useStrings';
import { findTuning } from '../music/tunings';
import { useSettings } from '../state/settings';
import { IntonationScreen } from './IntonationScreen';
import { LevelMeter } from './LevelMeter';
import { Segmented, type SegmentedOption } from './Segmented';
import { SettingsSheet } from './SettingsSheet';
import { TunerScreen } from './TunerScreen';
import { colors, spacing } from './theme';

type Tab = 'tuner' | 'intonation';

/**
 * Korzeń aplikacji. Mikrofon otwieramy tutaj, a nie w ekranach, żeby
 * przełączanie zakładek nie przerywało nasłuchu i nie prosiło o zgodę ponownie.
 */
export function AppShell() {
  const tuner = useTuner();
  const t = useStrings();
  const [tab, setTab] = useState<Tab>('tuner');
  const [settingsVisible, setSettingsVisible] = useState(false);

  const referenceA = useSettings((state) => state.referenceA);
  const tuningId = useSettings((state) => state.tuningId);
  const tuning = findTuning(tuningId);

  const tabs: SegmentedOption<Tab>[] = [
    { value: 'tuner', label: t.tabs.tuner },
    { value: 'intonation', label: t.tabs.intonation },
  ];

  // Na web pierwsze uruchomienie AudioContext wymaga gestu użytkownika.
  const needsGesture = tuner.status === 'blocked' || tuner.status === 'error';
  const listening =
    tuner.permission === 'pending' || (tuner.permission === 'granted' && !needsGesture);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTuning}>
            {tuning ? t.tunings[tuning.id] : t.common.chromatic}
          </Text>
          <Text style={styles.headerReference}>A {referenceA.toFixed(1)} Hz</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
          onPress={() => setSettingsVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t.common.openSettings}
        >
          <Text style={styles.settingsLabel}>{t.common.settings}</Text>
        </Pressable>
      </View>

      <View style={styles.switcher}>
        <Segmented
          options={tabs}
          value={tab}
          onChange={setTab}
          variant="pill"
          itemRole="tab"
          accessibilityLabel={t.tabs.group}
        />
      </View>

      <View style={styles.content}>
        {tuner.permission === 'denied' && (
          <Prompt
            title={t.permission.micTitle}
            body={t.permission.micBody}
            action={t.permission.micAction}
            onPress={() => void tuner.requestPermission()}
          />
        )}

        {tuner.permission === 'granted' && needsGesture && (
          <Prompt
            title={t.permission.readyTitle}
            body={t.permission.readyBody}
            action={t.permission.readyAction}
            onPress={() => void tuner.start()}
          />
        )}

        {listening &&
          (tab === 'tuner' ? (
            <TunerScreen tuner={tuner} />
          ) : (
            <IntonationScreen tuner={tuner} onOpenSettings={() => setSettingsVisible(true)} />
          ))}
      </View>

      <View style={styles.footer}>
        {tuner.error ? (
          <Text style={styles.error}>{tuner.error}</Text>
        ) : (
          <LevelMeter level={tuner.reading.level} />
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerInfo: {
    flexShrink: 1,
  },
  headerTuning: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  headerReference: {
    fontSize: 13,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  settingsButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  switcher: {
    paddingTop: spacing.md,
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
