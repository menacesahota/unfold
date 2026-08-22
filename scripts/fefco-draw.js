/**
 * FEFCO-style technical drawings for the spec engine.
 *
 * Geometry from the published code (12th ed.): L × W × H internal,
 * manufacturer’s joint on the left, flap formulae per style.
 * Drawing language from the same code’s symbol list: solid = cut,
 * dashed = crease. Original line work — not a facsimile of FEFCO artwork.
 */

export function shadeHex(hex, amount) {
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

const CUT = '#161616';
const CREASE = '#c1121f';
const INK = '#2c2c2c';
const MUTED = '#777';

function glueWidth(L, W) {
  return Math.max(W * 0.08, L * 0.03, 18);
}

function cutPath(ctx, pts, closed = true) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.strokeStyle = CUT;
  ctx.lineWidth = 1.35;
  ctx.lineJoin = 'miter';
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
  if (closed) ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function crease(ctx, x1, y1, x2, y2) {
  ctx.save();
  ctx.strokeStyle = CREASE;
  ctx.lineWidth = 1.05;
  ctx.setLineDash([4.5, 3.2]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function label(ctx, text, x, y, size = 11) {
  ctx.fillStyle = INK;
  ctx.font = `600 ${size}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function caption(ctx, text, x, y) {
  ctx.fillStyle = MUTED;
  ctx.font = '500 10px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function legend(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = CUT;
  ctx.lineWidth = 1.3;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 18, y);
  ctx.stroke();
  ctx.fillStyle = MUTED;
  ctx.font = '500 9px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('cut', x + 22, y);
  ctx.strokeStyle = CREASE;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(x + 48, y);
  ctx.lineTo(x + 66, y);
  ctx.stroke();
  ctx.fillText('crease', x + 70, y);
  ctx.restore();
}

function slot(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = CUT;
  ctx.lineWidth = 1.1;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function xsFrom(ox, widths) {
  const xs = [ox];
  widths.forEach((w, i) => xs.push(xs[i] + w));
  return xs;
}

function fit(totalW, totalH, areaW, areaH, fill = 0.88) {
  const scale = Math.min(areaW / Math.max(totalW, 1), areaH / Math.max(totalH, 1)) * fill;
  return {
    scale,
    ox: (areaW - totalW * scale) / 2,
    oy: (areaH - totalH * scale) / 2,
  };
}

/**
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawFefcoBlank(ctx, {
  code,
  length: L,
  width: W,
  height: H,
  overlap = 40,
  canvasW,
  canvasH,
}) {
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  const pad = 28;
  const capH = 22;
  const net = {
    x: pad,
    y: pad,
    w: canvasW - pad * 2,
    h: canvasH - pad - capH,
  };
  const o = Math.max(5, Number(overlap) || 40);
  const g = { L, W, H, o, net };

  const map = {
    '0200': () => slotted(ctx, g, {
      top: [0, 0, 0, 0],
      bot: [W / 2, W / 2, W / 2, W / 2],
      cap: 'FEFCO 0200  ·  HSC  ·  bottom flaps = W/2  ·  not to scale',
    }),
    '0201': () => slotted(ctx, g, {
      top: [W / 2, W / 2, W / 2, W / 2],
      bot: [W / 2, W / 2, W / 2, W / 2],
      cap: 'FEFCO 0201  ·  RSC  ·  all flaps = W/2  ·  not to scale',
    }),
    '0202': () => {
      const f = (W + o) / 2;
      slotted(ctx, g, {
        top: [f, f, f, f],
        bot: [f, f, f, f],
        cap: `FEFCO 0202  ·  OSC  ·  flaps = (W+o)/2  ·  o=${Math.round(o)} mm  ·  not to scale`,
      });
    },
    '0203': () => slotted(ctx, g, {
      top: [W, W, W, W],
      bot: [W, W, W, W],
      cap: 'FEFCO 0203  ·  FOL  ·  all flaps = W  ·  not to scale',
    }),
    '0204': () => slotted(ctx, g, {
      // Outer (L panels) = W/2; inner (W panels) = L/2 — both meet.
      top: [W / 2, L / 2, W / 2, L / 2],
      bot: [W / 2, L / 2, W / 2, L / 2],
      cap: 'FEFCO 0204  ·  CSSC  ·  L flaps = W/2, W flaps = L/2  ·  not to scale',
    }),
    '0205': () => slotted(ctx, g, {
      top: [L / 2, L / 2, L / 2, L / 2],
      bot: [L / 2, L / 2, L / 2, L / 2],
      cap: 'FEFCO 0205  ·  all flaps = L/2  ·  not to scale',
    }),
    '0215': () => slotted(ctx, g, {
      top: [W, W * 0.4, 0, W * 0.4],
      bot: [W / 2, W / 2, W / 2, W / 2],
      botStyle: 'crash',
      cap: 'FEFCO 0215  ·  full lid + crash-lock bottom  ·  not to scale',
    }),
    '0216': () => slotted(ctx, g, {
      top: [W / 2, W / 2, W / 2, W / 2],
      bot: [W / 2, W / 2, W / 2, W / 2],
      botStyle: 'crash',
      cap: 'FEFCO 0216  ·  interlocking bottom  ·  not to scale',
    }),
    '0218': () => slotted(ctx, g, {
      top: [W, 0, 0, 0],
      bot: [W / 2, W / 2, W / 2, W / 2],
      topStyle: 'tuck',
      cap: 'FEFCO 0218  ·  tuck-top with lock tabs  ·  not to scale',
    }),
    '0300': () => draw0300(ctx, g),
    '0409': () => draw0409(ctx, g),
    '0421': () => draw0421(ctx, g),
    '0422': () => draw0422(ctx, g),
    '0426': () => draw0426(ctx, g),
    '0427': () => draw0427(ctx, g),
    '0501': () => drawSleeve(ctx, g, [L, W, L, W], ['L', 'W', 'L', 'W'], H, 'FEFCO 0501  ·  sleeve L–W–L–W  ·  strip = H  ·  not to scale'),
    '0502': () => drawSleeve(ctx, g, [L, H, L, H], ['L', 'H', 'L', 'H'], W, 'FEFCO 0502  ·  sleeve L–H–L–H  ·  strip = W  ·  not to scale'),
    '0503': () => drawSleeve(ctx, g, [W, H, W, H], ['W', 'H', 'W', 'H'], L, 'FEFCO 0503  ·  sleeve W–H–W–H  ·  strip = L  ·  not to scale'),
    '0711': () => slotted(ctx, g, {
      top: [W / 2, W / 2, W / 2, W / 2],
      bot: [W / 2, W / 2, W / 2, W / 2],
      botStyle: 'crash',
      cap: 'FEFCO 0711  ·  ready-glued crash-lock  ·  not to scale',
    }),
  };

  (map[code] || map['0201'])();
  legend(ctx, pad, canvasH - 10);
}

function flapText(d, L, W) {
  if (Math.abs(d - W / 2) < 0.8) return '½ W';
  if (Math.abs(d - W) < 0.8) return 'W';
  if (Math.abs(d - L / 2) < 0.8) return '½ L';
  if (Math.abs(d - L) < 0.8) return 'L';
  return '';
}

function crashPts(i, x0, x1, y, h) {
  const pw = x1 - x0;
  const mid = (x0 + x1) / 2;
  if (i === 0 || i === 2) {
    const tw = pw * 0.22;
    return [
      [x1, y],
      [x1, y + h * 0.7],
      [mid + tw, y + h * 0.7],
      [mid + tw * 0.6, y + h],
      [mid - tw * 0.6, y + h],
      [mid - tw, y + h * 0.7],
      [x0, y + h * 0.7],
      [x0, y],
    ];
  }
  if (i === 1) {
    return [
      [x1, y],
      [x1, y + h * 0.28],
      [x0 + pw * 0.18, y + h],
      [x0, y + h * 0.52],
      [x0, y],
    ];
  }
  return [
    [x1, y],
    [x1, y + h * 0.52],
    [x1 - pw * 0.18, y + h],
    [x0, y + h * 0.28],
    [x0, y],
  ];
}

function slotted(ctx, g, { top, bot, botStyle = 'rect', topStyle = 'flaps', cap }) {
  const { L, W, H, net } = g;
  const glue = glueWidth(L, W);
  const seq = [glue, L, W, L, W];
  const topMax = Math.max(0, ...top);
  const botMax = Math.max(0, ...bot);
  const { scale, ox, oy } = fit(
    seq.reduce((a, b) => a + b, 0),
    topMax + H + botMax,
    net.w,
    net.h
  );
  const s = (v) => v * scale;
  const widths = seq.map(s);
  const xs = xsFrom(net.x + ox, widths);
  const bodyTop = net.y + oy + s(topMax);
  const bodyBot = bodyTop + s(H);
  const topPx = top.map(s);
  const botPx = bot.map(s);

  const outline = [];
  outline.push([xs[0], bodyBot]);
  outline.push([xs[0], bodyTop]);
  outline.push([xs[1], bodyTop]);

  if (topStyle === 'tuck') {
    const x0 = xs[1];
    const x1 = xs[2];
    const h = topPx[0];
    const ear = Math.min((x1 - x0) * 0.1, s(16));
    const tuck = h * 0.2;
    outline.push([x0 - ear, bodyTop - h * 0.55]);
    outline.push([x0 + (x1 - x0) * 0.12, bodyTop - h + tuck]);
    outline.push([x0 + (x1 - x0) * 0.16, bodyTop - h]);
    outline.push([x1 - (x1 - x0) * 0.16, bodyTop - h]);
    outline.push([x1 - (x1 - x0) * 0.12, bodyTop - h + tuck]);
    outline.push([x1 + ear, bodyTop - h * 0.55]);
    outline.push([x1, bodyTop]);
    outline.push([xs[5], bodyTop]);
  } else {
    for (let i = 0; i < 4; i += 1) {
      const x0 = xs[i + 1];
      const x1 = xs[i + 2];
      const h = topPx[i];
      if (h > 0.6) {
        outline.push([x0, bodyTop - h]);
        outline.push([x1, bodyTop - h]);
        outline.push([x1, bodyTop]);
      } else {
        outline.push([x1, bodyTop]);
      }
    }
  }

  outline.push([xs[5], bodyBot]);

  for (let i = 3; i >= 0; i -= 1) {
    const x0 = xs[i + 1];
    const x1 = xs[i + 2];
    if (botStyle === 'crash') {
      outline.push(...crashPts(i, x0, x1, bodyBot, botPx[i] || s(W / 2)));
    } else {
      const h = botPx[i];
      if (h > 0.6) {
        outline.push([x1, bodyBot + h]);
        outline.push([x0, bodyBot + h]);
        outline.push([x0, bodyBot]);
      } else {
        outline.push([x0, bodyBot]);
      }
    }
  }

  cutPath(ctx, outline, true);

  crease(ctx, xs[1], bodyTop, xs[1], bodyBot);
  crease(ctx, xs[2], bodyTop, xs[2], bodyBot);
  crease(ctx, xs[3], bodyTop, xs[3], bodyBot);
  crease(ctx, xs[4], bodyTop, xs[4], bodyBot);
  if (topMax > 0) crease(ctx, xs[1], bodyTop, xs[5], bodyTop);
  crease(ctx, xs[1], bodyBot, xs[5], bodyBot);

  if (topStyle === 'tuck') {
    const slotW = Math.min(s(20), widths[2] * 0.32);
    slot(ctx, (xs[2] + xs[3]) / 2 - slotW / 2, bodyTop - 1.6, slotW, 3.2);
    slot(ctx, (xs[4] + xs[5]) / 2 - slotW / 2, bodyTop - 1.6, slotW, 3.2);
  }

  const midY = (bodyTop + bodyBot) / 2;
  label(ctx, 'L', (xs[1] + xs[2]) / 2, midY);
  label(ctx, 'W', (xs[2] + xs[3]) / 2, midY);
  label(ctx, 'L', (xs[3] + xs[4]) / 2, midY);
  label(ctx, 'W', (xs[4] + xs[5]) / 2, midY);
  label(ctx, 'H', xs[0] + widths[0] / 2, midY, 9);

  const tLabel = flapText(top[0] || top[1], L, W);
  if (tLabel && topMax > 0 && topStyle === 'flaps') {
    const i = top[0] >= (top[1] || 0) ? 0 : 1;
    if (top[i]) label(ctx, tLabel, (xs[i + 1] + xs[i + 2]) / 2, bodyTop - topPx[i] / 2, 10);
  }
  const bLabel = botStyle === 'crash' ? '' : flapText(bot[0], L, W);
  if (bLabel) label(ctx, bLabel, (xs[1] + xs[2]) / 2, bodyBot + botPx[0] / 2, 10);
  caption(ctx, cap, net.x + 118, net.y + net.h + 16);
}

function draw0300(ctx, g) {
  const { L, W, H, net } = g;
  const grow = Math.max(8, Math.min(L, W) * 0.04);
  const pieces = [
    { l: L, w: W, h: H, title: 'BODY' },
    { l: L + grow, w: W + grow, h: H, title: 'LID  L+ W+ H' },
  ];
  const pieceW = (p) => p.l + 2 * p.h + 2 * p.h;
  const pieceH = (p) => p.w + 2 * p.h;
  const gap = Math.max(L, W) * 0.12;
  const totalW = pieceW(pieces[0]) + gap + pieceW(pieces[1]);
  const totalH = Math.max(pieceH(pieces[0]), pieceH(pieces[1]));
  const { scale, ox, oy } = fit(totalW, totalH, net.w, net.h, 0.86);
  const s = (v) => v * scale;

  const drawTray = (x, y, p) => {
    const tab = s(p.h);
    const bx = x + tab + s(p.h);
    const by = y + s(p.h);
    const outline = [
      [bx, by],
      [bx, by - s(p.h)],
      [bx + s(p.l), by - s(p.h)],
      [bx + s(p.l), by],
      [bx + s(p.l) + s(p.h), by],
      [bx + s(p.l) + s(p.h) + tab, by],
      [bx + s(p.l) + s(p.h) + tab, by + s(p.w)],
      [bx + s(p.l) + s(p.h), by + s(p.w)],
      [bx + s(p.l), by + s(p.w)],
      [bx + s(p.l), by + s(p.w) + s(p.h)],
      [bx, by + s(p.w) + s(p.h)],
      [bx, by + s(p.w)],
      [bx - s(p.h), by + s(p.w)],
      [bx - s(p.h) - tab, by + s(p.w)],
      [bx - s(p.h) - tab, by],
      [bx - s(p.h), by],
    ];
    cutPath(ctx, outline, true);
    crease(ctx, bx, by, bx + s(p.l), by);
    crease(ctx, bx, by + s(p.w), bx + s(p.l), by + s(p.w));
    crease(ctx, bx, by, bx, by + s(p.w));
    crease(ctx, bx + s(p.l), by, bx + s(p.l), by + s(p.w));
    crease(ctx, bx - s(p.h), by, bx - s(p.h), by + s(p.w));
    crease(ctx, bx + s(p.l) + s(p.h), by, bx + s(p.l) + s(p.h), by + s(p.w));
    label(ctx, p.title, bx + s(p.l) / 2, by + s(p.w) / 2, 10);
    label(ctx, 'L', bx + s(p.l) / 2, by - s(p.h) / 2, 10);
    label(ctx, 'W', bx - s(p.h) / 2, by + s(p.w) / 2, 10);
  };

  const x0 = net.x + ox;
  const y0 = net.y + oy;
  drawTray(x0, y0, pieces[0]);
  drawTray(x0 + s(pieceW(pieces[0]) + gap), y0, pieces[1]);

  caption(ctx, 'FEFCO 0300  ·  telescopic two-piece  ·  lid = L+ × W+ × H  ·  not to scale', net.x + 118, net.y + net.h + 16);
}

function draw0409(ctx, g) {
  const { L, W, H, net } = g;
  const panels = [W, H, W, H];
  const names = ['W', 'H', 'W', 'H'];
  const flap = Math.min(W * 0.5, H * 0.75);
  const { scale, ox, oy } = fit(panels.reduce((a, b) => a + b, 0), flap + L + flap, net.w, net.h);
  const s = (v) => v * scale;
  const xs = xsFrom(net.x + ox, panels.map(s));
  const y1 = net.y + oy + s(flap);
  const y2 = y1 + s(L);
  const inset = (pw) => Math.min(pw * 0.1, s(8));
  const outline = [];
  outline.push([xs[0], y1]);
  for (let i = 0; i < 4; i += 1) {
    const pw = xs[i + 1] - xs[i];
    const inn = inset(pw);
    outline.push([xs[i] + inn, y1 - s(flap)]);
    outline.push([xs[i + 1] - inn, y1 - s(flap)]);
    outline.push([xs[i + 1], y1]);
  }
  outline.push([xs[4], y2]);
  for (let i = 3; i >= 0; i -= 1) {
    const pw = xs[i + 1] - xs[i];
    const inn = inset(pw);
    outline.push([xs[i + 1] - inn, y2 + s(flap)]);
    outline.push([xs[i] + inn, y2 + s(flap)]);
    outline.push([xs[i], y2]);
  }
  cutPath(ctx, outline, true);
  for (let i = 1; i < 4; i += 1) crease(ctx, xs[i], y1, xs[i], y2);
  crease(ctx, xs[0], y1, xs[4], y1);
  crease(ctx, xs[0], y2, xs[4], y2);
  names.forEach((n, i) => label(ctx, n, (xs[i] + xs[i + 1]) / 2, y1 + s(L) / 2));
  caption(ctx, 'FEFCO 0409  ·  wrap-around  ·  W–H–W–H  ·  strip = L  ·  not to scale', net.x + 118, net.y + net.h + 16);
}

function mailerNet(ctx, g, { doubleWall, dust, cap }) {
  const { L, W, H, net } = g;
  const tuck = Math.max(H * 0.28, 14);
  const side = doubleWall ? H * 2 : H;
  const dustW = dust ? Math.min(H * 0.8, W * 0.42) : 0;
  const totalW = Math.max(side * 2 + L, dustW * 2 + L);
  const totalH = tuck + W + H + W + H;
  const { scale, ox, oy } = fit(totalW, totalH, net.w, net.h, 0.86);
  const s = (v) => v * scale;
  const xB = net.x + ox + (s(totalW) - s(L)) / 2;
  const xR = xB + s(L);
  const xL = xB - s(side);
  const xEnd = xR + s(side);
  const yTuck = net.y + oy;
  const yLid = yTuck + s(tuck);
  const yBack = yLid + s(W);
  const yBase = yBack + s(H);
  const yFront = yBase + s(W);
  const yEnd = yFront + s(H);
  const d = s(dustW);

  const outline = [
    [xB + s(L) * 0.2, yTuck],
    [xR - s(L) * 0.2, yTuck],
    [xR - s(L) * 0.08, yLid],
  ];
  if (dust) {
    outline.push([xR + d, yLid + s(W) * 0.12]);
    outline.push([xR + d, yLid + s(W) * 0.88]);
    outline.push([xR, yBack]);
  } else if (doubleWall) {
    outline.push([xR + s(H), yLid + s(W) * 0.2]);
    outline.push([xR + s(H), yBack]);
  }
  outline.push([xR, yBase]);
  outline.push([xEnd, yBase + s(W) * 0.06]);
  outline.push([xEnd, yBase + s(W) * 0.94]);
  outline.push([xR, yFront]);
  outline.push([xR, yEnd]);
  outline.push([xB, yEnd]);
  outline.push([xB, yFront]);
  outline.push([xL, yBase + s(W) * 0.94]);
  outline.push([xL, yBase + s(W) * 0.06]);
  outline.push([xB, yBase]);
  outline.push([xB, yBack]);
  if (dust) {
    outline.push([xB - d, yLid + s(W) * 0.88]);
    outline.push([xB - d, yLid + s(W) * 0.12]);
    outline.push([xB + s(L) * 0.08, yLid]);
  } else if (doubleWall) {
    outline.push([xB - s(H), yBack]);
    outline.push([xB - s(H), yLid + s(W) * 0.2]);
    outline.push([xB + s(L) * 0.08, yLid]);
  } else {
    outline.push([xB + s(L) * 0.08, yLid]);
  }
  cutPath(ctx, outline, true);

  crease(ctx, xB, yLid, xR, yLid);
  crease(ctx, xB, yBack, xR, yBack);
  crease(ctx, xB, yBase, xR, yBase);
  crease(ctx, xB, yFront, xR, yFront);
  crease(ctx, xB, yBase, xB, yFront);
  crease(ctx, xR, yBase, xR, yFront);
  if (doubleWall) {
    crease(ctx, xB - s(H), yBase, xB - s(H), yFront);
    crease(ctx, xR + s(H), yBase, xR + s(H), yFront);
    const sw = Math.min(s(22), s(L) * 0.12);
    slot(ctx, xB + s(L) * 0.18, yFront + s(H) * 0.38, sw, 3.2);
    slot(ctx, xR - s(L) * 0.18 - sw, yFront + s(H) * 0.38, sw, 3.2);
    slot(ctx, xB + 5, yBase + s(W) * 0.22, 3.2, s(14));
    slot(ctx, xR - 8.2, yBase + s(W) * 0.22, 3.2, s(14));
  } else {
    slot(ctx, xB + s(L) * 0.22, yBack - 1.5, Math.min(s(18), s(L) * 0.1), 3);
    slot(ctx, xR - s(L) * 0.22 - Math.min(s(18), s(L) * 0.1), yBack - 1.5, Math.min(s(18), s(L) * 0.1), 3);
  }
  label(ctx, 'LID', xB + s(L) / 2, yLid + s(W) / 2, 10);
  label(ctx, 'BASE', xB + s(L) / 2, yBase + s(W) / 2, 10);
  label(ctx, 'L', xB + s(L) / 2, yBase + s(W) / 2 + 14, 9);
  label(ctx, 'H', xB + s(L) / 2, yBack + s(H) / 2, 9);
  caption(ctx, cap, net.x + 118, net.y + net.h + 16);
}

function draw0421(ctx, g) {
  mailerNet(ctx, g, {
    doubleWall: false,
    dust: false,
    cap: 'FEFCO 0421  ·  tray + hinged tuck lid  ·  not to scale',
  });
}

function draw0422(ctx, g) {
  const { L, W, H, net } = g;
  const totalW = H + L + H;
  const totalH = H + W + H;
  const { scale, ox, oy } = fit(totalW, totalH, net.w, net.h, 0.88);
  const s = (v) => v * scale;
  const xL = net.x + ox;
  const xB = xL + s(H);
  const xR = xB + s(L);
  const xEnd = xR + s(H);
  const yN = net.y + oy;
  const yB = yN + s(H);
  const yS = yB + s(W);
  cutPath(ctx, [
    [xB, yN],
    [xR, yN],
    [xR, yB],
    [xEnd, yB],
    [xEnd, yS],
    [xR, yS],
    [xR, yS + s(H)],
    [xB, yS + s(H)],
    [xB, yS],
    [xL, yS],
    [xL, yB],
    [xB, yB],
  ], true);
  crease(ctx, xB, yB, xR, yB);
  crease(ctx, xB, yS, xR, yS);
  crease(ctx, xB, yB, xB, yS);
  crease(ctx, xR, yB, xR, yS);
  const sw = Math.min(s(16), s(L) * 0.1);
  slot(ctx, xB + s(L) * 0.2, yB + 5, sw, 3.2);
  slot(ctx, xB + s(L) * 0.65, yB + 5, sw, 3.2);
  slot(ctx, xB + s(L) * 0.2, yS - 8, sw, 3.2);
  slot(ctx, xB + s(L) * 0.65, yS - 8, sw, 3.2);
  label(ctx, 'BASE', xB + s(L) / 2, yB + s(W) / 2, 10);
  caption(ctx, 'FEFCO 0422  ·  self-locking tray  ·  no lid  ·  not to scale', net.x + 118, net.y + net.h + 16);
}

function draw0426(ctx, g) {
  mailerNet(ctx, g, {
    doubleWall: false,
    dust: true,
    cap: 'FEFCO 0426  ·  hinged-lid mailer  ·  dust flaps + tuck  ·  not to scale',
  });
}

function draw0427(ctx, g) {
  mailerNet(ctx, g, {
    doubleWall: true,
    dust: false,
    cap: 'FEFCO 0427  ·  locking-wall mailer  ·  double sides  ·  not to scale',
  });
}

function drawSleeve(ctx, g, panels, names, strip, cap) {
  const { net } = g;
  const glue = glueWidth(panels[0], panels[1]);
  const seq = [glue, ...panels];
  const { scale, ox, oy } = fit(seq.reduce((a, b) => a + b, 0), strip, net.w, net.h);
  const s = (v) => v * scale;
  const xs = xsFrom(net.x + ox, seq.map(s));
  const y = net.y + oy;
  const h = s(strip);
  cutPath(ctx, [
    [xs[0], y],
    [xs[xs.length - 1], y],
    [xs[xs.length - 1], y + h],
    [xs[0], y + h],
  ], true);
  for (let i = 1; i < xs.length - 1; i += 1) crease(ctx, xs[i], y, xs[i], y + h);
  label(ctx, 'MJ', (xs[0] + xs[1]) / 2, y + h / 2, 9);
  names.forEach((n, i) => label(ctx, n, (xs[i + 1] + xs[i + 2]) / 2, y + h / 2));
  caption(ctx, cap, net.x + 118, net.y + net.h + 16);
}
