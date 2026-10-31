# Chromatic Tuner

Chromatyczny tuner na Androida i web (Expo + React Native), z regulowanym
stroikiem A w zakresie 390–500 Hz.

## Uruchomienie

Android wymaga dev builda — `useAudioStream` z `expo-audio` to moduł natywny,
którego nie ma w Expo Go:

```bash
npx expo run:android
```

Web działa bez builda natywnego:

```bash
npx expo start --web
```

Mikrofon w przeglądarce wymaga `localhost` albo HTTPS.

## Skrypty

```bash
npm test          # testy DSP i konwersji nut (jest)
npm run lint      # eslint (eslint-config-expo)
npm run typecheck # tsc --noEmit
```

## Jak to działa

```
mikrofon (PCM float32)
  └─ src/audio/micStream.ts        Android: expo-audio useAudioStream
     src/audio/micStream.web.ts    web: getUserMedia + AudioWorklet
  └─ src/dsp/analyzer.ts           PitchAnalyzer — cały łańcuch DSP
       ├─ lowpass.ts               kaskada biquadów (antyaliasing)
       ├─ decymacja ×4             ~11 kHz, tanie liczenie YIN
       ├─ ringBuffer.ts            ramka 4096 / hop 1024 (~43 analizy/s)
       └─ yin.ts                   zgrubny YIN + doprecyzowanie na pełnym fs
  └─ src/dsp/smoothing.ts          mediana 5 + EMA w skali log, hold 600 ms
  └─ src/music/pitch.ts            f0 -> nuta + odchyłka w centach (względem A)
  └─ src/ui/                       pasek centów, nuta, ustawienia
```

Detekcja wysokości dźwięku jest dwuetapowa, bo jeden etap nie obsługuje
całego zakresu tanio i dokładnie jednocześnie:

1. **Zgrubny YIN** na sygnale zdecymowanym do ~11 kHz. Krótka ramka (1024)
   i mały zakres opóźnień, więc koszt to ~400 tys. operacji na analizę.
2. **Doprecyzowanie** funkcji różnicowej na pełnych 44,1 kHz, w oknie ±3
   próbki wokół zgrubnego okresu, z interpolacją paraboliczną. Dzięki temu
   dokładność jest poniżej 1 centa także dla wysokich dźwięków, gdzie okres
   po decymacji ma tylko kilka próbek.

Zakres: 30–2000 Hz (B0 na pięciostrunowym basie aż po górne rejestry).

## Strój A

`referenceA` (domyślnie 440 Hz) jest jedynym punktem odniesienia — nuta i
odchyłka liczą się z `69 + 12·log2(f / A)`, więc zmiana stroju przesuwa całą
skalę, a nie tylko wyświetlaną wartość. Ustawienia trzyma zustand z zapisem
w AsyncStorage.

## Stan

MVP: tryb chromatyczny, strój A, zapis ♯/♭, czułość mikrofonu.
Bez presetów instrumentów, generatora tonu i transpozycji.
