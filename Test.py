from pathlib import Path

import streamlit as st

st.set_page_config(page_title="KiteCargo", page_icon="🪁", layout="wide")

st.markdown(
    """
    <style>
      .stApp { background: #f3f5f8; }
      .block-container { padding-top: 1rem; padding-bottom: 1rem; max-width: 1440px; }
      header[data-testid="stHeader"] { background: transparent; }
    </style>
    """,
    unsafe_allow_html=True,
)

# Tout le simulateur (animation, potards, jauges) tourne en JavaScript dans le navigateur :
# l'animation reste fluide et ne redémarre pas à chaque réglage.
st.iframe(Path(__file__).parent / "kite_sim.html", height="content")

with st.expander("📐 Hypothèses du modèle"):
    st.markdown(
        """
- **Navire** : porte-conteneurs, 8 MW de puissance moteur à 14 nœuds (vitesse de référence).
  La résistance de la coque varie comme **V²**, donc la puissance comme **V³** et le carburant par trajet comme **V²**.
- **Trajet** : Rotterdam → New York, 3 400 milles nautiques. Conso spécifique 180 g/kWh, 3,114 t de CO₂ par tonne de fioul.
- **Vent** : le vent apparent (vent réel − vitesse du bateau) crée aussi une traînée sur les superstructures (pénalité par vent de face).
- **Kite** : aile de 400 m² volant en 8 vers 200–300 m (vent environ 30 % plus fort qu'au pont). Traction limitée à 250 kN,
  inutilisable si le vent apparent vient à moins de 45° de l'étrave, s'il est trop faible (< 8 nœuds) ou en tempête (> 38 nœuds).
  Il fournit au plus 60 % de la poussée.
- **Répartition du gain** : moyenne des deux ordres possibles (ralentir puis ajouter le kite, et l'inverse),
  pour ne favoriser aucun des deux leviers.
        """
    )
