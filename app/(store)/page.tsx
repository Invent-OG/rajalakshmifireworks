import { db } from '@/db';
import { categories, products, settings } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Truck, Gift, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/store/product-card';
import { StoreButton } from '@/components/ui/store-button';
import { CategoryIcon, getCategory3DImage } from '@/components/ui/category-icon';
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
      <div className="space-y-12 sm:space-y-16">
        {/* ── 1. Hero Section (Design Matched from Reference) ─── */}
        <OrganicHero initialConfig={heroConfig} />

        {/* ── 2. Live Fireworks Categories Bento Discovery Grid ─── */}
        <section className="reveal-section w-full">
          <OrganicCategoriesGrid categories={categoryList} />
        </section>

        {/* ── 3. Featured Products ─── */}
        {featuredProducts.length > 0 && (
          <section className="reveal-section w-full px-4 sm:px-8 lg:px-12">
            <div className="flex items-end justify-between mb-6 pb-3 border-b border-border">
              <div>
                <span className="text-[11px] uppercase font-semibold tracking-widest text-muted-foreground">
                  Specials
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
                  Featured Fireworks
                </h2>
              </div>
              <Link
                href="/products?featured=true"
                className="text-xs font-semibold text-foreground hover:text-brand flex items-center gap-1 group"
              >
                View featured <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="product-stagger-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* ── 4. Bestseller Showcase ─── */}
        {bestsellerProducts.length > 0 && (
          <section className="reveal-section w-full px-4 sm:px-8 lg:px-12">
            <div className="flex items-end justify-between mb-6 pb-3 border-b border-border">
              <div>
                <span className="text-[11px] uppercase font-semibold tracking-widest text-muted-foreground">
                  Favorites
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
                  Festive Bestsellers
                </h2>
              </div>
              <Link
                href="/products?bestseller=true"
                className="text-xs font-semibold text-foreground hover:text-brand flex items-center gap-1 group"
              >
                View bestsellers <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="product-stagger-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
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
        <section className="reveal-section w-full px-4 sm:px-8 lg:px-12">
          <Featured_05 />
        </section>
      </div>
    </HomeMotion>
  );
}
