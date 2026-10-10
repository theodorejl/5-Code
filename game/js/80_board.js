// ================================================================
//  CLASSEMENTS, ÉCRAN DE FIN ET COMMUNICATION AVEC STREAMLIT
//  Les scores sont stockés côté serveur (SQLite, voir app/storage.py) via un composant « pont » ;
//  sans serveur (fichier ouvert seul), ils restent dans le navigateur.
// ================================================================
const PLAYER = { name: store.get("aether.name") || "", team: store.get("aether.team") || "" };
const BOARD = { remote: false, runs: [], mode: "beginner", period: "all", group: "players", sort: "score" };
const LS_RUNS = "aether.runs.v1", LS_GHOSTS = "aether.ghosts.v1";
const host = (() => { try { return window.parent !== window ? window.parent : null; } catch { return null; } })();
function hostSend(msg) { if (host) { try { host.postMessage({ source: "aether", ...msg }, "*"); } catch { /* hôte indisponible */ } } }
function cleanRun(e) {
  if (!e || typeof e !== "object") return null;
  const name = cleanText(e.name, 16), total = Number(e.total);
  if (!name || !Number.isFinite(total) || !["beginner", "expert"].includes(e.mode)) return null;
  const co2 = Number(e.co2), ok = Number.isFinite(co2) && co2 >= 0;
  return { id: String(e.id ?? ""), mode: e.mode, name, team: cleanText(e.team, 20), total, co2: ok ? co2 : null,
    score: ok ? co2 / 1000 * total : Infinity, ts: Number(e.ts) || Date.now() / 1000 };
}
// Indice CO₂ × temps (t·s) : il classe le podium ; le tableau peut aussi trier par CO₂ seul ou par temps seul
const METRICS = { score: e => e.score, co2: e => e.co2 ?? Infinity, time: e => e.total };
const fmtMetric = (k, v) => !Number.isFinite(v) ? "—" : k === "score" ? `${fmt3(v)} t·s` : k === "co2" ? `${fmt0(v)} kg` : fmtTime(v);
// date et heure de la tentative : chaque course reste dans le classement, ex. « TJL – Aether Alumni – 10/10/2026 18h36 »
function fmtWhen(ts) {
  const d = new Date(ts * 1000), z = n => String(n).padStart(2, "0");
  const day = LANG === "de" ? `${z(d.getDate())}.${z(d.getMonth() + 1)}.${d.getFullYear()}` : `${z(d.getDate())}/${z(d.getMonth() + 1)}/${d.getFullYear()}`;
  return `${day} ${z(d.getHours())}${LANG === "fr" ? "h" : ":"}${z(d.getMinutes())}`;
}
const attemptLabel = e => [e.name, e.team, fmtWhen(e.ts)].filter(Boolean).join(" – ");
try { BOARD.runs = (JSON.parse(store.get(LS_RUNS) || "[]") || []).map(cleanRun).filter(Boolean); } catch { BOARD.runs = []; }
try { const g = JSON.parse(store.get(LS_GHOSTS) || "null"); if (g) RACE.ghosts = g; } catch { /* rien */ }

window.addEventListener("message", ev => {
  const m = ev.data;
  if (!m || m.source !== "aether-host") return;
  if (m.type === "board") {
    BOARD.remote = true;
    if (Array.isArray(m.runs)) {
      const incoming = m.runs.map(cleanRun).filter(Boolean);
      const mine = RACE.result && !incoming.some(e => e.id === RACE.result.id) ? [cleanRun({ ...RACE.result, ts: Date.now() / 1000 })] : [];
      BOARD.runs = [...incoming, ...mine.filter(Boolean)];
    }
    if (m.ghosts && typeof m.ghosts === "object") {
      for (const mode of ["beginner", "expert"]) {
        RACE.ghosts[mode] = (m.ghosts[mode] || []).filter(g => Array.isArray(g.track)).map(g => ({ name: cleanText(g.name, 16), track: g.track.filter(q => Array.isArray(q) && q.length >= 3).map(q => q.map(Number)) }));
      }
    }
    if (m.lang && m.lang !== LANG) setLang(m.lang, true);
    renderBoards();
  }
});
hostSend({ type: "hello" });

