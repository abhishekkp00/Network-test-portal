import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

/**
 * Custom Technical Tooltip for NOC Instrumentation Charts
 */
const CustomNocTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-[#0b0f0c] border border-[#27342a] p-2.5 rounded-[2px] font-mono text-xs shadow-md space-y-1 z-50">
      <div className="text-[10px] text-[#00bfff] font-bold border-b border-[#27342a] pb-1 uppercase tracking-wider">
        // SAMPLE: {label || 'UNKNOWN'}
      </div>
      <div className="space-y-1 pt-0.5">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-[#768a7b]">
              <span
                className="w-2 h-2 rounded-[1px] inline-block"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}:
            </span>
            <span className="font-bold text-[#d5e3d8]">
              {entry.value !== null && entry.value !== undefined
                ? `${entry.value} ${entry.unit || ''}`
                : 'N/A'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * NocTelemetryChart - Reusable Engineering Instrumentation Chart (Recharts Wrapper)
 * Supports: RTT, Packet Loss, Throughput, Jitter, Availability
 */
export const NocTelemetryChart = ({
  data = [],
  metrics = [], // Array of { key, name, color, unit }
  xAxisKey = "time",
  height = 220,
  title,
  code = "TELEMETRY_PLOT",
  className = ""
}) => {
  return (
    <div className={`bg-[#080b09] border border-[#27342a] p-3 rounded-[2px] font-mono space-y-2 ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-[#27342a] pb-2">
          <div className="text-xs font-bold text-[#d5e3d8] uppercase tracking-wider flex items-center gap-2">
            <span className="text-[#00ff66]">//</span>
            <span>{title}</span>
          </div>
          {code && <span className="text-[9px] text-[#768a7b]">[{code}]</span>}
        </div>
      )}

      <div style={{ width: '100%', height }}>
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#768a7b] text-xs font-mono">
            // NO TELEMETRY METRIC SAMPLES AVAILABLE
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              {/* Thin Technical Grid */}
              <CartesianGrid stroke="#1e2820" strokeDasharray="2 2" vertical={false} />

              {/* Compact Axes */}
              <XAxis
                dataKey={xAxisKey}
                stroke="#768a7b"
                fontSize={10}
                fontFamily="IBM Plex Mono"
                tickLine={false}
                axisLine={{ stroke: '#27342a' }}
                dy={5}
              />
              <YAxis
                stroke="#768a7b"
                fontSize={10}
                fontFamily="IBM Plex Mono"
                tickLine={false}
                axisLine={{ stroke: '#27342a' }}
                dx={-2}
              />

              {/* Readable Tooltip */}
              <Tooltip content={<CustomNocTooltip />} />

              {/* Minimal Legend */}
              <Legend
                wrapperStyle={{
                  fontSize: '10px',
                  fontFamily: 'IBM Plex Mono',
                  color: '#768a7b',
                  paddingTop: '6px'
                }}
                iconType="square"
                iconSize={8}
              />

              {/* Metric Lines */}
              {metrics.map((m) => (
                <Line
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  name={m.name}
                  unit={m.unit}
                  stroke={m.color}
                  strokeWidth={1.5}
                  dot={{ r: 2.5, fill: m.color, stroke: '#080b09', strokeWidth: 1 }}
                  activeDot={{ r: 4, fill: m.color, stroke: '#d5e3d8', strokeWidth: 1 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default NocTelemetryChart;
