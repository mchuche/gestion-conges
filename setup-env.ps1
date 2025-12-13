# Script PowerShell pour créer le fichier .env à partir de config.js
# Usage: .\setup-env.ps1

Write-Host "Configuration du fichier .env pour Vue.js" -ForegroundColor Cyan

# Vérifier si config.js existe
if (-not (Test-Path "config.js")) {
    Write-Host "Erreur: config.js introuvable" -ForegroundColor Red
    Write-Host "   Creez d'abord config.js a partir de config.js.example" -ForegroundColor Yellow
    exit 1
}

# Lire config.js
$configContent = Get-Content "config.js" -Raw

# Extraire l'URL Supabase avec une regex plus simple
if ($configContent -match "url:\s*['`"]([^'`"]+)['`"]") {
    $supabaseUrl = $matches[1]
} else {
    Write-Host "Erreur: Impossible de trouver l'URL Supabase dans config.js" -ForegroundColor Red
    exit 1
}

# Extraire la clé anon
if ($configContent -match "anonKey:\s*['`"]([^'`"]+)['`"]") {
    $supabaseKey = $matches[1]
} else {
    Write-Host "Erreur: Impossible de trouver la cle anon dans config.js" -ForegroundColor Red
    exit 1
}

# Créer le contenu du fichier .env
$envContent = @"
# Configuration Supabase pour Vue.js
# Ce fichier est dans .gitignore et ne sera pas commité
# Généré automatiquement depuis config.js

VITE_SUPABASE_URL=$supabaseUrl
VITE_SUPABASE_ANON_KEY=$supabaseKey
"@

# Écrire le fichier .env
$envContent | Out-File -FilePath ".env" -Encoding utf8

Write-Host "Fichier .env cree avec succes !" -ForegroundColor Green
Write-Host "   URL: $supabaseUrl" -ForegroundColor Gray
Write-Host "   Cle: $($supabaseKey.Substring(0, [Math]::Min(20, $supabaseKey.Length)))..." -ForegroundColor Gray

