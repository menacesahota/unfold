import {
  DEFAULT_PRICING,
  loadPricing,
  savePricing,
  clearPricingOverrides,
  hasPricingOverrides,
  estimateUnitPrice,
} from './pricing-config.js';

const form = document.getElementById('pricing-form');
const saveStatus = document.getElementById('save-status');
const overrideStatus = document.getElementById('override-status');

const fields = {
  basePricePerBox: form.elements.basePricePerBox,
  moq: form.elements.moq,
  referenceQuantity: form.elements.referenceQuantity,
  refLength: form.elements.refLength,
  refWidth: form.elements.refWidth,
  refHeight: form.elements.refHeight,
  kraftFactor: form.elements.kraftFactor,
  whiteFactor: form.elements.whiteFactor,
  singleFactor: form.elements.singleFactor,
  doubleFactor: form.elements.doubleFactor,
  fefco0201: form.elements.fefco0201,
  fefco0203: form.elements.fefco0203,
  fefco0426: form.elements.fefco0426,
  fefco0427: form.elements.fefco0427,
  sizeExponent: form.elements.sizeExponent,
  quantityExponent: form.elements.quantityExponent,
  sizeFactorMin: form.elements.sizeFactorMin,
  sizeFactorMax: form.elements.sizeFactorMax,
  quantityFactorMin: form.elements.quantityFactorMin,
  quantityFactorMax: form.elements.quantityFactorMax,
};

const test = {
  l: document.getElementById('test-l'),
  w: document.getElementById('test-w'),
  h: document.getElementById('test-h'),
  qty: document.getElementById('test-qty'),
  board: document.getElementById('test-board'),
  wall: document.getElementById('test-wall'),
  fefco: document.getElementById('test-fefco'),
};

function num(input, fallback = 0) {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : fallback;
}

function readFormConfig() {
  return {
    moq: Math.round(num(fields.moq, DEFAULT_PRICING.moq)),
    basePricePerBox: num(fields.basePricePerBox, DEFAULT_PRICING.basePricePerBox),
    referenceQuantity: Math.round(num(fields.referenceQuantity, DEFAULT_PRICING.referenceQuantity)),
    referenceBox: {
      length: Math.round(num(fields.refLength, DEFAULT_PRICING.referenceBox.length)),
      width: Math.round(num(fields.refWidth, DEFAULT_PRICING.referenceBox.width)),
      height: Math.round(num(fields.refHeight, DEFAULT_PRICING.referenceBox.height)),
    },
    sizeExponent: num(fields.sizeExponent, DEFAULT_PRICING.sizeExponent),
    sizeFactorMin: num(fields.sizeFactorMin, DEFAULT_PRICING.sizeFactorMin),
    sizeFactorMax: num(fields.sizeFactorMax, DEFAULT_PRICING.sizeFactorMax),
    quantityExponent: num(fields.quantityExponent, DEFAULT_PRICING.quantityExponent),
    quantityFactorMin: num(fields.quantityFactorMin, DEFAULT_PRICING.quantityFactorMin),
    quantityFactorMax: num(fields.quantityFactorMax, DEFAULT_PRICING.quantityFactorMax),
    boards: {
      kraft: {
        ...DEFAULT_PRICING.boards.kraft,
        priceFactor: num(fields.kraftFactor, DEFAULT_PRICING.boards.kraft.priceFactor),
      },
      white: {
        ...DEFAULT_PRICING.boards.white,
        priceFactor: num(fields.whiteFactor, DEFAULT_PRICING.boards.white.priceFactor),
      },
    },
    walls: {
      single: {
        ...DEFAULT_PRICING.walls.single,
        priceFactor: num(fields.singleFactor, DEFAULT_PRICING.walls.single.priceFactor),
      },
      double: {
        ...DEFAULT_PRICING.walls.double,
        priceFactor: num(fields.doubleFactor, DEFAULT_PRICING.walls.double.priceFactor),
      },
    },
    fefco: {
      '0201': {
        ...DEFAULT_PRICING.fefco['0201'],
        priceFactor: num(fields.fefco0201, DEFAULT_PRICING.fefco['0201'].priceFactor),
      },
      '0203': {
        ...DEFAULT_PRICING.fefco['0203'],
        priceFactor: num(fields.fefco0203, DEFAULT_PRICING.fefco['0203'].priceFactor),
      },
      '0426': {
        ...DEFAULT_PRICING.fefco['0426'],
        priceFactor: num(fields.fefco0426, DEFAULT_PRICING.fefco['0426'].priceFactor),
      },
      '0427': {
        ...DEFAULT_PRICING.fefco['0427'],
        priceFactor: num(fields.fefco0427, DEFAULT_PRICING.fefco['0427'].priceFactor),
      },
    },
    defaultFefco: DEFAULT_PRICING.defaultFefco,
    qtyBreaks: DEFAULT_PRICING.qtyBreaks,
  };
}

