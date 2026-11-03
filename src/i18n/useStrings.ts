import { useSettings } from '../state/settings';
import { STRINGS, type Strings } from './strings';

/** Teksty w aktualnie wybranym języku. */
export function useStrings(): Strings {
  const language = useSettings((state) => state.language);
  return STRINGS[language];
}
