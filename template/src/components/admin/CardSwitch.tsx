import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useProduct } from '../../context/ProductContext';

interface CardSwitchProps {
  visible: boolean;
  onToggle: () => void;
  label?: string;
  className?: string;
  compact?: boolean;
}

export const CardSwitch: React.FC<CardSwitchProps> = ({
  visible,
  onToggle,
  label = 'Afficher',
  className = '',
  compact = false
}) => {
  const { isEditMode, isVisitorPreview } = useProduct();

  // If not in edit mode or visitor preview is on, do not display the toggle control
  if (!isEditMode || isVisitorPreview) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium transition-all z-20 shadow-md ${
        visible
          ? 'bg-[#c6ff00]/15 text-[#c6ff00] border border-[#c6ff00]/40 hover:bg-[#c6ff00]/25'
          : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
      } ${className}`}
      title={visible ? 'Cliquer pour masquer cet élément' : 'Cliquer pour afficher cet élément'}
    >
      {visible ? (
        <>
          <Eye className="w-3.5 h-3.5 text-[#c6ff00]" />
          {!compact && <span>{label} : Actif</span>}
        </>
      ) : (
        <>
          <EyeOff className="w-3.5 h-3.5 text-red-400" />
          {!compact && <span>{label} : Masqué</span>}
        </>
      )}
    </button>
  );
};

export const HiddenOverlayBadge: React.FC<{ visible: boolean }> = ({ visible }) => {
  const { isEditMode, isVisitorPreview } = useProduct();

  if (!isEditMode || isVisitorPreview || visible) {
    return null;
  }

  return (
    <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-400 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 backdrop-blur-sm">
      <EyeOff className="w-3 h-3" /> Masqué aux visiteurs
    </div>
  );
};
