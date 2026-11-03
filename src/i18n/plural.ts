/**
 * Polska liczba mnoga — trzy formy zamiast angielskich dwóch.
 *
 * 1 cent, 2 centy, 5 centów, ale 12 centów (nastolatki idą jak „wiele")
 * i 22 centy (liczy się końcówka, nie cała liczba). Oczekuje liczby całkowitej.
 */
export function pluralPl(count: number, one: string, few: string, many: string): string {
  const abs = Math.abs(count);
  if (abs === 1) {
    return one;
  }
  const lastTwo = abs % 100;
  const last = abs % 10;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) {
    return few;
  }
  return many;
}

/** English two-form plural. */
export function pluralEn(count: number, one: string, other: string): string {
  return Math.abs(count) === 1 ? one : other;
}

/** Deviation with an explicit sign, e.g. "+18" or "-7". */
export function signedCents(cents: number): string {
  const rounded = Math.round(cents);
  if (rounded === 0) {
    return '0';
  }
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}
