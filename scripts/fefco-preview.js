/**
 * FEFCO style preview photos in /public/fefco/.
 * Assembled packshots, not nets. Some codes share a family photo.
 */

const PHOTOS = {
  '0200': '0200',
  '0201': '0201',
  '0202': '0203',
  '0203': '0203',
  '0204': '0201',
  '0205': '0201',
  '0215': '0215',
  '0216': '0201',
  '0218': '0218',
  '0300': '0300',
  '0409': '0201',
  '0421': '0426',
  '0422': '0422',
  '0426': '0426',
  '0427': '0427',
  '0501': '0501',
  '0502': '0501',
  '0503': '0501',
  '0711': '0201',
};

export const FEFCO_PREVIEW_CODES = ['0200', '0201', '0203', '0215', '0218', '0300', '0422', '0426', '0427', '0501'];

export function fefcoPreviewFile(code) {
  return PHOTOS[code] || '0201';
}

export function fefcoPreviewSrc(code) {
  return `/fefco/${fefcoPreviewFile(code)}.png`;
}

export function fefcoPreviewAlt(code, label = '') {
  return label || `FEFCO ${code} box style`;
}

export function fefcoPreviewNote(code) {
  const file = fefcoPreviewFile(code);
  if (file === code) return '';
  return `Photo is the ${file} family — same erected look.`;
}
