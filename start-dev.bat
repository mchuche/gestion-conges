@echo off
echo 🚀 Démarrage du serveur de développement Vue.js...
echo.

REM Vérifier que node_modules existe
if not exist "node_modules" (
    echo ⚠️  node_modules introuvable. Installation des dépendances...
    call npm install
)

REM Vérifier que .env existe
if not exist ".env" (
    echo ⚠️  Fichier .env introuvable. Génération depuis config.js...
    if exist "setup-env.ps1" (
        powershell -ExecutionPolicy Bypass -File setup-env.ps1
    ) else (
        echo ❌ Erreur: setup-env.ps1 introuvable
        pause
        exit /b 1
    )
)

echo ✅ Configuration OK
echo.
echo 🌐 Le serveur sera accessible sur: http://localhost:5173
echo 📝 Appuyez sur Ctrl+C pour arrêter le serveur
echo.

REM Démarrer le serveur
call npm run dev

pause

