/**
 * Box Spec Engine + PPWR pack — styles, boards, and supplier data.
 * Style codes and panel geometry follow FEFCO Code, 12th edition (2022).
 * Price bands reuse the live quote formula in pricing-config.js.
 */

export const USD_PER_GBP = 1.27;

export const FEFCO_SOURCE = 'FEFCO Code, 12th edition (2022)';
export const FEFCO_SOURCE_URL =
  'https://www.fefco.org/sites/default/files/files/FEFCO%20Code_WEB%287%29.pdf';

export const SERIES = [
  {
    id: '02',
    label: '02 — Slotted boxes',
    blurb: 'One piece, manufacturer’s joint, top and bottom flaps. Ships flat.',
  },
  {
    id: '03',
    label: '03 — Telescopic boxes',
    blurb: 'Two or more pieces that fit over each other (body + lid).',
  },
  {
    id: '04',
    label: '04 — Folder boxes and trays',
    blurb: 'Usually one piece. Walls and lid fold up from the base.',
  },
  {
    id: '05',
    label: '05 — Slide boxes',
    blurb: 'Sleeves and liners that slide. Includes outer sleeves.',
  },
  {
    id: '07',
    label: '07 — Ready-glued cases',
    blurb: 'One piece, shipped folded/glued, erected by hand.',
  },
];

/**
 * Styles Unfold will actually quote. Names pair the FEFCO number with the
 * usual English name. Geometry matches the 12th-edition blanks (L × W × H
 * internal; L is the longer side at the opening).
 */
