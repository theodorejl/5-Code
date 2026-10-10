// ================================================================
//  RENDU 3D DE LA TRAVERSÉE (Canvas 2D, projection angulaire)
//  Chaque point du monde est projeté selon son azimut et son élévation vus de la caméra.
//  Coûts maîtrisés : niveau de détail par distance, précalculs, qualité adaptative (QUALITY).
// ================================================================
function makeCam(w, h, x, y, z, yaw, pitch, roll, halfFov) {
  const k = (w / 2) / halfFov, cx = w / 2, cy = h / 2;
  return {
    x, y, z, yaw, pitch, roll, k, cx, cy, w, h,
    p(px, py, pz) {
      const dx = px - x, dy = py - y, r = Math.hypot(dx, dy);
      const az = norm180(deg(Math.atan2(dx, dy)) - yaw), el = deg(Math.atan2(pz - z, r));
      return [cx + az * k, cy - (el - pitch) * k, Math.hypot(r, pz - z), az];
    }
  };
}

// ---------------- Lumière : du matin (départ) au coucher du soleil (Genève) ----------------
const LIGHT_KEYS = [
  { f: 0, top: "#8db4d9", mid: "#c9dcec", hor: "#f4e4cf", sunB: 95, sunE: 9, sun: "#fff3d8", haze: [222, 228, 236], tint: [1.0, 0.99, 0.96], snow: [255, 250, 244] },
  { f: 0.45, top: "#77a7d8", mid: "#b9d4ea", hor: "#e6eef3", sunB: 170, sunE: 40, sun: "#fffbee", haze: [214, 224, 234], tint: [1, 1, 1], snow: [255, 255, 255] },
  { f: 0.8, top: "#7f9fd4", mid: "#c3cfe6", hor: "#f4dcc0", sunB: 238, sunE: 15, sun: "#ffe6bf", haze: [226, 222, 226], tint: [1.04, 0.98, 0.92], snow: [255, 240, 228] },
  { f: 1.0, top: "#6c79b2", mid: "#c49dbb", hor: "#ffa57c", sunB: 262, sunE: 1.5, sun: "#ff9a5a", haze: [238, 202, 192], tint: [1.1, 0.9, 0.84], snow: [255, 196, 200] }
];
function lightAt(f, storm) {
  let i = 1;
  while (i < LIGHT_KEYS.length - 1 && LIGHT_KEYS[i].f < f) i++;
  const a = LIGHT_KEYS[i - 1], b = LIGHT_KEYS[i], t = smooth((f - a.f) / (b.f - a.f));
  const mixH = (p, q) => rgbStr(mixRgb(mixRgb(hexToRgb(p), hexToRgb(q), t), [112, 122, 140], storm * 0.55));
  const sunB = lerp(a.sunB, b.sunB, t), sunE = lerp(a.sunE, b.sunE, t);
  const se = Math.max(rad(sunE), 0.05);
  return {
    top: mixH(a.top, b.top), mid: mixH(a.mid, b.mid), hor: mixH(a.hor, b.hor),
    sunB, sunE, sunCol: rgbStr(mixRgb(hexToRgb(a.sun), hexToRgb(b.sun), t)),
    haze: mixRgb(mixRgb(a.haze, b.haze, t), [128, 136, 150], storm * 0.6),
    tint: mixRgb(a.tint, b.tint, t).map(v => v * (1 - storm * 0.18)),
    snow: mixRgb(a.snow, b.snow, t),
    sun: [Math.sin(rad(sunB)) * Math.cos(se), Math.cos(rad(sunB)) * Math.cos(se), Math.sin(se)],
    storm
  };
}

