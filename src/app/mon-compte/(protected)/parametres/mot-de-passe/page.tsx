import { redirect } from 'next/navigation';

export default function LegacyMotDePassePage() {
  redirect('/mon-compte?tab=settings');
}