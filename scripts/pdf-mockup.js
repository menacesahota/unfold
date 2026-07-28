/**
 * Technical PDF mockup — assembled notes + accurate FEFCO blank (net).
 */

import { drawFefcoBlank } from './fefco-draw.js';

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function drawSpecRow(pdf, x, y, label, value, width) {
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(120);
  pdf.text(label.toUpperCase(), x, y);
  pdf.setTextColor(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(String(value), x + width * 0.38, y);
}

function renderBlankPng(data) {
  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 780;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f7f6f3';
  ctx.fillRect(0, 0, width, height);
  drawFefcoBlank(ctx, {
    code: data.fefcoCode,
    length: data.length,
    width: data.width,
    height: data.height,
    boardColor: data.boardColor || '#c9a87c',
    canvasW: width,
    canvasH: height,
  });
  return canvas.toDataURL('image/png');
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
    boardColor,
    wallLabel,
    quantity,
    brand,
    inkColor,
    unitPrice,
    totalPrice,
    logoDataUrl,
    logoFileName,
  } = data;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 14;

  // Header
  pdf.setFillColor(17, 17, 16);
  pdf.rect(0, 0, pageW, 28, 'F');
  pdf.setFillColor(201, 168, 124);
  pdf.rect(0, 28, pageW, 0.8, 'F');

  pdf.setTextColor(255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('unfold', margin, 13);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(180);
  pdf.text('TECHNICAL BOX MOCKUP', margin, 19);

  pdf.setTextColor(201, 168, 124);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(`FEFCO ${fefcoCode}`, pageW - margin, 12, { align: 'right' });
  pdf.setTextColor(160);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text(new Date().toISOString().slice(0, 10), pageW - margin, 18, { align: 'right' });

  // FEFCO banner
  let y = 36;
  pdf.setFillColor(244, 243, 240);
  pdf.roundedRect(margin, y, pageW - margin * 2, 16, 2, 2, 'F');
  pdf.setTextColor(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(fefcoLabel, margin + 4, y + 7);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(100);
  const descLines = pdf.splitTextToSize(fefcoDescription || '', pageW - margin * 2 - 8);
  pdf.text(descLines[0] || '', margin + 4, y + 12);

  // Blank / net stage
  y = 58;
  const stageH = 105;
  const stageW = pageW - margin * 2;
  pdf.setFillColor(247, 246, 243);
  pdf.roundedRect(margin, y, stageW, stageH, 3, 3, 'F');
  pdf.setDrawColor(220);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, y, stageW, stageH, 3, 3, 'S');

  pdf.setTextColor(110);
  pdf.setFontSize(6.5);
  pdf.setFont('helvetica', 'normal');
  pdf.text('FEFCO BLANK (NET)  ·  FLAT LAYOUT  ·  NOT TO SCALE', margin + 5, y + 7);

  const blankPng = renderBlankPng(data);
  pdf.addImage(blankPng, 'PNG', margin + 3, y + 9, stageW - 6, stageH - 12, undefined, 'FAST');

  // Corner brackets
  pdf.setDrawColor(201, 168, 124);
  pdf.setLineWidth(0.4);
  const b = 4;
  pdf.line(margin + 3, y + 3, margin + 3 + b, y + 3);
  pdf.line(margin + 3, y + 3, margin + 3, y + 3 + b);
  pdf.line(pageW - margin - 3, y + 3, pageW - margin - 3 - b, y + 3);
  pdf.line(pageW - margin - 3, y + 3, pageW - margin - 3, y + 3 + b);
  pdf.line(margin + 3, y + stageH - 3, margin + 3 + b, y + stageH - 3);
  pdf.line(margin + 3, y + stageH - 3, margin + 3, y + stageH - 3 - b);
  pdf.line(pageW - margin - 3, y + stageH - 3, pageW - margin - 3 - b, y + stageH - 3);
  pdf.line(pageW - margin - 3, y + stageH - 3, pageW - margin - 3, y + stageH - 3 - b);

  // Specs
  y = y + stageH + 10;
  pdf.setTextColor(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('SPECIFICATION', margin, y);
  pdf.setDrawColor(201, 168, 124);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y + 2, margin + 28, y + 2);

  y += 10;
  const colW = (pageW - margin * 2) / 2;
  const rowH = 8;
  const specs = [
    ['FEFCO style', fefcoLabel],
    ['Internal size', `${length} × ${width} × ${height} mm`],
    ['Board', boardLabel],
    ['Wall', wallLabel],
    ['Quantity', `${quantity} units`],
    ['Print / brand', brand ? `"${brand}"` : 'None specified'],
    ['Ink colour', inkColor || '—'],
    [
      'Logo artwork',
      logoDataUrl
        ? `YES — quote print (${logoFileName || 'uploaded file'})`
        : 'None supplied',
    ],
    ['Est. unit price', `£${unitPrice.toFixed(2)}`],
  ];

  specs.forEach((row, i) => {
    const col = i % 2;
    const rowIndex = Math.floor(i / 2);
    const x = margin + col * colW;
    const ry = y + rowIndex * rowH;
    if (rowIndex % 2 === 0 && col === 0) {
      pdf.setFillColor(248, 247, 244);
      pdf.rect(margin, ry - 4, pageW - margin * 2, rowH, 'F');
    }
    drawSpecRow(pdf, x, ry, row[0], row[1], colW);
  });

  y += Math.ceil(specs.length / 2) * rowH + 8;

  // Estimate
  pdf.setFillColor(17, 17, 16);
  pdf.roundedRect(margin, y, pageW - margin * 2, 18, 2, 2, 'F');
  pdf.setTextColor(160);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text('BALLPARK ESTIMATE', margin + 5, y + 7);
  pdf.setTextColor(201, 168, 124);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(`£${unitPrice.toFixed(2)} / box`, margin + 5, y + 14);
  pdf.setTextColor(255);
  pdf.setFontSize(12);
  pdf.text(`≈ £${Math.round(totalPrice).toLocaleString('en-GB')} total`, pageW - margin - 5, y + 12, {
    align: 'right',
  });

  y += 26;

  // Materials
  pdf.setTextColor(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('MATERIALS', margin, y);
  y += 4;

  const boardRgb = hexToRgb(boardColor || '#c9a87c');
  pdf.setFillColor(boardRgb.r, boardRgb.g, boardRgb.b);
  pdf.roundedRect(margin, y, 12, 8, 1, 1, 'F');
  pdf.setDrawColor(200);
  pdf.roundedRect(margin, y, 12, 8, 1, 1, 'S');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(80);
  pdf.text(`Board  ${boardColor || ''}`, margin + 15, y + 5);

  if (inkColor) {
    const inkRgb = hexToRgb(inkColor);
    pdf.setFillColor(inkRgb.r, inkRgb.g, inkRgb.b);
    pdf.roundedRect(margin + 55, y, 12, 8, 1, 1, 'F');
    pdf.setDrawColor(200);
    pdf.roundedRect(margin + 55, y, 12, 8, 1, 1, 'S');
    pdf.text(`Ink  ${inkColor}`, margin + 70, y + 5);
  }

  y += 16;

  // Logo artwork for quotation
  if (logoDataUrl) {
    pdf.setTextColor(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('PRINT ARTWORK — LOGO', margin, y);
    y += 4;

    pdf.setFillColor(255, 248, 230);
    pdf.setDrawColor(201, 168, 124);
    pdf.setLineWidth(0.4);
    const artH = 28;
    pdf.roundedRect(margin, y, pageW - margin * 2, artH, 2, 2, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(20);
    pdf.text('Logo supplied — include in quotation / print pricing', margin + 5, y + 7);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(90);
    pdf.text(
      `File: ${logoFileName || 'uploaded image'}  ·  Artwork preview below (not placed on box mockup)`,
      margin + 5,
      y + 12
    );

    try {
      const format = logoDataUrl.includes('image/jpeg') || logoDataUrl.includes('image/jpg')
        ? 'JPEG'
        : 'PNG';
      const thumbW = 22;
      const thumbH = 16;
      pdf.addImage(
        logoDataUrl,
        format,
        pageW - margin - thumbW - 4,
        y + 5,
        thumbW,
        thumbH,
        undefined,
        'FAST'
      );
    } catch {
      pdf.setTextColor(140);
      pdf.text('(logo preview unavailable)', pageW - margin - 40, y + 14, { align: 'right' });
    }

    y += artH + 8;
  } else {
    pdf.setTextColor(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('PRINT ARTWORK', margin, y);
    y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(120);
    pdf.text('No logo uploaded with this mockup.', margin, y);
    y += 8;
  }

  // Legend
  pdf.setTextColor(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('BLANK KEY', margin, y);
  y += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(90);
  pdf.text('Solid lines = cuts   ·   Dashed lines = scores / creases   ·   Hatched strip = manufacturer’s joint', margin, y);

  // Footer
  pdf.setDrawColor(220);
  pdf.setLineWidth(0.3);
  pdf.line(margin, pageH - 18, pageW - margin, pageH - 18);
  pdf.setTextColor(140);
  pdf.setFontSize(6.5);
  pdf.text(
    'Draft technical mockup for quotation only. Final dimensions, board grade, print and pricing are confirmed before production.',
    margin,
    pageH - 12
  );
  pdf.text('unfold.supply  ·  hello@unfold.supply', margin, pageH - 7);
  pdf.text(`REF-${fefcoCode}-${length}x${width}x${height}`, pageW - margin, pageH - 7, {
    align: 'right',
  });

  const slug = `unfold-fefco${fefcoCode}-${length}x${width}x${height}`.toLowerCase();
  pdf.save(`${slug}.pdf`);
}
