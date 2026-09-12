import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { formatCurrency, toNumber } from '@/lib/utils/format';
import { ProductDetailClient } from './product-detail-client';
import { ProductMediaGallery } from '@/components/store/product-media-gallery';
import { PriceDisplay } from '@/components/ui/price-display';
import { StatusBadge } from '@/components/ui/badge';
import { ProductVisualPlaceholder } from '@/components/ui/category-icon';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Package, Sparkles, Layers, CheckCircle2 } from 'lucide-react';

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
      comboItems: {
        with: {
          product: {
            with: {
              category: true,
              media: { orderBy: (m) => [m.sortOrder], limit: 1 },
            },
          },
        },
        orderBy: (ci) => [ci.sortOrder],
      },
    },
  });

  if (!product || !product.isActive) notFound();

  const mrp = toNumber(product.mrp);
  const price = toNumber(product.sellingPrice);
  const imageUrl =
    product.media?.find((m: { type: string }) => m.type === 'image')?.url ||
    product.media?.[0]?.url ||
    null;

  const isComboProduct = Boolean(product.isCombo) || (product.comboItems && product.comboItems.length > 0);
  const totalComboPieces = product.comboItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

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

          {/* If Combo: Highlight Box on Left */}
          {isComboProduct && (
            <div className="p-5 rounded-[28px] bg-amber-50/80 border border-amber-200/90 text-amber-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>Festival Celebration Combo Pack</span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                Contains <strong>{totalComboPieces} curated items</strong> from our Sivakasi factory. Fully verified for maximum festive sparkle, sound, and child-safe fun.
              </p>
            </div>
          )}
        </div>

        {/* Right: Product Details & Purchase Form */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {product.category && (
                <span className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                  {product.category.name}
                </span>
              )}
              {isComboProduct && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="h-3 w-3" /> Combo Pack
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              {product.name}
            </h1>
            <p className="text-xs font-mono text-muted-foreground">SKU: {product.sku || 'N/A'}</p>
          </div>

          {/* Pricing Hierarchy */}
          <div className="p-6 rounded-[28px] sm:rounded-[32px] bg-white shadow-sm space-y-2">
            <PriceDisplay sellingPrice={price} mrp={mrp} size="xl" />
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

          {/* What's Included in this Combo Breakdown */}
          {isComboProduct && product.comboItems && product.comboItems.length > 0 && (
            <div className="p-6 rounded-[28px] sm:rounded-[32px] bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Package className="h-4.5 w-4.5 text-neutral-900" />
                  <h3 className="font-bold text-sm text-foreground">
                    Included Items ({product.comboItems.length} Varieties • {totalComboPieces} Total Pcs)
                  </h3>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  100% Genuine Sivakasi
                </span>
              </div>

              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {product.comboItems.map((ci, idx) => {
                  const itemProd = ci.product;
                  const itemImg = itemProd?.media?.[0]?.url;

                  return (
                    <div
                      key={ci.id || idx}
                      className="p-3 rounded-2xl bg-neutral-50/70 border border-neutral-100 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden border border-neutral-200/60">
                          {itemImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={itemImg}
                              alt={itemProd?.name || 'Included cracker'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ProductVisualPlaceholder
                              name={itemProd?.name || 'Cracker'}
                              className="w-full h-full"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-foreground truncate">
                            {itemProd?.name || `Firework #${ci.productId}`}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                            {itemProd?.category && <span>{itemProd.category.name}</span>}
                            <span>•</span>
                            <span className="font-mono">
                              MRP: {formatCurrency(toNumber(itemProd?.mrp || 0))}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-neutral-900 text-white font-mono">
                          × {ci.quantity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
