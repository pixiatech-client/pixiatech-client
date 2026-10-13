import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { getArticle, saveArticle, deleteArticle } from '@/lib/site-web/articles-store';
import type { InsightArticle } from '@/web/data/insights-articles-content';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const article = await getArticle(slug);
    if (!article) {
      return NextResponse.json(
        { success: false, message: `Article '${slug}' introuvable.` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, article },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { slug } = await context.params;
    const body = (await request.json()) as Partial<InsightArticle>;
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Corps de requête invalide.' },
        { status: 400 }
      );
    }

    const saved = await saveArticle(slug, body);
    return NextResponse.json({
      success: true,
      message: `Article '${slug}' mis à jour avec succès.`,
      article: saved,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { slug } = await context.params;
    await deleteArticle(slug);
    return NextResponse.json({
      success: true,
      message: `Article '${slug}' supprimé avec succès.`,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
