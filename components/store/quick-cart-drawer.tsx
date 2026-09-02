'use client';

import { useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { QuickCartWidget } from '@/components/store/quick-cart-widget';
import { useCart, useIsHydrated } from '@/hooks/use-cart';
import { ShoppingBag, ChevronUp, CreditCard } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { gsap, isReducedMotion } from '@/lib/motion';
import { StoreButton } from '@/components/ui/store-button';
import { Portal } from '@/components/ui/portal';
import NumberFlow from '@number-flow/react';
import Link from 'next/link';

export function QuickCartSidebar() {
  return (
    <aside className="hidden xl:block w-80 shrink-0 sticky top-24 z-20">
      <QuickCartWidget />
    </aside>
  );
}

export function QuickCartMobileFloating() {
  const pathname = usePathname();
  const { itemCount, subtotal } = useCart();
  const isHydrated = useIsHydrated();
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const openDrawer = () => {
    setIsRendered(true);
    setIsOpen(true);
  };

  const closeDrawer = () => {
    if (!drawerRef.current || !modalRef.current || isReducedMotion()) {
      setIsOpen(false);
      setIsRendered(false);
      return;
    }

    gsap.to(drawerRef.current, {
      y: '100%',
      duration: 0.25,
      ease: 'power2.in',
    });
    gsap.to(modalRef.current, {
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        setIsOpen(false);
        setIsRendered(false);
      },
    });
  };

  // GSAP Drawer Open Animation
  useGSAP(
    () => {
      if (!isOpen || !drawerRef.current || !modalRef.current || isReducedMotion()) return;

      gsap.fromTo(
        modalRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power2.out' }
      );

      gsap.fromTo(
        drawerRef.current,
        { y: '100%', scale: 0.95 },
        { y: '0%', scale: 1, duration: 0.35, ease: 'back.out(1.2)' }
      );
    },
    { dependencies: [isOpen] }
  );

  // GSAP Floating Bar entrance
  useGSAP(
    () => {
      if (!barRef.current || isReducedMotion()) return;
      gsap.fromTo(
        barRef.current,
        { y: 24, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.4)' }
      );
    },
    { dependencies: [itemCount > 0] }
  );

  // Don't show floating cart on Cart or Checkout pages, or when cart is empty
  if (pathname === '/cart' || pathname === '/checkout') return null;
  if (!isHydrated || itemCount === 0) return null;

  return (
    <>
      {/* Mobile Floating Bottom Bar - Sticky above mobile nav or viewport bottom */}
      <div className="xl:hidden fixed bottom-16 md:bottom-6 left-0 right-0 z-40 px-4 pointer-events-none transition-all">
        <div className="mx-auto max-w-md pointer-events-auto">
          <div
            ref={barRef}
            className="bg-card/95 backdrop-blur-xl text-foreground border border-border rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-3 transform-gpu"
          >
            <button
              type="button"
              onClick={openDrawer}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-muted transition-colors text-left cursor-pointer flex-1 min-w-0"
            >
              <div className="relative h-9 w-9 rounded-xl bg-brand-light border border-brand-border flex items-center justify-center shrink-0">
                <ShoppingBag className="h-4.5 w-4.5 text-brand" />
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-brand text-[10px] font-bold text-white flex items-center justify-center font-mono">
                  {itemCount}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight text-foreground font-mono truncate">
                  <NumberFlow
                    value={subtotal}
                    format={{
                      style: 'currency',
                      currency: 'INR',
                      trailingZeroDisplay: 'stripIfInteger',
                    }}
                    transformTiming={{
                      duration: 400,
                      easing: 'ease-out',
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-0.5">
                  View Items <ChevronUp className="h-2.5 w-2.5" />
                </p>
              </div>
            </button>

            <Link href="/checkout" className="shrink-0">
              <StoreButton
                size="sm"
                variant="primary"
                icon={<CreditCard className="h-3.5 w-3.5" />}
              >
                Checkout
              </StoreButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Modal */}
      {isRendered && (
        <Portal>
          <div
            ref={modalRef}
            className="xl:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs p-4"
          >
            <div
              className="fixed inset-0"
              onClick={closeDrawer}
              aria-hidden="true"
            />
            <div ref={drawerRef} className="relative w-full max-w-md z-10">
              <QuickCartWidget onClose={closeDrawer} />
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
