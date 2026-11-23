const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
const assetUrl = (relativePath: string) => `${BASE_URL}${relativePath}`;

export type ScentId = 'iris' | 'sage' | 'bergamot' | 'geranium' | 'fig' | 'yuzu';
export type PackSize = 1 | 3 | 6;
export type BenefitCategory = 'energizing' | 'post-workout' | 'morning';
export type TrioAddonId =
  | 'addon-coaster'
  | 'addon-trimmer'
  | 'addon-matches'
  | 'addon-mini-tin'
  | 'addon-extra-vessel';

export interface NutritionVitamin {
  label: string;
  amount: string;
  dailyValue: string;
}

export interface NutritionFacts {
  servingSize: string;
  calories: number;
  caloriesDv: string;
  totalSugarG: number;
  addedSugarG: number;
  dietaryFiberG: number;
  proteinG: number;
  potassiumMg: number;
  vitamins: readonly NutritionVitamin[];
}

export interface BotanicalPlacement {
  x: number;
  y: number;
  w: number;
  rot: number;
  mirror: boolean;
  layer: 'fruit' | 'corner';
}

export interface ScentSpec {
  id: ScentId;
  name: string;
  bg: string;
  accentInk: string;
  surface: string;
  surfaceWell: string;
  tagline: string;
  description: string;
  notes: {
    top: string;
    heart: string;
    base: string;
  };
  category: 'floral' | 'botanical';
  benefits: readonly BenefitCategory[];
  benefitLabel: string;
  nutrition: NutritionFacts;
  specs: string[];
  details: {
    burnTimeHrs: number;
    waxWeightG: number;
    intensity: string;
    vessel: string;
    wick: string;
  };
  candleImg: string;
  botanicalImg: string;
  /** Hero frame placement for the 3:4 product photo so it sits centered on the hero floor */
  heroCandle: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  pieces: readonly BotanicalPlacement[];
}

export interface TrioAddon {
  id: TrioAddonId;
  name: string;
  subtitle: string;
  price: number;
  extraCandles: number;
  category: 'ritual' | 'vessel';
  accentBg: string;
  accentInk: string;
}

export const BENEFIT_LABELS: Record<BenefitCategory, string> = {
  energizing: 'Energizing',
  'post-workout': 'Post-Workout',
  morning: 'Morning',
};

export const PACK_PRICING: Record<PackSize, { label: string; price: number; perCandle: number; savings?: string }> = {
  1: { label: 'Single · 240 g', price: 36.0, perCandle: 36.0 },
  3: { label: 'Trio Set', price: 96.0, perCandle: 32.0, savings: 'Save $12.00' },
  6: { label: 'Studio 6-Case', price: 180.0, perCandle: 30.0, savings: 'Save $36.00' },
};

export const FREE_SHIPPING_THRESHOLD = 75.0;
export const STANDARD_SHIPPING_FEE = 7.5;

export const TRIO_ADDONS: readonly TrioAddon[] = [
  {
    id: 'addon-coaster',
    name: 'Travertine Plinth',
    subtitle: 'Hand-honed 11 cm natural stone coaster',
    price: 18.0,
    extraCandles: 0,
    category: 'ritual',
    accentBg: '#E7DAC8',
    accentInk: '#5F4329',
  },
  {
    id: 'addon-trimmer',
    name: 'Brass Wick Trimmer',
    subtitle: 'Precision 5 mm cut for zero-soot burns',
    price: 14.0,
    extraCandles: 0,
    category: 'ritual',
    accentBg: '#EFE0BA',
    accentInk: '#684C0A',
  },
  {
    id: 'addon-matches',
    name: 'Cedar Apothecary Matches',
    subtitle: '50 long-stem matches in reusable glass vial',
    price: 10.0,
    extraCandles: 0,
    category: 'ritual',
    accentBg: '#DCE8CA',
    accentInk: '#35511E',
  },
  {
    id: 'addon-mini-tin',
    name: 'Discovery Mini Tin (75 g)',
    subtitle: 'Travel-size botanical pour · 18 hr burn',
    price: 16.0,
    extraCandles: 1,
    category: 'vessel',
    accentBg: '#E4D8F3',
    accentInk: '#4A3566',
  },
  {
    id: 'addon-extra-vessel',
    name: '4th Full Vessel Bonus (240 g)',
    subtitle: 'Bundle an extra full ceramic candle · save $8.00',
    price: 28.0,
    extraCandles: 1,
    category: 'vessel',
    accentBg: '#F6D7DF',
    accentInk: '#74243D',
  },
];

