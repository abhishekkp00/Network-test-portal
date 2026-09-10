import React from 'react';

/**
 * RetroButton - Monospace technical button with phosphor green/amber outline & hover states.
 */
export const RetroButton = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost' | 'outline'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const variantMap = {
    primary: 'bg-[#00ff66]/15 hover:bg-[#00ff66]/25 text-[#00ff66] border-[#00ff66]/50 hover:border-[#00ff66] active:bg-[#00ff66]/35',
    secondary: 'bg-[#1a221d] hover:bg-[#243026] text-[#d5e3d8] border-[#27342a] hover:border-[#394d3e]',
    danger: 'bg-[#ff3333]/15 hover:bg-[#ff3333]/25 text-[#ff3333] border-[#ff3333]/50 hover:border-[#ff3333] active:bg-[#ff3333]/35',
    warning: 'bg-[#ffb000]/15 hover:bg-[#ffb000]/25 text-[#ffb000] border-[#ffb000]/50 hover:border-[#ffb000]',
    ghost: 'bg-transparent hover:bg-[#1a221d] text-[#768a7b] hover:text-[#d5e3d8] border-transparent hover:border-[#27342a]',
    outline: 'bg-transparent hover:bg-[#00ff66]/10 text-[#00ff66] border-[#00ff66]/40 hover:border-[#00ff66]',
  };

  const sizeMap = {
    sm: 'px-2 py-1 text-[11px] gap-1',
    md: 'px-3 py-1.5 text-xs gap-1.5',
    lg: 'px-4 py-2 text-sm gap-2',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`font-mono font-semibold uppercase tracking-wider border rounded-[2px] transition-all duration-150 inline-flex items-center justify-center cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent ${variantMap[variant] || variantMap.primary} ${sizeMap[size] || sizeMap.md} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="w-3.5 h-3.5 shrink-0" />}
    </button>
  );
};

export default RetroButton;
