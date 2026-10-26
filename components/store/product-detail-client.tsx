'use client';

import { useState, useRef } from 'react';
import { useCart, useCartItemQuantity } from '@/hooks/use-cart';
import { StoreButton } from '@/components/ui/store-button';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { Check, ShoppingBag, ArrowRight } from 'lucide-react';
import { gsap, isReducedMotion } from '@/lib/motion';
import { useTranslations, useLocale } from '@/lib/i18n/context';

interface ProductDetailClientProps {
  product: {
    id: number;
    name: string;
    nameTa?: string | null;
    slug: string;
    mrp: number;
    sellingPrice: number;
    stockQuantity: number;
    image: string | null;
  };
  locale?: string;
}

export function ProductDetailClient({ product, locale: propLocale }: ProductDetailClientProps) {
  const { addItem, updateQuantity, removeItem } = useCart();
  const cartQuantity = useCartItemQuantity(product.id);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const isOutOfStock = product.stockQuantity <= 0;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const t = useTranslations('products');
  const tCart = useTranslations('cart');
  const detectedLocale = useLocale();
  const locale = (propLocale && (propLocale === 'ta' || propLocale === 'en') ? propLocale : detectedLocale) as any;

  function handleAddToCart(qtyToAdd: number = selectedQuantity) {
    if (buttonRef.current && !isReducedMotion()) {
      gsap.fromTo(
        buttonRef.current,
        { scale: 0.94 },
        { scale: 1, duration: 0.3, ease: 'back.out(2)' }
      );
    }

    addItem({
      productId: product.id,
      name: product.name,
      nameTa: product.nameTa,
      slug: product.slug,
      image: product.image,
      mrp: product.mrp,
      sellingPrice: product.sellingPrice,
      maxStock: product.stockQuantity,
      quantity: qtyToAdd,
    });

  }

  function handleProceedToCheckout() {
    if (cartQuantity === 0) {
      addItem({
        productId: product.id,
        name: product.name,
        nameTa: product.nameTa,
        slug: product.slug,
        image: product.image,
        mrp: product.mrp,
        sellingPrice: product.sellingPrice,
        maxStock: product.stockQuantity,
        quantity: selectedQuantity,
      });
    }
    window.location.href = `/${locale}/checkout`;
  }

  if (isOutOfStock) {
    return (
      <div className="pt-2">
        <StoreButton size="lg" variant="outline" disabled className="w-full opacity-50 cursor-not-allowed">
          {t('outOfStock')}
        </StoreButton>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2 font-sans">
      {cartQuantity > 0 ? (
        <div className="p-5 sm:p-6 rounded-[24px] sm:rounded-[28px] bg-white dark:bg-[#141414] dark:border dark:border-[#282828] shadow-sm dark:shadow-none space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" />
              {locale === 'ta' ? `${cartQuantity} உங்கள் பையில் உள்ளது` : `${cartQuantity} in your shopping bag`}
            </span>
            <span className="text-muted-foreground font-normal">
              {locale === 'ta' ? 'அளவை மாற்றவும்' : 'Update quantity below'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'எண்ணிக்கை:' : 'Qty:'}
              </span>
              <QuantityStepper
                quantity={cartQuantity}
                maxStock={product.stockQuantity}
                onIncrement={() => updateQuantity(product.id, cartQuantity + 1)}
                onDecrement={() =>
                  cartQuantity === 1
                    ? removeItem(product.id)
                    : updateQuantity(product.id, cartQuantity - 1)
                }
                size="lg"
                className="w-36"
              />
            </div>

            <StoreButton
              ref={buttonRef}
              variant="outline"
              size="lg"
              className="flex-1 text-xs sm:text-sm font-bold"
              icon={<ShoppingBag className="h-4 w-4 shrink-0" />}
              onClick={() => handleAddToCart(1)}
            >
              {locale === 'ta' ? 'மேலும் சேர்க்க (+1)' : 'Add More to Bag (+1)'}
            </StoreButton>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="flex-1 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-black/15 hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <span>{locale === 'ta' ? 'ஆர்டர் முடிக்க செல்ல' : 'Proceed to Checkout'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href={`/${locale}/cart`}
              className="inline-flex items-center justify-center gap-1.5 h-12 px-5 rounded-full border border-neutral-200 dark:border-[#333333] hover:bg-neutral-100 dark:hover:bg-[#202020] text-foreground font-semibold text-xs sm:text-sm transition-all duration-200"
            >
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <span>{locale === 'ta' ? 'பையை பார்க்க' : 'View Bag'}</span>
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-[minmax(7.5rem,9rem)_minmax(0,1fr)] items-end gap-3">
            <div className="space-y-1.5">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {locale === 'ta' ? 'எண்ணிக்கை:' : 'Qty:'}
              </span>
              <QuantityStepper
                quantity={selectedQuantity}
                maxStock={product.stockQuantity}
                onIncrement={() => setSelectedQuantity(Math.min(product.stockQuantity, selectedQuantity + 1))}
                onDecrement={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                size="lg"
                className="w-full"
              />
            </div>

            <button
              ref={buttonRef}
              type="button"
              onClick={() => handleAddToCart(selectedQuantity)}
              className="inline-flex h-12 min-w-0 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 sm:text-base"
            >
              <ShoppingBag className="h-4 w-4 shrink-0" />
              <span className="truncate">{t('addToBag')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
