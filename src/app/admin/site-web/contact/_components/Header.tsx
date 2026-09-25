'use client';
import React, { useState } from 'react';
import { Menu, X, Shield, ShoppingBag, User, Sliders, Edit3, Eye } from 'lucide-react';
import type { ContactInfo } from '@/lib/site-web/types';

interface HeaderProps {
  contactInfo: ContactInfo | null;
  onOpenSettings: () => void;
  unreadCount: number;
  isAdminMode?: boolean;
  onToggleAdminMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  contactInfo,
  onOpenSettings,
  unreadCount,
  isAdminMode,
  onToggleAdminMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  return (
    <header className="fixed top-0 z-30 w-full pt-3 px-4 transition-all duration-200">
      {/* Floating Pill Navbar identically structured like app.pixiatech.com */}
      <nav className="max-w-7xl mx-auto bg-black rounded-full px-6 lg:px-8 py-2.5 flex items-center justify-between shadow-2xl border border-white/10">
        
        {/* Mobile menu trigger */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white/70 hover:text-white mr-2 p-1 focus:outline-none" 
          aria-label="Menu" 
          type="button"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <Menu className="w-5 h-5 text-white" />
          )}
        </button>

        {/* Brand Logo */}
        <div className="flex-shrink-0">
          <a 
            href="https://pixiatech.com/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-white font-tech text-2xl lg:text-3xl tracking-widest hover:opacity-80 transition-opacity font-bold"
          >
            PIXIATECH
          </a>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-7 lg:space-x-8">
          <a 
            className="font-medium text-sm text-white/80 hover:text-white transition-colors" 
            href="https://app.pixiatech.com/"
          >
            Accueil
          </a>
          <a 
            className="font-medium text-sm text-white/80 hover:text-white transition-colors" 
            href="https://app.pixiatech.com/boutique"
          >
            Boutique
          </a>
          <a 
            className="font-medium text-sm whitespace-nowrap text-white/80 hover:text-white transition-colors" 
            href="https://app.pixiatech.com/?step=1"
          >
            Configuration Guidée
          </a>
          <a 
            href="#contact" 
            className="font-semibold text-sm text-[#007bff] relative after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-[#007bff]"
          >
            Contactez-Nous
          </a>
        </div>

        {/* Right Tools & Member Action */}
        <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
          {/* Admin / SMTP Settings trigger with badge */}
          <button
            onClick={onOpenSettings}
            className="relative text-white/70 hover:text-white p-1 transition-colors group"
            aria-label="Administration & Configuration Serveur"
            title="Administration & Configuration Mail / SMTP"
          >
            <Shield className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c6ff00] px-1 text-[9px] font-black text-black">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Lang badge */}
          <span className="text-white font-medium text-xs tracking-wider cursor-default hidden xs:inline-block">
            FR
          </span>

          {/* Cart Icon */}
          <a 
            className="relative text-white/70 hover:text-white p-1 transition-colors" 
            aria-label="Panier" 
            href="https://app.pixiatech.com/boutique/panier"
          >
            <ShoppingBag className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          </a>

          {/* Admin Mode Toggle Button */}
          {onToggleAdminMode && (
            <button
              type="button"
              onClick={onToggleAdminMode}
              className={`hidden sm:flex items-center space-x-1.5 text-xs font-semibold py-1.5 px-3 rounded-full border transition-all ${
                isAdminMode 
                  ? 'bg-[#c6ff00] text-black border-[#c6ff00] shadow-sm font-bold' 
                  : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'
              }`}
              title={isAdminMode ? "Désactiver le mode édition" : "Activer le mode édition de la page"}
            >
              {isAdminMode ? <Edit3 size={12} className="text-black" /> : <Edit3 size={12} className="text-[#c6ff00]" />}
              <span>{isAdminMode ? 'Éditeur Actif' : 'Modifier la page'}</span>
            </button>
          )}

          {/* Member Area Gradient Button matching app.pixiatech.com exactly */}
          <div className="relative">
            <button 
              onClick={onOpenSettings}
              className="text-white/70 hover:text-white md:hidden p-1" 
              aria-label="Espace membre & Paramètres"
            >
              <User className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </button>

            <button 
              onClick={onOpenSettings}
              className="hidden md:flex items-center justify-center space-x-2 text-white font-bold py-2.5 px-7 text-xs lg:text-sm min-w-[170px] focus:outline-none transition-all hover:brightness-110 active:scale-95 duration-200 btn-pixia-clip shadow-md"
              style={{
                background: 'linear-gradient(90deg, #7c3aed 0%, #ef4444 50%, #f97316 100%)',
                borderRadius: '0 16px 0 16px'
              }}
              title="Espace Membre & Administration PixiaTech"
            >
              <User className="w-3.5 h-3.5" />
              <span>Espace Membre</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 mx-auto max-w-7xl bg-black/95 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-white space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-3">
            <a 
              href="https://app.pixiatech.com/"
              className="text-sm font-medium text-slate-300 hover:text-white py-1"
            >
              Accueil
            </a>
            <a 
              href="https://app.pixiatech.com/boutique"
              className="text-sm font-medium text-slate-300 hover:text-white py-1"
            >
              Boutique
            </a>
            <a 
              href="https://app.pixiatech.com/?step=1"
              className="text-sm font-medium text-slate-300 hover:text-white py-1"
            >
              Configuration Guidée
            </a>
            <a 
              href="#contact"
              className="text-sm font-bold text-[#007bff] py-1"
            >
              Contactez-Nous (Page active)
            </a>
          </div>

          <div className="border-t border-white/10 pt-4 flex items-center justify-between">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSettings();
              }}
              className="w-full py-2.5 px-4 rounded-xl text-center text-xs font-bold text-black bg-[#c6ff00] hover:bg-[#b0e600] transition-colors flex items-center justify-center space-x-2"
            >
              <Sliders className="w-3.5 h-3.5 text-black" />
              <span>Gérer les paramètres SMTP ({unreadCount} msgs)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
