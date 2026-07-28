import {
  loadPricing,
  estimateUnitPrice,
  estimateQtyBreaks,
  hasPricingOverrides,
} from './pricing-config.js';
import { fefcoPreviewSrc, fefcoPreviewAlt, FEFCO_PREVIEW_CODES } from './fefco-preview.js';

const form = document.getElementById('quote-form');
const formStatus = document.getElementById('form-status');

const state = {
  board: 'kraft',
  wall: 'single',
  fefco: '0201',
  logoDataUrl: '',
};

let pricing = loadPricing();

const previewHero = document.getElementById('preview-hero');
const previewBrand = document.getElementById('preview-brand');
const previewSpec = document.getElementById('preview-spec');
const estimatePrice = document.getElementById('estimate-price');
const estimateNote = document.getElementById('estimate-note');
const fefcoCards = document.getElementById('fefco-cards');
const fefcoHint = document.getElementById('fefco-hint');
const qtyBreaksTable = document.getElementById('qty-breaks');

const inputs = {
  l: document.getElementById('size-l'),
  w: document.getElementById('size-w'),
  h: document.getElementById('size-h'),
  qty: document.getElementById('design-qty'),
  ink: document.getElementById('ink-color'),
  brand: document.getElementById('brand-text'),
  logo: document.getElementById('logo-upload'),
};

function getDimensions() {
  return {
    l: Number(inputs.l.value) || pricing.referenceBox.length,
    w: Number(inputs.w.value) || pricing.referenceBox.width,
    h: Number(inputs.h.value) || pricing.referenceBox.height,
  };
}

function getQuantity() {
  return Math.max(1, Math.round(Number(inputs.qty.value) || pricing.moq));
}

function featuredStyles() {
  return FEFCO_PREVIEW_CODES.filter((code) => pricing.fefco[code]).map((code) => ({
    code,
    ...pricing.fefco[code],
  }));
}

function populateFefcoCards() {
  if (!fefcoCards) return;
  const styles = featuredStyles();
  if (!pricing.fefco[state.fefco]) {
    state.fefco = pricing.defaultFefco;
  }

  fefcoCards.innerHTML = styles
    .map((style) => {
      const active = style.code === state.fefco;
      const src = fefcoPreviewSrc(style.code);
      return `
        <button type="button"
          class="fefco-card${active ? ' active' : ''}"
          role="option"
          aria-selected="${active}"
          data-fefco="${style.code}">
          <span class="fefco-card-art">
            <img src="${src}" alt="" width="320" height="320" loading="lazy" />
          </span>
          <span class="fefco-card-code">${style.code}</span>
          <span class="fefco-card-title">${style.cardTitle || style.shortLabel}</span>
        </button>`;
    })
    .join('');

  fefcoCards.querySelectorAll('.fefco-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.fefco = btn.dataset.fefco;
      populateFefcoCards();
      updateFefcoHint();
      updatePreview();
    });
  });

  updateFefcoHint();
}

function updateFefcoHint() {
  if (!fefcoHint) return;
  fefcoHint.textContent = pricing.fefco[state.fefco]?.description || '';
}

function estimate() {
  const { l, w, h } = getDimensions();
  return estimateUnitPrice(pricing, {
    length: l,
    width: w,
    height: h,
    quantity: getQuantity(),
    board: state.board,
    wall: state.wall,
    fefco: state.fefco,
  });
}

function formatPence(unit) {
  if (unit < 1) return `${Math.round(unit * 100)}p`;
  return `£${unit.toFixed(2)}`;
}

function updateEstimate() {
  pricing = loadPricing();
  const qty = getQuantity();
  const { unit, total, belowMoq } = estimate();
  const { l, w, h } = getDimensions();

  estimatePrice.textContent = `${formatPence(unit)} per box · ≈ £${Math.round(total).toLocaleString('en-GB')} total`;

  if (belowMoq) {
    estimateNote.textContent = `Our minimum order is ${pricing.moq} boxes.`;
    estimateNote.classList.add('estimate-warn');
  } else if (hasPricingOverrides()) {
    estimateNote.textContent = 'Ballpark — using your local pricing overrides.';
    estimateNote.classList.remove('estimate-warn');
  } else {
    estimateNote.textContent = 'Ballpark — confirmed in your quote. Ex VAT.';
    estimateNote.classList.remove('estimate-warn');
  }

  if (qtyBreaksTable) {
    const breaks = estimateQtyBreaks(pricing, {
      length: l,
      width: w,
      height: h,
      quantity: qty,
      board: state.board,
      wall: state.wall,
      fefco: state.fefco,
    });

    const body = qtyBreaksTable.querySelector('tbody');
    body.innerHTML = breaks
      .map((row) => {
        const nearest = breaks.reduce((best, b) =>
          Math.abs(b.quantity - qty) < Math.abs(best.quantity - qty) ? b : best
        );
        const isActive = row.quantity === nearest.quantity;
        return `<tr class="${isActive ? 'active' : ''}">
          <td>${row.quantity.toLocaleString('en-GB')}+</td>
          <td>${formatPence(row.unit)}</td>
        </tr>`;
      })
      .join('');
  }
}

