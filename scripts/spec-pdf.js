/**
 * Manufacturer spec PDF: spec sheet, price band, artwork checklist, style photo.
 */

import { jsPDF } from 'jspdf';
import { fefcoPreviewNote, fefcoPreviewSrc } from './fefco-preview.js';
import {
  ARTWORK_CHECKLIST,
  USD_PER_GBP,
  formatGbp,
  formatUsd,
  seriesById,
  toUsd,
} from './spec-catalog.js';

async function loadStyleImage(code) {
  const res = await fetch(fefcoPreviewSrc(code));
  if (!res.ok) throw new Error(`Could not load style image ${code}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function sectionTitle(pdf, label, x, y) {
  pdf.setTextColor(0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(label, x, y);
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.5);
  pdf.line(x, y + 1.4, x + pdf.getTextWidth(label), y + 1.4);
}

function kv(pdf, x, y, label, value, colW) {
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(110);
  pdf.text(String(label).toUpperCase(), x, y);
  pdf.setTextColor(0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  const lines = pdf.splitTextToSize(String(value), colW - 4);
  pdf.text(lines[0] || '', x, y + 4.2);
  return 9;
}

/**
 * @param {object} spec
 */
export async function generateSpecPdf(spec) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const m = 16;
  const contentW = pageW - m * 2;
  const ref = `SPEC-${spec.style.code}-${spec.length}x${spec.width}x${spec.height}`;
  const date = new Date().toISOString().slice(0, 10);

  pdf.setFillColor(18, 17, 15);
  pdf.rect(0, 0, pageW, 28, 'F');
  pdf.setTextColor(255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('unfold', m, 13);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(200);
  pdf.text('BOX SPEC ENGINE', m, 21);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(255);
  pdf.text(`FEFCO ${spec.style.code}`, pageW - m, 12, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(180);
  pdf.text(date, pageW - m, 19, { align: 'right' });

  let y = 38;
  pdf.setTextColor(0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(spec.style.title, m, y);
  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(80);
  const desc = pdf.splitTextToSize(spec.style.description, contentW);
  pdf.text(desc, m, y);
  y += desc.length * 4 + 6;

  if (spec.brandName) {
    pdf.setTextColor(0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text(spec.brandName, m, y);
    y += 7;
  }

  sectionTitle(pdf, 'SPECIFICATION', m, y);
  y += 8;

  const series = seriesById(spec.style.series);
  const size = spec.style.needsOverlap
    ? `${spec.length} × ${spec.width} × ${spec.height}/${spec.overlap} mm`
    : `${spec.length} × ${spec.width} × ${spec.height} mm`;

  const rows = [
    ['Internal size', size],
    ['Quantity', `${spec.quantity.toLocaleString('en-GB')} units`],
    ['FEFCO series', series.label],
    ['Erection / pieces', `${spec.style.erection} · ${spec.style.pieces}-piece`],
    ['Board', spec.board.label],
    ['Wall / flute', `${spec.wall.label} · ${spec.wall.flute}`],
    ['Ship-from', spec.region.label],
    ['Style photo', fefcoPreviewNote(spec.style.code) || 'Erected pack, not to scale'],
    ['Print', spec.ink.label],
    ['Coating', spec.coating.label],
  ];

  const colW = contentW / 2;
  const rowH = 11;
  rows.forEach((row, i) => {
    const col = i % 2;
    const rowIndex = Math.floor(i / 2);
    const x = m + col * colW;
    const ry = y + rowIndex * rowH;
    if (rowIndex % 2 === 0 && col === 0) {
      pdf.setFillColor(245, 242, 236);
      pdf.rect(m, ry - 3.5, contentW, rowH, 'F');
    }
    kv(pdf, x + 2, ry, row[0], row[1], colW);
  });
  y += Math.ceil(rows.length / 2) * rowH + 6;

  sectionTitle(pdf, 'LANDED-COST BAND (EX VAT, BALLPARK)', m, y);
  y += 6;

  pdf.setFillColor(18, 17, 15);
  pdf.rect(m, y, contentW, 22, 'F');
  const bandW = contentW / 3;
  const bands = [
    ['Low', spec.band.low],
    ['Mid (formula)', spec.band.mid],
    ['High', spec.band.high],
  ];
  bands.forEach((band, i) => {
    const x = m + i * bandW + 4;
    pdf.setTextColor(170);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.text(band[0].toUpperCase(), x, y + 6);
    pdf.setTextColor(255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(`${formatGbp(band[1].unit)} / box`, x, y + 13);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(210);
    pdf.text(
      `${formatGbp(band[1].total)}  ·  ${formatUsd(toUsd(band[1].total))}`,
      x,
      y + 18.5
    );
  });
  y += 28;

  pdf.setTextColor(90);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  const notes = [
    spec.band.belowMoq
      ? `Quantity is below the usual MOQ of ${spec.moq}. Band is illustrative only.`
      : `Indicative USD at ${USD_PER_GBP} per GBP. Not a firm offer. Board, print, freight and FX move the number.`,
    'Final price is confirmed before production. This file is a spec, not a purchase order.',
  ];
  notes.forEach((line) => {
    pdf.text(line, m, y);
    y += 4;
  });
  y += 4;

  sectionTitle(pdf, 'ARTWORK CHECKLIST', m, y);
  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(40);
  ARTWORK_CHECKLIST.forEach((item) => {
    pdf.text(`–  ${item}`, m, y);
    y += 5;
  });

  pdf.setDrawColor(0);
  pdf.setLineWidth(0.3);
  pdf.line(m, pageH - 16, pageW - m, pageH - 16);
  pdf.setTextColor(110);
  pdf.setFontSize(6.5);
  pdf.text('unfold.supply  |  hello@unfold.supply', m, pageH - 10);
  pdf.text(ref, pageW - m, pageH - 10, { align: 'right' });

  pdf.addPage();
  pdf.setFillColor(18, 17, 15);
  pdf.rect(0, 0, pageW, 22, 'F');
  pdf.setTextColor(255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('unfold', m, 10);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(200);
  pdf.text('STYLE PREVIEW  ·  ERECTED PACK, NOT TO SCALE', m, 17);

  pdf.setTextColor(0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(`FEFCO ${spec.style.code}  ·  ${spec.style.title}`, m, 32);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(80);
  pdf.text(
    `${spec.length} × ${spec.width} × ${spec.height} mm internal  ·  ${spec.board.label}  ·  ${spec.wall.label}`,
    m,
    38
  );

  const imgH = 118;
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.3);
  pdf.setFillColor(255);
  pdf.rect(m, 44, contentW, imgH, 'FD');
  try {
    const img = await loadStyleImage(spec.style.code);
    const box = 110;
    pdf.addImage(img, 'PNG', m + (contentW - box) / 2, 48, box, box, undefined, 'FAST');
  } catch (err) {
    console.error(err);
    pdf.setTextColor(120);
    pdf.setFontSize(9);
    pdf.text('Style image unavailable', pageW / 2, 44 + imgH / 2, { align: 'center' });
  }

  let ny = 44 + imgH + 10;
  sectionTitle(pdf, 'HOW TO READ THIS PREVIEW', m, ny);
  ny += 7;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(40);
  const familyNote = fefcoPreviewNote(spec.style.code);
  const readme = [
    'This is a photo of the erected style, not a dieline or a cutting die.',
    familyNote || 'The plant will cut from confirmed FEFCO geometry, flute, caliper and joint — not from this picture.',
    spec.style.needsOverlap
      ? `Overlap o = ${spec.overlap} mm. FEFCO writes overlapping styles as L × W × H / o.`
      : '3 mm bleed on print. Keep barcodes, legal copy and glue-tab area clear of decoration.',
    'To manufacture this spec, send the PDF to hello@unfold.supply or request a quote on unfold.supply.',
  ];
  readme.forEach((line) => {
    const wrapped = pdf.splitTextToSize(line, contentW);
    pdf.text(wrapped, m, ny);
    ny += wrapped.length * 4.2 + 2;
  });

  pdf.setDrawColor(0);
  pdf.line(m, pageH - 16, pageW - m, pageH - 16);
  pdf.setTextColor(110);
  pdf.setFontSize(6.5);
  pdf.text('unfold.supply  |  hello@unfold.supply', m, pageH - 10);
  pdf.text(ref, pageW - m, pageH - 10, { align: 'right' });

  const slug = `unfold-spec-fefco${spec.style.code}-${spec.length}x${spec.width}x${spec.height}`.toLowerCase();
  pdf.save(`${slug}.pdf`);
}
