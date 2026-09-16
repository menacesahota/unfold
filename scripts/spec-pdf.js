import { jsPDF } from 'jspdf';
import { fefcoPreviewNote, fefcoPreviewSrc } from './fefco-preview.js';
import { ARTWORK_CHECKLIST, formatGbp } from './spec-catalog.js';
async function loadStyleImage(code) {
  const res = await fetch(fefcoPreviewSrc(code));
  if (!res.ok) throw new Error('Style image unavailable');
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result);
    reader.onerror = reject; reader.readAsDataURL(blob);
  });
}
export async function generateSpecPdf(spec, { download = true, imageData } = {}) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const margin = 18, width = 174; let y = 40;
  const clean = text => String(text).replace(/[–—−]/g, '-').replace(/[’‘]/g, "'");
  const header = title => {
    pdf.setFillColor(21,43,41); pdf.rect(0,0,210,28,'F');
    pdf.setFont('helvetica','bold'); pdf.setFontSize(17); pdf.setTextColor(255);
    pdf.text('unfold',margin,13); pdf.setFontSize(9); pdf.text(title,margin,22); y=40;
  };
  const room = h => { if(y+h>272) { pdf.addPage(); header('BOX BRIEF - CONTINUED'); } };
  const paragraph = (text, {bold=false,size=10}={}) => {
    pdf.setFont('helvetica',bold?'bold':'normal'); pdf.setFontSize(size);
    const lines=pdf.splitTextToSize(clean(text),width), h=lines.length*4.8+4;
    room(h); pdf.setFont('helvetica',bold?'bold':'normal'); pdf.setFontSize(size);
    pdf.setTextColor(35); pdf.text(lines,margin,y); y+=h;
  };
  const heading = text => { room(20); y+=3; paragraph(text,{bold:true,size:12}); };
  header('BOX BRIEF - FOR SUPPLIER REVIEW');
  paragraph(`FEFCO ${spec.style.code} - ${spec.style.title}`,{bold:true,size:15});
  paragraph('Requested requirements only. Structure, fit, board grade, print and artwork must be confirmed with the supplier before production.');
  if(spec.brandName) paragraph(`Brand: ${spec.brandName}`);
  heading('Your requirements');
  [
    `Internal dimensions: ${spec.length} x ${spec.width} x ${spec.height} mm (L x W x H)`,
    `Quantity: ${spec.quantity} boxes`,
    `Board preference: ${spec.board.label}; ${spec.wall.label}`,
    `Print preference: ${spec.ink.label}`,
    `Coating preference: ${spec.coating.label}`,
    `Delivery region: ${spec.region.label}`,
    ...(spec.style.needsOverlap?[`Overlap requested: ${spec.overlap} mm`]:[])
  ].forEach(text=>paragraph(text));
  heading('Pricing & next steps');
  paragraph('Request a reviewed quote for this specification and quantity. Confirm goods, print, tooling, setup, delivery and VAT before ordering.');
  paragraph('Minimum quantities, sample availability and production timing are confirmed by the supplier. This brief is not a priced offer or artwork approval.');
  pdf.addPage(); header('ILLUSTRATIVE STYLE & ARTWORK PREPARATION');
  paragraph(`FEFCO ${spec.style.code} - ${spec.style.title}`,{bold:true,size:14});
  try {
    const img=imageData || await loadStyleImage(spec.style.code), props=pdf.getImageProperties(img);
    const scale=Math.min(width/props.width,92/props.height), w=props.width*scale,h=props.height*scale;
    pdf.addImage(img,'PNG',margin+(width-w)/2,y,w,h); y+=h+8;
  } catch { paragraph('Style image unavailable. Refer to the selected code when discussing your brief.'); }
  paragraph(fefcoPreviewNote(spec.style.code));
  paragraph('The picture is not dimensionally scaled or a cutting die. Confirm the structure and artwork template with the supplier.');
  heading('Artwork preparation');
  ARTWORK_CHECKLIST.forEach(text=>paragraph(text,{size:9}));
  for(let page=1;page<=pdf.getNumberOfPages();page++) {
    pdf.setPage(page); pdf.setTextColor(100); pdf.setFont('helvetica','normal'); pdf.setFontSize(8);
    pdf.text('unfold.supply | hello@unfold.supply',margin,286);
    pdf.text(`${page} / ${pdf.getNumberOfPages()}`,192,286,{align:'right'});
  }
  if(download) pdf.save(`unfold-brief-${spec.style.code}-${spec.length}x${spec.width}x${spec.height}.pdf`);
  return pdf;
}
