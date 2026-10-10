// ================================================================
//  BAC À SABLE : état, missions, tableaux de bord et vue de travers
// ================================================================
const SB_DEFAULTS = { speed: 8, heading: 250, windDir: 20, windSpeed: 14 };
const P = { ...SB_DEFAULTS, kite: true };
let S = null;
let curveDirty = true;

function recompute() {
  const p = { heading: P.heading, windDir: P.windDir, windSpeed: P.windSpeed };
  const sim = simulate(p, P.speed, P.kite);
  const ref = simulate(p, CFG.VREF, false);
  const dec = decompose(p, P.speed, P.kite);
  const curve = [];
  for (let v = 4; v <= 10.001; v += 0.2) curve.push({ v, no: simulate(p, v, false).co2, kite: simulate(p, v, P.kite).co2 });
  S = { p, sim, ref, dec, curve, savePct: (dec.total / dec.E0) * 100, hours: sim.hours };
  updateSandboxDom();
  checkMission();
}

const fmtHours = h => `${Math.floor(h)} h ${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
function initSandbox() {
  const k = $("knobs");
  createKnob(k, { key: "speed", state: P, label: "kn_speed", min: 4, max: 10, step: 0.1, wheel: 0.5, def: 8, color: "#3fb894", color2: "#8fe0c8", keys: ["↑", "↓"], fmt: v => `${fmt1(v)}<i>${T("u_kn")}</i>`, onChange: recompute });
  createKnob(k, { key: "heading", state: P, label: "kn_heading", min: 0, max: 360, step: 1, wheel: 5, wrap: true, def: 250, color: "#4cbf7f", color2: "#8fe0c8", keys: ["←", "→"], fmt: v => `${Math.round(v)}°<i>${cardinal(v)}</i>`, onChange: recompute });
  createKnob(k, { key: "windDir", state: P, label: "kn_winddir", min: 0, max: 360, step: 1, wheel: 5, wrap: true, def: 20, color: "#6aaee8", color2: "#3d5f94", keys: ["🖱"], fmt: v => `${Math.round(v)}°<i>${cardinal(v)}</i>`, onChange: recompute });
  createKnob(k, { key: "windSpeed", state: P, label: "kn_windspeed", min: 0, max: 35, step: 1, wheel: 1, def: 14, color: "#3d5f94", color2: "#6aaee8", keys: ["🖱"], fmt: v => `${Math.round(v)}<i>${T("u_kn")}</i>`, onChange: recompute });
  $("kiteSwitch").addEventListener("click", toggleSandboxKite);
  const PRESETS = {
    ref: { speed: 8, heading: 250, windDir: 20, windSpeed: 14, kite: false }, slow: { speed: 6 },
    ideal: { heading: 250, windDir: 110, windSpeed: 24, kite: true }, storm: { heading: 250, windDir: 250, windSpeed: 22 }
  };
  document.querySelectorAll("[data-preset]").forEach(b => b.addEventListener("click", () => setParams(PRESETS[b.dataset.preset])));
  MISSIONS.forEach(() => { const d = document.createElement("div"); d.className = "dot"; $("mDots").appendChild(d); });
  $("mPrev").addEventListener("click", () => showMission(mIdx - 1));
  $("mNext").addEventListener("click", () => showMission(mIdx + 1));
  SC = setupCanvas($("scene"));
  CP = setupCanvas($("compass"));
  GA = [setupCanvas($("g1")), setupCanvas($("g2")), setupCanvas($("g3"))];
  CV = setupCanvas($("curve"), () => { curveDirty = true; });
  langListeners.push(() => { if (S) { updateSandboxDom(); showMissionText(); } });
  recompute();
  showMission(0);
}
function setParams(o, silent) {
  for (const k of ["speed", "heading", "windDir", "windSpeed"]) if (k in o) knobs[k].set(o[k], true);
  if ("kite" in o) setSandboxKite(o.kite, true);
  if (!silent) recompute();
}
function setSandboxKite(on, silent) {
  P.kite = on;
  $("kiteSwitch").classList.toggle("on", on); $("kiteSwitch").setAttribute("aria-checked", on);
  if (!silent) recompute();
}
const toggleSandboxKite = () => setSandboxKite(!P.kite);

// ---------------- Missions ----------------
const MISSIONS = [
  { key: "m1", check: s => P.speed >= 7.9 && s.savePct >= 15 },
  { key: "m2", check: s => s.savePct >= 50 },
  { key: "m3", setup: { heading: 250, windDir: 250, windSpeed: 22, speed: 8, kite: true }, check: s => s.savePct >= 30 },
  { key: "m4", setup: { ...SB_DEFAULTS, kite: true }, check: s => s.hours <= 6 && s.savePct >= 55 }
];
let mIdx = 0;
const won = new Set();
function showMissionText() {
  $("mEyebrow").textContent = T("mission_n", { n: mIdx + 1, m: MISSIONS.length });
  $("mTitle").textContent = T(MISSIONS[mIdx].key + "_title");
  $("mText").textContent = T(MISSIONS[mIdx].key + "_text");
  checkMission();
}
function showMission(i) {
  mIdx = (i + MISSIONS.length) % MISSIONS.length;
  const m = MISSIONS[mIdx];
  if (m.setup) setParams(m.setup);
  showMissionText();
}
function checkMission() {
  if (!S) return;
  const ok = MISSIONS[mIdx].check(S);
  if (ok && !won.has(mIdx) && VIEW === "sandbox") toast(T("m_toast", { n: mIdx + 1 }), "good", "m" + mIdx, 0);
  if (ok) won.add(mIdx);
  $("mission").classList.toggle("done", ok);
  $("mStatus").textContent = ok ? T("m_done") : (won.has(mIdx) ? T("m_already") : T("m_running"));
  [...$("mDots").children].forEach((d, i) => { d.classList.toggle("won", won.has(i)); d.classList.toggle("active", i === mIdx); });
}

// ---------------- Tableaux de bord ----------------
function delta(el, cur, ref) {
  const d = (cur - ref) / ref * 100;
  el.className = Math.abs(d) < 0.5 ? "flat" : (d < 0 ? "down" : "up");
  el.textContent = Math.abs(d) < 0.5 ? T("delta_ref") : `${d > 0 ? "+" : "−"}${fmt0(Math.abs(d))} %`;
}
const STATE_KEYS = { flying: "st_flying", off: "st_off", calm: "st_calm", storm: "st_storm", headwind: "st_headwind" };
function updateSandboxDom() {
  const { sim, ref, dec } = S;
  $("kFuel").textContent = `${fmt0(sim.fuel * 1000)} kg`; delta($("kFuelD"), sim.fuel, ref.fuel);
  $("kCo2").textContent = `${fmt0(sim.co2 * 1000)} kg`; delta($("kCo2D"), sim.co2, ref.co2);
  $("kDays").textContent = fmtHours(sim.hours);
  const dh = (sim.hours - ref.hours) * 60;
  $("kDaysD").className = Math.abs(dh) < 1 ? "flat" : (dh > 0 ? "up" : "down");
  $("kDaysD").textContent = Math.abs(dh) < 1 ? T("delta_ref") : `${dh > 0 ? "+" : "−"}${fmt0(Math.abs(dh))} min`;
  $("kPow").textContent = `${fmt0(sim.Pbrake)} kW`; delta($("kPowD"), sim.Pbrake, ref.Pbrake);

  const total = dec.total / dec.E0 * 100;
  $("aBig").textContent = Math.abs(total) < 0.5 ? T("big_zero") : total > 0 ? T("big_less", { p: fmt0(total) }) : T("big_more", { p: fmt0(-total) });
  $("aBig").className = "big " + (total >= 0.5 ? "good" : total <= -0.5 ? "bad" : "");
  $("aSub").textContent = T(total >= 0 ? "sub_saved" : "sub_more", { t: fmt0(Math.abs(dec.total) * 1000), r: fmt0(dec.E0 * 1000) });
  const sp = Math.max(dec.speed, 0) / dec.E0 * 100, kp = Math.max(dec.kite, 0) / dec.E0 * 100;
  const rest = clamp(100 - sp - kp, 0, 100);
  $("segRest").style.width = rest + "%"; $("segRest").textContent = rest > 16 ? T("seg_emitted", { p: fmt0(rest) }) : "";
  $("segSpeed").style.width = sp + "%"; $("segSpeed").textContent = sp > 11 ? T("seg_speed", { p: fmt0(sp) }) : "";
  $("segKite").style.width = kp + "%"; $("segKite").textContent = kp > 9 ? T("seg_kite", { p: fmt0(kp) }) : "";
  $("aRest").textContent = T("rest_emitted", { t: fmt0(dec.E3 * 1000) });
  const gain = Math.max(dec.speed, 0) + Math.max(dec.kite, 0);
  const shS = gain > 0 ? Math.max(dec.speed, 0) / gain * 100 : 0, shK = gain > 0 ? 100 - shS : 0;
  $("shareSpeed").style.width = shS + "%"; $("shareSpeed").textContent = shS > 14 ? T("share_speed", { p: fmt0(shS) }) : "";
  $("shareKite").style.width = shK + "%"; $("shareKite").textContent = shK > 14 ? T("share_kite", { p: fmt0(shK) }) : "";
  $("aSplit").textContent = gain > 0 ? T("split_txt", { s: fmt0(shS), k: fmt0(shK) }) : T("no_gain");
  const vRatio = P.speed / CFG.VREF;
  let txt;
  if (P.speed > CFG.VREF + 0.05) txt = T("ins_faster", { p: fmt0((Math.pow(vRatio, 3) - 1) * 100), v: fmt0((vRatio - 1) * 100) });
  else if (gain < 0.0005) txt = T("ins_nogain");
  else {
    txt = T("ins_main", { s: fmt0(shS), k: fmt0(shK) });
    if (shS >= 55) txt += T("ins_speed_main", { v: fmt1(P.speed), p: fmt0(Math.pow(vRatio, 3) * 100), f: fmt0(vRatio * vRatio * 100) });
    else if (P.speed >= CFG.VREF - 0.3) txt += T("ins_not_slowed");
    else if (shK > 0) txt += T("ins_wind_fav");
    else txt += T("ins_kite_none");
  }
  $("insight").innerHTML = txt;
  $("g1v").textContent = `${total >= 0 ? "" : "+"}${fmt0(Math.abs(total))} %`;
  $("g1s").textContent = T("g1_sub", { t: fmt0(Math.abs(ref.fuel - sim.fuel) * 1000), dir: T(total >= 0 ? "less" : "more") });
  $("g2v").textContent = `${fmt0(Math.max(dec.total, 0) * 1000)} kg`;
  $("g2s").textContent = T("g2_sub", { n: fmt0(Math.max(dec.total, 0) * 1000 / 0.12) });
  $("g3v").textContent = `${fmt1(sim.fwd)} kN`;
  $("g3s").textContent = sim.state === "flying" ? T("g3_sub", { p: fmt0(sim.fwd / Math.max(sim.R0, 1) * 100) }) : T(STATE_KEYS[sim.state] + "_short");
  const curV = Math.round(P.speed);
  $("cubeRows").innerHTML = [10, 8, 7, 6, 5, 4].map(v => {
    const pct = Math.pow(v / CFG.VREF, 2) * 100;
    const col = colorAt([[0, "#5fc9a8"], [0.55, "#f2c14e"], [1, "#f07d9c"]], (pct - 25) / 130);
    return `<div class="cube-row${v === curV ? " cur" : ""}"><span>${v} ${T("u_kn")}</span><div class="track"><div class="fill" style="width:${pct / 1.6}%;background:${col}"></div></div><span class="pct" style="color:${col}">${fmt0(pct)} %</span></div>`;
  }).join("");
  const off = sim.state !== "flying";
  $("kiteState").classList.toggle("off", off); $("kiteStateText").textContent = T(STATE_KEYS[sim.state]);
  $("lCap").textContent = `${Math.round(P.heading)}°`;
  $("lWind").textContent = `${fmt0(P.windSpeed)} ${T("u_kn")}`;
  $("lApp").textContent = `${fmt0(sim.deck.speed / KN)} ${T("u_kn")}`;
  $("lKite").textContent = `${fmt1(sim.fwd)} kN`;
  curveDirty = true;
}
function updateSandboxHud() {
  const sim = S.sim;
  $("hV1").innerHTML = `${fmt1(P.speed)}<i>${T("u_kn")} · ${Math.round(P.heading)}°</i>`;
  $("hV2").innerHTML = `${fmt0(P.windSpeed)}<i>${T("u_kn")} · ${cardinal(P.windDir)}</i>`;
  $("hV3").innerHTML = `${fmt0(sim.vaKkn)}<i>${T("u_kn")} · ${fmt0(Math.abs(sim.awaK))}°</i>`;
  $("hV4").innerHTML = `${fmt1(sideScene.force)}<i>kN</i>`;
}

// ---------------- Vue de travers (bac à sable) ----------------
let SC, CP, GA, CV;
const sideScene = { clouds: Array.from({ length: 7 }, (_, i) => ({ x: (i * 0.37) % 1, y: 0.1 + ((i * 0.53) % 1) * 0.28, s: 0.6 + ((i * 0.71) % 1) * 1.1 })),
  smoke: [], trail: [], spray: [], time: 0, sea: 0, kt: 0, deploy: 1, smokeAcc: 0, lastKite: null, force: 0 };
// Silhouette des Dents du Midi (7 sommets) et des collines de Lavaux, en fractions de la largeur
function dentsProfile(x) {
  const peaks = [[0.08, 0.55], [0.13, 0.75], [0.17, 0.66], [0.21, 0.92], [0.25, 0.8], [0.29, 1.0], [0.34, 0.7]];
  let y = 0.18 + 0.12 * Math.sin(x * 9);
  for (const [px, ph] of peaks) y = Math.max(y, ph * Math.max(0, 1 - Math.abs(x - px) / 0.045));
  return y;
}
function drawSide(dt) {
  const { ctx, w, h } = SC;
  if (!S) return;
  const sim = S.sim, t = sideScene.time += dt;
  const horizon = h * 0.6, storm = smooth((P.windSpeed - 24) / 10);
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#94b9d6"); sky.addColorStop(0.55, "#c4d8e6"); sky.addColorStop(0.85, "#ecdfda"); sky.addColorStop(1, "#f7dccd");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, horizon + 2);
  const sunX = w * 0.78, sunY = horizon - h * 0.22;
  let g = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, h * 0.55);
  g.addColorStop(0, "rgba(255,246,228,.95)"); g.addColorStop(0.1, "rgba(255,232,210,.45)"); g.addColorStop(1, "rgba(255,232,210,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, horizon);
  const flowFwd = sim.deck.speed * Math.cos(rad(sim.flowRelDeck));
  for (const c of sideScene.clouds) {
    c.x += flowFwd * dt * 0.0014 * c.s;
    if (c.x > 1.3) c.x -= 1.6; if (c.x < -0.3) c.x += 1.6;
    drawSideCloud(ctx, c.x * w, c.y * horizon, c.s * Math.max(0.6, w / 1100));
  }
  // Dents du Midi enneigées au loin, puis les terrasses de Lavaux
  const mH = h * 0.24;
  ctx.fillStyle = "rgba(150,168,192,.75)";
  ctx.beginPath(); ctx.moveTo(0, horizon);
  for (let x = 0; x <= w; x += 4) ctx.lineTo(x, horizon - dentsProfile(x / w) * mH);
  ctx.lineTo(w, horizon); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,.85)";
  ctx.beginPath(); ctx.moveTo(0, horizon - mH * 0.62);
  for (let x = 0; x <= w; x += 4) ctx.lineTo(x, Math.min(horizon - dentsProfile(x / w) * mH, horizon - mH * 0.62));
  ctx.lineTo(w, horizon - mH * 0.62); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#a7bba1";
  ctx.beginPath(); ctx.moveTo(w * 0.42, horizon);
  for (let x = w * 0.42; x <= w; x += 6) ctx.lineTo(x, horizon - h * (0.05 + 0.07 * smooth((x / w - 0.42) / 0.3)) - Math.sin(x * 0.02) * 2);
  ctx.lineTo(w, horizon); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(110,140,95,.45)"; ctx.lineWidth = 1;
  for (let i = 1; i < 7; i++) {
    ctx.beginPath();
    for (let x = w * 0.5; x <= w; x += 8) { const yy = horizon - h * (0.012 * i) * smooth((x / w - 0.45) / 0.3); x === w * 0.5 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
    ctx.stroke();
  }
  // lac : bleu-vert, peu de vagues sauf par vent fort
  const lake = ctx.createLinearGradient(0, horizon, 0, h);
  lake.addColorStop(0, "#b5cbd6"); lake.addColorStop(0.25, "#7fa9bd"); lake.addColorStop(1, "#3f7590");
  ctx.fillStyle = lake; ctx.fillRect(0, horizon, w, h - horizon);
  sideScene.sea += sim.V * dt * 14;
  const amp = 0.15 + Math.pow(P.windSpeed / 14, 2) * 0.6;
  for (let i = 0; i < 16; i++) {
    const k = i / 15, y = horizon + Math.pow(k, 1.7) * (h - horizon);
    const a = amp * (0.3 + k * 3), freq = 0.06 / (0.4 + k * 2.2);
    ctx.beginPath();
    for (let x = 0; x <= w + 8; x += 8) {
      const yy = y + Math.sin(x * freq + sideScene.sea * freq * (0.6 + k) + i * 1.7) * a + Math.sin(x * freq * 2.3 + t * 1.2 + i) * a * 0.3;
      x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.strokeStyle = `rgba(240,248,252,${0.06 + k * 0.08})`; ctx.lineWidth = 1 + k; ctx.stroke();
  }
  // barge
  const L = Math.min(w * 0.5, 600), x0 = w * 0.06 + L / 2, wl = horizon + (h - horizon) * 0.45;
  const bob = Math.sin(t * 0.8) * (0.6 + P.windSpeed / 25), pitch = Math.sin(t * 0.6 + 1) * 0.006 * (1 + P.windSpeed / 20);
  for (let i = 0; i < 16; i++) {
    const p = i / 15, wx = x0 - L / 2 - p * w * 0.2 * (0.4 + sim.vKn / 10);
    ctx.fillStyle = `rgba(248,252,255,${(1 - p) * 0.24 * (sim.vKn / 8)})`;
    ctx.beginPath(); ctx.ellipse(wx, wl + 3 + Math.sin(t * 3 + i), 24 + p * 46, 2.5 + p * 3, 0, 0, Math.PI * 2); ctx.fill();
  }
  const bargeInfo = drawBargeSide(ctx, x0, wl + bob, L, pitch, t);
  const bowX = x0 + L / 2 - L * 0.02;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = `rgba(248,252,255,${0.4 - i * 0.11})`;
    ctx.beginPath(); ctx.ellipse(bowX - i * 8, wl + bob + 1, 8 + sim.vKn * 2.4 + i * 10, 2 + sim.vKn * 0.2, 0, Math.PI, 0); ctx.fill();
  }
  drawSideSmoke(ctx, dt, bargeInfo.exhaust.x, bargeInfo.exhaust.y, sim.Pbrake / 100, flowFwd * 7);
  // kite en 8
  const mast = bargeInfo.mast, flying = sim.state === "flying";
  sideScene.deploy = clamp(sideScene.deploy + (flying ? 1 : -1) * dt * 0.6, 0, 1);
  const dep = smooth(sideScene.deploy);
  sideScene.kt += dt * Math.PI * 2 / clamp(12 - sim.vaKkn * 0.25, 3.6, 10);
  const kt = sideScene.kt;
  const Lt = Math.max(40, Math.min((mast.y - 26) / 0.72, (w - mast.x - 26) / 0.84));
  if (sideScene.az === undefined) sideScene.az = sim.pullAz;
  if (Math.abs(sim.pullAz - sideScene.az) > 12) sideScene.trail.length = 0;
  sideScene.az = lerp(sideScene.az, sim.pullAz, damp(3, dt));
  const az = sideScene.az + 30 * Math.sin(kt), el = CFG.ELEV + 9 * Math.sin(2 * kt);
  const f = Math.cos(rad(el)) * Math.cos(rad(az)), sdep = Math.cos(rad(el)) * Math.sin(rad(az)), u = Math.sin(rad(el));
  const kx = mast.x + Lt * dep * (f * 0.62 + sdep * 0.5), ky = mast.y - Lt * dep * (u + sdep * 0.1) - (1 - dep) * 6;
  if (dep > 0.85) { if (sideScene.trailKt === undefined || kt - sideScene.trailKt > Math.PI * 2 / 140) { sideScene.trail.push({ x: kx - mast.x, y: ky - mast.y }); sideScene.trailKt = kt; } }
  else sideScene.trail.length = 0;
  if (sideScene.trail.length > 130) sideScene.trail.shift();
  for (let i = 1; i < sideScene.trail.length; i++) {
    const a = i / sideScene.trail.length;
    ctx.strokeStyle = `rgba(255,255,255,${a * 0.75})`; ctx.lineWidth = 0.8 + a * 1.8;
    ctx.beginPath(); ctx.moveTo(mast.x + sideScene.trail[i - 1].x, mast.y + sideScene.trail[i - 1].y); ctx.lineTo(mast.x + sideScene.trail[i].x, mast.y + sideScene.trail[i].y); ctx.stroke();
  }
  if (dep > 0.02) {
    const sag = 16 * (1 - Math.min(sim.T / 30, 1)) + 3;
    ctx.strokeStyle = "rgba(40,50,70,.6)"; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(mast.x, mast.y); ctx.quadraticCurveTo((mast.x + kx) / 2, (mast.y + ky) / 2 + sag, kx, ky); ctx.stroke();
  }
  const prev = sideScene.lastKite || { x: kx - 1, y: ky };
  let ang = Math.atan2(ky - prev.y, kx - prev.x);
  if (dep < 0.3) ang = -Math.PI / 2;
  sideScene.angle = sideScene.angle === undefined ? ang : sideScene.angle + norm180(deg(ang - sideScene.angle)) * Math.PI / 180 * Math.min(1, dt * 10);
  sideScene.lastKite = { x: kx, y: ky };
  drawParagliderSide(ctx, kx, ky, Math.max(26, Lt * 0.3) * (1 - sdep * 0.3) * (0.45 + 0.55 * dep), sideScene.angle);
  if (storm > 0.01) { ctx.fillStyle = `rgba(70,80,105,${0.35 * storm})`; ctx.fillRect(0, 0, w, h); }
  drawRainLayer(ctx, w, h, t, storm, clamp(flowFwd / 14, -1.2, 1.2) * 14, 140);
  sideScene.force = flying ? sim.T * (0.85 + 0.3 * Math.pow(Math.cos(kt), 2)) * dep : 0;
}
function drawSideCloud(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const g = ctx.createLinearGradient(0, -14, 0, 10);
  g.addColorStop(0, "rgba(255,250,250,.7)"); g.addColorStop(1, "rgba(214,222,236,.25)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0, 0, 90, 8, 0, 0, Math.PI * 2); ctx.ellipse(-30, -4, 46, 8, 0, 0, Math.PI * 2); ctx.ellipse(26, -6, 52, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawRainLayer(ctx, w, h, t, storm, slant, n) {
  if (storm < 0.01) return;
  ctx.strokeStyle = `rgba(225,232,245,${0.42 * storm})`; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const rx = ((i * 97.13 + t * 260 * (0.7 + (i % 5) * 0.1)) % (w + 60)) - 30;
    const ry = ((i * 53.7 + t * 620 * (0.8 + (i % 3) * 0.1)) % (h + 40)) - 20;
    ctx.moveTo(rx, ry); ctx.lineTo(rx + slant, ry + 16);
  }
  ctx.stroke();
}
function drawSideSmoke(ctx, dt, fx, fy, intensity, wind) {
  const sc = sideScene;
  sc.smokeAcc += dt * intensity;
  while (sc.smokeAcc > 1) { sc.smokeAcc -= 1; sc.smoke.push({ x: fx + (Math.random() - .5) * 3, y: fy, vx: 0, vy: -12 - Math.random() * 8, r: 2 + Math.random() * 2, life: 0, max: 3 + Math.random() }); }
  for (let i = sc.smoke.length - 1; i >= 0; i--) {
    const s = sc.smoke[i];
    s.life += dt;
    if (s.life > s.max) { sc.smoke.splice(i, 1); continue; }
    s.vx = lerp(s.vx, wind, dt * 0.8); s.x += s.vx * dt; s.y += s.vy * dt; s.r += dt * 7;
    ctx.fillStyle = `rgba(120,126,140,${(1 - s.life / s.max) * 0.16})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  }
}
// Barge vue de profil : coque basse, cale chargée de gravier, timonerie à l'arrière, mât de kite à l'avant
function drawBargeSide(ctx, cx, wl, L, pitch, t) {
  const H = L * 0.055;
  ctx.save(); ctx.translate(cx, wl); ctx.rotate(pitch);
  ctx.fillStyle = "rgba(20,40,70,.22)"; ctx.beginPath(); ctx.ellipse(0, H * 0.45, L * 0.52, H * 0.5, 0, 0, Math.PI * 2); ctx.fill();
  // gravier
  ctx.fillStyle = "#a99c88";
  ctx.beginPath(); ctx.moveTo(-L * 0.33, -H); ctx.quadraticCurveTo(-L * 0.28, -H * 2.6, -L * 0.15, -H * 2.75);
  ctx.lineTo(L * 0.3, -H * 2.7); ctx.quadraticCurveTo(L * 0.4, -H * 2.5, L * 0.42, -H); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.18)";
  for (let i = 0; i < 70; i++) { const x = -L * 0.3 + ((i * 37) % 100) / 100 * L * 0.7, y = -H * (1.15 + ((i * 53) % 100) / 100 * 1.4); ctx.fillRect(x, y, 1.6, 1.6); }
  // coque
  const hull = new Path2D();
  hull.moveTo(-L / 2, -H); hull.lineTo(L / 2 - L * 0.04, -H * 1.12);
  hull.quadraticCurveTo(L / 2 + L * 0.01, -H * 0.3, L / 2 - L * 0.05, H * 0.35);
  hull.lineTo(-L / 2 + L * 0.03, H * 0.35); hull.quadraticCurveTo(-L / 2 - L * 0.005, H * 0.1, -L / 2, -H); hull.closePath();
  const g = ctx.createLinearGradient(0, -H, 0, H * 0.35);
  g.addColorStop(0, "#38486a"); g.addColorStop(0.55, "#283652"); g.addColorStop(0.58, "#c25a5a"); g.addColorStop(1, "#8f3c3c");
  ctx.fillStyle = g; ctx.fill(hull);
  ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 1; ctx.stroke(hull);
  ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.fillRect(-L / 2 + 4, -H * 0.86, L * 0.95, 1.5);
  ctx.fillStyle = "#e8ebf1"; ctx.fillRect(-L * 0.34, -H * 1.35, L * 0.77, H * 0.38);
  // timonerie
  const bx = -L * 0.48, bw = L * 0.12, bh = H * 2.9;
  const gb = ctx.createLinearGradient(bx, 0, bx + bw, 0); gb.addColorStop(0, "#f5f6f9"); gb.addColorStop(1, "#c6ccd8");
  ctx.fillStyle = gb; ctx.fillRect(bx, -H - bh, bw, bh);
  ctx.fillStyle = "#34465f"; ctx.fillRect(bx + 3, -H - bh + H * 0.4, bw - 6, H * 0.5);
  ctx.fillStyle = "#d7dce6"; ctx.fillRect(bx - 3, -H - bh - 3, bw + 6, 4);
  ctx.strokeStyle = "#5a6478"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx + bw * 0.5, -H - bh); ctx.lineTo(bx + bw * 0.5, -H - bh - H * 1.4); ctx.stroke();
  const exhaust = { x: cx + bx + bw * 0.85, y: wl - H - bh };
  // mât du kite à l'avant
  const mx = L * 0.44, mh = H * 3.4;
  ctx.strokeStyle = "#e3e7ee"; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(mx - L * 0.02, -H * 1.1); ctx.lineTo(mx, -H - mh); ctx.lineTo(mx + L * 0.015, -H * 1.12); ctx.stroke();
  ctx.fillStyle = "#f07d9c"; ctx.beginPath(); ctx.arc(mx, -H - mh, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  return { mast: { x: cx + mx, y: wl - H - mh }, exhaust };
}

