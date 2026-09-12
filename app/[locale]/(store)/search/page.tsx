import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { eq, and, ilike, or, desc } from 'drizzle-orm';
import { ProductCard } from '@/components/store/product-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Search, Sparkles } from 'lucide-react';
import Link from 'next/link';
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
  if (!isValidLocale(locale)) return { title: 'Not Found' };
  const t = getTranslations(locale, 'navigation');
  const tSeo = getTranslations(locale, 'seo');

  return {
    title: `${t('search')} | Rajalakshmi Fireworks`,
    description: tSeo('defaultDescription'),
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const { q } = await searchParams;
  const query = q?.trim() || '';

  const [categoryList, results] = await Promise.all([
    db.query.categories.findMany({
      where: eq(categories.isActive, true),
      limit: 6,
    }),
    query
      ? db.query.products.findMany({
          where: and(
            eq(products.isActive, true),
            or(
              ilike(products.name, `%${query}%`),
              ilike(products.nameTa, `%${query}%`),
              ilike(products.description, `%${query}%`),
              ilike(products.descriptionTa, `%${query}%`)
            )!
          ),
          with: {
            category: true,
            media: { orderBy: (m, { asc }) => [asc(m.sortOrder)], limit: 1 },
          },
          orderBy: [desc(products.isFeatured), desc(products.createdAt)],
          limit: 40,
        })
      : Promise.resolve([]),
  ]);

  const tNav = getTranslations(locale, 'navigation');
  const tProd = getTranslations(locale, 'products');
  const tFilters = getTranslations(locale, 'filters');
  const getHref = (path: string) => (locale === 'en' ? path : `/${locale}${path}`);

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 animate-fade-in space-y-8 font-sans">
      {/* Search Input Header */}
      <div className="max-w-2xl mx-auto text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-1.5 text-xs uppercase font-medium tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-brand" />
          <span>{locale === 'ta' ? 'பட்டாசு தேடல்' : 'Catalog Search'}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight font-heading">
          {locale === 'ta' ? 'உங்களுக்குப் பிடித்த பட்டாசுகளைத் தேடுங்கள்' : 'Find your fireworks'}
        </h1>

        <form method="GET" action={getHref('/search')} className="relative max-w-xl mx-auto">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder={locale === 'ta' ? 'பட்டாசுகளைத் தேடுங்கள்... (எ.கா: மத்தாப்பு, ராக்கெட்)' : 'Search fireworks...'}
            className="w-full h-14 pl-12 pr-32 rounded-full border border-neutral-200/80 bg-white text-foreground text-sm placeholder:text-muted-foreground/60 shadow-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all"
            autoFocus
          />
          <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 sm:h-11 px-6 bg-neutral-950 text-white text-xs sm:text-sm font-bold rounded-full hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer shadow-md"
          >
            {tNav('search')}
          </button>
        </form>

        {/* Quick Search Suggestions */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
          <span className="font-medium">{locale === 'ta' ? 'பிரபலமானவை:' : 'Popular:'}</span>
          {categoryList.map((cat) => (
            <Link
              key={cat.id}
              href={getHref(`/search?q=${encodeURIComponent(getLocalizedName(cat, locale))}`)}
              className="px-4 py-2 rounded-full bg-white hover:bg-neutral-100 text-neutral-800 transition-colors text-xs sm:text-sm font-semibold shadow-xs"
            >
              {getLocalizedName(cat, locale)}
            </Link>
          ))}
        </div>
      </div>

      {/* Results View */}
      {query ? (
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">
              {locale === 'ta' ? `"${query}" க்கான தேடல் முடிவுகள்:` : `Results for "${query}"`}
            </h2>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-muted text-muted-foreground font-mono">
              {results.length} {locale === 'ta' ? 'பட்டாசுகள்' : results.length === 1 ? 'item' : 'items'}
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
              title={tProd('noProducts')}
              description={
                locale === 'ta'
                  ? `"${query}" என்ற தேடலுக்கு பட்டாசுகள் எதுவும் கிடைக்கவில்லை.`
                  : `We couldn't find any items matching "${query}". Try searching for categories like "Sparklers" or "Flower Pots".`
              }
              actionLabel={tNav('allProducts')}
              actionHref={getHref('/products')}
            />
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground text-xs sm:text-sm">
          {locale === 'ta'
            ? 'சிவகாசி பட்டாசு பட்டியலைத் தேட மேலே உள்ள தேடல் பட்டியைப் பயன்படுத்தவும்.'
            : 'Type a search term above to browse through our Sivakasi fireworks catalog.'}
        </div>
      )}
    </div>
  );
}
