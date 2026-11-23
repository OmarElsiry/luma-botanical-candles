import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Citrus, Minus, Plus, RotateCcw, ShoppingBag, X, Zap } from 'lucide-react';
import { HERO_CARD_CROP, computeHeroStagePlacement } from '../blendyMath';
import {
  HERO_SHADOWS,
  PACK_PRICING,
  SCENTS,
  TRIO_ADDONS,
  getScentById,
  type PackSize,
  type ScentId,
  type TrioAddonId,
} from '../data/products';
import { useStore } from '../context/StoreContext';
import {
  type BenefitFilterMode,
  computeTrioBundlePrice,
  filterProductsByBenefit,
  formatMoney,
  getNutritionHighlightBadge,
} from '../utils/commerce';
import { CandleVisual } from '../components/CandleVisual';

const LUMA_EASE: [number, number, number, number] = [0.22, 0.8, 0.3, 1];

export function ShopPage() {
  const { navigate, addToCart, addCustomPackToCart, activeScentId, setActiveScentId } = useStore();
  const [filter, setFilter] = useState<BenefitFilterMode>('all');
  const [selectedPack, setSelectedPack] = useState<PackSize>(3);
  const [customMix, setCustomMix] = useState<ScentId[]>(['iris', 'sage', 'bergamot']);
  const [addonCounts, setAddonCounts] = useState<Partial<Record<TrioAddonId, number>>>({});

  const activeScent = getScentById(activeScentId);

  const filteredScents = useMemo(() => {
    return filterProductsByBenefit(SCENTS, filter);
  }, [filter]);

  const trioPricing = useMemo(() => computeTrioBundlePrice(addonCounts), [addonCounts]);

  const filterTabs: Array<{ id: BenefitFilterMode; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'energizing', label: 'Energizing' },
    { id: 'post-workout', label: 'Post-Workout' },
    { id: 'morning', label: 'Morning' },
  ];

  const packSizes: PackSize[] = [1, 3, 6];

  const addCandleToTrio = (id: ScentId) => {
    setCustomMix((prev) => (prev.length >= 3 ? prev : [...prev, id]));
  };

  const removeSlotFromTrio = (slotIndex: number) => {
    setCustomMix((prev) => prev.filter((_, idx) => idx !== slotIndex));
  };

  const stepAddon = (addonId: TrioAddonId, delta: number) => {
    setAddonCounts((prev) => {
      const nextQty = Math.max(0, Math.min(5, (prev[addonId] ?? 0) + delta));
      const updated = { ...prev, [addonId]: nextQty };
      if (nextQty === 0) delete updated[addonId];
      return updated;
    });
  };

  const centerShadow = HERO_SHADOWS[1];
  const centerShadowBounds = computeHeroStagePlacement(
    {
      x: centerShadow[0] - centerShadow[2] / 2,
      y: centerShadow[1] - centerShadow[3] / 2,
      w: centerShadow[2],
      h: centerShadow[3],
    },
    HERO_CARD_CROP
  );

  return (
    <div className="relative overflow-hidden">
      {/* Ambient Hero-matched floating blurred corner botanicals framing the catalog */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -right-14 top-20 z-0 hidden h-44 w-44 opacity-50 blur-[6px] lg:block transition-opacity duration-700"
      >
        <div
          className="piece-inner h-full w-full"
          style={{ '--rot': '16deg', '--dur': '4.6s', '--delay': '-1.2s' } as React.CSSProperties}
        >
          <CandleVisual scent={activeScent} variant="botanical" className="h-full w-full" />
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-16 bottom-12 z-0 hidden h-48 w-48 opacity-45 blur-[7px] lg:block transition-opacity duration-700"
      >
        <div
          className="piece-inner h-full w-full"
          style={{ '--rot': '-12deg', '--dur': '4.2s', '--delay': '-2.4s' } as React.CSSProperties}
        >
          <CandleVisual scent={activeScent} variant="botanical" className="h-full w-full" />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-12 lg:px-10">
        {/* Header & Pack Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: LUMA_EASE }}
          className="flex flex-col gap-6 border-b border-white/30 pb-8 md:flex-row md:items-end md:justify-between"
        >
          <div style={{ textShadow: '0 1px 6px rgba(90, 70, 40, 0.18)' }}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <button
                type="button"
                onClick={() => navigate({ page: 'hero' })}
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/95 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Hero Showcase
              </button>
              <span className="hidden text-xs text-white/55 sm:inline" aria-hidden="true">
                ·
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
                Small-Batch Studio · {SCENTS.length} Blends
              </p>
            </div>
            <h1 className="mt-2.5 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl text-balance">
              Botanical blends &amp; sets
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/95">
              Filter by daily benefit · Pick singles or save up to $36.00 on sets. Free delivery over $75.00.
            </p>
          </div>

          {/* Harmonized Botanical Segmented Pack Size Selector */}
          <div className="flex flex-col gap-2 sm:items-end">
            <span
              className="text-xs font-medium text-white/90"
              style={{ textShadow: '0 1px 6px rgba(90, 70, 40, 0.18)' }}
            >
              Display price for pack size
            </span>
            <div
              className="inline-flex max-w-full overflow-x-auto rounded-2xl border p-1.5 shadow-[0_14px_34px_rgba(60,40,80,0.14)] transition-colors duration-500"
              style={{
                backgroundColor: activeScent.surface,
                borderColor: `${activeScent.accentInk}22`,
              }}
            >
              {packSizes.map((size) => {
                const active = selectedPack === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedPack(size)}
                    className={`relative rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer sm:px-4 ${
                      active ? 'text-white' : 'text-[#5E5666] hover:text-[#2B2233]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="shopPackHighlight"
                        transition={{ duration: 0.45, ease: LUMA_EASE }}
                        className="absolute inset-0 rounded-xl"
                        style={{ backgroundColor: activeScent.accentInk }}
                      />
                    )}
                    <span className="relative z-10">
                      {size === 1 ? 'Single' : size === 3 ? 'Trio Set' : 'Studio 6-Case'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Benefit Category Filter Tabs — Exact Hero Gliding 2px White Underline */}
        <div
          className="mt-6 flex flex-col gap-3 border-b border-white/25 sm:flex-row sm:items-center sm:justify-between"
          style={{ textShadow: '0 1px 6px rgba(90, 70, 40, 0.18)' }}
        >
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-8"
            role="tablist"
            aria-label="Filter blends by benefit"
          >
            {filterTabs.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(tab.id)}
                  className={`relative pb-3 text-[13px] font-medium text-white transition-opacity whitespace-nowrap shrink-0 cursor-pointer sm:text-sm ${
                    active ? 'opacity-100 font-semibold' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {tab.label}
                  {active && (
                    <motion.span
                      layoutId="shopFilterUnderline"
                      transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
                      className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-white"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <span className="pb-2 text-xs font-medium text-white/90 sm:pb-3 tabular-nums">
            Showing {filteredScents.length} of {SCENTS.length} blends
          </span>
        </div>

        {/* 3-Column Botanical Product Grid with Staggered Entrance & Floating Nutrition Badge */}
        <section
          data-testid="shop-product-grid"
          className="mt-8 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Product catalog"
        >
          <AnimatePresence mode="popLayout">
            {filteredScents.map((scent, idx) => {
              const pack = PACK_PRICING[selectedPack];
              const isLongWord = scent.name.length > 5;
              const candleBounds = computeHeroStagePlacement(scent.heroCandle, HERO_CARD_CROP);
              const fruitPieces = scent.pieces.filter((p) => p.layer === 'fruit').slice(0, 3);
              const nutritionBadge = getNutritionHighlightBadge(scent);
              const vitC = scent.nutrition.vitamins[0];

              return (
                <motion.article
                  key={scent.id}
                  data-testid={`product-card-${scent.id}`}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                      duration: 0.42,
                      delay: idx * 0.05,
                      ease: LUMA_EASE,
                    },
                  }}
                  exit={{ opacity: 0, y: 10, scale: 0.96, transition: { duration: 0.18, ease: LUMA_EASE } }}
                  onMouseEnter={() => setActiveScentId(scent.id)}
                  onFocus={() => setActiveScentId(scent.id)}
                  className="group flex flex-col overflow-hidden rounded-3xl border shadow-[0_20px_50px_rgba(60,40,80,0.14)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_28px_64px_rgba(60,40,80,0.22)]"
                  style={{
                    backgroundColor: scent.surface,
                    borderColor: `${scent.accentInk}1A`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => navigate({ page: 'scent', scentId: scent.id })}
                    aria-label={`View ${scent.name} details`}
                    data-testid={`product-card-stage-${scent.id}`}
                    className="relative aspect-[19/15] w-full overflow-hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2B2233]"
                    style={{ backgroundColor: scent.bg, containerType: 'inline-size' }}
                  >
                    {/* Floating Nutrition Highlight Badge ('High Vitamin C' or 'Energy Boost') */}
                    <span
                      data-testid={`nutrition-badge-${scent.id}`}
                      className="pointer-events-none absolute left-3 top-3 z-30 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold tracking-wide shadow-[0_6px_16px_rgba(40,28,55,0.1)] transition-transform duration-300 ease-out group-hover:-translate-y-0.5"
                      style={{
                        backgroundColor: scent.surface,
                        borderColor: `${scent.accentInk}26`,
                        color: scent.accentInk,
                      }}
                    >
                      {nutritionBadge === 'High Vitamin C' ? (
                        <Citrus className="h-3 w-3 shrink-0" aria-hidden="true" />
                      ) : (
                        <Zap className="h-3 w-3 shrink-0" aria-hidden="true" />
                      )}
                      <span>{nutritionBadge}</span>
                    </span>

                    {/* Hero pattern: centered bold white display word behind product */}
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-x-0 top-[24%] flex items-center justify-center select-none font-sans font-bold leading-none text-white/90 transition-transform duration-500 ease-out group-hover:scale-105 ${
                        isLongWord
                          ? 'text-[15.5cqw] tracking-[-0.035em]'
                          : 'text-[25cqw] tracking-[0.04em]'
                      }`}
                    >
                      {scent.name}
                    </span>

                    {/* Floating hero botanical accents projected from Hero 1440x900 crop */}
                    {fruitPieces.map((piece, pIdx) => {
                      const bounds = computeHeroStagePlacement(
                        { x: piece.x, y: piece.y, w: piece.w, h: piece.w },
                        HERO_CARD_CROP
                      );
                      return (
                        <div
                          key={pIdx}
                          aria-hidden="true"
                          className="pointer-events-none absolute z-10 transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-110"
                          style={{
                            left: `${bounds.leftPct.toFixed(3)}%`,
                            top: `${bounds.topPct.toFixed(3)}%`,
                            width: `${bounds.widthPct.toFixed(3)}%`,
                            height: `${bounds.heightPct.toFixed(3)}%`,
                            transform: piece.mirror ? 'scaleX(-1)' : undefined,
                          }}
                        >
                          <div
                            className="piece-inner h-full w-full"
                            style={{
                              '--rot': `${piece.rot}deg`,
                              '--dur': `${3.8 + pIdx * 0.45}s`,
                              '--delay': `${-idx * 0.8 - pIdx * 0.6}s`,
                            } as React.CSSProperties}
                          >
                            <CandleVisual scent={scent} variant="botanical" className="h-full w-full" />
                          </div>
                        </div>
                      );
                    })}

                    {/* Exact Hero floor shadow projected from HERO_SHADOWS[1] */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute z-10 rounded-full blur-[5px]"
                      style={{
                        left: `${centerShadowBounds.leftPct.toFixed(3)}%`,
                        top: `${centerShadowBounds.topPct.toFixed(3)}%`,
                        width: `${centerShadowBounds.widthPct.toFixed(3)}%`,
                        height: `${centerShadowBounds.heightPct.toFixed(3)}%`,
                        background: 'radial-gradient(closest-side, rgba(60, 40, 80, 0.24), transparent)',
                      }}
                    />

                    {/* Product imagery positioned using identical Hero crop placement math */}
                    <div
                      className="pointer-events-none absolute z-20 transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                      style={{
                        left: `${candleBounds.leftPct.toFixed(3)}%`,
                        top: `${candleBounds.topPct.toFixed(3)}%`,
                        width: `${candleBounds.widthPct.toFixed(3)}%`,
                        height: `${candleBounds.heightPct.toFixed(3)}%`,
                      }}
                    >
                      <CandleVisual
                        scent={scent}
                        variant="candle"
                        alt={`${scent.name} product`}
                        className="h-full w-full"
                      />
                    </div>
                  </button>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div
                      className="text-xs font-semibold tracking-wide"
                      style={{ color: scent.accentInk }}
                    >
                      {scent.benefitLabel}
                    </div>
                    <p className="mt-1 mb-auto pb-3 text-xs font-medium leading-snug text-[#5D5368]">
                      {scent.tagline}
                    </p>

                    <div className="mt-2 flex items-baseline justify-between gap-2">
                      <h2 className="text-lg font-bold text-[#2B2233]">{scent.name}</h2>
                      <span
                        className="text-base font-bold tabular-nums"
                        style={{ color: scent.accentInk }}
                      >
                        {formatMoney(pack.price)}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-[#5D5368] tabular-nums">
                      {scent.nutrition.calories} kcal · {vitC.label} {vitC.dailyValue} · {scent.nutrition.addedSugarG} g added sugar
                    </p>

                    <div
                      className="mt-4 flex items-center gap-2.5 border-t pt-4"
                      style={{ borderColor: `${scent.accentInk}14` }}
                    >
                      <button
                        type="button"
                        onClick={() => addToCart(scent.id, selectedPack, 1, true)}
                        className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer"
                        style={{ backgroundColor: scent.accentInk }}
                      >
                        <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        Quick Add
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate({ page: 'scent', scentId: scent.id })}
                        aria-label={`Details for ${scent.name}`}
                        className="inline-flex min-h-[40px] items-center justify-center rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-opacity hover:opacity-85 whitespace-nowrap shrink-0 cursor-pointer"
                        style={{
                          backgroundColor: scent.surfaceWell,
                          color: scent.accentInk,
                        }}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </section>

        {/* Design Your Candle Studio Callout */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: LUMA_EASE }}
          className="mt-10 flex flex-col justify-between gap-5 rounded-3xl border p-5 shadow-[0_20px_50px_rgba(60,40,80,0.14)] transition-colors duration-500 sm:mt-12 sm:flex-row sm:items-center sm:p-7"
          style={{
            backgroundColor: activeScent.surface,
            borderColor: `${activeScent.accentInk}1C`,
          }}
          aria-label="Design your own custom candle"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: activeScent.accentInk }}>
              Bespoke Candle Atelier
            </p>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-[#2B2233] sm:text-3xl">
              Design your own custom candle
            </h2>
            <p className="mt-1 max-w-xl text-sm text-[#5D5368]">
              Choose your matte stoneware vessel glaze, layer botanical fragrance notes, and customize the cotton-paper label in real time.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate({ page: 'design' })}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap cursor-pointer"
            style={{ backgroundColor: activeScent.accentInk }}
          >
            Open Candle Studio
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </motion.section>

        {/* Build Your Custom Trio & Curated Add-Ons Studio */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.25, ease: LUMA_EASE }}
          className="mt-14 rounded-3xl border p-6 shadow-[0_24px_60px_rgba(60,40,80,0.16)] transition-colors duration-500 sm:p-8"
          style={{
            backgroundColor: activeScent.surface,
            borderColor: `${activeScent.accentInk}1C`,
          }}
          aria-labelledby="custom-trio-heading"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: activeScent.accentInk }}
              >
                Curated Bundle Studio
              </p>
              <h2
                id="custom-trio-heading"
                className="mt-1.5 font-display text-3xl font-extrabold text-[#2B2233] text-balance"
              >
                Build your custom trio &amp; add-ons
              </h2>
              <p className="mt-1 text-sm text-[#5D5368]">
                Choose 3 botanical blends for{' '}
                <span className="font-semibold tabular-nums" style={{ color: activeScent.accentInk }}>
                  $96.00
                </span>{' '}
                (save $12.00) and layer optional studio add-ons below.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold tabular-nums text-[#2B2233]">
                {customMix.length} / 3 blends
                {trioPricing.addonCount > 0 && ` · +${trioPricing.addonCount} add-on${trioPricing.addonCount === 1 ? '' : 's'}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setCustomMix([]);
                  setAddonCounts({});
                }}
                disabled={customMix.length === 0 && trioPricing.addonCount === 0}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40 cursor-pointer"
                style={{
                  backgroundColor: activeScent.surfaceWell,
                  color: activeScent.accentInk,
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset
              </button>
            </div>
          </div>

          {/* 3 Visual Ceramic Candle Slots */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, slotIdx) => {
              const scentId = customMix[slotIdx];
              const scent = scentId ? SCENTS.find((s) => s.id === scentId) : undefined;
              return (
                <div
                  key={slotIdx}
                  className="relative flex h-48 flex-col items-center justify-center overflow-hidden rounded-2xl border p-3 transition-colors duration-500"
                  style={
                    scent
                      ? { backgroundColor: scent.bg, borderColor: 'transparent' }
                      : {
                          backgroundColor: activeScent.surfaceWell,
                          borderColor: `${activeScent.accentInk}26`,
                          borderStyle: 'dashed',
                        }
                  }
                >
                  {scent ? (
                    <>
                      <button
                        type="button"
                        onClick={() => removeSlotFromTrio(slotIdx)}
                        aria-label={`Remove ${scent.name} from slot ${slotIdx + 1}`}
                        className="absolute right-2.5 top-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-xs hover:bg-white cursor-pointer"
                        style={{ color: scent.accentInk }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none font-sans text-4xl font-bold text-white/35"
                      >
                        {scent.name}
                      </span>
                      <motion.div
                        initial={{ scale: 0.88, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.35, ease: LUMA_EASE }}
                        className="relative z-10 h-32 w-28"
                      >
                        <CandleVisual scent={scent} variant="candle" className="h-full w-full" />
                      </motion.div>
                      <span
                        className="relative z-10 mt-1 text-xs font-bold text-white"
                        style={{ textShadow: '0 1px 6px rgba(90, 70, 40, 0.28)' }}
                      >
                        {scent.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-semibold tabular-nums" style={{ color: activeScent.accentInk }}>
                      Select Blend {slotIdx + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add-to-trio blend picker */}
          <div className="mt-5 flex flex-wrap gap-2.5">
            {SCENTS.map((scent) => (
              <button
                key={scent.id}
                type="button"
                disabled={customMix.length >= 3}
                onClick={() => {
                  setActiveScentId(scent.id);
                  addCandleToTrio(scent.id);
                }}
                className="inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-transform hover:-translate-y-0.5 disabled:opacity-40 cursor-pointer"
                style={{
                  backgroundColor: scent.surfaceWell,
                  borderColor: `${scent.accentInk}22`,
                  color: scent.accentInk,
                }}
              >
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: scent.bg }} aria-hidden="true" />
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add {scent.name}
              </button>
            ))}
          </div>

          {/* Studio Add-Ons Beyond the 3 Base Blends */}
          <div
            className="mt-7 border-t pt-6"
            style={{ borderColor: `${activeScent.accentInk}16` }}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#2B2233]">
                  Trio Studio Add-Ons (Optional)
                </h3>
                <p className="mt-0.5 text-xs text-[#5D5368]">
                  Pair your 3-vessel set with ritual care tools, extra mini tins, or a 4th bonus vessel.
                </p>
              </div>
              {trioPricing.addonsPrice > 0 && (
                <span
                  className="text-xs font-semibold tabular-nums"
                  style={{ color: activeScent.accentInk }}
                >
                  +{formatMoney(trioPricing.addonsPrice)} in add-ons
                </span>
              )}
            </div>

            <div
              className="mt-4 grid grid-cols-1 divide-y overflow-hidden rounded-2xl sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5"
              style={{
                backgroundColor: activeScent.surfaceWell,
                borderColor: `${activeScent.accentInk}16`,
              }}
            >
              {TRIO_ADDONS.map((addon) => {
                const qty = addonCounts[addon.id] ?? 0;
                const selected = qty > 0;
                return (
                  <div
                    key={addon.id}
                    data-testid={`trio-addon-${addon.id}`}
                    className="flex flex-col justify-between p-4 transition-colors duration-200"
                    style={{
                      backgroundColor: selected ? addon.accentBg : 'transparent',
                      borderColor: `${activeScent.accentInk}16`,
                    }}
                  >
                    <div>
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className="text-xs font-bold leading-snug"
                          style={{ color: selected ? addon.accentInk : '#2B2233' }}
                        >
                          {addon.name}
                        </span>
                        <span
                          className="text-xs font-bold tabular-nums shrink-0"
                          style={{ color: addon.accentInk }}
                        >
                          +{formatMoney(addon.price)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-[#554B60]">
                        {addon.subtitle}
                      </p>
                    </div>

                    <div className="mt-3.5 flex items-center justify-between">
                      {qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => stepAddon(addon.id, 1)}
                          aria-label={`Add ${addon.name} to trio`}
                          className="inline-flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold transition-opacity hover:opacity-85 cursor-pointer"
                          style={{
                            backgroundColor: `${addon.accentInk}16`,
                            color: addon.accentInk,
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          Add to Trio
                        </button>
                      ) : (
                        <div
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1"
                          style={{ backgroundColor: addon.accentInk, color: '#FFFFFF' }}
                        >
                          <button
                            type="button"
                            onClick={() => stepAddon(addon.id, -1)}
                            aria-label={`Decrease ${addon.name}`}
                            className="flex h-6 w-6 items-center justify-center rounded hover:bg-white/15 cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold tabular-nums">{qty} added</span>
                          <button
                            type="button"
                            onClick={() => stepAddon(addon.id, 1)}
                            aria-label={`Increase ${addon.name}`}
                            className="flex h-6 w-6 items-center justify-center rounded hover:bg-white/15 cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bundle Footer Summary & Checkout Trigger */}
          <div
            className="mt-6 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: `${activeScent.accentInk}16` }}
          >
            <div className="text-xs text-[#5D5368] tabular-nums">
              Base Trio (3 × 240 g):{' '}
              <span className="font-semibold text-[#2B2233]">{formatMoney(trioPricing.basePrice)}</span>
              {trioPricing.addonsPrice > 0 && (
                <>
                  {' '}
                  · Studio Add-Ons:{' '}
                  <span className="font-semibold text-[#2B2233]">{formatMoney(trioPricing.addonsPrice)}</span>
                </>
              )}
              {' '}
              · Bundle Total:{' '}
              <span className="font-bold" style={{ color: activeScent.accentInk }}>
                {formatMoney(trioPricing.totalPrice)}
              </span>
            </div>

            <button
              type="button"
              disabled={customMix.length !== 3}
              onClick={() => addCustomPackToCart(customMix, addonCounts)}
              data-testid="add-custom-trio-btn"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 whitespace-nowrap cursor-pointer"
              style={{ backgroundColor: activeScent.accentInk }}
            >
              {customMix.length === 3 ? (
                <>
                  Add Custom Trio{trioPricing.addonCount > 0 ? ` + ${trioPricing.addonCount} Add-On${trioPricing.addonCount === 1 ? '' : 's'}` : ''} · {formatMoney(trioPricing.totalPrice)}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              ) : (
                `Select ${3 - customMix.length} more blend${3 - customMix.length === 1 ? '' : 's'}`
              )}
            </button>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
