import { iconUrl } from '@/lib/digimon/display';

interface DigimonIconProps {
  id: number;
  name: string;
  /** Rendered box size in CSS pixels. */
  size?: number;
  /** Blacks out the artwork — a spoiler guard for unmet evolutions. */
  silhouette?: boolean;
  variant?: 'full' | 'thumb';
  priority?: boolean;
}

export function DigimonIcon({
  id,
  name,
  size = 64,
  silhouette = false,
  variant = 'thumb',
  priority = false,
}: DigimonIconProps) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-raised"
      style={{ width: size, height: size }}
    >
      {/* Plain <img>: static export disables next/image optimization, and the
          WebP variants are already sized by scripts/optimize-icons.mjs. */}
      <img
        src={iconUrl(id, variant)}
        alt={silhouette ? '' : name}
        aria-hidden={silhouette || undefined}
        width={size}
        height={size}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        className={`h-full w-full object-contain transition-[filter] ${
          silhouette ? 'brightness-0 dark:brightness-0 dark:invert' : ''
        }`}
      />
    </span>
  );
}
