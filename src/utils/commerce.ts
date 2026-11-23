import {
  CANDLE_FONTS,
  CUSTOM_CANDLE_PRICING,
  FREE_SHIPPING_THRESHOLD,
  PACK_PRICING,
  SCENTS,
  SMOOTHIE_FRUITS,
  SMOOTHIE_SIZE_OPTIONS,
  SMOOTHIE_SWEETNESS_LEVELS,
  SMOOTHIE_TOPPINGS,
  STANDARD_SHIPPING_FEE,
  TRIO_ADDONS,
  type BenefitCategory,
  type CandleFontId,
  type CandleInkId,
  type PackSize,
  type ScentId,
  type ScentSpec,
  type SmoothieFruitId,
  type SmoothieSizeId,
  type SmoothieToppingId,
  type SweetnessLevel,
  type TrioAddonId,
} from '../data/products';

export type NutritionHighlightBadge = 'High Vitamin C' | 'Energy Boost';

export interface CartAddonLine {
  id: TrioAddonId;
  name: string;
  unitPrice: number;
  quantity: number;
  extraCandles: number;
}

export interface CustomCandleSpec {
  vesselColorId: string;
  vesselColorName: string;
  vesselColorHex: string;
  scentId: ScentId;
  secondaryScentId?: ScentId;
  customText: string;
  customSubtext?: string;
  fontId: CandleFontId;
  fontLabel: string;
  inkId: CandleInkId;
  inkHex: string;
}

export interface CustomSmoothieBlendSpec {
  fruits: SmoothieFruitId[];
  toppings: SmoothieToppingId[];
  sweetness: SweetnessLevel;
  size: SmoothieSizeId;
  customText: string;
  fontId: CandleFontId;
  fontLabel: string;
}

export interface CartItem {
  id: string;
  scentId: ScentId | 'custom-trio' | 'custom-candle' | 'custom-smoothie';
  title: string;
  packSize: PackSize;
  unitPrice: number;
  quantity: number;
  customMix?: ScentId[];
  addons?: CartAddonLine[];
  customCandle?: CustomCandleSpec;
  customSmoothie?: CustomSmoothieBlendSpec;
}

export interface CartSummary {
  totalItems: number;
  totalCandles: number;
  subtotal: number;
  shipping: number;
  total: number;
  amountToFreeShipping: number;
  freeShippingProgressPct: number;
}

export interface UserProfile {
  uid?: string;
  firstName: string;
  surname: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  createdAt: string;
}

export type CodPaymentMethod = 'cod' | 'cod-pos';

export interface OrderRecord {
  orderNumber: string;
  placedAt: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  firstName: string;
  surname: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  deliveryNotes?: string;
  paymentMethod: CodPaymentMethod;
  paymentStatus: 'Cash Due on Delivery';
  status: 'Confirmed' | 'Cancelled';
}

export type AppRoute =
  | { page: 'hero' }
  | { page: 'shop' }
  | { page: 'design' }
  | { page: 'scent'; scentId: ScentId }
  | { page: 'cart' }
  | { page: 'checkout' }
  | { page: 'register' };

