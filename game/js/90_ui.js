// ================================================================
//  INTERFACE : navigation, fenêtres, tutoriels, clavier
// ================================================================
let VIEW = "home";
const seenHelp = {};
// La traversée occupe toute la hauteur visible de la fenêtre du navigateur (sous la barre Streamlit)
function fitRace() {
  let vh = window.innerHeight, top = 0;
  try {
    const fe = window.frameElement;
    if (fe) { vh = window.parent.innerHeight; top = fe.getBoundingClientRect().top + window.parent.scrollY; }
  } catch { /* parent d'une autre origine : on garde la fenêtre de l'iframe */ }
  const bar = document.querySelector(".topbar"), dash = $("databar");
  const used = top + (bar ? bar.offsetHeight : 50) + (dash ? dash.offsetHeight : 70) + 30;
  const w = $("app").clientWidth;
  const h = clamp(vh - used, 420, w / 1.45);
  document.documentElement.style.setProperty("--race-h", `${Math.round(h)}px`);
}
function goView(v) {
  if ((RACE.state === "run" || RACE.state === "pause" || RACE.state === "intro") && VIEW !== v) toast(T("race_abandoned"), "warn", null);
  VIEW = v;
  const race = v === "beginner" || v === "expert";
  document.body.className = `view-${race ? "race" : v}${race ? " mode-" + v : ""}`;
  document.querySelectorAll("#navSeg button").forEach(b => b.classList.toggle("on", b.dataset.view === v));
  hideOverlay(); KEYS.clear(); $("bigCount").hidden = true;
  const world = $("world");
  if (v === "home") {
    $("heroSlot").appendChild(world);
    RACE.mode = "attract"; resetRace(); RACE.state = "idle";
    renderBoards();
  } else if (race) {
    $("raceSlot").appendChild(world);
    RACE.mode = v; resetRace(); RACE.state = "name";
    $("tViewTxt").textContent = T(RACE.view === "third" ? "view_third" : "view_cabin");
    openNameForm();
  } else if (v === "sandbox") {
    recompute();
    if (!seenHelp.sandbox) { seenHelp.sandbox = true; openHelp("sandbox"); }
  }
  if (race) fitRace();
  WORLD.resize(); MINI.resize();
}

// ---------------- Fenêtres ----------------
let overlay = null;
function showOverlay(id) {
  $("layer").hidden = !id;
  for (const o of ["ovName", "ovHelp", "ovPause", "ovEnd", "ovBoard"]) $(o).hidden = o !== id;
  overlay = id;
}
const hideOverlay = () => showOverlay(null);

