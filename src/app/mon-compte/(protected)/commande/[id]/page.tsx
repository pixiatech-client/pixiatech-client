import { redirect } from 'next/navigation';

export default async function LegacyCommandeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect('/mon-compte?tab=orders');
}