export const SCENTS: readonly ScentSpec[] = [
  {
    id: 'iris',
    name: 'Iris',
    bg: '#C2B0DC',
    accentInk: '#4A3566',
    surface: '#F3ECF9',
    surfaceWell: '#E5D8F3',
    tagline: 'Wild Iris · Violet Leaf · White Cedar',
    description:
      'Powdery wild purple iris petals layered over crushed violet leaf and soft white cedarwood. Cold-blended botanical nourishment crafted for steady post-workout recovery and serene morning clarity.',
    notes: {
      top: 'Crushed Violet Leaf · Dewy Pear',
      heart: 'Wild Purple Iris · Orris Root',
      base: 'White Cedarwood · Soft Musk',
    },
    category: 'floral',
    benefits: ['post-workout', 'morning'],
    benefitLabel: 'Post-Workout · Morning',
    nutrition: {
      servingSize: '250 ml',
      calories: 145,
      caloriesDv: '7% DV',
      totalSugarG: 14,
      addedSugarG: 0,
      dietaryFiberG: 4,
      proteinG: 3,
      potassiumMg: 340,
      vitamins: [
        { label: 'Vitamin C', amount: '78 mg', dailyValue: '87% DV' },
        { label: 'Vitamin A', amount: '210 mcg', dailyValue: '23% DV' },
        { label: 'Vitamin B6', amount: '0.4 mg', dailyValue: '24% DV' },
        { label: 'Vitamin E', amount: '3.2 mg', dailyValue: '21% DV' },
      ],
    },
    specs: ['Soy & Coconut Wax', '55 Hr Burn', '240 g'],
    details: {
      burnTimeHrs: 55,
      waxWeightG: 240,
      intensity: 'Medium · Balanced',
      vessel: 'Matte Ivory Ceramic',
      wick: 'Unbleached Cotton',
    },
    candleImg: assetUrl('src/assets/images/luma_iris_candle.webp'),
    botanicalImg: assetUrl('src/assets/images/luma_iris_bloom.webp'),
    heroCandle: { x: 557, y: 291, w: 326, h: 415 },
    pieces: [
      { x: 372, y: 158, w: 126, rot: -12, mirror: false, layer: 'fruit' },
      { x: 942, y: 214, w: 138, rot: 14, mirror: true, layer: 'fruit' },
      { x: 278, y: 462, w: 148, rot: -8, mirror: false, layer: 'fruit' },
      { x: 1226, y: 440, w: 136, rot: 18, mirror: true, layer: 'fruit' },
      { x: 954, y: 576, w: 124, rot: 26, mirror: false, layer: 'fruit' },
      { x: -24, y: 565, w: 270, rot: -10, mirror: false, layer: 'corner' },
      { x: 1260, y: 24, w: 225, rot: 15, mirror: true, layer: 'corner' },
    ],
  },
  {
    id: 'sage',
    name: 'Sage',
    bg: '#B4D58A',
    accentInk: '#2F4A1A',
    surface: '#ECF4DF',
    surfaceWell: '#DCE9C7',
    tagline: 'Garden Sage · Crushed Mint · Vetiver',
    description:
      'Velvety garden sage leaves muddled with cool crushed mint and crisp green mandarin. Bright, herbaceous lift designed for energizing starts and sunlit mornings.',
    notes: {
      top: 'Crushed Mint · Green Mandarin',
      heart: 'Garden Sage · Clary Leaf',
      base: 'Haitian Vetiver · Moss',
    },
    category: 'botanical',
    benefits: ['energizing', 'morning'],
    benefitLabel: 'Energizing · Morning',
    nutrition: {
      servingSize: '250 ml',
      calories: 120,
      caloriesDv: '6% DV',
      totalSugarG: 11,
      addedSugarG: 0,
      dietaryFiberG: 5,
      proteinG: 2,
      potassiumMg: 390,
      vitamins: [
        { label: 'Vitamin C', amount: '115 mg', dailyValue: '128% DV' },
        { label: 'Vitamin A', amount: '340 mcg', dailyValue: '38% DV' },
        { label: 'Vitamin K', amount: '42 mcg', dailyValue: '35% DV' },
        { label: 'Folate (B9)', amount: '48 mcg', dailyValue: '12% DV' },
      ],
    },
    specs: ['Soy & Coconut Wax', '55 Hr Burn', '240 g'],
    details: {
      burnTimeHrs: 55,
      waxWeightG: 240,
      intensity: 'Crisp · Herbaceous',
      vessel: 'Matte Ivory Ceramic',
      wick: 'Unbleached Cotton',
    },
    candleImg: assetUrl('src/assets/images/luma_sage_candle.webp'),
    botanicalImg: assetUrl('src/assets/images/luma_sage_leaf.webp'),
    heroCandle: { x: 551, y: 286, w: 338, h: 420 },
    pieces: [
      { x: 368, y: 154, w: 138, rot: -24, mirror: true, layer: 'fruit' },
      { x: 944, y: 212, w: 148, rot: 12, mirror: false, layer: 'fruit' },
      { x: 288, y: 452, w: 160, rot: -6, mirror: false, layer: 'fruit' },
      { x: 1185, y: 454, w: 146, rot: -20, mirror: true, layer: 'fruit' },
      { x: 940, y: 590, w: 142, rot: 14, mirror: true, layer: 'fruit' },
      { x: -18, y: 560, w: 270, rot: 8, mirror: false, layer: 'corner' },
      { x: 1265, y: 20, w: 220, rot: -15, mirror: true, layer: 'corner' },
    ],
  },
  {
    id: 'bergamot',
    name: 'Bergamot',
    bg: '#F3DA8A',
    accentInk: '#684C0A',
    surface: '#FAF0D0',
    surfaceWell: '#F2E0AE',
    tagline: 'Calabrian Bergamot · Wild Honey · Chamomile',
    description:
      'Sun-warmed Calabrian bergamot rind blended with golden meadow chamomile and bright citrus nectar. Clean morning brightness with sustained vitamin-rich vitality.',
    notes: {
      top: 'Calabrian Bergamot · Neroli',
      heart: 'Roman Chamomile · Orange Blossom',
      base: 'Warm Honey Accord · Blonde Woods',
    },
    category: 'botanical',
    benefits: ['morning', 'energizing'],
    benefitLabel: 'Morning · Energizing',
    nutrition: {
      servingSize: '250 ml',
      calories: 165,
      caloriesDv: '8% DV',
      totalSugarG: 16,
      addedSugarG: 0,
      dietaryFiberG: 3,
      proteinG: 4,
      potassiumMg: 410,
      vitamins: [
        { label: 'Vitamin C', amount: '132 mg', dailyValue: '147% DV' },
        { label: 'Vitamin B6', amount: '0.6 mg', dailyValue: '35% DV' },
        { label: 'Vitamin A', amount: '185 mcg', dailyValue: '21% DV' },
        { label: 'Riboflavin', amount: '0.3 mg', dailyValue: '23% DV' },
      ],
    },
    specs: ['Soy & Coconut Wax', '55 Hr Burn', '240 g'],
    details: {
      burnTimeHrs: 55,
      waxWeightG: 240,
      intensity: 'Bright · Citrus Warm',
      vessel: 'Matte Ivory Ceramic',
      wick: 'Unbleached Cotton',
    },
    candleImg: assetUrl('src/assets/images/luma_bergamot_candle.webp'),
    botanicalImg: assetUrl('src/assets/images/luma_bergamot_slice.webp'),
    heroCandle: { x: 547, y: 258, w: 346, h: 448 },
    pieces: [
      { x: 378, y: 146, w: 124, rot: 0, mirror: false, layer: 'fruit' },
      { x: 954, y: 218, w: 136, rot: -12, mirror: true, layer: 'fruit' },
      { x: 288, y: 474, w: 134, rot: 15, mirror: false, layer: 'fruit' },
      { x: 1230, y: 454, w: 146, rot: 22, mirror: false, layer: 'fruit' },
      { x: 944, y: 574, w: 130, rot: -14, mirror: false, layer: 'fruit' },
      { x: -12, y: 575, w: 245, rot: 0, mirror: false, layer: 'corner' },
      { x: 1268, y: 24, w: 205, rot: 12, mirror: false, layer: 'corner' },
    ],
  },
  {
    id: 'geranium',
    name: 'Geranium',
    bg: '#F2AFC0',
    accentInk: '#74243D',
    surface: '#FCEAEF',
    surfaceWell: '#F7D5DF',
    tagline: 'Pink Geranium · Rosewater · Sandalwood',
    description:
      'Fresh-cut pink geranium steeped with distilled rosewater and antioxidant-rich botanicals. Formulated for crisp post-workout replenishment and midday vitality.',
    notes: {
      top: 'Pink Pepper · Crushed Stem',
      heart: 'Pink Geranium · Distilled Rosewater',
      base: 'Creamy Sandalwood · Ambergris Accord',
    },
    category: 'floral',
    benefits: ['post-workout', 'energizing'],
    benefitLabel: 'Post-Workout · Energizing',
    nutrition: {
      servingSize: '250 ml',
      calories: 135,
      caloriesDv: '7% DV',
      totalSugarG: 13,
      addedSugarG: 0,
      dietaryFiberG: 4,
      proteinG: 5,
      potassiumMg: 365,
      vitamins: [
        { label: 'Vitamin C', amount: '96 mg', dailyValue: '107% DV' },
        { label: 'Vitamin E', amount: '4.1 mg', dailyValue: '27% DV' },
        { label: 'Vitamin B6', amount: '0.5 mg', dailyValue: '29% DV' },
        { label: 'Vitamin A', amount: '160 mcg', dailyValue: '18% DV' },
      ],
    },
    specs: ['Soy & Coconut Wax', '55 Hr Burn', '240 g'],
    details: {
      burnTimeHrs: 55,
      waxWeightG: 240,
      intensity: 'Lush · Green Floral',
      vessel: 'Matte Ivory Ceramic',
      wick: 'Cedar & Cotton Core',
    },
    candleImg: assetUrl('src/assets/images/luma_geranium_candle.webp'),
    botanicalImg: assetUrl('src/assets/images/luma_geranium_petal.webp'),
    heroCandle: { x: 558, y: 294, w: 437, h: 412 },
    pieces: [
      { x: 364, y: 142, w: 132, rot: -8, mirror: false, layer: 'fruit' },
      { x: 948, y: 218, w: 126, rot: 18, mirror: true, layer: 'fruit' },
      { x: 282, y: 452, w: 144, rot: -12, mirror: false, layer: 'fruit' },
      { x: 1232, y: 430, w: 138, rot: 14, mirror: true, layer: 'fruit' },
      { x: 952, y: 556, w: 144, rot: -15, mirror: false, layer: 'fruit' },
      { x: -16, y: 552, w: 255, rot: 0, mirror: false, layer: 'corner' },
      { x: 1268, y: 28, w: 210, rot: 18, mirror: true, layer: 'corner' },
    ],
  },
  {
    id: 'fig',
    name: 'Fig',
    bg: '#E5B096',
    accentInk: '#5F2B17',
    surface: '#FAEAE2',
    surfaceWell: '#F3D6C7',
    tagline: 'Black Mission Fig · Toasted Tonka · Vetiver',
    description:
      'Sun-ripened black mission fig warmed with toasted tonka bean and green fig leaf. Potassium-rich botanical energy crafted for deep post-workout restoration.',
    notes: {
      top: 'Crushed Fig Leaf · Green Sap',
      heart: 'Black Mission Fig · Wild Plum',
      base: 'Toasted Tonka · Earthy Vetiver',
    },
    category: 'botanical',
    benefits: ['energizing', 'post-workout'],
    benefitLabel: 'Energizing · Post-Workout',
    nutrition: {
      servingSize: '250 ml',
      calories: 175,
      caloriesDv: '9% DV',
      totalSugarG: 15,
      addedSugarG: 0,
      dietaryFiberG: 6,
      proteinG: 4,
      potassiumMg: 480,
      vitamins: [
        { label: 'Vitamin C', amount: '64 mg', dailyValue: '71% DV' },
        { label: 'Vitamin B6', amount: '0.8 mg', dailyValue: '47% DV' },
        { label: 'Magnesium', amount: '54 mg', dailyValue: '13% DV' },
        { label: 'Vitamin K', amount: '26 mcg', dailyValue: '22% DV' },
      ],
    },
    specs: ['Soy & Coconut Wax', '58 Hr Burn', '240 g'],
    details: {
      burnTimeHrs: 58,
      waxWeightG: 240,
      intensity: 'Rich · Sun-Warmed',
      vessel: 'Matte Ivory Ceramic',
      wick: 'Cedar & Cotton Core',
    },
    candleImg: assetUrl('src/assets/images/luma_fig_candle.webp'),
    botanicalImg: assetUrl('src/assets/images/luma_fig_fruit.webp'),
    heroCandle: { x: 556, y: 274, w: 326, h: 432 },
    pieces: [
      { x: 370, y: 152, w: 132, rot: -14, mirror: false, layer: 'fruit' },
      { x: 944, y: 210, w: 138, rot: 16, mirror: true, layer: 'fruit' },
      { x: 280, y: 458, w: 146, rot: -10, mirror: false, layer: 'fruit' },
      { x: 1220, y: 444, w: 142, rot: 14, mirror: true, layer: 'fruit' },
      { x: 948, y: 572, w: 128, rot: 22, mirror: false, layer: 'fruit' },
      { x: -18, y: 560, w: 260, rot: -8, mirror: false, layer: 'corner' },
      { x: 1262, y: 22, w: 220, rot: 14, mirror: true, layer: 'corner' },
    ],
  },
  {
    id: 'yuzu',
    name: 'Yuzu',
    bg: '#96CFD2',
    accentInk: '#174D53',
    surface: '#E6F4F5',
    surfaceWell: '#D1E9EC',
    tagline: 'Kochi Yuzu · Lemon Verbena · White Tea',
    description:
      'Zesty cold-pressed Japanese yuzu peel brightened with crushed lemon verbena and steeped white tea leaves. Ultra-high Vitamin C lift for crisp mornings.',
    notes: {
      top: 'Kochi Yuzu Zest · Mandarin Peel',
      heart: 'Lemon Verbena · White Tea',
      base: 'Hinoki Cypress · Pale Amber',
    },
    category: 'botanical',
    benefits: ['morning', 'energizing'],
    benefitLabel: 'Morning · Energizing',
    nutrition: {
      servingSize: '250 ml',
      calories: 115,
      caloriesDv: '6% DV',
      totalSugarG: 10,
      addedSugarG: 0,
      dietaryFiberG: 4,
      proteinG: 2,
      potassiumMg: 355,
      vitamins: [
        { label: 'Vitamin C', amount: '148 mg', dailyValue: '164% DV' },
        { label: 'Vitamin A', amount: '220 mcg', dailyValue: '24% DV' },
        { label: 'Vitamin B6', amount: '0.4 mg', dailyValue: '24% DV' },
        { label: 'Folate (B9)', amount: '44 mcg', dailyValue: '11% DV' },
      ],
    },
    specs: ['Soy & Coconut Wax', '55 Hr Burn', '240 g'],
    details: {
      burnTimeHrs: 55,
      waxWeightG: 240,
      intensity: 'Sparkling · Zesty',
      vessel: 'Matte Ivory Ceramic',
      wick: 'Unbleached Cotton',
    },
    candleImg: assetUrl('src/assets/images/luma_yuzu_candle.webp'),
    botanicalImg: assetUrl('src/assets/images/luma_yuzu_citrus.webp'),
    heroCandle: { x: 557, y: 282, w: 322, h: 424 },
    pieces: [
      { x: 374, y: 150, w: 126, rot: 8, mirror: false, layer: 'fruit' },
      { x: 948, y: 214, w: 134, rot: -16, mirror: true, layer: 'fruit' },
      { x: 286, y: 468, w: 138, rot: 14, mirror: false, layer: 'fruit' },
      { x: 1228, y: 450, w: 142, rot: -18, mirror: true, layer: 'fruit' },
      { x: 946, y: 576, w: 130, rot: 12, mirror: false, layer: 'fruit' },
      { x: -16, y: 568, w: 250, rot: 6, mirror: false, layer: 'corner' },
      { x: 1265, y: 24, w: 210, rot: -12, mirror: true, layer: 'corner' },
    ],
  },
];

