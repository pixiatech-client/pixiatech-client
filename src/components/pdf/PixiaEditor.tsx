import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updatePdfSettings, getPdfSettings } from "@/app/actions/quote-actions";
import type { PdfSettings } from "@/lib/types";
import {
  Undo2,
  Download,
  RotateCcw,
  MapPin,
  Phone,
  Mail,
  Globe,
  User,
  Settings2,
  BarChart3,
  Info,
  FileText,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Baseline,
  ChevronUp,
  ChevronDown,
  X,
  CheckSquare,
  Diamond,
  Lock,
  Heart,
  Image as ImageIcon,
  Type,
  Maximize,
  Columns,
  Monitor,
  Cpu,
  Zap,
  Truck,
  Sun,
  Eye,
  Grid3X3,
} from "lucide-react";
import { DEFAULT_DATA } from "./template-data";

// ─────────────────────────────────────────────
// B. FONCTIONS UTILITAIRES
// ─────────────────────────────────────────────

const deepSet = (obj, path, value) => {
  const newObj = JSON.parse(JSON.stringify(obj));
  const cleanPath = path.replace(/\[(\d+)\]/g, '.$1');
  const keys = cleanPath.split('.');
  let current = newObj;
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]];
  }
  const numericValue = parseFloat(value);
  const finalValue = !isNaN(numericValue) && isFinite(value) && 
    !['name', 'address', 'date', 'numero', 'tagline', 'email', 'website', 'siret', 'city', 'details', 'description', 'information', 'terms'].some(k => path.includes(k))
    ? numericValue
    : value;
  current[keys[keys.length - 1]] = finalValue;
  return newObj;
};

const fmt = (n) => {
  const num = parseFloat(String(n).replace(/[^-0-9.]/g, '')) || 0;
  return num.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
};

// ─────────────────────────────────────────────
// A. COMPOSANT "E" (Editable avec Toolbar)
// ─────────────────────────────────────────────

const E = ({ 
  value, 
  onChange, 
  style = {} as React.CSSProperties, 
  multiline = false, 
  className = "",
  id,
  selectedId,
  setSelectedId,
  elementStyle = {} as React.CSSProperties
}) => {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef(null);

  const isSelected = selectedId === id;

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      (inputRef.current as any).focus();
      if (!multiline) {
        (inputRef.current as any).select();
      }
    }
  }, [editing, multiline]);

  const commit = () => {
    setEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !multiline) {
      commit();
    }
    e.stopPropagation();
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (!editing) {
      setSelectedId(id);
    }
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setEditing(true);
  };

  const es = elementStyle as any;
  const st = style as any;
  const renderStyle: React.CSSProperties = {
    fontFamily: "inherit",
    fontSize: es.fontSize ? `${es.fontSize}px` : st.fontSize,
    fontWeight: es.fontWeight || st.fontWeight,
    fontStyle: es.fontStyle || st.fontStyle,
    color: es.color || st.color,
    textAlign: es.textAlign || st.textAlign,
    lineHeight: "1.2",
    display: "inline-block",
    position: "relative",
    ...style,
    ...elementStyle
  };

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={commit}
          className={className}
          style={{
            ...renderStyle,
            resize: "none",
            width: "100%",
            overflow: "hidden",
            border: "1.5px solid #6366f1"
          }}
          rows={Math.max(String(localValue).split("\n").length, 1)}
        />
      );
    }
    return (
      <input
        ref={inputRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={className}
        style={{...renderStyle, border: "1.5px solid #6366f1"}}
      />
    );
  }

  return (
    <span
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`${className} transition-all relative`}
      style={{
        ...renderStyle,
        color: !value ? "#d1d5db" : renderStyle.color,
      }}
    >
      {value || "—"}
      {isSelected && (
        <div className="absolute -top-1 -left-1 -right-1 -bottom-1 pointer-events-none ring-1 ring-indigo-500 ring-offset-2 rounded-sm z-10" />
      )}
    </span>
  );
};

// ─────────────────────────────────────────────
// COMPOSANT TOOLBAR SMART
// ─────────────────────────────────────────────

