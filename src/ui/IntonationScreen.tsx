import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Tuner } from '../audio/useTuner';
import {
  evaluateIntonation,
  findBridgeType,
  INTONATION_TOLERANCE_CENTS,
  OCTAVE_SEMITONES,
  type BridgeType,
} from '../music/intonation';
import { useStrings } from '../i18n/useStrings';
import { describeNote, type Accidental } from '../music/notes';
import { centsFromTarget } from '../music/pitch';
import { findTuning } from '../music/tunings';
import { useIntonation, type StringMeasurement } from '../state/intonation';
import { useSettings } from '../state/settings';
import { StringRow, type StringBadge } from './StringRow';
import { colors, IN_TUNE_CENTS, spacing, toneColor } from './theme';

/**
 * Najdalsza odchyłka, jaką przyjmujemy jako pomiar 12. progu. Chroni przed
 * zapisaniem nie tej nuty — pomyłka o oktawę to 1200 centów, więc tu nie wejdzie.
 */
const MAX_CAPTURE_CENTS = 200;

interface IntonationScreenProps {
  tuner: Tuner;
  onOpenSettings: () => void;
}

/**
 * Ustawianie menzury struna po strunie: najpierw stroimy pustą strunę,
 * potem gramy ten sam dźwięk na 12. progu, a rozjazd między odczytami
 * zamienia się na kierunek przesunięcia siodełka i obrotu śruby.
 */
export function IntonationScreen({ tuner, onOpenSettings }: IntonationScreenProps) {
  const t = useStrings();
  const referenceA = useSettings((state) => state.referenceA);
  const accidental = useSettings((state) => state.accidental);
  const tuningId = useSettings((state) => state.tuningId);
  const bridgeId = useSettings((state) => state.bridgeId);
  const activeString = useIntonation((state) => state.activeString);
  const measurements = useIntonation((state) => state.measurements);
  const selectString = useIntonation((state) => state.selectString);
  const captureOpen = useIntonation((state) => state.captureOpen);
  const captureFretted = useIntonation((state) => state.captureFretted);
  const resetString = useIntonation((state) => state.resetString);

  const tuning = findTuning(tuningId);
  const bridge = findBridgeType(bridgeId);

  if (!tuning) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>{t.intonation.emptyTitle}</Text>
        <Text style={styles.emptyBody}>{t.intonation.emptyBody}</Text>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          onPress={onOpenSettings}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>{t.intonation.emptyAction}</Text>
        </Pressable>
      </View>
    );
  }

  const badges: Record<number, StringBadge> = {};
  for (const [key, measurement] of Object.entries(measurements)) {
    if (measurement.frettedCents !== null) {
      const result = evaluateIntonation(measurement.openCents, measurement.frettedCents, bridge);
      badges[Number(key)] = result.ok ? 'ok' : 'adjust';
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.lead}>{t.intonation.lead}</Text>

      <StringRow
        tuning={tuning}
        markedIndex={activeString}
        markedLabel={t.tuner.selected}
        onPressString={selectString}
        badges={badges}
      />

      {activeString === null ? (
        <Text style={styles.hint}>{t.intonation.pickString}</Text>
      ) : (
        <StringPanel
          openMidi={tuning.strings[activeString]}
          accidental={accidental}
          referenceA={referenceA}
          frequency={tuner.reading.frequency}
          measurement={measurements[activeString]}
          bridge={bridge}
          onCaptureOpen={captureOpen}
          onCaptureFretted={captureFretted}
          onReset={() => resetString(activeString)}
        />
      )}

      <View style={styles.bridgeBlock}>
        <Text style={styles.bridgeLabel}>{t.settings.bridge}</Text>
        <Text style={styles.bridgeName}>{t.bridges[bridge.id].name}</Text>
        <Text style={styles.hint}>
          {t.bridges[bridge.id].hint} {t.intonation.changeInSettings}
        </Text>
      </View>
    </ScrollView>
  );
}

interface StringPanelProps {
  openMidi: number;
  accidental: Accidental;
  referenceA: number;
  frequency: number | null;
  measurement: StringMeasurement | undefined;
  bridge: BridgeType;
  onCaptureOpen: (cents: number) => void;
  onCaptureFretted: (cents: number) => void;
  onReset: () => void;
}