export const HERO_SHADOWS: readonly (readonly [number, number, number, number])[] = [
  [345, 650, 170, 24],
  [720, 708, 320, 30],
  [1318, 638, 160, 22],
  [1045, 760, 150, 22],
];

export interface VesselColorOption {
  id: string;
  name: string;
  hex: string;
  shadowHex: string;
  isDark?: boolean;
}

export const VESSEL_COLORS: readonly VesselColorOption[] = [
  { id: 'ivory', name: 'Matte Ivory', hex: '#F6F1E7', shadowHex: '#DDD4C3' },
  { id: 'iris', name: 'Iris Mist', hex: '#D8CCE9', shadowHex: '#B6A2D3' },
  { id: 'sage', name: 'Garden Celadon', hex: '#CEE2B4', shadowHex: '#A4C37F' },
  { id: 'honey', name: 'Calabrian Honey', hex: '#F4DF9F', shadowHex: '#D8BA64' },
  { id: 'blush', name: 'Pink Geranium', hex: '#F4C5D1', shadowHex: '#DA97A8' },
  { id: 'terracotta', name: 'Terracotta Fig', hex: '#E5B9A1', shadowHex: '#C68D6F' },
  { id: 'seafoam', name: 'Kochi Mist', hex: '#B0DFE2', shadowHex: '#80BDC2' },
  { id: 'charcoal', name: 'Smoked Basalt', hex: '#342D3B', shadowHex: '#1D1822', isDark: true },
];

