# Installation (développement local) — 10 minutes

## Prérequis
- **Node.js 18+** (recommandé) + npm
- Un **projet Supabase** (gratuit suffit)

## 1) Supabase (base de données)
1. Crée un projet sur Supabase.
2. Va dans **SQL Editor**.
3. Exécute le script **Fresh install** :
   - `supabase/sql/00_fresh_install.sql`

### (Optionnel) Realtime
Pour avoir les mises à jour en temps réel (congés + notifications) :
- Dans Supabase : **Database → Replication** et active `leaves`, `leave_types`, `leave_quotas`, `notifications`
- Ou exécute : `supabase/ops/supabase-realtime-enable.sql`

## 2) Variables d’environnement (local)
1. Copie `.env.example` vers `.env`
2. Remplis :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## 3) Lancer l’app
Dans le dossier du projet :

```bash
npm install
npm run dev
```

Ou sur Windows :
- `start-dev.ps1` (PowerShell)
- `start-dev.bat` (cmd)

## 4) Déploiement GitHub Pages
Voir : `docs/guides/DEPLOY_GITHUB_PAGES.md`


