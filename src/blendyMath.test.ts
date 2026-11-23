import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HERO_CARD_CROP,
  coverAt,
  incomingProgress,
  computeHeroStagePlacement,
  computeViewportScale,
  computeWordLayout,
  computeCropBox,
  wrapFlavourIndex,
  tabDirection,
  detectSwipeDirection,
} from './blendyMath';

test('coverAt matches measured table endpoints and slow-fast-soft rhythm', () => {
  assert.equal(coverAt(-0.1), 0);
  assert.equal(coverAt(0), 0);
  assert.equal(coverAt(1), 1);
  assert.equal(coverAt(1.2), 1);

  // At t=0.485, coverage is ~0.158 (slow start: nearly half the time for <16%)
  assert.ok(Math.abs(coverAt(0.485) - 0.158) < 1e-6);
  // Rush through middle
  assert.ok(Math.abs(coverAt(0.583) - 0.55) < 1e-6);
  assert.ok(Math.abs(coverAt(0.62) - 0.825) < 1e-6);
  // Monotonically increasing
  let prev = 0;
  for (let i = 1; i <= 100; i++) {
    const cur = coverAt(i / 100);
    assert.ok(cur >= prev, `coverAt(${i / 100})=${cur} < ${prev}`);
    prev = cur;
  }
});

test('incomingProgress starts at t=0.5 and settles at t=0.92', () => {
  assert.equal(incomingProgress(0), 0);
  assert.equal(incomingProgress(0.5), 0);
  assert.ok(incomingProgress(0.71) > 0.7 && incomingProgress(0.71) < 0.8);
  assert.equal(incomingProgress(0.92), 1);
  assert.equal(incomingProgress(1), 1);
});

test('computeViewportScale handles desktop, mobile, and short landscape', () => {
  const d1440 = computeViewportScale(1440, 900);
  assert.equal(d1440.isMobile, false);
  assert.equal(d1440.u, 1);
  assert.equal(d1440.n, 1);
  assert.equal(d1440.fy, 0);

  // Short landscape phone 844x390 keeps desktop layout, --n bottoms at 0.5
  const landscape = computeViewportScale(844, 390);
  assert.equal(landscape.isMobile, false);
  assert.equal(landscape.n, 0.5);
  assert.equal(landscape.fy, 0);

  // Mobile 390x844
  const m390 = computeViewportScale(390, 844);
  assert.equal(m390.isMobile, true);
  assert.equal(m390.n, 1);
  assert.equal(m390.fy, 8);
  assert.ok(Math.abs(m390.u - 390 / 640) < 1e-6);

  // Mobile 360x640
  const m360 = computeViewportScale(360, 640);
  assert.equal(m360.isMobile, true);
  assert.equal(m360.n, 1);
  assert.ok(Math.abs(m360.u - 360 / 640) < 1e-6);
});

test('computeWordLayout matches exact cap-line math for Berry, Banana, Strawberry', () => {
  // Berry fits under 1330 at 445px -> F = 445, top ≈ 180.555
  const berry = computeWordLayout(260, 250, false, 1440);
  assert.equal(berry.fontSize, 445);
  assert.equal(berry.letterSpacing, '0.005em');
  assert.equal(Math.round(berry.top), 181);

  // Banana: at 1400 / 3.7634 = 372px -> top ≈ 217
  const banana = computeWordLayout(390, 1400 / 3.72, false, 1440);
  assert.ok(Math.abs(banana.fontSize - 372) < 0.01);
  assert.equal(banana.letterSpacing, '-0.035em');
  assert.equal(Math.round(banana.top), 217);

  // Strawberry: at 1400 / 5.4475 = 257px -> top ≈ 275
  const strawberry = computeWordLayout(580, 1400 / 2.57, false, 1440);
  assert.ok(Math.abs(strawberry.fontSize - 257) < 0.01);
  assert.equal(strawberry.letterSpacing, '-0.035em');
  assert.equal(Math.round(strawberry.top), 275);
});

test('computeCropBox scales 2048px sheet accurately', () => {
  const crop = computeCropBox([233, 60, 598, 917], 372);
  const s = 372 / 598;
  assert.equal(crop.width, 372);
  assert.ok(Math.abs(crop.height - 917 * s) < 1e-6);
  assert.ok(Math.abs(crop.bgSize - 2048 * s) < 1e-6);
  assert.ok(Math.abs(crop.bgX - -233 * s) < 1e-6);
  assert.ok(Math.abs(crop.bgY - -60 * s) < 1e-6);
});

test('computeHeroStagePlacement aligns hero products onto identical floor baseline inside crop', () => {
  const iris = computeHeroStagePlacement({ x: 557, y: 291, w: 326, h: 415 }, HERO_CARD_CROP);
  const bergamot = computeHeroStagePlacement({ x: 547, y: 258, w: 346, h: 448 }, HERO_CARD_CROP);
  const geranium = computeHeroStagePlacement({ x: 558, y: 294, w: 437, h: 412 }, HERO_CARD_CROP);

  // All products share the exact 706u hero floor baseline inside the 150..750 vertical crop
  assert.ok(Math.abs(iris.topPct + iris.heightPct - ((706 - 150) / 600) * 100) < 1e-6);
  assert.ok(Math.abs(bergamot.topPct + bergamot.heightPct - ((706 - 150) / 600) * 100) < 1e-6);
  assert.ok(Math.abs(geranium.topPct + geranium.heightPct - ((706 - 150) / 600) * 100) < 1e-6);
  // Geranium with wooden lid stays fully inside the horizontal crop bounds
  assert.ok(geranium.leftPct >= 0 && geranium.leftPct + geranium.widthPct <= 100);
});

test('navigation wrap, tab direction, and swipe threshold', () => {
  assert.equal(wrapFlavourIndex(3, 1), 0);
  assert.equal(wrapFlavourIndex(0, -1), 3);
  assert.equal(tabDirection(0, 2), 1);
  assert.equal(tabDirection(3, 1), -1);

  assert.equal(detectSwipeDirection(-60, 10), 1);
  assert.equal(detectSwipeDirection(60, 10), -1);
  assert.equal(detectSwipeDirection(-30, 5), 0);
  assert.equal(detectSwipeDirection(-50, 60), 0);
});
