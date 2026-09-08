import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { eq, and, desc, asc, ilike } from 'drizzle-orm';
import { ProductCard } from '@/components/store/product-card';
import { SortSelector } from '@/components/store/sort-selector';
import { EmptyState } from '@/components/ui/empty-state';
import { QuickCartSidebar } from '@/components/store/quick-cart-drawer';
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
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 animate-fade-in space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs uppercase font-medium tracking-wider text-muted-foreground mb-1">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            <span>Sivakasi Catalog</span>
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
          <label htmlFor="sort" className="text-xs font-medium text-muted-foreground shrink-0">
            Sort:
          </label>
          <SortSelector current={sort} />
        </div>
      </div>

      {/* Mobile Category Horizontal Scroll */}
      <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar pb-2">
        <Link
          href="/products"
          className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all ${
            !categorySlug && !featured && !bestseller
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-600 shadow-xs hover:bg-neutral-100'
          }`}
        >
          All
        </Link>
        <Link
          href="/products?featured=true"
          className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all ${
            featured
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-600 shadow-xs hover:bg-neutral-100'
          }`}
        >
          Featured
        </Link>
        <Link
          href="/products?bestseller=true"
          className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all ${
            bestseller
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-600 shadow-xs hover:bg-neutral-100'
          }`}
        >
          Bestsellers
        </Link>
        {categoryList.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all ${
              categorySlug === cat.slug
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-white text-neutral-600 shadow-xs hover:bg-neutral-100'
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Main Catalog View: Category Sidebar + Product Grid + Quick Cart Widget */}
      <div className="flex gap-6 items-start">
        {/* Desktop Category Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 bg-white rounded-[28px] sm:rounded-[32px] p-5 sticky top-24 shadow-sm">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-neutral-100 font-bold text-xs uppercase tracking-wider text-neutral-500">
            <Filter className="h-3.5 w-3.5 text-brand" />
            <span>Categories</span>
          </div>

          <ul className="space-y-1.5">
            <li>
              <Link
                href="/products"
                className={`block px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                  !categorySlug && !featured && !bestseller
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
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
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
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
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                Festive Bestsellers
              </Link>
            </li>

            <li className="pt-2 pb-1 border-t border-neutral-100 my-2 text-[10px] uppercase font-bold text-neutral-400 tracking-wider px-3">
              Types
            </li>

            {categoryList.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/products?category=${cat.slug}`}
                  className={`block px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                    categorySlug === cat.slug
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Product Grid Area */}
        <div className="flex-1 min-w-0">
          {productList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4">
              {productList.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No fireworks found"
              description={
                search
                  ? `We couldn't find any crackers matching "${search}". Try searching for categories like "Sparklers" or "Flower Pots".`
                  : 'There are currently no crackers listed in this category.'
              }
              actionLabel="View all fireworks"
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
