// ================================================================
//  TRAVERSÉES DU LÉMAN (débutant / expert) : physique de la barge, commandes, caméras, course
// ================================================================
const BARGE = { CD: 4.2, FE: 80, PMAX: 500, ETA: 0.65, SFOC: 0.215, CO2F: 3.17, AF: 70, CX: 0.9 };
// Les deux modes partagent la même physique ; seules la masse effective (inertie ressentie), l'agilité
// et la compression du temps changent pour adapter les sensations au public.
const MODES = {
  beginner: { TN: 60, M: 80, RMAX: 17, TAUR: 0.45, TMAX: 95, camD: 58, camH: 19 },
  expert: { TN: 180, M: 190, RMAX: 9.5, TAUR: 1.0, TMAX: 115, camD: 62, camH: 20 }
};
const INTRO_DUR = 4.2, FINISH_DUR = 3.8;
const GHOST_COLS = ["#d9a520", "#9aa1b5", "#c47a45"];
const KEYS = new Set();
const RACE = {
  mode: "attract", state: "idle", t: 0, tau: 0.02, pen: 0, coll: 0, fuel: 0, saved: 0, track: [], trackT: 0,
  boat: { x: START.x, y: START.y, hdg: START.bearing, u: 0, r: 0, heelR: 0, heelV: 0, pitchR: 0, heave: 0 },
  throttle: 0, rudder: 0, mouseHelm: false, view: "third", showWindow: true, showGhosts: false,
  cam: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 }, introT: 0, finishT: 0, cool: {}, dolphins: [], wake: [], wakeT: 0, smoke: [],
  windShown: new Set(), wind: { kn: 0, from: 0, storm: 0, gust: 0, f: 0 }, f: 0, shake: 0, flash: 0, ghosts: { beginner: [], expert: [] }, result: null
};
const cfg = () => MODES[RACE.mode] || MODES.beginner;
const VK = () => COURSE_LEN / (cfg().TN * 9.5);                         // m de jeu par seconde et par nœud
const FTIME = () => VK() * 1000 / (SCALE * KN);                         // secondes réelles par seconde de jeu

function resetRace() {
  Object.assign(RACE, { t: 0, tau: 0.02, pen: 0, coll: 0, fuel: 0, saved: 0, track: [], trackT: 0, throttle: 0, rudder: 0, mouseHelm: false,
    introT: 0, finishT: 0, cool: {}, dolphins: [], wake: [], smoke: [], shake: 0, flash: 0, result: null });
  RACE.windShown = new Set();
  Object.assign(RACE.boat, { x: START.x, y: START.y, hdg: START.bearing, u: 0, r: 0, heelR: 0, heelV: 0, pitchR: 0, heave: 0 });
  kiteReset();
  const w = windAt(START.x, START.y, 0.02);
  RACE.wind = w;
  placeChaseCam(true);
}
function raceEvent(kind) {
  const pen = { kite_torn: 4, line_break: 3, kite_water: 2 }[kind] || 0;
  if (RACE.state === "run") RACE.pen += pen;
  toast(T("ev_" + kind) + (pen && RACE.state === "run" ? ` +${pen} s` : ""), "bad", null);
}

