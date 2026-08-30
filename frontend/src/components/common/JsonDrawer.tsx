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
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="flex h-full w-full max-w-xl flex-col bg-fintech-surface border-l border-fintech-border shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-fintech-border px-6 py-4 bg-fintech-surface-subtle/50">
          <h3 className="text-sm font-bold text-fintech-primary truncate">{title}</h3>
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
              className="rounded-fintech-sm p-1 text-fintech-muted hover:bg-fintech-surface-subtle hover:text-fintech-primary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-5">
          <pre className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-4 font-mono text-xs text-brand-700 dark:text-emerald-400 overflow-x-auto leading-relaxed">
            {jsonString}
          </pre>
        </div>
      </div>
    </div>
  );
};
