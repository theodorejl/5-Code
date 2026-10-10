// ================================================================
//  LE LÉMAN : géographie, relief, villes, météo de course et obstacles
//  Monde du jeu : x vers l'est, y vers le nord, z vers le haut, en « mètres de jeu ».
//  SCALE m de jeu par km réel : les angles du paysage sont ceux de la réalité (relief exagéré de VEX),
//  la barge (40 m) et les bateaux gardent leur taille réelle pour rester lisibles.
// ================================================================
const SCALE = GEO.scale, VEX = GEO.vex;
const zOf = altAboveLake => altAboveLake / 1000 * SCALE * VEX;        // m au-dessus du lac → hauteur de jeu
const toShore = p => ({ x: p[0] * SCALE, y: p[1] * SCALE, h1: zOf(p[2]), h2: zOf(p[3]), use: p[4] });
const SHORE_N = GEO.north.map(toShore), SHORE_S = GEO.south.map(toShore);
const LAKE_POLY = [...SHORE_N, ...SHORE_S.slice(1, -1).reverse()].map(p => [p.x, p.y]);

function inLake(x, y) {
  let c = false;
  for (let i = 0, j = LAKE_POLY.length - 1; i < LAKE_POLY.length; j = i++) {
    const [x1, y1] = LAKE_POLY[i], [x2, y2] = LAKE_POLY[j];
    if ((y1 > y) !== (y2 > y) && x < (x2 - x1) * (y - y1) / (y2 - y1) + x1) c = !c;
  }
  return c;
}
// point le plus proche sur la rive (pour les échouages)
function nearestShore(x, y) {
  let best = null, bd = 1e18;
  for (let i = 0, j = LAKE_POLY.length - 1; i < LAKE_POLY.length; j = i++) {
    const [x1, y1] = LAKE_POLY[j], [x2, y2] = LAKE_POLY[i];
    const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy || 1;
    const t = clamp(((x - x1) * dx + (y - y1) * dy) / L2, 0, 1);
    const px = x1 + dx * t, py = y1 + dy * t, d = (x - px) ** 2 + (y - py) ** 2;
    if (d < bd) { bd = d; best = { x: px, y: py, d: Math.sqrt(d) }; }
  }
  return best;
}

// ---------------- Parcours ----------------
const COURSE = GEO.course.map(p => [p[0] * SCALE, p[1] * SCALE]);
const COURSE_CUM = [0];
for (let i = 1; i < COURSE.length; i++) COURSE_CUM.push(COURSE_CUM[i - 1] + Math.hypot(COURSE[i][0] - COURSE[i - 1][0], COURSE[i][1] - COURSE[i - 1][1]));
const COURSE_LEN = COURSE_CUM[COURSE_CUM.length - 1];
function coursePoint(s) {
  s = clamp(s, 0, COURSE_LEN);
  let i = 1;
  while (i < COURSE.length - 1 && COURSE_CUM[i] < s) i++;
  const [x1, y1] = COURSE[i - 1], [x2, y2] = COURSE[i], L = COURSE_CUM[i] - COURSE_CUM[i - 1];
  const t = (s - COURSE_CUM[i - 1]) / L, dx = (x2 - x1) / L, dy = (y2 - y1) / L;
  return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t, dx, dy, nx: dy, ny: -dx, bearing: norm360(deg(Math.atan2(dx, dy))) };
}
// projection d'un point sur le parcours : abscisse s (m) et écart latéral (positif = à droite du sens de course)
function courseProject(x, y) {
  let best = { s: 0, lat: 0, d: 1e18 };
  for (let i = 1; i < COURSE.length; i++) {
    const [x1, y1] = COURSE[i - 1], [x2, y2] = COURSE[i];
    const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy;
    const t = clamp(((x - x1) * dx + (y - y1) * dy) / L2, 0, 1);
    const px = x1 + dx * t, py = y1 + dy * t, d = (x - px) ** 2 + (y - py) ** 2;
    if (d < best.d) {
      const L = Math.sqrt(L2);
      best = { s: COURSE_CUM[i - 1] + t * L, lat: ((x - px) * dy - (y - py) * dx) / L, d };
    }
  }
  return best;
}
const START = coursePoint(0), FINISH = coursePoint(COURSE_LEN);

