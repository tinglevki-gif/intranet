import React from 'react';

/**
 * Exact Official Tinglev Brandmark
 * 4 interlocking modular precast elements with 45° chamfered corners.
 */
export function TinglevMark({ className = "w-8 h-8", color = "#009FE3" }) {
  return (
    <svg
      viewBox="0 0 100 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 1. Top-Left Major Element */}
      <path
        d="M0 0H47V102H0V0Z"
        fill={color}
      />
      {/* 2. Bottom-Left Chamfered Element */}
      <path
        d="M0 108H47V160H35L0 125V108Z"
        fill={color}
      />
      {/* 3. Top-Right Chamfered Element */}
      <path
        d="M53 0H65L100 35V52H53V0Z"
        fill={color}
      />
      {/* 4. Bottom-Right Major Element */}
      <path
        d="M53 58H100V160H53V58Z"
        fill={color}
      />
    </svg>
  );
}

export function TinglevLogo({
  variant = 'full', // 'full' | 'mark' | 'horizontal'
  theme = 'light-text', // 'light-text' (for dark bg) | 'dark-text' (for light bg)
  showSubtitle = true,
  className = ''
}) {
  const isLightText = theme === 'light-text';

  if (variant === 'mark') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="w-10 h-10 rounded-xl bg-[#001424]/80 border border-[#003E6B]/60 flex items-center justify-center p-2 shadow-md shadow-[#001424]/40 relative group">
          <TinglevMark className="w-5 h-7 transform group-hover:scale-105 transition-transform" color="#009FE3" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3.5 select-none ${className}`}>
      {/* Tinglev Official Emblem Container */}
      <div className="relative flex items-center justify-center shrink-0">
        <div className="w-10 h-11 rounded-xl bg-gradient-to-br from-[#00243F] to-[#001424] border border-[#003E6B]/70 flex items-center justify-center p-1.5 shadow-lg shadow-[#001424]/50 relative">
          <TinglevMark className="w-5 h-7" color="#009FE3" />
        </div>
      </div>

      {/* Tinglev Official Brand Typography */}
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center space-x-1">
          <span
            className={`font-black text-lg tracking-tight leading-none uppercase font-heading ${
              isLightText ? 'text-white' : 'text-[#001E36]'
            }`}
          >
            TINGLEV
          </span>
          <span className="text-[#009FE3] font-bold text-xs leading-none tracking-widest uppercase">
            ®
          </span>
        </div>
        <span
          className="text-[11px] font-extrabold tracking-wider leading-tight uppercase mt-0.5 text-slate-200 truncate"
        >
          ELEMENTFABRIK
        </span>
        {showSubtitle && (
          <span className="text-[9.5px] uppercase font-bold tracking-widest text-[#009FE3] block mt-0.5">
            PORTAL INTRANET
          </span>
        )}
      </div>
    </div>
  );
}

export default TinglevLogo;
