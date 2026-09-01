'use client';

import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { EmptyState } from '@/components/ui/empty-state';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';

function useIsHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotal, totalMrp, totalSavings, itemCount } =
    useCart();
  const minOrderValue = 500;
  const hydrated = useIsHydrated();

  if (!hydrated) return null;

  const meetsMinOrder = subtotal >= minOrderValue;
  const remaining = Math.max(0, minOrderValue - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / minOrderValue) * 100));

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your Shopping Bag is Empty"
          description="Explore our complete collection of certified fireworks, sparklers, and gift combos directly from Sivakasi."
          actionLabel="Browse Crackers"
          actionHref="/products"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Review Your Selections</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </h1>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors self-start sm:self-auto cursor-pointer"
        >
          Clear Cart
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 space-y-3.5">
          {items.map((item) => (
            <div
              key={item.productId}
              className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 luxury-card flex gap-4 sm:gap-6 items-center"
            >
              {/* Product Thumbnail */}
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl bg-gradient-to-b from-muted/60 to-muted/20 border border-border/60 flex items-center justify-center text-3xl sm:text-4xl shrink-0 select-none overflow-hidden">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  '🎆'
                )}
              </div>

              {/* Item Info & Stepper */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/product/${item.slug}`}
                      className="font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="font-bold text-sm text-foreground">
                        {formatCurrency(item.sellingPrice)}
                      </span>
                      {item.mrp > item.sellingPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatCurrency(item.mrp)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <QuantityStepper
                    quantity={item.quantity}
                    maxStock={item.maxStock}
                    onIncrement={() => updateQuantity(item.productId, item.quantity + 1)}
                    onDecrement={() =>
                      item.quantity === 1
                        ? removeItem(item.productId)
                        : updateQuantity(item.productId, item.quantity - 1)
                    }
                    size="sm"
                  />

                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">Item Total</span>
                    <span className="font-extrabold text-sm sm:text-base text-foreground">
                      {formatCurrency(item.sellingPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Summary & Checkout Trigger */}
        <div className="lg:col-span-4">
          <div className="p-6 rounded-3xl bg-card border border-border/80 luxury-card sticky top-24 space-y-6">
            <h2 className="font-extrabold text-lg text-foreground tracking-tight pb-3 border-b border-border/60">
              Order Summary
            </h2>

            {/* Minimum Order Value Progress Indicator */}
            <div className="p-4 rounded-2xl bg-muted/50 border border-border/60 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Minimum Order Goal</span>
                <span className="font-bold text-muted-foreground">
                  {formatCurrency(subtotal)} / {formatCurrency(minOrderValue)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    meetsMinOrder
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {meetsMinOrder ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Minimum order met! Ready for checkout.
                </p>
              ) : (
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Add <span className="font-bold">{formatCurrency(remaining)}</span> more to unlock checkout.
                </p>
              )}
            </div>

            {/* Calculation Lines */}
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>

              {totalSavings > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Festive Discount Savings</span>
                  <span>-{formatCurrency(totalSavings)}</span>
                </div>
              )}

              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Charges</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            {/* Final Total */}
            <div className="pt-3 border-t border-border/80 space-y-1">
              <div className="flex justify-between items-baseline font-extrabold text-lg sm:text-xl text-foreground">
                <span>Estimated Total</span>
                <span className="gold-gradient-text">{formatCurrency(subtotal)}</span>
              </div>
              {totalSavings > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Original MRP: {formatCurrency(totalMrp)}
                </p>
              )}
            </div>

            {/* Checkout CTA */}
            {meetsMinOrder ? (
              <Link href="/checkout" className="block">
                <Button size="lg" variant="primary" className="w-full font-bold shadow-lg shadow-orange-500/25">
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/products" className="block">
                <Button size="lg" variant="outline" className="w-full font-semibold">
                  Add {formatCurrency(remaining)} More
                </Button>
              </Link>
            )}

            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Direct factory warranty & invoice on WhatsApp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
