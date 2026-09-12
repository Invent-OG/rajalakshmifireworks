'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Layers,
  Plus,
  Trash2,
  Search,
  Check,
  Package,
  Sparkles,
  Calculator,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Portal } from '@/components/ui/portal';
import { formatCurrency, toNumber } from '@/lib/utils/format';
import { ProductVisualPlaceholder } from '@/components/ui/category-icon';

export interface ComboItemEntry {
  productId: number;
  quantity: number;
  sortOrder?: number;
  product?: {
    id: number;
    name: string;
    sku?: string | null;
    mrp: string | number;
    sellingPrice: string | number;
    media?: Array<{ url: string }>;
  };
}

interface ProductOption {
  id: number;
  name: string;
  sku?: string | null;
  mrp: string | number;
  sellingPrice: string | number;
  category?: { name: string };
  media?: Array<{ url: string }>;
}

interface ComboProductBuilderProps {
  isCombo: boolean;
  onToggleCombo: (active: boolean) => void;
  comboItems: ComboItemEntry[];
  onChangeComboItems: (items: ComboItemEntry[]) => void;
  onApplyCalculatedPricing?: (mrp: number, sellingPrice: number) => void;
  excludeProductId?: number;
}

export function ComboProductBuilder({
  isCombo,
  onToggleCombo,
  comboItems,
  onChangeComboItems,
  onApplyCalculatedPricing,
  excludeProductId,
}: ComboProductBuilderProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all products for selector
  const { data: productsData, isLoading } = useQuery<{ products: ProductOption[] }>({
    queryKey: ['admin', 'products', 'combo-selector'],
    queryFn: async () => {
      const res = await fetch('/api/admin/products?limit=100&statusFilter=active');
      if (!res.ok) return { products: [] };
      return res.json();
    },
    staleTime: 1000 * 60 * 3,
  });

  const availableProducts = useMemo(() => {
    const list = productsData?.products || [];
    return list.filter((p) => p.id !== excludeProductId);
  }, [productsData, excludeProductId]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return availableProducts;
    const q = searchQuery.toLowerCase();
    return availableProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category?.name && p.category.name.toLowerCase().includes(q))
    );
  }, [availableProducts, searchQuery]);

  // Map to get product details quickly
  const productMap = useMemo(() => {
    const map = new Map<number, ProductOption>();
    for (const p of availableProducts) {
      map.set(p.id, p);
    }
    return map;
  }, [availableProducts]);

  // Aggregate totals
  const { totalItemsCount, totalCalculatedMrp, totalCalculatedPrice } = useMemo(() => {
    let count = 0;
    let mrpSum = 0;
    let priceSum = 0;

    for (const item of comboItems) {
      const p = item.product || productMap.get(item.productId);
      const qty = item.quantity || 1;
      count += qty;
      if (p) {
        mrpSum += toNumber(p.mrp) * qty;
        priceSum += toNumber(p.sellingPrice) * qty;
      }
    }

    return {
      totalItemsCount: count,
      totalCalculatedMrp: mrpSum,
      totalCalculatedPrice: priceSum,
    };
  }, [comboItems, productMap]);

  const handleAddProduct = (product: ProductOption) => {
    const existingIndex = comboItems.findIndex((ci) => ci.productId === product.id);
    if (existingIndex >= 0) {
      const updated = [...comboItems];
      updated[existingIndex].quantity += 1;
      onChangeComboItems(updated);
    } else {
      onChangeComboItems([
        ...comboItems,
        {
          productId: product.id,
          quantity: 1,
          sortOrder: comboItems.length,
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku,
            mrp: product.mrp,
            sellingPrice: product.sellingPrice,
            media: product.media,
          },
        },
      ]);
    }
  };

  const handleUpdateQuantity = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    const updated = comboItems.map((ci) =>
      ci.productId === productId ? { ...ci, quantity: newQty } : ci
    );
    onChangeComboItems(updated);
  };

  const handleRemoveItem = (productId: number) => {
    onChangeComboItems(comboItems.filter((ci) => ci.productId !== productId));
  };

  return (
    <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
              isCombo
                ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <span>Combo / Gift Box Pack Configuration</span>
              {isCombo && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 uppercase tracking-wider">
                  Combo Mode Active
                </span>
              )}
            </h2>
            <p className="text-xs text-muted-foreground">
              Bundle multiple individual fireworks into a curated gift assortment.
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={isCombo}
            onChange={(e) => onToggleCombo(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
          <span className="ml-3 text-xs font-semibold text-foreground">
            {isCombo ? 'Combo Pack' : 'Single Product'}
          </span>
        </label>
      </div>

      {isCombo && (
        <div className="space-y-4 animate-fade-in">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-3.5 rounded-xl border border-border">
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-foreground">
                Included Items in Combo ({comboItems.length} unique products • {totalItemsCount} total pieces)
              </span>
              <p className="text-muted-foreground text-[11px]">
                Customers will see this exact list of included items on the product page.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add Products to Combo</span>
            </Button>
          </div>

          {/* Items Table / List */}
          {comboItems.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border space-y-2 bg-card">
              <Package className="h-8 w-8 mx-auto text-muted-foreground/60" />
              <p className="text-xs font-semibold text-foreground">No fireworks added yet</p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Click &quot;Add Products to Combo&quot; above to select the crackers that make up this combo pack.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border bg-card">
              {comboItems.map((item, index) => {
                const prod = item.product || productMap.get(item.productId);
                const itemMrp = prod ? toNumber(prod.mrp) : 0;
                const itemPrice = prod ? toNumber(prod.sellingPrice) : 0;
                const lineTotal = itemPrice * item.quantity;
                const imageUrl = prod?.media?.[0]?.url;

                return (
                  <div
                    key={item.productId}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                  >
                    {/* Product visual & details */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-[11px] font-mono font-bold text-muted-foreground w-4 text-center">
                        {index + 1}
                      </span>

                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl} alt={prod?.name || ''} className="w-full h-full object-cover" />
                        ) : (
                          <ProductVisualPlaceholder name={prod?.name || 'Item'} className="w-full h-full" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs text-foreground truncate">
                          {prod?.name || `Product #${item.productId}`}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground font-mono">
                          {prod?.sku && <span>SKU: {prod.sku}</span>}
                          <span>•</span>
                          <span>Unit Price: {formatCurrency(itemPrice)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Stepper & Line Total */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-7 sm:pl-0">
                      <div className="flex items-center border border-border rounded-lg bg-card shadow-xs overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          className="h-8 w-8 flex items-center justify-center hover:bg-muted text-foreground transition-colors font-bold"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)
                          }
                          className="h-8 w-12 text-center text-xs font-bold text-foreground bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          className="h-8 w-8 flex items-center justify-center hover:bg-muted text-foreground transition-colors font-bold"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <span className="text-[10px] text-muted-foreground block">Line Total</span>
                        <span className="font-bold text-xs text-foreground font-mono">
                          {formatCurrency(lineTotal)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.productId)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive-light transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pricing Suggestion Summary Card */}
          {comboItems.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span>Calculated Value of Selected Items:</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed font-mono">
                  Sum of MRP: <strong>{formatCurrency(totalCalculatedMrp)}</strong> • Sum of Selling Prices: <strong>{formatCurrency(totalCalculatedPrice)}</strong>
                </p>
              </div>

              {onApplyCalculatedPricing && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onApplyCalculatedPricing(
                      Math.round(totalCalculatedMrp),
                      Math.round(totalCalculatedPrice)
                    )
                  }
                  className="bg-white hover:bg-amber-50 text-amber-900 border-amber-300 text-xs font-semibold shrink-0"
                >
                  <Calculator className="h-3.5 w-3.5 text-amber-700" />
                  Apply Values to Pricing Form
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Product Selection Modal */}
      {modalOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fade-in">
            <div
              className="fixed inset-0"
              onClick={() => setModalOpen(false)}
              aria-hidden="true"
            />
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-200 p-6 space-y-4 max-h-[85vh] flex flex-col z-10">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-neutral-950">Select Products for Combo</h3>
                    <p className="text-xs text-neutral-500">
                      Choose fireworks from your catalog to bundle into this combo pack.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by product name, SKU, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950"
                  autoFocus
                />
              </div>

              {/* Products List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[260px]">
                {isLoading ? (
                  <div className="py-12 text-center text-xs text-neutral-400">
                    Loading fireworks catalog...
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-12 text-center text-xs text-neutral-400">
                    No products found matching &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  filteredProducts.map((product) => {
                    const existing = comboItems.find((ci) => ci.productId === product.id);
                    const isAdded = Boolean(existing);
                    const imageUrl = product.media?.[0]?.url;

                    return (
                      <div
                        key={product.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isAdded
                            ? 'bg-amber-50/70 border-amber-200'
                            : 'bg-white border-neutral-100 hover:border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-11 w-11 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <ProductVisualPlaceholder name={product.name} className="w-full h-full" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
                                {product.name}
                              </p>
                              {product.category && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-600 shrink-0">
                                  {product.category.name}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono mt-0.5">
                              {product.sku && <span>SKU: {product.sku}</span>}
                              <span>•</span>
                              <span className="font-bold text-neutral-900">
                                {formatCurrency(toNumber(product.sellingPrice))}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isAdded ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-amber-900 bg-amber-200/60 px-2.5 py-1 rounded-full flex items-center gap-1 font-mono">
                                <Check className="h-3 w-3" />
                                {existing?.quantity} added
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddProduct(product)}
                                className="h-8 px-2.5 text-xs font-bold rounded-xl"
                              >
                                +1
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="primary"
                              onClick={() => handleAddProduct(product)}
                              className="h-8 px-3.5 text-xs font-bold rounded-xl bg-neutral-950 text-white hover:bg-neutral-800"
                            >
                              Add
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between shrink-0">
                <span className="text-xs text-neutral-500 font-mono">
                  {comboItems.length} items added ({totalItemsCount} pieces total)
                </span>
                <Button
                  type="button"
                  size="md"
                  variant="primary"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full px-6 bg-neutral-950 text-white"
                >
                  Done Selecting
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
