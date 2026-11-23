import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  LogOut,
  MailCheck,
  Package,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { getScentById, type TrioAddonId } from '../data/products';
import { useStore } from '../context/StoreContext';
import {
  type ValidationErrors,
  evaluatePasswordStrength,
  formatMoney,
  summarizeCustomCandle,
  summarizeCustomMix,
  summarizeCustomSmoothie,
  validateNameStep,
  validateRegistration,
} from '../utils/commerce';
import { OrderJourneyBar } from '../components/OrderJourneyBar';

const LUMA_EASE: [number, number, number, number] = [0.22, 0.8, 0.3, 1];

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  error?: string;
  inputStyle: React.CSSProperties;
  accentInk: string;
  testId?: string;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  inputStyle,
  accentInk,
  testId,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-[#2B2233]">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          data-testid={testId}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          placeholder={placeholder}
          style={inputStyle}
          className="w-full rounded-xl border py-2.5 pl-3.5 pr-12 text-sm text-[#2B2233] focus:outline-none"
        />
        <button
          type="button"
          data-testid={testId ? `${testId}-eye` : undefined}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-1 cursor-pointer"
          style={{ color: accentInk }}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

function friendlyAuthError(err: unknown): { message: string; needsProviderEnable?: boolean } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('auth/operation-not-allowed')) {
    return {
      message: 'Email/Password sign-up is not yet toggled on in your Firebase Console.',
      needsProviderEnable: true,
    };
  }
  if (raw.includes('auth/email-already-in-use')) {
    return { message: 'An account with this email already exists. Try signing in instead.' };
  }
  if (raw.includes('auth/invalid-credential') || raw.includes('auth/wrong-password') || raw.includes('auth/user-not-found')) {
    return { message: 'Incorrect email or password.' };
  }
  if (raw.includes('auth/weak-password')) {
    return { message: 'Password must be at least 6 characters.' };
  }
  if (raw.includes('auth/too-many-requests')) {
    return { message: 'Too many attempts. Wait a minute and try again.' };
  }
  if (raw.includes('auth/popup-closed-by-user')) {
    return { message: 'Google sign-in popup was closed before completing.' };
  }
  return { message: raw };
}

