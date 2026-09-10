/**
 * StatusIndicator - Technical status indicator LED / bracket tag for NOC states.
 * States: ONLINE, DEGRADED, OFFLINE, PENDING, RUNNING, SUCCESS, FAILED, TIMEOUT, STALE
 */
export const StatusIndicator = ({
  status,
  text,
  pulse = true,
  variant = 'badge', // 'badge' | 'dot'
  className = ''
}) => {
  const normalizeStatus = (status || '').toString().toUpperCase();

  const configMap = {
    ONLINE: { label: 'ONLINE', color: 'text-[#00ff66]', bg: 'bg-[#00ff66]', border: 'border-[#00ff66]/40', badgeBg: 'bg-[#00ff66]/10' },
    SUCCESS: { label: 'SUCCESS', color: 'text-[#00ff66]', bg: 'bg-[#00ff66]', border: 'border-[#00ff66]/40', badgeBg: 'bg-[#00ff66]/10' },
    HEALTHY: { label: 'HEALTHY', color: 'text-[#00ff66]', bg: 'bg-[#00ff66]', border: 'border-[#00ff66]/40', badgeBg: 'bg-[#00ff66]/10' },

    DEGRADED: { label: 'DEGRADED', color: 'text-[#ffb000]', bg: 'bg-[#ffb000]', border: 'border-[#ffb000]/40', badgeBg: 'bg-[#ffb000]/10' },
    PENDING: { label: 'PENDING', color: 'text-[#ffb000]', bg: 'bg-[#ffb000]', border: 'border-[#ffb000]/40', badgeBg: 'bg-[#ffb000]/10' },
    WARNING: { label: 'WARNING', color: 'text-[#eab308]', bg: 'bg-[#eab308]', border: 'border-[#eab308]/40', badgeBg: 'bg-[#eab308]/10' },

    OFFLINE: { label: 'OFFLINE', color: 'text-[#ff3333]', bg: 'bg-[#ff3333]', border: 'border-[#ff3333]/40', badgeBg: 'bg-[#ff3333]/10' },
    FAILED: { label: 'FAILED', color: 'text-[#ff3333]', bg: 'bg-[#ff3333]', border: 'border-[#ff3333]/40', badgeBg: 'bg-[#ff3333]/10' },
    STALE: { label: 'STALE', color: 'text-[#ff3333]', bg: 'bg-[#ff3333]', border: 'border-[#ff3333]/40', badgeBg: 'bg-[#ff3333]/10' },
    TIMEOUT: { label: 'TIMEOUT', color: 'text-[#ff3333]', bg: 'bg-[#ff3333]', border: 'border-[#ff3333]/40', badgeBg: 'bg-[#ff3333]/10' },

    RUNNING: { label: 'RUNNING', color: 'text-[#00bfff]', bg: 'bg-[#00bfff]', border: 'border-[#00bfff]/40', badgeBg: 'bg-[#00bfff]/10' },
    ONGOING: { label: 'ONGOING', color: 'text-[#00bfff]', bg: 'bg-[#00bfff]', border: 'border-[#00bfff]/40', badgeBg: 'bg-[#00bfff]/10' },
    ACTIVE: { label: 'ACTIVE', color: 'text-[#00bfff]', bg: 'bg-[#00bfff]', border: 'border-[#00bfff]/40', badgeBg: 'bg-[#00bfff]/10' },

    RESOLVED: { label: 'RESOLVED', color: 'text-[#768a7b]', bg: 'bg-[#768a7b]', border: 'border-[#768a7b]/40', badgeBg: 'bg-[#768a7b]/10' },
    OPEN: { label: 'OPEN', color: 'text-[#ff3333]', bg: 'bg-[#ff3333]', border: 'border-[#ff3333]/40', badgeBg: 'bg-[#ff3333]/10' },
  };

  const style = configMap[normalizeStatus] || {
    label: normalizeStatus || 'UNKNOWN',
    color: 'text-[#768a7b]',
    bg: 'bg-[#768a7b]',
    border: 'border-[#27342a]',
    badgeBg: 'bg-[#27342a]/30',
  };

  const displayText = text || style.label;

  if (variant === 'dot') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold ${style.color} select-none ${className}`}>
        <span className="relative flex h-2 w-2 items-center justify-center">
          {pulse && ['RUNNING', 'PENDING'].includes(normalizeStatus) && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.bg}`} />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${style.bg}`} />
        </span>
        <span>{displayText}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold px-2 py-0.5 border ${style.border} ${style.badgeBg} ${style.color} rounded-[2px] uppercase tracking-wider select-none ${className}`}
    >
      <span className="relative flex h-2 w-2 items-center justify-center">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.bg}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${style.bg}`} />
      </span>
      <span>[{displayText}]</span>
    </span>
  );
};

export default StatusIndicator;
