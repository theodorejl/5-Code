// ================================================================
//  TRADUCTIONS (français, anglais, allemand)
//  Le dictionnaire est rempli par 06_strings.js. Dans le HTML :
//  data-i = texte, data-ih = HTML (textes internes uniquement), data-ip = texte indicatif d'un champ.
// ================================================================
const I18N = { fr: {}, en: {}, de: {} };
function T(key, vars) {
  let s = I18N[LANG][key] ?? I18N.fr[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}
function applyI18n(root = document) {
  root.querySelectorAll("[data-i]").forEach(el => { el.textContent = T(el.dataset.i); });
  root.querySelectorAll("[data-ih]").forEach(el => { el.innerHTML = T(el.dataset.ih); });
  root.querySelectorAll("[data-ip]").forEach(el => { el.placeholder = T(el.dataset.ip); });
}
const langListeners = [];
function setLang(l, fromHost) {
  if (!I18N[l] || !Object.keys(I18N[l]).length) return;
  const changed = l !== LANG;
  LANG = l;
  document.documentElement.lang = l;
  store.set("aether.lang", l);
  applyI18n();
  document.querySelectorAll("#langSeg button").forEach(b => b.classList.toggle("on", b.dataset.lang === l));
  langListeners.forEach(f => f());
  if (changed && !fromHost) hostSend({ type: "lang", lang: l });
}
