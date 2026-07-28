/**
 * Static isometric FEFCO illustrations for the designer preview.
 * One fixed drawing per style (same pattern as Kite style cards).
 */

function shade(hex, amount) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const t = amount < 0 ? 0 : 255;
  const a = Math.abs(amount);
  r = Math.round((t - r) * a + r);
  g = Math.round((t - g) * a + g);
  b = Math.round((t - b) * a + b);
  return `rgb(${r},${g},${b})`;
}

function wrap(board, body) {
  return `<svg viewBox="0 0 320 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="gFront" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${board}"/>
      <stop offset="100%" stop-color="${shade(board, -0.12)}"/>
    </linearGradient>
    <linearGradient id="gSide" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${shade(board, -0.18)}"/>
      <stop offset="100%" stop-color="${shade(board, -0.28)}"/>
    </linearGradient>
    <linearGradient id="gTop" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="${shade(board, 0.06)}"/>
      <stop offset="100%" stop-color="${shade(board, -0.08)}"/>
    </linearGradient>
  </defs>
  <ellipse cx="160" cy="232" rx="78" ry="10" fill="rgba(0,0,0,0.08)"/>
  ${body}
</svg>`;
}

const BODIES = {
  // Regular slotted — centre flap join on top
  '0201': (board) => `
  <path fill="url(#gFront)" stroke="#5a4632" stroke-width="1.2" stroke-linejoin="round"
    d="M70 110 L160 155 L160 220 L70 175 Z"/>
  <path fill="url(#gSide)" stroke="#5a4632" stroke-width="1.2" stroke-linejoin="round"
    d="M160 155 L250 110 L250 175 L160 220 Z"/>
  <path fill="url(#gTop)" stroke="#5a4632" stroke-width="1.2" stroke-linejoin="round"
    d="M70 110 L160 65 L250 110 L160 155 Z"/>
  <path fill="none" stroke="#5a4632" stroke-width="1.5" d="M115 88 L205 132"/>
  <path fill="none" stroke="rgba(90,70,50,0.35)" stroke-width="1" stroke-dasharray="3 3"
    d="M92 100 L160 134 M160 134 L228 100"/>`,

  // Full overlap — continuous top, no centre seam
  '0203': (board) => `
  <path fill="url(#gFront)" stroke="#5a4632" stroke-width="1.2" stroke-linejoin="round"
    d="M70 110 L160 155 L160 220 L70 175 Z"/>
  <path fill="url(#gSide)" stroke="#5a4632" stroke-width="1.2" stroke-linejoin="round"
    d="M160 155 L250 110 L250 175 L160 220 Z"/>
  <path fill="url(#gTop)" stroke="#5a4632" stroke-width="1.2" stroke-linejoin="round"
    d="M70 110 L160 65 L250 110 L160 155 Z"/>
  <path fill="none" stroke="${shade(board, -0.45)}" stroke-width="1.2" stroke-dasharray="4 3"
    d="M95 100 L225 100" transform="matrix(0.86 0.28 -0.28 0.5 55 55)"/>
  <path fill="none" stroke="#5a4632" stroke-width="1" opacity="0.45"
    d="M98 104 L152 131"/>`,

  // Self-locking mailer — lid ajar
  '0426': (board) => `
  <path fill="url(#gFront)" stroke="#5a4632" stroke-width="1.2" stroke-linejoin="round"
    d="M78 130 L168 175 L168 225 L78 180 Z"/>
  <path fill="url(#gSide)" stroke="#5a4632" stroke-width="1.2" stroke-linejoin="round"
    d="M168 175 L248 135 L248 185 L168 225 Z"/>
  <path fill="url(#gTop)" stroke="#5a4632" stroke-width="1.2" stroke-linejoin="round"
    d="M78 130 L168 85 L248 135 L168 175 Z"/>
  <path fill="url(#gTop)" stroke="#5a4632" stroke-width="1.2" stroke-linejoin="round"
    d="M78 130 L168 85 L152 38 L62 83 Z"/>
  <path fill="${shade(board, -0.22)}" stroke="#5a4632" stroke-width="1" stroke-linejoin="round"
    d="M62 83 L152 38 L145 26 L55 71 Z"/>
  <path fill="none" stroke="#5a4632" stroke-width="1.3" d="M108 158 L138 173"/>
  <path fill="none" stroke="#5a4632" stroke-width="1.2" d="M118 162 L132 169"/>`,

  // Hinged-lid tray — open with tuck tabs
  '0427': (board) => `
  <path fill="url(#gFront)" stroke="#5a4632" stroke-width="1.2" stroke-linejoin="round"
    d="M75 135 L170 182 L170 228 L75 181 Z"/>
  <path fill="url(#gSide)" stroke="#5a4632" stroke-width="1.2" stroke-linejoin="round"
    d="M170 182 L255 138 L255 184 L170 228 Z"/>
  <path fill="url(#gTop)" stroke="#5a4632" stroke-width="1.2" stroke-linejoin="round"
    d="M75 135 L170 88 L255 138 L170 182 Z"/>
  <path fill="${shade(board, -0.32)}" stroke="#5a4632" stroke-width="1" opacity="0.9"
    d="M98 148 L170 112 L228 148 L156 184 Z"/>
  <path fill="url(#gTop)" stroke="#5a4632" stroke-width="1.2" stroke-linejoin="round"
    d="M170 88 L255 138 L272 92 L187 42 Z"/>
  <path fill="${shade(board, -0.15)}" stroke="#5a4632" stroke-width="1" stroke-linejoin="round"
    d="M272 92 L288 84 L280 72 L264 80 Z"/>
  <path fill="${shade(board, -0.15)}" stroke="#5a4632" stroke-width="1" stroke-linejoin="round"
    d="M198 52 L214 44 L206 32 L190 40 Z"/>
  <path fill="none" stroke="#5a4632" stroke-width="1.4"
    d="M102 162 L118 170 M138 172 L154 180"/>`,
};

export const FEFCO_PREVIEW_CODES = ['0201', '0203', '0426', '0427'];

export function renderFefcoPreviewSvg(code, boardColor = '#c9a87c') {
  const draw = BODIES[code] || BODIES['0201'];
  return wrap(boardColor, draw(boardColor));
}
