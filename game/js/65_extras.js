// ================================================================
//  ACTEURS DU DÉCOR : essais de l'équipe Aether devant l'EPFL, bateau pirate et requins dans la tempête
// ================================================================

// --- Essais Aether : un semi-rigide tracte en rond un petit catamaran portant la machine de contrôle du kite.
// Cycle de 40 s : le kite vole en 8, s'écrase, les bateaux s'arrêtent, puis relancent l'aile.
const AE_TEST = { cx: -2.5 * SCALE, cy: 9.0 * SCALE, R: 60, phi: 0, v: 1, last: 0 };
const AE_CYCLE = 40, AE_LINE = 40;
const RIB_FACES = [
  ...box(-1.3, -0.8, -3.4, 3.2, 0, 0.6, "#4a5161", { noBottom: true }), ...box(0.8, 1.3, -3.4, 3.2, 0, 0.6, "#4a5161", { noBottom: true }),
  ...box(-0.8, 0.8, -3.4, 3.0, 0, 0.35, "#f2f2f2", { noBottom: true }), ...box(-0.45, 0.45, -0.6, 0.4, 0.35, 1.4, "#e9ecf2", { noBottom: true }),
  ...box(-0.25, 0.25, -1.5, -1.05, 0.35, 1.9, "#e8574a", { noBottom: true }), ...box(-0.3, 0.3, -3.8, -3.4, 0.2, 1.1, "#2a2f3a", { noBottom: true })
];
const CAT_FACES = [
  ...box(-1.4, -1.0, -2.6, 2.6, 0, 0.5, "#ffffff", { noBottom: true }), ...box(1.0, 1.4, -2.6, 2.6, 0, 0.5, "#ffffff", { noBottom: true }),
  ...box(-1.4, 1.4, -1.0, -0.7, 0.5, 0.65, "#9aa3b5", { noBottom: true }), ...box(-1.4, 1.4, 0.8, 1.1, 0.5, 0.65, "#9aa3b5", { noBottom: true }),
  ...box(-0.55, 0.55, -0.6, 0.6, 0.65, 1.4, "#1f3a68", { noBottom: true, top: "#e2001a" }), ...box(-0.07, 0.07, -0.07, 0.07, 1.4, 2.4, "#d0d4dc", { noBottom: true })
];
function aetherPhase(tc) {   // vitesse relative des bateaux et état du kite selon la phase du cycle
  if (tc < 28) return { v: 1, kite: "fly", k: 0 };
  if (tc < 30) return { v: 1 - (tc - 28) / 2, kite: "crash", k: (tc - 28) / 2 };
  if (tc < 35) return { v: 0, kite: "down", k: 1 };
  return { v: clamp((tc - 35) / 3, 0, 1), kite: "launch", k: (tc - 35) / 5 };
}
function drawAetherTest(ctx, cam, L, t) {
  const A = AE_TEST, dt = clamp(t - A.last, 0, 0.1); A.last = t;
  if (Math.hypot(A.cx - cam.x, A.cy - cam.y) > 3200) return;
  const tc = t % AE_CYCLE, ph = aetherPhase(tc);
  A.v = lerp(A.v, ph.v, damp(1.5, dt));
  A.phi += A.v * 3.2 / A.R * dt;   // 3,2 m/s le long du cercle
  const at = phi => ({ x: A.cx + Math.cos(phi) * A.R, y: A.cy + Math.sin(phi) * A.R, hdg: norm360(deg(Math.atan2(-Math.sin(phi), Math.cos(phi)))) });
  const rib = at(A.phi), cat = at(A.phi - 18 / A.R);
  const bob = Math.sin(t * 2.1) * 0.05;
  const bRib = { x: rib.x, y: rib.y, hdg: rib.hdg, heelR: 0.08 * A.v, pitchR: 0.06 * A.v + bob, heave: 0.1 };
  const bCat = { x: cat.x, y: cat.y, hdg: cat.hdg, heelR: bob, pitchR: 0.02, heave: 0.05 };
  // remorque
  const pr = cam.p(...bargeToWorld(bRib, 0, -3.6, 0.6)), pc = cam.p(...bargeToWorld(bCat, 0, 2.6, 0.5));
  if (Math.abs(pr[3]) < 100 && Math.abs(pc[3]) < 100) { ctx.strokeStyle = "rgba(240,240,240,.8)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pr[0], pr[1]); ctx.lineTo(pc[0], pc[1]); ctx.stroke(); }
  // sillages
  if (A.v > 0.2) for (const st of [rib, cat]) for (let i = 1; i < 5; i++) {
    const q = cam.p(st.x - Math.sin(rad(st.hdg)) * i * 2.5, st.y - Math.cos(rad(st.hdg)) * i * 2.5, 0.1);
    if (Math.abs(q[3]) > 100) continue;
    const s = cam.k * 57.3 / q[2]; ctx.fillStyle = `rgba(255,255,255,${0.5 * A.v / i})`;
    ctx.beginPath(); ctx.ellipse(q[0], q[1], (1 + i * 0.5) * s, 0.3 * s, 0, 0, Math.PI * 2); ctx.fill();
  }
  drawModel(ctx, cam, bCat, CAT_FACES, L);
  drawModel(ctx, cam, bRib, RIB_FACES, L);
  // kite d'essai : 8 dans sa fenêtre sous le vent, chute, puis relance
  const w = windAt(cat.x, cat.y, RACE.tau || 0.3), down = w.from + 180;
  let el, az = down;
  if (ph.kite === "fly") { el = 32 + 10 * Math.sin(t * 2 * Math.PI / 3.2); az = down + 38 * Math.sin(t * Math.PI / 3.2); }
  else if (ph.kite === "crash") { el = lerp(30, 0, smooth(ph.k)); az = down + 50 * ph.k; }
  else if (ph.kite === "down") el = 0;
  else { el = lerp(0, 32, smooth(clamp(ph.k, 0, 1))); }
  const anc = bargeToWorld(bCat, 0, 0, 1.4), e = rad(el), a = rad(az);
  const kp = [anc[0] + AE_LINE * Math.cos(e) * Math.sin(a), anc[1] + AE_LINE * Math.cos(e) * Math.cos(a), Math.max(0.2, anc[2] + AE_LINE * Math.sin(e))];
  const p0 = cam.p(...anc), p1 = cam.p(...kp);
  if (Math.abs(p0[3]) > 100 || Math.abs(p1[3]) > 100) return;
  ctx.strokeStyle = "rgba(40,50,70,.6)"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
  const span = clamp(cam.k * 57.3 * 9 / p1[2], 6, 80);
  if (el < 1) {   // aile posée à plat sur l'eau
    ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.beginPath(); ctx.ellipse(p1[0], p1[1], span * 0.5, span * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#e2001a"; ctx.fillRect(p1[0] - span * 0.12, p1[1] - span * 0.04, span * 0.24, span * 0.08);
  } else drawParagliderFront(ctx, p1[0], p1[1], span, ph.kite === "crash" ? 1.4 * ph.k : 0.5 * Math.cos(t * Math.PI / 3.2), 1);
}

// --- Bateau pirate qui croise dans la zone de tempête (abordage = +5 s)
const PIRATE_FACES = (() => {
  const F = [], HULL = "#4b2f1e", WOOD = "#3a2a1c", SAIL = "#1d1d22";
  F.push(...box(-4, 4, -12, 11, -1, 3.5, HULL, { noBottom: true }), ...box(-4.05, 4.05, -12, 11, 2.5, 2.9, "#c9a34a", { noBottom: true }));
  F.push(face([[-4, 11, -1], [0, 17, 1], [4, 11, -1]], HULL, [0, 1, -0.3]), face([[-4, 11, 3.5], [0, 17, 3.8], [4, 11, 3.5]], "#6b4a33", [0, 0, 1]));
  F.push(face([[-4, 11, -1], [0, 17, 1], [0, 17, 3.8], [-4, 11, 3.5]], HULL, [-1, 0.5, 0]), face([[4, 11, -1], [4, 11, 3.5], [0, 17, 3.8], [0, 17, 1]], HULL, [1, 0.5, 0]));
  F.push(...box(-4, 4, -12, -6.5, 3.5, 7, "#5b3b26", { noBottom: true }), ...box(-0.18, 0.18, 16, 22, 3.6, 4.2, WOOD, { noBottom: true }));
  for (const [y, h] of [[-3.5, 20], [3.5, 24], [9, 17]]) {
    F.push(...box(-0.28, 0.28, y - 0.28, y + 0.28, 3.5, h + 2, WOOD, { noBottom: true }));
    F.push(...box(-3.6, 3.6, y - 0.12, y + 0.12, h * 0.42, h * 0.62, SAIL, { noBottom: true }), ...box(-3.0, 3.0, y - 0.12, y + 0.12, h * 0.68, h * 0.9, SAIL, { noBottom: true }));
  }
  return F;
})();
function pirateState(tau, t) {
  const base = coursePoint(0.535 * COURSE_LEN), u = Math.sin(tau * 9);
  const x = base.x + base.nx * 95 + base.dx * 70 * u, y = base.y + base.ny * 95 + base.dy * 70 * u;
  return { x, y, hdg: norm360(base.bearing + (Math.cos(tau * 9) > 0 ? 0 : 180)), heelR: Math.sin(t * 0.9) * 0.12, pitchR: Math.sin(t * 1.3) * 0.05, heave: Math.sin(t * 1.1) * 0.6 };
}
function drawPirate(ctx, cam, L, tau, t) {
  const b = pirateState(tau, t);
  if (Math.hypot(b.x - cam.x, b.y - cam.y) > 1800) return;
  drawModel(ctx, cam, b, PIRATE_FACES, L);
  // pavillon noir à tête de mort en haut du grand mât
  const p = cam.p(...bargeToWorld(b, 0, 3.5, 26.5));
  if (Math.abs(p[3]) > 100) return;
  const s = cam.k * 57.3 / p[2], fw = 4.2 * s, fh = 2.8 * s, flap = Math.sin(t * 6) * 0.3 * s;
  ctx.fillStyle = "#111"; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + fw, p[1] + flap); ctx.lineTo(p[0] + fw, p[1] + fh + flap); ctx.lineTo(p[0], p[1] + fh); ctx.closePath(); ctx.fill();
  if (fw > 6) {
    ctx.fillStyle = "#f2f2f2"; ctx.beginPath(); ctx.arc(p[0] + fw * 0.5, p[1] + fh * 0.42, fh * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#f2f2f2"; ctx.lineWidth = Math.max(0.6, fh * 0.07);
    ctx.beginPath(); ctx.moveTo(p[0] + fw * 0.3, p[1] + fh * 0.62); ctx.lineTo(p[0] + fw * 0.7, p[1] + fh * 0.88); ctx.moveTo(p[0] + fw * 0.7, p[1] + fh * 0.62); ctx.lineTo(p[0] + fw * 0.3, p[1] + fh * 0.88); ctx.stroke();
  }
}

// --- Requins : ailerons qui tournent autour de la route dans la zone de tempête
const SHARKS = (() => { const r = rng(66); return Array.from({ length: 7 }, () => ({ f: 0.49 + r() * 0.11, off: (r() - 0.5) * 140, R: 10 + r() * 14, w: (0.35 + r() * 0.3) * (r() < 0.5 ? -1 : 1), ph: r() * 6.3 })); })();
function sharkPos(sh, t) {
  const c = coursePoint(sh.f * COURSE_LEN), a = sh.ph + t * sh.w;
  return { x: c.x + c.nx * sh.off + Math.cos(a) * sh.R, y: c.y + c.ny * sh.off + Math.sin(a) * sh.R, a };
}
function drawSharks(ctx, cam, t) {
  for (const sh of SHARKS) {
    const q = sharkPos(sh, t);
    if (Math.hypot(q.x - cam.x, q.y - cam.y) > 700) continue;
    const p = cam.p(q.x, q.y, 0), tip = cam.p(q.x, q.y, 1.3);
    if (Math.abs(p[3]) > 100) continue;
    const s = cam.k * 57.3 / p[2], dir = Math.sign(Math.cos(q.a + Math.PI / 2 - rad(cam.yaw))) || 1;
    ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.ellipse(p[0], p[1], 1.6 * s, 0.25 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#4a5466"; ctx.beginPath(); ctx.moveTo(p[0] - 0.7 * s * dir, p[1]); ctx.quadraticCurveTo(p[0] - 0.1 * s * dir, tip[1] + 0.3 * s, p[0] + 0.45 * s * dir, tip[1]); ctx.lineTo(p[0] + 0.55 * s * dir, p[1]); ctx.closePath(); ctx.fill();
  }
}
