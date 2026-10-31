import { describeNote, midiToFrequency } from '../notes';
import { frequencyToPitch, pitchToFrequency } from '../pitch';

describe('frequencyToPitch', () => {
  it('maps the reference pitch to A4 with no deviation', () => {
    const reading = frequencyToPitch(440, 440);
    expect(reading.midi).toBe(69);
    expect(reading.cents).toBeCloseTo(0, 6);
  });

  it('follows a shifted reference', () => {
    const reading = frequencyToPitch(432, 432);
    expect(reading.midi).toBe(69);
    expect(reading.cents).toBeCloseTo(0, 6);
  });

  it('reports 440 Hz as sharp when tuned to A=432', () => {
    const reading = frequencyToPitch(440, 432);
    expect(reading.midi).toBe(69);
    expect(reading.cents).toBeCloseTo(31.77, 2);
  });

  it('reports 440 Hz as flat when tuned to A=442', () => {
    const reading = frequencyToPitch(440, 442);
    expect(reading.cents).toBeLessThan(0);
    expect(reading.cents).toBeCloseTo(-7.85, 2);
  });

  it('keeps the deviation within half a semitone', () => {
    for (let hz = 30; hz < 2000; hz *= 1.01) {
      const { cents } = frequencyToPitch(hz, 440);
      expect(Math.abs(cents)).toBeLessThanOrEqual(50.0001);
    }
  });

  it('round-trips through pitchToFrequency', () => {
    const { exactMidi } = frequencyToPitch(329.63, 443.5);
    expect(pitchToFrequency(exactMidi, 443.5)).toBeCloseTo(329.63, 6);
  });
});

describe('describeNote', () => {
  it('names naturals and accidentals', () => {
    expect(describeNote(69).name).toBe('A');
    expect(describeNote(69).octave).toBe(4);
    expect(describeNote(61, 'sharp').name).toBe('C#');
    expect(describeNote(61, 'flat').name).toBe('Db');
    expect(describeNote(61).octave).toBe(4);
  });

  it('splits the letter from the accidental', () => {
    const note = describeNote(66, 'flat');
    expect(note.letter).toBe('G');
    expect(note.accidental).toBe('b');
  });

  it('covers the low and high ends of the tuner range', () => {
    expect(describeNote(23).name).toBe('B');
    expect(describeNote(23).octave).toBe(0);
    expect(describeNote(28).name).toBe('E');
    expect(describeNote(28).octave).toBe(1);
  });
});

describe('midiToFrequency', () => {
  it('is the inverse of frequencyToPitch for exact notes', () => {
    for (const midi of [23, 28, 40, 69, 88]) {
      const hz = midiToFrequency(midi, 440);
      expect(frequencyToPitch(hz, 440).midi).toBe(midi);
      expect(frequencyToPitch(hz, 440).cents).toBeCloseTo(0, 6);
    }
  });

  it('scales with the reference pitch', () => {
    expect(midiToFrequency(69, 442)).toBeCloseTo(442, 6);
    expect(midiToFrequency(57, 442)).toBeCloseTo(221, 6);
  });
});
