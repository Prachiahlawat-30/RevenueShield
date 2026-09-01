import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { importTransactionsCsv, downloadSampleCsv, BatchImportResponse } from '../../api/transactions';
import { formatCurrency } from '../../utils/formatters';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloadingSample, setIsDownloadingSample] = useState(false);
  const [result, setResult] = useState<BatchImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a valid .csv file.');
      return;
    }
    setError(null);
    setResult(null);
    setFile(selectedFile);

    // Quick client-side preview of the first 4 rows
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const lines = text
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .slice(0, 5)
          .map((l) => l.split(','));
        setPreviewRows(lines);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadSample = async () => {
    try {
      setIsDownloadingSample(true);
      await downloadSampleCsv();
    } catch (err) {
      console.error('Failed to download template', err);
    } finally {
      setIsDownloadingSample(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    try {
      const data = await importTransactionsCsv(file);
      setResult(data);
      onSuccess();
    } catch (err: any) {
      console.error('Failed to import CSV', err);
      setError(
        err.response?.data?.detail || 'Failed to parse and import CSV file. Please check format.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setPreviewRows([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fintech-fade">
      <div className="w-full max-w-xl rounded-[14px] border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#242E42] px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-[#1A1A2E] dark:text-white">
              Import Transactions via CSV
            </h2>
            <p className="text-xs text-[#6B7280]">
              Upload batch payment failures to automatically create customers and diagnose revenue risks.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#1A1A2E] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {!result ? (
            <>
              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-[12px] p-6 text-center cursor-pointer transition-all ${
                  file
                    ? 'border-[#6822CC] bg-[#F3EEFF]/40 dark:bg-purple-950/20'
                    : 'border-[#E5E7EB] dark:border-[#242E42] hover:border-[#6822CC] hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                />

                {file ? (
                  <div className="space-y-1">
                    <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-[#6822CC] text-white">
                      <FileText className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-[#1A1A2E] dark:text-white mt-2">{file.name}</p>
                    <p className="text-[10px] text-[#6B7280]">{(file.size / 1024).toFixed(1)} KB</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReset();
                      }}
                      className="text-[11px] text-[#DC2626] font-semibold hover:underline mt-1"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-[#F3EEFF] text-[#6822CC] dark:bg-purple-950/40">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1A1A2E] dark:text-white">
                        Click to select or drag and drop your CSV file
                      </p>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        Accepts standard CSV with columns: customer_name, email, amount, failure_type
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sample Template Helper */}
              <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 border border-[#E5E7EB] dark:border-[#242E42]">
                <div className="text-xs">
                  <span className="font-semibold text-[#1A1A2E] dark:text-white block">Need the exact CSV format?</span>
                  <span className="text-[11px] text-[#6B7280]">Download our pre-formatted template with sample Razorpay rows.</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Download}
                  isLoading={isDownloadingSample}
                  onClick={handleDownloadSample}
                >
                  Template
                </Button>
              </div>

              {/* Parsed Preview Table */}
              {previewRows.length > 1 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                    File Preview (First {previewRows.length - 1} rows)
                  </span>
                  <div className="overflow-x-auto rounded-lg border border-[#E5E7EB] dark:border-[#242E42] text-[11px] max-h-36 overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-[#6B7280] font-semibold">
                        <tr>
                          {previewRows[0].slice(0, 4).map((h, i) => (
                            <th key={i} className="px-3 py-1.5">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#242E42]">
                        {previewRows.slice(1).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50/50">
                            {row.slice(0, 4).map((cell, cIdx) => (
                              <td key={cIdx} className="px-3 py-1 text-[#1A1A2E] dark:text-white truncate max-w-[120px]">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40 p-3 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            /* Success Summary State */
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/40 p-4">
                <CheckCircle2 className="h-6 w-6 text-[#16A34A] shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    Import Completed Successfully
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {result.message}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 border border-[#E5E7EB] dark:border-[#242E42]">
                  <span className="text-[10px] uppercase font-bold text-[#6B7280]">Transactions Ingested</span>
                  <p className="text-xl font-bold font-mono text-[#1A1A2E] dark:text-white mt-0.5">
                    {result.imported_count}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 border border-[#E5E7EB] dark:border-[#242E42]">
                  <span className="text-[10px] uppercase font-bold text-[#6B7280]">Total Revenue at Risk</span>
                  <p className="text-xl font-bold font-mono text-[#DC2626] mt-0.5">
                    {formatCurrency(result.total_amount_imported, result.currency)}
                  </p>
                </div>
              </div>

              {result.sample_records.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                    Ingested Revenue Risks
                  </span>
                  <div className="divide-y divide-[#E5E7EB] dark:divide-[#242E42] rounded-lg border border-[#E5E7EB] dark:border-[#242E42] max-h-36 overflow-y-auto">
                    {result.sample_records.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 text-xs">
                        <div>
                          <span className="font-semibold text-[#1A1A2E] dark:text-white">{r.customer_name}</span>
                          <span className="text-[11px] text-[#6B7280] block">{r.email}</span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="font-bold text-[#DC2626]">
                            {formatCurrency(r.amount, r.currency)}
                          </span>
                          <span className="text-[10px] text-[#6B7280] block uppercase">
                            {r.failure_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[#E5E7EB] dark:border-[#242E42] bg-slate-50/50 dark:bg-slate-900/30 px-6 py-3.5">
          {!result ? (
            <>
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!file || isUploading}
                isLoading={isUploading}
                onClick={handleUpload}
              >
                Upload & Ingest
              </Button>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
