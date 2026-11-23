import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD, SCENTS, getScentById } from '../data/products';
import { useStore } from '../context/StoreContext';
import {
  computeBlendVisualColors,
  formatMoney,
  summarizeCustomCandle,
  summarizeCustomMix,
  summarizeCustomSmoothie,
} from '../utils/commerce';
import { CandleVisual } from './CandleVisual';
import { BespokeCandlePreview } from './BespokeCandlePreview';
import { SmoothieBlendPreview } from './SmoothieBlendPreview';

export function CartDrawer() {
  const { isCartOpen, closeCart, cart, cartSummary, stepCartItem, removeCartItem, navigate, activeScentId } = useStore();
  const activeScent = getScentById(activeScentId);

  useEffect(() => {
    if (!isCartOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeCart, isCartOpen]);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end sm:items-stretch"
          role="dialog"
          aria-modal="true"
          aria-label="Shopping cart"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 0.8, 0.3, 1] }}
            className="fixed inset-0 bg-[#2A2136]/52"
            onClick={closeCart}
          />

          <motion.aside
            initial={{ y: '100%', x: 0 }}
            animate={{ y: 0, x: 0 }}
            exit={{ y: '100%', x: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 0.8, 0.3, 1] }}
            className="relative z-10 flex h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl text-[#2B2233] shadow-[0_-16px_50px_rgba(40,25,60,0.28)] sm:h-[100dvh] sm:max-w-md sm:rounded-none sm:shadow-[0_24px_60px_rgba(60,40,80,0.28)]"
            style={{ backgroundColor: activeScent.surface }}
          >
            {/* Mobile grab bar */}
            <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden="true">
              <span className="h-1 w-10 rounded-full bg-black/15" />
            </div>

            <div
              className="flex shrink-0 items-center justify-between border-b px-4 py-3.5 sm:px-6 sm:py-5"
              style={{ borderColor: `${activeScent.accentInk}1A` }}
            >
              <div>
                <h2 className="text-base font-bold tracking-tight sm:text-lg" style={{ color: activeScent.accentInk }}>
                  Your Cart
                </h2>
                <p className="text-xs text-[#5E5666] tabular-nums">
                  {cartSummary.totalCandles}{' '}
                  {cart.length > 0 && cart.every((i) => Boolean(i.customSmoothie))
                    ? cartSummary.totalCandles === 1
                      ? 'cup'
                      : 'cups'
                    : cartSummary.totalCandles === 1
                      ? 'candle'
                      : 'candles'}{' '}
                  · {cartSummary.totalItems} {cartSummary.totalItems === 1 ? 'item' : 'items'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Close cart"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-[#5E5666] hover:bg-black/5 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Free shipping meter */}
            <div
              className="shrink-0 border-b px-4 py-2.5 sm:px-6 sm:py-3.5"
              style={{
                backgroundColor: activeScent.surfaceWell,
                borderColor: `${activeScent.accentInk}14`,
              }}
            >
              <div className="flex items-center justify-between gap-2 text-xs font-medium text-[#2B2233]">
                <span className="truncate">
                  {cartSummary.amountToFreeShipping === 0 && cart.length > 0
                    ? 'Free protective courier unlocked'
                    : `Add ${formatMoney(cartSummary.amountToFreeShipping)} for free delivery`}
                </span>
                <span className="tabular-nums font-semibold shrink-0" style={{ color: activeScent.accentInk }}>
                  {formatMoney(FREE_SHIPPING_THRESHOLD)}
                </span>
              </div>
              <div
                className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: `${activeScent.accentInk}22` }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${cartSummary.freeShippingProgressPct}%`,
                    backgroundColor: activeScent.accentInk,
                  }}
                />
              </div>
            </div>

            {/* Scrollable Items list */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${activeScent.bg}66`, color: activeScent.accentInk }}
                  >
                    <ShoppingBag className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-[#2B2233]">Your cart is empty</h3>
                  <p className="mt-1.5 max-w-xs text-sm text-[#5E5666]">
                    Explore our botanical soy candles or design your own bespoke stoneware vessel.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => navigate({ page: 'shop' })}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
                      style={{ backgroundColor: activeScent.accentInk }}
                    >
                      Explore Collection
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate({ page: 'design' })}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-85 cursor-pointer"
                      style={{
                        backgroundColor: activeScent.surfaceWell,
                        color: activeScent.accentInk,
                      }}
                    >
                      Design Your Candle
                    </button>
                  </div>
                </div>
              ) : (
                <ul className="divide-y" style={{ borderColor: `${activeScent.accentInk}14` }}>
                  {cart.map((item) => {
                    const smoothieColors = item.customSmoothie
                      ? computeBlendVisualColors(item.customSmoothie.fruits)
                      : null;
                    const scent = item.customSmoothie && smoothieColors
                      ? getScentById(smoothieColors.primaryScentId)
                      : item.customCandle
                        ? getScentById(item.customCandle.scentId)
                        : item.scentId === 'custom-trio'
                          ? getScentById(item.customMix?.[0])
                          : SCENTS.find((s) => s.id === item.scentId) ?? SCENTS[0];
                    return (
                      <li key={item.id} className="flex gap-3 py-3.5 first:pt-0 last:pb-0 sm:gap-4 sm:py-4">
                        <div
                          className="h-16 w-14 shrink-0 overflow-hidden rounded-xl p-1 sm:h-20 sm:w-16 sm:p-1.5"
                          style={{ backgroundColor: scent.bg }}
                        >
                          {item.customSmoothie ? (
                            <SmoothieBlendPreview
                              fruits={item.customSmoothie.fruits}
                              toppings={item.customSmoothie.toppings}
                              sweetness={item.customSmoothie.sweetness}
                              customText={item.customSmoothie.customText}
                              fontId={item.customSmoothie.fontId}
                              size="sm"
                            />
                          ) : item.customCandle ? (
                            <BespokeCandlePreview
                              vesselColorHex={item.customCandle.vesselColorHex}
                              scentId={item.customCandle.scentId}
                              secondaryScentId={item.customCandle.secondaryScentId}
                              customText={item.customCandle.customText}
                              customSubtext={item.customCandle.customSubtext}
                              fontId={item.customCandle.fontId}
                              inkId={item.customCandle.inkId}
                              inkHex={item.customCandle.inkHex}
                              lit={false}
                              size="sm"
                            />
                          ) : (
                            <CandleVisual scent={scent} variant="candle" className="h-full w-full" />
                          )}
                        </div>

                        <div className="flex flex-1 flex-col justify-between min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-semibold text-[#2B2233]">{item.title}</h3>
                              <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-[#5E5666]">
                                {item.customSmoothie
                                  ? summarizeCustomSmoothie(item.customSmoothie)
                                  : item.customCandle
                                    ? summarizeCustomCandle(item.customCandle)
                                    : item.customMix
                                      ? summarizeCustomMix(item.customMix, item.addons)
                                      : item.packSize === 1
                                        ? 'Single · 240 g'
                                        : item.packSize === 3
                                          ? 'Trio Set · 3 × 240 g'
                                          : 'Studio 6-Case · 6 × 240 g'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCartItem(item.id)}
                              aria-label={`Remove ${item.title}`}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#5E5666] hover:bg-black/5 hover:text-[#2B2233] cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-2.5 flex items-center justify-between gap-2">
                            <div
                              className="inline-flex items-center rounded-xl border"
                              style={{
                                backgroundColor: activeScent.surfaceWell,
                                borderColor: `${activeScent.accentInk}20`,
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => stepCartItem(item.id, -1)}
                                aria-label={`Decrease quantity of ${item.title}`}
                                className="flex h-8 w-8 items-center justify-center text-[#2B2233] hover:bg-black/5 cursor-pointer"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-7 text-center text-xs font-semibold tabular-nums">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => stepCartItem(item.id, 1)}
                                aria-label={`Increase quantity of ${item.title}`}
                                className="flex h-8 w-8 items-center justify-center text-[#2B2233] hover:bg-black/5 cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <span className="text-sm font-semibold tabular-nums" style={{ color: activeScent.accentInk }}>
                              {formatMoney(item.unitPrice * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {cart.length > 0 && (
              <div
                className="shrink-0 border-t px-4 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-5"
                style={{
                  backgroundColor: activeScent.surfaceWell,
                  borderColor: `${activeScent.accentInk}1A`,
                }}
              >
                <div className="space-y-1 text-xs sm:space-y-1.5 sm:text-sm">
                  <div className="flex justify-between text-[#5E5666]">
                    <span>Subtotal</span>
                    <span className="tabular-nums font-medium text-[#2B2233]">
                      {formatMoney(cartSummary.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#5E5666]">
                    <span>Protective Courier</span>
                    <span className="tabular-nums font-medium text-[#2B2233]">
                      {cartSummary.shipping === 0 ? 'Free' : formatMoney(cartSummary.shipping)}
                    </span>
                  </div>
                  <div
                    className="flex justify-between border-t pt-2 text-sm font-bold sm:text-base"
                    style={{ borderColor: `${activeScent.accentInk}1A`, color: activeScent.accentInk }}
                  >
                    <span>Total (COD)</span>
                    <span className="tabular-nums">{formatMoney(cartSummary.total)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  data-testid="drawer-review-cart-btn"
                  onClick={() => navigate({ page: 'cart' })}
                  className="mt-3 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer sm:mt-4"
                  style={{ backgroundColor: activeScent.accentInk }}
                >
                  Review Cart &amp; Proceed
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <p className="mt-2 text-center text-[11px] font-medium text-[#5E5666]">
                  Next: Full cart review &amp; Luma account verification
                </p>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
