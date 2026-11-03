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

Zakres: 27–2000 Hz. Dolna granica wynika z B0 basu pięciostrunowego, które
przy najniższym wspieranym stroju (A=390) schodzi do ~27,4 Hz.

## Strój A

`referenceA` (domyślnie 440 Hz) jest jedynym punktem odniesienia — nuta i
odchyłka liczą się z `69 + 12·log2(f / A)`, więc zmiana stroju przesuwa całą
skalę, a nie tylko wyświetlaną wartość. Ustawienia trzyma zustand z zapisem
w AsyncStorage.

## Ekrany

Dwa ekrany pod wspólnym korzeniem (`AppShell`), przełączane pigułkowym
przełącznikiem nad treścią — tym samym komponentem `Segmented`, co wybory
w ustawieniach. Mikrofon otwiera się raz, w korzeniu, więc przełączenie ekranu
nie przerywa nasłuchu ani nie pyta ponownie o zgodę.

### Tuner

Duża nuta, wskaźnik odchyłki (pasek centów albo strobo) i rząd strun
aktywnego stroju. W trybie instrumentu odchyłka liczy się do **najbliższej
struny, nie najbliższego półtonu** — mocno opuszczone E czyta się jako
„E, bardzo nisko", a nie jako sąsiedni półton. Dotknięcie struny przypina do
niej pomiar, co ratuje sytuację, gdy rozstrojenie przekracza pół odległości
do sąsiada.

### Intonation

Ustawianie menzury struna po strunie. Dwunasty próg dzieli drgającą część
struny na pół, więc przy dobrze ustawionym siodełku pusta struna i dźwięk
z 12. progu to ta sama nuta w odstępie oktawy.

1. Stroimy pustą strunę — zapis odblokowuje się dopiero w granicy 5 centów.
2. Gramy ten sam dźwięk na 12. progu.
3. Dostajemy kierunek przesunięcia siodełka i obrotu śruby.

Rozjazd liczymy jako różnicę obu odczytów, a nie jako odchyłkę od nominalnej
nuty — resztkowe rozstrojenie znosi się po obu stronach, bo liczy się sam
stosunek długości.

Kierunek obrotu śruby zależy od mostka, dlatego jest wybierany w ustawieniach.
Decyduje jedna rzecz: **z której strony siodełka siedzi łeb śruby**. Śruba jest
wkręcona w siodełko, a jej łeb opiera się o mostek, więc obrót w prawo nie
wsuwa śruby głębiej — wciąga siodełko w stronę łba. W mostkach fenderowych łeb
jest z tyłu, w Tune-o-matic bywa z obu stron (ABR-1 zwykle od gryfu, Nashville
od strunociągu), dlatego pytamy o stronę, a nie o markę. Aplikacja zawsze podaje
też kierunek ruchu samego siodełka, który jest niezależny od sprzętu.

## Listy wyboru

Strój i mostek wybiera się własnym komponentem `Select` (wiersz z wartością,
po dotknięciu lista w modalu), a nie natywnym pickerem. Powód jest platformowy:
`@react-native-picker/picker` daje na webie `<select>`, na Androidzie dropdown,
ale na iOS renderuje koło przewijane o stałej wysokości 216 px — czyli trzy
różne kontrolki z jednego kodu, z czego ta iOS-owa nie jest listą rozwijaną
i nie mieści się w arkuszu ustawień. Własny komponent stoi na samych
prymitywach RN, więc wszędzie zachowuje się tak samo.

## Języki

Polski i angielski, przełączane w ustawieniach. Przy pierwszym uruchomieniu
wygrywa język systemu (`expo-localization`), z angielskim jako zapasem dla
wszystkiego poza tą dwójką; późniejszy wybór siedzi w AsyncStorage i ma
pierwszeństwo nad ustawieniem systemu.

Słownik (`src/i18n/strings.ts`) jest zwykłym obiektem TypeScriptu: `en` jest
źródłem typu, a `pl` musi mieć dokładnie ten sam kształt, więc brakujące albo
nadmiarowe tłumaczenie nie przechodzi kompilacji. Z tego samego powodu `Tuning`
i `BridgeType` nie trzymają już nazw — mają tylko `id`, a nazwa jest w słowniku.
Dodanie stroju bez tłumaczenia to błąd kompilacji, nie pusty napis w UI.

Teksty z liczbą są funkcjami, bo polska odmiana zależy od wartości
(1 cent, 2 centy, 5 centów, ale 12 centów i 22 centy) i sklejanie fragmentów
zdania by tego nie udźwignęło.

Nazwy dźwięków zostają międzynarodowe (C D E F G A B) niezależnie od języka —
tak wyglądają tabulatury i pozostałe tunery, mimo że polska nomenklatura
muzyczna użyłaby H.

## Stan

Tryb chromatyczny i dziewięć strojów (gitara standard / Drop D / E♭ / D /
7-strunowa / Open Em / Open G, bas 4- i 5-strunowy), strój A, zapis ♯/♭,
czułość mikrofonu, wskaźnik paskowy albo strobo, ustawianie menzury,
interfejs po polsku i angielsku. Bez generatora tonu i transpozycji.
