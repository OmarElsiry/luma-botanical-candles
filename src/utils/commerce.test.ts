import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENTS } from '../data/products';
import {
  computeBlendProgress,
  computeBlendVisualColors,
  computeCartSummary,
  computeSmoothieNutrition,
  computeSmoothiePricing,
  computeTrioBundlePrice,
  evaluateCartProceedAction,
  evaluateCheckoutAccess,
  evaluatePasswordStrength,
  filterProductsByBenefit,
  getNutritionHighlightBadge,
  makeCustomCandleCartItem,
  makeCustomSmoothieCartItem,
  makeCustomTrioCartItem,
  makeStandardCartItem,
  parseHashRoute,
  routeToHash,
  summarizeCustomCandle,
  summarizeCustomMix,
  summarizeCustomSmoothie,
  toggleFruitBase,
  toggleTopping,
  updateCartQuantity,
  upsertCartItem,
  validateCheckoutForm,
  validateNameStep,
  validateRegistration,
} from './commerce';

test('hash routing parses and serializes all Luma SPA routes including build blend studio', () => {
  assert.deepEqual(parseHashRoute(''), { page: 'hero' });
  assert.deepEqual(parseHashRoute('#shop'), { page: 'shop' });
  assert.deepEqual(parseHashRoute('#design'), { page: 'design' });
  assert.deepEqual(parseHashRoute('#blend'), { page: 'design' });
  assert.deepEqual(parseHashRoute('#custom'), { page: 'design' });
  assert.deepEqual(parseHashRoute('#scent/sage'), { page: 'scent', scentId: 'sage' });
  assert.deepEqual(parseHashRoute('#scent/fig'), { page: 'scent', scentId: 'fig' });
  assert.deepEqual(parseHashRoute('#scent/yuzu'), { page: 'scent', scentId: 'yuzu' });
  assert.deepEqual(parseHashRoute('#scent/unknown'), { page: 'scent', scentId: 'iris' });
  assert.deepEqual(parseHashRoute('#cart'), { page: 'cart' });
  assert.deepEqual(parseHashRoute('#bag'), { page: 'cart' });
  assert.deepEqual(parseHashRoute('#checkout'), { page: 'checkout' });
  assert.deepEqual(parseHashRoute('#register'), { page: 'register' });
  assert.deepEqual(parseHashRoute('#craft'), { page: 'hero' });
  assert.equal(routeToHash({ page: 'cart' }), '#cart');
  assert.equal(routeToHash({ page: 'design' }), '#design');
  assert.equal(routeToHash({ page: 'scent', scentId: 'bergamot' }), '#scent/bergamot');
});

test('checkout funnel guard enforces cart review and verified account before ordering', () => {
  assert.deepEqual(
    evaluateCheckoutAccess({
      cartItemCount: 0,
      cartReviewed: true,
      isSignedIn: true,
      isEmailVerified: true,
    }),
    {
      allowed: false,
      redirectTo: { page: 'cart' },
      reason: 'empty-cart',
      setReturnToCheckout: false,
    }
  );

  assert.deepEqual(
    evaluateCheckoutAccess({
      cartItemCount: 2,
      cartReviewed: false,
      isSignedIn: true,
      isEmailVerified: true,
    }),
    {
      allowed: false,
      redirectTo: { page: 'cart' },
      reason: 'review-cart',
      setReturnToCheckout: false,
    }
  );

  assert.deepEqual(
    evaluateCheckoutAccess({
      cartItemCount: 2,
      cartReviewed: true,
      isSignedIn: false,
      isEmailVerified: false,
    }),
    {
      allowed: false,
      redirectTo: { page: 'register' },
      reason: 'sign-in',
      setReturnToCheckout: true,
    }
  );

  assert.deepEqual(
    evaluateCheckoutAccess({
      cartItemCount: 2,
      cartReviewed: true,
      isSignedIn: true,
      isEmailVerified: false,
    }),
    {
      allowed: false,
      redirectTo: { page: 'register' },
      reason: 'verify-email',
      setReturnToCheckout: true,
    }
  );

  assert.deepEqual(
    evaluateCheckoutAccess({
      cartItemCount: 2,
      cartReviewed: true,
      isSignedIn: true,
      isEmailVerified: true,
    }),
    { allowed: true }
  );

  assert.deepEqual(
    evaluateCartProceedAction({ cartItemCount: 1, isSignedIn: false, isEmailVerified: false }),
    { nextRoute: { page: 'register' }, setReturnToCheckout: true, reason: 'needs-auth' }
  );

  assert.deepEqual(
    evaluateCartProceedAction({ cartItemCount: 1, isSignedIn: true, isEmailVerified: false }),
    { nextRoute: { page: 'register' }, setReturnToCheckout: true, reason: 'needs-verify' }
  );

  assert.deepEqual(
    evaluateCartProceedAction({ cartItemCount: 1, isSignedIn: true, isEmailVerified: true }),
    { nextRoute: { page: 'checkout' }, setReturnToCheckout: false, reason: 'ready' }
  );
});

