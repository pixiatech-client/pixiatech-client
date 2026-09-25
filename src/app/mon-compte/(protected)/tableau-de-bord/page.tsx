import { redirect } from 'next/navigation';

export default function LegacyTableauDeBordPage() {
  redirect('/mon-compte?tab=dashboard');
}
