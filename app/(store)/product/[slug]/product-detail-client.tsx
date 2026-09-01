'use client';

import { useState } from 'react';
import { useCart, useCartItemQuantity } from '@/hooks/use-cart';
import { StoreButton } from '@/components/ui/store-button';
import { AddToBagButton } from '@/components/ui/add-to-bag-button';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { Check } from 'lucide-react';
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
    toast.success(`${product.name} added to cart`);
  }

  if (isOutOfStock) {
    return (
      <div className="pt-2">
        <StoreButton size="lg" variant="outline" disabled className="w-full opacity-50 cursor-not-allowed">
          Currently Out of Stock
        </StoreButton>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {cartQuantity > 0 ? (
        <div className="p-4 rounded-xl bg-muted/60 border border-border space-y-2.5">
          <div className="flex items-center justify-between text-xs font-medium text-foreground">
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-700" />
              {cartQuantity} in your shopping bag
            </span>
            <span className="text-muted-foreground">Update quantity below</span>
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
              className="w-40"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Qty:
            </span>
            <QuantityStepper
              quantity={selectedQuantity}
              maxStock={product.stockQuantity}
              onIncrement={() => setSelectedQuantity(Math.min(product.stockQuantity, selectedQuantity + 1))}
              onDecrement={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
              size="lg"
              className="w-32"
            />
          </div>

          <AddToBagButton
            className="flex-1"
            onClick={handleAddToCart}
          >
            Add to bag
          </AddToBagButton>
        </div>
      )}
    </div>
  );
}
