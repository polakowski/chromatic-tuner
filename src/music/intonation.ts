/**
 * Ustawianie menzury struna po strunie.
 *
 * Procedura: stroimy pustą strunę, potem gramy ten sam dźwięk na 12. progu.
 * Dwunasty próg dzieli drgającą część struny na pół, więc jeśli siodełko stoi
 * w dobrym miejscu, oba dźwięki są tą samą nutą w odstępie oktawy. Jeśli nie —
 * rozjazd mówi, w którą stronę przesunąć siodełko.
 */

/** Półtonów do 12. progu — oktawa, czyli połowa drgającej długości struny. */
export const OCTAVE_SEMITONES = 12;

/**
 * Rozjazd (w centach), który jeszcze uznajemy za dobrze ustawioną menzurę.
 * Mniej niż to i tak zniknie pod wpływem siły nacisku palca na próg.
 */
export const INTONATION_TOLERANCE_CENTS = 3;

/**
 * Z której strony siodełka siedzi łeb śruby menzury.
 *
 * To jedyna rzecz, która odwraca kierunek kręcenia. Śruba jest wkręcona
 * w siodełko, a jej łeb opiera się o mostek, więc obrót w prawo nie wsuwa
 * śruby głębiej — zamiast tego wciąga siodełko w stronę łba. W mostkach
 * fenderowych łeb jest z tyłu, w Tune-o-matic bywa z obu stron (ABR-1
 * zwykle od gryfu, Nashville od strunociągu), dlatego pytamy o to wprost,
 * a nie o markę.
 */
export type ScrewHeadSide = 'tail' | 'neck';

/** Union, nie `string` — brak tłumaczenia nazwy mostka ma nie przejść kompilacji. */
export type BridgeId = 'fender' | 'tom-neck' | 'tom-tail';

export interface BridgeType {
  id: BridgeId;
  screwHeadSide: ScrewHeadSide;
}

export const BRIDGE_TYPES: BridgeType[] = [
  { id: 'fender', screwHeadSide: 'tail' },
  { id: 'tom-neck', screwHeadSide: 'neck' },
  { id: 'tom-tail', screwHeadSide: 'tail' },
];

export const DEFAULT_BRIDGE_ID: BridgeId = 'fender';

/** Returns the bridge with this id, falling back to the default one. */
export function findBridgeType(id: string): BridgeType {
  return BRIDGE_TYPES.find((bridge) => bridge.id === id) ?? BRIDGE_TYPES[0];
}

/** Which way the saddle has to travel. */
export type SaddleMove = 'away-from-neck' | 'toward-neck' | 'none';

/** Which way to turn the intonation screw. */
export type ScrewTurn = 'clockwise' | 'counter-clockwise' | 'none';

export interface IntonationVerdict {
  /** How much higher the 12th fret sits than the open string, in cents. */
  errorCents: number;
  move: SaddleMove;
  turn: ScrewTurn;
  /** True when the error is within {@link INTONATION_TOLERANCE_CENTS}. */
  ok: boolean;
}

/**
 * Rozjazd menzury: o ile 12. próg wypada wyżej niż pusta struna.
 *
 * Odejmujemy odczyt pustej struny, zamiast mierzyć odchyłkę od nominalnej nuty,
 * bo resztkowe rozstrojenie znosi się po obu stronach. Liczy się sam stosunek
 * długości, a nie to, czy instrument stoi dokładnie na zadanym A.
 */
export function intonationError(openCents: number, frettedCents: number): number {
  return frettedCents - openCents;
}

/**
 * Za wysoki 12. próg znaczy, że struna jest za krótka — drgającą część trzeba
 * wydłużyć, czyli odsunąć siodełko od gryfu. Za niski odwrotnie.
 */
export function saddleMove(errorCents: number): SaddleMove {
  if (Math.abs(errorCents) <= INTONATION_TOLERANCE_CENTS) {
    return 'none';
  }
  return errorCents > 0 ? 'away-from-neck' : 'toward-neck';
}

/** Turn direction that produces the wanted saddle travel on this bridge. */
export function screwTurn(move: SaddleMove, bridge: BridgeType): ScrewTurn {
  if (move === 'none') {
    return 'none';
  }
  // Obrót w prawo wciąga siodełko w stronę łba śruby.
  const clockwiseMovesAwayFromNeck = bridge.screwHeadSide === 'tail';
  const wantsAwayFromNeck = move === 'away-from-neck';
  return wantsAwayFromNeck === clockwiseMovesAwayFromNeck ? 'clockwise' : 'counter-clockwise';
}

/** Full verdict for one string, from the two captured readings. */
export function evaluateIntonation(
  openCents: number,
  frettedCents: number,
  bridge: BridgeType
): IntonationVerdict {
  const errorCents = intonationError(openCents, frettedCents);
  const move = saddleMove(errorCents);
  return {
    errorCents,
    move,
    turn: screwTurn(move, bridge),
    ok: move === 'none',
  };
}
