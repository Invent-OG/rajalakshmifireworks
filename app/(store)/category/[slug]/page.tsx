import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ProductCard } from '@/components/store/product-card';
import { EmptyState } from '@/components/ui/empty-state';
import { QuickCartSidebar } from '@/components/store/quick-cart-drawer';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { getCategory3DImage } from '@/components/ui/category-icon';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await db.query.categories.findFirst({ where: eq(categories.slug, slug) });
  if (!category) return { title: 'Category Not Found' };
  return {
    title: `${category.name} | Rajalakshmi Fireworks`,
    description: category.description || `Browse authentic ${category.name} fireworks directly from Sivakasi.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await db.query.categories.findFirst({
    where: and(eq(categories.slug, slug), eq(categories.isActive, true)),
  });

  if (!category) notFound();

  const productList = await db.query.products.findMany({
    where: and(eq(products.categoryId, category.id), eq(products.isActive, true)),
    with: { media: { orderBy: (m, { asc }) => [asc(m.sortOrder)], limit: 1 } },
    orderBy: [desc(products.createdAt)],
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      {/* Category Hero Banner */}
      <div className="rounded-2xl bg-background-secondary border border-border p-6 sm:p-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to All Fireworks
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden bg-muted border border-border shrink-0 relative shadow-sm">
              <img
                src={getCategory3DImage(category.name)}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs uppercase font-semibold tracking-wider text-brand mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Original Sivakasi Collection</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
                  {category.description}
                </p>
              )}
            </div>
          </div>
          <div className="self-start sm:self-center px-4 py-2 rounded-full bg-card border border-border text-xs font-semibold text-foreground shadow-xs">
            {productList.length} {productList.length === 1 ? 'item' : 'items'}
          </div>
        </div>
      </div>

      {/* Main Content Layout with Products & Quick Cart */}
      <div className="flex gap-6 items-start">
        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          {productList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4">
              {productList.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No products in this category"
              description="Check back soon! We are replenishing fresh inventory to this category regularly."
              actionLabel="Explore all fireworks"
              actionHref="/products"
            />
          )}
        </div>

        {/* Desktop Quick Cart Widget */}
        <QuickCartSidebar />
      </div>
    </div>
  );
}
