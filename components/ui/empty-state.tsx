import { Sparkles } from 'lucide-react';
import { StoreButton } from '@/components/ui/store-button';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`text-center py-16 px-6 bg-card rounded-2xl border border-border max-w-md mx-auto animate-fade-in ${className}`}
    >
      <div className="h-12 w-12 rounded-xl bg-muted text-foreground-secondary flex items-center justify-center mx-auto mb-4 border border-border">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5 max-w-xs mx-auto">
        {description}
      </p>

      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <StoreButton size="md" variant="primary">
            {actionLabel}
          </StoreButton>
        </Link>
      )}

      {actionLabel && !actionHref && onAction && (
        <StoreButton size="md" variant="primary" onClick={onAction}>
          {actionLabel}
        </StoreButton>
      )}
    </div>
  );
}
