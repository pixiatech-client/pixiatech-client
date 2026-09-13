import { redirect } from 'next/navigation';

export default function LegacyCommandesPage() {
  redirect('/mon-compte?tab=orders');
}