import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { getArticles, saveArticle } from '@/lib/site-web/articles-store';
import type { InsightArticle } from '@/web/data/insights-articles-content';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const articles = await getArticles();
    return NextResponse.json(
      { success: true, articles },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as Partial<InsightArticle>;
    if (!body || !body.slug) {
      return NextResponse.json(
        { success: false, message: 'Le slug de l\'article est requis.' },
        { status: 400 }
      );
    }

    const saved = await saveArticle(body.slug, body);
    return NextResponse.json({
      success: true,
      message: `Article '${body.slug}' enregistré avec succès.`,
      article: saved,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
