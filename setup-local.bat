@echo off
REM Script pour configurer l'environnement de développement local (Windows)

echo 🔧 Configuration de l'environnement de développement local...

if not exist config.js (
  echo 📝 Création de config.js depuis config.js.example...
  copy config.js.example config.js
  echo.
  echo ⚠️  IMPORTANT : N'oubliez pas de remplir vos clés Supabase dans config.js
  echo    1. Ouvrez config.js
  echo    2. Remplacez 'VOTRE_PROJECT_URL_ICI' par votre URL Supabase
  echo    3. Remplacez 'VOTRE_ANON_KEY_ICI' par votre clé anonyme Supabase
  echo.
) else (
  echo ✅ config.js existe déjà
)

echo.
echo ✅ Configuration terminée !
echo    Vous pouvez maintenant ouvrir index.html dans votre navigateur
pause





