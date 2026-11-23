import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check } from 'lucide-react';
import {
  SMOOTHIE_FRUITS,
  SMOOTHIE_SIZE_OPTIONS,
  type SmoothieFruitId,
  type SmoothieSizeId,
  type SmoothieToppingId,
  type SweetnessLevel,
} from '../data/products';
import { computeBlendProgress } from '../utils/commerce';

const PROGRESS_EASE: [number, number, number, number] = [0.22, 0.8, 0.3, 1];

interface BlendProgressBarProps {
  fruits: readonly SmoothieFruitId[];
  toppings: readonly SmoothieToppingId[];
  sweetness: SweetnessLevel;
  size: SmoothieSizeId;
  accentInk: string;
  surface: string;
  surfaceWell: string;
  onJumpToStep?: (sectionId: string) => void;
}

export function BlendProgressBar({
  fruits,
  toppings,
  sweetness,
  size,
  accentInk,
  surface,
  surfaceWell,
  onJumpToStep,
}: BlendProgressBarProps) {
  const progress = computeBlendProgress({ fruits, toppings });
  const pickedFruitMeta = fruits
    .map((id) => SMOOTHIE_FRUITS.find((f) => f.id === id))
    .filter((f): f is (typeof SMOOTHIE_FRUITS)[number] => Boolean(f));

  const sizeShort = SMOOTHIE_SIZE_OPTIONS[size]?.shortLabel ?? '16 oz Cup';

  return (
    <motion.nav
      aria-label="Blend customization progress"
      data-testid="blend-progress-bar"
      data-progress-percent={progress.percent}
      data-active-step={progress.activeStep}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: PROGRESS_EASE }}
      className="mt-5 rounded-2xl border px-4 py-3 shadow-[0_12px_32px_rgba(60,40,80,0.08)] backdrop-blur-md transition-colors duration-500 sm:px-5 sm:py-3.5"
      style={{
        backgroundColor: surface,
        borderColor: `${accentInk}1C`,
      }}
    >
      {/* Top Row: Step Indicators + Percentage Readout */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <ol className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-5">
          {/* Step 1: 3-Fruit Base */}
          <li className="shrink-0">
            <button
              type="button"
              data-testid="progress-step-fruits"
              onClick={() => onJumpToStep?.('blend-step-fruits')}
              className="group flex items-center gap-2 rounded-xl px-1.5 py-1 text-left transition-colors hover:bg-black/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer"
              style={{ outlineColor: accentInk }}
            >
              <span
                className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold tabular-nums transition-colors duration-300"
                style={
                  progress.isFruitBaseFull
                    ? {
                        backgroundColor: accentInk,
                        borderColor: accentInk,
                        color: '#FFFFFF',
                      }
                    : progress.hasFruits
                      ? {
                          backgroundColor: `${accentInk}16`,
                          borderColor: accentInk,
                          color: accentInk,
                        }
                      : {
                          backgroundColor: surfaceWell,
                          borderColor: `${accentInk}30`,
                          color: '#5D5368',
                        }
                }
              >
                <AnimatePresence mode="wait" initial={false}>
                  {progress.isFruitBaseFull ? (
                    <motion.span
                      key="fruit-check"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.22, ease: PROGRESS_EASE }}
                      className="flex items-center justify-center"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="fruit-num"
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.85, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      1
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#2B2233] whitespace-nowrap">
                    Fruit Base
                  </span>
                  <span
                    data-testid="progress-fruits-count"
                    className="text-[11px] font-semibold tabular-nums whitespace-nowrap"
                    style={{ color: accentInk }}
                  >
                    {progress.fruitCount}/3
                  </span>
                </div>

                {/* 3 Interactive Fruit Slot Indicators */}
                <div className="mt-1 flex items-center gap-1" aria-hidden="true">
                  {[0, 1, 2].map((slotIdx) => {
                    const slotFruit = pickedFruitMeta[slotIdx];
                    return (
                      <motion.span
                        key={slotIdx}
                        initial={false}
                        animate={{
                          scale: slotFruit ? 1 : 0.88,
                          opacity: slotFruit ? 1 : 0.45,
                        }}
                        transition={{ duration: 0.28, ease: PROGRESS_EASE }}
                        className="h-2 w-4 rounded-full border transition-colors duration-300"
                        style={{
                          backgroundColor: slotFruit ? slotFruit.hex : surfaceWell,
                          borderColor: slotFruit ? slotFruit.accentInk : `${accentInk}28`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </button>
          </li>

          {/* Step 2: Toppings */}
          <li className="shrink-0">
            <button
              type="button"
              data-testid="progress-step-toppings"
              onClick={() => onJumpToStep?.('blend-step-toppings')}
              className="group flex items-center gap-2 rounded-xl px-1.5 py-1 text-left transition-colors hover:bg-black/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer"
              style={{ outlineColor: accentInk }}
            >
              <span
                className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold tabular-nums transition-colors duration-300"
                style={
                  progress.hasToppings
                    ? {
                        backgroundColor: accentInk,
                        borderColor: accentInk,
                        color: '#FFFFFF',
                      }
                    : progress.activeStep === 'toppings'
                      ? {
                          backgroundColor: `${accentInk}16`,
                          borderColor: accentInk,
                          color: accentInk,
                        }
                      : {
                          backgroundColor: surfaceWell,
                          borderColor: `${accentInk}30`,
                          color: '#5D5368',
                        }
                }
              >
                <AnimatePresence mode="wait" initial={false}>
                  {progress.hasToppings ? (
                    <motion.span
                      key="topping-check"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.22, ease: PROGRESS_EASE }}
                      className="flex items-center justify-center"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="topping-num"
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.85, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      2
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>

              <div>
                <div className="text-xs font-bold text-[#2B2233] whitespace-nowrap">
                  Toppings
                </div>
                <div
                  data-testid="progress-toppings-status"
                  className="text-[11px] font-medium tabular-nums text-[#5D5368] whitespace-nowrap"
                >
                  {progress.hasToppings ? `${progress.toppingCount} added` : 'Optional'}
                </div>
              </div>
            </button>
          </li>

          {/* Step 3: Tune & Size */}
          <li className="shrink-0">
            <button
              type="button"
              data-testid="progress-step-tune"
              onClick={() => onJumpToStep?.('blend-step-sweetness')}
              className="group flex items-center gap-2 rounded-xl px-1.5 py-1 text-left transition-colors hover:bg-black/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer"
              style={{ outlineColor: accentInk }}
            >
              <span
                className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold tabular-nums transition-colors duration-300"
                style={
                  progress.activeStep === 'ready'
                    ? {
                        backgroundColor: `${accentInk}16`,
                        borderColor: accentInk,
                        color: accentInk,
                      }
                    : {
                        backgroundColor: surfaceWell,
                        borderColor: `${accentInk}30`,
                        color: '#5D5368',
                      }
                }
              >
                3
              </span>
              <div>
                <div className="text-xs font-bold text-[#2B2233] whitespace-nowrap">
                  Sweet &amp; Cup
                </div>
                <div className="text-[11px] font-medium tabular-nums text-[#5D5368] whitespace-nowrap">
                  {sweetness}% · {sizeShort}
                </div>
              </div>
            </button>
          </li>
        </ol>

        {/* Right Readout */}
        <div
          className="flex items-center justify-between gap-3 border-t pt-2 sm:border-t-0 sm:pt-0"
          style={{ borderColor: `${accentInk}14` }}
        >
          <span className="text-[11px] font-semibold text-[#5D5368] whitespace-nowrap">
            {progress.percent === 100
              ? '3/3 bases & toppings ready'
              : !progress.hasFruits
                ? 'Start with 1–3 fruit bases'
                : !progress.isFruitBaseFull
                  ? progress.hasToppings
                    ? `Room for ${3 - progress.fruitCount} more base${3 - progress.fruitCount === 1 ? '' : 's'}`
                    : `Add ${3 - progress.fruitCount} more base${3 - progress.fruitCount === 1 ? '' : 's'} or toppings`
                  : 'Layer superfood toppings'}
          </span>
          <span
            data-testid="progress-percent-label"
            className="text-xs font-extrabold tabular-nums whitespace-nowrap"
            style={{ color: accentInk }}
          >
            {progress.percent}%
          </span>
        </div>
      </div>

      {/* Subtle Smooth Progress Bar Track (compositor-only scaleX transform) */}
      <div
        role="progressbar"
        aria-label="Fruit base and topping selection progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
        className="relative mt-2.5 h-1.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: surfaceWell }}
      >
        <motion.div
          data-testid="progress-bar-fill"
          className="h-full w-full rounded-full"
          initial={false}
          animate={{ scaleX: Math.max(0.02, progress.ratio) }}
          transition={{ duration: 0.48, ease: PROGRESS_EASE }}
          style={{
            originX: 0,
            backgroundColor: accentInk,
            opacity: progress.ratio === 0 ? 0.2 : 1,
          }}
        />
        {/* Subtle 25% / 50% / 75% milestone ticks */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-1/4 w-px bg-white/55"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-2/4 w-px bg-white/55"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-3/4 w-px bg-white/55"
        />
      </div>
    </motion.nav>
  );
}
