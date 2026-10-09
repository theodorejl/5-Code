import json
import re
import threading
import time
from pathlib import Path

import streamlit as st

st.set_page_config(page_title="KiteCargo", page_icon="🪁", layout="wide")

st.markdown(
    """
    <style>
      .stApp { background: #0a0e1a; }
      .block-container { padding-top: .6rem; padding-bottom: 1rem; max-width: 1500px; }
      header[data-testid="stHeader"] { background: transparent; height: 2rem; }
    </style>
    """,
    unsafe_allow_html=True,
)

HERE = Path(__file__).parent
BOARD_FILE = HERE / "leaderboard.json"
NAME_RE = re.compile(r"^[\w .\-]{2,16}$")


# ------------------------------------------------------------------
#  Classement partagé : stocké côté serveur, commun à tous les joueurs
# ------------------------------------------------------------------
@st.cache_resource
def board_lock():
    return threading.Lock()


def load_board():
    try:
        data = json.loads(BOARD_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def add_score(entry):
    """Valide un score envoyé par le navigateur et l'ajoute au classement."""
    if not isinstance(entry, dict):
        return
    name = " ".join(str(entry.get("name", "")).split())[:16]
    if not NAME_RE.match(name):
        return
    try:
        clean = {
            "id": str(entry.get("id", ""))[:40],
            "name": name,
            "score": max(-10000, min(10000, int(entry["score"]))),
            "saved": round(float(entry.get("saved", 0))),
            "co2": round(float(entry.get("co2", 0))),
            "hours": round(float(entry.get("hours", 0))),
            "late": round(float(entry.get("late", 0))),
            "kiteLost": bool(entry.get("kiteLost", False)),
            "ts": int(time.time()),
        }
    except (KeyError, TypeError, ValueError):
        return
    with board_lock():
        board = load_board()
        if any(e.get("id") == clean["id"] for e in board):
            return
        board.append(clean)
        board.sort(key=lambda e: e["score"], reverse=True)
        BOARD_FILE.write_text(json.dumps(board[:500], ensure_ascii=False), encoding="utf-8")


# Pont entre le jeu (dans l'iframe) et Python : le jeu envoie ses scores par postMessage,
# le pont les transmet à Python et renvoie le classement à jour au jeu.
BRIDGE_JS = """
export default function (component) {
  const { data, setTriggerValue } = component;
  window.__kcSend = setTriggerValue;
  window.__kcBoard = Array.isArray(data) ? data : [];
  const send = (target) => {
    try { target.postMessage({ source: "kitecargo-host", type: "board", board: window.__kcBoard }, "*"); } catch (e) {}
  };
  if (!window.__kcListener) {
    window.__kcListener = (ev) => {
      const m = ev.data;
      if (!m || m.source !== "kitecargo") return;
      if (m.type === "hello" && ev.source) send(ev.source);
      if (m.type === "score" && window.__kcSend) window.__kcSend("score", m.entry);
    };
    window.addEventListener("message", window.__kcListener);
  }
  document.querySelectorAll("iframe").forEach((f) => f.contentWindow && send(f.contentWindow));
}
"""
bridge = st.components.v2.component("kitecargo_bridge", js=BRIDGE_JS)


def on_score():
    add_score(st.session_state["kc_bridge"].get("score"))


bridge(data=load_board()[:50], key="kc_bridge", on_score_change=on_score)

# Tout le simulateur (animation, potards, jauges, jeu) tourne en JavaScript dans le navigateur :
# l'animation reste fluide et ne redémarre pas à chaque réglage.
st.iframe(HERE / "kite_sim.html", height="content")

with st.expander("📐 Hypothèses du modèle et règles du défi"):
    st.markdown(
        """
- **Navire** : porte-conteneurs, 8 MW de puissance moteur à 14 nœuds (vitesse de référence).
  La résistance de la coque varie comme **V²**, donc la puissance comme **V³** et le carburant par trajet comme **V²**.
- **Trajet** : Rotterdam → New York, 3 400 milles nautiques. Conso spécifique 180 g/kWh, 3,114 t de CO₂ par tonne de fioul.
- **Vent** : le vent apparent (vent réel − vitesse du bateau) crée aussi une traînée sur les superstructures (pénalité par vent de face).
- **Kite** : aile de 400 m² volant en 8 vers 200–300 m (vent environ 30 % plus fort qu'au pont). Traction limitée à 250 kN,
  inutilisable si le vent apparent vient à moins de 45° de l'étrave ou s'il est trop faible (< 8 nœuds). Il fournit au plus 60 % de la poussée.
- **Répartition du gain** : moyenne des deux ordres possibles (ralentir puis ajouter le kite, et l'inverse).
- **Défi Atlantique** : même météo pour tous les joueurs. Score = CO₂ évité par rapport au navire de référence (14 nœuds, sans kite)
  − 15 points par heure de retard après 12 j 12 h − 150 points si la tempête arrache le kite.
        """
    )
