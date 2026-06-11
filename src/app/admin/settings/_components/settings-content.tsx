'use client';

import { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { getSettings } from '@/app/admin/actions';
import type { Settings as AppSettings } from '@/lib/types';
import { Loader2, Settings, Image as ImageIcon, FileText, Palette, Wand2, Truck, HardHat, FileType, AlertTriangle, X, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useAdminT } from '@/hooks/useAdminT';

export type SettingsSection = 'general' | 'emergency' | 'images' | 'appearance' | 'wizard' | 'livraison' | 'main-doeuvre' | 'pdf' | 'hint-bubble' | 'messaging' | 'software' | 'email-verification' | 'flow' | 'content';

interface SettingsContentProps {
    initialSection?: SettingsSection;
    onSectionChange?: (section: SettingsSection) => void;
}

const GeneralContent = lazy(() => import('../general/page'));
const ImagesContent = lazy(() => import('../images/page'));
const WizardContent = lazy(() => import('../../wizard/page'));
const LivraisonContent = lazy(() => import('../../_components/delivery-redirect'));
const LaborContent = lazy(() => import('../../labor/page'));
const PdfContent = lazy(() => import('../../pdf-settings/page'));
const EmergencyContent = lazy(() => import('../emergency/page'));
const MessagingContent = lazy(() => import('../messaging/page'));
const SoftwareContent = lazy(() => import('../software/page'));
const EmailVerificationContent = lazy(() => import('../email-verification/page'));
const FlowContent = lazy(() => import('../flow/page'));
const ThemesContent = lazy(() => import('../themes/page'));

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

const tabsConfigDefs = [
    { id: 'general' as SettingsSection, labelKey: 'General', icon: Settings },
    { id: 'images' as SettingsSection, labelKey: 'Images', icon: ImageIcon },
    { id: 'appearance' as SettingsSection, labelKey: 'Appearance', icon: Palette },
    { id: 'wizard' as SettingsSection, labelKey: 'Wizard', icon: Wand2 },
    { id: 'livraison' as SettingsSection, labelKey: 'Delivery', icon: Truck },
    { id: 'main-doeuvre' as SettingsSection, labelKey: 'Labor', icon: HardHat },
    { id: 'pdf' as SettingsSection, labelKey: 'PDF', icon: FileType },
    { id: 'messaging' as SettingsSection, labelKey: 'Messaging', icon: MessageSquare },
    { id: 'emergency' as SettingsSection, labelKey: 'Emergency', icon: AlertTriangle },
    { id: 'hint-bubble' as SettingsSection, labelKey: 'Hint Bubbles', icon: MessageSquare },
    { id: 'software' as SettingsSection, labelKey: 'Software', icon: Settings },
    { id: 'email-verification' as SettingsSection, labelKey: 'Email Verification', icon: ShieldCheck },
    { id: 'flow' as SettingsSection, labelKey: 'Parcours client', icon: Zap },
];

export function SettingsContent({ initialSection = 'general', onSectionChange }: SettingsContentProps) {
    const { t } = useAdminT();
    const tabsConfig = tabsConfigDefs.map(tab => ({ ...tab, label: t(tab.labelKey) }));
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showMobileMenu, setShowMobileMenu] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [currentSection, setCurrentSection] = useState<SettingsSection>(initialSection);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (initialSection) {
            setCurrentSection(initialSection);
            setShowMobileMenu(false);
        }
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
        setShowMobileMenu(false);
        onSectionChange?.(section);
    };

    const renderSection = () => {
        if (isLoading || !settings) {
            return <LoadingFallback />;
        }

        switch (currentSection) {
            case 'general':
                return <GeneralContent />;
            case 'images':
                return <ImagesContent />;
            case 'wizard':
                return <WizardContent />;
            case 'livraison':
                return <LivraisonContent />;
            case 'main-doeuvre':
                return <LaborContent />;
            case 'pdf':
                return <PdfContent />;
            case 'messaging':
                return <MessagingContent />;
            case 'emergency':
                return <EmergencyContent />;
            case 'appearance':
                return <ThemesContent />;
            case 'email-verification':
                return <EmailVerificationContent />;
            case 'software':
                return <SoftwareContent />;
            case 'flow':
                return <FlowContent />;
            default:
                return <GeneralContent />;
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 lg:items-start pt-2 lg:pt-4">
            <div className={cn("w-full lg:w-72 flex-shrink-0 hidden lg:block")}>
                <Tabs 
                    value={currentSection} 
                    onValueChange={(value) => handleSectionChange(value as SettingsSection)}
                    orientation="vertical"
                >
                    <TabsList 
                        hideBubble
                        className="flex flex-row lg:flex-col gap-2 md:gap-3 bg-transparent p-0 h-auto w-full items-stretch overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 px-4 md:px-0"
                    >
                        {tabsConfig.map((tab) => {
                            const isSelected = currentSection === tab.id;
                            return (
                                <TabsTrigger 
                                    key={tab.id} 
                                    value={tab.id}
                                    className={cn(
                                        "w-auto lg:w-full flex items-center justify-start gap-3 md:gap-4 px-3 md:px-4 py-2 md:py-3 rounded-2xl text-[10px] md:text-sm font-black uppercase tracking-wider transition-all duration-300 flex-shrink-0",
                                        "border border-gray-100 shadow-sm",
                                        "data-[state=active]:bg-theme-sidebar-active-bg data-[state=active]:text-theme-sidebar-active-text data-[state=active]:border-transparent data-[state=active]:shadow-xl",
                                        "data-[state=inactive]:bg-white data-[state=inactive]:text-gray-500 hover:bg-gray-50 hover:scale-[1.02]"
                                    )}
                                    style={isSelected ? { backgroundColor: 'var(--theme-sidebar-active-bg)', color: 'var(--theme-sidebar-active-text)' } : {}}
                                >
                                    <div className={cn(
                                        "h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center transition-all flex-shrink-0",
                                        isSelected ? "bg-white/20" :
                                        tab.id === 'general' ? "bg-blue-100/80 text-blue-600" :
                                        tab.id === 'images' ? "bg-purple-100/80 text-purple-600" :
                                        tab.id === 'emergency' ? "bg-red-100/80 text-red-600" :
                                        tab.id === 'wizard' ? "bg-indigo-100/80 text-indigo-600" :
                                        tab.id === 'livraison' ? "bg-cyan-100/80 text-cyan-600" :
                                        tab.id === 'messaging' ? "bg-blue-100/80 text-blue-600" :
                                        tab.id === 'appearance' ? "bg-fuchsia-100/80 text-fuchsia-600" :
                                        tab.id === 'email-verification' ? "bg-indigo-100/80 text-indigo-600" :
                                        "bg-orange-100/80 text-orange-600"
                                    )}>
                                        <tab.icon className={cn(
                                            "w-5 h-5 transition-all duration-300",
                                            isSelected ? "text-white scale-110" : ""
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
                {!isMobile && (
                    <div className="mb-6 md:mb-8 px-4 lg:px-0">
                        <h2 className="text-2xl md:text-3xl font-black text-[#1a1d21]">{t('System Configuration')}</h2>
                        <p className="text-gray-400 font-medium text-xs md:text-sm mt-2">{t('Manage global options, resources, and security settings for your platform.')}</p>
                    </div>
                )}
                
                <div className="w-full relative min-h-[600px]">
                    <Suspense fallback={<LoadingFallback />}>
                        {renderSection()}
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
