import React from 'react';
import { MapPin, Phone, Mail, Clock, ArrowUpRight, Heart } from 'lucide-react';
import { useProduct } from '../../context/ProductContext';
import { EditableText } from '../admin/EditableText';
import { DynamicIcon } from '../ui/DynamicIcon';

export const Footer: React.FC = () => {
  const { data, updateField, isEditMode, isVisitorPreview } = useProduct();
  const footer = data.footer;
  const header = data.header;

  return (
    <footer className="border-t border-white/10 bg-[#050608] pt-16 pb-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Tech Tags Banner */}
        <div className="flex flex-wrap items-center justify-center gap-2 pb-12 mb-12 border-b border-white/10">
          {footer.techTags?.map((tag, i) => (
            <span
              key={i}
              className="text-[11px] font-mono tracking-widest px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-slate-300 hover:border-[#c6ff00]/40 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 4 Columns Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand & Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-black to-[#131722] border border-[#c6ff00]/40 flex items-center justify-center text-[#c6ff00]">
                <span className="font-tech font-black text-lg">P</span>
              </div>
              <span className="font-tech font-extrabold text-xl text-white tracking-widest">
                {header.brandName}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Leader français des technologies d'affichage dynamique LED transparentes pour l'architecture commerciale, vitrines de prestige et événements.
            </p>
            {/* Socials */}
            <div className="flex items-center gap-2 pt-2">
              {footer.socials.map((soc) => (
                <a
                  key={soc.name}
                  href={soc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#c6ff00]/40 text-slate-300 hover:text-[#c6ff00] flex items-center justify-center transition-all"
                  title={soc.name}
                >
                  <DynamicIcon name={soc.icon} className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Showroom Saint-Ouen */}
          <div className="space-y-3">
            <h4 className="font-tech text-xs uppercase tracking-widest text-white font-bold">
              <EditableText
                value={footer.showroomTitle}
                onSave={(val) => updateField('footer', 'showroomTitle', val)}
              />
            </h4>
            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <MapPin className="w-4 h-4 text-[#c6ff00] flex-shrink-0 mt-0.5" />
              <EditableText
                value={footer.showroomAddress}
                onSave={(val) => updateField('footer', 'showroomAddress', val)}
                multiline
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              <EditableText
                value={footer.showroomDesc}
                onSave={(val) => updateField('footer', 'showroomDesc', val)}
                multiline
              />
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <EditableText
                value={footer.openingHours}
                onSave={(val) => updateField('footer', 'openingHours', val)}
              />
            </div>
          </div>

          {/* Col 3: Contact Direct */}
          <div className="space-y-3">
            <h4 className="font-tech text-xs uppercase tracking-widest text-white font-bold">
              Service Commercial & Projets
            </h4>
            <div className="space-y-2">
              <a
                href={`tel:${footer.phone}`}
                className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-[#c6ff00] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#c6ff00]" />
                <EditableText
                  value={footer.phone}
                  onSave={(val) => updateField('footer', 'phone', val)}
                />
              </a>
              <a
                href={`mailto:${footer.email}`}
                className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-[#c6ff00] transition-colors"
              >
                <Mail className="w-4 h-4 text-[#c6ff00]" />
                <EditableText
                  value={footer.email}
                  onSave={(val) => updateField('footer', 'email', val)}
                />
              </a>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 mt-2">
              Étude de faisabilité et simulation photométrique offertes sous 24h ouvrées.
            </div>
          </div>

          {/* Col 4: Solutions PixiaTech */}
          <div className="space-y-3">
            <h4 className="font-tech text-xs uppercase tracking-widest text-white font-bold">
              Gamme LED PixiaTech
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#hero" className="hover:text-[#c6ff00] transition-colors flex items-center justify-between">
                  <span>Série WP - Vitrine Transparente</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-600" />
                </a>
              </li>
              <li>
                <a href="#configurator" className="hover:text-[#c6ff00] transition-colors flex items-center justify-between">
                  <span>Série Poster LED Ultra-Fin</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-600" />
                </a>
              </li>
              <li>
                <a href="#specifications" className="hover:text-[#c6ff00] transition-colors flex items-center justify-between">
                  <span>Dalles Fine Pitch P1.2 - P2.0</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-600" />
                </a>
              </li>
              <li>
                <a href="#technologies" className="hover:text-[#c6ff00] transition-colors flex items-center justify-between">
                  <span>Contrôleurs Cloud Novastar 4G</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-600" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <EditableText
              value={footer.copyright}
              onSave={(val) => updateField('footer', 'copyright', val)}
            />
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>NORME CE / ROHS / EMC</span>
            <span>CLASSEMENT FEU M1</span>
            <span>GARANTIE 3 ANS SUR SITE</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
