'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Search, ShoppingBag, Truck } from 'lucide-react';
import { useCart, useIsHydrated } from '@/hooks/use-cart';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const isHydrated = useIsHydrated();

  const displayCount = isHydrated ? itemCount : 0;

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/products', icon: Sparkles, label: 'Products' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/track-order', icon: Truck, label: 'Track' },
    { href: '/cart', icon: ShoppingBag, label: 'Cart', badge: displayCount },
  ];

  // Don't show bottom nav on checkout to avoid distraction
  if (pathname === '/checkout') return null;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-xl border-t border-border/80 px-2 py-1.5 shadow-2xl"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1 px-3.5 rounded-full transition-all duration-200 ${
                isActive
                  ? 'text-primary font-semibold bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <item.icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0.5 h-1 w-4 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
