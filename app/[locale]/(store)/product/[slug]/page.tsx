import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { formatCurrency, toNumber } from '@/lib/utils/format';
import { ProductDetailClient } from './product-detail-client';
import { ProductMediaGallery } from '@/components/store/product-media-gallery';
import { PriceDisplay } from '@/components/ui/price-display';
import { StatusBadge } from '@/components/ui/badge';
import { ProductVisualPlaceholder } from '@/components/ui/category-icon';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Package, Sparkles, Layers } from 'lucide-react';
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

  const product = await db.query.products.findFirst({ where: eq(products.slug, slug) });
  if (!product) return { title: 'Product Not Found' };

  const name = getLocalizedName(product, locale);
  const description = getLocalizedDescription(product, locale);

  return {
    title: `${name} | Rajalakshmi Fireworks`,
    description: description || `Buy ${name} wholesale direct from Sivakasi.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      category: true,
      media: { orderBy: (m) => [m.sortOrder] },
      comboItems: {
        with: {
          product: {
            with: {
              category: true,
              media: { orderBy: (m) => [m.sortOrder], limit: 1 },
            },
          },
        },
        orderBy: (ci) => [ci.sortOrder],
      },
    },
  });

  if (!product || !product.isActive) notFound();

  const tProd = getTranslations(locale, 'products');
  const tNav = getTranslations(locale, 'navigation');

  const mrp = toNumber(product.mrp);
  const price = toNumber(product.sellingPrice);
  const imageUrl =
    product.media?.find((m: { type: string }) => m.type === 'image')?.url ||
    product.media?.[0]?.url ||
    null;

  const displayName = getLocalizedName(product, locale);
  const displayDescription = getLocalizedDescription(product, locale);
  const categoryDisplayName = product.category ? getLocalizedName(product.category, locale) : null;

  const isComboProduct = Boolean(product.isCombo) || (product.comboItems && product.comboItems.length > 0);
  const totalComboPieces = product.comboItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const getHref = (path: string) => (locale === 'en' ? path : `/${locale}${path}`);

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 animate-fade-in space-y-8 font-sans">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href={getHref('/products')} className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> {tNav('allProducts')}
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={getHref(`/category/${product.category.slug}`)} className="hover:text-foreground transition-colors">
              {categoryDisplayName}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-xs">{displayName}</span>
      </div>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Product Visual & Video Gallery Showcase */}
        <div className="lg:col-span-6 space-y-4">
          <ProductMediaGallery
            productName={displayName}
            categoryName={categoryDisplayName || undefined}
            media={product.media || []}
          />

          {/* If Combo: Highlight Box on Left */}
          {isComboProduct && (
            <div className="p-5 rounded-[28px] bg-amber-50/80 border border-amber-200/90 text-amber-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>{locale === 'ta' ? 'தீபாவளி திருநாள் சிறப்பு காம்போ பேக்' : 'Festival Celebration Combo Pack'}</span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                {locale === 'ta' ? (
                  <>
                    சிவகாசி தொழிற்சாலையிலிருந்து <strong>{totalComboPieces} தேர்ந்தெடுக்கப்பட்ட பட்டாசுகள்</strong> அடங்கியது. முழு பாதுகாப்புடன் கூடிய உற்சாகக் கொண்டாட்டம்.
                  </>
                ) : (
                  <>
                    Contains <strong>{totalComboPieces} curated items</strong> from our Sivakasi factory. Fully verified for maximum festive sparkle, sound, and child-safe fun.
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Right: Product Details & Purchase Form */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {categoryDisplayName && (
                <span className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                  {categoryDisplayName}
                </span>
              )}
              {isComboProduct && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="h-3 w-3" /> {locale === 'ta' ? 'காம்போ பேக்' : 'Combo Pack'}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-tight font-heading">
              {displayName}
            </h1>
            <p className="text-xs font-mono text-muted-foreground">SKU: {product.sku || 'N/A'}</p>
          </div>

          {/* Pricing Hierarchy */}
          <div className="p-6 rounded-[28px] sm:rounded-[32px] bg-white shadow-sm space-y-2">
            <PriceDisplay sellingPrice={price} mrp={mrp} size="xl" />
            <p className="text-[11px] text-muted-foreground">
              {locale === 'ta' ? 'GST மற்றும் தொழிற்சாலை பேக்கிங் உள்ளடங்கியது. மறைமுக கட்டணங்கள் இல்லை.' : 'Inclusive of GST & Factory Packaging. No hidden charges.'}
            </p>
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-3">
            {product.stockQuantity > 0 ? (
              product.stockQuantity <= product.lowStockThreshold ? (
                <StatusBadge status="LOW_STOCK" className="text-xs py-1 px-3.5" />
              ) : (
                <StatusBadge status="IN_STOCK" className="text-xs py-1 px-3.5" />
              )
            ) : (
              <StatusBadge status="OUT_OF_STOCK" className="text-xs py-1 px-3.5" />
            )}
            <span className="text-xs text-muted-foreground">
              {product.stockQuantity > 0
                ? (locale === 'ta' ? `${product.stockQuantity} எண்ணிக்கையில் உள்ளது` : `${product.stockQuantity} units in stock`)
                : (locale === 'ta' ? 'விரைவில் இருப்பு வரும்' : 'Restocking soon')}
            </span>
          </div>

          {/* Client Interactive Add to Cart & Stepper */}
          <ProductDetailClient
            product={{
              id: product.id,
              name: displayName,
              slug: product.slug,
              mrp,
              sellingPrice: price,
              stockQuantity: product.stockQuantity,
              image: imageUrl,
            }}
          />

          {/* What's Included in this Combo Breakdown */}
          {isComboProduct && product.comboItems && product.comboItems.length > 0 && (
            <div className="p-6 rounded-[28px] sm:rounded-[32px] bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Package className="h-4.5 w-4.5 text-neutral-900" />
                  <h3 className="font-bold text-sm text-foreground">
                    {locale === 'ta'
                      ? `இணைக்கப்பட்டுள்ள பட்டாசுகள் (${product.comboItems.length} வகைகள் • ${totalComboPieces} மொத்த எண்ணிக்கை)`
                      : `Included Items (${product.comboItems.length} Varieties • ${totalComboPieces} Total Pcs)`}
                  </h3>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  {locale === 'ta' ? '100% அசல் சிவகாசி' : '100% Genuine Sivakasi'}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {product.comboItems.map((ci, idx) => {
                  const itemProd = ci.product;
                  const itemImg = itemProd?.media?.[0]?.url;
                  const itemDisplayName = itemProd ? getLocalizedName(itemProd, locale) : `Firework #${ci.productId}`;
                  const itemCategoryName = itemProd?.category ? getLocalizedName(itemProd.category, locale) : null;

                  return (
                    <div
                      key={ci.id || idx}
                      className="p-3 rounded-2xl bg-neutral-50/70 border border-neutral-100 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden border border-neutral-200/60">
                          {itemImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={itemImg}
                              alt={itemDisplayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ProductVisualPlaceholder
                              name={itemDisplayName}
                              className="w-full h-full"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-foreground truncate">
                            {itemDisplayName}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                            {itemCategoryName && <span>{itemCategoryName}</span>}
                            <span>•</span>
                            <span className="font-mono">
                              MRP: {formatCurrency(toNumber(itemProd?.mrp || 0))}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-neutral-900 text-white font-mono">
                          × {ci.quantity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description Section */}
          {displayDescription && (
            <div className="border-t border-neutral-100 pt-6 space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
                {locale === 'ta' ? 'விளக்கம்' : 'Description'}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {displayDescription}
              </p>
            </div>
          )}

          {/* Safety & Handling Notice */}
          <div className="rounded-[28px] sm:rounded-[32px] bg-white p-6 space-y-3 shadow-sm text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <AlertCircle className="h-4 w-4 text-neutral-900" />
              <span>{locale === 'ta' ? 'பாதுகாப்பு & பயன்பாட்டு விதிமுறைகள்' : 'Safety & Usage Instructions'}</span>
            </div>
            <ul className="space-y-1.5 pl-4 list-disc">
              <li>{locale === 'ta' ? 'திறந்தவெளியில் மட்டுமே பட்டாசுகளை வெடிக்க வேண்டும்.' : 'Use outdoors in open areas clear of dry grass or flammable objects.'}</li>
              <li>{locale === 'ta' ? 'அகர்பத்தி அல்லது நீளமான மத்தாப்பைப் பயன்படுத்தி பாதுகாப்பான இடைவெளியில் பற்றவைக்கவும்.' : "Light using an agarbatti or sparkler at arm's length."}</li>
              <li>{locale === 'ta' ? 'பெரியவர்கள் முன்னிலையில் மட்டுமே குழந்தைகளை பட்டாசு வெடிக்க அனுமதிக்கவும். அருகில் தண்ணீர் வாளி வைக்கவும்.' : 'Always ensure adult presence and keep a water bucket nearby.'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
