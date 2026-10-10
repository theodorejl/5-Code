"""Génère docs/schema_fonctionnel.pdf : schéma fonctionnel d'Æther Swiss Kite Simulator.

Usage : python tools/make_schema_pdf.py
Quatre pages A4 paysage dessinées avec matplotlib (déjà nécessaire à l'application, aucune dépendance en plus) :
1. boucle macro VS Code ↔ GitHub ↔ Streamlit ↔ joueurs ;  2. architecture logicielle ;
3. modèles physiques ;  4. modèles visuels, performances et outils.
"""
import datetime as dt
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.backends.backend_pdf import PdfPages  # noqa: E402
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "schema_fonctionnel.pdf"

INK, MUTED, ACCENT = "#262b45", "#6b6f8a", "#7c6cf0"
PASTEL = {"lilac": "#ece8ff", "mint": "#dff5ec", "sky": "#e2eefa", "peach": "#fde9df", "sand": "#fbf3d9", "rose": "#fbe3ea", "grey": "#f1f0f6"}
EDGE = {"lilac": "#9b87f5", "mint": "#6cc59c", "sky": "#6fa3d8", "peach": "#e59a73", "sand": "#d6b85a", "rose": "#e07a98", "grey": "#a7a9bd"}
W, H = 100, 70.7  # repère des pages (proportions A4 paysage)


def page(pdf, title, subtitle, n):
    fig = plt.figure(figsize=(11.69, 8.27))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, W)
    ax.set_ylim(0, H)
    ax.axis("off")
    ax.text(4, H - 5, title, fontsize=19, fontweight="bold", color=INK, va="center")
    ax.text(4, H - 8.6, subtitle, fontsize=10, color=MUTED, va="center")
    ax.plot([4, W - 4], [H - 10.8, H - 10.8], color="#dcd8ea", lw=0.8)
    ax.text(4, 2.2, "Æther Swiss Kite Simulator · schéma fonctionnel", fontsize=7.5, color=MUTED)
    ax.text(W - 4, 2.2, f"{n} / 4 · {dt.date.today():%d.%m.%Y}", fontsize=7.5, color=MUTED, ha="right")
    return fig, ax


def box(ax, x, y, w, h, title, body="", tone="lilac", fs=8.2, tfs=9.6):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.25,rounding_size=1.2", fc=PASTEL[tone], ec=EDGE[tone], lw=1.1))
    ax.text(x + 1.2, y + h - 1.6, title, fontsize=tfs, fontweight="bold", color=INK, va="top")
    if body:
        ax.text(x + 1.2, y + h - 4.4, body, fontsize=fs, color=INK, va="top", linespacing=1.45)
    return (x, y, w, h)


def arrow(ax, p0, p1, label="", color=ACCENT, rad=0.0, fs=7.6, off=(0, 1.2), ls="-"):
    ax.add_patch(FancyArrowPatch(p0, p1, arrowstyle="-|>", mutation_scale=13, color=color, lw=1.4,
                                 connectionstyle=f"arc3,rad={rad}", linestyle=ls, shrinkA=2, shrinkB=2))
    if label:
        mx, my = (p0[0] + p1[0]) / 2 + off[0], (p0[1] + p1[1]) / 2 + off[1]
        ax.text(mx, my, label, fontsize=fs, color=color, ha="center", va="bottom",
                bbox=dict(boxstyle="round,pad=0.25", fc="white", ec="none", alpha=0.9))


def note(ax, x, y, text, fs=8, color=MUTED, **kw):
    ax.text(x, y, text, fontsize=fs, color=color, va="top", linespacing=1.45, **kw)


