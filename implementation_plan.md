# Roadmap : Milky Way Explorer (v2.1 -> v3.0)

Ce document présente la stratégie de développement et de déploiement des nouvelles fonctionnalités du simulateur, organisées en mises à jour thématiques pour assurer une progression stable sans briser le cœur performant du système existant.

## User Review Required
> [!IMPORTANT]
> Lisez bien les propositions de jalons (Milestones) et signalez-moi quelle mise à jour vous souhaitez attaquer en premier !

---

## 🛠️ Phase 1 : Expansion du Vaisseau (v2.1)
*Focus : Finalisation de l'architecture intérieure et du rôle du vaisseau.*

### 1. Salle d'Ingénierie (Niveau Inférieur)
* **Warp Core** : Sphère énergétique centrale dont le matériau s'anime et réagit en temps réel à l'état du vaisseau (`ship.speed`, `ship.boostActive`, `ship.boostHeat`).
  * *Bleu* = En attente / Vitesse de croisière solaire
  * *Violet Pulsant* = FTL / Warp activé
  * *Orange* = Boost propulseur actif
  * *Rouge Clignotant* = Surchauffe
* **Décoration** : Tuyauterie industrielle, générateurs, néons techniques alignés sur les murs.

### 2. Quartiers de l'Équipage (Niveau Supérieur ou Inférieur)
* Ambiance lumineuse chaleureuse avec `PointLight` orangées/jaunes.
* Module de couchette, table centrale avec un mini-hologramme statique décoratif.
* Fenêtre latérale "hublot" pour observer l'espace en se reposant.

---

## 🚀 Phase 2 : Physique Nouvelle Génération (v2.2)
*Focus : Refonte du pilotage et du réalisme orbital.*

### 1. Modèle de Vol Newtonien (Elite Dangerous Style)
* **Système Dual-Mode** : Ajout d'une touche (ex: `H`) pour basculer entre *Mode Arcade* (vol direct cinématique actuel) et *Mode Flight Assist Off* (Inertie complète, dérive vectorielle).
* **Inertie Vectorielle** : En mode réaliste, conserver l'élan sur les axes de strafe et la vitesse frontale, nécessitant de pivoter et pousser dans la direction opposée pour freiner.

### 2. Simulation Orbitale Avancée
* Remplacement des orbites circulaires parfaites par des orbites elliptiques (utilisation de l'excentricité astronomique).
* Comètes avec trainées de particules (`THREE.Points` ou tubes avec shader) ayant des orbites extrêmement allongées et lentes.

### 3. Modèle Météo Spatiale
* **Éruptions solaires** : Événements périodiques autour de l'étoile centrale éjectant des flux de particules.

---

## 🌌 Phase 3 : Beauté Extrême et Connexion Réelle (v2.3)
*Focus : Enrichissement galactique et Shaders.*

### 1. Overhaul Graphique (Ultra Mode)
* Bouton/Option pour débrider le nombre de particules stellaires de `20 000` à `100 000+`.
* Développement d'un "Custom Shader" (`ShaderMaterial` GLSL) pour la surface du soleil et les atmosphères planétaires au lieu du classique `MeshStandardMaterial`.

### 2. Nouvelles POIs et Dynamisme Galactique
* Intégration de dizaines de nouvelles POI réelles éparpillées sur l'intégralité du bras galactique pour encourager les longs voyages.
* Flottes de sondes : Minuscules entités orbitant lentement autour d'objets fabriqués.

### 3. API NASA (Couche Discrète Intelligente)
* `fetch` occasionnel sur l'API APOD ou Exoplanet de la NASA pour tirer des fiches factuelles injectées dans l'overlay HTML quand on verrouille un système connu.

---

## 💡 Idées Additionnelles (Suggestions Gemini)

Dans la continuité de vos excellentes propositions, voici quelques idées "Sci-Fi" supplémentaires qui s'inscrivent parfaitement dans l'esprit du simulateur :

> [!TIP]
> 1. **Effet de Rentrée Atmosphérique / Friction** : Si vous rentrez trop vite dans la zone d'une planète, l'écran du cockpit se couvre temporairement d'un shader de plasma rougeoyotant (friction thermique).
> 2. **Alertes Sonores et Visuelles Matérielles** : En cas de surchauffe moteur, on baisse brusquement l'intensité de la lumière blanche du vaisseau pour faire clignoter des gyrophares rouges intégrés aux murs, accompagnés d'une sirène étouffée.
> 3. **Stations Spatiales Mégastructurales** : Placer occasionnellement d'immenses structures spatiales orbitant autour des planètes que l'on peut frôler en vaisseau (Rings géants, docks commerciaux luminescents).
> 4. **Tunnel Warp Relativiste** : Quand vous lancez le FTL vers un POI éloigné, remplacer le simple flou de mouvement par l'apparition d'un cylindre déformé "effet trou de ver" (Warp Tunnel shader) qui enveloppe la verrière.

---

## Open Questions

Par quelle partie de ce plan massif voulez-vous commencer ?
Généralement, clôturer l'intérieur du vaisseau (**Phase 1**) est le plus logique techniquement avant de toucher à la physique. Qu'en dites-vous ?