// ---------------- Relief : bandes côtières (collines, vignes, falaises) ----------------
const LAND_COL = { green: "#8fae7f", town: "#b9b59f", vine: "#86a868", forest: "#6f9670", cliff: "#9a9a8e" };
function buildShoreChunks(shore, inlandSign) {
  const chunks = [];
  for (let i = 0; i < shore.length - 1; i++) {
    const a = shore[i], b = shore[i + 1];
    const segLen = Math.hypot(b.x - a.x, b.y - a.y), parts = Math.max(1, Math.round(segLen / 130));
    const dx = (b.x - a.x) / segLen, dy = (b.y - a.y) / segLen;
    const nx = inlandSign * dy, ny = -inlandSign * dx;
    for (let k = 0; k < parts; k++) {
      const pts = [];
      for (const t of [k / parts, (k + 0.5) / parts, (k + 1) / parts]) {
        const x = lerp(a.x, b.x, t), y = lerp(a.y, b.y, t), h1 = lerp(a.h1, b.h1, t), h2 = lerp(a.h2, b.h2, t);
        const wob = Math.sin(x * 0.013 + y * 0.009) * 0.18 + 1;
        pts.push([
          [x, y, 0],
          [x + nx * 1.2 * SCALE, y + ny * 1.2 * SCALE, h1 * wob],
          [x + nx * 3.5 * SCALE, y + ny * 3.5 * SCALE, h2 * wob],
          [x + nx * 14 * SCALE, y + ny * 14 * SCALE, h2 * 0.75]
        ]);
      }
      const use = t => (t < 0.5 ? a.use : b.use);
      chunks.push({ pts, use: use((k + 0.5) / parts), cx: lerp(a.x, b.x, (k + 0.5) / parts) + nx * 60, cy: lerp(a.y, b.y, (k + 0.5) / parts) + ny * 60 });
    }
  }
  return chunks;
}
const LAND_CHUNKS = [...buildShoreChunks(SHORE_N, 1), ...buildShoreChunks(SHORE_S, -1)];

// ---------------- Montagnes (Chablais, Dents du Midi, Jura, Salève, Mont-Blanc…) ----------------
const SNOW_Z = zOf(2300 - GEO.lake_alt);
const RANGE_PIECES = [];
for (const rg of GEO.ranges) {
  const samples = [];
  for (let i = 0; i < rg.pts.length - 1; i++) {
    const [x1, y1, h1] = rg.pts[i], [x2, y2, h2] = rg.pts[i + 1];
    const n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / 0.5));
    for (let k = 0; k < n; k++) {
      const t = k / n, x = lerp(x1, x2, t), y = lerp(y1, y2, t);
      let h = lerp(h1, h2, t) - GEO.lake_alt;
      h *= 1 + 0.07 * Math.sin(x * 3.1 + y * 1.7) + 0.05 * Math.sin(x * 7.3 - y * 4.1);
      if (rg.jag) h *= 0.82 + 0.18 * Math.pow(Math.abs(Math.sin(t * Math.PI * 1.0 + i * 1.3)), 0.4);
      samples.push([x * SCALE, y * SCALE, zOf(h)]);
    }
  }
  const last = rg.pts[rg.pts.length - 1];
  samples.push([last[0] * SCALE, last[1] * SCALE, zOf(last[2] - GEO.lake_alt)]);
  for (let i = 0; i < samples.length - 1; i += 6) {
    const pts = samples.slice(i, i + 7);
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    RANGE_PIECES.push({ pts, rock: rg.rock, snow: pts.some(p => p[2] > SNOW_Z), cx, cy });
  }
}

