import { db } from '@/db';
import { categories, products } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, Truck, Gift, Flame, Star, CheckCircle } from 'lucide-react';
import { ProductCard } from '@/components/store/product-card';
import { Button } from '@/components/ui/button';

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
    <div className="space-y-16 sm:space-y-24 animate-fade-in">
      {/* ── 1. Hero Section (Split Composition) ─── */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12 sm:pb-20 border-b border-border/60 festive-hero-gradient">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>DIRECT SIVAKASI FACTORY PRICING</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                Light Up Every <br className="hidden sm:inline" />
                <span className="gold-gradient-text">Celebration</span> with Joy
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Discover India&apos;s finest handcrafted fireworks, dazzling aerial sparklers, and curated family gift boxes. Direct from Sivakasi manufacturers to your doorstep.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link href="/products">
                  <Button size="lg" variant="primary" className="shadow-lg shadow-orange-500/25">
                    <Flame className="h-4.5 w-4.5" />
                    Shop Fireworks
                  </Button>
                </Link>
                <Link href="/products?featured=true">
                  <Button size="lg" variant="outline" className="border-border hover:border-primary/40">
                    <Gift className="h-4.5 w-4.5 text-primary" />
                    Gift Combos
                  </Button>
                </Link>
              </div>

              {/* Mini Social Proof */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>100% Genuine Sivakasi Brand</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>Doorstep & Pickup Options</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-6 sm:p-8 rounded-3xl border border-amber-500/20 shadow-2xl backdrop-blur-sm">
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-gradient-to-tr from-stone-900 via-stone-800 to-stone-900 border border-stone-700/50 flex flex-col items-center justify-center text-center p-6 text-white shadow-xl">
                  <div className="text-6xl sm:text-7xl mb-3 animate-float select-none">
                    ✨🎆✨
                  </div>
                  <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400 mb-1">
                    Festive 2026 Collection
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Mega Sivakasi Family Combos
                  </h3>
                  <p className="text-xs text-stone-300 mt-1">
                    Up to 40% Off on Assorted Gift Packages
                  </p>
                </div>

                {/* Floating highlights badge */}
                <div className="absolute -bottom-4 -left-4 sm:-left-6 bg-card border border-border shadow-xl rounded-2xl p-3.5 flex items-center gap-3 animate-scale-up">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Safety Certified</p>
                    <p className="text-[10px] text-muted-foreground">Standardized sound & smoke norms</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. USP Trust Strip ─── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              icon: Star,
              title: 'Sivakasi Direct',
              desc: 'Authentic crackers directly from manufacturers',
              color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
            },
            {
              icon: Truck,
              title: 'Flexible Dispatch',
              desc: 'Doorstep home delivery or direct store pickup',
              color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
            },
            {
              icon: Gift,
              title: 'Curated Combos',
              desc: 'Budget-friendly family & community packs',
              color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
            },
            {
              icon: Sparkles,
              title: 'Wholesale Savings',
              desc: 'Guaranteed 20% to 50% lower than market rates',
              color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-2xl bg-card border border-border/80 luxury-card"
            >
              <div
                className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}
              >
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-foreground">{item.title}</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Category Tiles ─── */}
      {categoryList.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 pb-3 border-b border-border/60">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400">
                Collections
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
                Shop by Category
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs sm:text-sm font-semibold text-primary hover:text-primary-hover flex items-center gap-1 group"
            >
              View All <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {categoryList.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group relative p-5 sm:p-6 rounded-2xl bg-card border border-border/80 luxury-card hover:border-primary/40 flex flex-col justify-between overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform select-none">
                    {getCategoryEmoji(cat.name)}
                  </span>
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-colors">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
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
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 pb-3 border-b border-border/60">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-orange-600 dark:text-orange-400">
                Handpicked
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
                Featured Fireworks
              </h2>
            </div>
            <Link
              href="/products?featured=true"
              className="text-xs sm:text-sm font-semibold text-primary hover:text-primary-hover flex items-center gap-1 group"
            >
              Explore Featured <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ── 5. Bestseller Products ─── */}
      {bestsellerProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 pb-3 border-b border-border/60">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400">
                Crowd Favorites
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
                Festive Bestsellers
              </h2>
            </div>
            <Link
              href="/products?bestseller=true"
              className="text-xs sm:text-sm font-semibold text-primary hover:text-primary-hover flex items-center gap-1 group"
            >
              View Bestsellers <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {bestsellerProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ── 6. Heritage Trust Banner ─── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 text-white p-8 sm:p-12 border border-stone-800 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              SIVAKASI AUTHENTICITY GUARANTEE
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Celebrate Responsibly with Tested & Certified Fireworks
            </h2>
            <p className="text-sm text-stone-300 leading-relaxed font-normal">
              Every cracker in our catalog undergoes rigorous safety compliance testing. Direct from Sivakasi factory units, packaged securely with moisture-resistant insulation for flawless festive bursts.
            </p>
            <div className="pt-2">
              <Link href="/products">
                <Button size="lg" variant="gold" className="text-stone-950 font-bold">
                  Browse Complete Catalog
                </Button>
              </Link>
            </div>
          </div>
          {/* Subtle ambient light glow */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      </section>
    </div>
  );
}

function getCategoryEmoji(name: string): string {
  const emojiMap: Record<string, string> = {
    Sparklers: '✨',
    'Flower Pots': '🌸',
    Rockets: '🚀',
    Chakras: '🎡',
    Fountains: '⛲',
    'Sound Crackers': '💥',
    'Gift Boxes': '🎁',
    'Family Packs': '🎉',
  };
  return emojiMap[name] || '🎆';
}
