import { formatCurrency } from '@/lib/utils/format';

interface PriceDisplayProps {
  sellingPrice: number;
  mrp: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSavings?: boolean;
  className?: string;
}

export function PriceDisplay({
  sellingPrice,
  mrp,
  size = 'md',
  showSavings = true,
  className = '',
}: PriceDisplayProps) {
  const discount = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  const savings = mrp - sellingPrice;

  const sizeStyles = {
    sm: {
      price: 'text-sm font-bold',
      mrp: 'text-xs text-muted-foreground line-through',
      discount: 'text-[10px] px-1.5 py-0.2',
      savings: 'text-[11px]',
    },
    md: {
      price: 'text-base sm:text-lg font-bold',
      mrp: 'text-xs sm:text-sm text-muted-foreground line-through',
      discount: 'text-xs px-2 py-0.5',
      savings: 'text-xs',
    },
    lg: {
      price: 'text-xl sm:text-2xl font-bold tracking-tight',
      mrp: 'text-sm sm:text-base text-muted-foreground line-through',
      discount: 'text-xs font-bold px-2.5 py-0.5',
      savings: 'text-sm',
    },
    xl: {
      price: 'text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight',
      mrp: 'text-base sm:text-lg text-muted-foreground line-through',
      discount: 'text-xs sm:text-sm font-bold px-3 py-1',
      savings: 'text-sm font-medium',
    },
  };

  const current = sizeStyles[size];

  return (
    <div className={`space-y-0.5 ${className}`}>
      <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
        <span className={`text-foreground font-sans ${current.price}`}>
          {formatCurrency(sellingPrice)}
        </span>
        {discount > 0 && (
          <span className={`font-normal ${current.mrp}`}>
            {formatCurrency(mrp)}
          </span>
        )}
        {discount > 0 && (
          <span className={`bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold rounded-md border border-amber-500/20 ${current.discount}`}>
            {discount}% OFF
          </span>
        )}
      </div>
      {showSavings && savings > 0 && (
        <p className={`text-emerald-600 dark:text-emerald-400 font-medium ${current.savings}`}>
          Save {formatCurrency(savings)}
        </p>
      )}
    </div>
  );
}