export function parseHashRoute(hash: string): AppRoute {
  const clean = hash.replace(/^#\/?/, '').trim().toLowerCase();
  if (!clean || clean === 'hero') return { page: 'hero' };
  if (clean === 'shop') return { page: 'shop' };
  if (clean === 'design' || clean === 'blend' || clean === 'build-blend' || clean === 'custom' || clean === 'builder') {
    return { page: 'design' };
  }
  if (clean === 'cart' || clean === 'bag') return { page: 'cart' };
  if (clean === 'checkout') return { page: 'checkout' };
  if (clean === 'register' || clean === 'account' || clean === 'login') return { page: 'register' };
  if (clean.startsWith('scent/')) {
    const id = clean.slice('scent/'.length) as ScentId;
    if (SCENTS.some((s) => s.id === id)) {
      return { page: 'scent', scentId: id };
    }
    return { page: 'scent', scentId: 'iris' };
  }
  return { page: 'hero' };
}

export function routeToHash(route: AppRoute): string {
  switch (route.page) {
    case 'hero':
      return '#hero';
    case 'shop':
      return '#shop';
    case 'design':
      return '#design';
    case 'scent':
      return `#scent/${route.scentId}`;
    case 'cart':
      return '#cart';
    case 'checkout':
      return '#checkout';
    case 'register':
      return '#register';
  }
}

export type CheckoutRedirectReason = 'empty-cart' | 'review-cart' | 'sign-in' | 'verify-email';

export type CheckoutAccessResult =
  | { allowed: true }
  | {
      allowed: false;
      redirectTo: AppRoute;
      reason: CheckoutRedirectReason;
      setReturnToCheckout: boolean;
    };

/**
 * Pure UX funnel guard for Checkout:
 * 1. Cannot checkout with an empty cart -> forces #cart
 * 2. Must have visited & reviewed the Cart page (#cart) -> forces #cart
 * 3. Must have a signed-in account -> routes to #register with returnTo=#checkout
 * 4. Must have verified email -> routes to #register verification gate with returnTo=#checkout
 */
export function evaluateCheckoutAccess(input: {
  cartItemCount: number;
  cartReviewed: boolean;
  isSignedIn: boolean;
  isEmailVerified: boolean;
}): CheckoutAccessResult {
  if (input.cartItemCount <= 0) {
    return {
      allowed: false,
      redirectTo: { page: 'cart' },
      reason: 'empty-cart',
      setReturnToCheckout: false,
    };
  }
  if (!input.cartReviewed) {
    return {
      allowed: false,
      redirectTo: { page: 'cart' },
      reason: 'review-cart',
      setReturnToCheckout: false,
    };
  }
  if (!input.isSignedIn) {
    return {
      allowed: false,
      redirectTo: { page: 'register' },
      reason: 'sign-in',
      setReturnToCheckout: true,
    };
  }
  if (!input.isEmailVerified) {
    return {
      allowed: false,
      redirectTo: { page: 'register' },
      reason: 'verify-email',
      setReturnToCheckout: true,
    };
  }
  return { allowed: true };
}

export function evaluateCartProceedAction(input: {
  cartItemCount: number;
  isSignedIn: boolean;
  isEmailVerified: boolean;
}): {
  nextRoute: AppRoute;
  setReturnToCheckout: boolean;
  reason: 'empty' | 'needs-auth' | 'needs-verify' | 'ready';
} {
  if (input.cartItemCount <= 0) {
    return { nextRoute: { page: 'shop' }, setReturnToCheckout: false, reason: 'empty' };
  }
  if (!input.isSignedIn) {
    return { nextRoute: { page: 'register' }, setReturnToCheckout: true, reason: 'needs-auth' };
  }
  if (!input.isEmailVerified) {
    return { nextRoute: { page: 'register' }, setReturnToCheckout: true, reason: 'needs-verify' };
  }
  return { nextRoute: { page: 'checkout' }, setReturnToCheckout: false, reason: 'ready' };
}

export function getNutritionHighlightBadge(scent: ScentSpec): NutritionHighlightBadge {
  const vitC = scent.nutrition.vitamins.find((v) => v.label.toLowerCase().includes('vitamin c'));
  const dvNum = vitC ? parseInt(vitC.dailyValue.replace(/[^0-9]/g, ''), 10) : 0;
  if (dvNum >= 120) {
    return 'High Vitamin C';
  }
  return 'Energy Boost';
}

export function normalizeSelectedAddons(
  addonCounts: Partial<Record<TrioAddonId, number>>
): CartAddonLine[] {
  const lines: CartAddonLine[] = [];
  for (const addon of TRIO_ADDONS) {
    const qty = Math.max(0, Math.min(5, Math.floor(addonCounts[addon.id] ?? 0)));
    if (qty > 0) {
      lines.push({
        id: addon.id,
        name: addon.name,
        unitPrice: addon.price,
        quantity: qty,
        extraCandles: addon.extraCandles,
      });
    }
  }
  return lines;
}

export function computeTrioBundlePrice(
  addonCounts: Partial<Record<TrioAddonId, number>> = {}
): { basePrice: number; addonsPrice: number; totalPrice: number; addonCount: number } {
  const basePrice = PACK_PRICING[3].price;
  const lines = normalizeSelectedAddons(addonCounts);
  const addonsPrice = roundMoney(lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0));
  const addonCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  return {
    basePrice,
    addonsPrice,
    totalPrice: roundMoney(basePrice + addonsPrice),
    addonCount,
  };
}

