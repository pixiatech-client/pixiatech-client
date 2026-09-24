'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';

interface EditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  isAdmin: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  label?: string;
  highlightWords?: string; // Optional for highlights like "sur-mesure & haute luminosité"
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onChange,
  isAdmin,
  as: Component = 'span',
  className = '',
  multiline = false,
  placeholder = 'Cliquez pour écrire...',
  label,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Select all text for fast editing
      inputRef.current.select();
    }
  }, [isEditing]);

  if (!isAdmin) {
    return <Component className={className}>{value || placeholder}</Component>;
  }

  const handleCommit = () => {
    setIsEditing(false);
    if (draft.trim() !== value) {
      onChange(draft);
    }
  };

  const handleCancel = () => {
    setDraft(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div 
        className="relative inline-flex items-center w-full my-1 z-30" 
        onClick={(e) => e.stopPropagation()}
      >
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="w-full text-slate-900 bg-white border-2 border-[#7c3aed] rounded-lg p-2.5 text-sm shadow-xl focus:outline-none ring-2 ring-[#7c3aed]/20"
            placeholder={placeholder}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full text-slate-900 bg-white border-2 border-[#7c3aed] rounded-lg px-2.5 py-1.5 text-sm shadow-xl focus:outline-none ring-2 ring-[#7c3aed]/20"
            placeholder={placeholder}
          />
        )}
        <div className="absolute right-2 -bottom-7 flex items-center space-x-1 bg-white border border-gray-200 rounded-md shadow-lg px-1.5 py-0.5 z-40">
          <button
            type="button"
            onClick={handleCommit}
            className="p-1 hover:bg-emerald-50 text-emerald-600 rounded"
            title="Valider la modification"
          >
            <Check size={13} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1 hover:bg-rose-50 text-rose-500 rounded"
            title="Annuler"
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <Component
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className={`${className} cursor-pointer transition-all duration-150 relative group outline outline-2 outline-dashed outline-transparent hover:outline-blue-500 hover:bg-blue-50/40 rounded px-0.5`}
      title={`Cliquer pour modifier : ${label || 'ce texte'}`}
    >
      {value || <span className="italic text-gray-400">{placeholder}</span>}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 inline-flex items-center align-middle text-blue-600 bg-blue-100/90 rounded px-1 py-0.5 text-[10px] font-sans font-medium no-underline shadow-sm">
        <Pencil size={10} className="mr-0.5" />
        Éditer
      </span>
    </Component>
  );
};