// ---------------- Villes (immeubles générés une fois, toujours identiques) ----------------
const BUILDINGS = [];
{
  const r = rng(7);
  const ROOFS = ["#c9785f", "#b8664f", "#8f8f99", "#d18d6a"], WALLS = ["#f2ece0", "#ece3d2", "#e8dcc6", "#f6f1e8", "#e3d6c0", "#dfe4ea"];
  for (const tw of GEO.towns) {
    const shore = tw.side === "north" ? SHORE_N : SHORE_S, sign = tw.side === "north" ? 1 : -1;
    for (let n = 0; n < tw.n; n++) {
      const fi = lerp(tw.from, tw.to, r()), i = Math.min(Math.floor(fi), shore.length - 2), t = fi - i;
      const a = shore[i], b = shore[i + 1], L = Math.hypot(b.x - a.x, b.y - a.y);
      const dx = (b.x - a.x) / L, dy = (b.y - a.y) / L, nx = sign * dy, ny = -sign * dx;
      const inl = Math.pow(r(), 1.4) * 1.1 * SCALE;
      const x = lerp(a.x, b.x, t) + nx * (inl + 4), y = lerp(a.y, b.y, t) + ny * (inl + 4);
      const zb = lerp(a.h1, b.h1, t) * inl / (1.2 * SCALE);
      BUILDINGS.push({ x, y, z: zb, w: 3 + r() * 5, h: tw.hmax * (0.25 + r() * 0.75) * 0.32, wall: WALLS[Math.floor(r() * WALLS.length)], roof: ROOFS[Math.floor(r() * ROOFS.length)] });
    }
  }
}
const LANDMARKS = GEO.landmarks.map(l => ({ type: l.type, x: l.x * SCALE, y: l.y * SCALE, z: zOf(l.z || 0) }));

// ---------------- Météo de course (identique pour tous les joueurs) ----------------
// τ = temps de course / durée nominale du mode : le même scénario se déroule quel que soit le mode.
// Les vents du Léman : Vaudaire (sud-est) au départ, Vent (sud-ouest) au milieu, coup de Joran (nord-ouest), Bise (nord-est) vers Genève.
const WIND_KEYS = [[0, 125, 15], [0.18, 135, 14], [0.27, 230, 9], [0.43, 220, 8], [0.49, 320, 22], [0.6, 330, 20], [0.67, 40, 16], [1, 45, 18]];
const WIND_NAMES = [[0, "w_vaudaire"], [0.25, "w_vent"], [0.46, "w_joran"], [0.65, "w_bise"]];
function baseWind(f) {
  let i = 1;
  while (i < WIND_KEYS.length - 1 && WIND_KEYS[i][0] < f) i++;
  const [f0, d0, k0] = WIND_KEYS[i - 1], [f1, d1, k1] = WIND_KEYS[i];
  const t = smooth((f - f0) / (f1 - f0));
  return { from: norm360(d0 + norm180(d1 - d0) * t), kn: lerp(k0, k1, t) };
}
// tempête de Joran : entre 47 % et 63 % du parcours, plus forte côté nord (elle descend du Jura)
const stormShape = (f, lat) => smooth((f - 0.47) / 0.04) * smooth((0.63 - f) / 0.04) * (0.75 + 0.25 * clamp(-lat / 300, -1, 1));
const stormBurst = tau => 0.55 + 0.45 * Math.pow(Math.abs(Math.sin(tau * 61)), 3);
const GUSTS = [], CALMS = [];
{
  const r = rng(2024);
  for (let i = 0; i < 46; i++) {
    const f0 = 0.03 + (i / 46) * 0.94 + (r() - 0.5) * 0.02;
    const cp = coursePoint(f0 * COURSE_LEN), lat = (r() - 0.5) * 240;
    const bw = baseWind(f0), to = rad(bw.from + 180);
    GUSTS.push({ x0: cp.x + cp.nx * lat, y0: cp.y + cp.ny * lat, r: 30 + r() * 46, boost: 6 + r() * 7, t0: f0 - 0.06 - r() * 0.03, dur: 0.15 + r() * 0.06, vx: Math.sin(to) * 480, vy: Math.cos(to) * 480 });
  }
  for (const [f, lat, rr] of [[0.31, -110, 85], [0.37, 120, 70], [0.41, -40, 60], [0.82, 50, 55]]) {
    const cp = coursePoint(f * COURSE_LEN);
    CALMS.push({ x: cp.x + cp.nx * lat, y: cp.y + cp.ny * lat, r: rr });
  }
}
function gustCenter(g, tau) { const dt = tau - g.t0; return [g.x0 + g.vx * dt, g.y0 + g.vy * dt]; }
const gustEnv = (g, tau) => smooth((tau - g.t0) / 0.035) * smooth((g.t0 + g.dur - tau) / 0.035);
function windAt(x, y, tau, cpOpt) {
  const cp = cpOpt || courseProject(x, y), f = cp.s / COURSE_LEN;
  const bw = baseWind(f);
  let kn = bw.kn, from = bw.from, gustK = 0;
  const st = stormShape(f, cp.lat);
  kn += st * (6 + 9 * stormBurst(tau));
  for (const g of GUSTS) {
    if (tau < g.t0 || tau > g.t0 + g.dur) continue;
    const [gx, gy] = gustCenter(g, tau), d2 = ((x - gx) ** 2 + (y - gy) ** 2) / (g.r * g.r);
    if (d2 > 6) continue;
    const k = gustEnv(g, tau) * Math.exp(-d2);
    kn += g.boost * k; gustK = Math.max(gustK, k); from += 8 * k;
  }
  for (const c of CALMS) {
    const d2 = ((x - c.x) ** 2 + (y - c.y) ** 2) / (c.r * c.r);
    if (d2 < 6) kn *= 1 - 0.78 * Math.exp(-d2);
  }
  kn *= 1 + 0.06 * Math.sin(tau * 40 + x * 0.01);
  return { from: norm360(from), kn: Math.max(0.5, kn), storm: st, gust: gustK, f };
}

