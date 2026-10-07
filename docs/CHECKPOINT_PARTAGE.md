# Checkpoint final — 7 octobre 2026

## A — Projet gratuit : terminé

Organisation joseluis (`rooyarjqmsvfruxdbkrh`), plan gratuit. Coût confirmé : 0 par mois. Projet dédié `fluoxetine-france`, référence `fwuieqdxzfrlghgrlenm`, région Paris `eu-west-3`. Ne pas recréer le projet ni l’application OAuth.

## B — Base et droits : terminé

19 917 identifiants connus ; 15 publications historiques importées avec leurs dates d’origine. RLS sur les tables, vue security_invoker, champs auteur et horodatage imposés côté serveur. API réelle : lecture publique 200 ; écritures anonymes, lecture user_id et modification du répertoire refusées. Les participants ne peuvent pas modifier ou supprimer les anciennes publications. Conseiller sécurité sans avertissement. Les limites de débit, propositions modérées et deux identités ont été vérifiées localement dans PostgreSQL.

## C — OAuth réel : terminé

Fournisseur GitHub activé. Site URL et redirection exacte : https://ortiz-luis.github.io/fluoxetine-france/ . Application OAuth existante conservée ; aucune recréation de Client ID ou de secret. Approbation donnée par le propriétaire. Après expiration d’un state, un nouveau flux PKCE a réussi : compte ortiz-luis affiché au retour. Autorisations : profil et courrier électronique en lecture seule, aucun accès repo. Aucune adresse électronique exposée dans les données publiques.

## D — Partage réel : terminé

Test synthétique hors du répertoire cartographique publié depuis une session GitHub réelle à 17:29:10.639914 UTC. Auteur vérifié côté serveur : github:63545750. Réessai même UUID : une seule publication. Lecture publique sans JWT depuis un client indépendant, puis nouvelle page sans session après déconnexion et rechargement. Deux modes de session testés ; pas deux comptes GitHub réels. Les tests locaux avaient vérifié deux participants simulés. Données synthétiques ensuite supprimées.

## E — Site public : terminé

PR #3 fusionnée : 620416be2d96d4f20601db9a5c7d8c211c0c83a2. Nettoyage : e0d7576a1d98bc5a7faf709997b2c06bf9e486cd, déploiement GitHub Pages réussi 37660281060.

URL : https://ortiz-luis.github.io/fluoxetine-france/

Parcours réel vérifié sur l’URL publique : fiche de Massy, choix quantité et téléphone, connexion, retour à la fiche et publication confirmée sans ticket GitHub. Toucher le point vert ouvre les trois réponses. Lecture sans compte et après rechargement vérifiée. Publication Massy affichée 7 octobre 2026 à 19:34, heure de publication : information communiquée précédemment par le propriétaire, aucun nouvel appel effectué par l’agent. Base : 19 917 identifiants et 16 publications (15 historiques + Massy).

Page /verification/ retirée, réponse publique 404 ; redirection temporaire supprimée, seule l’URL normale reste autorisée. Configuration publique contient uniquement une clé publiable. Aucune clé secrète dans les fichiers.

## F — Diffusion : terminé

Textes français pour forum, version courte et mode d’emploi dans docs/DIFFUSION.md. Aucun message envoyé sur Reddit ni autre forum. Prochaine action du propriétaire : partager le lien et le texte préparé.

## Portée des vérifications et entretien

Validation préalable locale : MapLibre et Leaflet, 1 440 × 1 000 et 390 × 844, jeu national complet, interaction des points, recherche, code postal, géolocalisation simulée et absence de débordement. Validation publique réelle : navigateur de bureau en mode Leaflet, OAuth GitHub, publication et persistance. Le parcours public n’a pas été retesté sur un téléphone physique.

Répertoire FINESS du 5 octobre 2026 : 19 917 fiches fusionnées, 19 404 positions, 513 fiches accessibles seulement par recherche. Certaines coordonnées ou certains téléphones sont incomplets ou approximatifs. Les contributions sont conservées en ligne ; le répertoire statique n’a pas de tâche quotidienne automatique activée. Entretien existant : scripts/build_directory.py. Un signalement devient « À reconfirmer » après 48 heures. Il n’existe aucun accès automatique aux stocks des pharmacies.
