"""Æther Swiss Kite Simulator — point d'entrée Streamlit.

Pages : Jeu (accueil, bac à sable, traversées débutant/expert) et Résultats.
Le jeu lui-même est dans game/ (HTML + modules JS), les services Python dans app/.
"""
import streamlit as st

from app import storage
from app.game import game_page
from app.i18n import LANGS, t
from app.pages import results_page

st.set_page_config(page_title="Æther Swiss Kite Simulator", page_icon="🪁", layout="wide")
storage.init()

st.markdown(
    """
    <style>
      .stApp { background: #f6f4fb; }
      .block-container { padding-top: 3.2rem; padding-bottom: 1rem; max-width: 1800px; }
    </style>
    """,
    unsafe_allow_html=True,
)

# Langue partagée par toutes les pages et par le jeu (mémorisée dans l'adresse : ?lang=en)
if "lang" not in st.session_state:
    q = st.query_params.get("lang")
    st.session_state["lang"] = q if q in LANGS else "fr"
    st.session_state["lang_ctrl"] = st.session_state["lang"]


def _set_lang():
    new = st.session_state.get("lang_ctrl") or st.session_state["lang"]
    st.session_state["lang"] = new
    st.query_params["lang"] = new


_, right = st.columns([6, 1])
with right:
    st.segmented_control(t("lang"), list(LANGS), format_func=LANGS.get, key="lang_ctrl", on_change=_set_lang, label_visibility="collapsed")

nav = st.navigation(
    [
        st.Page(game_page, title=t("page_game"), icon="🪁", url_path="jeu", default=True),
        st.Page(results_page, title=t("page_results"), icon="🗺️", url_path="resultats"),
    ],
    position="top",
)
nav.run()
