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
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { getLocalizedName } from '@/lib/i18n/formatters';

interface QuickCartWidgetProps {
  className?: string;
  onClose?: () => void;
}

export function QuickCartWidget({ className = '', onClose }: QuickCartWidgetProps) {
  const { items, itemCount, subtotal, totalSavings, updateQuantity, removeItem } = useCart();
  const isHydrated = useIsHydrated();
  const locale = useLocale();
  const t = useTranslations('cart');
  const tCommon = useTranslations('common');
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
        className={`w-full bg-white text-neutral-900 rounded-[32px] sm:rounded-[36px] p-6 shadow-xl ${className}`}
      >
        <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-100">
          <ShoppingCart className="h-5 w-5 text-neutral-400" />
          <span className="font-bold text-base tracking-tight">{t('title')}</span>
        </div>
        <div className="py-10 text-center text-xs text-neutral-400 font-sans">
          {tCommon('loading')}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full bg-white text-neutral-900 rounded-[32px] sm:rounded-[36px] p-5 sm:p-6 shadow-2xl flex flex-col font-sans select-none backdrop-blur-md transition-all ${className}`}
    >
      {/* Mobile Bottom Sheet Grab Handle */}
      {onClose && (
        <div className="w-10 h-1 rounded-full bg-neutral-300 mx-auto -mt-1 mb-3.5 sm:hidden" />
      )}

      {/* ── 1. Header ─── */}
      <div className="qcart-header flex items-center justify-between pb-3.5 sm:pb-4 border-b border-neutral-100">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-900">
            <ShoppingCart className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-neutral-900">
                {t('title')}
              </span>
              <span className="qcart-badge h-5 px-2 rounded-full bg-neutral-950 text-white text-[11px] font-bold flex items-center justify-center font-mono">
                {itemCount}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {itemCount > 0 && (
            <Link
              href={locale === 'en' ? '/cart' : `/${locale}/cart`}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-950 transition-colors flex items-center gap-1 py-1 px-3 rounded-full hover:bg-neutral-100"
            >
              {t('orderSummary')} <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 flex items-center justify-center transition-colors cursor-pointer"
              aria-label={tCommon('close')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Direct Factory Savings Banner ─── */}
      {totalSavings > 0 && (
        <div className="mt-3.5 bg-emerald-50 rounded-full px-4 py-2 flex items-center justify-between text-xs">
          <span className="text-emerald-800 font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> {t('totalSavings')}:
          </span>
          <span className="text-emerald-700 font-mono font-bold">
            {formatCurrency(totalSavings)} {locale === 'ta' ? 'சேமிப்பு' : 'off'}
          </span>
        </div>
      )}

      {/* ── 3. Cart Items List / Stack ─── */}
      {items.length === 0 ? (
        <div className="py-12 px-4 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-sm text-neutral-900">{t('emptyTitle')}</p>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-[220px] mx-auto">
              {t('emptyDesc')}
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={listRef}
          className="my-3.5 space-y-2.5 max-h-[48vh] sm:max-h-[360px] overflow-y-auto pr-1 no-scrollbar"
        >
          {items.map((item) => {
            const lineTotal = item.sellingPrice * item.quantity;
            const displayName = getLocalizedName(item, locale);
            return (
              <div
                key={item.productId}
                id={`cart-item-${item.productId}`}
                className="qcart-item group relative bg-neutral-50 hover:bg-neutral-100/80 rounded-[22px] p-3.5 transition-all shadow-xs"
              >
                {/* Top Row: Item Details & Remove Button */}
                <div className="flex items-start gap-2.5 justify-between">
                  {item.image ? (
                    <div className="relative h-12 w-12 rounded-[14px] overflow-hidden bg-white shrink-0">
                      <Image
                        src={item.image}
                        alt={displayName}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-[14px] bg-white flex items-center justify-center shrink-0 text-neutral-400">
                      <Sparkles className="h-4 w-4 text-neutral-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-neutral-900 line-clamp-1 leading-snug">
                      {displayName}
                    </span>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {formatCurrency(item.sellingPrice)} {locale === 'ta' ? 'ஒன்றுக்கு' : 'each'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      const card = e.currentTarget.closest('.qcart-item') as HTMLElement | null;
                      handleRemoveWithAnim(item.productId, card);
                    }}
                    className="h-6 w-6 -mr-1 -mt-0.5 rounded-full text-neutral-400 hover:text-destructive hover:bg-destructive-light flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    aria-label={`${tCommon('remove')} ${displayName}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Bottom Row: Tactile Stepper & Line Total */}
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-neutral-200/60">
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
                    <span className="text-xs sm:text-sm font-bold text-neutral-900 font-mono tracking-tight">
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
        <div className="qcart-footer pt-3.5 border-t border-neutral-100 space-y-3.5 mt-auto">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-neutral-500 block">{t('estimatedTotal')}</span>
              <span className="text-[10px] text-neutral-400">
                {locale === 'ta' ? 'வரி உள்ளடக்கம் • சிவகாசி நேரடி' : 'Taxes included • Ex-Sivakasi'}
              </span>
            </div>
            <div className="font-extrabold text-lg sm:text-xl text-neutral-900 tracking-tight">
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

          <Link href={locale === 'en' ? '/checkout' : `/${locale}/checkout`} className="block w-full">
            <button
              type="button"
              className="w-full h-12 px-6 rounded-full bg-neutral-950 text-white font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <CreditCard className="h-4 w-4" />
              <span>{t('proceedToCheckout')}</span>
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
