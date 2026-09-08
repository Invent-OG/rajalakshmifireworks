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

export default async function HomePage() {
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

  return (
    <HomeMotion>
      <div className="w-full space-y-16 sm:space-y-24 pb-12 overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* ── 1. Hero Section ─── */}
        <OrganicHero initialConfig={heroConfig} />

        {/* ── 4. Festive Bestsellers Slider ─── */}
        {bestsellerProducts.length > 0 && (
          <FeaturedProductsSlider
            products={bestsellerProducts}
            title="Festive Bestsellers"
            subtitle="The most demanded celebration fireworks across Tamil Nadu & South India, packaged fresh from Sivakasi workshops."
            tagLabel="Customer Favorites"
            viewAllHref="/products?bestseller=true"
            viewAllLabel="View All Bestsellers"
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
        <section className="reveal-section w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12">
          <Featured_05 />
        </section>
      </div>
    </HomeMotion>
  );
}
