import React from 'react';

/**
 * NocPanel - Technical panel container with 1px borders, header bar, and status readout.
 * Uses dark graphite background and sharp technical styling.
 */
export const NocPanel = ({
  title,
  subtitle,
  code,
  badge,
  action,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  status = 'default', // 'default' | 'success' | 'warning' | 'danger' | 'info'
  noPadding = false,
}) => {
  const statusBorderMap = {
    default: 'border-[#27342a]',
    success: 'border-[#00ff66]/40',
    warning: 'border-[#ffb000]/40',
    danger: 'border-[#ff3333]/40',
    info: 'border-[#00bfff]/40',
  };

  return (
    <div
      className={`bg-[#141a16] border ${statusBorderMap[status] || statusBorderMap.default} rounded-[2px] shadow-sm font-sans flex flex-col ${className}`}
    >
      {/* Header Bar */}
      {(title || code || action || badge) && (
        <div
          className={`bg-[#1a221d] border-b border-[#27342a] px-3.5 py-2 flex items-center justify-between gap-2 select-none ${headerClassName}`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {code && (
              <span className="font-mono text-[10px] text-[#00ff66] bg-[#00ff66]/10 px-1.5 py-0.5 rounded-[1px] border border-[#00ff66]/30 uppercase tracking-widest shrink-0">
                {code}
              </span>
            )}
            {title && (
              <h3 className="font-mono text-xs font-semibold text-[#d5e3d8] uppercase tracking-wider truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <span className="font-mono text-[11px] text-[#768a7b] truncate hidden sm:inline">
                // {subtitle}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {badge && <div>{badge}</div>}
            {action && <div>{action}</div>}
          </div>
        </div>
      )}

      {/* Body Content */}
      <div className={`flex-1 ${noPadding ? '' : 'p-4'} ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default NocPanel;
