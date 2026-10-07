# État du déploiement — 7 octobre 2026

Organisation : joseluis (`rooyarjqmsvfruxdbkrh`), plan gratuit.
Coût confirmé : 0 par mois.
Projet dédié créé : `fluoxetine-france`, région Paris (`eu-west-3`).
Référence : `fwuieqdxzfrlghgrlenm`.
URL publique API : https://fwuieqdxzfrlghgrlenm.supabase.co

Ne pas recréer le projet. Le site public reste sur main ; la branche partage-direct prépare les contributions directes.

Phase B achevée : schéma et RLS appliqués ; 19 917 identifiants et 15 publications historiques importés. API publique testée avec la clé publiable : lecture 200 ; écriture anonyme, modification du répertoire et lecture user_id refusées 401. Champs auteur et date protégés ; UPDATE et DELETE non accordés aux participants. Déclencheur de contrôle actif. Conseiller sécurité : aucun avertissement. Politiques de lecture des candidatures regroupées par rôle.

Premier point restant : phase C, vérifier les redirections et la connexion OAuth GitHub réelle (fournisseur désormais activé). Puis D : contribution réelle partagée entre sessions ; E : publication et vérification publique ; F : supports de diffusion. Aucun signalement de test n'a été enregistré.

Checkpoint précédent de C : GitHub était désactivé ; il est désormais activé. Les connecteurs disponibles ne gèrent pas les applications OAuth GitHub ni les paramètres des fournisseurs Supabase. Intervention du propriétaire nécessaire pour créer l'application OAuth et saisir son secret dans Supabase uniquement.

Application OAuth : nom « Fluoxétine — entraide en pharmacies » ; accueil https://ortiz-luis.github.io/fluoxetine-france/ ; rappel https://fwuieqdxzfrlghgrlenm.supabase.co/auth/v1/callback . Configurer la Site URL et la redirection autorisée sur l'URL exacte GitHub Pages. Ne pas partager le secret dans le chat ou dans GitHub.

Reprise de C : GitHub activé dans l'API Auth, inscriptions anonymes désactivées. La requête authorize renvoie 302 vers GitHub avec un Client ID et le rappel exact https://fwuieqdxzfrlghgrlenm.supabase.co/auth/v1/callback . Aucun compte GitHub ni session encore enregistré : la connexion de production reste à vérifier.

Blocage navigateur : la connexion au tableau de bord Supabase via GitHub a abouti à une page GitHub « Server Error », erreur 500. Il s'agit de l'application OAuth du tableau de bord Supabase, pas d'une preuve d'échec de l'application du projet. Site URL et liste de redirections non vérifiées. Ne pas annoncer C, D ou E comme achevées. Aucun faux signalement créé. Le site public et la configuration vide restent inchangés.

Nouvelle reprise : les écritures GitHub fonctionnent de nouveau. Le checkpoint précédent a été sauvegardé dans partage-direct, commit 047ba88f13c6b435ac00534ce6a923692c38b661. Session du tableau de bord Supabase ouverte et configuration des URL vérifiée visuellement. URL supplémentaire temporaire /verification/ autorisée pour tester OAuth avant le remplacement du site.

Page de vérification isolée ajoutée sur main : commit 32801d55551ba8b3c8661d5f674b2190ad516b98. Le site principal reste inchangé. Identifiant synthétique du test : community-a3499bf2-4a2b-4981-87d4-c44fed7d8879, hors du répertoire cartographique. Supprimer ses données et la page après vérification. La page réutilise les blobs SDK et community.js préparés, pas une implémentation différente. C réelle et D restent à vérifier.

C en attente d'approbation finale OAuth : /verification/ est publié (GitHub Pages succès). Le bouton de connexion ouvre l'autorisation de l'application « Fluoxétine — entraide en pharmacies », Client ID Ov23liX5bNRfmYnAFbDI. Le compte ortiz-luis est identifié. Accès demandé : profil et adresses électroniques en lecture seule ; aucune permission repo. L'approbation doit être donnée par le propriétaire. Après approbation, vérifier le retour /verification/, la session et l'identité côté serveur ; publier le test synthétique puis vérifier sa lecture depuis un navigateur anonyme indépendant. C et D non achevées.

C achevée : nouveau flux PKCE après expiration du state ; retour réussi /verification/ et compte GitHub ortiz-luis affiché. D achevée : publication réelle du test 36320dbd-ea69-42a4-84b0-7fdee52dc405 à 2026-10-07T17:29:10.639914Z ; identité vérifiée github:63545750. Réessai même UUID : toujours une seule publication. Lecture publique via clé publiable sans JWT, puis nouvelle session de navigateur après déconnexion et rechargement. Deux modes de session testés, pas deux comptes GitHub réels. E en cours : connecter la configuration publique et publier le site principal, puis vérifier le parcours de Massy sur la page publique.

E vérifiée sur l'URL publique après fusion PR #3 (620416be2d96d4f20601db9a5c7d8c211c0c83a2). Parcours réel : fiche Massy, choix quantité et téléphone, connexion GitHub, retour automatique et publication confirmée. Information fournie précédemment par le propriétaire, pas un nouveau coup de téléphone effectué par l'agent. Affichage 7 octobre 2026 19:34 (heure de publication). Toucher le point vert ouvre directement les trois options ; aucun ticket GitHub. Le répertoire reste 19 917 fiches. Test synthétique supprimé ; base contient les 15 publications historiques et le signalement Massy. Nettoyage de la page de vérification en cours.

