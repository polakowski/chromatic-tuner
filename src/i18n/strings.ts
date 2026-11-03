import type { Language } from './language';
import { pluralEn, pluralPl, signedCents } from './plural';

/**
 * Słownik interfejsu.
 *
 * `en` jest źródłem typu, a `pl` musi mieć dokładnie ten sam kształt — brakujący
 * albo nadmiarowy klucz to błąd kompilacji, nie niespodzianka w UI. Tam, gdzie
 * trzeba wstawić liczbę, klucz jest funkcją: polska odmiana zależy od wartości,
 * więc sklejanie fragmentów zdania nie przeszłoby.
 *
 * Nazwy dźwięków zostają międzynarodowe (C D E F G A B) niezależnie od języka —
 * tak wyglądają tabulatury i inne tunery.
 */
const en = {
  common: {
    settings: 'Settings',
    openSettings: 'Open settings',
    done: 'Done',
    close: 'Close',
    chromatic: 'Chromatic',
  },
  tabs: {
    tuner: 'Tuner',
    intonation: 'Intonation',
    group: 'Screen',
  },
  permission: {
    micTitle: 'Microphone access needed',
    micBody: 'The tuner listens through the microphone. Grant access to continue.',
    micAction: 'Allow microphone',
    readyTitle: 'Ready to listen',
    readyBody: 'Browsers need a tap before they hand over the microphone.',
    readyAction: 'Start tuner',
  },
  tuner: {
    playNote: 'Play a note',
    inTune: 'In tune',
    cents: (value: number) =>
      `${signedCents(value)} ${pluralEn(Math.round(value), 'cent', 'cents')}`,
    strobeFlat: '♭ flat',
    strobeStill: 'still = in tune',
    strobeSharp: 'sharp ♯',
    pinned: 'pinned',
    selected: 'selected',
    badgeOk: 'intonation fine',
    badgeAdjust: 'needs adjustment',
  },
  settings: {
    tuning: 'Tuning',
    bridge: 'Bridge',
    referenceA: 'Reference A',
    referenceInput: 'Reference A frequency in hertz',
    referenceDown: 'Lower reference A by one hertz',
    referenceUp: 'Raise reference A by one hertz',
    indicator: 'Indicator',
    indicatorBar: 'Cents bar',
    indicatorStrobe: 'Strobe',
    indicatorGroup: 'Indicator style',
    notation: 'Notation',
    sharps: 'Sharps ♯',
    flats: 'Flats ♭',
    sensitivity: 'Microphone sensitivity',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    language: 'Language',
  },
  intonation: {
    lead:
      'Tune the open string, then play the same note at the 12th fret. The gap between the two readings says which way the saddle has to move.',
    emptyTitle: 'Pick an instrument first',
    emptyBody:
      'Intonation is set one string at a time, so the tuner needs to know which strings your instrument has. Chromatic mode has none.',
    emptyAction: 'Choose a tuning',
    pickString: 'Pick a string to start.',
    step: (index: number) => `Step ${index} of 2`,
    tuneOpen: 'Tune the open string',
    playFretted: 'Play the 12th fret',
    target: 'Target',
    captureOpen: 'Capture open string',
    captureFretted: 'Capture 12th fret',
    openHint: (tolerance: number) =>
      `Unlocks once the open string is within ${tolerance} ${pluralEn(tolerance, 'cent', 'cents')}.`,
    frettedHint: 'Fret it as you normally would — pressing harder bends the note sharp.',
    startOver: 'Start this string over',
    result: 'Result',
    fine: 'Intonation is fine',
    sharpBy: (amount: number) =>
      `12th fret is ${amount} ${pluralEn(amount, 'cent', 'cents')} sharp`,
    flatBy: (amount: number) => `12th fret is ${amount} ${pluralEn(amount, 'cent', 'cents')} flat`,
    readings: (open: number, fretted: number) =>
      `Open ${signedCents(open)} ct · 12th fret ${signedCents(fretted)} ct`,
    okBody: (tolerance: number) =>
      `The two readings agree to within ${tolerance} ${pluralEn(tolerance, 'cent', 'cents')}. Leave this saddle alone.`,
    moveAway: 'Move the saddle away from the neck — the string needs to be longer.',
    moveToward: 'Move the saddle toward the neck — the string needs to be shorter.',
    turnClockwise: 'Turn the intonation screw clockwise — to the right.',
    turnCounterClockwise: 'Turn the intonation screw counter-clockwise — to the left.',
    caveat:
      'Watch the saddle, not the screwdriver. If it travels the other way, your bridge has the screws on the opposite side — switch the bridge type in settings. Moving a saddle detunes the open string, so retune before you check again.',
    checkAgain: 'Check again',
    changeInSettings: 'Change it in settings.',
  },
  tunings: {
    'guitar-standard': 'Guitar standard',
    'guitar-drop-d': 'Drop D',
    'guitar-eb': 'E♭ standard',
    'guitar-d': 'D standard',
    'guitar-seven': '7-string',
    'guitar-open-em': 'Open Em',
    'guitar-open-g': 'Open G',
    'bass-four': 'Bass 4-string',
    'bass-five': 'Bass 5-string',
  },
  bridges: {
    fender: {
      name: 'Fender-style',
      hint: 'Stratocaster, Telecaster, Precision, Jazz — screws reached from behind the bridge.',
    },
    'tom-neck': {
      name: 'Tune-o-matic, screws at the neck',
      hint: 'Screw heads face the fretboard. Usually an ABR-1.',
    },
    'tom-tail': {
      name: 'Tune-o-matic, screws at the tailpiece',
      hint: 'Screw heads face the stopbar. Usually a Nashville.',
    },
  },
};

