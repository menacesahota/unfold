/**
 * Clean black & white quotation PDF.
 * Uses the same FEFCO style photos as the designer (not flat blanks).
 */

import { fefcoPreviewSrc } from './fefco-preview.js';

function drawSpecRow(pdf, x, y, label, value, width) {
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100);
  pdf.text(label.toUpperCase(), x, y);
  pdf.setTextColor(0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  const maxW = width * 0.58;
  const text = String(value);
  const lines = pdf.splitTextToSize(text, maxW);
  pdf.text(lines[0] || '', x + width * 0.4, y);
}

function formatMoney(amount) {
  const n = Number(amount) || 0;
  return `GBP ${n.toFixed(2)}`;
}

function formatTotal(amount) {
  return `GBP ${Math.round(Number(amount) || 0).toLocaleString('en-GB')}`;
}

async function loadStyleImage(fefcoCode) {
  const src = fefcoPreviewSrc(fefcoCode);
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Could not load style image ${src}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * @param {object} data
 */
export async function generateBoxMockupPdf(data) {
  const { jsPDF } = await import('jspdf');
  const {
    fefcoCode,
    fefcoLabel,
    fefcoDescription,
    length,
    width,
    height,
    boardLabel,
    wallLabel,
    quantity,
    brand,
    inkColor,
    unitPrice,
    totalPrice,
    logoDataUrl,
    logoFileName,
    qtyBreaks = [],
  } = data;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 16;
  const contentW = pageW - margin * 2;

  // --- Header (B&W) ---
  pdf.setFillColor(0);
  pdf.rect(0, 0, pageW, 26, 'F');

  pdf.setTextColor(255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('unfold', margin, 12);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(200);
  pdf.text('BOX QUOTATION', margin, 19);

  pdf.setTextColor(255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(`FEFCO ${fefcoCode}`, pageW - margin, 11, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(180);
  pdf.text(new Date().toISOString().slice(0, 10), pageW - margin, 18, { align: 'right' });

  // --- Style title ---
  let y = 34;
  pdf.setTextColor(0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(fefcoLabel, margin, y);
  y += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(90);
  const desc = pdf.splitTextToSize(fefcoDescription || '', contentW);
  pdf.text(desc[0] || '', margin, y);

  // --- Style photo (from quoting system) ---
  y += 8;
  const stageH = 78;
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.4);
  pdf.setFillColor(255);
  pdf.rect(margin, y, contentW, stageH, 'FD');

  pdf.setTextColor(110);
  pdf.setFontSize(6.5);
  pdf.setFont('helvetica', 'normal');
  pdf.text('STYLE PREVIEW  -  NOT TO SCALE', margin + 4, y + 5);

  try {
    const stylePng = await loadStyleImage(fefcoCode);
    const imgSize = 68;
    const imgX = margin + (contentW - imgSize) / 2;
    const imgY = y + 7;
    pdf.addImage(stylePng, 'PNG', imgX, imgY, imgSize, imgSize, undefined, 'FAST');
  } catch (err) {
    console.error(err);
    pdf.setTextColor(120);
    pdf.setFontSize(9);
    pdf.text('Style image unavailable', pageW / 2, y + stageH / 2, { align: 'center' });
  }

  // --- Specification ---
  y = y + stageH + 10;
  pdf.setTextColor(0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('SPECIFICATION', margin, y);
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y + 1.5, margin + 30, y + 1.5);

  y += 9;
  const colW = contentW / 2;
  const rowH = 7.5;
  const specs = [
    ['FEFCO style', fefcoLabel],
    ['Internal size', `${length} x ${width} x ${height} mm`],
    ['Board', boardLabel],
    ['Wall', wallLabel],
    ['Quantity', `${quantity} units`],
    ['Print / brand', brand ? `"${brand}"` : 'None specified'],
    ['Ink colour', inkColor || '-'],
    [
      'Logo artwork',
      logoDataUrl ? `Yes - quote print (${logoFileName || 'uploaded file'})` : 'None supplied',
    ],
  ];

  specs.forEach((row, i) => {
    const col = i % 2;
    const rowIndex = Math.floor(i / 2);
    const x = margin + col * colW;
    const ry = y + rowIndex * rowH;
    if (rowIndex % 2 === 0 && col === 0) {
      pdf.setFillColor(245);
      pdf.rect(margin, ry - 4, contentW, rowH, 'F');
    }
    drawSpecRow(pdf, x, ry, row[0], row[1], colW);
  });

  y += Math.ceil(specs.length / 2) * rowH + 6;

  // --- Pricing ---
  pdf.setTextColor(0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('PRICING', margin, y);
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y + 1.5, margin + 18, y + 1.5);
  y += 7;

  // Primary estimate strip
  pdf.setFillColor(0);
  pdf.rect(margin, y, contentW, 16, 'F');
  pdf.setTextColor(180);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.text('BALLPARK ESTIMATE (EX VAT)', margin + 4, y + 5.5);
  pdf.setTextColor(255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(`${formatMoney(unitPrice)} / box`, margin + 4, y + 12.5);
  pdf.setFontSize(11);
  pdf.text(`Total ${formatTotal(totalPrice)}`, pageW - margin - 4, y + 12.5, {
    align: 'right',
  });
  y += 20;

  // Qty break table
  if (qtyBreaks.length) {
    pdf.setTextColor(0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('Price by quantity', margin, y);
    y += 5;

    const breakCol = contentW / Math.min(qtyBreaks.length, 6);
    pdf.setFillColor(245);
    pdf.rect(margin, y - 3.5, contentW, 7, 'F');
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.2);
    pdf.rect(margin, y - 3.5, contentW, 14, 'S');

    qtyBreaks.slice(0, 6).forEach((row, i) => {
      const x = margin + i * breakCol + breakCol / 2;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(90);
      pdf.text(`${row.quantity}+`, x, y, { align: 'center' });
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(0);
      pdf.text(formatMoney(row.unit), x, y + 6.5, { align: 'center' });
    });
    y += 16;
  }

  // --- Logo ---
  if (logoDataUrl) {
    pdf.setTextColor(0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('PRINT ARTWORK', margin, y);
    pdf.setDrawColor(0);
    pdf.line(margin, y + 1.5, margin + 32, y + 1.5);
    y += 5;

    pdf.setDrawColor(0);
    pdf.setLineWidth(0.3);
    const artH = 26;
    pdf.rect(margin, y, contentW, artH, 'S');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(0);
    pdf.text('Logo supplied - include in quotation / print pricing', margin + 4, y + 7);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(90);
    pdf.text(`File: ${logoFileName || 'uploaded image'}`, margin + 4, y + 13);

    try {
      const format =
        logoDataUrl.includes('image/jpeg') || logoDataUrl.includes('image/jpg') ? 'JPEG' : 'PNG';
      pdf.addImage(
        logoDataUrl,
        format,
        pageW - margin - 24,
        y + 4,
        20,
        18,
        undefined,
        'FAST'
      );
    } catch {
      /* ignore preview failure */
    }
    y += artH + 6;
  }

  // --- Notes ---
  pdf.setTextColor(0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('NOTES', margin, y);
  y += 4;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(90);
  pdf.text(
    'Prices are ballpark estimates ex VAT. Final board grade, print and pricing are confirmed before production.',
    margin,
    y
  );

  // Footer
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.3);
  pdf.line(margin, pageH - 16, pageW - margin, pageH - 16);
  pdf.setTextColor(110);
  pdf.setFontSize(6.5);
  pdf.text('unfold.supply  |  hello@unfold.supply', margin, pageH - 10);
  pdf.text(`REF-${fefcoCode}-${length}x${width}x${height}`, pageW - margin, pageH - 10, {
    align: 'right',
  });

  const slug = `unfold-fefco${fefcoCode}-${length}x${width}x${height}`.toLowerCase();
  pdf.save(`${slug}.pdf`);
}
