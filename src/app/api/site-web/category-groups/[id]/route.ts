import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import {
  getGroupById,
  updateGroup,
  deleteGroup,
  countCategoriesInGroup,
  countProductsUsingGroup,
} from '@/lib/products/categories-store';

const GROUP_ID_PATTERN = /^grp_[a-z0-9]+$/;

function groupIdError(id: string): NextResponse | null {
  if (!GROUP_ID_PATTERN.test(id)) {
    return NextResponse.json(
      { success: false, message: "Identifiant de groupe invalide (format 'grp_…')." },
      { status: 400 }
    );
  }
  return null;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const request = _request;
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const idErr = groupIdError(id);
  if (idErr) return idErr;
  try {
    const group = await getGroupById(id);
    if (!group) {
      return NextResponse.json({ success: false, message: 'Groupe introuvable.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, group });
  } catch (err: unknown) {
    console.error(`GET /api/site-web/category-groups/${id}`, err);
    return NextResponse.json({ success: false, message: 'Impossible de charger le groupe.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const idErr = groupIdError(id);
  if (idErr) return idErr;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    if (typeof body.label === 'string') {
      const label = body.label.trim();
      if (!label) {
        return NextResponse.json({ success: false, message: 'Le libellé du groupe ne peut pas être vide.' }, { status: 400 });
      }
      patch.label = label;
    }
    if (typeof body.labelFr === 'string') patch.labelFr = body.labelFr.trim() || null;
    if (typeof body.labelEn === 'string') patch.labelEn = body.labelEn.trim() || null;
    if (typeof body.active === 'boolean') patch.active = body.active;
    if (typeof body.order === 'number') patch.order = body.order;

    const group = await updateGroup(id, patch as never);
    if (!group) {
      return NextResponse.json({ success: false, message: 'Groupe introuvable.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: `Groupe « ${group.label} » mis à jour.`, group });
  } catch (err: unknown) {
    console.error(`PUT /api/site-web/category-groups/${id}`, err);
    return NextResponse.json({ success: false, message: 'Échec de la mise à jour du groupe.' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const request = _request;
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const idErr = groupIdError(id);
  if (idErr) return idErr;
  try {
    const group = await getGroupById(id);
    if (!group) {
      return NextResponse.json({ success: false, message: 'Groupe introuvable.' }, { status: 404 });
    }
    const categoryCount = await countCategoriesInGroup(group.key);
    const usage = await countProductsUsingGroup(group.key);
    // Un groupe qui possède encore des catégories ne peut pas être supprimé :
    // il faut d'abord les déplacer ou les supprimer.
    if (categoryCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Le groupe « ${group.label} » contient encore ${categoryCount} option(s). Déplacez-les vers un autre groupe ou supprimez-les avant de supprimer ce groupe.`,
          categoryCount,
          usage,
        },
        { status: 409 }
      );
    }
    if (usage > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Des produits sont associés à des catégories de ce groupe. Désactivez plutôt le groupe (recommandé) ou déplacez ses options.`,
          categoryCount,
          usage,
        },
        { status: 409 }
      );
    }
    await deleteGroup(id);
    return NextResponse.json({ success: true, message: `Groupe « ${group.label} » supprimé.` });
  } catch (err: unknown) {
    console.error(`DELETE /api/site-web/category-groups/${id}`, err);
    return NextResponse.json({ success: false, message: 'Échec de la suppression du groupe.' }, { status: 500 });
  }
}