// ---------------- Pas de physique ----------------
function stepRace(dt) {
  const B = RACE.boat, C = cfg();
  RACE.t += dt;
  RACE.tau = 0.02 + RACE.t / C.TN;
  const cp = courseProject(B.x, B.y);
  RACE.f = cp.s / COURSE_LEN;
  const w = windAt(B.x, B.y, RACE.tau, cp);
  RACE.wind = w;
  // commandes
  const kb = KEYS;
  const up = kb.has("z") || kb.has("w") || (RACE.mode === "beginner" && kb.has("ArrowUp"));
  const down = kb.has("s") || (RACE.mode === "beginner" && kb.has("ArrowDown"));
  const left = kb.has("q") || kb.has("a") || (RACE.mode === "beginner" && kb.has("ArrowLeft"));
  const right = kb.has("d") || (RACE.mode === "beginner" && kb.has("ArrowRight"));
  if (up || down) RACE.throttle = clamp(RACE.throttle + ((up ? 1 : 0) - (down ? 1 : 0)) * 0.75 * dt, -0.4, 1);
  if (left || right) { RACE.mouseHelm = false; RACE.rudder = clamp(RACE.rudder + ((right ? 1 : 0) - (left ? 1 : 0)) * 3.2 * dt, -1, 1); }
  else if (!RACE.mouseHelm) RACE.rudder -= RACE.rudder * damp(3.5, dt);
  // kite
  const rig = kiteRig();
  const altReal = 40 + rig.L * Math.sin(rad(clamp(KS.el || 30, 5, 85)));
  const air = kiteAir(w.kn, w.from, B.hdg, B.u, altReal);
  if (RACE.mode === "expert") {
    const steer = (kb.has("ArrowRight") ? 1 : 0) - (kb.has("ArrowLeft") ? 1 : 0);
    const trim = (kb.has("ArrowDown") ? 1 : 0) - (kb.has("ArrowUp") ? 1 : 0);   // ↓ border (puissance) · ↑ choquer
    kiteStepManual(dt, air, steer, trim, rig);
  } else kiteStepAuto(dt, air, C.TMAX);
  RACE.air = air;
  // forces longitudinales (kN) et accélération (masse effective en tonnes → m/s²)
  const deck = kiteAir(w.kn, w.from, B.hdg, B.u, 10);
  const windDrag = 0.5 * RHO * BARGE.AF * BARGE.CX * deck.Wa * deck.Wa * Math.cos(rad(deck.awa)) / 1000;
  const windSide = 0.5 * RHO * BARGE.AF * 1.4 * deck.Wa * deck.Wa * Math.sin(rad(deck.awa)) / 1000;
  const Fe = RACE.throttle * BARGE.FE * (1 - 0.18 * clamp(B.u / 5, 0, 1));
  const R = BARGE.CD * B.u * Math.abs(B.u);
  RACE.Fe = Fe;
  const acc = (Fe + KS.fwd - R - windDrag) / C.M;
  B.u = Math.max(-1.5, B.u + acc * dt);
  // lacet : la barre n'agit qu'avec de la vitesse ; le kite tire un peu l'étrave sous le vent
  const rT = RACE.rudder * C.RMAX * clamp(Math.abs(B.u) / 2.5, 0.25, 1.15) * (B.u >= 0 ? 1 : -1) + KS.lat * 0.03;
  B.r += (rT - B.r) * damp(1 / C.TAUR, dt);
  B.hdg = norm360(B.hdg + B.r * dt);
  // dérive latérale (kite + vent de travers), déplacement en mètres de jeu
  const vf = B.u / KN * VK(), vl = (KS.lat - windSide) * 0.0045 * VK();
  const h = rad(B.hdg);
  B.x += (Math.sin(h) * vf + Math.cos(h) * vl) * dt;
  B.y += (Math.cos(h) * vf - Math.sin(h) * vl) * dt;
  // gîte (ressort amorti) : traction latérale du kite, vent de travers, rafales de tempête
  const heelT = clamp(KS.lat * 0.055 - windSide * 0.05 + w.storm * 3.5 * Math.sin(RACE.t * 1.7), -10, 10);
  const om = 1.5, ze = 0.3;
  B.heelV += (om * om * (rad(heelT) - B.heelR) - 2 * ze * om * B.heelV) * dt;
  B.heelR += B.heelV * dt;
  const sea = seaState(w.kn, w.from + 180);
  B.pitchR = lerp(B.pitchR, rad(-acc * 2.5 + Math.sin(RACE.t * 1.3) * sea.A * 1.2), damp(3, dt));
  B.heave = Math.sin(RACE.t * 1.1) * sea.A * 0.6;
  // énergie : carburant du moteur et CO2 évité grâce au kite (convertis en temps réel de traversée)
  const ft = FTIME() * dt;
  RACE.fuel += Math.max(0, RACE.throttle) * BARGE.PMAX * ft / 3600 * BARGE.SFOC;
  RACE.saved += Math.max(0, KS.fwd) * Math.max(0, B.u) / BARGE.ETA * ft / 3600 * BARGE.SFOC * BARGE.CO2F;
  collisions(dt);
  // annonces : vents du Léman, tempête, dauphins
  for (const [f0, key] of WIND_NAMES) if (RACE.f >= f0 && !RACE.windShown.has(key)) { RACE.windShown.add(key); toast(T(key), "", null); }
  if (RACE.f > 0.42 && RACE.f < 0.47 && KS.deployed) toast(T(RACE.mode === "expert" ? "storm_warn_expert" : "storm_warn"), "warn", "stormw", 8);
  for (const fs of DOLPHIN_SPOTS) if (RACE.f >= fs && !RACE.windShown.has("d" + fs)) { RACE.windShown.add("d" + fs); spawnDolphins(); toast(T("dolphins"), "good", null); }
  if (w.gust > 0.5 && KS.state === "flying") toast(T("gust_caught"), "good", "gust", 6);
  // trace de la route (pour les classements et la page des résultats)
  RACE.trackT += dt;
  if (RACE.trackT >= 0.5) { RACE.trackT = 0; RACE.track.push([Math.round(B.x * 10) / 10, Math.round(B.y * 10) / 10, Math.round(B.u / KN * 100) / 100]); }
  if (cp.s >= COURSE_LEN - 4 && cp.d < 120 * 120) finishRace();
}
function collisions(dt) {
  const B = RACE.boat;
  for (const k in RACE.cool) RACE.cool[k] -= dt;
  const pts = [-15, 0, 15].map(ly => bargeToWorld(B, 0, ly, 0));
  // rives
  const bow = bargeToWorld(B, 0, 20, 0);
  if (!inLake(bow[0], bow[1]) || !inLake(B.x, B.y)) {
    const n = nearestShore(B.x, B.y);
    const dx = B.x - n.x, dy = B.y - n.y, back = inLake(B.x, B.y) ? 1 : -1, L = Math.hypot(dx, dy) || 1;
    B.x += dx / L * back * 6; B.y += dy / L * back * 6;
    B.u *= 0.3;
    if (!(RACE.cool.shore > 0)) { RACE.cool.shore = 2; RACE.pen += 1.5; RACE.shake = 0.5; toast(T("ev_aground") + " +1,5 s", "warn", null); }
  }
  // vapeurs CGN
  for (const [i, l] of CGN_LINES.entries()) {
    const st = cgnState(l, RACE.tau);
    if (Math.hypot(st.x - B.x, st.y - B.y) > 90) continue;
    const cpts = [-22, -7, 8, 22].map(ly => bargeToWorld({ x: st.x, y: st.y, hdg: st.hdg, heelR: 0, pitchR: 0, heave: 0 }, 0, ly, 0));
    if (pts.some(a => cpts.some(c => Math.hypot(a[0] - c[0], a[1] - c[1]) < 11.5)) && !(RACE.cool["cgn" + i] > 0)) {
      RACE.cool["cgn" + i] = 3; RACE.pen += 5; RACE.coll++; B.u *= 0.35; B.r += (Math.random() - 0.5) * 20; RACE.shake = 0.9;
      toast(T("ev_cgn") + " +5 s", "bad", null);
    }
  }
  for (const [i, j] of JETSKIS.entries()) {
    const st = jetskiState(j, RACE.tau);
    if (pts.some(a => Math.hypot(a[0] - st.x, a[1] - st.y) < 7) && !(RACE.cool["js" + i] > 0)) {
      RACE.cool["js" + i] = 3; RACE.pen += 2; RACE.coll++; B.u *= 0.8; RACE.shake = 0.4;
      toast(T("ev_jetski") + " +2 s", "bad", null);
    }
  }
}
function spawnDolphins() {
  for (let i = 0; i < 3; i++) RACE.dolphins.push({ lat: (i % 2 ? 1 : -1) * (9 + i * 3), fwd: 22 + i * 7, ph: i * 0.33, t0: RACE.t, life: 5.5 });
}
function finishRace() {
  if (RACE.state !== "run") return;
  RACE.state = "finish"; RACE.finishT = 0; RACE.throttle = 0.15;
  KEYS.clear();
  const total = RACE.t + RACE.pen;
  RACE.result = { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, mode: RACE.mode, name: PLAYER.name, team: PLAYER.team,
    time: Math.round(RACE.t * 1000) / 1000, pen: Math.round(RACE.pen * 1000) / 1000, total: Math.round(total * 1000) / 1000,
    co2: Math.round(RACE.fuel * BARGE.CO2F * 10) / 10, saved: Math.round(RACE.saved * 10) / 10, coll: RACE.coll, track: RACE.track,
    rig: RACE.mode === "expert" ? `${RIG.area} m² · ${RIG.line} m` : null };
  submitScore(RACE.result);
  toast(T("finish_toast", { t: fmtTime(total) }), "good", null);
}

