'use client';

import { useCart } from '@/hooks/use-cart';
import { StoreButton } from '@/components/ui/store-button';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { EmptyState } from '@/components/ui/empty-state';
import { ProductVisualPlaceholder } from '@/components/ui/category-icon';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import Link from 'next/link';
import { useSyncExternalStore, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, isReducedMotion } from '@/lib/motion';
import { formatCurrency } from '@/lib/utils/format';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { getLocalizedName } from '@/lib/i18n/formatters';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('cart');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  const locale = useLocale();

  // GSAP Entrance Stagger for cart page items
  useGSAP(
    () => {
      if (!hydrated || isReducedMotion() || !containerRef.current) return;

      gsap.fromTo(
        '.cart-page-item',
        { opacity: 0, y: 15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power2.out', stagger: 0.05 }
      );
    },
    { dependencies: [hydrated], scope: containerRef }
  );

  const handleRemoveWithAnim = (productId: number, targetEl: HTMLElement | null) => {
    if (!targetEl || isReducedMotion()) {
      removeItem(productId);
      return;
    }

    gsap.to(targetEl, {
      opacity: 0,
      scale: 0.9,
      x: 20,
      duration: 0.22,
      ease: 'power2.in',
      onComplete: () => {
        removeItem(productId);
      },
    });
  };

  if (!hydrated) return null;

  const meetsMinOrder = subtotal >= minOrderValue;
  const remaining = Math.max(0, minOrderValue - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / minOrderValue) * 100));

  const getHref = (path: string) => (locale === 'en' ? path : `/${locale}${path}`);

  if (items.length === 0) {
    return (
      <div className="w-full px-4 sm:px-8 lg:px-12 py-16 font-sans">
        <EmptyState
          icon={ShoppingBag}
          title={t('emptyTitle')}
          description={t('emptyDesc')}
          actionLabel={t('browseProducts')}
          actionHref={getHref('/products')}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full px-4 sm:px-8 lg:px-12 py-8 animate-fade-in space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2 font-heading">
            <span>{t('title')}</span>
            <span className="text-muted-foreground font-normal text-lg sm:text-xl font-mono">
              ({itemCount} {itemCount === 1 ? t('item') : t('items')})
            </span>
          </h1>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors self-start sm:self-auto cursor-pointer"
        >
          {t('clearBag')}
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 space-y-3.5">
          {items.map((item) => {
            const displayName = getLocalizedName(item, locale);
            return (
              <div
                key={item.productId}
                className="cart-page-item p-4 sm:p-5 rounded-[28px] sm:rounded-[32px] bg-white flex gap-4 sm:gap-6 items-center shadow-sm transition-all hover:shadow-md"
              >
                {/* Product Thumbnail */}
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-[20px] sm:rounded-[22px] bg-neutral-100 flex items-center justify-center shrink-0 select-none overflow-hidden">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <ProductVisualPlaceholder name={displayName} className="w-full h-full text-xs" />
                  )}
                </div>

                {/* Item Info & Stepper */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={getHref(`/product/${item.slug}`)}
                        className="font-bold text-sm sm:text-base text-foreground hover:text-neutral-900 transition-colors line-clamp-1"
                      >
                        {displayName}
                      </Link>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="font-bold text-sm text-foreground font-mono">
                          {formatCurrency(item.sellingPrice)}
                        </span>
                        {item.mrp > item.sellingPrice && (
                          <span className="text-xs text-muted-foreground line-through font-mono">
                            ₹{new Intl.NumberFormat('en-IN').format(item.mrp)}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        const card = e.currentTarget.closest('.cart-page-item') as HTMLElement | null;
                        handleRemoveWithAnim(item.productId, card);
                      }}
                      className="text-muted-foreground hover:text-neutral-950 p-2 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
                      aria-label={`${tCommon('remove')} ${displayName}`}
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
                      <span className="text-[11px] text-muted-foreground block font-medium">
                        {locale === 'ta' ? 'மொத்த விலை' : 'Item Total'}
                      </span>
                      <span className="font-bold text-sm sm:text-base text-foreground font-mono">
                        {formatCurrency(item.sellingPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Order Summary & Checkout Trigger */}
        <div className="lg:col-span-4">
          <div className="p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] bg-white sticky top-24 space-y-6 shadow-sm">
            <h2 className="font-bold text-base text-foreground tracking-tight pb-3 border-b border-neutral-100 font-heading">
              {t('orderSummary')}
            </h2>

            {/* Minimum Order Value Progress Indicator */}
            <div className="p-4 rounded-[22px] sm:rounded-[24px] bg-neutral-50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  {locale === 'ta' ? 'குறைந்தபட்ச முன்பதிவு' : 'Minimum Order'}
                </span>
                <span className="font-bold text-muted-foreground font-mono">
                  {formatCurrency(subtotal)} / ₹{minOrderValue}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    meetsMinOrder
                      ? 'bg-emerald-600'
                      : 'bg-neutral-900'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {meetsMinOrder ? (
                <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {locale === 'ta' ? 'குறைந்தபட்ச தொகை நிறைவடைந்தது. முன்பதிவு செய்யலாம்.' : 'Minimum order met. Ready for checkout.'}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t('minOrderRemaining', { amount: String(remaining) })}
                </p>
              )}
            </div>

            {/* Calculation Lines */}
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{locale === 'ta' ? 'பொருட்களின் உத்தேச விலை' : 'Items subtotal'}</span>
                <span className="font-semibold font-mono">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {totalSavings > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>{t('totalSavings')}</span>
                  <span className="font-mono">
                    -{formatCurrency(totalSavings)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-muted-foreground">
                <span>{locale === 'ta' ? 'போக்குவரத்து' : 'Fulfillment'}</span>
                <span>{locale === 'ta' ? 'முன்பதிவில் தீர்மானிக்கப்படும்' : 'Calculated at checkout'}</span>
              </div>
            </div>

            {/* Final Total */}
            <div className="pt-3 border-t border-neutral-100 space-y-1">
              <div className="flex justify-between items-baseline font-bold text-lg text-foreground">
                <span>{t('estimatedTotal')}</span>
                <span className="text-xl font-mono">
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
                </span>
              </div>
              {totalSavings > 0 && (
                <p className="text-[11px] text-muted-foreground font-mono">
                  MRP Total: ₹{new Intl.NumberFormat('en-IN').format(totalMrp)}
                </p>
              )}
            </div>

            {/* Checkout CTA */}
            {meetsMinOrder ? (
              <Link href={getHref('/checkout')} className="block">
                <StoreButton size="lg" variant="primary" className="w-full">
                  {t('proceedToCheckout')}
                  <ArrowRight className="h-4 w-4" />
                </StoreButton>
              </Link>
            ) : (
              <Link href={getHref('/products')} className="block">
                <StoreButton size="lg" variant="outline" className="w-full">
                  {locale === 'ta' ? `இன்னும் ₹${remaining} சேர்க்கவும்` : `Add ₹${remaining} more`}
                </StoreButton>
              </Link>
            )}

            <div className="pt-1 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
              <span>{locale === 'ta' ? 'சிவகாசி நேரடி ரசீது வாட்ஸ்அப்பில் வழங்கப்படும்' : 'Direct factory invoice on WhatsApp'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
