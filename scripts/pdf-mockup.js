/**
 * High-detail technical PDF mockup for unfold box quotes.
 * Draws FEFCO-specific isometric previews (not a DOM screenshot),
 * so style differences always appear correctly.
 */

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function shade(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const t = amount < 0 ? 0 : 255;
  const a = Math.abs(amount);
  return {
    r: Math.round((t - r) * a + r),
    g: Math.round((t - g) * a + g),
    b: Math.round((t - b) * a + b),
  };
}

/** Project 3D box coords to isometric 2D */
function iso(x, y, z, originX, originY, scale) {
  return {
    x: originX + (x - z) * scale * 0.866,
    y: originY + (x + z) * scale * 0.5 - y * scale,
  };
}

function poly(pdf, points, fillHex, fillAmount) {
  if (points.length < 3) return;
  const fill = shade(fillHex, fillAmount);
  const stroke = shade(fillHex, -0.4);
  pdf.setFillColor(fill.r, fill.g, fill.b);
  pdf.setDrawColor(stroke.r, stroke.g, stroke.b);
  pdf.setLineWidth(0.25);
  pdf.setLineJoin('round');
  const lines = [];
  for (let i = 1; i < points.length; i += 1) {
    lines.push([points[i].x - points[i - 1].x, points[i].y - points[i - 1].y]);
  }
  pdf.lines(lines, points[0].x, points[0].y, [1, 1], 'FD', true);
}

function drawDim(pdf, x1, y1, x2, y2, label, offset = 4) {
  pdf.setDrawColor(120);
  pdf.setTextColor(90);
  pdf.setLineWidth(0.2);
  pdf.line(x1, y1, x2, y2);
  // ticks
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * 1.2;
  const ny = (dx / len) * 1.2;
  pdf.line(x1 - nx, y1 - ny, x1 + nx, y1 + ny);
  pdf.line(x2 - nx, y2 - ny, x2 + nx, y2 + ny);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text(label, (x1 + x2) / 2 + nx * offset * 0.3, (y1 + y2) / 2 + ny * offset * 0.3, {
    align: 'center',
  });
}

