# Instructions pour le serveur de développement (front)

## Important

**Ne pas** laisser l’IA lancer le serveur en tâche de fond sur ta machine si tu préfères le contrôle toi-même : le processus reste attaché au terminal.

## Démarrer le front

### Option 1 — Stack complète (BDD + API + front, 3 fenêtres)

Depuis la racine du dépôt :

- **`npm run dev:stack`**
- ou **`.\scripts\start-dev-stack.ps1`** / **`scripts\start-dev-stack.bat`**

Voir aussi **`docs/MEMO_DEMARRAGE.md`**.

### Option 2 — Front seul

- **Windows (PowerShell)** : `.\scripts\start-dev.ps1`
- **Windows (cmd)** : `scripts\start-dev.bat`

Ces scripts lancent uniquement `npm run dev`.

### Option 3 — Commande directe

À la racine du dépôt :

```bash
npm run dev
```

Si `npm` n’est pas reconnu, rouvre le terminal ou utilise les scripts ci-dessus.

## Fichier `.env`

Le front attend **`VITE_API_URL`** (URL de l’API Nest), voir `.env.example` à la racine. Sans API joignable, l’auth et les données ne fonctionneront pas.

## Quand c’est prêt

Tu dois voir dans le terminal une ligne du type **Local: http://localhost:5173/** avec le base path du projet.

Ouvre le navigateur sur **`http://localhost:5173/`** (base Vite **`/`**).

## Arrêter le serveur

**Ctrl+C** dans le terminal où Vite tourne.

## Hot reload

Les modifications dans `src/` rechargent la page automatiquement ; pas besoin de redémarrer Vite sauf changement de config (`vite.config.js`, variables d’environnement).

## Si le serveur ne démarre pas

1. Port **5173** déjà utilisé → ferme l’autre processus ou change le port dans `vite.config.js`.
2. **`.env` absent ou incomplet** → copie `.env.example` → `.env` et renseigne **`VITE_API_URL`**.
3. Lis les erreurs dans le terminal (dépendances : `npm install` à la racine).
