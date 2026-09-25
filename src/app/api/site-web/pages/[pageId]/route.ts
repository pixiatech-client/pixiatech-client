import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { getCmsPage, saveCmsPage, deleteCmsPage } from '@/lib/site-web/pages-store';
import type { CmsPageData } from '@/lib/site-web/cms-types';

// Désactive le cache Next.js : cette route lit un fichier JSON sur disque
// qui peut changer à tout moment (modifications via l'éditeur).
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ pageId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { pageId } = await context.params;
    const page = getCmsPage(pageId);
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
    const db = saveCmsPage(pageId, {
      id: pageId,
      name: body.name ?? pageId,
      slug: body.slug ?? `/${pageId}`,
      updatedAt: body.updatedAt ?? new Date().toISOString(),
      sections: body.sections || {},
      meta: body.meta,
    });
    const page = db.pages?.[pageId];
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
    deleteCmsPage(pageId);
    return NextResponse.json({ success: true, message: `Page '${pageId}' supprimée du CMS.` });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}