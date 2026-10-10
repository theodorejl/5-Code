// ================================================================
//  POTARDS ROTATIFS (bac à sable) : glisser, molette, flèches, double-clic = valeur par défaut
// ================================================================
const CARDS = {
  fr: ["N", "NE", "E", "SE", "S", "SO", "O", "NO"],
  en: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
  de: ["N", "NO", "O", "SO", "S", "SW", "W", "NW"],
  it: ["N", "NE", "E", "SE", "S", "SO", "O", "NO"]
};
const cardinal = a => CARDS[LANG][Math.round(norm360(a) / 45) % 8];
const knobs = {};
function arcPath(cx, cy, r, a0, a1) {
  const p0 = [cx + r * Math.sin(rad(a0)), cy - r * Math.cos(rad(a0))];
  const p1 = [cx + r * Math.sin(rad(a1)), cy - r * Math.cos(rad(a1))];
  return `M${p0[0].toFixed(2)} ${p0[1].toFixed(2)} A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${p1[0].toFixed(2)} ${p1[1].toFixed(2)}`;
}
// o : { key, state (objet contenant la valeur), label (clé de traduction), min, max, step, wheel, wrap, color, color2, keys, fmt, onChange }
function createKnob(container, o) {
  const wrap = !!o.wrap;
  const sweep = wrap ? 360 : 270, start = wrap ? 0 : -135;
  const box = document.createElement("div");
  box.className = "knob";
  const id = "k" + o.key;
  let ticks = "";
  const nT = wrap ? 36 : 28;
  for (let i = 0; i < nT + (wrap ? 0 : 1); i++) {
    const a = start + sweep * i / nT, major = wrap ? i % 9 === 0 : i % 7 === 0;
    const r1 = 57, r2 = major ? 51 : 54;
    ticks += `<line x1="${60 + r1 * Math.sin(rad(a))}" y1="${60 - r1 * Math.cos(rad(a))}" x2="${60 + r2 * Math.sin(rad(a))}" y2="${60 - r2 * Math.cos(rad(a))}" stroke="rgba(38,43,69,${major ? .5 : .18})" stroke-width="${major ? 1.8 : 1.1}" stroke-linecap="round"/>`;
  }
  box.innerHTML = `
    <svg viewBox="0 0 120 120" tabindex="0" role="slider" aria-valuemin="${o.min}" aria-valuemax="${o.max}">
      <defs>
        <radialGradient id="${id}b" cx="40%" cy="32%" r="78%"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#edf0f6"/><stop offset="1" stop-color="#d6dce8"/></radialGradient>
        <linearGradient id="${id}g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${o.color2}"/><stop offset="1" stop-color="${o.color}"/></linearGradient>
      </defs>
      ${ticks}
      <path d="${wrap ? arcPath(60, 60, 47, 0, 359.9) : arcPath(60, 60, 47, start, start + sweep)}" fill="none" stroke="rgba(38,43,69,.07)" stroke-width="6" stroke-linecap="round"/>
      <path class="kv" fill="none" stroke="url(#${id}g)" stroke-width="6" stroke-linecap="round"/>
      <circle cx="60" cy="60" r="35" fill="url(#${id}b)" stroke="#d3dbe9"/>
      <g class="letters"></g>
      <g class="kp"><line x1="60" y1="${wrap ? 30 : 31}" x2="60" y2="${wrap ? 46 : 45}" stroke="${o.color}" stroke-width="3.6" stroke-linecap="round"/>
      ${wrap ? `<path d="M60 24 L55 32 L65 32 Z" fill="${o.color}"/>` : ""}</g>
      <circle cx="60" cy="60" r="5" fill="#fff" stroke="#bdb5d8"/>
    </svg>
    <div class="knob-label" data-i="${o.label}"></div>
    <div class="knob-value"></div>
    <div class="knob-keys">${o.keys.map(k => `<kbd>${k}</kbd>`).join("")}</div>`;
  container.appendChild(box);
  const svg = box.querySelector("svg"), kv = box.querySelector(".kv"), kp = box.querySelector(".kp"), out = box.querySelector(".knob-value");
  const toAngle = v => wrap ? v : start + (v - o.min) / (o.max - o.min) * sweep;
  function render() {
    const v = o.state[o.key], a = toAngle(v);
    kv.setAttribute("d", wrap ? arcPath(60, 60, 47, a - 16, a + 16) : ((a - start) < 0.5 ? "" : arcPath(60, 60, 47, start, a)));
    kp.setAttribute("transform", `rotate(${a} 60 60)`);
    out.innerHTML = o.fmt(v);
    svg.setAttribute("aria-valuenow", v);
    svg.setAttribute("aria-label", T(o.label));
    if (wrap) {
      const c = CARDS[LANG];
      box.querySelector(".letters").innerHTML = [0, 2, 4, 6].map((ci, i) => {
        const a = i * 90, r = 40;
        return `<text x="${60 + r * Math.sin(rad(a))}" y="${60 - r * Math.cos(rad(a)) + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="${i === 0 ? o.color : "#8a8fa8"}" font-family="JetBrains Mono, monospace">${c[ci]}</text>`;
      }).join("");
    }
  }
  function set(v, silent) {
    v = wrap ? norm360(v) : clamp(v, o.min, o.max);
    o.state[o.key] = Math.round(v / o.step) * o.step % (wrap ? 360 : Infinity);
    render();
    if (!silent && o.onChange) o.onChange();
  }
  let last = null, acc = 0;
  const angleOf = e => { const r = svg.getBoundingClientRect(); return deg(Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2)))); };
  svg.addEventListener("pointerdown", e => { svg.setPointerCapture(e.pointerId); last = angleOf(e); acc = o.state[o.key]; e.preventDefault(); });
  svg.addEventListener("pointermove", e => {
    if (last === null) return;
    const a = angleOf(e), d = norm180(a - last); last = a;
    acc += d * (wrap ? 1 : (o.max - o.min) / sweep);
    if (!wrap) acc = clamp(acc, o.min, o.max);
    set(acc);
  });
  const end = () => { last = null; };
  svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", end);
  svg.addEventListener("wheel", e => { e.preventDefault(); set(o.state[o.key] + (e.deltaY < 0 ? 1 : -1) * o.wheel); }, { passive: false });
  svg.addEventListener("keydown", e => {
    if (["ArrowUp", "ArrowRight"].includes(e.key)) { set(o.state[o.key] + o.wheel); e.preventDefault(); e.stopPropagation(); }
    if (["ArrowDown", "ArrowLeft"].includes(e.key)) { set(o.state[o.key] - o.wheel); e.preventDefault(); e.stopPropagation(); }
  });
  svg.addEventListener("dblclick", () => set(o.def));
  render();
  knobs[o.key] = { set, render };
  langListeners.push(render);
}
