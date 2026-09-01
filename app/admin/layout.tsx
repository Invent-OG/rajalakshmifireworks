'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X,
  Warehouse,
  ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
    group: 'CUSTOMERS',
    items: [{ href: '/admin/customers', icon: Users, label: 'Customers' }],
  },
  {
    group: 'ANALYTICS',
    items: [{ href: '/admin/reports', icon: BarChart3, label: 'Reports' }],
  },
  {
    group: 'SYSTEM',
    items: [{ href: '/admin/settings', icon: Settings, label: 'Settings' }],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    toast.success('Logged out successfully');
    router.push('/admin/login');
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modern Operations Sidebar */}
      <aside
        className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border/80
        flex flex-col transition-transform duration-300 shadow-xl lg:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        {/* Brand Console Logo Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-foreground block leading-none">
                Operations Desk
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold text-orange-600">
                Rajalakshmi
              </span>
            </div>
          </div>

          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close Sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <span className="px-3 text-[10px] uppercase font-extrabold tracking-widest text-muted-foreground/80 block">
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
                      flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all
                      ${
                        isActive
                          ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout Footer */}
        <div className="p-3 border-t border-border/80">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Operations Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-border/80 bg-card/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-full border border-border bg-card text-foreground"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground hidden sm:inline">
              Store Administration
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-xs"
            >
              <span>Storefront</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
