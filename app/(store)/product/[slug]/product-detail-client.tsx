'use client';

import { useState } from 'react';
import { useCart, useCartItemQuantity } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { ShoppingBag, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ProductDetailClientProps {
  product: {
    id: number;
    name: string;
    slug: string;
    mrp: number;
    sellingPrice: number;
    stockQuantity: number;
    image: string | null;
  };
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addItem, updateQuantity, removeItem } = useCart();
  const cartQuantity = useCartItemQuantity(product.id);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const isOutOfStock = product.stockQuantity <= 0;

  function handleAddToCart() {
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.image,
      mrp: product.mrp,
      sellingPrice: product.sellingPrice,
      maxStock: product.stockQuantity,
      quantity: selectedQuantity,
    });
    toast.success(`${product.name} added to cart`, {
      description: `${selectedQuantity} items added to your shopping bag.`,
    });
  }

  if (isOutOfStock) {
    return (
      <div className="pt-2">
        <Button size="lg" variant="outline" disabled className="w-full opacity-60 cursor-not-allowed">
          Currently Out of Stock
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {cartQuantity > 0 ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300">
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500" />
              {cartQuantity} in your shopping cart
            </span>
            <span>Update quantity below</span>
          </div>

          <div className="flex items-center gap-3">
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
              className="w-44"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Qty:
            </span>
            <QuantityStepper
              quantity={selectedQuantity}
              maxStock={product.stockQuantity}
              onIncrement={() => setSelectedQuantity(Math.min(product.stockQuantity, selectedQuantity + 1))}
              onDecrement={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
              size="lg"
              className="w-36"
            />
          </div>

          <Button
            size="lg"
            variant="primary"
            className="flex-1 text-base font-bold shadow-lg shadow-orange-500/25"
            onClick={handleAddToCart}
          >
            <ShoppingBag className="h-5 w-5" />
            Add to Shopping Cart
          </Button>
        </div>
      )}
    </div>
  );
}