# ---------------------------------------------------------------- page 1 : boucle macro
def page_macro(pdf):
    fig, ax = page(pdf, "1. Boucle macro : du code au joueur",
                   "Chaque prompt suit la même boucle : modifier en local, tester, publier sur GitHub, Streamlit redéploie, les joueurs jouent.", 1)
    a = box(ax, 4, 38, 25, 20, "Poste local · VS Code",
            "Claude Code édite game/ (jeu HTML + JS)\net app/ (pages Python).\n"
            "Test local : streamlit run Test.py\n+ Chrome sans écran piloté (CDP)\npour jouer les 3 modes automatiquement.\n"
            "JOURNAL.md mis à jour à chaque prompt.", "lilac")
    b = box(ax, 37.5, 44, 25, 14, "Git + GitHub",
            "Dépôt theodorejl/5-Code, branche main.\ngit commit puis git push\n(après accord de l'utilisateur).\n"
            "La base SQLite locale\nn'est jamais publiée (.gitignore).", "sky")
    c = box(ax, 71, 38, 25, 20, "Streamlit Community Cloud",
            "Redéploie automatiquement à chaque\npush sur main (fichier principal Test.py).\n"
            "Serveur Python : pages, stockage SQLite,\nvalidation des scores.\n"
            "Disque éphémère : la base repart à zéro\nà chaque redéploiement.", "mint")
    d = box(ax, 71, 9, 25, 22, "Navigateur des joueurs",
            "Pages : Jeu · Résultats.\n"
            "Le jeu tourne dans une iframe\n(Canvas 2D, physique et rendu locaux,\n30 à 60 images/s).\n"
            "Langue FR / EN / DE partagée\nentre Streamlit et le jeu.", "peach")
    e = box(ax, 37.5, 9, 25, 22, "Données partagées",
            "SQLite aether_scores.db (table runs) :\npseudo, équipe, temps, pénalités,\nCO$_2$, collisions, trace de la route.\n"
            "Classements jour / semaine / historique,\npar joueur et par équipe.\n"
            "Traces des 3 meilleurs = fantômes.", "sand")
    f = box(ax, 4, 9, 25, 22, "Utilisateur (porteur du projet)",
            "Joue, observe les classements et\nla page Résultats.\n"
            "Rédige le prompt suivant (nouvelles\nfonctions, corrections, design).\n"
            "Consulte le suivi des prompts\net ce schéma (PDF).", "rose")
    arrow(ax, (a[0] + a[2], 52), (b[0], 52), "commit + push")
    arrow(ax, (b[0] + b[2], 52), (c[0], 52), "redéploie", fs=7.2)
    arrow(ax, (83.5, c[1]), (83.5, d[1] + d[3]), "HTML du jeu + pages", off=(0, -0.6))
    arrow(ax, (d[0], 25), (e[0] + e[2], 25), "score", fs=7.2, off=(0, 0.5))
    arrow(ax, (e[0] + e[2], 15), (d[0], 15), "classements\n+ fantômes", fs=7.2, off=(0, 0.5))
    arrow(ax, (e[0], 20), (f[0] + f[2], 20), "résultats", fs=7.2, off=(0, 0.5))
    arrow(ax, (16.5, f[1] + f[3]), (16.5, a[1]), "nouveau prompt", off=(0, -0.6))
    note(ax, 4, 6.2, "Boucle courte (minutes) en local avec tests automatisés ; boucle longue (push) seulement après validation. "
         "Pousser sur main redéploie l'application et remet à zéro le classement en ligne.", fs=7.8)
    pdf.savefig(fig)
    plt.close(fig)


