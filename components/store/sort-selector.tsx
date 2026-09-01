'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export function SortSelector({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      name="sort"
      value={current}
      aria-label="Sort products by"
      className="h-10 px-4 rounded-full border border-border bg-card text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer shadow-xs"
      onChange={(e) => handleSortChange(e.target.value)}
    >
      <option value="newest">Newest</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
      <option value="name_asc">Name: A-Z</option>
    </select>
  );
}
