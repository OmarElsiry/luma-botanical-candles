import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
} from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD, SCENTS, getScentById } from '../data/products';
import { useStore } from '../context/StoreContext';
import {
  computeBlendVisualColors,
  evaluateCartProceedAction,
  formatMoney,
  summarizeCustomCandle,
  summarizeCustomMix,
  summarizeCustomSmoothie,
} from '../utils/commerce';
import { CandleVisual } from '../components/CandleVisual';
import { BespokeCandlePreview } from '../components/BespokeCandlePreview';
import { SmoothieBlendPreview } from '../components/SmoothieBlendPreview';
import { OrderJourneyBar } from '../components/OrderJourneyBar';

const LUMA_EASE: [number, number, number, number] = [0.22, 0.8, 0.3, 1];

export function CartPage() {
  const {
    cart,
    cartSummary,
    stepCartItem,
    removeCartItem,
    clearCart,
    markCartReviewed,
    firebaseUser,
    emailVerified,
    user,
    setAuthReturnRoute,
    flowNotice,
    setFlowNotice,
    navigate,
    activeScentId,
  } = useStore();

  const activeScent = getScentById(activeScentId);

  useEffect(() => {
    markCartReviewed();
  }, [markCartReviewed, cart.length]);

  const proceedDecision = evaluateCartProceedAction({
    cartItemCount: cart.length,
    isSignedIn: Boolean(firebaseUser),
    isEmailVerified: emailVerified,
  });

  const handleProceed = () => {
    if (proceedDecision.setReturnToCheckout) {
      setAuthReturnRoute({ page: 'checkout' });
      setFlowNotice(
        proceedDecision.reason === 'needs-verify'
          ? 'Please verify your email address to place your Cash on Delivery order — once verified, you will continue automatically to Delivery & COD.'
          : 'Sign in or create a verified Luma account to place your order — afterwards you will return straight to Delivery & COD.'
      );
    } else {
      setFlowNotice(null);
    }
    navigate(proceedDecision.nextRoute);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Blurred peripheral botanicals matching Luma store aesthetic */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-10 top-20 z-0 h-28 w-28 opacity-55 blur-[3px] sm:left-6 sm:top-24 sm:h-40 sm:w-40 sm:opacity-80"
      >
        <div
          className="piece-inner h-full w-full"
          style={{ '--rot': '-15deg', '--dur': '4.4s', '--delay': '-0.9s' } as React.CSSProperties}
        >
          <CandleVisual scent={activeScent} variant="botanical" className="h-full w-full" />
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed right-[-20px] bottom-12 z-0 h-32 w-32 opacity-80 blur-[3px] sm:right-6 sm:h-44 sm:w-44"
      >
        <div
          className="piece-inner h-full w-full"
          style={{ '--rot': '16deg', '--dur': '4s', '--delay': '-2.1s' } as React.CSSProperties}
        >
          <CandleVisual scent={activeScent} variant="botanical" className="h-full w-full" />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-10 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate({ page: 'shop' })}
            className="inline-flex items-center gap-2 text-sm font-medium text-white hover:opacity-80 cursor-pointer"
            style={{ textShadow: '0 1px 6px rgba(90, 70, 40, 0.18)' }}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Continue Shopping
          </button>

          <button
            type="button"
            onClick={() => navigate({ page: 'design' })}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs transition-opacity hover:opacity-90 cursor-pointer"
            style={{
              backgroundColor: activeScent.surface,
              borderColor: `${activeScent.accentInk}22`,
              color: activeScent.accentInk,
            }}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Design Custom Candle
          </button>
        </div>

        <div className="mt-4" style={{ textShadow: '0 1px 6px rgba(90, 70, 40, 0.18)' }}>
          <h1 className="font-display text-3xl font-extrabold text-white sm:text-5xl">Your Studio Cart</h1>
          <p className="mt-1 text-sm text-white/95">
            Review every hand-poured vessel and custom candle design before verifying your Luma account and delivery details.
          </p>
        </div>

        <OrderJourneyBar currentStep="cart" />

        {flowNotice && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: LUMA_EASE }}
            role="status"
            className="mt-5 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-medium shadow-sm backdrop-blur-md"
            style={{
              backgroundColor: activeScent.surface,
              borderColor: `${activeScent.accentInk}28`,
              color: activeScent.accentInk,
            }}
          >
            <span>{flowNotice}</span>
            <button
              type="button"
              onClick={() => setFlowNotice(null)}
              className="shrink-0 text-[11px] font-bold underline cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {cart.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: LUMA_EASE }}
            className="mx-auto mt-8 max-w-xl rounded-3xl border p-8 text-center shadow-[0_24px_60px_rgba(60,40,80,0.16)] sm:p-10"
            style={{
              backgroundColor: activeScent.surface,
              borderColor: `${activeScent.accentInk}1C`,
            }}
          >
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: `${activeScent.bg}75`, color: activeScent.accentInk }}
            >
              <ShoppingBag className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-[#2B2233]">Your cart is empty</h2>
            <p className="mt-2 text-sm text-[#5D5368]">
              Explore our botanical soy candles or design your own bespoke stoneware vessel to begin your order.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate({ page: 'shop' })}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: activeScent.accentInk }}
              >
                Explore Collection
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => navigate({ page: 'design' })}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-85 cursor-pointer"
                style={{ backgroundColor: activeScent.surfaceWell, color: activeScent.accentInk }}
              >
                Design Your Candle
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: LUMA_EASE }}
            className="mt-6 grid gap-8 lg:grid-cols-12 lg:items-start"
          >
            {/* Left: Itemized Cart List */}
            <section
              aria-label="Cart items"
              className="rounded-3xl border p-5 shadow-[0_24px_60px_rgba(60,40,80,0.14)] sm:p-7 lg:col-span-7"
              style={{
                backgroundColor: activeScent.surface,
                borderColor: `${activeScent.accentInk}1C`,
              }}
            >
              <div
                className="flex flex-wrap items-center justify-between gap-2 border-b pb-4"
                style={{ borderColor: `${activeScent.accentInk}18` }}
              >
                <div>
                  <h2 className="text-base font-bold" style={{ color: activeScent.accentInk }}>
                    Selected Items ({cartSummary.totalItems})
                  </h2>
                  <p className="text-xs text-[#5D5368] tabular-nums">
                    {cartSummary.totalCandles}{' '}
                    {cart.every((i) => Boolean(i.customSmoothie))
                      ? cartSummary.totalCandles === 1
                        ? 'cup'
                        : 'cups'
                      : cartSummary.totalCandles === 1
                        ? 'candle'
                        : 'candles'}{' '}
                    poured fresh per order
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearCart}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-[#5D5368] hover:bg-black/5 hover:text-[#2B2233] cursor-pointer"
                >
                  Clear Cart
                </button>
              </div>

              <ul className="mt-4 space-y-3.5">
                <AnimatePresence initial={false}>
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
                      <motion.li
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.25, ease: LUMA_EASE }}
                        className="flex gap-3.5 rounded-2xl border p-3.5 sm:gap-4 sm:p-4"
                        style={{
                          backgroundColor: activeScent.surfaceWell,
                          borderColor: `${activeScent.accentInk}18`,
                        }}
                      >
                        <div
                          className="h-20 w-16 shrink-0 overflow-hidden rounded-xl p-1 sm:h-24 sm:w-20 sm:p-1.5"
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
                              <h3 className="truncate text-sm font-bold text-[#2B2233] sm:text-base">
                                {item.title}
                              </h3>
                              <p className="mt-0.5 text-xs leading-snug text-[#5D5368]">
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
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#5D5368] hover:bg-black/5 hover:text-[#2B2233] cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <div
                              className="inline-flex items-center rounded-xl border"
                              style={{
                                backgroundColor: activeScent.surface,
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
                              <span className="w-8 text-center text-xs font-bold tabular-nums">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => stepCartItem(item.id, 1)}
                                aria-label={`Increase quantity of ${item.title}`}
                                className="flex h-8 w-8 items-center justify-center text-[#2B2233] hover:bg-black/5 cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="text-right">
                              <div className="text-xs text-[#5D5368] tabular-nums">
                                {formatMoney(item.unitPrice)} each
                              </div>
                              <div className="text-sm font-extrabold tabular-nums" style={{ color: activeScent.accentInk }}>
                                {formatMoney(item.unitPrice * item.quantity)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            </section>

            {/* Right: Free Courier Meter, Account Gate Status & Totals */}
            <aside
              className="rounded-3xl border p-5 shadow-[0_24px_60px_rgba(60,40,80,0.14)] sm:p-7 lg:sticky lg:top-24 lg:col-span-5"
              style={{
                backgroundColor: activeScent.surface,
                borderColor: `${activeScent.accentInk}1C`,
              }}
            >
              <h2 className="text-base font-bold" style={{ color: activeScent.accentInk }}>
                Order Review &amp; Account Check
              </h2>

              {/* Free Shipping Progress */}
              <div
                className="mt-4 rounded-2xl border p-3.5"
                style={{
                  backgroundColor: activeScent.surfaceWell,
                  borderColor: `${activeScent.accentInk}18`,
                }}
              >
                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#2B2233]">
                  <span className="flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 shrink-0" style={{ color: activeScent.accentInk }} aria-hidden="true" />
                    {cartSummary.amountToFreeShipping === 0
                      ? 'Free protective courier unlocked'
                      : `Add ${formatMoney(cartSummary.amountToFreeShipping)} for free courier`}
                  </span>
                  <span className="tabular-nums shrink-0" style={{ color: activeScent.accentInk }}>
                    {formatMoney(FREE_SHIPPING_THRESHOLD)}
                  </span>
                </div>
                <div
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
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

              {/* Account Readiness Indicator (Required before ordering) */}
              <div
                data-testid="cart-account-status"
                className="mt-4 rounded-2xl border p-4"
                style={{
                  backgroundColor: activeScent.surfaceWell,
                  borderColor: `${activeScent.accentInk}22`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${activeScent.accentInk}18`, color: activeScent.accentInk }}
                  >
                    {proceedDecision.reason === 'ready' ? (
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Lock className="h-4 w-4" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold uppercase tracking-wider" style={{ color: activeScent.accentInk }}>
                      {proceedDecision.reason === 'ready'
                        ? 'Verified Luma Account Linked'
                        : proceedDecision.reason === 'needs-verify'
                          ? 'Step 02 · Email Verification Required'
                          : 'Step 02 · Luma Account Required'}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#5D5368]">
                      {proceedDecision.reason === 'ready'
                        ? `Ready as ${user?.name ?? firebaseUser?.email}. Your saved delivery profile and COD order sync are active.`
                        : proceedDecision.reason === 'needs-verify'
                          ? `Signed in as ${firebaseUser?.email}, waiting on email verification before COD checkout unlocks.`
                          : 'An account is required to place Cash on Delivery orders. Next, sign in or register in under a minute and return automatically to checkout.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div
                className="mt-5 space-y-2 border-t pt-4 text-sm"
                style={{ borderColor: `${activeScent.accentInk}18` }}
              >
                <div className="flex justify-between text-[#5D5368]">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-medium text-[#2B2233]">{formatMoney(cartSummary.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#5D5368]">
                  <span>Protective Courier</span>
                  <span className="tabular-nums font-medium text-[#2B2233]">
                    {cartSummary.shipping === 0 ? 'Free' : formatMoney(cartSummary.shipping)}
                  </span>
                </div>
                <div
                  className="flex justify-between border-t pt-3 text-base font-bold"
                  style={{ borderColor: `${activeScent.accentInk}18`, color: activeScent.accentInk }}
                >
                  <span>Total (COD)</span>
                  <span className="tabular-nums">{formatMoney(cartSummary.total)}</span>
                </div>
              </div>

              <button
                type="button"
                data-testid="cart-proceed-btn"
                onClick={handleProceed}
                className="mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: activeScent.accentInk }}
              >
                <span>
                  {proceedDecision.reason === 'ready'
                    ? 'Continue to COD Checkout'
                    : proceedDecision.reason === 'needs-verify'
                      ? 'Verify Account to Checkout'
                      : 'Sign In or Register to Checkout'}
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </aside>
          </motion.div>
        )}
      </div>
    </div>
  );
}
