import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Check, Citrus, Minus, Plus, ShoppingBag, Zap } from 'lucide-react';
import {
  LAYER_PARALLAX_FACTORS,
  OLD_SLIDE_DRIFT_FACTOR,
  WIPE_DURATION_MS,
  coverAt,
  incomingProgress,
} from '../blendyMath';
import { PACK_PRICING, SCENTS, getScentById, type PackSize, type ScentId } from '../data/products';
import { useStore } from '../context/StoreContext';
import { formatMoney, getNutritionHighlightBadge } from '../utils/commerce';
import { CandleVisual } from '../components/CandleVisual';

const LUMA_EASE: [number, number, number, number] = [0.22, 0.8, 0.3, 1];

export function ScentDetailPage({ scentId }: { scentId: ScentId }) {
  const { navigate, addToCart } = useStore();
  const scent = getScentById(scentId);
  const [packSize, setPackSize] = useState<PackSize>(3);
  const [quantity, setQuantity] = useState(1);

  const pack = PACK_PRICING[packSize];
  const packSizes: PackSize[] = [1, 3, 6];
  const nutritionBadge = getNutritionHighlightBadge(scent);

  // Mirror Hero's signature 970ms smoothstep wipe + parallax inside the PDP showcase stage
  const stageRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const layerRefs = useRef<
    Record<number, { word: HTMLDivElement | null; candle: HTMLDivElement | null; botanical: HTMLDivElement | null }>
  >(
    Object.fromEntries(SCENTS.map((_, i) => [i, { word: null, candle: null, botanical: null }]))
  );
  const activeIdx = Math.max(
    0,
    SCENTS.findIndex((s) => s.id === scent.id)
  );
  const prevIdxRef = useRef(activeIdx);
  const initialIdxRef = useRef(activeIdx);
  const rafRef = useRef<number | null>(null);

  const clearLayers = useCallback((idx: number) => {
    const slide = slideRefs.current[idx];
    if (slide) slide.style.clipPath = '';
    const map = layerRefs.current[idx];
    if (map) {
      if (map.word) map.word.style.transform = '';
      if (map.candle) map.candle.style.transform = '';
      if (map.botanical) map.botanical.style.transform = '';
    }
  }, []);

  useEffect(() => {
    const fromIdx = prevIdxRef.current;
    const targetIdx = activeIdx;
    if (fromIdx === targetIdx) return;
    prevIdxRef.current = targetIdx;

    const slideA = slideRefs.current[fromIdx];
    const slideB = slideRefs.current[targetIdx];
    if (!slideA || !slideB) return;

    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const dir: 1 | -1 = targetIdx > fromIdx ? 1 : -1;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      slideRefs.current.forEach((sec, i) => {
        if (!sec) return;
        const active = i === targetIdx;
        sec.classList.remove('is-incoming', 'is-outgoing');
        sec.classList.toggle('is-active', active);
        clearLayers(i);
      });
      return;
    }

    const stageW = stageRef.current?.clientWidth || 560;
    const layersA = layerRefs.current[fromIdx];
    const layersB = layerRefs.current[targetIdx];

    if (layersB?.word) layersB.word.style.transform = `translateX(${dir * LAYER_PARALLAX_FACTORS.word * stageW}px)`;
    if (layersB?.candle) layersB.candle.style.transform = `translateX(${dir * LAYER_PARALLAX_FACTORS.bottle * stageW}px)`;
    if (layersB?.botanical) layersB.botanical.style.transform = `translateX(${dir * LAYER_PARALLAX_FACTORS.fruit * stageW}px)`;

    slideB.classList.remove('is-active', 'is-outgoing');
    slideB.classList.add('is-incoming');

    slideA.classList.remove('is-active', 'is-incoming');
    slideA.classList.add('is-outgoing');

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = elapsed / WIPE_DURATION_MS;
      const c = coverAt(Math.min(t, 1));
      const k = incomingProgress(t);

      slideA.style.clipPath =
        dir === 1
          ? `inset(0 ${(c * 100).toFixed(4)}% 0 0)`
          : `inset(0 0 0 ${(c * 100).toFixed(4)}%)`;

      const driftX = -dir * c * OLD_SLIDE_DRIFT_FACTOR * stageW;
      if (layersA?.word) layersA.word.style.transform = `translateX(${driftX}px)`;
      if (layersA?.candle) layersA.candle.style.transform = `translateX(${driftX}px)`;
      if (layersA?.botanical) layersA.botanical.style.transform = `translateX(${driftX}px)`;

      if (layersB?.word) layersB.word.style.transform = `translateX(${dir * (1 - k) * LAYER_PARALLAX_FACTORS.word * stageW}px)`;
      if (layersB?.candle) layersB.candle.style.transform = `translateX(${dir * (1 - k) * LAYER_PARALLAX_FACTORS.bottle * stageW}px)`;
      if (layersB?.botanical) layersB.botanical.style.transform = `translateX(${dir * (1 - k) * LAYER_PARALLAX_FACTORS.fruit * stageW}px)`;

      if (t >= 1 && k >= 1) {
        slideRefs.current.forEach((sec, i) => {
          if (!sec) return;
          const active = i === targetIdx;
          sec.classList.remove('is-incoming', 'is-outgoing');
          sec.classList.toggle('is-active', active);
          clearLayers(i);
        });
        rafRef.current = null;
        return;
      }

      rafRef.current = window.requestAnimationFrame(step);
    };

    rafRef.current = window.requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [activeIdx, clearLayers]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-10 sm:py-10">
      {/* Top breadcrumb + quick scent switcher */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 border-b border-white/30 pb-5"
        style={{ textShadow: '0 1px 6px rgba(90, 70, 40, 0.18)' }}
      >
        <button
          type="button"
          onClick={() => navigate({ page: 'shop' })}
          className="inline-flex items-center gap-2 text-sm font-medium text-white hover:opacity-80 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Shop
        </button>

        <div className="flex flex-wrap items-center gap-2" role="navigation" aria-label="Switch candle scent">
          {SCENTS.map((s) => {
            const active = s.id === scent.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => navigate({ page: 'scent', scentId: s.id })}
                aria-current={active ? 'page' : undefined}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'shadow-md'
                    : 'bg-white/20 text-white hover:bg-white/35 backdrop-blur-xs'
                }`}
                style={
                  active
                    ? { backgroundColor: s.surface, color: s.accentInk, textShadow: 'none' }
                    : undefined
                }
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-column PDP */}
      <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-start">
        {/* Left: Pastel Product Showcase with exact 970ms Hero wipe + parallax + bobbing botanicals */}
        <div
          ref={stageRef}
          className="relative min-h-[300px] overflow-hidden rounded-3xl border border-white/35 shadow-[0_24px_60px_rgba(60,40,80,0.16)] sm:min-h-[400px] lg:sticky lg:top-28 lg:col-span-6 lg:min-h-[560px]"
        >
          {SCENTS.map((item, idx) => {
            const isCurrent = idx === activeIdx;
            const isLongWord = item.name.length > 5;
            return (
              <div
                key={item.id}
                ref={(el) => {
                  slideRefs.current[idx] = el;
                }}
                className={`slide${idx === initialIdxRef.current ? ' is-active' : ''}`}
                style={{ backgroundColor: item.bg }}
                aria-hidden={!isCurrent}
              >
                {/* Background giant white word */}
                <div
                  ref={(el) => {
                    layerRefs.current[idx].word = el;
                  }}
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                >
                  <span
                    aria-hidden="true"
                    className={`select-none font-sans font-bold text-white/95 leading-none ${
                      isLongWord
                        ? 'text-[52px] tracking-[-0.035em] sm:text-8xl'
                        : 'text-[88px] tracking-[0.005em] sm:text-[132px]'
                    }`}
                  >
                    {item.name}
                  </span>
                </div>

                {/* Bobbing botanical corners */}
                <div
                  ref={(el) => {
                    layerRefs.current[idx].botanical = el;
                  }}
                  className="pointer-events-none absolute inset-0"
                >
                  <div className="absolute left-4 top-4 h-24 w-24 sm:left-6 sm:top-6 sm:h-28 sm:w-28">
                    <div
                      className="piece-inner h-full w-full"
                      style={{ '--rot': '-10deg', '--dur': '4.2s', '--delay': '-1.1s' } as React.CSSProperties}
                    >
                      <CandleVisual scent={item} variant="botanical" className="h-full w-full" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4 h-28 w-28 sm:bottom-6 sm:right-6 sm:h-32 sm:w-32">
                    <div
                      className="piece-inner h-full w-full"
                      style={{ '--rot': '14deg', '--dur': '3.8s', '--delay': '-2.3s' } as React.CSSProperties}
                    >
                      <CandleVisual scent={item} variant="botanical" className="h-full w-full" />
                    </div>
                  </div>
                </div>

                {/* Centered candle vessel */}
                <div
                  ref={(el) => {
                    layerRefs.current[idx].candle = el;
                  }}
                  className="relative z-10 flex h-full min-h-[300px] items-center justify-center p-4 sm:min-h-[400px] sm:p-6 lg:min-h-[560px]"
                >
                  <div className="h-[220px] w-[210px] sm:h-[290px] sm:w-[280px] lg:h-[330px] lg:w-[320px]">
                    <CandleVisual
                      scent={item}
                      variant="candle"
                      alt={isCurrent ? `${item.name} ceramic candle` : undefined}
                      className="h-full w-full"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Contiguous Botanical-Tinted Purchase & Nutrition Module */}
        <motion.div
          key={scent.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: LUMA_EASE }}
          className="space-y-6 lg:col-span-6"
        >
          <div
            className="rounded-3xl border p-6 shadow-[0_24px_60px_rgba(60,40,80,0.14)] backdrop-blur-md sm:p-8"
            style={{
              backgroundColor: scent.surface,
              borderColor: `${scent.accentInk}1C`,
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-[#5D5368]">{scent.specs.join(' · ')}</p>
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: scent.accentInk }}
              >
                {nutritionBadge === 'High Vitamin C' ? (
                  <Citrus className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {nutritionBadge}
              </span>
            </div>

            <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-[#2B2233]">
              {scent.name} Candle
            </h1>
            <p className="mt-1 text-sm font-medium text-[#5D5368]">{scent.tagline}</p>

            <div className="mt-4 flex items-baseline gap-3">
              <span
                className="text-3xl font-bold tabular-nums"
                style={{ color: scent.accentInk }}
              >
                {formatMoney(pack.price * quantity)}
              </span>
              <span className="text-sm text-[#5D5368] tabular-nums">{formatMoney(pack.perCandle)} / vessel</span>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-[#5D5368]">{scent.description}</p>

            {/* Pack Size Selector */}
            <div className="mt-7">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#5D5368]">
                Select Set Size
              </label>
              <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                {packSizes.map((size) => {
                  const p = PACK_PRICING[size];
                  const active = packSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setPackSize(size)}
                      className="relative flex flex-col items-start rounded-2xl border p-3.5 text-left transition-colors cursor-pointer"
                      style={
                        active
                          ? {
                              backgroundColor: scent.accentInk,
                              borderColor: scent.accentInk,
                              color: '#FFFFFF',
                            }
                          : {
                              backgroundColor: scent.surfaceWell,
                              borderColor: `${scent.accentInk}1A`,
                              color: '#2B2233',
                            }
                      }
                    >
                      <span className="text-sm font-semibold">
                        {size === 1 ? 'Single' : size === 3 ? 'Trio Set' : 'Studio 6'}
                      </span>
                      <span className={`mt-0.5 text-xs tabular-nums ${active ? 'text-white/85' : 'text-[#5D5368]'}`}>
                        {formatMoney(p.price)}
                      </span>
                      {p.savings && (
                        <span
                          className="mt-1 text-[11px] font-semibold"
                          style={{ color: active ? '#F3DA8A' : scent.accentInk }}
                        >
                          {p.savings}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity + Add to Cart */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div
                className="inline-flex items-center justify-between rounded-xl border px-2 py-1 sm:w-36"
                style={{
                  backgroundColor: scent.surfaceWell,
                  borderColor: `${scent.accentInk}22`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-[#2B2233] hover:bg-black/5 cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold tabular-nums" style={{ color: scent.accentInk }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(12, q + 1))}
                  aria-label="Increase quantity"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-[#2B2233] hover:bg-black/5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => addToCart(scent.id, packSize, quantity, true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: scent.accentInk }}
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                Add to Cart · {formatMoney(pack.price * quantity)}
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#5D5368]">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" style={{ color: scent.accentInk }} aria-hidden="true" />
                100% phthalate-free botanical oils
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" style={{ color: scent.accentInk }} aria-hidden="true" />
                Free shipping over $75.00
              </span>
            </div>
          </div>

          {/* Grid-Based Nutrition Facts — Flat Hairline Grid (No Cards-Within-Cards) */}
          <section
            data-testid="nutrition-facts-section"
            aria-labelledby="nutrition-facts-heading"
            className="scroll-mt-24 overflow-hidden rounded-3xl border shadow-[0_20px_50px_rgba(60,40,80,0.12)] backdrop-blur-md"
            style={{
              backgroundColor: scent.surface,
              borderColor: `${scent.accentInk}1C`,
            }}
          >
            <div
              className="flex flex-wrap items-baseline justify-between gap-2 px-6 py-4 sm:px-8"
              style={{ backgroundColor: scent.bg, color: scent.accentInk }}
            >
              <div>
                <h2 id="nutrition-facts-heading" className="font-display text-2xl font-extrabold tracking-tight">
                  Nutrition Facts
                </h2>
                <p className="text-xs font-semibold opacity-90">{scent.benefitLabel}</p>
              </div>
              <span className="text-xs font-semibold tabular-nums">
                Serving Size · {scent.nutrition.servingSize}
              </span>
            </div>

            <div className="p-6 sm:p-8">
              {/* Primary 3-column Highlight Strip (Unified Hairline Grid) */}
              <dl
                className="grid grid-cols-1 divide-y overflow-hidden rounded-2xl sm:grid-cols-3 sm:divide-x sm:divide-y-0"
                style={{
                  backgroundColor: scent.surfaceWell,
                  borderColor: `${scent.accentInk}1A`,
                }}
              >
                <div className="p-4" style={{ borderColor: `${scent.accentInk}1A` }}>
                  <dt className="text-xs font-semibold" style={{ color: scent.accentInk }}>
                    Calories
                  </dt>
                  <dd className="mt-1.5 text-2xl font-extrabold tabular-nums text-[#2B2233]">
                    {scent.nutrition.calories} <span className="text-sm font-semibold text-[#554B60]">kcal</span>
                  </dd>
                  <dd className="mt-0.5 text-[11px] font-medium tabular-nums text-[#554B60]">
                    {scent.nutrition.caloriesDv} daily intake
                  </dd>
                </div>

                <div className="p-4" style={{ borderColor: `${scent.accentInk}1A` }}>
                  <dt className="text-xs font-semibold" style={{ color: scent.accentInk }}>
                    Sugar Content
                  </dt>
                  <dd className="mt-1.5 text-2xl font-extrabold tabular-nums text-[#2B2233]">
                    {scent.nutrition.totalSugarG} g
                  </dd>
                  <dd className="mt-0.5 text-[11px] font-medium tabular-nums text-[#554B60]">
                    {scent.nutrition.addedSugarG} g added sugar
                  </dd>
                </div>

                <div className="p-4" style={{ borderColor: `${scent.accentInk}1A` }}>
                  <dt className="text-xs font-semibold" style={{ color: scent.accentInk }}>
                    {scent.nutrition.vitamins[0].label}
                  </dt>
                  <dd className="mt-1.5 text-2xl font-extrabold tabular-nums text-[#2B2233]">
                    {scent.nutrition.vitamins[0].amount}
                  </dd>
                  <dd className="mt-0.5 text-[11px] font-medium tabular-nums text-[#554B60]">
                    {scent.nutrition.vitamins[0].dailyValue}
                  </dd>
                </div>
              </dl>

              {/* Vitamins & Micronutrient CSS Grid */}
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5D5368]">
                  Vitamins &amp; Botanical Profile
                </h3>
                <dl
                  className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 border-t pt-4 sm:grid-cols-3"
                  style={{ borderColor: `${scent.accentInk}18` }}
                >
                  {scent.nutrition.vitamins.slice(1).map((vit) => (
                    <div key={vit.label}>
                      <dt className="text-[11px] font-semibold" style={{ color: scent.accentInk }}>
                        {vit.label}
                      </dt>
                      <dd className="mt-0.5 flex items-baseline justify-between gap-2">
                        <span className="text-sm font-bold tabular-nums text-[#2B2233]">{vit.amount}</span>
                        <span className="text-[11px] font-medium tabular-nums text-[#5D5368]">{vit.dailyValue}</span>
                      </dd>
                    </div>
                  ))}
                  <div>
                    <dt className="text-[11px] font-semibold" style={{ color: scent.accentInk }}>
                      Dietary Fiber
                    </dt>
                    <dd className="mt-0.5 flex items-baseline justify-between gap-2">
                      <span className="text-sm font-bold tabular-nums text-[#2B2233]">
                        {scent.nutrition.dietaryFiberG} g
                      </span>
                      <span className="text-[11px] font-medium tabular-nums text-[#5D5368]">14% DV</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold" style={{ color: scent.accentInk }}>
                      Potassium
                    </dt>
                    <dd className="mt-0.5 flex items-baseline justify-between gap-2">
                      <span className="text-sm font-bold tabular-nums text-[#2B2233]">
                        {scent.nutrition.potassiumMg} mg
                      </span>
                      <span className="text-[11px] font-medium tabular-nums text-[#5D5368]">8% DV</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold" style={{ color: scent.accentInk }}>
                      Protein
                    </dt>
                    <dd className="mt-0.5 flex items-baseline justify-between gap-2">
                      <span className="text-sm font-bold tabular-nums text-[#2B2233]">
                        {scent.nutrition.proteinG} g
                      </span>
                      <span className="text-[11px] font-medium tabular-nums text-[#5D5368]">Plant</span>
                    </dd>
                  </div>
                </dl>
              </div>

              <p
                className="mt-5 border-t pt-4 text-xs text-[#5D5368] tabular-nums"
                style={{ borderColor: `${scent.accentInk}18` }}
              >
                0 g refined sugar · Cold-pressed botanicals · Percent Daily Values based on a 2,000 calorie diet
              </p>
            </div>
          </section>

          {/* Fragrance Pyramid & Burn Specs */}
          <div
            className="rounded-3xl border p-6 shadow-[0_20px_50px_rgba(60,40,80,0.12)] backdrop-blur-md sm:p-8"
            style={{
              backgroundColor: scent.surface,
              borderColor: `${scent.accentInk}1C`,
            }}
          >
            <h2 className="text-base font-bold" style={{ color: scent.accentInk }}>
              Botanical Notes
            </h2>
            <dl
              className="mt-3 divide-y text-sm"
              style={{ borderColor: `${scent.accentInk}18` }}
            >
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-[#5D5368] shrink-0">Top Notes</dt>
                <dd className="font-semibold text-[#2B2233] text-right">{scent.notes.top}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-[#5D5368] shrink-0">Heart Notes</dt>
                <dd className="font-semibold text-[#2B2233] text-right">{scent.notes.heart}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-[#5D5368] shrink-0">Base Notes</dt>
                <dd className="font-semibold text-[#2B2233] text-right">{scent.notes.base}</dd>
              </div>
            </dl>

            <h2 className="mt-7 text-base font-bold" style={{ color: scent.accentInk }}>
              Vessel &amp; Studio Specs
            </h2>
            <dl
              className="mt-3 grid grid-cols-2 divide-x divide-y overflow-hidden rounded-2xl sm:grid-cols-4 sm:divide-y-0"
              style={{
                backgroundColor: scent.surfaceWell,
                borderColor: `${scent.accentInk}1A`,
              }}
            >
              <div className="p-3" style={{ borderColor: `${scent.accentInk}1A` }}>
                <dt className="text-[11px] text-[#554B60]">Burn Time</dt>
                <dd className="mt-1 text-base font-bold tabular-nums text-[#2B2233]">{scent.details.burnTimeHrs} hrs</dd>
              </div>
              <div className="p-3" style={{ borderColor: `${scent.accentInk}1A` }}>
                <dt className="text-[11px] text-[#554B60]">Net Weight</dt>
                <dd className="mt-1 text-base font-bold tabular-nums text-[#2B2233]">{scent.details.waxWeightG} g</dd>
              </div>
              <div className="p-3" style={{ borderColor: `${scent.accentInk}1A` }}>
                <dt className="text-[11px] text-[#554B60]">Profile</dt>
                <dd className="mt-1 text-sm font-bold text-[#2B2233]">{scent.details.intensity.split(' · ')[0]}</dd>
              </div>
              <div className="p-3" style={{ borderColor: `${scent.accentInk}1A` }}>
                <dt className="text-[11px] text-[#554B60]">Wick</dt>
                <dd className="mt-1 text-sm font-bold text-[#2B2233]">
                  {scent.details.wick.includes('Cedar') ? 'Cedar' : 'Cotton'}
                </dd>
              </div>
            </dl>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
