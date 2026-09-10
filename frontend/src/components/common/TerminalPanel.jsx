import { useState, useEffect, useRef } from 'react';
import { Terminal, Copy, Check, Trash2, WrapText, Square } from 'lucide-react';
import RetroButton from './RetroButton';
import StatusIndicator from './StatusIndicator';

/**
 * TerminalPanel - Reusable Engineering CRT Terminal Panel Component
 * Supports:
 * - Dark terminal background with subtle CRT scanline effect
 * - Compact timestamps ([HH:mm:ss])
 * - Phosphor-green output with semantic color highlighting for errors/warnings
 * - Auto-scrolling & scroll container
 * - Copy log to clipboard
 * - Clear log action
 * - Animated running/loading indicator
 */
export const TerminalPanel = ({
  lines = [],
  title = "LIVE SSE TELEMETRY CONSOLE",
  code = "LIVE_STREAM // SSE",
  status,
  isRunning = false,
  maxHeight = "max-h-96",
  minHeight = "min-h-64",
  onClear,
  onStop,
  actions,
  className = ""
}) => {
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(true);
  const terminalEndRef = useRef(null);

  // Auto-scroll to bottom on new incoming lines
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines]);

  // Helper to extract or prepend timestamp
  const parseLine = (lineData) => {
    let text = typeof lineData === 'string' ? lineData : lineData.text || '';
    let explicitType = typeof lineData === 'object' ? lineData.type : null;
    
    // Determine semantic status for color coding
    const lowerText = text.toLowerCase();
    let type = explicitType;
    if (!type) {
      if (lowerText.includes('error') || lowerText.includes('failed') || lowerText.includes('closed') || lowerText.includes('unreachable') || lowerText.includes('exit code: [1-9]')) {
        type = 'error';
      } else if (lowerText.includes('warning') || lowerText.includes('timeout') || lowerText.includes('stale')) {
        type = 'warning';
      } else if (lowerText.includes('completed') || lowerText.includes('success') || lowerText.includes('exit code: 0') || lowerText.includes('0% packet loss') || lowerText.includes('starting')) {
        type = 'success';
      } else if (lowerText.includes('target:') || lowerText.includes('running') || lowerText.includes('system')) {
        type = 'info';
      } else {
        type = 'default';
      }
    }

    return { text, type };
  };

  const handleCopy = () => {
    const fullText = lines.map(l => typeof l === 'string' ? l : l.text).join('\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLineStyle = (type) => {
    switch (type) {
      case 'error':
        return 'text-[#ff3333] font-semibold bg-[#ff3333]/5 px-1 rounded-[1px] border-l-2 border-[#ff3333]';
      case 'warning':
        return 'text-[#ffb000] font-semibold bg-[#ffb000]/5 px-1 rounded-[1px] border-l-2 border-[#ffb000]';
      case 'success':
        return 'text-[#00ff66] font-bold';
      case 'info':
        return 'text-[#00bfff]';
      default:
        return 'text-[#00ff66]';
    }
  };

  const currentStatus = status || (isRunning ? 'RUNNING' : (lines.length > 0 ? 'COMPLETED' : 'IDLE'));

  return (
    <div className={`border border-[#27342a] bg-[#060907] rounded-[2px] overflow-hidden font-mono text-xs ${className}`}>
      
      {/* Header Bar */}
      <div className="bg-[#101411] px-3 py-2 border-b border-[#27342a] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#00ff66]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#d5e3d8] uppercase tracking-wider">
                {title}
              </span>
              {code && <span className="text-[9px] text-[#768a7b] font-mono">[{code}]</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusIndicator status={currentStatus} variant="dot" pulse={isRunning} />

          <button
            onClick={() => setWrap(!wrap)}
            className={`text-[10px] px-1.5 py-0.5 border rounded-[1px] transition-colors flex items-center gap-1 ${
              wrap
                ? 'border-[#00ff66]/50 text-[#00ff66] bg-[#00ff66]/10'
                : 'border-[#27342a] text-[#768a7b] hover:text-[#d5e3d8]'
            }`}
            title="Toggle line wrapping"
          >
            <WrapText className="w-3 h-3" />
            <span>Wrap</span>
          </button>

          {onClear && lines.length > 0 && (
            <RetroButton variant="ghost" size="sm" icon={Trash2} onClick={onClear} disabled={isRunning}>
              Clear
            </RetroButton>
          )}

          {onStop && isRunning && (
            <RetroButton variant="danger" size="sm" icon={Square} onClick={onStop}>
              Stop
            </RetroButton>
          )}

          <RetroButton
            variant="ghost"
            size="sm"
            icon={copied ? Check : Copy}
            onClick={handleCopy}
            disabled={lines.length === 0}
          >
            {copied ? 'Copied' : 'Copy'}
          </RetroButton>

          {actions}
        </div>
      </div>

      {/* CRT Screen Area with subtle scanline overlay */}
      <div className={`crt-scanlines p-3 ${minHeight} ${maxHeight} overflow-y-auto selection:bg-[#00ff66] selection:text-[#060907]`}>
        {lines.length === 0 ? (
          <div className="h-full flex items-center justify-center py-12 text-[#4e5f52] italic font-mono text-xs">
            // Telemetry stream ready. Specify target host parameters to initiate live diagnostic.
          </div>
        ) : (
          <div className={`space-y-1 ${wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}`}>
            {lines.map((lineData, idx) => {
              const { text, type } = parseLine(lineData, idx);
              return (
                <div key={idx} className={`leading-relaxed font-mono text-[11px] ${getLineStyle(type)}`}>
                  {text}
                </div>
              );
            })}
            
            {/* Animated CRT Cursor when process is running */}
            {isRunning && (
              <div className="flex items-center gap-1 text-[#00ff66] font-mono text-[11px] pt-1">
                <span className="animate-pulse font-bold text-[#00ff66]">█</span>
                <span className="text-[10px] text-[#768a7b] italic">[Streaming SSE telemetry...]</span>
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>
        )}
      </div>

    </div>
  );
};

export default TerminalPanel;
