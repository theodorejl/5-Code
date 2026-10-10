// ================================================================
//  BARGE À GRAVIER (40 m) : maquette 3D en facettes, éclairée selon la position du soleil
//  Repère local : lx vers tribord, ly vers l'avant, lz vers le haut, origine au milieu, à la flottaison.
// ================================================================
function face(pts, col, nrm, tag) { return { pts, col, n: nrm, tag }; }
function box(x0, x1, y0, y1, z0, z1, col, opts = {}) {
  const f = [];
  if (!opts.noBottom) f.push(face([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], col, [0, 0, -1]));
  f.push(face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], opts.top || col, [0, 0, 1]));
  f.push(face([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], col, [0, -1, 0], opts.tagBack));
  f.push(face([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], col, [0, 1, 0], opts.tagFront));
  f.push(face([[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], col, [-1, 0, 0], opts.tagSide));
  f.push(face([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], col, [1, 0, 0], opts.tagSide));
  return f;
}
const BARGE_FACES = (() => {
  const F = [];
  const NAVY = "#33415f", RED = "#b9524f", WHITE = "#eef0f4", DECK = "#7c8597", GRAVEL = "#a79a86";
  for (const s of [-1, 1]) {
    const x = 4 * s;
    F.push(face([[x, -20, -0.3], [x, 15, -0.3], [x, 15, 0.35], [x, -20, 0.35]], RED, [s, 0, 0]));
    F.push(face([[x, -20, 0.35], [x, 15, 0.35], [x, 15, 1.3], [x, -20, 1.3]], NAVY, [s, 0, 0]));
    F.push(face([[x, -20, 1.3], [x, 15, 1.3], [x, 15, 1.6], [x, -20, 1.6]], WHITE, [s, 0, 0]));
    F.push(face([[x, 15, -0.3], [2.2 * s, 18.5, -0.3], [2.2 * s, 20, 1.6], [x, 15, 1.6]], NAVY, [0.9 * s, 0.45, 0]));
  }
  F.push(face([[-2.2, 18.5, -0.3], [2.2, 18.5, -0.3], [2.2, 20, 1.6], [-2.2, 20, 1.6]], NAVY, [0, 0.75, 0.66]));
  F.push(face([[-4, -20, -0.3], [4, -20, -0.3], [4, -20, 1.6], [-4, -20, 1.6]], NAVY, [0, -1, 0], "transom"));
  F.push(face([[-4, -20, 1.6], [4, -20, 1.6], [4, 15, 1.6], [2.2, 20, 1.6], [-2.2, 20, 1.6], [-4, 15, 1.6]], DECK, [0, 0, 1]));
  // hiloires de la cale
  F.push(...box(-3.4, 3.4, -12, 14, 1.6, 2.5, "#d8dbe2", { noBottom: true, top: "#c7ccd6" }));
  // tas de gravier
  F.push(face([[-3.4, -11.6, 2.5], [-3.4, 13.6, 2.5], [0, 12.4, 4.4], [0, -10.4, 4.4]], GRAVEL, [-0.47, 0, 0.88], "gravelL"));
  F.push(face([[3.4, -11.6, 2.5], [3.4, 13.6, 2.5], [0, 12.4, 4.4], [0, -10.4, 4.4]], GRAVEL, [0.47, 0, 0.88], "gravelR"));
  F.push(face([[-3.4, 13.6, 2.5], [3.4, 13.6, 2.5], [0, 12.4, 4.4]], GRAVEL, [0, 0.85, 0.53]));
  F.push(face([[-3.4, -11.6, 2.5], [3.4, -11.6, 2.5], [0, -10.4, 4.4]], GRAVEL, [0, -0.85, 0.53]));
  // timonerie, toit, cheminée, treuil du kite
  F.push(...box(-2.6, 2.6, -19.2, -15, 1.6, 5.4, WHITE, { noBottom: true, tagFront: "windows", tagSide: "windowsSide" }));
  F.push(...box(-2.9, 2.9, -19.6, -14.6, 5.4, 5.65, "#d7dce6", { noBottom: true }));
  F.push(...box(1.5, 2.2, -19.9, -19.2, 1.6, 7.0, "#3c4559", { noBottom: true }));
  F.push(...box(-0.8, 0.8, 15.6, 16.8, 1.6, 2.4, "#9aa3b5", { noBottom: true }));
  return F;
})();
// mouchetures du gravier (petits points clairs et foncés), calculées une fois
const GRAVEL_DOTS = (() => {
  const r = rng(11), d = [];
  for (let i = 0; i < 90; i++) {
    const side = r() < 0.5 ? -1 : 1, t = r(), ly = lerp(-10.5, 12.5, r());
    d.push([side * 3.4 * (1 - t), ly, 2.5 + 1.9 * t, r() < 0.5 ? "rgba(255,255,255,.35)" : "rgba(60,50,40,.3)"]);
  }
  return d;
})();
const BARGE_ANCHOR = [0, 18.2, 9.2];   // point d'attache du kite en haut du mât avant
const BARGE_EXHAUST = [1.85, -19.55, 7.1];

