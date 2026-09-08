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

        {/* ── 2. 3D USP Trust Strip ─── */}
        {/* <section className="reveal-section w-full px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              {
                image: '/images/3d/usp-sivakasi-direct.jpg',
                title: 'Sivakasi Direct',
                desc: 'Authentic items direct from original manufacturers',
              },
              {
                image: '/images/3d/usp-flexible-dispatch.jpg',
                title: 'Flexible Dispatch',
                desc: 'Doorstep transport delivery or counter pickup',
              },
              {
                image: '/images/3d/usp-curated-combos.jpg',
                title: 'Curated Combos',
                desc: 'Budget-friendly family & community boxes',
              },
              {
                image: '/images/3d/usp-wholesale-value.jpg',
                title: 'Wholesale Value',
                desc: 'Guaranteed 20% to 50% savings below retail',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group p-4 sm:p-5 rounded-2xl bg-card border border-border hover:border-amber-400/50 hover:shadow-lg transition-all duration-300 flex items-center gap-4"
              >
                <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl overflow-hidden bg-muted shrink-0 border border-border shadow-xs group-hover:scale-108 transition-transform duration-300">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm sm:text-base text-foreground group-hover:text-brand transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-snug">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section> */}

        {/* ── 3. Live Fireworks Categories Bento Discovery Grid ─── */}
        <section className="reveal-section w-full">
          <OrganicCategoriesGrid categories={categoryList} />
        </section>

        {/* ── 4. Featured Products ─── */}
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

            <div className="product-stagger-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* ── 5. Bestseller Showcase ─── */}
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

            <div className="product-stagger-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
              {bestsellerProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* ── 6. Globe Feature Showcase ─── */}
        <section className="reveal-section w-full px-4 sm:px-8 lg:px-12">
          <Featured_05 />
        </section>
      </div>
    </HomeMotion>
  );
}
