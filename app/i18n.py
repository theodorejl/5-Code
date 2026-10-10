"""Textes des pages Streamlit (le jeu a ses propres traductions dans game/js/06_strings.js)."""
import streamlit as st

LANGS = {"fr": "FR", "en": "EN", "de": "DE"}

STRINGS = {
    "fr": {
        "page_game": "Jeu", "page_results": "Résultats", "page_journal": "Suivi des prompts", "page_admin": "Admin",
        "lang": "Langue",
        "model_title": "📐 Hypothèses physiques du modèle",
        "model_md": """
- **Barge à gravier** : 40 m, chargée. Résistance de carène ∝ V² (4,2 kN par (m/s)²), moteur de 500 kW (80 kN de poussée, environ 8,5 nœuds sans kite).
  Dans les traversées, l'inertie est réglée par une *masse effective* (80 t en débutant, 190 t en expert) : le temps est compressé pour qu'une traversée dure 1 ou 3 minutes.
- **Kite** : 150 m² en traversée, 90 m² dans le bac à sable. Vent à l'altitude du kite selon une loi en puissance 1/7, puis vent apparent (on retranche la vitesse de la barge).
  Traction = ½·ρ·S·C_L·Va², où Va combine le vent apparent et la vitesse propre de l'aile en travers du vent (d'où l'intérêt des 8). Fenêtre de vol : puissance ∝ cos(élévation)·cos(écart au centre).
- **Pilotage expert** : les lignes arrière font virer l'aile, les lignes avant règlent l'incidence (choquer/border). Au-delà de 115 kN la ligne casse.
- **Météo** : même scénario pour tous (Vaudaire, Vent, coup de Joran, Bise ; risées et pétole), qui se déroule selon le temps de course normalisé.
- **Bac à sable** : puissance ∝ V³, gazole par traversée ∝ V² ; répartition du gain = moyenne des deux ordres (ralentir puis kite, kite puis ralentir).
""",
        "res_title": "Routes des joueurs", "res_intro": "Chaque trait est la route d'un joueur, colorée selon la vitesse de la barge (bleu = lent, rouge = rapide).",
        "mode": "Mode", "beginner": "Traversée débutant", "expert": "Traversée expert", "period": "Période", "day": "Jour", "week": "Semaine", "all": "Historique",
        "players_n": "Nombre de joueurs affichés", "no_runs": "Aucune course enregistrée pour cette sélection.", "speed_kn": "Vitesse (nœuds)", "all_routes": "Toutes les routes",
        "col_rank": "Rang", "col_name": "Pseudo", "col_team": "Équipe", "col_total": "Temps total (s)", "col_time": "Course (s)", "col_pen": "Pénalités (s)",
        "col_co2": "CO₂ émis (kg)", "col_saved": "CO₂ évité (kg)", "col_coll": "Collisions", "col_date": "Date", "col_runs": "Courses", "col_players": "Joueurs",
        "col_best_b": "Meilleur débutant (s)", "col_best_e": "Meilleur expert (s)", "col_mode": "Mode",
        "jr_title": "Suivi des prompts", "jr_pdf": "📄 Télécharger le schéma fonctionnel (PDF)", "jr_nopdf": "Le PDF n'a pas encore été généré.",
        "ad_title": "Administration", "ad_pwd": "Mot de passe", "ad_login": "Se connecter", "ad_bad": "Mot de passe incorrect.", "ad_logout": "Se déconnecter",
        "ad_nosecret": "Aucun mot de passe n'est configuré. Ajoute `admin_password = \"…\"` dans `.streamlit/secrets.toml` (en local) ou dans les *Secrets* de l'application sur Streamlit Cloud.",
        "ad_runs": "Courses", "ad_players": "Joueurs", "ad_teams": "Équipes", "ad_danger": "Zone dangereuse",
        "ad_pick_player": "Joueur", "ad_new_name": "Nouveau pseudo", "ad_new_team": "Nouvelle équipe (vide = sans équipe)", "ad_rename": "Renommer / changer d'équipe",
        "ad_delete_hist": "Supprimer tout l'historique de ce joueur", "ad_confirm": "Je confirme", "ad_done": "{n} course(s) modifiée(s).", "ad_deleted": "{n} course(s) supprimée(s).",
        "ad_pick_team": "Équipe", "ad_rename_team": "Renommer l'équipe", "ad_detach": "Retirer l'équipe (les joueurs gardent leurs temps)", "ad_delete_team": "Supprimer toutes les courses de l'équipe",
        "ad_pick_runs": "Courses à supprimer", "ad_delete_runs": "Supprimer les courses sélectionnées",
        "ad_purge_mode": "Effacer un classement", "ad_purge_all": "Tout effacer", "ad_type": "Tape SUPPRIMER pour confirmer", "ad_purge": "Effacer",
        "ad_storage": "Stockage : base SQLite `aether_scores.db` à la racine de l'application. Sur Streamlit Cloud, elle est remise à zéro à chaque redéploiement.",
        "none": "—",
    },
    "en": {
        "page_game": "Game", "page_results": "Results", "page_journal": "Prompt log", "page_admin": "Admin",
        "lang": "Language",
        "model_title": "📐 Physical assumptions of the model",
        "model_md": """
- **Gravel barge**: 40 m, loaded. Hull resistance ∝ V² (4.2 kN per (m/s)²), 500 kW engine (80 kN thrust, about 8.5 knots without kite).
  In the crossings, inertia is set by an *effective mass* (80 t beginner, 190 t expert): time is compressed so that a crossing lasts 1 or 3 minutes.
- **Kite**: 150 m² in the crossings, 90 m² in the sandbox. Wind at kite altitude from a 1/7 power law, then apparent wind (barge speed subtracted).
  Pull = ½·ρ·S·C_L·Va², where Va combines the apparent wind and the wing's own crosswind speed (hence figure-eights). Wind window: power ∝ cos(elevation)·cos(offset from centre).
- **Expert flying**: back lines turn the wing, front lines set the angle of attack (depower/power). Above 115 kN the line snaps.
- **Weather**: the same scenario for everyone (Vaudaire, Vent, Joran squall, Bise; gusts and calm patches), driven by normalised race time.
- **Sandbox**: power ∝ V³, diesel per crossing ∝ V²; share of the gain = average of both orders (slow down then kite, kite then slow down).
""",
        "res_title": "Players' routes", "res_intro": "Each line is a player's route, coloured by barge speed (blue = slow, red = fast).",
        "mode": "Mode", "beginner": "Beginner crossing", "expert": "Expert crossing", "period": "Period", "day": "Today", "week": "This week", "all": "All time",
        "players_n": "Number of players shown", "no_runs": "No runs recorded for this selection.", "speed_kn": "Speed (knots)", "all_routes": "All routes",
        "col_rank": "Rank", "col_name": "Name", "col_team": "Team", "col_total": "Total time (s)", "col_time": "Race (s)", "col_pen": "Penalties (s)",
        "col_co2": "CO₂ emitted (kg)", "col_saved": "CO₂ avoided (kg)", "col_coll": "Collisions", "col_date": "Date", "col_runs": "Runs", "col_players": "Players",
        "col_best_b": "Best beginner (s)", "col_best_e": "Best expert (s)", "col_mode": "Mode",
        "jr_title": "Prompt log", "jr_pdf": "📄 Download the functional diagram (PDF)", "jr_nopdf": "The PDF has not been generated yet.",
        "ad_title": "Administration", "ad_pwd": "Password", "ad_login": "Log in", "ad_bad": "Wrong password.", "ad_logout": "Log out",
        "ad_nosecret": "No password is configured. Add `admin_password = \"…\"` to `.streamlit/secrets.toml` (locally) or to the app's *Secrets* on Streamlit Cloud.",
        "ad_runs": "Runs", "ad_players": "Players", "ad_teams": "Teams", "ad_danger": "Danger zone",
        "ad_pick_player": "Player", "ad_new_name": "New name", "ad_new_team": "New team (empty = no team)", "ad_rename": "Rename / change team",
        "ad_delete_hist": "Delete this player's whole history", "ad_confirm": "I confirm", "ad_done": "{n} run(s) updated.", "ad_deleted": "{n} run(s) deleted.",
        "ad_pick_team": "Team", "ad_rename_team": "Rename team", "ad_detach": "Remove the team (players keep their times)", "ad_delete_team": "Delete all the team's runs",
        "ad_pick_runs": "Runs to delete", "ad_delete_runs": "Delete selected runs",
        "ad_purge_mode": "Clear one leaderboard", "ad_purge_all": "Clear everything", "ad_type": "Type DELETE to confirm", "ad_purge": "Clear",
        "ad_storage": "Storage: SQLite database `aether_scores.db` at the app root. On Streamlit Cloud it is reset at every redeploy.",
        "none": "—",
    },
    "de": {
        "page_game": "Spiel", "page_results": "Resultate", "page_journal": "Prompt-Protokoll", "page_admin": "Admin",
        "lang": "Sprache",
        "model_title": "📐 Physikalische Annahmen des Modells",
        "model_md": """
- **Kiesschiff**: 40 m, beladen. Rumpfwiderstand ∝ V² (4,2 kN pro (m/s)²), 500-kW-Motor (80 kN Schub, etwa 8,5 Knoten ohne Kite).
  Bei den Überfahrten wird die Trägheit über eine *effektive Masse* eingestellt (80 t Einsteiger, 190 t Profi): die Zeit ist komprimiert, damit eine Überfahrt 1 bzw. 3 Minuten dauert.
- **Kite**: 150 m² bei den Überfahrten, 90 m² im Sandkasten. Wind in Kite-Höhe nach einem 1/7-Potenzgesetz, dann scheinbarer Wind (Schiffsgeschwindigkeit abgezogen).
  Zug = ½·ρ·S·C_L·Va², wobei Va den scheinbaren Wind und die Eigengeschwindigkeit des Schirms quer zum Wind kombiniert (daher die Achten). Windfenster: Leistung ∝ cos(Höhe)·cos(Abweichung von der Mitte).
- **Profi-Steuerung**: die hinteren Leinen lenken den Schirm, die vorderen stellen den Anstellwinkel ein (fieren/dichtholen). Über 115 kN reisst die Leine.
- **Wetter**: dasselbe Szenario für alle (Vaudaire, Vent, Joran-Bö, Bise; Böen und Flautenfelder), gesteuert durch die normierte Fahrzeit.
- **Sandkasten**: Leistung ∝ V³, Diesel pro Überfahrt ∝ V²; Anteile am Gewinn = Mittel beider Reihenfolgen (erst langsamer, dann Kite und umgekehrt).
""",
        "res_title": "Routen der Spieler", "res_intro": "Jede Linie ist die Route eines Spielers, eingefärbt nach Schiffsgeschwindigkeit (blau = langsam, rot = schnell).",
        "mode": "Modus", "beginner": "Überfahrt Einsteiger", "expert": "Überfahrt Profi", "period": "Zeitraum", "day": "Heute", "week": "Diese Woche", "all": "Ewig",
        "players_n": "Anzahl angezeigter Spieler", "no_runs": "Keine Fahrten für diese Auswahl.", "speed_kn": "Tempo (Knoten)", "all_routes": "Alle Routen",
        "col_rank": "Rang", "col_name": "Name", "col_team": "Team", "col_total": "Gesamtzeit (s)", "col_time": "Fahrt (s)", "col_pen": "Strafzeiten (s)",
        "col_co2": "CO₂ ausgestossen (kg)", "col_saved": "CO₂ vermieden (kg)", "col_coll": "Kollisionen", "col_date": "Datum", "col_runs": "Fahrten", "col_players": "Spieler",
        "col_best_b": "Bestzeit Einsteiger (s)", "col_best_e": "Bestzeit Profi (s)", "col_mode": "Modus",
        "jr_title": "Prompt-Protokoll", "jr_pdf": "📄 Funktionsschema herunterladen (PDF)", "jr_nopdf": "Das PDF wurde noch nicht erzeugt.",
        "ad_title": "Verwaltung", "ad_pwd": "Passwort", "ad_login": "Anmelden", "ad_bad": "Falsches Passwort.", "ad_logout": "Abmelden",
        "ad_nosecret": "Kein Passwort konfiguriert. Füge `admin_password = \"…\"` in `.streamlit/secrets.toml` (lokal) oder in den *Secrets* der App auf Streamlit Cloud hinzu.",
        "ad_runs": "Fahrten", "ad_players": "Spieler", "ad_teams": "Teams", "ad_danger": "Gefahrenzone",
        "ad_pick_player": "Spieler", "ad_new_name": "Neuer Name", "ad_new_team": "Neues Team (leer = kein Team)", "ad_rename": "Umbenennen / Team wechseln",
        "ad_delete_hist": "Gesamten Verlauf dieses Spielers löschen", "ad_confirm": "Ich bestätige", "ad_done": "{n} Fahrt(en) geändert.", "ad_deleted": "{n} Fahrt(en) gelöscht.",
        "ad_pick_team": "Team", "ad_rename_team": "Team umbenennen", "ad_detach": "Team entfernen (Spieler behalten ihre Zeiten)", "ad_delete_team": "Alle Fahrten des Teams löschen",
        "ad_pick_runs": "Zu löschende Fahrten", "ad_delete_runs": "Ausgewählte Fahrten löschen",
        "ad_purge_mode": "Eine Rangliste leeren", "ad_purge_all": "Alles löschen", "ad_type": "Tippe LÖSCHEN zur Bestätigung", "ad_purge": "Löschen",
        "ad_storage": "Speicherung: SQLite-Datenbank `aether_scores.db` im App-Verzeichnis. Auf Streamlit Cloud wird sie bei jedem Redeploy zurückgesetzt.",
        "none": "—",
    },
}
PURGE_WORD = {"fr": "SUPPRIMER", "en": "DELETE", "de": "LÖSCHEN"}


def lang():
    return st.session_state.get("lang", "fr")


def t(key, **kw):
    s = STRINGS.get(lang(), STRINGS["fr"]).get(key) or STRINGS["fr"].get(key, key)
    return s.format(**kw) if kw else s
