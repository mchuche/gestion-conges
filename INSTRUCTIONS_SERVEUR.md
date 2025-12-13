# 🚀 Instructions pour le Serveur de Développement

## ⚠️ Important

**Ne lancez PAS le serveur via l'IA** - cela bloque longtemps et peut causer des problèmes.

## 📝 Pour démarrer le serveur vous-même

### Option 1 : Script batch (recommandé - fonctionne toujours)
Double-cliquez sur `start-dev.bat` ou dans le terminal :
```cmd
start-dev.bat
```

### Option 2 : Commande directe
Si npm est reconnu dans votre terminal :
```powershell
npm run dev
```

**Note** : Si npm n'est pas reconnu, fermez et rouvrez votre terminal, ou utilisez l'Option 1 (start-dev.bat).

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

