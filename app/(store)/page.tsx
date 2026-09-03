import { db } from '@/db';
import { categories, products } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Truck, Gift, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/store/product-card';
import { StoreButton } from '@/components/ui/store-button';
import { CategoryIcon, getCategory3DImage } from '@/components/ui/category-icon';
import Featured_05 from '@/components/ui/globe-feature-section';
import { HomeMotion } from '@/components/store/home-motion';
import { HeroMouseArrow } from '@/components/store/hero-mouse-arrow';

export default async function HomePage() {
  const [categoryList, featuredProducts, bestsellerProducts] = await Promise.all([
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
  ]);

  return (
    <HomeMotion>
      <div className="space-y-16 sm:space-y-24">
        {/* ── 1. Editorial Hero Section ─── */}
        <section className="relative pt-8 sm:pt-14 pb-12 sm:pb-20 border-b border-border bg-background-secondary overflow-hidden">
          {/* Dynamic interactive dashed mouse-guided arrow */}
          <HeroMouseArrow targetSelector="#hero-shop-fireworks-btn" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Content */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="hero-badge inline-flex items-center gap-2 bg-card border border-border px-3 py-1 rounded-full text-xs font-medium text-foreground tracking-tight shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  <span>Direct Sivakasi Factory Direct Commerce</span>
                </div>

                <h1 className="hero-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                  Make every celebration <br className="hidden sm:inline" />
                  <span className="text-brand">brighter</span>.
                </h1>

                <p className="hero-text text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                  Discover premium handcrafted fireworks, vibrant ground sparklers, and curated celebration boxes directly from India&apos;s fireworks capital.
                </p>

                <div className="hero-ctas flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link href="/products" id="hero-shop-fireworks-btn" className="inline-block">
                    <StoreButton size="lg" variant="primary">
                      Shop fireworks
                      <ArrowRight className="h-4 w-4" />
                    </StoreButton>
                  </Link>
                  <Link href="/products?featured=true">
                    <StoreButton size="lg" variant="secondary">
                      Explore collections
                    </StoreButton>
                  </Link>
                </div>

                {/* Trust signals */}
                <div className="hero-signals pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <span>100% Genuine Sivakasi Brand</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <span>Doorstep & Pickup Options</span>
                  </div>
                </div>
              </div>

              {/* Right Hero Visual Showcase */}
              <div className="lg:col-span-5 relative">
                <div className="hero-showcase relative mx-auto max-w-md bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-md overflow-hidden group">
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-muted border border-border">
                    <img
                      src="/images/3d/usp-curated-combos.jpg"
                      alt="Sivakasi Celebration Box 3D"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5 text-white">
                      <span className="text-[11px] uppercase font-bold tracking-widest text-amber-400 mb-1">
                        Festive Celebration Collection
                      </span>
                      <h3 className="text-xl font-extrabold tracking-tight">
                        Sivakasi Family Combos
                      </h3>
                      <p className="text-xs text-neutral-200 mt-1 line-clamp-2">
                        Factory sealed celebration gift assortments with up to 50% direct savings
                      </p>
                    </div>
                  </div>

                  {/* Floating highlights badge */}
                  <div className="mt-4 bg-background-secondary border border-border rounded-xl p-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-card text-emerald-700 border border-border flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Safety Tested & Certified</p>
                      <p className="text-[11px] text-muted-foreground">Standardized low-smoke and sound compliant</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. 3D USP Trust Strip ─── */}
        <section className="reveal-section mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
        </section>

        {/* ── 3. 3D Category Discovery Grid ─── */}
        {categoryList.length > 0 && (
          <section className="reveal-section mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6 pb-3 border-b border-border">
              <div>
                <span className="text-[11px] uppercase font-semibold tracking-widest text-muted-foreground">
                  Collections
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
                  Shop by Category
                </h2>
              </div>
              <Link
                href="/products"
                className="text-xs font-semibold text-foreground hover:text-brand flex items-center gap-1 group"
              >
                View all <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {categoryList.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group rounded-2xl bg-card border border-border hover:border-amber-400/60 hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden"
                >
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                    <img
                      src={getCategory3DImage(cat.name)}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  </div>

                  <div className="p-4 flex items-center justify-between gap-2 flex-1">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-brand transition-colors truncate">
                        {cat.name}
                      </h3>
                      {cat.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                          {cat.description}
                        </p>
                      )}
                    </div>
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-brand group-hover:text-white transition-colors shrink-0">
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── 4. Featured Products ─── */}
        {featuredProducts.length > 0 && (
          <section className="reveal-section mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

            <div className="product-stagger-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* ── 5. Bestseller Showcase ─── */}
        {bestsellerProducts.length > 0 && (
          <section className="reveal-section mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

            <div className="product-stagger-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {bestsellerProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* ── 6. Globe Feature Showcase ─── */}
        <section className="reveal-section mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Featured_05 />
        </section>
      </div>
    </HomeMotion>
  );
}
