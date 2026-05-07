import { getWizardSettings } from '@/app/admin/actions';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const settings = await getWizardSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch wizard settings:', error);
    return NextResponse.json({ error: 'Failed to fetch wizard settings' }, { status: 500 });
  }
}
