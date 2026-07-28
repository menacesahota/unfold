/**
 * unfold — quote pricing settings
 *
 * Edit the numbers below, then push to GitHub so Render redeploys.
 * Or use /pricing.html to tweak values in the browser (saved locally).
 *
 * Formula (ballpark only):
 *   unit = basePricePerBox
 *        × sizeFactor (from box surface area)
 *        × quantityFactor (bigger orders = cheaper per box)
 *        × board multiplier
 *        × wall multiplier
 *        × FEFCO style multiplier
 */

export const DEFAULT_PRICING = {
  // Minimum order shown on the site
  moq: 100,

  // Price of a typical FEFCO 0201 box before size/qty adjustments (£)
  basePricePerBox: 1.05,

  // The box size we treat as "standard" when calculating size uplifts (mm)
  referenceBox: {
    length: 300,
    width: 220,
    height: 150,
  },

  // Order size we treat as "standard" when calculating quantity discounts
  referenceQuantity: 250,

  // How strongly size affects price (0.5 = gentle, 1 = strong)
  sizeExponent: 0.7,
  sizeFactorMin: 0.35,
  sizeFactorMax: 4,

  // How strongly quantity affects price (higher = steeper bulk discount)
  quantityExponent: 0.3,
  quantityFactorMin: 0.55,
  quantityFactorMax: 1.9,

  boards: {
    kraft: { label: 'Kraft', color: '#c9a87c', priceFactor: 1 },
    white: { label: 'White', color: '#fafafa', priceFactor: 1.1 },
  },

  walls: {
    single: { label: 'Single wall', priceFactor: 1 },
    double: { label: 'Double wall', priceFactor: 1.4 },
  },

  // Core live-quote styles (same set as Kite / industry calculators)
  fefco: {
    '0201': {
      label: '0201 — Regular slotted (RSC)',
      shortLabel: '0201',
      cardTitle: 'Regular slotted',
      description: 'Standard shipping carton. Outer flaps meet in the middle.',
      priceFactor: 1,
      featured: true,
    },
    '0203': {
      label: '0203 — Full overlap (FOL)',
      shortLabel: '0203',
      cardTitle: 'Full overlap',
      description: 'Outer flaps fully overlap for extra top and bottom strength.',
      priceFactor: 1.15,
      featured: true,
    },
    '0426': {
      label: '0426 — Self-locking mailer',
      shortLabel: '0426',
      cardTitle: 'Self-lock mailer',
      description: 'Die-cut mailer with self-locking walls. No tape needed.',
      priceFactor: 1.4,
      featured: true,
    },
    '0427': {
      label: '0427 — Tray with hinged lid',
      shortLabel: '0427',
      cardTitle: 'Hinged-lid tray',
      description: 'Die-cut tray with hinged lid. Tabs lock into front-wall slots.',
      priceFactor: 1.45,
      featured: true,
    },
  },

  defaultFefco: '0201',

  // Quantity breaks shown in the designer (like Kite)
  qtyBreaks: [100, 250, 500, 1000, 2500, 5000],
};

export const PRICING_STORAGE_KEY = 'unfold-pricing-config';

export function loadPricing() {
  try {
    const raw = localStorage.getItem(PRICING_STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_PRICING);
    return mergePricing(DEFAULT_PRICING, JSON.parse(raw));
  } catch {
    return structuredClone(DEFAULT_PRICING);
  }
}

export function savePricing(config) {
  localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(config));
}

export function clearPricingOverrides() {
  localStorage.removeItem(PRICING_STORAGE_KEY);
}

export function hasPricingOverrides() {
  return Boolean(localStorage.getItem(PRICING_STORAGE_KEY));
}

function mergePricing(base, override) {
  const mergedFefco = { ...base.fefco };
  if (override.fefco) {
    for (const [code, style] of Object.entries(override.fefco)) {
      mergedFefco[code] = { ...(base.fefco[code] || {}), ...style };
    }
  }

  return {
    ...base,
    ...override,
    referenceBox: { ...base.referenceBox, ...(override.referenceBox || {}) },
    qtyBreaks: override.qtyBreaks || base.qtyBreaks,
    boards: {
      kraft: { ...base.boards.kraft, ...(override.boards?.kraft || {}) },
      white: { ...base.boards.white, ...(override.boards?.white || {}) },
    },
    walls: {
      single: { ...base.walls.single, ...(override.walls?.single || {}) },
      double: { ...base.walls.double, ...(override.walls?.double || {}) },
    },
    fefco: mergedFefco,
  };
}

export function referenceArea(config) {
  const { length: l, width: w, height: h } = config.referenceBox;
  return 2 * (l * w + l * h + w * h);
}

export function estimateUnitPrice(
  config,
  { length, width, height, quantity, board, wall, fefco }
) {
  const area = 2 * (length * width + length * height + width * height);
  const refArea = referenceArea(config);

  const sizeFactor = clamp(
    Math.pow(area / refArea, config.sizeExponent),
    config.sizeFactorMin,
    config.sizeFactorMax
  );

  const quantityFactor = clamp(
    Math.pow(config.referenceQuantity / quantity, config.quantityExponent),
    config.quantityFactorMin,
    config.quantityFactorMax
  );

  const boardFactor = config.boards[board]?.priceFactor ?? 1;
  const wallFactor = config.walls[wall]?.priceFactor ?? 1;
  const fefcoCode = fefco || config.defaultFefco;
  const fefcoFactor = config.fefco[fefcoCode]?.priceFactor ?? 1;

  const unit =
    config.basePricePerBox *
    sizeFactor *
    quantityFactor *
    boardFactor *
    wallFactor *
    fefcoFactor;

  return {
    unit,
    total: unit * quantity,
    sizeFactor,
    quantityFactor,
    boardFactor,
    wallFactor,
    fefcoFactor,
    fefcoCode,
    belowMoq: quantity < config.moq,
  };
}

/** Price table for qty breaks (same board/style/size). */
export function estimateQtyBreaks(config, opts) {
  const breaks = config.qtyBreaks || [100, 250, 500, 1000, 2500, 5000];
  return breaks.map((quantity) => {
    const result = estimateUnitPrice(config, { ...opts, quantity });
    return {
      quantity,
      unit: result.unit,
      total: result.total,
      active: quantity === opts.quantity,
    };
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
