'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency, calculateDiscountPercent } from '@/lib/utils/format';
import {
  ArrowLeft,
  Download,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ExternalLink,
  Search,
  Sparkles,
  HelpCircle,
  Layers,
  ChevronRight,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

interface RawRowData {
  [key: string]: any;
}

interface ParsedProduct {
  sku: string | null;
  name: string;
  nameTa: string | null;
  description: string | null;
  descriptionTa: string | null;
  categoryNameOrSlug: string;
  categoryId: number;
  categoryName: string;
  mrp: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrls: string[];
  isFeatured: boolean;
  isBestseller: boolean;
  isActive: boolean;
  isCombo: boolean;
}

interface ValidatedRow {
  rowNumber: number;
  raw: RawRowData;
  parsed: ParsedProduct | null;
  status: 'valid' | 'error';
  isExisting: boolean;
  existingProductId?: number;
  errors: string[];
}

interface ValidationSummary {
  totalRows: number;
  validRows: number;
  errorRows: number;
  existingCount: number;
  newCount: number;
}

interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ sku?: string | null; name: string; error: string }>;
}

export default function BulkProductUploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [file, setFile] = useState<File | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingErrors, setIsDownloadingErrors] = useState(false);

  // Data states
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [rows, setRows] = useState<ValidatedRow[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Settings
  const [duplicateMode, setDuplicateMode] = useState<'skip' | 'update' | 'stop'>('update');
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // 1. Download Template Handler
  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      const res = await fetch('/api/admin/products/bulk-upload/template');
      if (!res.ok) throw new Error('Failed to download template');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Rajalakshmi_Fireworks_Bulk_Product_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template downloaded with current categories');
    } catch (err: any) {
      toast.error(err.message || 'Error downloading template');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // 2. Validate Uploaded File
  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    setFile(selectedFile);
    setIsValidating(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/admin/products/bulk-upload/validate', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Validation failed');

      setSummary(data.summary);
      setRows(data.rows);

      if (data.summary.errorRows === 0) {
        toast.success(`Validated ${data.summary.totalRows} products successfully!`);
      } else {
        toast.warning(
          `Validated with ${data.summary.errorRows} errors out of ${data.summary.totalRows} rows.`
        );
      }
    } catch (err: any) {
      toast.error(err.message || 'Error processing Excel file');
      setFile(null);
      setSummary(null);
      setRows([]);
    } finally {
      setIsValidating(false);
    }
  };

  // 3. Download Error Report
  const handleDownloadErrorReport = async () => {
    const errorRows = rows.filter((r) => r.status === 'error');
    if (errorRows.length === 0) return;

    setIsDownloadingErrors(true);
    try {
      const res = await fetch('/api/admin/products/bulk-upload/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorRows }),
      });

      if (!res.ok) throw new Error('Failed to generate error report');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk_upload_errors_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Error report downloaded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to download error report');
    } finally {
      setIsDownloadingErrors(false);
    }
  };

  // 4. Confirm Import
  const handleConfirmImport = async () => {
    const validItems = rows
      .filter((r) => r.status === 'valid' && r.parsed)
      .map((r) => r.parsed as ParsedProduct);

    if (validItems.length === 0) {
      toast.error('No valid products to import.');
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch('/api/admin/products/bulk-upload/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: validItems,
          duplicateMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to import products');

      setImportResult(data);
      toast.success(
        `Import complete: ${data.imported} added, ${data.updated} updated, ${data.skipped} skipped`
      );
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  // 5. Reset Form
  const handleReset = () => {
    setFile(null);
    setSummary(null);
    setRows([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filtered rows for table preview
  const filteredRows = rows.filter((r) => {
    if (previewFilter === 'valid' && r.status !== 'valid') return false;
    if (previewFilter === 'error' && r.status !== 'error') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const rawValues = Object.values(r.raw).join(' ').toLowerCase();
      const name = r.parsed?.name?.toLowerCase() || '';
      const sku = r.parsed?.sku?.toLowerCase() || '';
      return rawValues.includes(q) || name.includes(q) || sku.includes(q);
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Products
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            Excel Bulk Product Upload
          </h1>
          <p className="text-xs text-muted-foreground">
            Batch import fireworks products, bilingual details, pricing, media, and stock using Excel (.xlsx).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            className="font-semibold text-xs border-primary/20 hover:bg-primary/5 text-primary"
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
          >
            {isDownloadingTemplate ? (
              <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1.5" />
            )}
            Download Excel Template
          </Button>
        </div>
      </div>

      {/* Workflow Step Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {[
          { step: '1', title: 'Download Template', desc: 'Pre-filled with DB categories' },
          { step: '2', title: 'Fill & Upload', desc: 'Bilingual names, pricing & stock' },
          { step: '3', title: 'Validate & Preview', desc: 'Check errors & duplicate rules' },
          { step: '4', title: 'Import & Summary', desc: 'Safe batch insertion to DB' },
        ].map((item, idx) => {
          const currentStep = importResult ? 4 : summary ? 3 : file ? 2 : 1;
          const isActive = parseInt(item.step) === currentStep;
          const isDone = parseInt(item.step) < currentStep;

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition-all ${
                isActive
                  ? 'bg-primary/5 border-primary/40 shadow-xs'
                  : isDone
                  ? 'bg-card border-border opacity-90'
                  : 'bg-card/50 border-border/50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isDone ? '✓' : item.step}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-foreground">{item.title}</h4>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Container */}
      {!importResult ? (
        <div className="space-y-6">
          {/* Upload Dropzone & Configuration Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Dropzone */}
            <div className="lg:col-span-7">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                  dragOver
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : file
                    ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-border hover:border-primary/50 bg-card hover:bg-muted/30'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                {isValidating ? (
                  <div className="flex flex-col items-center py-4 space-y-3">
                    <RefreshCw className="h-10 w-10 text-primary animate-spin" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground">Validating Excel File...</p>
                      <p className="text-xs text-muted-foreground">
                        Matching categories, verifying SKU uniqueness and price structures...
                      </p>
                    </div>
                  </div>
                ) : file ? (
                  <div className="flex flex-col items-center py-2 space-y-3 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB • Ready for preview
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change File
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={handleReset}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4 space-y-3 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Click or drag & drop your completed Excel spreadsheet
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Supports .xlsx or .xls files created from the official template
                      </p>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-muted text-muted-foreground">
                      Browse Computer
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Duplicate Settings & Rules */}
            <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-card border border-border space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Duplicate Resolution Policy
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  How should the system handle products whose SKU or slug already exists in your store?
                </p>

                <div className="space-y-2 pt-3">
                  {[
                    {
                      id: 'update',
                      label: 'Update Existing Products (Recommended)',
                      desc: 'Overwrites selling price, MRP, stock, and descriptions for existing items, and inserts new ones.',
                    },
                    {
                      id: 'skip',
                      label: 'Skip Existing Products',
                      desc: 'Leaves already registered products untouched and only adds new firework items.',
                    },
                    {
                      id: 'stop',
                      label: 'Stop Import on Conflict',
                      desc: 'Aborts the import process entirely if any duplicate SKU is detected in the database.',
                    },
                  ].map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        duplicateMode === option.id
                          ? 'bg-primary/5 border-primary/50 ring-1 ring-primary/20'
                          : 'bg-muted/30 border-border hover:bg-muted/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="duplicateMode"
                        value={option.id}
                        checked={duplicateMode === option.id}
                        onChange={(e) => setDuplicateMode(e.target.value as any)}
                        className="mt-0.5 accent-primary"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-foreground block">
                          {option.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground block leading-tight">
                          {option.desc}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5" /> Need the latest category list?
                </span>
                <button
                  onClick={handleDownloadTemplate}
                  className="font-semibold text-primary hover:underline"
                >
                  Get Template
                </button>
              </div>
            </div>
          </div>

          {/* Validation Metrics Dashboard */}
          {summary && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-xs font-semibold text-muted-foreground">Total Rows in File</p>
                  <p className="text-2xl font-black text-foreground mt-1">{summary.totalRows}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Valid for Import
                  </p>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                    {summary.validRows}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-xl border ${
                    summary.errorRows > 0
                      ? 'bg-rose-500/10 border-rose-500/20'
                      : 'bg-card border-border'
                  }`}
                >
                  <p
                    className={`text-xs font-semibold flex items-center gap-1 ${
                      summary.errorRows > 0
                        ? 'text-rose-700 dark:text-rose-400'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <AlertCircle className="h-3.5 w-3.5" /> Validation Errors
                  </p>
                  <p
                    className={`text-2xl font-black mt-1 ${
                      summary.errorRows > 0
                        ? 'text-rose-700 dark:text-rose-400'
                        : 'text-foreground'
                    }`}
                  >
                    {summary.errorRows}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <RefreshCw className="h-3.5 w-3.5 text-blue-500" /> Existing Matches
                  </p>
                  <p className="text-2xl font-black text-foreground mt-1">
                    {summary.existingCount}{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({summary.newCount} new)
                    </span>
                  </p>
                </div>
              </div>

              {/* Toolbar & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-card border border-border">
                {/* Filters */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
                    <button
                      onClick={() => setPreviewFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        previewFilter === 'all'
                          ? 'bg-card text-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      All ({rows.length})
                    </button>
                    <button
                      onClick={() => setPreviewFilter('valid')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        previewFilter === 'valid'
                          ? 'bg-card text-emerald-600 shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Valid ({summary.validRows})
                    </button>
                    <button
                      onClick={() => setPreviewFilter('error')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        previewFilter === 'error'
                          ? 'bg-card text-rose-600 shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Errors ({summary.errorRows})
                    </button>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search preview..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary w-44 sm:w-56"
                    />
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="flex items-center gap-2">
                  {summary.errorRows > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-semibold text-rose-600 border-rose-300 hover:bg-rose-50"
                      onClick={handleDownloadErrorReport}
                      disabled={isDownloadingErrors}
                    >
                      {isDownloadingErrors ? (
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Download Error Report (.xlsx)
                    </Button>
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs font-bold shadow-sm"
                    disabled={summary.validRows === 0 || isImporting}
                    onClick={handleConfirmImport}
                  >
                    {isImporting ? (
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Import {summary.validRows} Products
                  </Button>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-muted/60 sticky top-0 z-10 border-b border-border backdrop-blur-xs text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 w-16">Row #</th>
                        <th className="py-2.5 px-3 w-28">Status</th>
                        <th className="py-2.5 px-3">Product (English & Tamil)</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">MRP / Offer</th>
                        <th className="py-2.5 px-3">Stock / Alert</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Validation Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 font-medium">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-muted-foreground text-xs">
                            No rows matching the filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row) => {
                          const isErr = row.status === 'error';
                          const p = row.parsed;

                          return (
                            <tr
                              key={row.rowNumber}
                              className={`hover:bg-muted/30 transition-colors ${
                                isErr ? 'bg-rose-500/5' : ''
                              }`}
                            >
                              <td className="py-3 px-3 text-muted-foreground font-mono">
                                #{row.rowNumber}
                              </td>

                              <td className="py-3 px-3">
                                {isErr ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                    <AlertCircle className="h-3 w-3" /> Error
                                  </span>
                                ) : (
                                  <div className="flex flex-col gap-1 items-start">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                      <CheckCircle2 className="h-3 w-3" /> Valid
                                    </span>
                                    {row.isExisting && (
                                      <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400">
                                        Existing Match
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-3">
                                <div className="space-y-0.5">
                                  <p className="font-bold text-foreground text-xs">
                                    {p?.name || row.raw['Product Name (EN)'] || row.raw['name'] || '-'}
                                  </p>
                                  {(p?.nameTa || row.raw['Product Name (TA)'] || row.raw['nameTa']) && (
                                    <p className="text-[11px] text-muted-foreground font-tamil">
                                      {p?.nameTa || row.raw['Product Name (TA)'] || row.raw['nameTa']}
                                    </p>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                {p ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-muted font-medium text-foreground">
                                    {p.categoryName}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    {row.raw['Category (Name or Slug)'] || row.raw['category'] || '-'}
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-3">
                                {p ? (
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-foreground">
                                        {formatCurrency(p.sellingPrice)}
                                      </span>
                                      <span className="line-through text-muted-foreground text-[10px]">
                                        {formatCurrency(p.mrp)}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-600">
                                      {calculateDiscountPercent(p.mrp, p.sellingPrice)}% OFF
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">
                                    MRP: {row.raw['MRP (₹)'] || row.raw['mrp'] || '-'} | Price:{' '}
                                    {row.raw['Selling Price (₹)'] || row.raw['sellingPrice'] || '-'}
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-3">
                                {p ? (
                                  <div>
                                    <span className="font-bold text-foreground">
                                      {p.stockQuantity} pcs
                                    </span>
                                    <p className="text-[10px] text-muted-foreground">
                                      Alert: {p.lowStockThreshold}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">
                                    {row.raw['Stock Quantity'] || row.raw['stockQuantity'] || 0}
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-3 font-mono text-[11px] text-muted-foreground">
                                {p?.sku || row.raw['SKU'] || row.raw['sku'] || '-'}
                              </td>

                              <td className="py-3 px-3 max-w-xs">
                                {isErr ? (
                                  <ul className="list-disc list-inside space-y-0.5 text-rose-600 dark:text-rose-400 text-[11px]">
                                    {row.errors.map((e, eIdx) => (
                                      <li key={eIdx}>{e}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center gap-1">
                                    Ready for DB import
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 4. Import Success & Summary Screen */
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-card border border-border shadow-xs text-center max-w-2xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Products Successfully Imported!</h2>
              <p className="text-xs text-muted-foreground">
                Your database catalog has been updated directly according to your configured duplicate resolution
                strategy.
              </p>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                <p className="text-[11px] font-semibold text-muted-foreground">Processed</p>
                <p className="text-xl font-black text-foreground mt-0.5">{importResult.total}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  Newly Added
                </p>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {importResult.imported}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">Updated</p>
                <p className="text-xl font-black text-blue-700 dark:text-blue-400 mt-0.5">
                  {importResult.updated}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Skipped</p>
                <p className="text-xl font-black text-amber-700 dark:text-amber-400 mt-0.5">
                  {importResult.skipped}
                </p>
              </div>
            </div>

            {/* Errors breakdown if any */}
            {importResult.failed > 0 && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-left space-y-2">
                <p className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> {importResult.failed} items failed during import:
                </p>
                <ul className="list-disc list-inside text-xs text-rose-700 space-y-1">
                  {importResult.errors.map((err, i) => (
                    <li key={i}>
                      <span className="font-semibold">{err.name}:</span> {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/admin/products" className="w-full sm:w-auto">
                <Button variant="primary" size="md" className="w-full font-bold text-xs">
                  <Package className="h-4 w-4 mr-1.5" /> View Products Catalog
                </Button>
              </Link>
              <Button
                variant="outline"
                size="md"
                className="w-full sm:w-auto font-semibold text-xs"
                onClick={handleReset}
              >
                Upload Another File
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
