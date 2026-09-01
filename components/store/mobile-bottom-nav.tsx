'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Search, ShoppingBag, Truck } from 'lucide-react';
import { useCart, useIsHydrated } from '@/hooks/use-cart';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const isHydrated = useIsHydrated();

  const displayCount = isHydrated ? itemCount : 0;

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/products', icon: LayoutGrid, label: 'Catalog' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/track-order', icon: Truck, label: 'Track' },
    { href: '/cart', icon: ShoppingBag, label: 'Bag', badge: displayCount },
  ];

  // Don't show bottom nav on checkout to avoid distraction
  if (pathname === '/checkout') return null;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border px-2 py-1.5 shadow-sm"
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
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <item.icon className={`h-5 w-5 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} />
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2.5 h-4 min-w-4 px-1 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 h-0.5 w-4 bg-brand rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
