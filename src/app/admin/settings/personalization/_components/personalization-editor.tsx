'use client';

import React, { useState } from 'react';
import { useDynamicTheme, DEFAULT_THEME } from '@/contexts/DynamicThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Palette, 
    RotateCcw, 
    Save, 
    Trash2, 
    Check, 
    Layout, 
    MousePointer2, 
    Menu as MenuIcon,
    Sparkles,
    ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ColorInput = ({ 
    label, 
    value, 
    onChange, 
    id 
}: { 
    label: string, 
    value: string, 
    onChange: (val: string) => void,
    id: string 
}) => (
    <div className="flex flex-col gap-2 group">
        <label htmlFor={id} className="text-xs font-bold uppercase tracking-widest text-gray-400 group-hover:text-pink-500 transition-colors">
            {label}
        </label>
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-2xl group-hover:border-pink-500/30 transition-all shadow-sm group-hover:shadow-pink-500/5">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-inner border border-gray-100 dark:border-white/10 shrink-0">
                <input 
                    type="color" 
                    id={id}
                    value={value} 
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer"
                />
            </div>
            <input 
                type="text" 
                value={(value || '').toUpperCase()} 
                onChange={(e) => onChange(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-mono font-bold w-full"
            />
        </div>
    </div>
);

const sections = [
    {
        title: "Cartes & Conteneurs",
        description: "Personnalisez l'apparence des éléments de contenu principaux.",
        icon: Layout,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        items: [
            { id: 'cardBg', label: 'Fond des Cartes', key: 'cardBg' as const },
            { id: 'cardBorder', label: 'Bordure des Cartes', key: 'cardBorder' as const },
            { id: 'cardText', label: 'Texte des Cartes', key: 'cardText' as const },
        ]
    },
    {
        title: "Boutons",
        description: "Définissez les couleurs pour vos actions principales et secondaires.",
        icon: MousePointer2,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        items: [
            { id: 'btnPrimaryBg', label: 'Fond Primaire', key: 'btnPrimaryBg' as const },
            { id: 'btnPrimaryText', label: 'Texte Primaire', key: 'btnPrimaryText' as const },
            { id: 'btnPrimaryHover', label: 'Survol Primaire', key: 'btnPrimaryHover' as const },
            { id: 'btnSecondaryBg', label: 'Fond Secondaire', key: 'btnSecondaryBg' as const },
            { id: 'btnSecondaryText', label: 'Texte Secondaire', key: 'btnSecondaryText' as const },
            { id: 'btnSecondaryHover', label: 'Survol Secondaire', key: 'btnSecondaryHover' as const },
        ]
    },
    {
        title: "Menu Latéral",
        description: "Personnalisez les couleurs de votre menu de navigation principal.",
        icon: MenuIcon,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        items: [
            { id: 'sidebarBg', label: 'Fond du Menu', key: 'sidebarBg' as const },
            { id: 'sidebarText', label: 'Texte du Menu', key: 'sidebarText' as const },
            { id: 'sidebarBorder', label: 'Bordure du Menu', key: 'sidebarBorder' as const },
            { id: 'sidebarActiveBg', label: 'Survol/Actif Fond', key: 'sidebarActiveBg' as const },
            { id: 'sidebarActiveText', label: 'Survol/Actif Texte', key: 'sidebarActiveText' as const },
        ]
    },
    {
        title: "Global & Accents",
        description: "Touches finales pour une interface cohérente.",
        icon: Sparkles,
        color: "text-pink-500",
        bg: "bg-pink-500/10",
        items: [
            { id: 'accentPrimary', label: 'Couleur d\'Accent', key: 'accentPrimary' as const },
            { id: 'pageBg', label: 'Fond de Page', key: 'pageBg' as const },
            { id: 'navBg', label: 'Fond Barre Haute', key: 'navBg' as const },
            { id: 'navText', label: 'Texte Barre Haute', key: 'navText' as const },
        ]
    }
];

export const PersonalizationEditor = () => {
    const { themeSettings, updateTheme, saveTheme, resetToDefault, isSaving } = useDynamicTheme();
    const [hasChanges, setHasChanges] = useState(false);
    const [openSection, setOpenSection] = useState<string | null>(sections[0].title);

    const handleResetSection = (keys: string[]) => {
        const updates: Partial<typeof themeSettings> = {};
        keys.forEach(key => {
            if (DEFAULT_THEME[key as keyof typeof DEFAULT_THEME]) {
                (updates as any)[key] = DEFAULT_THEME[key as keyof typeof DEFAULT_THEME];
            }
        });
        updateTheme(updates);
        setHasChanges(true);
        toast.success('Section réinitialisée !');
    };

    const handleColorChange = (key: keyof typeof themeSettings, value: string) => {
        updateTheme({ [key]: value });
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            await saveTheme();
            setHasChanges(false);
            toast.success('Préférences de personnalisation enregistrées !');
        } catch (error) {
            toast.error('Erreur lors de l\'enregistrement.');
        }
    };

    const handleReset = () => {
        resetToDefault();
        setHasChanges(false);
        toast.info('Réinitialisation aux paramètres par défaut.');
    };


    return (
        <div className="space-y-8 pb-20 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3 italic">
                        <Palette className="w-8 h-8 text-pink-500" />
                        PERSONNALISATION
                    </h2>
                    <p className="text-gray-500 font-medium mt-1">Personnalisez les éléments internes. La barre latérale et le menu restent fixes.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        onClick={handleReset}
                        className="rounded-2xl border-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-bold uppercase tracking-wider text-xs"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Réinitialiser
                    </Button>
                    
                    <Button 
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className="rounded-2xl bg-black text-white hover:bg-gray-800 shadow-xl shadow-black/10 transition-all font-bold uppercase tracking-wider text-xs px-8"
                    >
                        {isSaving ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="mr-2"
                            >
                                <Sparkles className="w-4 h-4" />
                            </motion.div>
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        {isSaving ? 'Enregistrement...' : 'Sauvegarder'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start relative min-h-[800px]">
                {/* Editor Section */}
                <div className="xl:col-span-7 space-y-6">
                    {sections.map((section, idx) => (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card 
                                className={cn(
                                    "border-none shadow-2xl transition-all duration-500",
                                    openSection === section.title 
                                        ? "shadow-black/20" 
                                        : "shadow-gray-200/50 dark:shadow-none bg-white/50 dark:bg-white/5 backdrop-blur-xl",
                                    "rounded-[2rem] overflow-hidden group"
                                )}
                                style={openSection === section.title ? { 
                                    backgroundColor: themeSettings.sidebarActiveBg, 
                                    color: themeSettings.sidebarActiveText 
                                } : {}}
                            >
                                <CardHeader 
                                    className={cn(
                                        "pb-4 cursor-pointer transition-colors",
                                        openSection === section.title ? "hover:opacity-90" : "hover:bg-gray-50/50 dark:hover:bg-white/5"
                                    )}
                                    onClick={() => setOpenSection(openSection === section.title ? null : section.title)}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("p-3 rounded-2xl transition-all duration-500", 
                                                openSection === section.title ? "scale-110 shadow-lg bg-white/20 text-white" : cn("shadow-black/5", section.bg, section.color)
                                            )}>
                                                <section.icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-black italic tracking-tight flex items-center gap-2">
                                                    {section.title}
                                                    <motion.div
                                                        animate={{ rotate: openSection === section.title ? 180 : 0 }}
                                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                    >
                                                        <ChevronDown className={cn("w-4 h-4", openSection === section.title ? "text-white/50" : "text-gray-400")} />
                                                    </motion.div>
                                                </CardTitle>
                                                <CardDescription className={cn("text-xs font-medium mt-1 uppercase tracking-widest", openSection === section.title ? "text-white/60" : "text-gray-400")}>{section.description}</CardDescription>
                                            </div>
                                        </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleResetSection(section.items.map(i => i.key));
                                                }}
                                                className={cn(
                                                    "rounded-xl transition-all gap-2 h-9 border border-transparent",
                                                    openSection === section.title 
                                                        ? "bg-white/10 text-white hover:bg-white/20 hover:border-white/20" 
                                                        : "hover:bg-red-50 hover:text-red-600 hover:border-red-100 text-gray-400"
                                                )}
                                            >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Réinitialiser</span>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <AnimatePresence>
                                    {openSection === section.title && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        >
                                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-0 pb-10">
                                                {section.items.map((item) => (
                                                    <ColorInput 
                                                        key={item.id}
                                                        id={item.id}
                                                        label={item.label}
                                                        value={themeSettings[item.key]}
                                                        onChange={(val) => handleColorChange(item.key, val)}
                                                    />
                                                ))}
                                            </CardContent>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Preview Section - Fixed/Sticky Container */}
                <div className="xl:col-span-5 relative h-full">
                    <div className="sticky top-24 self-start space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 italic">Aperçu en direct</h3>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Temps réel</span>
                            </div>
                        </div>

                        <Card className="bg-emerald-500/10 border-emerald-500/20 rounded-3xl shadow-none">
                            <CardContent className="p-4 flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <p className="text-xs font-medium text-emerald-800 leading-relaxed">
                                    L'aperçu montre comment vos éléments internes s'intègrent dans le design original.
                                </p>
                            </CardContent>
                        </Card>

                        <div className="relative aspect-video xl:aspect-[4/3] w-full bg-gray-100 dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border-8 border-white dark:border-zinc-800 transition-all duration-500 ring-1 ring-black/5">
                            {/* Mock App Layout */}
                            <div className="absolute inset-0 flex flex-col" style={{ backgroundColor: themeSettings.pageBg }}>
                                {/* Mock Header (Original White style) */}
                                <div className="h-10 border-b flex items-center justify-between px-4" style={{ backgroundColor: themeSettings.navBg, borderColor: themeSettings.sidebarBorder }}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full opacity-20" style={{ backgroundColor: themeSettings.navText }} />
                                        <div className="w-16 h-2 rounded-full opacity-10" style={{ backgroundColor: themeSettings.navText }} />
                                    </div>
                                    <div className="w-6 h-6 rounded-full opacity-20" style={{ backgroundColor: themeSettings.navText }} />
                                </div>

                                <div className="flex-1 flex min-h-0">
                                    {/* Mock Sidebar (Original White style) */}
                                    <div className="w-16 border-r flex flex-col gap-2 p-2" style={{ backgroundColor: themeSettings.sidebarBg, borderColor: themeSettings.sidebarBorder }}>
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-full h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: i === 1 ? themeSettings.sidebarActiveBg : 'transparent' }}>
                                                <div className="w-8 h-1 rounded-full opacity-20" style={{ backgroundColor: i === 1 ? themeSettings.sidebarActiveText : themeSettings.sidebarText }} />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mock Content */}
                                    <div className="flex-1 p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="w-24 h-4 rounded-full bg-gray-200" />
                                            <motion.div 
                                                whileHover={{ backgroundColor: themeSettings.btnPrimaryHover }}
                                                className="w-20 h-8 rounded-lg shadow-lg cursor-pointer" 
                                                style={{ backgroundColor: themeSettings.btnPrimaryBg, color: themeSettings.btnPrimaryText }}
                                            >
                                                <div className="w-full h-full flex items-center justify-center text-[8px] font-black uppercase">Action</div>
                                            </motion.div>
                                        </div>

                                        {/* Mock Card */}
                                        <div className="rounded-2xl border p-4 shadow-xl" style={{ backgroundColor: themeSettings.cardBg, borderColor: themeSettings.cardBorder, color: themeSettings.cardText }}>
                                            <div className="w-2/3 h-3 rounded-full bg-current opacity-20 mb-2" />
                                            <div className="w-full h-2 rounded-full bg-current opacity-10 mb-1" />
                                            <div className="w-full h-2 rounded-full bg-current opacity-10 mb-1" />
                                            <div className="w-1/2 h-2 rounded-full bg-current opacity-10" />
                                            
                                            <div className="mt-4 flex gap-2">
                                                <motion.div 
                                                    whileHover={{ backgroundColor: themeSettings.btnSecondaryHover }}
                                                    className="flex-1 h-6 rounded-md flex items-center justify-center text-[6px] font-bold uppercase cursor-pointer" 
                                                    style={{ backgroundColor: themeSettings.btnSecondaryBg, color: themeSettings.btnSecondaryText }}
                                                >
                                                    Secondaire
                                                </motion.div>
                                                <div className="w-12 h-6 rounded-md flex items-center justify-center text-[6px] font-bold uppercase" style={{ backgroundColor: themeSettings.accentPrimary, color: '#fff' }}>
                                                    Accent
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {hasChanges && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4"
                    >
                        <div className="bg-black/90 backdrop-blur-xl text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                                <span className="text-sm font-bold tracking-tight uppercase">Modifications non sauvegardées</span>
                            </div>
                            <Button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-xs uppercase tracking-widest h-10 px-6"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Enregistrer
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
