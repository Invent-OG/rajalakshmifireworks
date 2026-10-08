'use client';

import Link from '@/components/ui/link';
import { usePathname, useRouter } from '@/lib/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Users,
  BarChart3,
  Settings,
  UserCog,
  LogOut,
  Sparkles,
  Menu,
  X,
  Warehouse,
  ExternalLink,
  Truck,
  Sun,
  Moon,
  FileText,
} from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/ui/brand-logo';
import { useAdminTheme } from '@/hooks/use-admin-theme';

const navGroups = [
  {
    group: 'OVERVIEW',
    items: [{ href: '/admin', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    group: 'COMMERCE',
    items: [
      { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
      { href: '/admin/products', icon: Package, label: 'Products' },
      { href: '/admin/categories', icon: Tags, label: 'Categories' },
      { href: '/admin/inventory', icon: Warehouse, label: 'Inventory' },
    ],
  },
  {
    group: 'FULFILLMENT',
    items: [
      { href: '/admin/delivery-partners', icon: Truck, label: 'Delivery Partners' },
    ],
  },
  {
    group: 'CONTENT',
    items: [
      { href: '/admin/hero-slides', icon: Sparkles, label: 'Hero Carousel' },
    ],
  },
  {
    group: 'CUSTOMERS',
    items: [{ href: '/admin/customers', icon: Users, label: 'Customers' }],
  },
  {
    group: 'ANALYTICS',
    items: [{ href: '/admin/reports', icon: BarChart3, label: 'Reports' }],
  },
  {
    group: 'SYSTEM',
    items: [
      { href: '/admin/invoice-editor', icon: FileText, label: 'Invoice Editor' },
      { href: '/admin/profile', icon: UserCog, label: 'Profile & Security' },
      { href: '/admin/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme, toggleTheme } = useAdminTheme();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const queryClient = useQueryClient();
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/auth/logout', { method: 'POST' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.clear();
      toast.success('Signed out successfully');
      router.push('/admin/login');
    },
    onError: () => {
      router.push('/admin/login');
    },
  });

  function handleLogout() {
    logoutMutation.mutate();
  }

  return (
    <div className="min-h-screen bg-background-secondary flex selection:bg-brand selection:text-brand-foreground">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Professional Operations Sidebar */}
      <aside
        className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-80 bg-card border-r border-border
        flex flex-col transition-transform duration-200 shadow-sm lg:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        {/* Brand Console Logo Header */}
        <div className="h-22 flex items-center justify-between px-6 border-b border-border shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5 py-1">
            <BrandLogo className="h-14 w-auto" />
          </Link>

          <button
            className="lg:hidden p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close Sidebar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-7">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-2">
              <span className="px-4 py-1.5 text-xs uppercase font-bold tracking-wider text-muted-foreground/80 block">
                {group.group}
              </span>
              {group.items.map((item) => {
                const isActive =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[15px] sm:text-base font-semibold transition-all
                      ${
                        isActive
                          ? 'bg-secondary text-foreground shadow-xs font-bold border border-border/80'
                          : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                      }
                    `}
                  >
                    <item.icon
                      className={`h-5.5 w-5.5 shrink-0 transition-colors ${
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <span className="ml-auto h-2.5 w-2.5 rounded-full bg-brand shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Bottom Controls: Theme, Profile, Sign Out */}
        <div className="p-4 border-t border-border space-y-2 bg-card shrink-0">
          {/* Quick Theme Switch in Sidebar */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-4 py-3 rounded-2xl text-[15px] sm:text-base font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            <div className="flex items-center gap-3.5">
              {theme === 'dark' ? (
                <Moon className="h-5.5 w-5.5 text-indigo-400 shrink-0" />
              ) : (
                <Sun className="h-5.5 w-5.5 text-amber-500 shrink-0" />
              )}
              <span>Theme Appearance</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-secondary text-foreground border border-border">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>

          <Link
            href="/admin/profile"
            onClick={() => setSidebarOpen(false)}
            className={`
              flex items-center gap-3.5 w-full px-4 py-3 rounded-2xl text-[15px] sm:text-base font-semibold transition-colors
              ${
                pathname === '/admin/profile'
                  ? 'bg-secondary text-foreground font-bold shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
              }
            `}
          >
            <UserCog className="h-5.5 w-5.5 shrink-0" />
            <span>Profile & Security</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 w-full px-4 py-3 rounded-2xl text-[15px] sm:text-base font-semibold text-muted-foreground hover:text-destructive hover:bg-secondary/70 transition-colors cursor-pointer"
          >
            <LogOut className="h-5.5 w-5.5 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Operations Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-20 border-b border-border bg-card/90 backdrop-blur-md flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-3 rounded-2xl border border-border bg-card text-foreground hover:bg-muted cursor-pointer"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="text-base sm:text-lg font-bold text-foreground">
                Store Operations Desk
              </span>
              <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-brand/10 text-brand border border-brand/20">
                Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Prominent Dark/Light Segmented Mode Switcher */}
            <div className="flex items-center p-1.5 rounded-2xl bg-secondary/80 border border-border shadow-xs">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-card text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-pressed={theme === 'light'}
                title="Switch to Light Mode"
              >
                <Sun className={`h-4.5 w-4.5 ${theme === 'light' ? 'text-amber-500' : 'text-muted-foreground'}`} />
                <span className="hidden sm:inline">Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-card text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-pressed={theme === 'dark'}
                title="Switch to Dark Mode"
              >
                <Moon className={`h-4.5 w-4.5 ${theme === 'dark' ? 'text-indigo-400' : 'text-muted-foreground'}`} />
                <span className="hidden sm:inline">Dark</span>
              </button>
            </div>

            <Link
              href="/admin/profile"
              className={`
                inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm sm:text-base font-semibold transition-colors
                ${
                  pathname === '/admin/profile'
                    ? 'border-brand/40 bg-brand/10 text-brand'
                    : 'border-border bg-card hover:bg-secondary text-foreground'
                }
              `}
            >
              <UserCog className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">Profile</span>
            </Link>

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-2xl border border-border bg-card hover:bg-secondary text-sm sm:text-base font-semibold text-foreground transition-colors"
            >
              <span>Storefront</span>
              <ExternalLink className="h-4.5 w-4.5 text-muted-foreground" />
            </Link>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
