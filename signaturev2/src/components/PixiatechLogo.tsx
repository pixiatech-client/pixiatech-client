import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function PixiatechLogo({ className = "w-8 h-8", size }: LogoProps) {
  const dimension = size ? `${size}px` : undefined;
  
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      style={dimension ? { width: dimension, height: dimension } : undefined}
    >
      <defs>
        <linearGradient id="logo-grad-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a855f7" />      {/* Purple */}
          <stop offset="50%" stopColor="#6366f1" />     {/* Indigo */}
          <stop offset="100%" stopColor="#06b6d4" />    {/* Cyan */}
        </linearGradient>
      </defs>
      {/* Off-white outer subtle shadow ring */}
      <circle cx="50" cy="50" r="49" fill="#f1f5f9" />
      {/* Elegant dark gray background for depth */}
      <circle cx="50" cy="50" r="46" fill="#18181b" />
      {/* Distinct purple-to-blue gradient ring, as shown in picture */}
      <circle 
        cx="50" 
        cy="50" 
        r="41" 
        stroke="url(#logo-grad-gradient)" 
        strokeWidth="6" 
        fill="none" 
      />
      {/* Central dark body */}
      <circle cx="50" cy="50" r="34" fill="#090a0f" />
      {/* Stacking "PIXIA" and "TECH" with correct letters spacing */}
      <text 
        x="50" 
        y="46" 
        fontFamily="'Space Grotesk', 'Inter', -apple-system, sans-serif" 
        fontWeight="800" 
        fontSize="13" 
        fill="#ffffff" 
        textAnchor="middle" 
        letterSpacing="1.2"
      >
        PIXIA
      </text>
      <text 
        x="50" 
        y="65" 
        fontFamily="'Space Grotesk', 'Inter', -apple-system, sans-serif" 
        fontWeight="800" 
        fontSize="13" 
        fill="#ffffff" 
        textAnchor="middle" 
        letterSpacing="1.2"
      >
        TECH
      </text>
    </svg>
  );
}
