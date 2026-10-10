# Journal des prompts · Æther Swiss Kite Simulator

Suivi de chaque demande (prompt) et des modifications apportées, du plus ancien au plus récent. Le projet s'appelait « KiteCargo » jusqu'au prompt 10.

**Comment les heures sont mesurées**
- **Heure du prompt** : heure d'envoi du message, lue dans l'historique local de la session Claude Code (heure de Zurich).
- **Heure du résultat** : moment où le travail est livré. Quand le prompt se termine par la question « je pousse sur GitHub ? », c'est l'heure de cette question : l'attente de la réponse n'est pas comptée.
- **Temps de calcul** : écart entre les deux. Il comprend la réflexion, l'écriture du code et les tests automatiques.
- **Tokens** : non accessibles depuis l'environnement de travail, donc non indiqués.

| # | Prompt | Heure du prompt | Heure du résultat | Temps de calcul |
|---|---|---|---|---|
| 1 | Créer un jeu simple dans Streamlit | 10-09 15:53:31 | 10-09 15:53:46 | 15 s |
| 2 | Régler les problèmes | 10-09 15:54:03 | 10-09 15:54:59 | 56 s |
| 3 | Erreur de déploiement Streamlit Cloud | 10-09 15:57:55 | 10-09 15:58:35 | 40 s |
| 4 | Simulateur de traction d'un kite sur un cargo | 10-09 16:02:48 | 10-09 16:17:17 | 14 min 29 s |
| 5 | Bug de barre blanche et design plus clair | 10-09 16:26:34 | 10-09 16:33:02 | 6 min 28 s |
| 6 | Mise en page compacte, jeu au clavier, pseudo et classement | 10-10 00:29:15 | 10-10 00:47:12 | 17 min 57 s |
| 7 | Vues avant, mode pilote de kite, kite EPFL, équipes, pastel | 10-10 08:31:19 | 10-10 09:10:52 | 39 min 33 s |
| 8 | Journal, inscription aux équipes, kites et lignes, briefing | 10-10 09:33:39 | 10-10 09:43:06 | 9 min 27 s |
| 9 | Fluidité, repères en mer, pays à l'horizon, pilotage du cargo | 10-10 14:11:16 | 10-10 14:20:16 | 9 min 00 s |
| 10 | Sites de jeux en ligne pour s'inspirer | 10-10 15:41:42 | 10-10 15:42:23 | 41 s |
| 11 | Æther Swiss Kite Simulator : refonte complète | 10-10 16:47:06 | 10-10 17:49:13 | 1 h 02 min 07 s |
| 12 | Pages retirées, gréement expert, caméra, tableau de bord | 10-10 18:09:19 | 10-10 21:44:53 | 10 min 54 s |
| 13 | Score CO₂ × temps, tentatives datées, bleu marine, EPFL, pirate, italien | 10-10 21:46:38 | 10-10 22:06:08 | 19 min 30 s |

---

