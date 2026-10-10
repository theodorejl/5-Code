# Journal du projet KiteCargo

Suivi de chaque demande (prompt) et des modifications apportées, du plus ancien au plus récent.

**Sources des informations :**
- **Date et heure** : heure du commit git qui clôt le prompt (fin du travail). Le signe ≈ indique une heure estimée, faute de commit dédié.
- **Temps de réflexion** et **tokens utilisés** : ces mesures ne sont pas accessibles depuis l'environnement de travail. Elles sont donc notées « non disponible » plutôt qu'estimées au hasard.

---

## 1. Créer un jeu simple dans Streamlit
- **Date** : 2026-10-09 ≈ 15:50 (inclus dans le commit `d9a4e70`)
- **Temps de réflexion** : non disponible · **Tokens** : non disponible
- **Demande** : modifier `Test.py`, relié à Streamlit, pour créer un jeu simple.
- **Modifications** :
  - `Test.py` : jeu « Devine le nombre » (1 à 100, indices plus/moins, compteur d'essais, meilleur score, bouton nouvelle partie).

## 2. Régler les problèmes
- **Date** : 2026-10-09 ≈ 15:54
- **Temps de réflexion** : non disponible · **Tokens** : non disponible
- **Demande** : corriger les problèmes signalés par l'éditeur.
- **Modifications** :
  - Installation de Streamlit dans Python Anaconda (l'import ne fonctionnait pas).
  - `.vscode/settings.json` : VS Code utilise l'interpréteur Anaconda.

## 3. Erreur de déploiement Streamlit Cloud
- **Date** : 2026-10-09 15:58 (commit `d9a4e70`)
- **Temps de réflexion** : non disponible · **Tokens** : non disponible
- **Demande** : comprendre le message « not connected to a remote GitHub repository ».
- **Modifications** :
  - Récupération du commit `.devcontainer` créé sur GitHub.
  - `.gitignore` (ignore `.vscode/`), commit du jeu et push sur `theodorejl/5-Code`.

## 4. Simulateur de traction d'un kite sur un cargo
- **Date** : 2026-10-09 16:17 (commit `702be63`)
- **Temps de réflexion** : non disponible · **Tokens** : non disponible
- **Demande** : jeu avec visuels soignés, potards (vitesse et cap du bateau, vitesse et orientation du vent), jauges colorées de gains fuel et CO₂, kite qui fait des 8, et montrer que baisser la vitesse apporte environ 2/3 des gains.
- **Modifications** :
  - `kite_sim.html` : simulateur en HTML/JS (scène animée, kite en 8, fumée, boussole, potards rotatifs, 3 jauges, courbe CO₂ selon la vitesse, répartition du gain vitesse/kite, missions).
  - Modèle physique : résistance ∝ V², puissance ∝ V³, kite de 400 m², trajet Rotterdam → New York.
  - `Test.py` intègre le simulateur. Ajout de `requirements.txt` et `.streamlit/config.toml`.

## 5. Bug de barre blanche et design plus clair
- **Date** : 2026-10-09 16:32 (commit `a18fc8a`)
- **Temps de réflexion** : non disponible · **Tokens** : non disponible
- **Demande** : corriger la barre blanche qui apparaît en touchant les potards, et passer à un design clair, sérieux, style ingénieur.
- **Modifications** :
  - Correction : plus de défilement interne dans le cadre du simulateur, hauteurs stabilisées.
  - Nouveau thème clair (polices IBM Plex, panneaux numérotés, grille technique en fond).
  - Le kite se déplace en douceur quand le cap ou le vent change. Graphique rendu plus lisible.

## 6. Mise en page compacte, jeu au clavier, pseudo et classement
- **Date** : 2026-10-10 00:47 (commit `143d6cd`)
- **Temps de réflexion** : non disponible · **Tokens** : non disponible
- **Demande** : tout voir sans défiler, jouer avec les flèches et la barre espace, tutoriel des touches, pseudo avant chaque partie, classement de tous les joueurs, design inspiré de theclimatebrink.com et aetherswisskite.ch.
- **Modifications** :
  - Mise en page compacte qui tient sur un écran d'ordinateur.
  - Mode « Défi Atlantique » : traversée chronométrée avec météo imposée (dont une tempête), score = CO₂ évité − pénalités de retard et de kite arraché.
  - Commandes clavier : ↑ ↓ ← →, Espace, P, H, Entrée. Tutoriel, saisie du pseudo, compte à rebours, écran de fin.
  - Classement partagé : stocké côté serveur via un petit composant pont entre le jeu et Python.
  - Design sombre inspiré des sites de référence.

## 7. Vues avant, mode pilote de kite, kite EPFL, équipes, pastel
- **Date** : 2026-10-10 09:10 (commit `b7b8c6e`)
- **Temps de réflexion** : non disponible · **Tokens** : non disponible
- **Demande** : vue vers l'avant dans le défi (cabine ou 3e personne), kite blanc avec le logo EPFL rouge partout, nouveau mode pour piloter le kite (fenêtre de vol, longueur de ligne de 25 à 1000 m, taille de kite de 5 à 500 m²), couleurs pastel plus claires, grosses vagues pendant les tempêtes, classement par équipe.
- **Modifications** :
  - Vue avant en perspective : 3/4 arrière ou cabine avec console, touche V. Houle et moutons d'écume qui grossissent avec le vent, roulis et tangage.
  - Mode « Pilote de kite » : pilotage aux flèches maintenues, fenêtre de vol en 3D (touche F), surcharge et casse de ligne, crash dans l'eau, session de 90 s notée.
  - Kite blanc avec « EPFL » en rouge sur tous les rendus.
  - Classements par mode, onglets Joueurs et Équipes (moyenne des meilleurs scores des membres).
  - Thème pastel clair sur tout le site.

## 8. Journal, inscription aux équipes, kites et lignes, briefing
- **Date** : 2026-10-10 09:42
- **Temps de réflexion** : non disponible · **Tokens** : non disponible
- **Demande** : tenir ce journal à jour à chaque prompt ; à l'inscription, pouvoir créer une équipe ou en rejoindre une via un menu déroulant ; mieux faire sentir la différence de maniabilité et de taille entre petits et grands kites et lignes ; mieux expliquer au début du jeu le but, les touches et les données affichées.
- **Modifications** :
  - `JOURNAL.md` créé, reprenant les prompts depuis le premier.
  - Inscription : menu déroulant avec les équipes existantes (et leur nombre de membres), « Sans équipe » ou « Créer une nouvelle équipe ». Si le nom créé existe déjà, le joueur rejoint l'équipe existante.
  - Maniabilité : un petit kite réagit en 0,2 s environ, un grand en 0,8 s, avec plus d'inertie. Une ligne longue ralentit encore les virages (environ 50°/s avec 25 m contre 11°/s avec 1000 m). Le tableau 07 affiche ces valeurs.
  - Taille à l'écran : surtout liée à la surface du kite, la ligne s'épaissit pour les grands kites. Boutons rapides plus contrastés (15 m² / 480 m², 40 m / 900 m).
  - Briefing en deux pages au début de chaque mode : but et touches, puis comment lire l'écran. Il s'ouvre aussi à la première arrivée dans le mode « Pilote de kite ».
  - Correction : la vue 3e personne n'affiche plus à tort les vitres de la cabine avec une ligne courte. Au repos, le kite se stabilise vers 45° au lieu de rester au zénith.
