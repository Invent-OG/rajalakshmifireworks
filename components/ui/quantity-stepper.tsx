import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  quantity: number;
  maxStock: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function QuantityStepper({
  quantity,
  maxStock,
  onIncrement,
  onDecrement,
  size = 'md',
  className = '',
}: QuantityStepperProps) {
  const sizeStyles = {
    sm: {
      container: 'h-8 px-1 rounded-lg',
      button: 'h-6 w-6 text-xs rounded-md',
      text: 'text-xs w-6 font-medium',
      icon: 'h-3 w-3',
    },
    md: {
      container: 'h-9 px-1 rounded-xl',
      button: 'h-7 w-7 text-sm rounded-lg',
      text: 'text-sm w-7 font-semibold',
      icon: 'h-3.5 w-3.5',
    },
    lg: {
      container: 'h-11 px-1.5 rounded-xl',
      button: 'h-8 w-8 text-base rounded-lg',
      text: 'text-base w-8 font-semibold',
      icon: 'h-4 w-4',
    },
  };

  const style = sizeStyles[size];

  return (
    <div
      className={`inline-flex items-center justify-between bg-muted border border-border ${style.container} ${className}`}
    >
      <button
        type="button"
        onClick={onDecrement}
        className={`flex items-center justify-center bg-card text-foreground hover:bg-card-muted active:scale-95 transition-all shadow-xs cursor-pointer ${style.button}`}
        aria-label="Decrease quantity"
      >
        <Minus className={style.icon} />
      </button>

      <span className={`text-center select-none text-foreground ${style.text}`}>
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrement}
        disabled={quantity >= maxStock}
        className={`flex items-center justify-center bg-card text-foreground hover:bg-card-muted active:scale-95 transition-all shadow-xs disabled:opacity-30 disabled:pointer-events-none cursor-pointer ${style.button}`}
        aria-label="Increase quantity"
      >
        <Plus className={style.icon} />
      </button>
    </div>
  );
}