export function makeStandardCartItem(scentId: ScentId, packSize: PackSize, quantity = 1): CartItem {
  const scent = SCENTS.find((s) => s.id === scentId) ?? SCENTS[0];
  const pricing = PACK_PRICING[packSize];
  return {
    id: `${scent.id}-${packSize}`,
    scentId: scent.id,
    title: `${scent.name} Candle`,
    packSize,
    unitPrice: pricing.price,
    quantity: Math.max(1, Math.min(20, quantity)),
  };
}

export function makeCustomTrioCartItem(
  mix: ScentId[],
  addonCounts: Partial<Record<TrioAddonId, number>> = {}
): CartItem {
  const sortedMix = [...mix].sort();
  const addons = normalizeSelectedAddons(addonCounts);
  const addonKey = addons.map((a) => `${a.id}x${a.quantity}`).join('+');
  const pricing = computeTrioBundlePrice(addonCounts);

  return {
    id: addonKey ? `custom-trio-${sortedMix.join('-')}__${addonKey}` : `custom-trio-${sortedMix.join('-')}`,
    scentId: 'custom-trio',
    title: addons.length > 0 ? 'Custom Trio + Studio Add-Ons' : 'Custom 3-Candle Trio',
    packSize: 3,
    unitPrice: pricing.totalPrice,
    quantity: 1,
    customMix: mix,
    addons: addons.length > 0 ? addons : undefined,
  };
}

export function makeCustomCandleCartItem(
  spec: CustomCandleSpec,
  packSize: PackSize = 1,
  quantity = 1
): CartItem {
  const primaryScent = SCENTS.find((s) => s.id === spec.scentId) ?? SCENTS[0];
  const secondaryScent = spec.secondaryScentId
    ? SCENTS.find((s) => s.id === spec.secondaryScentId)
    : undefined;
  const pricing = CUSTOM_CANDLE_PRICING[packSize];
  const cleanText = spec.customText.trim().slice(0, 28);
  const cleanSubtext = (spec.customSubtext ?? '').trim().slice(0, 24);
  const fontOpt = CANDLE_FONTS.find((f) => f.id === spec.fontId) ?? CANDLE_FONTS[0];

  const signature = [
    spec.vesselColorId,
    spec.vesselColorHex.replace('#', ''),
    spec.scentId,
    spec.secondaryScentId ?? 'none',
    cleanText.toLowerCase().replace(/\s+/g, '_'),
    cleanSubtext.toLowerCase().replace(/\s+/g, '_'),
    spec.fontId,
    spec.inkId,
    String(packSize),
  ].join('-');

  const blendTitle = secondaryScent ? `${primaryScent.name} + ${secondaryScent.name}` : primaryScent.name;

  return {
    id: `custom-candle-${signature}`,
    scentId: 'custom-candle',
    title: `Bespoke ${blendTitle}`,
    packSize,
    unitPrice: pricing.price,
    quantity: Math.max(1, Math.min(20, quantity)),
    customCandle: {
      ...spec,
      customText: cleanText,
      customSubtext: cleanSubtext,
      fontLabel: fontOpt.name,
    },
  };
}

export function summarizeCustomCandle(spec: CustomCandleSpec): string {
  const primary = SCENTS.find((s) => s.id === spec.scentId)?.name ?? 'Iris';
  const secondary = spec.secondaryScentId
    ? SCENTS.find((s) => s.id === spec.secondaryScentId)?.name
    : undefined;
  const scentText = secondary ? `${primary} + ${secondary}` : primary;
  const parts = [spec.vesselColorName, scentText];
  if (spec.customText.trim()) {
    parts.push(`"${spec.customText.trim()}" (${spec.fontLabel})`);
  } else {
    parts.push('Blank Label');
  }
  return parts.join(' · ');
}

export function toggleFruitBase(current: readonly SmoothieFruitId[], fruitId: SmoothieFruitId): SmoothieFruitId[] {
  if (current.includes(fruitId)) {
    return current.filter((id) => id !== fruitId);
  }
  if (current.length >= 3) {
    return [...current];
  }
  return [...current, fruitId];
}

export function toggleTopping(current: readonly SmoothieToppingId[], toppingId: SmoothieToppingId): SmoothieToppingId[] {
  if (current.includes(toppingId)) {
    return current.filter((id) => id !== toppingId);
  }
  return [...current, toppingId];
}

