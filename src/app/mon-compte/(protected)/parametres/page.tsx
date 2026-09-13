import { redirect } from 'next/navigation';

export default function LegacyParametresPage() {
  redirect('/mon-compte?tab=settings');
}