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

  // Style multipliers (spec engine + quote formula). Featured four are the live quote cards.
  fefco: {
    '0200': { label: '0200 — Half slotted (HSC)', shortLabel: '0200', priceFactor: 0.92 },
    '0201': {
      label: '0201 — Regular slotted (RSC)',
      shortLabel: '0201',
      cardTitle: 'Regular slotted',
      description: 'Standard shipping carton. Outer flaps meet in the middle.',
      priceFactor: 1,
      featured: true,
    },
    '0202': { label: '0202 — Overlap slotted (OSC)', shortLabel: '0202', priceFactor: 1.08 },
    '0203': {
      label: '0203 — Full overlap (FOL)',
      shortLabel: '0203',
      cardTitle: 'Full overlap',
      description: 'Outer flaps fully overlap for extra top and bottom strength.',
      priceFactor: 1.15,
      featured: true,
    },
    '0204': { label: '0204 — Centre special slotted (CSSC)', shortLabel: '0204', priceFactor: 1.12 },
    '0205': { label: '0205 — Centre special overlap', shortLabel: '0205', priceFactor: 1.18 },
    '0215': { label: '0215 — Full-lid, crash-lock bottom', shortLabel: '0215', priceFactor: 1.22 },
    '0216': { label: '0216 — Interlocking bottom', shortLabel: '0216', priceFactor: 1.22 },
    '0218': { label: '0218 — Tuck-top with lock tabs', shortLabel: '0218', priceFactor: 1.18 },
    '0300': { label: '0300 — Telescope (two-piece)', shortLabel: '0300', priceFactor: 1.35 },
    '0409': { label: '0409 — Wrap-around folder', shortLabel: '0409', priceFactor: 1.1 },
    '0421': { label: '0421 — Tray with hinged tuck lid', shortLabel: '0421', priceFactor: 1.35 },
    '0422': { label: '0422 — Self-locking tray', shortLabel: '0422', priceFactor: 1.25 },
    '0426': {
      label: '0426 — Hinged-lid mailer',
      shortLabel: '0426',
      cardTitle: 'Hinged-lid mailer',
      description: 'Die-cut mailer with lid, dust flaps and a front tuck.',
      priceFactor: 1.4,
      featured: true,
    },
    '0427': {
      label: '0427 — Locking-wall mailer',
      shortLabel: '0427',
      cardTitle: 'Locking-wall mailer',
      description: 'Double-wall sides lock into the base. Lid tabs into the front wall.',
      priceFactor: 1.45,
      featured: true,
    },
    '0501': { label: '0501 — Sleeve (L × W)', shortLabel: '0501', priceFactor: 0.72 },
    '0502': { label: '0502 — Sleeve (L × H)', shortLabel: '0502', priceFactor: 0.72 },
    '0503': { label: '0503 — Sleeve (W × H)', shortLabel: '0503', priceFactor: 0.7 },
    '0711': { label: '0711 — Ready-glued crash-lock', shortLabel: '0711', priceFactor: 1.28 },
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
