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
  UserCog,
  LogOut,
  Sparkles,
  Menu,
  X,
  Warehouse,
  ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/ui/brand-logo';

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
    items: [
      { href: '/admin/profile', icon: UserCog, label: 'Profile & Security' },
      { href: '/admin/settings', icon: Settings, label: 'Settings' },
    ],
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
    toast.success('Signed out successfully');
    router.push('/admin/login');
  }

  return (
    <div className="min-h-screen bg-background-secondary flex">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Professional Operations Sidebar */}
      <aside
        className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border
        flex flex-col transition-transform duration-200 shadow-sm lg:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        {/* Brand Console Logo Header */}
        <div className="h-18 flex items-center justify-between px-4 border-b border-border shrink-0">
          <Link href="/admin" className="flex items-center gap-2 py-1">
            <BrandLogo className="h-11 w-auto" />
          </Link>

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
              <span className="px-3 text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block">
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
                      flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all
                      ${
                        isActive
                          ? 'bg-muted text-foreground font-semibold'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      }
                    `}
                  >
                    <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Profile & Logout Footer */}
        <div className="p-3 border-t border-border space-y-1">
          <Link
            href="/admin/profile"
            onClick={() => setSidebarOpen(false)}
            className={`
              flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium transition-colors
              ${
                pathname === '/admin/profile'
                  ? 'bg-muted text-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }
            `}
          >
            <UserCog className="h-4 w-4" />
            <span>Profile & Security</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-muted transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Operations Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-xl border border-border bg-card text-foreground"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
              Store Operations Desk
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/profile"
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors
                ${
                  pathname === '/admin/profile'
                    ? 'border-brand/40 bg-brand/10 text-brand'
                    : 'border-border bg-card hover:bg-muted text-foreground'
                }
              `}
            >
              <UserCog className="h-3.5 w-3.5" />
              <span>Profile</span>
            </Link>

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors"
            >
              <span>Storefront</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </Link>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
