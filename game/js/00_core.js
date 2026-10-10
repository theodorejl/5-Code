"use strict";
// ================================================================
//  OUTILS COMMUNS (math, formats, stockage local, messages)
//  Tous les fichiers de game/js/ sont concaténés dans un même bloc par Python (app/game.py) :
//  ils partagent donc la même portée et peuvent s'appeler entre eux.
// ================================================================
const $ = id => document.getElementById(id);
const KN = 0.514444;          // m/s par nœud
const RHO = 1.225;            // densité de l'air (kg/m³)
const rad = d => d * Math.PI / 180;
const deg = r => r * 180 / Math.PI;
const norm180 = a => ((a + 180) % 360 + 360) % 360 - 180;
const norm360 = a => ((a % 360) + 360) % 360;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const smoother = x => { x = clamp(x, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };
const lerp = (a, b, t) => a + (b - a) * t;
const angLerp = (a, b, k) => a + norm180(b - a) * k;
const damp = (rate, dt) => 1 - Math.exp(-rate * dt);   // lissage indépendant du nombre d'images par seconde

function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function colorAt(stops, t) {
  t = clamp(t, 0, 1);
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1], [t1, c1] = stops[i];
      const k = (t - t0) / (t1 - t0 || 1), a = hexToRgb(c0), b = hexToRgb(c1);
      return `rgb(${Math.round(lerp(a[0], b[0], k))},${Math.round(lerp(a[1], b[1], k))},${Math.round(lerp(a[2], b[2], k))})`;
    }
  }
  return stops[stops.length - 1][1];
}
const rgbStr = c => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
const mixRgb = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const shade = (hex, f) => { const [r, g, b] = hexToRgb(hex); return `rgb(${Math.round(clamp(r * f, 0, 255))},${Math.round(clamp(g * f, 0, 255))},${Math.round(clamp(b * f, 0, 255))})`; };

// Générateur pseudo-aléatoire déterministe : même météo et même décor pour tous les joueurs
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// Échelle de couleurs du vent, inspirée de windy (nœuds)
const WIND_STOPS = [[0, "#6271b7"], [0.15, "#39a0c8"], [0.3, "#4cbf7f"], [0.48, "#e1c54a"], [0.66, "#e08a3c"], [0.82, "#d33d3d"], [1, "#a93f8b"]];
const windColor = kn => colorAt(WIND_STOPS, kn / 40);

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } }
};

// Formats de nombres selon la langue choisie
const LOCALES = { fr: "fr-FR", en: "en-GB", de: "de-CH" };
let LANG = "fr";
const nf = (x, d) => Number(x).toLocaleString(LOCALES[LANG], { minimumFractionDigits: d, maximumFractionDigits: d });
const fmt0 = x => nf(Math.round(x), 0);
const fmt1 = x => nf(x, 1);
const fmt3 = x => nf(x, 3);
// chrono m:ss.cc (affichage en course) et temps précis à la milliseconde (classements)
function fmtClock(s) {
  s = Math.max(0, s);
  const m = Math.floor(s / 60), r = s - m * 60;
  return `${m}:${r < 10 ? "0" : ""}${r.toFixed(2)}`;
}
const fmtTime = s => `${fmt3(s)} s`;

// Messages éphémères au-dessus de la scène
const toastSeen = {};
function toast(msg, kind = "", key = null, cooldown = 20) {
  const now = performance.now() / 1000;
  if (key && toastSeen[key] && now - toastSeen[key] < cooldown) return;
  if (key) toastSeen[key] = now;
  const el = document.createElement("div");
  el.className = `glass toast ${kind}`;
  el.textContent = msg;
  $("toasts").appendChild(el);
  while ($("toasts").children.length > 3) $("toasts").firstChild.remove();
  setTimeout(() => el.remove(), 3600);
}
const cleanText = (s, max) => String(s ?? "").replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, max);

// Canevas net sur écran haute densité, redimensionné automatiquement
const canvases = [];
function setupCanvas(cv, onResize) {
  const o = { cv, ctx: cv.getContext("2d"), w: 0, h: 0, dpr: 1 };
  const resize = () => {
    const r = cv.getBoundingClientRect();
    o.dpr = Math.min(window.devicePixelRatio || 1, QUALITY.dprMax);
    o.w = Math.max(r.width, 10); o.h = Math.max(r.height, 10);
    cv.width = Math.round(o.w * o.dpr); cv.height = Math.round(o.h * o.dpr);
    o.ctx.setTransform(o.dpr, 0, 0, o.dpr, 0, 0);
    if (onResize) onResize(o);
  };
  o.resize = resize;
  new ResizeObserver(resize).observe(cv);
  resize();
  canvases.push(o);
  return o;
}

// Niveau de détail adaptatif : baissé automatiquement si l'ordinateur n'arrive pas à suivre (voir 99_main.js)
const QUALITY = { level: 2, dprMax: 1.5, waterRows: 30, particles: 260, buildings: true, rain: 160 };
function setQuality(level) {
  QUALITY.level = level;
  Object.assign(QUALITY, [
    { dprMax: 1, waterRows: 16, particles: 110, buildings: false, rain: 70 },
    { dprMax: 1.25, waterRows: 22, particles: 180, buildings: true, rain: 110 },
    { dprMax: 1.5, waterRows: 30, particles: 260, buildings: true, rain: 160 }
  ][level]);
  canvases.forEach(c => c.resize());
}