export type CandleFontId = 'cormorant' | 'playfair' | 'caveat' | 'cinzel' | 'baloo' | 'poppins';

export interface CandleFontOption {
  id: CandleFontId;
  name: string;
  styleTag: string;
  fontFamily: string;
  sample: string;
  letterSpacing?: string;
  textTransform?: 'uppercase' | 'none';
}

export const CANDLE_FONTS: readonly CandleFontOption[] = [
  {
    id: 'cormorant',
    name: 'Cormorant',
    styleTag: 'Editorial Serif',
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    sample: 'Evening Ritual',
  },
  {
    id: 'playfair',
    name: 'Playfair',
    styleTag: 'Couture Serif',
    fontFamily: '"Playfair Display", Georgia, serif',
    sample: 'Atelier No. 04',
  },
  {
    id: 'caveat',
    name: 'Caveat',
    styleTag: 'Handwritten Script',
    fontFamily: '"Caveat", cursive',
    sample: 'Poured for you',
  },
  {
    id: 'cinzel',
    name: 'Cinzel',
    styleTag: 'Engraved Caps',
    fontFamily: '"Cinzel", Georgia, serif',
    sample: 'SOLSTICE',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  {
    id: 'baloo',
    name: 'Baloo 2',
    styleTag: 'Warm Rounded',
    fontFamily: '"Baloo 2", system-ui, sans-serif',
    sample: 'Sunday Morning',
  },
  {
    id: 'poppins',
    name: 'Poppins',
    styleTag: 'Clean Studio',
    fontFamily: '"Poppins", system-ui, sans-serif',
    sample: 'Quiet Hours',
    letterSpacing: '0.04em',
  },
];

export type CandleInkId = 'charcoal' | 'gold' | 'botanical' | 'ivory';

export interface CandleInkOption {
  id: CandleInkId;
  name: string;
  hex: string;
}

export const CANDLE_INKS: readonly CandleInkOption[] = [
  { id: 'charcoal', name: 'Charcoal Ink', hex: '#2B2233' },
  { id: 'gold', name: 'Warm Gold Foil', hex: '#B48327' },
  { id: 'botanical', name: 'Scent Accent', hex: '#4A3566' },
  { id: 'ivory', name: 'Cream Emboss', hex: '#FAF6EE' },
];

export const CUSTOM_CANDLE_PRICING: Record<PackSize, { label: string; price: number; perCandle: number; savings?: string }> = {
  1: { label: 'Bespoke Single · 240 g', price: 42.0, perCandle: 42.0 },
  3: { label: 'Bespoke Trio · 3 × 240 g', price: 112.0, perCandle: 37.33, savings: 'Save $14.00' },
  6: { label: 'Atelier 6-Case · 6 × 240 g', price: 204.0, perCandle: 34.0, savings: 'Save $48.00' },
};

export type SmoothieFruitId = 'strawberry' | 'mango' | 'blueberry' | 'kiwi' | 'fig' | 'yuzu';

export interface SmoothieFruitOption {
  id: SmoothieFruitId;
  name: string;
  shortName: string;
  category: string;
  hex: string;
  swirlHex: string;
  accentInk: string;
  calories: number;
  vitaminCMg: number;
  vitaminCDvPct: number;
  fiberG: number;
  sugarG: number;
  proteinG: number;
  flavorNote: string;
}

export const SMOOTHIE_FRUITS: readonly SmoothieFruitOption[] = [
  {
    id: 'strawberry',
    name: 'Wild Strawberry',
    shortName: 'Strawberry',
    category: 'Berry',
    hex: '#F29BB0',
    swirlHex: '#DF6C88',
    accentInk: '#74243D',
    calories: 48,
    vitaminCMg: 58,
    vitaminCDvPct: 64,
    fiberG: 3,
    sugarG: 7,
    proteinG: 1,
    flavorNote: 'Sun-ripened Oregon berry & hibiscus pressed puree',
  },
  {
    id: 'mango',
    name: 'Alphonso Mango',
    shortName: 'Mango',
    category: 'Tropical',
    hex: '#F4DA7E',
    swirlHex: '#E7B942',
    accentInk: '#6A4C10',
    calories: 64,
    vitaminCMg: 42,
    vitaminCDvPct: 47,
    fiberG: 2,
    sugarG: 13,
    proteinG: 1,
    flavorNote: 'Velvety nectarine-rich golden mango nectar',
  },
  {
    id: 'blueberry',
    name: 'Wild Blueberry & Acai',
    shortName: 'Blueberry',
    category: 'Antioxidant',
    hex: '#A792D1',
    swirlHex: '#7A61B3',
    accentInk: '#4A3566',
    calories: 56,
    vitaminCMg: 18,
    vitaminCDvPct: 20,
    fiberG: 4,
    sugarG: 8,
    proteinG: 1,
    flavorNote: 'Deep purple organic acai pulp & mountain berries',
  },
  {
    id: 'kiwi',
    name: 'Emerald Kiwi & Sage',
    shortName: 'Kiwi',
    category: 'Greens',
    hex: '#B4D58A',
    swirlHex: '#82B44E',
    accentInk: '#2F4A1A',
    calories: 46,
    vitaminCMg: 78,
    vitaminCDvPct: 87,
    fiberG: 3,
    sugarG: 7,
    proteinG: 1,
    flavorNote: 'Tart orchard kiwi blended with crisp botanical greens',
  },
  {
    id: 'fig',
    name: 'Black Fig & Banana',
    shortName: 'Fig',
    category: 'Creamy',
    hex: '#E5B293',
    swirlHex: '#C78560',
    accentInk: '#6E3622',
    calories: 72,
    vitaminCMg: 14,
    vitaminCDvPct: 16,
    fiberG: 4,
    sugarG: 13,
    proteinG: 2,
    flavorNote: 'Smooth Cavendish banana folded with roasted honeyed fig',
  },
  {
    id: 'yuzu',
    name: 'Kochi Yuzu & Pineapple',
    shortName: 'Yuzu',
    category: 'Citrus',
    hex: '#8CD4D8',
    swirlHex: '#4FAEB6',
    accentInk: '#0E4A52',
    calories: 44,
    vitaminCMg: 68,
    vitaminCDvPct: 76,
    fiberG: 2,
    sugarG: 8,
    proteinG: 1,
    flavorNote: 'Sparkling Japanese citrus zest & cold-pressed pineapple',
  },
];

export type SmoothieToppingId = 'chia' | 'granola' | 'coconut' | 'cacao' | 'hemp' | 'bee-pollen';

export interface SmoothieToppingOption {
  id: SmoothieToppingId;
  name: string;
  shortName: string;
  price: number;
  calories: number;
  proteinG: number;
  fiberG: number;
  sugarG: number;
  detail: string;
  swatchHex: string;
}

export const SMOOTHIE_TOPPINGS: readonly SmoothieToppingOption[] = [
  {
    id: 'chia',
    name: 'Organic Chia Seeds',
    shortName: 'Chia Seeds',
    price: 1.0,
    calories: 40,
    proteinG: 2,
    fiberG: 4,
    sugarG: 0,
    detail: '+4 g fiber · Omega-3 crunch',
    swatchHex: '#3A3242',
  },
  {
    id: 'granola',
    name: 'Toasted Oat Granola',
    shortName: 'Oat Granola',
    price: 1.25,
    calories: 75,
    proteinG: 2,
    fiberG: 2,
    sugarG: 3,
    detail: 'Maple-baked clusters',
    swatchHex: '#C7924F',
  },
  {
    id: 'coconut',
    name: 'Toasted Coconut Flakes',
    shortName: 'Coconut',
    price: 0.95,
    calories: 55,
    proteinG: 1,
    fiberG: 2,
    sugarG: 1,
    detail: 'Crisp kiln-toasted ribbons',
    swatchHex: '#F3EBDD',
  },
  {
    id: 'cacao',
    name: 'Raw Cacao Nibs',
    shortName: 'Cacao Nibs',
    price: 1.5,
    calories: 65,
    proteinG: 2,
    fiberG: 3,
    sugarG: 0,
    detail: 'Unsweetened dark Ecuadorian nibs',
    swatchHex: '#4E3126',
  },
  {
    id: 'hemp',
    name: 'Hemp Hearts',
    shortName: 'Hemp Hearts',
    price: 1.5,
    calories: 60,
    proteinG: 4,
    fiberG: 1,
    sugarG: 0,
    detail: '+4 g complete plant protein',
    swatchHex: '#8FB273',
  },
  {
    id: 'bee-pollen',
    name: 'Wildflower Bee Pollen',
    shortName: 'Bee Pollen',
    price: 1.75,
    calories: 35,
    proteinG: 2,
    fiberG: 1,
    sugarG: 1,
    detail: 'Floral golden pollen granules',
    swatchHex: '#E7B942',
  },
];

export type SweetnessLevel = 0 | 25 | 50 | 75 | 100;

export interface SmoothieSweetnessOption {
  level: SweetnessLevel;
  label: string;
  description: string;
  addedSugarG: number;
  addedCalories: number;
}

export const SMOOTHIE_SWEETNESS_LEVELS: readonly SmoothieSweetnessOption[] = [
  { level: 0, label: '0%', description: 'Unsweetened · Pure Fruit', addedSugarG: 0, addedCalories: 0 },
  { level: 25, label: '25%', description: 'Light Agave Hint', addedSugarG: 3, addedCalories: 12 },
  { level: 50, label: '50%', description: 'Balanced House Press', addedSugarG: 6, addedCalories: 24 },
  { level: 75, label: '75%', description: 'Bright Nectar Touch', addedSugarG: 10, addedCalories: 40 },
  { level: 100, label: '100%', description: 'Lush Blossom Honey', addedSugarG: 14, addedCalories: 56 },
];

export type SmoothieSizeId = '12oz' | '16oz' | 'pack3';

export interface SmoothieSizeOption {
  id: SmoothieSizeId;
  label: string;
  shortLabel: string;
  price: number;
  nutritionFactor: number;
  bottleCount: number;
  savings?: string;
}

export const SMOOTHIE_SIZE_OPTIONS: Record<SmoothieSizeId, SmoothieSizeOption> = {
  '12oz': {
    id: '12oz',
    label: '12 oz Petite Cup',
    shortLabel: '12 oz Cup',
    price: 9.5,
    nutritionFactor: 0.85,
    bottleCount: 1,
  },
  '16oz': {
    id: '16oz',
    label: '16 oz Signature',
    shortLabel: '16 oz Cup',
    price: 11.5,
    nutritionFactor: 1.0,
    bottleCount: 1,
  },
  pack3: {
    id: 'pack3',
    label: '3-Bottle Studio Pack',
    shortLabel: '3-Pack',
    price: 31.0,
    nutritionFactor: 1.0,
    bottleCount: 3,
    savings: 'Save $3.50',
  },
};

export function getScentById(id: string | undefined): ScentSpec {
  return SCENTS.find((s) => s.id === id) ?? SCENTS[0];
}
