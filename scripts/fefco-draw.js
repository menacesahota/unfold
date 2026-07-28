/**
 * Accurate FEFCO blank (flat) + assembled silhouette drawings.
 * Blank layouts follow common FEFCO slotted / folder conventions.
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

function strokePanel(ctx, x, y, w, h, fill, stroke) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.stroke();
}

function scoreLine(ctx, x1, y1, x2, y2, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function label(ctx, text, x, y, color = '#666') {
  ctx.fillStyle = color;
  ctx.font = '600 11px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

/**
 * Draw FEFCO blank into a canvas 2D context.
 * L, W, H are mm — used only for proportions.
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
  const stroke = shadeHex(boardColor, -0.45);
  const score = shadeHex(boardColor, -0.55);
  const ink = shadeHex(boardColor, -0.7);

  // Padding and available drawing area
  const pad = 28;
  const areaW = canvasW - pad * 2;
  const areaH = canvasH - pad * 2;

  if (code === '0427') {
    draw0427(ctx, { L, W, H, fill, stroke, score, ink, pad, areaW, areaH, canvasW, canvasH });
    return;
  }
  if (code === '0409') {
    draw0409(ctx, { L, W, H, fill, stroke, score, ink, pad, areaW, areaH, canvasW, canvasH });
    return;
  }

  // Slotted family: 0200, 0201, 0203, 0215
  drawSlotted(ctx, {
    code,
    L,
    W,
    H,
    fill,
    stroke,
    score,
    ink,
    pad,
    areaW,
    areaH,
    canvasW,
    canvasH,
  });
}

function drawSlotted(ctx, { code, L, W, H, fill, stroke, score, ink, pad, areaW, areaH }) {
  // Body panels along girth: L + W + L + W + glue
  const glue = Math.max(W * 0.12, L * 0.04);
  const bodyParts = [L, W, L, W, glue];
  const bodySum = bodyParts.reduce((a, b) => a + b, 0);

  // Flap depths (FEFCO convention):
  // Major flaps (on L panels): meet → W/2; FOL → W
  // Minor flaps (on W panels): typically L/2, often slightly shorter than major when L > W
  const majorDepth = code === '0203' ? W : W / 2;
  const minorDepth = code === '0203' ? Math.min(L / 2, W * 0.45) : Math.min(L / 2, W / 2);
  const maxFlap = Math.max(majorDepth, minorDepth);

  const hasTop = code !== '0200';
  const hasBottom = true;
  const crashLock = code === '0215';

  const totalH = (hasTop ? maxFlap : 0) + H + (hasBottom ? maxFlap : 0);
  const scale = Math.min(areaW / bodySum, areaH / totalH) * 0.9;

  const drawW = bodySum * scale;
  const drawH = totalH * scale;
  const ox = pad + (areaW - drawW) / 2;
  const oy = pad + (areaH - drawH) / 2;

  const s = (v) => v * scale;
  const bodyH = s(H);
  const majorH = s(majorDepth);
  const minorH = s(minorDepth);

  const xs = [ox];
  bodyParts.forEach((p, i) => {
    xs.push(xs[i] + s(p));
  });

  const flapH = (i) => (i === 0 || i === 2 ? majorH : minorH);
  const topBand = hasTop ? s(maxFlap) : 0;

  // Top flaps — aligned to body score line (inner edge)
  if (hasTop) {
    for (let i = 0; i < 4; i += 1) {
      const pw = xs[i + 1] - xs[i];
      const fh = flapH(i);
      const fy = oy + topBand - fh;
      strokePanel(ctx, xs[i], fy, pw, fh, fill, stroke);

      if (code === '0203' && (i === 0 || i === 2)) {
        ctx.save();
        ctx.strokeStyle = shadeHex(fill, -0.35);
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(xs[i] + 4, fy + 4, pw - 8, fh - 8);
        ctx.restore();
      }
      if (i === 1 || i === 3) {
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(xs[i], fy, pw, fh);
      }
    }
    scoreLine(ctx, ox, oy + topBand, ox + drawW - s(glue), oy + topBand, score);
  }

  // Body panels
  for (let i = 0; i < 5; i += 1) {
    const pw = xs[i + 1] - xs[i];
    strokePanel(ctx, xs[i], oy + topBand, pw, bodyH, fill, stroke);
    if (i < 4) {
      scoreLine(ctx, xs[i + 1], oy + topBand, xs[i + 1], oy + topBand + bodyH, score);
    }
  }

  // Glue tab hatching
  {
    const gx = xs[4];
    const gw = xs[5] - xs[4];
    ctx.save();
    ctx.beginPath();
    ctx.rect(gx, oy + topBand, gw, bodyH);
    ctx.clip();
    ctx.strokeStyle = shadeHex(fill, -0.35);
    ctx.lineWidth = 0.7;
    for (let k = -bodyH; k < gw + bodyH; k += 5) {
      ctx.beginPath();
      ctx.moveTo(gx + k, oy + topBand);
      ctx.lineTo(gx + k + bodyH, oy + topBand + bodyH);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Bottom flaps
  if (hasBottom) {
    const by0 = oy + topBand + bodyH;
    scoreLine(ctx, ox, by0, ox + drawW - s(glue), by0, score);
    for (let i = 0; i < 4; i += 1) {
      const pw = xs[i + 1] - xs[i];
      const fh = flapH(i);
      const by = by0;

      if (crashLock && (i === 1 || i === 3)) {
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        if (i === 1) {
          ctx.moveTo(xs[i], by);
          ctx.lineTo(xs[i + 1], by);
          ctx.lineTo(xs[i + 1], by + fh * 0.35);
          ctx.lineTo(xs[i] + pw * 0.15, by + fh);
          ctx.lineTo(xs[i], by + fh * 0.55);
        } else {
          ctx.moveTo(xs[i], by);
          ctx.lineTo(xs[i + 1], by);
          ctx.lineTo(xs[i + 1], by + fh * 0.55);
          ctx.lineTo(xs[i + 1] - pw * 0.15, by + fh);
          ctx.lineTo(xs[i], by + fh * 0.35);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (crashLock && (i === 0 || i === 2)) {
        strokePanel(ctx, xs[i], by, pw, fh, fill, stroke);
        ctx.fillStyle = shadeHex(fill, -0.15);
        ctx.strokeStyle = stroke;
        const nx = xs[i] + pw * 0.35;
        const nw = pw * 0.3;
        ctx.beginPath();
        ctx.moveTo(nx, by + fh);
        ctx.lineTo(nx + nw * 0.5, by + fh * 0.55);
        ctx.lineTo(nx + nw, by + fh);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        strokePanel(ctx, xs[i], by, pw, fh, fill, stroke);
        if (i === 1 || i === 3) {
          ctx.fillStyle = 'rgba(0,0,0,0.05)';
          ctx.fillRect(xs[i], by, pw, fh);
        }
        if (code === '0203' && (i === 0 || i === 2)) {
          ctx.save();
          ctx.strokeStyle = shadeHex(fill, -0.35);
          ctx.lineWidth = 0.8;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(xs[i] + 4, by + 4, pw - 8, fh - 8);
          ctx.restore();
        }
      }
    }
  }

  // Panel labels + dimension callouts
  const midY = oy + topBand + bodyH / 2;
  label(ctx, 'L', (xs[0] + xs[1]) / 2, midY, ink);
  label(ctx, 'W', (xs[1] + xs[2]) / 2, midY, ink);
  label(ctx, 'L', (xs[2] + xs[3]) / 2, midY, ink);
  label(ctx, 'W', (xs[3] + xs[4]) / 2, midY, ink);

  ctx.fillStyle = '#888';
  ctx.font = '500 10px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const captions = {
    '0200': 'FEFCO 0200 blank  ·  half slotted (open top)  ·  not to scale',
    '0201': 'FEFCO 0201 blank  ·  regular slotted  ·  not to scale',
    '0203': 'FEFCO 0203 blank  ·  full overlap flaps  ·  not to scale',
    '0215': 'FEFCO 0215 blank  ·  crash-lock base  ·  not to scale',
  };
  ctx.fillText(captions[code] || 'FEFCO blank  ·  flat layout  ·  not to scale', pad, pad - 8);
}

function draw0427(ctx, { L, W, H, fill, stroke, score, ink, pad, areaW, areaH }) {
  // Roll-end tuck-top mailer blank (simplified accurate structure):
  // [left roll][base L×W][right roll] with lid extending from one long side + tuck
  const roll = H; // roll-end height ≈ box height
  const lid = W; // lid depth covers width
  const tuck = Math.max(W * 0.22, H * 0.25);
  const dust = H * 0.45;

  const totalW = roll + L + roll;
  const totalH = dust + W + lid + tuck;
  const scale = Math.min(areaW / totalW, areaH / totalH) * 0.9;
  const s = (v) => v * scale;

  const drawW = totalW * scale;
  const drawH = totalH * scale;
  const ox = pad + (areaW - drawW) / 2;
  const oy = pad + (areaH - drawH) / 2;

  const x0 = ox;
  const x1 = ox + s(roll);
  const x2 = ox + s(roll + L);
  const x3 = ox + s(roll + L + roll);

  const yDust = oy;
  const yBase = oy + s(dust);
  const yLid = yBase + s(W);
  const yTuck = yLid + s(lid);

  // Dust flaps above base (on length edges via roll panels — simplified top dust on base)
  strokePanel(ctx, x1, yDust, s(L), s(dust), fill, stroke);

  // Roll ends + base
  strokePanel(ctx, x0, yBase, s(roll), s(W), fill, stroke);
  strokePanel(ctx, x1, yBase, s(L), s(W), fill, stroke);
  strokePanel(ctx, x2, yBase, s(roll), s(W), fill, stroke);

  // Lid from front of base
  strokePanel(ctx, x1, yLid, s(L), s(lid), fill, stroke);
  // Side wings on lid
  strokePanel(ctx, x0, yLid, s(roll), s(lid) * 0.7, fill, stroke);
  strokePanel(ctx, x2, yLid, s(roll), s(lid) * 0.7, fill, stroke);

  // Tuck flap
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(x1 + s(L) * 0.08, yTuck);
  ctx.lineTo(x2 - s(L) * 0.08, yTuck);
  ctx.lineTo(x2 - s(L) * 0.18, yTuck + s(tuck));
  ctx.lineTo(x1 + s(L) * 0.18, yTuck + s(tuck));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Scores
  scoreLine(ctx, x1, yDust, x1, yTuck, score);
  scoreLine(ctx, x2, yDust, x2, yTuck, score);
  scoreLine(ctx, x0, yBase, x3, yBase, score);
  scoreLine(ctx, x1, yLid, x2, yLid, score);
  scoreLine(ctx, x1, yTuck, x2, yTuck, score);

  // Roll-end curves hint
  ctx.strokeStyle = shadeHex(fill, -0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x0 + s(roll) * 0.55, yBase + s(W) * 0.5, s(roll) * 0.28, -0.8, 0.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x3 - s(roll) * 0.55, yBase + s(W) * 0.5, s(roll) * 0.28, Math.PI - 0.8, Math.PI + 0.8);
  ctx.stroke();

  label(ctx, 'BASE', (x1 + x2) / 2, yBase + s(W) / 2, ink);
  label(ctx, 'LID', (x1 + x2) / 2, yLid + s(lid) / 2, ink);
  label(ctx, 'TUCK', (x1 + x2) / 2, yTuck + s(tuck) / 2, ink);

  ctx.fillStyle = '#888';
  ctx.font = '500 10px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('FEFCO 0427 blank  ·  roll-end tuck top  ·  not to scale', pad, pad - 10);
}

function draw0409(ctx, { L, W, H, fill, stroke, score, ink, pad, areaW, areaH }) {
  // Five-panel folder: wraps around product — typically:
  // flap | H | W | H | W | H  (or similar wrap sequence) with end tucks
  // Common ecommerce 0409-style: five panels in a row covering wrap girth
  const panels = [H, W, H, W, H];
  const tuck = Math.max(L * 0.15, W * 0.2);
  const sum = panels.reduce((a, b) => a + b, 0);
  const totalW = sum;
  const totalH = tuck + L + tuck;
  const scale = Math.min(areaW / totalW, areaH / totalH) * 0.9;
  const s = (v) => v * scale;

  const drawW = totalW * scale;
  const drawH = totalH * scale;
  const ox = pad + (areaW - drawW) / 2;
  const oy = pad + (areaH - drawH) / 2;

  const xs = [ox];
  panels.forEach((p, i) => xs.push(xs[i] + s(p)));

  const y0 = oy;
  const y1 = oy + s(tuck);
  const y2 = y1 + s(L);

  // End tuck flaps on centre-ish panels (panels 1 and 3 — the W faces)
  for (let i = 0; i < 5; i += 1) {
    const pw = xs[i + 1] - xs[i];
    // top tuck only on W panels
    if (i === 1 || i === 3) {
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(xs[i] + 2, y1);
      ctx.lineTo(xs[i + 1] - 2, y1);
      ctx.lineTo(xs[i + 1] - pw * 0.15, y0);
      ctx.lineTo(xs[i] + pw * 0.15, y0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    strokePanel(ctx, xs[i], y1, pw, s(L), fill, stroke);
    if (i === 1 || i === 3) {
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.beginPath();
      ctx.moveTo(xs[i] + 2, y2);
      ctx.lineTo(xs[i + 1] - 2, y2);
      ctx.lineTo(xs[i + 1] - pw * 0.15, y2 + s(tuck));
      ctx.lineTo(xs[i] + pw * 0.15, y2 + s(tuck));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    if (i < 4) {
      scoreLine(ctx, xs[i + 1], y1, xs[i + 1], y2, score);
    }
  }
  scoreLine(ctx, ox, y1, ox + drawW, y1, score);
  scoreLine(ctx, ox, y2, ox + drawW, y2, score);

  const labels = ['H', 'W', 'H', 'W', 'H'];
  labels.forEach((t, i) => {
    label(ctx, t, (xs[i] + xs[i + 1]) / 2, y1 + s(L) / 2, ink);
  });

  ctx.fillStyle = '#888';
  ctx.font = '500 10px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('FEFCO 0409 blank  ·  five-panel folder  ·  not to scale', pad, pad - 10);
}

/** Fit canvas to CSS size with sharp DPR */
export function sizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(320, Math.floor(rect.width));
  const h = Math.max(260, Math.floor(rect.height));
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: w, height: h };
}
