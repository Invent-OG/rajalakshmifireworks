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
  Search,
  Plus,
  Download,
  Gift,
  Target,
  UserCheck,
  Trophy,
  ChevronDown,
  Bell,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { toast } from 'sonner';
import { useAdminTheme } from '@/hooks/use-admin-theme';

interface NavItem {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  badge?: string | number;
}

const baseNavItems: NavItem[] = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/admin/products', icon: Package, label: 'Products' },
  { href: '/admin/customers', icon: Users, label: 'Customers' },
  { href: '/admin/delivery-partners', icon: Truck, label: 'Delivery' },
  { href: '/admin/inventory', icon: Warehouse, label: 'Inventory' },
  { href: '/admin/categories', icon: Tags, label: 'Category' },
  { href: '/admin/hero-slides', icon: Sparkles, label: 'Carousel' },
  { href: '/admin/reports', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/invoice-editor', icon: FileText, label: 'Invoice' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

const salesNavItems: NavItem[] = [
  { href: '/admin/sales/tracking', icon: Target, label: 'Agent Tracking' },
  { href: '/admin/sales/agents', icon: UserCheck, label: 'Agents' },
  { href: '/admin/sales/reports', icon: Trophy, label: 'Agent Reports' },
];

function NotificationBell({
  count,
  pendingOrders,
  lowStock,
}: {
  count: number;
  pendingOrders: number;
  lowStock: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-10 h-10 rounded-full bg-white dark:bg-[#161824] border border-neutral-200/80 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 relative shadow-xs hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
        title={count > 0 ? `Notifications (${count} unread)` : 'No new notifications'}
      >
        <Bell className="h-4.5 w-4.5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-[#EF4444] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white dark:border-[#161824] shadow-xs">
            {count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#161824] border border-neutral-200/80 dark:border-white/10 shadow-2xl p-3 z-50 space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-white/5 font-bold">
              <span className="text-neutral-900 dark:text-white">Store Notifications</span>
              <span className="text-[10px] font-semibold text-neutral-400">
                {count > 0 ? `${count} actionable` : 'Up to date'}
              </span>
            </div>

            {pendingOrders > 0 && (
              <Link
                href="/admin/orders?status=NEW"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-orange-500/10 text-[#e24000] flex items-center justify-center shrink-0">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {pendingOrders} New Order{pendingOrders === 1 ? '' : 's'}
                  </p>
                  <p className="text-[10px] text-neutral-400">Needs admin confirmation</p>
                </div>
                <span className="text-[10px] font-bold text-white bg-[#e24000] px-1.5 py-0.5 rounded-full">
                  {pendingOrders}
                </span>
              </Link>
            )}

            {lowStock > 0 && (
              <Link
                href="/admin/inventory"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <Warehouse className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {lowStock} Low Stock Product{lowStock === 1 ? '' : 's'}
                  </p>
                  <p className="text-[10px] text-neutral-400">Restock required</p>
                </div>
                <span className="text-[10px] font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded-full">
                  {lowStock}
                </span>
              </Link>
            )}

            {count === 0 && (
              <div className="py-4 text-center text-neutral-400 text-xs">
                All caught up! No pending alerts.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useAdminTheme();

  // Fetch live dashboard metrics to drive badges dynamically
  const { data: dashboardData } = useQuery({
    queryKey: queryKeys.admin.dashboard(),
    queryFn: async () => {
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60000,
    refetchInterval: 60000,
  });

  const dashboard = dashboardData?.dashboard;
  const pendingOrdersCount = Number(dashboard?.newOrders ?? 0);
  const lowStockCount = Number(dashboard?.lowStockProducts ?? 0);
  const totalNotifications = pendingOrdersCount + lowStockCount;

  const navItems = useMemo(() => {
    return baseNavItems.map((item) => {
      if (item.href === '/admin/orders') {
        return {
          ...item,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
        };
      }
      return item;
    });
  }, [pendingOrdersCount]);

  const allNavItems = useMemo(() => [...navItems, ...salesNavItems], [navItems]);

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

  // Derive human-readable page title
  const activeNavItem = allNavItems.find((item) =>
    item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
  );
  const pageTitle =
    pathname === '/admin/profile'
      ? 'Profile & Security'
      : activeNavItem?.label || 'Dashboard';

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden p-2.5 sm:p-4 flex flex-col font-sans text-neutral-900 dark:text-neutral-100 selection:text-white bg-[#F4F6FA] dark:bg-[#10121A] print:h-auto print:max-h-none print:min-h-0 print:overflow-visible print:bg-white print:p-0">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden print:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Unified Cockpit App Frame */}
      <div className="w-full max-w-[1720px] mx-auto gap-5 overflow-hidden bg-[#F4F6FA] dark:bg-[#10121A] flex flex-col lg:flex-row flex-1 min-h-[calc(100vh-2.5rem)] lg:h-[calc(100vh-2.5rem)] lg:max-h-[calc(100vh-2.5rem)] print:overflow-visible print:max-w-none print:h-auto print:max-h-none print:min-h-0 print:bg-white print:p-0 print:gap-0">
        {/* Left Dark Sidebar - Fixed to cockpit viewport so it never scrolls away */}
        <aside
          className={`
            fixed lg:static top-0 left-0 z-50 h-full lg:h-full w-68 bg-[#0D0E15] text-white
            flex flex-col justify-between shrink-0 p-5 lg:rounded-[32px] border-r border-white/5
            overflow-y-auto scrollbar-none transition-transform duration-200 shadow-2xl print:hidden invoice-no-print
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Top Brand Logo */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2 pt-1">
              <Link href="/admin" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#e24000] to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
                  <ShoppingCart className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-lg text-white tracking-tight leading-none">
                    Rajalakshmi
                  </span>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">
                    Fireworks Desk
                  </span>
                </div>
              </Link>

              <button
                className="lg:hidden p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 cursor-pointer"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close Sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Pill List */}
            <nav className="space-y-1.5 pt-2">
              {navItems.map((item) => {
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
                      group flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all
                      ${isActive
                        ? 'bg-[#e24000] text-white shadow-md shadow-[#e24000]/30 font-bold'
                        : 'text-[#82889A] hover:text-white hover:bg-white/5 font-medium'
                      }
                    `}
                  >
                    {/* Circular Icon Container matching the mockup design pattern */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${isActive
                        ? 'border-white/25 bg-white/15 text-white'
                        : 'border-neutral-800/90 bg-neutral-900/60 text-[#8E95A5] group-hover:border-neutral-700 group-hover:text-white'
                        }`}
                    >
                      <item.icon
                        className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-[#8E95A5] group-hover:text-white'
                          }`}
                      />
                    </div>

                    <span className="truncate">{item.label}</span>

                    {/* Notification Badge */}
                    {item.badge !== undefined && (
                      <span
                        className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${isActive
                          ? 'bg-white text-[#e24000]'
                          : 'bg-[#e24000] text-white shadow-xs'
                          }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Sales Management Section */}
              <div className="pt-4 pb-1.5 px-3">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#82889A]/80 select-none">
                  Sales Management
                </p>
              </div>

              {salesNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      group flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all
                      ${isActive
                        ? 'bg-[#e24000] text-white shadow-md shadow-[#e24000]/30 font-bold'
                        : 'text-[#82889A] hover:text-white hover:bg-white/5 font-medium'
                      }
                    `}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${isActive
                        ? 'border-white/25 bg-white/15 text-white'
                        : 'border-neutral-800/90 bg-neutral-900/60 text-[#8E95A5] group-hover:border-neutral-700 group-hover:text-white'
                        }`}
                    >
                      <item.icon
                        className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-[#8E95A5] group-hover:text-white'
                          }`}
                      />
                    </div>

                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Bottom Profile Card */}
          <div className="pt-6 relative">
            <div className="bg-[#161824] border border-white/5 rounded-2xl p-2.5 flex items-center justify-between gap-3 shadow-inner">
              <Link
                href="/admin/profile"
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 ring-2 ring-white/10 flex items-center justify-center font-bold text-xs text-white shrink-0">
                  AD
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white text-xs font-bold truncate leading-tight">
                    Admin Manager
                  </span>
                  <span className="text-[#7E8494] text-[10px] truncate mt-0.5">
                    Store Operations
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-[#7E8494] hover:text-white transition-colors cursor-pointer"
                title="Account Options"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Profile Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute bottom-16 left-0 right-0 p-2 rounded-2xl bg-[#1A1C28] border border-white/10 shadow-xl space-y-1 z-50 text-xs">
                <Link
                  href="/admin/profile"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full text-xs sm:text-sm font-semibold text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <UserCog className="h-4 w-4" />
                  <span>Profile & Security</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-full text-xs sm:text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Right Main Operations Workspace */}
        <div className="flex-1 flex flex-col min-w-0 lg:h-full lg:overflow-y-auto overflow-x-hidden dark:bg-[#0E1017] print:overflow-visible print:h-auto print:max-h-none print:bg-white print:p-0">
          {/* Top Header Bar */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 sticky py-5 top-0 z-20 bg-[#F4F6FA]/90 dark:bg-[#0E1017]/90 backdrop-blur-md print:hidden invoice-no-print">
            {/* Title & Mobile Hamburger */}
            <div className="flex items-center gap-3.5">
              <button
                className="lg:hidden w-10 h-10 rounded-full border border-neutral-300 dark:border-white/10 bg-white dark:bg-[#161824] text-neutral-800 dark:text-neutral-200 cursor-pointer shadow-xs flex items-center justify-center shrink-0"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                  {pageTitle}
                </h1>
              </div>
            </div>

            {/* Header Right Controls */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {pathname === '/admin/products' ? (
                <>
                  {/* Dynamic Notification Bell */}
                  <NotificationBell
                    count={totalNotifications}
                    pendingOrders={pendingOrdersCount}
                    lowStock={lowStockCount}
                  />

                  {/* Import Button */}
                  <Link
                    href="/admin/products/bulk-upload"
                    className="inline-flex items-center gap-1.5 h-10 px-4 py-2 rounded-full border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#161824] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-200 shadow-xs transition-colors shrink-0"
                  >
                    <Download className="h-4 w-4 text-neutral-400" />
                    <span>Import</span>
                  </Link>

                  {/* Add Product Button */}
                  <Link
                    href="/admin/products/new"
                    className="inline-flex items-center gap-1.5 h-10 px-4.5 sm:px-5 py-2 rounded-full bg-[#4F75FF] hover:bg-[#3D64F0] text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/25 transition-all shrink-0"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                    <span>Add Product</span>
                  </Link>
                </>
              ) : (
                <>
                  {/* Pill Search Input */}
                  <div className="relative hidden md:block">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search"
                      className="w-60 lg:w-72 h-10 pl-10 pr-4 bg-white dark:bg-[#161824] rounded-full border border-neutral-200/80 dark:border-white/10 text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#4F75FF]/30 transition-all shadow-xs"
                    />
                  </div>

                  {/* Dynamic Notification Bell */}
                  <NotificationBell
                    count={totalNotifications}
                    pendingOrders={pendingOrdersCount}
                    lowStock={lowStockCount}
                  />
                </>
              )}

              {/* Dark / Light Pill Switch */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full bg-white dark:bg-[#161824] border border-neutral-200/80 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 shadow-xs hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4.5 w-4.5 text-amber-400" />
                ) : (
                  <Moon className="h-4.5 w-4.5 text-indigo-500" />
                )}
              </button>

              {/* Storefront Link Pill */}
              <Link
                href="/"
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 h-10 px-4 py-2 rounded-full border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#161824] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 shadow-xs transition-colors shrink-0"
              >
                <span>Store</span>
                <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
              </Link>
            </div>
          </header>

          {/* Main Dashboard / Page Body */}
          <main className="flex-1  overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
