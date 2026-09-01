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
  showSavings = false,
  className = '',
}: PriceDisplayProps) {
  const discount = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  const savings = mrp - sellingPrice;

  const sizeStyles = {
    sm: {
      price: 'text-sm font-semibold',
      mrp: 'text-xs text-muted-foreground line-through',
      discount: 'text-[10px] px-1.5 py-0.5 font-medium',
      savings: 'text-[11px]',
    },
    md: {
      price: 'text-base font-semibold',
      mrp: 'text-xs sm:text-sm text-muted-foreground line-through',
      discount: 'text-xs px-2 py-0.5 font-medium',
      savings: 'text-xs',
    },
    lg: {
      price: 'text-xl sm:text-2xl font-bold tracking-tight',
      mrp: 'text-sm sm:text-base text-muted-foreground line-through',
      discount: 'text-xs font-semibold px-2 py-0.5',
      savings: 'text-xs sm:text-sm',
    },
    xl: {
      price: 'text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight',
      mrp: 'text-base sm:text-lg text-muted-foreground line-through',
      discount: 'text-xs sm:text-sm font-semibold px-2.5 py-1',
      savings: 'text-sm font-medium',
    },
  };

  const current = sizeStyles[size];

  return (
    <div className={`space-y-0.5 ${className}`}>
      <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
        <span className={`text-foreground font-sans tracking-tight ${current.price}`}>
          {formatCurrency(sellingPrice)}
        </span>
        {discount > 0 && (
          <span className={`font-normal ${current.mrp}`}>
            {formatCurrency(mrp)}
          </span>
        )}
        {discount > 0 && (
          <span className={`bg-amber-50 text-amber-900 border border-amber-200/80 rounded-md ${current.discount}`}>
            {discount}% off
          </span>
        )}
      </div>
      {showSavings && savings > 0 && (
        <p className={`text-emerald-700 font-medium ${current.savings}`}>
          Save {formatCurrency(savings)}
        </p>
      )}
    </div>
  );
}
