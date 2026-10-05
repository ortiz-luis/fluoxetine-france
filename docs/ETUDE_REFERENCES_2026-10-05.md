# Fluoxétine France — étude de réutilisation

Étude réalisée le 5 octobre 2026. Objectif : une carte publique simple, en français, permettant de trouver une pharmacie, de l’appeler et de partager une réponse datée. L’élargissement national et le changement de moteur cartographique restent suspendus jusqu’à la validation d’une petite preuve de fonctionnement.

## Décision proposée

Conserver GitHub Pages et les confirmations déjà enregistrées. Étudier une reprise ciblée de l’interface cartographique de TheNextIs, avec MapLibre et le fond Positron d’OpenFreeMap. Utiliser Épione comme référence concrète pour l’import et les fiches FINESS, sans reprendre son application Android ni son système de mises à jour complet.

La carte et le répertoire peuvent rester des fichiers statiques. Les confirmations restent séparées et liées au numéro FINESS de la pharmacie. Pour le fonctionnement actuellement retenu, les contributions sont des issues GitHub : aucune nouvelle base de données n’est nécessaire à ce stade.

## Ce que les références permettent réellement

| Référence | Élément utile | Ajustement nécessaire |
| --- | --- | --- |
| TheNextIs, licence MIT | Carte MapLibre/OpenFreeMap, recherche, fiche sélectionnée, panneau adapté au téléphone, lien partageable | Remplacer les résultats OpenStreetMap par le répertoire FINESS ; utiliser une couche GeoJSON regroupée plutôt qu’un élément HTML par pharmacie |
| Épione, licence GPLv3 | Import du nouveau FINESS, identifiants stables, normalisation des coordonnées, recherche nom/commune/code postal et fiches | Son importeur préfère la ressource mensuelle ; son filtre de fermeture et ses coordonnées doivent être contrôlés avant reprise |
| OpenFreeMap | Fond vectoriel hébergé, sans clé API ni inscription ; styles dont Positron, Liberty et Dark | Garder les attributions ; masquer les symboles de pharmacies du fond qui ne correspondent pas aux points sélectionnables de notre répertoire |
| FINESS — Structures | Source officielle quotidienne des établissements | Choisir la ressource journalière, le niveau EGE, la catégorie 620 et l’état administratif actif ; gérer les informations manquantes et contradictoires |

TheNextIs est bien publiable depuis `public/` sans compilation. Son fichier principal compte toutefois 1 968 lignes et comprend des fonctions hors périmètre : restaurants, cuisines, horaires, avis Mangrove, appels Overpass et statistiques de fréquentation. Copier l’ensemble augmenterait le travail d’adaptation. Son code actuel crée un marqueur HTML par résultat et ne fournit pas le regroupement national recherché.

MapLibre propose déjà une source GeoJSON avec `cluster: true`, des couches de cercles et l’ouverture d’un point ou d’un groupe. C’est la partie à réutiliser pour le répertoire national. Les confirmations positives peuvent rester dans une couche distincte afin qu’elles demeurent visibles quand les points gris sont regroupés.

## Épione : migration confirmée, fréquence différente

Le code étudié inclut bien `scripts/make_release.py`, qui lit le nouveau jeu `finess-structures-1`. Il ne repose plus uniquement sur l’ancien CSV gelé.

En revanche, `find_finess_structures_url()` privilégie explicitement le dernier fichier **mensuel**, avec le journalier comme solution de repli. Le manifeste de la base étudiée est daté du **2 octobre 2026** et contient **45 884 établissements sanitaires**, dont **19 908 pharmacies d’officine**. Cela ne constitue pas une garantie de mise à jour quotidienne.

L’importeur écarte les établissements ayant une `dateFermeture`, mais ne filtre pas directement `etatObjet == "A"`. Il détecte aussi les coordonnées métropolitaines par plages numériques, car les noms des champs ne suffisent pas toujours. Ces deux points méritent une adaptation, pas une copie à l’identique.

## Contrôle du fichier officiel du 5 octobre

Le fichier `finess-structures-journalier-20261005.json.gz` a été téléchargé et analysé intégralement. Sa génération est horodatée `2026-10-05T02:07:14.534773337Z`.

| Contrôle | Résultat |
| --- | ---: |
| Entités géographiques de catégorie 620, tous états | 24 026 |
| Catégorie 620 et état officiel `A` — Actif | 19 916 |
| Identifiants FINESS distincts dans ce dernier ensemble | 19 916 |
| État `I` — Inactif | 4 110 |
| Téléphone absent dans les contacts de la source, parmi les `A` | 2 766 |
| Objet de coordonnées absent dans la première adresse, parmi les `A` | 3 313 |
| Fiches métropolitaines dont les champs directionLatitude/Longitude ne donnent pas directement le couple WGS84 détecté | 225 |
| Fiches initiales parisiennes encore dans l’ensemble `A` | 846 sur 847 |
| Pharmacies des 13 confirmations initiales présentes dans l’ensemble `A` | 13 sur 13 |

Le filtre fondé seulement sur l’absence de date de fermeture donne **19 904** fiches : il conserve **2 inactives** et écarte **14 classées actives** malgré une date de fermeture passée. Ces contradictions doivent être signalées et contrôlées avant publication du nouveau répertoire. Le chiffre 19 916 décrit le classement de la source, pas une vérification indépendante de chaque officine.

