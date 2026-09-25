'use client';

import React, { useState } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import { CMS_LANGUAGES, CMS_SOURCE_LANG, getCmsFieldTranslation } from '@/lib/site-web/cms-i18n';
import { Globe, Sparkles, Check, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Lock } from 'lucide-react';

interface I18nFieldEditorProps {
  label: string;
  sectionKey: string;
  fieldKey: string;
  isTextarea?: boolean;
  rows?: number;
  placeholder?: string;
  helperText?: string;
  inputClassName?: string;
}

export const I18nFieldEditor: React.FC<I18nFieldEditorProps> = ({
  label,
  sectionKey,
  fieldKey,
  isTextarea = false,
  rows = 3,
  placeholder,
  helperText,
  inputClassName = '',
}) => {
  const {
    currentLang,
    currentPageData,
    updateSectionFieldLocalized,
    autoTranslateField,
  } = useCms();

  const [expanded, setExpanded] = useState<boolean>(false);
  const [translatingLang, setTranslatingLang] = useState<string | null>(null);
  const [isTranslatingAll, setIsTranslatingAll] = useState<boolean>(false);

  const section = (currentPageData?.sections?.[sectionKey] as Record<string, unknown> | undefined) || {};

  // Données de la langue active
  const activeTrans = getCmsFieldTranslation(section, fieldKey, currentLang);
  const activeValue = activeTrans.value;

  // Calcul du résumé des statuts pour les autres langues
  const otherLangs = CMS_LANGUAGES.filter((l) => l.code !== currentLang);
  const stats = otherLangs.reduce(
    (acc, l) => {
      const trans = getCmsFieldTranslation(section, fieldKey, l.code);
      if (trans.status === 'manual') acc.manual++;
      else if (trans.status === 'translated') acc.translated++;
      else acc.missing++;
      return acc;
    },
    { manual: 0, translated: 0, missing: 0 }
  );

  const handleActiveChange = (val: string) => {
    updateSectionFieldLocalized(sectionKey, fieldKey, val, currentLang, true);
  };

  const handleTranslateOne = async (targetLang: string) => {
    try {
      setTranslatingLang(targetLang);
      await autoTranslateField(sectionKey, fieldKey, [targetLang]);
    } finally {
      setTranslatingLang(null);
    }
  };

  const handleTranslateMissing = async () => {
    try {
      setIsTranslatingAll(true);
      await autoTranslateField(sectionKey, fieldKey);
    } finally {
      setIsTranslatingAll(false);
    }
  };

  const activeLangConfig = CMS_LANGUAGES.find((l) => l.code === currentLang) || CMS_LANGUAGES[0];

  return (
    <div className="space-y-1.5 p-2 rounded-lg bg-[#141412] border border-[#222220] transition-colors">
      {/* Header avec label et switch d'accordéon multilingue */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-[10px] font-mono text-[#9A9A94] uppercase tracking-wider flex items-center gap-1.5">
          <span>{label}</span>
          <span className="text-[9px] px-1 py-0.2 bg-[#222220] text-[#C3F910] rounded font-bold">
            {activeLangConfig.flag} {activeLangConfig.code.toUpperCase()}
          </span>
        </label>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-1 text-[9.5px] font-mono px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
            expanded
              ? 'bg-[#C3F910]/20 text-[#C3F910]'
              : 'bg-[#1E1E1C] text-[#888] hover:text-white hover:bg-[#282826]'
          }`}
          title="Ouvrir le panneau des traductions"
        >
          <Globe className="w-3 h-3" />
          <span>Traductions</span>
          {stats.missing > 0 ? (
            <span className="text-[#E5A83B] font-bold">({stats.missing} ⚠)</span>
          ) : (
            <span className="text-[#3DD68C] font-bold">✓</span>
          )}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Input principal pour la langue active */}
      {isTextarea ? (
        <textarea
          rows={rows}
          value={activeValue}
          onChange={(e) => handleActiveChange(e.target.value)}
          placeholder={placeholder || `Texte en ${activeLangConfig.label}...`}
          dir={activeLangConfig.dir || 'ltr'}
          className={`w-full bg-[#181816] border border-[#2B2B28] rounded p-2 text-white text-xs leading-relaxed focus:border-[#C3F910] focus:outline-none transition-colors ${inputClassName}`}
        />
      ) : (
        <input
          type="text"
          value={activeValue}
          onChange={(e) => handleActiveChange(e.target.value)}
          placeholder={placeholder || `Texte en ${activeLangConfig.label}...`}
          dir={activeLangConfig.dir || 'ltr'}
          className={`w-full bg-[#181816] border border-[#2B2B28] rounded p-2 text-white text-xs focus:border-[#C3F910] focus:outline-none transition-colors ${inputClassName}`}
        />
      )}

      {helperText && <p className="text-[9.5px] text-[#666] font-mono">{helperText}</p>}

      {/* Accordéon Multilingue détaillé */}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-[#262624] space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[9px] font-mono px-1">
            <span className="text-[#7A7A76] uppercase">Traductions synchronisées</span>
            {stats.missing > 0 && (
              <button
                type="button"
                onClick={handleTranslateMissing}
                disabled={isTranslatingAll}
                className="flex items-center gap-1 text-[#C3F910] hover:underline cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-2.5 h-2.5 ${isTranslatingAll ? 'animate-spin' : ''}`} />
                <span>{isTranslatingAll ? 'Traduction en cours...' : 'Traduire les manquantes'}</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {CMS_LANGUAGES.map((langCfg) => {
              if (langCfg.code === currentLang) return null; // déjà affiché en haut
              const trans = getCmsFieldTranslation(section, fieldKey, langCfg.code);
              const isManual = trans.status === 'manual';
              const isTranslated = trans.status === 'translated';
              const isMissing = trans.status === 'missing' || !trans.value || trans.value.trim() === '';
              const isBusy = translatingLang === langCfg.code;

              return (
                <div
                  key={langCfg.code}
                  className="p-1.5 rounded bg-[#10100F] border border-[#1F1F1D] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{langCfg.flag}</span>
                      <span className="font-mono text-[10px] font-bold text-[#EDEBE6]">
                        {langCfg.code.toUpperCase()}
                      </span>
                      <span className="text-[9px] text-[#666]">({langCfg.label})</span>

                      {/* Badge de statut */}
                      {isManual && (
                        <span className="flex items-center gap-0.5 text-[8.5px] font-mono px-1 py-0.2 rounded bg-[#0E351F] text-[#3DD68C] border border-[#165633]" title="Traduction manuelle sanctuarisée — jamais écrasée automatiquement">
                          <Lock className="w-2 h-2" />
                          <span>Manuel</span>
                        </span>
                      )}
                      {isTranslated && (
                        <span className="flex items-center gap-0.5 text-[8.5px] font-mono px-1 py-0.2 rounded bg-[#0E273A] text-[#3DB9E5] border border-[#16415E]" title="Traduction automatique générée">
                          <Check className="w-2 h-2" />
                          <span>Traduit</span>
                        </span>
                      )}
                      {isMissing && (
                        <span className="flex items-center gap-0.5 text-[8.5px] font-mono px-1 py-0.2 rounded bg-[#33220A] text-[#E5A83B] border border-[#593C14]" title="Aucune traduction disponible">
                          <AlertCircle className="w-2 h-2" />
                          <span>Manquant</span>
                        </span>
                      )}
                    </div>

                    {/* Bouton de traduction individuelle */}
                    <button
                      type="button"
                      onClick={() => handleTranslateOne(langCfg.code)}
                      disabled={isBusy || !activeValue}
                      className="flex items-center gap-1 text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-[#1C1C1A] text-[#9A9A94] hover:text-[#C3F910] hover:bg-[#252522] disabled:opacity-40 transition-colors cursor-pointer"
                      title={
                        isManual
                          ? "Regénérer par IA (écrasera la saisie manuelle uniquement sur votre clic)"
                          : "Générer la traduction"
                      }
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isBusy ? 'animate-spin' : ''}`} />
                      <span>{isBusy ? '...' : 'Traduire'}</span>
                    </button>
                  </div>

                  {/* Input de traduction éditable manuellement */}
                  <input
                    type="text"
                    value={trans.value}
                    onChange={(e) => {
                      // Toute saisie manuelle dans ce champ devient status 'manual'
                      updateSectionFieldLocalized(sectionKey, fieldKey, e.target.value, langCfg.code, true);
                    }}
                    placeholder={`Traduction en ${langCfg.label}...`}
                    dir={langCfg.dir || 'ltr'}
                    className="w-full bg-[#161614] border border-[#272724] focus:border-[#C3F910] rounded px-2 py-1 text-white text-[11px] outline-none font-sans transition-colors"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
