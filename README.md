# Fluoxétine France — réseau solidaire

Une carte publique, en français, pour partager les réponses de pharmacies contactées par téléphone. Le site est volontairement simple : appeler, choisir une réponse, puis publier la confirmation sur GitHub.

## Comment l’utiliser

1. Rechercher une ville, un code postal, une pharmacie ou une adresse.
2. Ouvrir la fiche et appeler la pharmacie.
3. Cliquer sur **Partager la réponse**.
4. Choisir l’une des trois réponses : **oui, en quantité**, **oui, mais peu**, ou **non disponible**.
5. Continuer sur GitHub et cliquer sur **Submit new issue**.

La date et l’heure ne sont jamais saisies à la main. La page prépare la confirmation au moment de l’envoi et GitHub enregistre automatiquement la date et l’heure exactes de publication ; elles sont affichées selon l’heure de Paris.

Une même pharmacie peut recevoir plusieurs confirmations. Elles restent indépendantes et sont comptées dans la fiche. Plusieurs personnes qui appellent à des moments différents donnent ainsi un signal plus fiable qu’une seule réponse. La dernière confirmation reste la réponse principale affichée ; l’historique des autres confirmations reste consultable.

Les points signifient :

- vert soutenu : oui, en quantité ;
- vert clair : oui, mais peu ;
- vert intermédiaire : disponible, quantité non précisée (signalement transmis sans indication de quantité) ;
- rose pâle : non disponible ;
- gris clair : pas encore appelée sur cette carte.

Un point gris ne signifie pas « pas de stock ». Sans réponse au téléphone, ne pas choisir « non disponible ».

## Contributions et modération

La consultation est libre. Pour contribuer, il faut un compte GitHub gratuit : cela réduit les trolls et permet de fermer ou marquer comme invalide une confirmation douteuse. Le contributeur n’accède ni au code ni aux autres données du dépôt ; il envoie seulement une fiche publique préremplie.

Les seules informations demandées sont la pharmacie, la réponse et la date/heure automatiques de publication. Aucun nom de patient, ordonnance, traitement personnel ou commentaire libre n’est publié. Le stock peut changer : toujours rappeler la pharmacie avant de se déplacer et confirmer le dosage et la présentation.

Une pharmacie absente peut être proposée avec le bouton **Ajouter une pharmacie**. Elle doit être une pharmacie d’officine, pas une parapharmacie. Cette fonction est prévue pour l’élargissement progressif du répertoire à d’autres communes et régions.

## Données initiales

La première version reprend les **847 pharmacies parisiennes** de la liste de travail initiale et les **13 réponses finales favorables du 5 octobre 2026**. Le nombre de boîtes, le dosage et la présentation n’ont pas été consignés ; la carte ne les invente pas. Les autres réponses du journal privé ne sont pas publiées.

Le répertoire initial est un point de départ collaboratif : coordonnées, ouvertures et stocks doivent être reconfirmés par téléphone.

Les deux disponibilités transmises à Antony le 5 octobre 2026 figurent comme « Disponible · quantité non précisée » ; elles ne sont pas présentées comme des stocks abondants. L’élargissement national attend la vérification du nouveau flux FINESS quotidien ; l’ancien extrait gelé du 4 mai 2026 n’est plus chargé par la carte.

## Projet

Le dépôt public est hébergé sur GitHub Pages. Les réponses sont des issues GitHub publiques, validées par la page avant affichage. GitHub fournit automatiquement l’horodatage de publication.

- [FINESS — extraction officielle](https://www.data.gouv.fr/datasets/finess-extraction-du-fichier-des-etablissements)
- [Répertoire parisien initial](https://pharmaciesdefrance.org/departement/75-paris)
- [OpenStreetMap](https://www.openstreetmap.org/copyright) pour le fond de carte
- [Leaflet 1.9.4](https://leafletjs.com), inclus localement
