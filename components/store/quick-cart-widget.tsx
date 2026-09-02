'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NumberFlow from '@number-flow/react';
import { ShoppingCart, X, CreditCard, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { useCart, useIsHydrated } from '@/hooks/use-cart';
import { formatCurrency } from '@/lib/utils/format';
import { useGSAP } from '@gsap/react';
import { gsap, isReducedMotion } from '@/lib/motion';
import { StoreButton } from '@/components/ui/store-button';
import { QuantityStepper } from '@/components/ui/quantity-stepper';

interface QuickCartWidgetProps {
  className?: string;
  onClose?: () => void;
}

export function QuickCartWidget({ className = '', onClose }: QuickCartWidgetProps) {
  const { items, itemCount, subtotal, totalSavings, updateQuantity, removeItem } = useCart();
  const isHydrated = useIsHydrated();
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const prevItemCount = useRef(itemCount);

  // GSAP Container & Items Initial Entrance
  useGSAP(
    () => {
      if (!isHydrated || isReducedMotion() || !containerRef.current) return;

      const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.35 } });

      tl.fromTo(
        '.qcart-header',
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3 }
      )
        .fromTo(
          '.qcart-item',
          { opacity: 0, y: -14, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.3)', stagger: 0.05 },
          '-=0.15'
        )
        .fromTo(
          '.qcart-footer',
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.35 },
          '-=0.2'
        );
    },
    { dependencies: [isHydrated], scope: containerRef }
  );

  // GSAP Stack Animation when items are added
  useGSAP(
    () => {
      if (!isHydrated || isReducedMotion() || !listRef.current) return;

      if (itemCount > prevItemCount.current) {
        gsap.fromTo(
          '.qcart-item',
          { scale: 0.97, y: -4 },
          { scale: 1, y: 0, duration: 0.35, ease: 'back.out(2)', stagger: 0.04 }
        );
      }
      prevItemCount.current = itemCount;
    },
    { dependencies: [itemCount, items.length], scope: containerRef }
  );

  const handleRemoveWithAnim = (productId: number, targetEl: HTMLElement | null) => {
    if (!targetEl || isReducedMotion()) {
      removeItem(productId);
      return;
    }

    gsap.to(targetEl, {
      opacity: 0,
      scale: 0.85,
      x: 30,
      duration: 0.22,
      ease: 'power2.in',
      onComplete: () => {
        removeItem(productId);
      },
    });
  };

  if (!isHydrated) {
    return (
      <div
        className={`w-full bg-card text-foreground rounded-3xl p-5 border border-border shadow-xl ${className}`}
      >
        <div className="flex items-center gap-2.5 pb-4 border-b border-border">
          <ShoppingCart className="h-4.5 w-4.5 text-muted-foreground" />
          <span className="font-heading font-bold text-sm tracking-tight">Shopping Bag</span>
        </div>
        <div className="py-10 text-center text-xs text-muted-foreground font-sans">
          Loading bag items...
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full bg-card text-foreground rounded-3xl p-5 border border-border/90 shadow-xl flex flex-col font-sans select-none backdrop-blur-xs transition-all ${className}`}
    >
      {/* ── 1. Header ─── */}
      <div className="qcart-header flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-brand-light border border-brand-border flex items-center justify-center text-brand">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-sm sm:text-base tracking-tight text-foreground">
                Bag
              </span>
              <span className="qcart-badge h-5 px-1.5 rounded-full bg-brand text-white text-[11px] font-bold flex items-center justify-center font-mono">
                {itemCount}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {itemCount > 0 && (
            <Link
              href="/cart"
              className="text-xs font-semibold text-muted-foreground hover:text-brand transition-colors flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-muted"
            >
              Full Bag <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-neutral-200 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Direct Factory Savings Banner ─── */}
      {totalSavings > 0 && (
        <div className="mt-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
          <span className="text-emerald-800 font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Sivakasi Savings:
          </span>
          <span className="text-emerald-700 font-mono font-bold">
            {formatCurrency(totalSavings)} off
          </span>
        </div>
      )}

      {/* ── 3. Cart Items List / Stack ─── */}
      {items.length === 0 ? (
        <div className="py-12 px-4 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-muted/60 border border-border flex items-center justify-center mx-auto text-muted-foreground shadow-inner">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-heading text-sm font-semibold text-foreground">Your bag is empty</p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px] mx-auto">
              Add fireworks or festive gift combos to build your celebration pack
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={listRef}
          className="my-3.5 space-y-2.5 max-h-[360px] overflow-y-auto pr-1 no-scrollbar"
        >
          {items.map((item) => {
            const lineTotal = item.sellingPrice * item.quantity;
            return (
              <div
                key={item.productId}
                id={`cart-item-${item.productId}`}
                className="qcart-item group relative bg-background-secondary hover:bg-muted/50 rounded-2xl p-3 border border-border/80 hover:border-neutral-300 transition-all shadow-xs"
              >
                {/* Top Row: Item Details & Remove Button */}
                <div className="flex items-start gap-2.5 justify-between">
                  {item.image ? (
                    <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-card border border-border shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    </div>
                  ) : (
                    <div className="h-11 w-11 rounded-xl bg-card border border-border flex items-center justify-center shrink-0 text-muted-foreground">
                      <Sparkles className="h-4 w-4 text-brand" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-foreground line-clamp-1 leading-snug">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {formatCurrency(item.sellingPrice)} each
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      const card = e.currentTarget.closest('.qcart-item') as HTMLElement | null;
                      handleRemoveWithAnim(item.productId, card);
                    }}
                    className="h-6 w-6 -mr-1 -mt-0.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive-light flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Bottom Row: Tactile Stepper & Line Total */}
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-border/60">
                  {/* Stepper */}
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

                  {/* Line Total */}
                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-bold text-foreground font-mono tracking-tight">
                      {formatCurrency(lineTotal)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 4. Footer / Subtotal & Tactile Pop Checkout ─── */}
      {items.length > 0 && (
        <div className="qcart-footer pt-3.5 border-t border-border space-y-3.5 mt-auto">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Estimated Total</span>
              <span className="text-[10px] text-muted-foreground/80">Taxes included • Ex-Sivakasi</span>
            </div>
            <div className="font-heading font-extrabold text-lg sm:text-xl text-foreground tracking-tight">
              <NumberFlow
                value={subtotal}
                format={{
                  style: 'currency',
                  currency: 'INR',
                  trailingZeroDisplay: 'stripIfInteger',
                }}
                transformTiming={{
                  duration: 400,
                  easing: 'ease-out',
                }}
              />
            </div>
          </div>

          <Link href="/checkout" className="block w-full">
            <StoreButton
              size="lg"
              variant="primary"
              className="w-full"
              icon={<CreditCard className="h-4 w-4" />}
            >
              Proceed to Checkout
            </StoreButton>
          </Link>
        </div>
      )}
    </div>
  );
}
