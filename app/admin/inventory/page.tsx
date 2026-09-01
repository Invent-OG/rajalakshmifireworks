'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Warehouse, Search } from 'lucide-react';
import { toast } from 'sonner';

interface InventoryItem {
  id: number;
  name: string;
  stockQuantity: number;
  lowStockThreshold: number;
  category?: { name: string } | null;
}

export default function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [search, setSearch] = useState('');
  const [adjustingProduct, setAdjustingProduct] = useState<InventoryItem | null>(null);
  const [quantityChange, setQuantityChange] = useState<number>(10);
  const [adjustType, setAdjustType] = useState<
    'STOCK_ADDED' | 'STOCK_REMOVED' | 'MANUAL_ADJUSTMENT'
  >('STOCK_ADDED');
  const [note, setNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'inventory', 'list', { filter, search }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('filter', filter);
      if (search) params.set('search', search);
      return fetch(`/api/admin/inventory?${params}`).then((r) => r.json());
    },
  });

  const inventory: InventoryItem[] = data?.inventory || [];
  const stats = data?.stats || {
    totalProducts: 0,
    totalStockUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  };

  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!adjustingProduct) return;
      const finalChange =
        adjustType === 'STOCK_REMOVED' ? -Math.abs(quantityChange) : quantityChange;

      const res = await fetch(`/api/admin/inventory/${adjustingProduct.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantityChange: finalChange,
          type: adjustType,
          note,
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Inventory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor stock balances, audit inventory movements, and replenish warehouse units.
          </p>
        </div>
      </div>

      {/* Stock Health KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Listed Products
          </span>
          <p className="text-2xl font-bold text-foreground">{stats.totalProducts}</p>
          <p className="text-[11px] text-muted-foreground">Active catalog SKUs</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Total Warehouse Units
          </span>
          <p className="text-2xl font-bold text-foreground">{stats.totalStockUnits}</p>
          <p className="text-[11px] text-emerald-700 font-medium">Ready for dispatch</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Low Stock Warnings
          </span>
          <p className="text-2xl font-bold text-amber-700">
            {stats.lowStockCount}
          </p>
          <p className="text-[11px] text-muted-foreground">Under reorder threshold</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Out of Stock
          </span>
          <p className="text-2xl font-bold text-rose-700">
            {stats.outOfStockCount}
          </p>
          <p className="text-[11px] text-muted-foreground">Depleted inventory</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-card border border-border">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-muted/30 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="text-xs"
          >
            All Products
          </Button>
          <Button
            variant={filter === 'low' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('low')}
            className="text-xs"
          >
            Low Stock ({stats.lowStockCount})
          </Button>
          <Button
            variant={filter === 'out' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('out')}
            className="text-xs"
          >
            Out of Stock ({stats.outOfStockCount})
          </Button>
        </div>
      </div>

      {/* Inventory Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : inventory.length > 0 ? (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Warehouse Balance</th>
                  <th className="px-5 py-3">Reorder Threshold</th>
                  <th className="px-5 py-3">Stock Health</th>
                  <th className="px-5 py-3 text-right">Action</th>
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
                      <td className="px-5 py-3.5 font-medium text-foreground">{item.name}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {item.category?.name || '—'}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-foreground">
                        {stock} units
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground font-mono">
                        {item.lowStockThreshold} units
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs font-medium"
                          onClick={() => {
                            setAdjustingProduct(item);
                            setQuantityChange(10);
                            setAdjustType('STOCK_ADDED');
                            setNote('');
                          }}
                        >
                          Adjust
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-2xl border border-border p-8">
          <Warehouse className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="font-semibold text-foreground">No inventory records found</p>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-card rounded-2xl border border-border max-w-md w-full p-6 sm:p-7 space-y-5 shadow-lg">
            <div>
              <h2 className="font-bold text-base text-foreground tracking-tight">
                Adjust Inventory
              </h2>
              <p className="text-xs font-medium text-brand mt-0.5">{adjustingProduct.name}</p>
              <p className="text-[11px] text-muted-foreground">
                Current warehouse balance: <strong>{adjustingProduct.stockQuantity} units</strong>
              </p>
            </div>

            <div className="space-y-4">
              <Select
                label="Adjustment Reason"
                value={adjustType}
                onChange={(e) =>
                  setAdjustType(
                    e.target.value as 'STOCK_ADDED' | 'STOCK_REMOVED' | 'MANUAL_ADJUSTMENT'
                  )
                }
                options={[
                  { value: 'STOCK_ADDED', label: 'Add Stock (+ Factory Shipment)' },
                  { value: 'STOCK_REMOVED', label: 'Remove Stock (- Damaged / Sample)' },
                  { value: 'MANUAL_ADJUSTMENT', label: 'Manual Physical Count' },
                ]}
              />

              <Input
                label="Quantity"
                type="number"
                min={1}
                value={quantityChange}
                onChange={(e) => setQuantityChange(Math.max(1, parseInt(e.target.value) || 0))}
              />

              <Textarea
                label="Audit Note (Optional)"
                placeholder="e.g. Sivakasi factory lot shipment received"
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
                onClick={() => adjustMutation.mutate()}
                loading={adjustMutation.isPending}
              >
                Confirm adjustment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