export const STYLES = [
  {
    code: '0200',
    series: '02',
    draw: '0200',
    priceKey: '0200',
    title: 'Half slotted (HSC)',
    description:
      'Open-top slotted case. Bottom flaps only, each W/2 so they meet. Lid or sleeve separate.',
    erection: 'M/A',
    pieces: 1,
    exactDieline: true,
    featured: true,
  },
  {
    code: '0201',
    series: '02',
    draw: '0201',
    priceKey: '0201',
    title: 'Regular slotted (RSC)',
    description:
      'Standard shipper. All flaps = W/2. Outer flaps meet; inner flaps leave a gap when L > W. Tape to close.',
    erection: 'M/A',
    pieces: 1,
    exactDieline: true,
    featured: true,
  },
  {
    code: '0202',
    series: '02',
    draw: '0202',
    priceKey: '0202',
    title: 'Overlap slotted (OSC)',
    description:
      'Like 0201 but outer flaps overlap by o. Flap length = (W + o) / 2. Give o as a fourth measure: L × W × H / o.',
    erection: 'M/A',
    pieces: 1,
    exactDieline: true,
    needsOverlap: true,
    featured: true,
  },
  {
    code: '0203',
    series: '02',
    draw: '0203',
    priceKey: '0203',
    title: 'Full overlap (FOL)',
    description:
      'All flaps = W. Outer flaps fully overlap for a double-thickness top and bottom.',
    erection: 'M/A',
    pieces: 1,
    exactDieline: true,
    featured: true,
  },
  {
    code: '0204',
    series: '02',
    draw: '0204',
    priceKey: '0204',
    title: 'Centre special slotted (CSSC)',
    description:
      'Outer flaps (on the L panels) = W/2. Inner flaps (on the W panels) = L/2. Both pairs meet at the centre. Not a full-overlap case.',
    erection: 'M/A',
    pieces: 1,
    exactDieline: true,
  },
  {
    code: '0205',
    series: '02',
    draw: '0205',
    priceKey: '0205',
    title: 'Centre special overlap',
    description:
      'All flaps = L/2. Outer flaps overlap on the width. Stronger top/bottom than 0201.',
    erection: 'M/A',
    pieces: 1,
    exactDieline: true,
  },
  {
    code: '0215',
    series: '02',
    draw: '0215',
    priceKey: '0215',
    title: 'Full-lid top, crash-lock bottom',
    description:
      'One outer flap covers the whole top (depth W). Inner dust flaps on the W panels. Crash-lock / auto-lock base. Manual erect.',
    erection: 'M',
    pieces: 1,
    exactDieline: true,
  },
  {
    code: '0216',
    series: '02',
    draw: '0216',
    priceKey: '0216',
    title: 'Interlocking bottom',
    description:
      'Slotted top flaps with an interlocking (auto-lock) base. Can be closed automatically. Not a roll-end tuck carton.',
    erection: 'M',
    pieces: 1,
    exactDieline: true,
  },
  {
    code: '0218',
    series: '02',
    draw: '0218',
    priceKey: '0218',
    title: 'Tuck-top with lock tabs',
    description:
      'Full lid on one L panel with side lock tabs that seat in slots on the W panels. Standard slotted bottom.',
    erection: 'M',
    pieces: 1,
    exactDieline: true,
  },
  {
    code: '0300',
    series: '03',
    draw: '0300',
    priceKey: '0300',
    title: 'Telescope (two-piece)',
    description:
      'Two trays that fit over each other. Lid is L+ × W+ × H+ to clear the board caliper. Not a wrap-around.',
    erection: 'M/A',
    pieces: 2,
    exactDieline: true,
    featured: true,
  },
  {
    code: '0409',
    series: '04',
    draw: '0409',
    priceKey: '0409',
    title: 'Wrap-around folder',
    description:
      'Four-panel wrap (W–H–W–H) along girth; end flaps close both ends. Strip length is product L.',
    erection: 'M/A',
    pieces: 1,
    exactDieline: true,
  },
  {
    code: '0421',
    series: '04',
    draw: '0421',
    priceKey: '0421',
    title: 'Tray with hinged tuck lid',
    description:
      'One-piece tray. Lid hinged on a long side with a tuck flap. Side walls fold up from the base.',
    erection: 'M/A',
    pieces: 1,
    exactDieline: true,
  },
  {
    code: '0422',
    series: '04',
    draw: '0422',
    priceKey: '0422',
    title: 'Self-locking tray',
    description:
      'Open tray, no lid. Walls fold over and lock into slots in the base. Not a reverse-tuck carton.',
    erection: 'M/A',
    pieces: 1,
    exactDieline: true,
  },
  {
    code: '0426',
    series: '04',
    draw: '0426',
    priceKey: '0426',
    title: 'Hinged-lid mailer',
    description:
      'One-piece folder: base, walls, lid with dust flaps and a front tuck. Manual fold. No double-wall lock.',
    erection: 'M',
    pieces: 1,
    exactDieline: true,
    featured: true,
  },
  {
    code: '0427',
    series: '04',
    draw: '0427',
    priceKey: '0427',
    title: 'Locking-wall mailer',
    description:
      'E-commerce mailer. Double-thickness side walls lock into the base. Lid tabs seat in the front wall.',
    erection: 'M',
    pieces: 1,
    exactDieline: true,
    featured: true,
  },
  {
    code: '0501',
    series: '05',
    draw: '0501',
    priceKey: '0501',
    title: 'Sleeve (L × W panels)',
    description:
      'Open-ended tube. Panel order L–W–L–W plus manufacturer’s joint. Strip height is H.',
    erection: 'M',
    pieces: 1,
    exactDieline: true,
  },
  {
    code: '0502',
    series: '05',
    draw: '0502',
    priceKey: '0502',
    title: 'Sleeve (L × H panels)',
    description:
      'Open-ended sleeve. Panel order L–H–L–H plus joint. Strip height is W. Opens on the W sides.',
    erection: 'M',
    pieces: 1,
    exactDieline: true,
  },
  {
    code: '0503',
    series: '05',
    draw: '0503',
    priceKey: '0503',
    title: 'Sleeve (W × H panels)',
    description:
      'Open-ended sleeve. Panel order W–H–W–H plus joint. Strip height is L. Opens on the L ends.',
    erection: 'M',
    pieces: 1,
    exactDieline: true,
  },
  {
    code: '0711',
    series: '07',
    draw: '0711',
    priceKey: '0711',
    title: 'Ready-glued crash-lock',
    description:
      'Pre-glued crash-lock base, slotted top flaps (W/2). Ships flat; pop to erect. No tape on the base.',
    erection: 'M',
    pieces: 1,
    exactDieline: true,
  },
];

export const BOARDS = {
  kraft: {
    id: 'kraft',
    label: 'Kraft',
    color: '#c9a87c',
    priceFactor: 1,
    fibre: 'Corrugated board with kraft liners and paper medium (virgin and/or recycled fibre).',
    recyclability:
      'Fibre-based corrugated. Designed for paper/card collection streams where those exist. Do not claim a PPWR recyclability grade (A/B/C) from this file.',
    monoMaterial: true,
    pfas:
      'Specified without intentionally added PFAS. Request the mill declaration for food-contact SKUs.',
    heavyMetals:
      'Specified to stay within the 100 mg/kg sum-of-four-metals limit. Confirm with the mill sheet.',
  },
  white: {
    id: 'white',
    label: 'White',
    color: '#f4f1ea',
    priceFactor: 1.1,
    fibre: 'White-lined or mottled-white corrugated board (fibre-based liners and medium).',
    recyclability:
      'Fibre-based corrugated. White liners remain paper-stream material. Coatings and windows are called out separately if used.',
    monoMaterial: true,
    pfas:
      'Specified without intentionally added PFAS. Request the mill declaration for food-contact SKUs.',
    heavyMetals:
      'Specified to stay within the 100 mg/kg sum-of-four-metals limit. Confirm with the mill sheet.',
  },
};

