import { db } from '@/db';
import { categories, products } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Truck, Gift, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/store/product-card';
import { StoreButton } from '@/components/ui/store-button';
import { CategoryIcon } from '@/components/ui/category-icon';
import Featured_05 from '@/components/ui/globe-feature-section';
import { HomeMotion } from '@/components/store/home-motion';

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
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                  <Link href="/products">
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
                <div className="hero-showcase relative mx-auto max-w-md bg-card p-6 rounded-2xl border border-border shadow-xs">
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center text-center p-6 text-white shadow-inner">
                    <div className="hero-sparkle-glow h-14 w-14 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-3">
                      <Sparkles className="h-7 w-7 text-amber-400" />
                    </div>
                    <span className="text-[11px] uppercase font-semibold tracking-widest text-amber-400 mb-1">
                      Festive 2026 Collection
                    </span>
                    <h3 className="text-xl font-bold tracking-tight">
                      Sivakasi Family Combos
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                      Factory sealed celebration gift assortments with up to 40% wholesale discount
                    </p>
                  </div>

                  {/* Floating highlights badge */}
                  <div className="mt-4 bg-background-secondary border border-border rounded-xl p-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-card text-emerald-700 border border-border flex items-center justify-center shrink-0">
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

        {/* ── 2. Minimal USP Trust Strip ─── */}
        <section className="reveal-section mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                icon: Sparkles,
                title: 'Sivakasi Direct',
                desc: 'Authentic items direct from original manufacturers',
              },
              {
                icon: Truck,
                title: 'Flexible Dispatch',
                desc: 'Doorstep transport delivery or counter pickup',
              },
              {
                icon: Gift,
                title: 'Curated Combos',
                desc: 'Budget-friendly family & community boxes',
              },
              {
                icon: ShieldCheck,
                title: 'Wholesale Value',
                desc: 'Guaranteed 20% to 50% savings below retail',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-4 rounded-xl bg-card border border-border flex items-start gap-3"
              >
                <div className="h-9 w-9 rounded-lg bg-muted text-foreground flex items-center justify-center shrink-0 border border-border">
                  <item.icon className="h-4.5 w-4.5 text-foreground-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-foreground">{item.title}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. Category Discovery Grid ─── */}
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

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {categoryList.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group p-4 sm:p-5 rounded-2xl bg-card border border-border hover:border-neutral-300 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                      <CategoryIcon name={cat.name} className="h-5 w-5" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-brand transition-colors">
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                        {cat.description}
                      </p>
                    )}
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