export function RegisterPage() {
  const {
    user,
    firebaseUser,
    emailVerified,
    firebaseProjectId,
    registerWithEmail,
    signInWithEmail,
    signInWithGoogle,
    resendVerificationEmail,
    refreshVerificationStatus,
    sendPasswordReset,
    saveUserProfile,
    signOut,
    orders,
    cancelOrder,
    cart,
    cartSummary,
    authReturnRoute,
    setAuthReturnRoute,
    flowNotice,
    setFlowNotice,
    addToCart,
    addCustomPackToCart,
    addCustomCandleToCart,
    addCustomSmoothieToCart,
    navigate,
    activeScentId,
  } = useStore();
  const activeScent = getScentById(activeScentId);

  const [mode, setMode] = useState<'register' | 'signin'>('register');
  const [regStep, setRegStep] = useState<1 | 2>(1);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [surname, setSurname] = useState(user?.surname ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [postalCode, setPostalCode] = useState(user?.postalCode ?? '');

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [authBanner, setAuthBanner] = useState<{ text: string; needsProviderEnable?: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setSurname(user.surname);
      setEmail(user.email);
      setPhone(user.phone);
      setAddress(user.address);
      setCity(user.city);
      setPostalCode(user.postalCode);
    }
  }, [user]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = window.setInterval(() => {
      setResendCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendCooldown]);

  useEffect(() => {
    if (authReturnRoute && user && firebaseUser && emailVerified) {
      const target = authReturnRoute;
      setAuthReturnRoute(null);
      setFlowNotice(null);
      navigate(target);
    }
  }, [authReturnRoute, user, firebaseUser, emailVerified, navigate, setAuthReturnRoute, setFlowNotice]);

  const strength = evaluatePasswordStrength(password);

  const handleNextNameStep = () => {
    const stepErrors = validateNameStep({ firstName, surname });
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) {
      setRegStep(2);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBanner(null);

    if (mode === 'register' && regStep === 1) {
      handleNextNameStep();
      return;
    }

    const validation = validateRegistration({
      mode,
      firstName,
      surname,
      email,
      password,
      confirmPassword,
    });
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      if (mode === 'register') {
        await registerWithEmail({ firstName, surname, email, password });
        setResendCooldown(60);
      } else {
        await signInWithEmail({ email, password });
      }
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      const parsed = friendlyAuthError(err);
      setAuthBanner({ text: parsed.message, needsProviderEnable: parsed.needsProviderEnable });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthBanner(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const parsed = friendlyAuthError(err);
      setAuthBanner({ text: parsed.message, needsProviderEnable: parsed.needsProviderEnable });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setAuthBanner(null);
    if (!email.trim() || !email.includes('@')) {
      setErrors({ email: 'Enter your email address first to receive a reset link.' });
      return;
    }
    try {
      await sendPasswordReset(email);
      setAuthBanner({ text: `Password reset email sent to ${email.trim()}.` });
    } catch (err) {
      const parsed = friendlyAuthError(err);
      setAuthBanner({ text: parsed.message, needsProviderEnable: parsed.needsProviderEnable });
    }
  };

  const handleCheckVerification = async () => {
    setVerifyNotice(null);
    setSubmitting(true);
    try {
      const ok = await refreshVerificationStatus();
      if (!ok) {
        setVerifyNotice('Still waiting for verification. Click the link inside your inbox (or spam folder), then check again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setVerifyNotice(null);
    try {
      await resendVerificationEmail();
      setResendCooldown(60);
      setVerifyNotice('A fresh verification link was sent to your inbox.');
    } catch (err) {
      const parsed = friendlyAuthError(err);
      setVerifyNotice(parsed.message);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const stepErrors = validateNameStep({ firstName, surname });
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;

    await saveUserProfile({
      firstName,
      surname,
      phone,
      address,
      city,
      postalCode,
    });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2200);
  };

  const handleReorder = (orderIdx: number) => {
    const order = orders[orderIdx];
    if (!order) return;
    order.items.forEach((item, idx) => {
      const openDrawer = idx === order.items.length - 1;
      if (item.customSmoothie) {
        addCustomSmoothieToCart(item.customSmoothie, item.quantity, openDrawer);
      } else if (item.customCandle) {
        addCustomCandleToCart(item.customCandle, item.packSize, item.quantity, openDrawer);
      } else if (item.customMix) {
        const addonMap: Partial<Record<TrioAddonId, number>> = {};
        item.addons?.forEach((a) => {
          addonMap[a.id] = a.quantity;
        });
        addCustomPackToCart(item.customMix, addonMap);
      } else if (item.scentId !== 'custom-trio' && item.scentId !== 'custom-candle' && item.scentId !== 'custom-smoothie') {
        addToCart(item.scentId, item.packSize, item.quantity, openDrawer);
      }
    });
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: activeScent.surfaceWell,
    borderColor: `${activeScent.accentInk}22`,
  };

  const isCheckoutIntent = authReturnRoute?.page === 'checkout';

  // Unverified real Firebase account gate -> Step 3: Real Email Verification
  if (firebaseUser && !emailVerified) {
    return (
      <div className={`mx-auto px-4 py-8 sm:px-8 sm:py-12 ${isCheckoutIntent ? 'max-w-2xl' : 'max-w-md'}`}>
        {isCheckoutIntent && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => navigate({ page: 'cart' })}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white hover:opacity-80 cursor-pointer"
              style={{ textShadow: '0 1px 6px rgba(90, 70, 40, 0.18)' }}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Cart
            </button>
            <OrderJourneyBar currentStep="account" />
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: LUMA_EASE }}
          className="mx-auto max-w-md rounded-3xl border p-6 shadow-[0_24px_60px_rgba(60,40,80,0.16)] backdrop-blur-md sm:p-8"
          style={{
            backgroundColor: activeScent.surface,
            borderColor: `${activeScent.accentInk}1C`,
          }}
        >
          {isCheckoutIntent && (
            <div
              data-testid="checkout-auth-banner"
              className="mb-4 rounded-2xl border p-3.5 text-xs leading-relaxed"
              style={{
                backgroundColor: activeScent.surfaceWell,
                borderColor: `${activeScent.accentInk}26`,
                color: activeScent.accentInk,
              }}
            >
              {flowNotice ?? 'Verify your email once to continue automatically to Delivery & COD.'}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest" style={{ color: activeScent.accentInk }}>
            <MailCheck className="h-4 w-4" aria-hidden="true" />
            Step 3 of 3 · Verify Your Email
          </div>

          <h1 className="mt-3 font-display text-3xl font-extrabold text-[#2B2233]">
            Check your inbox
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#5D5368]">
            We sent a free verification link to{' '}
            <span className="font-semibold text-[#2B2233]">{firebaseUser.email}</span>. Click the link in your email to
            activate your Luma account and cloud order sync.
          </p>

          {verifyNotice && (
            <div
              className="mt-4 rounded-2xl border p-3.5 text-xs leading-relaxed text-[#2B2233]"
              style={{ backgroundColor: activeScent.surfaceWell, borderColor: `${activeScent.accentInk}22` }}
            >
              {verifyNotice}
            </div>
          )}

          <div className="mt-6 space-y-3">
            <button
              type="button"
              disabled={submitting}
              onClick={handleCheckVerification}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
              style={{ backgroundColor: activeScent.accentInk }}
            >
              <RefreshCw className={`h-4 w-4 ${submitting ? 'animate-spin' : ''}`} aria-hidden="true" />
              I Verified My Email
            </button>

            <button
              type="button"
              disabled={resendCooldown > 0}
              onClick={handleResendVerification}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-xs font-semibold transition-opacity hover:opacity-85 disabled:opacity-50 cursor-pointer"
              style={{
                backgroundColor: activeScent.surfaceWell,
                borderColor: `${activeScent.accentInk}22`,
                color: activeScent.accentInk,
              }}
            >
              {resendCooldown > 0 ? `Resend link in ${resendCooldown}s` : 'Resend Verification Email'}
            </button>

            <button
              type="button"
              onClick={signOut}
              className="w-full py-2 text-center text-xs font-medium text-[#5D5368] hover:text-[#2B2233] cursor-pointer"
            >
              Use a different email or sign out
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Signed-in & Verified Account Dashboard
  if (user && firebaseUser && emailVerified) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-10 sm:py-12">
        <div
          className="flex flex-wrap items-center justify-between gap-4 border-b border-white/30 pb-6"
          style={{ textShadow: '0 1px 6px rgba(90, 70, 40, 0.18)' }}
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/95">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Verified Luma Account</span>
            </div>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-white sm:text-4xl">{user.name}</h1>
            <p className="mt-1 text-sm text-white/95">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: activeScent.surface, color: activeScent.accentInk, textShadow: 'none' }}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign Out
          </button>
        </div>

        {cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: LUMA_EASE }}
            className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-5 shadow-[0_18px_45px_rgba(60,40,80,0.14)] backdrop-blur-md"
            style={{
              backgroundColor: activeScent.surface,
              borderColor: `${activeScent.accentInk}20`,
            }}
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: activeScent.accentInk }}>
                Items Ready in Your Cart
              </div>
              <p className="mt-0.5 text-sm font-semibold text-[#2B2233]">
                {cartSummary.totalItems} {cartSummary.totalItems === 1 ? 'item' : 'items'} · Total{' '}
                <span className="tabular-nums">{formatMoney(cartSummary.total)}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate({ page: 'cart' })}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: activeScent.accentInk }}
            >
              Review Cart &amp; Checkout
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: LUMA_EASE }}
          className="mt-8 grid gap-8 lg:grid-cols-12"
        >
          {/* Saved Delivery Profile (Split First Name & Surname) */}
          <form
            onSubmit={handleProfileSave}
            className="space-y-4 rounded-3xl border p-6 shadow-[0_24px_60px_rgba(60,40,80,0.14)] backdrop-blur-md lg:col-span-5"
            style={{
              backgroundColor: activeScent.surface,
              borderColor: `${activeScent.accentInk}1C`,
            }}
          >
            <h2 className="text-base font-bold" style={{ color: activeScent.accentInk }}>
              Saved Delivery Details
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="prof-first-name" className="block text-xs font-semibold text-[#2B2233]">
                  First Name
                </label>
                <input
                  id="prof-first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={inputStyle}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm text-[#2B2233] focus:outline-none"
                />
                {errors.firstName && <p className="mt-1 text-xs text-red-700">{errors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="prof-surname" className="block text-xs font-semibold text-[#2B2233]">
                  Surname
                </label>
                <input
                  id="prof-surname"
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  style={inputStyle}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm text-[#2B2233] focus:outline-none"
                />
                {errors.surname && <p className="mt-1 text-xs text-red-700">{errors.surname}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="prof-phone" className="block text-xs font-semibold text-[#2B2233]">
                Phone (for Courier COD)
              </label>
              <input
                id="prof-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="555-0192"
                style={inputStyle}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm text-[#2B2233] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="prof-address" className="block text-xs font-semibold text-[#2B2233]">
                Street Address
              </label>
              <input
                id="prof-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="420 Cedar Way"
                style={inputStyle}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm text-[#2B2233] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="prof-city" className="block text-xs font-semibold text-[#2B2233]">
                  City
                </label>
                <input
                  id="prof-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={inputStyle}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm text-[#2B2233] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="prof-postal" className="block text-xs font-semibold text-[#2B2233]">
                  Postal Code
                </label>
                <input
                  id="prof-postal"
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  style={inputStyle}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm text-[#2B2233] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: activeScent.accentInk }}
            >
              {savedNotice ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Preferences Saved
                </>
              ) : (
                'Save Preferences'
              )}
            </button>
          </form>

          {/* Order History */}
          <section className="space-y-4 lg:col-span-7" aria-labelledby="orders-heading">
            <h2
              id="orders-heading"
              className="text-base font-bold text-white"
              style={{ textShadow: '0 1px 6px rgba(90, 70, 40, 0.18)' }}
            >
              COD Order History
            </h2>
            {orders.length === 0 ? (
              <div
                className="rounded-3xl border p-8 text-center shadow-[0_24px_60px_rgba(60,40,80,0.14)] backdrop-blur-md"
                style={{
                  backgroundColor: activeScent.surface,
                  borderColor: `${activeScent.accentInk}1C`,
                }}
              >
                <Package className="mx-auto h-8 w-8" style={{ color: activeScent.accentInk }} aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-[#2B2233]">No orders yet</p>
                <p className="mt-1 text-xs text-[#5D5368]">Your Cash on Delivery orders will sync here automatically.</p>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'shop' })}
                  className="mt-5 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
                  style={{ backgroundColor: activeScent.accentInk }}
                >
                  Shop Blends
                </button>
              </div>
            ) : (
              <ul className="space-y-4">
                {orders.map((order, idx) => (
                  <li
                    key={order.orderNumber}
                    className="rounded-3xl border p-5 shadow-[0_20px_50px_rgba(60,40,80,0.14)] backdrop-blur-md sm:p-6"
                    style={{
                      backgroundColor: activeScent.surface,
                      borderColor: `${activeScent.accentInk}1C`,
                    }}
                  >
                    <div
                      className="flex flex-wrap items-center justify-between gap-2 border-b pb-3"
                      style={{ borderColor: `${activeScent.accentInk}16` }}
                    >
                      <div className="text-sm font-bold tabular-nums" style={{ color: activeScent.accentInk }}>
                        #{order.orderNumber} · {order.status}
                      </div>
                      <span className="text-xs text-[#5D5368] tabular-nums">
                        {new Date(order.placedAt).toLocaleDateString()} · {formatMoney(order.total)} · {order.paymentStatus}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-sm text-[#5D5368]">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.quantity}× {item.title}{' '}
                          {item.customSmoothie
                            ? `(${summarizeCustomSmoothie(item.customSmoothie)})`
                            : item.customCandle
                              ? `(${summarizeCustomCandle(item.customCandle)})`
                              : item.customMix
                                ? `(${summarizeCustomMix(item.customMix, item.addons)})`
                                : ''}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#5D5368]">
                      <span>{order.shippingAddress}</span>
                      <div className="flex items-center gap-2">
                        {order.status === 'Confirmed' && (
                          <button
                            type="button"
                            onClick={() => cancelOrder(order.orderNumber)}
                            className="rounded-xl px-3 py-1.5 font-semibold text-red-700 hover:bg-red-500/12 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleReorder(idx)}
                          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold transition-opacity hover:opacity-85 cursor-pointer"
                          style={{
                            backgroundColor: activeScent.surfaceWell,
                            color: activeScent.accentInk,
                          }}
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                          Reorder
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`mx-auto px-4 py-8 sm:px-8 sm:py-12 ${isCheckoutIntent ? 'max-w-2xl' : 'max-w-md'}`}>
      {isCheckoutIntent && (
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => navigate({ page: 'cart' })}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white hover:opacity-80 cursor-pointer"
              style={{ textShadow: '0 1px 6px rgba(90, 70, 40, 0.18)' }}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Cart
            </button>
            <span
              className="text-xs font-semibold text-white/95"
              style={{ textShadow: '0 1px 6px rgba(90, 70, 40, 0.18)' }}
            >
              Step 2 of 3 · Luma Account
            </span>
          </div>
          <OrderJourneyBar currentStep="account" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: LUMA_EASE }}
        className="mx-auto max-w-md rounded-3xl border p-5 shadow-[0_24px_60px_rgba(60,40,80,0.16)] backdrop-blur-md sm:p-8"
        style={{
          backgroundColor: activeScent.surface,
          borderColor: `${activeScent.accentInk}1C`,
        }}
      >
        {(isCheckoutIntent || flowNotice) && (
          <div
            data-testid="checkout-auth-banner"
            className="mb-4 flex items-start justify-between gap-3 rounded-2xl border p-3.5 text-xs leading-relaxed"
            style={{
              backgroundColor: activeScent.surfaceWell,
              borderColor: `${activeScent.accentInk}26`,
              color: activeScent.accentInk,
            }}
          >
            <span>
              {flowNotice ??
                'Account required before placing your COD order. Sign in or register below and we will continue straight to Delivery & COD.'}
            </span>
            {isCheckoutIntent && (
              <button
                type="button"
                onClick={() => navigate({ page: 'cart' })}
                className="shrink-0 font-bold underline cursor-pointer"
              >
                Return to Cart
              </button>
            )}
          </div>
        )}
        {/* Mode Switcher */}
        <div className="grid grid-cols-2 rounded-2xl p-1" style={{ backgroundColor: activeScent.surfaceWell }}>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrors({});
              setAuthBanner(null);
            }}
            className="relative min-h-[40px] rounded-xl py-2 text-xs font-semibold transition-colors cursor-pointer"
            style={
              mode === 'register'
                ? { backgroundColor: activeScent.accentInk, color: '#FFFFFF' }
                : { color: '#5D5368' }
            }
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrors({});
              setAuthBanner(null);
            }}
            className="relative min-h-[40px] rounded-xl py-2 text-xs font-semibold transition-colors cursor-pointer"
            style={
              mode === 'signin'
                ? { backgroundColor: activeScent.accentInk, color: '#FFFFFF' }
                : { color: '#5D5368' }
            }
          >
            Sign In
          </button>
        </div>

        <h1 className="mt-5 font-display text-3xl font-extrabold text-[#2B2233]">
          {mode === 'register' ? 'Join Luma' : 'Welcome back'}
        </h1>
        <p className="mt-1 text-sm text-[#5D5368]">
          {mode === 'register'
            ? 'Real account with free email verification & COD order tracking.'
            : 'Sign in to access your verified delivery profile and order history.'}
        </p>

        {/* Registration 2-Step Progress Strip */}
        {mode === 'register' && (
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold">
            <span style={{ color: activeScent.accentInk }}>
              {regStep === 1 ? '01. Your Name' : '01. Name ✓'}
            </span>
            <span className="h-px flex-1" style={{ backgroundColor: `${activeScent.accentInk}26` }} />
            <span style={{ color: regStep === 2 ? activeScent.accentInk : '#8A8094' }}>
              02. Email &amp; Password
            </span>
            <span className="h-px flex-1" style={{ backgroundColor: `${activeScent.accentInk}26` }} />
            <span className="text-[#8A8094]">03. Verify</span>
          </div>
        )}

        {authBanner && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border p-3.5 text-xs leading-relaxed text-[#2B2233]"
            style={{ backgroundColor: activeScent.surfaceWell, borderColor: `${activeScent.accentInk}30` }}
          >
            <p className="font-semibold text-red-700">{authBanner.text}</p>
            {authBanner.needsProviderEnable && (
              <div className="mt-2 space-y-1.5 text-[#5D5368]">
                <p>To enable free Email/Password + email verification in Firebase Console:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Open Authentication → Sign-in method in your Firebase Console.</li>
                  <li>Click &ldquo;Add new provider&rdquo; → select &ldquo;Email/Password&rdquo; → Enable &amp; Save.</li>
                </ol>
                <a
                  href={`https://console.firebase.google.com/project/${firebaseProjectId}/authentication/providers`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 font-semibold underline"
                  style={{ color: activeScent.accentInk }}
                >
                  Open Firebase Auth Providers
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} noValidate className="mt-5 space-y-4">
          <AnimatePresence mode="wait" initial={false}>
            {mode === 'register' && regStep === 1 && (
              <motion.div
                key="reg-step-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.22, ease: LUMA_EASE }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="reg-first-name" className="block text-xs font-semibold text-[#2B2233]">
                    First Name
                  </label>
                  <input
                    id="reg-first-name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    aria-invalid={Boolean(errors.firstName)}
                    placeholder="Clara"
                    style={inputStyle}
                    className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2B2233] focus:outline-none"
                  />
                  {errors.firstName && <p className="mt-1 text-xs text-red-700">{errors.firstName}</p>}
                </div>

                <div>
                  <label htmlFor="reg-surname" className="block text-xs font-semibold text-[#2B2233]">
                    Surname
                  </label>
                  <input
                    id="reg-surname"
                    type="text"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    autoComplete="family-name"
                    aria-invalid={Boolean(errors.surname)}
                    placeholder="Vance"
                    style={inputStyle}
                    className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2B2233] focus:outline-none"
                  />
                  {errors.surname && <p className="mt-1 text-xs text-red-700">{errors.surname}</p>}
                </div>

                <button
                  type="button"
                  data-testid="reg-next-step-btn"
                  onClick={handleNextNameStep}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
                  style={{ backgroundColor: activeScent.accentInk }}
                >
                  Continue to Email &amp; Password
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </motion.div>
            )}

            {(mode === 'signin' || (mode === 'register' && regStep === 2)) && (
              <motion.div
                key="reg-step-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.22, ease: LUMA_EASE }}
                className="space-y-4"
              >
                {mode === 'register' && (
                  <div
                    className="flex items-center justify-between rounded-2xl border px-3.5 py-2.5 text-xs"
                    style={{ backgroundColor: activeScent.surfaceWell, borderColor: `${activeScent.accentInk}1A` }}
                  >
                    <span className="font-semibold text-[#2B2233]">
                      {firstName.trim()} {surname.trim()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="inline-flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                      style={{ color: activeScent.accentInk }}
                    >
                      <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                      Edit Name
                    </button>
                  </div>
                )}

                <div>
                  <label htmlFor="reg-email" className="block text-xs font-semibold text-[#2B2233]">
                    Email Address
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    placeholder="clara@example.com"
                    style={inputStyle}
                    className="mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2B2233] focus:outline-none"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-700">{errors.email}</p>}
                </div>

                <PasswordField
                  id="reg-password"
                  testId="reg-password"
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  placeholder="At least 6 characters"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  error={errors.password}
                  inputStyle={inputStyle}
                  accentInk={activeScent.accentInk}
                />

                {mode === 'register' && password.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4].map((bar) => (
                        <span
                          key={bar}
                          className="h-1 flex-1 rounded-full transition-colors"
                          style={{
                            backgroundColor:
                              strength.score >= bar ? activeScent.accentInk : `${activeScent.accentInk}22`,
                          }}
                        />
                      ))}
                      <span className="ml-1 text-[11px] font-semibold" style={{ color: activeScent.accentInk }}>
                        {strength.label}
                      </span>
                    </div>
                  </div>
                )}

                {mode === 'register' && (
                  <>
                    <PasswordField
                      id="reg-confirm-password"
                      testId="reg-confirm-password"
                      label="Verify Password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      error={errors.confirmPassword}
                      inputStyle={inputStyle}
                      accentInk={activeScent.accentInk}
                    />
                    {confirmPassword.length > 0 && !errors.confirmPassword && (
                      <p
                        className={`flex items-center gap-1.5 text-xs font-medium ${
                          confirmPassword === password ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {confirmPassword === password ? 'Passwords match' : 'Passwords do not match yet'}
                      </p>
                    )}
                  </>
                )}

                {mode === 'signin' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs font-semibold hover:underline cursor-pointer"
                      style={{ color: activeScent.accentInk }}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[44px] w-full rounded-xl px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
                  style={{ backgroundColor: activeScent.accentInk }}
                >
                  {submitting
                    ? 'Please wait...'
                    : mode === 'register'
                      ? 'Create Account & Send Verification'
                      : 'Sign In'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Google Instant Verified Sign-In */}
        <div className="mt-5">
          <div className="relative flex items-center py-2">
            <span className="flex-1 border-t" style={{ borderColor: `${activeScent.accentInk}1C` }} />
            <span className="px-3 text-xs text-[#5D5368]">or</span>
            <span className="flex-1 border-t" style={{ borderColor: `${activeScent.accentInk}1C` }} />
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleGoogleAuth}
            className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-xl border px-4 py-2.5 text-xs font-semibold text-[#2B2233] transition-colors hover:bg-black/5 disabled:opacity-60 cursor-pointer"
            style={{
              backgroundColor: activeScent.surfaceWell,
              borderColor: `${activeScent.accentInk}22`,
            }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </motion.div>
    </div>
  );
}
