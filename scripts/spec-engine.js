/**
 * Box Spec Engine — style photo, price band, PDF.
 */

import { DEFAULT_PRICING, estimateUnitPrice, estimateQtyBreaks } from './pricing-config.js';
import { generateSpecPdf } from './spec-pdf.js';
import { fefcoPreviewAlt, fefcoPreviewNote, fefcoPreviewSrc } from './fefco-preview.js';
import {
  ARTWORK_CHECKLIST,
  BOARDS,
  COATINGS,
  FEFCO_SOURCE,
  INKS,
  REGIONS,
  WALLS,
  fillStyleSelect,
  formatGbp,
  formatUsd,
  seriesById,
  styleByCode,
  toUsd,
} from './spec-catalog.js';

const form = document.getElementById('spec-form');
const preview = document.getElementById('style-preview');
const previewCap = document.getElementById('style-preview-cap');
const statusEl = document.getElementById('spec-status');
const bandEl = document.getElementById('price-band');
const checklistEl = document.getElementById('artwork-checklist');
const styleSelect = document.getElementById('spec-style');

function num(name, fallback) {
  const n = Number(form.elements[name]?.value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function readSpec() {
  const style = styleByCode(form.elements.style.value);
  const board = BOARDS[form.elements.board.value] || BOARDS.kraft;
  const wall = WALLS[form.elements.wall.value] || WALLS.single;
  const ink = INKS[form.elements.ink.value] || INKS.none;
  const coating = COATINGS[form.elements.coating.value] || COATINGS.none;
  const region = REGIONS.find((r) => r.id === form.elements.region.value) || REGIONS[0];
  const length = num('length', 300);
  const width = num('width', 220);
  const height = num('height', 150);
  const quantity = Math.max(1, Math.round(num('quantity', 500)));

  const overlap = Math.max(5, Math.round(num('overlap', 40)));
  const extra = style.priceFactor ?? 1;
  const mid = estimateUnitPrice(DEFAULT_PRICING, {
    length,
    width,
    height,
    quantity,
    board: board.id,
    wall: wall.id,
    fefco: style.priceKey,
  });
  const unit = mid.unit * extra;
  const low = unit * 0.85;
  const high = unit * 1.25;

  return {
    style,
    board,
    wall,
    ink,
    coating,
    region,
    length,
    width,
    height,
    overlap,
    quantity,
    brandName: String(form.elements.brand?.value || '').trim(),
    moq: DEFAULT_PRICING.moq,
    breaks: estimateQtyBreaks(DEFAULT_PRICING, {
      length,
      width,
      height,
      quantity,
      board: board.id,
      wall: wall.id,
      fefco: style.priceKey,
    }),
    band: {
      belowMoq: quantity < DEFAULT_PRICING.moq,
      mid: { unit, total: unit * quantity },
      low: { unit: low, total: low * quantity },
      high: { unit: high, total: high * quantity },
    },
  };
}

function showPreview(spec) {
  if (!preview) return;
  const code = spec.style.code;
  preview.src = fefcoPreviewSrc(code);
  preview.alt = fefcoPreviewAlt(code, `FEFCO ${code} ${spec.style.title}`);
  if (previewCap) {
    const note = fefcoPreviewNote(code);
    previewCap.textContent = note
      ? `FEFCO ${code} · ${spec.style.title}. ${note}`
      : `FEFCO ${code} · ${spec.style.title}`;
  }
}

function renderStyleMeta(spec) {
  const hint = document.getElementById('style-hint');
  const meta = document.getElementById('style-meta');
  const overlapField = document.getElementById('overlap-field');
  const series = seriesById(spec.style.series);
  if (hint) hint.textContent = spec.style.description;
  if (meta) {
    const bits = [
      series.label,
      `Erect ${spec.style.erection}`,
      spec.style.pieces === 1 ? '1 piece' : `${spec.style.pieces} pieces`,
      FEFCO_SOURCE,
    ];
    meta.innerHTML = bits.map((b) => `<span>${b}</span>`).join('');
  }
  if (overlapField) overlapField.hidden = !spec.style.needsOverlap;
}

function renderBand(spec) {
  if (!bandEl) return;
  const { low, mid, high, belowMoq } = spec.band;
  bandEl.innerHTML = `
    <div class="band-grid">
      <div>
        <span class="band-label">Low</span>
        <strong>${formatGbp(low.unit)}</strong>
        <span>${formatGbp(low.total)} · ${formatUsd(toUsd(low.total))}</span>
      </div>
      <div class="is-mid">
        <span class="band-label">Mid</span>
        <strong>${formatGbp(mid.unit)}</strong>
        <span>${formatGbp(mid.total)} · ${formatUsd(toUsd(mid.total))}</span>
      </div>
      <div>
        <span class="band-label">High</span>
        <strong>${formatGbp(high.unit)}</strong>
        <span>${formatGbp(high.total)} · ${formatUsd(toUsd(high.total))}</span>
      </div>
    </div>
    <p class="band-note">
      ${belowMoq ? `Below usual MOQ of ${spec.moq}. ` : ''}
      Ex VAT, ballpark only. USD is indicative. Manufacture through unfold to lock a price.
    </p>
    ${
      spec.style.needsOverlap
        ? `<p class="band-note">Overlap o = ${spec.overlap} mm. FEFCO writes this as L × W × H / o.</p>`
        : ''
    }
    ${
      spec.style.pieces > 1
        ? '<p class="band-note">Two-piece style — body and lid are separate. Lid is sized L+ × W+ to clear board caliper.</p>'
        : ''
    }
  `;
}

function renderChecklist() {
  if (!checklistEl) return;
  checklistEl.innerHTML = ARTWORK_CHECKLIST.map((item) => `<li>${item}</li>`).join('');
}

function refresh() {
  const spec = readSpec();
  showPreview(spec);
  renderBand(spec);
  renderStyleMeta(spec);
  return spec;
}

function specMessage(spec) {
  const size =
    spec.style.needsOverlap
      ? `${spec.length} × ${spec.width} × ${spec.height}/${spec.overlap} mm (L × W × H / o)`
      : `${spec.length} × ${spec.width} × ${spec.height} mm`;
  return [
    `Box spec request`,
    `Style: FEFCO ${spec.style.code} ${spec.style.title} (${spec.style.erection}, ${spec.style.pieces}-piece)`,
    `Size: ${size}`,
    `Qty: ${spec.quantity}`,
    `Board: ${spec.board.label} / ${spec.wall.label}`,
    `Print: ${spec.ink.label} / ${spec.coating.label}`,
    `Ship-from: ${spec.region.label}`,
    spec.brandName ? `Brand: ${spec.brandName}` : '',
    `Mid band: ${formatGbp(spec.band.mid.unit)} / box (${formatGbp(spec.band.mid.total)} total)`,
    `Source: ${FEFCO_SOURCE}`,
  ]
    .filter(Boolean)
    .join('\n');
}

fillStyleSelect(styleSelect, undefined, '0201');

renderChecklist();
form?.addEventListener('input', refresh);
form?.addEventListener('change', refresh);

document.getElementById('download-spec')?.addEventListener('click', async () => {
  const spec = refresh();
  if (statusEl) statusEl.textContent = 'Building PDF…';
  try {
    await generateSpecPdf(spec);
    if (statusEl) statusEl.textContent = 'Saved. Send it to a converter, or ask unfold to make it.';
  } catch (err) {
    console.error(err);
    if (statusEl) statusEl.textContent = 'Could not build the PDF. Try again.';
  }
});

document.getElementById('manufacture-spec')?.addEventListener('click', () => {
  const spec = refresh();
  const params = new URLSearchParams({
    product: 'boxes',
    quote: 'spec',
  });
  sessionStorage.setItem('unfold-spec-brief', specMessage(spec));
  window.location.href = `/?${params.toString()}#brief`;
});

refresh();
