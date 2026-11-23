import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Banknote, CheckCircle2, ChevronDown, CreditCard, ShieldCheck, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import { SCENTS, getScentById } from '../data/products';
import { useStore } from '../context/StoreContext';
import {
  type CheckoutRedirectReason,
  type CodPaymentMethod,
  type OrderRecord,
  type ValidationErrors,
  computeBlendVisualColors,
  evaluateCheckoutAccess,
  formatMoney,
  summarizeCustomCandle,
  summarizeCustomMix,
  summarizeCustomSmoothie,
  validateCheckoutForm,
} from '../utils/commerce';
import { CandleVisual } from '../components/CandleVisual';
import { BespokeCandlePreview } from '../components/BespokeCandlePreview';
import { SmoothieBlendPreview } from '../components/SmoothieBlendPreview';
import { OrderJourneyBar } from '../components/OrderJourneyBar';

const LUMA_EASE: [number, number, number, number] = [0.22, 0.8, 0.3, 1];

export function CheckoutPage() {
  const {
    cart,
    cartSummary,
    cartReviewed,
    firebaseUser,
    authReady,
    user,
    emailVerified,
    placeOrder,
    setAuthReturnRoute,
    setFlowNotice,
    navigate,
    activeScentId,
  } = useStore();
  const activeScent = getScentById(activeScentId);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [surname, setSurname] = useState(user?.surname ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [postalCode, setPostalCode] = useState(user?.postalCode ?? '');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<CodPaymentMethod>('cod');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  useEffect(() => {
    if (user) {
      if (!firstName) setFirstName(user.firstName);
      if (!surname) setSurname(user.surname);
      if (!email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
      if (!address && user.address) setAddress(user.address);
      if (!city && user.city) setCity(user.city);
      if (!postalCode && user.postalCode) setPostalCode(user.postalCode);
    }
  }, [user, firstName, surname, email, phone, address, city, postalCode]);

  const checkoutAccess = evaluateCheckoutAccess({
    cartItemCount: cart.length,
    cartReviewed,
    isSignedIn: Boolean(firebaseUser),
    isEmailVerified: emailVerified,
  });

  const redirectTriggeredRef = React.useRef(false);
  const accessAllowed = checkoutAccess.allowed;
  const redirectPage = checkoutAccess.allowed ? null : checkoutAccess.redirectTo.page;
  const redirectReason = checkoutAccess.allowed ? null : checkoutAccess.reason;
  const shouldSetReturnToCheckout = checkoutAccess.allowed ? false : checkoutAccess.setReturnToCheckout;

  useEffect(() => {
    if (confirmedOrder || !authReady || accessAllowed) {
      redirectTriggeredRef.current = false;
      return;
    }
    if (redirectTriggeredRef.current || !redirectPage || !redirectReason) return;
    redirectTriggeredRef.current = true;

    if (shouldSetReturnToCheckout) {
      setAuthReturnRoute({ page: 'checkout' });
    }
    const messages: Record<CheckoutRedirectReason, string> = {
      'empty-cart': 'Your cart is empty — add a botanical blend or candle before checking out.',
      'review-cart': 'Please review your cart items before continuing to checkout.',
      'sign-in': 'Please sign in or create an account before placing an order.',
      'verify-email': 'Please verify your email address before placing your COD order.',
    };
    setFlowNotice(messages[redirectReason]);
    navigate({ page: redirectPage } as { page: 'cart' } | { page: 'register' });
  }, [
    authReady,
    accessAllowed,
    redirectPage,
    redirectReason,
    shouldSetReturnToCheckout,
    confirmedOrder,
    navigate,
    setAuthReturnRoute,
    setFlowNotice,
  ]);

  if (confirmedOrder) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: LUMA_EASE }}
          className="rounded-3xl border p-6 shadow-[0_24px_60px_rgba(60,40,80,0.16)] sm:p-8"
          style={{
            backgroundColor: activeScent.surface,
            borderColor: `${activeScent.accentInk}1C`,
          }}
        >
          <div className="flex items-center gap-3" style={{ color: activeScent.accentInk }}>
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-widest">
              COD Order Confirmed
            </span>
          </div>

          <h1 className="mt-3 font-display text-3xl font-extrabold text-[#2B2233]">
            Thank you, {confirmedOrder.firstName}
          </h1>
          <p className="mt-2 text-sm text-[#5D5368]">
            Order{' '}
            <span className="font-semibold tabular-nums" style={{ color: activeScent.accentInk }}>
              #{confirmedOrder.orderNumber}
            </span>{' '}
            is scheduled for protective courier delivery to {confirmedOrder.shippingAddress}. Pay{' '}
            <span className="font-semibold text-[#2B2233] tabular-nums">{formatMoney(confirmedOrder.total)}</span>{' '}
            via {confirmedOrder.paymentMethod === 'cod-pos' ? 'Portable Card Terminal on Delivery' : 'Cash on Delivery'} upon arrival.
          </p>

          <div
            className="mt-5 flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs text-[#2B2233]"
            style={{
              backgroundColor: activeScent.surfaceWell,
              borderColor: `${activeScent.accentInk}20`,
            }}
          >
            <Truck className="h-4 w-4 shrink-0" style={{ color: activeScent.accentInk }} aria-hidden="true" />
            <span>
              Courier arrival confirmation will be called/texted to{' '}
              <strong className="tabular-nums">{confirmedOrder.customerPhone}</strong>.
            </span>
          </div>

          <div
            className="mt-6 border-t pt-5"
            style={{ borderColor: `${activeScent.accentInk}18` }}
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#5D5368]">Items</h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              {confirmedOrder.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4">
                  <span className="text-[#2B2233]">
                    {item.quantity}× {item.title}{' '}
                    <span className="text-[#5D5368]">
                      (
                      {item.customSmoothie
                        ? summarizeCustomSmoothie(item.customSmoothie)
                        : item.customCandle
                          ? summarizeCustomCandle(item.customCandle)
                          : item.customMix
                            ? summarizeCustomMix(item.customMix, item.addons)
                            : item.packSize === 1
                              ? 'Single'
                              : item.packSize === 3
                                ? 'Trio Set'
                                : 'Studio 6-Case'}
                      )
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums shrink-0" style={{ color: activeScent.accentInk }}>
                    {formatMoney(item.unitPrice * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div
              className="mt-5 space-y-1.5 border-t pt-4 text-sm"
              style={{ borderColor: `${activeScent.accentInk}18` }}
            >
              <div className="flex justify-between text-[#5D5368]">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatMoney(confirmedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#5D5368]">
                <span>Protective Courier</span>
                <span className="tabular-nums">
                  {confirmedOrder.shipping === 0 ? 'Free' : formatMoney(confirmedOrder.shipping)}
                </span>
              </div>
              <div
                className="flex justify-between pt-2 text-base font-bold"
                style={{ color: activeScent.accentInk }}
              >
                <span>Due on Delivery (COD)</span>
                <span className="tabular-nums">{formatMoney(confirmedOrder.total)}</span>
              </div>
            </div>
          </div>

          {!emailVerified && (
            <p className="mt-5 text-xs text-[#5D5368]">
              Tip: Create and verify your email account to sync order history across devices.
            </p>
          )}

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate({ page: 'register' })}
              className="min-h-[44px] rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: activeScent.accentInk }}
            >
              View Order History
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'shop' })}
              className="min-h-[44px] rounded-xl px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-85 cursor-pointer"
              style={{
                backgroundColor: activeScent.surfaceWell,
                color: activeScent.accentInk,
              }}
            >
              Continue Shopping
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'design' })}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-85 cursor-pointer"
              style={{
                backgroundColor: activeScent.surfaceWell,
                color: activeScent.accentInk,
              }}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Design Another Candle
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!authReady || !checkoutAccess.allowed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 text-center sm:px-10 sm:py-20">
        <div
          className="rounded-3xl border p-8 shadow-[0_24px_60px_rgba(60,40,80,0.16)] sm:p-10"
          style={{
            backgroundColor: activeScent.surface,
            borderColor: `${activeScent.accentInk}1C`,
          }}
        >
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: `${activeScent.bg}66`, color: activeScent.accentInk }}
          >
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-[#2B2233]">
            Preparing your checkout flow…
          </h1>
          <p className="mt-2 text-sm text-[#5D5368]">
            Ensuring your cart items and verified Luma account are ready before placing a COD order.
          </p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 text-center sm:px-10 sm:py-20">
        <div
          className="rounded-3xl border p-8 shadow-[0_24px_60px_rgba(60,40,80,0.16)] sm:p-10"
          style={{
            backgroundColor: activeScent.surface,
            borderColor: `${activeScent.accentInk}1C`,
          }}
        >
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: `${activeScent.bg}66`, color: activeScent.accentInk }}
          >
            <ShoppingBag className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold text-[#2B2233]">Your cart is empty</h1>
          <p className="mt-2 text-sm text-[#5D5368]">Add botanical candles or design your bespoke stoneware candle before checking out.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate({ page: 'shop' })}
              className="min-h-[44px] rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: activeScent.accentInk }}
            >
              Go to Shop
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'design' })}
              className="min-h-[44px] rounded-xl px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-85 cursor-pointer"
              style={{ backgroundColor: activeScent.surfaceWell, color: activeScent.accentInk }}
            >
              Design Your Candle
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const validation = validateCheckoutForm({
      firstName,
      surname,
      email,
      phone,
      address,
      city,
      postalCode,
    });
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const order = await placeOrder({
        firstName,
        surname,
        email,
        phone,
        address,
        city,
        postalCode,
        deliveryNotes,
        paymentMethod,
      });
      setConfirmedOrder(order);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to place order right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: activeScent.surfaceWell,
    borderColor: `${activeScent.accentInk}22`,
  };

  const renderOrderItems = () => (
    <ul className="space-y-3.5">
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
          <li key={item.id} className="flex items-center gap-3">
            <div
              className="h-12 w-11 shrink-0 overflow-hidden rounded-xl"
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
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-semibold text-[#2B2233]">
                {item.quantity}× {item.title}
              </div>
              <div className="truncate text-xs text-[#5D5368]">
                {item.customSmoothie
                  ? summarizeCustomSmoothie(item.customSmoothie)
                  : item.customCandle
                    ? summarizeCustomCandle(item.customCandle)
                    : item.customMix
                      ? summarizeCustomMix(item.customMix, item.addons)
                      : item.packSize === 1
                        ? 'Single · 240 g'
                        : item.packSize === 3
                          ? 'Trio Set'
                          : 'Studio 6-Case'}
              </div>
            </div>
            <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: activeScent.accentInk }}>
              {formatMoney(item.unitPrice * item.quantity)}
            </span>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-10 sm:py-10 lg:pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate({ page: 'cart' })}
            className="inline-flex items-center gap-2 text-sm font-medium text-white hover:opacity-80 cursor-pointer"
            style={{ textShadow: '0 1px 6px rgba(90, 70, 40, 0.18)' }}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Cart
          </button>

          <button
            type="button"
            onClick={() => navigate({ page: 'shop' })}
            className="text-xs font-semibold text-white/90 hover:underline cursor-pointer"
            style={{ textShadow: '0 1px 6px rgba(90, 70, 40, 0.18)' }}
          >
            Continue Shopping
          </button>
        </div>

        <h1
          className="mt-3 font-display text-3xl font-extrabold text-white sm:mt-4 sm:text-4xl"
          style={{ textShadow: '0 1px 6px rgba(90, 70, 40, 0.18)' }}
        >
          Cash on Delivery Checkout
        </h1>

        <OrderJourneyBar currentStep="checkout" />

        {/* Mobile Compact Collapsible Summary (so users see items/total immediately) */}
        <div
          className="mt-5 overflow-hidden rounded-2xl border shadow-sm backdrop-blur-md lg:hidden"
          style={{
            backgroundColor: activeScent.surface,
            borderColor: `${activeScent.accentInk}1C`,
          }}
        >
          <button
            type="button"
            onClick={() => setMobileSummaryOpen((v) => !v)}
            aria-expanded={mobileSummaryOpen}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-semibold cursor-pointer"
            style={{ color: activeScent.accentInk }}
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              {mobileSummaryOpen ? 'Hide Order Summary' : `Show Order Summary (${cartSummary.totalItems})`}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${mobileSummaryOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </span>
            <span className="tabular-nums font-bold">{formatMoney(cartSummary.total)}</span>
          </button>

          <AnimatePresence initial={false}>
            {mobileSummaryOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: LUMA_EASE }}
                className="overflow-hidden border-t px-4 py-4"
                style={{ borderColor: `${activeScent.accentInk}16` }}
              >
                {renderOrderItems()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: LUMA_EASE }}
          className="mt-5 grid gap-8 lg:mt-8 lg:grid-cols-12 lg:items-start"
        >
          <form
            id="checkout-form"
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5 rounded-3xl border p-5 shadow-[0_24px_60px_rgba(60,40,80,0.14)] sm:p-8 lg:col-span-7"
            style={{
              backgroundColor: activeScent.surface,
              borderColor: `${activeScent.accentInk}1C`,
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold" style={{ color: activeScent.accentInk }}>
                Recipient &amp; Courier Details
              </h2>
              <span
                className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-semibold"
                style={{ backgroundColor: activeScent.surfaceWell, color: activeScent.accentInk }}
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Verified: {user?.email ?? firebaseUser?.email}
              </span>
            </div>

            {submitError && (
              <div
                role="alert"
                className="rounded-2xl border border-red-400/50 px-4 py-3 text-xs font-medium text-red-800"
                style={{ backgroundColor: activeScent.surfaceWell }}
              >
                {submitError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="chk-first-name" className="block text-xs font-semibold text-[#2B2233]">
                  First Name
                </label>
                <input
                  id="chk-first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  aria-invalid={Boolean(errors.firstName)}
                  placeholder="Clara"
                  style={inputStyle}
                  className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2B2233] focus:outline-none"
                />
                {errors.firstName && <p className="mt-1 text-xs text-red-700">{errors.firstName}</p>}
              </div>

              <div>
                <label htmlFor="chk-surname" className="block text-xs font-semibold text-[#2B2233]">
                  Surname
                </label>
                <input
                  id="chk-surname"
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  aria-invalid={Boolean(errors.surname)}
                  placeholder="Vance"
                  style={inputStyle}
                  className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2B2233] focus:outline-none"
                />
                {errors.surname && <p className="mt-1 text-xs text-red-700">{errors.surname}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="chk-email" className="block text-xs font-semibold text-[#2B2233]">
                  Email
                </label>
                <input
                  id="chk-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  placeholder="clara@example.com"
                  style={inputStyle}
                  className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2B2233] focus:outline-none"
                />
                {errors.email && <p className="mt-1 text-xs text-red-700">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="chk-phone" className="block text-xs font-semibold text-[#2B2233]">
                  Mobile Phone (Courier Call)
                </label>
                <input
                  id="chk-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={Boolean(errors.phone)}
                  placeholder="555-0192"
                  style={inputStyle}
                  className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2B2233] focus:outline-none"
                />
                {errors.phone && <p className="mt-1 text-xs text-red-700">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="chk-address" className="block text-xs font-semibold text-[#2B2233]">
                Street Address
              </label>
              <input
                id="chk-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                aria-invalid={Boolean(errors.address)}
                placeholder="420 Cedar Way, Apt 4B"
                style={inputStyle}
                className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2B2233] focus:outline-none"
              />
              {errors.address && <p className="mt-1 text-xs text-red-700">{errors.address}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="chk-city" className="block text-xs font-semibold text-[#2B2233]">
                  City
                </label>
                <input
                  id="chk-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  aria-invalid={Boolean(errors.city)}
                  placeholder="Portland"
                  style={inputStyle}
                  className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2B2233] focus:outline-none"
                />
                {errors.city && <p className="mt-1 text-xs text-red-700">{errors.city}</p>}
              </div>

              <div>
                <label htmlFor="chk-postal" className="block text-xs font-semibold text-[#2B2233]">
                  Postal Code
                </label>
                <input
                  id="chk-postal"
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  aria-invalid={Boolean(errors.postalCode)}
                  placeholder="97205"
                  style={inputStyle}
                  className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2B2233] focus:outline-none"
                />
                {errors.postalCode && <p className="mt-1 text-xs text-red-700">{errors.postalCode}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="chk-notes" className="block text-xs font-semibold text-[#2B2233]">
                Courier Instructions (Optional)
              </label>
              <input
                id="chk-notes"
                type="text"
                maxLength={240}
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Ring bell #4, call upon arrival"
                style={inputStyle}
                className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2B2233] focus:outline-none"
              />
            </div>

            <div
              className="border-t pt-5"
              style={{ borderColor: `${activeScent.accentInk}18` }}
            >
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#5D5368]">
                Payment Method (100% Pay on Delivery)
              </span>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  aria-pressed={paymentMethod === 'cod'}
                  className="flex items-start gap-3 rounded-2xl border p-3.5 text-left text-sm transition-colors cursor-pointer"
                  style={
                    paymentMethod === 'cod'
                      ? { backgroundColor: activeScent.accentInk, borderColor: activeScent.accentInk, color: '#FFFFFF' }
                      : { backgroundColor: activeScent.surfaceWell, borderColor: `${activeScent.accentInk}1E`, color: '#2B2233' }
                  }
                >
                  <Banknote className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div>
                    <div className="font-semibold">Cash on Delivery (COD)</div>
                    <div className={`text-xs ${paymentMethod === 'cod' ? 'text-white/85' : 'text-[#5D5368]'}`}>
                      Pay cash at doorstep · Zero upfront fee
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod-pos')}
                  aria-pressed={paymentMethod === 'cod-pos'}
                  className="flex items-start gap-3 rounded-2xl border p-3.5 text-left text-sm transition-colors cursor-pointer"
                  style={
                    paymentMethod === 'cod-pos'
                      ? { backgroundColor: activeScent.accentInk, borderColor: activeScent.accentInk, color: '#FFFFFF' }
                      : { backgroundColor: activeScent.surfaceWell, borderColor: `${activeScent.accentInk}1E`, color: '#2B2233' }
                  }
                >
                  <CreditCard className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div>
                    <div className="font-semibold">Card on Delivery (COD)</div>
                    <div className={`text-xs ${paymentMethod === 'cod-pos' ? 'text-white/85' : 'text-[#5D5368]'}`}>
                      Tap card on courier&apos;s handheld POS
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Desktop inline submit */}
            <button
              type="submit"
              disabled={submitting}
              className="hidden min-h-[48px] w-full items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer lg:flex"
              style={{ backgroundColor: activeScent.accentInk }}
            >
              {submitting ? 'Confirming COD Order...' : `Place COD Order · ${formatMoney(cartSummary.total)}`}
            </button>
          </form>

          {/* Desktop Sticky Order Summary */}
          <aside
            className="hidden rounded-3xl border p-6 shadow-[0_24px_60px_rgba(60,40,80,0.14)] sm:p-8 lg:sticky lg:top-24 lg:col-span-5 lg:block"
            style={{
              backgroundColor: activeScent.surface,
              borderColor: `${activeScent.accentInk}1C`,
            }}
          >
            <h2 className="text-base font-bold" style={{ color: activeScent.accentInk }}>
              Order Summary
            </h2>
            <div className="mt-4">{renderOrderItems()}</div>

            <div
              className="mt-6 space-y-2 border-t pt-4 text-sm"
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
                <span>Due on Delivery</span>
                <span className="tabular-nums">{formatMoney(cartSummary.total)}</span>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={submitting}
              className="mt-5 flex min-h-[46px] w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
              style={{ backgroundColor: activeScent.accentInk }}
            >
              {submitting ? 'Confirming COD Order...' : `Place COD Order · ${formatMoney(cartSummary.total)}`}
            </button>
          </aside>
        </motion.div>
      </div>

      {/* Fixed Mobile Bottom Checkout Bar (compact <= 72px so <= 9% of 844px viewport) */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(40,25,60,0.16)] backdrop-blur-md lg:hidden"
        style={{
          backgroundColor: activeScent.surface,
          borderColor: `${activeScent.accentInk}22`,
        }}
      >
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-[#5D5368]">Pay on Delivery (COD)</div>
            <div className="text-base font-extrabold tabular-nums" style={{ color: activeScent.accentInk }}>
              {formatMoney(cartSummary.total)}
            </div>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={submitting}
            data-testid="mobile-place-order-btn"
            className="min-h-[44px] shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
            style={{ backgroundColor: activeScent.accentInk }}
          >
            {submitting ? 'Confirming...' : 'Place Order'}
          </button>
        </div>
      </div>
    </>
  );
}
