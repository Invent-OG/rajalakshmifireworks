'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useCart, useCartItemQuantity } from '@/hooks/use-cart';
import { toNumber } from '@/lib/utils/format';
import { StoreButton } from '@/components/ui/store-button';
import { AddToBagButton } from '@/components/ui/add-to-bag-button';
import { PriceDisplay } from '@/components/ui/price-display';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { ProductVisualPlaceholder } from '@/components/ui/category-icon';
import { gsap, isReducedMotion } from '@/lib/motion';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    slug: string;
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

  function handleAddToCart() {
    if (buttonRef.current && !isReducedMotion()) {
      gsap.fromTo(
        buttonRef.current,
        { scale: 0.92 },
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

  return (
    <div
      ref={cardRef}
      className="group relative flex flex-col justify-between rounded-2xl bg-card border border-border overflow-hidden transition-all duration-200 hover:border-neutral-300 hover:shadow-md p-3"
    >
      {/* Top Image Showcase */}
      <Link
        href={`/product/${product.slug}`}
        className="block relative aspect-square overflow-hidden rounded-xl bg-muted/30"
      >
        <div className="w-full h-full flex items-center justify-center select-none">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
            />
          ) : (
            <ProductVisualPlaceholder name={product.category?.name || product.name} />
          )}
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-2">
            <span className="bg-foreground text-background text-xs font-semibold px-3 py-1 rounded-full shadow-xs">
              Out of stock
            </span>
          </div>
        )}
      </Link>

      {/* Content Details */}
      <div className="pt-3 flex flex-col flex-1 justify-between space-y-3">
        <div className="space-y-1">
          {product.category && (
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              {product.category.name}
            </p>
          )}

          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="font-semibold text-sm sm:text-base text-foreground leading-snug line-clamp-2 hover:text-brand transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Pricing Hierarchy */}
          <PriceDisplay
            sellingPrice={price}
            mrp={mrp}
            size="md"
            className="pt-1"
          />
        </div>

        {/* Action Bottom Area */}
        <div className="pt-2">
          {isOutOfStock ? (
            <StoreButton variant="outline" size="sm" className="w-full opacity-50 cursor-not-allowed" disabled>
              Sold Out
            </StoreButton>
          ) : quantity > 0 ? (
            <div className="flex items-center justify-between gap-2">
              <QuantityStepper
                quantity={quantity}
                maxStock={product.stockQuantity}
                onIncrement={() => updateQuantity(product.id, quantity + 1)}
                onDecrement={() => (quantity === 1 ? removeItem(product.id) : updateQuantity(product.id, quantity - 1))}
                size="md"
                className="w-full"
              />
            </div>
          ) : (
            <AddToBagButton
              ref={buttonRef}
              className="w-full"
              onClick={handleAddToCart}
            >
              Add to bag
            </AddToBagButton>
          )}
        </div>
      </div>
    </div>
  );
}
