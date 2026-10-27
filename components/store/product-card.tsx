'use client';

import { useRef, memo } from 'react';
import Link from '@/components/ui/link';
import { useCart, useCartItemQuantity } from '@/hooks/use-cart';
import { toNumber, formatCurrency } from '@/lib/utils/format';
import { ProductVisualPlaceholder } from '@/components/ui/category-icon';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { getLocalizedName } from '@/lib/i18n/formatters';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    nameTa?: string | null;
    slug: string;
    piecesPerBox?: number | null;
    boxContent?: number | null;
    contentUnit?: string | null;
    discountPercent?: number | null;
    mrp: string;
    sellingPrice: string;
    stockQuantity: number;
    category?: { name: string; nameTa?: string | null; slug: string } | null;
    media?: Array<{ url: string; alt?: string | null }>;
  };
  locale?: string;
}

export const ProductCard = memo(function ProductCard({ product, locale: propLocale }: ProductCardProps) {
  const detectedLocale = useLocale();
  const locale = (propLocale && (propLocale === 'ta' || propLocale === 'en') ? propLocale : detectedLocale) as any;
  const tProducts = useTranslations('products');
  const tCommon = useTranslations('common');
  const { addItem, updateQuantity, removeItem } = useCart();
  const quantity = useCartItemQuantity(product.id);
  const mrp = toNumber(product.mrp);
  const price = toNumber(product.sellingPrice);
  const isOutOfStock = product.stockQuantity <= 0;

  const img1 = product.media?.[0]?.url || null;
  const img2 = product.media?.[1]?.url || img1;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLElement>(null);

  const displayName = getLocalizedName(product, locale);
  const categoryName = getLocalizedName(product.category, locale) || (locale === 'ta' ? 'பட்டாசு' : 'Fireworks');

  const discount =
    product.discountPercent && product.discountPercent > 0
      ? product.discountPercent
      : mrp > price
      ? Math.round(((mrp - price) / mrp) * 100)
      : 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();

    addItem({
      productId: product.id,
      name: product.name,
      nameTa: product.nameTa,
      slug: product.slug,
      image: img1,
      mrp,
      sellingPrice: price,
      maxStock: product.stockQuantity,
      quantity: 1,
    });

  }

  // Generate contextual tags
  const tags: string[] = [];
  const count = product.boxContent ?? product.piecesPerBox;
  if (count && count > 0) {
    const rawUnit = product.contentUnit || 'Pcs';
    let unitLabel = rawUnit;
    if (locale === 'ta') {
      if (rawUnit.toLowerCase() === 'pack' || rawUnit.toLowerCase() === 'packs') unitLabel = 'பேக்';
      else if (rawUnit.toLowerCase() === 'items' || rawUnit.toLowerCase() === 'item') unitLabel = 'பொருட்கள்';
      else if (rawUnit.toLowerCase() === 'box' || rawUnit.toLowerCase() === 'boxes') unitLabel = 'பெட்டி';
      else if (rawUnit.toLowerCase() === 'rolls' || rawUnit.toLowerCase() === 'roll') unitLabel = 'ரோல்';
      else unitLabel = 'பீஸ்';
    }
    tags.push(`${count} ${unitLabel}`);
  }
  tags.push(locale === 'ta' ? 'பசுமை பட்டாசு' : 'Green Cracker');

  return (
    <section
      ref={cardRef}
      className="_card group scope product-card select-none h-full flex flex-col justify-start"
    >
      {/* Top & Middle Content Container */}
      <div className="w-full flex flex-col">
        {/* ── 1. Thumbnail Stack & Curved Inverted Category Tab ── */}
        <div className="_thumbnail-stack relative">
          {img1 ? (
            <img
              src={img1}
              alt={displayName}
              width={400}
              height={400}
              loading="lazy"
              decoding="async"
              draggable={false}
              referrerPolicy="no-referrer"
              className="pointer-events-none select-none w-full h-full object-cover"
            />
          ) : (
            <ProductVisualPlaceholder name={product.name} className="w-full h-full" />
          )}

            {/* Out of Stock Overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 z-20 rounded-[20px]">
                <span className="bg-white text-black text-[11px] sm:text-[12px] font-bold px-3 py-1 rounded-full shadow-sm">
                  {tCommon('outOfStock')}
                </span>
              </div>
            )}
          </div>

          {/* Curved Inset Category Badge */}
          <p className="_category">{categoryName}</p>

          {/* ── 2. Product information and quick facts ── */}
          <div className="product-card-info mt-3 flex min-w-0 flex-col">
            <Link href={`/${locale}/product/${product.slug}`} className="block min-w-0">
              <h2 className="_heading line-clamp-2 min-h-[2.6em] group-hover:text-amber-600 transition-colors" title={displayName}>
                {displayName}
              </h2>
            </Link>

            <ul className="_tag-list mt-2 min-h-7 overflow-hidden">
              {tags.slice(0, 2).map((tag, idx) => (
                <li key={idx} className={idx === 0 && count ? '_tag _tag-primary' : '_tag'}>
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Price and purchase action share a compact footer, matching the reference layout. */}
        <div className="product-card-footer">
          <div className="product-card-price-info min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                {tProducts('price')}
              </span>
              {discount > 0 && (
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 sm:text-xs">
                  {discount}% OFF
                </span>
              )}
            </div>
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="product-card-sale-price whitespace-nowrap text-2xl font-extrabold leading-none tracking-tight bg-gradient-to-tr from-orange-700 via-orange-400 to-orange-500 bg-clip-text text-transparent sm:text-3xl">
                {formatCurrency(price)}
              </span>
              {mrp > price && (
                <span className="whitespace-nowrap text-xs font-medium tabular-nums text-neutral-400 line-through dark:text-neutral-500">
                  {formatCurrency(mrp)}
                </span>
              )}
            </div>
          </div>

          <div className="_button product-card-action">
          {isOutOfStock ? (
            <button
              type="button"
              disabled
              className="w-full h-12 px-4 rounded-full bg-neutral-100 text-neutral-400 text-xs sm:text-sm font-bold text-center opacity-70 cursor-not-allowed flex items-center justify-center"
            >
              {tCommon('outOfStock')}
            </button>
          ) : quantity > 0 ? (
            <div className="h-12 px-2.5 rounded-full bg-neutral-100 dark:bg-[#242424] flex items-center justify-between shadow-xs border border-neutral-200/60 dark:border-[#383838]">
              <button
                type="button"
                onClick={() => (quantity === 1 ? removeItem(product.id) : updateQuantity(product.id, quantity - 1))}
                aria-label="Decrease quantity"
                className="w-8 h-8 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-2xs shrink-0"
              >
                <Minus size={13} />
              </button>

              <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white select-none px-3 font-mono">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => updateQuantity(product.id, quantity + 1)}
                disabled={quantity >= product.stockQuantity}
                aria-label="Increase quantity"
                className="w-8 h-8 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 flex items-center justify-center transition-all active:scale-90 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs shrink-0"
              >
                <Plus size={13} />
              </button>
            </div>
          ) : (
            <button
              ref={buttonRef}
              type="button"
              onClick={handleAddToCart}
              className="product-card-purchase-btn scope purchase-button"
            >
              <ShoppingBag size={15} />
              <span>{tProducts('addToBag')}</span>
            </button>
          )}
          </div>
        </div>
      </section>
  );
});
