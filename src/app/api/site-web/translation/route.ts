import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import {
  CmsWriteConflictError,
  getCmsPage,
  saveCmsPageIfUnchanged,
} from '@/lib/site-web/pages-store';
import { getCmsFieldTranslation, CMS_SOURCE_LANG } from '@/lib/site-web/cms-i18n';
import { extractTranslatableFields, filterChangedFields } from '@/lib/site-web/translation/extract';
import { validateTranslationResponse } from '@/lib/site-web/translation/validate';
import {
  applyTranslations,
  computeSourceHash,
  withTranslationMeta,
} from '@/lib/site-web/translation/apply';
import { resolveTranslationProvider } from '@/lib/site-web/translation/providers';
import { TranslationError } from '@/lib/site-web/translation/types';

export const dynamic = 'force-dynamic';

/**
 * Traduit le contenu FR d'une page CMS vers une langue cible.
 *
 * Ordre des operations, volontairement strict :
 *   1. authentification admin ;
 *   2. relecture de la page et extraction des champs FR traduisibles ;
 *   3. appel du provider ;
 *   4. VALIDATION stricte de la reponse ;
 *   5. seulement ensuite, ecriture.
 *
 * Si l'etape 4 echoue, la reponse est rejetee en bloc : il ne peut pas y avoir
 * de sauvegarde partielle. Le francais n'est jamais ecrit — voir `apply.ts`.
 */
export async function POST(request: NextRequest) {
  // 1. Meme authentification que le reste du CMS, aucun second systeme.
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: {
    pageId?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    /** `changed` : ne retraduire que les champs dont le FR a bouge. */
    mode?: 'all' | 'changed';
    /** Ecraser aussi les traductions manuelles. */
    force?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Corps de requête invalide.' }, { status: 400 });
  }

  const pageId = typeof body.pageId === 'string' ? body.pageId.trim() : '';
  if (!pageId) {
    return NextResponse.json(
      { success: false, error: 'Identifiant de page manquant.' },
      { status: 400 }
    );
  }

  const sourceLanguage = body.sourceLanguage || CMS_SOURCE_LANG;
  const targetLanguage = body.targetLanguage || 'en';
  if (sourceLanguage === targetLanguage) {
    return NextResponse.json(
      { success: false, error: 'La langue cible doit être différente de la langue source.' },
      { status: 400 }
    );
  }

  // 2. Lecture + extraction.
  const page = await getCmsPage(pageId);
  if (!page) {
    return NextResponse.json(
      { success: false, error: `Page introuvable : ${pageId}` },
      { status: 404 }
    );
  }
  const expectedUpdatedAt = page.updatedAt;

  const allFields = extractTranslatableFields(page);
  if (allFields.length === 0) {
    return NextResponse.json(
      { success: false, error: 'La page ne contient aucun texte traduisible.' },
      { status: 400 }
    );
  }

  // Mode « changesOnly » : on ne renvoie au modele que les champs dont la
  // source FR a change depuis la derniere traduction. La comparaison se fait
  // sur `sourceText`, conserve dans `_i18n` a chaque ecriture : aucun stockage
  // supplementaire n'est necessaire.
  const force = body.force === true;
  let fields = allFields;
  if (body.mode === 'changed' && !force) {
    const unchangedIds = new Set<string>();
    for (const field of allFields) {
      const stored = getCmsFieldTranslation(
        page.sections?.[field.sectionKey],
        field.path,
        targetLanguage
      );
      if (stored.value && stored.sourceText === field.source) {
        unchangedIds.add(field.id);
      }
    }
    fields = filterChangedFields(allFields, unchangedIds);

    if (fields.length === 0) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Aucun texte français n’a changé depuis la dernière traduction.',
        extracted: allFields.length,
        applied: 0,
      });
    }
  }

  // 3. Appel du provider, a travers l'interface uniquement.
  try {
    const provider = resolveTranslationProvider();
    const result = await provider.translate({ items: fields, sourceLang: sourceLanguage, targetLang: targetLanguage });

    // 4. Validation stricte. Leve → rien n'est ecrit.
    const translations = validateTranslationResponse(fields, {
      translations: result.translations,
    });

    const merged = applyTranslations(page, fields, translations, {
      targetLang: targetLanguage,
      force,
    });

    const meta = {
      sourceLanguage,
      targetLanguage,
      translatedAt: new Date().toISOString(),
      provider: provider.id,
      model: result.model,
      sourceHash: computeSourceHash(allFields),
      translatedFields: merged.applied,
    };

    // 5. Ecriture, sous controle de concurrence : si la page a ete modifiee
    // pendant l'appel au modele, on refuse d'ecraser le travail de l'admin.
    await saveCmsPageIfUnchanged(pageId, withTranslationMeta(merged.page, meta), expectedUpdatedAt);

    return NextResponse.json({
      success: true,
      applied: merged.applied,
      extracted: fields.length,
      skippedManual: merged.skippedManual,
      skippedMissingSource: merged.skippedMissingSource,
      skippedUnchanged: merged.skippedUnchanged,
      provider: provider.id,
      model: result.model,
    });
  } catch (err) {
    if (err instanceof CmsWriteConflictError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 409 });
    }
    if (err instanceof TranslationError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 502 });
    }
    console.error('[site-web translation] Erreur:', err);
    return NextResponse.json(
      { success: false, error: 'Erreur de connexion au service de traduction.' },
      { status: 502 }
    );
  }
}
