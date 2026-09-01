'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart, useCartItemQuantity } from '@/hooks/use-cart';
import { toNumber } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { PriceDisplay } from '@/components/ui/price-display';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { toast } from 'sonner';

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

  function handleAddToCart() {
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
    toast.success(`${product.name} added to cart`, {
      description: 'Proceed to checkout or continue shopping.',
    });
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl bg-card border border-border/80 overflow-hidden luxury-card hover:border-primary/30 transition-all duration-300">
      {/* Top Image Showcase */}
      <Link
        href={`/product/${product.slug}`}
        className="block relative aspect-4/3 sm:aspect-square overflow-hidden bg-gradient-to-b from-muted/50 to-muted/20"
      >
        <div className="w-full h-full flex items-center justify-center text-5xl sm:text-6xl group-hover:scale-110 transition-transform duration-500 ease-out select-none">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            getCategoryVisual(product.category?.name || product.name)
          )}
        </div>

        {/* Stock status overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
              Sold Out
            </span>
          </div>
        )}
      </Link>

      {/* Content Details */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between space-y-3">
        <div className="space-y-1.5">
          {product.category && (
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              {product.category.name}
            </p>
          )}

          <Link href={`/product/${product.slug}`} className="block group-hover:text-primary transition-colors">
            <h3 className="font-semibold text-sm sm:text-base text-foreground leading-snug line-clamp-2">
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
            <Button variant="outline" size="sm" className="w-full opacity-60 cursor-not-allowed" disabled>
              Out of Stock
            </Button>
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
            <Button
              size="md"
              variant="primary"
              className="w-full font-semibold"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </Button>
          )}

          {!isOutOfStock && product.stockQuantity <= 10 && (
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1.5 text-center">
              ⚡ Only {product.stockQuantity} items left
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function getCategoryVisual(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('sparkler')) return '✨';
  if (lower.includes('flower') || lower.includes('pot')) return '🌸';
  if (lower.includes('rocket')) return '🚀';
  if (lower.includes('chakra') || lower.includes('wheel')) return '🎡';
  if (lower.includes('fountain') || lower.includes('cone')) return '⛲';
  if (lower.includes('sound') || lower.includes('bomb') || lower.includes('wala')) return '💥';
  if (lower.includes('gift') || lower.includes('box')) return '🎁';
  if (lower.includes('family') || lower.includes('pack')) return '🎉';
  return '🎆';
}