Les coordonnées demandent également un contrôle explicite. Exemple : une fiche contient X=`3.306412`, Y=`49.8578`, directionLatitude=`6973267.67` et directionLongitude=`722050.31`. Le couple GPS est ici dans X/Y, contrairement à ce que suggèrent les noms. Une conversion ou une validation géographique doit tenir compte de la commune et de l’outre-mer. Un point au centre d’une commune ne doit pas être présenté comme une adresse précise.

La source brute représente **50 436 455 octets compressés**, soit **751 830 144 octets décompressés**. Elle doit être traitée avant publication ; le navigateur ne doit charger que l’extrait compact nécessaire. Une pharmacie sans téléphone ou sans position reste dans le répertoire, avec une indication claire du champ manquant.

SHA-256 du fichier analysé : `933f0919fc5d3408376c3df4201f88a540a001454ea0dd204d3367e97ab2396a`.

## Architecture minimale à vérifier

1. Un traitement récupère la dernière ressource **journalière** de FINESS et prépare un fichier compact : identifiant, nom, adresse, commune, code postal, téléphone et position validée. Il conserve les corrections vérifiées séparément, avec leur source.
2. La page statique affiche les pharmacies sur une couche GeoJSON regroupée. La liste ne crée que quelques dizaines de fiches correspondant à la recherche ou à la zone visible.
3. Une sélection ouvre une seule fiche, avec le téléphone bien lisible et les trois réponses communautaires actuelles. Les noms du fond de carte ne doivent pas donner l’illusion d’une fiche inaccessible.
4. Chaque confirmation est conservée séparément, avec la pharmacie, la réponse, l’auteur et l’horodatage automatique de publication. L’historique reste accessible ; des appels répétés par la même personne ne sont pas présentés comme plusieurs personnes indépendantes.

Il faudra conserver l’extrait précédent si une mise à jour échoue, publier la date réelle du répertoire et préserver l’historique des confirmations lorsqu’une pharmacie ferme ou change de fiche. Le traitement périodique pourra être un simple workflow GitHub ; aucun workflow supplémentaire n’a été activé dans cette étude.

## Validation avant adoption

La version nationale ne peut pas encore être annoncée comme visuellement validée. La navigation vers le site public de TheNextIs a atteint le délai d’attente dans le navigateur de cette session. Cela ne prouve pas que le site est inaccessible aux autres utilisateurs. Son code et sa licence ont pu être lus directement.

La preuve de fonctionnement à réaliser dans une copie isolée doit charger le nouvel extrait national et vérifier :

- une recherche par nom, ville et code postal ;
- les points et groupes sélectionnables, y compris les deux pharmacies d’Antony et la zone de Massy ;
- une fiche avec un lien téléphonique et un bouton de confirmation faciles à toucher ;
- la lisibilité sur ordinateur et sur un téléphone Android, puis la fluidité avec le jeu national complet ;
- l’absence de milliers de marqueurs ou de fiches HTML simultanés ;
- la visibilité des confirmations vertes lors d’un zoom éloigné ;
- la gestion d’une source indisponible, d’un téléphone absent et d’une position non vérifiée.

Les vérifications déjà réalisées sur notre carte actuelle, en tailles d’écran 1 440 × 1 000 et 390 × 844, confirment les **849 fiches de départ**, les **15 disponibilités**, les deux téléphones d’Antony, les trois réponses du formulaire et l’absence de saisie manuelle de date. Le déploiement public et l’affichage des deux nouvelles disponibilités ont été vérifiés. Ces tests concernent notre carte actuelle, pas une migration vers TheNextIs ni la performance d’un téléphone physique.

## Licences et sources

Le code MIT repris doit conserver son avis de licence. Le code GPLv3 d’Épione ne doit pas être incorporé sous une autre licence sans respecter ses conditions. Les données FINESS sont sous Licence Ouverte 2.0 ; la licence des données et celle du logiciel doivent être distinguées. Cette étude ne copie pas de code d’Épione ou de TheNextIs dans la carte publique.

- [Épione sur F-Droid](https://f-droid.org/fr/packages/com.epione.app/)
- [Code Épione](https://codeberg.org/kapoue/Epione), commit étudié `7fbb7556f7c655e2471cedfe3caa4cb04abf7da5`
- [TheNextIs](https://github.com/homtec/thenextis), commit étudié `e02ffcf1e7a88a8d36f313508a13095a979d8ce9`
- [Licence MIT de TheNextIs](https://github.com/homtec/thenextis/blob/master/LICENSE)
- [OpenFreeMap](https://openfreemap.org/) et [guide d’intégration](https://openfreemap.org/quick_start/)
- [Exemple officiel MapLibre : regroupement de points](https://maplibre.org/maplibre-gl-js/docs/examples/create-and-style-clusters/)
- [FINESS — Structures, publication quotidienne](https://www.data.gouv.fr/datasets/finess-structures-1)
- [Schéma officiel des structures](https://github.com/ansforge/finess/blob/main/flux/out/data.gouv/structure/schema/schema-structures-v1.json)
- [États administratifs officiels : A/I](https://smt.esante.gouv.fr/fhir/CodeSystem/tre-r386-macro-etat-objet-administratif)
- [Ancien FINESS, gel confirmé au 4 mai 2026](https://www.data.gouv.fr/datasets/finess-extraction-du-fichier-des-etablissements)
