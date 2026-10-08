'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { Pagination } from '@/components/admin/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Portal } from '@/components/ui/portal';
import { BulkActionsBar } from '@/components/admin/bulk-actions-bar';
import { formatDateTime } from '@/lib/utils/format';
import {
  Warehouse,
  Search,
  Download,
  History,
  Boxes,
  Plus,
  Minus,
  AlertTriangle,
  TrendingDown,
  UploadCloud,
  FileSpreadsheet,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface InventoryItem {
  id: number;
  name: string;
  sku: string | null;
  stockQuantity: number;
  lowStockThreshold: number;
  category?: { name: string } | null;
}

interface AuditLogEntry {
  id: number;
  type: string;
  quantityChange: number;
  quantityAfter: number;
  note: string | null;
  performedBy: string;
  createdAt: string;
  product?: { name: string; sku: string | null };
}

interface ParsedImportRow {
  rowNumber: number;
  productId?: number;
  sku?: string;
  productName: string;
  currentStock: number;
  newStock: number;
  quantityChange: number;
  status: 'valid' | 'error' | 'unchanged';
  error?: string;
}

import { withAdminShell } from './admin-shell';

function AdminInventoryPageContent() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'stock' | 'audit'>('stock');

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filter, setFilter] = useState<'all' | 'low' | 'out' | 'healthy'>('all');
  const [search, setSearch] = useState('');

  // Multi-Selection State for Bulk Actions (stores Map of id -> item)
  const [selectedItemsMap, setSelectedItemsMap] = useState<Map<number, InventoryItem>>(new Map());

  // Single Manual Adjustment Modal State
  const [adjustingProduct, setAdjustingProduct] = useState<InventoryItem | null>(null);
  const [quantityChange, setQuantityChange] = useState<number>(10);
  const [adjustType, setAdjustType] = useState<
    'STOCK_ADDED' | 'STOCK_REMOVED' | 'MANUAL_ADJUSTMENT'
  >('STOCK_ADDED');
  const [note, setNote] = useState('');

  // Bulk Adjustment Modal State
  const [bulkAdjustModalOpen, setBulkAdjustModalOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<'ADD' | 'REMOVE' | 'SET'>('ADD');
  const [bulkQuantity, setBulkQuantity] = useState<number>(10);
  const [bulkNote, setBulkNote] = useState('');

  // Bulk Excel/CSV Import Modal State
  const [bulkImportModalOpen, setBulkImportModalOpen] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parsedImportRows, setParsedImportRows] = useState<ParsedImportRow[]>([]);
  const [importNote, setImportNote] = useState('Bulk spreadsheet stock update');

  // Fetch Inventory or Audit Trail
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'inventory', { activeTab, page, limit: pageSize, filter, search }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      params.set('view', activeTab);
      if (activeTab === 'stock') {
        if (filter !== 'all') params.set('filter', filter);
        if (search) params.set('search', search);
      }
      return fetch(`/api/admin/inventory?${params}`).then((r) => r.json());
    },
  });

  const inventory: InventoryItem[] = data?.inventory || [];
  const auditLogs: AuditLogEntry[] = data?.auditLogs || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0, limit: 25 };
  const stats = data?.stats || {
    totalProducts: 0,
    totalStockUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  };

  // Single Item Adjust Mutation
  const adjustMutation = useMutation({
    mutationFn: async ({
      productId,
      qty,
      type,
      auditNote,
    }: {
      productId: number;
      qty: number;
      type: string;
      auditNote?: string;
    }) => {
      const finalChange = type === 'STOCK_REMOVED' ? -Math.abs(qty) : qty;

      const res = await fetch(`/api/admin/inventory/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantityChange: finalChange,
          type,
          note: auditNote || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to adjust stock');
      return resData;
    },
    onSuccess: () => {
      toast.success('Stock adjusted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      setAdjustingProduct(null);
      setNote('');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Bulk Adjust Mutation (API /api/admin/inventory/bulk)
  const bulkAdjustMutation = useMutation({
    mutationFn: async (payload: {
      mode: 'ADD' | 'REMOVE' | 'SET' | 'CUSTOM';
      quantity?: number;
      defaultNote?: string;
      items: Array<{
        productId?: number;
        sku?: string;
        quantityChange?: number;
        newStock?: number;
        note?: string;
      }>;
    }) => {
      const res = await fetch('/api/admin/inventory/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to update stock in bulk');
      return resData;
    },
    onSuccess: (resData) => {
      toast.success(`Successfully updated stock for ${resData.updatedCount} fireworks`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      setSelectedItemsMap(new Map());
      setBulkAdjustModalOpen(false);
      setBulkImportModalOpen(false);
      setImportFile(null);
      setParsedImportRows([]);
      setBulkNote('');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Selection handlers
  const toggleSelectProduct = (item: InventoryItem) => {
    setSelectedItemsMap((prev) => {
      const next = new Map(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.set(item.id, item);
      }
      return next;
    });
  };

  const allOnPageSelected =
    inventory.length > 0 && inventory.every((item) => selectedItemsMap.has(item.id));

  const handleSelectAllOnPage = () => {
    setSelectedItemsMap((prev) => {
      const next = new Map(prev);
      if (allOnPageSelected) {
        inventory.forEach((i) => next.delete(i.id));
      } else {
        inventory.forEach((i) => next.set(i.id, i));
      }
      return next;
    });
  };

  // Quick Stepper Handler for single item (+10, +50, -1)
  const handleQuickAdjust = (product: InventoryItem, delta: number) => {
    const isAdding = delta > 0;
    adjustMutation.mutate({
      productId: product.id,
      qty: Math.abs(delta),
      type: isAdding ? 'STOCK_ADDED' : 'STOCK_REMOVED',
      auditNote: `Quick stepper adjust (${delta > 0 ? `+${delta}` : delta} units)`,
    });
  };

  // Quick Bulk Stepper Handler for all selected items
  const handleQuickBulkAdjust = (mode: 'ADD' | 'REMOVE', qty: number) => {
    const items = Array.from(selectedItemsMap.values()).map((p) => ({
      productId: p.id,
    }));

    if (items.length === 0) return;

    bulkAdjustMutation.mutate({
      mode,
      quantity: qty,
      items,
      defaultNote: `Quick bulk stepper (${mode === 'ADD' ? `+${qty}` : `-${qty}`} units)`,
    });
  };

  // Apply Bulk Adjustment from Modal
  const handleApplyBulkAdjust = () => {
    const items = Array.from(selectedItemsMap.values()).map((p) => ({
      productId: p.id,
    }));

    if (items.length === 0) {
      toast.error('No fireworks selected');
      return;
    }

    bulkAdjustMutation.mutate({
      mode: bulkMode,
      quantity: bulkQuantity,
      items,
      defaultNote: bulkNote.trim() || `Bulk ${bulkMode.toLowerCase()} adjustment`,
    });
  };

  // Download Bulk Stock Template (.xlsx)
  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      const res = await fetch('/api/admin/inventory/bulk?action=template');
      if (!res.ok) throw new Error('Failed to generate template');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rajalakshmi_Fireworks_Stock_Update_Template_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Stock update template downloaded');
    } catch (err: any) {
      toast.error(err.message || 'Could not download template');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // Parse Uploaded Spreadsheet File (Excel / CSV)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Please upload an Excel (.xlsx, .xls) or CSV file');
      return;
    }

    setImportFile(file);
    setIsParsingFile(true);

    try {
      // 1. Fetch current active catalog products for matching
      const catalogRes = await fetch('/api/admin/inventory/bulk');
      const catalogData = await catalogRes.json();
      const catalogProducts: Array<{
        id: number;
        sku: string | null;
        name: string;
        stockQuantity: number;
      }> = catalogData?.products || [];

      const byId = new Map(catalogProducts.map((p) => [p.id, p]));
      const bySku = new Map(
        catalogProducts
          .filter((p) => p.sku)
          .map((p) => [p.sku!.trim().toLowerCase(), p])
      );

      // 2. Parse file buffer using XLSX
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = wb.SheetNames[0];
      const ws = wb.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (rawRows.length === 0) {
        toast.error('The uploaded sheet is empty');
        setIsParsingFile(false);
        return;
      }

      // 3. Match and validate each row
      const parsed: ParsedImportRow[] = [];

      rawRows.forEach((row, index) => {
        const rowNumber = index + 2; // +1 for 1-based, +1 for header

        // Identify product ID or SKU from flexible column names
        const rawId =
          row['Product ID'] ||
          row['productId'] ||
          row['ID'] ||
          row['id'] ||
          row['Product Id'];
        const rawSku =
          row['SKU'] ||
          row['sku'] ||
          row['Item Code'] ||
          row['Product SKU'] ||
          row['Code'];

        const parsedId = rawId ? parseInt(String(rawId), 10) : undefined;
        const normalizedSku = rawSku ? String(rawSku).trim().toLowerCase() : undefined;

        const matchedProduct =
          (parsedId && byId.get(parsedId)) ||
          (normalizedSku && bySku.get(normalizedSku));

        if (!matchedProduct) {
          // If row has no identifiers at all, skip
          if (!rawId && !rawSku) return;

          parsed.push({
            rowNumber,
            productId: parsedId,
            sku: rawSku ? String(rawSku) : undefined,
            productName: row['Product Name'] || 'Unknown Firework',
            currentStock: 0,
            newStock: 0,
            quantityChange: 0,
            status: 'error',
            error: `Product not found (ID: ${rawId || '—'}, SKU: ${rawSku || '—'})`,
          });
          return;
        }

        // Identify stock value columns
        const exactStockVal =
          row['New Stock Quantity (Set Exact)'] ??
          row['New Stock Quantity'] ??
          row['New Stock'] ??
          row['New Quantity'] ??
          row['Stock'] ??
          row['Quantity'];

        const adjustmentVal =
          row['Stock Adjustment (+/-)'] ??
          row['Stock Adjustment'] ??
          row['Adjustment'] ??
          row['Add Stock'] ??
          row['Change'];

        const hasExact =
          exactStockVal !== undefined &&
          exactStockVal !== '' &&
          !isNaN(Number(exactStockVal));
        const hasAdjustment =
          adjustmentVal !== undefined &&
          adjustmentVal !== '' &&
          !isNaN(Number(adjustmentVal));

        if (!hasExact && !hasAdjustment) {
          parsed.push({
            rowNumber,
            productId: matchedProduct.id,
            sku: matchedProduct.sku || undefined,
            productName: matchedProduct.name,
            currentStock: matchedProduct.stockQuantity,
            newStock: matchedProduct.stockQuantity,
            quantityChange: 0,
            status: 'unchanged',
          });
          return;
        }

        let newStock = matchedProduct.stockQuantity;
        let delta = 0;

        if (hasExact) {
          newStock = parseInt(String(exactStockVal), 10);
          delta = newStock - matchedProduct.stockQuantity;
        } else if (hasAdjustment) {
          delta = parseInt(String(adjustmentVal), 10);
          newStock = matchedProduct.stockQuantity + delta;
        }

        if (newStock < 0) {
          parsed.push({
            rowNumber,
            productId: matchedProduct.id,
            sku: matchedProduct.sku || undefined,
            productName: matchedProduct.name,
            currentStock: matchedProduct.stockQuantity,
            newStock,
            quantityChange: delta,
            status: 'error',
            error: `Cannot reduce stock below 0 (Current: ${matchedProduct.stockQuantity}, Change: ${delta})`,
          });
        } else {
          parsed.push({
            rowNumber,
            productId: matchedProduct.id,
            sku: matchedProduct.sku || undefined,
            productName: matchedProduct.name,
            currentStock: matchedProduct.stockQuantity,
            newStock,
            quantityChange: delta,
            status: delta === 0 ? 'unchanged' : 'valid',
          });
        }
      });

      setParsedImportRows(parsed);
      toast.success(`Processed ${parsed.length} rows from ${file.name}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to read spreadsheet file');
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Submit Bulk Import
  const handleApplySpreadsheetImport = () => {
    const validChanges = parsedImportRows.filter(
      (r) => r.status === 'valid' && r.quantityChange !== 0 && r.productId
    );

    if (validChanges.length === 0) {
      toast.error('No valid stock updates found in spreadsheet');
      return;
    }

    bulkAdjustMutation.mutate({
      mode: 'CUSTOM',
      defaultNote: importNote.trim() || 'Bulk spreadsheet stock update',
      items: validChanges.map((r) => ({
        productId: r.productId,
        sku: r.sku,
        newStock: r.newStock,
        note: `Spreadsheet update (Row ${r.rowNumber})`,
      })),
    });
  };

  // Export Restock Sheet CSV
  const handleExportRestockSheet = () => {
    if (inventory.length === 0) {
      toast.error('No inventory items to export');
      return;
    }

    const headers = [
      'Product ID',
      'Product Name',
      'SKU',
      'Category',
      'Current Warehouse Stock',
      'Reorder Threshold',
      'Deficit / Order Recommendation',
      'Stock Status',
    ];

    const rows = inventory.map((item) => {
      const deficit = Math.max(0, item.lowStockThreshold * 2 - item.stockQuantity);
      const status =
        item.stockQuantity <= 0
          ? 'OUT_OF_STOCK'
          : item.stockQuantity <= item.lowStockThreshold
          ? 'LOW_STOCK'
          : 'HEALTHY';

      return [
        item.id,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.sku || ''}"`,
        `"${item.category?.name || 'Uncategorized'}"`,
        item.stockQuantity,
        item.lowStockThreshold,
        deficit,
        status,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `sivakasi_restock_sheet_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sivakasi factory restock sheet exported');
  };

  const selectedCount = selectedItemsMap.size;
  const selectedProductsList = Array.from(selectedItemsMap.values());

  // Check if any selected item would drop below 0 in bulk modal
  const hasNegativeStockWarning =
    bulkMode === 'REMOVE' &&
    selectedProductsList.some((p) => p.stockQuantity - bulkQuantity < 0);

  // Spreadsheet import counters
  const validChangedCount = parsedImportRows.filter(
    (r) => r.status === 'valid' && r.quantityChange !== 0
  ).length;
  const errorCount = parsedImportRows.filter((r) => r.status === 'error').length;
  const unchangedCount = parsedImportRows.filter((r) => r.status === 'unchanged').length;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Inventory</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor live warehouse stock, perform batch replenishments, and audit movement logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="md"
            className="text-xs font-semibold"
            onClick={handleExportRestockSheet}
          >
            <Download className="h-4 w-4 mr-1 text-muted-foreground" /> Restock Sheet CSV
          </Button>

          <Button
            variant="primary"
            size="md"
            className="text-xs font-semibold"
            onClick={() => setBulkImportModalOpen(true)}
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Bulk Stock Import (Excel/CSV)
          </Button>
        </div>
      </div>

      {/* Stock Health KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border space-y-1.5 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">Catalog SKUs</span>
          <p className="text-2xl font-bold text-foreground">{stats.totalProducts}</p>
          <p className="text-[11px] text-muted-foreground">Active fireworks</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border space-y-1.5 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">Total Units in Stock</span>
          <p className="text-2xl font-bold text-emerald-700">
            {stats.totalStockUnits.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium">Ready for dispatch</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border space-y-1.5 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">Low Stock Warnings</span>
          <p className="text-2xl font-bold text-amber-700">{stats.lowStockCount}</p>
          <p className="text-[11px] text-muted-foreground">Under reorder limit</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border space-y-1.5 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">Out of Stock</span>
          <p className="text-2xl font-bold text-rose-700">{stats.outOfStockCount}</p>
          <p className="text-[11px] text-muted-foreground">Depleted inventory</p>
        </div>
      </div>

      {/* Main View Tabs (Stock Balances vs Audit Trail) */}
      <div className="flex items-center gap-3 border-b border-border/80">
        <button
          onClick={() => {
            setActiveTab('stock');
            setPage(1);
          }}
          className={`flex items-center gap-3 px-6 py-3.5 text-base font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'stock'
              ? 'border-brand text-brand'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Boxes className="h-5 w-5" /> Warehouse Stock Balances
        </button>

        <button
          onClick={() => {
            setActiveTab('audit');
            setPage(1);
          }}
          className={`flex items-center gap-3 px-6 py-3.5 text-base font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'border-brand text-brand'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="h-5 w-5" /> Movement Audit Trail
        </button>
      </div>

      {activeTab === 'stock' ? (
        <>
          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center gap-3.5 p-5 rounded-2xl bg-card border border-border shadow-xs">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search product name or SKU..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full h-12 pl-12 pr-4 rounded-2xl border border-border bg-secondary/40 text-base font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-all"
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant={filter === 'all' ? 'primary' : 'outline'}
                size="md"
                onClick={() => {
                  setFilter('all');
                  setPage(1);
                }}
                className="text-base font-bold h-12 px-5 rounded-2xl cursor-pointer"
              >
                All ({stats.totalProducts})
              </Button>
              <Button
                variant={filter === 'low' ? 'primary' : 'outline'}
                size="md"
                onClick={() => {
                  setFilter('low');
                  setPage(1);
                }}
                className="text-base font-bold h-12 px-5 rounded-2xl cursor-pointer"
              >
                <AlertTriangle className="h-4.5 w-4.5 mr-2 text-amber-500" /> Low Stock ({stats.lowStockCount})
              </Button>
              <Button
                variant={filter === 'out' ? 'primary' : 'outline'}
                size="md"
                onClick={() => {
                  setFilter('out');
                  setPage(1);
                }}
                className="text-base font-bold h-12 px-5 rounded-2xl cursor-pointer"
              >
                <TrendingDown className="h-4.5 w-4.5 mr-2 text-rose-500" /> Out of Stock ({stats.outOfStockCount})
              </Button>
            </div>
          </div>

          {/* Stock Table */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : inventory.length > 0 ? (
            <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-base">
                  <thead className="bg-muted/60 text-muted-foreground border-b border-border text-xs sm:text-sm uppercase tracking-wider font-bold">
                    <tr>
                      <th className="w-12 px-5 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={allOnPageSelected}
                          onChange={handleSelectAllOnPage}
                          className="rounded border-border accent-brand cursor-pointer h-5 w-5"
                          title="Select all on this page"
                        />
                      </th>
                      <th className="px-5 py-4">Product Name</th>
                      <th className="px-5 py-4">Category</th>
                      <th className="px-5 py-4 text-center">Warehouse Stock</th>
                      <th className="px-5 py-4 text-center">Reorder Limit</th>
                      <th className="px-5 py-4">Health</th>
                      <th className="px-5 py-4 text-center">Quick Adjust</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {inventory.map((item: InventoryItem) => {
                      const stock = item.stockQuantity;
                      const isSelected = selectedItemsMap.has(item.id);
                      const status =
                        stock <= 0
                          ? 'OUT_OF_STOCK'
                          : stock <= item.lowStockThreshold
                          ? 'LOW_STOCK'
                          : 'IN_STOCK';

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-brand/5' : 'hover:bg-muted/30'
                          }`}
                        >
                          <td className="w-10 px-4 py-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectProduct(item)}
                              className="rounded border-border accent-brand cursor-pointer h-4 w-4"
                            />
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-foreground">{item.name}</p>
                            {item.sku && (
                              <p className="text-[11px] font-mono text-muted-foreground">
                                {item.sku}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground font-medium">
                            {item.category?.name || '—'}
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-foreground text-center text-sm">
                            {stock}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground font-mono text-center">
                            {item.lowStockThreshold}
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusBadge status={status} />
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {/* Quick Stepper Buttons for Warehouse Operators */}
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleQuickAdjust(item, 10)}
                                disabled={adjustMutation.isPending}
                                className="h-7 px-2 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                                title="Add 10 units"
                              >
                                +10
                              </button>
                              <button
                                onClick={() => handleQuickAdjust(item, 50)}
                                disabled={adjustMutation.isPending}
                                className="h-7 px-2 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                                title="Add 50 units"
                              >
                                +50
                              </button>
                              <button
                                onClick={() => handleQuickAdjust(item, -1)}
                                disabled={adjustMutation.isPending || stock <= 0}
                                className="h-7 px-2 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold hover:bg-rose-100 transition-colors disabled:opacity-40 cursor-pointer"
                                title="Deduct 1 unit"
                              >
                                -1
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs font-semibold"
                              onClick={() => {
                                setAdjustingProduct(item);
                                setQuantityChange(10);
                                setAdjustType('STOCK_ADDED');
                                setNote('');
                              }}
                            >
                              Manual Count
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 bg-card border-t border-border">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  pageSize={pagination.limit}
                  onPageChange={(p) => setPage(p)}
                  onPageSizeChange={(sz) => {
                    setPageSize(sz);
                    setPage(1);
                  }}
                  itemLabel="items"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-2xl border border-border p-8 space-y-2">
              <Warehouse className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="font-semibold text-foreground">No inventory records found</p>
            </div>
          )}

          {/* Floating Bulk Actions Bar */}
          <BulkActionsBar
            selectedCount={selectedCount}
            onClearSelection={() => setSelectedItemsMap(new Map())}
            itemLabel="fireworks"
          >
            <Button
              size="sm"
              variant="outline"
              className="bg-background text-foreground hover:bg-background/90 text-xs font-semibold"
              onClick={() => {
                setBulkMode('ADD');
                setBulkQuantity(10);
                setBulkNote('');
                setBulkAdjustModalOpen(true);
              }}
            >
              <Layers className="h-3.5 w-3.5 mr-1" /> Bulk Adjust Stock
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="bg-background text-emerald-600 hover:bg-background/90 text-xs font-semibold"
              onClick={() => handleQuickBulkAdjust('ADD', 10)}
              disabled={bulkAdjustMutation.isPending}
            >
              +10 All
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="bg-background text-emerald-600 hover:bg-background/90 text-xs font-semibold"
              onClick={() => handleQuickBulkAdjust('ADD', 50)}
              disabled={bulkAdjustMutation.isPending}
            >
              +50 All
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="bg-background text-rose-600 hover:bg-background/90 text-xs font-semibold"
              onClick={() => handleQuickBulkAdjust('REMOVE', 1)}
              disabled={bulkAdjustMutation.isPending}
            >
              -1 All
            </Button>
          </BulkActionsBar>
        </>
      ) : (
        /* Audit Trail View */
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-2xl" />
              ))}
            </div>
          ) : auditLogs.length > 0 ? (
            <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-5 py-3.5">Timestamp</th>
                      <th className="px-5 py-3.5">Product</th>
                      <th className="px-5 py-3.5">Movement Type</th>
                      <th className="px-5 py-3.5 text-right">Change</th>
                      <th className="px-5 py-3.5 text-right">Stock After</th>
                      <th className="px-5 py-3.5">Audit Note</th>
                      <th className="px-5 py-3.5">Performed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {auditLogs.map((log) => {
                      const isPositive = log.quantityChange > 0;

                      return (
                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDateTime(log.createdAt)}
                          </td>
                          <td className="px-5 py-3.5 font-medium text-foreground">
                            {log.product?.name || 'Deleted Product'}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-[11px] font-semibold text-muted-foreground uppercase">
                              {log.type.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td
                            className={`px-5 py-3.5 font-mono font-bold text-right ${
                              isPositive ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {isPositive ? `+${log.quantityChange}` : log.quantityChange}
                          </td>
                          <td className="px-5 py-3.5 font-mono font-semibold text-foreground text-right">
                            {log.quantityAfter}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-muted-foreground max-w-xs truncate">
                            {log.note || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-foreground font-medium">
                            {log.performedBy}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 bg-card border-t border-border">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  pageSize={pagination.limit}
                  onPageChange={(p) => setPage(p)}
                  onPageSizeChange={(sz) => {
                    setPageSize(sz);
                    setPage(1);
                  }}
                  itemLabel="audit logs"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-2xl border border-border p-8 space-y-2">
              <History className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="font-semibold text-foreground">No inventory transactions logged yet</p>
            </div>
          )}
        </div>
      )}

      {/* Single Product Adjustment Modal */}
      {adjustingProduct && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-card rounded-2xl border border-border max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl">
              <div>
                <h2 className="font-bold text-base text-foreground tracking-tight">
                  Warehouse Stock Adjustment
                </h2>
                <p className="text-xs font-semibold text-brand mt-0.5">{adjustingProduct.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  Current balance: <strong>{adjustingProduct.stockQuantity} units</strong>
                </p>
              </div>

              <div className="space-y-4">
                <Select
                  label="Adjustment Type"
                  value={adjustType}
                  onChange={(e) =>
                    setAdjustType(
                      e.target.value as 'STOCK_ADDED' | 'STOCK_REMOVED' | 'MANUAL_ADJUSTMENT'
                    )
                  }
                  options={[
                    { value: 'STOCK_ADDED', label: 'Add Stock (+ Factory Shipment Received)' },
                    { value: 'STOCK_REMOVED', label: 'Remove Stock (- Damaged / Quality Sample)' },
                    { value: 'MANUAL_ADJUSTMENT', label: 'Manual Physical Stock Reconciliation' },
                  ]}
                />

                <Input
                  label="Quantity Units"
                  type="number"
                  min={1}
                  value={quantityChange}
                  onChange={(e) => setQuantityChange(Math.max(1, parseInt(e.target.value) || 0))}
                />

                <Textarea
                  label="Audit Note (Optional)"
                  placeholder="e.g. Sivakasi factory batch arrival lot #412"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button variant="outline" size="md" onClick={() => setAdjustingProduct(null)}>
                  Cancel
                </Button>
                <Button
                  size="md"
                  variant="primary"
                  className="font-medium"
                  onClick={() =>
                    adjustMutation.mutate({
                      productId: adjustingProduct.id,
                      qty: quantityChange,
                      type: adjustType,
                      auditNote: note,
                    })
                  }
                  loading={adjustMutation.isPending}
                >
                  Save Adjustment
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Bulk Stock Adjustment Modal (Multi-Select) */}
      {bulkAdjustModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-card rounded-2xl border border-border max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-base text-foreground tracking-tight">
                    Bulk Stock Adjustment
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Adjust stock for{' '}
                    <strong className="text-brand font-semibold">{selectedCount}</strong> selected
                    fireworks in a single operation.
                  </p>
                </div>
                <button
                  onClick={() => setBulkAdjustModalOpen(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Mode Selector Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-muted/40 rounded-xl border border-border/80">
                <button
                  type="button"
                  onClick={() => setBulkMode('ADD')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                    bulkMode === 'ADD'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  + Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setBulkMode('REMOVE')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                    bulkMode === 'REMOVE'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  - Deduct Stock
                </button>
                <button
                  type="button"
                  onClick={() => setBulkMode('SET')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                    bulkMode === 'SET'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  = Set Exact Stock
                </button>
              </div>

              <div className="space-y-4">
                <Input
                  label={
                    bulkMode === 'SET'
                      ? 'Set Absolute Stock Level (All Selected)'
                      : bulkMode === 'ADD'
                      ? 'Units to Add to Each Selected Product'
                      : 'Units to Deduct from Each Selected Product'
                  }
                  type="number"
                  min={bulkMode === 'SET' ? 0 : 1}
                  value={bulkQuantity}
                  onChange={(e) =>
                    setBulkQuantity(
                      bulkMode === 'SET'
                        ? Math.max(0, parseInt(e.target.value) || 0)
                        : Math.max(1, parseInt(e.target.value) || 0)
                    )
                  }
                />

                <Textarea
                  label="Audit Note / Reason"
                  placeholder="e.g. Sivakasi factory Diwali replenishment batch #5"
                  value={bulkNote}
                  onChange={(e) => setBulkNote(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Warning for negative stock */}
              {hasNegativeStockWarning && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>
                    Cannot apply: One or more selected fireworks have less stock than the requested
                    deduction of <strong>{bulkQuantity} units</strong>. Stock cannot drop below 0.
                  </span>
                </div>
              )}

              {/* Selected Items Live Preview */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Preview Affected Items ({selectedCount})
                </p>
                <div className="max-h-48 overflow-y-auto divide-y divide-border rounded-xl border border-border bg-muted/20 p-2 text-xs">
                  {selectedProductsList.map((item) => {
                    let newStock = item.stockQuantity;
                    let delta = 0;
                    if (bulkMode === 'ADD') {
                      delta = bulkQuantity;
                      newStock = item.stockQuantity + delta;
                    } else if (bulkMode === 'REMOVE') {
                      delta = -bulkQuantity;
                      newStock = item.stockQuantity + delta;
                    } else {
                      newStock = bulkQuantity;
                      delta = bulkQuantity - item.stockQuantity;
                    }

                    const isNegative = newStock < 0;

                    return (
                      <div
                        key={item.id}
                        className="py-2 px-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="truncate flex-1">
                          <p className="font-semibold text-foreground truncate">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {item.sku || `ID #${item.id}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2">
                          <span className="text-muted-foreground font-mono text-[11px]">
                            {item.stockQuantity}
                          </span>
                          <span className="text-muted-foreground text-[10px]">→</span>
                          <span
                            className={`font-mono font-bold ${
                              isNegative
                                ? 'text-rose-600'
                                : delta > 0
                                ? 'text-emerald-700'
                                : delta < 0
                                ? 'text-rose-700'
                                : 'text-foreground'
                            }`}
                          >
                            {newStock}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-mono ${
                              delta > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : delta < 0
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {delta > 0 ? `+${delta}` : delta}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setBulkAdjustModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="md"
                  variant="primary"
                  className="font-medium"
                  onClick={handleApplyBulkAdjust}
                  loading={bulkAdjustMutation.isPending}
                  disabled={hasNegativeStockWarning || bulkAdjustMutation.isPending}
                >
                  Apply Stock Update ({selectedCount})
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Bulk Stock Import Modal (Excel / CSV) */}
      {bulkImportModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-card rounded-2xl border border-border max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-base text-foreground tracking-tight">
                    Bulk Stock Update via Spreadsheet
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upload an Excel (.xlsx / .xls) or CSV sheet to update live warehouse stock in batch.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setBulkImportModalOpen(false);
                    setImportFile(null);
                    setParsedImportRows([]);
                  }}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Step 1: Download Template */}
              <div className="p-4 rounded-xl bg-brand/5 border border-brand/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Step 1: Download Current Stock Template
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Pre-filled with all catalog fireworks, SKUs, and current warehouse stock levels.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  loading={isDownloadingTemplate}
                  className="shrink-0 text-xs font-semibold bg-card"
                >
                  <Download className="h-3.5 w-3.5 mr-1 text-brand" /> Download Template (.xlsx)
                </Button>
              </div>

              {/* Step 2: Upload File Dropzone */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-foreground">Step 2: Upload Completed File</p>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-brand/50 rounded-2xl p-6 text-center cursor-pointer hover:bg-muted/30 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="h-10 w-10 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {importFile ? importFile.name : 'Click or drag spreadsheet file here'}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Supports .xlsx, .xls, and .csv files with SKU or Product ID
                    </p>
                  </div>
                  {isParsingFile && (
                    <div className="flex items-center gap-1.5 text-xs text-brand font-medium">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Parsing sheet data...
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Parsed Data Preview & Summary */}
              {parsedImportRows.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">
                      Step 3: Review Changes ({parsedImportRows.length} rows processed)
                    </p>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {validChangedCount} with changes
                      </span>
                      {errorCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                          {errorCount} errors
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        {unchangedCount} unchanged
                      </span>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-border bg-card">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/50 border-b border-border text-[10px] uppercase font-bold text-muted-foreground sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Row</th>
                          <th className="px-3 py-2">Product</th>
                          <th className="px-3 py-2 text-center">Current</th>
                          <th className="px-3 py-2 text-center">New Stock</th>
                          <th className="px-3 py-2 text-center">Delta</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {parsedImportRows.map((row) => (
                          <tr key={row.rowNumber} className="hover:bg-muted/20">
                            <td className="px-3 py-2 text-muted-foreground font-mono text-[11px]">
                              #{row.rowNumber}
                            </td>
                            <td className="px-3 py-2 truncate max-w-[180px]">
                              <p className="font-semibold text-foreground truncate">
                                {row.productName}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {row.sku || (row.productId ? `ID #${row.productId}` : '—')}
                              </p>
                            </td>
                            <td className="px-3 py-2 text-center font-mono text-muted-foreground">
                              {row.currentStock}
                            </td>
                            <td className="px-3 py-2 text-center font-mono font-bold text-foreground">
                              {row.newStock}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                  row.quantityChange > 0
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : row.quantityChange < 0
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {row.quantityChange > 0
                                  ? `+${row.quantityChange}`
                                  : row.quantityChange}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              {row.status === 'valid' ? (
                                <span className="inline-flex items-center text-emerald-700 text-[11px] font-semibold gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Ready
                                </span>
                              ) : row.status === 'error' ? (
                                <span
                                  className="inline-flex items-center text-rose-600 text-[11px] font-medium gap-1 truncate max-w-[150px]"
                                  title={row.error}
                                >
                                  <AlertCircle className="h-3 w-3 shrink-0" /> {row.error}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-[11px]">Unchanged</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Textarea
                    label="Audit Note"
                    value={importNote}
                    onChange={(e) => setImportNote(e.target.value)}
                    rows={2}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setBulkImportModalOpen(false);
                    setImportFile(null);
                    setParsedImportRows([]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="md"
                  variant="primary"
                  className="font-medium"
                  onClick={handleApplySpreadsheetImport}
                  loading={bulkAdjustMutation.isPending}
                  disabled={validChangedCount === 0 || bulkAdjustMutation.isPending}
                >
                  Apply Stock Update ({validChangedCount} items)
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

export default withAdminShell(AdminInventoryPageContent);
