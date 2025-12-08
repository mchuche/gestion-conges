#!/bin/bash
# Script pour configurer l'environnement de développement local

echo "🔧 Configuration de l'environnement de développement local..."

if [ ! -f config.js ]; then
  echo "📝 Création de config.js depuis config.js.example..."
  cp config.js.example config.js
  echo ""
  echo "⚠️  IMPORTANT : N'oubliez pas de remplir vos clés Supabase dans config.js"
  echo "   1. Ouvrez config.js"
  echo "   2. Remplacez 'VOTRE_PROJECT_URL_ICI' par votre URL Supabase"
  echo "   3. Remplacez 'VOTRE_ANON_KEY_ICI' par votre clé anonyme Supabase"
  echo ""
else
  echo "✅ config.js existe déjà"
fi

echo ""
echo "✅ Configuration terminée !"
echo "   Vous pouvez maintenant ouvrir index.html dans votre navigateur"

