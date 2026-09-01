import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      className={`text-center py-16 px-6 bg-card/60 rounded-3xl border border-border/80 max-w-lg mx-auto luxury-card animate-fade-in ${className}`}
    >
      <div className="h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-sm mx-auto">
        {description}
      </p>

      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button size="md" variant="primary">
            {actionLabel}
          </Button>
        </Link>
      )}

      {actionLabel && !actionHref && onAction && (
        <Button size="md" variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
