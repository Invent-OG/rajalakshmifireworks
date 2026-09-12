'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useCart, useCartItemQuantity } from '@/hooks/use-cart';
import { toNumber, formatCurrency } from '@/lib/utils/format';
import { ProductVisualPlaceholder } from '@/components/ui/category-icon';
import { gsap, isReducedMotion } from '@/lib/motion';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { getLocalizedName, getLocalizedDescription } from '@/lib/i18n/formatters';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    nameTa?: string | null;
    slug: string;
    description?: string | null;
    descriptionTa?: string | null;
    mrp: string;
    sellingPrice: string;
    stockQuantity: number;
    category?: { name: string; nameTa?: string | null; slug: string } | null;
    media?: Array<{ url: string; alt?: string | null }>;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const locale = useLocale();
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
  const displayDesc = getLocalizedDescription(product, locale) || (
    locale === 'ta'
      ? 'உயர்தர ஒளி மற்றும் வண்ணங்களுடன் பிரகாசிக்கும் பாதுகாப்பான சிவகாசி நேரடி பட்டாசு.'
      : 'Authentic Sivakasi festive fireworks with vibrant sky bursts, tested safety, and direct wholesale pricing.'
  );
  const categoryName = getLocalizedName(product.category, locale) || (locale === 'ta' ? 'பட்டாசு' : 'Fireworks');

  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (buttonRef.current && !isReducedMotion()) {
      gsap.fromTo(
        buttonRef.current,
        { scale: 0.94 },
        { scale: 1, duration: 0.3, ease: 'back.out(2)' }
      );
    }

    addItem({
      productId: product.id,
      name: displayName,
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
  if (discount > 0) tags.push(tCommon('off', { percent: discount }));
  tags.push(locale === 'ta' ? 'பசுமை பட்டாசு' : 'Green Cracker');
  if (categoryName) tags.push(categoryName);

  return (
    <>
      {/* SVG Inset Shadow Filter */}
      <svg width="0" height="0" className="hidden fixed" aria-hidden="true">
        <filter id="svg-inset-shadow">
          <feOffset in="SourceAlpha" dx="6" dy="8" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="8" />
          <feComposite in="SourceAlpha" operator="out" />
          <feBlend in2="SourceGraphic" mode="multiply" />
        </filter>
      </svg>

      <section
        ref={cardRef}
        className="_card group scope product-card select-none"
      >
        {/* ── 1. Thumbnail Stack & Curved Inverted Category Tab ── */}
        <div className="_thumbnail-stack relative">
          {img1 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img1}
                alt={displayName}
                width={400}
                height={400}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img2 || img1}
                alt={displayName}
                width={400}
                height={400}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4">
              <ProductVisualPlaceholder name={product.name} />
            </div>
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

        {/* ── 2. Header Grid (Heading + Price Pill) ── */}
        <div className="_card-header-grid mt-2">
          <Link href={`/product/${product.slug}`} className="block truncate">
            <h2 className="_heading truncate group-hover:text-amber-600 transition-colors" title={displayName}>
              {displayName}
            </h2>
          </Link>

          {/* Neutral Price Badge with Tabular Numbers */}
          <div className="_price">
            {formatCurrency(price)}
          </div>
        </div>

        {/* ── 3. Description (Line-clamped) ── */}
        <p className="_description">
          {displayDesc}
        </p>

        {/* ── 4. Tag List ── */}
        <ul className="_tag-list">
          {tags.slice(0, 3).map((tag, idx) => (
            <li key={idx} className="_tag">
              {tag}
            </li>
          ))}
        </ul>

        {/* ── 5. Action Button (Pure Black Button / Quantity Stepper) ── */}
        <div className="_button mt-2">
          {isOutOfStock ? (
            <button
              type="button"
              disabled
              className="w-full h-12 px-4 rounded-full bg-neutral-100 text-neutral-400 text-xs sm:text-sm font-bold text-center opacity-70 cursor-not-allowed flex items-center justify-center"
            >
              {tCommon('outOfStock')}
            </button>
          ) : quantity > 0 ? (
            <div className="h-12 px-2.5 rounded-full bg-neutral-100 flex items-center justify-between shadow-xs border border-neutral-200/60">
              <button
                type="button"
                onClick={() => (quantity === 1 ? removeItem(product.id) : updateQuantity(product.id, quantity - 1))}
                aria-label="Decrease quantity"
                className="w-8 h-8 rounded-full bg-neutral-950 text-white hover:bg-neutral-800 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-2xs shrink-0"
              >
                <Minus size={13} />
              </button>

              <span className="text-xs sm:text-sm font-bold text-neutral-900 select-none px-3 font-mono">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => updateQuantity(product.id, quantity + 1)}
                disabled={quantity >= product.stockQuantity}
                aria-label="Increase quantity"
                className="w-8 h-8 rounded-full bg-neutral-950 text-white hover:bg-neutral-800 flex items-center justify-center transition-all active:scale-90 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs shrink-0"
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
      </section>
    </>
  );
}
