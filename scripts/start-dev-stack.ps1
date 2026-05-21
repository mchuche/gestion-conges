# Démarre l'environnement de dev complet dans 3 fenêtres PowerShell séparées :
#   1. PostgreSQL (Docker + logs)
#   2. API NestJS (npm run api:dev)
#   3. Frontend Vite (npm run dev)
#
# Usage :
#   npm run dev:stack
#   .\scripts\start-dev-stack.ps1
#
# Après un reboot PC : le script attend que Docker Desktop soit pret,
# demarre Postgres, puis ouvre API et Front (evite l'echec "pipe introuvable").

param(
    # Delai supplementaire avant d'ouvrir l'API (apres Postgres pret)
    [int]$ApiStartDelaySeconds = 3,
    # Attente max du daemon Docker (ex. Docker Desktop qui demarre)
    [int]$DockerWaitTimeoutSeconds = 120,
    # Attente max que Postgres accepte les connexions
    [int]$PostgresWaitTimeoutSeconds = 45
)

$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root

Write-Host ''
Write-Host '=== gestion-conges — demarrage stack dev ===' -ForegroundColor Cyan
Write-Host "Racine : $Root"
Write-Host ''

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host 'Docker introuvable dans le PATH. Installez Docker Desktop.' -ForegroundColor Red
    exit 1
}

if (-not (Test-Path '.env')) {
    Write-Host 'Fichier .env manquant. Copiez .env.example vers .env' -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path 'api\.env')) {
    Write-Host 'Fichier api\.env manquant. Copiez api\.env.example vers api\.env' -ForegroundColor Yellow
    exit 1
}

$dbUrl = Get-Content 'api\.env' -Raw -ErrorAction SilentlyContinue
if ($dbUrl -match '@localhost:5433') {
    Write-Host 'Astuce : dans api\.env, utilisez 127.0.0.1:5433 plutot que localhost (Windows / Prisma).' -ForegroundColor Yellow
}

# Attend que le daemon Docker reponde (souvent lent juste apres un reboot)
function Wait-DockerReady {
    param([int]$TimeoutSeconds = 120)

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $attempt = 0

    Write-Host "Attente de Docker Desktop (max ${TimeoutSeconds}s)..." -ForegroundColor DarkGray

    while ((Get-Date) -lt $deadline) {
        $attempt++
        docker info 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host 'Docker pret.' -ForegroundColor Green
            return $true
        }

        if ($attempt -eq 1) {
            Write-Host '  Lancez Docker Desktop si ce n est pas deja fait.' -ForegroundColor Yellow
        }

        Write-Host "  ... toujours en attente ($attempt)" -ForegroundColor DarkGray
        Start-Sleep -Seconds 3
    }

    Write-Host 'Docker ne repond pas. Ouvrez Docker Desktop, attendez qu il soit vert, puis relancez npm run dev:stack' -ForegroundColor Red
    return $false
}

# Demarre le conteneur Postgres et attend pg_isready
function Start-PostgresAndWait {
    param([int]$TimeoutSeconds = 45)

    Write-Host 'Demarrage PostgreSQL (docker compose up -d)...' -ForegroundColor Cyan
    docker compose up -d 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Echec docker compose up -d' -ForegroundColor Red
        return $false
    }

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    Write-Host "Attente PostgreSQL (max ${TimeoutSeconds}s)..." -ForegroundColor DarkGray

    while ((Get-Date) -lt $deadline) {
        docker exec gestion-conges-db pg_isready -U gestion -d gestion_conges 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host 'PostgreSQL pret (port 5433).' -ForegroundColor Green
            docker compose ps
            return $true
        }
        Start-Sleep -Seconds 2
    }

    Write-Host 'PostgreSQL ne repond pas a temps. Verifiez : docker compose ps' -ForegroundColor Red
    return $false
}

function Start-DevWindow {
    param(
        [string]$WindowTitle,
        [string[]]$Lines
    )

    $rootEscaped = $Root -replace "'", "''"
    $titleEscaped = $WindowTitle -replace "'", "''"
    $body = ($Lines -join '; ')
    $command = "Set-Location -LiteralPath '$rootEscaped'; `$Host.UI.RawUI.WindowTitle = '$titleEscaped'; $body"

    Start-Process powershell.exe -ArgumentList @(
        '-NoExit',
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-Command',
        $command
    ) | Out-Null
}

# --- Etape 0 : Docker + Postgres AVANT d'ouvrir les fenetres API/Front ---
if (-not (Wait-DockerReady -TimeoutSeconds $DockerWaitTimeoutSeconds)) {
    exit 1
}

if (-not (Start-PostgresAndWait -TimeoutSeconds $PostgresWaitTimeoutSeconds)) {
    exit 1
}

Write-Host ''
Write-Host 'Ouverture des 3 fenetres...' -ForegroundColor Cyan
Write-Host ''

# --- Fenetre 1 : suivi des logs Postgres (deja demarre ci-dessus) ---
Write-Host '[1/3] Terminal PostgreSQL (logs)...' -ForegroundColor Green

Start-DevWindow -WindowTitle 'gestion-conges - PostgreSQL' -Lines @(
    'Write-Host "[PostgreSQL] Conteneur deja demarre" -ForegroundColor Cyan'
    'docker compose ps'
    'Write-Host "Logs (Ctrl+C = arreter le suivi, le conteneur continue)" -ForegroundColor DarkGray'
    'docker compose logs -f postgres'
)

if ($ApiStartDelaySeconds -gt 0) {
    Write-Host "Pause ${ApiStartDelaySeconds}s avant l API..." -ForegroundColor DarkGray
    Start-Sleep -Seconds $ApiStartDelaySeconds
}

# --- Fenetre 2 : API (Postgres est deja pret) ---
Write-Host '[2/3] Terminal API...' -ForegroundColor Green

Start-DevWindow -WindowTitle 'gestion-conges - API' -Lines @(
    'Write-Host "[API] NestJS" -ForegroundColor Cyan'
    'Write-Host "http://localhost:3000/health" -ForegroundColor DarkGray'
    'npm run api:dev'
)

Start-Sleep -Seconds 1

# --- Fenetre 3 : Front ---
Write-Host '[3/3] Terminal Frontend...' -ForegroundColor Green

Start-DevWindow -WindowTitle 'gestion-conges - Front' -Lines @(
    'Write-Host "[Front] Vite" -ForegroundColor Cyan'
    'Write-Host "http://localhost:5173/" -ForegroundColor DarkGray'
    'npm run dev'
)

Write-Host ''
Write-Host '3 fenetres ouvertes. Postgres etait deja pret avant API/Front.' -ForegroundColor Green
Write-Host '  PostgreSQL : port 5433'
Write-Host '  API        : http://localhost:3000/health'
Write-Host '  Front      : http://localhost:5173/'
Write-Host ''