function openNameForm() {
  $("nameEyebrow").textContent = T("name_eyebrow", { mode: T("nav_" + RACE.mode) });
  $("nameInput").value = PLAYER.name;
  fillTeams(PLAYER.team);
  $("nameErr").textContent = "";
  showOverlay("ovName");
  setTimeout(() => { $("nameInput").focus(); $("nameInput").select(); }, 30);
}
function fillTeams(current) {
  const sel = $("teamSelect");
  sel.textContent = "";
  const add = (value, label) => { const o = document.createElement("option"); o.value = value; o.textContent = label; sel.appendChild(o); };
  add("", T("team_none"));
  const list = knownTeams();
  list.forEach(t => add("team:" + t.name, T("team_members", { t: t.name, n: t.members.size })));
  add("new", T("team_create"));
  const match = list.find(t => t.name.toLowerCase() === String(current).toLowerCase());
  sel.value = match ? "team:" + match.name : current ? "new" : "";
  if (!match && current) $("teamNew").value = current;
  $("teamNewRow").hidden = sel.value !== "new";
}
function initForms() {
  $("teamSelect").addEventListener("change", () => {
    $("teamNewRow").hidden = $("teamSelect").value !== "new";
    if ($("teamSelect").value === "new") setTimeout(() => $("teamNew").focus(), 0);
  });
  $("ovName").addEventListener("submit", e => {
    e.preventDefault();
    const name = cleanText($("nameInput").value, 16), choice = $("teamSelect").value;
    let team = choice === "new" ? cleanText($("teamNew").value, 20) : choice.startsWith("team:") ? choice.slice(5) : "";
    if (!name) { $("nameErr").textContent = T("err_name"); return; }
    if (choice === "new" && !team) { $("nameErr").textContent = T("err_team"); return; }
    const existing = knownTeams().find(t => t.name.toLowerCase() === team.toLowerCase());
    if (existing) team = existing.name;
    PLAYER.name = name; PLAYER.team = team; store.set("aether.name", name); store.set("aether.team", team);
    $("playerChip").hidden = false; $("playerChip").textContent = team ? `${name} · ${team}` : name;
    if (document.activeElement) document.activeElement.blur();
    if (!seenHelp[RACE.mode]) { seenHelp[RACE.mode] = true; RACE.state = "help"; openHelp(RACE.mode); }
    else startIntro();
  });
  $("nameCancel").addEventListener("click", () => goView("home"));
  $("helpOk").addEventListener("click", helpNext);
  $("helpBack").addEventListener("click", () => setHelpPage(helpPage - 1));
  $("pauseResume").addEventListener("click", togglePause);
  $("pauseQuit").addEventListener("click", () => goView("home"));
  $("endAgain").addEventListener("click", () => goView(RACE.mode === "attract" ? "beginner" : RACE.mode));
  $("endHome").addEventListener("click", () => goView("home"));
  $("boardClose").addEventListener("click", closeBoard);
  $("btnBoard").addEventListener("click", openBoard);
  $("btnHelp").addEventListener("click", () => openHelp(VIEW === "home" ? "beginner" : VIEW));
  $("brand").addEventListener("click", () => goView("home"));
  document.querySelectorAll("#navSeg button").forEach(b => b.addEventListener("click", () => goView(b.dataset.view)));
  document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => goView(b.dataset.go)));
  document.querySelectorAll("[data-tuto]").forEach(b => b.addEventListener("click", () => openHelp(b.dataset.tuto)));
  document.querySelectorAll("#langSeg button").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));
  // après un clic sur un bouton, le clavier revient au jeu
  document.addEventListener("click", e => { const b = e.target.closest("button"); if (b && b.type !== "submit") setTimeout(() => b.blur(), 0); });
  $("world").addEventListener("pointerdown", () => window.focus());
}
function startIntro() {
  resetRace();
  RACE.state = "intro"; RACE.introT = 0;
  hideOverlay();
}
function togglePause() {
  if (RACE.state === "run") { RACE.state = "pause"; KEYS.clear(); showOverlay("ovPause"); }
  else if (RACE.state === "pause") { RACE.state = "run"; hideOverlay(); }
  $("tPause").classList.toggle("on", RACE.state === "pause");
  $("tPauseIco").textContent = RACE.state === "pause" ? "▶" : "⏸";
  $("tPauseTxt").textContent = T(RACE.state === "pause" ? "resume" : "pause");
}
let boardReturn = null;
function openBoard() {
  if (RACE.state === "run") { RACE.state = "pause"; KEYS.clear(); }
  boardReturn = overlay;
  BOARD.mode = VIEW === "expert" ? "expert" : BOARD.mode;
  showOverlay("ovBoard");
  renderBoards();
}
function closeBoard() {
  const back = boardReturn; boardReturn = null;
  if (back && back !== "ovBoard") showOverlay(back);
  else if (RACE.state === "pause") showOverlay("ovPause");
  else hideOverlay();
}

