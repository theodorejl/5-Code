"""Textes des pages Streamlit (le jeu a ses propres traductions dans game/js/06_strings.js)."""
import streamlit as st

LANGS = {"fr": "FR", "en": "EN", "de": "DE", "it": "IT"}

STRINGS = {
    "fr": {
        "page_game": "Jeu", "page_results": "Résultats",
        "lang": "Langue",
        "model_title": "📐 Hypothèses physiques du modèle",
        "model_md": """
- **Barge à gravier** : 40 m, chargée. Résistance de carène ∝ V² (4,2 kN par (m/s)²), moteur de 500 kW (80 kN de poussée, environ 8,5 nœuds sans kite) et groupe de bord de 60 kW toujours en marche.
  Dans les traversées, l'inertie est réglée par une *masse effective* (80 t en débutant, 190 t en expert) : le temps est compressé pour qu'une traversée dure 1 ou 3 minutes.
- **Classement** : indice CO₂ × temps (tonnes de CO₂ émises × secondes) : aller vite au moteur coûte du CO₂, aller trop lentement coûte du temps ; le kite fait baisser les deux.
- **Kite** : 150 m² et 200 m de lignes en traversée débutant ; en expert, tu choisis 10, 25 ou 100 m² et des lignes de 25, 100 ou 300 m ; 90 m² dans le bac à sable. Vent à l'altitude du kite selon une loi en puissance 1/7, puis vent apparent (on retranche la vitesse de la barge).
  Traction = ½·ρ·S·C_L·Va², où Va combine le vent apparent et la vitesse propre de l'aile en travers du vent (d'où l'intérêt des 8). Fenêtre de vol : puissance ∝ cos(élévation)·cos(écart au centre).
- **Pilotage expert** : les lignes arrière font virer l'aile, les lignes avant règlent l'incidence (choquer/border). Un petit kite vire vite mais tire peu ; des lignes longues montent chercher plus de vent mais l'aile traverse la fenêtre plus lentement. Au-delà d'environ 1,15 kN par m² de kite, la ligne casse.
- **Météo** : même scénario pour tous (Vaudaire, Vent, coup de Joran, Bise ; risées et pétole), qui se déroule selon le temps de course normalisé.
- **Bac à sable** : puissance ∝ V³, gazole par traversée ∝ V² ; répartition du gain = moyenne des deux ordres (ralentir puis kite, kite puis ralentir).
""",
        "sort": "Classer par", "sort_score": "CO₂ × temps", "sort_co2": "CO₂", "sort_time": "Temps", "col_attempt": "Tentative", "col_score": "CO₂ × temps (t·s)", "res_title": "Routes des joueurs", "res_intro": "Chaque trait est la route d'une tentative, colorée selon la vitesse de la barge (bleu = lent, rouge = rapide).",
        "mode": "Mode", "beginner": "Traversée débutant", "expert": "Traversée expert", "period": "Période", "day": "Jour", "week": "Semaine", "all": "Historique",
        "players_n": "Nombre de tentatives affichées", "no_runs": "Aucune course enregistrée pour cette sélection.", "speed_kn": "Vitesse (nœuds)", "all_routes": "Toutes les routes",
        "col_rank": "Rang", "col_name": "Pseudo", "col_team": "Équipe", "col_total": "Temps total (s)", "col_time": "Course (s)", "col_pen": "Pénalités (s)",
        "col_co2": "CO₂ émis (kg)", "col_saved": "CO₂ évité (kg)", "col_coll": "Collisions", "col_date": "Date",
        "none": "—",
    },
    "en": {
        "page_game": "Game", "page_results": "Results",
        "lang": "Language",
        "model_title": "📐 Physical assumptions of the model",
        "model_md": """
- **Gravel barge**: 40 m, loaded. Hull resistance ∝ V² (4.2 kN per (m/s)²), 500 kW engine (80 kN thrust, about 8.5 knots without kite) and a 60 kW onboard generator always running.
  In the crossings, inertia is set by an *effective mass* (80 t beginner, 190 t expert): time is compressed so that a crossing lasts 1 or 3 minutes.
- **Ranking**: CO₂ × time index (tonnes of CO₂ emitted × seconds): going fast on the engine costs CO₂, going too slow costs time; the kite lowers both.
- **Kite**: 150 m² on 200 m lines in the beginner crossing; in expert you pick 10, 25 or 100 m² and 25, 100 or 300 m lines; 90 m² in the sandbox. Wind at kite altitude from a 1/7 power law, then apparent wind (barge speed subtracted).
  Pull = ½·ρ·S·C_L·Va², where Va combines the apparent wind and the wing's own crosswind speed (hence figure-eights). Wind window: power ∝ cos(elevation)·cos(offset from centre).
- **Expert flying**: back lines turn the wing, front lines set the angle of attack (depower/power). A small kite turns fast but pulls little; long lines reach stronger wind but the wing crosses the window more slowly. Above about 1.15 kN per m² of kite the line snaps.
- **Weather**: the same scenario for everyone (Vaudaire, Vent, Joran squall, Bise; gusts and calm patches), driven by normalised race time.
- **Sandbox**: power ∝ V³, diesel per crossing ∝ V²; share of the gain = average of both orders (slow down then kite, kite then slow down).
""",
        "sort": "Rank by", "sort_score": "CO₂ × time", "sort_co2": "CO₂", "sort_time": "Time", "col_attempt": "Attempt", "col_score": "CO₂ × time (t·s)", "res_title": "Players' routes", "res_intro": "Each line is one attempt's route, coloured by barge speed (blue = slow, red = fast).",
        "mode": "Mode", "beginner": "Beginner crossing", "expert": "Expert crossing", "period": "Period", "day": "Today", "week": "This week", "all": "All time",
        "players_n": "Number of attempts shown", "no_runs": "No runs recorded for this selection.", "speed_kn": "Speed (knots)", "all_routes": "All routes",
        "col_rank": "Rank", "col_name": "Name", "col_team": "Team", "col_total": "Total time (s)", "col_time": "Race (s)", "col_pen": "Penalties (s)",
        "col_co2": "CO₂ emitted (kg)", "col_saved": "CO₂ avoided (kg)", "col_coll": "Collisions", "col_date": "Date",
        "none": "—",
    },
    "de": {
        "page_game": "Spiel", "page_results": "Resultate",
        "lang": "Sprache",
        "model_title": "📐 Physikalische Annahmen des Modells",
        "model_md": """
- **Kiesschiff**: 40 m, beladen. Rumpfwiderstand ∝ V² (4,2 kN pro (m/s)²), 500-kW-Motor (80 kN Schub, etwa 8,5 Knoten ohne Kite) und ein ständig laufender 60-kW-Bordgenerator.
  Bei den Überfahrten wird die Trägheit über eine *effektive Masse* eingestellt (80 t Einsteiger, 190 t Profi): die Zeit ist komprimiert, damit eine Überfahrt 1 bzw. 3 Minuten dauert.
- **Wertung**: Index CO₂ × Zeit (Tonnen CO₂ × Sekunden): schnell mit Motor kostet CO₂, zu langsam kostet Zeit; der Kite senkt beides.
- **Kite**: 150 m² an 200-m-Leinen bei der Einsteiger-Überfahrt; als Profi wählst du 10, 25 oder 100 m² und Leinen von 25, 100 oder 300 m; 90 m² im Sandkasten. Wind in Kite-Höhe nach einem 1/7-Potenzgesetz, dann scheinbarer Wind (Schiffsgeschwindigkeit abgezogen).
  Zug = ½·ρ·S·C_L·Va², wobei Va den scheinbaren Wind und die Eigengeschwindigkeit des Schirms quer zum Wind kombiniert (daher die Achten). Windfenster: Leistung ∝ cos(Höhe)·cos(Abweichung von der Mitte).
- **Profi-Steuerung**: die hinteren Leinen lenken den Schirm, die vorderen stellen den Anstellwinkel ein (fieren/dichtholen). Ein kleiner Kite dreht schnell, zieht aber wenig; lange Leinen erreichen stärkeren Wind, doch der Schirm quert das Fenster langsamer. Ab etwa 1,15 kN pro m² Kite reisst die Leine.
- **Wetter**: dasselbe Szenario für alle (Vaudaire, Vent, Joran-Bö, Bise; Böen und Flautenfelder), gesteuert durch die normierte Fahrzeit.
- **Sandkasten**: Leistung ∝ V³, Diesel pro Überfahrt ∝ V²; Anteile am Gewinn = Mittel beider Reihenfolgen (erst langsamer, dann Kite und umgekehrt).
""",
        "sort": "Sortieren nach", "sort_score": "CO₂ × Zeit", "sort_co2": "CO₂", "sort_time": "Zeit", "col_attempt": "Versuch", "col_score": "CO₂ × Zeit (t·s)", "res_title": "Routen der Spieler", "res_intro": "Jede Linie ist die Route eines Versuchs, eingefärbt nach Schiffsgeschwindigkeit (blau = langsam, rot = schnell).",
        "mode": "Modus", "beginner": "Überfahrt Einsteiger", "expert": "Überfahrt Profi", "period": "Zeitraum", "day": "Heute", "week": "Diese Woche", "all": "Ewig",
        "players_n": "Anzahl angezeigter Versuche", "no_runs": "Keine Fahrten für diese Auswahl.", "speed_kn": "Tempo (Knoten)", "all_routes": "Alle Routen",
        "col_rank": "Rang", "col_name": "Name", "col_team": "Team", "col_total": "Gesamtzeit (s)", "col_time": "Fahrt (s)", "col_pen": "Strafzeiten (s)",
        "col_co2": "CO₂ ausgestossen (kg)", "col_saved": "CO₂ vermieden (kg)", "col_coll": "Kollisionen", "col_date": "Datum",
        "none": "—",
    },
    "it": {
        "page_game": "Gioco", "page_results": "Risultati",
        "lang": "Lingua",
        "model_title": "📐 Ipotesi fisiche del modello",
        "model_md": """
- **Chiatta di ghiaia**: 40 m, carica. Resistenza dello scafo ∝ V² (4,2 kN per (m/s)²), motore da 500 kW (80 kN di spinta, circa 8,5 nodi senza kite) e generatore di bordo da 60 kW sempre acceso.
  Nelle traversate l'inerzia è data da una *massa efficace* (80 t principiante, 190 t esperto): il tempo è compresso perché una traversata duri 1 o 3 minuti.
- **Classifica**: indice CO₂ × tempo (tonnellate di CO₂ × secondi): andare veloci col motore costa CO₂, andare troppo piano costa tempo; il kite abbassa entrambi.
- **Kite**: 150 m² e 200 m di cavi nella traversata principiante; da esperto scegli 10, 25 o 100 m² e cavi da 25, 100 o 300 m; 90 m² nella sandbox. Vento alla quota del kite secondo una legge di potenza 1/7, poi vento apparente (si sottrae la velocità della chiatta).
  Trazione = ½·ρ·S·C_L·Va², dove Va combina il vento apparente e la velocità propria dell'ala trasversale al vento (da qui l'interesse degli 8). Finestra di volo: potenza ∝ cos(elevazione)·cos(scarto dal centro).
- **Pilotaggio esperto**: i cavi posteriori fanno virare l'ala, quelli anteriori regolano l'incidenza (lascare/cazzare). Un kite piccolo vira in fretta ma tira poco; cavi lunghi raggiungono vento più forte ma l'ala attraversa la finestra più lentamente. Oltre circa 1,15 kN per m² di kite il cavo si rompe.
- **Meteo**: stesso scenario per tutti (Vaudaire, Vent, colpo di Joran, Bise; raffiche e bonacce), che si svolge secondo il tempo di gara normalizzato.
- **Sandbox**: potenza ∝ V³, gasolio per traversata ∝ V²; ripartizione del guadagno = media dei due ordini (prima rallentare poi kite, e viceversa).
""",
        "sort": "Ordina per", "sort_score": "CO₂ × tempo", "sort_co2": "CO₂", "sort_time": "Tempo", "col_attempt": "Tentativo", "col_score": "CO₂ × tempo (t·s)", "res_title": "Rotte dei giocatori", "res_intro": "Ogni linea è la rotta di un tentativo, colorata secondo la velocità della chiatta (blu = lenta, rosso = veloce).",
        "mode": "Modalità", "beginner": "Traversata principiante", "expert": "Traversata esperto", "period": "Periodo", "day": "Oggi", "week": "Settimana", "all": "Sempre",
        "players_n": "Numero di tentativi mostrati", "no_runs": "Nessuna corsa registrata per questa selezione.", "speed_kn": "Velocità (nodi)", "all_routes": "Tutte le rotte",
        "col_rank": "Pos.", "col_name": "Nome", "col_team": "Squadra", "col_total": "Tempo totale (s)", "col_time": "Gara (s)", "col_pen": "Penalità (s)",
        "col_co2": "CO₂ emessa (kg)", "col_saved": "CO₂ evitata (kg)", "col_coll": "Collisioni", "col_date": "Data",
        "none": "—",
    },
}


def lang():
    return st.session_state.get("lang", "fr")


def t(key, **kw):
    s = STRINGS.get(lang(), STRINGS["fr"]).get(key) or STRINGS["fr"].get(key, key)
    return s.format(**kw) if kw else s
