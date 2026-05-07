'use client';

import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useEffect, useId, useState } from 'react';

// From Uiverse.io by Uncannypotato69
interface CustomSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}

export function CustomSwitch({ checked, onCheckedChange, id: propId }: CustomSwitchProps) {
  const generatedId = useId();
  const id = propId || generatedId;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Render a placeholder or null on the server to avoid hydration mismatch
    return <div className="h-[24px] w-[44px] bg-gray-200 rounded-full animate-pulse"></div>;
  }
  
  return (
    <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
  );
}
