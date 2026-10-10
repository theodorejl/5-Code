// ================================================================
//  KITE : dessin en forme de parapente + physique de traction (pilote automatique et pilotage manuel)
// ================================================================
// --- Dessin vu de derrière (traversées). Origine = boîtier de pilotage ; l'aile est au-dessus.
function drawParagliderFront(ctx, x, y, span, roll, power = 1) {
  const s = span, Ra = s * (0.56 + 0.12 * (1 - power)), hc = s * 0.66, N = 16;
  const top = [], bot = [], mid = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N * 2 - 1, a = rad(u * 68);
    // l'aile suit un arc : les extrémités (stabilos) descendent vers les suspentes
    const px = Ra * Math.sin(a), cy = -hc + Ra * 0.9 * (1 - Math.cos(a));
    const nx = Math.sin(a), ny = -Math.cos(a) * 0.9;
    const nl = Math.hypot(nx, ny), tk = s * 0.12 * Math.sqrt(1 - u * u * 0.85);
    mid.push([px, cy]);
    top.push([px + nx / nl * tk * 0.5, cy + ny / nl * tk * 0.5]);
    bot.push([px - nx / nl * tk * 0.5, cy - ny / nl * tk * 0.5]);
  }
  ctx.save();
  ctx.translate(x, y); ctx.rotate(roll);
  // suspentes : bord inférieur de l'aile → 4 points de cascade → 2 élévateurs → boîtier
  const casc = [[-0.3 * s, -0.36 * s], [-0.11 * s, -0.33 * s], [0.11 * s, -0.33 * s], [0.3 * s, -0.36 * s]];
  const risers = [[-0.06 * s, -0.1 * s], [0.06 * s, -0.1 * s]];
  ctx.strokeStyle = "rgba(40,50,70,.42)"; ctx.lineWidth = Math.max(0.5, s * 0.004);
  ctx.beginPath();
  for (let i = 1; i < N; i += 1) {
    const [bx, by] = bot[i], c = casc[Math.min(3, Math.floor(i / N * 4))];
    ctx.moveTo(bx, by); ctx.lineTo(c[0], c[1]);
  }
  casc.forEach((c, i) => { const r = risers[i < 2 ? 0 : 1]; ctx.moveTo(c[0], c[1]); ctx.lineTo(r[0], r[1]); });
  risers.forEach(r => { ctx.moveTo(r[0], r[1]); ctx.lineTo(0, 0); });
  ctx.stroke();
  // voile
  const g = ctx.createLinearGradient(0, -hc - s * 0.1, 0, -hc + s * 0.4);
  g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#e3e7ef");
  ctx.shadowColor = "rgba(40,40,80,.25)"; ctx.shadowBlur = Math.min(10, s * 0.06);
  ctx.fillStyle = g;
  ctx.beginPath();
  top.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
  for (let i = N; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
  ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  // caissons : un sur deux légèrement ombré, nervures
  if (s > 18) {
    ctx.fillStyle = "rgba(120,130,160,.08)";
    for (let i = 0; i < N; i += 2) {
      ctx.beginPath(); ctx.moveTo(top[i][0], top[i][1]); ctx.lineTo(top[i + 1][0], top[i + 1][1]); ctx.lineTo(bot[i + 1][0], bot[i + 1][1]); ctx.lineTo(bot[i][0], bot[i][1]); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = "rgba(70,80,110,.22)"; ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let i = 1; i < N; i++) { ctx.moveTo(top[i][0], top[i][1]); ctx.lineTo(bot[i][0], bot[i][1]); }
    ctx.stroke();
  }
  // bord de fuite (ombre) et stabilos
  ctx.strokeStyle = "rgba(60,70,100,.55)"; ctx.lineWidth = Math.max(0.8, s * 0.008);
  ctx.beginPath(); bot.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.stroke();
  ctx.strokeStyle = "rgba(60,70,100,.35)"; ctx.lineWidth = Math.max(0.6, s * 0.005);
  ctx.beginPath(); top.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.stroke();
  ctx.fillStyle = "#d65a5a";
  for (const i of [0, N]) { ctx.beginPath(); ctx.arc(mid[i][0], mid[i][1], Math.max(1, s * 0.018), 0, Math.PI * 2); ctx.fill(); }
  // logo
  if (s > 14) {
    ctx.font = `800 ${Math.max(6, s * 0.1)}px "Inter Tight", Arial, sans-serif`;
    ctx.fillStyle = "#FF0000"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("EPFL", 0, mid[N / 2][1]);
  }
  // boîtier de pilotage
  ctx.fillStyle = "#3a4258"; ctx.fillRect(-s * 0.035, -s * 0.03, s * 0.07, s * 0.05);
  ctx.fillStyle = "#ff5a5a"; ctx.beginPath(); ctx.arc(0, -s * 0.005, Math.max(0.8, s * 0.008), 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
// --- Dessin de profil (bac à sable). Bord d'attaque vers +x local, envergure selon y local.
function drawParagliderSide(ctx, x, y, span, angle) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(angle);
  const s = span;
  ctx.strokeStyle = "rgba(40,50,70,.38)"; ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (let i = 1; i < 8; i++) {
    const u = i / 8 * 2 - 1, yy = u * s / 2, xx = -s * 0.1 + (1 - u * u) * s * 0.12;
    ctx.moveTo(xx, yy); ctx.lineTo(-s * 0.38, u * s * 0.12);
  }
  ctx.moveTo(-s * 0.38, -s * 0.06); ctx.lineTo(-s * 0.55, 0); ctx.moveTo(-s * 0.38, s * 0.06); ctx.lineTo(-s * 0.55, 0);
  ctx.stroke();
  const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2);
  g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#e7eaf2");
  ctx.shadowColor = "rgba(40,40,80,.25)"; ctx.shadowBlur = 5;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-s * 0.1, -s / 2);
  ctx.quadraticCurveTo(s * 0.55, 0, -s * 0.1, s / 2);
  ctx.quadraticCurveTo(s * 0.14, 0, -s * 0.1, -s / 2);
  ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(60,70,100,.45)"; ctx.lineWidth = 0.9; ctx.stroke();
  ctx.strokeStyle = "rgba(60,70,100,.2)"; ctx.lineWidth = 0.7;
  for (let i = 1; i < 10; i++) {
    const yy = -s / 2 + s * i / 10, k = 1 - Math.pow(2 * i / 10 - 1, 2);
    ctx.beginPath(); ctx.moveTo(-s * 0.1 + k * s * 0.12, yy); ctx.lineTo(-s * 0.1 + k * s * 0.27, yy); ctx.stroke();
  }
  ctx.save(); ctx.translate(s * 0.12, 0); ctx.rotate(Math.PI / 2);
  ctx.font = `800 ${Math.max(6, s * 0.13)}px "Inter Tight", Arial, sans-serif`;
  ctx.fillStyle = "#FF0000"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("EPFL", 0, 0);
  ctx.restore();
  ctx.fillStyle = "#3a4258"; ctx.fillRect(-s * 0.58, -s * 0.025, s * 0.05, s * 0.05);
  ctx.restore();
}