// ---------------- Ciel, soleil, nuages ----------------
function drawSky(ctx, cam, L, t) {
  const hy = cam.cy + cam.pitch * cam.k;   // ligne d'horizon (élévation 0)
  const g = ctx.createLinearGradient(0, hy - cam.h * 1.2, 0, hy + 2);
  g.addColorStop(0, L.top); g.addColorStop(0.62, L.mid); g.addColorStop(1, L.hor);
  ctx.fillStyle = g; ctx.fillRect(-cam.w * 0.3, -cam.h, cam.w * 1.6, hy + cam.h + 2);
  const sAz = norm180(L.sunB - cam.yaw), sx = cam.cx + sAz * cam.k, sy = cam.cy - (L.sunE - cam.pitch) * cam.k;
  if (sx > -cam.w && sx < cam.w * 2) {
    const gr = ctx.createRadialGradient(sx, sy, 0, sx, sy, cam.h * 0.8);
    gr.addColorStop(0, L.sunCol); gr.addColorStop(0.08, "rgba(255,226,200,.45)"); gr.addColorStop(1, "rgba(255,226,200,0)");
    ctx.globalAlpha = 0.9 * (1 - L.storm * 0.8);
    ctx.fillStyle = gr; ctx.fillRect(-cam.w * 0.3, -cam.h, cam.w * 1.6, cam.h * 3);
    ctx.globalAlpha = 1 - L.storm * 0.85;
    ctx.fillStyle = L.sunCol; ctx.beginPath(); ctx.arc(sx, sy, cam.k * (L.sunE < 4 ? 1.1 : 0.7), 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  for (let i = 0; i < 10; i++) {   // stratus fixes dans le monde
    const caz = norm180(i * 41 + 13 - cam.yaw + t * 0.12), cel = 3 + (i * 7) % 16;
    const cxp = cam.cx + caz * cam.k, cyp = cam.cy - (cel - cam.pitch) * cam.k;
    if (cxp < -cam.w * 0.5 || cxp > cam.w * 1.5) continue;
    const sc = cam.k / 7;
    ctx.fillStyle = L.storm > 0.2 ? `rgba(110,118,135,${0.35 + L.storm * 0.4})` : "rgba(255,250,252,.55)";
    ctx.beginPath(); ctx.ellipse(cxp, cyp, 120 * sc, 7 * sc, 0, 0, Math.PI * 2); ctx.ellipse(cxp - 45 * sc, cyp - 4 * sc, 70 * sc, 9 * sc, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (L.storm > 0.05) {   // banc noir du Joran au nord-ouest
    const az = norm180(315 - cam.yaw), x = cam.cx + az * cam.k;
    const gr = ctx.createRadialGradient(x, hy - cam.k * 6, 0, x, hy - cam.k * 6, cam.w * 0.7);
    gr.addColorStop(0, `rgba(70,78,98,${0.7 * L.storm})`); gr.addColorStop(1, "rgba(70,78,98,0)");
    ctx.fillStyle = gr; ctx.fillRect(-cam.w * 0.3, -cam.h, cam.w * 1.6, hy + cam.h);
  }
  return hy;
}
function polyPath(ctx, pts) { ctx.beginPath(); for (let i = 0; i < pts.length; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]); ctx.closePath(); }

// ---------------- Montagnes ----------------
function drawRanges(ctx, cam, L) {
  const list = [];
  for (const pc of RANGE_PIECES) {
    const d = Math.hypot(pc.cx - cam.x, pc.cy - cam.y);
    const top = pc.pts.map(p => cam.p(p[0], p[1], p[2]));
    if (top.every(p => Math.abs(p[3]) > 100)) continue;
    if (top.some(p => Math.abs(p[3]) > 140)) continue;
    list.push({ pc, d, top });
  }
  list.sort((a, b) => b.d - a.d);
  const sunH = [L.sun[0], L.sun[1]], sl = Math.hypot(sunH[0], sunH[1]) || 1;
  for (const { pc, d, top } of list) {
    const baseRaw = pc.pts.map(p => cam.p(p[0], p[1], 0));
    const base = baseRaw.slice().reverse();
    const col = mixRgb(hexToRgb("#7f9c8a"), hexToRgb("#8f98ab"), pc.rock);
    const fog = 1 - Math.exp(-d / 2600);
    ctx.fillStyle = rgbStr(mixRgb(col.map((v, i) => v * L.tint[i]), L.haze, fog));
    polyPath(ctx, [...top, ...base]); ctx.fill();
    // facettes éclairées : chaque pan de montagne est plus ou moins clair selon son orientation au soleil
    if (fog < 0.85) {
      for (let i = 0; i < pc.pts.length - 1; i++) {
        const a = pc.pts[i], b = pc.pts[i + 1];
        let nx = b[1] - a[1], ny = -(b[0] - a[0]);
        const nl = Math.hypot(nx, ny) || 1;
        nx /= nl; ny /= nl;
        if (nx * (cam.x - a[0]) + ny * (cam.y - a[1]) < 0) { nx = -nx; ny = -ny; }   // face tournée vers la caméra
        const lit = (nx * sunH[0] + ny * sunH[1]) / sl, hi = clamp((a[2] + b[2]) / 2 / 220, 0, 1);
        const f = 0.82 + 0.26 * lit + 0.12 * hi;
        ctx.fillStyle = rgbStr(mixRgb(mixRgb(col, [200, 205, 214], hi * pc.rock * 0.4).map((v, k) => v * f * L.tint[k]), L.haze, fog));
        ctx.beginPath(); ctx.moveTo(top[i][0], top[i][1]); ctx.lineTo(top[i + 1][0], top[i + 1][1]);
        ctx.lineTo(baseRaw[i + 1][0], baseRaw[i + 1][1]); ctx.lineTo(baseRaw[i][0], baseRaw[i][1]); ctx.closePath(); ctx.fill();
      }
    }
    if (pc.snow) {
      const cap = pc.pts.map(p => cam.p(p[0], p[1], p[2] > SNOW_Z ? Math.max(SNOW_Z, p[2] - (p[2] - SNOW_Z) * 0.75 - 4) : p[2])).reverse();
      ctx.fillStyle = rgbStr(mixRgb(L.snow, L.haze, (1 - Math.exp(-d / 3200)) * 0.55));
      polyPath(ctx, [...top, ...cap]); ctx.fill();
    }
  }
}

// ---------------- Lac ----------------
function seaState(windKn, flowBearing) {
  const A = 0.03 + Math.pow(windKn / 14, 2) * 0.32;
  const k = 2 * Math.PI / (6 + windKn * 0.8);
  return { A, k, om: Math.sqrt(9.81 * k) * 0.8, dx: Math.sin(rad(flowBearing)), dy: Math.cos(rad(flowBearing)), foam: smooth((windKn - 18) / 12) };
}
function waveY(x, y, sea, t) {
  const p1 = sea.k * (x * sea.dx + y * sea.dy) - sea.om * t;
  const p2 = 1.9 * sea.k * (x * (sea.dx * 0.9 + sea.dy * 0.43) + y * (sea.dy * 0.9 - sea.dx * 0.43)) - 1.4 * sea.om * t + 1;
  return sea.A * (Math.sin(p1) - 0.15 * Math.cos(2 * p1)) + 0.35 * sea.A * Math.sin(p2);
}
function drawWater(ctx, cam, L, sea, t) {
  const hy = cam.cy + cam.pitch * cam.k;
  const near = mixRgb(hexToRgb("#3d7690"), [70, 80, 96], L.storm * 0.5), far = mixRgb(hexToRgb("#9ebfce"), L.haze, 0.35);
  const g = ctx.createLinearGradient(0, hy, 0, cam.h);
  g.addColorStop(0, rgbStr(far)); g.addColorStop(1, rgbStr(near));
  ctx.fillStyle = g; ctx.fillRect(-cam.w * 0.3, hy - 1, cam.w * 1.6, cam.h * 2);
  // reflet du soleil
  const sAz = norm180(L.sunB - cam.yaw), sx = cam.cx + sAz * cam.k;
  if (Math.abs(sAz) < 90) {
    const gr = ctx.createRadialGradient(sx, hy, 0, sx, hy, cam.w * 0.35);
    gr.addColorStop(0, `rgba(255,236,214,${0.32 * (1 - L.storm)})`); gr.addColorStop(1, "rgba(255,236,214,0)");
    ctx.fillStyle = gr; ctx.fillRect(-cam.w * 0.3, hy, cam.w * 1.6, cam.h * 0.6);
  }
  const rows = QUALITY.waterRows, azMax = Math.min(170, (cam.w * 0.7) / cam.k + 12), step = Math.max(1.5, azMax / 55);
  const rMax = 2600, rMin = Math.max(3, cam.z * 0.25), fac = Math.pow(rMax / rMin, 1 / rows);
  for (let r = rMax; r > rMin; r /= fac) {
    const tt = clamp(Math.log(r / rMin) / Math.log(rMax / rMin), 0, 1);
    ctx.beginPath();
    let first = true;
    for (let az = -azMax; az <= azMax + 0.01; az += step) {
      const a = rad(cam.yaw + az), wx = cam.x + r * Math.sin(a), wy = cam.y + r * Math.cos(a);
      const p = cam.p(wx, wy, waveY(wx, wy, sea, t));
      if (first) { ctx.moveTo(p[0], p[1]); first = false; } else ctx.lineTo(p[0], p[1]);
    }
    ctx.lineTo(cam.cx + azMax * cam.k, cam.h * 2); ctx.lineTo(cam.cx - azMax * cam.k, cam.h * 2); ctx.closePath();
    ctx.fillStyle = rgbStr(mixRgb(near, far, Math.pow(tt, 1.6)));
    ctx.fill();
    const crest = (0.04 + (1 - tt) * 0.12) * (0.35 + sea.foam * 2.2);
    if (crest > 0.02) { ctx.strokeStyle = `rgba(250,253,255,${clamp(crest, 0, 0.7)})`; ctx.lineWidth = 0.6 + (1 - tt) * (0.6 + sea.foam * 1.5); ctx.stroke(); }
  }
}

// ---------------- Rives : collines, vignes de Lavaux, falaises du Chablais ----------------
function drawLand(ctx, cam, L) {
  const list = [];
  for (const ch of LAND_CHUNKS) {
    const d = Math.hypot(ch.cx - cam.x, ch.cy - cam.y);
    const rows = ch.pts.map(s => s.map(p => cam.p(p[0], p[1], p[2])));
    const flat = rows.flat();
    if (flat.every(p => Math.abs(p[3]) > 95) || flat.some(p => Math.abs(p[3]) > 150)) continue;
    list.push({ ch, d, rows });
  }
  list.sort((a, b) => b.d - a.d);
  for (const { ch, d, rows } of list) {
    const base = LAND_COL[ch.use] || LAND_COL.green;
    for (let k = 2; k >= 0; k--) {   // bande lointaine, puis colline, puis rive
      const strip = [rows[0][k], rows[1][k], rows[2][k], rows[2][k + 1], rows[1][k + 1], rows[0][k + 1]];
      const c = hexToRgb(base).map((v, i) => v * L.tint[i] * (k === 0 ? 1 : k === 1 ? 0.93 : 0.97));
      ctx.fillStyle = rgbStr(mixRgb(c, L.haze, 1 - Math.exp(-(d + k * 90) / 2000)));
      polyPath(ctx, strip); ctx.fill();
    }
    if (d < 1800 && (ch.use === "vine" || ch.use === "cliff")) {   // terrasses de vigne ou stries de falaise
      ctx.strokeStyle = ch.use === "vine" ? "rgba(80,110,60,.35)" : "rgba(90,90,85,.35)"; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let j = 1; j < 6; j++) {
        const f = j / 6;
        for (let i = 0; i < 3; i++) {
          const a = rows[i][0], b = rows[i][1], x = lerp(a[0], b[0], f), y = lerp(a[1], b[1], f);
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
      }
      ctx.stroke();
    }
  }
}

// ---------------- Villes et monuments ----------------
function drawTowns(ctx, cam, L, t) {
  const items = [];
  if (QUALITY.buildings) {
    for (const b of BUILDINGS) {
      const dx = b.x - cam.x, dy = b.y - cam.y;
      if (Math.abs(dx) > 2600 || Math.abs(dy) > 2600) continue;
      const p = cam.p(b.x, b.y, b.z);
      if (Math.abs(p[3]) > 95) continue;
      const s = cam.k * 57.3 / p[2];
      if (b.w * s < 0.7) continue;
      items.push({ b, p, s, d: p[2] });
    }
  }
  for (const lm of LANDMARKS) {
    const p = cam.p(lm.x, lm.y, lm.z);
    if (Math.abs(p[3]) > 100 || p[2] > 4200) continue;
    items.push({ lm, p, s: cam.k * 57.3 / p[2], d: p[2] });
  }
  items.sort((a, b) => b.d - a.d);
  for (const it of items) {
    const fog = 1 - Math.exp(-it.d / 2000);
    if (it.b) {
      const { b, p, s } = it, w = b.w * s, h = b.h * s;
      ctx.fillStyle = rgbStr(mixRgb(hexToRgb(b.wall).map((v, i) => v * L.tint[i]), L.haze, fog));
      ctx.fillRect(p[0] - w / 2, p[1] - h, w, h);
      ctx.fillStyle = rgbStr(mixRgb(hexToRgb(b.roof), L.haze, fog));
      if (w > 3) { ctx.beginPath(); ctx.moveTo(p[0] - w * 0.55, p[1] - h); ctx.lineTo(p[0], p[1] - h - w * 0.28); ctx.lineTo(p[0] + w * 0.55, p[1] - h); ctx.closePath(); ctx.fill(); }
      else ctx.fillRect(p[0] - w / 2, p[1] - h - 1, w, 1);
      if (w > 7) { ctx.fillStyle = "rgba(60,80,110,.35)"; for (let yy = h * 0.25; yy < h * 0.9; yy += h * 0.28) ctx.fillRect(p[0] - w * 0.35, p[1] - h + yy, w * 0.7, Math.max(1, h * 0.08)); }
    } else drawLandmark(ctx, it.lm, it.p, it.s, L, fog, t);
  }
}
function drawLandmark(ctx, lm, p, s, L, fog, t) {
  const c = hex => rgbStr(mixRgb(hexToRgb(hex).map((v, i) => v * L.tint[i]), L.haze, fog));
  const [x, y] = p;
  ctx.save(); ctx.translate(x, y);
  const S = s * 1.6;   // monuments légèrement exagérés pour rester reconnaissables
  switch (lm.type) {
    case "chillon": {   // château sur son rocher
      ctx.fillStyle = c("#8e8f86"); ctx.beginPath(); ctx.ellipse(0, 0, 9 * S, 1.6 * S, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = c("#d9d2c3"); ctx.fillRect(-7 * S, -5 * S, 14 * S, 5 * S);
      ctx.fillRect(-2 * S, -9 * S, 4 * S, 4 * S);
      ctx.fillStyle = c("#b65a43");
      for (const [tx, tw, th] of [[-6, 2.2, 7], [-2, 4, 9], [5, 2.2, 6.5]]) { ctx.beginPath(); ctx.moveTo((tx - tw / 2) * S, -th * S); ctx.lineTo(tx * S, -(th + 3) * S); ctx.lineTo((tx + tw / 2) * S, -th * S); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = c("#d9d2c3"); ctx.fillRect(-7 * S, -7 * S, 2.2 * S, 2 * S); ctx.fillRect(3.9 * S, -6.5 * S, 2.2 * S, 1.5 * S);
      break;
    }
    case "fork": {   // la fourchette plantée dans le lac
      ctx.strokeStyle = c("#c3c8d2"); ctx.lineWidth = Math.max(1.5, 0.7 * S); ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -6 * S); ctx.stroke();
      ctx.lineWidth = Math.max(1, 0.35 * S);
      ctx.beginPath(); ctx.moveTo(-1.2 * S, -6 * S); ctx.lineTo(1.2 * S, -6 * S);
      for (const tx of [-1.2, -0.4, 0.4, 1.2]) { ctx.moveTo(tx * S, -6 * S); ctx.lineTo(tx * S, -8.5 * S); }
      ctx.stroke();
      break;
    }
    case "ouchy": {
      ctx.fillStyle = c("#e2d5bd"); ctx.fillRect(-6 * S, -4 * S, 12 * S, 4 * S);
      ctx.fillStyle = c("#cbb89a"); ctx.fillRect(-1.5 * S, -8 * S, 3 * S, 4 * S);
      ctx.fillStyle = c("#7a6a62"); ctx.beginPath(); ctx.moveTo(-1.8 * S, -8 * S); ctx.lineTo(0, -10.5 * S); ctx.lineTo(1.8 * S, -8 * S); ctx.closePath(); ctx.fill();
      break;
    }
    case "cathedral": {   // nef et clocher pointu
      ctx.fillStyle = c("#c9bfae"); ctx.fillRect(-7 * S, -4 * S, 12 * S, 4 * S);
      ctx.fillStyle = c("#7f6f66"); ctx.beginPath(); ctx.moveTo(-7.4 * S, -4 * S); ctx.lineTo(-1 * S, -6 * S); ctx.lineTo(5.4 * S, -4 * S); ctx.closePath(); ctx.fill();
      ctx.fillStyle = c("#c9bfae"); ctx.fillRect(4 * S, -9 * S, 2.6 * S, 9 * S);
      ctx.fillStyle = c("#6d7a72"); ctx.beginPath(); ctx.moveTo(3.8 * S, -9 * S); ctx.lineTo(5.3 * S, -13 * S); ctx.lineTo(6.8 * S, -9 * S); ctx.closePath(); ctx.fill();
      break;
    }
    case "palace": {   // grand hôtel blanc sur la colline, coupoles
      ctx.fillStyle = c("#f3f0e8"); ctx.fillRect(-9 * S, -5 * S, 18 * S, 5 * S);
      ctx.fillStyle = c("#d8d2c6"); for (let i = -8; i < 9; i += 2) ctx.fillRect(i * S, -4.2 * S, 0.8 * S, 3.4 * S);
      ctx.fillStyle = c("#9aa6a8");
      for (const dx of [-7, 0, 7]) { ctx.beginPath(); ctx.ellipse(dx * S, -5 * S, 1.6 * S, 1.6 * S, 0, Math.PI, 0); ctx.fill(); }
      break;
    }
    case "castle": {   // donjon médiéval
      ctx.fillStyle = c("#b7ab95"); ctx.fillRect(-5 * S, -3 * S, 10 * S, 3 * S); ctx.fillRect(-2 * S, -8 * S, 4 * S, 5 * S);
      ctx.fillStyle = c("#7d5a4c"); ctx.beginPath(); ctx.moveTo(-2.4 * S, -8 * S); ctx.lineTo(0, -11 * S); ctx.lineTo(2.4 * S, -8 * S); ctx.closePath(); ctx.fill();
      break;
    }
    case "castle_white": {   // château blanc à quatre tours
      ctx.fillStyle = c("#f1eee6"); ctx.fillRect(-5 * S, -5 * S, 10 * S, 5 * S);
      ctx.fillStyle = c("#f1eee6"); for (const dx of [-5, -1.5, 1.5, 5]) ctx.fillRect((dx - 0.9) * S, -7 * S, 1.8 * S, 2 * S);
      ctx.fillStyle = c("#8a6554"); for (const dx of [-5, -1.5, 1.5, 5]) { ctx.beginPath(); ctx.moveTo((dx - 1.1) * S, -7 * S); ctx.lineTo(dx * S, -9.5 * S); ctx.lineTo((dx + 1.1) * S, -7 * S); ctx.closePath(); ctx.fill(); }
      break;
    }
    case "lighthouse": {
      ctx.fillStyle = c("#f4f4f2"); ctx.fillRect(-0.6 * S, -4.5 * S, 1.2 * S, 4.5 * S);
      ctx.fillStyle = c("#3f9b6e"); ctx.fillRect(-0.8 * S, -5.4 * S, 1.6 * S, 0.9 * S);
      break;
    }
    case "jet": {   // Jet d'eau : colonne d'eau et panache qui dérive avec le vent
      const H = 28 * S, sway = Math.sin(t * 0.7) * 0.6 * S;
      const g = ctx.createLinearGradient(0, 0, 0, -H);
      g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(1, "rgba(255,255,255,.55)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-0.7 * S, 0); ctx.quadraticCurveTo(-0.3 * S, -H * 0.6, sway - 0.2 * S, -H); ctx.lineTo(sway + 0.4 * S, -H); ctx.quadraticCurveTo(0.5 * S, -H * 0.6, 0.7 * S, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.35)";
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(sway + (1.5 + i * 0.9) * S, -H + i * 1.6 * S, (1.2 + i * 0.5) * S, (0.8 + i * 0.3) * S, 0, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
  }
  ctx.restore();
}

// ---------------- Quai de chargement et pelle sur chenilles (départ) ----------------
const QUAY = (() => {
  const s = START, rx = s.nx, ry = s.ny;   // le quai est à tribord de la barge, parallèle au parcours
  const cx = s.x + rx * 15, cy = s.y + ry * 15;
  return { cx, cy, hdg: s.bearing, faces: [...box(-8, 8, -45, 45, -0.5, 2.6, "#b9b9b4", { noBottom: true, top: "#cfcfc9" })] };
})();
const DIGGER_FACES = [...box(-1.8, 1.8, -2.6, 2.6, 2.6, 3.6, "#3f4350", { noBottom: true }), ...box(-1.5, 1.5, -1.5, 1.5, 3.6, 6.2, "#f2b43c", { noBottom: true, tagFront: "windows" })];
function drawQuay(ctx, cam, L, t) {
  const d = Math.hypot(QUAY.cx - cam.x, QUAY.cy - cam.y);
  if (d > 1400) return;
  const pose = { x: QUAY.cx, y: QUAY.cy, hdg: QUAY.hdg, heelR: 0, pitchR: 0, heave: 0 };
  drawModel(ctx, cam, pose, QUAY.faces, L);
  // tas de gravier sur le quai
  for (const ly of [-30, -18, 26]) {
    const p = cam.p(...bargeToWorld(pose, 2, ly, 2.6)), s = cam.k * 57.3 / p[2];
    ctx.fillStyle = rgbStr(mixRgb(hexToRgb("#a99c88"), L.haze, 1 - Math.exp(-d / 2000)));
    ctx.beginPath(); ctx.moveTo(p[0] - 6 * s, p[1]); ctx.lineTo(p[0], p[1] - 4.5 * s); ctx.lineTo(p[0] + 6 * s, p[1]); ctx.closePath(); ctx.fill();
  }
  // pelle : tourelle qui pivote entre le tas et la cale de la barge
  const swing = RACE.state === "intro" || RACE.state === "count" || RACE.mode === "attract" ? Math.sin(t * 0.9) * 0.9 : 0.6;
  const dig = { x: QUAY.cx, y: QUAY.cy, hdg: QUAY.hdg - 90 + deg(swing) * 0.6, heelR: 0, pitchR: 0, heave: 0 };
  drawModel(ctx, cam, { ...pose }, box(-1.6, 1.6, -3, 3, 2.6, 3.4, "#2f333d", { noBottom: true }), L);
  drawModel(ctx, cam, dig, DIGGER_FACES, L);
  const boomA = bargeToWorld(dig, 0, 1.2, 5.6), boomB = bargeToWorld(dig, 0, 7.5, 9 + Math.sin(t * 1.8) * 1.2), bucket = bargeToWorld(dig, 0, 11, 4.5 + Math.sin(t * 1.8) * 1.5);
  const pa = cam.p(...boomA), pb = cam.p(...boomB), pc = cam.p(...bucket), s = cam.k * 57.3 / pa[2];
  ctx.strokeStyle = "#e9a92f"; ctx.lineWidth = Math.max(1.5, 0.9 * s); ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.lineTo(pc[0], pc[1]); ctx.stroke();
  ctx.fillStyle = "#4a4e5a"; ctx.beginPath(); ctx.arc(pc[0], pc[1], Math.max(2, 0.9 * s), 0, Math.PI * 2); ctx.fill();
}

// ---------------- Vent sur l'eau (inspiré de windy) : risées, pétole, traits animés ----------------
const PARTS = [];
function drawWindViz(ctx, cam, tau, dt, centerX, centerY, visScale) {
  // risées : taches sombres et frissonnantes ; pétole : plaques lisses et claires
  for (const g of GUSTS) {
    if (tau < g.t0 || tau > g.t0 + g.dur) continue;
    const [gx, gy] = gustCenter(g, tau), d = Math.hypot(gx - cam.x, gy - cam.y);
    if (d > 1500) continue;
    const env = gustEnv(g, tau);
    const pts = [];
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; pts.push(cam.p(gx + Math.cos(a) * g.r * 1.15, gy + Math.sin(a) * g.r * 0.85, 0)); }
    if (pts.some(p => Math.abs(p[3]) > 110)) continue;
    ctx.fillStyle = `rgba(25,55,95,${0.16 * env})`; polyPath(ctx, pts); ctx.fill();
    ctx.strokeStyle = colorAt(WIND_STOPS, (baseWind(0.5).kn + g.boost) / 40); ctx.globalAlpha = 0.35 * env; ctx.lineWidth = 1.2; ctx.stroke(); ctx.globalAlpha = 1;
  }
  for (const c of CALMS) {
    if (Math.hypot(c.x - cam.x, c.y - cam.y) > 1600) continue;
    const pts = [];
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; pts.push(cam.p(c.x + Math.cos(a) * c.r, c.y + Math.sin(a) * c.r * 0.8, 0)); }
    if (pts.some(p => Math.abs(p[3]) > 110)) continue;
    ctx.fillStyle = "rgba(235,245,250,.22)"; polyPath(ctx, pts); ctx.fill();
  }
  // traits de vent colorés selon la force
  const N = QUALITY.particles;
  while (PARTS.length < N) PARTS.push({ x: 0, y: 0, life: Math.random(), dead: true, wk: 0, wf: 0, n: 0 });
  PARTS.length = N;
  for (const pa of PARTS) {
    if (pa.dead || pa.life > 1 || Math.hypot(pa.x - centerX, pa.y - centerY) > 320) {
      const a = Math.random() * Math.PI * 2, r = 20 + Math.sqrt(Math.random()) * 300;
      pa.x = centerX + Math.cos(a) * r; pa.y = centerY + Math.sin(a) * r; pa.life = 0; pa.dead = !inLake(pa.x, pa.y); pa.n = 0;
      if (pa.dead) continue;
    }
    if (pa.n-- <= 0) { const w = windAt(pa.x, pa.y, tau); pa.wk = w.kn; pa.wf = w.from; pa.n = 4; }
    const to = rad(pa.wf + 180), sp = pa.wk * 1.8 * visScale;
    pa.x += Math.sin(to) * sp * dt; pa.y += Math.cos(to) * sp * dt; pa.life += dt * 0.45;
    const len = 6 + pa.wk * 0.7;
    const p1 = cam.p(pa.x, pa.y, 0.2), p0 = cam.p(pa.x - Math.sin(to) * len, pa.y - Math.cos(to) * len, 0.2);
    // les deux extrémités devant la caméra, sinon le trait traverserait tout l'écran
    if (Math.abs(p1[3]) > 100 || Math.abs(p0[3]) > 100 || p0[2] < 3 || p1[2] < 3) continue;
    ctx.strokeStyle = windColor(pa.wk);
    ctx.globalAlpha = Math.sin(pa.life * Math.PI) * 0.85;
    ctx.lineWidth = clamp(2.6 - p1[2] / 160, 0.8, 2.6);
    ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ---------------- Mini-carte ----------------
let MM = null;
function drawMinimap(mm, boat, tau, ghosts) {
  const { ctx, w, h } = mm;
  if (!MM || MM.w !== w || MM.h !== h) {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const [x, y] of LAKE_POLY) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const sc = Math.min((w - 12) / (x1 - x0), (h - 12) / (y1 - y0));
    MM = { w, h, sc, ox: (w - (x1 - x0) * sc) / 2 - x0 * sc, oy: (h - (y1 - y0) * sc) / 2 + y1 * sc };
  }
  const X = x => MM.ox + x * MM.sc, Y = y => MM.oy - y * MM.sc;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#cfe3ec"; ctx.strokeStyle = "#8fb0c2"; ctx.lineWidth = 1;
  ctx.beginPath(); LAKE_POLY.forEach(([x, y], i) => i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))); ctx.closePath(); ctx.fill(); ctx.stroke();
  // zone de tempête
  const sm = coursePoint(0.55 * COURSE_LEN);
  const gr = ctx.createRadialGradient(X(sm.x), Y(sm.y), 0, X(sm.x), Y(sm.y), 0.1 * COURSE_LEN * MM.sc);
  gr.addColorStop(0, "rgba(211,61,61,.35)"); gr.addColorStop(1, "rgba(211,61,61,0)");
  ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
  for (const g of GUSTS) { if (tau < g.t0 || tau > g.t0 + g.dur) continue; const [gx, gy] = gustCenter(g, tau); ctx.fillStyle = windColor(18 + g.boost); ctx.globalAlpha = 0.6 * gustEnv(g, tau); ctx.beginPath(); ctx.arc(X(gx), Y(gy), Math.max(1.5, g.r * MM.sc), 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;
  ctx.setLineDash([3, 3]); ctx.strokeStyle = "rgba(124,108,240,.7)";
  ctx.beginPath(); COURSE.forEach(([x, y], i) => i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))); ctx.stroke(); ctx.setLineDash([]);
  if (ghosts) ghosts.forEach((gh, gi) => {
    ctx.strokeStyle = GHOST_COLS[gi]; ctx.lineWidth = 1; ctx.globalAlpha = 0.7;
    ctx.beginPath(); gh.track.forEach((q, i) => i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1]))); ctx.stroke(); ctx.globalAlpha = 1;
  });
  for (const l of CGN_LINES) { const st = cgnState(l, tau); ctx.fillStyle = "#fff"; ctx.strokeStyle = "#2c3a58"; ctx.beginPath(); ctx.arc(X(st.x), Y(st.y), 2.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = "#262b45"; ctx.font = "11px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("🏁", X(FINISH.x), Y(FINISH.y) - 6);
  ctx.save(); ctx.translate(X(boat.x), Y(boat.y)); ctx.rotate(rad(boat.hdg));
  ctx.fillStyle = "#7c6cf0"; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4, 5); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill();
  ctx.restore();
}
