import React, { useState, useRef } from "react";
import { useCms } from "../../context/CmsContext";
import {
  X,
  Type,
  Image as ImageIcon,
  Palette,
  Server,
  Upload,
  ChevronRight,
  Maximize2,
  Minimize2,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
} from "lucide-react";

interface ElementorDrawerProps {
  onOpenBackendModal: () => void;
}

export const ElementorDrawer: React.FC<ElementorDrawerProps> = ({
  onOpenBackendModal,
}) => {
  const {
    isEditing,
    setIsEditing,
    currentPageId,
    pages,
    selectedBlockId,
    setSelectedBlockId,
    activeTab,
    setActiveTab,
    updateSectionField,
    updateNestedField,
    saveCurrentPage,
    uploadMedia,
    saveStatus,
    backendConnected,
    settings,
  } = useCms();

  const [dockPosition, setDockPosition] = useState<"left" | "right">("left");
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isEditing) return null;

  const activePage = pages[currentPageId] || {
    id: currentPageId,
    name: currentPageId,
    slug: "",
    meta: { title: "", description: "" },
    sections: {},
  };

  const sections = activePage.sections || {};
  const currentSectionKey = selectedBlockId || (currentPageId === "home" ? "hero" : "hero");
  const currentSectionData = sections[currentSectionKey] || {};

  // Handle local file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const newUrl = await uploadMedia(file);

      // Determine appropriate image field based on section
      if (currentSectionKey === "hero") {
        updateSectionField("hero", "heroImage", newUrl);
        updateSectionField("hero", "primaryImage", newUrl);
      } else if (currentSectionKey === "overview") {
        updateSectionField("overview", "image", newUrl);
      } else if (currentSectionKey === "design") {
        updateSectionField("design", "image", newUrl);
      } else if (currentSectionKey === "showreel") {
        updateSectionField("showreel", "billboardImage", newUrl);
      } else {
        updateSectionField(currentSectionKey, "image", newUrl);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // List of available sections to edit on this page
  const sectionOptions =
    currentPageId === "home"
      ? [
          { key: "hero", label: "01. Hero & Slider d'accueil" },
          { key: "showreel", label: "02. Showreel 3D (Écran LED)" },
          { key: "markets", label: "03. Marchés (Scroll Horizontal)" },
          { key: "kinetic", label: "04. Kinetic SPKI-250" },
          { key: "manifesto", label: "05. Manifeste & Architecture" },
        ]
      : [
          { key: "hero", label: "00. Hero & En-tête PXT Fine" },
          { key: "overview", label: "01. Aperçu & Châssis" },
          { key: "design", label: "02. Conception & Dimensions" },
          { key: "features", label: "03. Caractéristiques Techniques" },
          { key: "fieldwork", label: "05. Réalisations sur le terrain" },
        ];

  if (isMinimized) {
    return (
      <aside
        aria-label="Contrôle de l'éditeur Elementor réduit"
        className={`fixed bottom-6 ${
          dockPosition === "left" ? "left-6" : "right-6"
        } z-[290] bg-[#141412] text-white border border-[#C3F910] p-3 rounded-xl shadow-2xl flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform`}
        onClick={() => setIsMinimized(false)}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-[#C3F910] animate-pulse" />
        <span className="font-mono text-xs font-bold text-[#C3F910]">
          ELEMENTOR OUVERT
        </span>
        <Maximize2 className="w-4 h-4 text-[#9A9A94]" />
      </aside>
    );
  }

  return (
    <aside
      aria-label="Panneau d'édition Elementor"
      className={`fixed top-11 ${
        dockPosition === "left" ? "left-0" : "right-0"
      } bottom-0 w-full sm:w-[420px] max-w-[95vw] z-[290] bg-[#0E0E0D] border-r sm:border-r border-[#222220] flex flex-col text-[#EDEBE6] font-sans shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-in slide-in-from-left duration-200`}
    >
      {/* Drawer Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#141413] border-b border-[#222220]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-[#C3F910] text-[#080808] flex items-center justify-center font-bold text-xs">
            E
          </div>
          <div>
            <div className="text-[11px] font-mono font-bold tracking-wider text-white">
              ÉDITEUR ELEMENTOR
            </div>
            <div className="text-[10px] text-[#7A7A76] font-mono">
              Pixel Tech Web • Live Editor
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Dock switch */}
          <button
            type="button"
            onClick={() =>
              setDockPosition((prev) => (prev === "left" ? "right" : "left"))
            }
            className="p-1.5 text-[#7A7A76] hover:text-white rounded hover:bg-[#222] transition-colors cursor-pointer"
            title="Changer de côté (Gauche / Droite)"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Minimize */}
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-[#7A7A76] hover:text-white rounded hover:bg-[#222] transition-colors cursor-pointer"
            title="Réduire le panneau"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="p-1.5 text-[#7A7A76] hover:text-white rounded hover:bg-[#222] transition-colors cursor-pointer"
            title="Quitter l'éditeur"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Section Selector Bar */}
      <div className="px-4 py-2.5 bg-[#121211] border-b border-[#222220]">
        <label className="text-[10px] font-mono text-[#7A7A76] block mb-1 uppercase tracking-wider">
          Section en cours d'édition :
        </label>
        <select
          value={currentSectionKey}
          onChange={(e) => setSelectedBlockId(e.target.value)}
          className="w-full bg-[#1A1A18] text-[#F5F4F0] border border-[#2F2F2C] rounded px-2.5 py-1.5 text-xs font-mono focus:border-[#C3F910] focus:outline-none cursor-pointer"
        >
          {sectionOptions.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Elementor Tab Navigation */}
      <div className="flex border-b border-[#222220] bg-[#141413]">
        <button
          type="button"
          onClick={() => setActiveTab("content")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-mono font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === "content"
              ? "border-[#C3F910] text-[#C3F910] bg-[#1A1A18]"
              : "border-transparent text-[#7A7A76] hover:text-white"
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Contenu</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("media")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-mono font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === "media"
              ? "border-[#C3F910] text-[#C3F910] bg-[#1A1A18]"
              : "border-transparent text-[#7A7A76] hover:text-white"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Photos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("style")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-mono font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === "style"
              ? "border-[#C3F910] text-[#C3F910] bg-[#1A1A18]"
              : "border-transparent text-[#7A7A76] hover:text-white"
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Style</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("backend")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-mono font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === "backend"
              ? "border-[#C3F910] text-[#C3F910] bg-[#1A1A18]"
              : "border-transparent text-[#7A7A76] hover:text-white"
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Backend</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* ========================================================
            TAB 1: CONTENU (TEXTES, TITRES, DESCRIPTIONS)
            ======================================================== */}
        {activeTab === "content" && (
          <div className="space-y-4">
            <div className="text-[11px] font-mono text-[#C3F910] font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Édition des Textes</span>
              <span className="text-[#7A7A76] text-[10px]">Aperçu en direct</span>
            </div>

            {/* Badge / Surtitre */}
            {(currentSectionData.badge !== undefined ||
              currentSectionData.eyebrow !== undefined) && (
              <div>
                <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider block mb-1">
                  Surtitre / Badge
                </label>
                <input
                  type="text"
                  value={currentSectionData.badge || currentSectionData.eyebrow || ""}
                  onChange={(e) => {
                    const key = currentSectionData.badge !== undefined ? "badge" : "eyebrow";
                    updateSectionField(currentSectionKey, key, e.target.value);
                  }}
                  className="w-full bg-[#171715] border border-[#2B2B28] rounded p-2 text-white focus:border-[#C3F910] focus:outline-none"
                  placeholder="Ex: 01 / INNOVATION"
                />
              </div>
            )}

            {/* Titre Principal */}
            {currentSectionData.title !== undefined && (
              <div>
                <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider block mb-1">
                  Titre Principal
                </label>
                <input
                  type="text"
                  value={currentSectionData.title || ""}
                  onChange={(e) =>
                    updateSectionField(currentSectionKey, "title", e.target.value)
                  }
                  className="w-full bg-[#171715] border border-[#2B2B28] rounded p-2 text-white font-bold text-sm focus:border-[#C3F910] focus:outline-none"
                  placeholder="Titre de la section..."
                />
              </div>
            )}

            {/* Titres multiples (pour kinetic ou multi-lines) */}
            {currentSectionData.title1 !== undefined && (
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider block">
                  Lignes du Grand Titre (Kinetic)
                </label>
                <input
                  type="text"
                  value={currentSectionData.title1 || ""}
                  onChange={(e) =>
                    updateSectionField(currentSectionKey, "title1", e.target.value)
                  }
                  className="w-full bg-[#171715] border border-[#2B2B28] rounded p-2 text-white focus:border-[#C3F910] focus:outline-none"
                  placeholder="Ligne 1..."
                />
                <input
                  type="text"
                  value={currentSectionData.title2 || ""}
                  onChange={(e) =>
                    updateSectionField(currentSectionKey, "title2", e.target.value)
                  }
                  className="w-full bg-[#171715] border border-[#2B2B28] rounded p-2 text-white focus:border-[#C3F910] focus:outline-none"
                  placeholder="Ligne 2..."
                />
                <input
                  type="text"
                  value={currentSectionData.title3 || ""}
                  onChange={(e) =>
                    updateSectionField(currentSectionKey, "title3", e.target.value)
                  }
                  className="w-full bg-[#171715] border border-[#2B2B28] rounded p-2 text-white focus:border-[#C3F910] focus:outline-none"
                  placeholder="Ligne 3..."
                />
              </div>
            )}

            {/* Sous-titre ou Description */}
            {(currentSectionData.subtitle !== undefined ||
              currentSectionData.description !== undefined ||
              currentSectionData.body !== undefined) && (
              <div>
                <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider block mb-1">
                  Description / Sous-titre
                </label>
                <textarea
                  rows={4}
                  value={
                    currentSectionData.subtitle ||
                    currentSectionData.description ||
                    currentSectionData.body ||
                    ""
                  }
                  onChange={(e) => {
                    const key =
                      currentSectionData.subtitle !== undefined
                        ? "subtitle"
                        : currentSectionData.description !== undefined
                        ? "description"
                        : "body";
                    updateSectionField(currentSectionKey, key, e.target.value);
                  }}
                  className="w-full bg-[#171715] border border-[#2B2B28] rounded p-2 text-white leading-relaxed focus:border-[#C3F910] focus:outline-none"
                  placeholder="Texte explicatif..."
                />
              </div>
            )}

            {/* Boutons d'action CTA */}
            {currentSectionData.primaryCta !== undefined && (
              <div>
                <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider block mb-1">
                  Libellé Bouton Principal
                </label>
                <input
                  type="text"
                  value={currentSectionData.primaryCta || ""}
                  onChange={(e) =>
                    updateSectionField(currentSectionKey, "primaryCta", e.target.value)
                  }
                  className="w-full bg-[#171715] border border-[#2B2B28] rounded p-2 text-[#C3F910] font-bold focus:border-[#C3F910] focus:outline-none"
                />
              </div>
            )}

            {currentSectionData.secondaryCta !== undefined && (
              <div>
                <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider block mb-1">
                  Libellé Bouton Secondaire
                </label>
                <input
                  type="text"
                  value={currentSectionData.secondaryCta || ""}
                  onChange={(e) =>
                    updateSectionField(currentSectionKey, "secondaryCta", e.target.value)
                  }
                  className="w-full bg-[#171715] border border-[#2B2B28] rounded p-2 text-white focus:border-[#C3F910] focus:outline-none"
                />
              </div>
            )}

            {/* Spécifications dimensionnelles (Design section) */}
            {currentSectionData.cabinetDim !== undefined && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#222]">
                <div>
                  <label className="text-[9px] font-mono text-[#7A7A76] uppercase block mb-1">
                    Dimensions Châssis
                  </label>
                  <input
                    type="text"
                    value={currentSectionData.cabinetDim || ""}
                    onChange={(e) =>
                      updateSectionField(currentSectionKey, "cabinetDim", e.target.value)
                    }
                    className="w-full bg-[#171715] border border-[#2B2B28] rounded p-1.5 text-white font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-[#7A7A76] uppercase block mb-1">
                    Poids / Châssis
                  </label>
                  <input
                    type="text"
                    value={currentSectionData.weight || ""}
                    onChange={(e) =>
                      updateSectionField(currentSectionKey, "weight", e.target.value)
                    }
                    className="w-full bg-[#171715] border border-[#2B2B28] rounded p-1.5 text-white font-mono text-[11px]"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: MÉDIAS & PHOTOS (UPLOAD DIRECT & REMPLACEMENT)
            ======================================================== */}
        {activeTab === "media" && (
          <div className="space-y-4">
            <div className="text-[11px] font-mono text-[#C3F910] font-bold uppercase tracking-wider">
              Gestionnaire Médias & Photos
            </div>

            {/* File upload drag-and-drop box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#333330] hover:border-[#C3F910] rounded-lg p-5 text-center cursor-pointer bg-[#141412] transition-colors group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-[#1E1E1C] group-hover:bg-[#C3F910]/20 flex items-center justify-center mx-auto mb-2.5 transition-colors">
                <Upload className="w-5 h-5 text-[#9A9A94] group-hover:text-[#C3F910]" />
              </div>
              <div className="font-semibold text-white text-xs mb-1">
                {uploading
                  ? "Chargement de la photo..."
                  : "Uploader une photo depuis votre ordinateur"}
              </div>
              <div className="text-[10px] text-[#7A7A76]">
                Glissez-déposez ou cliquez ici (PNG, JPG, WebP)
              </div>
            </div>

            {/* Current Image Preview */}
            <div>
              <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider block mb-1.5">
                Image actuelle de cette section
              </label>
              {(() => {
                const currentImg =
                  currentSectionData.heroImage ||
                  currentSectionData.primaryImage ||
                  currentSectionData.image ||
                  currentSectionData.billboardImage;

                return (
                  <div className="space-y-2">
                    <div className="relative aspect-video rounded border border-[#2B2B28] overflow-hidden bg-black flex items-center justify-center">
                      {currentImg ? (
                        <img
                          src={currentImg}
                          alt="Prévisualisation"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[11px] text-[#7A7A76]">
                          Aucune image assignée
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={currentImg || ""}
                      onChange={(e) => {
                        const targetKey =
                          currentSectionData.heroImage !== undefined
                            ? "heroImage"
                            : currentSectionData.image !== undefined
                            ? "image"
                            : currentSectionData.billboardImage !== undefined
                            ? "billboardImage"
                            : "primaryImage";
                        updateSectionField(currentSectionKey, targetKey, e.target.value);
                      }}
                      className="w-full bg-[#171715] border border-[#2B2B28] rounded p-2 text-[11px] font-mono text-white"
                      placeholder="Ou collez une URL d'image directe..."
                    />
                  </div>
                );
              })()}
            </div>

            {/* Texture and overlay settings */}
            <div className="pt-3 border-t border-[#222] space-y-2">
              <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider block">
                Texture & Luminosité Écran LED
              </label>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#9A9A94]">Contraste de matrice :</span>
                <span className="text-[#C3F910] font-mono">Calibré 16-bit</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: STYLE & TYPOGRAPHIE (ELEMENTOR DISCIPLINE)
            ======================================================== */}
        {activeTab === "style" && (
          <div className="space-y-4">
            <div className="text-[11px] font-mono text-[#C3F910] font-bold uppercase tracking-wider">
              Typographie & Couleurs
            </div>

            {/* Accent Color Picker */}
            <div>
              <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider block mb-1.5">
                Couleur d'accent (Vert Signature)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.accentColor || "#C3F910"}
                  onChange={(e) =>
                    updateSectionField(currentSectionKey, "accentColor", e.target.value)
                  }
                  className="w-8 h-8 rounded border border-[#333] cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={settings.accentColor || "#C3F910"}
                  readOnly
                  className="flex-1 bg-[#171715] border border-[#2B2B28] rounded p-1.5 text-xs font-mono text-white"
                />
              </div>
            </div>

            {/* Font size slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider">
                  Taille du Titre
                </label>
                <span className="text-[#C3F910] font-mono text-[11px]">
                  {currentSectionData.titleFontSize || 54}px
                </span>
              </div>
              <input
                type="range"
                min="24"
                max="92"
                value={currentSectionData.titleFontSize || 54}
                onChange={(e) =>
                  updateSectionField(
                    currentSectionKey,
                    "titleFontSize",
                    Number(e.target.value)
                  )
                }
                className="w-full accent-[#C3F910] cursor-pointer"
              />
            </div>

            {/* Text Color Presets */}
            <div>
              <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider block mb-1.5">
                Couleur du Texte
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Blanc", color: "#F5F4F0" },
                  { label: "Vert Diode", color: "#C3F910" },
                  { label: "Gris Titane", color: "#7A7A76" },
                  { label: "Noir Brute", color: "#0A0A09" },
                ].map((preset) => (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() =>
                      updateSectionField(currentSectionKey, "textColor", preset.color)
                    }
                    className="flex flex-col items-center gap-1 p-2 rounded bg-[#171715] border border-[#2B2B28] hover:border-[#C3F910] transition-colors cursor-pointer"
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/40"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span className="text-[9px] text-[#9A9A94] font-mono">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: BACKEND PIXEL TECH WEB & DEV EXPORT
            ======================================================== */}
        {activeTab === "backend" && (
          <div className="space-y-4">
            <div className="text-[11px] font-mono text-[#C3F910] font-bold uppercase tracking-wider">
              Intégration Pixel Tech Web
            </div>

            <div className="bg-[#141412] p-3 rounded border border-[#2B2B28] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#7A7A76] uppercase">
                  Statut Serveur
                </span>
                <span
                  className={`text-[11px] font-mono font-bold flex items-center gap-1.5 ${
                    backendConnected ? "text-[#C3F910]" : "text-amber-400"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      backendConnected ? "bg-[#C3F910]" : "bg-amber-400"
                    } animate-pulse`}
                  />
                  {backendConnected ? "Connecté à Pixel Tech Web" : "Mode Autonome Local"}
                </span>
              </div>
              <div className="text-[10px] text-[#9A9A94] font-mono">
                Endpoint API : {settings.backendApiUrl}
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenBackendModal}
              className="w-full flex items-center justify-center gap-2 bg-[#1C1C1A] hover:bg-[#252522] text-[#EDEBE6] hover:text-[#C3F910] border border-[#333] hover:border-[#C3F910] py-2.5 px-3 rounded font-mono font-bold text-xs transition-colors cursor-pointer"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Ouvrir la Console Développeur & JSON</span>
            </button>
          </div>
        )}
      </div>

      {/* Drawer Bottom Action Bar */}
      <div className="p-4 bg-[#141413] border-t border-[#222220] flex items-center gap-2">
        <button
          type="button"
          onClick={() => saveCurrentPage()}
          disabled={saveStatus === "saving"}
          className="flex-1 flex items-center justify-center gap-2 bg-[#C3F910] hover:bg-[#b0e20e] text-[#080808] font-mono font-bold text-xs py-3 px-4 rounded transition-all cursor-pointer shadow-[0_0_15px_rgba(195,249,16,0.3)]"
        >
          {saveStatus === "saving" ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>SYNCHRONISATION EN COURS...</span>
            </>
          ) : saveStatus === "saved" ? (
            <>
              <Check className="w-4 h-4" />
              <span>PAGE ENREGISTRÉE DANS PIXEL TECH WEB</span>
            </>
          ) : (
            <>
              <span>ENREGISTRER CETTE PAGE</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
