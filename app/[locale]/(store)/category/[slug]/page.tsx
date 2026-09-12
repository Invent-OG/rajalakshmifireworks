import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ProductCard } from '@/components/store/product-card';
import { EmptyState } from '@/components/ui/empty-state';
import { QuickCartSidebar } from '@/components/store/quick-cart-drawer';
import { SectionTag } from '@/components/ui/section-tag';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCategory3DImage } from '@/components/ui/category-icon';
import type { Metadata } from 'next';
import { isValidLocale, Locale } from '@/lib/i18n/config';
import { getTranslations } from '@/lib/i18n/server';
import { getLocalizedName, getLocalizedDescription } from '@/lib/i18n/formatters';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return { title: 'Not Found' };

  const category = await db.query.categories.findFirst({ where: eq(categories.slug, slug) });
  if (!category) return { title: 'Category Not Found' };

  const displayName = getLocalizedName(category, locale);
  const displayDescription = getLocalizedDescription(category, locale);

  return {
    title: `${displayName} | Rajalakshmi Fireworks`,
    description: displayDescription || `Browse authentic ${displayName} fireworks directly from Sivakasi.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const category = await db.query.categories.findFirst({
    where: and(eq(categories.slug, slug), eq(categories.isActive, true)),
  });

  if (!category) notFound();

  const productList = await db.query.products.findMany({
    where: and(eq(products.categoryId, category.id), eq(products.isActive, true)),
    with: { media: { orderBy: (m, { asc }) => [asc(m.sortOrder)], limit: 1 } },
    orderBy: [desc(products.createdAt)],
  });

  const displayName = getLocalizedName(category, locale);
  const displayDescription = getLocalizedDescription(category, locale);
  const tNav = getTranslations(locale, 'navigation');
  const tProd = getTranslations(locale, 'products');

  const getHref = (path: string) => (locale === 'en' ? path : `/${locale}${path}`);

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 animate-fade-in space-y-8 font-sans">
      {/* Category Hero Banner */}
      <div className="rounded-[36px] sm:rounded-[40px] bg-white p-6 sm:p-8 shadow-sm">
        <Link
          href={getHref('/products')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4.5 py-2 rounded-full bg-neutral-100 text-neutral-800 hover:bg-neutral-200 hover:text-neutral-950 mb-6 transition-all shadow-xs active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" /> {locale === 'ta' ? 'அனைத்து பட்டாசுகள் பகுதிக்கு செல்ல' : 'Back to All Fireworks'}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-[24px] sm:rounded-[28px] overflow-hidden bg-neutral-100 shrink-0 relative shadow-sm">
              <img
                src={getCategory3DImage(category.name)}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-2">
              <SectionTag label={locale === 'ta' ? 'அசல் சிவகாசி தொகுப்பு' : 'Original Sivakasi Collection'} size="sm" />
              <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight font-heading">
                {displayName}
              </h1>
              {displayDescription && (
                <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
                  {displayDescription}
                </p>
              )}
            </div>
          </div>
          <div className="self-start sm:self-center px-4 py-2 rounded-full bg-neutral-100 text-xs sm:text-sm font-bold text-foreground shadow-xs font-mono">
            {productList.length} {locale === 'ta' ? 'பட்டாசுகள்' : productList.length === 1 ? 'item' : 'items'}
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
              title={tProd('noProducts')}
              description={locale === 'ta' ? 'இப்பிரிவில் தற்போது பட்டாசுகள் எதுவும் இல்லை. விரைவில் புதுப்பிக்கப்படும்.' : 'Check back soon! We are replenishing fresh inventory to this category regularly.'}
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