test('benefit category filtering sorts 6 products accurately and derives High Vitamin C / Energy Boost badges', () => {
  assert.equal(filterProductsByBenefit(SCENTS, 'all').length, 6);
  assert.deepEqual(
    filterProductsByBenefit(SCENTS, 'energizing').map((s) => s.id),
    ['sage', 'bergamot', 'geranium', 'fig', 'yuzu']
  );
  assert.deepEqual(
    filterProductsByBenefit(SCENTS, 'post-workout').map((s) => s.id),
    ['iris', 'geranium', 'fig']
  );
  assert.deepEqual(
    filterProductsByBenefit(SCENTS, 'morning').map((s) => s.id),
    ['iris', 'sage', 'bergamot', 'yuzu']
  );

  const badges = new Map(SCENTS.map((s) => [s.id, getNutritionHighlightBadge(s)]));
  assert.equal(badges.get('sage'), 'High Vitamin C');
  assert.equal(badges.get('bergamot'), 'High Vitamin C');
  assert.equal(badges.get('yuzu'), 'High Vitamin C');
  assert.equal(badges.get('iris'), 'Energy Boost');
  assert.equal(badges.get('geranium'), 'Energy Boost');
  assert.equal(badges.get('fig'), 'Energy Boost');
});

test('Build Your Blend enforces up to 3 fruit bases, toppings, sweetness nutrition, and pricing', () => {
  let fruits = toggleFruitBase(['strawberry'], 'mango');
  fruits = toggleFruitBase(fruits, 'kiwi');
  assert.deepEqual(fruits, ['strawberry', 'mango', 'kiwi']);

  // Attempting a 4th fruit base caps cleanly at 3
  const capped = toggleFruitBase(fruits, 'yuzu');
  assert.deepEqual(capped, ['strawberry', 'mango', 'kiwi']);

  // Deselecting works
  const removed = toggleFruitBase(capped, 'mango');
  assert.deepEqual(removed, ['strawberry', 'kiwi']);

  let toppings = toggleTopping([], 'chia');
  toppings = toggleTopping(toppings, 'granola');
  assert.deepEqual(toppings, ['chia', 'granola']);
  assert.deepEqual(toggleTopping(toppings, 'chia'), ['granola']);

  const pricing = computeSmoothiePricing({ toppings: ['chia', 'granola'], size: '16oz' });
  assert.equal(pricing.basePrice, 11.5);
  assert.equal(pricing.toppingsPrice, 2.25);
  assert.equal(pricing.unitPrice, 13.75);

  const pack3Pricing = computeSmoothiePricing({ toppings: ['chia'], size: 'pack3' });
  assert.equal(pack3Pricing.basePrice, 31.0);
  assert.equal(pack3Pricing.toppingsPrice, 3.0);
  assert.equal(pack3Pricing.unitPrice, 34.0);

  const zeroSweet = computeSmoothieNutrition({
    fruits: ['strawberry', 'kiwi'],
    toppings: ['chia'],
    sweetness: 0,
    size: '16oz',
  });
  const fullSweet = computeSmoothieNutrition({
    fruits: ['strawberry', 'kiwi'],
    toppings: ['chia'],
    sweetness: 100,
    size: '16oz',
  });
  assert.ok(fullSweet.sugarG > zeroSweet.sugarG);
  assert.ok(fullSweet.calories > zeroSweet.calories);
  assert.equal(zeroSweet.fiberG, 10);

  const colors = computeBlendVisualColors(['mango', 'blueberry']);
  assert.equal(colors.topHex, '#F4DA7E');
  assert.equal(colors.midHex, '#7A61B3');

  const cartItem = makeCustomSmoothieCartItem({
    fruits: ['mango', 'strawberry'],
    toppings: ['chia', 'coconut'],
    sweetness: 50,
    size: '16oz',
    customText: 'Sunrise Glow',
    fontId: 'caveat',
    fontLabel: 'Caveat',
  });
  assert.equal(cartItem.title, 'Sunrise Glow Blend');
  assert.equal(cartItem.unitPrice, 13.45);
  assert.equal(
    summarizeCustomSmoothie(cartItem.customSmoothie!),
    'Mango + Strawberry · +Chia Seeds, Coconut · 50% Sweet · 16 oz Cup · "Sunrise Glow"'
  );
});

