export type BadgeVariant =
  | 'default'
  | 'brand'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-muted text-muted-foreground border-border',
  brand:
    'bg-brand-light text-brand border-brand-border',
  success:
    'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning:
    'bg-amber-50 text-amber-900 border-amber-200',
  error:
    'bg-rose-50 text-rose-800 border-rose-200',
  info:
    'bg-sky-50 text-sky-800 border-sky-200',
  outline:
    'border-border text-foreground bg-transparent',
};

const dotClasses: Record<BadgeVariant, string> = {
  default: 'bg-muted-foreground',
  brand: 'bg-brand',
  success: 'bg-emerald-600',
  warning: 'bg-amber-600',
  error: 'bg-rose-600',
  info: 'bg-sky-600',
  outline: 'bg-foreground',
};

export function Badge({
  variant = 'default',
  dot = false,
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
        border transition-colors tracking-normal
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[variant]}`} />}
      {children}
    </span>
  );
}

export function StatusBadge({
  status,
  className = '',
}: {
  status: string;
  className?: string;
}) {
  const variantMap: Record<string, BadgeVariant> = {
    PENDING: 'warning',
    CONFIRMED: 'info',
    PROCESSING: 'brand',
    READY: 'info',
    READY_FOR_PICKUP: 'info',
    OUT_FOR_DELIVERY: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'error',
    IN_STOCK: 'success',
    LOW_STOCK: 'warning',
    OUT_OF_STOCK: 'error',
  };

  const labels: Record<string, string> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    READY: 'Ready',
    READY_FOR_PICKUP: 'Ready for Pickup',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    IN_STOCK: 'In Stock',
    LOW_STOCK: 'Low Stock',
    OUT_OF_STOCK: 'Out of Stock',
  };

  const variant = variantMap[status] || 'default';

  return (
    <Badge variant={variant} dot className={className}>
      {labels[status] || status.replace(/_/g, ' ')}
    </Badge>
  );
}