export interface BlendProgressState {
  fruitCount: number;
  maxFruits: number;
  toppingCount: number;
  hasFruits: boolean;
  isFruitBaseFull: boolean;
  hasToppings: boolean;
  /** Progress ratio in [0, 1]: 0.25 per fruit base (up to 3) + 0.25 when at least 1 topping is selected */
  ratio: number;
  percent: number;
  activeStep: 'fruits' | 'toppings' | 'ready';
}

export function computeBlendProgress(input: {
  fruits: readonly SmoothieFruitId[];
  toppings: readonly SmoothieToppingId[];
}): BlendProgressState {
  const maxFruits = 3;
  const fruitCount = Math.min(maxFruits, input.fruits.length);
  const toppingCount = input.toppings.length;
  const hasFruits = fruitCount > 0;
  const isFruitBaseFull = fruitCount >= maxFruits;
  const hasToppings = toppingCount > 0;

  const ratio = Number(((fruitCount / maxFruits) * 0.75 + (hasToppings ? 0.25 : 0)).toFixed(4));
  const percent = Math.round(ratio * 100);

  let activeStep: BlendProgressState['activeStep'] = 'fruits';
  if (hasFruits && hasToppings) {
    activeStep = 'ready';
  } else if (isFruitBaseFull && !hasToppings) {
    activeStep = 'toppings';
  }

  return {
    fruitCount,
    maxFruits,
    toppingCount,
    hasFruits,
    isFruitBaseFull,
    hasToppings,
    ratio,
    percent,
    activeStep,
  };
}

export function computeBlendVisualColors(fruits: readonly SmoothieFruitId[]): {
  topHex: string;
  midHex: string;
  bottomHex: string;
  accentInk: string;
  primaryScentId: ScentId;
} {
  const picked = fruits
    .map((id) => SMOOTHIE_FRUITS.find((f) => f.id === id))
    .filter((f): f is (typeof SMOOTHIE_FRUITS)[number] => Boolean(f));

  if (picked.length === 0) {
    return {
      topHex: '#E9DFEE',
      midHex: '#D5C7DF',
      bottomHex: '#C2B0DC',
      accentInk: '#4A3566',
      primaryScentId: 'iris',
    };
  }

  const first = picked[0];
  const second = picked[1] ?? first;
  const third = picked[2] ?? second;

  const fruitToScent: Record<SmoothieFruitId, ScentId> = {
    strawberry: 'geranium',
    mango: 'bergamot',
    blueberry: 'iris',
    kiwi: 'sage',
    fig: 'fig',
    yuzu: 'yuzu',
  };

  return {
    topHex: first.hex,
    midHex: second.swirlHex,
    bottomHex: third.hex,
    accentInk: first.accentInk,
    primaryScentId: fruitToScent[first.id],
  };
}

export function computeSmoothiePricing(spec: Pick<CustomSmoothieBlendSpec, 'toppings' | 'size'>): {
  basePrice: number;
  toppingsPrice: number;
  unitPrice: number;
} {
  const sizeOpt = SMOOTHIE_SIZE_OPTIONS[spec.size] ?? SMOOTHIE_SIZE_OPTIONS['16oz'];
  const perBottleToppings = spec.toppings.reduce((sum, id) => {
    const t = SMOOTHIE_TOPPINGS.find((item) => item.id === id);
    return sum + (t?.price ?? 0);
  }, 0);
  const toppingsPrice = roundMoney(perBottleToppings * sizeOpt.bottleCount);
  const unitPrice = roundMoney(sizeOpt.price + toppingsPrice);
  return {
    basePrice: sizeOpt.price,
    toppingsPrice,
    unitPrice,
  };
}