export const WALLS = {
  single: {
    id: 'single',
    label: 'Single wall',
    priceFactor: 1,
    flute: 'B or C flute (plant confirms)',
    caliperMm: 'about 3 mm',
    ectNote: 'Typical single-wall shipper class — plant confirms board combination.',
  },
  double: {
    id: 'double',
    label: 'Double wall',
    priceFactor: 1.4,
    flute: 'BC or EB flute (plant confirms)',
    caliperMm: 'about 6–7 mm',
    ectNote: 'Higher crush resistance — plant confirms board combination.',
  },
};

export const INKS = {
  none: {
    id: 'none',
    label: 'Unprinted',
    note: 'No process inks. Board colour only.',
    foodContactOk: true,
  },
  'water-flexo': {
    id: 'water-flexo',
    label: 'Water-based flexo',
    note: 'Water-based flexographic inks on outer liner. Typical for corrugated branding.',
    foodContactOk: true,
  },
  'uv-flexo': {
    id: 'uv-flexo',
    label: 'UV flexo',
    note: 'UV-cured inks. Flag for food-contact and recyclability review.',
    foodContactOk: false,
  },
};

export const COATINGS = {
  none: {
    id: 'none',
    label: 'None',
    note: 'No varnish or laminate.',
    fibreCompatible: true,
  },
  'water-varnish': {
    id: 'water-varnish',
    label: 'Water-based varnish',
    note: 'Water-based protective varnish on print. Usually compatible with paper recycling.',
    fibreCompatible: true,
  },
  pe: {
    id: 'pe',
    label: 'PE / poly coating',
    note: 'Polyethylene coating. Not a mono-material fibre pack. Recyclability is restricted.',
    fibreCompatible: false,
  },
};

export const REGIONS = [
  { id: 'uk', label: 'United Kingdom', quoteIn: 'GBP' },
  { id: 'eu', label: 'European Union', quoteIn: 'GBP' },
  { id: 'us', label: 'United States', quoteIn: 'USD' },
  { id: 'row', label: 'Rest of world', quoteIn: 'USD' },
];

export const ARTWORK_CHECKLIST = [
  'Artwork on a separate layer from cut, crease and glue.',
  'Bleed at least 3 mm beyond the cut. No critical type in the glue tab.',
  'Barcodes and QR codes placed by you, not generated as decoration.',
  'Keep type as live outlines or 300 ppi minimum at print size.',
  'Supply CMYK or the agreed spot. Do not assume RGB will print true.',
  'Die is not production-ready until the plant confirms flute, caliper and joint.',
];

export const EPR_MARKETS = [
  { code: 'DE', name: 'Germany', scheme: 'LUCID / dual systems' },
  { code: 'FR', name: 'France', scheme: 'Citeo' },
  { code: 'ES', name: 'Spain', scheme: 'Ecoembes' },
  { code: 'IT', name: 'Italy', scheme: 'CONAI' },
  { code: 'NL', name: 'Netherlands', scheme: 'Afvalfonds Verpakkingen' },
  { code: 'IE', name: 'Ireland', scheme: 'Repak' },
  { code: 'PL', name: 'Poland', scheme: 'National PRO' },
  { code: 'SE', name: 'Sweden', scheme: 'Näringslivets Producentansvar' },
];

export function styleByCode(code) {
  return STYLES.find((s) => s.code === code) || STYLES.find((s) => s.code === '0201') || STYLES[0];
}

export function seriesById(id) {
  return SERIES.find((s) => s.id === id) || SERIES[0];
}

export function fillStyleSelect(select, styles, selected = '0201') {
  if (!select) return;
  const list = styles || STYLES;
  select.innerHTML = SERIES.map((series) => {
    const items = list.filter((s) => s.series === series.id);
    if (!items.length) return '';
    return `<optgroup label="${series.label}">${items
      .map((s) => `<option value="${s.code}">${s.code} — ${s.title}</option>`)
      .join('')}</optgroup>`;
  }).join('');
  if (selected && [...select.options].some((o) => o.value === selected)) {
    select.value = selected;
  }
}

export function formatGbp(n) {
  return `£${Number(n).toFixed(2)}`;
}

export function formatUsd(n) {
  return `US$${Number(n).toFixed(2)}`;
}

export function toUsd(gbp) {
  return Number(gbp) * USD_PER_GBP;
}
