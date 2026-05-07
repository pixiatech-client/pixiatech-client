
'use client';

import { SettingsForm } from '../settings-form';

// This component is now client-side to receive props, but data fetching is not done here.
export default function HintBubbleSettingsPage({ initialSettings }: any) {
  return <SettingsForm initialSettings={initialSettings} section="hint-bubble" />;
}
