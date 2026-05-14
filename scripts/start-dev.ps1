# Script pour démarrer le serveur de développement Vue.js
# Usage (depuis la racine du dépôt) : .\scripts\start-dev.ps1
# Le répertoire de travail est forcé sur la racine du projet (parent de scripts/).

Set-Location (Join-Path $PSScriptRoot '..')

Write-Host "🚀 Démarrage du serveur de développement Vue.js..." -ForegroundColor Cyan
Write-Host ""

# Vérifier que node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules introuvable. Installation des dépendances..." -ForegroundColor Yellow
    npm install
}

# Vérifier que .env existe
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Fichier .env introuvable." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Créez un fichier .env avec le contenu suivant:" -ForegroundColor Yellow
    Write-Host "VITE_API_URL=http://localhost:3000"
    Write-Host ""
    Write-Host "Vous pouvez copier .env.example vers .env et le modifier." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Configuration OK" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Le serveur sera accessible sur: http://localhost:5173/" -ForegroundColor Green
Write-Host "📝 Appuyez sur Ctrl+C pour arrêter le serveur" -ForegroundColor Yellow
Write-Host ""

# Démarrer le serveur
npm run dev