// ---------------- Boussole, jauges et courbe (bac à sable) ----------------
const windParticles = Array.from({ length: 60 }, (_, i) => ({ x: ((i * 0.618) % 1) * 2 - 1, y: ((i * 0.381) % 1) * 2 - 1, life: (i * 0.137) % 1 }));
const smoothC = { heading: P.heading, windDir: P.windDir, app: 0, pull: 0 };
function arrow(ctx, x1, y1, x2, y2, color, width, dash) {
  const a = Math.atan2(y2 - y1, x2 - x1), hl = 7 + width * 1.5;
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = "round";
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * hl * 0.6, y2 - Math.sin(a) * hl * 0.6); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - hl * Math.cos(a - 0.42), y2 - hl * Math.sin(a - 0.42)); ctx.lineTo(x2 - hl * Math.cos(a + 0.42), y2 - hl * Math.sin(a + 0.42));
  ctx.closePath(); ctx.fill();
  ctx.restore();
}
const bdir = a => [Math.sin(rad(a)), -Math.cos(rad(a))];
function drawCompass(dt) {
  const { ctx, w, h } = CP, sim = S.sim, k = damp(8, dt);
  smoothC.heading = angLerp(smoothC.heading, P.heading, k); smoothC.windDir = angLerp(smoothC.windDir, P.windDir, k);
  smoothC.app = angLerp(smoothC.app, sim.deck.fromBearing, k); smoothC.pull = angLerp(smoothC.pull, P.heading + sim.pullAz, k);
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.47;
  const g = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
  g.addColorStop(0, "#ffffff"); g.addColorStop(0.75, "#f1f4f9"); g.addColorStop(1, "#e1e7f1");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(31, 58, 104,.35)"; ctx.lineWidth = 1.2; ctx.stroke();
  const [wdx, wdy] = bdir(P.windDir + 180), wsp = P.windSpeed / 25;
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R - 2, 0, Math.PI * 2); ctx.clip();
  for (const p of windParticles) {
    p.x += wdx * dt * (0.15 + wsp * 0.45); p.y += wdy * dt * (0.15 + wsp * 0.45); p.life += dt * 0.4;
    if (p.x * p.x + p.y * p.y > 1.05 || p.life > 1) { p.x = Math.random() * 2 - 1 - wdx * 0.6; p.y = Math.random() * 2 - 1 - wdy * 0.6; p.life = 0; }
    ctx.strokeStyle = `rgba(106,174,232,${Math.sin(p.life * Math.PI) * 0.6 * Math.min(1, wsp + 0.2)})`; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(cx + p.x * R, cy + p.y * R); ctx.lineTo(cx + (p.x - wdx * 0.06) * R, cy + (p.y - wdy * 0.06) * R); ctx.stroke();
  }
  ctx.restore();
  for (let a = 0; a < 360; a += 10) {
    const [dx, dy] = bdir(a), major = a % 90 === 0, mid = a % 30 === 0, r1 = R * (major ? 0.85 : mid ? 0.9 : 0.94);
    ctx.strokeStyle = `rgba(38,43,69,${major ? .6 : mid ? .3 : .12})`; ctx.lineWidth = major ? 1.8 : 1;
    ctx.beginPath(); ctx.moveTo(cx + dx * r1, cy + dy * r1); ctx.lineTo(cx + dx * R * 0.98, cy + dy * R * 0.98); ctx.stroke();
  }
  ctx.font = `600 ${Math.max(9, R * 0.11)}px "JetBrains Mono", monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  [0, 2, 4, 6].forEach((ci, i) => {
    const [dx, dy] = bdir(i * 90);
    ctx.fillStyle = i === 0 ? "#e0648a" : "#6b7090";
    ctx.fillText(CARDS[LANG][ci], cx + dx * R * 0.72, cy + dy * R * 0.72);
  });
  { const [dx, dy] = bdir(smoothC.windDir), len = 0.25 + Math.min(P.windSpeed / 35, 1) * 0.35;
    arrow(ctx, cx + dx * R * 0.97, cy + dy * R * 0.97, cx + dx * R * (0.97 - len), cy + dy * R * (0.97 - len), "#6aaee8", 3); }
  { const [dx, dy] = bdir(smoothC.app), len = 0.2 + Math.min(sim.deck.speed / KN / 40, 1) * 0.4;
    arrow(ctx, cx + dx * R * (0.25 + len), cy + dy * R * (0.25 + len), cx + dx * R * 0.25, cy + dy * R * 0.25, "#3fb894", 2, [4, 3]); }
  { const [dx, dy] = bdir(smoothC.heading), len = 0.2 + (P.speed - 4) / 6 * 0.25;
    arrow(ctx, cx + dx * R * 0.18, cy + dy * R * 0.18, cx + dx * R * (0.18 + len), cy + dy * R * (0.18 + len), "#4cbf7f", 2.6); }
  if (sim.state === "flying" && sim.fwd > 0.3) {
    const [dx, dy] = bdir(smoothC.pull), len = 0.12 + Math.min(sim.T / CFG.TMAX, 1) * 0.42;
    arrow(ctx, cx + dx * R * 0.12, cy + dy * R * 0.12, cx + dx * R * (0.12 + len), cy + dy * R * (0.12 + len), "#f59a5b", 2.8);
  }
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rad(smoothC.heading));
  const s = R * 0.34;
  ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#5a5f7c"; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0, -s * 0.6); ctx.lineTo(s * 0.13, -s * 0.42); ctx.lineTo(s * 0.13, s * 0.42); ctx.lineTo(-s * 0.13, s * 0.42); ctx.lineTo(-s * 0.13, -s * 0.42); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#a99c88"; ctx.fillRect(-s * 0.09, -s * 0.32, s * 0.18, s * 0.55);
  ctx.restore();
}
const GSTOPS = { gain: [[0, "#f58ea8"], [0.3, "#f2c14e"], [0.6, "#6fcf97"], [1, "#5fc9a8"]], kite: [[0, "#6aaee8"], [0.5, "#3d5f94"], [1, "#f59a5b"]] };
const gaugeVal = [0, 0, 0];
function drawGauge(G_, frac, stops) {
  const { ctx, w, h } = G_;
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h * 0.9, R = Math.max(12, Math.min(w / 2 - 6, h * 0.82)), th = Math.max(6, R * 0.14);
  ctx.lineCap = "butt"; ctx.strokeStyle = "rgba(38,43,69,.07)"; ctx.lineWidth = th;
  ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 2 * Math.PI); ctx.stroke();
  const N = 48, n = Math.round(N * clamp(frac, 0, 1));
  for (let i = 0; i < n; i++) {
    ctx.strokeStyle = colorAt(stops, i / N);
    ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI + Math.PI * i / N, Math.PI + Math.PI * (i + 1) / N + 0.015); ctx.stroke();
  }
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + Math.PI * i / 10, r1 = R - th / 2 - 3, r2 = r1 - (i % 5 === 0 ? 6 : 3);
    ctx.strokeStyle = `rgba(38,43,69,${i % 5 === 0 ? .4 : .15})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); ctx.stroke();
  }
  const a = Math.PI + Math.PI * clamp(frac, 0, 1), c = colorAt(stops, frac);
  ctx.strokeStyle = "#262b45"; ctx.lineWidth = 2; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * (R - th), cy + Math.sin(a) * (R - th)); ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.strokeStyle = c; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}