function updatePreview() {
  const { l, w, h } = getDimensions();
  const brand = inputs.brand.value.trim();
  const board = pricing.boards[state.board];
  const wall = pricing.walls[state.wall];
  const fefco = pricing.fefco[state.fefco];

  if (previewHero) {
    const src = fefcoPreviewSrc(state.fefco);
    const alt = fefcoPreviewAlt(state.fefco, fefco?.label);
    previewHero.innerHTML = `<img src="${src}" alt="${alt}" width="640" height="640" class="preview-hero-img${state.board === 'white' ? ' board-white' : ''}" />`;
  }

  if (previewBrand) {
    previewBrand.textContent = brand;
    previewBrand.hidden = !brand;
    previewBrand.style.color = inputs.ink.value;
  }

  updateEstimate();
  previewSpec.textContent = `${fefco?.label || state.fefco} · ${l} × ${w} × ${h} mm · ${board.label} · ${wall.label}`;
}

function setSegment(group, value) {
  state[group] = value;
  document.querySelectorAll(`.segment-btn[data-${group}]`).forEach((btn) => {
    const active = btn.dataset[group] === value;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
  updatePreview();
}

function buildDesignSummary() {
  const { l, w, h } = getDimensions();
  const { unit, total } = estimate();
  const brand = inputs.brand.value.trim();
  const board = pricing.boards[state.board];
  const wall = pricing.walls[state.wall];
  const fefco = pricing.fefco[state.fefco];

  const lines = [
    '--- Box design ---',
    `FEFCO: ${fefco?.label || state.fefco}`,
    `Size: ${l} × ${w} × ${h} mm`,
    `Board: ${board.label}, ${wall.label.toLowerCase()}`,
    `Quantity: ${getQuantity()}`,
    `Estimate: ${formatPence(unit)}/box, ~£${Math.round(total)} total (ballpark)`,
  ];

  if (brand) lines.push(`Print: "${brand}" in ${inputs.ink.value}`);
  if (state.logoDataUrl) {
    lines.push('Logo: uploaded in designer (please re-attach with your email)');
  }

  return lines.join('\n');
}

document.getElementById('send-design')?.addEventListener('click', () => {
  const quoteDetails = document.getElementById('quote-details');
  const quantityField = document.querySelector('input[name="quantity"]');

  if (quantityField && !quantityField.value.trim()) {
    quantityField.value = String(getQuantity());
  }

  const summary = buildDesignSummary();
  const existing = quoteDetails.value.trim();
  quoteDetails.value = existing ? `${summary}\n\n${existing}` : summary;

  document.getElementById('quote').scrollIntoView({ behavior: 'smooth' });
  quoteDetails.focus();
});

async function downloadPdf() {
  const button = document.getElementById('download-pdf');
  button.disabled = true;
  const prevText = button.textContent;
  button.textContent = 'Generating…';

  try {
    const { generateBoxMockupPdf } = await import('./pdf-mockup.js');
    const { l, w, h } = getDimensions();
    const qty = getQuantity();
    const { unit, total } = estimate();
    const board = pricing.boards[state.board];
    const wall = pricing.walls[state.wall];
    const fefco = pricing.fefco[state.fefco];

    await generateBoxMockupPdf({
      fefcoCode: state.fefco,
      fefcoLabel: fefco?.label || state.fefco,
      fefcoDescription: fefco?.description || '',
      length: l,
      width: w,
      height: h,
      boardLabel: board.label,
      boardColor: board.color,
      wallLabel: wall.label,
      quantity: qty,
      brand: inputs.brand.value.trim(),
      inkColor: inputs.ink.value,
      unitPrice: unit,
      totalPrice: total,
    });
  } catch (err) {
    console.error(err);
    alert('Could not generate PDF. Please try again.');
  } finally {
    button.disabled = false;
    button.textContent = prevText;
  }
}

document.getElementById('download-pdf')?.addEventListener('click', downloadPdf);

document.querySelectorAll('.segment-btn[data-board]').forEach((btn) => {
  btn.addEventListener('click', () => setSegment('board', btn.dataset.board));
});

document.querySelectorAll('.segment-btn[data-wall]').forEach((btn) => {
  btn.addEventListener('click', () => setSegment('wall', btn.dataset.wall));
});

Object.values(inputs).forEach((input) => {
  if (!input || input.type === 'file') return;
  input.addEventListener('input', updatePreview);
});

inputs.logo?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) {
    state.logoDataUrl = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    state.logoDataUrl = ev.target.result;
  };
  reader.readAsDataURL(file);
});

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const subject = encodeURIComponent('Box quote request');
  const body = encodeURIComponent(
    [
      `Name: ${data.get('name')}`,
      `Email: ${data.get('email')}`,
      `Quantity: ${data.get('quantity') || '—'}`,
      '',
      data.get('details') || '—',
    ].join('\n')
  );
  window.location.href = `mailto:hello@unfold.supply?subject=${subject}&body=${body}`;
  formStatus.textContent = 'Opening your email app…';
});

window.addEventListener('storage', (e) => {
  if (e.key === 'unfold-pricing-config') {
    pricing = loadPricing();
    populateFefcoCards();
    updatePreview();
  }
});

window.addEventListener('focus', () => {
  pricing = loadPricing();
  populateFefcoCards();
  updatePreview();
});

populateFefcoCards();
updatePreview();
