import { useState } from 'react';
import { Terminal, Copy, Check, WrapText } from 'lucide-react';
import RetroButton from './RetroButton';

/**
 * TerminalOutput - Reusable engineering terminal component for raw command outputs and logs.
 */
export const TerminalOutput = ({
  output,
  exitCode,
  title = "RAW SUBPROCESS OUTPUT",
  maxHeight = "max-h-96",
  className = ""
}) => {
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(true);

  const rawText = output || '[No console output recorded for this execution process]';

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSuccess = exitCode === 0 || exitCode === undefined;

  return (
    <div className={`border border-[#27342a] bg-[#080b09] rounded-[2px] overflow-hidden font-mono text-xs ${className}`}>
      {/* Terminal Bar */}
      <div className="bg-[#101411] px-3 py-1.5 border-b border-[#27342a] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#00ff66]" />
          <span className="text-[11px] font-bold text-[#d5e3d8] uppercase tracking-wider">
            {title}
          </span>
          {exitCode !== undefined && (
            <span
              className={`text-[10px] px-1.5 py-0.2 border rounded-[1px] font-semibold ${
                isSuccess
                  ? 'border-[#00ff66]/40 text-[#00ff66] bg-[#00ff66]/10'
                  : 'border-[#ff3333]/40 text-[#ff3333] bg-[#ff3333]/10'
              }`}
            >
              EXIT:{exitCode}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWrap(!wrap)}
            className={`text-[10px] px-1.5 py-0.5 border rounded-[1px] transition-colors flex items-center gap-1 ${
              wrap
                ? 'border-[#00ff66]/50 text-[#00ff66] bg-[#00ff66]/10'
                : 'border-[#27342a] text-[#768a7b] hover:text-[#d5e3d8]'
            }`}
            title="Toggle word wrap"
          >
            <WrapText className="w-3 h-3" />
            <span>Wrap</span>
          </button>

          <RetroButton
            variant="ghost"
            size="sm"
            icon={copied ? Check : Copy}
            onClick={handleCopy}
          >
            {copied ? 'Copied' : 'Copy'}
          </RetroButton>
        </div>
      </div>

      {/* Terminal Screen Output */}
      <div className={`p-3 overflow-x-auto ${maxHeight} selection:bg-[#00ff66] selection:text-[#080b09]`}>
        <pre
          className={`font-mono text-[11px] leading-relaxed text-[#00ff66] ${
            wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'
          }`}
        >
          {rawText}
        </pre>
      </div>
    </div>
  );
};

export default TerminalOutput;