# ---------------------------------------------------------------- page 2 : architecture
def page_archi(pdf):
    fig, ax = page(pdf, "2. Architecture logicielle",
                   "Python sert les pages et garde les scores ; tout le jeu (physique, rendu, commandes) tourne dans le navigateur.", 2)
    ax.text(4, 57.5, "SERVEUR STREAMLIT (PYTHON)", fontsize=8.5, color=MUTED, fontweight="bold")
    box(ax, 4, 44, 28, 12, "Test.py", "Configuration de la page, langue (?lang=),\nnavigation en haut : Jeu, Résultats.", "lilac")
    box(ax, 4, 28, 28, 14, "app/game.py", "Assemble index.html + leman_geo.json\n+ js/*.js (ordre des numéros) en un seul\ndocument, mis en cache selon les dates\nde modification. Monte le pont.", "lilac")
    box(ax, 4, 9, 28, 17, "app/storage · pages · i18n",
        "SQLite : validation (pseudo 1–16, temps\nplausible : ≥ 35 s / ≥ 105 s, total recalculé\ncôté serveur), classements, fantômes.\n"
        "Résultats : routes colorées (matplotlib).", "lilac", fs=7.9)
    ax.text(37, 57.5, "PONT", fontsize=8.5, color=MUTED, fontweight="bold")
    box(ax, 37, 28, 22, 28, "Pont aether_bridge",
        "st.components.v2\n\nPython → jeu :\n  data = {runs, ghosts, lang}\n  relayé par postMessage\n\n"
        "Jeu → Python :\n  postMessage {score | lang}\n  → setTriggerValue\n  → on_score_change : add_run\n  → on_lang_change : langue\n\n"
        "L'iframe du jeu n'est jamais\nrechargée (HTML identique).", "sky", fs=7.9)
    ax.text(64, 57.5, "JEU DANS LE NAVIGATEUR (HTML + CANVAS 2D)", fontsize=8.5, color=MUTED, fontweight="bold")
    mods = [
        ("00_core", "outils, couleurs, qualité adaptative"), ("05/06 i18n", "textes FR / EN / DE (≈ 280 clés)"),
        ("10_sandbox_model", "modèle du bac à sable"), ("15/20_sandbox", "potards, vue de côté, missions"),
        ("30_leman", "géographie, parcours, météo, CGN"), ("40_kite", "aile parapente, kite auto / manuel"),
        ("50_barge", "barge 40 m, modèles à facettes"), ("60_render", "ciel, relief, eau, villes, vent"),
        ("70_race", "physique, caméras, course, HUD"), ("80_board", "classements, podium, fin"),
        ("90_ui", "vues, tutoriels, clavier"), ("99_main", "boucle 60 i/s, LOD, démarrage"),
    ]
    ax.add_patch(FancyBboxPatch((64, 9), 32, 47, boxstyle="round,pad=0.25,rounding_size=1.2", fc=PASTEL["peach"], ec=EDGE["peach"], lw=1.1))
    ax.text(65.2, 54.4, "game/index.html + game/js/", fontsize=9.6, fontweight="bold", color=INK, va="top")
    for i, (m, d) in enumerate(mods):
        y = 50.6 - i * 3.45
        ax.text(65.4, y, m, fontsize=7.9, color=ACCENT, fontweight="bold", va="top", family="monospace")
        ax.text(76.4, y, d, fontsize=7.9, color=INK, va="top")
    arrow(ax, (18, 44), (18, 42.2))
    arrow(ax, (32, 35), (37, 35), "HTML")
    arrow(ax, (59, 42), (64, 42), "données")
    arrow(ax, (64, 33), (59, 33), "messages")
    arrow(ax, (37, 30), (32, 20), "score validé", rad=0.15)
    note(ax, 4, 6.2, "Les modules JS partagent une seule portée (concaténés dans une fonction) : pas de doublon de code entre "
         "bac à sable, traversées et accueil (même scène 3D déplacée d'une vue à l'autre).", fs=7.8)
    pdf.savefig(fig)
    plt.close(fig)


