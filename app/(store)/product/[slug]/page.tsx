import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { toNumber } from '@/lib/utils/format';
import { ProductDetailClient } from './product-detail-client';
import { PriceDisplay } from '@/components/ui/price-display';
import { StatusBadge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Sparkles, AlertTriangle } from 'lucide-react';

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
      media: { orderBy: (m, { asc }) => [asc(m.sortOrder)] },
    },
  });

  if (!product || !product.isActive) notFound();

  const mrp = toNumber(product.mrp);
  const price = toNumber(product.sellingPrice);
  const imageUrl = product.media?.[0]?.url || null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/products" className="hover:text-primary transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> All Fireworks
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/category/${product.category.slug}`} className="hover:text-primary transition-colors">
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground font-semibold truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Product Visual Showcase */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square rounded-3xl bg-gradient-to-b from-muted/60 to-muted/20 border border-border/80 p-8 flex items-center justify-center luxury-card overflow-hidden">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="text-8xl sm:text-9xl select-none animate-float">
                {getProductEmoji(product.category?.name || product.name)}
              </div>
            )}

            {/* Sivakasi authentic stamp */}
            <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-md px-3 py-1 rounded-full border border-border text-[11px] font-bold text-foreground flex items-center gap-1.5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Sivakasi Authentic</span>
            </div>
          </div>
        </div>

        {/* Right: Product Details & Purchase Form */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            {product.category && (
              <span className="text-xs uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400">
                {product.category.name}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              {product.name}
            </h1>
            <p className="text-xs font-mono text-muted-foreground">SKU: {product.sku}</p>
          </div>

          {/* Pricing Hierarchy */}
          <div className="p-5 rounded-2xl bg-card border border-border/80 luxury-card space-y-3">
            <PriceDisplay
              sellingPrice={price}
              mrp={mrp}
              size="xl"
            />
            <p className="text-[11px] text-muted-foreground">
              Inclusive of GST & Factory Packaging. No Hidden Charges.
            </p>
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-3">
            {product.stockQuantity > 0 ? (
              product.stockQuantity <= product.lowStockThreshold ? (
                <StatusBadge status="LOW_STOCK" className="text-xs py-1 px-3" />
              ) : (
                <StatusBadge status="IN_STOCK" className="text-xs py-1 px-3" />
              )
            ) : (
              <StatusBadge status="OUT_OF_STOCK" className="text-xs py-1 px-3" />
            )}
            <span className="text-xs text-muted-foreground">
              {product.stockQuantity > 0
                ? `${product.stockQuantity} boxes currently available in warehouse`
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
            <div className="border-t border-border/80 pt-6 space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Product Description
              </h3>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Safety & Handling Notice */}
          <div className="rounded-2xl bg-muted/40 border border-border/80 p-4 space-y-2.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>Safety & Usage Instructions</span>
            </div>
            <ul className="space-y-1 pl-4 list-disc">
              <li>Use outdoors in open areas clear of dry grass or flammable objects.</li>
              <li>Light using an agarbatti or sparkler at arm&apos;s length.</li>
              <li>Ensure adult presence and keep a water bucket on standby.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function getProductEmoji(name: string): string {
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
