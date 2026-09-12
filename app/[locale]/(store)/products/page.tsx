import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { eq, and, desc, asc, ilike, or } from 'drizzle-orm';
import { ProductCard } from '@/components/store/product-card';
import { SortSelector } from '@/components/store/sort-selector';
import { EmptyState } from '@/components/ui/empty-state';
import { QuickCartSidebar } from '@/components/store/quick-cart-drawer';
import { SectionTag } from '@/components/ui/section-tag';
import Link from 'next/link';
import { Filter } from 'lucide-react';
import type { Metadata } from 'next';
import { isValidLocale, Locale } from '@/lib/i18n/config';
import { getTranslations } from '@/lib/i18n/server';
import { getLocalizedName } from '@/lib/i18n/formatters';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const t = getTranslations(locale, 'navigation');
  const tSeo = getTranslations(locale, 'seo');

  return {
    title: `${t('allProducts')} | Rajalakshmi Fireworks`,
    description: tSeo('defaultDescription'),
  };
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const queryParams = await searchParams;
  const search = typeof queryParams.search === 'string' ? queryParams.search : '';
  const sort = typeof queryParams.sort === 'string' ? queryParams.sort : 'newest';
  const featured = queryParams.featured === 'true';
  const bestseller = queryParams.bestseller === 'true';
  const categorySlug = typeof queryParams.category === 'string' ? queryParams.category : '';

  const conditions = [eq(products.isActive, true)];
  if (search) {
    conditions.push(
      or(
        ilike(products.name, `%${search}%`),
        ilike(products.nameTa, `%${search}%`),
        ilike(products.description, `%${search}%`),
        ilike(products.descriptionTa, `%${search}%`)
      )!
    );
  }
  if (featured) conditions.push(eq(products.isFeatured, true));
  if (bestseller) conditions.push(eq(products.isBestseller, true));

  let activeCategory: { id: number; name: string; nameTa?: string | null } | undefined;
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
      orderBy = asc(locale === 'ta' ? products.nameTa : products.name);
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

  const tNav = getTranslations(locale, 'navigation');
  const tProd = getTranslations(locale, 'products');
  const tCat = getTranslations(locale, 'categories');
  const tFilters = getTranslations(locale, 'filters');
  const tCommon = getTranslations(locale, 'common');

  const pageHeading = activeCategory
    ? getLocalizedName(activeCategory, locale)
    : featured
      ? tNav('combos')
      : bestseller
        ? (locale === 'ta' ? 'அதிகம் விற்பனையான பட்டாசுகள்' : 'Festive Bestsellers')
        : search
          ? `${locale === 'ta' ? 'தேடல் முடிவுகள்:' : 'Results for'} "${search}"`
          : tNav('allProducts');

  const getHref = (path: string) => (locale === 'en' ? path : `/${locale}${path}`);

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 animate-fade-in space-y-8 font-sans">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-3">
          <SectionTag label={locale === 'ta' ? 'சிவகாசி நேரடி பட்டியல்' : 'Sivakasi Catalog'} size="sm" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
            {pageHeading}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {tFilters('showingResults', { count: productList.length })}
          </p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label htmlFor="sort" className="text-xs font-medium text-muted-foreground shrink-0">
            {tFilters('sortBy')}:
          </label>
          <SortSelector current={sort} />
        </div>
      </div>

      {/* Mobile Category Horizontal Scroll */}
      <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar pb-2">
        <Link
          href={getHref('/products')}
          className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all ${
            !categorySlug && !featured && !bestseller
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-600 shadow-xs hover:bg-neutral-100'
          }`}
        >
          {tCommon('all')}
        </Link>
        <Link
          href={getHref('/products?featured=true')}
          className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all ${
            featured
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-600 shadow-xs hover:bg-neutral-100'
          }`}
        >
          {tNav('combos')}
        </Link>
        <Link
          href={getHref('/products?bestseller=true')}
          className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all ${
            bestseller
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-600 shadow-xs hover:bg-neutral-100'
          }`}
        >
          {tProd('bestseller')}
        </Link>
        {categoryList.map((cat) => (
          <Link
            key={cat.id}
            href={getHref(`/products?category=${cat.slug}`)}
            className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all ${
              categorySlug === cat.slug
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-white text-neutral-600 shadow-xs hover:bg-neutral-100'
            }`}
          >
            {getLocalizedName(cat, locale)}
          </Link>
        ))}
      </div>

      {/* Main Catalog View: Category Sidebar + Product Grid + Quick Cart Widget */}
      <div className="flex gap-6 items-start">
        {/* Desktop Category Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 bg-white rounded-[28px] sm:rounded-[32px] p-5 sticky top-24 shadow-sm">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-neutral-100 font-bold text-xs uppercase tracking-wider text-neutral-500">
            <Filter className="h-3.5 w-3.5 text-brand" />
            <span>{tCat('title')}</span>
          </div>

          <ul className="space-y-1.5">
            <li>
              <Link
                href={getHref('/products')}
                className={`block px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                  !categorySlug && !featured && !bestseller
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                {tNav('allProducts')}
              </Link>
            </li>
            <li>
              <Link
                href={getHref('/products?featured=true')}
                className={`block px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                  featured
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                {tNav('combos')}
              </Link>
            </li>
            <li>
              <Link
                href={getHref('/products?bestseller=true')}
                className={`block px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                  bestseller
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                {tProd('bestseller')}
              </Link>
            </li>

            <li className="pt-2 pb-1 border-t border-neutral-100 my-2 text-[10px] uppercase font-bold text-neutral-400 tracking-wider px-3">
              {tCat('title')}
            </li>

            {categoryList.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={getHref(`/products?category=${cat.slug}`)}
                  className={`block px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                    categorySlug === cat.slug
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  {getLocalizedName(cat, locale)}
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
              title={tProd('noProducts')}
              description={
                search
                  ? (locale === 'ta'
                      ? `"${search}" என்ற தேடலுக்கு பட்டாசுகள் எதுவும் கிடைக்கவில்லை.`
                      : `We couldn't find any crackers matching "${search}".`)
                  : (locale === 'ta'
                      ? 'இப்பிரிவில் தற்போது பட்டாசுகள் எதுவும் பட்டியலிடப்படவில்லை.'
                      : 'There are currently no crackers listed in this category.')
              }
              actionLabel={tNav('allProducts')}
              actionHref={getHref('/products')}
            />
          )}
        </div>

        {/* Desktop Quick Cart Widget */}
        <QuickCartSidebar />
      </div>
    </div>
  );
}
