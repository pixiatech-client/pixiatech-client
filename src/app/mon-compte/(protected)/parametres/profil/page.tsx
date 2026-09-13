import { redirect } from 'next/navigation';

export default function LegacyProfilPage() {
  redirect('/mon-compte?tab=settings');
}