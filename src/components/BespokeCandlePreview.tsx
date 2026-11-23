import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  CANDLE_FONTS,
  getScentById,
  type CandleFontId,
  type CandleInkId,
  type ScentId,
} from '../data/products';

interface BespokeCandlePreviewProps {
  vesselColorHex: string;
  isDarkVessel?: boolean;
  scentId: ScentId;
  secondaryScentId?: ScentId;
  customText: string;
  customSubtext?: string;
  fontId: CandleFontId;
  inkId?: CandleInkId;
  inkHex: string;
  lit?: boolean;
  size?: 'sm' | 'lg';
}

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
const VESSEL_BLANK_SRC = `${BASE_URL}src/assets/images/luma_vessel_blank.webp`;
const VESSEL_MASK_SRC = `${BASE_URL}src/assets/images/luma_vessel_ceramic_mask.webp`;
const LABEL_MASK_SRC = `${BASE_URL}src/assets/images/luma_vessel_label_mask.webp`;
const FLAME_IMG_SRC = `${BASE_URL}src/assets/images/luma_studio_flame.webp`;

export function isHexColorDark(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return false;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.44;
}

function darkenHex(hex: string, amount = 24): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#CFC7B8';
  const num = parseInt(clean, 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function lightenHex(hex: string, amount = 20): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#FFFFFF';
  const num = parseInt(clean, 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function BespokeCandlePreview({
  vesselColorHex,
  isDarkVessel,
  scentId,
  secondaryScentId,
  customText,
  customSubtext,
  fontId,
  inkId,
  inkHex,
  lit = true,
  size = 'lg',
}: BespokeCandlePreviewProps) {
  const [vesselFailed, setVesselFailed] = useState(false);
  const [flameFailed, setFlameFailed] = useState(false);

  const scent = getScentById(scentId);
  const secondaryScent =
    secondaryScentId && secondaryScentId !== scentId ? getScentById(secondaryScentId) : undefined;
  const fontOpt = CANDLE_FONTS.find((f) => f.id === fontId) ?? CANDLE_FONTS[0];

  const normalizedHex = vesselColorHex.trim().toUpperCase();
  const darkVessel = isDarkVessel ?? isHexColorDark(vesselColorHex);
  const isNaturalIvory = normalizedHex === '#F6F1E7';
  const isIvoryInk = inkId === 'ivory' || inkHex.trim().toUpperCase() === '#FAF6EE';

  const displayTitle = customText.trim();
  const displaySub = (customSubtext ?? '').trim();
  const accordText = secondaryScent
    ? `${scent.name.toUpperCase()} + ${secondaryScent.name.toUpperCase()}`
    : scent.name.toUpperCase();

  const shadowColor = darkenHex(vesselColorHex, 28);
  const highlightColor = lightenHex(vesselColorHex, 18);

  if (size === 'sm') {
    if (vesselFailed) {
      return (
        <div
          className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl"
          style={{ backgroundColor: scent.bg }}
        >
          <div
            className="relative h-12 w-10 rounded-b-xl rounded-t-[6px] border border-black/10 shadow-sm"
            style={{
              background: `linear-gradient(105deg, ${highlightColor} 0%, ${vesselColorHex} 48%, ${shadowColor} 100%)`,
            }}
          />
        </div>
      );
    }

    return (
      <div className="relative flex h-full w-full items-center justify-center select-none">
        <div className="relative h-full max-w-full aspect-[534/706] isolate">
          <img
            src={VESSEL_BLANK_SRC}
            alt={`Bespoke ${scent.name} candle`}
            draggable={false}
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setVesselFailed(true)}
            className="h-full w-full object-contain drop-shadow-[0_4px_8px_rgba(45,30,60,0.2)]"
          />

          {!isNaturalIvory && (
            <>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 transition-colors duration-300"
                style={{
                  backgroundColor: vesselColorHex,
                  mixBlendMode: 'multiply',
                  opacity: darkVessel ? 0.94 : 0.88,
                  maskImage: `url(${VESSEL_MASK_SRC})`,
                  WebkitMaskImage: `url(${VESSEL_MASK_SRC})`,
                  maskSize: '100% 100%',
                  WebkitMaskSize: '100% 100%',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(102deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.04) 44%, rgba(20,14,28,0.18) 100%)',
                  mixBlendMode: darkVessel ? 'screen' : 'soft-light',
                  maskImage: `url(${VESSEL_MASK_SRC})`,
                  WebkitMaskImage: `url(${VESSEL_MASK_SRC})`,
                  maskSize: '100% 100%',
                  WebkitMaskSize: '100% 100%',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                }}
              />
            </>
          )}

          {/* Archival dark cotton paper tint when ivory emboss ink is selected */}
          {isIvoryInk && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(105deg, rgba(48,40,56,0.92) 0%, rgba(34,27,41,0.95) 55%, rgba(24,19,30,0.97) 100%)',
                mixBlendMode: 'multiply',
                maskImage: `url(${LABEL_MASK_SRC})`,
                WebkitMaskImage: `url(${LABEL_MASK_SRC})`,
                maskSize: '100% 100%',
                WebkitMaskSize: '100% 100%',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
              }}
            />
          )}

          {/* Crisp scaled label typography */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute flex flex-col items-center justify-center overflow-hidden px-0.5 text-center"
            style={{
              left: '23%',
              right: '23%',
              top: '39%',
              bottom: '16%',
            }}
          >
            <span
              className="text-[4px] font-bold uppercase tracking-[0.22em] opacity-85"
              style={{ color: inkHex }}
            >
              LUMA
            </span>
            <span
              className="mt-0.5 line-clamp-2 w-full break-words text-[5px] font-bold leading-tight"
              style={{
                fontFamily: fontOpt.fontFamily,
                color: inkHex,
              }}
            >
              {displayTitle || scent.name}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Warm ambient radiance behind flame when lit */}
      {lit && (
        <motion.div
          aria-hidden="true"
          animate={{ opacity: [0.46, 0.72, 0.54], scale: [0.97, 1.03, 0.98] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -top-6 h-40 w-40 rounded-full blur-2xl sm:-top-8 sm:h-48 sm:w-48"
          style={{
            background:
              'radial-gradient(circle, rgba(255,214,124,0.62) 0%, rgba(255,180,82,0.2) 48%, transparent 74%)',
          }}
        />
      )}

      {/* Isolated vessel composition so blend modes stay strictly inside candle */}
      <div className="relative z-10 w-[232px] aspect-[534/706] sm:w-[276px] isolate">
        {vesselFailed ? (
          <div
            className="flex h-full w-full flex-col items-center justify-center rounded-t-[24px] rounded-b-[42px] border border-black/10 p-6 shadow-xl"
            style={{
              background: `linear-gradient(108deg, ${highlightColor} 0%, ${vesselColorHex} 45%, ${shadowColor} 100%)`,
            }}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: inkHex }}>
              LUMA · {accordText}
            </span>
            <span className="mt-2 text-lg font-bold" style={{ fontFamily: fontOpt.fontFamily, color: inkHex }}>
              {displayTitle || scent.name}
            </span>
          </div>
        ) : (
          <>
            {/* Base studio photograph of wheel-thrown ivory ceramic candle with blank cotton paper label */}
            <img
              src={VESSEL_BLANK_SRC}
              alt={`Custom ${accordText} Luma stoneware candle`}
              draggable={false}
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setVesselFailed(true)}
              className="h-full w-full object-contain drop-shadow-[0_20px_34px_rgba(45,30,60,0.22)]"
            />

            {/* Ceramic-only kiln glaze recolor + cylindrical rim highlight */}
            {!isNaturalIvory && (
              <>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 transition-colors duration-300"
                  style={{
                    backgroundColor: vesselColorHex,
                    mixBlendMode: 'multiply',
                    opacity: darkVessel ? 0.94 : 0.88,
                    maskImage: `url(${VESSEL_MASK_SRC})`,
                    WebkitMaskImage: `url(${VESSEL_MASK_SRC})`,
                    maskSize: '100% 100%',
                    WebkitMaskSize: '100% 100%',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                  }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(102deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.06) 44%, rgba(20,14,28,0.22) 100%)',
                    mixBlendMode: darkVessel ? 'screen' : 'soft-light',
                    maskImage: `url(${VESSEL_MASK_SRC})`,
                    WebkitMaskImage: `url(${VESSEL_MASK_SRC})`,
                    maskSize: '100% 100%',
                    WebkitMaskSize: '100% 100%',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                  }}
                />
              </>
            )}

            {/* Archival charcoal cotton-paper stock override matched to exact photographed trapezoid label */}
            {isIvoryInk && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                style={{
                  background:
                    'linear-gradient(105deg, rgba(48,40,56,0.92) 0%, rgba(34,27,41,0.95) 55%, rgba(24,19,30,0.97) 100%)',
                  mixBlendMode: 'multiply',
                  maskImage: `url(${LABEL_MASK_SRC})`,
                  WebkitMaskImage: `url(${LABEL_MASK_SRC})`,
                  maskSize: '100% 100%',
                  WebkitMaskSize: '100% 100%',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                }}
              />
            )}

            {/* Printed Cotton-Paper Label Typography (aligned inside photographed deckle label) */}
            <div
              className="pointer-events-none absolute flex flex-col items-center justify-center px-2.5 py-2 text-center"
              style={{
                left: '22%',
                right: '22%',
                top: '37.8%',
                bottom: '15.2%',
              }}
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.3em] opacity-85 sm:text-[11px]"
                style={{
                  color: inkHex,
                  textShadow: isIvoryInk ? '0 1px 2px rgba(0,0,0,0.35)' : undefined,
                }}
              >
                LUMA
              </span>

              <span
                className="mt-1 text-[8px] font-semibold uppercase tracking-[0.18em] opacity-75 sm:text-[9px]"
                style={{ color: inkHex }}
              >
                {accordText}
              </span>

              <div
                aria-hidden="true"
                className="my-2 h-px w-9 transition-colors duration-200 sm:my-2.5"
                style={{ backgroundColor: inkHex, opacity: isIvoryInk ? 0.35 : 0.22 }}
              />

              <div
                className="w-full break-words leading-[1.15] transition-all duration-200"
                style={{
                  fontFamily: fontOpt.fontFamily,
                  color: inkHex,
                  letterSpacing: fontOpt.letterSpacing ?? 'normal',
                  textTransform: fontOpt.textTransform ?? 'none',
                  fontSize:
                    (displayTitle || scent.name).length > 18
                      ? '0.95rem'
                      : fontId === 'caveat'
                        ? '1.45rem'
                        : fontId === 'cinzel'
                          ? '1.05rem'
                          : '1.22rem',
                  fontWeight: 700,
                  textShadow: isIvoryInk ? '0 1px 3px rgba(0,0,0,0.4)' : undefined,
                }}
              >
                {displayTitle || scent.name}
              </div>

              <div
                className="mt-1.5 w-full break-words text-[8.5px] font-medium tracking-[0.04em] opacity-80 sm:text-[9.5px]"
                style={{
                  fontFamily: displaySub ? fontOpt.fontFamily : undefined,
                  color: inkHex,
                }}
              >
                {displaySub || 'BOTANICAL SOY · 240 G'}
              </div>
            </div>

            {/* Warm top wax pool illumination when lit */}
            {lit && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute rounded-[50%]"
                style={{
                  left: '16%',
                  right: '16%',
                  top: '10.5%',
                  height: '10.5%',
                  background:
                    'radial-gradient(ellipse at 50% 58%, rgba(255, 212, 120, 0.58) 0%, rgba(255, 178, 70, 0.18) 58%, transparent 82%)',
                  mixBlendMode: 'soft-light',
                }}
              />
            )}

            {/* Photorealistic Transparent Flame anchored dead-center on braided cotton wick tip */}
            {lit && !flameFailed && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-[50%] top-[12.6%] aspect-square w-[68px] sm:w-[82px]"
                style={{ transform: 'translate(-50%, -68%)' }}
              >
                <motion.div
                  animate={{
                    scaleY: [1, 1.07, 0.96, 1.04, 1],
                    scaleX: [1, 0.96, 1.03, 0.98, 1],
                    rotate: [-1.4, 1.6, -1, 0.8, -1.4],
                  }}
                  transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                  className="h-full w-full drop-shadow-[0_0_14px_rgba(255,196,80,0.65)]"
                  style={{ transformOrigin: '50% 70%' }}
                >
                  <img
                    src={FLAME_IMG_SRC}
                    alt=""
                    draggable={false}
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={() => setFlameFailed(true)}
                    className="h-full w-full object-contain"
                  />
                </motion.div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Studio Ground Floor Shadow matching Hero framing */}
      <div
        aria-hidden="true"
        className="-mt-4 h-6 w-52 rounded-full blur-md sm:w-64"
        style={{ background: 'radial-gradient(closest-side, rgba(45, 30, 60, 0.3), transparent)' }}
      />
    </div>
  );
}
