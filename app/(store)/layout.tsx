'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Search, Sparkles, Truck, Phone, ShieldCheck, MapPin, MessageSquare } from 'lucide-react';
import { useCart, useIsHydrated } from '@/hooks/use-cart';
import { APP_CONFIG } from '@/lib/constants/config';
import { MobileBottomNav } from '@/components/store/mobile-bottom-nav';

function AnnouncementBar() {
  return (
    <div className="bg-foreground text-background text-xs py-2 px-4 text-center font-medium tracking-tight">
      <div className="mx-auto max-w-7xl flex items-center justify-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-brand" />
        <span>Direct from Sivakasi • 100% Genuine Factory Sealed Fireworks • Wholesale Pricing</span>
      </div>
    </div>
  );
}

function Header() {
  const { itemCount } = useCart();
  const pathname = usePathname();
  const isHydrated = useIsHydrated();

  const displayCount = isHydrated ? itemCount : 0;

  return (
    <header className="sticky top-0 z-40 premium-header transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-18 items-center justify-between gap-4 sm:gap-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="h-9 w-9 rounded-xl bg-foreground text-background flex items-center justify-center group-hover:bg-brand transition-colors">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="font-semibold text-base sm:text-lg tracking-tight text-foreground block leading-none">
                {APP_CONFIG.STORE_NAME}
              </span>
              <span className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground block mt-1">
                Sivakasi Fireworks
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <Link
              href="/"
              className={`transition-colors hover:text-foreground ${
                pathname === '/' ? 'text-foreground font-semibold' : 'text-muted-foreground'
              }`}
            >
              Home
            </Link>
            <Link
              href="/products"
              className={`transition-colors hover:text-foreground ${
                pathname.startsWith('/products') || pathname.startsWith('/category')
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground'
              }`}
            >
              Catalog
            </Link>
            <Link
              href="/products?featured=true"
              className={`transition-colors hover:text-foreground ${
                pathname.includes('featured=true') ? 'text-foreground font-semibold' : 'text-muted-foreground'
              }`}
            >
              Gift Boxes
            </Link>
            <Link
              href="/track-order"
              className={`transition-colors hover:text-foreground ${
                pathname === '/track-order' ? 'text-foreground font-semibold' : 'text-muted-foreground'
              }`}
            >
              Track Order
            </Link>
          </nav>

          {/* Search & Cart Actions */}
          <div className="flex items-center gap-3">
            {/* Desktop Search Trigger */}
            <Link
              href="/search"
              className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium border border-border transition-all w-44 lg:w-56"
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>Search fireworks...</span>
            </Link>

            {/* Mobile Search Icon */}
            <Link
              href="/search"
              className="sm:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-muted/60 text-foreground hover:bg-muted transition-colors border border-border"
              aria-label="Search"
            >
              <Search className="h-4.5 w-4.5" />
            </Link>

            {/* Shopping Bag CTA */}
            <Link
              href="/cart"
              className="relative h-10 sm:h-11 px-4 flex items-center gap-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary-hover active:scale-95 transition-all text-xs sm:text-sm"
              aria-label={`Shopping Bag with ${displayCount} items`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Bag</span>
              {displayCount > 0 && (
                <span className="h-5 min-w-5 px-1.5 rounded-full bg-brand text-white text-[11px] font-bold flex items-center justify-center">
                  {displayCount > 99 ? '99+' : displayCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto pb-16 md:pb-0 text-xs">
      {/* Trust Highlights */}
      <div className="border-b border-border bg-background-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-card text-foreground flex items-center justify-center shrink-0 border border-border shadow-xs">
                <ShieldCheck className="h-5 w-5 text-brand" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">100% Authentic Fireworks</h4>
                <p className="text-muted-foreground mt-0.5">Manufactured and tested directly in Sivakasi</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-card text-foreground flex items-center justify-center shrink-0 border border-border shadow-xs">
                <Truck className="h-5 w-5 text-brand" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Flexible Fulfillment</h4>
                <p className="text-muted-foreground mt-0.5">Doorstep delivery or direct warehouse pickup</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-card text-foreground flex items-center justify-center shrink-0 border border-border shadow-xs">
                <MessageSquare className="h-5 w-5 text-brand" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Instant WhatsApp Confirmation</h4>
                <p className="text-muted-foreground mt-0.5">Direct dispatch updates and invoice verification</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-foreground text-background flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold text-sm text-foreground">{APP_CONFIG.STORE_NAME}</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Premium quality Sivakasi fireworks and celebration gift boxes. Safety tested and certified for family celebrations.
            </p>
          </div>

          <div>
            <h3 className="font-semibold uppercase tracking-wider text-foreground mb-3 text-[11px]">
              Collections
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/products" className="hover:text-foreground transition-colors">All Fireworks</Link></li>
              <li><Link href="/products?featured=true" className="hover:text-foreground transition-colors">Gift Combos & Packs</Link></li>
              <li><Link href="/products?bestseller=true" className="hover:text-foreground transition-colors">Festive Bestsellers</Link></li>
              <li><Link href="/track-order" className="hover:text-foreground transition-colors">Track Consignment</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold uppercase tracking-wider text-foreground mb-3 text-[11px]">
              Safety Guidelines
            </h3>
            <ul className="space-y-1.5 text-muted-foreground leading-relaxed">
              <li>Always burst fireworks in open outdoor spaces.</li>
              <li>Maintain safe viewing distance for children.</li>
              <li>Keep a bucket of water or sand nearby.</li>
              <li>Store unlit boxes in cool, dry conditions.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold uppercase tracking-wider text-foreground mb-3 text-[11px]">
              Contact & Store
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {APP_CONFIG.STORE_PHONE}</li>
              <li className="flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5 text-muted-foreground" /> WhatsApp: +{APP_CONFIG.WHATSAPP_NUMBER}</li>
              <li className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" /> {APP_CONFIG.STORE_ADDRESS}</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-muted-foreground">
          <p>© {new Date().getFullYear()} {APP_CONFIG.STORE_NAME}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/track-order" className="hover:text-foreground">Order Tracking</Link>
            <Link href="/products" className="hover:text-foreground">Catalog</Link>
            <Link href="/admin/login" className="hover:text-foreground">Staff Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-1 pb-12">{children}</main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}
