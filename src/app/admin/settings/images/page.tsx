
import { getSettings } from '@/app/admin/actions';
import { SettingsForm } from '../settings-form';

export default async function ImagesSettingsPage() {
  const settings = await getSettings();
  return <SettingsForm initialSettings={settings} section="images" />;
}
