import {
  loadPricing,
  estimateUnitPrice,
  hasPricingOverrides,
} from './pricing-config.js';

const form = document.getElementById('quote-form');
const formStatus = document.getElementById('form-status');

const DEFAULT_VIEW = { x: -16, y: -30 };

const state = {
  board: 'kraft',
  wall: 'single',
  fefco: '0201',
  rotX: DEFAULT_VIEW.x,
  rotY: DEFAULT_VIEW.y,
};

let pricing = loadPricing();

const previewPack = document.getElementById('preview-pack');
const previewArea = document.getElementById('design-preview');
const previewBrand = document.getElementById('preview-brand');
const previewLogo = document.getElementById('preview-logo');
const previewSpec = document.getElementById('preview-spec');
const estimatePrice = document.getElementById('estimate-price');
const estimateNote = document.getElementById('estimate-note');
const fefcoSelect = document.getElementById('fefco-style');
const fefcoHint = document.getElementById('fefco-hint');

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

function populateFefcoOptions() {
  if (!fefcoSelect) return;
  const current = state.fefco || pricing.defaultFefco;
  fefcoSelect.innerHTML = '';
  Object.entries(pricing.fefco).forEach(([code, style]) => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = style.label;
    fefcoSelect.appendChild(option);
  });
  fefcoSelect.value = pricing.fefco[current] ? current : pricing.defaultFefco;
  state.fefco = fefcoSelect.value;
  updateFefcoHint();
}

function updateFefcoHint() {
  if (!fefcoHint) return;
  fefcoHint.textContent = pricing.fefco[state.fefco]?.description || '';
}

function estimate() {
  const { l, w, h } = getDimensions();
  const qty = getQuantity();
  return estimateUnitPrice(pricing, {
    length: l,
    width: w,
    height: h,
    quantity: qty,
    board: state.board,
    wall: state.wall,
    fefco: state.fefco,
  });
}

function updateEstimate() {
  pricing = loadPricing();
  const { unit, total, belowMoq } = estimate();

  estimatePrice.textContent = `£${unit.toFixed(2)} per box · ≈ £${Math.round(total).toLocaleString('en-GB')} total`;

  if (belowMoq) {
    estimateNote.textContent = `Our minimum order is ${pricing.moq} boxes.`;
    estimateNote.classList.add('estimate-warn');
  } else if (hasPricingOverrides()) {
    estimateNote.textContent = 'Ballpark — using your local pricing overrides.';
    estimateNote.classList.remove('estimate-warn');
  } else {
    estimateNote.textContent = 'Ballpark — confirmed in your quote.';
    estimateNote.classList.remove('estimate-warn');
  }
}

function applyRotation() {
  state.rotY = Math.min(Math.max(state.rotY, -85), 85);
  state.rotX = Math.min(Math.max(state.rotX, -45), 45);
  previewPack.style.transform = `rotateX(${state.rotX}deg) rotateY(${state.rotY}deg)`;
}

function updatePreview() {
  const { l, w, h } = getDimensions();
  const brand = inputs.brand.value.trim();
  const board = pricing.boards[state.board];
  const wall = pricing.walls[state.wall];
  const fefco = pricing.fefco[state.fefco];

  const s = Math.min(280 / Math.max(l, w, h), 1.5);
  previewPack.style.setProperty('--w', `${l * s}px`);
  previewPack.style.setProperty('--h', `${h * s}px`);
  previewPack.style.setProperty('--d', `${w * s}px`);
  previewPack.style.setProperty('--board', board.color);
  previewPack.style.setProperty('--ink-print', inputs.ink.value);

  previewBrand.textContent = brand;
  previewBrand.hidden = !brand;

  applyRotation();
  updateEstimate();

  previewSpec.textContent = `${fefco?.shortLabel || state.fefco} · ${l} × ${w} × ${h} mm · ${board.label} · ${wall.label}`;
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
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  previewArea.classList.add('dragging');
  previewArea.setPointerCapture(e.pointerId);
});

previewArea?.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  state.rotY += (e.clientX - lastX) * 0.45;
  state.rotX -= (e.clientY - lastY) * 0.45;
  lastX = e.clientX;
  lastY = e.clientY;
  applyRotation();
});

['pointerup', 'pointercancel'].forEach((evt) => {
  previewArea?.addEventListener(evt, () => {
    dragging = false;
    previewArea.classList.remove('dragging');
  });
});

document.getElementById('reset-view')?.addEventListener('click', () => {
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
    `Estimate: £${unit.toFixed(2)}/box, ~£${Math.round(total)} total (ballpark)`,
  ];

  if (brand) lines.push(`Print: "${brand}" in ${inputs.ink.value}`);
  if (previewLogo.src && !previewLogo.hidden) {
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
    const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);

    const canvas = await html2canvas(previewArea, {
      backgroundColor: '#f4f3f0',
      scale: 2,
      logging: false,
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const margin = 18;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('unfold — box mockup', margin, 22);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100);

    let y = 32;
    buildDesignSummary()
      .split('\n')
      .forEach((line) => {
        pdf.text(line, margin, y);
        y += 5;
      });

    const imgData = canvas.toDataURL('image/png');
    const maxW = pageW - margin * 2;
    const imgH = (canvas.height * maxW) / canvas.width;
    const drawH = Math.min(imgH, 130);
    const drawW = (canvas.width * drawH) / canvas.height;

    pdf.addImage(imgData, 'PNG', margin, y + 6, drawW, drawH);

    pdf.setFontSize(8);
    pdf.setTextColor(140);
    pdf.text(
      `Draft mockup — final artwork and pricing confirmed before production. Generated ${new Date().toLocaleDateString('en-GB')}.`,
      margin,
      y + 6 + drawH + 10
    );

    pdf.save('unfold-box-mockup.pdf');
  } catch {
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

fefcoSelect?.addEventListener('change', () => {
  state.fefco = fefcoSelect.value;
  updateFefcoHint();
  updatePreview();
});

Object.values(inputs).forEach((input) => {
  if (!input || input.type === 'file') return;
  input.addEventListener('input', updatePreview);
});

inputs.logo?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) {
    previewLogo.hidden = true;
    previewLogo.removeAttribute('src');
    updatePreview();
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    previewLogo.src = ev.target.result;
    previewLogo.hidden = false;
    updatePreview();
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
  if (e.key === 'unfold-pricing-config') updatePreview();
});

window.addEventListener('focus', () => {
  pricing = loadPricing();
  populateFefcoOptions();
  updateEstimate();
});

populateFefcoOptions();
updatePreview();
