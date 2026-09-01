import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { eq, and, desc, asc, ilike } from 'drizzle-orm';
import { ProductCard } from '@/components/store/product-card';
import { SortSelector } from '@/components/store/sort-selector';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';
import { Sparkles, Filter } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Fireworks & Crackers',
  description: 'Browse our complete catalog of authentic Sivakasi fireworks, sparklers, ground wheels, and celebration boxes.',
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const search = typeof params.search === 'string' ? params.search : '';
  const sort = typeof params.sort === 'string' ? params.sort : 'newest';
  const featured = params.featured === 'true';
  const bestseller = params.bestseller === 'true';
  const categorySlug = typeof params.category === 'string' ? params.category : '';

  const conditions = [eq(products.isActive, true)];
  if (search) conditions.push(ilike(products.name, `%${search}%`));
  if (featured) conditions.push(eq(products.isFeatured, true));
  if (bestseller) conditions.push(eq(products.isBestseller, true));

  let activeCategory: { id: number; name: string } | undefined;
  if (categorySlug) {
    const found = await db.query.categories.findFirst({
      where: eq(categories.slug, categorySlug),
    });
    if (found) {
      activeCategory = found;
      conditions.push(eq(products.categoryId, found.id));
    }
  }

  let orderBy;
  switch (sort) {
    case 'price_asc':
      orderBy = asc(products.sellingPrice);
      break;
    case 'price_desc':
      orderBy = desc(products.sellingPrice);
      break;
    case 'name_asc':
      orderBy = asc(products.name);
      break;
    default:
      orderBy = desc(products.createdAt);
  }

  const [productList, categoryList] = await Promise.all([
    db.query.products.findMany({
      where: and(...conditions),
      with: {
        media: { orderBy: (m, { asc }) => [asc(m.sortOrder)], limit: 1 },
        category: true,
      },
      orderBy: () => [orderBy],
      limit: 100,
    }),
    db.query.categories.findMany({
      where: eq(categories.isActive, true),
      orderBy: (c, { asc }) => [asc(c.sortOrder)],
    }),
  ]);

  const pageHeading = activeCategory
    ? activeCategory.name
    : featured
    ? 'Featured Gift Boxes & Combos'
    : bestseller
    ? 'Festive Bestsellers'
    : search
    ? `Results for "${search}"`
    : 'All Fireworks & Crackers';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border/80 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Sivakasi Cracker Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {pageHeading}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Showing {productList.length} authentic fireworks items
          </p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label htmlFor="sort" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
            Sort:
          </label>
          <SortSelector current={sort} />
        </div>
      </div>

      {/* Quick category scrollbar on Mobile */}
      <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-6">
        <Link
          href="/products"
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all ${
            !categorySlug && !featured && !bestseller
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:border-primary/40'
          }`}
        >
          All
        </Link>
        <Link
          href="/products?featured=true"
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all ${
            featured
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:border-primary/40'
          }`}
        >
          Featured
        </Link>
        <Link
          href="/products?bestseller=true"
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all ${
            bestseller
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:border-primary/40'
          }`}
        >
          Bestsellers
        </Link>
        {categoryList.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all ${
              categorySlug === cat.slug
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary/40'
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Main Catalog View */}
      <div className="flex gap-8 items-start">
        {/* Desktop Category Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 bg-card rounded-3xl border border-border/80 p-5 sticky top-24 luxury-card">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border font-bold text-xs uppercase tracking-wider text-muted-foreground">
            <Filter className="h-4 w-4 text-primary" />
            <span>Filter Categories</span>
          </div>

          <ul className="space-y-1.5">
            <li>
              <Link
                href="/products"
                className={`block px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                  !categorySlug && !featured && !bestseller
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                All Fireworks
              </Link>
            </li>
            <li>
              <Link
                href="/products?featured=true"
                className={`block px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                  featured
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                Featured Combos
              </Link>
            </li>
            <li>
              <Link
                href="/products?bestseller=true"
                className={`block px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                  bestseller
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                Festive Bestsellers
              </Link>
            </li>

            <li className="pt-2 pb-1 border-t border-border/60 my-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-2">
              Specific Types
            </li>

            {categoryList.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/products?category=${cat.slug}`}
                  className={`block px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                    categorySlug === cat.slug
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Product Grid Area */}
        <div className="flex-1">
          {productList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {productList.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Fireworks Found"
              description={
                search
                  ? `We couldn't find any crackers matching "${search}". Try searching for categories like "Sparklers" or "Flower Pots".`
                  : 'There are currently no crackers listed in this category.'
              }
              actionLabel="View All Fireworks"
              actionHref="/products"
            />
          )}
        </div>
      </div>
    </div>
  );
}
