import { db } from '@/db';
import { categories, products, settings } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { FeaturedProductsSlider } from '@/components/store/featured-products-slider';
import Featured_05 from '@/components/ui/globe-feature-section';
import { HomeMotion } from '@/components/store/home-motion';
import { OrganicHero } from '@/components/store/organic-hero';
import { OrganicCategoriesGrid } from '@/components/store/organic-categories-grid';
import { parseHeroConfig } from '@/lib/hero-config';
import { Testimonial02Blaze } from '@/components/sections/testimonial-02-blaze';
import { InfiniteRibbonPreview } from '@/components/ui/infinite-ribbon-demo';
import { notFound } from 'next/navigation';
import { isValidLocale, Locale } from '@/lib/i18n/config';
import { getTranslations } from '@/lib/i18n/server';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const t = getTranslations(locale, 'seo');

  return {
    title: t('defaultTitle'),
    description: t('defaultDescription'),
    keywords: t('keywords'),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const [categoryList, featuredProducts, bestsellerProducts, heroConfigRow] = await Promise.all([
    db.query.categories.findMany({
      where: eq(categories.isActive, true),
      orderBy: (c, { asc }) => [asc(c.sortOrder)],
      limit: 8,
    }),
    db.query.products.findMany({
      where: and(eq(products.isActive, true), eq(products.isFeatured, true)),
      with: {
        category: true,
        media: { orderBy: (m, { asc }) => [asc(m.sortOrder)], limit: 1 },
      },
      limit: 12,
      orderBy: [desc(products.createdAt)],
    }),
    db.query.products.findMany({
      where: and(eq(products.isActive, true), eq(products.isBestseller, true)),
      with: {
        category: true,
        media: { orderBy: (m, { asc }) => [asc(m.sortOrder)], limit: 1 },
      },
      limit: 12,
      orderBy: [desc(products.createdAt)],
    }),
    db.query.settings.findFirst({
      where: eq(settings.key, 'HERO_SLIDES_CONFIG'),
    }),
  ]);

  const heroConfig = parseHeroConfig(heroConfigRow?.value);
  const tHome = getTranslations(locale, 'hero');
  const tProd = getTranslations(locale, 'products');

  return (
    <HomeMotion>
      <div className="w-full space-y-16 sm:space-y-24 md:space-y-[100px] pb-12 overflow-hidden font-sans">
        {/* ── 1. Hero Section ─── */}
        <OrganicHero initialConfig={heroConfig} />

        {/* ── Infinite Ribbon Ticker ─── */}
        <InfiniteRibbonPreview />

        {/* ── 4. Festive Bestsellers Slider ─── */}
        {bestsellerProducts.length > 0 && (
          <FeaturedProductsSlider
            products={bestsellerProducts}
            title={locale === 'ta' ? 'அதிகம் விற்பனையான பட்டாசுகள்' : 'Festive Bestsellers'}
            subtitle={
              locale === 'ta'
                ? 'தமிழ்நாடு மற்றும் தென் இந்தியா முழுவதும் வாடிக்கையாளர்களால் அதிகம் விரும்பப்பட்ட சிறந்த பட்டாசுகள்.'
                : 'The most demanded celebration fireworks across Tamil Nadu & South India, packaged fresh from Sivakasi workshops.'
            }
            tagLabel={locale === 'ta' ? 'வாடிக்கையாளர் விருப்பம்' : 'Customer Favorites'}
            viewAllHref={locale === 'en' ? '/products?bestseller=true' : `/${locale}/products?bestseller=true`}
            viewAllLabel={locale === 'ta' ? 'அனைத்தையும் பார்க்க' : 'View All Bestsellers'}
          />
        )}

        {/* ── 2. Live Fireworks Categories Bento Discovery Grid ─── */}
        <section className="reveal-section w-full">
          <OrganicCategoriesGrid categories={categoryList} />
        </section>

        {/* ── 3. Featured Products Slider ─── */}
        {featuredProducts.length > 0 && (
          <FeaturedProductsSlider products={featuredProducts} />
        )}

        {/* ── 5. Testimonial 02 Blaze ─── */}
        <section className="reveal-section w-full">
          <Testimonial02Blaze />
        </section>

        {/* ── 6. Globe Feature Showcase ─── */}
        <section className="reveal-section w-full max-w-[1280px] mx-auto px-4 sm:px-8 md:px-[80px]">
          <Featured_05 />
        </section>
      </div>
    </HomeMotion>
  );
}
