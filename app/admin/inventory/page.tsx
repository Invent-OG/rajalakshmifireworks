'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { Pagination } from '@/components/admin/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Portal } from '@/components/ui/portal';
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
} from 'lucide-react';
import { toast } from 'sonner';

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

export default function AdminInventoryPage() {
  const queryClient = useQueryClient();

  // Tab State
  const [activeTab, setActiveTab] = useState<'stock' | 'audit'>('stock');

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filter, setFilter] = useState<'all' | 'low' | 'out' | 'healthy'>('all');
  const [search, setSearch] = useState('');

  // Modal State for Manual Adjustment
  const [adjustingProduct, setAdjustingProduct] = useState<InventoryItem | null>(null);
  const [quantityChange, setQuantityChange] = useState<number>(10);
  const [adjustType, setAdjustType] = useState<
    'STOCK_ADDED' | 'STOCK_REMOVED' | 'MANUAL_ADJUSTMENT'
  >('STOCK_ADDED');
  const [note, setNote] = useState('');

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

  // Adjust Mutation
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

  // Quick Quick-Add Stepper Handler (+10, +50, -5)
  const handleQuickAdjust = (product: InventoryItem, delta: number) => {
    const isAdding = delta > 0;
    adjustMutation.mutate({
      productId: product.id,
      qty: Math.abs(delta),
      type: isAdding ? 'STOCK_ADDED' : 'STOCK_REMOVED',
      auditNote: `Quick stepper adjust (${delta > 0 ? `+${delta}` : delta} units)`,
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

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Inventory</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor live warehouse stock, replenish firework batches, and audit movement logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            className="text-xs font-semibold"
            onClick={handleExportRestockSheet}
          >
            <Download className="h-4 w-4 mr-1 text-muted-foreground" /> Restock Sheet CSV
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
      <div className="flex items-center gap-2 border-b border-border/80">
        <button
          onClick={() => {
            setActiveTab('stock');
            setPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'stock'
              ? 'border-brand text-brand'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Boxes className="h-4 w-4" /> Warehouse Stock Balances
        </button>

        <button
          onClick={() => {
            setActiveTab('audit');
            setPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'audit'
              ? 'border-brand text-brand'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="h-4 w-4" /> Movement Audit Trail
        </button>
      </div>

      {activeTab === 'stock' ? (
        <>
          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-2xl bg-card border border-border">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search product name or SKU..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-muted/30 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                variant={filter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  setFilter('all');
                  setPage(1);
                }}
                className="text-xs"
              >
                All ({stats.totalProducts})
              </Button>
              <Button
                variant={filter === 'low' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  setFilter('low');
                  setPage(1);
                }}
                className="text-xs"
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Low Stock ({stats.lowStockCount})
              </Button>
              <Button
                variant={filter === 'out' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  setFilter('out');
                  setPage(1);
                }}
                className="text-xs"
              >
                <TrendingDown className="h-3.5 w-3.5 mr-1" /> Out of Stock ({stats.outOfStockCount})
              </Button>
            </div>
          </div>

          {/* Stock Table */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-2xl" />
              ))}
            </div>
          ) : inventory.length > 0 ? (
            <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-5 py-3.5">Product Name</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5 text-center">Warehouse Stock</th>
                      <th className="px-5 py-3.5 text-center">Reorder Limit</th>
                      <th className="px-5 py-3.5">Health</th>
                      <th className="px-5 py-3.5 text-center">Quick Adjust</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {inventory.map((item: InventoryItem) => {
                      const stock = item.stockQuantity;
                      const status =
                        stock <= 0
                          ? 'OUT_OF_STOCK'
                          : stock <= item.lowStockThreshold
                          ? 'LOW_STOCK'
                          : 'IN_STOCK';

                      return (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
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
                                className="h-7 px-2 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100 transition-colors"
                                title="Add 10 units"
                              >
                                +10
                              </button>
                              <button
                                onClick={() => handleQuickAdjust(item, 50)}
                                disabled={adjustMutation.isPending}
                                className="h-7 px-2 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100 transition-colors"
                                title="Add 50 units"
                              >
                                +50
                              </button>
                              <button
                                onClick={() => handleQuickAdjust(item, -1)}
                                disabled={adjustMutation.isPending || stock <= 0}
                                className="h-7 px-2 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold hover:bg-rose-100 transition-colors disabled:opacity-40"
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

      {/* Stock Adjustment Modal */}
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
    </div>
  );
}
