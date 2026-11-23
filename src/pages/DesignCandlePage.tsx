import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Bookmark,
  Check,
  Flame,
  FlameKindling,
  Minus,
  Palette,
  RotateCcw,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import {
  CANDLE_FONTS,
  CANDLE_INKS,
  CUSTOM_CANDLE_PRICING,
  SCENTS,
  VESSEL_COLORS,
  getScentById,
  type CandleFontId,
  type CandleInkId,
  type PackSize,
  type ScentId,
} from '../data/products';
import { useStore, type SavedDesignRecord } from '../context/StoreContext';
import { formatMoney, type CustomCandleSpec } from '../utils/commerce';
import { BespokeCandlePreview, isHexColorDark } from '../components/BespokeCandlePreview';
import { CandleVisual } from '../components/CandleVisual';

const LUMA_EASE: [number, number, number, number] = [0.22, 0.8, 0.3, 1];
const PACK_SIZES: PackSize[] = [1, 3, 6];

export function DesignCandlePage() {
  const {
    activeScentId,
    setActiveScentId,
    navigate,
    addCustomCandleToCart,
    saveCustomDesign,
    deleteCustomDesign,
    savedDesigns,
    firebaseUser,
    emailVerified,
    setAuthReturnRoute,
    setFlowNotice,
  } = useStore();

  const [vesselColorId, setVesselColorId] = useState<string>('ivory');
  const [customHex, setCustomHex] = useState<string>('#E8DFD5');
  const [scentId, setScentId] = useState<ScentId>(activeScentId);
  const [secondaryScentId, setSecondaryScentId] = useState<ScentId | undefined>(undefined);
  const [customText, setCustomText] = useState<string>('Evening Ritual');
  const [customSubtext, setCustomSubtext] = useState<string>('');
  const [fontId, setFontId] = useState<CandleFontId>('cormorant');
  const [inkId, setInkId] = useState<CandleInkId>('charcoal');
  const [lit, setLit] = useState<boolean>(true);
  const [packSize, setPackSize] = useState<PackSize>(1);
  const [quantity, setQuantity] = useState<number>(1);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const primaryScent = getScentById(scentId);
  const secondaryScent =
    secondaryScentId && secondaryScentId !== scentId ? getScentById(secondaryScentId) : undefined;

  const selectedPresetVessel = VESSEL_COLORS.find((v) => v.id === vesselColorId);
  const vesselColorHex = selectedPresetVessel ? selectedPresetVessel.hex : customHex;
  const vesselColorName = selectedPresetVessel ? selectedPresetVessel.name : 'Custom Kiln Glaze';
  const isDarkVessel = selectedPresetVessel?.isDark ?? isHexColorDark(vesselColorHex);

  const fontOpt = CANDLE_FONTS.find((f) => f.id === fontId) ?? CANDLE_FONTS[0];
  const inkOpt = CANDLE_INKS.find((i) => i.id === inkId) ?? CANDLE_INKS[0];
  const resolvedInkHex = inkId === 'botanical' ? primaryScent.accentInk : inkOpt.hex;

  const currentSpec: CustomCandleSpec = useMemo(
    () => ({
      vesselColorId,
      vesselColorName,
      vesselColorHex,
      scentId,
      secondaryScentId,
      customText,
      customSubtext,
      fontId,
      fontLabel: fontOpt.name,
      inkId,
      inkHex: resolvedInkHex,
    }),
    [
      vesselColorId,
      vesselColorName,
      vesselColorHex,
      scentId,
      secondaryScentId,
      customText,
      customSubtext,
      fontId,
      fontOpt.name,
      inkId,
      resolvedInkHex,
    ]
  );

  const pricing = CUSTOM_CANDLE_PRICING[packSize];
  const lineTotal = pricing.price * quantity;

  const handleSelectPrimaryScent = (nextId: ScentId) => {
    setScentId(nextId);
    setActiveScentId(nextId);
    if (secondaryScentId === nextId) {
      setSecondaryScentId(undefined);
    }
  };

  const handleReset = () => {
    setVesselColorId('ivory');
    setScentId('iris');
    setActiveScentId('iris');
    setSecondaryScentId(undefined);
    setCustomText('Evening Ritual');
    setCustomSubtext('');
    setFontId('cormorant');
    setInkId('charcoal');
    setLit(true);
    setPackSize(1);
    setQuantity(1);
    setSaveMessage(null);
  };

  const handleAddToCart = () => {
    addCustomCandleToCart(currentSpec, packSize, quantity, true);
  };

  const handleSaveDesign = async () => {
    setSaveMessage(null);
    if (!firebaseUser || !emailVerified) {
      setAuthReturnRoute({ page: 'design' });
      setFlowNotice(
        firebaseUser && !emailVerified
          ? 'Verify your email to save bespoke candle formulas to your studio.'
          : 'Sign in or register to save bespoke candle designs to your Luma Studio.'
      );
      navigate({ page: 'register' });
      return;
    }

    setSaving(true);
    try {
      await saveCustomDesign(currentSpec);
      setSaveMessage('Saved to your Luma Studio presets below.');
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Unable to save design.');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadDesign = (design: SavedDesignRecord) => {
    const matchedVessel = VESSEL_COLORS.find((v) => v.id === design.vesselColorId);
    if (matchedVessel) {
      setVesselColorId(matchedVessel.id);
    } else {
      setVesselColorId('custom');
      setCustomHex(design.vesselColorHex || '#E8DFD5');
    }
    setScentId(design.scentId);
    setActiveScentId(design.scentId);
    setSecondaryScentId(undefined);
    setCustomText(design.customText || '');
    setCustomSubtext(design.customSubtext || '');
    setFontId(design.fontId);
    setInkId(design.inkId);
    setSaveMessage(`Loaded "${design.customText || getScentById(design.scentId).name}"`);
  };

  const stageBackground = secondaryScent
    ? `linear-gradient(135deg, ${primaryScent.bg} 0%, ${secondaryScent.bg} 100%)`
    : primaryScent.bg;

  const isLongWord = primaryScent.name.length > 5;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-10 sm:py-10">
      {/* Top Breadcrumb & Quick Actions */}
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

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/18 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-xs hover:bg-white/28 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset Studio
          </button>
        </div>
      </div>

      {/* Main Two-Column Bespoke Studio */}
      <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left Sticky Stage: Photorealistic Candle Showcase */}
        <motion.section
          data-testid="design-candle-stage"
          aria-label="Live bespoke candle preview"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: LUMA_EASE }}
          className="relative flex min-h-[430px] flex-col justify-between overflow-hidden rounded-3xl border border-white/35 shadow-[0_24px_60px_rgba(60,40,80,0.16)] transition-all duration-700 sm:min-h-[540px] lg:sticky lg:top-24 lg:col-span-6 lg:min-h-[600px]"
          style={{ background: stageBackground }}
        >
          {/* Giant Crisp White Editorial Wordmark Behind Candle (matching Hero & PDP) */}
          <div className="pointer-events-none -mt-12 absolute inset-0 flex items-center justify-center">
            <span
              aria-hidden="true"
              className={`select-none font-sans font-bold leading-none text-white/92 transition-all duration-500 ${
                isLongWord
                  ? 'text-[60px] tracking-[-0.035em] sm:text-[98px]'
                  : 'text-[96px] tracking-[0.005em] sm:text-[148px]'
              }`}
            >
              {primaryScent.name}
            </span>
          </div>

          {/* Floating Photorealistic Botanicals (Primary + Secondary Accord when chosen) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute left-3 top-12 h-24 w-24 sm:left-5 sm:top-14 sm:h-28 sm:w-28">
              <div
                className="piece-inner h-full w-full"
                style={{ '--rot': '-11deg', '--dur': '4.3s', '--delay': '-0.9s' } as React.CSSProperties}
              >
                <CandleVisual scent={primaryScent} variant="botanical" className="h-full w-full" />
              </div>
            </div>

            <div className="absolute bottom-14 right-3 h-26 w-26 sm:bottom-16 sm:right-5 sm:h-32 sm:w-32">
              <div
                className="piece-inner h-full w-full"
                style={{ '--rot': '14deg', '--dur': '3.9s', '--delay': '-2.1s' } as React.CSSProperties}
              >
                <CandleVisual scent={primaryScent} variant="botanical" className="h-full w-full" />
              </div>
            </div>

            {secondaryScent && (
              <>
                <div className="absolute right-4 top-16 h-20 w-20 sm:right-6 sm:top-18 sm:h-24 sm:w-24">
                  <div
                    className="piece-inner h-full w-full"
                    style={{ '--rot': '16deg', '--dur': '4.6s', '--delay': '-1.4s' } as React.CSSProperties}
                  >
                    <CandleVisual scent={secondaryScent} variant="botanical" className="h-full w-full" />
                  </div>
                </div>
                <div className="absolute bottom-14 left-4 h-20 w-20 sm:bottom-16 sm:left-6 sm:h-24 sm:w-24">
                  <div
                    className="piece-inner h-full w-full"
                    style={{ '--rot': '-15deg', '--dur': '4.1s', '--delay': '-2.7s' } as React.CSSProperties}
                  >
                    <CandleVisual scent={secondaryScent} variant="botanical" className="h-full w-full" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Stage Top Bar */}
          <div className="relative z-20 flex items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-5">
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/95"
              style={{ textShadow: '0 1px 6px rgba(90, 70, 40, 0.22)' }}
            >
              Bespoke Vessel Preview
            </span>

            <button
              type="button"
              data-testid="toggle-flame-btn"
              aria-pressed={lit}
              onClick={() => setLit((v) => !v)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-white/45 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition-all whitespace-nowrap cursor-pointer"
              style={
                lit
                  ? { backgroundColor: primaryScent.surface, color: primaryScent.accentInk }
                  : { backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFFFFF' }
              }
            >
              {lit ? (
                <Flame className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <FlameKindling className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {lit ? 'Flame Lit' : 'Unlit'}
            </button>
          </div>

          {/* Centered Photorealistic Bespoke Stoneware Candle */}
          <div className="relative z-10 flex flex-1 items-center justify-center px-4 pt-8 pb-4 sm:pt-10">
            <BespokeCandlePreview
              vesselColorHex={vesselColorHex}
              isDarkVessel={isDarkVessel}
              scentId={scentId}
              secondaryScentId={secondaryScentId}
              customText={customText}
              customSubtext={customSubtext}
              fontId={fontId}
              inkId={inkId}
              inkHex={resolvedInkHex}
              lit={lit}
              size="lg"
            />
          </div>

          {/* Stage Bottom Hairline Spec Bar */}
          <div
            data-testid="live-candle-summary"
            className="relative z-20 flex flex-wrap items-center justify-between gap-2 border-t border-white/25 bg-black/10 px-5 py-3 text-xs font-medium text-white backdrop-blur-xs tabular-nums"
          >
            <span className="truncate">
              {vesselColorName} · {primaryScent.name}
              {secondaryScent ? ` + ${secondaryScent.name}` : ''}
            </span>
            <span className="shrink-0 opacity-90">240 g · Soy &amp; Coconut · 55 Hr Burn</span>
          </div>
        </motion.section>

        {/* Right Controls Panel */}
        <motion.section
          aria-label="Candle design controls"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: LUMA_EASE }}
          className="min-w-0 rounded-3xl border p-5 shadow-[0_24px_60px_rgba(60,40,80,0.14)] backdrop-blur-md transition-colors duration-500 sm:p-7 lg:col-span-6"
          style={{
            backgroundColor: primaryScent.surface,
            borderColor: `${primaryScent.accentInk}1C`,
          }}
        >
          {/* Header */}
          <div
            className="flex flex-wrap items-start justify-between gap-3 border-b pb-5"
            style={{ borderColor: `${primaryScent.accentInk}1A` }}
          >
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: primaryScent.accentInk }}
              >
                Luma Bespoke Atelier
              </p>
              <h1 className="mt-1 font-display text-3xl font-extrabold text-[#2B2233] sm:text-4xl">
                Design Your Candle
              </h1>
              <p className="mt-1 text-sm text-[#5D5368]">
                Wheel-thrown 240 g ceramic vessel hand-poured to your glaze, accord, and cotton-paper typography.
              </p>
            </div>
            <div className="text-right shrink-0">
              <div
                className="text-2xl font-extrabold tabular-nums"
                style={{ color: primaryScent.accentInk }}
              >
                {formatMoney(pricing.price)}
              </div>
              <div className="text-[11px] font-medium text-[#5D5368]">
                {pricing.label}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-7">
            {/* Step 01: Matte Ceramic Glaze */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-[#2B2233]">
                  01 · Matte Ceramic Glaze
                </h2>
                <span className="text-xs font-semibold tabular-nums text-[#5D5368]">
                  {vesselColorName} · {vesselColorHex.toUpperCase()}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {VESSEL_COLORS.map((swatch) => {
                  const selected = vesselColorId === swatch.id;
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      data-testid={`vessel-swatch-${swatch.id}`}
                      onClick={() => setVesselColorId(swatch.id)}
                      aria-label={`Select ceramic glaze ${swatch.name}`}
                      aria-pressed={selected}
                      title={swatch.name}
                      className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition-transform cursor-pointer ${
                        selected ? 'scale-110 ring-2 ring-offset-2' : 'hover:scale-105'
                      }`}
                      style={{
                        backgroundColor: swatch.hex,
                        borderColor: swatch.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(43,34,51,0.18)',
                        boxShadow: selected ? `0 0 0 2px ${primaryScent.accentInk}` : undefined,
                      }}
                    >
                      {selected && (
                        <Check
                          className={`h-4 w-4 ${swatch.isDark ? 'text-white' : 'text-[#2B2233]'}`}
                          strokeWidth={2.5}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}

                <label
                  htmlFor="custom-kiln-glaze"
                  className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-colors cursor-pointer ${
                    vesselColorId === 'custom' ? 'ring-2 ring-offset-1' : ''
                  }`}
                  style={{
                    backgroundColor: primaryScent.surfaceWell,
                    borderColor: `${primaryScent.accentInk}24`,
                    color: '#2B2233',
                    boxShadow: vesselColorId === 'custom' ? `0 0 0 2px ${primaryScent.accentInk}` : undefined,
                  }}
                >
                  <Palette className="h-3.5 w-3.5" style={{ color: primaryScent.accentInk }} aria-hidden="true" />
                  <span>Custom Hue</span>
                  <input
                    id="custom-kiln-glaze"
                    type="color"
                    value={customHex}
                    onChange={(e) => {
                      setCustomHex(e.target.value);
                      setVesselColorId('custom');
                    }}
                    className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
                    aria-label="Pick custom kiln ceramic glaze color"
                  />
                </label>
              </div>
            </div>

            {/* Step 02: Primary Botanical Fragrance + Optional Blending Note */}
            <div
              className="border-t pt-6"
              style={{ borderColor: `${primaryScent.accentInk}1A` }}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-[#2B2233]">
                  02 · Botanical Fragrance &amp; Blending Note
                </h2>
                <span className="text-xs font-medium text-[#5D5368]">9% Pure Botanical Oil</span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {SCENTS.map((s) => {
                  const selected = s.id === scentId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      data-testid={`scent-option-${s.id}`}
                      onClick={() => handleSelectPrimaryScent(s.id)}
                      aria-pressed={selected}
                      className="flex items-center gap-2.5 rounded-2xl border p-2.5 text-left transition-all cursor-pointer"
                      style={
                        selected
                          ? {
                              backgroundColor: s.accentInk,
                              borderColor: s.accentInk,
                              color: '#FFFFFF',
                            }
                          : {
                              backgroundColor: primaryScent.surfaceWell,
                              borderColor: `${primaryScent.accentInk}1A`,
                              color: '#2B2233',
                            }
                      }
                    >
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-1"
                        style={{ backgroundColor: s.bg }}
                      >
                        <CandleVisual scent={s} variant="botanical" className="h-full w-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold sm:text-sm">{s.name}</div>
                        <div
                          className={`truncate text-[11px] ${
                            selected ? 'text-white/80' : 'text-[#5D5368]'
                          }`}
                        >
                          {s.notes.heart.split(' · ')[0]}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Optional Secondary Blending Accord */}
              <div className="mt-4">
                <span className="block text-xs font-semibold text-[#5D5368]">
                  Secondary Blending Note (Optional Layer)
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    data-testid="blend-note-none"
                    onClick={() => setSecondaryScentId(undefined)}
                    aria-pressed={!secondaryScentId}
                    className="rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                    style={
                      !secondaryScentId
                        ? {
                            backgroundColor: primaryScent.accentInk,
                            borderColor: primaryScent.accentInk,
                            color: '#FFFFFF',
                          }
                        : {
                            backgroundColor: primaryScent.surfaceWell,
                            borderColor: `${primaryScent.accentInk}1E`,
                            color: '#2B2233',
                          }
                    }
                  >
                    Pure Single Note
                  </button>
                  {SCENTS.filter((s) => s.id !== scentId).map((s) => {
                    const active = secondaryScentId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        data-testid={`blend-note-${s.id}`}
                        onClick={() => setSecondaryScentId(active ? undefined : s.id)}
                        aria-pressed={active}
                        className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                        style={
                          active
                            ? {
                                backgroundColor: primaryScent.accentInk,
                                borderColor: primaryScent.accentInk,
                                color: '#FFFFFF',
                              }
                            : {
                                backgroundColor: primaryScent.surfaceWell,
                                borderColor: `${primaryScent.accentInk}1E`,
                                color: '#2B2233',
                              }
                        }
                      >
                        <CandleVisual scent={s} variant="botanical" className="h-4 w-4 shrink-0" />
                        <span>+ {s.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 03: Cotton-Paper Label, Font & Foil Ink */}
            <div
              className="border-t pt-6"
              style={{ borderColor: `${primaryScent.accentInk}1A` }}
            >
              <h2 className="text-sm font-bold text-[#2B2233]">
                03 · Cotton-Paper Label &amp; Typography
              </h2>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="candle-label-title" className="block text-xs font-semibold text-[#2B2233]">
                    Label Title ({customText.length}/28)
                  </label>
                  <input
                    id="candle-label-title"
                    type="text"
                    maxLength={28}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder={primaryScent.name}
                    className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2B2233] focus:outline-none"
                    style={{
                      backgroundColor: primaryScent.surfaceWell,
                      borderColor: `${primaryScent.accentInk}22`,
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="candle-label-subtext" className="block text-xs font-semibold text-[#2B2233]">
                    Dedication Line ({customSubtext.length}/24)
                  </label>
                  <input
                    id="candle-label-subtext"
                    type="text"
                    maxLength={24}
                    value={customSubtext}
                    onChange={(e) => setCustomSubtext(e.target.value)}
                    placeholder="Poured for Elena"
                    className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2B2233] focus:outline-none"
                    style={{
                      backgroundColor: primaryScent.surfaceWell,
                      borderColor: `${primaryScent.accentInk}22`,
                    }}
                  />
                </div>
              </div>

              {/* Font Presets */}
              <div className="mt-4">
                <span className="block text-xs font-semibold text-[#5D5368]">Typography Face</span>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CANDLE_FONTS.map((f) => {
                    const active = f.id === fontId;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        data-testid={`font-option-${f.id}`}
                        onClick={() => setFontId(f.id)}
                        aria-pressed={active}
                        className="rounded-xl border px-3 py-2 text-left transition-colors cursor-pointer"
                        style={
                          active
                            ? {
                                backgroundColor: primaryScent.accentInk,
                                borderColor: primaryScent.accentInk,
                                color: '#FFFFFF',
                              }
                            : {
                                backgroundColor: primaryScent.surfaceWell,
                                borderColor: `${primaryScent.accentInk}1E`,
                                color: '#2B2233',
                              }
                        }
                      >
                        <div
                          className="truncate text-sm font-bold leading-tight"
                          style={{
                            fontFamily: f.fontFamily,
                            letterSpacing: f.letterSpacing,
                            textTransform: f.textTransform,
                          }}
                        >
                          {f.name}
                        </div>
                        <div
                          className={`mt-0.5 truncate text-[10px] ${
                            active ? 'text-white/80' : 'text-[#5D5368]'
                          }`}
                        >
                          {f.styleTag}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ink / Foil Finish */}
              <div className="mt-4">
                <span className="block text-xs font-semibold text-[#5D5368]">
                  Ink &amp; Cotton Stock Finish
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2.5">
                  {CANDLE_INKS.map((ink) => {
                    const active = ink.id === inkId;
                    const swatchHex = ink.id === 'botanical' ? primaryScent.accentInk : ink.hex;
                    const isCreamInk = ink.id === 'ivory';
                    return (
                      <button
                        key={ink.id}
                        type="button"
                        data-testid={`ink-option-${ink.id}`}
                        onClick={() => setInkId(ink.id)}
                        aria-pressed={active}
                        className="flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors cursor-pointer"
                        style={
                          active
                            ? {
                                backgroundColor: primaryScent.accentInk,
                                borderColor: primaryScent.accentInk,
                                color: '#FFFFFF',
                              }
                            : {
                                backgroundColor: primaryScent.surfaceWell,
                                borderColor: `${primaryScent.accentInk}1E`,
                                color: '#2B2233',
                              }
                        }
                      >
                        <span
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 rounded-full border"
                          style={{
                            backgroundColor: swatchHex,
                            borderColor: isCreamInk ? 'rgba(43,34,51,0.35)' : 'rgba(255,255,255,0.45)',
                          }}
                        />
                        <span className="truncate">{ink.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 04: Set Size, Quantity & Add to Cart */}
            <div
              className="border-t pt-6"
              style={{ borderColor: `${primaryScent.accentInk}1A` }}
            >
              <h2 className="text-sm font-bold text-[#2B2233]">
                04 · Presentation Set &amp; Quantity
              </h2>

              <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                {PACK_SIZES.map((size) => {
                  const p = CUSTOM_CANDLE_PRICING[size];
                  const active = packSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      data-testid={`pack-size-${size}`}
                      onClick={() => setPackSize(size)}
                      aria-pressed={active}
                      className="flex flex-col justify-between rounded-2xl border p-3 text-left transition-colors cursor-pointer"
                      style={
                        active
                          ? {
                              backgroundColor: primaryScent.accentInk,
                              borderColor: primaryScent.accentInk,
                              color: '#FFFFFF',
                            }
                          : {
                              backgroundColor: primaryScent.surfaceWell,
                              borderColor: `${primaryScent.accentInk}1E`,
                              color: '#2B2233',
                            }
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold">
                          {size === 1 ? 'Single' : size === 3 ? 'Trio Set' : 'Studio 6-Case'}
                        </span>
                        <span className="text-xs font-extrabold tabular-nums">{formatMoney(p.price)}</span>
                      </div>
                      <div
                        className={`mt-1 text-[11px] tabular-nums ${
                          active ? 'text-white/85' : 'text-[#5D5368]'
                        }`}
                      >
                        {p.savings ?? `${formatMoney(p.perCandle)} per vessel`}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quantity Stepper + Primary Add CTA */}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch lg:flex-col xl:flex-row xl:items-center">
                <div
                  className="inline-flex h-12 w-full shrink-0 items-center justify-between rounded-xl border px-1 sm:w-auto lg:w-full xl:w-auto"
                  style={{
                    backgroundColor: primaryScent.surfaceWell,
                    borderColor: `${primaryScent.accentInk}24`,
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
                  <span className="w-10 text-center text-sm font-bold tabular-nums text-[#2B2233]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(12, q + 1))}
                    aria-label="Increase quantity"
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-[#2B2233] hover:bg-black/5 cursor-pointer"
                  >
                    <PlusIcon />
                  </button>
                </div>

                <button
                  type="button"
                  data-testid="add-custom-candle-btn"
                  onClick={handleAddToCart}
                  className="flex min-h-12 w-full min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-center text-sm font-semibold leading-snug text-white transition-opacity hover:opacity-90 cursor-pointer sm:px-5"
                  style={{ backgroundColor: primaryScent.accentInk }}
                >
                  <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 break-words tabular-nums">
                    Add Custom Candle to Cart · {formatMoney(lineTotal)}
                  </span>
                </button>
              </div>

              {/* Save to Studio Row */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveDesign}
                  className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors hover:opacity-85 disabled:opacity-60 cursor-pointer"
                  style={{
                    backgroundColor: primaryScent.surfaceWell,
                    borderColor: `${primaryScent.accentInk}20`,
                    color: primaryScent.accentInk,
                  }}
                >
                  <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                  {saving ? 'Saving Design...' : 'Save Design to Luma Studio'}
                </button>

                <span className="text-[11px] font-medium text-[#5D5368]">
                  Cash on Delivery · Free over $75.00
                </span>
              </div>

              {saveMessage && (
                <p
                  role="status"
                  className="mt-2 text-xs font-medium"
                  style={{ color: primaryScent.accentInk }}
                >
                  {saveMessage}
                </p>
              )}

              {/* Saved Studio Designs */}
              {savedDesigns.length > 0 && (
                <div
                  className="mt-5 border-t pt-4"
                  style={{ borderColor: `${primaryScent.accentInk}1A` }}
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5D5368]">
                    Your Saved Studio Designs ({savedDesigns.length})
                  </h3>
                  <ul className="mt-2.5 space-y-2">
                    {savedDesigns.map((design) => (
                      <li
                        key={design.id}
                        className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs"
                        style={{
                          backgroundColor: primaryScent.surfaceWell,
                          borderColor: `${primaryScent.accentInk}18`,
                        }}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className="h-4 w-4 shrink-0 rounded-full border border-black/15"
                            style={{ backgroundColor: design.vesselColorHex }}
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-[#2B2233]">
                              {design.customText || getScentById(design.scentId).name}
                            </div>
                            <div className="truncate text-[11px] text-[#5D5368]">
                              {design.vesselColorName} · {getScentById(design.scentId).name} · {design.fontLabel}
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleLoadDesign(design)}
                            className="rounded-lg px-2.5 py-1 font-semibold hover:bg-black/5 cursor-pointer"
                            style={{ color: primaryScent.accentInk }}
                          >
                            Load
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCustomDesign(design.id)}
                            aria-label={`Delete saved design ${design.customText || design.id}`}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#5D5368] hover:bg-black/5 hover:text-[#2B2233] cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
