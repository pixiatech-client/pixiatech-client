'use client';

import { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { getSettings } from '@/app/admin/actions';
import type { Settings as AppSettings } from '@/lib/types';
import { motion } from 'framer-motion';
import { Loader2, Settings,   Image as ImageIcon, FileText, Palette, Wand2, Truck, HardHat, FileType, AlertTriangle, X, MessageSquare, ShieldCheck, Zap, PenTool, CreditCard } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAdminT } from '@/hooks/useAdminT';

export type SettingsSection = 'general' | 'emergency' | 'images' | 'appearance' | 'wizard' | 'livraison' | 'main-doeuvre' | 'pdf' | 'messaging' | 'software' | 'email-verification' | 'flow' | 'content' | 'signature' | 'paypal';

interface SettingsContentProps {
    initialSection?: SettingsSection;
    onSectionChange?: (section: SettingsSection) => void;
}

const GeneralContent = lazy(() => import('../general/page'));
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
const SignatureContent = lazy(() => import('../signature/page'));
const PayPalContent = lazy(() => import('../paypal/page'));

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
    { id: 'appearance' as SettingsSection, labelKey: 'Appearance', icon: Palette },
    { id: 'wizard' as SettingsSection, labelKey: 'Assistant & Images', icon: Wand2 },
    { id: 'livraison' as SettingsSection, labelKey: 'Delivery', icon: Truck },
    { id: 'main-doeuvre' as SettingsSection, labelKey: 'Labor', icon: HardHat },
    { id: 'pdf' as SettingsSection, labelKey: 'PDF', icon: FileType },
    { id: 'messaging' as SettingsSection, labelKey: 'Messaging', icon: MessageSquare },
    { id: 'emergency' as SettingsSection, labelKey: 'Emergency', icon: AlertTriangle },
    { id: 'software' as SettingsSection, labelKey: 'Software', icon: Settings },
    { id: 'email-verification' as SettingsSection, labelKey: 'Email Verification', icon: ShieldCheck },
    { id: 'flow' as SettingsSection, labelKey: 'Parcours client', icon: Zap },
    { id: 'signature' as SettingsSection, labelKey: 'Signature & Compteur', icon: PenTool },
    { id: 'paypal' as SettingsSection, labelKey: 'PayPal', icon: CreditCard },
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
            case 'signature':
                return <SignatureContent />;
            case 'paypal':
                return <PayPalContent />;
            default:
                return <GeneralContent />;
        }
    };

    const iconColor = (tabId: string, isSelected: boolean) => {
        if (isSelected) return 'text-white';
        const colors: Record<string, string> = {
            general: 'text-blue-500',
            images: 'text-purple-500',
            emergency: 'text-red-500',
            wizard: 'text-indigo-500',
            livraison: 'text-cyan-500',
            messaging: 'text-blue-500',
            appearance: 'text-fuchsia-500',
            'email-verification': 'text-indigo-500',
            signature: 'text-rose-500',
            flow: 'text-amber-500',
            paypal: 'text-blue-600',
            pdf: 'text-orange-500',
            software: 'text-slate-500',
            'main-doeuvre': 'text-emerald-500',
        };
        return colors[tabId] || 'text-slate-500';
    };

    const iconBg = (tabId: string, isSelected: boolean) => {
        if (isSelected) return 'bg-white/15';
        const colors: Record<string, string> = {
            general: 'bg-blue-100/70',
            images: 'bg-purple-100/70',
            emergency: 'bg-red-100/70',
            wizard: 'bg-indigo-100/70',
            livraison: 'bg-cyan-100/70',
            messaging: 'bg-blue-100/70',
            appearance: 'bg-fuchsia-100/70',
            'email-verification': 'bg-indigo-100/70',
            signature: 'bg-rose-100/70',
            flow: 'bg-amber-100/70',
            paypal: 'bg-blue-100/70',
            pdf: 'bg-orange-100/70',
            software: 'bg-slate-100/70',
            'main-doeuvre': 'bg-emerald-100/70',
        };
        return colors[tabId] || 'bg-slate-100/70';
    };

    return (
        <div className="bg-theme-app flex flex-col lg:flex-row gap-4 lg:gap-8 lg:items-start pt-2 lg:pt-4 min-h-screen">
            <div className={cn("w-full lg:w-72 flex-shrink-0 hidden lg:block")}>
                <Tabs 
                    value={currentSection} 
                    onValueChange={(value) => handleSectionChange(value as SettingsSection)}
                    orientation="vertical"
                >
                    <div className="flex flex-col gap-2 p-3">
                        {tabsConfig.map((tab, i) => {
                            const isSelected = currentSection === tab.id;
                            return (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => handleSectionChange(tab.id)}
                                    whileHover={{ scale: 1.02, y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 rounded-2xl h-[60px] transition-all duration-300 text-left",
                                        isSelected
                                            ? "bg-gradient-to-r from-[#5B4FE8] to-[#6A5BFF] shadow-xl shadow-indigo-500/20"
                                            : "bg-theme-card shadow-lg hover:shadow-xl"
                                    )}
                                >
                                    <div className={cn(
                                        "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300",
                                        iconBg(tab.id, isSelected)
                                    )}>
                                        <tab.icon className={cn(
                                            "w-4 h-4 transition-colors duration-300",
                                            iconColor(tab.id, isSelected)
                                        )} />
                                    </div>
                                    <span className={cn(
                                        "text-sm font-semibold tracking-tight truncate",
                                        isSelected ? "text-white" : "text-theme-sidebar-text opacity-70"
                                    )}>
                                        {tab.label}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </Tabs>
            </div>
            
            <div className="flex-1 min-w-0 flex flex-col pt-2 lg:pt-0">
                {!isMobile && (
                    <div className="mb-6 md:mb-8 px-4 lg:px-0">
                        <h2 className="text-2xl md:text-3xl font-black text-theme-text">
                            {tabsConfig.find(tab => tab.id === currentSection)?.label || ''}
                        </h2>
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
