'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from '@/lib/navigation';
import { QuickCartWidget } from '@/components/store/quick-cart-widget';
import { useCart, useIsHydrated } from '@/hooks/use-cart';
import { ShoppingBag, ChevronUp, CreditCard } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { gsap, isReducedMotion } from '@/lib/motion';
import { Portal } from '@/components/ui/portal';
import NumberFlow from '@number-flow/react';
import Link from '@/components/ui/link';
import { useTranslations, useLocale } from '@/lib/i18n/context';

export function QuickCartSidebar({ locale }: { locale?: string } = {}) {
  return (
    <aside className="hidden xl:block w-80 shrink-0 sticky top-36 z-20 h-[calc(100vh-10rem)] max-h-[740px] min-h-[360px]">
      <QuickCartWidget locale={locale} className="h-full min-h-0" />
    </aside>
  );
}

export function QuickCartMobileFloating({
  pathname: propPathname,
  locale: propLocale,
}: {
  pathname?: string;
  locale?: string;
} = {}) {
  const hookPathname = usePathname();
  const contextLocale = useLocale();
  const locale = propLocale || contextLocale || 'en';
  const { itemCount, subtotal } = useCart();
  const isHydrated = useIsHydrated();
  const tCart = useTranslations('cart');
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const isClosingRef = useRef(false);

  const initialPath =
    propPathname ||
    (typeof window !== 'undefined' ? window.location.pathname : hookPathname) ||
    '/';
  const [currentPath, setCurrentPath] = useState(initialPath);

  useEffect(() => {
    if (propPathname) {
      setCurrentPath(propPathname);
    }
  }, [propPathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setCurrentPath(window.location.pathname);
    update();
    window.addEventListener('popstate', update);
    document.addEventListener('astro:page-load', update);
    document.addEventListener('astro:after-swap', update);
    return () => {
      window.removeEventListener('popstate', update);
      document.removeEventListener('astro:page-load', update);
      document.removeEventListener('astro:after-swap', update);
    };
  }, []);

  // Prevent background body scroll only while mobile drawer modal is actively open
  useEffect(() => {
    if (!isOpen) {
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('touch-action');
      document.documentElement.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('touch-action');
      return;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('touch-action');
      document.documentElement.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('touch-action');
    };
  }, [isOpen]);

  // Ensure body scroll is always restored on unmount or route change
  useEffect(() => {
    return () => {
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('touch-action');
      document.documentElement.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('touch-action');
    };
  }, []);

  useEffect(() => {
    if (isOpen || isRendered) {
      closeDrawer();
    }
  }, [currentPath, hookPathname]);

  // If all products are removed while the drawer is open, auto-close cleanly after a brief moment
  useEffect(() => {
    if (itemCount === 0 && isOpen && !isClosingRef.current) {
      const timer = setTimeout(() => {
        closeDrawer();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [itemCount, isOpen]);

  const openDrawer = () => {
    isClosingRef.current = false;
    setIsRendered(true);
    setIsOpen(true);
  };

  const closeDrawer = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsOpen(false);

    // Immediately stop intercepting touches so underlying page is interactive right away
    if (modalRef.current) {
      modalRef.current.style.pointerEvents = 'none';
    }
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('touch-action');
    document.documentElement.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('touch-action');

    const finishClosing = () => {
      setIsRendered(false);
      isClosingRef.current = false;
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('touch-action');
      document.documentElement.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('touch-action');
    };

    if (!drawerRef.current || !modalRef.current || isReducedMotion()) {
      finishClosing();
      return;
    }

    // Safety fallback timer ensuring modal unmounts even if GSAP tween is interrupted
    const safetyTimer = setTimeout(finishClosing, 300);

    gsap.killTweensOf([drawerRef.current, modalRef.current]);

    gsap.to(drawerRef.current, {
      y: '100%',
      duration: 0.22,
      ease: 'power2.in',
    });
    gsap.to(modalRef.current, {
      opacity: 0,
      duration: 0.22,
      ease: 'power2.in',
      onComplete: () => {
        clearTimeout(safetyTimer);
        finishClosing();
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

  // Normalize path removing locale prefix and trailing slashes for robust route matching
  const normalizePath = (p: string) => {
    if (!p) return '/';
    const clean = p.split('?')[0].split('#')[0];
    const withoutLocale = clean.replace(/^\/(?:en|ta)(?=\/|$)/, '') || '/';
    return withoutLocale.length > 1 && withoutLocale.endsWith('/')
      ? withoutLocale.slice(0, -1)
      : withoutLocale || '/';
  };

  const activePath = normalizePath(currentPath || hookPathname);
  const isHome = activePath === '/';
  const isCartOrCheckout = activePath === '/cart' || activePath === '/checkout';

  // Don't show floating checkout popup on Home, Cart or Checkout pages
  if (isHome || isCartOrCheckout) return null;
  if (!isHydrated) return null;

  // Don't render anything if cart is empty AND drawer is neither open nor closing
  if (itemCount === 0 && !isOpen && !isRendered) return null;

  return (
    <>
      {/* Mobile Floating Bottom Bar - Sticky at bottom only when items exist */}
      {itemCount > 0 && (
        <div className="xl:hidden fixed bottom-4 md:bottom-6 left-0 right-0 z-40 px-4 pointer-events-none transition-all duration-300">
          <div className="mx-auto max-w-md pointer-events-auto">
            <div
              ref={barRef}
              className="bg-white/95 dark:bg-[#141414]/95 backdrop-blur-xl text-neutral-900 dark:text-white rounded-full p-2.5 shadow-2xl dark:border dark:border-[#282828] flex items-center justify-between gap-3 transform-gpu font-sans"
            >
              <button
                type="button"
                onClick={openDrawer}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-[#202020] transition-colors text-left cursor-pointer flex-1 min-w-0"
              >
                <div className="relative h-9 w-9 rounded-full bg-neutral-100 dark:bg-[#202020] flex items-center justify-center shrink-0 text-neutral-950 dark:text-white">
                  <ShoppingBag className="h-4.5 w-4.5" />
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-neutral-950 dark:bg-white text-[10px] font-bold text-white dark:text-black flex items-center justify-center font-mono">
                    {itemCount}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight text-neutral-900 dark:text-white font-mono truncate">
                    <NumberFlow
                      value={subtotal}
                      format={{
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0,
                      }}
                      transformTiming={{
                        duration: 400,
                        easing: 'ease-out',
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-0.5">
                    {tCart('orderSummary')} <ChevronUp className="h-2.5 w-2.5" />
                  </p>
                </div>
              </button>

              <Link href={locale === 'en' ? '/checkout' : `/${locale}/checkout`} className="shrink-0">
                <button
                  type="button"
                  className="h-12 px-5 sm:px-6 rounded-full bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer justify-center"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>{tCart('proceedToCheckout')}</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Modal */}
      {isRendered && (
        <Portal>
          <div
            ref={modalRef}
            data-lenis-prevent
            className="xl:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs p-4 overscroll-contain"
          >
            <div
              className="fixed inset-0"
              onClick={closeDrawer}
              onTouchMove={(e) => e.preventDefault()}
              aria-hidden="true"
            />
            <div
              ref={drawerRef}
              data-lenis-prevent
              className="relative w-full max-w-md z-10 overscroll-contain"
            >
              <QuickCartWidget onClose={closeDrawer} />
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
