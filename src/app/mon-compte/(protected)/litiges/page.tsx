import { redirect } from 'next/navigation';

export default function LegacyLitigesPage() {
  redirect('/mon-compte?tab=disputes');
}