# ---------------------------------------------------------------- page 3 : physique
def page_physics(pdf):
    fig, ax = page(pdf, "3. Modèles physiques (un pas de calcul par image, dt ≤ 50 ms)",
                   "Priorité : inertie de la barge chargée, traction du kite dans sa fenêtre de vol, réactions aux risées et à la tempête.", 3)
    y0, hh = 41, 16
    steps = [
        ("Entrées", "ZQSD / souris :\ngaz et barre\nFlèches (expert) :\npilotage du kite,\nborder / choquer\nEspace : kite", "rose"),
        ("Météo du Léman", "windAt(x, y, τ)\nvents successifs :\nVaudaire, Vent,\nJoran (tempête\nτ 0,47–0,63), Bise\n46 risées + pétoles", "sky"),
        ("Vent au kite", "cisaillement\nloi en 1/7 :\n$W_k = W\\,(z/10)^{1/7}$\nvent apparent\n$W_a$, angle awa", "sky"),
        ("Kite", "150 m² (expert :\n10, 25 ou 100 m²)\nfenêtre de vol\n$w_f=\\cos\\theta\\cos\\varphi$\n$T=\\frac{1}{2}\\rho S C_L V_a^2$\nfinesse 4,2 · réglage\nsurcharge → casse", "lilac"),
        ("Forces barge", "$F_m$ = gaz · 80 kN\n$R = 4{,}2\\,u|u|$ kN\ntraînée du vent\n$F_{kite}=T\\cos\\theta\\cos(az)$\n+ effort latéral", "mint"),
        ("Dynamique", "$M\\,\\dot u=\\Sigma F$\nlacet du 1er ordre\ndérive latérale\ngîte : ressort\namorti ω=1,5 ζ=0,3", "mint"),
        ("Course", "position, temps\nrive +1,5 s\nvapeur CGN +5 s\njet-ski +2 s\ncarburant, CO$_2$\n→ score + trace", "peach"),
    ]
    w, gap = 11.3, 1.9
    for i, (t, b, tone) in enumerate(steps):
        x = 4 + i * (w + gap)
        box(ax, x, y0, w, hh, t, b, tone, fs=7.4, tfs=8.8)
        if i:
            arrow(ax, (x - gap, y0 + hh / 2), (x, y0 + hh / 2))
    # tableau des paramètres
    rows = [
        ("Grandeur", "Débutant", "Expert", "Commentaire"),
        ("Durée nominale (à 9,5 nd)", "≈ 60 s", "≈ 180 s", "temps compressé : 70,7 km réels"),
        ("Masse effective ressentie", "80 t", "190 t", "barge à gravier chargée, inertie"),
        ("Pilotage du kite", "automatique (8)", "manuel (flèches)", "fenêtre de vol, choquer / border"),
        ("Kite · lignes", "150 m² · 200 m", "10/25/100 m² · 25/100/300 m", "petit = vif, grand = puissant"),
        ("Tension max avant casse", "95 kN", "≈ 1,15 kN/m²", "pénalités : +4 s / +3 s / +2 s"),
        ("Taux de lacet max", "17 °/s", "9,5 °/s", "la barre n'agit qu'avec de la vitesse"),
        ("Moteur · résistance", "500 kW · 80 kN", "idem", "R = 4,2 kN/(m/s)² · u²"),
        ("Carburant · CO$_2$", "0,215 kg/kWh", "3,17 kg/kg", "CO$_2$ évité = poussée utile du kite"),
    ]
    tx, ty, cw = 4, 37.5, [24, 15, 23, 30]
    for r, row in enumerate(rows):
        x = tx
        for c, cell in enumerate(row):
            ax.text(x + 0.6, ty - r * 2.5, cell, fontsize=7.9, color=INK if r else MUTED, fontweight="bold" if r == 0 else "normal", va="top")
            x += cw[c]
        if r == 0:
            ax.plot([tx, tx + sum(cw)], [ty - 2.3, ty - 2.3], color="#dcd8ea", lw=0.8)
    box(ax, 4, 7.6, 44, 4.8, "Échelle", "", "grey", tfs=8.6)
    note(ax, 13, 11.3, "1 km réel = 60 m de jeu (1:16,7, relief ×1,3) : les angles du paysage restent\nréalistes ; barge, bateaux CGN et jet-skis gardent leur taille réelle.", fs=7.4, color=INK)
    box(ax, 52, 7.6, 44, 4.8, "Bac à sable", "", "grey", tfs=8.6)
    note(ax, 62, 11.3, "Puissance ∝ vitesse³ : ralentir de 8 à 7 nœuds économise plus que le\nkite seul ; environ 2/3 des gains viennent du ralentissement.", fs=7.4, color=INK)
    note(ax, 4, 5.4, "Même scénario météo pour tous (graine fixe) : risées, tempête, vapeurs CGN et jet-skis dépendent seulement de τ = t / durée nominale.", fs=7.6)
    pdf.savefig(fig)
    plt.close(fig)


