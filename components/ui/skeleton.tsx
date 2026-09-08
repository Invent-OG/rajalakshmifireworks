export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-xl ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-[36px] sm:rounded-[40px] overflow-hidden p-4 sm:p-5 space-y-4 shadow-sm">
      <Skeleton className="aspect-[4/3] w-full rounded-[26px] sm:rounded-[30px]" />
      <div className="space-y-2 pt-1">
        <Skeleton className="h-3 w-1/3 rounded-full" />
        <Skeleton className="h-4 w-3/4 rounded-full" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-[48px] w-full rounded-full mt-2" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 rounded-xl bg-card border border-border">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
