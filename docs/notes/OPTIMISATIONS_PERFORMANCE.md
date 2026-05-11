# Optimisations de performance (notes)

Ce fichier résume des **pistes et principes** alignés sur le code **Vue 3 + Vite** et l’**API Nest + Prisma**. Les anciennes sections décrivant des scripts SQL et des tableaux de bord tiers ont été retirées : le schéma et les index relèvent de **Prisma** (`api/prisma/migrations/`).

## 1. Journalisation côté front

Le module **`src/services/logger.js`** centralise les logs :

- En dev, les logs verbeux peuvent suivre `import.meta.env.DEV` ou la clé localStorage **`gc.consoleDebugLogs`** (`true` / `false`) via `getConsoleDebugLogsEnabled()` / `setConsoleDebugLogsEnabled()`.
- Les erreurs restent visibles dans la console pour le débogage.

Préférer **`logger.log` / `logger.debug`** aux `console.log` dispersés dans les stores et services.

## 2. Requêtes N+1 côté API

Pour les listes (utilisateurs, équipes, congés), éviter une requête par ligne : utiliser les **`include`** / **`select`** Prisma ou des requêtes agrégées dans les services Nest (`api/src/`).

Toute fonction SQL personnalisée d’époque relève d’une **archive** sous `docs/archive/` si tu en retrouves une ; la voie normale est le code applicatif + Prisma.

## 3. Index et base de données

Les index utiles sont créés par les **migrations Prisma**. Après changement de schéma : `npx prisma migrate dev` (local) ou `migrate deploy` (CI / prod).

## 4. Pistes suivantes

- Lazy loading des gros écrans (Vue `defineAsyncComponent`) si le bundle grossit.
- Mise en cache courte côté client (stores Pinia) pour limiter les allers-retours réseau.
- Profiler le réseau (onglet Network) sur les pages calendrier et admin.

## Mode debug rapide (navigateur)

```javascript
localStorage.setItem('gc.consoleDebugLogs', 'true')
```

Puis recharger la page. Remettre à `'false'` pour réduire le bruit.