# ---------------------------------------------------------------- page 4 : visuels et outils
def page_visual(pdf):
    fig, ax = page(pdf, "4. Modèles visuels, performances et outils",
                   "Rendu 3D maison sur Canvas 2D : projection équirectangulaire, ordre du peintre, faces orientées et éclairage du soleil.", 4)
    order = ["Ciel +\nsoleil", "Monta-\ngnes", "Eau +\nvagues", "Vent\n(windy)", "Fan-\ntômes", "Rives +\nvignes",
             "Villes +\nrepères", "Quai +\npelle", "Vapeurs,\njet-skis,\ndauphins", "Sillage", "Barge", "Fumée", "Kite +\nlignes", "Pluie,\néclairs,\nHUD"]
    ax.text(4, 57.5, "ORDRE DE RENDU À CHAQUE IMAGE (DU PLUS LOIN AU PLUS PROCHE)", fontsize=8.5, color=MUTED, fontweight="bold")
    w, gap = 5.6, 0.97
    for i, s in enumerate(order):
        x = 4 + i * (w + gap)
        ax.add_patch(FancyBboxPatch((x, 47.5), w, 7, boxstyle="round,pad=0.2,rounding_size=0.8", fc=PASTEL["sky" if i < 7 else "peach"], ec=EDGE["sky" if i < 7 else "peach"], lw=0.9))
        ax.text(x + w / 2, 51, s, fontsize=6.6, color=INK, ha="center", va="center", linespacing=1.25)
        if i:
            arrow(ax, (x - gap, 51), (x, 51), color=MUTED)
    box(ax, 4, 22, 29, 21, "Caméras",
        "Poursuite : ressort amorti derrière la\nbarge, suit le cap en douceur.\n"
        "Cabine (V) : vue depuis la timonerie.\n"
        "Intro : travelling du lac vers le quai\n(3-2-1) avec la pelle qui charge.\n"
        "Arrivée : orbite au pied du Jet d'eau.", "lilac", fs=7.9)
    box(ax, 36, 22, 29, 21, "Lumière et décor",
        "Soleil du lever (est, 9°) au coucher\nsur Genève (ouest), alpenglow sur la neige.\n"
        "Chablais, Dents du Midi, Évian à gauche ;\nMontreux, Lavaux, Lausanne, Genève à\ndroite (aucun nom écrit).\n"
        "Peu de vagues sauf en tempête.", "mint", fs=7.9)
    box(ax, 68, 22, 28, 21, "Performances (30–60 i/s)",
        "Qualité adaptative : si < 30 i/s pendant\n2,5 s → niveau inférieur ; si > 55 i/s\npendant 10 s → niveau supérieur.\n"
        "Niveau 2 / 1 / 0 : résolution ×1,5/1,25/1,\nrangées d'eau 30/22/16, traits de vent\n260/180/110, pluie 160/110/70.\n"
        "Objets lointains ignorés (distance).", "peach", fs=7.9)
    box(ax, 4, 6.5, 92, 12.5, "Outils et liens",
        "VS Code + Claude Code (édition, tests) · Git / GitHub (dépôt theodorejl/5-Code) · Streamlit 1.65 (pages, st.navigation, "
        "st.components.v2, st.iframe)\n"
        "Python : SQLite (scores), pandas (tableaux), matplotlib (routes colorées, ce PDF) · Navigateur : HTML, CSS, JavaScript, Canvas 2D, "
        "postMessage\n"
        "Tests : Chrome sans écran + protocole DevTools (CDP) : parcours automatisés des 3 modes, 3 langues, 3 gréements et classement ; "
        "captures d'écran vérifiées.\n"
        "Inspirations : bruno-simon.com (physique ludique), ig.ft.com/climate-game (enjeu climat), windy.app (visualisation du vent).",
        "grey", fs=7.7)
    pdf.savefig(fig)
    plt.close(fig)


def main():
    OUT.parent.mkdir(exist_ok=True)
    plt.rcParams["font.family"] = "DejaVu Sans"
    with PdfPages(OUT) as pdf:
        page_macro(pdf)
        page_archi(pdf)
        page_physics(pdf)
        page_visual(pdf)
        info = pdf.infodict()
        info["Title"] = "Æther Swiss Kite Simulator : schéma fonctionnel"
        info["Subject"] = "Boucle de développement, architecture, modèles physiques et visuels"
    print(f"écrit : {OUT}")


if __name__ == "__main__":
    main()
