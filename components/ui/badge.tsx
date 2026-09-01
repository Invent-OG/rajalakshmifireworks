export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'gold'
  | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-muted text-muted-foreground border-border/60',
  primary:
    'bg-primary/10 text-primary border-primary/20',
  gold:
    'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  success:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  warning:
    'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/25',
  error:
    'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
  info:
    'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
  outline:
    'border-border text-foreground bg-transparent',
};

const dotClasses: Record<BadgeVariant, string> = {
  default: 'bg-muted-foreground',
  primary: 'bg-primary',
  gold: 'bg-amber-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-rose-500',
  info: 'bg-sky-500',
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
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold
        border transition-colors tracking-wide
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
    PROCESSING: 'gold',
    READY: 'primary',
    READY_FOR_PICKUP: 'primary',
    OUT_FOR_DELIVERY: 'gold',
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