export function computeSmoothieNutrition(
  spec: Pick<CustomSmoothieBlendSpec, 'fruits' | 'toppings' | 'sweetness' | 'size'>
): {
  calories: number;
  proteinG: number;
  fiberG: number;
  sugarG: number;
  vitaminCDvPct: number;
} {
  const sizeOpt = SMOOTHIE_SIZE_OPTIONS[spec.size] ?? SMOOTHIE_SIZE_OPTIONS['16oz'];
  const fFactor = sizeOpt.nutritionFactor;
  const pickedFruits = spec.fruits
    .map((id) => SMOOTHIE_FRUITS.find((f) => f.id === id))
    .filter((f): f is (typeof SMOOTHIE_FRUITS)[number] => Boolean(f));

  let baseCalories = 0;
  let baseProtein = 0;
  let baseFiber = 0;
  let baseSugar = 0;
  let baseVitC = 0;

  if (pickedFruits.length > 0) {
    // 250ml total fruit press proportioned equally across selected bases (scaled up cleanly for full smoothie press)
    const share = 2.0 / pickedFruits.length;
    pickedFruits.forEach((f) => {
      baseCalories += f.calories * share * fFactor;
      baseProtein += f.proteinG * share * fFactor;
      baseFiber += f.fiberG * share * fFactor;
      baseSugar += f.sugarG * share * fFactor;
      baseVitC += f.vitaminCDvPct * share * fFactor;
    });
  }

  let toppingCalories = 0;
  let toppingProtein = 0;
  let toppingFiber = 0;
  let toppingSugar = 0;
  spec.toppings.forEach((tId) => {
    const t = SMOOTHIE_TOPPINGS.find((item) => item.id === tId);
    if (t) {
      toppingCalories += t.calories;
      toppingProtein += t.proteinG;
      toppingFiber += t.fiberG;
      toppingSugar += t.sugarG;
    }
  });

  const sweetOpt =
    SMOOTHIE_SWEETNESS_LEVELS.find((s) => s.level === spec.sweetness) ?? SMOOTHIE_SWEETNESS_LEVELS[2];

  return {
    calories: Math.round(baseCalories + toppingCalories + sweetOpt.addedCalories * fFactor),
    proteinG: Math.round(baseProtein + toppingProtein),
    fiberG: Math.round(baseFiber + toppingFiber),
    sugarG: Math.round(baseSugar + toppingSugar + sweetOpt.addedSugarG * fFactor),
    vitaminCDvPct: Math.round(baseVitC),
  };
}

export function summarizeCustomSmoothie(spec: CustomSmoothieBlendSpec): string {
  const fruitNames = spec.fruits
    .map((id) => SMOOTHIE_FRUITS.find((f) => f.id === id)?.shortName)
    .filter(Boolean);
  const toppingNames = spec.toppings
    .map((id) => SMOOTHIE_TOPPINGS.find((t) => t.id === id)?.shortName)
    .filter(Boolean);
  const sizeOpt = SMOOTHIE_SIZE_OPTIONS[spec.size] ?? SMOOTHIE_SIZE_OPTIONS['16oz'];

  const parts: string[] = [
    fruitNames.length > 0 ? fruitNames.join(' + ') : 'Custom Press',
    `${spec.sweetness}% Sweet`,
    sizeOpt.shortLabel,
  ];
  if (toppingNames.length > 0) {
    parts.splice(1, 0, `+${toppingNames.join(', ')}`);
  }
  if (spec.customText.trim()) {
    parts.push(`"${spec.customText.trim()}"`);
  }
  return parts.join(' · ');
}

export function makeCustomSmoothieCartItem(spec: CustomSmoothieBlendSpec, quantity = 1): CartItem {
  const cleanFruits = spec.fruits.slice(0, 3);
  const cleanText = spec.customText.trim().slice(0, 28);
  const fontOpt = CANDLE_FONTS.find((f) => f.id === spec.fontId) ?? CANDLE_FONTS[0];
  const pricing = computeSmoothiePricing(spec);
  const sizeOpt = SMOOTHIE_SIZE_OPTIONS[spec.size] ?? SMOOTHIE_SIZE_OPTIONS['16oz'];
  const fruitNames = cleanFruits
    .map((id) => SMOOTHIE_FRUITS.find((f) => f.id === id)?.shortName)
    .filter(Boolean);

  const sortedToppings = [...spec.toppings].sort();
  const signature = [
    cleanFruits.join('+'),
    sortedToppings.join('+') || 'plain',
    `sw${spec.sweetness}`,
    spec.size,
    spec.fontId,
    cleanText.toLowerCase().replace(/\s+/g, '_') || 'nolabel',
  ].join('-');

  return {
    id: `custom-smoothie-${signature}`,
    scentId: 'custom-smoothie',
    title: cleanText ? `${cleanText} Blend` : `${fruitNames.join(' + ') || 'Custom'} Smoothie`,
    packSize: sizeOpt.bottleCount as PackSize,
    unitPrice: pricing.unitPrice,
    quantity: Math.max(1, Math.min(20, quantity)),
    customSmoothie: {
      ...spec,
      fruits: cleanFruits,
      toppings: sortedToppings,
      customText: cleanText,
      fontLabel: fontOpt.name,
    },
  };
}

