import { redirect } from 'next/navigation';

export default async function LegacyLitigeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/mon-compte?tab=disputes&dispute=${encodeURIComponent(id)}`);
}