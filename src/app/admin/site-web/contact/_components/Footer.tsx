'use client';
import React, { useState } from 'react';
import { 
  Plus, Trash2, Eye, EyeOff, Edit, 
  ExternalLink, Sparkles, Sliders, Shield
} from 'lucide-react';
import type { PageContentConfig, FooterTagItem, FooterLinkItem, FooterSocialItem } from '@/lib/site-web/types';
import { EditableText } from './EditableText';
import { CardSwitch, CardHiddenNotice } from './CardSwitch';
import { IconRenderer } from './IconRenderer';
import { IconPickerModal } from './IconPickerModal';

interface FooterProps {
  content: PageContentConfig['footer'];
  visibility?: PageContentConfig['visibility'];
  isAdmin?: boolean;
  onUpdateFooter: (patch: Partial<PageContentConfig['footer']>) => void;
  onUpdateVisibility?: (patch: Partial<PageContentConfig['visibility']>) => void;
  onOpenSettings: () => void;
}

type IconEditTarget = {
  type: 'address' | 'phone' | 'email' | 'link' | 'social';
  id?: string;
  currentIcon: string;
  title: string;
};

export const Footer: React.FC<FooterProps> = ({ 
  content, 
  visibility,
  isAdmin = false,
  onUpdateFooter,
  onUpdateVisibility,
  onOpenSettings,
}) => {
  const [iconTarget, setIconTarget] = useState<IconEditTarget | null>(null);

  if (!content) return null;

  if (visibility && !visibility.footerSection && !isAdmin) {
    return null;
  }

  const tags = content.tags || [];
  const links = content.links || [];
  const socials = content.socials || [];

  // Tag Handlers
  const handleUpdateTag = (id: string, text: string) => {
    const updated = tags.map(t => t.id === id ? { ...t, text } : t);
    onUpdateFooter({ tags: updated });
  };

  const handleToggleTag = (id: string) => {
    const updated = tags.map(t => t.id === id ? { ...t, visible: !t.visible } : t);
    onUpdateFooter({ tags: updated });
  };

  const handleAddTag = () => {
    const newTag: FooterTagItem = {
      id: `tag-${Date.now()}`,
      text: 'NOUVELLE GAMME',
      visible: true,
    };
    onUpdateFooter({ tags: [...tags, newTag] });
  };

  const handleDeleteTag = (id: string) => {
    if (tags.length <= 1) return;
    onUpdateFooter({ tags: tags.filter(t => t.id !== id) });
  };

  // Link Handlers
  const handleUpdateLink = (id: string, patch: Partial<FooterLinkItem>) => {
    const updated = links.map(l => l.id === id ? { ...l, ...patch } : l);
    onUpdateFooter({ links: updated });
  };

  const handleAddLink = () => {
    const newLink: FooterLinkItem = {
      id: `link-${Date.now()}`,
      label: 'Nouveau lien rapide',
      url: '#',
      iconName: 'ExternalLink',
      visible: true,
    };
    onUpdateFooter({ links: [...links, newLink] });
  };

  const handleDeleteLink = (id: string) => {
    if (links.length <= 1) return;
    onUpdateFooter({ links: links.filter(l => l.id !== id) });
  };

  // Social Handlers
  const handleUpdateSocial = (id: string, patch: Partial<FooterSocialItem>) => {
    const updated = socials.map(s => s.id === id ? { ...s, ...patch } : s);
    onUpdateFooter({ socials: updated });
  };

  const handleAddSocial = () => {
    const newSocial: FooterSocialItem = {
      id: `soc-${Date.now()}`,
      name: 'Nouveau Réseau',
      url: '#',
      iconName: 'Share2',
      visible: true,
    };
    onUpdateFooter({ socials: [...socials, newSocial] });
  };

  const handleDeleteSocial = (id: string) => {
    if (socials.length <= 1) return;
    onUpdateFooter({ socials: socials.filter(s => s.id !== id) });
  };

  // Icon Selected Callback
  const handleSelectIcon = (newIconName: string) => {
    if (!iconTarget) return;

    if (iconTarget.type === 'address') {
      onUpdateFooter({ addressIcon: newIconName });
    } else if (iconTarget.type === 'phone') {
      onUpdateFooter({ phoneIcon: newIconName });
    } else if (iconTarget.type === 'email') {
      onUpdateFooter({ emailIcon: newIconName });
    } else if (iconTarget.type === 'link' && iconTarget.id) {
      handleUpdateLink(iconTarget.id, { iconName: newIconName });
    } else if (iconTarget.type === 'social' && iconTarget.id) {
      handleUpdateSocial(iconTarget.id, { iconName: newIconName });
    }
  };

  const showTagsRow = visibility?.footerTagsRow ?? true;
  const showCoordsCol = visibility?.footerCoordinatesCol ?? true;
  const showLinksCol = visibility?.footerLinksCol ?? true;
  const showSocialsRow = visibility?.footerSocialsRow ?? true;

  return (
    <>
      <footer className={`border-t border-slate-800 bg-black text-white relative transition-colors ${
        visibility && !visibility.footerSection ? 'opacity-60 border-amber-300 border-dashed' : ''
      }`}>
        {/* Admin Section Master Control */}
        {isAdmin && onUpdateVisibility && visibility && (
          <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
            {!visibility.footerSection && (
              <CardHiddenNotice
                title="Pied de page (Footer)"
                onRestore={() => onUpdateVisibility({ footerSection: true })}
              />
            )}
            <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-tech text-xs text-[#c6ff00] font-bold uppercase tracking-wider">
                  Éditeur du Pied de Page (Footer)
                </span>
                <span className="text-[11px] text-gray-400">
                  • Cliquez sur n'importe quel texte ou icône pour modifier
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <CardSwitch
                  label="Tags"
                  checked={showTagsRow}
                  onChange={(val) => onUpdateVisibility({ footerTagsRow: val })}
                  isAdmin={isAdmin}
                  compact
                />
                <CardSwitch
                  label="Coordonnées"
                  checked={showCoordsCol}
                  onChange={(val) => onUpdateVisibility({ footerCoordinatesCol: val })}
                  isAdmin={isAdmin}
                  compact
                />
                <CardSwitch
                  label="Liens"
                  checked={showLinksCol}
                  onChange={(val) => onUpdateVisibility({ footerLinksCol: val })}
                  isAdmin={isAdmin}
                  compact
                />
                <CardSwitch
                  label="Réseaux"
                  checked={showSocialsRow}
                  onChange={(val) => onUpdateVisibility({ footerSocialsRow: val })}
                  isAdmin={isAdmin}
                  compact
                />
                <CardSwitch
                  label="Footer Entier"
                  checked={visibility.footerSection}
                  onChange={(val) => onUpdateVisibility({ footerSection: val })}
                  isAdmin={isAdmin}
                  compact
                />
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            {/* Col 1: Brand & Description */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center space-x-3">
                <span className="font-tech text-2xl font-bold tracking-widest text-white">
                  <EditableText
                    as="span"
                    value={content.companyName}
                    onChange={(val) => onUpdateFooter({ companyName: val })}
                    isAdmin={isAdmin}
                    label="Nom de l'entreprise"
                  />
                </span>
                <span className="rounded-full bg-[#c6ff00] px-2 py-0.5 font-mono text-[9px] font-black text-black">
                  <EditableText
                    as="span"
                    value={content.badgeText}
                    onChange={(val) => onUpdateFooter({ badgeText: val })}
                    isAdmin={isAdmin}
                    label="Badge pied de page"
                  />
                </span>
              </div>

              <div className="text-xs sm:text-sm leading-relaxed text-slate-400 max-w-md">
                <EditableText
                  as="p"
                  multiline
                  value={content.description}
                  onChange={(val) => onUpdateFooter({ description: val })}
                  isAdmin={isAdmin}
                  label="Description de l'entreprise"
                />
              </div>

              {/* Tags Section */}
              {(showTagsRow || isAdmin) && (
                <div className={`space-y-2 pt-2 ${!showTagsRow ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    {isAdmin && (
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono uppercase text-gray-500 font-bold">
                          Tags Technologies
                        </span>
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#c6ff00] bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition-colors"
                        >
                          <Plus size={10} />
                          <span>Ajouter un tag</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => {
                      if (!tag.visible && !isAdmin) return null;
                      return (
                        <div
                          key={tag.id}
                          className={`group relative rounded-full border px-2.5 py-1 font-mono text-[10px] transition-all flex items-center space-x-1.5 ${
                            !tag.visible
                              ? 'border-dashed border-amber-400/50 bg-amber-400/10 text-amber-200'
                              : 'border-white/20 bg-white/5 text-slate-300 hover:border-white/40'
                          }`}
                        >
                          <EditableText
                            as="span"
                            value={tag.text}
                            onChange={(val) => handleUpdateTag(tag.id, val)}
                            isAdmin={isAdmin}
                            label="Libellé du tag"
                          />
                          {isAdmin && (
                            <div className="flex items-center space-x-1 pl-1 border-l border-white/15">
                              <button
                                type="button"
                                onClick={() => handleToggleTag(tag.id)}
                                className="text-gray-400 hover:text-white"
                                title={tag.visible ? "Masquer ce tag" : "Afficher ce tag"}
                              >
                                {tag.visible ? <Eye size={10} className="text-emerald-400" /> : <EyeOff size={10} className="text-rose-400" />}
                              </button>
                              {tags.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTag(tag.id)}
                                  className="text-gray-400 hover:text-rose-400"
                                  title="Supprimer ce tag"
                                >
                                  <Trash2 size={10} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Col 2: Coordinates with Changeable Icons */}
            {(showCoordsCol || isAdmin) && (
              <div className={`md:col-span-4 space-y-3 ${!showCoordsCol ? 'opacity-50' : ''}`}>
                <h3 className="font-tech text-xs font-bold uppercase tracking-wider text-slate-200">
                  <EditableText
                    as="span"
                    value={content.col2Title}
                    onChange={(val) => onUpdateFooter({ col2Title: val })}
                    isAdmin={isAdmin}
                    label="Titre de la colonne coordonnées"
                  />
                </h3>

                <div className="space-y-3 text-xs text-slate-300">
                  {/* Address Item with icon button */}
                  <div className="flex items-start space-x-2.5 group">
                    <button
                      type="button"
                      onClick={() => {
                        if (isAdmin) {
                          setIconTarget({
                            type: 'address',
                            currentIcon: content.addressIcon || 'MapPin',
                            title: "Changer l'icône de l'adresse",
                          });
                        }
                      }}
                      className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform ${
                        isAdmin 
                          ? 'bg-[#c6ff00]/20 text-[#c6ff00] hover:scale-110 hover:bg-[#c6ff00] hover:text-black cursor-pointer ring-1 ring-[#c6ff00]/40' 
                          : 'text-[#c6ff00]'
                      }`}
                      title={isAdmin ? "Cliquer pour changer l'icône d'adresse" : undefined}
                    >
                      <IconRenderer name={content.addressIcon || 'MapPin'} className="h-4 w-4" />
                      {isAdmin && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-black text-[#c6ff00] text-[8px]">
                          ✎
                        </span>
                      )}
                    </button>
                    <div className="flex-1">
                      <EditableText
                        as="span"
                        value={content.addressText}
                        onChange={(val) => onUpdateFooter({ addressText: val })}
                        isAdmin={isAdmin}
                        label="Texte de l'adresse"
                      />
                    </div>
                  </div>

                  {/* Phone Item with icon button */}
                  <div className="flex items-start space-x-2.5 group">
                    <button
                      type="button"
                      onClick={() => {
                        if (isAdmin) {
                          setIconTarget({
                            type: 'phone',
                            currentIcon: content.phoneIcon || 'Phone',
                            title: "Changer l'icône téléphone",
                          });
                        }
                      }}
                      className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform ${
                        isAdmin 
                          ? 'bg-[#c6ff00]/20 text-[#c6ff00] hover:scale-110 hover:bg-[#c6ff00] hover:text-black cursor-pointer ring-1 ring-[#c6ff00]/40' 
                          : 'text-[#c6ff00]'
                      }`}
                      title={isAdmin ? "Cliquer pour changer l'icône de téléphone" : undefined}
                    >
                      <IconRenderer name={content.phoneIcon || 'Phone'} className="h-4 w-4" />
                      {isAdmin && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-black text-[#c6ff00] text-[8px]">
                          ✎
                        </span>
                      )}
                    </button>
                    <div className="flex-1">
                      <EditableText
                        as="span"
                        value={content.phoneText}
                        onChange={(val) => onUpdateFooter({ phoneText: val })}
                        isAdmin={isAdmin}
                        label="Numéros de téléphone"
                      />
                    </div>
                  </div>

                  {/* Email Item with icon button */}
                  <div className="flex items-start space-x-2.5 group">
                    <button
                      type="button"
                      onClick={() => {
                        if (isAdmin) {
                          setIconTarget({
                            type: 'email',
                            currentIcon: content.emailIcon || 'Mail',
                            title: "Changer l'icône email",
                          });
                        }
                      }}
                      className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform ${
                        isAdmin 
                          ? 'bg-[#c6ff00]/20 text-[#c6ff00] hover:scale-110 hover:bg-[#c6ff00] hover:text-black cursor-pointer ring-1 ring-[#c6ff00]/40' 
                          : 'text-[#c6ff00]'
                      }`}
                      title={isAdmin ? "Cliquer pour changer l'icône email" : undefined}
                    >
                      <IconRenderer name={content.emailIcon || 'Mail'} className="h-4 w-4" />
                      {isAdmin && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-black text-[#c6ff00] text-[8px]">
                          ✎
                        </span>
                      )}
                    </button>
                    <div className="flex-1">
                      <EditableText
                        as="span"
                        value={content.emailText}
                        onChange={(val) => onUpdateFooter({ emailText: val })}
                        isAdmin={isAdmin}
                        label="Adresse email"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Col 3: Quick Links & Admin with Changeable Icons */}
            {(showLinksCol || isAdmin) && (
              <div className={`md:col-span-3 space-y-3 ${!showLinksCol ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-tech text-xs font-bold uppercase tracking-wider text-slate-200">
                    <EditableText
                      as="span"
                      value={content.col3Title}
                      onChange={(val) => onUpdateFooter({ col3Title: val })}
                      isAdmin={isAdmin}
                      label="Titre de la colonne liens"
                    />
                  </h3>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleAddLink}
                      className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#c6ff00] bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition-colors"
                    >
                      <Plus size={10} />
                      <span>Ajouter un lien</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col space-y-2.5 text-xs">
                  {links.map((link) => {
                    if (!link.visible && !isAdmin) return null;
                    const isSmtpTrigger = link.url === '#smtp-settings';

                    return (
                      <div
                        key={link.id}
                        className={`flex items-center justify-between p-1.5 rounded-lg transition-colors ${
                          !link.visible ? 'opacity-50 border border-dashed border-amber-400/40 bg-amber-400/5' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          {/* Changeable link icon */}
                          <button
                            type="button"
                            onClick={() => {
                              if (isAdmin) {
                                setIconTarget({
                                  type: 'link',
                                  id: link.id,
                                  currentIcon: link.iconName || 'ExternalLink',
                                  title: `Changer l'icône de « ${link.label} »`,
                                });
                              }
                            }}
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded transition-transform ${
                              isAdmin
                                ? 'bg-white/10 text-[#c6ff00] hover:bg-[#c6ff00] hover:text-black cursor-pointer'
                                : 'text-slate-400'
                            }`}
                            title={isAdmin ? "Cliquer pour changer cette icône" : undefined}
                          >
                            <IconRenderer name={link.iconName || 'ExternalLink'} className="h-3.5 w-3.5" />
                          </button>

                          {/* Link label */}
                          {isAdmin ? (
                            <EditableText
                              as="span"
                              value={link.label}
                              onChange={(val) => handleUpdateLink(link.id, { label: val })}
                              isAdmin={isAdmin}
                              className="text-slate-300 font-medium truncate"
                              label="Intitulé du lien"
                            />
                          ) : isSmtpTrigger ? (
                            <button
                              type="button"
                              onClick={onOpenSettings}
                              className="text-left text-[#c6ff00] hover:underline font-medium truncate"
                            >
                              {link.label}
                            </button>
                          ) : (
                            <a
                              href={link.url}
                              target={link.url.startsWith('http') ? '_blank' : undefined}
                              rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                              className="text-slate-400 hover:text-white transition-colors truncate"
                            >
                              {link.label}
                            </a>
                          )}
                        </div>

                        {/* Admin controls for link */}
                        {isAdmin && (
                          <div className="flex items-center space-x-1 pl-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const newUrl = window.prompt("Modifier l'URL de redirection :", link.url);
                                if (newUrl !== null) handleUpdateLink(link.id, { url: newUrl });
                              }}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                              title={`URL actuelle: ${link.url}`}
                            >
                              <Edit size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateLink(link.id, { visible: !link.visible })}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                              title={link.visible ? "Masquer ce lien" : "Afficher ce lien"}
                            >
                              {link.visible ? <Eye size={11} className="text-emerald-400" /> : <EyeOff size={11} className="text-rose-400" />}
                            </button>
                            {links.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteLink(link.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                                title="Supprimer ce lien"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Socials & Direct Channels Bar */}
          {(showSocialsRow || isAdmin) && (
            <div className={`mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 ${
              !showSocialsRow ? 'opacity-50' : ''
            }`}>
              <div className="flex items-center space-x-3">
                <span className="font-tech text-xs font-bold uppercase tracking-wider text-slate-300">
                  <EditableText
                    as="span"
                    value={content.socialsTitle}
                    onChange={(val) => onUpdateFooter({ socialsTitle: val })}
                    isAdmin={isAdmin}
                    label="Titre réseaux sociaux"
                  />
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleAddSocial}
                    className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#c6ff00] bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition-colors"
                  >
                    <Plus size={10} />
                    <span>Ajouter un réseau</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {socials.map((soc) => {
                  if (!soc.visible && !isAdmin) return null;
                  return (
                    <div
                      key={soc.id}
                      className={`group relative flex items-center space-x-2 rounded-xl border px-3 py-1.5 transition-all ${
                        !soc.visible
                          ? 'border-dashed border-amber-400/40 bg-amber-400/10 text-amber-200'
                          : 'border-white/10 bg-white/5 hover:border-[#c6ff00]/50 hover:bg-white/10'
                      }`}
                    >
                      {/* Social Icon Trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isAdmin) {
                            setIconTarget({
                              type: 'social',
                              id: soc.id,
                              currentIcon: soc.iconName || 'Share2',
                              title: `Changer l'icône de ${soc.name}`,
                            });
                          }
                        }}
                        className={`flex h-6 w-6 items-center justify-center rounded-lg transition-transform ${
                          isAdmin 
                            ? 'bg-[#c6ff00]/20 text-[#c6ff00] hover:scale-110 hover:bg-[#c6ff00] hover:text-black cursor-pointer' 
                            : 'text-[#c6ff00]'
                        }`}
                        title={isAdmin ? "Cliquer pour changer l'icône" : undefined}
                      >
                        <IconRenderer name={soc.iconName || 'Share2'} className="h-3.5 w-3.5" />
                      </button>

                      {isAdmin ? (
                        <EditableText
                          as="span"
                          value={soc.name}
                          onChange={(val) => handleUpdateSocial(soc.id, { name: val })}
                          isAdmin={isAdmin}
                          className="text-xs font-semibold text-white"
                          label="Nom du réseau"
                        />
                      ) : (
                        <a
                          href={soc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-white hover:text-[#c6ff00] transition-colors"
                        >
                          {soc.name}
                        </a>
                      )}

                      {/* Admin controls for social */}
                      {isAdmin && (
                        <div className="flex items-center space-x-1 pl-1 border-l border-white/15">
                          <button
                            type="button"
                            onClick={() => {
                              const newUrl = window.prompt(`Modifier l'URL de ${soc.name} :`, soc.url);
                              if (newUrl !== null) handleUpdateSocial(soc.id, { url: newUrl });
                            }}
                            className="p-1 rounded text-slate-400 hover:text-white"
                            title={`URL: ${soc.url}`}
                          >
                            <Edit size={10} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateSocial(soc.id, { visible: !soc.visible })}
                            className="p-1 rounded text-slate-400 hover:text-white"
                            title={soc.visible ? "Masquer ce réseau" : "Afficher ce réseau"}
                          >
                            {soc.visible ? <Eye size={10} className="text-emerald-400" /> : <EyeOff size={10} className="text-rose-400" />}
                          </button>
                          {socials.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSocial(soc.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400"
                              title="Supprimer ce réseau"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom copyright bar */}
          <div className="mt-12 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
            <div>
              <EditableText
                as="span"
                value={content.copyrightText}
                onChange={(val) => onUpdateFooter({ copyrightText: val })}
                isAdmin={isAdmin}
                label="Texte de copyright"
              />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-slate-400">
                <EditableText
                  as="span"
                  value={content.locationBadge}
                  onChange={(val) => onUpdateFooter({ locationBadge: val })}
                  isAdmin={isAdmin}
                  label="Badge showroom / localisation"
                />
              </span>
              <span>•</span>
              <span className="text-slate-400">
                <EditableText
                  as="span"
                  value={content.warrantyText}
                  onChange={(val) => onUpdateFooter({ warrantyText: val })}
                  isAdmin={isAdmin}
                  label="Mention de garantie"
                />
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Icon Selector Modal */}
      <IconPickerModal
        isOpen={Boolean(iconTarget)}
        onClose={() => setIconTarget(null)}
        currentIcon={iconTarget?.currentIcon || 'Sparkles'}
        onSelectIcon={handleSelectIcon}
        title={iconTarget?.title}
      />
    </>
  );
};
