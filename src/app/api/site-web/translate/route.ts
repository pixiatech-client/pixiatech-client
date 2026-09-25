import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';

export const dynamic = 'force-dynamic';

async function translateSingle(text: string, from: string, to: string): Promise<string> {
  if (!text || text.trim() === '') return '';
  if (from === to) return text;

  // 1. Essai avec Google Translate API gratuite
  try {
    const sl = from === 'zh' ? 'zh-CN' : from;
    const tl = to === 'zh' ? 'zh-CN' : to;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      sl
    )}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.[0])) {
        const translated = data[0].map((chunk: any) => chunk[0]).join('');
        if (translated) return translated;
      }
    }
  } catch (err) {
    console.warn('[Translate] Google GTX failed, trying MyMemory fallback:', err);
  }

  // 2. Fallback MyMemory
  try {
    const pair = `${from}|${to}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(
      pair
    )}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (err) {
    console.error('[Translate] All translation fallbacks failed:', err);
  }

  return text;
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { text, from = 'fr', to, targets, fields } = body;

    // Mode 1 : Dictionnaire de champs { fields: { title: '...', desc: '...' }, targets: ['en', 'ar'] }
    if (fields && typeof fields === 'object' && Array.isArray(targets)) {
      const result: Record<string, Record<string, string>> = {};
      for (const [fieldKey, val] of Object.entries(fields)) {
        if (typeof val === 'string' && val.trim().length > 0) {
          result[fieldKey] = {};
          for (const targetLang of targets) {
            result[fieldKey][targetLang] = await translateSingle(val, from, targetLang);
          }
        }
      }
      return NextResponse.json({ success: true, translations: result });
    }

    // Mode 2 : Un texte vers plusieurs cibles { text: '...', targets: ['en', 'ar', 'es'] }
    if (text && typeof text === 'string' && Array.isArray(targets)) {
      const translations: Record<string, string> = {};
      for (const targetLang of targets) {
        translations[targetLang] = await translateSingle(text, from, targetLang);
      }
      return NextResponse.json({ success: true, translations });
    }

    // Mode 3 : Un texte vers une seule cible { text: '...', to: 'en' }
    if (text && typeof text === 'string' && to) {
      const translated = await translateSingle(text, from, to);
      return NextResponse.json({ success: true, translation: translated, from, to });
    }

    return NextResponse.json(
      { success: false, error: 'Paramètres manquants: fournir { text, to } ou { text, targets } ou { fields, targets }' },
      { status: 400 }
    );
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
