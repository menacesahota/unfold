/**
 * FEFCO flat blank (net) drawings for PDF mockups.
 * Geometries follow FEFCO Code of Designs conventions:
 * - 0201: all flaps equal length (= W/2), outer flaps meet; slots between flaps
 * - 0200: same as 0201 but top flaps omitted (HSC)
 * - 0203: all flaps equal length (= W), full outer overlap
 * - 0215: top as 0201; crash-lock / snap-lock bottom
 * - 0427: tray base + four walls + hinged lid from back + tab/slot lock
 * - 0409: five-panel wrap with end flaps
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

function fillStroke(ctx, fill, stroke, lw = 1.2) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
}

function rect(ctx, x, y, w, h, fill, stroke) {
  fillStroke(ctx, fill, stroke);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.stroke();
}

function score(ctx, x1, y1, x2, y2, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 3.5]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function cut(ctx, x1, y1, x2, y2, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.15;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function label(ctx, text, x, y, color) {
  ctx.fillStyle = color;
  ctx.font = '600 11px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function caption(ctx, text, pad) {
  ctx.fillStyle = '#777';
  ctx.font = '500 10px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, pad, pad - 8);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} opts
 */
export function drawFefcoBlank(ctx, {
  code,
  length: L,
  width: W,
  height: H,
  boardColor = '#c9a87c',
  canvasW,
  canvasH,
}) {
  ctx.clearRect(0, 0, canvasW, canvasH);

  const fill = boardColor;
  const stroke = shadeHex(boardColor, -0.48);
  const scoreCol = shadeHex(boardColor, -0.58);
  const ink = shadeHex(boardColor, -0.72);
  const pad = 30;
  const areaW = canvasW - pad * 2;
  const areaH = canvasH - pad * 2;

  if (code === '0427' || code === '0426') {
    draw0427(ctx, {
      L,
      W,
      H,
      fill,
      stroke,
      scoreCol,
      ink,
      pad,
      areaW,
      areaH,
      selfLock: code === '0426',
    });
    return;
  }
  if (code === '0409') {
    draw0409(ctx, { L, W, H, fill, stroke, scoreCol, ink, pad, areaW, areaH });
    return;
  }

  drawSlotted(ctx, {
    code,
    L,
    W,
    H,
    fill,
    stroke,
    scoreCol,
    ink,
    pad,
    areaW,
    areaH,
  });
}

/**
 * Slotted family blanks (02xx).
 * Body girth: L + W + L + W + manufacturer's joint.
 * Flap length is constant across all flaps for a given style
 * (FEFCO 0201: = W/2; FEFCO 0203: = W).
 */
