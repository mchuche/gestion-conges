# Script pour démarrer le serveur de développement Vue.js
# Usage: .\start-dev.ps1

Write-Host "🚀 Démarrage du serveur de développement Vue.js..." -ForegroundColor Cyan
Write-Host ""

# Vérifier que node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules introuvable. Installation des dépendances..." -ForegroundColor Yellow
    npm install
}

# Vérifier que .env existe
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Fichier .env introuvable. Génération depuis config.js..." -ForegroundColor Yellow
    if (Test-Path "setup-env.ps1") {
        .\setup-env.ps1
    } else {
        Write-Host "❌ Erreur: setup-env.ps1 introuvable" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Configuration OK" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Le serveur sera accessible sur: http://localhost:5173" -ForegroundColor Green
Write-Host "📝 Appuyez sur Ctrl+C pour arrêter le serveur" -ForegroundColor Yellow
Write-Host ""

# Démarrer le serveur
npm run dev

