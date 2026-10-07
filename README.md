# Fluoxétine — une carte pour s’entraider

[Ouvrir la carte publique](https://ortiz-luis.github.io/fluoxetine-france/).

Le partage direct est connecté au projet Supabase gratuit dédié. Les participants se connectent avec GitHub et publient depuis une fiche, sans ouvrir un ticket ni modifier le code. Voir [le checkpoint de validation](docs/CHECKPOINT_PARTAGE.md).

Une carte en français pour partager la disponibilité de la fluoxétine, après un appel ou une visite en pharmacie. La consultation est libre. Un compte GitHub gratuit suffit pour contribuer.

## Trouver et renseigner une pharmacie

Trois parcours conduisent aux mêmes fiches, déjà préparées :

- **Sur la carte** : zoomer près de chez soi, ou utiliser **Autour de moi**, puis toucher un point. Les groupes gris se séparent en zoomant.
- **Par code postal** : saisir les cinq chiffres sous la carte et choisir **Voir la zone**, puis toucher une pharmacie.
- **Dans la liste** : rechercher quelques mots du nom, la commune, le code postal ou l’adresse. La liste **Cette zone** suit la carte ; **Toutes** permet une recherche nationale. Seules quelques dizaines de fiches sont créées à la fois.

La fiche montre l’adresse, le téléphone et les signalements. Choisir **Oui, en quantité**, **Oui, mais peu** ou **Non disponible** publie directement depuis la fiche, après une connexion GitHub la première fois. Aucun ticket GitHub, nom de pharmacie, adresse ou horodatage ne sera à remplir.

L’origine de l’information peut être précisée, de façon facultative : **Par téléphone** ou **Sur place**. Sans réponse de la pharmacie, ne pas déclarer une indisponibilité.

## Horodatage, participants et historique

Les nouveaux signalements sont conservés séparément dans PostgreSQL/Supabase. La date et l’heure sont imposées par le serveur et affichées selon l’heure de Paris. Elles correspondent à la publication : publier immédiatement après l’appel ou la visite. Le nom public vient de l’identité GitHub vérifiée ; aucun document médical ni renseignement de patient n’est demandé.

La carte charge une synthèse par pharmacie, avec les nombres de publications et de participants distincts. L’historique est chargé lorsqu’une fiche est ouverte. Le dernier signalement s’affiche ; les anciens sont conservés. Plusieurs contributions du même compte ne deviennent pas plusieurs participants indépendants. Les 15 publications existantes sont importées avec leurs horodatages d’origine.

Après **48 heures**, un signalement passe à **À reconfirmer**, avec un point beige, et quitte le décompte des disponibilités récentes. Ce délai est une règle d’affichage, sans garantie de stock pendant 48 heures.

Vert soutenu = en quantité ; vert clair = peu de stock ; vert intermédiaire = disponible sans indication de quantité ; rose pâle = indisponible ; gris = aucune information partagée ; beige = à reconfirmer. Un point gris ne signifie jamais « indisponible ».

## Répertoire national et précision

L’extrait **FINESS — Structures du 5 octobre 2026** comprend **19 916 entités géographiques d’exercice de catégorie 620, classées actives (`etatObjet = A`)**. La page conserve aussi les **847 fiches parisiennes initiales**, en les rapprochant par leur identifiant FINESS ; une fiche initiale absente de l’extrait actif reste accessible avec un avertissement. Les deux fiches d’Antony sont conservées. Le total initial fusionné est **19 917 fiches**, sans dupliquer les pharmacies déjà présentes.

FINESS n’est pas une vérification sur place. Quatorze fiches actives portent aussi une date de fermeture : cet état contradictoire est indiqué. Le répertoire exclut les parapharmacies et n’affirme pas connaître les horaires actuels de chaque pharmacie.

Les champs GPS sont validés numériquement et selon leur région : les noms de colonnes FINESS ne sont pas toujours cohérents. Les adresses sans point sont complétées lorsque la BAN / IGN fournit un résultat suffisamment fiable dans la même commune ou le même code postal. Les résultats au niveau de la rue sont indiqués comme approximatifs ; un centre de commune n’est pas utilisé comme une position précise de pharmacie.

Pour certaines positions encore absentes, une coordonnée de l’ancien extrait FINESS du 4 mai 2026 est conservée seulement après rapprochement du même identifiant et de la même adresse. Ces positions sont explicitement signalées comme historiques, à vérifier. L’ancien fichier ne fournit pas la liste des établissements actifs du nouveau répertoire.

Les fiches sans position restent dans la recherche et peuvent recevoir une disponibilité ; elles ne sont pas éliminées ni placées à une coordonnée inventée. Certains téléphones manquent également. Le pied du plan distingue le nombre de fiches et celui des points. Le téléphone des Deux Gares à Massy a été complété avec sa fiche Acceslibre ; les contacts d’Antony déjà vérifiés sont conservés.

Les 13 disponibilités initiales et les deux signalements d’Antony restent liés à leurs identifiants. Aucun nouveau stock n’a été supposé pour Massy ou pour les nouvelles fiches nationales.

## Modération et nouvelles fiches

Les participants peuvent ajouter des informations après une connexion GitHub, sans invitation comme collaborateurs du dépôt. Les autorisations de base de données interdisent les modifications du répertoire, des dates, de l’identité et des anciennes réponses. Le responsable peut masquer un signalement ; l’historique visible et ses compteurs se mettent alors à jour.

**Une pharmacie manque ?** envoie une proposition depuis la page. Elle n’apparaît publiquement qu’après validation de l’officine, de l’adresse et du téléphone par le responsable. Le schéma et les droits sont décrits dans [l’activation du partage](docs/ACTIVATION_PARTAGE.md).

## Technologie et entretien

Le site reste composé de fichiers statiques, hébergés sur GitHub Pages, sans compilation de la page. Le plan utilise **MapLibre GL JS 5.23.0**, distribué localement avec sa licence BSD, et le fond **Positron d’OpenFreeMap** avec ses attributions. Les points gris sont des couches GeoJSON regroupées ; les disponibilités sont une couche séparée qui reste visible à distance. Les symboles de pharmacies du fond ne remplacent pas les points du répertoire. Leaflet 1.9.4 fournit aussi un fond raster de secours aux appareils sans WebGL. Ses points sont dessinés sur canvas et regroupés à distance ; le zoom, le code postal, la localisation et les contributions restent disponibles. Il sert également au placement d’une nouvelle proposition.

`scripts/build_directory.py` prépare `data/national.json` à partir de la dernière ressource FINESS **journalière**. Il conserve séparément les corrections sourcées et n’écrit pas l’extrait public si le traitement échoue ou si le nombre de fiches devient anormalement petit. Exécution :

```sh
python3 scripts/build_directory.py --geocode
```

Cette commande constitue l’outil d’entretien du répertoire statique. Les contributions sont séparées dans Supabase. Aucun nouveau traitement périodique du répertoire n’est activé par cette modification. Le SDK Supabase 2.117.3 est distribué localement sous sa licence MIT ; les dépendances sont épinglées dans le fichier de verrouillage.

La géolocalisation sert à centrer la carte et n’est pas ajoutée aux signalements. La disponibilité, l’identifiant GitHub et la date de publication sont publics. Ne publier aucun document médical ni information concernant un patient.

## Vérifications

`npm test` lance les tests du schéma dans PostgreSQL local et les parcours réels sur navigateur, avec le jeu national complet. Les contrôles comprennent : lecture sans compte, refus des écritures anonymes, deux identités OAuth simulées, horodatage serveur, champs protégés, historique et comptes distincts, modération, limite d’envoi, persistance pour un autre navigateur, réessai sans doublon après réponse réseau perdue, code postal et localisation, points tactiles, moteurs MapLibre et Leaflet, lisibilité en 1 440 × 1 000 et 390 × 844. Aucun signalement fictif n’est publié.

`TEST_CHROMIUM` peut désigner un exécutable Chromium. Les tests de navigateur simulent le fournisseur OAuth et l’API HTTP devant une vraie base PostgreSQL locale : ils ne remplacent pas la validation du projet Supabase et de la connexion GitHub en production.

## Sources

- [FINESS — Structures, flux quotidien et Licence Ouverte 2.0](https://www.data.gouv.fr/datasets/finess-structures-1)
- [Géocodage BAN / IGN](https://geoservices.ign.fr/documentation/services/services-geoplateforme/geocodage)
- [Acceslibre — Pharmacie des Deux Gares](https://acceslibre.beta.gouv.fr/app/91-massy/a/pharmacie/erp/pharmacie-des-deux-gares/)
- [MapLibre GL JS et regroupement des points](https://maplibre.org/maplibre-gl-js/docs/examples/create-and-style-clusters/)
- [OpenFreeMap](https://openfreemap.org/quick_start/), [OpenMapTiles](https://openmaptiles.org/) et [OpenStreetMap](https://www.openstreetmap.org/copyright)
- [Étude préalable d’Épione et de TheNextIs](docs/ETUDE_REFERENCES_2026-10-05.md)

Le code GPLv3 d’Épione n’est pas incorporé. TheNextIs a servi de référence d’interaction ; son application complète n’a pas été copiée.