test('computeBlendProgress updates smoothly across 3-fruit base and topping selections', () => {
  const empty = computeBlendProgress({ fruits: [], toppings: [] });
  assert.equal(empty.percent, 0);
  assert.equal(empty.ratio, 0);
  assert.equal(empty.activeStep, 'fruits');
  assert.equal(empty.isFruitBaseFull, false);
  assert.equal(empty.hasToppings, false);

  const oneFruit = computeBlendProgress({ fruits: ['strawberry'], toppings: [] });
  assert.equal(oneFruit.percent, 25);
  assert.equal(oneFruit.fruitCount, 1);
  assert.equal(oneFruit.activeStep, 'fruits');

  const threeFruitsNoToppings = computeBlendProgress({
    fruits: ['strawberry', 'mango', 'kiwi'],
    toppings: [],
  });
  assert.equal(threeFruitsNoToppings.percent, 75);
  assert.equal(threeFruitsNoToppings.isFruitBaseFull, true);
  assert.equal(threeFruitsNoToppings.activeStep, 'toppings');

  const twoFruitsOneTopping = computeBlendProgress({
    fruits: ['strawberry', 'mango'],
    toppings: ['chia'],
  });
  assert.equal(twoFruitsOneTopping.percent, 75);
  assert.equal(twoFruitsOneTopping.hasToppings, true);
  assert.equal(twoFruitsOneTopping.activeStep, 'ready');

  const fullBlend = computeBlendProgress({
    fruits: ['strawberry', 'mango', 'kiwi'],
    toppings: ['chia', 'granola'],
  });
  assert.equal(fullBlend.percent, 100);
  assert.equal(fullBlend.ratio, 1);
  assert.equal(fullBlend.toppingCount, 2);
  assert.equal(fullBlend.isFruitBaseFull, true);
  assert.equal(fullBlend.activeStep, 'ready');
});

test('custom candle item pricing, uniqueness, and summary work accurately', () => {
  const customA = makeCustomCandleCartItem(
    {
      vesselColorId: 'terracotta',
      vesselColorName: 'Terracotta Fig',
      vesselColorHex: '#E5B9A1',
      scentId: 'yuzu',
      secondaryScentId: 'sage',
      customText: 'Evening Calm',
      customSubtext: 'For Maya',
      fontId: 'playfair',
      fontLabel: 'Playfair',
      inkId: 'charcoal',
      inkHex: '#2B2233',
    },
    1,
    1
  );

  assert.equal(customA.unitPrice, 42.0);
  assert.equal(customA.title, 'Bespoke Yuzu + Sage');
  assert.equal(summarizeCustomCandle(customA.customCandle!), 'Terracotta Fig · Yuzu + Sage · "Evening Calm" (Playfair)');

  const customB = makeCustomCandleCartItem(
    {
      vesselColorId: 'ivory',
      vesselColorName: 'Matte Ivory',
      vesselColorHex: '#F6F1E7',
      scentId: 'yuzu',
      customText: 'Evening Calm',
      fontId: 'caveat',
      fontLabel: 'Caveat',
      inkId: 'gold',
      inkHex: '#B48327',
    },
    3,
    1
  );

  assert.equal(customB.unitPrice, 112.0);
  assert.notEqual(customA.id, customB.id);

  let cart = upsertCartItem([], customA);
  cart = upsertCartItem(cart, customA);
  assert.equal(cart.length, 1);
  assert.equal(cart[0].quantity, 2);

  cart = upsertCartItem(cart, customB);
  assert.equal(cart.length, 2);
  const summary = computeCartSummary(cart);
  assert.equal(summary.totalCandles, 5);
  assert.equal(summary.subtotal, 196.0);
  assert.equal(summary.shipping, 0);
});

