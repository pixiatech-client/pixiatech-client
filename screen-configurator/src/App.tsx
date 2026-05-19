/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import StepDimensions, { ConfigState } from './components/StepDimensions';
import { ChevronLeft, ChevronRight, Monitor, Settings, Grid, Layout as LayoutIcon } from 'lucide-react';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [state, setState] = useState<ConfigState>({
    width: 12,
    height: 6.5,
    isCurved: false,
    curveLeft: 0,
    curveRight: 0,
    envColor: '#f8fafc',
    gridColor: '#e2e8f0',
  });

  const updateState = (val: Partial<ConfigState>) => {
    setState((prev) => ({ ...prev, ...val }));
  };

  // Mock translation function
  const t = (key: string, params?: any) => {
    const translations: Record<string, string> = {
      'wizard.dimensions.title': 'Screen Dimensions',
      'wizard.dimensions.description': 'Adjust the width and height for your project.',
      'wizard.dimensions.width': 'Width (m)',
      'wizard.dimensions.height': 'Height (m)',
      'wizard.dimensions.aspectRatio': 'Current Aspect Ratio',
      'wizard.dimensions.calculated': 'Calculated',
      'wizard.dimensions.note': 'Dimensions are based on modules (tiles) of 50cm x 50cm.',
      'wizard.dimensions.tileConfig': 'Tiles Configuration',
      'wizard.dimensions.tileCount': `This configuration uses <b>${params?.count} tiles</b> (${params?.w} × ${params?.h})`,
    };
    return translations[key] || key;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-lime-accent/30 relative overflow-x-hidden">
      <main className="relative z-10 py-10 pb-20">
        <StepDimensions 
          state={state} 
          updateState={updateState} 
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          t={t} 
        />
      </main>
    </div>
  );
}

