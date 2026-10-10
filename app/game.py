"""Page du jeu : assemblage du HTML et pont entre le jeu (iframe) et Python."""
import json
from pathlib import Path

import streamlit as st

from app import storage
from app.i18n import LANGS, t

GAME_DIR = Path(__file__).resolve().parent.parent / "game"


def _sources():
    files = [GAME_DIR / "index.html", GAME_DIR / "leman_geo.json", *sorted((GAME_DIR / "js").glob("*.js"))]
    return tuple((str(f), f.stat().st_mtime) for f in files)


@st.cache_data(show_spinner=False)
def _build(sources):
    """Assemble index.html + géographie + modules JS (concaténés dans l'ordre de leur numéro) en un seul document.
    La clé de cache inclut les dates de modification : toute modification d'un fichier reconstruit la page."""
    html = (GAME_DIR / "index.html").read_text(encoding="utf-8")
    geo = json.loads((GAME_DIR / "leman_geo.json").read_text(encoding="utf-8"))
    scripts = "\n".join(Path(p).read_text(encoding="utf-8") for p, _ in sources if p.endswith(".js"))
    html = html.replace("/*__GEO__*/", "const GEO = " + json.dumps(geo, ensure_ascii=False, separators=(",", ":")) + ";")
    return html.replace("/*__SCRIPTS__*/", scripts)


def game_html():
    return _build(_sources())


# Le jeu envoie ses messages par postMessage ; ce composant les transmet à Python et renvoie au jeu
# le classement, les traces des 3 meilleurs et la langue choisie.
BRIDGE_JS = """
export default function (component) {
  const { data, setTriggerValue } = component;
  window.__aeSend = setTriggerValue;
  window.__aeData = data || {};
  const send = (target) => {
    try { target.postMessage({ source: "aether-host", type: "board", ...window.__aeData }, "*"); } catch (e) {}
  };
  if (!window.__aeListener) {
    window.__aeListener = (ev) => {
      const m = ev.data;
      if (!m || m.source !== "aether") return;
      if (m.type === "hello" && ev.source) send(ev.source);
      if (m.type === "score" && window.__aeSend) window.__aeSend("score", m.entry);
      if (m.type === "lang" && window.__aeSend) window.__aeSend("lang", m.lang);
    };
    window.addEventListener("message", window.__aeListener);
  }
  document.querySelectorAll("iframe").forEach((f) => f.contentWindow && send(f.contentWindow));
}
"""
_bridge = st.components.v2.component("aether_bridge", js=BRIDGE_JS)


def _on_score():
    storage.add_run((st.session_state.get("aether_bridge") or {}).get("score"))


def _on_lang():
    new = (st.session_state.get("aether_bridge") or {}).get("lang")
    if new in LANGS:
        st.session_state["lang"] = new
        st.session_state["lang_ctrl"] = new
        st.query_params["lang"] = new


def game_page():
    _bridge(data={"runs": storage.list_runs(), "ghosts": storage.ghosts(), "lang": st.session_state.get("lang", "fr")},
            key="aether_bridge", on_score_change=_on_score, on_lang_change=_on_lang)
    # Tout le jeu (animation, physique, commandes) tourne dans le navigateur : il reste fluide et
    # ne se recharge pas quand Python se relance (le HTML transmis est identique d'un passage à l'autre).
    st.iframe(game_html(), height="content")
    with st.expander(t("model_title")):
        st.markdown(t("model_md"))