test('cart operations, pack pricing, and free-shipping threshold calculate accurately', () => {
  let cart = upsertCartItem([], makeStandardCartItem('iris', 1, 1));
  assert.equal(cart.length, 1);
  assert.equal(cart[0].quantity, 1);

  let summary = computeCartSummary(cart);
  assert.equal(summary.subtotal, 36.0);
  assert.equal(summary.shipping, 7.5);
  assert.equal(summary.total, 43.5);
  assert.equal(summary.amountToFreeShipping, 39.0);

  const customWithAddons = makeCustomTrioCartItem(['iris', 'fig', 'yuzu'], {
    'addon-coaster': 1,
    'addon-trimmer': 1,
    'addon-extra-vessel': 1,
  });
  assert.equal(customWithAddons.unitPrice, 96 + 18 + 14 + 28);
  cart = upsertCartItem(cart, customWithAddons);
  summary = computeCartSummary(cart);
  assert.equal(summary.subtotal, 192.0);
  assert.equal(summary.shipping, 0);
  assert.equal(summary.total, 192.0);
  assert.equal(summary.totalCandles, 5);

  cart = updateCartQuantity(cart, 'iris-1', -1);
  assert.equal(cart.some((i) => i.id === 'iris-1'), false);
});

test('custom trio pricing and summary handle mix and studio add-ons cleanly', () => {
  const bundle = computeTrioBundlePrice({ 'addon-coaster': 2, 'addon-matches': 1 });
  assert.equal(bundle.basePrice, 96.0);
  assert.equal(bundle.addonsPrice, 46.0);
  assert.equal(bundle.totalPrice, 142.0);
  assert.equal(bundle.addonCount, 3);

  const item = makeCustomTrioCartItem(['iris', 'iris', 'geranium'], { 'addon-coaster': 1 });
  const summary = summarizeCustomMix(item.customMix ?? [], item.addons);
  assert.equal(summary, '2× Iris · 1× Geranium + 1× Travertine Plinth');
});

test('split first name + surname, verify password match, password strength, and COD checkout validation', () => {
  const badNames = validateNameStep({ firstName: 'A', surname: '' });
  assert.ok(badNames.firstName && badNames.surname);

  const badReg = validateRegistration({
    mode: 'register',
    firstName: 'A',
    surname: 'V',
    email: 'invalid',
    password: '123',
    confirmPassword: '456',
  });
  assert.ok(badReg.firstName && badReg.surname && badReg.email && badReg.password && badReg.confirmPassword);

  const mismatchReg = validateRegistration({
    mode: 'register',
    firstName: 'Clara',
    surname: 'Vance',
    email: 'clara@example.com',
    password: 'Password1!',
    confirmPassword: 'Password2!',
  });
  assert.equal(mismatchReg.confirmPassword, 'Passwords do not match.');

  const okReg = validateRegistration({
    mode: 'register',
    firstName: 'Clara',
    surname: 'Vance',
    email: 'clara@example.com',
    password: 'Password1!',
    confirmPassword: 'Password1!',
  });
  assert.deepEqual(okReg, {});

  const strength = evaluatePasswordStrength('Botanical99!');
  assert.equal(strength.score, 4);
  assert.equal(strength.label, 'Strong');

  const badCheckout = validateCheckoutForm({
    firstName: '',
    surname: 'V',
    email: 'bad',
    phone: '12',
    address: '1st',
    city: '',
    postalCode: '',
  });
  assert.equal(Object.keys(badCheckout).length, 7);

  const okCheckout = validateCheckoutForm({
    firstName: 'Clara',
    surname: 'Vance',
    email: 'clara@example.com',
    phone: '555-0192',
    address: '420 Cedar Way',
    city: 'Portland',
    postalCode: '97205',
  });
  assert.deepEqual(okCheckout, {});
});
