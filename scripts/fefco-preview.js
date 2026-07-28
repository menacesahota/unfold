/**
 * FEFCO style preview images (photoreal product shots in /public/fefco/).
 */

export const FEFCO_PREVIEW_CODES = ['0201', '0203', '0426', '0427'];

export function fefcoPreviewSrc(code) {
  const safe = FEFCO_PREVIEW_CODES.includes(code) ? code : '0201';
  return `/fefco/${safe}.png`;
}

export function fefcoPreviewAlt(code, label = '') {
  return label || `FEFCO ${code} box style`;
}
