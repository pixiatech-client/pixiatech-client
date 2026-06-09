import { getSettings } from '@/app/admin/actions';
import { FlowSettingsForm } from './flow-settings-form';

export default async function FlowSettingsPage() {
  const settings = await getSettings();
  return <FlowSettingsForm initialSettings={settings} />;
}
