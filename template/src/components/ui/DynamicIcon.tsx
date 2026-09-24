import React from 'react';
import * as Icons from 'lucide-react';

interface DynamicIconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  className?: string;
  size?: number | string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = 'w-5 h-5', size = 20, ...props }) => {
  // Try to find the icon in lucide-react exports
  const IconComponent = (Icons as Record<string, any>)[name] || Icons.Sparkles;
  
  return <IconComponent className={className} size={size} {...props} />;
};

export const POPULAR_ICONS: { name: string; category: string }[] = [
  // Display & Optics
  { name: 'Eye', category: 'Optique' },
  { name: 'Sun', category: 'Optique' },
  { name: 'Sparkles', category: 'Optique' },
  { name: 'Layers', category: 'Optique' },
  { name: 'Monitor', category: 'Optique' },
  { name: 'Maximize2', category: 'Optique' },
  { name: 'Tv', category: 'Optique' },
  { name: 'Lightbulb', category: 'Optique' },
  
  // Structure & Hardware
  { name: 'Feather', category: 'Structure' },
  { name: 'Box', category: 'Structure' },
  { name: 'Cable', category: 'Structure' },
  { name: 'Wrench', category: 'Structure' },
  { name: 'Sliders', category: 'Structure' },
  { name: 'Component', category: 'Structure' },
  { name: 'Cpu', category: 'Structure' },
  { name: 'Server', category: 'Structure' },
  
  // Power & Reliability
  { name: 'Zap', category: 'Performance' },
  { name: 'Battery', category: 'Performance' },
  { name: 'BatteryCharging', category: 'Performance' },
  { name: 'ShieldCheck', category: 'Fiabilité' },
  { name: 'Shield', category: 'Fiabilité' },
  { name: 'Activity', category: 'Performance' },
  { name: 'Gauge', category: 'Performance' },
  { name: 'Award', category: 'Fiabilité' },
  { name: 'CheckCircle2', category: 'Fiabilité' },
  { name: 'Flame', category: 'Fiabilité' },
  { name: 'Power', category: 'Performance' },
  
  // Sectors & Retail
  { name: 'Store', category: 'Secteurs' },
  { name: 'Building2', category: 'Secteurs' },
  { name: 'Car', category: 'Secteurs' },
  { name: 'ShoppingBag', category: 'Secteurs' },
  { name: 'Building', category: 'Secteurs' },
  { name: 'Briefcase', category: 'Secteurs' },
  { name: 'PartyPopper', category: 'Secteurs' },
  { name: 'Hotel', category: 'Secteurs' },

  // Connectivity & Communication
  { name: 'Wifi', category: 'Connectivité' },
  { name: 'Globe', category: 'Connectivité' },
  { name: 'Radio', category: 'Connectivité' },
  { name: 'Smartphone', category: 'Connectivité' },
  { name: 'Cloud', category: 'Connectivité' },
  { name: 'Send', category: 'Connectivité' },
  { name: 'Phone', category: 'Contact' },
  { name: 'Mail', category: 'Contact' },
  { name: 'MapPin', category: 'Contact' },
  { name: 'Clock', category: 'Contact' }
];
