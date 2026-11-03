import { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { LANGUAGE_NAMES, LANGUAGES, type Language } from '../i18n/language';
import { useStrings } from '../i18n/useStrings';
import { BRIDGE_TYPES } from '../music/intonation';
import type { Accidental } from '../music/notes';
import { CHROMATIC_ID, TUNINGS } from '../music/tunings';
import {
  normalizeReferenceA,
  useSettings,
  type Indicator,
  type Sensitivity,
} from '../state/settings';
import { Segmented, type SegmentedOption } from './Segmented';
import { Select, type SelectOption } from './Select';
import { colors, spacing } from './theme';

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** Bok pola Hz. Strzałki są kwadratami o tym samym boku, żeby rząd był równy. */
const FIELD_SIZE = 60;
/** Krok strzałek — wartości ułamkowe wpisuje się z klawiatury. */
const REFERENCE_STEP = 1;

const OPEN_MS = 300;
const CLOSE_MS = 220;
/**
 * Natywnie przerzucamy animację na wątek UI, ale react-native-web nie ma
 * natywnego modułu Animated i ostrzega o tym przy każdym uruchomieniu.
 */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export function SettingsSheet({ visible, onClose }: SettingsSheetProps) {
  const referenceA = useSettings((state) => state.referenceA);
  const accidental = useSettings((state) => state.accidental);
  const sensitivity = useSettings((state) => state.sensitivity);
  const indicator = useSettings((state) => state.indicator);
  const tuningId = useSettings((state) => state.tuningId);
  const bridgeId = useSettings((state) => state.bridgeId);
  const language = useSettings((state) => state.language);
  const setReferenceA = useSettings((state) => state.setReferenceA);
  const adjustReferenceA = useSettings((state) => state.adjustReferenceA);
  const setAccidental = useSettings((state) => state.setAccidental);
  const setSensitivity = useSettings((state) => state.setSensitivity);
  const setIndicator = useSettings((state) => state.setIndicator);
  const setTuning = useSettings((state) => state.setTuning);
  const setBridge = useSettings((state) => state.setBridge);
  const setLanguage = useSettings((state) => state.setLanguage);
  const t = useStrings();
  const { height: windowHeight } = useWindowDimensions();

  // Wbudowane animationType="slide" przesuwa całe okno modalu razem z tłem,
  // przez co przyciemnienie wjeżdża z dołu. Sterujemy więc obiema warstwami
  // osobno: tło się wygasza, a sam arkusz wyjeżdża.
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) {
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: OPEN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [visible, progress]);

  // Zamknięcie najpierw odgrywa animację, a dopiero jej koniec odmontowuje
  // modal — inaczej arkusz znikałby skokowo.
  const requestClose = useCallback(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration: CLOSE_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start(({ finished }) => {
      if (finished) {
        onClose();
      }
    });
  }, [progress, onClose]);

  const sensitivityOptions: SegmentedOption<Sensitivity>[] = [
    { value: 'low', label: t.settings.low },
    { value: 'medium', label: t.settings.medium },
    { value: 'high', label: t.settings.high },
  ];
  const indicatorOptions: SegmentedOption<Indicator>[] = [
    { value: 'bar', label: t.settings.indicatorBar },
    { value: 'strobe', label: t.settings.indicatorStrobe },
  ];
  const accidentalOptions: SegmentedOption<Accidental>[] = [
    { value: 'sharp', label: t.settings.sharps },
    { value: 'flat', label: t.settings.flats },
  ];
  const languageOptions: SegmentedOption<Language>[] = LANGUAGES.map((value) => ({
    value,
    label: LANGUAGE_NAMES[value],
  }));
  const tuningOptions: SelectOption<string>[] = [
    { value: CHROMATIC_ID, label: t.common.chromatic },
    ...TUNINGS.map((tuning) => ({ value: tuning.id as string, label: t.tunings[tuning.id] })),
  ];
  const bridgeOptions: SelectOption<string>[] = BRIDGE_TYPES.map((bridge) => ({
    value: bridge.id as string,
    label: t.bridges[bridge.id].name,
  }));

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={requestClose}>
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [windowHeight, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t.common.settings}</Text>
            <Pressable onPress={requestClose} hitSlop={12} accessibilityRole="button">
              <Text style={styles.close}>{t.common.done}</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionLabel}>{t.settings.tuning}</Text>
            <Select
              options={tuningOptions}
              value={tuningId}
              onChange={setTuning}
              label={t.settings.tuning}
            />

            <Text style={styles.sectionLabel}>{t.settings.bridge}</Text>
            <Select
              options={bridgeOptions}
              value={bridgeId}
              onChange={setBridge}
              label={t.settings.bridge}
            />

            <Text style={styles.sectionLabel}>{t.settings.referenceA}</Text>
            <View style={styles.referenceRow}>
              <ReferenceInput
                // Zmiana wartości z zewnątrz (strzałki) przemontowuje pole,
                // więc jego lokalny stan startuje od nowej wartości.
                key={`${referenceA}-${visible}`}
                value={referenceA}
                onCommit={setReferenceA}
                label={t.settings.referenceInput}
              />
              <Text style={styles.unit}>Hz</Text>
              <Pressable
                style={({ pressed }) => [styles.stepSquare, pressed && styles.pressed]}
                onPress={() => adjustReferenceA(-REFERENCE_STEP)}
                accessibilityRole="button"
                accessibilityLabel={t.settings.referenceDown}
              >
                <Text style={styles.stepArrow}>▼</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.stepSquare, pressed && styles.pressed]}
                onPress={() => adjustReferenceA(REFERENCE_STEP)}
                accessibilityRole="button"
                accessibilityLabel={t.settings.referenceUp}
              >
                <Text style={styles.stepArrow}>▲</Text>
              </Pressable>
            </View>

            <Text style={styles.sectionLabel}>{t.settings.indicator}</Text>
            <Segmented
              options={indicatorOptions}
              value={indicator}
              onChange={setIndicator}
              accessibilityLabel={t.settings.indicatorGroup}
            />

            <Text style={styles.sectionLabel}>{t.settings.notation}</Text>
            <Segmented
              options={accidentalOptions}
              value={accidental}
              onChange={setAccidental}
              accessibilityLabel={t.settings.notation}
            />

            <Text style={styles.sectionLabel}>{t.settings.sensitivity}</Text>
            <Segmented
              options={sensitivityOptions}
              value={sensitivity}
              onChange={setSensitivity}
              accessibilityLabel={t.settings.sensitivity}
            />

            <Text style={styles.sectionLabel}>{t.settings.language}</Text>
            <Segmented
              options={languageOptions}
              value={language}
              onChange={setLanguage}
              accessibilityLabel={t.settings.language}
            />
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

interface ReferenceInputProps {
  value: number;
  onCommit: (value: number) => void;
  label: string;
}

/**
 * Pole częstotliwości z własnym stanem edycji — pozwala przejść przez
 * niepełne wartości (np. "43" w drodze do "432") bez ich zatwierdzania.
 */
function ReferenceInput({ value, onCommit, label }: ReferenceInputProps) {
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
      accessibilityLabel={label}
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
    width: '100%',
    // Na desktopie arkusz nie rozlewa się na całą szerokość okna.
    maxWidth: 520,
    alignSelf: 'center',
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
    alignItems: 'center',
    gap: spacing.sm,
  },
  referenceInput: {
    flex: 1,
    // Bez tego <input> nie zejdzie poniżej swojej szerokości min-content
    // (flexbox daje elementom `min-width: auto`) i rozpycha rząd poza ekran.
    minWidth: 0,
    height: FIELD_SIZE,
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
  stepSquare: {
    width: FIELD_SIZE,
    height: FIELD_SIZE,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  stepArrow: {
    fontSize: 18,
    color: colors.text,
  },
  pressed: {
    opacity: 0.6,
  },
});