## 1. Créer un jeu simple dans Streamlit
- **Heure du prompt** : 2026-10-09 15:53:31 · **Heure du résultat** : 2026-10-09 15:53:46 · **Temps de calcul** : 15 s
- **Commit** : inclus dans `d9a4e70`
- **Demande** : modifier `Test.py`, relié à Streamlit, pour créer un jeu simple.
- **Modifications** :
  - `Test.py` : jeu « Devine le nombre » (1 à 100, indices plus/moins, compteur d'essais, meilleur score, bouton nouvelle partie).

## 2. Régler les problèmes
- **Heure du prompt** : 2026-10-09 15:54:03 · **Heure du résultat** : 2026-10-09 15:54:59 · **Temps de calcul** : 56 s
- **Commit** : inclus dans `d9a4e70`
- **Demande** : corriger les problèmes signalés par l'éditeur.
- **Modifications** :
  - Installation de Streamlit dans Python Anaconda (l'import ne fonctionnait pas).
  - `.vscode/settings.json` : VS Code utilise l'interpréteur Anaconda.

## 3. Erreur de déploiement Streamlit Cloud
- **Heure du prompt** : 2026-10-09 15:57:55 · **Heure du résultat** : 2026-10-09 15:58:35 · **Temps de calcul** : 40 s
- **Commit** : `d9a4e70`
- **Demande** : comprendre le message « not connected to a remote GitHub repository ».
- **Modifications** :
  - Récupération du commit `.devcontainer` créé sur GitHub.
  - `.gitignore` (ignore `.vscode/`), commit du jeu et push sur `theodorejl/5-Code`.

## 4. Simulateur de traction d'un kite sur un cargo
- **Heure du prompt** : 2026-10-09 16:02:48 · **Heure du résultat** : 2026-10-09 16:17:17 · **Temps de calcul** : 14 min 29 s
- **Commit** : `702be63`
- **Demande** : jeu avec visuels soignés, potards (vitesse et cap du bateau, vitesse et orientation du vent), jauges colorées de gains fuel et CO₂, kite qui fait des 8, et montrer que baisser la vitesse apporte environ 2/3 des gains.
- **Modifications** :
  - `kite_sim.html` : simulateur en HTML/JS (scène animée, kite en 8, fumée, boussole, potards rotatifs, 3 jauges, courbe CO₂ selon la vitesse, répartition du gain vitesse/kite, missions).
  - Modèle physique : résistance ∝ V², puissance ∝ V³, kite de 400 m², trajet Rotterdam → New York.
  - `Test.py` intègre le simulateur. Ajout de `requirements.txt` et `.streamlit/config.toml`.

## 5. Bug de barre blanche et design plus clair
- **Heure du prompt** : 2026-10-09 16:26:34 · **Heure du résultat** : 2026-10-09 16:33:02 · **Temps de calcul** : 6 min 28 s
- **Commit** : `a18fc8a`
- **Demande** : corriger la barre blanche qui apparaît en touchant les potards, et passer à un design clair, sérieux, style ingénieur.
- **Modifications** :
  - Correction : plus de défilement interne dans le cadre du simulateur, hauteurs stabilisées.
  - Nouveau thème clair (polices IBM Plex, panneaux numérotés, grille technique en fond).
  - Le kite se déplace en douceur quand le cap ou le vent change. Graphique rendu plus lisible.

## 6. Mise en page compacte, jeu au clavier, pseudo et classement
- **Heure du prompt** : 2026-10-10 00:29:15 · **Heure du résultat** : 2026-10-10 00:47:12 · **Temps de calcul** : 17 min 57 s
- **Commit** : `143d6cd`
- **Demande** : tout voir sans défiler, jouer avec les flèches et la barre espace, tutoriel des touches, pseudo avant chaque partie, classement de tous les joueurs, design inspiré de theclimatebrink.com et aetherswisskite.ch.
- **Modifications** :
  - Mise en page compacte qui tient sur un écran d'ordinateur.
  - Mode « Défi Atlantique » : traversée chronométrée avec météo imposée (dont une tempête), score = CO₂ évité − pénalités de retard et de kite arraché.
  - Commandes clavier : ↑ ↓ ← →, Espace, P, H, Entrée. Tutoriel, saisie du pseudo, compte à rebours, écran de fin.
  - Classement partagé : stocké côté serveur via un petit composant pont entre le jeu et Python.
  - Design sombre inspiré des sites de référence.

## 7. Vues avant, mode pilote de kite, kite EPFL, équipes, pastel
- **Heure du prompt** : 2026-10-10 08:31:19 · **Heure du résultat** : 2026-10-10 09:10:52 · **Temps de calcul** : 39 min 33 s
- **Commit** : `b7b8c6e`
- **Demande** : vue vers l'avant dans le défi (cabine ou 3e personne), kite blanc avec le logo EPFL rouge partout, nouveau mode pour piloter le kite (fenêtre de vol, longueur de ligne de 25 à 1000 m, taille de kite de 5 à 500 m²), couleurs pastel plus claires, grosses vagues pendant les tempêtes, classement par équipe.
- **Modifications** :
  - Vue avant en perspective : 3/4 arrière ou cabine avec console, touche V. Houle et moutons d'écume qui grossissent avec le vent, roulis et tangage.
  - Mode « Pilote de kite » : pilotage aux flèches maintenues, fenêtre de vol en 3D (touche F), surcharge et casse de ligne, crash dans l'eau, session de 90 s notée.
  - Kite blanc avec « EPFL » en rouge sur tous les rendus.
  - Classements par mode, onglets Joueurs et Équipes (moyenne des meilleurs scores des membres).
  - Thème pastel clair sur tout le site.

## 8. Journal, inscription aux équipes, kites et lignes, briefing
- **Heure du prompt** : 2026-10-10 09:33:39 · **Heure du résultat** : 2026-10-10 09:43:06 · **Temps de calcul** : 9 min 27 s
- **Commit** : `bd07f1c`
- **Demande** : tenir ce journal à jour à chaque prompt ; à l'inscription, pouvoir créer une équipe ou en rejoindre une via un menu déroulant ; mieux faire sentir la différence de maniabilité et de taille entre petits et grands kites et lignes ; mieux expliquer au début du jeu le but, les touches et les données affichées.
- **Modifications** :
  - `JOURNAL.md` créé, reprenant les prompts depuis le premier.
  - Inscription : menu déroulant avec les équipes existantes (et leur nombre de membres), « Sans équipe » ou « Créer une nouvelle équipe ». Si le nom créé existe déjà, le joueur rejoint l'équipe existante.
  - Maniabilité : un petit kite réagit en 0,2 s environ, un grand en 0,8 s, avec plus d'inertie. Une ligne longue ralentit encore les virages (environ 50°/s avec 25 m contre 11°/s avec 1000 m). Le tableau 07 affiche ces valeurs.
  - Taille à l'écran : surtout liée à la surface du kite, la ligne s'épaissit pour les grands kites. Boutons rapides plus contrastés (15 m² / 480 m², 40 m / 900 m).
  - Briefing en deux pages au début de chaque mode : but et touches, puis comment lire l'écran. Il s'ouvre aussi à la première arrivée dans le mode « Pilote de kite ».
  - Correction : la vue 3e personne n'affiche plus à tort les vitres de la cabine avec une ligne courte. Au repos, le kite se stabilise vers 45° au lieu de rester au zénith.

## 9. Fluidité, repères en mer, pays à l'horizon, pilotage du cargo
- **Heure du prompt** : 2026-10-10 14:11:16 · **Heure du résultat** : 2026-10-10 14:20:16 · **Temps de calcul** : 9 min 00 s
- **Commit** : `43f1d36`
- **Demande** : mouvements du bateau plus fluides et moins rapides ; repères visuels en mer (bateaux de pêche, voiliers, navires militaires, îles) pour situer sa progression dans le défi ; dans le mode kite, voir à l'horizon les destinations selon le cap du cargo (tour Eiffel et Mont Blanc vers la France, désert et palmiers vers l'Afrique, statue de la Liberté vers New York…), qui grossissent quand on s'approche ; pouvoir diriger le cargo pour aller chercher plus ou moins de vent.
- **Modifications** :
  - Fluidité : le cap, la vitesse et le vent affichés suivent les vraies valeurs en douceur (plus de saut de 5° à chaque appui). Roulis, tangage et pilonnement plus lents et plafonnés, faits de deux oscillations superposées.
  - Défi Atlantique : une vingtaine de repères le long de la route, dans une échelle visuelle compressée pour avoir le temps de les voir. On croise un parc éolien, un porte-conteneurs, les falaises de Douvres, le cap Gris-Nez, le phare de Bishop Rock, des voiliers, des chalutiers, des navires militaires, les icebergs des Grands Bancs, Terre-Neuve, le phare de Nantucket, puis New York avec la statue de la Liberté. Un message annonce chaque lieu nommé (à bâbord, à tribord ou droit devant).
  - Pilote de kite :
    - Carte schématique de l'Atlantique, avec 6 zones de vent : centre, vents d'ouest forts au nord, alizés au sud, calmes près de l'Afrique, petit vent d'est, dépression au nord-est.
    - Le cargo se pilote avec Q/A et D pour le cap, Z/W et S pour la vitesse, ou avec les potards cap et vitesse, désormais visibles dans ce mode. Le kite garde sa place dans le ciel quand le cargo tourne. Un conseil s'affiche quand le vent vient de face.
    - À l'horizon, selon le cap : France (tour Eiffel, Mont Blanc), Royaume-Uni (falaises, Big Ben), Islande (glacier, volcan), New York (gratte-ciel, statue de la Liberté), Afrique (dunes, pyramide, palmiers). Leur taille grandit quand on s'en approche et leur distance est affichée.
    - La boussole (02) montre la carte des vents autour du cargo, du vert (calme) au violet (fort), avec les icônes des destinations. Elle a maintenant le nord en haut.
  - Briefing du mode kite complété : touches du cargo, carte des vents, lecture de l'horizon.

## 10. Sites de jeux en ligne pour s'inspirer
- **Heure du prompt** : 2026-10-10 15:41:42 · **Heure du résultat** : 2026-10-10 15:42:23 · **Temps de calcul** : 41 s
- **Commit** : `424d9e6` (journal)
- **Demande** : 10 sites de jeux ou simulateurs en ligne proposant une expérience similaire, comme sources d'inspiration.
- **Modifications** : aucune modification du code. Liste fournie dans la conversation : En-ROADS, The Climate Game (Financial Times), PhET, Virtual Regatta, Sailonline, Windy, earth.nullschool.net, Ventusky, MarineTraffic, portfolio 3D de Bruno Simon.

## 11. Æther Swiss Kite Simulator : refonte complète
- **Heure du prompt** : 2026-10-10 16:47:06 · **Heure du résultat** : 2026-10-10 17:49:13 · **Temps de calcul** : 1 h 02 min 07 s
- **Commit** : voir l'historique git (commit « Æther Swiss Kite Simulator »)
- **Demande** : cahier des charges complet (rôle de développeur senior). Renommer le jeu, interface FR / EN / DE, page d'accueil, trois modes (bac à sable, traversée débutant d'environ 1 min, traversée expert d'environ 3 min), barge à gravier de 40 m de Villeneuve au Jet d'eau, météo rythmée identique pour tous, obstacles, cinématiques, podium, classements par période, page admin protégée, fantômes, grand kite en forme de parapente, physique prioritaire, schéma fonctionnel en PDF, 30 à 60 images/s, vérification finale.
- **Modifications** :
  - **Structure** : le jeu est découpé en `game/index.html` + 13 modules `game/js/*.js` + `game/leman_geo.json`, assemblés par Python. Services dans `app/` (`game.py`, `pages.py`, `storage.py`, `i18n.py`). `Test.py` ne fait plus que la navigation. L'ancien `kite_sim.html` est supprimé.
  - **Langues** : boutons FR / EN / DE dans le jeu et dans Streamlit, synchronisés dans les deux sens (≈ 280 textes par langue, tutoriels compris).
  - **Accueil** : scène 3D animée, texte de vision, trois cartes de mode illustrées avec tutoriel, classements.
  - **Pages Streamlit** : Résultats (routes de chaque joueur colorées selon la vitesse), Suivi des prompts (ce journal + téléchargement du PDF), Admin.
  - **Bac à sable** : barge vue de côté (Dents du Midi, Lavaux), kite parapente, explication du slow steaming conservée.
  - **Traversées** : barre et gaz à la souris ou au clavier (ZQSD), kite sorti / rentré (Espace), vue V, fenêtre de vol F, traces T. En expert, le kite se pilote aux flèches : ← → pour virer, ↓ border, ↑ choquer.
  - **Décor** : Léman à l'échelle (1 km = 60 m, relief ×1,3) : Chablais, Dents du Midi et Évian à gauche ; Chillon, Montreux, Lavaux, Lausanne, Nyon et Genève avec le Jet d'eau à droite, sans aucun nom écrit. Lumière du lever au coucher du soleil sur Genève.
  - **Météo** : vents successifs (Vaudaire, Vent, Joran en tempête, Bise), 46 risées et des zones de pétole visibles comme sur windy.app, gîte pendant la tempête. Le scénario est le même pour tous. Obstacles : vapeurs CGN (+5 s), jet-skis (+2 s), rives (+1,5 s). Des dauphins accompagnent la barge.
  - **Cinématiques** : compte à rebours 3-2-1 en travelling du lac vers le quai, où une pelle chargeait la barge. Arrivée en orbite au pied du Jet d'eau.
  - **Classements** : podium, temps au millième, histogramme des temps, onglets jour / semaine / historique et joueurs / équipes. Les traces des 3 meilleurs servent de fantômes (touche T).
  - **Stockage** : base SQLite (remplace `leaderboard.json`). Le serveur valide chaque course : un temps impossible est refusé et le total est recalculé.
  - **Admin** : accès par mot de passe (`admin_password` dans `.streamlit/secrets.toml`, jamais publié). On peut renommer un joueur ou une équipe, détacher une équipe et supprimer des courses ou tout l'historique.
  - **Kite** : grande aile en forme de parapente (caissons, profil, suspentes, logo EPFL).
  - **Physique** : inertie de la barge chargée, traction dans la fenêtre de vol, vent apparent et cisaillement, surcharge et casse.
  - **Performances** : qualité adaptative sur 3 niveaux pour tenir 30 à 60 images/s. La boucle d'animation résiste désormais à une erreur ponctuelle au lieu de se figer.
  - **Documentation** : `docs/schema_fonctionnel.pdf` (4 pages : boucle VS Code ↔ GitHub ↔ Streamlit, architecture, modèles physiques, rendu et outils), produit par `tools/make_schema_pdf.py`.
- **Vérification** (Chrome sans écran piloté automatiquement contre `streamlit run Test.py`) :
  - traversée débutant complète en français (73,5 s + 5 s de pénalité) ;
  - traversée expert complète en anglais (223,9 s + 15 s), avec le kite piloté aux flèches ;
  - bac à sable ; allemand à 1366 × 768 ;
  - changement de langue depuis le jeu puis depuis Streamlit ;
  - classements (podium, équipes), fantômes, pause ;
  - pages Résultats et Suivi des prompts ;
  - admin : mot de passe refusé puis accepté, renommage, déconnexion ;
  - tests de la base : validation, renommages, suppressions, purge.
  - Aucune erreur JavaScript à la fin des tests.
- **Corrections faites pendant la vérification** : mini-carte écrasée, textes qui débordaient dans la barre du bas, trait de vent qui traversait l'écran, gravier pixelisé en vue cabine, jauge du bac à sable qui figeait l'animation, temps de course trop courts acceptés par le serveur.
- **Reste fragile** :
  - Sur Streamlit Cloud, la base SQLite est remise à zéro à chaque redéploiement : il faudra une base externe pour un historique durable.
  - Le chrono est calculé dans le navigateur. Le serveur refuse les temps impossibles, mais un tricheur averti pourrait envoyer un temps plausible.
  - Les 60 images/s ont été mesurées sans écran : à confirmer sur un portable réel.
  - Une traversée « normale » dure environ 70 s en débutant et 200 à 220 s en expert, un peu plus que les durées cibles.

## 12. Pages retirées, gréement expert au choix, caméra qui suit le kite, tableau de bord
- **Heure du prompt** : 2026-10-10 18:09:19 · **Heure du résultat** : 2026-10-10 21:44:53 · **Temps de calcul** : 10 min 54 s (travail interrompu de 18:18 à 21:42, relancé par « fini ce que tu faisais » ; l'attente n'est pas comptée)
- **Demande** : retirer la page de suivi des prompts et l'administration ; en expert, proposer 3 tailles de kite (10, 25, 100 m²) et 3 longueurs de lignes (25, 100, 300 m) ; adapter la vue 3e personne pour voir le kite ; un tableau de données plus coloré sous la scène, avec potards et jauges.
- **Modifications** :
  - **Pages** : l'application n'a plus que Jeu et Résultats. Les pages Suivi des prompts et Admin sont supprimées, avec leurs textes et les fonctions d'administration de la base. Le mot de passe local n'existe plus. Ce fichier reste tenu à jour dans le dépôt.
  - **Gréement expert** : dans l'encadré du kite, choix de la surface (10, 25 ou 100 m²) et des lignes (25, 100 ou 300 m), mémorisé d'une partie à l'autre. On ne peut changer qu'avec le kite rentré.
    - La traction est proportionnelle à la surface. La tension de rupture dépend de la taille (≈ 1,15 kN par m²).
    - Un petit kite vire plus vite (×1,3 à 10 m², ×0,66 à 100 m²).
    - Des lignes courtes font traverser la fenêtre plus vite. Des lignes longues montent chercher un vent plus fort (loi en 1/7).
    - La taille de l'aile et la longueur des lignes se voient à l'écran. Le gréement apparaît sur l'écran d'arrivée.
  - **Caméra** : en expert, la vue 3e personne recule, pivote vers le côté du kite et dézoome automatiquement pour garder la barge et l'aile à l'écran, même avec 300 m de lignes.
  - **Tableau de bord** : la barre du bas devient 10 instruments colorés :
    - chrono avec anneau de progression ;
    - compteur de vitesse ;
    - potard des gaz ;
    - cadran du vent par rapport à la barge ;
    - jauge de tension avec zones orange et rouge ;
    - anneau de la part du kite dans la poussée ;
    - barres de CO₂ émis et évité ;
    - inclinomètre de gîte ;
    - pastilles de pénalités ;
    - courbe des images par seconde.
  - **PDF** : schéma fonctionnel mis à jour (pages retirées, gréement expert).
- **Vérification** : traversée expert en français puis en allemand (1366 × 768) avec les gréements 10 m²/25 m, 25/100, 100/300, 10/100 et 100/25. Le kite reste pilotable par un pilote automatique simple : il vole 65 à 97 % du temps. Le changement de gréement est bien refusé kite sorti. La navigation n'affiche plus que Jeu et Résultats. Aucune erreur JavaScript.

## 13. Score CO₂ × temps, tentatives datées, bleu marine, EPFL et essais Aether, pirate et requins, italien
- **Heure du prompt** : 2026-10-10 21:46:38 · **Heure du résultat** : 2026-10-10 22:06:08 · **Temps de calcul** : 19 min 30 s
- **Demande** : liste de 13 améliorations :
  - nouvelle échelle de classement CO₂ × temps (podium sur cet indice, tableau triable par indice, CO₂ ou temps) ;
  - garder toutes les tentatives d'une personne, datées ;
  - bleu marine à la place du bleu-violet ;
  - campus EPFL avec le Rolex Learning Center et les essais du prototype Aether devant Lausanne ;
  - montagnes sans trous et Valais au loin, Jet d'eau plus stylé ;
  - nouvelle phrase d'accueil et nouveaux sous-titres des modes ;
  - bateau pirate et requins dans la tempête ;
  - italien ;
  - bouton Pause ;
  - fenêtre de jeu plus grande ;
  - message « Espace pour lancer le kite » ;
  - onglets du classement qui ne marchaient pas.
- **Modifications** :
  - **Classement** :
    - Indice CO₂ × temps (t·s) = tonnes de CO₂ émises × temps total. Il classe toujours le podium. Le tableau se trie par indice, par CO₂ ou par temps.
    - Chaque tentative est une ligne datée, par exemple « TJL – Aether Alumni – 10/10/2026 22h05 ». Les équipes sont classées sur la meilleure tentative de chaque membre.
    - L'histogramme suit le critère choisi. L'écran d'arrivée affiche l'indice et le rang parmi toutes les tentatives. La page Résultats propose les mêmes tris.
  - **CO₂ du bord** : un groupe électrogène de bord de 60 kW tourne en permanence (treuil et pilote automatique du kite, timonerie). Ainsi, traîner sans moteur n'est pas gratuit : l'indice récompense le bon compromis entre vitesse, moteur et kite.
  - **Bug des onglets** : dans la fenêtre « Classements » et sur l'écran d'arrivée, les onglets ne redessinaient rien. Ces deux blocs sont maintenant enregistrés et redessinés à chaque clic.
  - **Couleurs** : tous les bleu-violet (accent, boutons, onglets, jauges, logo, thème Streamlit) passent au bleu marine. « Aether Swiss Kite » est écrit en bleu dans le titre d'accueil.
  - **Textes** : accueil « Bienvenue sur le simulateur Aether Swiss Kite ». Sous-titres des modes : « ≈ 1 min – pilote la barge uniquement » et « ≈ 3 min – pilote la barge et le kite ». Règles mises à jour (objectif = meilleur indice).
  - **Décor** :
    - Campus de l'EPFL : Rolex Learning Center (dalle blanche ondulée avec patios), bâtiments, logo EPFL.
    - Devant Lausanne, l'équipe Aether teste son prototype : un semi-rigide tracte en rond un petit catamaran portant la machine de contrôle. Le kite fait des 8, s'écrase, les bateaux s'arrêtent puis relancent l'aile (cycle de 40 s).
    - Montagnes : le Chablais rejoint les Dents du Midi et les Voirons, le haut Chablais relie le Môle aux Dents du Midi, le Jorat est prolongé. Ajout des Alpes vaudoises, du Muveran et des sommets valaisans au loin (Grand Combin).
    - Jet d'eau : plus haut, colonne à trois couches lumineuses, panache de gouttes poussé par le vent, halo de bruine et arc-en-ciel au soleil.
    - Dans la zone de tempête : un bateau pirate (voiles noires, pavillon à tête de mort ; abordage +5 s) et des requins qui tournent.
  - **Langues** : l'italien est ajouté partout (jeu, tutoriels, page Résultats, hypothèses du modèle).
  - **Jeu** :
    - Bouton Pause dans la barre d'outils (en plus de P et Échap).
    - Au départ, une bulle « Appuie sur la barre d'espace pour lancer le kite ! » reste affichée jusqu'à la sortie du kite.
    - La fenêtre de jeu prend toute la largeur et la hauteur visible de l'écran. Les marges de Streamlit sont réduites et le choix de langue Streamlit n'est plus que sur la page Résultats, le jeu ayant ses propres boutons.
  - **Corrections** : le drapeau suisse d'un vapeur CGN pouvait s'afficher en grand carré rouge près de la caméra.
- **Vérification** :
  - accueil ;
  - onglets du classement (équipes, semaine, expert, CO₂) ;
  - traversée débutant complète (bulle Espace, bouton Pause, arrivée, indice 146,392 t·s, 2 tentatives datées enregistrées) ;
  - vues EPFL, Valais, Jet d'eau et pirate en italien à 1366 × 768 ;
  - page Résultats en italien.
  - Aucune erreur JavaScript.