// ---------------- Caméras ----------------
// Cadrage automatique du kite en 3e personne : la caméra recule, monte et pivote pour garder la barge et l'aile à l'écran
const FRAME = { wt: 0, off: 0, extra: 0, elK: 20, half: 50 };
function chasePose() {
  const B = RACE.boat, C = cfg(), yaw = RACE.cam.yaw, D = C.camD + FRAME.extra;
  const x = B.x - Math.sin(rad(yaw)) * D, y = B.y - Math.cos(rad(yaw)) * D, z = C.camH + FRAME.extra * 0.22 + B.heave * 0.5;
  return { x, y, z, yaw };
}
function placeChaseCam(snap) {
  if (snap) RACE.cam.yaw = RACE.boat.hdg;
  Object.assign(RACE.cam, chasePose());
}
function lookPitch(cam, tx, ty, tz, h, k, frac) {
  const el = deg(Math.atan2(tz - cam.z, Math.hypot(tx - cam.x, ty - cam.y)));
  return el + (frac - 0.5) * h / k;   // la cible apparaît à la hauteur « frac » de l'écran
}
function computeCamera(dt, w, h) {
  const B = RACE.boat;
  let x, y, z, yaw, pitch, roll = 0, half = 50;
  if (RACE.mode === "attract") {
    const a = rad(RACE.t * 5 + 200), qx = START.x, qy = START.y;
    x = qx + Math.sin(a) * 150; y = qy + Math.cos(a) * 150; z = 46; yaw = norm360(deg(a) + 180); half = 52;
    pitch = lookPitch({ x, y, z }, qx, qy, 4, h, (w / 2) / half, 0.62);
    return makeCam(w, h, x, y, z, yaw, pitch, 0, half);
  }
  if (RACE.state === "finish" || RACE.state === "end") {
    const e = smoother(RACE.finishT / FINISH_DUR), a = rad(B.hdg + 180 - 150 * e);
    x = B.x + Math.sin(a) * 92; y = B.y + Math.cos(a) * 92; z = 30 + 10 * e; yaw = norm360(deg(a) + 180); half = 52;
    pitch = lookPitch({ x, y, z }, B.x, B.y, 8, h, (w / 2) / half, 0.6);
    return makeCam(w, h, x, y, z, yaw, pitch, 0, half);
  }
  if (RACE.view === "cabin" && RACE.state !== "intro") {
    const p = bargeToWorld(B, 0, -15.1, 4.8);
    half = 56;
    return makeCam(w, h, p[0], p[1], p[2], B.hdg, -2 + deg(B.pitchR), B.heelR, half);
  }
  const rig = kiteRig(), follow = RACE.mode === "expert" && RACE.state === "run" && KS.dep > 0.15 && KS.state !== "crashed" ? 1 : 0;
  FRAME.wt = lerp(FRAME.wt, follow, damp(1.4, dt));
  FRAME.off = lerp(FRAME.off, follow * clamp(norm180(KS.azRel || 0) * 0.45, -38, 38), damp(1.1, dt));
  FRAME.extra = lerp(FRAME.extra, follow * rig.Lvis * 0.75, damp(1.3, dt));
  RACE.cam.yaw = angLerp(RACE.cam.yaw, B.hdg + FRAME.off, damp(2.2, dt));
  const cp = chasePose();
  RACE.cam.x = lerp(RACE.cam.x, cp.x, damp(7, dt)); RACE.cam.y = lerp(RACE.cam.y, cp.y, damp(7, dt)); RACE.cam.z = lerp(RACE.cam.z, cp.z, damp(4, dt));
  ({ x, y, z, yaw } = RACE.cam);
  const tx = B.x + Math.sin(rad(B.hdg)) * 45, ty = B.y + Math.cos(rad(B.hdg)) * 45;
  if (RACE.state === "intro") {
    // travelling avant : vue d'ensemble du lac → poursuite, synchronisé avec le décompte
    const e = smoother(RACE.introT / INTRO_DUR), back = rad(START.bearing + 180);
    const ox = START.x + Math.sin(back) * 480 - START.nx * 230, oy = START.y + Math.cos(back) * 480 - START.ny * 230, oz = 220;
    const oyaw = norm360(deg(Math.atan2(START.x - ox, START.y - oy)));
    x = lerp(ox, x, e); y = lerp(oy, y, e); z = lerp(oz, z, e); yaw = angLerp(oyaw, yaw, e);
    half = lerp(56, 50, e);
    pitch = lookPitch({ x, y, z }, lerp(START.x, tx, e), lerp(START.y, ty, e), lerp(0, 3, e), h, (w / 2) / half, lerp(0.55, 0.62, e));
    return makeCam(w, h, x, y, z, yaw, pitch, 0, half);
  }
  // hauteur angulaire du kite vue de la caméra (lissée pour ne pas suivre chaque huit)
  const A = bargeToWorld(B, ...BARGE_ANCHOR), azW = rad(B.hdg + (KS.azRel || 0)), elW = rad(KS.el || 30);
  const Lk = rig.Lvis * KS.dep, kx = A[0] + Lk * Math.cos(elW) * Math.sin(azW), ky = A[1] + Lk * Math.cos(elW) * Math.cos(azW), kz = A[2] + Lk * Math.sin(elW);
  FRAME.elK = lerp(FRAME.elK, deg(Math.atan2(kz - z, Math.hypot(kx - x, ky - y))), damp(2.5, dt));
  const elB = deg(Math.atan2(3 - z, Math.hypot(tx - x, ty - y)));
  // champ vertical nécessaire : barge aux 3/4 bas de l'écran, kite à 15 % du haut ; on dézoome au besoin
  const fracB = 0.62 + 0.06 * FRAME.wt, needHalf = clamp((FRAME.elK - elB) / (fracB - 0.1) * (w / 2) / h, 50, 88);
  FRAME.half = lerp(FRAME.half, lerp(50, needHalf, FRAME.wt), damp(2, dt));
  half = FRAME.half;
  pitch = lookPitch({ x, y, z }, tx, ty, 3, h, (w / 2) / half, fracB);
  if (RACE.shake > 0) { yaw += (Math.random() - 0.5) * RACE.shake * 1.5; pitch += (Math.random() - 0.5) * RACE.shake; }
  roll = B.heelR * 0.15;
  return makeCam(w, h, x, y, z, yaw, pitch, roll, half);
}

