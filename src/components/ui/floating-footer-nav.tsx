
'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingFooterNavProps {
    onBack: () => void;
    onNext: () => void;
    nextDisabled?: boolean;
    nextLabel?: string;
    backLabel?: string;
    className?: string;
    nextType?: 'button' | 'submit';
    nextFormId?: string;
    isLoading?: boolean;
}

export function FloatingFooterNav({ 
    onBack, 
    onNext, 
    nextDisabled = false, 
    nextLabel = "Suivant",
    backLabel,
    className,
    nextType = 'button',
    nextFormId,
    isLoading = false
}: FloatingFooterNavProps) {
    return (
        <footer className={cn("p-4 md:p-6 bg-transparent fixed bottom-0 left-0 right-0 z-[100] pointer-events-none", className)}>
            <div className="relative p-1.5 bg-black/20 backdrop-blur-md border border-white/50 rounded-[24px] shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] pointer-events-auto w-full max-w-[650px] mx-auto before:absolute before:inset-0 before:rounded-[24px] before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:rounded-[24px] after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none">
                <div className="relative z-10 flex items-center gap-2 w-full">
                    {/* Bouton Retour */}
                    <button
                        onClick={onBack}
                        className="w-12 h-12 rounded-[16px] bg-black text-white flex items-center justify-center transition-all duration-300 hover:bg-[#c6ff00] hover:text-black hover:shadow-[0_0_20px_rgba(198,255,0,0.4)] active:scale-90 shadow-lg shrink-0"
                    >
                        <ChevronLeft size={20} strokeWidth={3} />
                    </button>

                    {/* Bouton Suivant (Capsule Noire) */}
                    <button
                        onClick={nextType === 'submit' ? undefined : onNext}
                        type={nextType}
                        form={nextFormId}
                        disabled={nextDisabled || isLoading}
                        className={cn(
                            "flex-1 h-12 bg-black rounded-[18px] flex items-center px-6 transition-all duration-300 group hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] active:scale-[0.98] shadow-lg overflow-hidden relative",
                            (nextDisabled || isLoading) && "opacity-50 cursor-not-allowed grayscale"
                        )}
                    >
                        <div className="absolute inset-0 bg-black group-hover:bg-gray-900 transition-colors duration-300"></div>
                        <span className="relative z-10 text-white font-black uppercase tracking-[0.3em] text-[10px] ml-2 transition-colors duration-300 group-hover:text-[#c6ff00]">
                            {isLoading ? "Envoi en cours..." : nextLabel}
                        </span>
                        <div className="relative z-10 ml-auto w-8 h-8 rounded-[12px] bg-white/10 flex items-center justify-center transition-all duration-300 group-hover:bg-[#c6ff00] group-hover:scale-105">
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <ChevronRight size={14} strokeWidth={3} className="text-white group-hover:text-black transition-colors duration-300" />
                            )}
                        </div>
                    </button>
                </div>
            </div>
        </footer>
    );
}
