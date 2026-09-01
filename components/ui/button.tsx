import { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'gold';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground font-semibold hover:bg-primary-hover active:scale-[0.98] btn-primary-glow border border-primary/20',
  secondary:
    'bg-secondary text-secondary-foreground font-medium hover:opacity-90 active:scale-[0.98] shadow-sm',
  gold:
    'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/20 active:scale-[0.98]',
  outline:
    'border border-border bg-card text-foreground font-medium hover:bg-muted hover:border-border/80 active:scale-[0.98]',
  ghost:
    'text-muted-foreground hover:text-foreground hover:bg-muted active:scale-[0.98]',
  destructive:
    'bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 active:scale-[0.98] shadow-sm',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-4 text-xs rounded-full gap-1.5',
  md: 'h-10 px-5 text-sm rounded-full gap-2',
  lg: 'h-12 px-7 text-base rounded-full gap-2.5 font-semibold',
  icon: 'h-10 w-10 rounded-full p-0',
  'icon-sm': 'h-8 w-8 rounded-full p-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center select-none cursor-pointer
          transition-all duration-200 focus-ring
          disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
