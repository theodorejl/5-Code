import random

import streamlit as st

st.set_page_config(page_title="Devine le nombre", page_icon="🎯")

MIN, MAX = 1, 100


def nouvelle_partie():
    st.session_state.secret = random.randint(MIN, MAX)
    st.session_state.essais = []
    st.session_state.gagne = False


if "secret" not in st.session_state:
    nouvelle_partie()
if "meilleur" not in st.session_state:
    st.session_state.meilleur = None

st.title("🎯 Devine le nombre")
st.write(f"J'ai choisi un nombre entre **{MIN}** et **{MAX}**. À toi de le trouver !")

with st.form("essai", clear_on_submit=True):
    proposition = st.number_input("Ta proposition", min_value=MIN, max_value=MAX, step=1, value=None)
    valider = st.form_submit_button("Valider", disabled=st.session_state.gagne)

if valider and proposition is not None and not st.session_state.gagne:
    proposition = int(proposition)
    st.session_state.essais.append(proposition)
    if proposition == st.session_state.secret:
        st.session_state.gagne = True
        nb = len(st.session_state.essais)
        if st.session_state.meilleur is None or nb < st.session_state.meilleur:
            st.session_state.meilleur = nb

essais = st.session_state.essais

if st.session_state.gagne:
    st.balloons()
    st.success(f"Bravo ! C'était bien {st.session_state.secret}, trouvé en {len(essais)} essai(s).")
elif essais:
    dernier = essais[-1]
    if dernier < st.session_state.secret:
        st.warning(f"{dernier} : c'est **plus** ⬆️")
    else:
        st.warning(f"{dernier} : c'est **moins** ⬇️")

col1, col2 = st.columns(2)
col1.metric("Essais", len(essais))
col2.metric("Meilleur score", st.session_state.meilleur or "—")

if essais:
    st.caption("Historique : " + ", ".join(str(e) for e in essais))

if st.button("🔄 Nouvelle partie"):
    nouvelle_partie()
    st.rerun()
