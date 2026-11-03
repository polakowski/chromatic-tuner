import { BRIDGE_TYPES } from '../../music/intonation';
import { TUNINGS } from '../../music/tunings';
import { isLanguage, LANGUAGE_NAMES, LANGUAGES } from '../language';
import { pluralEn, pluralPl, signedCents } from '../plural';
import { STRINGS } from '../strings';

describe('pluralPl', () => {
  it('uses the singular only for exactly one', () => {
    expect(pluralPl(1, 'cent', 'centy', 'centów')).toBe('cent');
    expect(pluralPl(-1, 'cent', 'centy', 'centów')).toBe('cent');
  });

  it('uses the "few" form for endings 2-4', () => {
    for (const n of [2, 3, 4, 22, 33, 104]) {
      expect(pluralPl(n, 'cent', 'centy', 'centów')).toBe('centy');
    }
  });

  it('uses the "many" form for the teens despite their ending', () => {
    // 12, 13, 14 wyglądają jak 2, 3, 4, ale idą jak "wiele".
    for (const n of [12, 13, 14, 112]) {
      expect(pluralPl(n, 'cent', 'centy', 'centów')).toBe('centów');
    }
  });

  it('uses the "many" form for zero and for five and up', () => {
    for (const n of [0, 5, 9, 11, 25, 100]) {
      expect(pluralPl(n, 'cent', 'centy', 'centów')).toBe('centów');
    }
  });
});

describe('pluralEn', () => {
  it('splits at one', () => {
    expect(pluralEn(1, 'cent', 'cents')).toBe('cent');
    expect(pluralEn(-1, 'cent', 'cents')).toBe('cent');
    expect(pluralEn(0, 'cent', 'cents')).toBe('cents');
    expect(pluralEn(2, 'cent', 'cents')).toBe('cents');
  });
});

describe('signedCents', () => {
  it('always shows the direction, except at zero', () => {
    expect(signedCents(0)).toBe('0');
    expect(signedCents(0.4)).toBe('0');
    expect(signedCents(18.2)).toBe('+18');
    expect(signedCents(-7.6)).toBe('-8');
  });
});

describe('cents in context', () => {
  it('declines the Polish noun by the number', () => {
    expect(STRINGS.pl.tuner.cents(1)).toBe('+1 cent');
    expect(STRINGS.pl.tuner.cents(2)).toBe('+2 centy');
    expect(STRINGS.pl.tuner.cents(5)).toBe('+5 centów');
    expect(STRINGS.pl.tuner.cents(-12)).toBe('-12 centów');
    expect(STRINGS.pl.tuner.cents(22)).toBe('+22 centy');
  });

  it('matches English plurals', () => {
    expect(STRINGS.en.tuner.cents(1)).toBe('+1 cent');
    expect(STRINGS.en.tuner.cents(-18)).toBe('-18 cents');
  });

  it('keeps the genitive after "w granicy" for every tolerance', () => {
    expect(STRINGS.pl.intonation.openHint(1)).toContain('1 centa');
    expect(STRINGS.pl.intonation.openHint(3)).toContain('3 centów');
    expect(STRINGS.pl.intonation.openHint(5)).toContain('5 centów');
  });
});

describe('dictionary coverage', () => {
  it('names every tuning in every language', () => {
    for (const language of LANGUAGES) {
      for (const tuning of TUNINGS) {
        expect(STRINGS[language].tunings[tuning.id]).toBeTruthy();
      }
    }
  });

  it('names and explains every bridge in every language', () => {
    for (const language of LANGUAGES) {
      for (const bridge of BRIDGE_TYPES) {
        expect(STRINGS[language].bridges[bridge.id].name).toBeTruthy();
        expect(STRINGS[language].bridges[bridge.id].hint).toBeTruthy();
      }
    }
  });

  it('labels every language with its own name', () => {
    for (const language of LANGUAGES) {
      expect(LANGUAGE_NAMES[language]).toBeTruthy();
    }
  });
});

describe('isLanguage', () => {
  it('accepts supported codes and rejects everything else', () => {
    expect(isLanguage('pl')).toBe(true);
    expect(isLanguage('en')).toBe(true);
    expect(isLanguage('de')).toBe(false);
    expect(isLanguage(null)).toBe(false);
    expect(isLanguage(undefined)).toBe(false);
  });
});
