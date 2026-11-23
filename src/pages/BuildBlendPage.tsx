import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Bookmark,
  Check,
  Minus,
  Plus,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import {
  CANDLE_FONTS,
  SMOOTHIE_FRUITS,
  SMOOTHIE_SIZE_OPTIONS,
  SMOOTHIE_SWEETNESS_LEVELS,
  SMOOTHIE_TOPPINGS,
  getScentById,
  type CandleFontId,
  type SmoothieFruitId,
  type SmoothieSizeId,
  type SmoothieToppingId,
  type SweetnessLevel,
} from '../data/products';
import { useStore } from '../context/StoreContext';
import {
  computeBlendVisualColors,
  computeSmoothieNutrition,
  computeSmoothiePricing,
  formatMoney,
  summarizeCustomSmoothie,
  toggleFruitBase,
  toggleTopping,
  type CustomSmoothieBlendSpec,
} from '../utils/commerce';
import { SmoothieBlendPreview } from '../components/SmoothieBlendPreview';
import { CandleVisual } from '../components/CandleVisual';
import { BlendProgressBar } from '../components/BlendProgressBar';
import { FruitIcon } from '../components/FruitIcon';

const LUMA_EASE: [number, number, number, number] = [0.22, 0.8, 0.3, 1];

export function BuildBlendPage() {
  const {
    navigate,
    addCustomSmoothieToCart,
    user,
    emailVerified,
    savedBlends,
    saveCustomBlend,
    deleteCustomBlend,
  } = useStore();

  const [fruits, setFruits] = useState<SmoothieFruitId[]>(['strawberry', 'mango']);
  const [toppings, setToppings] = useState<SmoothieToppingId[]>(['chia']);
  const [sweetness, setSweetness] = useState<SweetnessLevel>(50);
  const [size, setSize] = useState<SmoothieSizeId>('16oz');
  const [enableTyping, setEnableTyping] = useState<boolean>(true);
  const [customText, setCustomText] = useState<string>('Morning Glow');
  const [fontId, setFontId] = useState<CandleFontId>('playfair');
  const [quantity, setQuantity] = useState<number>(1);
  const [savingBlend, setSavingBlend] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const visualColors = useMemo(() => computeBlendVisualColors(fruits), [fruits]);
  const themeScent = getScentById(visualColors.primaryScentId);
  const selectedFont = CANDLE_FONTS.find((f) => f.id === fontId) ?? CANDLE_FONTS[0];
  const selectedSweetness =
    SMOOTHIE_SWEETNESS_LEVELS.find((s) => s.level === sweetness) ?? SMOOTHIE_SWEETNESS_LEVELS[2];

  const pickedFruits = useMemo(
    () =>
      fruits
        .map((id) => SMOOTHIE_FRUITS.find((f) => f.id === id))
        .filter((f): f is (typeof SMOOTHIE_FRUITS)[number] => Boolean(f)),
    [fruits]
  );

  const pricing = useMemo(() => computeSmoothiePricing({ toppings, size }), [toppings, size]);
  const nutrition = useMemo(
    () => computeSmoothieNutrition({ fruits, toppings, sweetness, size }),
    [fruits, toppings, sweetness, size]
  );

  const currentSpec: CustomSmoothieBlendSpec = useMemo(
    () => ({
      fruits,
      toppings,
      sweetness,
      size,
      customText: enableTyping ? customText.slice(0, 28) : '',
      fontId,
      fontLabel: selectedFont.name,
    }),
    [fruits, toppings, sweetness, size, enableTyping, customText, fontId, selectedFont.name]
  );

  const handleToggleFruit = (id: SmoothieFruitId) => {
    setFruits((prev) => toggleFruitBase(prev, id));
  };

  const handleToggleTopping = (id: SmoothieToppingId) => {
    setToppings((prev) => toggleTopping(prev, id));
  };

  const handleReset = () => {
    setFruits(['strawberry', 'mango']);
    setToppings(['chia']);
    setSweetness(50);
    setSize('16oz');
    setEnableTyping(true);
    setCustomText('Morning Glow');
    setFontId('playfair');
    setQuantity(1);
    setSavedFeedback(null);
  };

  const handleSaveBlend = async () => {
    setSavedFeedback(null);
    if (fruits.length === 0) {
      setSavedFeedback('Choose at least 1 fruit base before saving.');
      return;
    }
    if (!user || !emailVerified) {
      setSavedFeedback('Verify your email on the Account page to save studio blends.');
      return;
    }
    setSavingBlend(true);
    try {
      await saveCustomBlend(currentSpec);
      setSavedFeedback('Saved to your studio.');
    } catch (err) {
      setSavedFeedback(err instanceof Error ? err.message : 'Unable to save blend.');
    } finally {
      setSavingBlend(false);
    }
  };

  const loadSavedBlend = (b: CustomSmoothieBlendSpec) => {
    setFruits(b.fruits.length > 0 ? b.fruits.slice(0, 3) : ['strawberry']);
    setToppings(b.toppings);
    setSweetness(b.sweetness);
    setSize(b.size);
    setEnableTyping(Boolean(b.customText));
    setCustomText(b.customText);
    setFontId(b.fontId);
  };

  const secondaryCornerScent = useMemo(() => {
    const lastId = fruits[fruits.length - 1];
    if (!lastId) return themeScent;
    const c = computeBlendVisualColors([lastId]);
    return getScentById(c.primaryScentId);
  }, [fruits, themeScent]);

  const handleJumpToStep = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10 lg:px-10">
      {/* Top Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b border-white/30 pb-5"
        style={{ textShadow: '0 1px 6px rgba(90, 70, 40, 0.18)' }}
      >
        <div>
          <button
            type="button"
            onClick={() => navigate({ page: 'shop' })}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/95 hover:opacity-80 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to Shop
          </button>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl text-balance">
            Build your blend
          </h1>
          <p className="mt-1 max-w-xl text-sm text-white/95">
            Select up to 3 cold-pressed fruit bases, layer nourishing toppings, and dial in your exact sweetness level with live preview &amp; macro updates.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-sm transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer"
          style={{
            backgroundColor: themeScent.surface,
            borderColor: `${visualColors.accentInk}22`,
            color: visualColors.accentInk,
            textShadow: 'none',
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reset Blend
        </button>
      </div>

      {/* Subtle Step-Indicator & Progress Bar */}
      <BlendProgressBar
        fruits={fruits}
        toppings={toppings}
        sweetness={sweetness}
        size={size}
        accentInk={visualColors.accentInk}
        surface={themeScent.surface}
        surfaceWell={themeScent.surfaceWell}
        onJumpToStep={handleJumpToStep}
      />

      {/* Main 2-Column Interactive Blend Studio */}
      <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-12 lg:items-start lg:gap-8">
        {/* Left: Sticky Live Animated Smoothie Preview & Live Macros */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: LUMA_EASE }}
          aria-label="Live custom smoothie blend preview"
          className="relative flex flex-col items-center justify-between overflow-hidden rounded-3xl border border-white/35 p-6 shadow-[0_24px_60px_rgba(60,40,80,0.16)] transition-colors duration-700 lg:sticky lg:top-24 lg:col-span-5"
          style={{
            background: `linear-gradient(155deg, ${visualColors.topHex}E8 0%, ${visualColors.midHex}D8 55%, ${visualColors.bottomHex}E8 100%)`,
          }}
        >
          {/* Subtle backdrop botanical wordmark */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[10%] text-center font-sans text-5xl font-bold tracking-tight text-white/30 select-none sm:text-7xl"
          >
            {pickedFruits[0]?.shortName ?? 'Luma'}
          </span>

          {/* Floating corner botanicals */}
          <div className="pointer-events-none absolute left-3 top-3 h-16 w-16 opacity-85 sm:left-4 sm:top-4 sm:h-20 sm:w-20">
            <div
              className="piece-inner h-full w-full"
              style={{ '--rot': '-12deg', '--dur': '4.4s', '--delay': '-0.9s' } as React.CSSProperties}
            >
              <CandleVisual scent={themeScent} variant="botanical" className="h-full w-full" />
            </div>
          </div>
          <div className="pointer-events-none absolute right-2 top-24 h-14 w-14 opacity-75 sm:right-4 sm:h-18 sm:w-18">
            <div
              className="piece-inner h-full w-full"
              style={{ '--rot': '14deg', '--dur': '4s', '--delay': '-2.1s' } as React.CSSProperties}
            >
              <CandleVisual scent={secondaryCornerScent} variant="botanical" className="h-full w-full" />
            </div>
          </div>

          <div className="relative z-20 mb-2 mt-1 w-full flex justify-center">
            <SmoothieBlendPreview
              fruits={fruits}
              toppings={toppings}
              sweetness={sweetness}
              customText={enableTyping ? customText : ''}
              fontId={fontId}
              size="lg"
            />
          </div>

          {/* Live Summary Readout */}
          <div
            data-testid="live-blend-summary"
            className="relative z-30 mt-3 flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl border px-3 py-2 text-center text-xs font-semibold shadow-sm backdrop-blur-xs"
            style={{
              backgroundColor: themeScent.surface,
              borderColor: `${visualColors.accentInk}1E`,
              color: visualColors.accentInk,
            }}
          >
            <span>
              {pickedFruits.length > 0 ? pickedFruits.map((f) => f.shortName).join(' + ') : 'Pick Fruit Base'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{sweetness}% Sweet</span>
            <span aria-hidden="true">·</span>
            <span>{SMOOTHIE_SIZE_OPTIONS[size].shortLabel}</span>
          </div>

          {/* Live Nutritional Readout Card */}
          <div
            data-testid="live-blend-nutrition"
            className="relative z-30 mt-4 w-full rounded-2xl border p-3.5 shadow-xs backdrop-blur-sm"
            style={{
              backgroundColor: themeScent.surface,
              borderColor: `${visualColors.accentInk}1C`,
            }}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#5D5368]">
              <span>Live Nutrition Profile</span>
              <span className="tabular-nums" style={{ color: visualColors.accentInk }}>
                {SMOOTHIE_SIZE_OPTIONS[size].shortLabel}
              </span>
            </div>
            <div className="mt-2.5 grid grid-cols-5 gap-1.5 text-center">
              {[
                { label: 'Kcal', val: `${nutrition.calories}` },
                { label: 'Vit C', val: `${nutrition.vitaminCDvPct}%` },
                { label: 'Fiber', val: `${nutrition.fiberG}g` },
                { label: 'Protein', val: `${nutrition.proteinG}g` },
                { label: 'Sugar', val: `${nutrition.sugarG}g` },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl px-1.5 py-2"
                  style={{ backgroundColor: themeScent.surfaceWell }}
                >
                  <div
                    className="text-sm font-extrabold tabular-nums leading-none"
                    style={{ color: visualColors.accentInk }}
                  >
                    {stat.val}
                  </div>
                  <div className="mt-1 text-[10px] font-medium text-[#5D5368]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Right: Modular Blend Controls */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.06, ease: LUMA_EASE }}
          aria-label="Smoothie blend customization controls"
          className="space-y-6 rounded-3xl border p-5 shadow-[0_24px_60px_rgba(60,40,80,0.14)] backdrop-blur-md transition-colors duration-500 sm:p-8 lg:col-span-7"
          style={{
            backgroundColor: themeScent.surface,
            borderColor: `${visualColors.accentInk}1C`,
          }}
        >
          {/* 01. Fruit Bases (Up to 3) */}
          <div id="blend-step-fruits" className="scroll-mt-24">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold text-[#2B2233]">01. Fruit Bases (Up to 3)</h2>
              <span
                data-testid="fruit-base-counter"
                className="text-xs font-semibold tabular-nums"
                style={{ color: visualColors.accentInk }}
              >
                {fruits.length} / 3 bases selected
              </span>
            </div>

            {/* Active Base Selection Strip */}
            <div className="mt-2.5 flex min-h-[34px] flex-wrap items-center gap-2">
              {pickedFruits.length === 0 ? (
                <span className="text-xs text-[#5D5368]">Pick 1 to 3 fruit bases below to start pressing your blend.</span>
              ) : (
                pickedFruits.map((f, idx) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleToggleFruit(f.id)}
                    aria-label={`Remove ${f.shortName} from blend`}
                    className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition-opacity hover:opacity-80 cursor-pointer"
                    style={{
                      backgroundColor: f.accentInk,
                      borderColor: f.accentInk,
                      color: '#FFFFFF',
                    }}
                  >
                    <FruitIcon fruitId={f.id} className="h-4 w-4 shrink-0" />
                    <span className="opacity-75 tabular-nums">{idx + 1}.</span>
                    <span>{f.shortName}</span>
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                ))
              )}
              {fruits.length >= 3 && (
                <span className="text-[11px] font-medium text-[#5D5368]">
                  Max 3 bases reached · tap any selected fruit to swap
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {SMOOTHIE_FRUITS.map((fruit) => {
                const selected = fruits.includes(fruit.id);
                const disabled = !selected && fruits.length >= 3;
                return (
                  <button
                    key={fruit.id}
                    type="button"
                    data-testid={`fruit-option-${fruit.id}`}
                    disabled={disabled}
                    onClick={() => handleToggleFruit(fruit.id)}
                    aria-pressed={selected}
                    className="flex items-start justify-between gap-3 rounded-2xl border p-3.5 text-left transition-all disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed"
                    style={
                      selected
                        ? {
                            backgroundColor: fruit.accentInk,
                            borderColor: fruit.accentInk,
                            color: '#FFFFFF',
                          }
                        : {
                            backgroundColor: themeScent.surfaceWell,
                            borderColor: `${visualColors.accentInk}1A`,
                            color: '#2B2233',
                          }
                    }
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <FruitIcon fruitId={fruit.id} className="mt-0.5 h-7 w-7 shrink-0 drop-shadow-2xs" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold sm:text-sm">{fruit.name}</div>
                        <p className={`mt-0.5 text-[11px] leading-snug ${selected ? 'text-white/85' : 'text-[#5D5368]'}`}>
                          {fruit.flavorNote}
                        </p>
                        <div
                          className={`mt-1 text-[10px] font-semibold tabular-nums ${
                            selected ? 'text-white/80' : 'text-[#5D5368]'
                          }`}
                        >
                          {fruit.vitaminCDvPct}% Vit C · {fruit.fiberG}g fiber
                        </div>
                      </div>
                    </div>
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: selected ? 'rgba(255,255,255,0.22)' : `${visualColors.accentInk}14`,
                        color: selected ? '#FFFFFF' : visualColors.accentInk,
                      }}
                    >
                      {selected ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 02. Superfood Toppings */}
          <div id="blend-step-toppings" className="border-t pt-5 scroll-mt-24" style={{ borderColor: `${visualColors.accentInk}16` }}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold text-[#2B2233]">02. Superfood Toppings</h2>
              <span className="text-xs font-semibold tabular-nums" style={{ color: visualColors.accentInk }}>
                {toppings.length === 0
                  ? 'None selected'
                  : `${toppings.length} selected · +${formatMoney(pricing.toppingsPrice)}`}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {SMOOTHIE_TOPPINGS.map((topping) => {
                const active = toppings.includes(topping.id);
                return (
                  <button
                    key={topping.id}
                    type="button"
                    data-testid={`topping-option-${topping.id}`}
                    onClick={() => handleToggleTopping(topping.id)}
                    aria-pressed={active}
                    className="flex flex-col justify-between rounded-2xl border p-3 text-left transition-colors cursor-pointer"
                    style={
                      active
                        ? {
                            backgroundColor: visualColors.accentInk,
                            borderColor: visualColors.accentInk,
                            color: '#FFFFFF',
                          }
                        : {
                            backgroundColor: themeScent.surfaceWell,
                            borderColor: `${visualColors.accentInk}1A`,
                            color: '#2B2233',
                          }
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/15"
                          style={{ backgroundColor: topping.swatchHex }}
                          aria-hidden="true"
                        />
                        <span className="truncate text-xs font-bold">{topping.shortName}</span>
                      </div>
                      <span className="shrink-0 text-xs font-bold tabular-nums">
                        +{formatMoney(topping.price)}
                      </span>
                    </div>
                    <div className={`mt-1.5 text-[11px] leading-snug ${active ? 'text-white/85' : 'text-[#5D5368]'}`}>
                      {topping.detail}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 03. Sweetness Level */}
          <div id="blend-step-sweetness" className="border-t pt-5 scroll-mt-24" style={{ borderColor: `${visualColors.accentInk}16` }}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold text-[#2B2233]">03. Sweetness Level</h2>
              <span className="text-xs font-semibold tabular-nums" style={{ color: visualColors.accentInk }}>
                {selectedSweetness.label} · {selectedSweetness.description} (+{selectedSweetness.addedSugarG}g added sugar)
              </span>
            </div>

            <div
              className="mt-3 grid grid-cols-5 gap-1 rounded-2xl border p-1.5"
              style={{
                backgroundColor: themeScent.surfaceWell,
                borderColor: `${visualColors.accentInk}20`,
              }}
              role="radiogroup"
              aria-label="Smoothie sweetness level"
            >
              {SMOOTHIE_SWEETNESS_LEVELS.map((opt) => {
                const active = sweetness === opt.level;
                return (
                  <button
                    key={opt.level}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    data-testid={`sweetness-option-${opt.level}`}
                    onClick={() => setSweetness(opt.level)}
                    className={`relative rounded-xl py-2.5 text-center text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                      active ? 'text-white' : 'text-[#5D5368] hover:text-[#2B2233]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="smoothieSweetnessHighlight"
                        transition={{ duration: 0.35, ease: LUMA_EASE }}
                        className="absolute inset-0 rounded-xl"
                        style={{ backgroundColor: visualColors.accentInk }}
                      />
                    )}
                    <span className="relative z-10">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 04. Cup Label & Font (Optional) */}
          <div className="border-t pt-5" style={{ borderColor: `${visualColors.accentInk}16` }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4" style={{ color: visualColors.accentInk }} aria-hidden="true" />
                <h2 className="text-sm font-bold text-[#2B2233]">04. Custom Cup Name &amp; Typography</h2>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={enableTyping}
                onClick={() => setEnableTyping((v) => !v)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                style={
                  enableTyping
                    ? { backgroundColor: visualColors.accentInk, color: '#FFFFFF' }
                    : { backgroundColor: themeScent.surfaceWell, color: '#5D5368' }
                }
              >
                {enableTyping ? 'Custom Label: On' : 'Add Cup Name'}
              </button>
            </div>

            {enableTyping && (
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="custom-blend-name" className="text-xs font-semibold text-[#2B2233]">
                      Blend Name on Cup
                    </label>
                    <span className="text-[11px] tabular-nums text-[#5D5368]">{customText.length}/28</span>
                  </div>
                  <input
                    id="custom-blend-name"
                    type="text"
                    maxLength={28}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="e.g. Morning Glow"
                    style={{
                      backgroundColor: themeScent.surfaceWell,
                      borderColor: `${visualColors.accentInk}22`,
                    }}
                    className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2B2233] focus:outline-none"
                  />
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[#2B2233]">Choose Typography</span>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {CANDLE_FONTS.map((f) => {
                      const active = fontId === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFontId(f.id)}
                          aria-pressed={active}
                          className="relative flex flex-col items-start rounded-2xl border p-2.5 text-left transition-colors cursor-pointer"
                          style={
                            active
                              ? {
                                  backgroundColor: visualColors.accentInk,
                                  borderColor: visualColors.accentInk,
                                  color: '#FFFFFF',
                                }
                              : {
                                  backgroundColor: themeScent.surfaceWell,
                                  borderColor: `${visualColors.accentInk}1E`,
                                  color: '#2B2233',
                                }
                          }
                        >
                          <span
                            className="text-sm font-bold leading-tight"
                            style={{
                              fontFamily: f.fontFamily,
                              letterSpacing: f.letterSpacing ?? 'normal',
                              textTransform: f.textTransform ?? 'none',
                            }}
                          >
                            {f.name}
                          </span>
                          <span className={`mt-0.5 text-[10px] ${active ? 'text-white/80' : 'text-[#5D5368]'}`}>
                            {f.styleTag}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 05. Cup Size & Add to Cart */}
          <div className="border-t pt-5" style={{ borderColor: `${visualColors.accentInk}16` }}>
            <div className="grid grid-cols-3 gap-2">
              {(['12oz', '16oz', 'pack3'] as SmoothieSizeId[]).map((sKey) => {
                const opt = SMOOTHIE_SIZE_OPTIONS[sKey];
                const active = size === sKey;
                return (
                  <button
                    key={sKey}
                    type="button"
                    data-testid={`size-option-${sKey}`}
                    onClick={() => setSize(sKey)}
                    className="flex flex-col items-start rounded-2xl border p-3 text-left transition-colors cursor-pointer"
                    style={
                      active
                        ? {
                            backgroundColor: visualColors.accentInk,
                            borderColor: visualColors.accentInk,
                            color: '#FFFFFF',
                          }
                        : {
                            backgroundColor: themeScent.surfaceWell,
                            borderColor: `${visualColors.accentInk}1C`,
                            color: '#2B2233',
                          }
                    }
                  >
                    <span className="text-xs font-bold sm:text-sm">{opt.shortLabel}</span>
                    <span className={`mt-0.5 text-xs tabular-nums ${active ? 'text-white/85' : 'text-[#5D5368]'}`}>
                      {formatMoney(opt.price)}
                    </span>
                    {opt.savings && (
                      <span
                        className="mt-0.5 text-[11px] font-semibold"
                        style={{ color: active ? '#F3DA8A' : visualColors.accentInk }}
                      >
                        {opt.savings}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div
                className="inline-flex items-center justify-between rounded-xl border px-2 py-1 sm:w-36"
                style={{
                  backgroundColor: themeScent.surfaceWell,
                  borderColor: `${visualColors.accentInk}22`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease blend quantity"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-[#2B2233] hover:bg-black/5 cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold tabular-nums" style={{ color: visualColors.accentInk }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(12, q + 1))}
                  aria-label="Increase blend quantity"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-[#2B2233] hover:bg-black/5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                data-testid="add-custom-blend-btn"
                disabled={fruits.length === 0}
                onClick={() => addCustomSmoothieToCart(currentSpec, quantity, true)}
                className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-45 cursor-pointer"
                style={{ backgroundColor: visualColors.accentInk }}
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                {fruits.length === 0
                  ? 'Select at least 1 fruit base'
                  : `Add Blend to Cart · ${formatMoney(pricing.unitPrice * quantity)}`}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                disabled={savingBlend || fruits.length === 0}
                onClick={handleSaveBlend}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-85 disabled:opacity-50 cursor-pointer"
                style={{
                  backgroundColor: themeScent.surfaceWell,
                  color: visualColors.accentInk,
                }}
              >
                <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                {savingBlend ? 'Saving...' : 'Save Blend to Studio'}
              </button>

              {savedFeedback && (
                <span className="text-xs font-medium" style={{ color: visualColors.accentInk }}>
                  {savedFeedback}
                </span>
              )}
            </div>
          </div>

          {/* Saved Studio Blends (if any) */}
          {savedBlends.length > 0 && (
            <div className="border-t pt-5" style={{ borderColor: `${visualColors.accentInk}16` }}>
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5D5368]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Your Saved Blend Recipes
              </h3>
              <ul className="mt-2.5 space-y-2">
                {savedBlends.map((b) => {
                  const swatch = computeBlendVisualColors(b.fruits);
                  return (
                    <li
                      key={b.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5"
                      style={{
                        backgroundColor: themeScent.surfaceWell,
                        borderColor: `${visualColors.accentInk}18`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => loadSavedBlend(b)}
                        className="flex flex-1 items-center gap-2.5 text-left min-w-0 cursor-pointer"
                      >
                        <span
                          className="h-5 w-5 shrink-0 rounded-full border border-black/15"
                          style={{ background: `linear-gradient(135deg, ${swatch.topHex}, ${swatch.bottomHex})` }}
                        />
                        <span className="truncate text-xs font-semibold text-[#2B2233]">
                          {summarizeCustomSmoothie(b)}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCustomBlend(b.id)}
                        aria-label={`Delete saved blend ${b.customText || b.id}`}
                        className="p-1 text-[#5D5368] hover:text-[#2B2233] cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
