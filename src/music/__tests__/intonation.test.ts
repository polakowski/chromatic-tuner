import {
  BRIDGE_TYPES,
  DEFAULT_BRIDGE_ID,
  evaluateIntonation,
  findBridgeType,
  intonationError,
  INTONATION_TOLERANCE_CENTS,
  saddleMove,
  screwTurn,
} from '../intonation';

const fender = findBridgeType('fender');
const tomNeck = findBridgeType('tom-neck');
const tomTail = findBridgeType('tom-tail');

describe('findBridgeType', () => {
  it('resolves every listed bridge by id', () => {
    for (const bridge of BRIDGE_TYPES) {
      expect(findBridgeType(bridge.id)).toBe(bridge);
    }
  });

  it('falls back to the default bridge for an unknown id', () => {
    expect(findBridgeType('no-such-bridge').id).toBe(DEFAULT_BRIDGE_ID);
  });
});

describe('intonationError', () => {
  it('measures the fretted note against the open string', () => {
    expect(intonationError(0, 12)).toBe(12);
    expect(intonationError(0, -9)).toBe(-9);
  });

  it('cancels a residually detuned open string', () => {
    // Oba odczyty przesunięte o tyle samo = menzura w porządku.
    expect(intonationError(8, 8)).toBe(0);
    expect(intonationError(-4, 6)).toBe(10);
  });
});

describe('saddleMove', () => {
  it('lengthens the string when the 12th fret is sharp', () => {
    expect(saddleMove(15)).toBe('away-from-neck');
  });

  it('shortens the string when the 12th fret is flat', () => {
    expect(saddleMove(-15)).toBe('toward-neck');
  });

  it('asks for nothing inside the tolerance', () => {
    expect(saddleMove(0)).toBe('none');
    expect(saddleMove(INTONATION_TOLERANCE_CENTS)).toBe('none');
    expect(saddleMove(-INTONATION_TOLERANCE_CENTS)).toBe('none');
  });

  it('acts just past the tolerance', () => {
    expect(saddleMove(INTONATION_TOLERANCE_CENTS + 0.5)).toBe('away-from-neck');
    expect(saddleMove(-INTONATION_TOLERANCE_CENTS - 0.5)).toBe('toward-neck');
  });
});

describe('screwTurn', () => {
  it('turns clockwise to move the saddle toward a screw head at the tail', () => {
    expect(screwTurn('away-from-neck', fender)).toBe('clockwise');
    expect(screwTurn('toward-neck', fender)).toBe('counter-clockwise');
  });

  it('reverses when the screw head faces the neck', () => {
    expect(screwTurn('away-from-neck', tomNeck)).toBe('counter-clockwise');
    expect(screwTurn('toward-neck', tomNeck)).toBe('clockwise');
  });

  it('treats a tailpiece-side Tune-o-matic like a Fender bridge', () => {
    expect(screwTurn('away-from-neck', tomTail)).toBe(screwTurn('away-from-neck', fender));
    expect(screwTurn('toward-neck', tomTail)).toBe(screwTurn('toward-neck', fender));
  });

  it('asks for no turn when the saddle stays put', () => {
    expect(screwTurn('none', fender)).toBe('none');
    expect(screwTurn('none', tomNeck)).toBe('none');
  });
});

describe('evaluateIntonation', () => {
  it('reports a sharp 12th fret as a lengthening, clockwise fix on a Fender', () => {
    expect(evaluateIntonation(0, 14, fender)).toEqual({
      errorCents: 14,
      move: 'away-from-neck',
      turn: 'clockwise',
      ok: false,
    });
  });

  it('flips only the turn direction on a neck-side Tune-o-matic', () => {
    const fenderVerdict = evaluateIntonation(0, 14, fender);
    const tomVerdict = evaluateIntonation(0, 14, tomNeck);
    expect(tomVerdict.move).toBe(fenderVerdict.move);
    expect(tomVerdict.errorCents).toBe(fenderVerdict.errorCents);
    expect(tomVerdict.turn).toBe('counter-clockwise');
  });

  it('passes a string whose two readings agree', () => {
    const result = evaluateIntonation(2, 3, fender);
    expect(result.ok).toBe(true);
    expect(result.turn).toBe('none');
  });
});
