'use client';

import { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { getSettings } from '@/app/admin/actions';
import type { Settings as AppSettings } from '@/lib/types';
import { Loader2, Settings, Image as ImageIcon, FileText, Palette, Wand2, Truck, HardHat, FileType, AlertTriangle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export type SettingsSection = 'general' | 'emergency' | 'images' | 'content' | 'appearance' | 'wizard' | 'livraison' | 'main-doeuvre' | 'pdf' | 'hint-bubble';

interface SettingsContentProps {
    initialSection?: SettingsSection;
    onSectionChange?: (section: SettingsSection) => void;
}

const GeneralContent = lazy(() => import('../general/page'));
const ImagesContent = lazy(() => import('../images/page'));
const ContentContent = lazy(() => import('../content/page'));
const ThemesContent = lazy(() => import('../themes/page'));
const WizardContent = lazy(() => import('../../wizard/page'));
const LivraisonContent = lazy(() => import('../../_components/delivery-redirect'));
const LaborContent = lazy(() => import('../../labor/page'));
const PdfContent = lazy(() => import('../../pdf-settings/page'));
const EmergencyContent = lazy(() => import('../emergency/page'));

function LoadingFallback() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
        </div>
    );
}

interface TabItem {
    id: SettingsSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

const tabsConfig: TabItem[] = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'content', label: 'Contenu', icon: FileText },
    { id: 'appearance', label: 'Apparence', icon: Palette },
    { id: 'wizard', label: 'Wizard', icon: Wand2 },
    { id: 'livraison', label: 'Livraison', icon: Truck },
    { id: 'main-doeuvre', label: 'Main d\'œuvre', icon: HardHat },
    { id: 'pdf', label: 'PDF', icon: FileType },
    { id: 'emergency', label: 'Urgence', icon: AlertTriangle },
];

export function SettingsContent({ initialSection = 'general', onSectionChange }: SettingsContentProps) {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentSection, setCurrentSection] = useState<SettingsSection>(initialSection);

    useEffect(() => {
        setCurrentSection(initialSection);
    }, [initialSection]);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const fetchedSettings = await getSettings();
                setSettings(fetchedSettings);
            } catch (error) {
                console.error('Error loading settings:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSectionChange = (section: SettingsSection) => {
        setCurrentSection(section);
        onSectionChange?.(section);
    };

    const currentSectionIndex = useMemo(() => {
        return tabsConfig.findIndex(tab => tab.id === currentSection);
    }, [currentSection]);

    const renderSection = () => {
        if (isLoading || !settings) {
            return <LoadingFallback />;
        }

        switch (currentSection) {
            case 'general':
                return <GeneralContent />;
            case 'images':
                return <ImagesContent />;
            case 'content':
                return <ContentContent />;
            case 'appearance':
                return <ThemesContent />;
            case 'wizard':
                return <WizardContent />;
            case 'livraison':
                return <LivraisonContent />;
            case 'main-doeuvre':
                return <LaborContent />;
            case 'pdf':
                return <PdfContent />;
            case 'emergency':
                return <EmergencyContent />;
            default:
                return <GeneralContent />;
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 lg:items-start pt-4">
            <div className="w-full lg:w-72 flex-shrink-0">
                <Tabs 
                    value={currentSection} 
                    onValueChange={(value) => handleSectionChange(value as SettingsSection)}
                    orientation="vertical"
                >
                    <TabsList className="flex flex-col gap-3 bg-transparent p-0 h-auto w-full items-stretch">
                        {tabsConfig.map((tab, index) => {
                            const isSelected = currentSection === tab.id;
                            return (
                                <TabsTrigger 
                                    key={tab.id} 
                                    value={tab.id}
                                    className={cn(
                                        "w-full flex items-center justify-start gap-4 px-4 py-3 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-300",
                                        "border border-gray-100",
                                        "data-[state=active]:bg-[#0f1113] data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-xl",
                                        "data-[state=inactive]:bg-white data-[state=inactive]:text-gray-500",
                                        "hover:bg-gray-50 hover:scale-[1.02]"
                                    )}
                                >
                                    <div className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                                        isSelected ? "bg-white/10" :
                                        tab.id === 'general' ? "bg-blue-100/80 text-blue-600" :
                                        tab.id === 'images' ? "bg-purple-100/80 text-purple-600" :
                                        tab.id === 'content' ? "bg-emerald-100/80 text-emerald-600" :
                                        tab.id === 'appearance' ? "bg-pink-100/80 text-pink-600" :
                                        tab.id === 'emergency' ? "bg-red-100/80 text-red-600" :
                                        tab.id === 'wizard' ? "bg-indigo-100/80 text-indigo-600" :
                                        tab.id === 'livraison' ? "bg-cyan-100/80 text-cyan-600" :
                                        "bg-orange-100/80 text-orange-600"
                                    )}>
                                        <tab.icon className={cn(
                                            "w-5 h-5 transition-all duration-300",
                                            isSelected && "text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                                        )} />
                                    </div>
                                    <span className="mt-0.5">{tab.label}</span>
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                </Tabs>
            </div>
            
            <div className="flex-1 min-w-0 flex flex-col pt-2 lg:pt-0">
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-[#1a1d21]">Configuration Système</h2>
                    <p className="text-gray-400 font-medium text-sm mt-2">Gérez les options globales, les ressources et les paramètres de sécurité de votre plateforme.</p>
                </div>
                
                <div className="w-full relative min-h-[600px]">
                    <Suspense fallback={<LoadingFallback />}>
                        {renderSection()}
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