function fillForm(config) {
  fields.basePricePerBox.value = config.basePricePerBox;
  fields.moq.value = config.moq;
  fields.referenceQuantity.value = config.referenceQuantity;
  fields.refLength.value = config.referenceBox.length;
  fields.refWidth.value = config.referenceBox.width;
  fields.refHeight.value = config.referenceBox.height;
  fields.kraftFactor.value = config.boards.kraft.priceFactor;
  fields.whiteFactor.value = config.boards.white.priceFactor;
  fields.singleFactor.value = config.walls.single.priceFactor;
  fields.doubleFactor.value = config.walls.double.priceFactor;
  fields.fefco0201.value = config.fefco['0201'].priceFactor;
  fields.fefco0203.value = config.fefco['0203'].priceFactor;
  fields.fefco0426.value = config.fefco['0426'].priceFactor;
  fields.fefco0427.value = config.fefco['0427'].priceFactor;
  fields.sizeExponent.value = config.sizeExponent;
  fields.quantityExponent.value = config.quantityExponent;
  fields.sizeFactorMin.value = config.sizeFactorMin;
  fields.sizeFactorMax.value = config.sizeFactorMax;
  fields.quantityFactorMin.value = config.quantityFactorMin;
  fields.quantityFactorMax.value = config.quantityFactorMax;
}

function updateOverrideStatus() {
  if (hasPricingOverrides()) {
    overrideStatus.textContent = 'Local overrides are active in this browser.';
    overrideStatus.classList.add('active');
  } else {
    overrideStatus.textContent = 'Using default production values.';
    overrideStatus.classList.remove('active');
  }
}

function updateTestEstimate() {
  const config = readFormConfig();
  const result = estimateUnitPrice(config, {
    length: num(test.l, 300),
    width: num(test.w, 220),
    height: num(test.h, 150),
    quantity: Math.max(1, Math.round(num(test.qty, 250))),
    board: test.board.value,
    wall: test.wall.value,
    fefco: test.fefco.value,
  });

  document.getElementById('test-result').textContent =
    `£${result.unit.toFixed(2)} per box · ≈ £${Math.round(result.total).toLocaleString('en-GB')} total`;

  document.getElementById('test-breakdown').innerHTML = `
    <li>Size factor ×${result.sizeFactor.toFixed(2)}</li>
    <li>Quantity factor ×${result.quantityFactor.toFixed(2)}</li>
    <li>Board ×${result.boardFactor.toFixed(2)}</li>
    <li>Wall ×${result.wallFactor.toFixed(2)}</li>
    <li>FEFCO ${result.fefcoCode} ×${result.fefcoFactor.toFixed(2)}</li>
    <li>${result.belowMoq ? `Below MOQ (${config.moq})` : `Meets MOQ (${config.moq})`}</li>
  `;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const config = readFormConfig();
  savePricing(config);
  updateOverrideStatus();
  updateTestEstimate();
  saveStatus.textContent = 'Saved. Open the homepage to see estimates update.';
});

document.getElementById('reset-defaults')?.addEventListener('click', () => {
  clearPricingOverrides();
  fillForm(DEFAULT_PRICING);
  updateOverrideStatus();
  updateTestEstimate();
  saveStatus.textContent = 'Reset to defaults.';
});

document.getElementById('copy-config')?.addEventListener('click', async () => {
  const config = readFormConfig();
  const text = JSON.stringify(config, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    saveStatus.textContent =
      'Copied JSON. Paste the values into scripts/pricing-config.js (DEFAULT_PRICING), then push to deploy.';
  } catch {
    saveStatus.textContent = 'Could not copy — open the browser console for the JSON.';
    console.log(text);
  }
});

[form, ...Object.values(test)].forEach((el) => {
  el.addEventListener('input', updateTestEstimate);
  el.addEventListener('change', updateTestEstimate);
});

fillForm(loadPricing());
updateOverrideStatus();
updateTestEstimate();
