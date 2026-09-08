import { db } from '@/db';
import { categories, products, settings } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Truck, Gift, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/store/product-card';
import { StoreButton } from '@/components/ui/store-button';
import { CategoryIcon, getCategory3DImage } from '@/components/ui/category-icon';
import { SectionTag } from '@/components/ui/section-tag';
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
      limit: 8,
      orderBy: [desc(products.createdAt)],
    }),
    db.query.products.findMany({
      where: and(eq(products.isActive, true), eq(products.isBestseller, true)),
      with: {
        category: true,
        media: { orderBy: (m, { asc }) => [asc(m.sortOrder)], limit: 1 },
      },
      limit: 8,
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

        {/* ── 2. Live Fireworks Categories Bento Discovery Grid ─── */}
        <section className="reveal-section w-full">
          <OrganicCategoriesGrid categories={categoryList} />
        </section>

        {/* ── 3. Featured Products ─── */}
        {featuredProducts.length > 0 && (
          <section className="reveal-section w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12">
            <div className="section-header flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-neutral-100 gap-4">
              <div className="space-y-3">
                <SectionTag label="Curated Collections" />
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-neutral-950">
                  Featured Fireworks
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 font-normal max-w-xl">
                  Hand-selected aerial cakes, vibrant flower pots, and family combo boxes tested for maximum sparkle and tested safety.
                </p>
              </div>
              <Link
                href="/products?featured=true"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all self-start sm:self-auto shrink-0 justify-center"
              >
                <span>View All Featured</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="product-stagger-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* ── 4. Bestseller Showcase ─── */}
        {bestsellerProducts.length > 0 && (
          <section className="reveal-section w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12">
            <div className="section-header flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-neutral-100 gap-4">
              <div className="space-y-3">
                <SectionTag label="Customer Favorites" />
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-neutral-950">
                  Festive Bestsellers
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 font-normal max-w-xl">
                  The most demanded celebration fireworks across Tamil Nadu &amp; South India, packaged fresh from Sivakasi workshops.
                </p>
              </div>
              <Link
                href="/products?bestseller=true"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all self-start sm:self-auto shrink-0 justify-center"
              >
                <span>View All Bestsellers</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="product-stagger-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {bestsellerProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
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
