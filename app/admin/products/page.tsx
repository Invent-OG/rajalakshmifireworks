'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Pagination } from '@/components/admin/pagination';
import { BulkActionsBar } from '@/components/admin/bulk-actions-bar';
import { Portal } from '@/components/ui/portal';
import { Input, Select } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils/format';
import { ProductVisualPlaceholder } from '@/components/ui/category-icon';
import {
  Search,
  Plus,
  Edit,
  Archive,
  DollarSign,
  Download,
  CheckSquare,
  Square,
  Package,
  Layers,
  Percent,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Link from 'next/link';

interface ProductListItem {
  id: number;
  name: string;
  sku: string | null;
  mrp: string | number;
  sellingPrice: string | number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  category: { id: number; name: string; slug: string } | null;
  media: Array<{ url: string }>;
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();

  // Filters and Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [categoryId, setCategoryId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Multi-select & Bulk Operations State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkPriceModalOpen, setBulkPriceModalOpen] = useState(false);
  const [bulkCategoryModalOpen, setBulkCategoryModalOpen] = useState(false);
  const [bulkPercentage, setBulkPercentage] = useState<number>(10);
  const [bulkTargetCategoryId, setBulkTargetCategoryId] = useState<number>(0);

  const filters = {
    page,
    limit: pageSize,
    search: search || undefined,
    stockFilter: stockFilter !== 'all' ? stockFilter : undefined,
    categoryId: categoryId !== 'ALL' ? categoryId : undefined,
    statusFilter: statusFilter !== 'all' ? statusFilter : undefined,
    sortBy,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products', 'list', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (search) params.set('search', search);
      if (stockFilter && stockFilter !== 'all') params.set('stockFilter', stockFilter);
      if (categoryId && categoryId !== 'ALL') params.set('categoryId', categoryId);
      if (statusFilter && statusFilter !== 'all') params.set('statusFilter', statusFilter);
      if (sortBy) params.set('sortBy', sortBy);

      return fetch(`/api/admin/products?${params}`).then((r) => r.json());
    },
  });

  const products: ProductListItem[] = data?.products ?? [];
  const categories: Array<{ id: number; name: string; slug: string }> = data?.categories ?? [];
  const pagination = data?.pagination ?? { total: 0, totalPages: 1, page: 1, limit: 25 };
  const stats = data?.stats ?? { total: 0, inStock: 0, lowStock: 0, outOfStock: 0, active: 0, inactive: 0 };

  // Single Archive Mutation
  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to archive product');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success('Product archived successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Bulk Product Actions Mutation
  const bulkActionMutation = useMutation({
    mutationFn: async (payload: {
      action: 'ACTIVATE' | 'DEACTIVATE' | 'SET_CATEGORY' | 'ADJUST_PRICE';
      categoryId?: number;
      percentageChange?: number;
    }) => {
      const res = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: selectedIds,
          ...payload,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Bulk operation failed');
      return json;
    },
    onSuccess: (res) => {
      toast.success(`Updated ${res.updatedCount} products successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      setSelectedIds([]);
      setBulkPriceModalOpen(false);
      setBulkCategoryModalOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Toggle Single Product Selection
  const toggleSelectProduct = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select All on Current Page
  const handleSelectAllOnPage = () => {
    const pageIds = products.map((p) => p.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Export Products to CSV
  const handleExportCSV = () => {
    const targetProducts =
      selectedIds.length > 0
        ? products.filter((p) => selectedIds.includes(p.id))
        : products;

    if (targetProducts.length === 0) {
      toast.error('No products to export');
      return;
    }

    const headers = [
      'ID',
      'Product Name',
      'SKU',
      'Category',
      'MRP (INR)',
      'Selling Price (INR)',
      'Stock Quantity',
      'Low Stock Threshold',
      'Active Status',
    ];

    const rows = targetProducts.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.sku || ''}"`,
      `"${p.category?.name || 'Uncategorized'}"`,
      p.mrp,
      p.sellingPrice,
      p.stockQuantity,
      p.lowStockThreshold,
      p.isActive ? 'Active' : 'Archived',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `products_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${targetProducts.length} products to CSV`);
  };

  const stockFilterTabs = [
    { key: 'all', label: 'All Catalog', count: stats.total },
    { key: 'in_stock', label: 'In Stock', count: stats.inStock },
    { key: 'low', label: 'Low Stock', count: stats.lowStock },
    { key: 'out', label: 'Out of Stock', count: stats.outOfStock },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header with CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Products</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your firework catalog, stock thresholds, wholesale pricing, and media assets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            className="text-xs font-semibold"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4 mr-1 text-muted-foreground" /> Export CSV
          </Button>
          <Link href="/admin/products/bulk-price">
            <Button variant="outline" size="md" className="font-semibold text-xs">
              <DollarSign className="h-4 w-4 text-muted-foreground" /> Bulk Price Tool
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button variant="primary" size="md" className="font-semibold text-xs">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Stock Health Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-border/60">
        {stockFilterTabs.map((tab) => {
          const isActive = stockFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setStockFilter(tab.key);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border hover:bg-muted/40'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  isActive
                    ? 'bg-background/20 text-background'
                    : 'bg-muted text-foreground'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Multi-Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 p-3.5 rounded-2xl bg-card border border-border">
        {/* Search */}
        <div className="relative sm:col-span-2 lg:col-span-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-muted/30 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-all"
          />
        </div>

        {/* Category Dropdown */}
        <div className="lg:col-span-3">
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Active/Inactive Status */}
        <div className="lg:col-span-2.5">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 cursor-pointer"
          >
            <option value="all">Active & Archived</option>
            <option value="active">Active Only ({stats.active})</option>
            <option value="inactive">Archived Only ({stats.inactive})</option>
          </select>
        </div>

        {/* Sorting Dropdown */}
        <div className="lg:col-span-2.5">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand/15 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="price_desc">Price (High to Low)</option>
            <option value="price_asc">Price (Low to High)</option>
            <option value="stock_asc">Stock (Low to High)</option>
            <option value="stock_desc">Stock (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] uppercase tracking-wider font-semibold select-none">
                <tr>
                  <th className="px-4 py-3.5 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAllOnPage}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center"
                      title="Select / Deselect all on page"
                    >
                      {products.length > 0 &&
                      products.every((p) => selectedIds.includes(p.id)) ? (
                        <CheckSquare className="h-4 w-4 text-brand" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3.5">Product</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">MRP</th>
                  <th className="px-4 py-3.5 text-right">Selling Price</th>
                  <th className="px-4 py-3.5">Stock</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p: ProductListItem) => {
                  const isSelected = selectedIds.includes(p.id);
                  const stock = p.stockQuantity;
                  const stockStatus =
                    stock <= 0
                      ? 'OUT_OF_STOCK'
                      : stock <= p.lowStockThreshold
                      ? 'LOW_STOCK'
                      : 'IN_STOCK';

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-brand/5' : 'hover:bg-muted/30'
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectProduct(p.id)}
                          className="text-muted-foreground hover:text-foreground inline-flex items-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-brand" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border">
                            {p.media?.[0]?.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.media[0].url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ProductVisualPlaceholder
                                name={p.category?.name || p.name}
                                className="w-full h-full text-[10px]"
                              />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-foreground">{p.name}</p>
                              {!p.isActive && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-muted text-muted-foreground uppercase">
                                  Archived
                                </span>
                              )}
                            </div>
                            {p.sku && (
                              <p className="text-[11px] font-mono text-muted-foreground">{p.sku}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground font-medium">
                        {p.category?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground line-through">
                        {formatCurrency(p.mrp)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-foreground text-right">
                        {formatCurrency(p.sellingPrice)}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-foreground">
                        {stock} units
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={stockStatus} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/products/${p.id}`}>
                            <Button variant="ghost" size="icon-sm" aria-label="Edit product">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Archive product"
                            onClick={() => {
                              if (
                                confirm(
                                  `Archive "${p.name}"? It will no longer show in the storefront.`
                                )
                              ) {
                                archiveMutation.mutate(p.id);
                              }
                            }}
                          >
                            <Archive className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Unified Pagination */}
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
              itemLabel="products"
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-2xl border border-border p-8 space-y-2">
          <Package className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-semibold text-foreground">No fireworks products found</p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your category filter, stock tabs, or search query.
          </p>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        itemLabel="products"
      >
        <Button
          size="sm"
          variant="outline"
          className="bg-background text-foreground hover:bg-background/90 text-xs font-semibold"
          onClick={() => bulkActionMutation.mutate({ action: 'ACTIVATE' })}
          loading={bulkActionMutation.isPending}
        >
          Make Active
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="bg-background text-foreground hover:bg-background/90 text-xs font-semibold"
          onClick={() => bulkActionMutation.mutate({ action: 'DEACTIVATE' })}
          loading={bulkActionMutation.isPending}
        >
          Archive
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="bg-background text-foreground hover:bg-background/90 text-xs font-semibold"
          onClick={() => setBulkCategoryModalOpen(true)}
        >
          <Layers className="h-3.5 w-3.5 mr-1" /> Category
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="bg-background text-foreground hover:bg-background/90 text-xs font-semibold"
          onClick={() => setBulkPriceModalOpen(true)}
        >
          <Percent className="h-3.5 w-3.5 mr-1" /> Price %
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="bg-background text-foreground hover:bg-background/90 text-xs font-semibold"
          onClick={handleExportCSV}
        >
          <Download className="h-3.5 w-3.5 mr-1" /> Export
        </Button>
      </BulkActionsBar>

      {/* Bulk Category Assign Modal */}
      {bulkCategoryModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-card rounded-2xl border border-border max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl">
              <div>
                <h2 className="font-bold text-base text-foreground tracking-tight">
                  Reassign Category ({selectedIds.length} products)
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Move all selected products into a target catalog category.
                </p>
              </div>

              <div className="space-y-4">
                <Select
                  label="Target Category"
                  value={String(bulkTargetCategoryId || (categories[0]?.id ?? ''))}
                  onChange={(e) => setBulkTargetCategoryId(Number(e.target.value))}
                  options={categories.map((c) => ({
                    value: String(c.id),
                    label: c.name,
                  }))}
                />
              </div>


              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setBulkCategoryModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="md"
                  variant="primary"
                  className="font-medium"
                  onClick={() => {
                    const target = bulkTargetCategoryId || categories[0]?.id;
                    if (!target) {
                      toast.error('Please select a valid category');
                      return;
                    }
                    bulkActionMutation.mutate({
                      action: 'SET_CATEGORY',
                      categoryId: target,
                    });
                  }}
                  loading={bulkActionMutation.isPending}
                >
                  Assign to {selectedIds.length} items
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Bulk Percentage Price Adjustment Modal */}
      {bulkPriceModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-card rounded-2xl border border-border max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl">
              <div>
                <h2 className="font-bold text-base text-foreground tracking-tight">
                  Adjust Selling Price ({selectedIds.length} products)
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Apply a percentage price hike or seasonal discount to all selected products.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Percentage Change (%)"
                  type="number"
                  placeholder="e.g. 10 for +10% price increase, -15 for 15% discount"
                  value={bulkPercentage}
                  onChange={(e) => setBulkPercentage(parseFloat(e.target.value) || 0)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Use positive numbers (e.g. <strong>10</strong>) to increase price by 10%, or
                  negative numbers (e.g. <strong>-15</strong>) for a 15% festival discount.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setBulkPriceModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="md"
                  variant="primary"
                  className="font-medium"
                  onClick={() => {
                    if (bulkPercentage === 0) {
                      toast.error('Please enter a non-zero percentage change');
                      return;
                    }
                    bulkActionMutation.mutate({
                      action: 'ADJUST_PRICE',
                      percentageChange: bulkPercentage,
                    });
                  }}
                  loading={bulkActionMutation.isPending}
                >
                  Apply Price Change
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