export function upsertCartItem(items: CartItem[], incoming: CartItem): CartItem[] {
  const existing = items.find((item) => item.id === incoming.id);
  if (existing) {
    return items.map((item) =>
      item.id === incoming.id
        ? { ...item, quantity: Math.min(20, item.quantity + incoming.quantity) }
        : item
    );
  }
  return [...items, incoming];
}

export function updateCartQuantity(items: CartItem[], id: string, delta: number): CartItem[] {
  return items
    .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
    .filter((item) => item.quantity > 0);
}

export function computeCartSummary(items: CartItem[]): CartSummary {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCandles = items.reduce((sum, item) => {
    const addonCandles = (item.addons ?? []).reduce((aSum, a) => aSum + a.extraCandles * a.quantity, 0);
    return sum + (item.packSize + addonCandles) * item.quantity;
  }, 0);
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const total = roundMoney(subtotal + shipping);
  const amountToFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : roundMoney(FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgressPct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  return {
    totalItems,
    totalCandles,
    subtotal,
    shipping,
    total,
    amountToFreeShipping,
    freeShippingProgressPct,
  };
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

export interface ValidationErrors {
  [field: string]: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function evaluatePasswordStrength(password: string): {
  score: number;
  label: string;
  hasMinLen: boolean;
  hasUpperOrNumber: boolean;
  hasSpecialOrLong: boolean;
} {
  const hasMinLen = password.length >= 6;
  const hasUpperOrNumber = /[A-Z]/.test(password) && /[0-9]/.test(password);
  const hasSpecialOrLong = /[^A-Za-z0-9]/.test(password) || password.length >= 10;

  let score = 0;
  if (hasMinLen) score += 1;
  if (/[A-Z]/.test(password) || /[0-9]/.test(password)) score += 1;
  if (hasUpperOrNumber) score += 1;
  if (hasSpecialOrLong && hasMinLen) score += 1;

  const label = score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong';
  return { score, label, hasMinLen, hasUpperOrNumber, hasSpecialOrLong };
}

export function validateNameStep(input: { firstName: string; surname: string }): ValidationErrors {
  const errors: ValidationErrors = {};
  if (input.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters.';
  }
  if (input.surname.trim().length < 2) {
    errors.surname = 'Surname must be at least 2 characters.';
  }
  return errors;
}

export function validateRegistration(input: {
  mode: 'register' | 'signin';
  firstName: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  if (input.mode === 'register') {
    Object.assign(errors, validateNameStep({ firstName: input.firstName, surname: input.surname }));
  }
  if (!EMAIL_RE.test(input.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (input.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }
  if (input.mode === 'register' && input.confirmPassword !== input.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}

export function validateCheckoutForm(input: {
  firstName: string;
  surname: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  if (input.firstName.trim().length < 2) errors.firstName = 'First name is required.';
  if (input.surname.trim().length < 2) errors.surname = 'Surname is required.';
  if (!EMAIL_RE.test(input.email.trim())) errors.email = 'Valid email is required.';
  if (input.phone.trim().length < 7) errors.phone = 'Valid phone number is required for courier COD call.';
  if (input.address.trim().length < 5) errors.address = 'Street address is required.';
  if (input.city.trim().length < 2) errors.city = 'City is required.';
  if (input.postalCode.trim().length < 3) errors.postalCode = 'Postal code is required.';
  return errors;
}

export type BenefitFilterMode = 'all' | BenefitCategory;

export function filterProductsByBenefit(
  scents: readonly ScentSpec[],
  filter: BenefitFilterMode
): readonly ScentSpec[] {
  if (filter === 'all') return scents;
  return scents.filter((s) => s.benefits.includes(filter));
}

export function summarizeCustomMix(mix: ScentId[], addons?: CartAddonLine[]): string {
  const counts: Partial<Record<ScentId, number>> = {};
  mix.forEach((id) => {
    counts[id] = (counts[id] ?? 0) + 1;
  });
  const baseText = SCENTS.filter((s) => (counts[s.id] ?? 0) > 0)
    .map((s) => `${counts[s.id]}× ${s.name}`)
    .join(' · ');

  if (!addons || addons.length === 0) return baseText;
  const addonText = addons.map((a) => `${a.quantity}× ${a.name}`).join(' · ');
  return `${baseText} + ${addonText}`;
}
