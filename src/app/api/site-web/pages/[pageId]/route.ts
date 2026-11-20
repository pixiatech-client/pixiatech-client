import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { getCmsPage, saveCmsPage, deleteCmsPage } from '@/lib/site-web/pages-store';
import type { CmsPageData } from '@/lib/site-web/cms-types';

// Désactive le cache Next.js : cette route lit des données Firestore
// qui peuvent changer à tout moment (modifications via l'éditeur).
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ pageId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { pageId } = await context.params;
    const page = await getCmsPage(pageId);
    if (!page) {
      return NextResponse.json(
        { success: false, message: `Page '${pageId}' introuvable dans le CMS.` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, page },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { pageId } = await context.params;
    const body = (await request.json()) as Partial<CmsPageData>;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Corps de requête invalide.' }, { status: 400 });
    }
    const existing = await getCmsPage(pageId);
    const pageToSave: CmsPageData = {
      id: pageId,
      name: body.name ?? existing?.name ?? pageId,
      slug: body.slug ?? existing?.slug ?? `/${pageId}`,
      updatedAt: body.updatedAt ?? new Date().toISOString(),
      sections: body.sections ?? existing?.sections ?? {},
    };
    const meta = body.meta ?? existing?.meta;
    if (meta) pageToSave.meta = meta;
    const sectionOrder = body.sectionOrder ?? existing?.sectionOrder;
    if (sectionOrder) pageToSave.sectionOrder = sectionOrder;

    const db = await saveCmsPage(pageId, pageToSave);
    const page = db.pages?.[pageId];

    // Synchronisation bidirectionnelle avec le magasin d'articles (siteWebArticles Firestore & JSON)
    if (pageId.startsWith('article__')) {
      const articleSlug = pageId.replace('article__', '');
      try {
        const { saveArticle } = await import('@/lib/site-web/articles-store');
        const headerSec = (pageToSave.sections?.article_header as Record<string, unknown>) || {};
        const coverSec = (pageToSave.sections?.article_cover as Record<string, unknown>) || {};
        const bodySec = (pageToSave.sections?.article_body as Record<string, unknown>) || {};

        const patch: Record<string, unknown> = {};
        if (typeof headerSec.title === 'string' && headerSec.title) {
          patch.title = headerSec.title;
          patch.titleFr = headerSec.title;
        }
        if (typeof headerSec.desc === 'string' && headerSec.desc) {
          patch.desc = headerSec.desc;
          patch.descFr = headerSec.desc;
        }
        if (typeof headerSec.category === 'string' && headerSec.category) {
          patch.category = headerSec.category;
        }
        if (typeof coverSec.cover_image === 'string' && coverSec.cover_image) {
          patch.img = coverSec.cover_image;
        }
        if (typeof bodySec.product_name === 'string' && bodySec.product_name) {
          patch.relatedProductName = bodySec.product_name;
        }
        if (Object.keys(patch).length > 0) {
          await saveArticle(articleSlug, patch);
        }
      } catch (syncErr) {
        console.warn(`[pageId route] sync to article-store error for ${articleSlug}:`, syncErr);
      }
    } else if (pageId === 'insights') {
      try {
        const { getArticles, saveArticle } = await import('@/lib/site-web/articles-store');
        const featSec = (pageToSave.sections?.insights_featured as Record<string, unknown>) || {};
        const gridSec = (pageToSave.sections?.insights_grid as Record<string, unknown>) || {};
        const allArticles = await getArticles();
        const featArticle = allArticles.find((a) => a.featured) || allArticles[0];

        if (featArticle && featSec) {
          const patch: Record<string, unknown> = {};
          if (typeof featSec.featured_title === 'string' && featSec.featured_title) {
            patch.title = featSec.featured_title;
            patch.titleFr = featSec.featured_title;
          }
          if (typeof featSec.featured_desc === 'string' && featSec.featured_desc) {
            patch.desc = featSec.featured_desc;
            patch.descFr = featSec.featured_desc;
          }
          if (typeof featSec.featured_image === 'string' && featSec.featured_image) {
            patch.img = featSec.featured_image;
          }
          if (Object.keys(patch).length > 0) {
            await saveArticle(featArticle.slug, patch);
          }
        }

        for (const a of allArticles) {
          const cardTitle = gridSec[`card_${a.slug}_title`];
          const cardImg = gridSec[`card_${a.slug}_image`];
          if (cardTitle || cardImg) {
            const cardPatch: Record<string, unknown> = {};
            if (typeof cardTitle === 'string' && cardTitle) {
              cardPatch.title = cardTitle;
              cardPatch.titleFr = cardTitle;
            }
            if (typeof cardImg === 'string' && cardImg) {
              cardPatch.img = cardImg;
            }
            await saveArticle(a.slug, cardPatch);
          }
        }
      } catch (syncErr) {
        console.warn('[pageId route] sync insights to article-store error:', syncErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Page '${pageId}' synchronisée avec succès dans le CMS Site Web.`,
      page,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { pageId } = await context.params;
    await deleteCmsPage(pageId);
    return NextResponse.json({ success: true, message: `Page '${pageId}' supprimée du CMS.` });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}