'use client';

import React from 'react';
import { Product } from '@/lib/types';
import { ConfigState } from '@/lib/configurator-wizard-types';
import { cn } from '@/lib/utils';
import { Check, X, Maximize, Zap, Shield, Sun, Eye, Ruler, Settings2, Activity, Cpu, Layers, Smartphone, Tv } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

interface ProductComparatorProps {
  products: Product[];
  configState: ConfigState;
  onSelect: (productId: string) => void;
  selectedProductId?: string;
  onClose?: () => void;
  locale?: string;
}

export function ProductComparator({ products, configState, onSelect, selectedProductId, onClose, locale = 'fr' }: ProductComparatorProps) {
  const area = configState.width * configState.height;

  const firestore = useFirestore();
  const charsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'characteristics'), orderBy('name')) : null, [firestore]);
  const { data: characteristics } = useCollection<any>(charsQuery, { suppressPermissionError: true });

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'écran':
        return Monitor;
      case 'distance':
        return Eye;
      case 'puissance':
        return Zap;
      case 'luminosité':
        return Sun;
      case 'pixel':
        return Grid3X3;
      case 'résolution':
        return Maximize;
      case 'paramètres':
        return Settings2;
      case 'activité':
        return Activity;
      case 'processeur':
        return Cpu;
      case 'couches':
        return Layers;
      case 'mobile':
        return Smartphone;
      case 'télévision':
        return Tv;
      default:
        return Settings2;
    }
  };

  const getPitchValue = (pitch: string | undefined) => parseFloat(String(pitch).replace('P', '')) || 0;

  const calculateResolution = (pitch: string | undefined) => {
    const p = getPitchValue(pitch);
    if (!p) return 'N/A';
    const resX = Math.round((configState.width * 1000) / p);
    const resY = Math.round((configState.height * 1000) / p);
    return `${resX} × ${resY}`;
  };

  const calculatePower = (pitch: string | undefined, type: 'max' | 'avg') => {
    const p = getPitchValue(pitch);
    // Mock power calculation based on pitch if actual data isn't available
    const baseMaxPowerPerSqm = p < 2 ? 800 : p < 4 ? 600 : 900;
    const baseAvgPowerPerSqm = baseMaxPowerPerSqm / 3;

    const power = type === 'max' ? baseMaxPowerPerSqm * area : baseAvgPowerPerSqm * area;
    return (power / 1000).toFixed(1) + ' kW';
  };

  const calculateBreaker = (pitch: string | undefined) => {
    const p = getPitchValue(pitch);
    const maxPowerKw = (p < 2 ? 800 : p < 4 ? 600 : 900) * area / 1000;
    // P = U * I * sqrt(3) -> I = P / (400 * sqrt(3)) roughly, or just P / 230 for single phase. 
    // Let's assume 3-phase 400V -> I = (MaxPower * 1000) / (400 * 1.732)
    const current = (maxPowerKw * 1000) / (400 * 1.732);
    // Find next standard breaker size: 16, 20, 32, 40, 63, 80, 100, 125
    const sizes = [16, 20, 32, 40, 63, 80, 100, 125, 160, 200, 250];
    const breaker = sizes.find(s => s > current) || sizes[sizes.length - 1];
    return `${breaker}A Tripolaire`;
  };

  const features = [
    {
      id: 'area',
      label: locale === 'fr' ? 'SURFACE TOTALE' : 'TOTAL AREA',
      icon: <Maximize className="w-4 h-4 text-blue-500" />,
      getValue: (p: Product) => `${area.toFixed(2)} m²`
    },
    {
      id: 'resolution',
      label: locale === 'fr' ? 'RÉSOLUTION (pixels)' : 'RESOLUTION (pixels)',
      icon: <Monitor className="w-4 h-4 text-purple-500" />,
      getValue: (p: Product) => calculateResolution(p.pitch)
    },
    {
      id: 'maxPower',
      label: locale === 'fr' ? 'PUISSANCE MAXIMALE (kW)' : 'MAXIMUM POWER (kW)',
      icon: <Zap className="w-4 h-4 text-green-500" />,
      getValue: (p: Product) => calculatePower(p.pitch, 'max')
    },
    {
      id: 'avgPower',
      label: locale === 'fr' ? 'PUISSANCE MOYENNE (kW)' : 'AVERAGE POWER (kW)',
      icon: <Zap className="w-4 h-4 text-blue-500" />,
      getValue: (p: Product) => calculatePower(p.pitch, 'avg')
    },
    {
      id: 'breaker',
      label: locale === 'fr' ? 'DISJONCTEUR RECOMMANDÉ' : 'RECOMMENDED BREAKER',
      icon: <Shield className="w-4 h-4 text-orange-500" />,
      getValue: (p: Product) => calculateBreaker(p.pitch)
    },
    {
      id: 'environment',
      label: locale === 'fr' ? 'ENVIRONNEMENT' : 'ENVIRONMENT',
      icon: <Sun className="w-4 h-4 text-teal-500" />,
      getValue: (p: Product) => {
        const envs = [];
        if (p.type.includes('indoor')) {
          envs.push({ code: 'indoor', label: locale === 'fr' ? 'INTÉRIEUR' : 'INDOOR' });
        }
        if (p.type.includes('outdoor')) {
          envs.push({ code: 'outdoor', label: locale === 'fr' ? 'EXTÉRIEUR' : 'OUTDOOR' });
        }
        return (
          <div className="flex items-center justify-center gap-2">
            {envs.map(env => (
              <span key={env.code} className={cn(
                "text-[10px] font-black uppercase px-2 py-1 rounded-full",
                env.code === 'indoor' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
              )}>
                {env.label}
              </span>
            ))}
          </div>
        );
      }
    },
    {
      id: 'pitch',
      label: locale === 'fr' ? 'PITCH DES PIXELS' : 'PIXEL PITCH',
      icon: <Grid3X3 className="w-4 h-4 text-slate-500" />,
      getValue: (p: Product) => p.pitch || 'N/A'
    },
    {
      id: 'distance',
      label: locale === 'fr' ? 'DISTANCE DE VISIONNAGE' : 'VIEWING DISTANCE',
      icon: <Eye className="w-4 h-4 text-slate-500" />,
      getValue: (p: Product) => p.distance || 'N/A'
    }
  ];

  const customFeatures = React.useMemo(() => {
    if (!characteristics) return [];
    const skippedNames = ['pixel pitch', 'distance de visionnage', 'puissance maximale', 'environnement'];
    const base = characteristics
      .filter(char => !skippedNames.includes(char.name?.toLowerCase()))
      .map(char => {
        const IconComponent = getIconComponent(char.iconName);
        return {
          id: char.id,
          label: char.name.toUpperCase(),
          icon: <IconComponent className="w-4 h-4 text-slate-500" />,
          getValue: (p: Product) => {
            const sc = p.selectedChars?.find((c: any) => String(c.id) === String(char.id));
            return sc && sc.value ? sc.value : null;
          }
        };
      });

    return base.filter(char => {
      const values = products.map(p => char.getValue(p));
      const allNull = values.every(v => !v);
      return !allNull;
    });
  }, [characteristics, products]);

  const allFeatures = [...features, ...customFeatures];

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-6 md:p-8 text-center relative border-b border-slate-100 shrink-0">
        <h2 className="text-2xl md:text-3xl font-black text-[#1a202c] uppercase tracking-tight">
          {locale === 'fr' ? 'Comparatif des produits' : 'Product Comparison'}
        </h2>
        <p className="text-slate-500 font-medium mt-2 text-sm">
          {locale === 'fr' 
            ? "Comparez les caractéristiques techniques de nos solutions d'affichage LED" 
            : "Compare the technical features of our LED display solutions"}
        </p>
        {onClose && (
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto bg-[#fafafa]">
        <div className="min-w-[800px] w-full">
          {/* Products Header Row */}
          <div className="flex bg-white sticky top-0 z-20 border-b border-slate-200 shadow-sm">
            <div className="w-64 shrink-0 p-6 flex items-center border-r border-slate-100">
              <span className="font-bold text-slate-400 uppercase text-xs tracking-widest">
                {locale === 'fr' ? 'Produit' : 'Product'}
              </span>
            </div>
            {products.map((product) => (
              <div key={product.id} className="flex-1 min-w-[220px] p-6 flex flex-col items-center text-center border-r border-slate-100 relative group">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-slate-100 mb-4 shadow-sm relative mx-auto">
                  <img src={product.imageUrl || product.image || '/no-product.png'} alt={product.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay"></div>
                </div>
                <h3 className="font-black text-xs md:text-sm text-slate-900 uppercase tracking-tight mb-1 min-h-[48px] flex items-center justify-center px-2 leading-tight">
                  {product.name}
                </h3>
                <button
                  onClick={() => onSelect(product.id)}
                  className={cn(
                    "mt-4 w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                    selectedProductId === product.id
                      ? "bg-[#c6ff00] text-black shadow-lg"
                      : "bg-slate-900 text-white hover:bg-blue-600"
                  )}
                >
                  {selectedProductId === product.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" /> {locale === 'fr' ? 'Sélectionné' : 'Selected'}
                    </span>
                  ) : (
                    locale === 'fr' ? 'Choisir' : 'Select'
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Features Rows */}
          <div className="bg-white">
            {allFeatures.map((feature, idx) => (
              <div key={feature.id} className={cn("flex hover:bg-slate-50 transition-colors", idx !== allFeatures.length - 1 && "border-b border-slate-100")}>
                <div className="w-64 shrink-0 p-4 px-6 flex items-center gap-3 border-r border-slate-100 bg-[#fafafa]">
                  {feature.icon}
                  <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">{feature.label}</span>
                </div>
                {products.map((product) => (
                  <div key={product.id} className="flex-1 min-w-[220px] p-4 flex items-center justify-center text-center border-r border-slate-100">
                    <span className="text-sm font-bold text-slate-700">{feature.getValue(product)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Monitor icon component for the comparator since it wasn't in lucide imports directly for this file
function Monitor(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

function Grid3X3(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 9h18" />
        <path d="M3 15h18" />
        <path d="M9 3v18" />
        <path d="M15 3v18" />
      </svg>
    );
}
