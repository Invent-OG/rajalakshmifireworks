'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useCart, useCartItemQuantity } from '@/hooks/use-cart';
import { toNumber, formatCurrency } from '@/lib/utils/format';
import { ProductVisualPlaceholder } from '@/components/ui/category-icon';
import { gsap, isReducedMotion } from '@/lib/motion';
import { ShoppingCart, Plus, Minus } from 'lucide-react';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    mrp: string;
    sellingPrice: string;
    stockQuantity: number;
    category?: { name: string; slug: string } | null;
    media?: Array<{ url: string; alt?: string | null }>;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, updateQuantity, removeItem } = useCart();
  const quantity = useCartItemQuantity(product.id);
  const mrp = toNumber(product.mrp);
  const price = toNumber(product.sellingPrice);
  const isOutOfStock = product.stockQuantity <= 0;
  const imageUrl = product.media?.[0]?.url || null;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  function handleAddToCart() {
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
      slug: product.slug,
      image: imageUrl,
      mrp,
      sellingPrice: price,
      maxStock: product.stockQuantity,
      quantity: 1,
    });
  }

  // Generate contextual tags for fireworks
  const tags: string[] = [];
  if (discount > 0) tags.push(`${discount}% Off`);
  tags.push('Green Cracker');
  if (product.category?.name) tags.push(product.category.name);

  return (
    <div
      ref={cardRef}
      className="group relative flex flex-col justify-between bg-white rounded-[28px] sm:rounded-[40px] p-3.5 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-300"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── 1. Top Image Showcase with Inverted-Corner Category Tab ── */}
      <div className="relative aspect-[4/3] w-full rounded-[22px] sm:rounded-[30px] overflow-hidden bg-neutral-100/80">
        {/* Category Inset Tab with Smooth Concave Wings */}
        <div className="absolute top-0 left-0 bg-white pl-3.5 pr-3 pt-1.5 pb-1 sm:pl-4.5 sm:pr-4 sm:pt-2.5 sm:pb-2 rounded-br-[18px] sm:rounded-br-[22px] z-10 select-none flex items-center shadow-2xs">
          <span className="text-[11px] sm:text-[13px] font-semibold text-neutral-700 tracking-tight">
            {product.category?.name || 'Fireworks'}
          </span>

          {/* Right Concave Wing */}
          <svg
            className="absolute top-0 left-full w-4 h-4 sm:w-5 sm:h-5 text-white fill-current pointer-events-none"
            viewBox="0 0 20 20"
          >
            <path d="M0 0 H20 A20 20 0 0 1 0 20 Z" />
          </svg>

          {/* Bottom Concave Wing */}
          <svg
            className="absolute top-full left-0 w-4 h-4 sm:w-5 sm:h-5 text-white fill-current pointer-events-none"
            viewBox="0 0 20 20"
          >
            <path d="M0 0 V20 A20 20 0 0 1 20 0 Z" />
          </svg>
        </div>

        {/* Product Image Link */}
        <Link
          href={`/product/${product.slug}`}
          className="block w-full h-full"
        >
          <div className="w-full h-full flex items-center justify-center select-none">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            ) : (
              <ProductVisualPlaceholder name={product.category?.name || product.name} />
            )}
          </div>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 z-20">
              <span className="bg-white text-black text-[11px] sm:text-[12px] font-bold px-3 py-1 rounded-full shadow-sm">
                Sold Out
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* ── 2. Content Details ── */}
      <div className="pt-3 sm:pt-4 flex flex-col flex-1 justify-between space-y-3 sm:space-y-4">
        <div>
          {/* Title & Price Row */}
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <Link href={`/product/${product.slug}`} className="min-w-0 flex-1">
              <h3 className="font-bold text-sm sm:text-lg text-neutral-900 tracking-tight leading-snug truncate hover:text-amber-600 transition-colors">
                {product.name}
              </h3>
            </Link>

            {/* Price Pill Badge */}
            <div className="shrink-0 px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold bg-neutral-100 text-neutral-900 shadow-2xs">
              {formatCurrency(price)}
            </div>
          </div>

          {/* 2-Line Description */}
          <p className="text-xs sm:text-[13px] text-neutral-500 font-normal leading-relaxed line-clamp-2 mt-1.5 sm:mt-2">
            {product.description ||
              'Authentic Sivakasi festive fireworks with vibrant sky bursts, tested safety, and direct wholesale pricing.'}
          </p>

          {/* Tags Row */}
          <div className="flex items-center flex-wrap gap-1 sm:gap-1.5 mt-2.5 sm:mt-3.5">
            {tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-tight bg-neutral-100 text-neutral-600 ${idx === 2 ? 'hidden sm:inline-flex' : ''
                  }`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── 3. Bottom Action Button (Add To Cart) ── */}
        <div className="pt-1">
          {isOutOfStock ? (
            <button
              type="button"
              disabled
              className="w-full py-2.5 sm:py-3.5 px-4 sm:px-6 rounded-full bg-neutral-100 text-neutral-400 text-xs sm:text-sm font-bold text-center opacity-70 cursor-not-allowed"
            >
              Sold Out
            </button>
          ) : quantity > 0 ? (
            <div className="h-10 sm:h-12 px-1.5 sm:px-2 rounded-full bg-neutral-100 flex items-center justify-between shadow-xs">
              <button
                type="button"
                onClick={() => (quantity === 1 ? removeItem(product.id) : updateQuantity(product.id, quantity - 1))}
                aria-label="Decrease quantity"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-950 text-white hover:bg-neutral-800 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-2xs shrink-0"
              >
                <Minus size={13} />
              </button>

              <span className="text-xs sm:text-sm font-bold text-neutral-900 select-none px-1.5 truncate">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => updateQuantity(product.id, quantity + 1)}
                disabled={quantity >= product.stockQuantity}
                aria-label="Increase quantity"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-950 text-white hover:bg-neutral-800 flex items-center justify-center transition-all active:scale-90 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs shrink-0"
              >
                <Plus size={13} />
              </button>
            </div>
          ) : (
            <button
              ref={buttonRef}
              type="button"
              onClick={handleAddToCart}
              className="w-full py-2.5 sm:py-3.5 px-3 sm:px-6 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-98 transition-all duration-300"
            >
              <ShoppingCart size={15} />
              <span>Add To Cart</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


