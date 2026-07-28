import {
  loadPricing,
  estimateUnitPrice,
  estimateQtyBreaks,
  hasPricingOverrides,
} from './pricing-config.js';
import { fefcoPreviewSrc, fefcoPreviewAlt, FEFCO_PREVIEW_CODES } from './fefco-preview.js';

const form = document.getElementById('quote-form');
const formStatus = document.getElementById('form-status');

const DEFAULT_VIEW = { x: -16, y: -30 };

const state = {
  board: 'kraft',
  wall: 'single',
  fefco: '0201',
  logoDataUrl: '',
  logoFileName: '',
  rotX: DEFAULT_VIEW.x,
  rotY: DEFAULT_VIEW.y,
};

let pricing = loadPricing();

const previewArea = document.getElementById('design-preview');
const previewHero = document.getElementById('preview-hero');
const previewStage = document.getElementById('preview-stage');
const previewPack = document.getElementById('preview-pack');
const previewLogo = document.getElementById('preview-logo');
const previewBrand = document.getElementById('preview-brand');
const previewBrandPhoto = document.getElementById('preview-brand-photo');
const previewSpec = document.getElementById('preview-spec');
const previewHint = document.getElementById('preview-hint');
const resetViewBtn = document.getElementById('reset-view');
const logoStatus = document.getElementById('logo-status');
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

function isLive3d() {
  return state.fefco === '0201';
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

function applyRotation() {
  if (!previewPack || !isLive3d()) return;
  state.rotY = Math.min(Math.max(state.rotY, -85), 85);
  state.rotX = Math.min(Math.max(state.rotX, -45), 45);
  previewPack.style.transform = `rotateX(${state.rotX}deg) rotateY(${state.rotY}deg)`;
}

function updateLogoStatus() {
  if (!logoStatus) return;
  if (state.logoDataUrl) {
    logoStatus.hidden = false;
    logoStatus.innerHTML = `Logo for quote: <strong>${state.logoFileName || 'uploaded file'}</strong>`;
  } else {
    logoStatus.hidden = true;
    logoStatus.textContent = '';
  }
}

function updatePreview() {
  const { l, w, h } = getDimensions();
  const brand = inputs.brand.value.trim();
  const board = pricing.boards[state.board];
  const wall = pricing.walls[state.wall];
  const fefco = pricing.fefco[state.fefco];
  const live3d = isLive3d();

  previewArea?.classList.toggle('is-3d', live3d);

  if (live3d) {
    if (previewHero) previewHero.hidden = true;
    if (previewStage) previewStage.hidden = false;
    if (resetViewBtn) resetViewBtn.hidden = false;
    if (previewHint) previewHint.textContent = 'Drag to rotate';
    if (previewBrandPhoto) previewBrandPhoto.hidden = true;

    const fitBudget =
      window.matchMedia('(max-width: 560px)').matches
        ? 150
        : window.matchMedia('(max-width: 900px)').matches
          ? 200
          : 280;
    const s = Math.min(fitBudget / Math.max(l, w, h), 1.5);
    previewPack.style.setProperty('--w', `${l * s}px`);
    previewPack.style.setProperty('--h', `${h * s}px`);
    previewPack.style.setProperty('--d', `${w * s}px`);
    previewPack.style.setProperty('--board', board.color);
    previewPack.style.setProperty('--ink-print', inputs.ink.value);

    if (previewBrand) {
      previewBrand.textContent = brand;
      previewBrand.hidden = !brand;
    }

    if (previewLogo) {
      if (state.logoDataUrl) {
        previewLogo.src = state.logoDataUrl;
        previewLogo.hidden = false;
      } else {
        previewLogo.removeAttribute('src');
        previewLogo.hidden = true;
      }
    }

    applyRotation();
  } else {
    if (previewStage) previewStage.hidden = true;
    if (resetViewBtn) resetViewBtn.hidden = true;
    if (previewHint) previewHint.textContent = 'Style illustration · not to scale';

    if (previewHero) {
      previewHero.hidden = false;
      const src = fefcoPreviewSrc(state.fefco);
      const alt = fefcoPreviewAlt(state.fefco, fefco?.label);
      previewHero.innerHTML = `<img src="${src}" alt="${alt}" width="640" height="640" class="preview-hero-img${state.board === 'white' ? ' board-white' : ''}" />`;
    }

    if (previewBrandPhoto) {
      previewBrandPhoto.textContent = brand;
      previewBrandPhoto.hidden = !brand;
      previewBrandPhoto.style.color = inputs.ink.value;
    }
  }

  updateLogoStatus();
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

let dragging = false;
let lastX = 0;
let lastY = 0;

previewArea?.addEventListener('pointerdown', (e) => {
  if (!isLive3d()) return;
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  previewArea.classList.add('dragging');
  previewArea.setPointerCapture(e.pointerId);
});

previewArea?.addEventListener('pointermove', (e) => {
  if (!dragging || !isLive3d()) return;
  state.rotY += (e.clientX - lastX) * 0.45;
  state.rotX -= (e.clientY - lastY) * 0.45;
  lastX = e.clientX;
  lastY = e.clientY;
  applyRotation();
});

['pointerup', 'pointercancel'].forEach((evt) => {
  previewArea?.addEventListener(evt, () => {
    dragging = false;
    previewArea?.classList.remove('dragging');
  });
});

resetViewBtn?.addEventListener('click', () => {
  state.rotX = DEFAULT_VIEW.x;
  state.rotY = DEFAULT_VIEW.y;
  applyRotation();
});

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

  if (brand) lines.push(`Print / brand text: "${brand}" in ${inputs.ink.value}`);
  if (state.logoDataUrl) {
    lines.push(
      `Logo artwork: YES — file "${state.logoFileName || 'uploaded'}" supplied in designer / PDF mockup. Please quote printed logo.`
    );
  } else {
    lines.push('Logo artwork: none');
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
    const breaks = estimateQtyBreaks(pricing, {
      length: l,
      width: w,
      height: h,
      quantity: qty,
      board: state.board,
      wall: state.wall,
      fefco: state.fefco,
    });

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
      logoDataUrl: state.logoDataUrl || '',
      logoFileName: state.logoFileName || '',
      qtyBreaks: breaks,
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
    state.logoFileName = '';
    updatePreview();
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    state.logoDataUrl = ev.target.result;
    state.logoFileName = file.name;
    updatePreview();
  };
  reader.readAsDataURL(file);
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const submitBtn = form.querySelector('button[type="submit"]');

  const name = String(data.get('name') || '').trim();
  const email = String(data.get('email') || '').trim();
  const quantity = String(data.get('quantity') || '').trim() || '—';
  const details = String(data.get('details') || '').trim() || '—';

  if (submitBtn) submitBtn.disabled = true;
  formStatus.textContent = 'Sending…';

  try {
    const res = await fetch('https://formsubmit.co/ajax/hello@unfold.supply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        quantity,
        message: details,
        _replyto: email,
        _subject: `Box quote request — ${name}`,
        _template: 'table',
      }),
    });

    const result = await res.json().catch(() => ({}));

    if (!res.ok || result.success === 'false' || result.success === false) {
      throw new Error(result.message || 'Could not send quote request.');
    }

    form.reset();
    formStatus.textContent =
      'Sent — we will reply to your email within one working day.';
  } catch (err) {
    formStatus.textContent =
      'Could not send automatically. Email hello@unfold.supply and we will help.';
    console.error(err);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
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

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (isLive3d()) updatePreview();
  }, 120);
});