function submitScore(entry) {
  BOARD.runs.push(cleanRun({ ...entry, ts: Date.now() / 1000 }));
  if (BOARD.remote) hostSend({ type: "score", entry });
  else {
    store.set(LS_RUNS, JSON.stringify(BOARD.runs.slice(-500)));
    // fantômes locaux : on garde les 3 meilleures traces de chaque mode
    const list = (RACE.ghosts[entry.mode] || []).concat([{ name: entry.name, total: entry.total, track: entry.track }]);
    RACE.ghosts[entry.mode] = list.sort((a, b) => (a.total ?? 1e9) - (b.total ?? 1e9)).slice(0, 3);
    store.set(LS_GHOSTS, JSON.stringify(RACE.ghosts));
  }
  renderBoards();
}

// ---------------- Agrégats ----------------
function inPeriod(ts, period) {
  if (period === "all") return true;
  const d = new Date(ts * 1000), now = new Date();
  if (period === "day") return d.toDateString() === now.toDateString();
  const monday = new Date(now); monday.setHours(0, 0, 0, 0); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return d >= monday;
}
const keyOf = e => `${e.name.toLowerCase()}|${e.team.toLowerCase()}`;
// toutes les tentatives d'un mode et d'une période, triées selon le critère choisi
function attempts(mode, period, sort = "score") {
  const f = METRICS[sort] || METRICS.score;
  return BOARD.runs.filter(e => e.mode === mode && inPeriod(e.ts, period)).sort((a, b) => f(a) - f(b) || a.total - b.total);
}
// équipes : moyenne, sur ses membres, de la meilleure tentative de chacun selon le critère choisi
function teams(mode, period, sort = "score") {
  const f = METRICS[sort] || METRICS.score, best = new Map();
  for (const e of attempts(mode, period, sort)) if (e.team && !best.has(keyOf(e))) best.set(keyOf(e), e);
  const t = new Map();
  for (const e of best.values()) {
    const k = e.team.toLowerCase();
    if (!t.has(k)) t.set(k, { team: e.team, vals: [] });
    t.get(k).vals.push(f(e));
  }
  return [...t.values()].map(x => ({ team: x.team, members: x.vals.length, avg: x.vals.reduce((a, b) => a + b, 0) / x.vals.length, best: Math.min(...x.vals) }))
    .sort((a, b) => a.avg - b.avg || b.members - a.members);
}
function knownTeams() {
  const t = new Map();
  for (const e of BOARD.runs) {
    if (!e.team) continue;
    const k = e.team.toLowerCase();
    if (!t.has(k)) t.set(k, { name: e.team, members: new Set() });
    t.get(k).members.add(e.name.toLowerCase());
  }
  return [...t.values()].sort((a, b) => b.members.size - a.members.size || a.name.localeCompare(b.name, LOCALES[LANG]));
}

