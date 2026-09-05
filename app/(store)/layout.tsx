'use client';

import Link from 'next/link';
import { Truck, Phone, ShieldCheck, MapPin, MessageSquare } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants/config';
import { MobileBottomNav } from '@/components/store/mobile-bottom-nav';
import { QuickCartMobileFloating } from '@/components/store/quick-cart-drawer';
import { BrandLogo } from '@/components/ui/brand-logo';
import { StoreBanner } from '@/components/store/store-banner';
import { FloatingNavbar } from '@/components/store/floating-navbar';

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
              <BrandLogo className="h-14 sm:h-16 w-auto" />
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
      <StoreBanner />
      <FloatingNavbar />
      <main className="flex-1 pb-24 md:pb-12">{children}</main>
      <Footer />
      <QuickCartMobileFloating />
      <MobileBottomNav />
    </>
  );
}
