'use client';

import React from 'react';
import { ProductCard } from '@/components/store/product-card';

interface ProductsCatalogGridProps {
  products: any[];
  locale?: string;
  className?: string;
}

export function ProductsCatalogGrid({
  products,
  locale = 'en',
  className = '',
}: ProductsCatalogGridProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div
      id="products-grid-container"
      className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4 ${className}`}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} locale={locale} />
      ))}
    </div>
  );
}

export default ProductsCatalogGrid;