function StringPanel({
  openMidi,
  accidental,
  referenceA,
  frequency,
  measurement,
  bridge,
  onCaptureOpen,
  onCaptureFretted,
  onReset,
}: StringPanelProps) {
  const t = useStrings();
  const frettedMidi = openMidi + OCTAVE_SEMITONES;
  const done = measurement !== undefined && measurement.frettedCents !== null;
  const stage = measurement === undefined ? 'open' : done ? 'done' : 'fretted';

  // Odchyłkę liczymy sami, bo cel bywa poza listą strun stroju (12. próg).
  const targetMidi = stage === 'open' ? openMidi : frettedMidi;
  const liveCents = frequency === null ? null : centsFromTarget(frequency, targetMidi, referenceA);

  if (stage === 'done' && measurement && measurement.frettedCents !== null) {
    return (
      <Verdict
        openCents={measurement.openCents}
        frettedCents={measurement.frettedCents}
        bridge={bridge}
        onReset={onReset}
      />
    );
  }

  const openName = describeNote(openMidi, accidental);
  const frettedName = describeNote(frettedMidi, accidental);
  const isOpenStage = stage === 'open';
  const target = isOpenStage ? openName : frettedName;

  const withinCapture =
    liveCents !== null &&
    Math.abs(liveCents) <= (isOpenStage ? IN_TUNE_CENTS : MAX_CAPTURE_CENTS);

  return (
    <View style={styles.card}>
      <Text style={styles.step}>{t.intonation.step(isOpenStage ? 1 : 2)}</Text>
      <Text style={styles.cardTitle}>
        {isOpenStage ? t.intonation.tuneOpen : t.intonation.playFretted}
      </Text>

      <View style={styles.targetRow}>
        <Text style={styles.targetLabel}>{t.intonation.target}</Text>
        <Text style={styles.targetNote}>
          {target.name}
          {target.octave}
        </Text>
      </View>

      <Text
        testID="live-cents"
        style={[styles.live, { color: liveCents === null ? colors.textMuted : toneColor(liveCents) }]}
      >
        {liveCents === null ? '—' : t.tuner.cents(liveCents)}
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          !withinCapture && styles.buttonDisabled,
          pressed && styles.pressed,
        ]}
        onPress={() => {
          if (liveCents === null) {
            return;
          }
          if (isOpenStage) {
            onCaptureOpen(liveCents);
          } else {
            onCaptureFretted(liveCents);
          }
        }}
        disabled={!withinCapture}
        accessibilityRole="button"
        accessibilityState={{ disabled: !withinCapture }}
      >
        <Text style={styles.primaryButtonText}>
          {isOpenStage ? t.intonation.captureOpen : t.intonation.captureFretted}
        </Text>
      </Pressable>

      <Text style={styles.hint}>
        {isOpenStage ? t.intonation.openHint(IN_TUNE_CENTS) : t.intonation.frettedHint}
      </Text>

      {!isOpenStage && measurement && (
        <Pressable onPress={onReset} hitSlop={8} accessibilityRole="button">
          <Text style={styles.link}>{t.intonation.startOver}</Text>
        </Pressable>
      )}
    </View>
  );
}

interface VerdictProps {
  openCents: number;
  frettedCents: number;
  bridge: BridgeType;
  onReset: () => void;
}

function Verdict({ openCents, frettedCents, bridge, onReset }: VerdictProps) {
  const t = useStrings();
  const result = evaluateIntonation(openCents, frettedCents, bridge);
  const magnitude = Math.abs(Math.round(result.errorCents));

  return (
    <View style={styles.card}>
      <Text style={styles.step}>{t.intonation.result}</Text>
      <Text style={[styles.cardTitle, { color: result.ok ? colors.inTune : colors.nearTune }]}>
        {result.ok
          ? t.intonation.fine
          : result.errorCents > 0
            ? t.intonation.sharpBy(magnitude)
            : t.intonation.flatBy(magnitude)}
      </Text>

      <Text style={styles.readings}>{t.intonation.readings(openCents, frettedCents)}</Text>

      {result.ok ? (
        <Text style={styles.verdictBody}>
          {t.intonation.okBody(INTONATION_TOLERANCE_CENTS)}
        </Text>
      ) : (
        <>
          <Text style={styles.action}>
            {result.move === 'away-from-neck'
              ? t.intonation.moveAway
              : t.intonation.moveToward}
          </Text>
          <Text style={styles.turn}>
            {result.turn === 'clockwise'
              ? t.intonation.turnClockwise
              : t.intonation.turnCounterClockwise}
          </Text>
          <Text style={styles.hint}>{t.intonation.caveat}</Text>
        </>
      )}

      <Pressable
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        onPress={onReset}
        accessibilityRole="button"
      >
        <Text style={styles.secondaryButtonText}>{t.intonation.checkAgain}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    // Odstęp od przełącznika ekranów, który stoi tuż nad treścią.
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  lead: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  card: {
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  step: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: colors.text,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  targetLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  targetNote: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  live: {
    fontSize: 34,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
  },
  readings: {
    fontSize: 13,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  verdictBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  action: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.text,
  },
  turn: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.accent,
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  link: {
    fontSize: 14,
    color: colors.accent,
  },
  primaryButton: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: colors.accent,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  secondaryButton: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.textMuted,
  },
  bridgeBlock: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  bridgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  bridgeName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  pressed: {
    opacity: 0.6,
  },
});
