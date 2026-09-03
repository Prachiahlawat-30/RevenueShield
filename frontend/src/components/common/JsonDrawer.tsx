import React from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface JsonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any;
}

export const JsonDrawer: React.FC<JsonDrawerProps> = ({ isOpen, onClose, title, data }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-md animate-fintech-fade">
      <div
        className="flex h-full w-full max-w-xl flex-col bg-white/95 dark:bg-[oklch(0.24_0.008_223.9)]/95 border-l border-slate-200/80 dark:border-white/10 backdrop-blur-2xl shadow-glass-3 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] px-6 py-4 bg-slate-50/50 dark:bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate font-mono">{title}</h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={copied ? Check : Copy}
              onClick={handleCopy}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-5">
          <pre className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-900/[0.03] dark:bg-black/40 p-4 font-mono text-xs text-slate-800 dark:text-slate-200 overflow-x-auto leading-relaxed">
            {jsonString}
          </pre>
        </div>
      </div>
    </div>
  );
};