const SmartToolbar = ({ currentStyle, onUpdate, onReset, onClose }) => {
  const [activeMenu, setActiveMenu] = useState(null);

  const updateStyle = (key, val) => {
    onUpdate({ ...currentStyle, [key]: val });
  };

  const colors = ["#1e1b4b", "#4f46e5", "#ef4444", "#10b981", "#f59e0b", "#6b7280", "#000000", "#ffffff"];

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="no-print fixed bottom-0 left-0 right-0 z-[300] bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-[32px] md:rounded-2xl md:bottom-24 md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[340px] flex flex-col items-center gap-1 p-4 md:p-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-12 h-1.5 bg-gray-100 rounded-full mb-4 md:hidden" />
      <div className="flex items-center gap-2 w-full p-1 border-b border-gray-100 mb-1">
         <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
            <button onClick={() => updateStyle('fontSize', (currentStyle.fontSize || 12) - 1)} className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-gray-900 transition-all"><ChevronDown size={14}/></button>
            <span className="text-[11px] font-black text-gray-900 px-2 min-w-[24px] text-center">{currentStyle.fontSize || 12}</span>
            <button onClick={() => updateStyle('fontSize', (currentStyle.fontSize || 12) + 1)} className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-gray-900 transition-all"><ChevronUp size={14}/></button>
         </div>

         <div className="flex bg-gray-50 rounded-xl p-1 gap-1">
            <button onClick={() => updateStyle('textAlign', 'left')} className={`p-2 rounded-lg transition-all ${currentStyle.textAlign === 'left' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:bg-white'}`}><AlignLeft size={16}/></button>
            <button onClick={() => updateStyle('textAlign', 'center')} className={`p-2 rounded-lg transition-all ${currentStyle.textAlign === 'center' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:bg-white'}`}><AlignCenter size={16}/></button>
            <button onClick={() => updateStyle('textAlign', 'right')} className={`p-2 rounded-lg transition-all ${currentStyle.textAlign === 'right' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:bg-white'}`}><AlignRight size={16}/></button>
         </div>

         <div className="flex bg-gray-50 rounded-xl p-1 gap-1">
            <button onClick={() => updateStyle('fontWeight', currentStyle.fontWeight === '900' ? '400' : '900')} className={`p-2 rounded-lg transition-all ${currentStyle.fontWeight === '900' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:bg-white'}`}><Bold size={16}/></button>
            <button onClick={() => updateStyle('fontStyle', currentStyle.fontStyle === 'italic' ? 'normal' : 'italic')} className={`p-2 rounded-lg transition-all ${currentStyle.fontStyle === 'italic' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:bg-white'}`}><Italic size={16}/></button>
         </div>

         <button onClick={() => setActiveMenu(activeMenu === 'color' ? null : 'color')} className={`p-2.5 rounded-xl transition-all ${activeMenu === 'color' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-50 hover:text-indigo-600'}`}><Baseline size={18}/></button>
         
         <div className="w-px h-6 bg-gray-100 mx-1" />
         <button onClick={onClose} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><X size={18}/></button>
      </div>

      <AnimatePresence>
        {activeMenu === 'color' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex gap-2 p-3 w-full justify-center bg-gray-50 rounded-2xl overflow-hidden">
            {colors.map(c => (
              <button 
                key={c} 
                onClick={() => { updateStyle('color', c); setActiveMenu(null); }} 
                className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-125 ${currentStyle.color === c ? 'border-white ring-2 ring-indigo-500' : 'border-white/20'}`} 
                style={{ backgroundColor: c }} 
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex items-center justify-between w-full px-4 py-1.5 rounded-b-2xl border-t border-gray-50">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-0.5">
              <button onClick={() => updateStyle('marginTop', (currentStyle.marginTop || 0) - 2)} className="p-1 hover:bg-white rounded transition-colors text-gray-400 hover:text-indigo-600"><ChevronUp size={12}/></button>
              <button onClick={() => updateStyle('marginTop', (currentStyle.marginTop || 0) + 2)} className="p-1 hover:bg-white rounded transition-colors text-gray-400 hover:text-indigo-600"><ChevronDown size={12}/></button>
              <span className="text-[8px] font-black uppercase text-gray-300 ml-1">Décalage</span>
           </div>
           <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
             <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }} className="w-1.5 h-1.5 rounded-full bg-green-500" />
             Édition
           </div>
        </div>
        <button onClick={onReset} className="text-[10px] text-indigo-400 hover:text-indigo-600 font-black uppercase tracking-widest transition-colors">Réinit.</button>
      </div>
    </motion.div>
  );
};

const LogoToolbar = ({ logoConfig, onUpdate, onClose }) => {
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => onUpdate({ ...logoConfig, logoImage: ev.target.result });
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="no-print fixed bottom-0 left-0 right-0 z-[300] bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-[32px] md:rounded-full md:bottom-24 md:left-1/2 md:-translate-x-1/2 md:w-auto px-6 py-6 md:py-2.5 flex flex-col md:flex-row items-center gap-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-12 h-1.5 bg-gray-100 rounded-full mb-2 md:hidden" />
      <button onClick={onClose} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><X size={18}/></button>
      <div className="w-px h-6 bg-gray-100" />
      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-300">Logo</span>
      
      <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-4 py-2 rounded-2xl transition-all border border-indigo-100 bg-indigo-50/30 group">
        <ImageIcon size={18} className="text-indigo-500 group-hover:scale-110 transition-transform" />
        <span className="text-[12px] font-black text-indigo-700 uppercase tracking-wider">Téléverser PNG</span>
        <input type="file" hidden accept="image/png,image/jpeg" onChange={handleImageUpload} />
      </label>

      {logoConfig.logoImage && (
        <button 
          onClick={() => onUpdate({ ...logoConfig, logoImage: null })} 
          className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest px-2"
        >
          Supprimer
        </button>
      )}
    </motion.div>
  );
};

const BgToolbar = ({ config, onUpdate, onClose }) => {
  const colors = ["#ffffff", "#f8fafc", "#f1f5f9", "#fffbeb", "#fef2f2", "#f0fdf4", "#f5f3ff", "#fafafa"];
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => onUpdate({ ...config, pdfBgImage: ev.target.result });
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="no-print fixed bottom-0 left-0 right-0 z-[300] bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-[32px] md:rounded-full md:bottom-24 md:left-1/2 md:-translate-x-1/2 md:w-auto px-6 py-8 md:py-2.5 flex flex-col md:flex-row items-center gap-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-12 h-1.5 bg-gray-100 rounded-full mb-4 md:hidden" />
      <button onClick={onClose} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><X size={18}/></button>
      <div className="w-px h-6 bg-gray-100" />
      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-300">Arrière-Plan PDF</span>
      
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Couleur</span>
        <div className="flex gap-1.5 mt-0.5">
          {colors.map(c => (
             <button 
               key={c} 
               onClick={() => onUpdate({ ...config, pdfBg: c, pdfBgImage: null })} 
               className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-125 ${config.pdfBg === c && !config.pdfBgImage ? 'border-white ring-2 ring-indigo-500 shadow-sm' : 'border-gray-200'}`} 
               style={{ backgroundColor: c }} 
             />
          ))}
          <div className="relative group">
            <input 
              type="color" 
              value={config.pdfBg || "#ffffff"} 
              onChange={(e) => onUpdate({ ...config, pdfBg: e.target.value, pdfBgImage: null })}
              className="w-6 h-6 rounded-full border-2 border-gray-200 cursor-pointer overflow-hidden p-0"
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black text-white text-[8px] font-bold px-1.5 py-0.5 rounded">Custom</div>
          </div>
        </div>
      </div>
      
      <div className="w-px h-6 bg-gray-100 mx-2" />
      
      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded-xl transition-all border border-gray-100">
        <ImageIcon size={16} className="text-gray-400" />
        <span className="text-[11px] font-bold text-gray-600">Photo de fond</span>
        <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
      </label>
      
      {config.pdfBgImage && (
        <button onClick={() => onUpdate({ ...config, pdfBgImage: null })} className="text-[10px] font-bold text-red-500 hover:underline uppercase ml-2">Supprimer photo</button>
      )}
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────

const THEMES = [
  { id: 'indigo', primary: '#4f46e5', secondary: '#7c3aed', gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', text: '#1e1b4b' },
  { id: 'emerald', primary: '#10b981', secondary: '#059669', gradient: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', text: '#064e3b' },
  { id: 'rose', primary: '#f43f5e', secondary: '#e11d48', gradient: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)', text: '#4c0519' },
  { id: 'amber', primary: '#f59e0b', secondary: '#d97706', gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', text: '#451a03' },
  { id: 'slate', primary: '#475569', secondary: '#1e293b', gradient: 'linear-gradient(135deg, #64748b 0%, #334155 100%)', text: '#0f172a' },
  { id: 'electric', primary: '#8b5cf6', secondary: '#d946ef', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', text: '#2e1065' },
  { id: 'ocean', primary: '#0ea5e9', secondary: '#2563eb', gradient: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)', text: '#0c4a6e' },
  { id: 'crimson', primary: '#991b1b', secondary: '#b91c1c', gradient: 'linear-gradient(135deg, #991b1b 0%, #450a0a 100%)', text: '#450a0a' },
  { id: 'gold', primary: '#d97706', secondary: '#92400e', gradient: 'linear-gradient(135deg, #f59e0b 0%, #92400e 100%)', text: '#451a03' },
  { id: 'midnight', primary: '#0f172a', secondary: '#000000', gradient: 'linear-gradient(135deg, #1e293b 0%, #020617 100%)', text: '#020617' },
];

export default function PixiaEditor() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [workspaceBg, setWorkspaceBg] = useState("#f3f4f6");
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [pdfConfig, setPdfConfig] = useState({
    logoImage: null,
    pdfBg: "#ffffff",
    pdfBgImage: null,
    themeId: 'indigo',
    showTechnical: true,
    showInfo: true,
    showTerms: true,
    showBadges: true,
    showSidebar: true
  });
  
  const [styles, setStyles] = useState<Record<string, React.CSSProperties>>({});
  const [selectedId, setSelectedId] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const histRef = useRef({ stack: [DEFAULT_DATA], cursor: 0 });
  
  const [activeDrawer, setActiveDrawer] = useState<'themes' | 'edit' | 'logo' | 'background' | null>(null);
  
  const [zoom, setZoom] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        const docWidth = 820;
        const docHeight = 1160;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // On reserve 120px pour le dock et les paddings
        const availableWidth = screenWidth * 0.95;
        const availableHeight = screenHeight - 160; 
        
        const zoomW = availableWidth / docWidth;
        const zoomH = availableHeight / docHeight;
        
        setZoom(Math.min(zoomW, zoomH));
      } else {
        setZoom(1);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useEffect(() => {
    if (selectedId) {
      if (selectedId === 'logo') setActiveDrawer('logo');
      else if (selectedId === 'pdf_bg') setActiveDrawer('background');
      else setActiveDrawer('edit');
      setIsThemeMenuOpen(false);
    } else {
      setActiveDrawer(null);
    }
  }, [selectedId]);

  const toggleThemeMenu = (e) => {
    e.stopPropagation();
    const next = !isThemeMenuOpen;
    setIsThemeMenuOpen(next);
    if (next) {
        setSelectedId(null);
        setActiveDrawer('themes');
    } else {
        setActiveDrawer(null);
    }
  };

  const currentTheme = THEMES.find(t => t.id === pdfConfig.themeId) || THEMES[0];


  useEffect(() => {
    async function loadData() {
      // Priorité 1: Firestore
      try {
        const firestoreSettings = await getPdfSettings();
        if (firestoreSettings) {
          // Mapper les données Firestore vers le state local
          setData(prev => ({
            ...prev,
            company: {
              ...prev.company,
              name: firestoreSettings.companyName || prev.company.name,
              address: firestoreSettings.address || prev.company.address,
              phone: firestoreSettings.phone || prev.company.phone,
              email: firestoreSettings.email || prev.company.email,
            },
            quote: {
              ...prev.quote,
              title: firestoreSettings.quoteTitle || prev.quote.title,
              numero: firestoreSettings.quoteNumberPrefix ? `${firestoreSettings.quoteNumberPrefix}001` : prev.quote.numero,
            },
            paymentTerms: firestoreSettings.termsAndConditions || prev.paymentTerms
          }));

          setPdfConfig(prev => ({
            ...prev,
            logoImage: firestoreSettings.logoUrl || null,
            pdfBg: firestoreSettings.bgColor || "#ffffff",
            pdfBgImage: firestoreSettings.backgroundUrl || null,
            themeId: firestoreSettings.themeId || 'indigo'
          }));
          return;
        }
      } catch (err) {
        console.error("Failed to load from Firestore:", err);
      }

      // Priorité 2: LocalStorage
      const saved = localStorage.getItem("pixia_doc_v6");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setData(parsed);
          histRef.current = { stack: [parsed], cursor: 0 };
        } catch (e) {}
      }
      const savedConfig = localStorage.getItem("pixia_config_v6");
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setPdfConfig(prev => ({ ...prev, ...parsed }));
      }
      const savedStyles = localStorage.getItem("pixia_styles_v6");
      if (savedStyles) {
        const parsed = JSON.parse(savedStyles);
        setStyles(prev => ({ ...prev, ...parsed }));
      }
      const savedWsBg = localStorage.getItem("pixia_ws_bg_v6");
      if (savedWsBg) setWorkspaceBg(savedWsBg);
    }

    loadData();
  }, []);

  const handleSaveToDev = async () => {
    const settingsToSave = {
      companyName: data.company.name,
      address: data.company.address,
      phone: data.company.phone,
      email: data.company.email,
      logoUrl: pdfConfig.logoImage || undefined,
      quoteTitle: data.quote.title,
      quoteNumberPrefix: data.quote.numero.replace(/[0-9]/g, ''),
      termsAndConditions: data.paymentTerms,
      themeId: pdfConfig.themeId,
      backgroundUrl: pdfConfig.pdfBgImage || undefined,
      bgColor: pdfConfig.pdfBg
    } as Partial<PdfSettings>;

    const res = await updatePdfSettings(settingsToSave);
    if (res.success) {
      toast.success("Modifications sauvegardées avec succès !");
    } else {
      toast.error("Erreur lors de la sauvegarde : " + res.error);
    }
  };

  const handleRestore = async () => {
    const firestoreSettings = await getPdfSettings();
    if (firestoreSettings) {
      setData(prev => ({
        ...prev,
        company: {
          ...prev.company,
          name: firestoreSettings.companyName || prev.company.name,
          address: firestoreSettings.address || prev.company.address,
          phone: firestoreSettings.phone || prev.company.phone,
          email: firestoreSettings.email || prev.company.email,
        },
        quote: {
          ...prev.quote,
          title: firestoreSettings.quoteTitle || prev.quote.title,
          numero: firestoreSettings.quoteNumberPrefix ? `${firestoreSettings.quoteNumberPrefix}001` : prev.quote.numero,
        },
        paymentTerms: firestoreSettings.termsAndConditions || prev.paymentTerms
      }));

      setPdfConfig(prev => ({
        ...prev,
        logoImage: firestoreSettings.logoUrl || null,
        pdfBg: firestoreSettings.bgColor || "#ffffff",
        pdfBgImage: firestoreSettings.backgroundUrl || null,
        themeId: firestoreSettings.themeId || 'indigo'
      }));
      toast.success("Version sauvegardée restaurée !");
    } else {
      toast.error("Aucune sauvegarde trouvée.");
    }
  };

  const persist = (nextData, nextPdfConfig = pdfConfig, nextStyles = styles) => {
    localStorage.setItem("pixia_doc_v6", JSON.stringify(nextData));
    localStorage.setItem("pixia_config_v6", JSON.stringify(nextPdfConfig));
    localStorage.setItem("pixia_styles_v6", JSON.stringify(nextStyles));
  };

  const update = (path, value) => {
    setData((prev) => {
      const next = deepSet(prev, path, value);
      if (path.includes('items') || path.includes('summary')) {
        const parse = (v) => {
          if (typeof v === 'number') return v;
          const n = parseFloat(String(v).replace(/[^-0-9.]/g, ''));
          return isNaN(n) ? 0 : n;
        };
        const subTotal = next.items.reduce((acc, it) => acc + (parse(it.qty) * parse(it.unitPrice)), 0);
        next.summary.sousTotal = subTotal;
        const totalHT = subTotal + parse(next.summary.installation) + parse(next.summary.livraison);
        next.summary.totalTTC = totalHT; // Keep the property name for backward compatibility but it holds HT value now
      }
      persist(next, pdfConfig, styles);
      const { stack, cursor } = histRef.current;
      const newStack = [...stack.slice(0, cursor + 1), next].slice(-50);
      histRef.current = { stack: newStack, cursor: newStack.length - 1 };
      setCanUndo(newStack.length > 1);
      return next;
    });
  };

  const updatePdfConfig = (next) => {
    setPdfConfig(next);
    persist(data, next, styles);
  };

  const updateStyle = (id, s) => {
    const next = { ...styles, [id]: s };
    setStyles(next);
    persist(data, pdfConfig, next);
  };

  const resetStyles = (id) => {
    const next = { ...styles };
    delete next[id];
    setStyles(next);
    persist(data, pdfConfig, next);
  };

  const undo = () => {
    const { stack, cursor } = histRef.current;
    if (cursor > 0) {
      const prev = stack[cursor - 1];
      histRef.current.cursor = cursor - 1;
      setData(prev);
      persist(prev, pdfConfig, styles);
      setCanUndo(histRef.current.cursor > 0);
    }
  };

  const resetAll = () => {
    const defaultConfig = {
      logoImage: null,
      pdfBg: "#ffffff",
      pdfBgImage: null,
      themeId: 'indigo',
      showTechnical: true,
      showInfo: true,
      showTerms: true,
      showBadges: true,
      showSidebar: true
    };
    const freshData = JSON.parse(JSON.stringify(DEFAULT_DATA));
    setData(freshData);
    setStyles({});
    setPdfConfig(defaultConfig);
    localStorage.clear();
    histRef.current = { stack: [freshData], cursor: 0 };
    setSelectedId(null);
    setCanUndo(false);
  };

  return (
    <main 
      className={`flex flex-col items-center selection:bg-indigo-100 transition-all duration-700 relative ${isMobile ? 'h-screen overflow-hidden justify-center p-0' : 'min-h-screen pt-10 pb-40'}`}
      style={{ backgroundColor: workspaceBg }}
      onClick={() => setSelectedId(null)}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        @media print {
          .no-print { display: none !important; }
          main { background: white !important; padding: 0 !important; display: block !important; }
          .document-shadow { box-shadow: none !important; margin: 0 !important; }
        }
        @media (max-width: 1024px) {
          .document-shadow { 
            transform-origin: top center;
          }
        }
        @media (max-width: 640px) {
          .document-shadow { 
            transform-origin: top center;
          }
          .no-print.fixed {
            bottom: 20px;
            top: auto;
            right: 50%;
            transform: translateX(50%);
            width: 95%;
            justify-content: space-around;
          }
        }
        .zoom-controls {
          position: fixed;
          bottom: 100px;
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 200;
        }
      `}} />

      {isMobile && (
        <div className="no-print zoom-controls">
          <button 
            onClick={(e) => { e.stopPropagation(); setZoom(prev => Math.min(prev + 0.1, 2)); }}
            className="w-12 h-12 bg-white border border-slate-200 shadow-xl rounded-2xl flex items-center justify-center text-slate-600 active:scale-90 transition-all"
          >
            <Maximize size={20} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setZoom(prev => Math.max(prev - 0.1, 0.3)); }}
            className="w-12 h-12 bg-white border border-slate-200 shadow-xl rounded-2xl flex items-center justify-center text-slate-600 active:scale-90 transition-all"
          >
            <Zap size={20} className="rotate-45" />
          </button>
          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl px-2 py-1 text-[10px] font-black text-slate-400 text-center uppercase tracking-tighter">
            {Math.round(zoom * 100)}%
          </div>
        </div>
      )}

      {/* ACTIONS GROUPÉES (Thèmes PDF, Undo, Reset) */}
      <div className="no-print fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-[100]">
        <div className="flex items-center gap-1.5 bg-white border border-gray-100 shadow-2xl rounded-3xl p-1.5 backdrop-blur-xl">
          <div className="relative">
            <button 
              onClick={toggleThemeMenu}
              className={`p-2.5 rounded-2xl transition-all flex items-center gap-2 ${activeDrawer === 'themes' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Thèmes"
            >
              <Palette size={18} />
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Thèmes</span>
            </button>

            {/* Desktop Theme Menu */}
            <AnimatePresence>
              {!isMobile && activeDrawer === 'themes' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-3 p-3 bg-white border border-gray-100 shadow-2xl rounded-2xl min-w-[220px] grid grid-cols-5 gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="col-span-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 px-1">Choisir un thème</div>
                  {THEMES.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => { updatePdfConfig({ ...pdfConfig, themeId: t.id }); setIsThemeMenuOpen(false); setActiveDrawer(null); }} 
                      className={`w-8 h-8 rounded-full border-2 transition-all ${pdfConfig.themeId === t.id ? 'ring-2 ring-indigo-100 border-indigo-600 scale-110 shadow-lg' : 'border-gray-100 hover:scale-105'}`} 
                      style={{ background: t.gradient }} 
                      title={`Thème ${t.id}`} 
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-px h-5 bg-gray-100 mx-1" />

          <div className="flex items-center bg-gray-50/50 rounded-2xl p-1">
            <button 
              onClick={() => updatePdfConfig({ ...pdfConfig, showTechnical: !pdfConfig.showTechnical })}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 ${pdfConfig.showTechnical ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="Détails techniques"
            >
              <Settings2 size={16} />
              <span className="text-[10px] font-bold uppercase">Tech</span>
            </button>
            <button 
              onClick={() => updatePdfConfig({ ...pdfConfig, showInfo: !pdfConfig.showInfo })}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 ${pdfConfig.showInfo ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="Information"
            >
              <Info size={16} />
              <span className="text-[10px] font-bold uppercase">Info</span>
            </button>
            <button 
              onClick={() => updatePdfConfig({ ...pdfConfig, showTerms: !pdfConfig.showTerms })}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 ${pdfConfig.showTerms ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="Paiement"
            >
              <FileText size={16} />
              <span className="text-[10px] font-bold uppercase">Paiem.</span>
            </button>
            <button 
              onClick={() => updatePdfConfig({ ...pdfConfig, showBadges: !pdfConfig.showBadges })}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 ${pdfConfig.showBadges ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="Certificats"
            >
              <CheckSquare size={16} />
              <span className="text-[10px] font-bold uppercase">Certif.</span>
            </button>
            <button 
              onClick={() => updatePdfConfig({ ...pdfConfig, showSidebar: !pdfConfig.showSidebar })}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 ${pdfConfig.showSidebar ? 'bg-white text-slate-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="Barre latérale"
            >
              <Columns size={16} />
              <span className="text-[10px] font-bold uppercase">Barre</span>
            </button>
          </div>

          <div className="w-px h-5 bg-gray-100 mx-1" />

          <div className="flex items-center gap-1">
            <button onClick={undo} disabled={!canUndo} title="Annuler" className={`p-2.5 rounded-xl transition-all ${canUndo ? "text-indigo-600 hover:bg-indigo-50" : "text-gray-200"}`}><Undo2 size={18} /></button>
            <button onClick={handleSaveToDev} title="Sauvegarder pour Dev" className="p-2.5 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"><Download size={18} /></button>
            <button onClick={handleRestore} title="Restaurer la version sauvegardée" className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><RotateCcw size={18} /></button>
            <button onClick={resetAll} title="Réinitialiser tout par défaut" className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><RotateCcw size={18} /></button>
          </div>
        </div>
      </div>

      {/* DOCUMENT A4 WRAPPER FOR SCALING */}
      <div 
        className={`${isMobile ? 'relative' : 'relative shrink-0'}`}
        style={{ 
          width: isMobile ? `${820 * zoom}px` : "auto", 
          height: isMobile ? `${1160 * zoom}px` : "auto",
          transition: 'all 0.5s ease'
        }}
      >
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
            opacity: 1, 
            y: 0,
            scale: zoom,
            }}
            className={`document-shadow overflow-hidden shrink-0 transition-all cursor-default origin-top ${isMobile ? 'absolute top-0 left-1/2 -translate-x-1/2' : 'relative'}`}
            style={{ 
            width: "820px", 
            height: "1160px", 
            aspectRatio: "1 / 1.414", 
            boxShadow: "0 40px 100px rgba(0,0,0,0.3)",
            backgroundColor: pdfConfig.pdfBg,
            backgroundImage: pdfConfig.pdfBgImage ? `url(${pdfConfig.pdfBgImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderColor: selectedId === 'pdf_bg' ? '#4f46e5' : 'transparent',
            borderWidth: '2px',
            borderStyle: selectedId === 'pdf_bg' ? 'dashed' : 'none',
            }}
            onClick={(e) => { e.stopPropagation(); setSelectedId('pdf_bg'); }}
        >
        {pdfConfig.showSidebar && (
          <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ background: currentTheme.gradient }} />
        )}
        <div className={`absolute inset-0 flex flex-col p-10 gap-4 text-[10.5px] ${pdfConfig.showSidebar ? 'left-[5px]' : 'left-0'}`}>
          <div className="flex gap-10 items-start">
            <div className="flex-1 flex items-center gap-6">
              <div 
                className={`w-[80px] h-[80px] flex items-center justify-center relative cursor-pointer group transition-all rounded-xl ${selectedId === 'logo' ? 'ring-2 ring-indigo-500' : 'hover:bg-gray-50'}`}
                onClick={(e) => { e.stopPropagation(); setSelectedId('logo'); }}
              >
                {pdfConfig.logoImage ? (
                  <img src={pdfConfig.logoImage} alt="Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-300">
                    <ImageIcon size={24} />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Logo PNG</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors opacity-0 group-hover:opacity-100 no-print flex items-center justify-center">
                   <Settings2 size={14} className="text-gray-400" />
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <E id="c_name" selectedId={selectedId} setSelectedId={setSelectedId} value={data.company.name} onChange={(v) => update("company.name", v)} elementStyle={styles.c_name} style={{ fontSize: "1.7em", fontWeight: 900, color: currentTheme.text }} />
                <E id="c_tagline" selectedId={selectedId} setSelectedId={setSelectedId} value={data.company.tagline} onChange={(v) => update("company.tagline", v)} elementStyle={styles.c_tagline} style={{ fontSize: "0.9em", fontWeight: 600, color: currentTheme.primary }} className="mb-1" />
                <div className="flex flex-col gap-0.5 text-gray-400 mt-1">
                  <div className="flex items-center gap-1.5"><MapPin size={11} style={{ color: currentTheme.primary }}/><E id="c_addr" selectedId={selectedId} setSelectedId={setSelectedId} value={data.company.address} onChange={(v) => update("company.address", v)} elementStyle={styles.c_addr} /></div>
                  <div className="flex items-center gap-1.5"><Phone size={11} style={{ color: currentTheme.primary }}/><E id="c_ph" selectedId={selectedId} setSelectedId={setSelectedId} value={data.company.phone} onChange={(v) => update("company.phone", v)} elementStyle={styles.c_ph} /></div>
                  <div className="flex items-center gap-1.5"><Mail size={11} style={{ color: currentTheme.primary }}/><E id="c_mail" selectedId={selectedId} setSelectedId={setSelectedId} value={data.company.email} onChange={(v) => update("company.email", v)} elementStyle={styles.c_mail} /></div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-3 pt-2">
              <E 
                id="doc_title" 
                selectedId={selectedId} 
                setSelectedId={setSelectedId} 
                value={data.quote?.title || "ESTIMATION"} 
                onChange={(v) => update("quote.title", v)} 
                elementStyle={styles.doc_title} 
                style={{ fontSize: "3.8em", fontWeight: 900, textAlign: "right", color: currentTheme.text, lineHeight: 0.8, letterSpacing: "-0.05em" }} 
              />
              <div className="flex gap-2">
                {[ { l: "Numéro", p: "quote.numero", v: data.quote.numero, id: "q_num" }, { l: "Date", p: "quote.date", v: data.quote.date, id: "q_date" }, { l: "Validité", p: "quote.validite", v: data.quote.validite, id: "q_val" } ].map(box => (
                  <div key={box.l} className="border border-gray-200 rounded-lg p-2 text-center min-w-[6.5em] bg-[#fafafa]">
                    <div className="uppercase text-[0.72em] text-gray-400 font-bold tracking-wider mb-0.5">{box.l}</div>
                    <E id={box.id} selectedId={selectedId} setSelectedId={setSelectedId} value={box.v} onChange={(v) => update(box.p, v)} elementStyle={styles[box.id]} style={{ fontSize: "0.88em", fontWeight: 700, color: "#1f2937" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-[#f8f9fc] border border-[#eef0f8] rounded-2xl p-5 flex gap-5 items-start mt-2 group/client transition-all hover:bg-slate-50">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm" style={{ backgroundColor: `${currentTheme.primary}10`, color: currentTheme.primary }}>
              <User size={24} strokeWidth={2.5} />
            </div>
            <div className="flex-1 flex flex-col gap-0">
              <span className="uppercase text-[0.72em] text-gray-400 font-black tracking-[0.1em]">Client Destinataire</span>
              <E id="cl_name" selectedId={selectedId} setSelectedId={setSelectedId} value={data.client.name} onChange={(v) => update("client.name", v)} elementStyle={styles.cl_name} style={{ fontSize: "1.6em", fontWeight: 900, color: currentTheme.text, letterSpacing: "-0.02em", marginBottom: "1px" }} />
              
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center gap-2 text-gray-500 overflow-hidden">
                  <MapPin size={12} className="shrink-0" style={{ color: currentTheme.primary }} />
                  <div className="flex gap-1 items-center truncate">
                    <E id="cl_addr" selectedId={selectedId} setSelectedId={setSelectedId} value={data.client.address} onChange={(v) => update("client.address", v)} elementStyle={styles.cl_addr} style={{ fontWeight: 500, fontSize: "0.95em" }} />
                    <span className="text-gray-300">|</span>
                    <E id="cl_city" selectedId={selectedId} setSelectedId={setSelectedId} value={data.client.city} onChange={(v) => update("client.city", v)} elementStyle={styles.cl_city} style={{ fontWeight: 500, fontSize: "0.95em" }} />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-gray-500">
                  <Phone size={12} className="shrink-0" style={{ color: currentTheme.primary }} />
                  <E id="cl_ph" selectedId={selectedId} setSelectedId={setSelectedId} value={data.client.phone} onChange={(v) => update("client.phone", v)} elementStyle={styles.cl_ph} style={{ fontWeight: 500, fontSize: "0.95em" }} />
                </div>

                <div className="flex items-center gap-2 text-gray-500">
                  <Mail size={12} className="shrink-0" style={{ color: currentTheme.primary }} />
                  <E id="cl_em" selectedId={selectedId} setSelectedId={setSelectedId} value={data.client.email || "contact@client.fr"} onChange={(v) => update("client.email", v)} elementStyle={styles.cl_em} style={{ fontWeight: 500, fontSize: "0.95em" }} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col mt-4">
            <div 
              className="grid grid-cols-[3em_1fr_4em_8em_9em] border-b-2 py-2 px-2 font-black text-[0.75em] uppercase tracking-[0.15em]"
              style={{ borderColor: currentTheme.primary, color: currentTheme.text }}
            >
              <span>#</span>
              <span>Description détaillée</span>
              <span className="text-right">Qté</span>
              <span className="text-right">Unit. HT</span>
              <span className="text-right">Total HT</span>
            </div>
            {data.items.map((item, idx) => (
              <div 
                key={item.id} 
                className="grid grid-cols-[3em_1fr_4em_8em_9em] items-start py-3 px-2 border-b border-gray-100 transition-colors hover:bg-gray-50/50"
              >
                <span 
                  className="text-[0.78em] font-black inline-flex items-center justify-center w-6 h-6 rounded-full mt-0.5"
                  style={{ color: currentTheme.primary, backgroundColor: `${currentTheme.primary}15` }}
                >{(idx + 1).toString().padStart(2, '0')}</span>
                <div className="flex flex-col pr-6">
                  <E 
                    id={`it_desc_${item.id}`} 
                    selectedId={selectedId} 
                    setSelectedId={setSelectedId} 
                    value={item.description} 
                    onChange={(v) => update(`items[${idx}].description`, v)} 
                    elementStyle={styles[`it_desc_${item.id}`]} 
                    style={{ fontSize: "1.1em", fontWeight: 800, color: "#1e293b", marginBottom: "2px" }} 
                  />
                  <E 
                    id={`it_det_${item.id}`} 
                    selectedId={selectedId} 
                    setSelectedId={setSelectedId} 
                    value={item.details} 
                    onChange={(v) => update(`items[${idx}].details`, v)} 
                    elementStyle={styles[`it_det_${item.id}`]} 
                    multiline
                    style={{ fontSize: "0.82em", color: "#64748b", lineHeight: "1.4" }} 
                  />
                </div>
                <E 
                  id={`it_qty_${item.id}`} 
                  selectedId={selectedId} 
                  setSelectedId={setSelectedId} 
                  value={String(item.qty)} 
                  onChange={(v) => update(`items[${idx}].qty`, v)} 
                  elementStyle={styles[`it_qty_${item.id}`]} 
                  style={{ textAlign: "right", fontWeight: 900, color: "#1e293b", fontSize: "1.1em" }} 
                />
                <div className="flex flex-col items-end">
                  <E 
                    id={`it_pr_${item.id}`} 
                    selectedId={selectedId} 
                    setSelectedId={setSelectedId} 
                    value={fmt(item.unitPrice).replace(' €', '')} 
                    onChange={(v) => update(`items[${idx}].unitPrice`, v.replace(/[^-0-9,.]/g, '').replace(',', '.'))} 
                    elementStyle={styles[`it_pr_${item.id}`]} 
                    style={{ textAlign: "right", color: "#475569", fontWeight: 600, fontSize: "1em" }} 
                  />
                  <span className="text-[0.65em] font-bold text-gray-400 mt-0.5 uppercase tracking-tighter">EUROS</span>
                </div>
                <div className="text-right">
                  <span className="text-[1.2em] font-black tracking-tight" style={{ color: currentTheme.text }}>
                    {fmt(item.qty * item.unitPrice)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 flex flex-col gap-10 mt-8">
            <div className="grid grid-cols-2 gap-8 items-stretch">
              {/* Left Column: Technical Details */}
              <div className={`space-y-4 flex flex-col ${!pdfConfig.showTechnical ? 'invisible' : ''}`}>
                {pdfConfig.showTechnical && (
                  <>
                    <div className="flex items-center gap-2 pb-1.5 mb-2 border-b border-blue-100 shrink-0">
                      <Cpu size={14} className="text-blue-500" />
                      <span className="text-[0.75em] font-black uppercase tracking-widest text-slate-800">DÉTAILS TECHNIQUES</span>
                    </div>
                    
                    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex-1">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {[ 
                          { label: "SURFACE TOTALE:", key: "surface", id: "tech_s", icon: Maximize, color: "#3b82f6" },
                          { label: "RÉSOLUTION:", key: "resolution", id: "tech_r", icon: Monitor, color: "#a855f7" },
                          { label: "NOMBRE DE MODULES LED:", key: "modules", id: "tech_m", icon: Cpu, color: "#ec4899" },
                          { label: "PUISSANCE MAXIMALE:", key: "puissanceMax", id: "tech_p", icon: Zap, color: "#22c55e" },
                          { label: "PUISSANCE MOYENNE:", key: "puissanceMoy", id: "tech_pm", icon: Zap, color: "#3b82f6" },
                          { label: "DISJONCTEUR RECOMMANDÉ:", key: "disjoncteur", id: "tech_d", icon: Zap, color: "#f97316" },
                          { label: "TYPE DE PROJET:", key: "typeProjet", id: "tech_tp", icon: Truck, color: "#f97316" },
                          { label: "ENVIRONNEMENT:", key: "environnement", id: "tech_env", icon: Sun, color: "#14b8a6" },
                          { label: "DISTANCE DE VISIONNAGE:", key: "distance", id: "tech_dist", icon: Eye, color: "#06b6d4" },
                          { label: "PIXEL PITCH:", key: "pitch", id: "tech_pitch", icon: Grid3X3, color: "#ef4444" }
                        ].map((r, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div 
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" 
                              style={{ backgroundColor: `${r.color}10` }}
                            >
                              <r.icon size={15} style={{ color: r.color }} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.5em] text-gray-400 font-bold tracking-wider uppercase">{r.label}</span>
                              <div className="flex items-baseline gap-1">
                                <E 
                                  id={r.id} 
                                  selectedId={selectedId} 
                                  setSelectedId={setSelectedId} 
                                  value={String(data.technical?.[r.key] || "-")} 
                                  onChange={v => update(`technical.${r.key}`, v)} 
                                  elementStyle={styles[r.id]} 
                                  style={{ fontSize: "0.78em", fontWeight: 800, color: "#1e293b" }} 
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Right Column: Recapitulatif */}
              <div className="space-y-4 flex flex-col">
                <div className="flex items-center gap-2 pb-1.5 mb-2 border-b border-orange-100 shrink-0">
                  <BarChart3 size={14} className="text-orange-500" />
                  <span className="text-[0.75em] font-black uppercase tracking-widest text-slate-800">RÉCAPITULATIF</span>
                </div>
                
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-8 flex-1 flex flex-col justify-between">
                  <div className="flex flex-col gap-5 px-1">
                    {[ 
                      ["Sous-total HT", data.summary.sousTotal, "sum_st"], 
                      ["Installation", data.summary.installation, "sum_ins"], 
                      ["Livraison", data.summary.livraison, "sum_liv"], 
                    ].map(r => (
                      <div key={r[0] as string} className="flex justify-between items-center text-[0.78em]">
                        <span className="text-slate-500 font-medium">{r[0]}</span>
                        <E 
                          id={r[2] as string} 
                          selectedId={selectedId} 
                          setSelectedId={setSelectedId} 
                          value={fmt(r[1])} 
                          onChange={(v) => update(`summary.${(r[2] as string).replace('sum_','')}`, v.replace(/[^-0-9,.]/g, '').replace(',', '.'))} 
                          elementStyle={styles[r[2] as string]} 
                          style={{ fontWeight: 800, textAlign: "right", color: "#0f172a" }} 
                        />
                      </div>
                    ))}

                  </div>
                  
                  <div className="mt-8 rounded-xl p-5 flex justify-between items-center text-white shadow-md mx-[-2px]" style={{ background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.primary}dd 100%)` }}>
                    <div className="flex flex-col">
                      <span className="text-[0.65em] font-black uppercase tracking-widest opacity-90">TOTAL</span>
                      <span className="text-[1.1em] font-black uppercase tracking-tight">HT</span>
                    </div>
                    <E 
                      id="total_val" 
                      selectedId={selectedId} 
                      setSelectedId={setSelectedId} 
                      value={fmt(data.summary.totalTTC)} 
                      onChange={(v) => update("summary.totalTTC", v.replace(/[^-0-9,.]/g, '').replace(',', '.'))} 
                      elementStyle={styles.total_val} 
                      style={{ fontSize: "1.6em", fontWeight: 900, textAlign: "right", color: "white", letterSpacing: "-0.04em" }} 
                    />

                  </div>
                </div>
              </div>
            </div>

            {/* Legal / Notes - Side by Side */}
            <div className="grid grid-cols-2 gap-8">
              {pdfConfig.showInfo && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-3 group transition-all">
                  <div className="flex items-center gap-2 font-extrabold text-[0.78em] uppercase tracking-widest" style={{ color: currentTheme.primary }}>
                    <Info size={14} className="stroke-[3]" />
                    <span>Information</span>
                  </div>
                  <E id="inf" selectedId={selectedId} setSelectedId={setSelectedId} value={data.information} onChange={(v) => update("information", v)} elementStyle={styles.inf} multiline style={{ fontSize: "0.85em", color: "#64748b", lineHeight: "1.4", fontWeight: 500 }} />
                </motion.div>
              )}
              {pdfConfig.showTerms && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-3 group transition-all">
                  <div className="flex items-center gap-2 font-extrabold text-[0.78em] uppercase tracking-widest" style={{ color: currentTheme.primary }}>
                    <FileText size={14} className="stroke-[3]" />
                    <span>Conditions de paiement</span>
                  </div>
                  <E id="tems" selectedId={selectedId} setSelectedId={setSelectedId} value={data.paymentTerms} onChange={(v) => update("paymentTerms", v)} elementStyle={styles.tems} multiline style={{ fontSize: "0.85em", color: "#64748b", lineHeight: "1.4", fontWeight: 500 }} />
                </motion.div>
              )}
            </div>
          </div>
          
          {pdfConfig.showBadges && (
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              {(data.badges || []).map((badge, idx) => {
                const BadgeIcon = { CheckSquare, Heart, Lock, Diamond }[badge.icon] || Info;
                const colors = {
                  CheckSquare: { bg: "#ecfdf5", icon: "#10b981", border: "#d1fae5" },
                  Heart: { bg: "#eff6ff", icon: "#3b82f6", border: "#dbeafe" },
                  Diamond: { bg: "#eff6ff", icon: "#3b82f6", border: "#dbeafe" },
                  Lock: { bg: "#fff7ed", icon: "#f59e0b", border: "#ffedd5" }
                };
                const config = colors[badge.icon] || { bg: "#f8fafc", icon: "#64748b", border: "#f1f5f9" };
                
                return (
                  <div 
                    key={badge.id} 
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-sm transition-all"
                    style={{ backgroundColor: "white", borderColor: "#f1f5f9" }}
                  >
                    <BadgeIcon size={14} style={{ color: config.icon }} strokeWidth={3} />
                    <E 
                      id={`badge_${badge.id}`}
                      selectedId={selectedId}
                      setSelectedId={setSelectedId}
                      value={badge.text}
                      onChange={(v) => update(`badges[${idx}].text`, v)}
                      elementStyle={styles[`badge_${badge.id}`]}
                      style={{ fontSize: "11px", fontWeight: 700, color: "#475569", whiteSpace: "nowrap" }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
      </div>

      {/* TOOLBARS CONTEXTUELLES */}
      <AnimatePresence mode="wait">
        {activeDrawer === 'logo' && (
          <LogoToolbar
            key="logo-bar"
            logoConfig={pdfConfig}
            onUpdate={updatePdfConfig}
            onClose={() => setSelectedId(null)}
          />
        )}
        {activeDrawer === 'background' && (
          <BgToolbar
            key="bg-bar"
            config={pdfConfig}
            onUpdate={updatePdfConfig}
            onClose={() => setSelectedId(null)}
          />
        )}
        {activeDrawer === 'edit' && selectedId && (
          <SmartToolbar
            key="text-bar"
            currentStyle={styles[selectedId] || {}}
            onUpdate={(s) => updateStyle(selectedId, s)}
            onReset={() => resetStyles(selectedId)}
            onClose={() => setSelectedId(null)}
          />
        )}
        {isMobile && activeDrawer === 'themes' && (
            <motion.div
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="no-print fixed bottom-0 left-0 right-0 z-[300] bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-[32px] p-6 pb-10 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6 shrink-0" />
                <div className="text-sm font-black uppercase tracking-[0.2em] text-gray-300 mb-6 text-center">Choisir un Thème</div>
                <div className="grid grid-cols-5 gap-4 overflow-y-auto max-h-[40vh] p-2">
                    {THEMES.map(t => (
                        <button 
                            key={t.id} 
                            onClick={() => { updatePdfConfig({ ...pdfConfig, themeId: t.id }); setActiveDrawer(null); }} 
                            className={`aspect-square rounded-2xl border-4 transition-all ${pdfConfig.themeId === t.id ? 'border-indigo-600 scale-105 shadow-xl shadow-indigo-100' : 'border-gray-50'}`} 
                            style={{ background: t.gradient }} 
                        />
                    ))}
                </div>
                <Button variant="ghost" className="mt-6 w-full rounded-2xl py-6 font-bold text-gray-400" onClick={() => setActiveDrawer(null)}>Fermer</Button>
            </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
