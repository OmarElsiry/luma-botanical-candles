import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CANDLE_FONTS,
  SMOOTHIE_FRUITS,
  type CandleFontId,
  type SmoothieFruitId,
  type SmoothieToppingId,
  type SweetnessLevel,
} from '../data/products';
import { computeBlendVisualColors } from '../utils/commerce';
import { FruitIcon } from './FruitIcon';

interface SmoothieBlendPreviewProps {
  fruits: SmoothieFruitId[];
  toppings: SmoothieToppingId[];
  sweetness: SweetnessLevel;
  customText?: string;
  fontId?: CandleFontId;
  size?: 'sm' | 'lg';
}

interface DropBurst {
  uid: string;
  fruitId: SmoothieFruitId;
  slotIndex: number;
  hex: string;
  swirlHex: string;
}

const FRUIT_SLOT_POSITIONS: ReadonlyArray<{
  leftPct: number;
  topPct: number;
  rotate: number;
  dropXOffset: number;
  sizePx: number;
}> = [
  { leftPct: 12, topPct: 16, rotate: -14, dropXOffset: -42, sizePx: 42 },
  { leftPct: 64, topPct: 17, rotate: 15, dropXOffset: 42, sizePx: 40 },
  { leftPct: 38, topPct: 74, rotate: -8, dropXOffset: 0, sizePx: 42 },
];

