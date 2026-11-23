export const COVERAGE_TABLE: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.031, 0.006],
  [0.134, 0.012],
  [0.206, 0.023],
  [0.278, 0.047],
  [0.34, 0.07],
  [0.412, 0.105],
  [0.485, 0.158],
  [0.546, 0.246],
  [0.583, 0.55],
  [0.62, 0.825],
  [0.69, 0.9],
  [0.79, 0.94],
  [0.85, 0.956],
  [0.93, 0.975],
  [1, 1],
];

export const LAYER_PARALLAX_FACTORS = {
  word: 0.4,
  shadow: 0.3,
  bottle: 0.15,
  fruit: 0.55,
  corner: 0.75,
} as const;

export const WIPE_DURATION_MS = 970;
export const OLD_SLIDE_DRIFT_FACTOR = 0.14;

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function smoothstep(k: number): number {
  const c = clamp(k, 0, 1);
  return c * c * (3 - 2 * c);
}

export function easeOutQuad(k: number): number {
  const c = clamp(k, 0, 1);
  return 1 - (1 - c) * (1 - c);
}

export function coverAt(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  for (let i = 0; i < COVERAGE_TABLE.length - 1; i++) {
    const [t0, c0] = COVERAGE_TABLE[i];
    const [t1, c1] = COVERAGE_TABLE[i + 1];
    if (t >= t0 && t <= t1) {
      const k = (t - t0) / (t1 - t0);
      return c0 + (c1 - c0) * smoothstep(k);
    }
  }
  return 1;
}

export function incomingProgress(t: number): number {
  return easeOutQuad(clamp((t - 0.5) / 0.42, 0, 1));
}

export interface ViewportScale {
  isMobile: boolean;
  u: number;
  n: number;
  fy: number;
  frameWidth: number;
  visibleFrameWidth: number;
}

export function computeViewportScale(vw: number, vh: number): ViewportScale {
  const isMobile = vw <= 820 || vh > vw;
  const u = isMobile
    ? Math.max(0.1, Math.min(vw / 640, (vh - 200) / 620))
    : Math.max(0.1, Math.min(vw / 1440, vh / 900));
  const n = isMobile
    ? 1
    : clamp(Math.min(vw / 1440, vh / 900), 0.5, 1.3);
  const fy = isMobile ? 8 : 0;
  const frameWidth = 1440 * u;
  const visibleFrameWidth = Math.min(1440, vw / u);
  return { isMobile, u, n, fy, frameWidth, visibleFrameWidth };
}

export interface WordLayout {
  fontSize: number;
  letterSpacing: string;
  baseline: number;
  top: number;
}

export function computeWordLayout(
  inkWidthAt100Default: number,
  inkWidthAt100Tight: number,
  isMobile: boolean,
  visibleFrameWidth: number
): WordLayout {
  const defaultLimit = isMobile ? visibleFrameWidth * 0.92 : 1330;
  const fitTarget = isMobile ? visibleFrameWidth * 0.92 : 1400;

  let fontSize = 445;
  let letterSpacing = '0.005em';

  const defaultInkAt445 = inkWidthAt100Default * (445 / 100);
  if (defaultInkAt445 > defaultLimit && inkWidthAt100Tight > 0) {
    letterSpacing = '-0.035em';
    fontSize = Math.min(445, (fitTarget / inkWidthAt100Tight) * 100);
  }

  const baseline = 403.5 + (0.698 * fontSize) / 2;
  const top = baseline - 0.85 * fontSize;
  return { fontSize, letterSpacing, baseline, top };
}

export function computeCropBox(
  box: readonly [number, number, number, number],
  targetWidth: number
) {
  const [bx, by, bw, bh] = box;
  const s = targetWidth / bw;
  return {
    width: targetWidth,
    height: bh * s,
    bgSize: 2048 * s,
    bgX: -bx * s,
    bgY: -by * s,
  };
}

export function wrapFlavourIndex(current: number, delta: 1 | -1, count = 4): number {
  return (current + delta + count) % count;
}

export function tabDirection(current: number, target: number): 1 | -1 {
  return target > current ? 1 : -1;
}

export function detectSwipeDirection(dx: number, dy: number): 1 | -1 | 0 {
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? 1 : -1;
  }
  return 0;
}

export interface HeroRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const HERO_CARD_CROP: HeroRect = {
  x: 340,
  y: 150,
  w: 760,
  h: 600,
};

export interface HeroStagePlacementPct {
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
}

/**
 * Projects any 1440×900 hero-frame rectangle into percentage coordinates inside
 * the cropped hero window so product cards preserve identical hero proportions,
 * floor alignment, and visual crop framing.
 */
export function computeHeroStagePlacement(
  rect: HeroRect,
  cropWindow: HeroRect = HERO_CARD_CROP
): HeroStagePlacementPct {
  return {
    leftPct: ((rect.x - cropWindow.x) / cropWindow.w) * 100,
    topPct: ((rect.y - cropWindow.y) / cropWindow.h) * 100,
    widthPct: (rect.w / cropWindow.w) * 100,
    heightPct: (rect.h / cropWindow.h) * 100,
  };
}

