import ro from './ro.json';
import hu from './hu.json';

export type Lang = 'ro' | 'hu';
export const LANGS: readonly Lang[] = ['ro', 'hu'] as const;

/** Forma dictionarului o da romana; maghiara are aceleasi chei (verificat la build). */
export type Dict = typeof ro;

const DICTS: Record<Lang, Dict> = { ro, hu: hu as unknown as Dict };

export function t(lang: Lang): Dict {
  return DICTS[lang];
}

/** URL-ul unei pagini in limba data. Romana e implicita si nu are prefix. */
export function localePath(lang: Lang, path = ''): string {
  const clean = path.replace(/^\/+/, '');
  return lang === 'ro' ? `/${clean}` : `/hu/${clean}`;
}

/** Inlocuieste {cheie} din sirurile de traducere. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => String(vars[k] ?? m));
}
