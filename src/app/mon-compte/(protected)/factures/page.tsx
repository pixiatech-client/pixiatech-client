import { redirect } from 'next/navigation';

export default function LegacyFacturesPage() {
  redirect('/mon-compte?tab=invoices');
}