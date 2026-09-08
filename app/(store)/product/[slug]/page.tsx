import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { toNumber } from '@/lib/utils/format';
import { ProductDetailClient } from './product-detail-client';
import { ProductMediaGallery } from '@/components/store/product-media-gallery';
import { PriceDisplay } from '@/components/ui/price-display';
import { StatusBadge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.query.products.findFirst({ where: eq(products.slug, slug) });
  if (!product) return { title: 'Product Not Found' };
  return {
    title: `${product.name} | Rajalakshmi Fireworks`,
    description: product.description || `Buy ${product.name} wholesale direct from Sivakasi.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      category: true,
      media: { orderBy: (m) => [m.sortOrder] },
    },
  });

  if (!product || !product.isActive) notFound();

  const mrp = toNumber(product.mrp);
  const price = toNumber(product.sellingPrice);
  const imageUrl = product.media?.find((m: { type: string; }) => m.type === 'image')?.url || product.media?.[0]?.url || null;

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 animate-fade-in space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/products" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Catalog
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/category/${product.category.slug}`} className="hover:text-foreground transition-colors">
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Product Visual & Video Gallery Showcase */}
        <div className="lg:col-span-6 space-y-4">
          <ProductMediaGallery
            productName={product.name}
            categoryName={product.category?.name}
            media={product.media || []}
          />
        </div>

        {/* Right: Product Details & Purchase Form */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-1.5">
            {product.category && (
              <span className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                {product.category.name}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              {product.name}
            </h1>
            <p className="text-xs font-mono text-muted-foreground">SKU: {product.sku || 'N/A'}</p>
          </div>

          {/* Pricing Hierarchy */}
          <div className="p-6 rounded-[28px] sm:rounded-[32px] bg-white shadow-sm space-y-2">
            <PriceDisplay
              sellingPrice={price}
              mrp={mrp}
              size="xl"
            />
            <p className="text-[11px] text-muted-foreground">
              Inclusive of GST & Factory Packaging. No hidden charges.
            </p>
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-3">
            {product.stockQuantity > 0 ? (
              product.stockQuantity <= product.lowStockThreshold ? (
                <StatusBadge status="LOW_STOCK" className="text-xs py-1 px-3.5" />
              ) : (
                <StatusBadge status="IN_STOCK" className="text-xs py-1 px-3.5" />
              )
            ) : (
              <StatusBadge status="OUT_OF_STOCK" className="text-xs py-1 px-3.5" />
            )}
            <span className="text-xs text-muted-foreground">
              {product.stockQuantity > 0
                ? `${product.stockQuantity} units in stock`
                : 'Restocking soon'}
            </span>
          </div>

          {/* Client Interactive Add to Cart & Stepper */}
          <ProductDetailClient
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              mrp,
              sellingPrice: price,
              stockQuantity: product.stockQuantity,
              image: imageUrl,
            }}
          />

          {/* Description Section */}
          {product.description && (
            <div className="border-t border-neutral-100 pt-6 space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
                Description
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Safety & Handling Notice */}
          <div className="rounded-[28px] sm:rounded-[32px] bg-white p-6 space-y-3 shadow-sm text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <AlertCircle className="h-4 w-4 text-neutral-900" />
              <span>Safety & Usage Instructions</span>
            </div>
            <ul className="space-y-1.5 pl-4 list-disc">
              <li>Use outdoors in open areas clear of dry grass or flammable objects.</li>
              <li>Light using an agarbatti or sparkler at arm&apos;s length.</li>
              <li>Always ensure adult presence and keep a water bucket nearby.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
