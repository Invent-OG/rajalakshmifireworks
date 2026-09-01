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
      {/* Top Search Input Header */}
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Catalog Search</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Find Your Festive Crackers
        </h1>

        <form method="GET" action="/search" className="relative max-w-xl mx-auto">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by cracker name (e.g. Sparklers, Pots, Rockets)..."
            className="w-full h-13 pl-12 pr-28 rounded-2xl border-2 border-border/80 bg-card text-foreground text-sm placeholder:text-muted-foreground/70 shadow-lg shadow-black/5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            autoFocus
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary-hover active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            Search
          </button>
        </form>

        {/* Quick Search Category Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
          <span>Popular searches:</span>
          {categoryList.map((cat) => (
            <Link
              key={cat.id}
              href={`/search?q=${encodeURIComponent(cat.name)}`}
              className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors font-medium border border-border/60"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Results View */}
      {query ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border/80">
            <h2 className="text-lg font-bold text-foreground">
              Search Results for <span className="text-primary">&ldquo;{query}&rdquo;</span>
            </h2>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground">
              {results.length} {results.length === 1 ? 'result' : 'results'} found
            </span>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title="No Fireworks Found"
              description={`We couldn't find any crackers matching "${query}". Try checking the spelling or search by broader categories.`}
              actionLabel="View All Fireworks"
              actionHref="/products"
            />
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Type a keyword above to search through our Sivakasi fireworks collection.
        </div>
      )}
    </div>
  );
}