// ---------------- Tutoriels (un par mode, plusieurs pages) ----------------
let helpPage = 0, helpMode = "beginner", helpReturn = null;
const keyRow = (keys, label) => `<div><span class="keys">${keys.map(k => `<kbd>${k}</kbd>`).join("")}</span>${label}</div>`;
function helpPages(mode) {
  const rules = (keys) => `<div class="rules">${keys.map(k => `<div class="rule"><b>${T(k + "_t")}</b>${T(k + "_d")}</div>`).join("")}</div>`;
  const read = keys => `<div class="read-list">${keys.map(k => `<div>${T(k)}</div>`).join("")}</div>`;
  const common = [keyRow(["H"], T("k_help")), keyRow(["P", T("key_esc")], T("k_pause"))];
  if (mode === "sandbox") return [
    `<h2>${T("hs_title")}</h2><p>${T("hs_text")}</p><div class="help-grid">${keyRow(["↑", "↓"], T("k_sb_speed"))}${keyRow(["←", "→"], T("k_sb_heading"))}${keyRow([T("key_space")], T("k_sb_kite"))}${keyRow(["🖱"], T("k_sb_knobs"))}</div>`,
    `<h2>${T("read_title")}</h2>${read(["rs_hud", "rs_mission", "rs_compass", "rs_gauges", "rs_bars", "rs_curves"])}`
  ];
  const isE = mode === "expert";
  return [
    `<h2>${T(isE ? "he_title" : "hb_title")}</h2><p>${T(isE ? "he_text" : "hb_text")}</p>${rules(isE ? ["he_r1", "he_r2", "he_r3"] : ["hb_r1", "hb_r2", "hb_r3"])}`,
    `<h2>${T("ctrl_title")}</h2><div class="help-grid">
      ${keyRow(["Z", "S"], T("k_throttle"))}${keyRow(["Q", "D"], T("k_helm"))}
      ${isE ? keyRow(["←", "→"], T("k_kite_steer")) + keyRow(["↑", "↓"], T("k_kite_trim")) : keyRow(["↑", "↓", "←", "→"], T("k_arrows_boat"))}
      ${keyRow([T("key_space"), "E"], T("k_kite_toggle"))}${keyRow(["V"], T("k_view"))}${keyRow(["F"], T("k_window"))}${keyRow(["T"], T("k_ghost"))}${common.join("")}
    </div><p>${T("ctrl_mouse")}</p><p class="note">${T("ctrl_qwerty")}</p>`,
    `<h2>${T("read_title")}</h2>${read(["rr_hud", "rr_progress", "rr_minimap", "rr_wind", "rr_kitebox", "rr_databar"])}<p>${T(isE ? "rr_expert" : "rr_beginner")}</p>`
  ];
}
function openHelp(mode) {
  if (overlay === "ovHelp") { closeHelp(); return; }
  if (RACE.state === "run") { RACE.state = "pause"; KEYS.clear(); }
  helpMode = mode; helpReturn = overlay;
  showOverlay("ovHelp"); setHelpPage(0);
}
function setHelpPage(n) {
  const pages = helpPages(helpMode);
  helpPage = clamp(n, 0, pages.length - 1);
  $("helpBody").innerHTML = pages[helpPage];
  $("helpEyebrow").innerHTML = `${T("tutorial")} <b>· ${T("nav_" + helpMode)} · ${helpPage + 1}/${pages.length}</b>`;
  $("helpPager").innerHTML = pages.map((_, i) => `<span class="${i === helpPage ? "on" : ""}"></span>`).join("");
  $("helpBack").hidden = helpPage === 0;
  const last = helpPage === pages.length - 1;
  $("helpOk").textContent = !last ? T("next") : RACE.state === "help" ? T("lets_go") : T("got_it");
}
function helpNext() { if (helpPage < helpPages(helpMode).length - 1) setHelpPage(helpPage + 1); else closeHelp(); }
function closeHelp() {
  if (RACE.state === "help") { startIntro(); return; }
  const back = helpReturn; helpReturn = null;
  if (back && back !== "ovHelp") showOverlay(back);
  else if (RACE.state === "pause") showOverlay("ovPause");
  else hideOverlay();
}
langListeners.push(() => {
  if (overlay === "ovHelp") setHelpPage(helpPage);
  if (overlay === "ovName") { $("nameEyebrow").textContent = T("name_eyebrow", { mode: T("nav_" + RACE.mode) }); fillTeams(PLAYER.team); }
  $("tViewTxt").textContent = T(RACE.view === "third" ? "view_third" : "view_cabin");
  renderBoards(); drawCards();
});

