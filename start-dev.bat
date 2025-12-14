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
    echo ⚠️  Fichier .env introuvable.
    echo.
    echo Créez un fichier .env avec le contenu suivant:
    echo VITE_SUPABASE_URL=votre_url_supabase
    echo VITE_SUPABASE_ANON_KEY=votre_cle_anon
    echo.
    echo Vous pouvez copier .env.example vers .env et le modifier.
    pause
    exit /b 1
)

echo ✅ Configuration OK
echo.
echo 🌐 Le serveur sera accessible sur: http://localhost:5173
echo 📝 Appuyez sur Ctrl+C pour arrêter le serveur
echo.

REM Démarrer le serveur
call npm run dev

pause




