# 🚀 Instructions pour le Serveur de Développement

## ⚠️ Important

**Ne lancez PAS le serveur via l'IA** - cela bloque longtemps et peut causer des problèmes.

## 📝 Pour démarrer le serveur vous-même

### Commande directe (recommandé)
```powershell
npm run dev
```

### Alternative : Script PowerShell (si politique d'exécution activée)
Si vous avez activé l'exécution de scripts PowerShell :
```powershell
.\start-dev.ps1
```

**Note** : Si vous avez une erreur de politique d'exécution, utilisez directement `npm run dev` ci-dessus.

## ✅ Le serveur est prêt quand vous voyez :

```
VITE v5.4.21  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## 🌐 Accéder à l'application

Ouvrez votre navigateur sur : **http://localhost:5173**

## ⏹️ Pour arrêter le serveur

Appuyez sur **Ctrl+C** dans le terminal où le serveur tourne.

## 🔄 Après chaque modification de code

Le serveur se recharge automatiquement (Hot Module Replacement).
Vous n'avez pas besoin de redémarrer le serveur.

## ⚠️ Si le serveur ne démarre pas

1. Vérifiez que le port 5173 n'est pas déjà utilisé
2. Vérifiez que le fichier `.env` existe et contient vos clés Supabase
3. Vérifiez les erreurs dans le terminal