// --- Physique de traction en course ---
const KITE = { area: 150, LREAL: 200, LVIS: 72, CL: 1.0, LD0: 4.2, FAST: 6, KC_AUTO: 3.2 };
const KS = { deployed: false, dep: 0, damaged: 0, phi: 0, theta: 80, psi: 90, trim: 0.6, T: 0, fwd: 0, lat: 0, wf: 0, Va: 0,
  overload: 0, crashed: 0, kt: 0, pullAz: 0, azRel: 0, el: 30, trail: [], state: "stowed", azSmooth: 0 };
function kiteReset() {
  Object.assign(KS, { deployed: false, dep: 0, damaged: 0, phi: 0, theta: 80, psi: 90, trim: 0.6, T: 0, fwd: 0, lat: 0, wf: 0, Va: 0, overload: 0, crashed: 0, kt: 0, trail: [], state: "stowed" });
}
// vent à l'altitude du kite puis vent apparent dans le repère de la barge (x tribord, z avant)
function kiteAir(windKn, windFrom, heading, uMs, altReal) {
  const Wk = windKn * KN * Math.pow(Math.max(altReal, 10) / 10, 1 / 7);
  const rel = rad(windFrom - heading + 180);
  const ax = Wk * Math.sin(rel), az = Wk * Math.cos(rel) - uMs;
  const down = deg(Math.atan2(ax, az));
  return { Wk, Wa: Math.hypot(ax, az), down, awa: norm180(down + 180) };
}
function toggleKiteDeploy() {
  if (KS.damaged > 0) { toast(T("kite_damaged_wait"), "bad", "dmg", 2); return; }
  KS.deployed = !KS.deployed;
  if (KS.deployed && RACE.mode === "expert") Object.assign(KS, { phi: 0, theta: 80, psi: 90, crashed: 0, overload: 0 });
  toast(T(KS.deployed ? "kite_out" : "kite_in"), KS.deployed ? "good" : "", "kt" + KS.deployed, 0);
}
// Pilote automatique (débutant) : le kite fait des 8 dans la meilleure direction de traction
function kiteStepAuto(dt, air, tmax) {
  KS.damaged = Math.max(0, KS.damaged - dt);
  KS.dep = clamp(KS.dep + (KS.deployed ? 0.7 : -0.9) * dt, 0, 1);
  const awaAbs = Math.abs(air.awa), eff = kiteEfficiency(awaAbs);
  KS.kt += dt * Math.PI * 2 / clamp(9 - air.Wa * 0.25, 3.2, 8);
  const flying = KS.dep > 0.05 && air.Wa > 3 && eff > 0;
  KS.state = !KS.deployed ? "stowed" : air.Wa <= 3 ? "calm" : eff <= 0 ? "headwind" : "flying";
  KS.pullAz = Math.sign(air.down || 1) * Math.min(Math.abs(air.down), deg(Math.acos(clamp(eff, 0, 1))));
  KS.azSmooth = angLerp(KS.azSmooth, KS.pullAz, damp(2.5, dt));
  KS.azRel = KS.azSmooth + 26 * Math.sin(KS.kt);
  KS.el = flying ? 28 + 9 * Math.sin(2 * KS.kt) : lerp(KS.el, 75, damp(1, dt));
  KS.theta = KS.el; KS.wf = flying ? Math.cos(rad(KS.el)) * Math.cos(rad(KS.azRel - air.down)) : 0;
  if (flying) {
    KS.T = Math.min(0.5 * RHO * KITE.area * KITE.KC_AUTO * air.Wa * air.Wa * KS.dep * (0.85 + 0.3 * Math.cos(KS.kt) ** 2) / 1000, tmax * 1.4);
    const Th = KS.T * Math.cos(rad(30));
    KS.fwd = Th * eff - 0.06 * Th * Math.sqrt(1 - eff * eff);
    KS.lat = Th * Math.sqrt(1 - eff * eff) * Math.sign(KS.pullAz || 1);
  } else { KS.T = 0; KS.fwd = 0; KS.lat = 0; }
  // coup de vent : au-delà de la limite, le kite finit par se déchirer
  KS.overload = KS.T > tmax ? KS.overload + dt : Math.max(0, KS.overload - dt);
  if (KS.overload > 1.6) {
    KS.deployed = false; KS.damaged = 7; KS.overload = 0;
    raceEvent("kite_torn");
  }
}
// Pilotage manuel (expert) : lignes arrière = virage, lignes avant = puissance
function kiteStepManual(dt, air, steer, trimDir, tmax) {
  KS.damaged = Math.max(0, KS.damaged - dt);
  KS.dep = clamp(KS.dep + (KS.deployed ? 0.8 : -0.9) * dt, 0, 1);
  KS.trim = clamp(KS.trim + trimDir * 0.55 * dt, 0.3, 1);
  if (!KS.deployed || KS.dep < 0.6) {
    KS.state = KS.deployed ? "launch" : "stowed"; KS.T = KS.fwd = KS.lat = 0;
    KS.azRel = air.down; KS.el = 80;
    return;
  }
  if (KS.crashed > 0) {
    KS.crashed -= dt; KS.T = KS.fwd = KS.lat = 0; KS.state = "crashed";
    if (KS.crashed <= 0) Object.assign(KS, { phi: 0, theta: 70, psi: 90, trim: 0.6, overload: 0 });
    return;
  }
  KS.state = "flying";
  const wf = Math.max(0, Math.cos(rad(KS.theta)) * Math.cos(rad(KS.phi)));
  const LD = KITE.LD0 * (0.55 + 0.45 * KS.trim);
  const vt = air.Wa * wf * LD + 0.12 * air.Wa;                // vitesse de l'aile en travers du vent (m/s)
  const om = Math.min(110, deg(vt / KITE.LREAL) * KITE.FAST);   // vitesse angulaire dans la fenêtre (°/s, rythme de jeu)
  KS.psi = norm180(KS.psi + steer * (55 + 115 * clamp(vt / 25, 0, 1)) * dt);
  KS.theta += om * Math.cos(rad(KS.psi)) * dt;
  KS.phi += om * Math.sin(rad(KS.psi)) * dt / Math.max(Math.cos(rad(KS.theta)), 0.3);
  if (vt < 5) KS.theta -= (5 - vt) * 2.6 * dt;                // trop lent : l'aile retombe
  if (Math.abs(KS.phi) > 88) KS.phi = Math.sign(KS.phi) * 88; // bord de la fenêtre : l'aile décroche
  if (KS.theta > 88) KS.theta = 88;
  KS.wf = wf;
  KS.Va = air.Wa * wf * Math.sqrt(1 + LD * LD);
  KS.T = 0.5 * RHO * KITE.area * KITE.CL * (0.2 + 0.8 * KS.trim) * KS.Va * KS.Va / 1000;
  KS.azRel = air.down + KS.phi; KS.el = KS.theta;
  const Th = KS.T * Math.cos(rad(KS.theta));
  KS.fwd = Th * Math.cos(rad(KS.azRel)); KS.lat = Th * Math.sin(rad(KS.azRel));
  KS.overload = KS.T > tmax ? KS.overload + dt : Math.max(0, KS.overload - dt * 1.5);
  if (KS.overload > 1.0) { KS.crashed = 4; KS.overload = 0; raceEvent("line_break"); }
  else if (KS.theta < 1.5) { KS.crashed = 3.5; raceEvent("kite_water"); }
}
// Fenêtre de vol en 3D : quart de sphère autour du point d'attache, centré sous le vent
function drawWindow3D(ctx, cam, anchor, downBearing, L) {
  const pt = (phi, th) => {
    const az = rad(downBearing + phi), el = rad(th);
    const p = cam.p(anchor[0] + L * Math.cos(el) * Math.sin(az), anchor[1] + L * Math.cos(el) * Math.cos(az), anchor[2] + L * Math.sin(el));
    return Math.abs(p[3]) > 150 || p[2] < 1 ? null : p;
  };
  const stops = [[0, "#a8e6d3"], [0.3, "#f7e3a1"], [0.6, "#ffc9a8"], [1, "#f58ea8"]];
  ctx.globalAlpha = 0.24;
  for (let phi = -90; phi < 90; phi += 15) for (let th = 0; th < 90; th += 15) {
    const q = [pt(phi, th), pt(phi + 15, th), pt(phi + 15, th + 15), pt(phi, th + 15)];
    if (q.some(p => !p)) continue;
    ctx.beginPath(); q.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
    ctx.fillStyle = colorAt(stops, Math.cos(rad(th + 7.5)) * Math.cos(rad(phi + 7.5))); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const path = pts => { ctx.beginPath(); let pen = false; for (const p of pts) { if (!p) { pen = false; continue; } pen ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); pen = true; } ctx.stroke(); };
  ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 0.8;
  for (let phi = -60; phi <= 60; phi += 30) { const a = []; for (let th = 0; th <= 90; th += 6) a.push(pt(phi, th)); path(a); }
  for (let th = 20; th < 90; th += 20) { const a = []; for (let phi = -90; phi <= 90; phi += 6) a.push(pt(phi, th)); path(a); }
  ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.lineWidth = 1.6; ctx.setLineDash([6, 5]);
  { const a = []; for (let th = 0; th <= 90; th += 6) a.push(pt(-90, th)); for (let th = 90; th >= 0; th -= 6) a.push(pt(90, th)); path(a); }
  ctx.setLineDash([]);
  ctx.font = '600 10px "JetBrains Mono", monospace'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const label = (txt, phi, th, col) => {
    const p = pt(phi, th); if (!p) return;
    const tw = ctx.measureText(txt).width + 10;
    ctx.fillStyle = "rgba(255,255,255,.82)"; ctx.fillRect(p[0] - tw / 2, p[1] - 8, tw, 16);
    ctx.fillStyle = col; ctx.fillText(txt, p[0], p[1]);
  };
  label(T("win_power"), 0, 14, "#c94468");
  label(T("win_edge"), 78, 22, "#2f8f72"); label(T("win_edge"), -78, 22, "#2f8f72");
  label(T("win_zenith"), -30, 82, "#2f8f72");
}
