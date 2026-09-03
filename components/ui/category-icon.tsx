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
  if (lower.includes('gift') || lower.includes('box')) return <Gift className={className} />;
  if (lower.includes('family') || lower.includes('pack')) return <Boxes className={className} />;
  if (lower.includes('combo')) return <Layers className={className} />;

  return <Sparkles className={className} />;
}

export function getCategory3DImage(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('sparkler')) return '/images/3d/cat-sparklers.jpg';
  if (lower.includes('flower') || lower.includes('pot')) return '/images/3d/cat-flower-pots.jpg';
  if (lower.includes('rocket')) return '/images/3d/cat-rockets.jpg';
  if (lower.includes('chakra') || lower.includes('wheel')) return '/images/3d/cat-chakras.jpg';
  if (lower.includes('fountain') || lower.includes('cone')) return '/images/3d/cat-fountains.jpg';
  if (lower.includes('sound') || lower.includes('bomb') || lower.includes('wala')) return '/images/3d/cat-sound-crackers.jpg';
  if (lower.includes('gift') || lower.includes('box')) return '/images/3d/cat-gift-boxes.jpg';
  if (lower.includes('family') || lower.includes('pack')) return '/images/3d/cat-family-packs.jpg';
  return '/images/3d/cat-sparklers.jpg';
}

export function Category3DThumbnail({ name, className = 'h-16 w-16 object-cover rounded-xl' }: { name: string; className?: string }) {
  const src = getCategory3DImage(name);
  return (
    <img
      src={src}
      alt={name}
      className={className}
      loading="lazy"
    />
  );
}

export function ProductVisualPlaceholder({
  name,
  className = 'w-full h-full',
}: {
  name: string;
  className?: string;
}) {
  const src = getCategory3DImage(name);
  return (
    <div className={`relative overflow-hidden bg-muted select-none ${className}`}>
      <img
        src={src}
        alt={name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
    </div>
  );
}