// ---------------- Rendu d'un bloc de classement (accueil, fenêtre, fin de course) ----------------
const boardHosts = [];
function mountBoard(container, opts = {}) { boardHosts.push({ container, opts }); renderBoard(container, opts); }
function renderBoards() { boardHosts.forEach(b => { if (b.container.isConnected && !b.container.closest("[hidden]")) renderBoard(b.container, b.opts); }); }
function renderBoard(container, opts) {
  const mode = opts.mode || BOARD.mode, isP = BOARD.group === "players", sort = BOARD.sort;
  container.innerHTML = `
    <p class="eyebrow">${T("boards")} <b>· ${T(BOARD.remote ? "src_remote" : "src_local")}</b></p>
    <div class="board-tabs">
      <div class="seg small" data-k="mode"><button data-v="beginner">${T("nav_beginner")}</button><button data-v="expert">${T("nav_expert")}</button></div>
      <div class="seg small" data-k="sort"><button data-v="score">${T("s_score")}</button><button data-v="co2">${T("s_co2")}</button><button data-v="time">${T("s_time")}</button></div>
      <div class="seg small" data-k="period"><button data-v="day">${T("p_day")}</button><button data-v="week">${T("p_week")}</button><button data-v="all">${T("p_all")}</button></div>
      <div class="seg small" data-k="group"><button data-v="players">${T("g_players")}</button><button data-v="teams">${T("g_teams")}</button></div>
    </div>
    <div class="board-body">
      <div><div class="podium"></div><p class="board-src" style="margin:4px 0 0;text-align:center">${T("podium_rule")}</p></div>
      <div class="board-scroll"><table class="board"><thead></thead><tbody></tbody></table><p class="board-src" style="margin:6px 0 0"></p></div>
      <div><canvas class="dist"></canvas><p class="board-src" style="margin:4px 0 0">${T("dist_note")} · ${T("s_" + sort)}</p></div>
    </div>`;
  container.querySelectorAll(".seg").forEach(seg => {
    const k = seg.dataset.k, cur = k === "mode" ? mode : BOARD[k];
    seg.querySelectorAll("button").forEach(b => {
      b.classList.toggle("on", b.dataset.v === cur);
      b.addEventListener("click", () => {
        if (k === "mode") { BOARD.mode = b.dataset.v; opts.mode = null; } else BOARD[k] = b.dataset.v;
        renderBoard(container, opts);   // ce bloc d'abord (même s'il n'est pas enregistré), puis les autres
        renderBoards();
      });
    });
  });
  const list = attempts(mode, BOARD.period, sort), mine = RACE.result && RACE.result.mode === mode ? RACE.result.id : null;
  // podium : toujours selon l'indice CO₂ × temps
  const pod = container.querySelector(".podium"), top = attempts(mode, BOARD.period, "score").filter(e => Number.isFinite(e.score));
  [1, 0, 2].forEach(i => {
    const e = top[i], st = document.createElement("div");
    st.className = `step p${i + 1}`;
    const who = document.createElement("div"); who.className = "who"; who.textContent = e ? e.name : "—"; if (e) who.title = attemptLabel(e);
    const tt = document.createElement("div"); tt.className = "t"; tt.textContent = e ? fmtMetric("score", e.score) : "";
    const bl = document.createElement("div"); bl.className = "block"; bl.textContent = String(i + 1);
    st.append(who, tt, bl); pod.appendChild(st);
  });
  // tableau
  const head = container.querySelector("thead"), body = container.querySelector("tbody");
  const hr = head.insertRow(), sortCol = { score: 2, co2: 3, time: 4 }[sort];
  const cols = isP ? ["#", T("col_attempt"), T("s_score"), T("s_co2"), T("s_time")] : ["#", T("team"), `${T("avg")} · ${T("s_" + sort)}`, T("members"), T("best")];
  cols.forEach((c, i) => { const th = document.createElement("th"); th.textContent = c; if (i >= 2) th.className = "n"; if (isP && i === sortCol) th.classList.add("sorted"); hr.appendChild(th); });
  const rows = isP ? list.slice(0, 12).map(e => ({ me: e.id === mine, cells: [attemptLabel(e), fmtMetric("score", e.score), fmtMetric("co2", e.co2 ?? NaN), fmtTime(e.total)] }))
    : teams(mode, BOARD.period, sort).slice(0, 12).map(t => ({ me: PLAYER.team && t.team.toLowerCase() === PLAYER.team.toLowerCase(), cells: [t.team, fmtMetric(sort, t.avg), String(t.members), fmtMetric(sort, t.best)] }));
  if (!rows.length) { const td = body.insertRow().insertCell(); td.colSpan = 5; td.style.color = "var(--muted)"; td.textContent = T(isP ? "no_scores" : "no_teams"); }
  rows.forEach((r, i) => {
    const tr = body.insertRow(); if (r.me) tr.className = "me";
    [String(i + 1), ...r.cells].forEach((c, j) => { const td = tr.insertCell(); td.textContent = c; if (j >= 2) td.className = "n"; if (isP && j === sortCol) td.classList.add("sorted"); });
  });
  container.querySelector("table + .board-src").textContent = isP ? T("runs_count", { n: list.length }) : T("team_rule");
  // répartition selon le critère choisi
  const f = METRICS[sort], vals = list.map(f).filter(Number.isFinite), me = list.find(e => e.id === mine);
  const cv = container.querySelector(".dist");
  requestAnimationFrame(() => drawDistribution(cv, vals, me ? f(me) : null, sort));
}
function drawDistribution(cv, times, mine, sort = "time") {
  const r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = r.width, h = r.height, pl = 28, pb = 22, pt = 10;
  ctx.clearRect(0, 0, w, h);
  ctx.font = '500 9.5px "JetBrains Mono", monospace'; ctx.fillStyle = "#8a8fa8";
  if (times.length < 2) { ctx.textAlign = "center"; ctx.fillText(T("dist_empty"), w / 2, h / 2); return; }
  const lo = Math.min(...times), hi = Math.max(...times), nb = Math.min(14, Math.max(5, Math.ceil(Math.sqrt(times.length) * 2)));
  const span = Math.max(hi - lo, 0.001), bins = new Array(nb).fill(0);
  times.forEach(t => bins[Math.min(nb - 1, Math.floor((t - lo) / span * nb))]++);
  const mx = Math.max(...bins), bw = (w - pl - 6) / nb;
  bins.forEach((c, i) => {
    const bh = (h - pb - pt) * c / mx;
    ctx.fillStyle = colorAt([[0, "#5fc9a8"], [0.5, "#3d5f94"], [1, "#f07d9c"]], i / (nb - 1));
    ctx.fillRect(pl + i * bw + 1, h - pb - bh, bw - 2, bh);
  });
  const lab = v => sort === "score" ? `${fmt1(v)} t·s` : sort === "co2" ? `${fmt0(v)} kg` : `${fmt1(v)} s`;
  ctx.textAlign = "left"; ctx.fillText(lab(lo), pl, h - 8); ctx.textAlign = "right"; ctx.fillText(lab(hi), w - 4, h - 8);
  ctx.textAlign = "right"; ctx.fillText(String(mx), pl - 4, pt + 6);
  if (mine) {
    const x = pl + (mine - lo) / span * (w - pl - 6);
    ctx.strokeStyle = "#262b45"; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(x, pt); ctx.lineTo(x, h - pb); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#262b45"; ctx.textAlign = "center"; ctx.fillText(T("you"), x, pt - 1 + 8);
  }
}

