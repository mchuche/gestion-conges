# [ARCHIVE] Migration Vue.js — guide de démarrage

> Document d’époque : la migration Vue est **terminée** ; la stack données actuelle est l’**API Nest** (`VITE_API_URL`), pas les clients décrits ici.

## ✅ Phase 1 Terminée

L'infrastructure Vue.js est en place !

## 🧪 Tester l'infrastructure

### 1. Vérifier que le fichier .env existe

Le script `setup-env.ps1` a déjà créé le fichier `.env` à partir de votre `config.js`.

Si besoin, vous pouvez le régénérer :
```powershell
.\setup-env.ps1
```

### 2. Démarrer le serveur de développement

```bash
npm run dev
```

Le serveur devrait démarrer sur `http://localhost:5173`

### 3. Vérifier

- ✅ Le serveur démarre sans erreur
- ✅ La page s'affiche (même si basique pour l'instant)
- ✅ Aucune erreur critique dans la console

## 📋 État Actuel

- ✅ Infrastructure Vue.js 3 configurée
- ✅ Vite configuré avec plugin PWA
- ✅ Store Pinia pour l'authentification (code seulement)
- ✅ Service de données (à l’époque un client BaaS ; aujourd’hui `src/services/api.js` + Nest)
- ✅ Styles CSS migrés
- ✅ Assets (icons, manifest) migrés

## ⚠️ Ce qui ne fonctionne pas encore

- ❌ Interface utilisateur (en cours de migration)
- ❌ Composants Vue (à créer)
- ❌ Logique métier complète (en cours de migration)

## 📝 Prochaines Étapes

Une fois que vous avez testé que le serveur démarre correctement, nous continuerons avec :
- **Phase 2** : Services et Utilitaires (dateUtils, holidays, swalHelper)
- **Phase 3** : Stores Pinia complets
- **Phase 4** : Composants Vue

## 🐛 En cas d'erreur

Si le serveur ne démarre pas, vérifie le fichier **`.env`** à la racine (**`VITE_API_URL`**) et que l’API tourne si tu testes les données.

L’application devrait au minimum afficher l’interface ; les erreurs réseau vers l’API apparaissent dans la console du navigateur.