export type Strings = typeof en;

const pl: Strings = {
  common: {
    settings: 'Ustawienia',
    openSettings: 'Otwórz ustawienia',
    done: 'Gotowe',
    close: 'Zamknij',
    chromatic: 'Chromatyczny',
  },
  tabs: {
    tuner: 'Tuner',
    intonation: 'Menzura',
    group: 'Ekran',
  },
  permission: {
    micTitle: 'Potrzebny dostęp do mikrofonu',
    micBody: 'Tuner słucha przez mikrofon. Zezwól na dostęp, żeby zacząć.',
    micAction: 'Zezwól na mikrofon',
    readyTitle: 'Gotowe do nasłuchu',
    readyBody: 'Przeglądarka oddaje mikrofon dopiero po dotknięciu ekranu.',
    readyAction: 'Uruchom tuner',
  },
  tuner: {
    playNote: 'Zagraj dźwięk',
    inTune: 'Nastrojone',
    cents: (value: number) =>
      `${signedCents(value)} ${pluralPl(Math.round(value), 'cent', 'centy', 'centów')}`,
    strobeFlat: '♭ nisko',
    strobeStill: 'stoi = nastrojone',
    strobeSharp: 'wysoko ♯',
    pinned: 'przypięta',
    selected: 'wybrana',
    badgeOk: 'menzura w porządku',
    badgeAdjust: 'do poprawy',
  },
  settings: {
    tuning: 'Strój',
    bridge: 'Mostek',
    referenceA: 'Strój A',
    referenceInput: 'Strój A w hercach',
    referenceDown: 'Obniż strój A o herc',
    referenceUp: 'Podnieś strój A o herc',
    indicator: 'Wskaźnik',
    indicatorBar: 'Pasek centów',
    indicatorStrobe: 'Strobo',
    indicatorGroup: 'Styl wskaźnika',
    notation: 'Zapis',
    sharps: 'Krzyżyki ♯',
    flats: 'Bemole ♭',
    sensitivity: 'Czułość mikrofonu',
    low: 'Niska',
    medium: 'Średnia',
    high: 'Wysoka',
    language: 'Język',
  },
  intonation: {
    lead:
      'Nastrój pustą strunę, a potem zagraj ten sam dźwięk na 12. progu. Różnica między odczytami mówi, w którą stronę przesunąć siodełko.',
    emptyTitle: 'Najpierw wybierz instrument',
    emptyBody:
      'Menzurę ustawia się struna po strunie, więc tuner musi wiedzieć, jakie struny ma instrument. Tryb chromatyczny ich nie ma.',
    emptyAction: 'Wybierz strój',
    pickString: 'Wybierz strunę, żeby zacząć.',
    step: (index: number) => `Krok ${index} z 2`,
    tuneOpen: 'Nastrój pustą strunę',
    playFretted: 'Zagraj 12. próg',
    target: 'Cel',
    captureOpen: 'Zapisz pustą strunę',
    captureFretted: 'Zapisz 12. próg',
    openHint: (tolerance: number) =>
      `Odblokuje się, gdy pusta struna zmieści się w granicy ${tolerance} ${pluralPl(tolerance, 'centa', 'centów', 'centów')}.`,
    frettedHint: 'Przyciśnij strunę jak zwykle — mocniejszy nacisk podciąga dźwięk w górę.',
    startOver: 'Zacznij tę strunę od nowa',
    result: 'Wynik',
    fine: 'Menzura w porządku',
    sharpBy: (amount: number) =>
      `12. próg jest o ${amount} ${pluralPl(amount, 'cent', 'centy', 'centów')} za wysoko`,
    flatBy: (amount: number) =>
      `12. próg jest o ${amount} ${pluralPl(amount, 'cent', 'centy', 'centów')} za nisko`,
    readings: (open: number, fretted: number) =>
      `Pusta ${signedCents(open)} ct · 12. próg ${signedCents(fretted)} ct`,
    okBody: (tolerance: number) =>
      `Oba odczyty zgadzają się w granicy ${tolerance} ${pluralPl(tolerance, 'centa', 'centów', 'centów')}. Zostaw to siodełko w spokoju.`,
    moveAway: 'Odsuń siodełko od gryfu — struna musi być dłuższa.',
    moveToward: 'Przysuń siodełko do gryfu — struna musi być krótsza.',
    turnClockwise: 'Kręć śrubą menzury w prawo.',
    turnCounterClockwise: 'Kręć śrubą menzury w lewo.',
    caveat:
      'Patrz na siodełko, nie na śrubokręt. Jeśli jedzie w drugą stronę, Twój mostek ma śruby po przeciwnej stronie — zmień typ mostka w ustawieniach. Przesunięcie siodełka rozstraja pustą strunę, więc nastrój ją przed kolejnym sprawdzeniem.',
    checkAgain: 'Sprawdź ponownie',
    changeInSettings: 'Zmienisz go w ustawieniach.',
  },
  tunings: {
    'guitar-standard': 'Gitara standard',
    'guitar-drop-d': 'Drop D',
    'guitar-eb': 'E♭ standard',
    'guitar-d': 'D standard',
    'guitar-seven': '7-strunowa',
    'guitar-open-em': 'Open Em',
    'guitar-open-g': 'Open G',
    'bass-four': 'Bas 4-strunowy',
    'bass-five': 'Bas 5-strunowy',
  },
  bridges: {
    fender: {
      name: 'Typu Fender',
      hint: 'Stratocaster, Telecaster, Precision, Jazz — śruby dostępne od tyłu mostka.',
    },
    'tom-neck': {
      name: 'Tune-o-matic, śruby od gryfu',
      hint: 'Łby śrub patrzą w stronę podstrunnicy. Zwykle ABR-1.',
    },
    'tom-tail': {
      name: 'Tune-o-matic, śruby od strunociągu',
      hint: 'Łby śrub patrzą w stronę strunociągu. Zwykle Nashville.',
    },
  },
};

export const STRINGS: Record<Language, Strings> = { en, pl };
