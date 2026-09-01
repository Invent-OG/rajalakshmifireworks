'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Search, Sparkles, Truck, Phone, ShieldCheck } from 'lucide-react';
import { useCart, useIsHydrated } from '@/hooks/use-cart';
import { APP_CONFIG } from '@/lib/constants/config';
import { MobileBottomNav } from '@/components/store/mobile-bottom-nav';

function AnnouncementBar() {
  return (
    <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-white text-xs py-2 px-4 text-center font-medium shadow-xs">
      <div className="mx-auto max-w-7xl flex items-center justify-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-amber-200 shrink-0" />
        <span>Direct from Sivakasi • 100% Factory Sealed Genuine Crackers • Best Wholesale Prices</span>
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
    <header className="sticky top-0 z-40 glass-header border-b border-border/80 transition-all bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-18 items-center justify-between gap-4 sm:gap-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-foreground block leading-tight">
                {APP_CONFIG.STORE_NAME}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-orange-600 block">
                Sivakasi Fireworks
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link
              href="/"
              className={`transition-colors hover:text-primary ${
                pathname === '/' ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}
            >
              Home
            </Link>
            <Link
              href="/products"
              className={`transition-colors hover:text-primary ${
                pathname.startsWith('/products') || pathname.startsWith('/category')
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground'
              }`}
            >
              All Fireworks
            </Link>
            <Link
              href="/products?featured=true"
              className={`transition-colors hover:text-primary ${
                pathname.includes('featured=true') ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}
            >
              Combos & Boxes
            </Link>
            <Link
              href="/track-order"
              className={`transition-colors hover:text-primary ${
                pathname === '/track-order' ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}
            >
              Track Order
            </Link>
          </nav>

          {/* Search Trigger & Cart Action */}
          <div className="flex items-center gap-3">
            {/* Desktop Search Trigger */}
            <Link
              href="/search"
              className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-full bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium border border-border/80 transition-all w-48 lg:w-64 shadow-xs"
            >
              <Search className="h-4 w-4 shrink-0 text-primary" />
              <span>Search crackers...</span>
            </Link>

            {/* Mobile Search Icon */}
            <Link
              href="/search"
              className="sm:hidden h-10 w-10 flex items-center justify-center rounded-full bg-muted/60 text-foreground hover:bg-muted transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Link>

            {/* Shopping Bag Button */}
            <Link
              href="/cart"
              className="relative h-10 sm:h-11 px-4 sm:px-5 flex items-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary-hover active:scale-95 transition-all shadow-md shadow-primary/20"
              aria-label={`Shopping Bag with ${displayCount} items`}
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              <span className="hidden sm:inline text-sm">Cart</span>
              {displayCount > 0 && (
                <span className="h-5 min-w-5 px-1.5 rounded-full bg-white text-primary text-xs font-black flex items-center justify-center shadow-xs">
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
    <footer className="border-t border-border bg-card mt-auto pb-16 md:pb-0">
      {/* Sivakasi Trust Banner */}
      <div className="border-b border-border/60 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 border border-orange-500/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">100% Authentic Quality</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Direct Sivakasi factory manufacturing</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 border border-orange-500/20">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">Fast Dispatch & Pickup</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Home delivery & direct counter pickup</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">WhatsApp Instant Order</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Quick confirmation & status updates</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-bold text-base text-foreground">{APP_CONFIG.STORE_NAME}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              India&apos;s trusted Sivakasi fireworks source. Bringing authentic festive sparkle and joy to celebrations with safety certified crackers.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-foreground mb-3">
              Explore Collections
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/products" className="hover:text-primary transition-colors">All Fireworks</Link></li>
              <li><Link href="/products?featured=true" className="hover:text-primary transition-colors">Featured Gift Boxes</Link></li>
              <li><Link href="/products?bestseller=true" className="hover:text-primary transition-colors">Festive Bestsellers</Link></li>
              <li><Link href="/track-order" className="hover:text-primary transition-colors">Track Your Consignment</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-foreground mb-3">
              Safety Guidelines
            </h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
              <li>• Always burst crackers under adult supervision.</li>
              <li>• Maintain a safe distance of 5 meters.</li>
              <li>• Keep a bucket of water or sand nearby.</li>
              <li>• Store unused fireworks in a cool, dry place.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-foreground mb-3">
              Store & Support
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>📞 {APP_CONFIG.STORE_PHONE}</li>
              <li>💬 WhatsApp: +{APP_CONFIG.WHATSAPP_NUMBER}</li>
              <li>📍 {APP_CONFIG.STORE_ADDRESS}</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {APP_CONFIG.STORE_NAME}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/track-order" className="hover:text-foreground">Order Status</Link>
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
