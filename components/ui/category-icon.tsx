import {
  Sparkles,
  Flame,
  Zap,
  Boxes,
  Package,
  Layers,
  Disc,
  Wind,
  Gift,
  CircleDot,
  Radio,
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
}

export function CategoryIcon({ name, className = 'h-5 w-5' }: CategoryIconProps) {
  const lower = name.toLowerCase();

  if (lower.includes('sparkler')) return <Sparkles className={className} />;
  if (lower.includes('flower') || lower.includes('pot')) return <Flame className={className} />;
  if (lower.includes('rocket')) return <Radio className={className} />;
  if (lower.includes('chakra') || lower.includes('wheel')) return <Disc className={className} />;
  if (lower.includes('fountain') || lower.includes('cone')) return <Wind className={className} />;
  if (lower.includes('sound') || lower.includes('bomb') || lower.includes('wala')) return <Zap className={className} />;
  if (lower.includes('gift') || lower.includes('box')) return <Gift className={className} />;
  if (lower.includes('family') || lower.includes('pack')) return <Boxes className={className} />;
  if (lower.includes('combo')) return <Layers className={className} />;

  return <Sparkles className={className} />;
}

export function ProductVisualPlaceholder({
  name,
  className = 'w-full h-full',
}: {
  name: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center bg-muted/50 text-foreground-muted select-none ${className}`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="h-12 w-12 rounded-xl bg-card border border-border flex items-center justify-center text-foreground-secondary shadow-xs">
          <CategoryIcon name={name} className="h-6 w-6" />
        </div>
        <span className="text-[11px] font-medium tracking-tight text-foreground-muted">
          {name.split(' ')[0]}
        </span>
      </div>
    </div>
  );
}
