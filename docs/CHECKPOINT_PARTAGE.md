# État du déploiement — 7 octobre 2026

Organisation : joseluis (`rooyarjqmsvfruxdbkrh`), plan gratuit.
Coût confirmé : 0 par mois.
Projet dédié créé : `fluoxetine-france`, région Paris (`eu-west-3`).
Référence : `fwuieqdxzfrlghgrlenm`.
URL publique API : https://fwuieqdxzfrlghgrlenm.supabase.co

Ne pas recréer le projet. Le site public reste sur main ; la branche partage-direct prépare les contributions directes.

Phase B achevée : schéma et RLS appliqués ; 19 917 identifiants et 15 publications historiques importés. API publique testée avec la clé publiable : lecture 200 ; écriture anonyme, modification du répertoire et lecture user_id refusées 401. Champs auteur et date protégés ; UPDATE et DELETE non accordés aux participants. Déclencheur de contrôle actif. Conseiller sécurité : aucun avertissement. Politiques de lecture des candidatures regroupées par rôle.

Premier point restant : phase C, application OAuth GitHub et activation du fournisseur (actuellement désactivé). Puis D : contribution réelle partagée entre sessions ; E : publication et vérification publique ; F : supports de diffusion. Aucun signalement de test n'a été enregistré.

Phase C commencée : l'API Auth confirme que GitHub est désactivé. Les connecteurs disponibles ne gèrent pas les applications OAuth GitHub ni les paramètres des fournisseurs Supabase. Intervention du propriétaire nécessaire pour créer l'application OAuth et saisir son secret dans Supabase uniquement.

Application OAuth : nom « Fluoxétine — entraide en pharmacies » ; accueil https://ortiz-luis.github.io/fluoxetine-france/ ; rappel https://fwuieqdxzfrlghgrlenm.supabase.co/auth/v1/callback . Configurer la Site URL et la redirection autorisée sur l'URL exacte GitHub Pages. Ne pas partager le secret dans le chat ou dans GitHub.