// ---------------- Clavier ----------------
const ARROWS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
function initKeyboard() {
  window.addEventListener("keydown", e => {
    if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
    if (e.target.closest && e.target.closest(".knob svg")) return;
    const k = e.key, lk = k.length === 1 ? k.toLowerCase() : k;
    if (lk === "h" || k === "?") { e.preventDefault(); openHelp(VIEW === "home" ? "beginner" : VIEW); return; }
    if (overlay === "ovHelp") {
      if (k === "Enter") { e.preventDefault(); helpNext(); }
      else if (k === "Escape") { e.preventDefault(); closeHelp(); }
      else if (k === "ArrowRight" || k === "ArrowLeft") { e.preventDefault(); setHelpPage(helpPage + (k === "ArrowRight" ? 1 : -1)); }
      return;
    }
    if (overlay === "ovBoard" && (k === "Escape" || k === "Enter")) { e.preventDefault(); closeBoard(); return; }
    if (overlay === "ovEnd" && k === "Enter") { e.preventDefault(); goView(RACE.mode); return; }
    if ((RACE.state === "run" || RACE.state === "pause") && (lk === "p" || k === "Escape")) { e.preventDefault(); togglePause(); return; }
    if (overlay) return;
    if (VIEW === "beginner" || VIEW === "expert") {
      if (lk === "v") { toggleCamView(); return; }
      if (lk === "f") { toggleWindowView(); return; }
      if (lk === "t") { toggleGhosts(); return; }
      if ((k === " " || lk === "e") && !e.repeat) { e.preventDefault(); if (RACE.state === "run") toggleKiteDeploy(); return; }
      if (ARROWS.includes(k) || ["z", "q", "s", "d", "w", "a"].includes(lk)) { e.preventDefault(); KEYS.add(lk); }
      return;
    }
    if (VIEW === "sandbox") {
      if (k === "ArrowUp") knobs.speed.set(P.speed + 0.5);
      else if (k === "ArrowDown") knobs.speed.set(P.speed - 0.5);
      else if (k === "ArrowLeft") knobs.heading.set(P.heading - 5);
      else if (k === "ArrowRight") knobs.heading.set(P.heading + 5);
      else if (k === " ") toggleSandboxKite();
      else return;
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", e => { KEYS.delete(e.key); KEYS.delete(e.key.toLowerCase()); });
  window.addEventListener("blur", () => KEYS.clear());
}

// ---------------- Illustrations des cartes de l'accueil ----------------
function drawCards() {
  document.querySelectorAll("canvas[data-card]").forEach(cv => {
    const r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (r.width < 10) return;
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = r.width, h = r.height, kind = cv.dataset.card;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#c9dcec"); g.addColorStop(0.6, "#f2e3d6"); g.addColorStop(0.61, "#8fb6c9"); g.addColorStop(1, "#4f86a0");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    if (kind === "sandbox") {
      const info = drawBargeSide(ctx, w * 0.36, h * 0.66, w * 0.5, 0, 0);
      ctx.strokeStyle = "rgba(40,50,70,.6)"; ctx.beginPath(); ctx.moveTo(info.mast.x, info.mast.y); ctx.lineTo(w * 0.82, h * 0.22); ctx.stroke();
      drawParagliderSide(ctx, w * 0.82, h * 0.22, h * 0.42, -0.6);
    } else if (kind === "beginner") {
      ctx.fillStyle = "#e9f1ec"; ctx.fillRect(0, 0, w, h);
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const [x, y] of LAKE_POLY) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const sc = Math.min((w - 10) / (x1 - x0), (h - 10) / (y1 - y0)), ox = (w - (x1 - x0) * sc) / 2 - x0 * sc, oy = (h - (y1 - y0) * sc) / 2 + y1 * sc;
      ctx.fillStyle = "#8fc0d6"; ctx.beginPath(); LAKE_POLY.forEach(([x, y], i) => i ? ctx.lineTo(ox + x * sc, oy - y * sc) : ctx.moveTo(ox + x * sc, oy - y * sc)); ctx.closePath(); ctx.fill();
      ctx.setLineDash([3, 3]); ctx.strokeStyle = "#1f3a68"; ctx.lineWidth = 1.5;
      ctx.beginPath(); COURSE.forEach(([x, y], i) => i ? ctx.lineTo(ox + x * sc, oy - y * sc) : ctx.moveTo(ox + x * sc, oy - y * sc)); ctx.stroke(); ctx.setLineDash([]);
      for (const gst of GUSTS.slice(0, 24)) { ctx.fillStyle = windColor(16 + gst.boost); ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(ox + gst.x0 * sc, oy - gst.y0 * sc, 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1; ctx.font = "13px sans-serif"; ctx.fillText("🏁", ox + FINISH.x * sc - 6, oy - FINISH.y * sc + 4);
    } else {
      ctx.fillStyle = "#f2f4f9"; ctx.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h - 6, R = Math.min(w / 2 - 8, h - 12);
      for (let rr = R; rr > 0; rr -= 2) { ctx.fillStyle = colorAt([[0, "#a8e6d3"], [0.3, "#f7e3a1"], [0.6, "#ffc9a8"], [1, "#f58ea8"]], Math.sqrt(1 - (rr / R) ** 2)); ctx.beginPath(); ctx.arc(cx, cy, rr, Math.PI, 0); ctx.fill(); }
      ctx.strokeStyle = "rgba(31, 58, 104,.8)"; ctx.lineWidth = 2;
      ctx.beginPath(); for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.1) { const x = cx + Math.sin(a) * R * 0.5, y = cy - R * 0.32 - Math.sin(2 * a) * R * 0.14; a ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      drawParagliderFront(ctx, cx + R * 0.35, cy - R * 0.38, h * 0.36, 0.5, 1);
    }
  });
}
