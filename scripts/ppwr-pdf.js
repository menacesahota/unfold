/**
 * PPWR supplier-information PDF.
 * This is not an EU Declaration of Conformity and not legal advice.
 */

import { jsPDF } from 'jspdf';
import { EPR_MARKETS } from './spec-catalog.js';

function title(pdf, label, x, y) {
  pdf.setTextColor(0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(label, x, y);
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.5);
  pdf.line(x, y + 1.4, x + pdf.getTextWidth(label), y + 1.4);
}

function para(pdf, text, x, y, width) {
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(40);
  const lines = pdf.splitTextToSize(text, width);
  pdf.text(lines, x, y);
  return lines.length * 3.8;
}

/**
 * @param {object} pack
 */
export async function generatePpwrPdf(pack) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const m = 16;
  const contentW = pageW - m * 2;
  const date = new Date().toISOString().slice(0, 10);
  const ref = `PPWR-${(pack.sku || 'SKU').replace(/[^a-z0-9]+/gi, '-').slice(0, 24)}-${date}`;

  pdf.setFillColor(18, 17, 15);
  pdf.rect(0, 0, pageW, 28, 'F');
  pdf.setTextColor(255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('unfold', m, 13);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(200);
  pdf.text('PPWR SUPPLIER INFORMATION PACK', m, 21);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255);
  pdf.text('Reg. (EU) 2025/40', pageW - m, 12, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(180);
  pdf.text(date, pageW - m, 19, { align: 'right' });

  let y = 36;
  pdf.setFillColor(247, 241, 230);
  pdf.rect(m, y, contentW, 28, 'F');
  pdf.setTextColor(0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('READ THIS FIRST', m + 4, y + 6);
  y += 10;
  y += para(
    pdf,
    'This file is supplier documentation for the packaging unit described below. It is not legal advice. It is not an EU Declaration of Conformity (Article 39 / Annex VIII). The brand that places the packaged product on the EU market draws up the DoC. Unfold is not your authorised representative and does not file EPR on your behalf. Recyclability grades A/B/C are not claimed here.',
    m + 4,
    y,
    contentW - 8
  );
  y += 10;

  title(pdf, 'PARTIES', m, y);
  y += 8;
  const parties = [
    ['Brand / operator', pack.company || '—'],
    ['SKU / product', pack.sku || '—'],
    ['Packaging supplier', 'unfold (unfold.supply)'],
    ['Supplier contact', 'hello@unfold.supply'],
    ['Role of this file', 'Article 16-style information from the packaging supplier'],
    ['Food contact', pack.foodContact ? 'Yes — mill declaration still required' : 'No'],
  ];
  parties.forEach((row) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(110);
    pdf.text(row[0].toUpperCase(), m, y);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(0);
    pdf.text(String(row[1]), m + 62, y);
    y += 6;
  });
  y += 3;

  title(pdf, 'PACKAGING UNIT', m, y);
  y += 8;
  const unit = [
    `FEFCO ${pack.style.code} — ${pack.style.title}`,
    `Internal size ${pack.length} × ${pack.width} × ${pack.height} mm`,
    `${pack.board.label} board, ${pack.wall.label} (${pack.wall.flute}, ${pack.wall.caliperMm})`,
    `Print: ${pack.ink.label}. Coating: ${pack.coating.label}.`,
  ];
  unit.forEach((line) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(20);
    pdf.text(`–  ${line}`, m, y);
    y += 5.2;
  });
  y += 3;

  title(pdf, 'BILL OF MATERIALS', m, y);
  y += 8;
  y += para(pdf, pack.board.fibre, m, y, contentW);
  y += 3;
  y += para(
    pdf,
    `Wall: ${pack.wall.label}. ${pack.wall.ectNote} Typical caliper ${pack.wall.caliperMm}.`,
    m,
    y,
    contentW
  );
  y += 3;
  y += para(pdf, `Inks: ${pack.ink.note}`, m, y, contentW);
  y += 3;
  y += para(pdf, `Coatings: ${pack.coating.note}`, m, y, contentW);
  y += 8;

  title(pdf, 'SUBSTANCES', m, y);
  y += 8;
  y += para(pdf, pack.board.heavyMetals, m, y, contentW);
  y += 3;
  y += para(pdf, pack.board.pfas, m, y, contentW);
  y += 8;

  title(pdf, 'EMPTY SPACE', m, y);
  y += 8;
  const fill = Number(pack.fillPercent);
  const empty = Number.isFinite(fill) ? Math.max(0, 100 - fill) : null;
  y += para(
    pdf,
    empty === null
      ? 'Product-to-void ratio was not supplied. Measure the product volume against the internal box volume before you declare empty-space compliance.'
      : `Stated product fill ${fill}% of internal volume, implied void ${empty}%. PPWR empty-space rules are assessed on the packed item, not on this estimate. Confirm with the packed SKU.`,
    m,
    y,
    contentW
  );

  pdf.setDrawColor(0);
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
  pdf.text('RECYCLABILITY  ·  EPR  ·  WHAT YOU STILL OWE', m, 17);

  let p = 34;
  title(pdf, 'RECYCLABILITY (NO GRADE CLAIMED)', m, p);
  p += 8;
  p += para(pdf, pack.board.recyclability, m, p, contentW);
  p += 3;
  p += para(
    pdf,
    pack.coating.fibreCompatible
      ? 'Named coating is described as fibre-compatible in principle. The plant and the mill still have to confirm.'
      : 'Named coating is not a mono-material fibre pack. Expect restricted recyclability and higher EPR modulation in some states.',
    m,
    p,
    contentW
  );
  p += 3;
  p += para(
    pdf,
    pack.board.monoMaterial && pack.coating.fibreCompatible
      ? 'Structure is specified as fibre-only (no plastic window called out). Do not treat this sentence as an Annex II grade.'
      : 'This structure is not claimed as mono-material.',
    m,
    p,
    contentW
  );
  p += 10;

  title(pdf, 'EPR — YOU REGISTER, WE DO NOT FILE', m, p);
  p += 8;
  p += para(
    pdf,
    'If you place this packaging on the EU market you must register with the producer-responsibility scheme in each member state you sell into. Unfold does not act as your authorised representative. The list below is a starting map, not a filing service.',
    m,
    p,
    contentW
  );
  p += 6;

  pdf.setFillColor(245, 242, 236);
  pdf.rect(m, p - 3, contentW, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(80);
  pdf.text('STATE', m + 2, p + 2);
  pdf.text('SCHEME (INDICATIVE)', m + 28, p + 2);
  p += 8;
  EPR_MARKETS.forEach((market, i) => {
    if (i % 2 === 0) {
      pdf.setFillColor(252, 250, 246);
      pdf.rect(m, p - 3.5, contentW, 7, 'F');
    }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(0);
    pdf.text(market.code, m + 2, p);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${market.name}  ·  ${market.scheme}`, m + 28, p);
    p += 7;
  });
  p += 6;
  p += para(
    pdf,
    'Also register in every other member state where you sell. Rules differ. Check the national PRO before you ship.',
    m,
    p,
    contentW
  );
  p += 10;

  title(pdf, 'WHAT THIS FILE IS FOR', m, p);
  p += 8;
  const uses = [
    'Hand it to the person drawing up your Declaration of Conformity so they have the board, ink and coating story.',
    'Keep it with the technical file for this packaging unit (typically 5 years single-use, 10 years reusable).',
    'If unfold manufactures the box, we can match this sheet to the production spec. If another plant makes it, they must confirm every line.',
    'PPWR has applied since 12 August 2026. This pack does not make you compliant on its own.',
  ];
  uses.forEach((line) => {
    const wrapped = pdf.splitTextToSize(`–  ${line}`, contentW);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(30);
    pdf.text(wrapped, m, p);
    p += wrapped.length * 4.2 + 1.5;
  });

  pdf.setDrawColor(0);
  pdf.line(m, pageH - 16, pageW - m, pageH - 16);
  pdf.setTextColor(110);
  pdf.setFontSize(6.5);
  pdf.text('Not legal advice. Not a Declaration of Conformity.', m, pageH - 10);
  pdf.text(ref, pageW - m, pageH - 10, { align: 'right' });

  const slug = `unfold-ppwr-${(pack.sku || 'pack').replace(/[^a-z0-9]+/gi, '-')}`.toLowerCase();
  pdf.save(`${slug}.pdf`);
}
