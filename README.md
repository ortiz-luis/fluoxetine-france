# Fluoxétine — une carte pour s’entraider

[Ouvrir la carte publique](https://ortiz-luis.github.io/fluoxetine-france/).

Une carte en français pour partager la disponibilité de la fluoxétine, après un appel ou une visite en pharmacie. La consultation est libre. Un compte GitHub gratuit suffit pour contribuer.

## Trouver et renseigner une pharmacie

Trois parcours conduisent aux mêmes fiches, déjà préparées :

- **Sur la carte** : zoomer près de chez soi, ou utiliser **Autour de moi**, puis toucher un point. Les groupes gris se séparent en zoomant.
- **Par code postal** : saisir les cinq chiffres sous la carte et choisir **Voir la zone**, puis toucher une pharmacie.
- **Dans la liste** : rechercher quelques mots du nom, la commune, le code postal ou l’adresse. La liste **Cette zone** suit la carte ; **Toutes** permet une recherche nationale. Seules quelques dizaines de fiches sont créées à la fois.

La fiche montre l’adresse, le téléphone quand il est disponible, la dernière disponibilité et son historique. Choisir **Oui, en quantité**, **Oui, mais peu** ou **Non disponible** ouvre un signalement GitHub entièrement prérempli, en français et sans bloc de code à manipuler. Il reste à confirmer sa publication avec **Create** ou **Submit new issue**. Aucun nom de pharmacie, adresse ou horodatage n’est à recopier.

L’origine de l’information peut être précisée, de façon facultative : **Par téléphone** ou **Sur place**. Sans réponse de la pharmacie, ne pas déclarer une indisponibilité.

Le site lit les contributions publiques GitHub et se réactualise. Le bouton **Actualiser** permet aussi de les relire après publication. L’envoi ouvre une page GitHub : choisir un bouton sur la carte ne suffit pas encore à publier le signalement. Les limitations de l’API GitHub peuvent temporairement interrompre l’actualisation ; les derniers signalements chargés restent visibles.

## Horodatage, participants et historique

Les nouveaux signalements contiennent uniquement des champs lisibles et un lien vers la fiche. Les anciennes publications au format structuré restent compatibles. Une aide persistante explique le dernier clic de confirmation et le retour à la carte.

La date et l’heure affichées viennent de `created_at`, fourni par GitHub lors de la publication. Elles sont affichées selon l’heure de Paris. Une éventuelle date ajoutée à la main au contenu du signalement est ignorée. Publier immédiatement après l’appel ou la visite : l’heure enregistrée est celle de la publication, pas une heure de contact que le système pourrait deviner.

L’identifiant public GitHub de l’auteur est affiché. Plusieurs participants peuvent renseigner la même pharmacie. Le dernier signalement est principal, les précédents restent consultables. Les nombres de **signalements** et de **comptes participants distincts** sont séparés ; trois publications d’une personne ne deviennent pas trois personnes indépendantes.

Après **48 heures**, une information passe à **À reconfirmer**, avec un point beige, et quitte le décompte des disponibilités récentes. Elle reste dans l’historique. Ce délai est une règle d’affichage, pas une garantie de stock pendant 48 heures.

Les couleurs : vert soutenu = en quantité ; vert clair = peu de stock ; vert intermédiaire = disponible sans indication de quantité ; rose pâle = indisponible ; gris = aucune information partagée ; beige = à reconfirmer. Un point gris ne signifie jamais « indisponible ».

## Répertoire national et précision

L’extrait **FINESS — Structures du 5 octobre 2026** comprend **19 916 entités géographiques d’exercice de catégorie 620, classées actives (`etatObjet = A`)**. La page conserve aussi les **847 fiches parisiennes initiales**, en les rapprochant par leur identifiant FINESS ; une fiche initiale absente de l’extrait actif reste accessible avec un avertissement. Les deux fiches d’Antony sont conservées. Le total initial fusionné est **19 917 fiches**, sans dupliquer les pharmacies déjà présentes.

FINESS n’est pas une vérification sur place. Quatorze fiches actives portent aussi une date de fermeture : cet état contradictoire est indiqué. Le répertoire exclut les parapharmacies et n’affirme pas connaître les horaires actuels de chaque pharmacie.

Les champs GPS sont validés numériquement et selon leur région : les noms de colonnes FINESS ne sont pas toujours cohérents. Les adresses sans point sont complétées lorsque la BAN / IGN fournit un résultat suffisamment fiable dans la même commune ou le même code postal. Les résultats au niveau de la rue sont indiqués comme approximatifs ; un centre de commune n’est pas utilisé comme une position précise de pharmacie.

Pour certaines positions encore absentes, une coordonnée de l’ancien extrait FINESS du 4 mai 2026 est conservée seulement après rapprochement du même identifiant et de la même adresse. Ces positions sont explicitement signalées comme historiques, à vérifier. L’ancien fichier ne fournit pas la liste des établissements actifs du nouveau répertoire.

Les fiches sans position restent dans la recherche et peuvent recevoir une disponibilité ; elles ne sont pas éliminées ni placées à une coordonnée inventée. Certains téléphones manquent également. Le pied du plan distingue le nombre de fiches et celui des points. Le téléphone des Deux Gares à Massy a été complété avec sa fiche Acceslibre ; les contacts d’Antony déjà vérifiés sont conservés.

Les 13 disponibilités initiales et les deux signalements d’Antony restent liés à leurs identifiants. Aucun nouveau stock n’a été supposé pour Massy ou pour les nouvelles fiches nationales.

## Modération et nouvelles fiches

Les participants publient des signalements ; cette possibilité ne leur donne aucun droit de modification du code ou du répertoire officiel. Aucun contributeur n’est invité comme collaborateur du dépôt pour participer. La lecture et les signalements ne donnent pas le droit de pousser du code ; une proposition de changement ne se publie pas automatiquement. Le responsable peut fermer un signalement ou lui ajouter un label `invalide`, `invalid`, `spam` ou `doublon` pour l’exclure de la carte.

Si une pharmacie manque vraiment, le bouton **Une pharmacie manque ?** prépare une proposition distincte. Le responsable vérifie qu’il s’agit d’une officine, son adresse et son téléphone, puis ajoute le label **pharmacie-validée**. Le point apparaît alors sur la carte et peut être renseigné comme les autres. Les propositions sans ce label n’apparaissent pas. Fermer la proposition retire la fiche communautaire de l’affichage. Les anciens ajouts en texte libre doivent être vérifiés et incorporés au répertoire ou convertis au nouveau format.

## Technologie et entretien

Le site reste composé de fichiers statiques, hébergés sur GitHub Pages, sans compilation de la page. Le plan utilise **MapLibre GL JS 5.23.0**, distribué localement avec sa licence BSD, et le fond **Positron d’OpenFreeMap** avec ses attributions. Les points gris sont des couches GeoJSON regroupées ; les disponibilités sont une couche séparée qui reste visible à distance. Les symboles de pharmacies du fond ne remplacent pas les points du répertoire. Leaflet 1.9.4 fournit aussi un fond raster de secours aux appareils sans WebGL. Ses points sont dessinés sur canvas et regroupés à distance ; le zoom, le code postal, la localisation et les contributions restent disponibles. Il sert également au placement d’une nouvelle proposition.

`scripts/build_directory.py` prépare `data/national.json` à partir de la dernière ressource FINESS **journalière**. Il conserve séparément les corrections sourcées et n’écrit pas l’extrait public si le traitement échoue ou si le nombre de fiches devient anormalement petit. Exécution :

```sh
python3 scripts/build_directory.py --geocode
```

Cette commande constitue l’outil d’entretien ; aucun serveur, abonnement ou service de base de données n’est nécessaire pour la version actuelle. Aucun nouveau traitement périodique n’est activé par cette modification.

La géolocalisation sert à centrer la carte et n’est pas ajoutée aux signalements. La disponibilité, l’identifiant GitHub et la date de publication sont publics. Ne publier aucun document médical ni information concernant un patient.

## Vérifications

`tests/check-contribution.cjs` vérifie les formats lisibles, l’horodatage serveur et la modération. `tests/check-fallback.cjs` vérifie les parcours réels sans WebGL en tailles ordinateur et téléphone. `tests/check-national.cjs` contrôle l’intégrité et la fusion du jeu réel, le point de Massy, le code postal de Strasbourg, la géolocalisation, les trois réponses préremplies, les dates automatiques, l’auteur et les comptes distincts, les contradictions successives, la persistance après rechargement et la limite de fiches HTML en tailles ordinateur et téléphone. Les contributions du test sont simulées : aucun signalement fictif n’est publié. Le test utilise Playwright et un navigateur Chromium, avec `TEST_CHROMIUM` pour fournir son exécutable.

## Sources

- [FINESS — Structures, flux quotidien et Licence Ouverte 2.0](https://www.data.gouv.fr/datasets/finess-structures-1)
- [Géocodage BAN / IGN](https://geoservices.ign.fr/documentation/services/services-geoplateforme/geocodage)
- [Acceslibre — Pharmacie des Deux Gares](https://acceslibre.beta.gouv.fr/app/91-massy/a/pharmacie/erp/pharmacie-des-deux-gares/)
- [MapLibre GL JS et regroupement des points](https://maplibre.org/maplibre-gl-js/docs/examples/create-and-style-clusters/)
- [OpenFreeMap](https://openfreemap.org/quick_start/), [OpenMapTiles](https://openmaptiles.org/) et [OpenStreetMap](https://www.openstreetmap.org/copyright)
- [Étude préalable d’Épione et de TheNextIs](docs/ETUDE_REFERENCES_2026-10-05.md)

Le code GPLv3 d’Épione n’est pas incorporé. TheNextIs a servi de référence d’interaction ; son application complète n’a pas été copiée.