// ---------------- Rendu d'une image de la traversée ----------------
let WORLD = null;
function renderWorld(dt) {
  const { ctx, w, h } = WORLD;
  const B = RACE.boat, tau = RACE.tau, t = performance.now() / 1000;
  const cam = computeCamera(dt, w, h);
  RACE.shake = Math.max(0, RACE.shake - dt);
  const storm = RACE.wind.storm || 0;
  const L = lightAt(RACE.mode === "attract" ? 0.02 : clamp(RACE.f, 0, 1), storm);
  const sea = seaState(RACE.wind.kn, RACE.wind.from + 180);
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  if (cam.roll) { ctx.translate(cam.cx, cam.cy); ctx.rotate(cam.roll); ctx.translate(-cam.cx, -cam.cy); }
  drawSky(ctx, cam, L, t);
  drawRanges(ctx, cam, L);
  drawWater(ctx, cam, L, sea, t);
  drawWindViz(ctx, cam, tau, dt, B.x, B.y, VK() / 7.4);
  if (RACE.showGhosts) drawGhosts(ctx, cam);
  drawLand(ctx, cam, L);
  drawTowns(ctx, cam, L, t);
  drawQuay(ctx, cam, L, t);
  drawObstacles(ctx, cam, L, tau, t);
  drawWake(ctx, cam, dt);
  const info = drawBarge(ctx, cam, B, L);
  drawSmoke(ctx, cam, dt, info.exhaust);
  drawRaceKite(ctx, cam, dt, info);
  if (storm > 0.02) {
    ctx.fillStyle = `rgba(60,70,92,${0.28 * storm})`; ctx.fillRect(-w * 0.3, -h * 0.3, w * 1.6, h * 1.6);
    if (Math.sin(tau * 211) > 0.995 || RACE.flash > 0) RACE.flash = RACE.flash > 0 ? RACE.flash - dt : 0.18;
    if (RACE.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${RACE.flash * 2.5})`; ctx.fillRect(-w * 0.3, -h * 0.3, w * 1.6, h * 1.6); }
    drawRainLayer(ctx, w, h, t, storm, -10, QUALITY.rain);
  }
  ctx.restore();
  if (RACE.view === "cabin" && RACE.mode !== "attract" && RACE.state !== "intro" && RACE.state !== "finish" && RACE.state !== "end") drawCabin(ctx, w, h, storm, t);
}
function drawGhosts(ctx, cam) {
  const ghosts = RACE.ghosts[RACE.mode] || [];
  ghosts.forEach((gh, gi) => {
    ctx.strokeStyle = GHOST_COLS[gi]; ctx.lineWidth = 2.4; ctx.globalAlpha = 0.85;
    ctx.beginPath();
    let pen = false;
    for (const q of gh.track) {
      if (Math.abs(q[0] - cam.x) > 900 || Math.abs(q[1] - cam.y) > 900) { pen = false; continue; }
      const p = cam.p(q[0], q[1], 0.4);
      if (Math.abs(p[3]) > 100) { pen = false; continue; }
      pen ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); pen = true;
    }
    ctx.stroke(); ctx.globalAlpha = 1;
    const q = gh.track[Math.min(gh.track.length - 1, Math.floor(RACE.t / 0.5))];   // position du fantôme au même instant
    if (q && RACE.state === "run") {
      const p = cam.p(q[0], q[1], 1.5);
      if (Math.abs(p[3]) < 100) { ctx.fillStyle = GHOST_COLS[gi]; ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(3, cam.k * 57.3 / p[2] * 2), 0, Math.PI * 2); ctx.fill(); }
    }
  });
}
const JETSKI_FACES = [...box(-0.9, 0.9, -2.2, 2.4, -0.1, 0.7, "#e8574a", { noBottom: true }), ...box(-0.35, 0.35, -1.0, -0.2, 0.7, 2.1, "#2f3b55", { noBottom: true })];
function drawObstacles(ctx, cam, L, tau, t) {
  const items = [];
  for (const l of CGN_LINES) { const st = cgnState(l, tau); items.push({ kind: "cgn", st, d: Math.hypot(st.x - cam.x, st.y - cam.y) }); }
  for (const j of JETSKIS) { const st = jetskiState(j, tau); items.push({ kind: "js", st, d: Math.hypot(st.x - cam.x, st.y - cam.y) }); }
  items.sort((a, b) => b.d - a.d);
  for (const it of items) {
    if (it.kind === "cgn") { if (it.d < 2200) drawCgn(ctx, cam, it.st, L); }
    else if (it.d < 700) {
      const st = it.st;
      drawModel(ctx, cam, { x: st.x, y: st.y, hdg: st.hdg, heelR: Math.sin(t * 3) * 0.1, pitchR: 0.1, heave: 0.2 }, JETSKI_FACES, L);
      ctx.fillStyle = "rgba(255,255,255,.75)";
      for (let i = 1; i < 6; i++) {
        const p = cam.p(st.x - Math.sin(rad(st.hdg)) * i * 3, st.y - Math.cos(rad(st.hdg)) * i * 3, 0.3);
        const s = Math.max(1, cam.k * 57.3 / p[2] * (1 + i * 0.3));
        if (Math.abs(p[3]) < 100) ctx.fillRect(p[0] - s / 2, p[1] - s / 2, s, s * 0.5);
      }
    }
  }
  // dauphins qui sautent à côté de l'étrave
  const B = RACE.boat;
  RACE.dolphins = RACE.dolphins.filter(d => RACE.t - d.t0 < d.life);
  for (const d of RACE.dolphins) {
    const u = ((RACE.t - d.t0) * 0.9 + d.ph) % 1;
    if (u > 0.62) continue;
    const k = u / 0.62, z = Math.sin(Math.PI * k) * 3.2 - 0.4;
    const pos = bargeToWorld({ ...B, heelR: 0, pitchR: 0, heave: 0 }, d.lat, d.fwd + k * 7, z);
    const pos2 = bargeToWorld({ ...B, heelR: 0, pitchR: 0, heave: 0 }, d.lat, d.fwd + k * 7 + 1.5, Math.sin(Math.PI * (k + 0.05)) * 3.2 - 0.4);
    const p = cam.p(...pos), p2 = cam.p(...pos2);
    if (Math.abs(p[3]) > 100) continue;
    const s = cam.k * 57.3 / p[2], ang = Math.atan2(p2[1] - p[1], p2[0] - p[0]);
    ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(ang);
    ctx.fillStyle = "#5d6a7e"; ctx.beginPath(); ctx.ellipse(0, 0, 1.4 * s, 0.38 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-0.1 * s, -0.3 * s); ctx.lineTo(0.25 * s, -0.75 * s); ctx.lineTo(0.45 * s, -0.3 * s); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-1.3 * s, 0); ctx.lineTo(-1.8 * s, -0.4 * s); ctx.lineTo(-1.8 * s, 0.4 * s); ctx.fill();
    ctx.fillStyle = "#c9d3de"; ctx.beginPath(); ctx.ellipse(0.2 * s, 0.15 * s, 0.9 * s, 0.15 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (k < 0.08 || k > 0.92) { ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(p[0], p[1], 1.2 * s, 0.3 * s, 0, 0, Math.PI * 2); ctx.stroke(); }
  }
}
function drawWake(ctx, cam, dt) {
  const B = RACE.boat;
  RACE.wakeT += dt;
  if (RACE.wakeT > 0.07 && B.u > 0.3) {
    RACE.wakeT = 0;
    const s = bargeToWorld({ ...B, heelR: 0, pitchR: 0, heave: 0 }, 0, -20, 0);
    RACE.wake.push({ x: s[0], y: s[1], hdg: B.hdg, age: 0, v: B.u });
  }
  for (const p of RACE.wake) p.age += dt;
  RACE.wake = RACE.wake.filter(p => p.age < 2.6);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    let first = true;
    for (let i = RACE.wake.length - 1; i >= 0; i--) {
      const p = RACE.wake[i], spread = 4 + p.age * 9 * (p.v / 4.4), hr = rad(p.hdg);
      const q = cam.p(p.x + Math.cos(hr) * spread * side, p.y - Math.sin(hr) * spread * side, 0.1);
      if (Math.abs(q[3]) > 100) { first = true; continue; }
      first ? ctx.moveTo(q[0], q[1]) : ctx.lineTo(q[0], q[1]); first = false;
    }
    ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 2; ctx.stroke();
  }
  for (const p of RACE.wake) {
    if (p.age > 1.4) continue;
    const q = cam.p(p.x, p.y, 0.1);
    if (Math.abs(q[3]) > 100) continue;
    const s = cam.k * 57.3 / q[2];
    ctx.fillStyle = `rgba(255,255,255,${0.32 * (1 - p.age / 1.4)})`;
    ctx.beginPath(); ctx.ellipse(q[0], q[1], (4 + p.age * 6) * s, (1 + p.age) * s * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  }
  // vague d'étrave
  const bw = cam.p(...bargeToWorld(B, 0, 19.5, 0)), s = cam.k * 57.3 / Math.max(bw[2], 1);
  if (Math.abs(bw[3]) < 100 && B.u > 0.5) { ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.beginPath(); ctx.ellipse(bw[0], bw[1], (3 + B.u * 1.2) * s, 0.7 * s, 0, 0, Math.PI * 2); ctx.fill(); }
}
function drawSmoke(ctx, cam, dt, ex) {
  const intensity = Math.max(0.15, RACE.throttle) * 14;
  RACE.smokeAcc = (RACE.smokeAcc || 0) + dt * intensity;
  while (RACE.smokeAcc > 1) { RACE.smokeAcc -= 1; RACE.smoke.push({ x: ex[0], y: ex[1], vx: (Math.random() - .5) * 6, vy: -8 - Math.random() * 6, r: 2, life: 0 }); }
  for (let i = RACE.smoke.length - 1; i >= 0; i--) {
    const s = RACE.smoke[i];
    s.life += dt;
    if (s.life > 2.2) { RACE.smoke.splice(i, 1); continue; }
    s.x += s.vx * dt - RACE.boat.r * 0.4 * dt; s.y += s.vy * dt; s.r += dt * 6;
    ctx.fillStyle = `rgba(110,116,130,${0.18 * (1 - s.life / 2.2)})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  }
}
function drawRaceKite(ctx, cam, dt, info) {
  const B = RACE.boat, air = RACE.air || { down: 0 };
  const rig = kiteRig(), A = info.anchor, Lv = rig.Lvis * Math.max(KS.dep, 0.04);
  if (RACE.showWindow && RACE.mode !== "attract" && RACE.state !== "intro") drawWindow3D(ctx, cam, A, B.hdg + air.down, rig.Lvis);
  const azW = B.hdg + KS.azRel, el = KS.state === "crashed" ? 0 : KS.el;
  const dir = [Math.cos(rad(el)) * Math.sin(rad(azW)), Math.cos(rad(el)) * Math.cos(rad(azW)), Math.sin(rad(el))];
  const kp = [A[0] + dir[0] * Lv, A[1] + dir[1] * Lv, A[2] + dir[2] * Lv];
  if (KS.dep > 0.85 && KS.state === "flying") { KS.trail.push([azW, el]); if (KS.trail.length > 140) KS.trail.shift(); } else if (KS.dep < 0.5) KS.trail.length = 0;
  for (let i = 1; i < KS.trail.length; i++) {
    const p0 = trailPt(cam, A, KS.trail[i - 1]), p1 = trailPt(cam, A, KS.trail[i]);
    if (!p0 || !p1) continue;
    const a = i / KS.trail.length;
    ctx.strokeStyle = `rgba(255,255,255,${a * 0.8})`; ctx.lineWidth = 0.8 + a * 2;
    ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
  }
  if (KS.dep < 0.03) return;
  const p = cam.p(...kp);
  if (Math.abs(p[3]) > 120) return;
  const tension = clamp(KS.T / rig.tmax, 0, 1.4);
  ctx.strokeStyle = tension > 0.85 ? `rgba(208,74,108,${0.6 + 0.4 * Math.sin(performance.now() / 50)})` : "rgba(40,50,70,.65)";
  ctx.lineWidth = 1 + tension * 1.2;
  ctx.beginPath(); ctx.moveTo(info.anchorScreen[0], info.anchorScreen[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
  const prev = RACE.lastKitePx;
  let target = 0;
  if (prev) { const vx = p[0] - prev[0], vy = p[1] - prev[1]; if (Math.hypot(vx, vy) > 0.3) target = clamp(Math.atan2(vx, -vy), -1.1, 1.1); }
  RACE.kiteRoll = lerp(RACE.kiteRoll || 0, target, damp(6, dt));
  RACE.lastKitePx = [p[0], p[1]];
  const span = clamp(cam.k * 57.3 * 24 * Math.sqrt(rig.area / KITE.area) / Math.max(p[2], 1), 16, 260) * (0.4 + 0.6 * KS.dep);   // taille ∝ √surface
  if (KS.state === "crashed") { ctx.fillStyle = "rgba(255,255,255,.85)"; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(p[0] + Math.sin(i * 2.3 + performance.now() / 160) * span * 0.2, p[1] - Math.abs(Math.cos(i + performance.now() / 200)) * span * 0.15, 2.4, 0, Math.PI * 2); ctx.fill(); } return; }
  drawParagliderFront(ctx, p[0], p[1], span, RACE.kiteRoll, RACE.mode === "expert" ? KS.trim : 1);
}
function trailPt(cam, A, [az, el]) {
  const L = kiteRig().Lvis, p = cam.p(A[0] + L * Math.cos(rad(el)) * Math.sin(rad(az)), A[1] + L * Math.cos(rad(el)) * Math.cos(rad(az)), A[2] + L * Math.sin(rad(el)));
  return Math.abs(p[3]) > 120 ? null : p;
}
function drawCabin(ctx, w, h, storm, t) {
  const top = h * 0.07, sill = h * 0.74;
  ctx.fillStyle = "rgba(200,220,245,.05)"; ctx.fillRect(0, top, w, sill - top);
  if (storm > 0.05) {
    ctx.fillStyle = `rgba(235,242,255,${0.35 * storm})`;
    for (let i = 0; i < 60; i++) { const x = (i * 131.7) % w, y = top + ((i * 71.3 + t * 40 * (1 + i % 3)) % (sill - top)); ctx.beginPath(); ctx.ellipse(x, y, 1.6, 3.2, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  let g = ctx.createLinearGradient(0, 0, 0, top); g.addColorStop(0, "#d9d5e6"); g.addColorStop(1, "#c7c2d8");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, top);
  ctx.fillStyle = "#bdb7d0";
  for (const fx of [0, 0.25, 0.5, 0.75, 1]) {
    const x = fx * w, pw = w * 0.011, lean = (fx - 0.5) * w * 0.02;
    ctx.beginPath(); ctx.moveTo(x - pw - lean, top); ctx.lineTo(x + pw - lean, top); ctx.lineTo(x + pw * 1.4, sill); ctx.lineTo(x - pw * 1.4, sill); ctx.closePath(); ctx.fill();
  }
  g = ctx.createLinearGradient(0, sill, 0, h); g.addColorStop(0, "#d8d3e6"); g.addColorStop(0.08, "#4a4f6e"); g.addColorStop(1, "#33374f");
  ctx.fillStyle = g; ctx.fillRect(0, sill, w, h - sill);
}

// ---------------- Mises à jour de l'interface de course ----------------
let hudT = 0;
function updateRaceHud(dt) {
  hudT += dt;
  setThrottleUi(); setHelmUi();
  if (hudT < 0.1) return;
  hudT = 0;
  const B = RACE.boat, w = RACE.wind, kn = B.u / KN;
  $("hTime").textContent = fmtClock(RACE.t);
  $("hSpeed").innerHTML = `${fmt1(kn)}<i>${T("u_kn")}</i>`;
  const rel = norm180(w.from - B.hdg);
  $("hWind").innerHTML = `${fmt0(w.kn)}<i>${T("u_kn")} ${windArrow(rel)}</i>`;
  $("hKite").innerHTML = `${fmt0(KS.fwd)}<i>kN</i>`;
  $("hProg").textContent = `${fmt0(clamp(RACE.f, 0, 1) * 100)} %`;
  $("hProgFill").style.width = `${clamp(RACE.f, 0, 1) * 100}%`;
  updateDash();
  const tm = kiteRig().tmax;
  $("kbTension").style.width = `${clamp(KS.T / tm, 0, 1) * 100}%`;
  $("kbTension").style.background = KS.T > tm * 0.85 ? "#f07d9c" : KS.T > tm * 0.6 ? "#f2c14e" : "#5fc9a8";
  $("kbTrim").style.width = `${KS.trim * 100}%`;
  $("kbZone").textContent = KS.state === "flying" ? `${fmt0(clamp(KS.wf, 0, 1) * 100)} %` : T("ks_" + KS.state);
  $("kiteBtn").innerHTML = `<kbd>${T("key_space")}</kbd> ${T(KS.deployed ? "kite_retract" : "kite_deploy")}`;
  const warn = $("kwarn");
  if (KS.overload > 0.15 && RACE.state === "run") { warn.hidden = false; warn.className = "glass kwarn only-race over"; warn.innerHTML = `${T("overload")} ${fmt0(KS.T)} kN<small>${T(RACE.mode === "expert" ? "overload_hint_expert" : "overload_hint")}</small>`; }
  else warn.hidden = true;
}
const windArrow = rel => ["↓", "↙", "←", "↖", "↑", "↗", "→", "↘"][Math.round(norm360(rel) / 45) % 8];
function setThrottleUi() {
  const f = (1 - RACE.throttle) / 1.4;
  $("thrKnob").style.top = `${clamp(f, 0, 1) * 100}%`;
  $("thrVal").textContent = `${fmt0(RACE.throttle * 100)} %`;
}
function setHelmUi() { $("helmKnob").style.left = `${(RACE.rudder + 1) / 2 * 100}%`; }
function initRaceControls() {
  const rail = $("thrRail");
  const setT = e => { const r = rail.getBoundingClientRect(); RACE.throttle = clamp(1 - (e.clientY - r.top) / r.height * 1.4, -0.4, 1); };
  rail.addEventListener("pointerdown", e => { rail.setPointerCapture(e.pointerId); setT(e); rail.dataset.drag = "1"; });
  rail.addEventListener("pointermove", e => { if (rail.dataset.drag) setT(e); });
  rail.addEventListener("pointerup", () => { delete rail.dataset.drag; });
  const hr = $("helmRail");
  const setH = e => { const r = hr.getBoundingClientRect(); RACE.rudder = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1); RACE.mouseHelm = true; };
  hr.addEventListener("pointerdown", e => { hr.setPointerCapture(e.pointerId); setH(e); hr.dataset.drag = "1"; });
  hr.addEventListener("pointermove", e => { if (hr.dataset.drag) setH(e); });
  hr.addEventListener("pointerup", () => { delete hr.dataset.drag; });
  hr.addEventListener("dblclick", () => { RACE.rudder = 0; });
  $("kiteBtn").addEventListener("click", () => { if (RACE.state === "run") toggleKiteDeploy(); });
  document.querySelectorAll("[data-rig]").forEach(btn => btn.addEventListener("click", () => setRig(btn.dataset.rig, +btn.dataset.v)));
  updateRigUi();
  $("tGhost").addEventListener("click", toggleGhosts);
  $("tWin").addEventListener("click", toggleWindowView);
  $("tView").addEventListener("click", toggleCamView);
  WORLD = setupCanvas($("worldCv"));
  MINI = setupCanvas($("minimap"));
}
let MINI = null;
function toggleGhosts() {
  RACE.showGhosts = !RACE.showGhosts; $("tGhost").classList.toggle("on", RACE.showGhosts);
  if (RACE.showGhosts && !(RACE.ghosts[RACE.mode] || []).length) toast(T("no_ghosts"), "", "ng", 5);
}
function toggleWindowView() { RACE.showWindow = !RACE.showWindow; $("tWin").classList.toggle("on", RACE.showWindow); }
function toggleCamView() { RACE.view = RACE.view === "third" ? "cabin" : "third"; $("tViewTxt").textContent = T(RACE.view === "third" ? "view_third" : "view_cabin"); }

// ---------------- Boucle de la traversée ----------------
function frameRace(dt) {
  if (RACE.mode === "attract") { RACE.t += dt; RACE.f = 0.02; renderWorld(dt); return; }
  if (RACE.state === "intro") {
    RACE.introT += dt;
    const n = 3 - Math.floor(RACE.introT / (INTRO_DUR / 3));
    const bc = $("bigCount");
    const label = n >= 1 ? String(n) : T("go");
    if (bc.textContent !== label) { bc.hidden = false; bc.textContent = label; bc.style.animation = "none"; void bc.offsetWidth; bc.style.animation = ""; }
    if (RACE.introT >= INTRO_DUR) {
      RACE.state = "run"; RACE.throttle = 0.3;
      setTimeout(() => { if ($("bigCount").textContent === T("go")) $("bigCount").hidden = true; }, 700);
      toast(T(RACE.mode === "expert" ? "start_tip_expert" : "start_tip"), "", null);
    }
  } else if (RACE.state === "run") stepRace(dt);
  else if (RACE.state === "finish") {
    RACE.finishT += dt;
    RACE.boat.u = lerp(RACE.boat.u, 0.8, damp(0.8, dt));
    const h = rad(RACE.boat.hdg), vf = RACE.boat.u / KN * VK();
    RACE.boat.x += Math.sin(h) * vf * dt; RACE.boat.y += Math.cos(h) * vf * dt;
    if (RACE.finishT >= FINISH_DUR) showEnd();
  }
  if (RACE.state === "end") RACE.finishT = Math.min(RACE.finishT + dt, FINISH_DUR);
  renderWorld(dt);
  drawMinimap(MINI, RACE.boat, RACE.tau, RACE.showGhosts ? RACE.ghosts[RACE.mode] : null);
  updateRaceHud(dt);
}
