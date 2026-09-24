import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { useProduct } from '../../context/ProductContext';

interface EditableTextProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  multiline?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onSave,
  className = '',
  tag: Tag = 'span',
  multiline = false,
  placeholder = 'Texte vide...',
  disabled = false
}) => {
  const { isEditMode, isVisitorPreview } = useProduct();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Select all or move cursor to end
      if ('select' in inputRef.current) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const activeEdit = isEditMode && !isVisitorPreview && !disabled;

  if (!activeEdit) {
    return <Tag className={className}>{value || placeholder}</Tag>;
  }

  const handleSave = () => {
    if (draft.trim() !== value) {
      onSave(draft);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Enter' && e.ctrlKey && multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="relative inline-block w-full max-w-full my-1 z-30">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={Math.max(2, Math.min(8, draft.split('\n').length + 1))}
            className={`w-full p-2.5 rounded-lg bg-black/95 text-white border-2 border-[#c6ff00] shadow-2xl focus:outline-none text-sm font-sans resize-y glow-neon-sm ${className}`}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full px-2.5 py-1 rounded-lg bg-black/95 text-white border-2 border-[#c6ff00] shadow-2xl focus:outline-none text-inherit glow-neon-sm ${className}`}
          />
        )}
        <div className="flex items-center gap-1 mt-1 justify-end">
          <span className="text-[10px] text-slate-400 mr-2">
            {multiline ? 'Ctrl+Entrée pour valider' : 'Entrée pour valider'} • Échap pour annuler
          </span>
          <button
            type="button"
            onClick={handleSave}
            className="px-2 py-1 bg-[#c6ff00] text-black text-xs font-bold rounded flex items-center gap-1 hover:bg-[#b0e600] transition-colors"
          >
            <Check className="w-3 h-3 stroke-[3]" /> Valider
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-2 py-1 bg-white/10 text-slate-300 text-xs rounded hover:bg-white/20 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <Tag
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className={`group relative cursor-pointer inline-block transition-all rounded px-1 -mx-1 hover:bg-[#c6ff00]/10 hover:outline-dashed hover:outline-1 hover:outline-[#c6ff00] ${className}`}
      title="Cliquer pour modifier ce texte"
    >
      {value || <span className="italic text-slate-500">{placeholder}</span>}
      <span className="inline-flex items-center ml-1.5 opacity-0 group-hover:opacity-100 text-[#c6ff00] align-middle transition-opacity">
        <Pencil className="w-3.5 h-3.5" />
      </span>
    </Tag>
  );
};
