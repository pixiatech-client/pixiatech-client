
import { getSettings } from '@/app/admin/actions';
import { SettingsForm } from '../settings-form';

export default async function GeneralSettingsPage() {
  const settings = await getSettings();
  return <SettingsForm initialSettings={settings} section="general" />;
}
