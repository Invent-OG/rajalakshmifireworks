// Centralized TanStack Query key factory
// Consistent key structure prevents cache invalidation bugs

export const queryKeys = {
  // Store-side
  products: {
    all: ['products'] as const,
    list: (filters?: Record<string, unknown>) => ['products', 'list', filters] as const,
    detail: (slug: string) => ['products', 'detail', slug] as const,
    featured: () => ['products', 'featured'] as const,
    bestsellers: () => ['products', 'bestsellers'] as const,
    search: (query: string) => ['products', 'search', query] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: () => ['categories', 'list'] as const,
    detail: (slug: string) => ['categories', 'detail', slug] as const,
  },
  orders: {
    track: (mobile: string, invoice?: string) => ['orders', 'track', mobile, invoice] as const,
  },
  settings: {
    all: ['settings'] as const,
  },

  // Admin-side
  admin: {
    dashboard: () => ['admin', 'dashboard'] as const,
    orders: {
      all: ['admin', 'orders'] as const,
      list: (filters?: Record<string, unknown>) => ['admin', 'orders', 'list', filters] as const,
      detail: (id: number) => ['admin', 'orders', 'detail', id] as const,
    },
    products: {
      all: ['admin', 'products'] as const,
      list: (filters?: Record<string, unknown>) => ['admin', 'products', 'list', filters] as const,
      detail: (id: number) => ['admin', 'products', 'detail', id] as const,
    },
    categories: {
      all: ['admin', 'categories'] as const,
      list: () => ['admin', 'categories', 'list'] as const,
    },
    customers: {
      all: ['admin', 'customers'] as const,
      list: (filters?: Record<string, unknown>) => ['admin', 'customers', 'list', filters] as const,
      detail: (id: number) => ['admin', 'customers', 'detail', id] as const,
    },
    inventory: {
      all: ['admin', 'inventory'] as const,
      list: (filters?: Record<string, unknown>) => ['admin', 'inventory', 'list', filters] as const,
      history: (productId: number) => ['admin', 'inventory', 'history', productId] as const,
    },
    reports: {
      all: ['admin', 'reports'] as const,
      sales: (dateRange?: Record<string, unknown>) => ['admin', 'reports', 'sales', dateRange] as const,
    },
    settings: {
      all: ['admin', 'settings'] as const,
    },
    auth: {
      me: ['admin', 'auth', 'me'] as const,
    },
  },
};