export function SmoothieBlendPreview({
  fruits,
  toppings,
  sweetness,
  customText = '',
  fontId = 'playfair',
  size = 'lg',
}: SmoothieBlendPreviewProps) {
  const colors = computeBlendVisualColors(fruits);
  const fontOpt = CANDLE_FONTS.find((f) => f.id === fontId) ?? CANDLE_FONTS[0];
  const displayTitle = customText.trim();
  const pickedFruits = fruits
    .map((id) => SMOOTHIE_FRUITS.find((f) => f.id === id))
    .filter((f): f is (typeof SMOOTHIE_FRUITS)[number] => Boolean(f));

  const hasChia = toppings.includes('chia');
  const hasGranola = toppings.includes('granola');
  const hasCoconut = toppings.includes('coconut');
  const hasCacao = toppings.includes('cacao');
  const hasHemp = toppings.includes('hemp');
  const hasPollen = toppings.includes('bee-pollen');

  const gradientId = React.useId();

  // Track newly added fruits to drive the falling-into-glass + splash choreography
  const prevFruitsRef = useRef<SmoothieFruitId[]>([]);
  const mountedRef = useRef(false);
  const [activeDrops, setActiveDrops] = useState<DropBurst[]>([]);
  const [impactCount, setImpactCount] = useState(0);
  const [lastImpactHex, setLastImpactHex] = useState<string>(colors.topHex);

  useEffect(() => {
    if (size !== 'lg') return;

    const prev = prevFruitsRef.current;
    const added = fruits.filter((id) => !prev.includes(id));
    prevFruitsRef.current = fruits;

    if (!mountedRef.current) {
      mountedRef.current = true;
      // On initial mount, cascade the initial selections gently into the glass
      if (fruits.length > 0) {
        const timers: number[] = [];
        fruits.forEach((fruitId, idx) => {
          const meta = SMOOTHIE_FRUITS.find((f) => f.id === fruitId);
          if (!meta) return;
          const uid = `init-${fruitId}-${Date.now()}-${idx}`;
          const tStart = window.setTimeout(() => {
            setActiveDrops((curr) => [
              ...curr,
              { uid, fruitId, slotIndex: idx, hex: meta.hex, swirlHex: meta.swirlHex },
            ]);
          }, 120 + idx * 210);
          const tImpact = window.setTimeout(() => {
            setLastImpactHex(meta.swirlHex);
            setImpactCount((c) => c + 1);
          }, 400 + idx * 210);
          const tClean = window.setTimeout(() => {
            setActiveDrops((curr) => curr.filter((d) => d.uid !== uid));
          }, 1050 + idx * 210);
          timers.push(tStart, tImpact, tClean);
        });
        return () => timers.forEach((id) => window.clearTimeout(id));
      }
      return;
    }

    if (added.length === 0) return;

    const timers: number[] = [];
    added.forEach((fruitId, offsetIdx) => {
      const meta = SMOOTHIE_FRUITS.find((f) => f.id === fruitId);
      if (!meta) return;
      const slotIndex = Math.max(0, fruits.indexOf(fruitId));
      const uid = `drop-${fruitId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      setActiveDrops((curr) => [
        ...curr,
        { uid, fruitId, slotIndex, hex: meta.hex, swirlHex: meta.swirlHex },
      ]);

      const tImpact = window.setTimeout(() => {
        setLastImpactHex(meta.swirlHex);
        setImpactCount((c) => c + 1);
      }, 270 + offsetIdx * 80);

      const tClean = window.setTimeout(() => {
        setActiveDrops((curr) => curr.filter((d) => d.uid !== uid));
      }, 950 + offsetIdx * 80);

      timers.push(tImpact, tClean);
    });

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [fruits, size]);

  if (size === 'sm') {
    return (
      <div
        className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl"
        style={{ backgroundColor: `${colors.topHex}66` }}
      >
        <div className="relative flex h-12 w-10 flex-col items-center justify-end">
          {/* Mini straw */}
          <div
            aria-hidden="true"
            className="absolute -top-0.5 right-2 h-5 w-1 rotate-[16deg] rounded-full bg-white/95 shadow-xs"
          />
          {/* Mini translucent smoothie cup */}
          <div
            className="relative h-10 w-8 overflow-hidden rounded-t-[6px] rounded-b-xl border border-white/70 shadow-sm"
            style={{
              background: `linear-gradient(180deg, ${colors.topHex} 0%, ${colors.midHex} 52%, ${colors.bottomHex} 100%)`,
            }}
          >
            {pickedFruits[0] && (
              <div className="absolute inset-0 flex items-center justify-center opacity-85">
                <FruitIcon fruitId={pickedFruits[0].id} className="h-4 w-4" />
              </div>
            )}
            {toppings.length > 0 && (
              <div className="absolute inset-x-0.5 top-0.5 flex flex-wrap justify-center gap-0.5">
                {toppings.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="h-1 w-1 rounded-full border border-black/10"
                    style={{
                      backgroundColor:
                        t === 'chia'
                          ? '#3A3242'
                          : t === 'granola'
                            ? '#C7924F'
                            : t === 'coconut'
                              ? '#FFFDF8'
                              : t === 'cacao'
                                ? '#4E3126'
                                : t === 'hemp'
                                  ? '#8FB273'
                                  : '#E7B942',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="smoothie-live-preview"
      data-impact-count={impactCount}
      className="relative flex flex-col items-center justify-center pt-16 select-none"
    >
      {/* Falling Fruit Drop Zone (overflow-visible above the open glass rim!) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-40 flex h-56 justify-center overflow-visible"
      >
        <AnimatePresence>
          {activeDrops.map((drop) => {
            const slot = FRUIT_SLOT_POSITIONS[drop.slotIndex % FRUIT_SLOT_POSITIONS.length];
            const targetDepthY = 128 + drop.slotIndex * 26;
            return (
              <motion.div
                key={drop.uid}
                data-testid={`falling-fruit-${drop.fruitId}`}
                initial={{
                  y: -36,
                  x: drop.slotIndex === 0 ? -24 : drop.slotIndex === 1 ? 26 : 0,
                  scale: 1.3,
                  rotate: drop.slotIndex % 2 === 0 ? -30 : 28,
                  opacity: 0,
                }}
                animate={{
                  y: [-36, 54, targetDepthY, targetDepthY - 6],
                  x: [
                    drop.slotIndex === 0 ? -24 : drop.slotIndex === 1 ? 26 : 0,
                    slot.dropXOffset * 0.65,
                    slot.dropXOffset,
                    slot.dropXOffset,
                  ],
                  scale: [1.3, 1.08, 0.92, 0.88],
                  rotate: [drop.slotIndex % 2 === 0 ? -30 : 28, 8, slot.rotate, slot.rotate],
                  opacity: [0, 1, 1, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.82,
                  times: [0, 0.34, 0.72, 1],
                  ease: [0.42, 0, 0.58, 1],
                }}
                className="absolute top-1 drop-shadow-[0_10px_18px_rgba(45,30,60,0.28)]"
              >
                <FruitIcon fruitId={drop.fruitId} className="h-12 w-12 sm:h-14 sm:w-14" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Glass Container Wrapper with Weighty Impact Bounce */}
      <motion.div
        key={`glass-impact-${impactCount}`}
        initial={impactCount > 0 ? { y: 0, scaleY: 1 } : false}
        animate={impactCount > 0 ? { y: [0, 5, -1.5, 0], scaleY: [1, 0.985, 1.006, 1] } : { y: 0, scaleY: 1 }}
        transition={{ duration: 0.38, ease: [0.22, 0.8, 0.3, 1] }}
        className="relative flex flex-col items-center"
      >
        {/* Frosted glass straw emerging from open rim */}
        <motion.div
          aria-hidden="true"
          animate={{ rotate: [13, 15, 13] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative z-10 -mb-6 ml-14 h-20 w-3.5 origin-bottom rounded-t-full border border-white/75 shadow-sm"
          style={{
            background: `linear-gradient(90deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.45) 55%, ${colors.topHex}AA 100%)`,
          }}
        >
          <div className="mx-auto mt-1 h-full w-1 rounded-full bg-white/55" />
        </motion.div>

        {/* Impact Puree Splash Droplets bursting above glass rim */}
        <AnimatePresence>
          {impactCount > 0 && (
            <motion.div
              key={`splash-${impactCount}`}
              data-testid="glass-splash"
              aria-hidden="true"
              className="pointer-events-none absolute -top-2 z-30 flex items-center justify-center"
            >
              {[
                { x: -34, y: -30, s: 8 },
                { x: -16, y: -42, s: 10 },
                { x: 4, y: -46, s: 7 },
                { x: 22, y: -38, s: 9 },
                { x: 38, y: -26, s: 7 },
              ].map((drop, i) => (
                <motion.span
                  key={i}
                  initial={{ x: 0, y: 12, scale: 0.4, opacity: 0.95 }}
                  animate={{ x: drop.x, y: drop.y, scale: [0.6, 1.15, 0.3], opacity: [0.95, 0.9, 0] }}
                  transition={{ duration: 0.48, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute rounded-full border border-white/50 shadow-xs"
                  style={{
                    width: `${drop.s}px`,
                    height: `${drop.s}px`,
                    backgroundColor: lastImpactHex,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Open Glass Rim Ellipse (shows fruits enter directly into the glass) */}
        <div
          aria-hidden="true"
          className="relative z-30 -mb-3.5 h-6 w-[176px] rounded-[100%] border-2 border-white/85 shadow-[inset_0_2px_6px_rgba(255,255,255,0.75)] sm:w-[200px]"
          style={{
            background: `linear-gradient(180deg, rgba(255,255,255,0.45) 0%, ${colors.topHex}55 100%)`,
          }}
        />

        {/* Domed Translucent Smoothie Glass Container */}
        <div className="relative z-20 flex h-[256px] w-[184px] flex-col items-center justify-end overflow-hidden rounded-t-[20px] rounded-b-[46px] border-2 border-white/80 bg-white/22 p-1.5 shadow-[0_24px_50px_rgba(45,30,60,0.22),inset_0_4px_14px_rgba(255,255,255,0.65)] backdrop-blur-xs sm:h-[288px] sm:w-[208px]">
          {/* Inner Liquid Vessel */}
          <div className="relative h-full w-full overflow-hidden rounded-t-[16px] rounded-b-[40px]">
            {/* SVG Layered Smoothie Liquid */}
            <svg
              viewBox="0 0 200 280"
              preserveAspectRatio="none"
              className="h-full w-full transition-all duration-500"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={colors.topHex} />
                  <stop offset="48%" stopColor={colors.midHex} />
                  <stop offset="100%" stopColor={colors.bottomHex} />
                </linearGradient>
              </defs>

              {/* Primary blended body */}
              <rect x="0" y="20" width="200" height="260" fill={`url(#${gradientId})`} />

              {/* Animated botanical puree swirl ribbons */}
              <motion.path
                d="M0,115 C55,95 140,145 200,118 L200,280 L0,280 Z"
                initial={{ d: 'M0,115 C55,95 140,145 200,118 L200,280 L0,280 Z' }}
                animate={{
                  d: [
                    'M0,115 C55,95 140,145 200,118 L200,280 L0,280 Z',
                    'M0,122 C65,142 135,96 200,124 L200,280 L0,280 Z',
                    'M0,115 C55,95 140,145 200,118 L200,280 L0,280 Z',
                  ],
                }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                fill={colors.midHex}
                opacity="0.48"
              />
              <path
                d="M0,190 C65,215 135,168 200,195 L200,280 L0,280 Z"
                fill={colors.bottomHex}
                opacity="0.62"
              />

              {/* Frosted cream crown foam at top of cup */}
              <ellipse cx="100" cy="24" rx="98" ry="15" fill="#FFFDF9" opacity="0.86" />
              <motion.ellipse
                key={`ripple-${impactCount}`}
                cx="100"
                cy="27"
                initial={impactCount > 0 ? { rx: 24, ry: 4, opacity: 0.7 } : { rx: 92, ry: 11, opacity: 0.35 }}
                animate={{ rx: 92, ry: 11, opacity: 0.35 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                fill={colors.topHex}
              />
            </svg>

            {/* Suspended Chosen Fruit Icons Floating Inside the Smoothie Glass */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
              <AnimatePresence>
                {pickedFruits.map((f, idx) => {
                  const slot = FRUIT_SLOT_POSITIONS[idx % FRUIT_SLOT_POSITIONS.length];
                  return (
                    <motion.div
                      key={f.id}
                      data-testid={`glass-fruit-${f.id}`}
                      initial={{ y: -90, scale: 0.72, opacity: 0, rotate: slot.rotate - 20 }}
                      animate={{
                        y: [0, -5, 2, 0],
                        scale: 1,
                        opacity: 0.96,
                        rotate: [slot.rotate - 3, slot.rotate + 3, slot.rotate - 3],
                      }}
                      exit={{ y: -36, scale: 0.4, opacity: 0, transition: { duration: 0.24 } }}
                      transition={{
                        scale: { duration: 0.38, delay: 0.2, ease: [0.22, 0.8, 0.3, 1] },
                        opacity: { duration: 0.25, delay: 0.22 },
                        y: { duration: 3.4 + idx * 0.5, repeat: Infinity, ease: 'easeInOut', delay: 0.45 },
                        rotate: { duration: 4.2 + idx * 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.45 },
                      }}
                      className="absolute drop-shadow-[0_6px_10px_rgba(45,30,60,0.2)]"
                      style={{
                        left: `${slot.leftPct}%`,
                        top: `${slot.topPct}%`,
                        width: `${slot.sizePx}px`,
                        height: `${slot.sizePx}px`,
                      }}
                    >
                      <FruitIcon fruitId={f.id} className="h-full w-full" />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Live Toppings Layer (Crown + Gentle Suspended Garnishes) */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-2 z-20 h-14">
              {hasChia && (
                <>
                  <span className="absolute left-[18%] top-2 h-1.5 w-1.5 rounded-full bg-[#3A3242]" />
                  <span className="absolute left-[28%] top-5 h-1.5 w-1.5 rounded-full bg-[#3A3242]" />
                  <span className="absolute left-[46%] top-3 h-1.5 w-1.5 rounded-full bg-[#3A3242]" />
                  <span className="absolute left-[63%] top-6 h-1.5 w-1.5 rounded-full bg-[#3A3242]" />
                  <span className="absolute left-[76%] top-2.5 h-1.5 w-1.5 rounded-full bg-[#3A3242]" />
                  <span className="absolute left-[54%] top-8 h-1 w-1 rounded-full bg-[#3A3242]/80" />
                </>
              )}

              {hasGranola && (
                <>
                  <span className="absolute left-[22%] top-2 h-3 w-4 rotate-12 rounded-md border border-[#9E6A2A]/40 bg-[#C7924F] shadow-2xs" />
                  <span className="absolute left-[48%] top-1.5 h-3.5 w-4.5 -rotate-6 rounded-md border border-[#9E6A2A]/40 bg-[#D7A25E] shadow-2xs" />
                  <span className="absolute left-[66%] top-3 h-3 w-3.5 rotate-24 rounded-md border border-[#9E6A2A]/40 bg-[#B67E3E] shadow-2xs" />
                </>
              )}

              {hasCoconut && (
                <>
                  <span className="absolute left-[14%] top-4 h-2 w-5 -rotate-18 rounded-full border border-amber-900/15 bg-[#FFFDF8] shadow-2xs" />
                  <span className="absolute left-[40%] top-4.5 h-2 w-6 rotate-12 rounded-full border border-amber-900/15 bg-[#FAF4E8] shadow-2xs" />
                  <span className="absolute left-[70%] top-4.5 h-2 w-4.5 -rotate-12 rounded-full border border-amber-900/15 bg-[#FFFDF8] shadow-2xs" />
                </>
              )}

              {hasCacao && (
                <>
                  <span className="absolute left-[31%] top-2.5 h-2.5 w-2 rotate-12 rounded-xs bg-[#4E3126]" />
                  <span className="absolute left-[58%] top-2 h-2 w-2.5 -rotate-15 rounded-xs bg-[#3B231A]" />
                  <span className="absolute left-[80%] top-4 h-2.5 w-2 rotate-30 rounded-xs bg-[#4E3126]" />
                </>
              )}

              {hasHemp && (
                <>
                  <span className="absolute left-[24%] top-6 h-2 w-2 rounded-full bg-[#8FB273] ring-1 ring-white/50" />
                  <span className="absolute left-[52%] top-5.5 h-2 w-2 rounded-full bg-[#A3C489] ring-1 ring-white/50" />
                  <span className="absolute left-[72%] top-6.5 h-1.5 w-1.5 rounded-full bg-[#8FB273]" />
                </>
              )}

              {hasPollen && (
                <>
                  <span className="absolute left-[36%] top-2 h-2 w-2 rounded-full bg-[#F5C642] shadow-2xs" />
                  <span className="absolute left-[60%] top-4 h-2 w-2 rounded-full bg-[#E7B942] shadow-2xs" />
                  <span className="absolute left-[43%] top-6 h-1.5 w-1.5 rounded-full bg-[#F7D15C]" />
                </>
              )}
            </div>

            {/* Translucent Glass Highlight Glare */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-4 left-2.5 z-20 w-3 rounded-full bg-white/32 blur-[1px]"
            />

            {/* Custom Cup Frosted Botanical Glass Label (translucent so floating fruits stay visible) */}
            <div
              className="absolute inset-x-3 top-[54%] z-30 flex -translate-y-1/2 flex-col items-center justify-center rounded-2xl border border-white/60 px-3 py-2 text-center shadow-sm backdrop-blur-md transition-all duration-300"
              style={{
                background: `linear-gradient(145deg, rgba(255,255,255,0.58) 0%, ${colors.topHex}66 100%)`,
              }}
            >
              <span
                className="text-[9px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: colors.accentInk }}
              >
                Luma Cold-Pressed
              </span>
              <div
                className="mt-1 w-full break-words leading-tight"
                style={{
                  fontFamily: fontOpt.fontFamily,
                  color: colors.accentInk,
                  letterSpacing: fontOpt.letterSpacing ?? 'normal',
                  textTransform: fontOpt.textTransform ?? 'none',
                  fontSize: displayTitle.length > 18 ? '0.95rem' : fontId === 'caveat' ? '1.32rem' : '1.1rem',
                  fontWeight: 700,
                }}
              >
                {displayTitle ||
                  (pickedFruits.length > 0
                    ? pickedFruits.map((f) => f.shortName).join(' · ')
                    : 'Custom Blend')}
              </div>
              <div
                className="mt-1 text-[10px] font-semibold tabular-nums opacity-90"
                style={{ color: colors.accentInk }}
              >
                {sweetness}% Sweet · {toppings.length} {toppings.length === 1 ? 'Topping' : 'Toppings'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Cup Ground Shadow */}
      <div
        aria-hidden="true"
        className="-mt-2 h-5 w-44 rounded-full blur-md sm:w-52"
        style={{ background: 'radial-gradient(closest-side, rgba(45, 30, 60, 0.28), transparent)' }}
      />
    </div>
  );
}