function drawGauges(dt) {
  const targets = [clamp(S.savePct / 70, 0, 1), clamp(S.dec.total / 1.0, 0, 1), clamp(S.sim.fwd / CFG.TMAX, 0, 1)];
  if (S.sim.state === "flying" && S.sim.T > 0) targets[2] *= sideScene.force / S.sim.T;
  const stops = [GSTOPS.gain, GSTOPS.gain, GSTOPS.kite];
  for (let i = 0; i < 3; i++) { gaugeVal[i] = lerp(gaugeVal[i], targets[i], damp(6, dt)); drawGauge(GA[i], gaugeVal[i], stops[i]); }
}
function drawCurve() {
  const { ctx, w, h } = CV;
  ctx.clearRect(0, 0, w, h);
  const pl = 48, pr = 8, pt = 22, pb = 22, data = S.curve;
  const ymax = Math.max(...data.map(d => d.no), S.dec.E0) * 1000 * 1.08;
  const X = v => pl + (v - 4) / 6 * (w - pl - pr), Y = e => pt + (1 - e * 1000 / ymax) * (h - pt - pb);
  ctx.font = '500 9.5px "JetBrains Mono", monospace'; ctx.fillStyle = "#8a8fa8"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
  const stepY = ymax > 2000 ? 500 : 250;
  for (let e = 0; e <= ymax; e += stepY) {
    ctx.strokeStyle = "rgba(38,43,69,.07)"; ctx.lineWidth = 1;
    const y = pt + (1 - e / ymax) * (h - pt - pb);
    ctx.beginPath(); ctx.moveTo(pl, y); ctx.lineTo(w - pr, y); ctx.stroke();
    ctx.fillText(fmt0(e), pl - 6, y);
  }
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  for (let v = 4; v <= 10; v += 2) ctx.fillText(`${v} ${T("u_kn")}`, X(v), h - pb + 6);
  if (P.kite) {
    ctx.beginPath();
    data.forEach((d, i) => i ? ctx.lineTo(X(d.v), Y(d.no)) : ctx.moveTo(X(d.v), Y(d.no)));
    for (let i = data.length - 1; i >= 0; i--) ctx.lineTo(X(data[i].v), Y(data[i].kite));
    ctx.closePath(); ctx.fillStyle = "rgba(61, 95, 148,.18)"; ctx.fill();
  }
  ctx.setLineDash([3, 4]); ctx.strokeStyle = "rgba(38,43,69,.35)";
  ctx.beginPath(); ctx.moveTo(pl, Y(S.dec.E0)); ctx.lineTo(w - pr, Y(S.dec.E0)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = "#5a5f7c"; ctx.textAlign = "left"; ctx.fillText(T("c_ref"), pl + 4, Y(S.dec.E0) + 3);
  const line = (key, color) => {
    ctx.beginPath(); data.forEach((d, i) => i ? ctx.lineTo(X(d.v), Y(d[key])) : ctx.moveTo(X(d.v), Y(d[key])));
    ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.stroke();
  };
  line("no", "#f07d9c");
  if (P.kite) line("kite", "#3fb894");
  const ref = { x: X(CFG.VREF), y: Y(S.dec.E0) }, cur = { x: X(P.speed), y: Y(S.dec.E3) };
  ctx.setLineDash([2, 3]); ctx.strokeStyle = "rgba(63,184,148,.5)";
  ctx.beginPath(); ctx.moveTo(cur.x, pt); ctx.lineTo(cur.x, h - pb); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = "#fff"; ctx.strokeStyle = "#262b45"; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(ref.x, ref.y, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#3fb894"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cur.x, cur.y, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.font = '500 10px Inter, sans-serif'; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  const items = [[T("c_nokite"), "#f07d9c"]];
  if (P.kite) items.push([T("c_kite"), "#3fb894"], [T("c_gain"), "#3d5f94"]);
  let lx = pl;
  for (const [txt, col] of items) { ctx.fillStyle = col; ctx.fillRect(lx, 5, 12, 3); ctx.fillStyle = "#5a5f7c"; ctx.fillText(txt, lx + 16, 7); lx += 26 + ctx.measureText(txt).width; }
}
function frameSandbox(dt) {
  drawSide(dt);
  drawCompass(dt);
  drawGauges(dt);
  if (curveDirty) { drawCurve(); curveDirty = false; }
}
