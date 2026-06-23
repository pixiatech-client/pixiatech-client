import fr from './locales/fr.json';
import en from './locales/en.json';
import { cookies } from 'next/headers';

type Locale = 'fr' | 'en';
type Translations = typeof fr;

const translations: Record<Locale, Translations> = { fr, en };

export function createT(locale: Locale) {
  return (key: string): string => {
    const keys = key.split('.');
    let result: any = translations[locale];
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        let fallback: any = translations.en;
        for (const fk of keys) {
          fallback = fallback?.[fk];
          if (fallback === undefined) return key;
        }
        result = fallback;
        break;
      }
    }
    return typeof result === 'string' ? result : key;
  };
}

export async function getServerT() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('admin-locale')?.value || 'fr') as Locale;
  return createT(locale);
}