function drawIsometricBox(pdf, opts) {
  const {
    originX,
    originY,
    scale,
    L,
    W,
    H,
    boardHex,
    fefco,
    brand,
  } = opts;

  // Normalize dimensions for drawing (relative proportions)
  const maxDim = Math.max(L, W, H);
  const l = (L / maxDim) * 42;
  const w = (W / maxDim) * 42;
  const h = (H / maxDim) * 32;

  const p = (x, y, z) => iso(x, y, z, originX, originY, scale);

  // Faces: bottom, left, right, top — order matters for occlusion
  // Bottom
  poly(pdf, [p(0, 0, 0), p(l, 0, 0), p(l, 0, w), p(0, 0, w)], boardHex, -0.28);
  // Left (width face)
  poly(pdf, [p(0, 0, 0), p(0, 0, w), p(0, h, w), p(0, h, 0)], boardHex, -0.12);
  // Right / front-ish (length face)
  poly(pdf, [p(0, 0, 0), p(l, 0, 0), p(l, h, 0), p(0, h, 0)], boardHex, 0.02);

  // Style-specific tops / lids
  if (fefco === '0200') {
    // Open top — dark inner rim
    poly(pdf, [p(0, h, 0), p(l, h, 0), p(l, h, w), p(0, h, w)], boardHex, -0.45);
    setDraw(pdf, boardHex, -0.55);
    pdf.setLineWidth(0.6);
    const rim = [p(1.5, h, 1.5), p(l - 1.5, h, 1.5), p(l - 1.5, h, w - 1.5), p(0 + 1.5, h, w - 1.5)];
    pdf.setDrawColor(60);
    pdf.line(rim[0].x, rim[0].y, rim[1].x, rim[1].y);
    pdf.line(rim[1].x, rim[1].y, rim[2].x, rim[2].y);
    pdf.line(rim[2].x, rim[2].y, rim[3].x, rim[3].y);
    pdf.line(rim[3].x, rim[3].y, rim[0].x, rim[0].y);
  } else if (fefco === '0427') {
    // Closed body top edge
    poly(pdf, [p(0, h, 0), p(l, h, 0), p(l, h, w), p(0, h, w)], boardHex, 0.05);
    // Open hinged lid behind
    const lidLift = h * 0.55;
    poly(
      pdf,
      [p(0, h, w), p(l, h, w), p(l, h + lidLift, w + w * 0.35), p(0, h + lidLift, w + w * 0.35)],
      boardHex,
      0.08
    );
    // Tuck flap
    poly(
      pdf,
      [
        p(l * 0.2, h + lidLift, w + w * 0.35),
        p(l * 0.8, h + lidLift, w + w * 0.35),
        p(l * 0.8, h + lidLift * 0.7, w + w * 0.5),
        p(l * 0.2, h + lidLift * 0.7, w + w * 0.5),
      ],
      boardHex,
      -0.15
    );
  } else if (fefco === '0409') {
    // Flat folder — lower profile wrap
    const fh = h * 0.45;
    poly(pdf, [p(0, 0, 0), p(l, 0, 0), p(l, 0, w), p(0, 0, w)], boardHex, -0.28);
    poly(pdf, [p(0, 0, 0), p(0, 0, w), p(0, fh, w), p(0, fh, 0)], boardHex, -0.12);
    poly(pdf, [p(0, 0, 0), p(l, 0, 0), p(l, fh, 0), p(0, fh, 0)], boardHex, 0.02);
    poly(pdf, [p(0, fh, 0), p(l, fh, 0), p(l, fh, w), p(0, fh, w)], boardHex, 0.06);
    // Panel score lines on top
    setDraw(pdf, boardHex, -0.5);
    pdf.setLineWidth(0.3);
    const a = p(l * 0.33, fh, 0);
    const b = p(l * 0.33, fh, w);
    const c = p(l * 0.66, fh, 0);
    const d = p(l * 0.66, fh, w);
    pdf.setDrawColor(90);
    pdf.line(a.x, a.y, b.x, b.y);
    pdf.line(c.x, c.y, d.x, d.y);
  } else {
    // 0201 / 0203 / 0215 closed top
    poly(pdf, [p(0, h, 0), p(l, h, 0), p(l, h, w), p(0, h, w)], boardHex, 0.08);

    if (fefco === '0201' || fefco === '0215') {
      // Centre flap join
      const mid1 = p(l / 2, h, 0);
      const mid2 = p(l / 2, h, w);
      pdf.setDrawColor(80);
      pdf.setLineWidth(0.35);
      pdf.line(mid1.x, mid1.y, mid2.x, mid2.y);
    }

    if (fefco === '0203') {
      // Full overlap — dashed inner rectangle
      pdf.setDrawColor(100);
      pdf.setLineWidth(0.25);
      pdf.setLineDashPattern([1.2, 1], 0);
      const i1 = p(l * 0.12, h, w * 0.12);
      const i2 = p(l * 0.88, h, w * 0.12);
      const i3 = p(l * 0.88, h, w * 0.88);
      const i4 = p(l * 0.12, h, w * 0.88);
      pdf.line(i1.x, i1.y, i2.x, i2.y);
      pdf.line(i2.x, i2.y, i3.x, i3.y);
      pdf.line(i3.x, i3.y, i4.x, i4.y);
      pdf.line(i4.x, i4.y, i1.x, i1.y);
      pdf.setLineDashPattern([], 0);
    }

    if (fefco === '0215') {
      poly(
        pdf,
        [
          p(l * 0.5, 0.2, w * 0.25),
          p(l * 0.72, 0.2, w * 0.5),
          p(l * 0.5, 0.2, w * 0.75),
          p(l * 0.28, 0.2, w * 0.5),
        ],
        boardHex,
        -0.2
      );
    }
  }

  // Brand on front face
  if (brand) {
    const cx = (p(l * 0.5, h * 0.55, 0).x + p(l * 0.5, h * 0.55, 0).x) / 2;
    const cy = p(l * 0.5, h * 0.52, 0).y;
    pdf.setTextColor(30);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text(brand.toUpperCase().slice(0, 18), cx, cy, { align: 'center' });
  }

  // Dimensions
  const frontBL = p(0, 0, 0);
  const frontBR = p(l, 0, 0);
  const frontTL = p(0, h, 0);
  const sideBR = p(0, 0, w);
  drawDim(pdf, frontBL.x, frontBL.y + 6, frontBR.x, frontBR.y + 6, `L ${L} mm`, 5);
  drawDim(pdf, frontBR.x + 4, frontBR.y, sideBR.x + 4, sideBR.y, `W ${W} mm`, 5);
  drawDim(pdf, frontBL.x - 5, frontBL.y, frontTL.x - 5, frontTL.y, `H ${H} mm`, 4);
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
  } = data;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 14;

  // --- Dark tech header ---
  pdf.setFillColor(17, 17, 16);
  pdf.rect(0, 0, pageW, 28, 'F');
  pdf.setFillColor(201, 168, 124); // kraft accent
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

  // --- FEFCO banner ---
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

  // --- Preview stage ---
  y = 58;
  const stageH = 92;
  const stageW = pageW - margin * 2;
  pdf.setFillColor(17, 17, 16);
  pdf.roundedRect(margin, y, stageW, stageH, 3, 3, 'F');

  // Grid dots for tech feel
  pdf.setFillColor(40, 40, 38);
  for (let gx = margin + 6; gx < pageW - margin - 4; gx += 4.5) {
    for (let gy = y + 6; gy < y + stageH - 4; gy += 4.5) {
      pdf.circle(gx, gy, 0.25, 'F');
    }
  }

  pdf.setTextColor(100);
  pdf.setFontSize(6.5);
  pdf.setFont('helvetica', 'normal');
  pdf.text('ISOMETRIC PREVIEW  ·  NOT TO SCALE', margin + 5, y + 7);

  drawIsometricBox(pdf, {
    originX: margin + stageW * 0.42,
    originY: y + stageH * 0.72,
    scale: 1.15,
    L: length,
    W: width,
    H: height,
    boardHex: boardColor || '#c9a87c',
    fefco: fefcoCode,
    brand: brand || '',
  });

  // Corner brackets
  pdf.setDrawColor(201, 168, 124);
  pdf.setLineWidth(0.4);
  const b = 4;
  // TL
  pdf.line(margin + 3, y + 3, margin + 3 + b, y + 3);
  pdf.line(margin + 3, y + 3, margin + 3, y + 3 + b);
  // TR
  pdf.line(pageW - margin - 3, y + 3, pageW - margin - 3 - b, y + 3);
  pdf.line(pageW - margin - 3, y + 3, pageW - margin - 3, y + 3 + b);
  // BL
  pdf.line(margin + 3, y + stageH - 3, margin + 3 + b, y + stageH - 3);
  pdf.line(margin + 3, y + stageH - 3, margin + 3, y + stageH - 3 - b);
  // BR
  pdf.line(pageW - margin - 3, y + stageH - 3, pageW - margin - 3 - b, y + stageH - 3);
  pdf.line(pageW - margin - 3, y + stageH - 3, pageW - margin - 3, y + stageH - 3 - b);

  // --- Spec grid ---
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

  // --- Estimate strip ---
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

  // --- Colour chips ---
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

  // --- Footer ---
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
