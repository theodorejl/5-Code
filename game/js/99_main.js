// ================================================================
//  DÉMARRAGE ET BOUCLE PRINCIPALE (avec qualité adaptative pour tenir 30 à 60 images/s)
// ================================================================
const PERF = { fps: 60, low: 0, high: 0 };
function perfTick(dt) {
  PERF.fps = lerp(PERF.fps, 1 / Math.max(dt, 1e-3), 0.05);
  if (VIEW === "sandbox") return;
  if (PERF.fps < 30) { PERF.low += dt; PERF.high = 0; } else if (PERF.fps > 55) { PERF.high += dt; PERF.low = 0; } else { PERF.low = 0; PERF.high = 0; }
  if (PERF.low > 2.5 && QUALITY.level > 0) { setQuality(QUALITY.level - 1); PERF.low = 0; }
  if (PERF.high > 10 && QUALITY.level < 2) { setQuality(QUALITY.level + 1); PERF.high = 0; }
}
let lastT = performance.now(), hudSandT = 0, frameErr = false;
function frame(now) {
  requestAnimationFrame(frame);   // planifiée d'abord : une erreur ponctuelle ne fige jamais le jeu
  const dtRaw = (now - lastT) / 1000;
  const dt = Math.min(0.05, dtRaw);
  lastT = now;
  perfTick(dtRaw);
  try {
    if (VIEW === "sandbox") {
      frameSandbox(dt);
      hudSandT += dt;
      if (hudSandT > 0.12) { hudSandT = 0; updateSandboxHud(); }
    } else frameRace(dt);
  } catch (e) {
    if (!frameErr) { frameErr = true; console.error(e); }   // signalée une seule fois
  }
}
function init() {
  initRaceControls();
  initSandbox();
  initForms();
  initKeyboard();
  mountBoard($("homeBoard"), {});
  const saved = store.get("aether.lang");
  setLang(I18N[saved] && Object.keys(I18N[saved]).length ? saved : "fr", true);
  if (PLAYER.name) { $("playerChip").hidden = false; $("playerChip").textContent = PLAYER.team ? `${PLAYER.name} · ${PLAYER.team}` : PLAYER.name; }
  goView("home");
  requestAnimationFrame(() => drawCards());
  new ResizeObserver(() => drawCards()).observe($("viewHome"));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { curveDirty = true; drawCards(); });
  requestAnimationFrame(frame);
  // accès pour les tests automatisés uniquement (adresse contenant aetherdebug=1)
  try {
    const q = (window.parent && window.parent.location.search) || location.search;
    if (/aetherdebug=1/.test(q)) window.__AE = { RACE, KS, PERF, QUALITY, BOARD, coursePoint, courseProject, COURSE_LEN, toggleKiteDeploy, goView, setLang };
  } catch { /* parent d'une autre origine */ }
}
init();
