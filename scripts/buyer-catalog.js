export const PACKS = [
  {id:'mailers', title:'Printed mailers', intro:'A branded opening for online orders, gifts and subscriptions.', style:'0427', image:'0427', options:['Kraft or white board, subject to print requirements','Print outside, or discuss inside and outside print','Internal size and inserts tailored to the packed product'], checks:'Check closure, protection and the packed product in transit.'},
  {id:'postal', title:'Postal boxes', intro:'Practical protection for the daily dispatch run.', style:'0201', image:'0201', options:['Stock-size or custom-size options to be confirmed','Plain board, printed branding or branded sealing tape','Board strength selected around product weight and handling'], checks:'Discuss carrier size limits using the finished outer dimensions.'},
  {id:'book-wraps', title:'Book wraps', intro:'Wrap-around protection for books, stationery and flat products.', options:['Discuss product thickness and variable-depth needs','Plain or printed options subject to supplier capability','Closure and edge protection matched to the contents'], checks:'Share the largest product format and packed thickness, not just the cover size.'},
  {id:'crash-lock', title:'Crash-lock cartons', intro:'A starting point for a quicker packing routine.', style:'0711', options:['Discuss a pre-glued base and suitable top closure','Size around the product and any protective insert','Confirm load rating and the final board construction'], checks:'Request a sample to check assembly, base security and loaded performance.'},
  {id:'tape', title:'Branded tape', intro:'Bring your identity to a plain shipping box.', options:['Discuss paper or film backing for your application','Logo repeat, print colours and coverage to be confirmed','Roll size, application method and case quantities'], checks:'Test adhesion on the actual carton and under your storage conditions.'},
];
export function recommendPack(data) {
  if (PACKS.some(p=>p.id===data.pack)) return PACKS.find(p=>p.id===data.pack);
  const text=(data.contents||'').toLowerCase();
  if (/book|stationery|notebook/.test(text)) return PACKS.find(p=>p.id==='book-wraps');
  if (/glass|fragile|heavy|bottle|ceramic/.test(text)) return PACKS.find(p=>p.id==='postal');
  return PACKS[0];
}
// Add only reviewed supplier-backed offers. No formula-derived prices are published.
// Each offer must state its precise scope, quantity and full GBP price breakdown.
export const VERIFIED_OFFERS = [];
export function activeOffers(pack, today=new Date().toISOString().slice(0,10)) {
  return VERIFIED_OFFERS.filter(o=>o.pack===pack && o.verified===true && o.validUntil>=today && o.scope && Number.isInteger(o.quantity) && o.quantity>0 && ['goods','setup','delivery','vat'].every(k=>Number.isFinite(o[k])&&o[k]>=0));
}
export const money = value => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(value);
export const escapeHtml = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