function drawSlotted(ctx, {
  code, L, W, H, fill, stroke, scoreCol, ink, pad, areaW, areaH,
}) {
  const glue = Math.max(W * 0.1, L * 0.035, 12);
  const body = [L, W, L, W, glue];
  const bodySum = body.reduce((a, b) => a + b, 0);

  // FEFCO: all flaps same length for a given style
  const flapLen = code === '0203' ? W : W / 2;
  const hasTop = code !== '0200';
  const crashLock = code === '0215';
  const slotGap = Math.max(flapLen * 0.04, 2); // visual slot between flaps

  const totalH = (hasTop ? flapLen : 0) + H + flapLen;
  const scale = Math.min(areaW / bodySum, areaH / totalH) * 0.9;
  const s = (v) => v * scale;

  const drawW = bodySum * scale;
  const ox = pad + (areaW - drawW) / 2;
  const oy = pad + (areaH - totalH * scale) / 2;

  const xs = [ox];
  body.forEach((p, i) => xs.push(xs[i] + s(p)));

  const topH = hasTop ? s(flapLen) : 0;
  const bodyH = s(H);
  const botH = s(flapLen);
  const gap = s(slotGap);

  // --- Top flaps (0201 / 0203 / 0215) ---
  if (hasTop) {
    for (let i = 0; i < 4; i += 1) {
      const x0 = xs[i] + gap / 2;
      const x1 = xs[i + 1] - gap / 2;
      const pw = x1 - x0;
      if (pw <= 0) continue;
      rect(ctx, x0, oy, pw, topH, fill, stroke);
      // Slot cut between flaps (down to score)
      if (i < 3) {
        cut(ctx, xs[i + 1], oy, xs[i + 1], oy + topH, stroke);
      }
    }
    score(ctx, ox, oy + topH, xs[4], oy + topH, scoreCol);
  }

  // --- Body panels ---
  for (let i = 0; i < 5; i += 1) {
    const pw = xs[i + 1] - xs[i];
    rect(ctx, xs[i], oy + topH, pw, bodyH, fill, stroke);
    if (i < 4) {
      score(ctx, xs[i + 1], oy + topH, xs[i + 1], oy + topH + bodyH, scoreCol);
    }
  }

  // Glue / manufacturer's joint hatching
  {
    const gx = xs[4];
    const gw = xs[5] - xs[4];
    ctx.save();
    ctx.beginPath();
    ctx.rect(gx, oy + topH, gw, bodyH);
    ctx.clip();
    ctx.strokeStyle = shadeHex(fill, -0.35);
    ctx.lineWidth = 0.7;
    for (let k = -bodyH; k < gw + bodyH; k += 5) {
      ctx.beginPath();
      ctx.moveTo(gx + k, oy + topH);
      ctx.lineTo(gx + k + bodyH, oy + topH + bodyH);
      ctx.stroke();
    }
    ctx.restore();
    label(ctx, 'MJ', (xs[4] + xs[5]) / 2, oy + topH + bodyH / 2, ink);
  }

  // --- Bottom flaps ---
  const by = oy + topH + bodyH;
  score(ctx, ox, by, xs[4], by, scoreCol);

  if (crashLock) {
    drawCrashLockBottom(ctx, {
      xs, by, botH, gap, fill, stroke, scoreCol,
    });
  } else {
    for (let i = 0; i < 4; i += 1) {
      const x0 = xs[i] + gap / 2;
      const x1 = xs[i + 1] - gap / 2;
      const pw = x1 - x0;
      if (pw <= 0) continue;
      rect(ctx, x0, by, pw, botH, fill, stroke);
      if (i < 3) {
        cut(ctx, xs[i + 1], by, xs[i + 1], by + botH, stroke);
      }
      // FOL: dashed inner hint on major (outer) flaps
      if (code === '0203' && (i === 0 || i === 2)) {
        ctx.save();
        ctx.strokeStyle = shadeHex(fill, -0.35);
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(x0 + 4, by + 4, pw - 8, botH - 8);
        ctx.restore();
      }
    }
  }

  // Panel labels
  const midY = oy + topH + bodyH / 2;
  label(ctx, 'L', (xs[0] + xs[1]) / 2, midY, ink);
  label(ctx, 'W', (xs[1] + xs[2]) / 2, midY, ink);
  label(ctx, 'L', (xs[2] + xs[3]) / 2, midY, ink);
  label(ctx, 'W', (xs[3] + xs[4]) / 2, midY, ink);

  // Dimension callouts on flaps
  if (hasTop) {
    label(ctx, code === '0203' ? 'W' : 'W/2', (xs[0] + xs[1]) / 2, oy + topH / 2, ink);
  }
  label(ctx, crashLock ? 'lock' : (code === '0203' ? 'W' : 'W/2'), (xs[0] + xs[1]) / 2, by + botH / 2, ink);

  const captions = {
    '0200': 'FEFCO 0200  ·  half slotted (HSC)  ·  bottom flaps only  ·  not to scale',
    '0201': 'FEFCO 0201  ·  regular slotted (RSC)  ·  all flaps = W/2  ·  not to scale',
    '0203': 'FEFCO 0203  ·  full overlap (FOL)  ·  all flaps = W  ·  not to scale',
    '0215': 'FEFCO 0215  ·  crash-lock / snap-lock bottom  ·  not to scale',
  };
  caption(ctx, captions[code] || 'FEFCO blank  ·  not to scale', pad);
}