// ---------------- Obstacles : vapeurs Belle Époque de la CGN, jet-skis, dauphins ----------------
// Positions en fonction de τ uniquement : tout le monde croise les mêmes bateaux aux mêmes endroits.
const CGN_LINES = [
  { a: [18.6, 5.9], b: [15.9, -0.4], period: 0.42, phase: 0.08 },
  { a: [2.0, 11.4], b: [-0.7, 0.5], period: 0.5, phase: 0.3 },
  { a: [-8.4, 11.6], b: [-9.1, -2.6], period: 0.55, phase: 0.62 },
  { a: [-27.2, -2.3], b: [-21.4, -3.1], period: 0.3, phase: 0.5 },
  { a: [-33.6, -18.6], b: [-31.4, -14.6], period: 0.22, phase: 0.1 }
].map(l => ({ ax: l.a[0] * SCALE, ay: l.a[1] * SCALE, bx: l.b[0] * SCALE, by: l.b[1] * SCALE, period: l.period, phase: l.phase }));
function cgnState(l, tau) {
  const u = ((tau + l.phase) / l.period) % 1, k = u < 0.5 ? smooth(u * 2) : smooth(2 - u * 2);
  const fwd = u < 0.5;
  const x = lerp(l.ax, l.bx, k), y = lerp(l.ay, l.by, k);
  const hdg = norm360(deg(Math.atan2((l.bx - l.ax) * (fwd ? 1 : -1), (l.by - l.ay) * (fwd ? 1 : -1))));
  return { x, y, hdg, len: 62, beam: 9 };
}
const JETSKIS = [[2.6, 9.8], [-0.5, 1.6], [19.0, 5.2], [-30.0, -9.5], [-32.6, -17.2], [-12.0, 7.6]].map(([x, y], i) => ({ cx: x * SCALE, cy: y * SCALE, r: 30 + i * 6, w: 9 + i * 1.7, ph: i * 1.3 }));
function jetskiState(j, tau) {
  const a = j.ph + tau * j.w * 2 * Math.PI;
  const x = j.cx + Math.cos(a) * j.r * (1 + 0.3 * Math.sin(a * 2)), y = j.cy + Math.sin(a) * j.r;
  return { x, y, hdg: norm360(deg(Math.atan2(-Math.sin(a), Math.cos(a)))) };
}
const DOLPHIN_SPOTS = [0.14, 0.7];
