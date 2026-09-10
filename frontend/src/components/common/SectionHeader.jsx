import React from 'react';

/**
 * SectionHeader - Technical section header with system ID tag, title, action slot & separator line.
 */
export const SectionHeader = ({
  code,
  title,
  subtitle,
  actions,
  className = '',
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-[#27342a]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {code && (
            <span className="font-mono text-[11px] text-[#00ff66] bg-[#00ff66]/10 px-1.5 py-0.5 rounded-[1px] border border-[#00ff66]/30 uppercase tracking-widest shrink-0">
              //{code}
            </span>
          )}
          <h2 className="font-mono text-sm font-bold text-[#d5e3d8] uppercase tracking-wider truncate">
            {title}
          </h2>
          {subtitle && (
            <span className="font-mono text-xs text-[#768a7b] truncate hidden sm:inline">
              — {subtitle}
            </span>
          )}
        </div>

        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
};

export default SectionHeader;