/** Classic corrugated crash-lock (auto-bottom) flap geometry */
function drawCrashLockBottom(ctx, { xs, by, botH, gap, fill, stroke }) {
  // Minor flaps (W panels, i=1,3): diagonal / trapezoid
  for (const i of [1, 3]) {
    const x0 = xs[i] + gap / 2;
    const x1 = xs[i + 1] - gap / 2;
    const pw = x1 - x0;
    fillStroke(ctx, fill, stroke);
    ctx.beginPath();
    if (i === 1) {
      ctx.moveTo(x0, by);
      ctx.lineTo(x1, by);
      ctx.lineTo(x1, by + botH * 0.28);
      ctx.lineTo(x0 + pw * 0.2, by + botH);
      ctx.lineTo(x0, by + botH * 0.55);
    } else {
      ctx.moveTo(x0, by);
      ctx.lineTo(x1, by);
      ctx.lineTo(x1, by + botH * 0.55);
      ctx.lineTo(x1 - pw * 0.2, by + botH);
      ctx.lineTo(x0, by + botH * 0.28);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Major flaps (L panels, i=0,2): interlocking with centre notch / tab
  for (const i of [0, 2]) {
    const x0 = xs[i] + gap / 2;
    const x1 = xs[i + 1] - gap / 2;
    const pw = x1 - x0;
    fillStroke(ctx, fill, stroke);
    ctx.beginPath();
    // Stepped interlocking profile
    ctx.moveTo(x0, by);
    ctx.lineTo(x1, by);
    ctx.lineTo(x1, by + botH * 0.7);
    // locking tab
    const tabL = pw * 0.28;
    const tabX = (x0 + x1) / 2 - tabL / 2;
    ctx.lineTo(tabX + tabL, by + botH * 0.7);
    ctx.lineTo(tabX + tabL * 0.75, by + botH);
    ctx.lineTo(tabX + tabL * 0.25, by + botH);
    ctx.lineTo(tabX, by + botH * 0.7);
    ctx.lineTo(x0, by + botH * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Slot cuts between panels
  for (let i = 0; i < 3; i += 1) {
    cut(ctx, xs[i + 1], by, xs[i + 1], by + botH * 0.35, stroke);
  }
}

/**
 * FEFCO 0427 — tray with hinged lid (official structure):
 * bottom + 4 walls; lid continues from back wall; two tuck tabs
 * engage slots in the front wall.
 *
 * Flat layout (centre column top→bottom):
 *   tuck tabs → lid (L×W) → back (L×H) → bottom (L×W) → front (L×H)
 * Side walls (H×W) sit left/right of the bottom panel.
 */
function draw0427(ctx, {
  L, W, H, fill, stroke, scoreCol, ink, pad, areaW, areaH, selfLock = false,
}) {
  const tuck = Math.max(H * 0.28, W * 0.12, 18);
  const tabW = Math.min(L * 0.18, L / 2 - 8);
  const tabH = Math.max(tuck * 0.55, 10);
  const dust = Math.min(H * 0.4, W * 0.35);

  // Side walls are H wide (fold up) × W tall (match bottom depth)
  const totalW = dust + H + L + H + dust;
  const totalH = tabH + W + H + W + H;
  const scale = Math.min(areaW / totalW, areaH / totalH) * 0.88;
  const s = (v) => v * scale;

  const drawW = totalW * scale;
  const drawH = totalH * scale;
  const ox = pad + (areaW - drawW) / 2;
  const oy = pad + (areaH - drawH) / 2;

  const xDustL = ox;
  const xSideL = ox + s(dust);
  const xBase = ox + s(dust + H);
  const xSideR = ox + s(dust + H + L);
  const xEnd = ox + s(dust + H + L + H);

  const yTab = oy;
  const yLid = oy + s(tabH);
  const yBack = yLid + s(W);
  const yBase = yBack + s(H);
  const yFront = yBase + s(W);

  // Lid
  rect(ctx, xBase, yLid, s(L), s(W), fill, stroke);

  // Two tuck tabs on outer lid edge
  const tabGap = s(L) * 0.14;
  const tw = s(tabW);
  const t1x = xBase + tabGap;
  const t2x = xBase + s(L) - tabGap - tw;
  for (const tx of [t1x, t2x]) {
    fillStroke(ctx, fill, stroke);
    ctx.beginPath();
    ctx.moveTo(tx, yLid);
    ctx.lineTo(tx + tw, yLid);
    ctx.lineTo(tx + tw * 0.85, yTab);
    ctx.lineTo(tx + tw * 0.15, yTab);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Back wall (L × H)
  rect(ctx, xBase, yBack, s(L), s(H), fill, stroke);

  // Bottom (L × W)
  rect(ctx, xBase, yBase, s(L), s(W), fill, stroke);

  // Front wall (L × H) + lock slots
  rect(ctx, xBase, yFront, s(L), s(H), fill, stroke);
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.fillStyle = '#fff';
  ctx.lineWidth = 1.2;
  const slotY = yFront + s(H) * 0.38;
  for (const tx of [t1x, t2x]) {
    ctx.fillRect(tx + tw * 0.1, slotY, tw * 0.8, 3.5);
    ctx.strokeRect(tx + tw * 0.1, slotY, tw * 0.8, 3.5);
  }
  ctx.restore();

  // Side walls left/right of bottom (H wide × W tall)
  rect(ctx, xSideL, yBase, s(H), s(W), fill, stroke);
  rect(ctx, xSideR, yBase, s(H), s(W), fill, stroke);

  // Dust flaps on outer edges of side walls
  fillStroke(ctx, fill, stroke);
  ctx.beginPath();
  ctx.moveTo(xSideL, yBase + s(W) * 0.1);
  ctx.lineTo(xSideL, yBase + s(W) * 0.9);
  ctx.lineTo(xDustL + 1, yBase + s(W) * 0.72);
  ctx.lineTo(xDustL + 1, yBase + s(W) * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(xSideR + s(H), yBase + s(W) * 0.1);
  ctx.lineTo(xSideR + s(H), yBase + s(W) * 0.9);
  ctx.lineTo(xEnd + s(dust) - 1, yBase + s(W) * 0.72);
  ctx.lineTo(xEnd + s(dust) - 1, yBase + s(W) * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Lid side wings (fold inside) — partial height of lid
  const wingH = Math.min(s(H) * 0.65, s(W) * 0.45);
  rect(ctx, xSideL, yLid + s(W) - wingH, s(H), wingH, fill, stroke);
  rect(ctx, xSideR, yLid + s(W) - wingH, s(H), wingH, fill, stroke);

  // Scores
  score(ctx, xBase, yLid, xBase + s(L), yLid, scoreCol);
  score(ctx, xBase, yBack, xBase + s(L), yBack, scoreCol);
  score(ctx, xBase, yBase, xBase + s(L), yBase, scoreCol);
  score(ctx, xBase, yFront, xBase + s(L), yFront, scoreCol);
  score(ctx, xSideL, yBase, xSideL, yBase + s(W), scoreCol);
  score(ctx, xBase, yBase, xBase, yBase + s(W), scoreCol);
  score(ctx, xSideR, yBase, xSideR, yBase + s(W), scoreCol);
  score(ctx, xSideR + s(H), yBase, xSideR + s(H), yBase + s(W), scoreCol);

  label(ctx, 'LID', xBase + s(L) / 2, yLid + s(W) / 2, ink);
  label(ctx, 'BACK', xBase + s(L) / 2, yBack + s(H) / 2, ink);
  label(ctx, 'BOTTOM', xBase + s(L) / 2, yBase + s(W) / 2, ink);
  label(ctx, 'FRONT', xBase + s(L) / 2, yFront + s(H) / 2, ink);
  label(ctx, 'SIDE', xSideL + s(H) / 2, yBase + s(W) / 2, ink);
  label(ctx, 'SIDE', xSideR + s(H) / 2, yBase + s(W) / 2, ink);

  caption(
    ctx,
    selfLock
      ? 'FEFCO 0426  ·  self-locking mailer  ·  not to scale'
      : 'FEFCO 0427  ·  tray with hinged lid  ·  tab & slot lock  ·  not to scale',
    pad
  );
}

/**
 * FEFCO 0409 — five-panel wrap.
 * Five panels in a row wrap the girth; end flaps close both ends.
 * Panel sequence (common): H | W | H | W | H  (closing overlap on last H).
 * Vertical dimension of the strip = product length L.
 */
function draw0409(ctx, { L, W, H, fill, stroke, scoreCol, ink, pad, areaW, areaH }) {
  const panels = [H, W, H, W, H];
  const endFlap = Math.min(W * 0.5, H * 0.85); // end closure depth
  const sum = panels.reduce((a, b) => a + b, 0);
  const totalW = sum;
  const totalH = endFlap + L + endFlap;
  const scale = Math.min(areaW / totalW, areaH / totalH) * 0.9;
  const s = (v) => v * scale;

  const drawW = totalW * scale;
  const drawH = totalH * scale;
  const ox = pad + (areaW - drawW) / 2;
  const oy = pad + (areaH - drawH) / 2;

  const xs = [ox];
  panels.forEach((p, i) => xs.push(xs[i] + s(p)));

  const y0 = oy;
  const y1 = oy + s(endFlap);
  const y2 = y1 + s(L);

  // End flaps only on the W panels (indices 1 and 3) — close the ends of the wrap
  for (const i of [1, 3]) {
    const pw = xs[i + 1] - xs[i];
    // Top end flap (slightly tapered)
    fillStroke(ctx, fill, stroke);
    ctx.beginPath();
    ctx.moveTo(xs[i] + 2, y1);
    ctx.lineTo(xs[i + 1] - 2, y1);
    ctx.lineTo(xs[i + 1] - pw * 0.12, y0);
    ctx.lineTo(xs[i] + pw * 0.12, y0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Bottom end flap
    ctx.beginPath();
    ctx.moveTo(xs[i] + 2, y2);
    ctx.lineTo(xs[i + 1] - 2, y2);
    ctx.lineTo(xs[i + 1] - pw * 0.12, y2 + s(endFlap));
    ctx.lineTo(xs[i] + pw * 0.12, y2 + s(endFlap));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Five body panels
  const names = ['H', 'W', 'H', 'W', 'H'];
  for (let i = 0; i < 5; i += 1) {
    const pw = xs[i + 1] - xs[i];
    rect(ctx, xs[i], y1, pw, s(L), fill, stroke);
    if (i < 4) {
      score(ctx, xs[i + 1], y1, xs[i + 1], y2, scoreCol);
    }
    // Closing panel (last H) — light hatch to show overlap/seal panel
    if (i === 4) {
      ctx.save();
      ctx.strokeStyle = shadeHex(fill, -0.35);
      ctx.lineWidth = 0.7;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(xs[i] + 4, y1 + 4, pw - 8, s(L) - 8);
      ctx.restore();
    }
    label(ctx, names[i], (xs[i] + xs[i + 1]) / 2, y1 + s(L) / 2, ink);
  }

  score(ctx, ox, y1, ox + drawW, y1, scoreCol);
  score(ctx, ox, y2, ox + drawW, y2, scoreCol);

  caption(ctx, 'FEFCO 0409  ·  five-panel wrap  ·  end flaps on W panels  ·  not to scale', pad);
}
