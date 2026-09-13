import { redirect } from 'next/navigation';

export default function LegacyInfosFiscalesPage() {
  redirect('/mon-compte?tab=settings');
}