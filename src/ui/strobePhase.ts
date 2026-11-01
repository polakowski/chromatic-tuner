/**
 * Matematyka tarczy strobo, wydzielona z komponentu, żeby dała się przetestować.
 *
 * Prawdziwy stroboskop obraca tarczę z częstotliwością odniesienia, a lampa
 * błyska z częstotliwością granego dźwięku — wzór stoi w miejscu dopiero przy
 * zerowej różnicy. Fizyczna różnica dudnień (np. ~13 Hz przy +50 centach dla A4)
 * jest za szybka dla oka, więc skalujemy ją do tempa, które da się śledzić.
 */

/** Ile pełnych okresów wzoru na sekundę przy skrajnej odchyłce ±50 centów. */
export const PERIODS_PER_SECOND_AT_FULL_SCALE = 4;
const FULL_SCALE_CENTS = 50;

/** Mnożniki prędkości kolejnych pasm — jak kolejne harmoniczne w tunerze strobo. */
export const BAND_MULTIPLIERS = [1, 2, 4] as const;

/**
 * Prędkość przewijania wzoru w okresach na sekundę.
 * Dodatnia = za wysoko, ujemna = za nisko, zero = czysto.
 */
export function phaseRate(cents: number): number {
  return (cents / FULL_SCALE_CENTS) * PERIODS_PER_SECOND_AT_FULL_SCALE;
}

/**
 * Przesuwa fazę o `deltaSeconds`, zawijając wynik do przedziału [0, 1).
 * Faza jest ułamkiem okresu wzoru, nie pikselami — przeliczenie na piksele
 * należy do komponentu, bo zależy od szerokości paska.
 */
export function advancePhase(phase: number, cents: number, deltaSeconds: number): number {
  const next = phase + phaseRate(cents) * deltaSeconds;
  return ((next % 1) + 1) % 1;
}
