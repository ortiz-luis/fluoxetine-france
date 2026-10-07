# Activation des contributions depuis la carte

La branche `partage-direct` prépare le remplacement du formulaire GitHub par un envoi depuis la fiche. Le site public reste sur l’ancienne version jusqu’à la validation complète du service. Le fichier `assets/config.js` est volontairement vide : aucun stockage distant de ce projet n’a encore été créé.

## Parcours destiné aux participants

1. Trouver la pharmacie sur la carte, par code postal ou par son nom.
2. Toucher **Oui, en quantité**, **Oui, mais peu** ou **Non disponible**.
3. La première fois seulement, se connecter avec GitHub. La réponse choisie est conservée pendant la connexion et publiée au retour. Aucun formulaire de ticket n’est ouvert.
4. La confirmation **Information publiée** apparaît après la réponse du serveur. Le point, le nom public et l’horodatage sont alors mis à jour pour tous.

Un signalement est une nouvelle publication : il ne remplace pas les anciennes réponses dans la base. Les confirmations multiples sont comptées par identifiant GitHub stable, distinct du pseudonyme affiché. L’heure enregistrée est celle de la publication, affichée à l’heure de Paris ; publier dès l’appel ou la visite terminés. Une personne ne peut pas dater manuellement son signalement, modifier un signalement antérieur ou changer le répertoire officiel.

## Service à connecter

Créer un projet Supabase **distinct**, dans l’organisation choisie par le propriétaire. Le seul projet existant identifié appartient à une autre application ; il n’est pas réutilisé. Vérifier le coût avant la création et conserver le plan gratuit si c’est le choix du propriétaire. Ne souscrire aucun abonnement payant automatiquement.

Exécuter dans ce projet, dans cet ordre :

- `database/001_partage.sql` : tables, contraintes, RLS, droits limités et identité vérifiée.
- `database/002_repertoire_initial.sql` : les 19 917 identifiants connus, Corse incluse.
- `database/seed_reports.sql` : les 15 publications antérieures, avec leurs vrais horodatages. L’import administratif désactive temporairement le déclencheur dans une transaction puis le réactive.

Le schéma est destiné à un projet neuf. Ce n’est pas une migration à appliquer à une base déjà utilisée. Le script `scripts/prepare_backend.cjs` régénère les deux fichiers de données depuis les sources locales.

Obtenir l’URL du projet et sa **clé publiable**. Les enregistrer dans `assets/config.js`. Aucune clé secrète, `service_role` ou jeton GitHub ne doit être ajouté aux fichiers publics.

## Connexion GitHub

Créer une application OAuth GitHub dont la page d’accueil est :

`https://ortiz-luis.github.io/fluoxetine-france/`

Son URL de rappel est celle fournie par le nouveau projet :

`https://<identifiant-du-projet>.supabase.co/auth/v1/callback`

Activer GitHub dans **Authentication → Sign In / Providers**, avec les identifiants de cette application. Le secret OAuth doit rester uniquement dans la configuration serveur Supabase. La connexion demande un profil GitHub, aucun droit `repo` ni permission d’écriture dans le dépôt.

Configurer **Site URL** et la liste des redirections autorisées avec l’URL exacte de GitHub Pages ci-dessus. La sélection de pharmacie et l’action en attente sont conservées dans l’onglet ; aucun joker de redirection n’est nécessaire. Ne pas activer les inscriptions anonymes.

Documentation officielle : [Connexion GitHub](https://supabase.com/docs/guides/auth/social-login/auth-github), [redirections](https://supabase.com/docs/guides/auth/redirect-urls), [protection de l’API](https://supabase.com/docs/guides/api/securing-your-api).

## Modération

Les signalements visibles sont lisibles sans compte. Le responsable peut masquer une publication avec `stock_reports.hidden = true`. Les participants ne peuvent pas éditer ce champ. Le nom public GitHub vient de l’identité OAuth ; l’identifiant interne Auth et l’adresse électronique ne sont pas exposés dans les lectures publiques.

Les propositions de pharmacies restent `pending`, visibles uniquement par leur auteur et le responsable. Après vérification de l’officine, de l’adresse et du téléphone, le responsable peut passer `pharmacy_candidates.moderation` à `approved`. Un déclencheur inscrit alors la fiche dans le répertoire autorisé. Passer une fiche approuvée à `rejected` retire son point et masque ses signalements. Aucun participant ne peut s’auto-approuver.

Une limite serveur de 40 signalements par 5 minutes et par compte, et de 5 propositions par jour, freine les envois automatiques. Les tentatives simultanées d’un compte sont sérialisées. Une réponse perdue après enregistrement peut être réessayée avec le même identifiant ; le client vérifie la publication déjà enregistrée et ne crée pas de doublon.

## Validation avant publication

Les tests locaux utilisent le SDK Supabase réel et PostgreSQL via PGlite. Ils vérifient les droits, l’identité, l’horodatage serveur, les répétitions et la modération. Les tests de navigateur utilisent le répertoire national réel, deux comptes simulés et une lecture publique indépendante. Le fournisseur OAuth y est simulé : la connexion réelle en production reste à vérifier.

Après connexion du projet : lancer les conseillers de sécurité Supabase, vérifier la lecture anonyme et le refus d’écriture anonyme, puis essayer le parcours OAuth réel sur téléphone et ordinateur. Vérifier qu’une contribution de test apparaît depuis un autre navigateur et reste présente après rechargement ; la retirer ensuite. Confirmer les droits restreints et la précision de l’heure du serveur. Publier sur `main` seulement après ces validations, attendre GitHub Pages et refaire le parcours sur l’URL publique avant d’annoncer la version finale.
