/**
 * MetricReadout - Compact 1990s NOC metric display block with status indicators & progress bars.
 */
export const MetricReadout = ({
  label,
  value,
  unit,
  subtext,
  status = 'neutral', // 'green' | 'amber' | 'red' | 'cyan' | 'neutral'
  icon: Icon,
  trend,
  progress, // number 0..100
  className = '',
}) => {
  const colorMap = {
    green: {
      text: 'text-[#00ff66]',
      bg: 'bg-[#00ff66]/10',
      border: 'border-[#00ff66]/30',
      bar: 'bg-[#00ff66]',
    },
    amber: {
      text: 'text-[#ffb000]',
      bg: 'bg-[#ffb000]/10',
      border: 'border-[#ffb000]/30',
      bar: 'bg-[#ffb000]',
    },
    red: {
      text: 'text-[#ff3333]',
      bg: 'bg-[#ff3333]/10',
      border: 'border-[#ff3333]/30',
      bar: 'bg-[#ff3333]',
    },
    cyan: {
      text: 'text-[#00bfff]',
      bg: 'bg-[#00bfff]/10',
      border: 'border-[#00bfff]/30',
      bar: 'bg-[#00bfff]',
    },
    neutral: {
      text: 'text-[#d5e3d8]',
      bg: 'bg-[#27342a]/30',
      border: 'border-[#27342a]',
      bar: 'bg-[#768a7b]',
    },
  };

  const style = colorMap[status] || colorMap.neutral;

  return (
    <div
      className={`bg-[#101411] border border-[#27342a] p-3 rounded-[2px] font-mono flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-[#768a7b] uppercase tracking-wider flex items-center gap-1.5">
          {Icon && <Icon className={`w-3.5 h-3.5 ${style.text}`} />}
          {label}
        </span>
        {trend && (
          <span className={`text-[10px] ${style.text} font-bold`}>
            {trend}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1 my-1">
        <span className={`text-xl font-bold tracking-tight ${style.text}`}>
          {value !== undefined && value !== null ? value : 'N/A'}
        </span>
        {unit && <span className="text-xs text-[#768a7b] font-medium">{unit}</span>}
      </div>

      {progress !== undefined && (
        <div className="w-full bg-[#18201a] h-1.5 border border-[#27342a] rounded-[1px] mt-1.5 overflow-hidden">
          <div
            className={`h-full ${style.bar} transition-all duration-300`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {subtext && (
        <div className="text-[10px] text-[#4e5f52] mt-1 truncate">
          {subtext}
        </div>
      )}
    </div>
  );
};

export default MetricReadout;
