/**
 * PPWR supplier pack — generate documentation PDF.
 */

import { generatePpwrPdf } from './ppwr-pdf.js';
import {
  BOARDS,
  COATINGS,
  INKS,
  WALLS,
  fillStyleSelect,
  styleByCode,
} from './spec-catalog.js';

const form = document.getElementById('ppwr-form');
const statusEl = document.getElementById('ppwr-status');
const fillReadout = document.getElementById('fill-readout');

fillStyleSelect(document.getElementById('ppwr-style'), undefined, '0201');

function num(name, fallback) {
  const n = Number(form.elements[name]?.value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function readPack() {
  return {
    company: String(form.elements.company?.value || '').trim(),
    sku: String(form.elements.sku?.value || '').trim(),
    style: styleByCode(form.elements.style.value),
    board: BOARDS[form.elements.board.value] || BOARDS.kraft,
    wall: WALLS[form.elements.wall.value] || WALLS.single,
    ink: INKS[form.elements.ink.value] || INKS.none,
    coating: COATINGS[form.elements.coating.value] || COATINGS.none,
    length: num('length', 300),
    width: num('width', 220),
    height: num('height', 150),
    fillPercent: Number(form.elements.fill?.value),
    foodContact: form.elements.foodContact?.value === 'yes',
  };
}

function updateFill() {
  const fill = Number(form.elements.fill?.value);
  if (!fillReadout || !Number.isFinite(fill)) return;
  fillReadout.textContent = `${fill}% product / ${Math.max(0, 100 - fill)}% void (stated)`;
}

form?.addEventListener('input', updateFill);
form?.addEventListener('change', updateFill);
updateFill();

document.getElementById('download-ppwr')?.addEventListener('click', async () => {
  const pack = readPack();
  if (!pack.company || !pack.sku) {
    if (statusEl) statusEl.textContent = 'Add the brand name and SKU first.';
    form.elements.company?.focus();
    return;
  }
  if (statusEl) statusEl.textContent = 'Building PDF…';
  try {
    await generatePpwrPdf(pack);
    if (statusEl) statusEl.textContent = 'Saved. This is supplier information, not a Declaration of Conformity.';
  } catch (err) {
    console.error(err);
    if (statusEl) statusEl.textContent = 'Could not build the PDF. Try again.';
  }
});

document.getElementById('manufacture-ppwr')?.addEventListener('click', () => {
  const pack = readPack();
  const message = [
    'PPWR supplier pack — please manufacture and match this spec.',
    `Brand: ${pack.company || '—'}`,
    `SKU: ${pack.sku || '—'}`,
    `FEFCO ${pack.style.code} ${pack.style.title}`,
    `${pack.length} × ${pack.width} × ${pack.height} mm`,
    `${pack.board.label} / ${pack.wall.label}`,
    `Print: ${pack.ink.label}. Coating: ${pack.coating.label}.`,
    `Food contact: ${pack.foodContact ? 'yes' : 'no'}`,
  ].join('\n');
  sessionStorage.setItem('unfold-spec-brief', message);
  window.location.href = '/?product=boxes&quote=ppwr#brief';
});
