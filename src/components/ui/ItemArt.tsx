import { useId, useState } from 'react';
import { itemArtwork, type TargetItem } from '../../domain/items';

const SIZES = {
  xs: { box: 'size-8 rounded-md', text: 'text-[11px]' },
  sm: { box: 'size-10 rounded-lg', text: 'text-xs' },
  md: { box: 'size-14 rounded-xl', text: 'text-sm' },
  lg: { box: 'size-20 rounded-xl', text: 'text-base' },
  hero: { box: 'size-24 rounded-2xl sm:size-28', text: 'text-xl' },
} as const;

export type ItemArtSize = keyof typeof SIZES;

/**
 * Character or weapon artwork with a styled fallback.
 *
 * - The box has a fixed size, so a slow or missing image never shifts layout.
 * - Images are lazy by default and load only when a suggestion list is open.
 * - Failures (offline, mirror moved, unknown icon) fall back to a monogram, so the
 *   selector stays usable without any artwork at all.
 */
export function ItemArt({
  item,
  size = 'sm',
  priority = false,
  className = '',
}: {
  item: TargetItem;
  size?: ItemArtSize;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const src = itemArtwork(item, size === 'hero' || size === 'lg' ? 'portrait' : 'compact');
  const dimensions = SIZES[size];

  // Reset the failure flag when the item changes, without an effect.
  if (src !== loadedSrc) {
    setLoadedSrc(src);
    setFailed(false);
  }

  const monogram = item.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-line-soft bg-gradient-to-br from-raised to-panel ${dimensions.box} ${className}`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          width={size === 'hero' ? 112 : 40}
          height={size === 'hero' ? 112 : 40}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          onError={() => setFailed(true)}
          className={`size-full object-cover ${item.kind === 'weapon' ? 'p-1' : ''}`}
        />
      ) : (
        <span
          className={`font-display ${dimensions.text} ${
            item.kind === 'character' ? 'text-accent/80' : 'text-azure/80'
          }`}
        >
          {monogram}
        </span>
      )}
    </span>
  );
}

/** Rarity stars shared by the selector and the target card. */
export function RarityStars({ rarity, className = '' }: { rarity: number; className?: string }) {
  const id = useId();
  return (
    <span className={`inline-flex items-center gap-0.5 text-gold ${className}`} aria-label={`${rarity} star`}>
      {Array.from({ length: Math.max(0, Math.min(5, rarity)) }, (_, index) => (
        <svg key={`${id}-${index}`} viewBox="0 0 12 12" className="size-2.5" aria-hidden="true">
          <path
            d="M6 0.8 7.5 4l3.5.4-2.6 2.4.7 3.4L6 8.6 2.9 10.2l.7-3.4L1 4.4 4.5 4z"
            fill="currentColor"
          />
        </svg>
      ))}
    </span>
  );
}
