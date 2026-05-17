# Confirmation d’e-mail et redirections

## Stack actuelle

L’authentification passe par l’**API Nest** (inscription / login, JWT). Il n’y a **pas** de tableau de bord tiers à configurer pour des liens de confirmation dans ce dépôt.

- En **développement** : utilise l’URL locale du front, ex. `http://localhost:5173/`.
- En **production** : assure-toi que **`VITE_API_URL`** pointe vers ton API HTTPS ; configure CORS côté Nest pour l’origine exacte de ton site (Docker, domaine perso, etc.).

## Si tu ajoutes plus tard une confirmation par e-mail

Ce sera une **fonctionnalité backend** (envoi de mail, token stocké en base, route de validation). À documenter alors dans `api/README.md` ou un guide dédié, avec les URLs autorisées gérées dans **ton** service mail / **ta** config Nest — pas dans un hébergeur BaaS externe au projet.
