import React, { useState } from 'react';
import type { ScentSpec } from '../data/products';

interface CandleVisualProps {
  scent: ScentSpec;
  variant?: 'candle' | 'botanical';
  className?: string;
  alt?: string;
}

export function CandleVisual({
  scent,
  variant = 'candle',
  className = '',
  alt,
}: CandleVisualProps) {
  const [failed, setFailed] = useState(false);
  const src = variant === 'botanical' ? scent.botanicalImg : scent.candleImg;

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl text-xs font-semibold ${className}`}
        style={{ backgroundColor: scent.bg, color: scent.accentInk }}
        role="img"
        aria-label={alt ?? `${scent.name} candle`}
      >
        {scent.name}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? ''}
      aria-hidden={alt ? undefined : true}
      draggable={false}
      onError={() => setFailed(true)}
      className={`select-none object-contain ${className}`}
    />
  );
}
