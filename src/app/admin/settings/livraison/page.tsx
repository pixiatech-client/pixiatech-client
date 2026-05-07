'use server';

import { redirect } from 'next/navigation';

export default async function LivraisonSettingsPage() {
  redirect('/admin/delivery');
}