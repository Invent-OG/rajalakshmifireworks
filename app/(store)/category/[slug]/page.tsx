import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ProductCard } from '@/components/store/product-card';
import { EmptyState } from '@/components/ui/empty-state';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
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
      <div className="rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 p-6 sm:p-10 luxury-card">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to All Fireworks
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Category Collection</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                {category.description}
              </p>
            )}
          </div>
          <div className="self-start sm:self-center px-4 py-2 rounded-2xl bg-card border border-border text-xs font-bold text-foreground">
            {productList.length} {productList.length === 1 ? 'Product' : 'Products'} Available
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {productList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {productList.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Products in This Category"
          description="Check back soon! We are adding fresh stock to this category regularly."
          actionLabel="Explore All Fireworks"
          actionHref="/products"
        />
      )}
    </div>
  );
}
