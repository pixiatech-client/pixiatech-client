import React, { useState, useEffect } from 'react';
import { ShoppingBag, Edit3, Check, User, Menu, X, ArrowUpRight } from 'lucide-react';
import { useProduct } from '../../context/ProductContext';
import { EditableText } from '../admin/EditableText';

export const Header: React.FC = () => {
  const { data, updateField, isEditMode, setIsEditMode, setIsQuoteModalOpen } = useProduct();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const header = data.header;

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-300 ${
      isScrolled ? 'py-2 bg-black/80 backdrop-blur-xl border-b border-white/10' : 'py-4 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 p-2 sm:p-2.5 rounded-2xl bg-[#090b10]/80 border border-white/10 shadow-2xl backdrop-blur-md">
          {/* Logo & Brand */}
          <a href="#" className="flex items-center gap-3 pl-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-black to-[#131722] border border-[#c6ff00]/40 flex items-center justify-center text-[#c6ff00] shadow-[0_0_15px_rgba(198,255,0,0.15)] group-hover:border-[#c6ff00] transition-colors">
              <span className="font-tech font-black text-xl tracking-tighter">P</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <EditableText
                  value={header.brandName}
                  onSave={(val) => updateField('header', 'brandName', val)}
                  className="font-tech font-extrabold text-lg sm:text-xl text-white tracking-widest leading-none"
                  tag="span"
                />
                <span className="w-1.5 h-1.5 rounded-full bg-[#c6ff00] animate-pulse" />
              </div>
              <EditableText
                value={header.brandTagline}
                onSave={(val) => updateField('header', 'brandTagline', val)}
                className="text-[9px] font-mono tracking-widest text-slate-400 uppercase leading-tight mt-0.5"
                tag="span"
              />
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/[0.03] border border-white/5 rounded-xl px-2 py-1">
            {header.navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Cart Button */}
            <button
              onClick={() => setIsQuoteModalOpen(true)}
              className="relative p-2 rounded-xl text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
              title="Panier / Devis en cours"
            >
              <ShoppingBag className="w-4 h-4" />
              {header.cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#c6ff00] text-black text-[10px] font-black rounded-full flex items-center justify-center">
                  {header.cartCount}
                </span>
              )}
            </button>

            {/* WYSIWYG Mode Switch Button */}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                isEditMode
                  ? 'bg-[#c6ff00] text-black shadow-[0_0_15px_rgba(198,255,0,0.4)]'
                  : 'bg-white/5 hover:bg-white/10 text-[#c6ff00] border border-[#c6ff00]/30 hover:border-[#c6ff00]'
              }`}
              title={isEditMode ? 'Désactiver le mode édition' : 'Activer l\'éditeur WYSIWYG'}
            >
              {isEditMode ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span className="hidden sm:inline">Éditeur Actif</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Éditer le produit</span>
                </>
              )}
            </button>

            {/* PixiaTech Gradient Member Area CTA */}
            <button
              onClick={() => setIsQuoteModalOpen(true)}
              className="gradient-pixiatech hover:opacity-95 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Espace Membre</span>
              <ArrowUpRight className="w-3 h-3 opacity-80" />
            </button>

            {/* Mobile hamburger menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 p-4 rounded-2xl bg-[#0b0e14] border border-white/10 shadow-2xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {header.navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className="block px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
