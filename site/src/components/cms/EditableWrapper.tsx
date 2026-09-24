import React, { useState } from "react";
import { useCms } from "../../context/CmsContext";
import { Edit2, Sparkles } from "lucide-react";

interface EditableWrapperProps {
  sectionKey: string;
  sectionLabel: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const EditableWrapper: React.FC<EditableWrapperProps> = ({
  sectionKey,
  sectionLabel,
  children,
  className = "",
  style,
}) => {
  const { isEditing, selectedBlockId, setSelectedBlockId, setActiveTab } = useCms();
  const [isHovered, setIsHovered] = useState(false);

  if (!isEditing) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const isSelected = selectedBlockId === sectionKey;

  const handleClick = (e: React.MouseEvent) => {
    // Only capture if clicked directly or if in edit mode
    setSelectedBlockId(sectionKey);
    setActiveTab("content");
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      className={`relative transition-all duration-150 ${className}`}
      style={{
        ...style,
        outline: isSelected
          ? "2px solid #C3F910"
          : isHovered
          ? "2px dashed rgba(195, 249, 16, 0.7)"
          : "none",
        outlineOffset: "-2px",
      }}
    >
      {/* Floating Elementor Inspector Badge */}
      {(isHovered || isSelected) && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 16,
            zIndex: 150,
            pointerEvents: "auto",
          }}
          className="flex items-center gap-1.5 bg-[#0e0e0d]/95 backdrop-blur-md text-[#C3F910] border border-[#C3F910] px-3 py-1.5 rounded-md text-[11px] font-mono font-bold shadow-xl animate-in fade-in duration-100 cursor-pointer hover:bg-[#C3F910] hover:text-black transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedBlockId(sectionKey);
            setActiveTab("content");
          }}
        >
          <Edit2 className="w-3 h-3" />
          <span>ÉDITER : {sectionLabel.toUpperCase()}</span>
        </div>
      )}

      {children}
    </div>
  );
};