// transformation locale → monde (cap, gîte, assiette, pilonnement)
function bargeToWorld(b, lx, ly, lz) {
  const cp = Math.cos(b.pitchR), sp = Math.sin(b.pitchR), ch = Math.cos(b.heelR), sh = Math.sin(b.heelR);
  const ly1 = ly * cp - lz * sp, lz1 = ly * sp + lz * cp;
  const lx2 = lx * ch + lz1 * sh, lz2 = lz1 * ch - lx * sh;
  const hr = rad(b.hdg), c = Math.cos(hr), s = Math.sin(hr);
  return [b.x + lx2 * c + ly1 * s, b.y - lx2 * s + ly1 * c, lz2 + b.heave];
}
function rotNormal(b, n) {
  const p0 = bargeToWorld({ ...b, x: 0, y: 0, heave: 0 }, 0, 0, 0), p1 = bargeToWorld({ ...b, x: 0, y: 0, heave: 0 }, n[0], n[1], n[2]);
  return [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
}
// dessin générique d'un modèle à facettes (barge, vapeurs CGN) avec élimination des faces cachées
function drawModel(ctx, cam, b, faces, light, extras) {
  const list = [];
  for (const f of faces) {
    const wp = f.pts.map(p => bargeToWorld(b, p[0], p[1], p[2]));
    const c = wp.reduce((a, p) => [a[0] + p[0] / wp.length, a[1] + p[1] / wp.length, a[2] + p[2] / wp.length], [0, 0, 0]);
    const n = rotNormal(b, f.n);
    const v = [cam.x - c[0], cam.y - c[1], cam.z - c[2]];
    if (n[0] * v[0] + n[1] * v[1] + n[2] * v[2] <= 0) continue;
    const pp = wp.map(p => cam.p(p[0], p[1], p[2]));
    if (pp.some(p => Math.abs(p[3]) > 120)) continue;
    const lit = clamp(0.62 + 0.48 * Math.max(0, n[0] * light.sun[0] + n[1] * light.sun[1] + n[2] * light.sun[2]), 0.45, 1.12);
    list.push({ f, pp, d: Math.hypot(v[0], v[1], v[2]), lit });
  }
  list.sort((a, b2) => b2.d - a.d);
  for (const it of list) {
    const [r, g, bb] = hexToRgb(it.f.col);
    const tint = light.tint;
    ctx.fillStyle = `rgb(${clamp(r * it.lit * tint[0], 0, 255) | 0},${clamp(g * it.lit * tint[1], 0, 255) | 0},${clamp(bb * it.lit * tint[2], 0, 255) | 0})`;
    ctx.beginPath(); it.pp.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(30,40,60,.16)"; ctx.lineWidth = 0.6; ctx.stroke();
    if (extras) extras(it.f.tag, it.pp);
  }
}
function drawBarge(ctx, cam, b, light) {
  const wl = [];
  drawModel(ctx, cam, b, BARGE_FACES, light, (tag, pp) => {
    if (tag === "windows" || tag === "windowsSide") {
      // bandeau vitré de la timonerie (entre 60 % et 85 % de la hauteur de la face)
      const [a, b2, c, d] = pp;
      const at = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
      const q = [at(a, d, 0.62), at(b2, c, 0.62), at(b2, c, 0.86), at(a, d, 0.86)];
      ctx.fillStyle = "rgba(40,60,90,.75)";
      ctx.beginPath(); q.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill();
    }
    if (tag === "gravelL" || tag === "gravelR") wl.push(tag);
  });
  // mouchetures du gravier (seulement si la barge est assez grande à l'écran)
  const scale = cam.k * 57.3 / Math.max(1, Math.hypot(cam.x - b.x, cam.y - b.y));
  if (scale > 1.2) {
    for (const [lx, ly, lz, col] of GRAVEL_DOTS) {
      const w = bargeToWorld(b, lx, ly, lz + 0.05), p = cam.p(w[0], w[1], w[2]);
      const d = clamp(scale * 0.25, 1, 2.5);
      ctx.fillStyle = col; ctx.fillRect(p[0], p[1], d, d);
    }
  }
  // mât en A du kite et antenne
  const line = (a, c, col, wdt) => {
    const p1 = cam.p(...bargeToWorld(b, ...a)), p2 = cam.p(...bargeToWorld(b, ...c));
    ctx.strokeStyle = col; ctx.lineWidth = wdt; ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
  };
  const lw = Math.max(1, scale * 0.35);
  line([-1.3, 17.2, 1.6], BARGE_ANCHOR, "#e4e8ef", lw); line([1.3, 17.2, 1.6], BARGE_ANCHOR, "#e4e8ef", lw);
  line([0, -17, 5.65], [0, -17, 8.4], "#5a6478", Math.max(1, lw * 0.6));
  line([-1.2, -17, 7.6], [1.2, -17, 7.6], "#5a6478", Math.max(1, lw * 0.6));
  const a = cam.p(...bargeToWorld(b, ...BARGE_ANCHOR));
  ctx.fillStyle = "#f07d9c"; ctx.beginPath(); ctx.arc(a[0], a[1], Math.max(2, lw * 1.2), 0, Math.PI * 2); ctx.fill();
  return { anchor: bargeToWorld(b, ...BARGE_ANCHOR), anchorScreen: a, exhaust: cam.p(...bargeToWorld(b, ...BARGE_EXHAUST)) };
}

// Vapeur Belle Époque de la CGN : coque blanche, roues à aubes, deux cheminées crème
const CGN_FACES = (() => {
  const F = [], WHITE = "#f4f4f0", NAVY = "#2c3a58", CREAM = "#e9d9a8";
  for (const s of [-1, 1]) {
    F.push(face([[4.5 * s, -30, -0.2], [4.5 * s, 26, -0.2], [4.5 * s, 26, 2.2], [4.5 * s, -30, 2.2]], WHITE, [s, 0, 0]));
    F.push(face([[4.5 * s, -30, -0.2], [4.5 * s, 26, -0.2], [4.5 * s, 26, 0.4], [4.5 * s, -30, 0.4]], NAVY, [s, 0, 0]));
    F.push(face([[4.5 * s, 26, -0.2], [0.5 * s, 31, -0.2], [0.5 * s, 31, 2.4], [4.5 * s, 26, 2.2]], WHITE, [0.8 * s, 0.6, 0]));
  }
  F.push(face([[-4.5, -30, -0.2], [4.5, -30, -0.2], [4.5, -30, 2.2], [-4.5, -30, 2.2]], WHITE, [0, -1, 0]));
  F.push(face([[-4.5, -30, 2.2], [4.5, -30, 2.2], [4.5, 26, 2.2], [0.5, 31, 2.4], [-0.5, 31, 2.4], [-4.5, 26, 2.2]], "#c9b28a", [0, 0, 1]));
  F.push(...box(-6.4, 6.4, -3, 4, 0.2, 3.6, WHITE, { noBottom: true }));   // tambours des roues à aubes
  F.push(...box(-3.6, 3.6, -22, 18, 2.2, 5.0, WHITE, { noBottom: true, tagSide: "windowsSide", tagFront: "windows" }));
  F.push(...box(-3.9, 3.9, -23, 19, 5.0, 5.25, "#e2e2dc", { noBottom: true }));
  F.push(...box(-0.9, 0.9, -6, -4.2, 5.2, 9.6, CREAM, { noBottom: true }));
  F.push(...box(-0.9, 0.9, 5, 6.8, 5.2, 9.6, CREAM, { noBottom: true }));
  return F;
})();
function drawCgn(ctx, cam, st, light) {
  const b = { x: st.x, y: st.y, hdg: st.hdg, heelR: 0, pitchR: 0, heave: 0 };
  drawModel(ctx, cam, b, CGN_FACES, light, (tag, pp) => {
    if (tag === "windows" || tag === "windowsSide") {
      const [a, b2, c, d] = pp, at = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
      ctx.fillStyle = "rgba(50,70,100,.55)";
      const q = [at(a, d, 0.4), at(b2, c, 0.4), at(b2, c, 0.75), at(a, d, 0.75)];
      ctx.beginPath(); q.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill();
    }
  });
  // drapeau suisse à la poupe
  const fp = cam.p(...bargeToWorld(b, 0, -29, 7)), sc = cam.k * 57.3 / Math.max(1, Math.hypot(cam.x - st.x, cam.y - st.y));
  if (sc > 0.6) {
    const s = Math.max(3, sc * 2.2);
    ctx.fillStyle = "#d52b1e"; ctx.fillRect(fp[0], fp[1] - s, s * 1.2, s);
    ctx.fillStyle = "#fff"; ctx.fillRect(fp[0] + s * 0.5, fp[1] - s * 0.8, s * 0.2, s * 0.6); ctx.fillRect(fp[0] + s * 0.3, fp[1] - s * 0.6, s * 0.6, s * 0.2);
  }
}
