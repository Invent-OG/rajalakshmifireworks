import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { eq, and, ilike, desc } from 'drizzle-orm';
import { ProductCard } from '@/components/store/product-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Search, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Fireworks | Rajalakshmi Fireworks',
  description: 'Search our wide range of authentic Sivakasi crackers, sparklers, and gift boxes.',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || '';

  const [categoryList, results] = await Promise.all([
    db.query.categories.findMany({
      where: eq(categories.isActive, true),
      limit: 6,
    }),
    query
      ? db.query.products.findMany({
          where: and(eq(products.isActive, true), ilike(products.name, `%${query}%`)),
          with: {
            category: true,
            media: { orderBy: (m, { asc }) => [asc(m.sortOrder)], limit: 1 },
          },
          orderBy: [desc(products.isFeatured), desc(products.createdAt)],
          limit: 40,
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      {/* Search Input Header */}
      <div className="max-w-2xl mx-auto text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-1.5 text-xs uppercase font-medium tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-brand" />
          <span>Catalog Search</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Find your fireworks
        </h1>

        <form method="GET" action="/search" className="relative max-w-xl mx-auto">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search fireworks..."
            className="w-full h-12 pl-11 pr-24 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground/60 shadow-xs focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all"
            autoFocus
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-4 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary-hover active:scale-95 transition-all cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Quick Search Suggestions */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
          <span>Popular:</span>
          {categoryList.map((cat) => (
            <Link
              key={cat.id}
              href={`/search?q=${encodeURIComponent(cat.name)}`}
              className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors font-medium border border-border"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Results View */}
      {query ? (
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">
              Results for &ldquo;{query}&rdquo;
            </h2>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-muted text-muted-foreground">
              {results.length} {results.length === 1 ? 'item' : 'items'} found
            </span>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title="No fireworks found"
              description={`We couldn't find any items matching "${query}". Try searching for categories like "Sparklers" or "Flower Pots".`}
              actionLabel="View all fireworks"
              actionHref="/products"
            />
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground text-xs sm:text-sm">
          Type a search term above to browse through our Sivakasi fireworks catalog.
        </div>
      )}
    </div>
  );
}