// ---------------- Écran de fin ----------------
function showEnd() {
  RACE.state = "end";
  const r = RACE.result;
  if (!r) return;
  const pl = attempts(r.mode, "all", "score"), rank = pl.findIndex(e => e.id === r.id) + 1;
  $("endEyebrow").textContent = T("end_eyebrow", { mode: T("nav_" + r.mode) });
  $("endTitle").innerHTML = T(rank === 1 ? "end_title_1" : rank > 0 && rank <= 3 ? "end_title_podium" : "end_title");
  $("endScore").innerHTML = `${fmt3(r.total)}<small>s</small>`;
  const rows = [[T("e_score"), `<b>${fmtMetric("score", r.co2 / 1000 * r.total)}</b>`], [T("e_time"), fmtTime(r.time)], [T("e_pen"), `+${fmt3(r.pen)} s · ${r.coll} ${T("e_coll")}`], [T("e_co2"), `${fmt0(r.co2)} kg`], [T("e_saved"), `${fmt0(r.saved)} kg`]];
  if (r.rig) rows.push([T("e_rig"), r.rig]);
  $("endBreak").innerHTML = rows.map(([a, b]) => `<span>${a}</span><span>${b}</span>`).join("");
  $("endRank").textContent = rank > 0 ? T("end_rank", { r: rank, n: pl.length }) : "";
  showOverlay("ovEnd");
  requestAnimationFrame(() => drawRouteMap($("endMap"), r.track));
  BOARD.mode = r.mode;
  renderBoards();
}
// carte du lac avec la route colorée selon la vitesse (même échelle que la page « Résultats »)
function drawRouteMap(cv, track) {
  const rr = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(rr.width * dpr); cv.height = Math.round(rr.height * dpr);
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = rr.width, h = rr.height;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [x, y] of LAKE_POLY) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const sc = Math.min((w - 16) / (x1 - x0), (h - 16) / (y1 - y0)), ox = (w - (x1 - x0) * sc) / 2 - x0 * sc, oy = (h - (y1 - y0) * sc) / 2 + y1 * sc;
  const X = x => ox + x * sc, Y = y => oy - y * sc;
  ctx.fillStyle = "#cfe3ec"; ctx.strokeStyle = "#8fb0c2";
  ctx.beginPath(); LAKE_POLY.forEach(([x, y], i) => i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (!track || track.length < 2) return;
  const vs = track.map(q => q[2]), vmin = Math.min(...vs), vmax = Math.max(...vs, vmin + 0.1);
  $("endVmin").textContent = `${fmt1(vmin)} ${T("u_kn")}`; $("endVmax").textContent = `${fmt1(vmax)} ${T("u_kn")}`;
  ctx.lineWidth = 3; ctx.lineCap = "round";
  for (let i = 1; i < track.length; i++) {
    ctx.strokeStyle = colorAt(WIND_STOPS, 0.05 + 0.8 * (track[i][2] - vmin) / (vmax - vmin));
    ctx.beginPath(); ctx.moveTo(X(track[i - 1][0]), Y(track[i - 1][1])); ctx.lineTo(X(track[i][0]), Y(track[i][1])); ctx.stroke();
  }
}
